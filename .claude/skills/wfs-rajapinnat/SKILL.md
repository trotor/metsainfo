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

## General WFS Notes

- All bbox values must be in EPSG:3067 coordinates (meters), not WGS84 (degrees)
- Both APIs support CORS (direct browser access works)
- OutputFormat is always `application/json` (GeoJSON)
- Requests are GET with URL parameters (no POST/XML needed)
