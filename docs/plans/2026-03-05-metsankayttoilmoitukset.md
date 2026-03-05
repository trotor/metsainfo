# Metsänkäyttöilmoitukset Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add forest use declarations (metsänkäyttöilmoitukset) as a toggleable overlay map layer with color-coded polygons, tooltips, popups, and switchable color modes.

**Architecture:** New overlay layer following the existing habitat layer pattern. WFS data from Metsäkeskus `v1:forestusedeclaration` endpoint. Two color modes (year-based default, purpose-based alternative) with a dropdown selector. Popup shows basic info on click. Filtered to last 5 years.

**Tech Stack:** Vanilla JS (ES6 modules), Leaflet.js, Metsäkeskus WFS 2.0.0, EPSG:3067

**Note on innerHTML:** This project uses innerHTML with template strings throughout (see ui.js showSummary, renderStandItem, etc.). All data comes from WFS APIs (not user input), matching the existing pattern. This is consistent with the codebase convention.

---

### Task 1: Add configuration — WFS endpoint and code mappings

**Files:**
- Modify: `js/config.js:19-31` (CONFIG object)
- Modify: `js/config.js:33-96` (CODES object)
- Modify: `js/config.js` after COLOR_MODES (add MKI_COLOR_MODES)
- Modify: `KOODISTO.md` (documentation)

**Step 1: Add MKI WFS endpoint to CONFIG**

In `js/config.js`, add `mkiWfsUrl` to the CONFIG object after `habitatWfsUrl`:

```javascript
mkiWfsUrl: 'https://avoin.metsakeskus.fi/rajapinnat/v1/forestusedeclaration/ows',
```

**Step 2: Add CODES.cuttingPurpose**

CUTTINGPURPOSE codes (from MKI form + sample data analysis). Add to CODES object:

```javascript
cuttingPurpose: {
    1: 'Kasvatushakkuu',
    2: 'Uudistushakkuu',
    3: 'Muu hakkuu',
    4: 'Erityishakkuu (6\u00a7)',
    5: 'Maank\u00e4ytt\u00f6muodon muutos',
    6: 'Mets\u00e4tuhoalue'
},
```

Note: CUTTINGREALIZATIONPRACTICE uses the same koodisto as existing `cuttingType`. Reuse `CODES.cuttingType` for display.

**Step 3: Add MKI_COLOR_MODES export**

After the COLOR_MODES export, add:

```javascript
export const MKI_COLOR_MODES = {
    year: {
        label: 'Vuoden mukaan',
        getColor: (p) => {
            const year = parseInt(p.DECLARATIONARRIVALYEAR) || 0;
            const currentYear = new Date().getFullYear();
            const age = currentYear - year;
            if (age <= 0) return '#e74c3c';
            if (age <= 1) return '#e67e22';
            if (age <= 2) return '#f39c12';
            if (age <= 3) return '#f1c40f';
            return '#fad7a0';
        },
        border: '#c0392b',
        legend: [
            { color: '#e74c3c', label: 'T\u00e4n\u00e4 vuonna' },
            { color: '#e67e22', label: '1 v sitten' },
            { color: '#f39c12', label: '2 v sitten' },
            { color: '#f1c40f', label: '3 v sitten' },
            { color: '#fad7a0', label: '4\u20135 v sitten' }
        ]
    },
    purpose: {
        label: 'Hakkuutarkoitus',
        getColor: (p) => {
            const c = Number(p.CUTTINGPURPOSE);
            if (c === 1) return '#3498db';
            if (c === 2) return '#e74c3c';
            if (c === 3) return '#f39c12';
            if (c === 4) return '#9b59b6';
            if (c === 5) return '#1abc9c';
            if (c === 6) return '#e67e22';
            return '#95a5a6';
        },
        border: '#555',
        legend: [
            { color: '#3498db', label: 'Kasvatushakkuu' },
            { color: '#e74c3c', label: 'Uudistushakkuu' },
            { color: '#f39c12', label: 'Muu hakkuu' },
            { color: '#9b59b6', label: 'Erityishakkuu' },
            { color: '#1abc9c', label: 'Maank\u00e4yt\u00f6n muutos' },
            { color: '#e67e22', label: 'Mets\u00e4tuhoalue' }
        ]
    }
};
```

