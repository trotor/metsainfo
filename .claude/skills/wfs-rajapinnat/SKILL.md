---
name: wfs-rajapinnat
description: WFS endpoint reference for Metsäinfo — Metsäkeskus forest stands (v1:stand), forest use declarations (v1:forestusedeclaration), and MML INSPIRE cadastral parcels (cp:CadastralParcel). Use when writing or debugging WFS queries, adding a data source, or investigating missing/incomplete features.
---

# WFS API Details

## Metsäkeskus – Forest Stand Data

- **Endpoint**: `https://avoin.metsakeskus.fi/rajapinnat/v1/stand/ows`
- **Version**: WFS 2.0.0
- **Feature type**: `v1:stand`
- **Request**: GET with URL parameters: `service=WFS&version=2.0.0&request=GetFeature&typeName=v1:stand&outputFormat=application/json&srsName=EPSG:3067&bbox={minX},{minY},{maxX},{maxY},EPSG:3067`
- **Response**: GeoJSON FeatureCollection with stand polygons
- **Limits**: Max ~2000 features per query. Too large bbox → missing features without error.
- **Error behavior**: HTTP 200 with empty FeatureCollection = no data in area (not an error)
- **Key properties**: `MAINSPECIES`, `MEANDIAM`, `MEANHEIGHT`, `MEANAGE`, `VOLUME`, `DEVELOPMENTCLASS`, `FERTILITYCLASS`, `SOILTYPE`, `DRAINAGESTATE`, `ACCESSIBILITY`, `MEASUREMENTDATE`, plus cutting/silviculture recommendation arrays

## Metsäkeskus – Forest Use Declarations (MKI)

- **Endpoint**: `https://avoin.metsakeskus.fi/rajapinnat/v1/forestusedeclaration/ows`
- **Version**: WFS 2.0.0
- **Feature type**: `v1:forestusedeclaration`
- **Request**: GET with URL parameters using CQL_FILTER that combines BBOX and year filter
- **IMPORTANT**: This WFS does NOT support separate `bbox` and `CQL_FILTER` parameters simultaneously (returns HTTP 500). Must combine into a single `CQL_FILTER`: `BBOX(GEOMETRY,minX,minY,maxX,maxY,'EPSG:3067') AND DECLARATIONARRIVALYEAR >= 'year'`
- **Response**: GeoJSON FeatureCollection with declaration polygons
- **Key properties**: `CUTTINGPURPOSE`, `CUTTINGREALIZATIONPRACTICE`, `STANDAREA`, `DECLARATIONARRIVALYEAR`, `MAINTREESPECIES`

## MML INSPIRE – Cadastral Parcels

- **Endpoint**: `https://inspire-wfs.maanmittauslaitos.fi/inspire-wfs/cp/ows`
- **Version**: WFS 2.0.0
- **Feature type**: `cp:CadastralParcel`
- **Request (by area)**: GET with `bbox={minX},{minY},{maxX},{maxY},EPSG:3067`
- **Request (by reference)**: GET with `CQL_FILTER=nationalCadastralReference='09141600010123'`
- **Response**: GeoJSON FeatureCollection with parcel polygons
- **Key properties**: `nationalCadastralReference` (14-digit ID), `label`, `referencePoint`
- **Note**: Multi-part parcels return multiple features with the same `nationalCadastralReference`
- **Quirk (verified 2026-11-16)**: a bbox that lies entirely inside a large parcel returns **0 features** (e.g. 100 m and 400 m boxes inside a ~450 m wide parcel; a 1 km box finds it). To find the parcel at a point, grow the bbox until a returned parcel contains the point: `fetchParcelContaining()` in `js/data.js`. The legacy `fetchCadastralParcel()` falls back to the first feature and may return a neighbour.

## Väylävirasto Digiroad – Roads (trial feature js/saavutettavuus/)

- **Endpoint:** `https://avoinapi.vaylapilvi.fi/vaylatiedot/digiroad/ows` (WFS 2.0.0, no key, CORS `*`, CC BY 4.0)
- **Request:** `typeNames=digiroad:dr_tielinkki_hall_lk&outputFormat=application/json&srsName=EPSG:3067&bbox=minX,minY,maxX,maxY,EPSG:3067`
- **Fields:** `link_id`, `toiminn_lk` (1–6 car roads incl. private/forest roads, 7 track, 8 pedestrian/cycle), `hallinn_lk` (1 state, 2 municipality, 3 private, 99 unknown), `mtk_tie_lk`. Geometry LineString with z.
- **Topology:** link endpoints coincide at junctions → build a graph by rounding endpoints.
- **Restrictions (same bbox query, join on `link_id`):** `dr_kelirikko` (`arvo` kg as string, `kestoalku1`/`kestolopp1` may be empty), `tiekunnalliset_yksityistiet` (road association), `dr_max_massa` and `dr_yhdistelman_max_massa` (`arvo` kg).
- **Volume:** 10 km × 10 km near Suolahti = 2175 links in one response; no default cap observed. Still compare `numberMatched` to features returned.

## Metsäkeskus – Korjuukelpoisuus (harvesting conditions raster)

- **Endpoint:** `https://avoin.metsakeskus.fi/rajapinnat/v1/ows` WMS 1.3.0, layer `Korjuukelpoisuus` (CORS `*`, CC BY 4.0). GetFeatureInfo returns `PALETTE_INDEX`; GetMap PNG is a palette image with exact legend colours.
- **Classes (GetLegendGraphic / tietotuotekuvaus 5.9.2025):** 1 kelirikko `#006100`, 2 normaali kesä kivennäismaa `#619900`, 3 kuiva kesä kivennäismaa `#A0DB00`, 4 normaali kesä turvemaa `#FFFA00`, 5 kuiva kesä turvemaa `#FF8400`, 6 talvi `#FF2600`, 254 vesistö `#80FFFF`.
- **Raster cell** 16 m × 16 m, computed from laser scanning + MML topographic database without field checks; coverage by area (`korjuukelpoisuus_aluerajat`, property `nimi` e.g. `Jyvaskyla_2010`).
- Attribution must say the data is modified when scored.

## General WFS Notes

- All bbox values must be in EPSG:3067 coordinates (meters), not WGS84 (degrees)
- Both APIs support CORS (direct browser access works)
- OutputFormat is always `application/json` (GeoJSON)
- Requests are GET with URL parameters (no POST/XML needed)
