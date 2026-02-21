"""
Metsäinfo MCP Server — forest data lookup by cadastral reference.
"""

import json
import logging
import sys

from fastmcp import FastMCP
from pipeline import get_forest_data, format_cadastral_reference
from codes import TREE_SPECIES, DEVELOPMENT_CLASS, FERTILITY_CLASS

# FastMCP uses stdio transport — logging must go to stderr
logging.basicConfig(stream=sys.stderr, level=logging.WARNING)

mcp = FastMCP("Metsäinfo")


def _fmt(value, decimals=0):
    """Format number with Finnish locale (comma as decimal separator)."""
    if value is None or value != value:  # NaN check
        return "-"
    if decimals == 0:
        return f"{value:,.0f}".replace(",", " ").replace(".", ",")
    return f"{value:,.{decimals}f}".replace(",", " ").replace(".", ",")


def format_result(result: dict) -> str:
    """Format pipeline result as human-readable Finnish text."""
    error = result.get("error")
    ref = result.get("reference", "")
    display_ref = format_cadastral_reference(ref) if ref else ""

    if error == "invalid_id":
        return "Virheellinen kiinteistötunnus. Käytä muotoa 91-416-1-123 tai 09141600010123."

    if error == "not_found":
        return f"Kiinteistöä ei löytynyt tunnuksella {display_ref}."

    if error == "no_forest_data":
        return f"Kiinteistöllä {display_ref} ei ole metsävaratietoja."

    stats = result["statistics"]
    parcels = result.get("parcelCount", 1)
    features = result.get("features", [])

    lines = []

    # Header
    palstat = f" ({parcels} palstaa)" if parcels > 1 else ""
    lines.append(f"KIINTEISTÖ: {display_ref}{palstat}")
    lines.append("")

    # Summary
    lines.append("METSÄVARAT YHTEENVETO")
    lines.append(f"  Kuvioita: {stats['count']}")
    lines.append(f"  Metsämaan pinta-ala: {_fmt(stats['totalArea'], 2)} ha")
    total_vol = stats['totalVolume']
    lines.append(f"  Puuston tilavuus: {_fmt(stats['avgVolume'], 0)} m³/ha (ka.), {_fmt(total_vol, 0)} m³ yhteensä")
    lines.append(f"  Tukkipuu: {_fmt(stats['avgSawlog'], 0)} m³/ha | Kuitupuu: {_fmt(stats['avgPulpwood'], 0)} m³/ha")
    lines.append(f"  Vuosikasvu: {_fmt(stats['avgGrowth'], 1)} m³/ha/v")

    sp = stats["speciesPercent"]
    species_parts = []
    if sp["pine"]:
        species_parts.append(f"Mänty {sp['pine']} %")
    if sp["spruce"]:
        species_parts.append(f"Kuusi {sp['spruce']} %")
    if sp["birch"]:
        species_parts.append(f"Lehtipuut {sp['birch']} %")
    lines.append(f"  Puulajijakauma: {' | '.join(species_parts)}")

    age_range = ""
    if stats["minAge"] is not None and stats["maxAge"] is not None:
        age_range = f" ({_fmt(stats['minAge'])}–{_fmt(stats['maxAge'])} v)"
    lines.append(f"  Keski-ikä: {_fmt(stats['avgAge'], 0)} v{age_range}")
    lines.append(f"  Keskipituus: {_fmt(stats['avgHeight'], 1)} m")
    lines.append(f"  Keskiläpimitta: {_fmt(stats['avgDiameter'], 1)} cm")
    lines.append(f"  Pohjapinta-ala: {_fmt(stats['avgBasalArea'], 1)} m²/ha")
    lines.append(f"  Runkoluku: {_fmt(stats['avgStemCount'], 0)} kpl/ha")
    lines.append("")

    # Development class distribution
    if stats["developmentDistribution"]:
        lines.append("KEHITYSLUOKAT")
        for d in stats["developmentDistribution"]:
            lines.append(f"  {d['name']}: {d['count']} kuviota")
        lines.append("")

    # Fertility distribution
    if stats["fertilityDistribution"]:
        lines.append("KASVUPAIKAT")
        for f in stats["fertilityDistribution"]:
            lines.append(f"  {f['name']}: {_fmt(f['area'], 2)} ha")
        lines.append("")

    # Cutting recommendations
    if stats["cuttingRecommendations"]:
        lines.append("HAKKUUEHDOTUKSET")
        for r in stats["cuttingRecommendations"]:
            year_str = f" (ehdotusvuosi {r['year']})" if r["year"] else ""
            lines.append(f"  {r['name']}: {r['count']} kuviota{year_str}")
        lines.append("")

    # Silviculture recommendations
    if stats["silvicultureRecommendations"]:
        lines.append("HOITOEHDOTUKSET")
        for r in stats["silvicultureRecommendations"]:
            year_str = f" (ehdotusvuosi {r['year']})" if r["year"] else ""
            lines.append(f"  {r['name']}: {r['count']} kuviota{year_str}")
        lines.append("")

    # Individual stands
    lines.append(f"KUVIOT ({stats['count']} kpl)")
    for i, feat in enumerate(features, 1):
        p = feat.get("properties", {})
        species_code = p.get("MAINTREESPECIES")
        species_name = TREE_SPECIES.get(int(species_code), f"Laji {species_code}") if species_code else "Ei puustoa"
        area = _fmt(p.get("AREA", 0), 2)
        volume = _fmt(p.get("VOLUME", 0), 0)
        age = _fmt(p.get("MEANAGE")) if p.get("MEANAGE") else "-"
        dev = p.get("DEVELOPMENTCLASS", "")
        dev_name = DEVELOPMENT_CLASS.get(str(dev), str(dev)) if dev else "-"
        lines.append(f"  {i}. {species_name} | {area} ha | {volume} m³/ha | Ikä {age} v | {dev_name}")

    # Measurement year
    lines.append("")
    if stats["measurementYearMin"] and stats["measurementYearMax"]:
        if stats["measurementYearMin"] == stats["measurementYearMax"]:
            lines.append(f"Mittausvuosi: {stats['measurementYearMin']}")
        else:
            lines.append(f"Mittausvuosi: {stats['measurementYearMin']}–{stats['measurementYearMax']}")

    return "\n".join(lines)


