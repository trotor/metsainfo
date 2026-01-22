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

### Code Mappings (CODES object)

**IMPORTANT:** All code mappings must match the official Metsäkeskus WFS specification:
- **Official source:** https://www.metsakeskus.fi/sites/default/files/document/avoin-metsatieto-wfs-stand-habitat-koodisto-ja-tietokantakuvaus.xlsx
- **Local reference:** [KOODISTO.md](KOODISTO.md)

The `CODES` object in `app.js` maps numeric IDs to Finnish names. When modifying or adding codes, always verify against the official Metsäkeskus documentation. Key mappings:
- `treeSpecies` - Tree species (1-30)
- `cuttingType` - Cutting/logging types (0-94)
- `silvicultureType` - Silviculture operations (1-5)
- `developmentClass` - Forest development stages (A0, S0, T1, T2, 02-05, Y1, ER)
- `drainageState` - Drainage status (1-3, 6-9)
- `soilType` - Soil types (10-80)
- `fertilityClass` - Site fertility (1-8)
- `accessibility` - Harvesting accessibility (1-5)
- `mainGroup` - Land use category (1-8)

## File Structure

```
├── index.html      # Entry point, CDN imports
├── app.js          # All application logic (~1400 lines)
├── style.css       # Styling
├── version.js      # Version information
├── CLAUDE.md       # Developer instructions (this file)
├── CLAUDE-HOWTO.md # AI usage guide and development history
├── KOODISTO.md     # Official code mappings reference
└── README.md       # Finnish documentation
```

## Notes

- UI is in Finnish (Suomi)
- Parcels only load at zoom level ≥14 for performance
- Forest volume colors: darker green = higher m³/ha

## Version Management

When making changes to the application, remember to update the version number in `version.js`:
- **Patch** (1.x.Y): Bug fixes, minor tweaks
- **Minor** (1.X.0): New features, enhancements
- **Major** (X.0.0): Breaking changes, major rewrites

Update both `number` and `date` fields.

## AI Development Guide

See [CLAUDE-HOWTO.md](CLAUDE-HOWTO.md) for:
- How this application was built using AI (Claude Code)
- Example prompts for developing the application further
- Ideas for integrating AI features into the application itself
