"""
Data fetching and processing pipeline for forest data.
Ported from js/data.js, js/utils.js, js/statistics.js — keep in sync with browser version.
"""

import json
import logging
import re
import ssl
import urllib.request
import urllib.parse
from datetime import datetime

import certifi

from codes import (
    WFS_FOREST_URL, WFS_CADASTRAL_URL,
    TREE_SPECIES, CUTTING_TYPE, SILVICULTURE_TYPE,
    FERTILITY_CLASS, DEVELOPMENT_CLASS,
)

logger = logging.getLogger(__name__)


# --- Parcel ID normalization (from js/utils.js:151-168) ---

def normalize_parcel_id(input_str: str) -> str | None:
    """Convert user input to 14-digit nationalCadastralReference format."""
    clean = re.sub(r"[^0-9]", "", input_str)

    if len(clean) == 14:
        return clean

    parts = re.split(r"[-\s]+", input_str.strip())
    if len(parts) == 4:
        nums = [re.sub(r"[^0-9]", "", p) for p in parts]
        return (
            nums[0].zfill(3)
            + nums[1].zfill(3)
            + nums[2].zfill(4)
            + nums[3].zfill(4)
        )

    return None


def format_cadastral_reference(ref: str) -> str:
    """Format 14-digit reference to readable form (e.g. 091-416-0001-0123)."""
    if not ref or "-" in ref:
        return ref
    if len(ref) == 14:
        return f"{int(ref[0:3])}-{int(ref[3:6])}-{int(ref[6:10])}-{int(ref[10:14])}"
    return ref


# --- Geometry functions (from js/utils.js) ---

def get_geometry_bounds(geometry: dict) -> dict:
    """Get bounding box from GeoJSON geometry in EPSG:3067 coordinates."""
    min_x = min_y = float("inf")
    max_x = max_y = float("-inf")

    def process_coords(coords):
        nonlocal min_x, min_y, max_x, max_y
        if isinstance(coords[0], (int, float)):
            min_x = min(min_x, coords[0])
            min_y = min(min_y, coords[1])
            max_x = max(max_x, coords[0])
            max_y = max(max_y, coords[1])
        else:
            for c in coords:
                process_coords(c)

    process_coords(geometry["coordinates"])
    return {"minX": min_x, "minY": min_y, "maxX": max_x, "maxY": max_y}


def point_in_polygon(point: list, geometry: dict) -> bool:
    """Check if a point is inside a polygon (EPSG:3067 coordinates). Ray-casting algorithm."""
    if not geometry or "coordinates" not in geometry:
        return False

    px, py = point
    geom_type = geometry.get("type", "")

    if geom_type == "Polygon":
        rings = [geometry["coordinates"][0]]
    elif geom_type == "MultiPolygon":
        rings = [poly[0] for poly in geometry["coordinates"]]
    else:
        return False

    for ring in rings:
        inside = False
        j = len(ring) - 1
        for i in range(len(ring)):
            xi, yi = ring[i]
            xj, yj = ring[j]
            if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / (yj - yi) + xi):
                inside = not inside
            j = i
        if inside:
            return True
    return False


def feature_belongs_to_parcel(feature_geom: dict, parcel_geom: dict) -> bool:
    """Check if a forest stand belongs to a parcel (centroid must be inside)."""
    geom_type = feature_geom.get("type", "")

    if geom_type == "Polygon":
        ring = feature_geom["coordinates"][0]
    elif geom_type == "MultiPolygon":
        ring = feature_geom["coordinates"][0][0]
    else:
        return False

    if not ring:
        return False

    sum_x = sum(c[0] for c in ring)
    sum_y = sum(c[1] for c in ring)
    centroid = [sum_x / len(ring), sum_y / len(ring)]

    return point_in_polygon(centroid, parcel_geom)


def filter_features_by_parcels(features: list, parcels: list) -> list:
    """Filter forest features — only include stands whose centroid is inside any parcel."""
    if not parcels:
        return features

    result = []
    for feature in features:
        geom = feature.get("geometry")
        if not geom:
            continue
        for parcel in parcels:
            parcel_geom = parcel.get("geometry")
            if parcel_geom and feature_belongs_to_parcel(geom, parcel_geom):
                result.append(feature)
                break
    return result


