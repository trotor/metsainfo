/**
 * Metsäinfo - Suomen metsävaratiedot kartalla
 *
 * Main application module: initialization, map setup, event handling
 */

import { CONFIG, crsEPSG3067 } from './config.js';
import * as state from './state.js';
import { coordsEPSG3067ToLatLng, getGeometryBounds3067, normalizeParcelId, formatCadastralReference } from './utils.js';
import { featureStyle, cadastralStyle, selectedParcelStyle, highlightedStandStyle, habitatStyle, mkiStyle } from './styles.js';
import { fetchForestDataByBounds, fetchParcelsByReference, filterFeaturesByParcels, fetchForestUseDeclarations } from './data.js';
import { onEachFeature, onEachHabitat, onEachMkiFeature, onEachParcel, addParcelLabel, showSummary, updateLegend, setColorMode, setMkiColorMode, updateMkiLegend, copyParcelLink, downloadCSV, toggleHelp } from './ui.js';

// Expose functions for HTML onclick handlers
window.copyParcelLink = copyParcelLink;
window.downloadCSV = downloadCSV;
window.setColorMode = setColorMode;
window.setMkiColorMode = setMkiColorMode;
window.toggleHelp = toggleHelp;

/**
 * Initialize the application
 */
function init() {
    initMap();
    initLayers();
    initControls();
    initEventListeners();
    checkUrlParams();
}

/**
 * Check URL parameters for parcel deep link (?parcel=091-416-0001-0123)
 */
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const parcelParam = params.get('parcel');
    if (parcelParam) {
        const normalizedId = normalizeParcelId(parcelParam);
        if (normalizedId) {
            document.getElementById('search-input').value = parcelParam;
            searchParcel();
        }
    }
}

/**
 * Update URL parameter with current parcel reference (without page reload)
 */
function updateUrlParam(reference) {
    const url = new URL(window.location);
    if (reference) {
        url.searchParams.set('parcel', formatCadastralReference(reference));
    } else {
        url.searchParams.delete('parcel');
    }
    history.replaceState(null, '', url);
}

/**
 * Initialize the Leaflet map with EPSG:3067 CRS for Finnish maps
 */
function initMap() {
    const map = L.map('map', {
        crs: crsEPSG3067,
        center: CONFIG.defaultCenter,
        zoom: CONFIG.defaultZoom,
        zoomControl: true,
        minZoom: 1,
        maxZoom: 15
    });

    state.setState('map', map);

    const attribution = 'Kartta: <a href="https://www.maanmittauslaitos.fi/" target="_blank">MML</a> / <a href="https://kartat.kapsi.fi/" target="_blank">Kapsi</a>';

    const taustakartta = L.tileLayer(CONFIG.layers.taustakartta, {
        attribution, maxZoom: 15, minZoom: 1
    });

    const peruskartta = L.tileLayer(CONFIG.layers.peruskartta, {
        attribution, maxZoom: 15, minZoom: 1
    });

    const ortokuva = L.tileLayer(CONFIG.layers.ortokuva, {
        attribution, maxZoom: 15, minZoom: 1
    });

    peruskartta.addTo(map);

    const baseLayers = {
        'Taustakartta': taustakartta,
        'Peruskartta': peruskartta,
        'Ortokuva': ortokuva
    };

    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(map);
}

/**
 * Initialize map layers
 */
function initLayers() {
    const map = state.map;

    state.setState('cadastralLayer', L.geoJSON(null, {
        style: cadastralStyle,
        onEachFeature: (feature, layer) => onEachParcel(feature, layer, selectParcel),
        coordsToLatLng: coordsEPSG3067ToLatLng
    }).addTo(map));

    state.setState('parcelLabelsLayer', L.layerGroup().addTo(map));

    state.setState('selectedParcelLayer', L.geoJSON(null, {
        style: selectedParcelStyle,
        coordsToLatLng: coordsEPSG3067ToLatLng
    }).addTo(map));

    state.setState('forestLayer', L.geoJSON(null, {
        style: featureStyle,
        onEachFeature: onEachFeature,
        coordsToLatLng: coordsEPSG3067ToLatLng
    }).addTo(map));

    state.setState('highlightedStandLayer', L.geoJSON(null, {
        style: highlightedStandStyle,
        coordsToLatLng: coordsEPSG3067ToLatLng
    }).addTo(map));

    state.setState('habitatLayer', L.geoJSON(null, {
        style: habitatStyle,
        onEachFeature: onEachHabitat,
        coordsToLatLng: coordsEPSG3067ToLatLng
    }));

    state.setState('mkiLayer', L.geoJSON(null, {
        style: mkiStyle,
        onEachFeature: onEachMkiFeature,
        coordsToLatLng: coordsEPSG3067ToLatLng
    }));

    const overlayControl = L.control.layers(null, {
        'Luontokohteet': state.habitatLayer,
        'Metsänkäyttöilmoitukset': state.mkiLayer
    }, { position: 'topright' });
    overlayControl.addTo(map);

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
}

