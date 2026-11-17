/**
 * Metsäinfo - Suomen metsävaratiedot kartalla
 *
 * Main application module: initialization, map setup, event handling
 */

// Vendor-kirjastot globaaleiksi — tämän on oltava ensimmäinen tuonti,
// koska config.js käyttää proj4:ää ja L:ää latausaikana
import './vendor/index.js';

// Omat tyylit vendorin jälkeen, jotta ne ohittavat Leafletin oletukset
// samalla tavalla kuin CDN-aikana (leaflet.css ennen style.css:ää)
import '../style.css';

import { CONFIG, crsEPSG3067 } from './config.js';
import { isNative, platformName, PUBLIC_BASE_URL } from './platform/index.js';
import { onBackButton, onAppResume } from './platform/back-button.js';
import { createBackHandler } from './ui/back.js';
import { closeMenu, getSheet } from './ui/panel.js';
import { purchases } from './platform/purchases.js';
import { expandBbox, bboxContains } from './viewport.js';

// Kiinteistörajat haetaan näkymää laajemmalta alueelta (25 % joka suuntaan)
// zoomitasolta 13 alkaen. Uusi haku vain, kun näkymä menee alueen
// ulkopuolelle tai tunnusten näyttöraja (zoom 15) ylittyy. MML palauttaa
// enintään 2000 kiinteistöä, joten pienillä zoomeilla ei laajenneta eikä
// katkaistua tulosta tallenneta.
const PARCEL_FETCH_MARGIN = 0.25;
const PARCEL_MARGIN_MIN_ZOOM = 13;
const PARCEL_WFS_LIMIT = 2000;
let lastParcelFetch = null; // { bbox, labels }
import * as state from './state.js';
import { on, emit, VIESTIT } from './vayla.js';
import { T as UI } from './ui/teksti.js';
import { showToast } from './ui/location-ui.js';
import { KUVAUSTILA, loadEsimerkkimetsa, createKuvitteellinenKartta, startKuvausohjaus } from './demo/kuvaustila.js';
import { coordsEPSG3067ToLatLng, getGeometryBounds3067, normalizeParcelId, formatCadastralReference } from './utils.js';
import { featureStyle, cadastralStyle, selectedParcelStyle, highlightedStandStyle, habitatStyle, mkiStyle } from './styles.js';
import { fetchForestDataByBounds, fetchParcelsByReference, filterFeaturesByParcels, fetchForestUseDeclarations, fetchParcelContaining } from './data.js';
import { onEachFeature, onEachHabitat, onEachMkiFeature, onEachParcel, addParcelLabel, showSummary, updateLegend, setColorMode, setMkiColorMode, updateMkiLegend, copyParcelLink, downloadCSV, toggleHelp, initPanel, openPanelForSelection, setPeekMessage, mapFitOptions, initLocation, refreshHereRow } from './ui/index.js';
import { applyPageTexts } from './ui/sivu.js';