# --- WFS data fetching (from js/data.js) ---

_ssl_context = ssl.create_default_context(cafile=certifi.where())


def _wfs_get(url: str, params: dict) -> dict:
    """Make a WFS GET request and return parsed JSON."""
    query = urllib.parse.urlencode(params)
    full_url = f"{url}?{query}"
    logger.debug("WFS request: %s", full_url)

    req = urllib.request.Request(full_url)
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=30, context=_ssl_context) as resp:
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status}")
        return json.loads(resp.read())


def fetch_parcels_by_reference(reference: str) -> list:
    """Fetch all parcel parts by cadastral reference."""
    data = _wfs_get(WFS_CADASTRAL_URL, {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": "cp:CadastralParcel",
        "outputFormat": "application/json",
        "srsName": "EPSG:3067",
        "CQL_FILTER": f"nationalCadastralReference='{reference}'",
    })
    return data.get("features", [])


def fetch_forest_data_by_bounds(bounds: dict) -> list:
    """Fetch forest data by bounding box (EPSG:3067)."""
    buffer = 10
    bbox = (
        f"{bounds['minX'] - buffer},{bounds['minY'] - buffer},"
        f"{bounds['maxX'] + buffer},{bounds['maxY'] + buffer},EPSG:3067"
    )
    data = _wfs_get(WFS_FOREST_URL, {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeName": "v1:stand",
        "outputFormat": "application/json",
        "srsName": "EPSG:3067",
        "bbox": bbox,
    })
    return data.get("features", [])


# --- Statistics (from js/statistics.js) ---