@mcp.tool
def hae_metsavaratieto(kiinteistotunnus: str) -> str:
    """Hakee kiinteistön metsävaratiedot kiinteistötunnuksella.

    Kiinteistötunnus voi olla muodossa "91-416-1-123" tai "09141600010123".
    Palauttaa yhteenvedon metsävaroista: pinta-ala, puuston tilavuus,
    puulajijakauma, kehitysluokat, hakkuu- ja hoitoehdotukset sekä kuviotiedot.
    """
    try:
        result = get_forest_data(kiinteistotunnus)
        return format_result(result)
    except Exception as e:
        return f"Virhe haettaessa tietoja: {e}"


def _strip_geometry(features: list) -> list:
    """Return features with properties only (no geometry) for compact output."""
    stripped = []
    for f in features:
        props = dict(f.get("properties", {}))
        # Decode tree species and development class for readability
        species_code = props.get("MAINTREESPECIES")
        if species_code is not None:
            props["MAINTREESPECIES_NAME"] = TREE_SPECIES.get(int(species_code), f"Laji {species_code}")
        dev_code = props.get("DEVELOPMENTCLASS")
        if dev_code is not None:
            props["DEVELOPMENTCLASS_NAME"] = DEVELOPMENT_CLASS.get(str(dev_code), str(dev_code))
        fert_code = props.get("FERTILITYCLASS")
        if fert_code is not None:
            props["FERTILITYCLASS_NAME"] = FERTILITY_CLASS.get(int(fert_code), f"Tyyppi {fert_code}")
        stripped.append(props)
    return stripped


@mcp.tool
def hae_raakadata(kiinteistotunnus: str) -> str:
    """Hakee kiinteistön metsävaratiedot raakadatana (JSON) tekoälymallin analysoitavaksi.

    Kiinteistötunnus voi olla muodossa "91-416-1-123" tai "09141600010123".
    Palauttaa JSON-muotoisen vastauksen joka sisältää:
    - statistics: lasketut yhteenvetotilastot (pinta-alat, tilavuudet, puulajijakaumat jne.)
    - features: kuviokohtaiset raakamittaustiedot ilman geometriaa

    Käytä tätä työkalua kun haluat analysoida dataa tarkemmin, tehdä laskelmia,
    vertailla kuvioita tai tuottaa räätälöityjä suosituksia. Yhteenvetomuotoista
    tulosta varten käytä hae_metsavaratieto-työkalua.
    """
    try:
        result = get_forest_data(kiinteistotunnus)

        error = result.get("error")
        ref = result.get("reference", "")
        display_ref = format_cadastral_reference(ref) if ref else ""

        if error == "invalid_id":
            return json.dumps({"error": "Virheellinen kiinteistötunnus."}, ensure_ascii=False)
        if error == "not_found":
            return json.dumps({"error": f"Kiinteistöä ei löytynyt: {display_ref}"}, ensure_ascii=False)
        if error == "no_forest_data":
            return json.dumps({"error": f"Ei metsävaratietoja: {display_ref}"}, ensure_ascii=False)

        output = {
            "kiinteistotunnus": display_ref,
            "palstoja": result.get("parcelCount", 1),
            "statistics": result["statistics"],
            "features": _strip_geometry(result.get("features", [])),
        }

        return json.dumps(output, ensure_ascii=False, default=str)
    except Exception as e:
        return json.dumps({"error": f"Virhe: {e}"}, ensure_ascii=False)


if __name__ == "__main__":
    mcp.run()