**Step 4: Update KOODISTO.md**

Add MKI code sections at the end before the JavaScript section.

**Step 5: Commit**

```bash
git add js/config.js KOODISTO.md
git commit -m "feat: add MKI WFS config, codes, and color modes (#19)"
```

---

### Task 2: Add state management for MKI layer

**Files:**
- Modify: `js/state.js`

**Step 1: Add MKI state variables**

Add after `export let habitatLayer = null;`:

```javascript
export let mkiLayer = null;
export let mkiColorMode = 'year';
```

**Step 2: Add setState cases**

Add to the switch statement after the `habitatLayer` case:

```javascript
case 'mkiLayer': mkiLayer = value; break;
case 'mkiColorMode': mkiColorMode = value; break;
```

**Step 3: Commit**

```bash
git add js/state.js
git commit -m "feat: add MKI layer state (#19)"
```

---

### Task 3: Add WFS fetch function for MKI data

**Files:**
- Modify: `js/data.js`

**Step 1: Add fetchForestUseDeclarations function**

Add after the existing `fetchCadastralParcel` function (before `filterFeaturesByParcel`):

```javascript
/**
 * Fetch forest use declarations by bounding box (EPSG:3067)
 * Filtered to last 5 years
 */
export async function fetchForestUseDeclarations(bounds) {
    const minYear = new Date().getFullYear() - 5;
    const bbox = `${bounds.minX},${bounds.minY},${bounds.maxX},${bounds.maxY}`;

    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: 'v1:forestusedeclaration',
        outputFormat: 'application/json',
        srsName: 'EPSG:3067',
        bbox: bbox + ',EPSG:3067',
        CQL_FILTER: `DECLARATIONARRIVALYEAR >= '${minYear}'`
    });

    const url = `${CONFIG.mkiWfsUrl}?${params}`;
    console.log('Fetching MKI data:', url);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features || [];
}
```

**Step 2: Commit**

```bash
git add js/data.js
git commit -m "feat: add MKI WFS fetch function (#19)"
```

---

### Task 4: Add MKI layer styling

**Files:**
- Modify: `js/styles.js`

**Step 1: Update imports**

```javascript
import { COLOR_MODES, MKI_COLOR_MODES } from './config.js';
import { currentColorMode, mkiColorMode } from './state.js';
```

**Step 2: Add mkiStyle function after habitatStyle**

```javascript
export function mkiStyle(feature) {
    const mode = MKI_COLOR_MODES[mkiColorMode] || MKI_COLOR_MODES.year;
    return {
        fillColor: mode.getColor(feature.properties),
        weight: 2,
        opacity: 0.8,
        color: mode.border,
        fillOpacity: 0.5,
        dashArray: '4, 4'
    };
}
```

Note: `dashArray: '4, 4'` distinguishes MKI polygons from forest stand polygons visually.

**Step 3: Commit**

```bash
git add js/styles.js
git commit -m "feat: add MKI layer style function (#19)"
```

---

### Task 5: Add MKI popup, tooltip, and color mode UI functions

**Files:**
- Modify: `js/ui.js`

**Step 1: Update imports**

Add `MKI_COLOR_MODES` to config import:

```javascript
import { CODES, TOOLTIPS, COLOR_MODES, MKI_COLOR_MODES } from './config.js';
```

Add `mkiStyle` to styles import:

```javascript
import { featureStyle, mkiStyle } from './styles.js';
```

**Step 2: Add onEachMkiFeature function after onEachHabitat**

