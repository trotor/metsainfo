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
- Proj4js - Coordinate transformation between EPSG:3067 (Finnish national) and WGS84
- Proj4Leaflet - EPSG:3067 CRS support for Leaflet
- Kapsi/MML - Finnish base map tiles (taustakartta, peruskartta, ortokuva)

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
The map uses EPSG:3067 (Finnish national projection) natively via Proj4Leaflet CRS. Base map tiles from Kapsi use EPSG:3067 tile grid. WFS data also uses EPSG:3067. The `coordsEPSG3067ToLatLng()` function converts coordinates to WGS84 LatLng for Leaflet's internal use. Geometry operations (`pointInPolygon3067`, `getGeometryBounds3067`) work in EPSG:3067.

### Map Layers
Base map layers are served from Kapsi (kartat.kapsi.fi) in EPSG:3067 projection:
- **Peruskartta** (default) - Basic topographic map
- **Taustakartta** - Background map with less detail
- **Ortokuva** - Aerial/satellite imagery

Layer switching is handled by Leaflet's built-in layer control (top right corner).

### Code Mappings (CODES object)

**IMPORTANT:** All code mappings must match the official Metsäkeskus WFS specification:
- **Official source:** https://www.metsakeskus.fi/sites/default/files/document/avoin-metsatieto-wfs-stand-habitat-koodisto-ja-tietokantakuvaus.xlsx
- **Local reference:** [KOODISTO.md](KOODISTO.md)

The `CODES` object in `js/config.js` maps numeric IDs to Finnish names. When modifying or adding codes, always verify against the official Metsäkeskus documentation. Key mappings:
- `treeSpecies` - Tree species (1-30)
- `cuttingType` - Cutting/logging types (0-94)
- `silvicultureType` - Silviculture operations (1-5)
- `developmentClass` - Forest development stages (A0, S0, T1, T2, 02-05, Y1, ER)
- `drainageState` - Drainage status (1-3, 6-9)
- `soilType` - Soil types (10-80)
- `fertilityClass` - Site fertility (1-8)
- `accessibility` - Harvesting accessibility (1-5)
- `mainGroup` - Land use category (1-8)

## WFS API Details

### Metsäkeskus – Forest Stand Data

- **Endpoint**: `https://avoin.metsakeskus.fi/rajapinnat/v1/stand/ows`
- **Version**: WFS 2.0.0
- **Feature type**: `v1:stand`
- **Request**: GET with URL parameters: `service=WFS&version=2.0.0&request=GetFeature&typeName=v1:stand&outputFormat=application/json&srsName=EPSG:3067&bbox={minX},{minY},{maxX},{maxY},EPSG:3067`
- **Response**: GeoJSON FeatureCollection with stand polygons
- **Limits**: Max ~2000 features per query. Too large bbox → missing features without error.
- **Error behavior**: HTTP 200 with empty FeatureCollection = no data in area (not an error)
- **Key properties**: `MAINSPECIES`, `MEANDIAM`, `MEANHEIGHT`, `MEANAGE`, `VOLUME`, `DEVELOPMENTCLASS`, `FERTILITYCLASS`, `SOILTYPE`, `DRAINAGESTATE`, `ACCESSIBILITY`, `MEASUREMENTDATE`, plus cutting/silviculture recommendation arrays

### MML INSPIRE – Cadastral Parcels

- **Endpoint**: `https://inspire-wfs.maanmittauslaitos.fi/inspire-wfs/cp/ows`
- **Version**: WFS 2.0.0
- **Feature type**: `cp:CadastralParcel`
- **Request (by area)**: GET with `bbox={minX},{minY},{maxX},{maxY},EPSG:3067`
- **Request (by reference)**: GET with `CQL_FILTER=nationalCadastralReference='09141600010123'`
- **Response**: GeoJSON FeatureCollection with parcel polygons
- **Key properties**: `nationalCadastralReference` (14-digit ID), `label`, `referencePoint`
- **Note**: Multi-part parcels return multiple features with the same `nationalCadastralReference`

### General WFS Notes

- All bbox values must be in EPSG:3067 coordinates (meters), not WGS84 (degrees)
- Both APIs support CORS (direct browser access works)
- OutputFormat is always `application/json` (GeoJSON)
- Requests are GET with URL parameters (no POST/XML needed)

## File Structure

```
├── index.html          # Entry point, CDN imports
├── js/
│   ├── app.js          # Main module: init, map setup, event wiring (~310 lines)
│   ├── config.js       # CONFIG, CODES, TOOLTIPS, COLOR_MODES, CRS (~170 lines)
│   ├── state.js        # Shared mutable state (~35 lines)
│   ├── utils.js        # Coordinates, geometry, formatting (~140 lines)
│   ├── styles.js       # Leaflet layer style functions (~60 lines)
│   ├── data.js         # WFS fetch and geometry filtering (~140 lines)
│   ├── statistics.js   # calculateStatistics (~200 lines)
│   └── ui.js           # DOM rendering and interactions (~490 lines)
├── style.css           # Styling
├── version.js          # Version information (non-module, global)
├── CLAUDE.md           # Developer instructions (this file)
├── CLAUDE-HOWTO.md     # AI usage guide and development history
├── KOODISTO.md         # Official code mappings reference
└── README.md           # Finnish documentation
```