/**
 * Initialize controls
 */
function initControls() {
    const searchToggle = document.getElementById('search-toggle');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    searchToggle.addEventListener('click', () => {
        searchForm.classList.toggle('hidden');
        if (!searchForm.classList.contains('hidden')) {
            searchInput.focus();
        }
    });

    document.addEventListener('click', (e) => {
        const searchControl = document.getElementById('search-control');
        if (!searchControl.contains(e.target) && !searchForm.classList.contains('hidden')) {
            searchForm.classList.add('hidden');
        }
    });

    // Color mode selector (moved from inline onchange in HTML)
    const colorModeSelect = document.getElementById('color-mode-select');
    if (colorModeSelect) {
        colorModeSelect.addEventListener('change', (e) => setColorMode(e.target.value));
    }

    const mkiColorModeSelect = document.getElementById('mki-color-mode-select');
    if (mkiColorModeSelect) {
        mkiColorModeSelect.addEventListener('change', (e) => setMkiColorMode(e.target.value));
    }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    const map = state.map;

    map.on('moveend', () => {
        loadParcelsInView();
        if (map.hasLayer(state.habitatLayer)) loadHabitatsInView();
        if (map.hasLayer(state.mkiLayer)) loadMkiInView();
    });

    loadParcelsInView();

    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('info-panel').classList.add('hidden');
        state.selectedParcelLayer.clearLayers();
        state.forestLayer.clearLayers();
        state.setState('currentParcel', null);
        updateUrlParam(null);
        document.getElementById('color-mode-control').classList.add('hidden');
        document.getElementById('color-legend').classList.add('hidden');
    });

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    searchButton.addEventListener('click', () => searchParcel());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchParcel();
    });
}

/**
 * Search for a parcel by cadastral reference
 */
async function searchParcel() {
    const input = document.getElementById('search-input').value.trim();
    const errorEl = document.getElementById('search-error');
    const button = document.getElementById('search-button');

    errorEl.classList.add('hidden');

    if (!input) {
        errorEl.textContent = 'Syötä kiinteistötunnus';
        errorEl.classList.remove('hidden');
        return;
    }

    const normalizedId = normalizeParcelId(input);
    if (!normalizedId) {
        errorEl.textContent = 'Virheellinen muoto. Käytä muotoa 91-416-1-123';
        errorEl.classList.remove('hidden');
        return;
    }

    button.disabled = true;
    button.textContent = 'Haetaan...';

    try {
        const parcels = await fetchParcelsByReference(normalizedId);

        if (parcels.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            parcels.forEach(parcel => {
                const bounds = getGeometryBounds3067(parcel.geometry);
                minX = Math.min(minX, bounds.minX);
                minY = Math.min(minY, bounds.minY);
                maxX = Math.max(maxX, bounds.maxX);
                maxY = Math.max(maxY, bounds.maxY);
            });

            const sw = proj4('EPSG:3067', 'WGS84', [minX, minY]);
            const ne = proj4('EPSG:3067', 'WGS84', [maxX, maxY]);
            state.map.fitBounds([[sw[1], sw[0]], [ne[1], ne[0]]], { maxZoom: 16, padding: [50, 50] });

            selectParcels(parcels);
        } else {
            errorEl.textContent = 'Kiinteistöä ei löytynyt';
            errorEl.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Search error:', error);
        errorEl.textContent = 'Haku epäonnistui. Yritä uudelleen.';
        errorEl.classList.remove('hidden');
    } finally {
        button.disabled = false;
        button.textContent = 'Hae';
    }
}

/**
 * Load cadastral parcels in the current map view
 */
async function loadParcelsInView() {
    const map = state.map;
    const zoom = map.getZoom();

    if (zoom < CONFIG.minZoomForParcels) {
        state.cadastralLayer.clearLayers();
        state.parcelLabelsLayer.clearLayers();
        state.loadedParcels.clear();
        return;
    }

    const bounds = map.getBounds();
    const sw = proj4('WGS84', 'EPSG:3067', [bounds.getWest(), bounds.getSouth()]);
    const ne = proj4('WGS84', 'EPSG:3067', [bounds.getEast(), bounds.getNorth()]);

    const bbox = `${sw[0]},${sw[1]},${ne[0]},${ne[1]},EPSG:3067`;

    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: 'cp:CadastralParcel',
        outputFormat: 'application/json',
        srsName: 'EPSG:3067',
        bbox: bbox
    });

    try {
        const response = await fetch(`${CONFIG.cadastralWfsUrl}?${params}`);
        if (!response.ok) return;

        const data = await response.json();

        if (data.features) {
            state.cadastralLayer.clearLayers();
            state.parcelLabelsLayer.clearLayers();
            state.loadedParcels.clear();

            data.features.forEach(feature => {
                const id = feature.properties?.nationalCadastralReference || feature.id;
                state.loadedParcels.set(id, feature);
                state.cadastralLayer.addData(feature);

                if (zoom >= 15) {
                    addParcelLabel(feature);
                }
            });
        }
    } catch (error) {
        console.warn('Failed to load parcels:', error);
    }
}