// Kuviovalinnan tila (kokeilu, VIESTIT.valintatila)
let valintatila = false;

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
    applyPageTexts();
    // Kokeilubuildin näkyvä versio on oma (version.js kokeilu, esim. 4.0.903), jotta
    // testaaja näkee saman numeron kuin TestFlightissa
    if (import.meta.env?.VITE_KOKEILU === '1' && typeof VERSION !== 'undefined' && VERSION.kokeilu) {
        VERSION.number = VERSION.kokeilu;
        const badge = document.getElementById('version-badge');
        if (badge) badge.textContent = 'v' + VERSION.number;
    }
    if (isNative()) initNative();
    initMap();
    initLayers();
    initControls();
    initPanel({ onClearSelection: clearSelection });
    initLocation({ selectParcel });
    initEventListeners();
    checkUrlParams();
    // Kokeilutoiminnot vain kokeilubuildissa (TestFlight, kehitys). Tavallinen
    // build karsii haaran ja dynaamisen importin pois kokonaan.
    if (import.meta.env?.VITE_KOKEILU === '1') {
        on(VIESTIT.avaaKohta, ({ points }) => openParcelAtFirst(points)
            .then(ok => { if (!ok) showToast(UI.sovellus.eiLoytynyt); })
            .catch(() => showToast(UI.sovellus.hakuEpaonnistui)));
        on(VIESTIT.avaaKiinteisto, ({ reference }) => openParcelByReference(reference)
            .then(ok => { if (!ok) showToast(UI.sovellus.eiLoytynyt); })
            .catch(() => showToast(UI.sovellus.hakuEpaonnistui)));
        on(VIESTIT.valintatila, ({ paalla }) => { valintatila = Boolean(paalla); });
        on(VIESTIT.naytaValinta, ({ features, parcel }) => showSelection(features, parcel));
        // Ladataan rinnakkain, käynnistetään aina samassa järjestyksessä (karttapainikkeet)
        Promise.all([
            import('./maasto/index.js'), import('./lahihaku/index.js'), import('./suosikit/index.js'),
            import('./korkeusmalli/index.js'), import('./asetukset/index.js'), import('./saavutettavuus/index.js'),
            import('./valinta/index.js'), import('./rajoitteet/index.js'), import('./retkeily/index.js')
        ]).then(([maasto, lahihaku, suosikit, korkeusmalli, asetukset, saavutettavuus, valinta, rajoitteet, retkeily]) => {
            maasto.startMaasto();
            lahihaku.startLahihaku();
            suosikit.startSuosikit();
            korkeusmalli.startKorkeusmalli();
            asetukset.startAsetukset();
            saavutettavuus.startSaavutettavuus();
            valinta.startValinta();
            rajoitteet.startRajoitteet();
            retkeily.startRetkeily();
        });
    }
}

/**
 * iOS-sovelluksen erot verkkoversioon: tulostus piiloon (WKWebView ei tue
 * window.print()), linkki jaetaan jakonäkymällä, ja tietosuojaseloste
 * avataan julkisesta osoitteesta Safariin.
 */
function initNative() {
    document.documentElement.classList.add('is-native');
    // Sama versio kuin verkossa ja kaupoissa
    const appVersion = document.getElementById('app-version');
    if (appVersion && typeof VERSION !== 'undefined') appVersion.textContent = VERSION.number;
    const copyItem = document.querySelector('#sheet-menu [data-action="copy"]');
    if (copyItem) copyItem.textContent = UI.sovellus.jaaLinkki;
    document.querySelectorAll('a[href="tietosuoja.html"]').forEach(a => {
        a.href = new URL('tietosuoja.html', PUBLIC_BASE_URL).href;
    });
    onBackButton(createBackHandler({ toggleHelp, closeMenu, getSheet }));
    // Hinta-arvion ostotila kaupasta (tallennettu tila on käytössä heti);
    // tarkistetaan myös, kun sovellus palaa etualalle
    if (purchases.isAvailable()) document.documentElement.classList.add('has-estimate');
    // Ohjeen kauppakohtaiset tekstit (App Store / Google Play)
    document.documentElement.classList.add(`platform-${platformName()}`);
    purchases.refreshEntitlement();
    onAppResume(() => purchases.refreshEntitlement());
}

/**
 * Check URL parameters for parcel deep link (?parcel=091-416-0001-0123)
 */
function checkUrlParams() {
    if (KUVAUSTILA) {
        showEsimerkkimetsa();
        startKuvausohjaus();
        return;
    }
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

/** Kuvaustila: kuvitteellinen Esimerkkimetsä valitaan heti käynnistyksessä. */
async function showEsimerkkimetsa() {
    const { parcel } = await loadEsimerkkimetsa();
    document.getElementById('search-input').value = parcel.properties.label;
    const b = getGeometryBounds3067(parcel.geometry);
    const sw = proj4('EPSG:3067', 'WGS84', [b.minX, b.minY]);
    const ne = proj4('EPSG:3067', 'WGS84', [b.maxX, b.maxY]);
    state.map.fitBounds([[sw[1], sw[0]], [ne[1], ne[0]]], mapFitOptions({ maxZoom: 16 }, { newSelection: true }));
    selectParcels([parcel]);
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

    if (KUVAUSTILA) {
        // Kauppakuvat: ei oikeaa karttaa, vain kuvitteellinen saari
        const saari = createKuvitteellinenKartta(map, coordsEPSG3067ToLatLng).addTo(map);
        state.setState('layersControl', L.control.layers({ [UI.sovellus.kuvitteellinenKartta]: saari }, null, { position: 'topright' }).addTo(map));
        map.attributionControl.addAttribution(UI.sovellus.kuvitteellinenKartta);
        return;
    }

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
        [UI.sovellus.taustakartta]: taustakartta,
        [UI.sovellus.peruskartta]: peruskartta,
        [UI.sovellus.ortokuva]: ortokuva
    };

    // Yksi tasovalitsin: pohjakartat tässä, päälle kytkettävät tasot initLayersissa
    state.setState('layersControl', L.control.layers(baseLayers, null, { position: 'topright' }).addTo(map));
}