def calculate_statistics(features: list) -> dict:
    """Calculate aggregated statistics from forest stand features."""
    stats = {
        "count": len(features),
        "totalArea": 0.0,
        "totalVolume": 0.0,
        "avgVolume": 0.0,
        "avgAge": 0.0,
        "avgHeight": 0.0,
        "avgDiameter": 0.0,
        "avgGrowth": 0.0,
        "avgSawlog": 0.0,
        "avgPulpwood": 0.0,
        "totalSawlog": 0.0,
        "totalPulpwood": 0.0,
        "avgBasalArea": 0.0,
        "avgStemCount": 0.0,
        "minAge": None, "maxAge": None,
        "minVolume": None, "maxVolume": None,
        "minGrowth": None, "maxGrowth": None,
        "speciesPercent": {"pine": 0, "spruce": 0, "birch": 0},
        "cuttingRecommendations": [],
        "silvicultureRecommendations": [],
        "fertilityDistribution": [],
        "developmentDistribution": [],
        "measurementYearMin": None,
        "measurementYearMax": None,
    }

    if not features:
        return stats

    valid_age = valid_height = valid_diameter = valid_growth = 0
    valid_sawlog = valid_pulpwood = valid_basal = valid_stem = 0
    total_pine = total_spruce = total_birch = total_species = 0.0

    cutting_counts = {}
    silviculture_counts = {}
    fertility_counts = {}
    development_counts = {}

    for f in features:
        p = f.get("properties", {})
        area = p.get("AREA") or 0

        stats["totalArea"] += area
        stats["totalVolume"] += (p.get("VOLUME") or 0) * area
        stats["avgVolume"] += p.get("VOLUME") or 0
        stats["totalSawlog"] += (p.get("SAWLOGVOLUME") or 0) * area
        stats["totalPulpwood"] += (p.get("PULPWOODVOLUME") or 0) * area

        # Measurement years
        mdate = p.get("MEASUREMENTDATE")
        if mdate:
            try:
                year = datetime.fromisoformat(mdate.replace("Z", "+00:00")).year
                if stats["measurementYearMin"] is None or year < stats["measurementYearMin"]:
                    stats["measurementYearMin"] = year
                if stats["measurementYearMax"] is None or year > stats["measurementYearMax"]:
                    stats["measurementYearMax"] = year
            except (ValueError, AttributeError):
                pass

        # Min/max volume
        vol = p.get("VOLUME")
        if vol is not None:
            if stats["minVolume"] is None or vol < stats["minVolume"]:
                stats["minVolume"] = vol
            if stats["maxVolume"] is None or vol > stats["maxVolume"]:
                stats["maxVolume"] = vol

        # Age
        age = p.get("MEANAGE")
        if age:
            stats["avgAge"] += age
            valid_age += 1
            if stats["minAge"] is None or age < stats["minAge"]:
                stats["minAge"] = age
            if stats["maxAge"] is None or age > stats["maxAge"]:
                stats["maxAge"] = age

        # Height
        height = p.get("MEANHEIGHT")
        if height:
            stats["avgHeight"] += height
            valid_height += 1

        # Diameter
        diam = p.get("MEANDIAMETER")
        if diam:
            stats["avgDiameter"] += diam
            valid_diameter += 1

        # Growth
        growth = p.get("VOLUMEGROWTH")
        if growth:
            stats["avgGrowth"] += growth
            valid_growth += 1
            if stats["minGrowth"] is None or growth < stats["minGrowth"]:
                stats["minGrowth"] = growth
            if stats["maxGrowth"] is None or growth > stats["maxGrowth"]:
                stats["maxGrowth"] = growth

        if p.get("SAWLOGVOLUME"):
            stats["avgSawlog"] += p["SAWLOGVOLUME"]
            valid_sawlog += 1
        if p.get("PULPWOODVOLUME"):
            stats["avgPulpwood"] += p["PULPWOODVOLUME"]
            valid_pulpwood += 1
        if p.get("BASALAREA"):
            stats["avgBasalArea"] += p["BASALAREA"]
            valid_basal += 1
        if p.get("STEMCOUNT"):
            stats["avgStemCount"] += p["STEMCOUNT"]
            valid_stem += 1

        # Species proportions (decimals 0.0-1.0 → percentages)
        pine = (p.get("PROPORTIONPINE") or 0) * 100
        spruce = (p.get("PROPORTIONSPRUCE") or 0) * 100
        deciduous = (p.get("PROPORTIONOTHER") or 0) * 100

        if (pine + spruce + deciduous) == 0 and p.get("MAINTREESPECIES"):
            species = int(p["MAINTREESPECIES"])
            if species == 1:
                pine = 100
            elif species == 2:
                spruce = 100
            else:
                deciduous = 100

        total_pine += pine * area
        total_spruce += spruce * area
        total_birch += deciduous * area
        total_species += area

        # Cutting recommendations
        cutting = p.get("CUTTINGTYPE")
        if cutting is not None:
            key = str(cutting)
            name = CUTTING_TYPE.get(int(cutting), f"Tyyppi {cutting}") if str(cutting).isdigit() else f"Tyyppi {cutting}"
            year = p.get("CUTTINGPROPOSALYEAR")
            if key not in cutting_counts:
                cutting_counts[key] = {"code": cutting, "name": name, "count": 0, "years": []}
            cutting_counts[key]["count"] += 1
            if year:
                cutting_counts[key]["years"].append(year)

        # Silviculture recommendations
        silv = p.get("SILVICULTURETYPE")
        if silv is not None:
            key = str(silv)
            name = SILVICULTURE_TYPE.get(int(silv), f"Tyyppi {silv}") if str(silv).isdigit() else f"Tyyppi {silv}"
            year = p.get("SILVICULTUREPROPOSALYEAR")
            if key not in silviculture_counts:
                silviculture_counts[key] = {"code": silv, "name": name, "count": 0, "years": []}
            silviculture_counts[key]["count"] += 1
            if year:
                silviculture_counts[key]["years"].append(year)

        # Fertility distribution
        fert = p.get("FERTILITYCLASS")
        if fert is not None:
            fert_key = int(fert) if str(fert).isdigit() else fert
            name = FERTILITY_CLASS.get(fert_key, f"Tyyppi {fert}")
            if fert_key not in fertility_counts:
                fertility_counts[fert_key] = {"name": name, "area": 0.0}
            fertility_counts[fert_key]["area"] += area

        # Development class distribution
        dev = p.get("DEVELOPMENTCLASS")
        if dev is not None:
            dev_key = str(dev)
            name = DEVELOPMENT_CLASS.get(dev_key, dev_key)
            if dev_key not in development_counts:
                development_counts[dev_key] = {"name": name, "count": 0}
            development_counts[dev_key]["count"] += 1

    n = len(features)
    stats["avgVolume"] = stats["avgVolume"] / n
    stats["avgAge"] = stats["avgAge"] / valid_age if valid_age else 0
    stats["avgHeight"] = stats["avgHeight"] / valid_height if valid_height else 0
    stats["avgDiameter"] = stats["avgDiameter"] / valid_diameter if valid_diameter else 0
    stats["avgGrowth"] = stats["avgGrowth"] / valid_growth if valid_growth else 0
    stats["avgSawlog"] = stats["avgSawlog"] / valid_sawlog if valid_sawlog else 0
    stats["avgPulpwood"] = stats["avgPulpwood"] / valid_pulpwood if valid_pulpwood else 0
    stats["avgBasalArea"] = stats["avgBasalArea"] / valid_basal if valid_basal else 0
    stats["avgStemCount"] = stats["avgStemCount"] / valid_stem if valid_stem else 0

    if total_species > 0:
        stats["speciesPercent"]["pine"] = round(total_pine / total_species)
        stats["speciesPercent"]["spruce"] = round(total_spruce / total_species)
        stats["speciesPercent"]["birch"] = round(total_birch / total_species)

        total = stats["speciesPercent"]["pine"] + stats["speciesPercent"]["spruce"] + stats["speciesPercent"]["birch"]
        if total != 100 and total > 0:
            stats["speciesPercent"]["birch"] += 100 - total

    stats["cuttingRecommendations"] = sorted(
        [
            {"code": v["code"], "name": v["name"], "count": v["count"],
             "year": min(v["years"]) if v["years"] else None}
            for v in cutting_counts.values()
        ],
        key=lambda x: x["count"], reverse=True,
    )

    stats["silvicultureRecommendations"] = sorted(
        [
            {"code": v["code"], "name": v["name"], "count": v["count"],
             "year": min(v["years"]) if v["years"] else None}
            for v in silviculture_counts.values()
        ],
        key=lambda x: x["count"], reverse=True,
    )

    stats["fertilityDistribution"] = sorted(
        [{"name": v["name"], "area": v["area"]} for v in fertility_counts.values()],
        key=lambda x: x["area"], reverse=True,
    )

    stats["developmentDistribution"] = sorted(
        [{"name": v["name"], "count": v["count"]} for v in development_counts.values()],
        key=lambda x: x["count"], reverse=True,
    )

    return stats