/**
 * Load habitat features in the current map view
 */
async function loadHabitatsInView() {
    const map = state.map;
    const zoom = map.getZoom();

    if (zoom < CONFIG.minZoomForParcels) {
        state.habitatLayer.clearLayers();
        return;
    }

    const bounds = map.getBounds();
    const sw = proj4('WGS84', 'EPSG:3067', [bounds.getWest(), bounds.getSouth()]);
    const ne = proj4('WGS84', 'EPSG:3067', [bounds.getEast(), bounds.getNorth()]);

    const bbox = `${sw[0]},${sw[1]},${ne[0]},${ne[1]},EPSG:3067`;

    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: 'v1:habitat',
        outputFormat: 'application/json',
        srsName: 'EPSG:3067',
        bbox: bbox
    });

    try {
        const response = await fetch(`${CONFIG.habitatWfsUrl}?${params}`);
        if (!response.ok) return;

        const data = await response.json();
        state.habitatLayer.clearLayers();

        if (data.features) {
            data.features.forEach(feature => state.habitatLayer.addData(feature));
        }
    } catch (error) {
        console.warn('Failed to load habitats:', error);
    }
}

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

/**
 * Select a parcel and load its forest data (fetches all parts with same reference)
 */
async function selectParcel(parcel) {
    const reference = parcel.properties?.nationalCadastralReference;

    if (reference) {
        try {
            const allParts = await fetchParcelsByReference(reference);
            if (allParts.length > 1) {
                selectParcels(allParts);
                return;
            }
        } catch (error) {
            console.warn('Failed to fetch additional parcel parts:', error);
        }
    }

    selectParcels([parcel]);
}

/**
 * Select multiple parcels (parcel parts) and load their forest data
 */
async function selectParcels(parcels) {
    const panel = document.getElementById('info-panel');
    const loading = document.getElementById('loading');
    const content = document.getElementById('info-content');

    panel.classList.remove('hidden');
    loading.classList.remove('hidden');
    content.innerHTML = '';

    state.selectedParcelLayer.clearLayers();
    state.forestLayer.clearLayers();

    parcels.forEach(parcel => state.selectedParcelLayer.addData(parcel));

    const reference = parcels[0]?.properties?.nationalCadastralReference;
    if (reference) {
        updateUrlParam(reference);
    }

    const currentParcel = parcels.length === 1 ? parcels[0] : {
        properties: parcels[0].properties,
        parts: parcels
    };
    state.setState('currentParcel', currentParcel);

    try {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        parcels.forEach(parcel => {
            const bounds = getGeometryBounds3067(parcel.geometry);
            minX = Math.min(minX, bounds.minX);
            minY = Math.min(minY, bounds.minY);
            maxX = Math.max(maxX, bounds.maxX);
            maxY = Math.max(maxY, bounds.maxY);
        });

        const combinedBounds = { minX, minY, maxX, maxY };

        const features = await fetchForestDataByBounds(combinedBounds);

        const filteredFeatures = filterFeaturesByParcels(features, parcels);
        state.setState('currentFeatures', filteredFeatures);

        loading.classList.add('hidden');

        if (filteredFeatures.length > 0) {
            filteredFeatures.forEach(f => state.forestLayer.addData(f));
        }

        const colorControl = document.getElementById('color-mode-control');
        if (filteredFeatures.length > 0) {
            colorControl.classList.remove('hidden');
            updateLegend();
        } else {
            colorControl.classList.add('hidden');
            document.getElementById('color-legend').classList.add('hidden');
        }

        showSummary(filteredFeatures, currentParcel, parcels.length);

    } catch (error) {
        loading.classList.add('hidden');
        console.error('Error fetching forest data:', error);
        content.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">⚠️</div>
                <p>Metsätietojen haku epäonnistui.</p>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