/**
 * Initialize map layers
 */
function initLayers() {
    const map = state.map;

    state.setState('cadastralLayer', L.geoJSON(null, {
        style: cadastralStyle,
        // Kuviovalinnan tilassa napautus valitsee kuvioita, ei kiinteistöä
        onEachFeature: (feature, layer) => onEachParcel(feature, layer, (f) => { if (!valintatila) selectParcel(f); }),
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

    state.layersControl.addOverlay(state.habitatLayer, UI.sovellus.luontokohteet);
    state.layersControl.addOverlay(state.mkiLayer, UI.sovellus.metsankayttoilmoitukset);

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

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    searchButton.addEventListener('click', () => searchParcel());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchParcel();
    });
}

/**
 * Clear the parcel selection: hide panel, map highlights and URL parameter
 */
function clearSelection() {
    document.getElementById('info-panel').classList.add('hidden');
    state.selectedParcelLayer.clearLayers();
    state.forestLayer.clearLayers();
    state.setState('currentParcel', null);
    updateUrlParam(null);
    document.getElementById('color-mode-control').classList.add('hidden');
    document.getElementById('color-legend').classList.add('hidden');
    state.setState('currentFeatures', []);
    refreshHereRow();
    emit(VIESTIT.tyhjennys);
}

/**
 * Search for a parcel by cadastral reference
 */
/** Hakee kiinteistön tunnuksella, kohdistaa kartan ja valitsee sen. false, jos ei löytynyt. */
async function openParcelByReference(reference) {
    const parcels = await fetchParcelsByReference(reference);
    if (!parcels.length) return false;
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
    state.map.fitBounds([[sw[1], sw[0]], [ne[1], ne[0]]], mapFitOptions({ maxZoom: 16 }, { newSelection: true }));
    selectParcels(parcels);
    return true;
}

/** Kiinteistö, jolla piste [x, y] (EPSG:3067) on; false, jos pisteessä ei ole kiinteistöä. */
async function openParcelAtPoint([x, y]) {
    const parcel = await fetchParcelContaining(x, y);
    if (!parcel) return false;
    const reference = parcel.properties?.nationalCadastralReference;
    return reference ? openParcelByReference(reference) : (selectParcels([parcel]), true);
}

async function openParcelAtFirst(points = []) {
    for (const p of points.filter(Boolean)) {
        if (await openParcelAtPoint(p)) return true;
    }
    return false;
}

async function searchParcel() {
    const input = document.getElementById('search-input').value.trim();
    const errorEl = document.getElementById('search-error');
    const button = document.getElementById('search-button');

    errorEl.classList.add('hidden');

    if (!input) {
        errorEl.textContent = UI.sovellus.syotaTunnus;
        errorEl.classList.remove('hidden');
        return;
    }

    const normalizedId = normalizeParcelId(input);
    if (!normalizedId) {
        errorEl.textContent = UI.sovellus.virheellinenMuoto;
        errorEl.classList.remove('hidden');
        return;
    }

    button.disabled = true;
    button.textContent = UI.sovellus.haetaan;

    try {
        if (!(await openParcelByReference(normalizedId))) {
            errorEl.textContent = UI.sovellus.eiLoytynyt;
            errorEl.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Search error:', error);
        errorEl.textContent = UI.sovellus.hakuEpaonnistuiYrita;
        errorEl.classList.remove('hidden');
    } finally {
        button.disabled = false;
        button.textContent = UI.sovellus.hae;
    }
}

/**
 * Load cadastral parcels in the current map view
 */
async function loadParcelsInView() {
    const map = state.map;
    const zoom = map.getZoom();

    if (KUVAUSTILA) {
        // Vain kuvitteellinen tila, ei naapureiden oikeita rajoja tai tunnuksia
        const { parcel } = await loadEsimerkkimetsa();
        state.cadastralLayer.clearLayers();
        state.parcelLabelsLayer.clearLayers();
        state.loadedParcels.clear();
        if (zoom < CONFIG.minZoomForParcels) return;
        state.loadedParcels.set(parcel.properties.nationalCadastralReference, parcel);
        state.cadastralLayer.addData(parcel);
        if (zoom >= 15) addParcelLabel(parcel);
        return;
    }

    if (zoom < CONFIG.minZoomForParcels) {
        state.cadastralLayer.clearLayers();
        state.parcelLabelsLayer.clearLayers();
        state.loadedParcels.clear();
        lastParcelFetch = null;
        return;
    }

    const bounds = map.getBounds();
    const sw = proj4('WGS84', 'EPSG:3067', [bounds.getWest(), bounds.getSouth()]);
    const ne = proj4('WGS84', 'EPSG:3067', [bounds.getEast(), bounds.getNorth()]);
    const view = { minX: sw[0], minY: sw[1], maxX: ne[0], maxY: ne[1] };
    const labels = zoom >= 15;

    if (lastParcelFetch && lastParcelFetch.labels === labels && bboxContains(lastParcelFetch.bbox, view)) {
        return;
    }

    const fetchBox = zoom >= PARCEL_MARGIN_MIN_ZOOM ? expandBbox(view, PARCEL_FETCH_MARGIN) : view;
    const bbox = `${fetchBox.minX},${fetchBox.minY},${fetchBox.maxX},${fetchBox.maxY},EPSG:3067`;

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
            lastParcelFetch = data.features.length < PARCEL_WFS_LIMIT ? { bbox: fetchBox, labels } : null;
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

            // Paikannuksen automaattinen kiinteistövalinta odottaa rajoja
            document.dispatchEvent(new CustomEvent('parcels-loaded'));
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

    if (KUVAUSTILA || zoom < CONFIG.minZoomForParcels) {
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

    if (KUVAUSTILA || zoom < CONFIG.minZoomForParcels) {
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
async function selectParcel(parcel, { auto = false } = {}) {
    const reference = parcel.properties?.nationalCadastralReference;

    if (reference && !parcel.properties?.esimerkki) {
        try {
            const allParts = await fetchParcelsByReference(reference);
            // Paikannuksen automaattivalinta ei ohita käyttäjän omaa valintaa,
            // joka ehti tulla haun aikana
            if (auto && state.currentParcel) return;
            if (allParts.length > 1) {
                selectParcels(allParts);
                return;
            }
        } catch (error) {
            console.warn('Failed to fetch additional parcel parts:', error);
        }
    }

    if (auto && state.currentParcel) return;
    selectParcels([parcel]);
}

/**
 * Kuviovalinta (kokeilu): valitut kuviot yhteenvetona kuten kiinteistö.
 * parcel on valinnan näennäiskiinteistö (properties.valinta, parts =
 * kuviot Feature-muotoisina); kiinteistö- ja kuviohakuja ei tehdä.
 */
function showSelection(features, parcel) {
    openPanelForSelection();
    document.getElementById('loading').classList.add('hidden');
    state.selectedParcelLayer.clearLayers();
    state.forestLayer.clearLayers();
    parcel.parts.forEach(part => state.selectedParcelLayer.addData(part));
    updateUrlParam(null);
    state.setState('currentParcel', parcel);
    state.setState('currentFeatures', features);
    features.forEach(f => state.forestLayer.addData(f));
    const colorControl = document.getElementById('color-mode-control');
    colorControl.classList.toggle('hidden', features.length === 0);
    if (features.length > 0) updateLegend();
    else document.getElementById('color-legend').classList.add('hidden');
    showSummary(features, parcel, 1);
    refreshHereRow();
}

/**
 * Select multiple parcels (parcel parts) and load their forest data
 */
async function selectParcels(parcels) {
    const loading = document.getElementById('loading');
    const content = document.getElementById('info-content');

    openPanelForSelection();
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

        const features = KUVAUSTILA && parcels[0]?.properties?.esimerkki
            ? (await loadEsimerkkimetsa()).features
            : await fetchForestDataByBounds(combinedBounds);

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
        refreshHereRow();

    } catch (error) {
        loading.classList.add('hidden');
        setPeekMessage(UI.sovellus.metsatietojenHakuEpaonnistui);
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