# --- Orchestrator ---

def get_forest_data(kiinteistotunnus: str) -> dict:
    """
    Main pipeline: normalize ID → fetch parcels → fetch forest data → filter → calculate statistics.
    Returns a dict with keys: reference, parcels, features, statistics, error.
    """
    reference = normalize_parcel_id(kiinteistotunnus)
    if not reference:
        return {"error": "invalid_id"}

    parcels = fetch_parcels_by_reference(reference)
    if not parcels:
        return {"error": "not_found", "reference": reference}

    # Combine bounds from all parcel parts
    all_bounds = []
    for parcel in parcels:
        geom = parcel.get("geometry")
        if geom:
            all_bounds.append(get_geometry_bounds(geom))

    if not all_bounds:
        return {"error": "not_found", "reference": reference}

    combined_bounds = {
        "minX": min(b["minX"] for b in all_bounds),
        "minY": min(b["minY"] for b in all_bounds),
        "maxX": max(b["maxX"] for b in all_bounds),
        "maxY": max(b["maxY"] for b in all_bounds),
    }

    all_features = fetch_forest_data_by_bounds(combined_bounds)
    filtered = filter_features_by_parcels(all_features, parcels)

    if not filtered:
        return {
            "error": "no_forest_data",
            "reference": reference,
            "parcelCount": len(parcels),
        }

    statistics = calculate_statistics(filtered)

    return {
        "error": None,
        "reference": reference,
        "parcelCount": len(parcels),
        "features": filtered,
        "statistics": statistics,
    }