```javascript
/**
 * Attach popup and tooltip to each MKI feature
 */
export function onEachMkiFeature(feature, layer) {
    const p = feature.properties;
    const purpose = CODES.cuttingPurpose[p.CUTTINGPURPOSE] || `Koodi ${p.CUTTINGPURPOSE || '-'}`;
    const practice = CODES.cuttingType[p.CUTTINGREALIZATIONPRACTICE] || `Koodi ${p.CUTTINGREALIZATIONPRACTICE || '-'}`;
    const species = CODES.treeSpecies[p.DECLARATIONMAINTREESPECIES] || '-';
    const area = formatNumber(p.AREA, 2);
    const year = p.DECLARATIONARRIVALYEAR || '-';

    layer.bindPopup(
        '<strong>Mets\u00e4nk\u00e4ytt\u00f6ilmoitus</strong><br>' +
        '<span style="color:#c0392b;font-weight:600">' + purpose + '</span><br>' +
        'Hakkuutapa: ' + practice + '<br>' +
        'Pinta-ala: ' + area + ' ha<br>' +
        'Vuosi: ' + year + '<br>' +
        'Puulaji: ' + species
    );

    layer.bindTooltip(year + ' \u2013 ' + purpose, {
        sticky: true,
        direction: 'top',
        opacity: 0.9
    });
}
```

**Step 3: Add setMkiColorMode function after setColorMode**

```javascript
/**
 * Change MKI color mode and refresh layer styling + legend
 */
export function setMkiColorMode(mode) {
    if (!MKI_COLOR_MODES[mode]) return;
    state.setState('mkiColorMode', mode);

    if (state.mkiLayer) {
        state.mkiLayer.eachLayer(layer => {
            if (layer.feature) {
                layer.setStyle(mkiStyle(layer.feature));
            }
        });
    }

    updateMkiLegend();
}
```

**Step 4: Add updateMkiLegend function after updateLegend**

```javascript
/**
 * Update the MKI color legend display
 */
export function updateMkiLegend() {
    const legendEl = document.getElementById('mki-legend');
    if (!legendEl) return;

    const mode = MKI_COLOR_MODES[state.mkiColorMode];
    if (!mode || !state.mkiLayer || state.mkiLayer.getLayers().length === 0) {
        legendEl.classList.add('hidden');
        return;
    }

    legendEl.classList.remove('hidden');

    const title = document.createElement('div');
    title.className = 'legend-title';
    title.textContent = mode.label;

    const items = document.createElement('div');
    items.className = 'legend-items';
    mode.legend.forEach(item => {
        const el = document.createElement('div');
        el.className = 'legend-item';
        const color = document.createElement('span');
        color.className = 'legend-color';
        color.style.background = item.color;
        el.appendChild(color);
        el.appendChild(document.createTextNode(item.label));
        items.appendChild(el);
    });

    legendEl.replaceChildren(title, items);
}
```

**Step 5: Commit**

```bash
git add js/ui.js
git commit -m "feat: add MKI popup, tooltip, and color mode UI (#19)"
```

---

### Task 6: Add MKI HTML elements and CSS

**Files:**
- Modify: `index.html`
- Modify: `style.css`

**Step 1: Add MKI UI elements to index.html**

After the `<div id="color-legend" class="hidden"></div>` line (line 61), add:

```html
<!-- MKI color mode selector -->
<div id="mki-color-mode-control" class="hidden">
    <select id="mki-color-mode-select">
        <option value="year">Vuoden mukaan</option>
        <option value="purpose">Hakkuutarkoitus</option>
    </select>
</div>

<!-- MKI color legend -->
<div id="mki-legend" class="hidden"></div>
```

**Step 2: Add CSS for MKI controls in style.css**

After the `#color-legend.hidden` block, add:

```css
/* MKI color mode selector */
#mki-color-mode-control {
    position: absolute;
    bottom: 80px;
    left: 10px;
    z-index: 1000;
    background: white;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    padding: 6px;
}

#mki-color-mode-control.hidden {
    display: none;
}

#mki-color-mode-select {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 0.8rem;
    cursor: pointer;
    background: white;
    color: #333;
}

/* MKI legend */
#mki-legend {
    position: absolute;
    bottom: 80px;
    left: 180px;
    z-index: 1000;
    background: white;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    padding: 8px 10px;
    font-size: 0.75rem;
}

#mki-legend.hidden {
    display: none;
}
```

Note: MKI controls at `bottom: 80px` stack above the existing forest stand controls at `bottom: 40px`.

**Step 3: Add MKI controls to print hide list**

In the `@media print` section, add `#mki-color-mode-control, #mki-legend` to the hide list.

**Step 4: Commit**

```bash
git add index.html style.css
git commit -m "feat: add MKI HTML elements and CSS (#19)"
```

---

### Task 7: Wire up MKI layer in app.js

**Files:**
- Modify: `js/app.js`

This is the main integration task.

**Step 1: Update imports**

Add `mkiStyle` to styles import:

```javascript
import { featureStyle, cadastralStyle, selectedParcelStyle, highlightedStandStyle, habitatStyle, mkiStyle } from './styles.js';
```

Add `fetchForestUseDeclarations` to data import:

```javascript
import { fetchForestDataByBounds, fetchParcelsByReference, filterFeaturesByParcels, fetchForestUseDeclarations } from './data.js';
```

Add `onEachMkiFeature`, `setMkiColorMode`, `updateMkiLegend` to ui import:

```javascript
import { onEachFeature, onEachHabitat, onEachMkiFeature, onEachParcel, addParcelLabel, showSummary, updateLegend, setColorMode, setMkiColorMode, updateMkiLegend, copyParcelLink, downloadCSV, toggleHelp } from './ui.js';
```

**Step 2: Expose setMkiColorMode on window**

Add to the window exports:

```javascript
window.setMkiColorMode = setMkiColorMode;
```

**Step 3: Initialize MKI layer in initLayers()**

After the `habitatLayer` setState (line 133), add:

```javascript
state.setState('mkiLayer', L.geoJSON(null, {
    style: mkiStyle,
    onEachFeature: onEachMkiFeature,
    coordsToLatLng: coordsEPSG3067ToLatLng
}));
```

**Step 4: Update overlay control**

Replace the existing overlay control (lines 135-136):

```javascript
const overlayControl = L.control.layers(null, {
    'Luontokohteet': state.habitatLayer,
    'Mets\u00e4nk\u00e4ytt\u00f6ilmoitukset': state.mkiLayer
}, { position: 'topright' });
overlayControl.addTo(map);
```

**Step 5: Update overlayadd handler and add overlayremove**

Replace the existing overlayadd handler:

```javascript
map.on('overlayadd', (e) => {
    if (e.layer === state.habitatLayer) loadHabitatsInView();
    if (e.layer === state.mkiLayer) {
        loadMkiInView();
        document.getElementById('mki-color-mode-control').classList.remove('hidden');
    }
});

map.on('overlayremove', (e) => {
    if (e.layer === state.mkiLayer) {
        document.getElementById('mki-color-mode-control').classList.add('hidden');
        document.getElementById('mki-legend').classList.add('hidden');
    }
});
```

**Step 6: Update moveend handler in initEventListeners()**

```javascript
map.on('moveend', () => {
    loadParcelsInView();
    if (map.hasLayer(state.habitatLayer)) loadHabitatsInView();
    if (map.hasLayer(state.mkiLayer)) loadMkiInView();
});
```

**Step 7: Add MKI color mode event listener in initControls()**

```javascript
const mkiColorModeSelect = document.getElementById('mki-color-mode-select');
if (mkiColorModeSelect) {
    mkiColorModeSelect.addEventListener('change', (e) => setMkiColorMode(e.target.value));
}
```

