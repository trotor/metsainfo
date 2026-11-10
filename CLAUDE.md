# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Metsäinfo is a client-side web application for viewing Finnish forest data (metsävaratiedot) on an interactive map. Users click cadastral parcels to see aggregated forest statistics. No backend server required.

**Live demo**: https://trotor.github.io/metsainfo/

## Development

```bash
npm install          # ensimmäisellä kerralla
npm run dev          # kehityspalvelin, oletuksena http://localhost:5173
npm test             # yksikkötestit (Vitest)
npm run build        # tuotantobuild dist/-hakemistoon
npm run preview      # tuotantobuildin esikatselu
npm run ios:sync     # build + versio iOS-projektiin + cap sync ios
npm run ios:open     # avaa ios/App/App.xcodeproj Xcodessa
```

### iOS-sovellus (Capacitor 8)
- `capacitor.config.json`: appId `fi.inetor.metsainfo`, webDir `dist`. `ios/` on versionhallinnassa (SPM, ei CocoaPodsia), vain iPhone, tiimi Inetor oy `TTND84D98U`.
- Sovelluskoodi ei kutsu Capacitor-plugineja suoraan vaan `js/platform/`-moduuleja. `isNative()` erottaa sovelluksen verkkoversiosta; sovelluksessa linkki ja CSV jaetaan iOS:n jakonäkymällä, tulostus on piilotettu ja jaettavat linkit osoittavat julkiseen verkkoversioon.
- Versio: `scripts/sync-version.mjs` kirjoittaa `public/version.js`:n numeron `MARKETING_VERSION`iksi ja git-committien määrän build-numeroksi. Aja `npm run ios:sync` ennen jokaista iOS-buildia.
- `ios/App/App/PrivacyInfo.xcprivacy`: tarkista aina, kun lisäät pluginin.
- Paikannus: `js/platform/location.js` (Capacitor Geolocation / navigator.geolocation), `js/platform/compass.js`, puhdas logiikka `js/location/logic.js`, käyttöliittymä `js/ui/location-ui.js`. Vain evätty lupa lopettaa seurannan; tilapäiset katkot eivät. Sijaintipiste piirretään omaan paneeliin `locationPane` kuviotasojen yläpuolelle.

Verkkosovellus julkaistaan automaattisesti GitHub Actionsilla `gh-pages`-haaraan
jokaisella `main`-pushilla. Älä päivitä `gh-pages`-haaraa käsin.

Kirjastot (Leaflet, Proj4js, Proj4Leaflet) ovat npm-riippuvuuksia ja pinnattu
täsmällisiin versioihin. Ne asetetaan globaaleiksi `js/vendor/`-moduuleissa,
koska sovelluskoodi käyttää `L`- ja `proj4`-tunnisteita globaaleina.
`style.css` tuodaan `js/app.js`:ssä vendorin jälkeen, jotta omat tyylit
ohittavat Leafletin oletukset.

## Architecture

### UI modules (`js/ui/`)
- `summary.js` renders the panel (tab panels `summary` / `recs` / `stands` + mobile peek row), `stands.js` the stand list and map highlights, `panel.js` panel state (tabs, ⋯ menu, sheet wiring, `mapFitOptions()`), `sheet.js` the mobile bottom sheet (peek / half / full), `layout.js` layout detection, `tips.js` tap-to-open term explanations, `map-features.js` popups, `legend.js` colour modes, `actions.js` help / link / CSV. `index.js` re-exports them.
- **Mobile layout** is selected by `MOBILE_QUERY` in `js/ui/layout.js`, identical to the mobile media query in `style.css` — keep them the same. Desktop (> 768 px) must stay functionally unchanged; mobile-only styles go inside that media query.

### Data Sources (WFS)
- **Metsäkeskus** (`avoin.metsakeskus.fi`) - Forest stand data (`v1:stand`), forest use declarations (`v1:forestusedeclaration`)
- **MML INSPIRE** (`inspire-wfs.maanmittauslaitos.fi`) - Cadastral parcel boundaries (`cp:CadastralParcel`)

### MCP Server

The `mcp-server/` directory provides a FastMCP Python server that exposes forest data lookup as an MCP tool for AI assistants (Claude Code, Claude Desktop, etc.).

- **Tools**: `hae_metsavaratieto(kiinteistotunnus)` — human-readable summary; `hae_raakadata(kiinteistotunnus)` — raw JSON data for AI analysis
- **Framework**: FastMCP Python (part of official MCP SDK)
- **Run**: `uv run --with fastmcp --with certifi fastmcp run mcp-server/server.py`
- **Config**: `.mcp.json` in project root (Claude Code auto-discovers this)
- **Pipeline**: `pipeline.py` is a port of the browser-side JS (`data.js`, `utils.js`, `statistics.js`). Keep them in sync when modifying WFS queries, geometry logic, or statistics calculation.
- **Dependencies**: `fastmcp`, `certifi` (installed automatically via `uv run --with`)

### Coordinate Handling
The map uses EPSG:3067 (Finnish national projection) natively via Proj4Leaflet CRS. Base map tiles from Kapsi use EPSG:3067 tile grid. WFS data also uses EPSG:3067. The `coordsEPSG3067ToLatLng()` function converts coordinates to WGS84 LatLng for Leaflet's internal use. Geometry operations (`pointInPolygon3067`, `getGeometryBounds3067`) work in EPSG:3067.

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
- `cuttingPurpose` - Forest use declaration cutting purpose (1-6)

## Reference (loaded on demand)

These live as skills in `.claude/skills/` so they don't sit in context every session:

- **`wfs-rajapinnat`** – WFS endpoints, request formats, response shapes and known quirks for all three data sources
- **`laajennuspisteet`** – which files to touch when adding a map layer, statistic, search mode, code mapping, color mode, or WFS source
- **`manuaalinen-testaus`** – manual verification checklist (UI has no automated tests)

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

### version.js is not a module
`version.js` is loaded as a regular `<script>`, not an ES module, so `VERSION` is available globally for the inline script in `index.html`. Don't convert it to a module. It lives in `public/` so Vite copies it to `dist/` unchanged — a classic `<script>` tag is not bundled.

### Multi-part parcels
- A single cadastral reference (e.g., 091-416-0001-0123) can have multiple geometry parts.
- `fetchParcelsByReference()` returns an array — always handle multiple features.
- `selectParcels()` combines all parts. `filterFeaturesByParcels()` checks against all parts.

## Testing

`npm test` runs Vitest unit tests (`tests/`, jsdom) for pure logic: coordinate conversion, geometry, parcel IDs. UI has no automated tests — verify it manually with the `manuaalinen-testaus` skill checklist. CI runs the tests before every deploy.

## Notes

- UI is in Finnish (Suomi)
- Parcels only load at zoom level ≥10 for performance (EPSG:3067 zoom levels)
- Forest volume colors: darker green = higher m³/ha
- Default center: Suolahti, Finland (62.57°N, 25.85°E)

## Version Management

When making changes to the application, remember to update the version number in `public/version.js`:
- **Patch** (1.x.Y): Bug fixes, minor tweaks
- **Minor** (1.X.0): New features, enhancements
- **Major** (X.0.0): Breaking changes, major rewrites

Update both `number` and `date` fields.

## AI Development Guide

See [CLAUDE-HOWTO.md](CLAUDE-HOWTO.md) for:
- How this application was built using AI (Claude Code)
- Example prompts for developing the application further
- Ideas for integrating AI features into the application itself