### Module Dependencies
```
config.js ← (no deps, uses global proj4/L from CDN)
state.js  ← (no deps)
utils.js  ← (no deps, uses global proj4/L)
styles.js ← config, state
data.js   ← config, utils
statistics.js ← config, utils
ui.js     ← config, state, styles, statistics, utils
app.js    ← config, state, utils, styles, data, ui
```

Note: `version.js` is loaded as a regular `<script>` (not a module) so `VERSION` is available globally for the inline script in `index.html`.

## Extension Points

### New map layer
1. `js/app.js` `initLayers()` – create new `L.geoJSON` layer, register in state
2. `js/app.js` `initMap()` – add to Leaflet layer control
3. `js/app.js` `initEventListeners()` – add load trigger on `moveend`
4. `js/styles.js` – add style function
5. `js/ui.js` – add popup/interaction handler

### New statistic
1. `js/statistics.js` `calculateStatistics()` – add calculation logic
2. `js/ui.js` `showSummary()` – add HTML rendering in side panel

### New search mode
1. `js/utils.js` `normalizeParcelId()` – add input validation/parsing
2. `js/app.js` `searchParcel()` – add search logic branch

### New code mapping
1. `js/config.js` `CODES` object – add new category
2. `KOODISTO.md` – document the codes with official source
3. **Both must be updated together!**

### New color mode for stands
1. `js/config.js` `COLOR_MODES` – add new mode configuration
2. `index.html` – add `<option>` to `#color-mode-select`

### New WFS data source
1. `js/config.js` `CONFIG` – add endpoint URL
2. `js/data.js` – create fetch function (use `fetchForestDataByBounds` as template)
3. All WFS uses EPSG:3067 coordinates
4. `js/ui.js` – create render functions

### Global scope for onclick handlers
Functions used in HTML template strings (`onclick="..."`) must be exposed on `window` in `js/app.js`:
```javascript
window.myFunction = myFunction;
```

## Common Pitfalls

### Coordinates – most common source of bugs
- WFS returns EPSG:3067 (meters). Leaflet uses WGS84 (degrees) internally.
- **Never mix them.** Use `coordsEPSG3067ToLatLng()` when converting WFS data → Leaflet LatLng.
- Geometry operations (`pointInPolygon3067`, `getGeometryBounds3067`) work in EPSG:3067. Do NOT convert to WGS84 first.
- WFS bbox parameters must be EPSG:3067 coordinates. Converting map bounds: `proj4('WGS84', 'EPSG:3067', [lng, lat])`.

### CODES object
- All codes come from official Metsäkeskus xlsx specification. Never invent codes.
- If WFS returns an unknown code, display the raw number (don't hide data).
- Always verify against [KOODISTO.md](KOODISTO.md) and the [official source](https://www.metsakeskus.fi/sites/default/files/document/avoin-metsatieto-wfs-stand-habitat-koodisto-ja-tietokantakuvaus.xlsx).

### WFS requests
- Metsäkeskus WFS returns max ~2000 features per request.
- Too large bbox → silently missing features (no error, just incomplete data).
- HTTP 200 + empty FeatureCollection = no data in area, not an error.
- 10m buffer is added to bbox in `fetchForestDataByBounds()` to catch edge features.

### HTML rendering
- `showSummary()` and `renderStandItem()` build HTML as template strings.
- WFS data is generally safe, but always sanitize any user input before inserting into HTML.
- Use `formatNumber()` for all numeric display (handles fi-FI locale, comma as decimal separator).

### Multi-part parcels
- A single cadastral reference (e.g., 091-416-0001-0123) can have multiple geometry parts.
- `fetchParcelsByReference()` returns an array — always handle multiple features.
- `selectParcels()` combines all parts. `filterFeaturesByParcels()` checks against all parts.

## Testing

No automated test framework. Verify changes manually:

### Basic flow
1. Start server: `python3 -m http.server 8080`
2. Open http://localhost:8080
3. Map loads, centered on Suolahti area
4. Zoom in → parcel boundaries appear (zoom ≥10)
5. Click a parcel → side panel shows statistics, stands appear on map with green coloring

### Search
6. Enter a cadastral reference in search box (format: `91-416-1-123`)
7. Map zooms to parcel, statistics load in side panel
8. Try invalid input → error message appears

### Stand interaction
9. Click a stand header in the list → stand expands, highlights on map
10. Click a cutting recommendation → matching stands highlight in orange
11. Click another stand → previous highlight clears

### CSV export
12. With a parcel selected, click "Lataa CSV"
13. File downloads, opens in Excel with correct Finnish characters (ääkköset)
14. Semicolon-delimited, comma as decimal separator

### Mobile
15. Resize browser to ≤768px width → panel moves to bottom
16. Search form accessible, map interactive with touch

### Edge cases
- Zoom out past level 10 → parcels disappear (expected)
- Click area with no forest data → panel shows "Ei metsävaratietoja"
- Search for non-existent parcel → "Kiinteistöä ei löytynyt"

## Notes

- UI is in Finnish (Suomi)
- Parcels only load at zoom level ≥10 for performance (EPSG:3067 zoom levels)
- Forest volume colors: darker green = higher m³/ha
- Default center: Suolahti, Finland (62.57°N, 25.85°E)

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
