---
name: laajennuspisteet
description: Step-by-step extension points for Metsäinfo — which files to touch when adding a map layer, statistic, search mode, code mapping, stand color mode, or WFS data source, plus the window-exposure rule for onclick handlers. Use when adding any new feature to the map application.
---

# Extension Points

## New map layer
1. `js/app.js` `initLayers()` – create new `L.geoJSON` layer, register in state
2. `js/app.js` `initMap()` – add to Leaflet layer control
3. `js/app.js` `initEventListeners()` – add load trigger on `moveend`
4. `js/styles.js` – add style function
5. `js/ui.js` – add popup/interaction handler

## New statistic
1. `js/statistics.js` `calculateStatistics()` – add calculation logic
2. `js/ui.js` `showSummary()` – add HTML rendering in side panel

## New search mode
1. `js/utils.js` `normalizeParcelId()` – add input validation/parsing
2. `js/app.js` `searchParcel()` – add search logic branch

## New code mapping
1. `js/config.js` `CODES` object – add new category
2. `KOODISTO.md` – document the codes with official source
3. **Both must be updated together!**

## New color mode for stands
1. `js/config.js` `COLOR_MODES` – add new mode configuration
2. `index.html` – add `<option>` to `#color-mode-select`

## New WFS data source
1. `js/config.js` `CONFIG` – add endpoint URL
2. `js/data.js` – create fetch function (use `fetchForestDataByBounds` as template)
3. All WFS uses EPSG:3067 coordinates
4. `js/ui.js` – create render functions

See the `wfs-rajapinnat` skill for endpoint details and known WFS quirks.

## Global scope for onclick handlers
Functions used in HTML template strings (`onclick="..."`) must be exposed on `window` in `js/app.js`:
```javascript
window.myFunction = myFunction;
```