**Step 8: Add loadMkiInView() function**

Add after `loadHabitatsInView`:

```javascript
/**
 * Load forest use declarations in the current map view
 */
async function loadMkiInView() {
    const map = state.map;
    const zoom = map.getZoom();

    if (zoom < CONFIG.minZoomForParcels) {
        state.mkiLayer.clearLayers();
        document.getElementById('mki-legend').classList.add('hidden');
        return;
    }

    const bounds = map.getBounds();
    const sw = proj4('WGS84', 'EPSG:3067', [bounds.getWest(), bounds.getSouth()]);
    const ne = proj4('WGS84', 'EPSG:3067', [bounds.getEast(), bounds.getNorth()]);

    try {
        const features = await fetchForestUseDeclarations({
            minX: sw[0], minY: sw[1], maxX: ne[0], maxY: ne[1]
        });
        state.mkiLayer.clearLayers();

        if (features.length > 0) {
            features.forEach(feature => state.mkiLayer.addData(feature));
        }

        updateMkiLegend();
    } catch (error) {
        console.warn('Failed to load MKI data:', error);
    }
}
```

**Step 9: Commit**

```bash
git add js/app.js
git commit -m "feat: wire up MKI layer, loading, and controls (#19)"
```

---

### Task 8: Update help modal and version

**Files:**
- Modify: `index.html` (help content + changelog)
- Modify: `version.js`

**Step 1: Add MKI to help features list**

In the help modal "Ominaisuudet" list, add after the "Luontokohteet" item:

```html
<li><strong>Mets\u00e4nk\u00e4ytt\u00f6ilmoitukset</strong> \u2014 Ilmoitetut hakkuualueet kartalla v\u00e4rikoodattuina (karttatasovalikko oikeassa yl\u00e4kulmassa)</li>
```

**Step 2: Add changelog entry**

Add at the top of the changelog:

```html
<div class="changelog-entry">
    <span class="changelog-version">v3.0.0</span>
    <span class="changelog-date">2026-03-05</span>
    <p>Mets\u00e4nk\u00e4ytt\u00f6ilmoitukset karttataso</p>
</div>
```

**Step 3: Update version.js**

```javascript
const VERSION = {
    number: '3.0.0',
    date: '2026-03-05',
    author: 'Tero R\u00f6nkk\u00f6'
};
```

**Step 4: Commit**

```bash
git add index.html version.js
git commit -m "feat: update help and version for MKI feature (v3.0.0, closes #19)"
```

---

### Task 9: Manual testing and verification

**No files to modify — manual testing only.**

**Step 1: Start the development server**

```bash
python3 -m http.server 8080
```

**Step 2: Verify basic MKI flow**

1. Open http://localhost:8080
2. Zoom in to level 14+ on any forested area
3. Open layer control (top right) — "Mets\u00e4nk\u00e4ytt\u00f6ilmoitukset" should appear
4. Enable MKI layer — colored dashed polygons should appear
5. MKI color mode dropdown should appear (bottom left, above forest controls)

**Step 3: Verify popups and tooltips**

6. Hover over an MKI polygon — tooltip shows year and purpose
7. Click an MKI polygon — popup shows all basic info

**Step 4: Verify color mode switching**

8. Switch to "Hakkuutarkoitus" — polygons recolor by purpose
9. Switch back to "Vuoden mukaan" — polygons recolor by year
10. Legend updates with each switch

**Step 5: Verify coexistence with other features**

11. Disable MKI layer — controls and legend hide
12. Select a parcel — forest data loads normally
13. Enable MKI while parcel selected — both visible, no overlap
14. Close parcel panel — MKI layer persists

**Step 6: Edge cases**

15. Zoom out below level 10 — MKI clears
16. Pan to area with no MKI data — no errors
17. Check console for errors

**Suggested test areas:** Suolahti (default center), central Finland forest areas
