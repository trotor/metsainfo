# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Metsäinfo is a client-side web application for viewing Finnish forest data (metsävaratiedot) on an interactive map. Users click cadastral parcels to see aggregated forest statistics. No backend server required.

**Live demo**: https://trotor.github.io/metsainfo/

## Development

```bash
# Start local server
python3 -m http.server 8080
# Access at http://localhost:8080
```

No build step, package manager, or dependencies to install. All libraries are loaded from CDN.

## Architecture

### Tech Stack
- Vanilla JavaScript (ES6+)
- Leaflet.js - Map rendering
- Proj4js - Coordinate transformation between EPSG:3067 (Finnish national) and WGS84 (web maps)
- OpenStreetMap - Base tiles

### Data Sources (WFS)
- **Metsäkeskus** (`avoin.metsakeskus.fi`) - Forest stand data (`v1:stand`)
- **MML INSPIRE** (`inspire-wfs.maanmittauslaitos.fi`) - Cadastral parcel boundaries (`cp:CadastralParcel`)

### Application Flow
1. `init()` → `initMap()` → `initLayers()` → `initControls()` → `initEventListeners()`
2. User zooms to level ≥14 → `loadParcelsInView()` fetches cadastral parcels in viewport
3. User clicks parcel → `selectParcel()` queries forest data within parcel bounds
4. `filterFeaturesByParcel()` filters stands whose centroid is inside the clicked parcel
5. `showSummary()` renders aggregated statistics in side panel

### Key State
- `map` - Leaflet map instance
- `cadastralLayer` - Parcel boundaries (GeoJSON)
- `selectedParcelLayer` - Currently selected parcel highlight
- `forestLayer` - Forest stands in selected parcel
- `loadedParcels` - Cache of loaded parcels by ID

### Coordinate Handling
All external data uses EPSG:3067 (Finnish national projection). Leaflet uses WGS84. The `coordsEPSG3067ToLatLng()` function handles conversion. Geometry operations (`pointInPolygon3067`, `getGeometryBounds3067`) work in EPSG:3067.

### Code Mappings
The `CODES` object maps numeric IDs to Finnish names:
- `treeSpecies` - Pine (1), Spruce (2), Birch varieties (3-4), etc.
- `cuttingType` - Logging recommendations (1-10)
- `silvicultureType` - Forest management recommendations (1-12)

## File Structure

```
metsainfo/
├── index.html    # Entry point, CDN imports
├── app.js        # All application logic (~760 lines)
├── style.css     # Styling
└── README.md     # Finnish documentation
```

## Notes

- UI is in Finnish (Suomi)
- Parcels only load at zoom level ≥14 for performance
- Forest volume colors: darker green = higher m³/ha

## Version Management

When making changes to the application, remember to update the version number in `metsainfo/version.js`:
- **Patch** (1.x.Y): Bug fixes, minor tweaks
- **Minor** (1.X.0): New features, enhancements
- **Major** (X.0.0): Breaking changes, major rewrites

Update both `number` and `date` fields.
