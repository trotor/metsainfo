/**
 * Metsäinfo - Suomen metsävaratiedot kartalla
 *
 * Käyttää:
 * - Metsäkeskuksen avointa WFS-rajapintaa metsävaratietoihin
 * - MML INSPIRE WFS kiinteistötietoihin
 */

// Define EPSG:3067 (ETRS-TM35FIN) projection for Proj4 (used for coordinate conversion)
proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// EPSG:3067 CRS for Leaflet (MML/Kapsi tile grid)
const crsEPSG3067 = new L.Proj.CRS(
    'EPSG:3067',
    '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    {
        origin: [-548576, 8388608],
        resolutions: [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
        bounds: L.bounds([-548576, 8388608], [1548576, 6291456])
    }
);

// Configuration
const CONFIG = {
    // Default center in WGS84 (lat, lng) - 2km east of Suolahti
    defaultCenter: [62.57, 25.90],
    defaultZoom: 5,
    minZoomForParcels: 10, // Minimum zoom level to load parcels (adjusted for EPSG:3067)

    // WFS endpoint for forest data
    wfsUrl: 'https://avoin.metsakeskus.fi/rajapinnat/v1/stand/ows',

    // MML INSPIRE WFS for cadastral parcels
    cadastralWfsUrl: 'https://inspire-wfs.maanmittauslaitos.fi/inspire-wfs/cp/ows',

    // Map layers (Kapsi EPSG:3067)
    layers: {
        taustakartta: 'https://tiles.kartat.kapsi.fi/taustakartta_3067/{z}/{x}/{y}.jpg',
        peruskartta: 'https://tiles.kartat.kapsi.fi/peruskartta_3067/{z}/{x}/{y}.jpg',
        ortokuva: 'https://tiles.kartat.kapsi.fi/ortokuva_3067/{z}/{x}/{y}.jpg'
    }
};

// Code mappings for forest data
const CODES = {
    treeSpecies: {
        1: 'Mänty', 2: 'Kuusi', 3: 'Rauduskoivu', 4: 'Hieskoivu', 5: 'Haapa',
        6: 'Harmaaleppä', 7: 'Tervaleppä', 8: 'Muu havupuu', 9: 'Muu lehtipuu',
        10: 'Douglaskuusi', 11: 'Kataja', 12: 'Kontortamänty', 13: 'Kynäjalava',
        14: 'Lehtikuusi', 15: 'Metsälehmus', 16: 'Mustakuusi', 17: 'Paju',
        18: 'Pihlaja', 19: 'Pihta', 20: 'Raita', 21: 'Saarni', 22: 'Sembramänty',
        23: 'Serbiankuusi', 24: 'Tammi', 25: 'Tuomi', 26: 'Vaahtera', 27: 'Visakoivu',
        28: 'Vuorijalava', 29: 'Lehtipuu', 30: 'Havupuu'
    },
    cuttingType: {
        0: 'Määräaikainen lepo', 1: 'Ylispuiden poisto', 2: 'Ensiharvennus',
        3: 'Harvennus', 4: 'Kaistalehakkuu', 5: 'Avohakkuu', 6: 'Verhopuuhakkuu',
        7: 'Suojuspuuhakkuu', 8: 'Siemenpuuhakkuu', 9: 'Erikoishakkuu',
        11: 'Yläharvennus', 12: 'Väljennyshakkuu', 13: 'Kunnostushakkuu',
        14: 'Poimintahakkuu', 15: 'Pienaukkohakkuu', 20: 'Energiapuuharvennus',
        90: 'Maankäyttömuodon muutoshakkuu', 91: 'Erityishakkuu (6§)',
        92: 'Muu hakkuu', 93: 'Uudistushakkuu tuhoalueella', 94: 'Kasvatushakkuu tuhoalueella'
    },
    silvicultureType: {
        1: 'Taimikon perustaminen', 2: 'Taimikon varhaishoito', 3: 'Taimikon hoito',
        4: 'Nuoren metsän hoito', 5: 'Muut hoitotyöt'
    },
    fertilityClass: {
        1: 'Lehto', 2: 'Lehtomainen kangas', 3: 'Tuore kangas', 4: 'Kuivahko kangas',
        5: 'Kuiva kangas', 6: 'Karukkokangas', 7: 'Kalliomaa/hietikko', 8: 'Lakimetsä/tunturi'
    },
    soilType: {
        10: 'Keskikarkea/karkea kangasmaa', 11: 'Karkea moreeni', 12: 'Karkea lajittunut',
        20: 'Hienojakoinen kangasmaa', 21: 'Hienoainesmoreeni', 22: 'Hienojakoinen lajittunut',
        23: 'Silttipitoinen maalaji', 24: 'Savimaa', 30: 'Kivinen keskikarkea kangasmaa',
        31: 'Kivinen karkea moreeni', 32: 'Kivinen karkea lajittunut',
        40: 'Kivinen hienojakoinen kangasmaa', 50: 'Kallio/kivikko',
        60: 'Turvemaa', 61: 'Saraturve', 62: 'Rahkaturve', 63: 'Puuvaltainen turve',
        64: 'Eroosioherkkä saraturve', 65: 'Eroosioherkkä rahkaturve',
        66: 'Maatumaton saraturve', 67: 'Maatumaton rahkaturve', 70: 'Multamaa', 80: 'Liejumaa'
    },
    developmentClass: {
        'A0': 'Aukea', 'S0': 'Siemenpuumetsikkö', 'Y1': 'Ylispuustoinen taimikko',
        '02': 'Nuori kasvatusmetsikkö', '03': 'Varttunut kasvatusmetsikkö',
        '04': 'Uudistuskypsä metsikkö', '05': 'Suojuspuumetsikkö',
        'T1': 'Taimikko (alle 1,3 m)', 'T2': 'Taimikko (yli 1,3 m)', 'ER': 'Eri-ikäisrakenteinen'
    },
    drainageState: {
        1: 'Ojittamaton kangas', 2: 'Soistunut kangas', 3: 'Ojitettu kangas',
        6: 'Luonnontilainen suo', 7: 'Ojikko', 8: 'Muuttuma', 9: 'Turvekangas'
    },
    accessibility: {
        1: 'Ympärivuotinen', 2: 'Sulan maan (ei kelirikko)', 3: 'Kuivana kautena',
        4: 'Vain maa jäässä', 5: 'Ei määritelty'
    },
    mainGroup: {
        1: 'Metsämaa', 2: 'Kitumaa', 3: 'Joutomaa', 4: 'Muu metsätalousmaa',
        5: 'Tontti', 6: 'Maatalousmaa', 7: 'Muu maa', 8: 'Vesistö'
    }
};

// Application state
let map = null;
let forestLayer = null;
let cadastralLayer = null;      // All parcels in view
let selectedParcelLayer = null; // Selected/highlighted parcel
let parcelLabelsLayer = null;   // Labels for parcel IDs
let highlightedStandLayer = null; // Highlighted individual stand
let clickMarker = null;
let currentFeatures = [];
let currentParcel = null;
let selectedStandIndex = null;  // Currently selected stand index
let loadedParcels = new Map();  // Cache loaded parcels by ID
let currentColorMode = 'volume'; // Color mode: volume, age, species, devclass

// Tooltip explanations for forestry terms
const TOOLTIPS = {
    kuvio: 'Metsikkökuvio on yhtenäinen metsäalue, jolla puusto ja kasvupaikka ovat samankaltaisia.',
    tilavuus: 'Puuston tilavuus hehtaarilla (m³/ha). Sisältää kaikki puutavaralajit.',
    puulajijakauma: 'Puulajien osuudet pinta-alalla painotettuna. Perustuu laserkeilaukseen.',
    keskiIka: 'Puuston pohjapinta-alalla painotettu keski-ikä vuosina.',
    keskipituus: 'Puuston pohjapinta-alalla painotettu keskipituus metreinä.',
    keskilapimitta: 'Puuston pohjapinta-alalla painotettu keskiläpimitta rinnankorkeudelta (1,3 m) senttimetreinä.',
    kasvu: 'Puuston vuotuinen tilavuuskasvu hehtaarilla (m³/ha/v).',
    tukkipuu: 'Sahateollisuuden raaka-aine. Tyvilläpimitta yleensä yli 15 cm (mänty) tai 16 cm (kuusi).',
    kuitupuu: 'Sellu- ja paperiteollisuuden raaka-aine. Pienempiläpimittaista puuta kuin tukkipuu.',
    pohjapintaAla: 'Puunrunkojen yhteenlaskettu poikkileikkauspinta-ala rinnankorkeudella (1,3 m), yksikkö m²/ha.',
    runkoluku: 'Puiden lukumäärä hehtaarilla.',
    kehitysluokka: 'Metsikön kehitysvaihe: aukea, taimikko, kasvatusmetsä, uudistuskypsä jne.',
    kasvupaikka: 'Maaperän ravinteisuuteen perustuva luokitus. Lehto on ravinteikkain, karukkokangas karujen.',
    maalaji: 'Maaperän laatu: kivennäismaa (hiekka, moreeni) tai turvemaa (rahka, sara).',
    ojitustilanne: 'Metsämaan kuivatustilanne: ojittamaton, ojitettu tai ojikko.',
    kulkukelpoisuus: 'Metsäkoneiden kulkumahdollisuus: ympärivuotinen, kesä/talvi, tai vain jäätynyt maa.',
    hakkuuehdotus: 'Metsäkeskuksen laskennallinen ehdotus hakkuutarpeesta. Ei korvaa metsäammattilaisen arviota.',
    metsanhoitoehdotus: 'Metsäkeskuksen laskennallinen ehdotus hoitotarpeesta, esim. taimikonhoito tai pystykarsinta.'
};

/**
 * Generate tooltip HTML for a term
 */
function tip(key) {
    const text = TOOLTIPS[key];
    if (!text) return '';
    return `<span class="info-tip" tabindex="0" aria-label="${text}"><span class="info-tip-icon">i</span><span class="info-tip-text">${text}</span></span>`;
}

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
            // Set search input and trigger search
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
 * Copy shareable link to clipboard
 */
function copyParcelLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copy-link-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Kopioitu!';
        setTimeout(() => { btn.textContent = originalText; }, 2000);
    });
}

/**
 * Initialize the Leaflet map with EPSG:3067 CRS for Finnish maps
 */
function initMap() {
    map = L.map('map', {
        crs: crsEPSG3067,
        center: CONFIG.defaultCenter,
        zoom: CONFIG.defaultZoom,
        zoomControl: true,
        minZoom: 1,
        maxZoom: 15
    });

    const attribution = 'Kartta: <a href="https://www.maanmittauslaitos.fi/" target="_blank">MML</a> / <a href="https://kartat.kapsi.fi/" target="_blank">Kapsi</a>';

    // Base layers
    const taustakartta = L.tileLayer(CONFIG.layers.taustakartta, {
        attribution: attribution,
        maxZoom: 15,
        minZoom: 1
    });

    const peruskartta = L.tileLayer(CONFIG.layers.peruskartta, {
        attribution: attribution,
        maxZoom: 15,
        minZoom: 1
    });

    const ortokuva = L.tileLayer(CONFIG.layers.ortokuva, {
        attribution: attribution,
        maxZoom: 15,
        minZoom: 1
    });

    // Add default layer
    peruskartta.addTo(map);

    // Layer control
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
    // Cadastral parcels layer (loaded from WFS)
    cadastralLayer = L.geoJSON(null, {
        style: cadastralStyle,
        onEachFeature: onEachParcel,
        coordsToLatLng: coordsEPSG3067ToLatLng
    }).addTo(map);

    // Parcel labels layer
    parcelLabelsLayer = L.layerGroup().addTo(map);

    // Selected parcel layer (highlighted)
    selectedParcelLayer = L.geoJSON(null, {
        style: selectedParcelStyle,
        coordsToLatLng: coordsEPSG3067ToLatLng
    }).addTo(map);

    // Forest stands layer (GeoJSON, populated on parcel click)
    forestLayer = L.geoJSON(null, {
        style: featureStyle,
        onEachFeature: onEachFeature,
        coordsToLatLng: coordsEPSG3067ToLatLng
    }).addTo(map);

    // Highlighted individual stand layer
    highlightedStandLayer = L.geoJSON(null, {
        style: highlightedStandStyle,
        coordsToLatLng: coordsEPSG3067ToLatLng
    }).addTo(map);
}

/**
 * Style for highlighted individual stand
 */
function highlightedStandStyle(feature) {
    return {
        fillColor: '#f39c12',
        weight: 4,
        opacity: 1,
        color: '#e67e22',
        fillOpacity: 0.7
    };
}

/**
 * Style for all cadastral parcels (boundaries always visible)
 */
function cadastralStyle(feature) {
    return {
        color: '#8B4513',
        weight: 2,
        opacity: 0.7,
        fillColor: 'transparent',
        fillOpacity: 0,
        interactive: true
    };
}

/**
 * Style for selected/highlighted parcel
 */
function selectedParcelStyle(feature) {
    return {
        color: '#e74c3c',
        weight: 4,
        opacity: 1,
        fillColor: '#e74c3c',
        fillOpacity: 0.15
    };
}

/**
 * Attach click handler to each parcel
 */
function onEachParcel(feature, layer) {
    layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectParcel(feature);
    });
}

/**
 * Convert EPSG:3067 coordinates to WGS84 LatLng for Leaflet
 */
function coordsEPSG3067ToLatLng(coords) {
    const [x, y] = coords;
    const [lng, lat] = proj4('EPSG:3067', 'WGS84', [x, y]);
    return L.latLng(lat, lng);
}

/**
 * Color configurations for each mode
 */
const COLOR_MODES = {
    volume: {
        label: 'Tilavuus (m³/ha)',
        getColor: (p) => {
            const v = p.VOLUME || 0;
            if (v > 200) return '#1e7d1e';
            if (v > 150) return '#3cb043';
            if (v > 100) return '#6cc66c';
            if (v > 50) return '#8cd98c';
            return '#a8d5a2';
        },
        border: '#2d5a27',
        legend: [
            { color: '#a8d5a2', label: '0–50' },
            { color: '#8cd98c', label: '50–100' },
            { color: '#6cc66c', label: '100–150' },
            { color: '#3cb043', label: '150–200' },
            { color: '#1e7d1e', label: '200+' }
        ]
    },
    age: {
        label: 'Ikä (v)',
        getColor: (p) => {
            const a = p.MEANAGE || 0;
            if (a > 100) return '#4a1486';
            if (a > 80) return '#8b5cf6';
            if (a > 60) return '#c084fc';
            if (a > 40) return '#e9d5ff';
            if (a > 20) return '#fef3c7';
            return '#fef9c3';
        },
        border: '#4a1486',
        legend: [
            { color: '#fef9c3', label: '0–20' },
            { color: '#fef3c7', label: '20–40' },
            { color: '#e9d5ff', label: '40–60' },
            { color: '#c084fc', label: '60–80' },
            { color: '#8b5cf6', label: '80–100' },
            { color: '#4a1486', label: '100+' }
        ]
    },
    species: {
        label: 'Pääpuulaji',
        getColor: (p) => {
            const s = Number(p.MAINTREESPECIES);
            if (s === 1) return '#3498db';  // Mänty
            if (s === 2) return '#27ae60';  // Kuusi
            if (s === 3 || s === 4) return '#f1c40f'; // Koivut
            if (s >= 5) return '#e67e22';   // Muut lehtipuut
            return '#bdc3c7';
        },
        border: '#555',
        legend: [
            { color: '#3498db', label: 'Mänty' },
            { color: '#27ae60', label: 'Kuusi' },
            { color: '#f1c40f', label: 'Koivu' },
            { color: '#e67e22', label: 'Muu lehtipuu' }
        ]
    },
    devclass: {
        label: 'Kehitysluokka',
        getColor: (p) => {
            const d = String(p.DEVELOPMENTCLASS);
            if (d === 'A0') return '#fef9c3'; // Aukea
            if (d === 'S0' || d === 'T1') return '#bbf7d0'; // Siemenpuu/taimikko
            if (d === 'T2') return '#86efac'; // Pieni taimikko
            if (d === '02') return '#4ade80'; // Nuori kasvatusmetsä
            if (d === '03') return '#22c55e'; // Varttunut kasvatusmetsä
            if (d === '04') return '#16a34a'; // Uudistuskypsä
            if (d === '05') return '#15803d'; // Suojuspuumetsä
            if (d === 'Y1') return '#a78bfa'; // Ylispuustoinen
            if (d === 'ER') return '#94a3b8'; // Eri-ikäisrakenteinen
            return '#e2e8f0';
        },
        border: '#555',
        legend: [
            { color: '#fef9c3', label: 'Aukea' },
            { color: '#bbf7d0', label: 'Taimikko' },
            { color: '#4ade80', label: 'Nuori kasvatus' },
            { color: '#22c55e', label: 'Varttunut' },
            { color: '#16a34a', label: 'Uudistuskypsä' },
            { color: '#a78bfa', label: 'Ylispuust./eri-ik.' }
        ]
    }
};

/**
 * Style function for forest features (uses currentColorMode)
 */
function featureStyle(feature) {
    const mode = COLOR_MODES[currentColorMode] || COLOR_MODES.volume;
    return {
        fillColor: mode.getColor(feature.properties),
        weight: 2,
        opacity: 0.9,
        color: mode.border,
        fillOpacity: 0.6
    };
}

/**
 * Change color mode and refresh forest layer styling + legend
 */
function setColorMode(mode) {
    if (!COLOR_MODES[mode]) return;
    currentColorMode = mode;

    // Re-style all features in the forest layer
    forestLayer.eachLayer(layer => {
        if (layer.feature) {
            layer.setStyle(featureStyle(layer.feature));
        }
    });

    updateLegend();
}

/**
 * Update the color legend display
 */
function updateLegend() {
    const legendEl = document.getElementById('color-legend');
    if (!legendEl) return;

    const mode = COLOR_MODES[currentColorMode];
    if (!mode || !forestLayer || forestLayer.getLayers().length === 0) {
        legendEl.classList.add('hidden');
        return;
    }

    legendEl.classList.remove('hidden');
    legendEl.innerHTML = `
        <div class="legend-title">${mode.label}</div>
        <div class="legend-items">
            ${mode.legend.map(item =>
                `<div class="legend-item"><span class="legend-color" style="background:${item.color}"></span>${item.label}</div>`
            ).join('')}
        </div>
    `;
}

/**
 * Attach events to each feature
 */
function onEachFeature(feature, layer) {
    layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        showFeaturePopup(feature, layer);
    });
}

/**
 * Show popup for a single feature
 */
function showFeaturePopup(feature, layer) {
    const props = feature.properties;

    const content = `
        <strong>Kuvio ${props.STANDNUMBER || '-'}</strong><br>
        Pinta-ala: ${formatNumber(props.AREA, 2)} ha<br>
        Tilavuus: ${formatNumber(props.VOLUME, 0)} m³/ha<br>
        Pääpuulaji: ${CODES.treeSpecies[props.MAINTREESPECIES] || '-'}<br>
        Ikä: ${props.MEANAGE || '-'} v
    `;

    layer.bindPopup(content).openPopup();
}

/**
 * Initialize controls
 */
function initControls() {
    // Search toggle
    const searchToggle = document.getElementById('search-toggle');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    searchToggle.addEventListener('click', () => {
        searchForm.classList.toggle('hidden');
        if (!searchForm.classList.contains('hidden')) {
            searchInput.focus();
        }
    });

    // Close search when clicking outside
    document.addEventListener('click', (e) => {
        const searchControl = document.getElementById('search-control');
        if (!searchControl.contains(e.target) && !searchForm.classList.contains('hidden')) {
            searchForm.classList.add('hidden');
        }
    });
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Load parcels when map view changes
    map.on('moveend', loadParcelsInView);

    // Initial load of parcels
    loadParcelsInView();

    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('info-panel').classList.add('hidden');
        selectedParcelLayer.clearLayers();
        forestLayer.clearLayers();
        currentParcel = null;
        updateUrlParam(null);
        document.getElementById('color-mode-control').classList.add('hidden');
        document.getElementById('color-legend').classList.add('hidden');
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    searchButton.addEventListener('click', () => searchParcel());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchParcel();
    });
}

/**
 * Convert user input to 14-digit nationalCadastralReference format
 * Accepts formats like "91-416-1-123" or "091-416-0001-0123" or "09141600010123"
 */
function normalizeParcelId(input) {
    // Remove all non-numeric characters
    const clean = input.replace(/[^0-9]/g, '');

    // If already 14 digits, return as-is
    if (clean.length === 14) {
        return clean;
    }

    // Try to parse dash-separated format (e.g., "91-416-1-123")
    const parts = input.split(/[-\s]+/);
    if (parts.length === 4) {
        const [kunta, kyla, tila, yksikko] = parts.map(p => p.replace(/[^0-9]/g, ''));
        return kunta.padStart(3, '0') +
               kyla.padStart(3, '0') +
               tila.padStart(4, '0') +
               yksikko.padStart(4, '0');
    }

    return null;
}

/**
 * Fetch all parcel parts by cadastral reference
 */
async function fetchParcelsByReference(reference) {
    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: 'cp:CadastralParcel',
        outputFormat: 'application/json',
        srsName: 'EPSG:3067',
        CQL_FILTER: `nationalCadastralReference='${reference}'`
    });

    const response = await fetch(`${CONFIG.cadastralWfsUrl}?${params}`);
    if (!response.ok) {
        throw new Error('Haku epäonnistui');
    }

    const data = await response.json();
    return data.features || [];
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
            // Calculate combined bounds for all parcel parts
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            parcels.forEach(parcel => {
                const bounds = getGeometryBounds3067(parcel.geometry);
                minX = Math.min(minX, bounds.minX);
                minY = Math.min(minY, bounds.minY);
                maxX = Math.max(maxX, bounds.maxX);
                maxY = Math.max(maxY, bounds.maxY);
            });

            // Zoom to combined bounds
            const sw = proj4('EPSG:3067', 'WGS84', [minX, minY]);
            const ne = proj4('EPSG:3067', 'WGS84', [maxX, maxY]);
            map.fitBounds([[sw[1], sw[0]], [ne[1], ne[0]]], { maxZoom: 16, padding: [50, 50] });

            // Select all parcel parts
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
    const zoom = map.getZoom();

    // Only load parcels at sufficient zoom level
    if (zoom < CONFIG.minZoomForParcels) {
        cadastralLayer.clearLayers();
        parcelLabelsLayer.clearLayers();
        loadedParcels.clear();
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
            // Clear and reload parcels
            cadastralLayer.clearLayers();
            parcelLabelsLayer.clearLayers();
            loadedParcels.clear();

            data.features.forEach(feature => {
                const id = feature.properties?.nationalCadastralReference || feature.id;
                loadedParcels.set(id, feature);
                cadastralLayer.addData(feature);

                // Add label at parcel center (only at zoom >= 15 for readability)
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
 * Add a label marker for a parcel
 */
function addParcelLabel(feature) {
    const props = feature.properties;
    const label = props?.label || formatCadastralReference(props?.nationalCadastralReference);
    if (!label) return;

    // Use referencePoint if available, otherwise calculate centroid
    let latLng;
    if (props?.referencePoint?.coordinates) {
        const [x, y] = props.referencePoint.coordinates;
        const [lng, lat] = proj4('EPSG:3067', 'WGS84', [x, y]);
        latLng = L.latLng(lat, lng);
    } else {
        // Calculate centroid from geometry
        const bounds = getGeometryBounds3067(feature.geometry);
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const [lng, lat] = proj4('EPSG:3067', 'WGS84', [centerX, centerY]);
        latLng = L.latLng(lat, lng);
    }

    const labelMarker = L.marker(latLng, {
        icon: L.divIcon({
            className: 'parcel-label',
            html: `<span>${label}</span>`,
            iconSize: null
        }),
        interactive: false
    });

    parcelLabelsLayer.addLayer(labelMarker);
}

/**
 * Select a parcel and load its forest data (fetches all parts with same reference)
 */
async function selectParcel(parcel) {
    const reference = parcel.properties?.nationalCadastralReference;

    // If we have a reference, fetch all parts of this parcel
    if (reference) {
        try {
            const allParts = await fetchParcelsByReference(reference);
            if (allParts.length > 1) {
                // Multiple parts found, select them all
                selectParcels(allParts);
                return;
            }
        } catch (error) {
            console.warn('Failed to fetch additional parcel parts:', error);
            // Continue with single parcel selection
        }
    }

    // Single parcel selection
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

    // Clear previous selection
    selectedParcelLayer.clearLayers();
    forestLayer.clearLayers();

    // Highlight all selected parcels
    parcels.forEach(parcel => selectedParcelLayer.addData(parcel));

    // Update URL with parcel reference for sharing
    const reference = parcels[0]?.properties?.nationalCadastralReference;
    if (reference) {
        updateUrlParam(reference);
    }

    currentParcel = parcels.length === 1 ? parcels[0] : {
        // Create a combined parcel object for display
        properties: parcels[0].properties,
        parts: parcels
    };

    try {
        // Calculate combined bounds for all parcel parts
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        parcels.forEach(parcel => {
            const bounds = getGeometryBounds3067(parcel.geometry);
            minX = Math.min(minX, bounds.minX);
            minY = Math.min(minY, bounds.minY);
            maxX = Math.max(maxX, bounds.maxX);
            maxY = Math.max(maxY, bounds.maxY);
        });

        const combinedBounds = { minX, minY, maxX, maxY };

        // Fetch forest data within the combined bounding box
        const features = await fetchForestDataByBounds(combinedBounds);

        // Filter features that belong to any of the parcel parts
        const filteredFeatures = filterFeaturesByParcels(features, parcels);
        currentFeatures = filteredFeatures;

        loading.classList.add('hidden');

        // Add forest features to map
        if (filteredFeatures.length > 0) {
            filteredFeatures.forEach(f => forestLayer.addData(f));
        }

        // Show/hide color mode controls
        const colorControl = document.getElementById('color-mode-control');
        if (filteredFeatures.length > 0) {
            colorControl.classList.remove('hidden');
            updateLegend();
        } else {
            colorControl.classList.add('hidden');
            document.getElementById('color-legend').classList.add('hidden');
        }

        // Show summary with parcel info (include part count if multi-part)
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

/**
 * Handle map click (fallback for clicking outside parcels)
 */
async function onMapClick(e) {
    // This is now only used as fallback - parcels are clicked directly
    // Do nothing - user must click on a parcel
}

/**
 * Fetch cadastral parcel at a specific point (legacy, still used as fallback)
 */
async function fetchCadastralParcel(x, y) {
    const r = 200; // 200 meter radius
    const bbox = `${x - r},${y - r},${x + r},${y + r},EPSG:3067`;

    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: 'cp:CadastralParcel',
        outputFormat: 'application/json',
        srsName: 'EPSG:3067',
        bbox: bbox
    });

    const url = `${CONFIG.cadastralWfsUrl}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            for (const parcel of data.features) {
                if (pointInPolygon3067([x, y], parcel.geometry)) {
                    return parcel;
                }
            }
            return data.features[0];
        }
        return null;
    } catch (error) {
        console.warn('Failed to fetch cadastral parcel:', error);
        return null;
    }
}


/**
 * Check if a point is inside a polygon (EPSG:3067 coordinates)
 */
function pointInPolygon3067(point, geometry) {
    if (!geometry || !geometry.coordinates) return false;

    const [px, py] = point;
    const rings = geometry.type === 'Polygon' ? [geometry.coordinates[0]] :
                  geometry.type === 'MultiPolygon' ? geometry.coordinates.map(p => p[0]) : [];

    for (const ring of rings) {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];

            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        if (inside) return true;
    }
    return false;
}

/**
 * Get bounding box from geometry in EPSG:3067 coordinates
 */
function getGeometryBounds3067(geometry) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    function processCoords(coords) {
        if (typeof coords[0] === 'number') {
            minX = Math.min(minX, coords[0]);
            minY = Math.min(minY, coords[1]);
            maxX = Math.max(maxX, coords[0]);
            maxY = Math.max(maxY, coords[1]);
        } else {
            coords.forEach(processCoords);
        }
    }

    processCoords(geometry.coordinates);
    return { minX, minY, maxX, maxY };
}

/**
 * Fetch forest data by bounding box (EPSG:3067)
 */
async function fetchForestDataByBounds(bounds) {
    const buffer = 10;
    const bbox = `${bounds.minX - buffer},${bounds.minY - buffer},${bounds.maxX + buffer},${bounds.maxY + buffer}`;

    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: 'v1:stand',
        outputFormat: 'application/json',
        srsName: 'EPSG:3067',
        bbox: bbox + ',EPSG:3067'
    });

    const url = `${CONFIG.wfsUrl}?${params}`;
    console.log('Fetching forest data:', url);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features || [];
}

/**
 * Filter forest features - only include stands whose centroid is inside the parcel
 */
function filterFeaturesByParcel(features, parcel) {
    if (!parcel || !parcel.geometry) return features;

    return features.filter(feature => {
        if (!feature.geometry) return false;
        try {
            return featureBelongsToParcel(feature.geometry, parcel.geometry);
        } catch (e) {
            console.warn('Error checking feature:', e);
            return false; // Exclude on error instead of including
        }
    });
}

/**
 * Filter forest features - only include stands whose centroid is inside any of the parcels
 */
function filterFeaturesByParcels(features, parcels) {
    if (!parcels || parcels.length === 0) return features;

    return features.filter(feature => {
        if (!feature.geometry) return false;
        try {
            // Check if feature belongs to any of the parcel parts
            return parcels.some(parcel =>
                parcel.geometry && featureBelongsToParcel(feature.geometry, parcel.geometry)
            );
        } catch (e) {
            console.warn('Error checking feature:', e);
            return false;
        }
    });
}

/**
 * Check if a forest stand belongs to a parcel (centroid must be inside)
 */
function featureBelongsToParcel(featureGeom, parcelGeom) {
    // Get the outer ring of the feature
    const ring = featureGeom.type === 'Polygon' ? featureGeom.coordinates[0] :
                 featureGeom.type === 'MultiPolygon' ? featureGeom.coordinates[0][0] : null;

    if (!ring || ring.length === 0) return false;

    // Calculate centroid of the feature
    let sumX = 0, sumY = 0;
    for (const [x, y] of ring) {
        sumX += x;
        sumY += y;
    }
    const centroid = [sumX / ring.length, sumY / ring.length];

    // Feature belongs to parcel only if its centroid is inside the parcel
    return pointInPolygon3067(centroid, parcelGeom);
}

/**
 * Format cadastral reference for display
 */
function formatCadastralReference(ref) {
    if (!ref || ref.includes('-')) return ref;
    if (ref.length === 14) {
        return `${parseInt(ref.slice(0, 3))}-${parseInt(ref.slice(3, 6))}-${parseInt(ref.slice(6, 10))}-${parseInt(ref.slice(10, 14))}`;
    }
    return ref;
}

/**
 * Calculate polygon area using shoelace formula (in square meters for EPSG:3067)
 */
function calculatePolygonArea(coordinates) {
    if (!coordinates || coordinates.length < 3) return 0;

    let area = 0;
    const n = coordinates.length;
    for (let i = 0; i < n; i++) {
        const [x1, y1] = coordinates[i];
        const [x2, y2] = coordinates[(i + 1) % n];
        area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area) / 2;
}

/**
 * Calculate total area from geometry (Polygon or MultiPolygon)
 */
function calculateGeometryArea(geometry) {
    if (!geometry || !geometry.coordinates) return 0;

    if (geometry.type === 'Polygon') {
        // Outer ring is first, subtract holes
        let area = calculatePolygonArea(geometry.coordinates[0]);
        for (let i = 1; i < geometry.coordinates.length; i++) {
            area -= calculatePolygonArea(geometry.coordinates[i]);
        }
        return area;
    } else if (geometry.type === 'MultiPolygon') {
        let totalArea = 0;
        geometry.coordinates.forEach(polygon => {
            let area = calculatePolygonArea(polygon[0]);
            for (let i = 1; i < polygon.length; i++) {
                area -= calculatePolygonArea(polygon[i]);
            }
            totalArea += area;
        });
        return totalArea;
    }
    return 0;
}

/**
 * Calculate total parcel area from parcel object (single or multi-part)
 */
function calculateParcelArea(parcel, partCount) {
    if (!parcel) return null;

    // Multi-part parcel with parts array
    if (parcel.parts && parcel.parts.length > 0) {
        let totalArea = 0;
        parcel.parts.forEach(part => {
            if (part.geometry) {
                totalArea += calculateGeometryArea(part.geometry);
            }
        });
        return totalArea > 0 ? totalArea : null;
    }

    // Single parcel - calculate from geometry
    if (parcel.geometry) {
        const area = calculateGeometryArea(parcel.geometry);
        return area > 0 ? area : null;
    }

    return null;
}

/**
 * Show summary of forest features and parcel info
 */
function showSummary(features, parcel, partCount = 1) {
    const content = document.getElementById('info-content');
    const stats = calculateStatistics(features);

    const parcelProps = parcel ? parcel.properties : null;
    const parcelLabel = parcelProps?.label || formatCadastralReference(parcelProps?.nationalCadastralReference) || '-';
    const parcelArea = calculateParcelArea(parcel, partCount);
    const parcelAreaText = parcelArea ? `${formatNumber(parcelArea / 10000, 2)} ha` : '';
    const partsInfo = partCount > 1 ? ` (${partCount} palstaa)` : '';

    content.innerHTML = `
        ${parcel ? `
        <div class="summary-section parcel-section">
            <h3>Kiinteistö</h3>
            <div class="parcel-info">
                <div class="parcel-id">${parcelLabel}</div>
                <div class="parcel-details">${parcelAreaText}${partsInfo}</div>
            </div>
            <div class="parcel-actions">
                <button class="action-btn copy-link-btn" id="copy-link-btn" onclick="copyParcelLink()">
                    <span class="action-icon">🔗</span> Kopioi linkki
                </button>
                ${features.length > 0 ? `
                <button class="action-btn download-btn" onclick="downloadCSV()">
                    <span class="action-icon">⬇</span> Lataa CSV
                </button>
                <button class="action-btn print-btn" onclick="window.print()">
                    <span class="action-icon">🖨</span> Tulosta
                </button>
                ` : ''}
            </div>
        </div>
        ` : ''}

        ${features.length > 0 && stats.measurementYearMin ? `
        <div class="measurement-info${(new Date().getFullYear() - stats.measurementYearMax) >= 5 ? ' measurement-old' : ''}">
            <span class="measurement-label">Aineiston mittausvuosi: ${stats.measurementYearMin === stats.measurementYearMax ? stats.measurementYearMin : `${stats.measurementYearMin}–${stats.measurementYearMax}`}</span>
            ${(new Date().getFullYear() - stats.measurementYearMax) >= 5 ? '<span class="measurement-warning">Tiedot voivat olla vanhentuneita</span>' : ''}
        </div>
        ` : ''}

        ${features.length > 0 ? `
        <div class="summary-section">
            <h3>Metsävarat yhteenveto</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.count}</div>
                    <div class="stat-label">Kuviota ${tip('kuvio')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.totalArea, 2)}</div>
                    <div class="stat-label">Hehtaaria</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgVolume, 0)}</div>
                    <div class="stat-label">m³/ha keskiarvo ${tip('tilavuus')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.totalVolume, 0)}</div>
                    <div class="stat-label">m³ yhteensä</div>
                </div>
            </div>
        </div>

        <div class="summary-section">
            <h3>Puulajijakauma ${tip('puulajijakauma')}</h3>
            <div class="species-bar">
                ${stats.speciesPercent.pine > 0 ? `<div class="pine" style="width: ${stats.speciesPercent.pine}%"></div>` : ''}
                ${stats.speciesPercent.spruce > 0 ? `<div class="spruce" style="width: ${stats.speciesPercent.spruce}%"></div>` : ''}
                ${stats.speciesPercent.birch > 0 ? `<div class="birch" style="width: ${stats.speciesPercent.birch}%"></div>` : ''}
            </div>
            <div class="species-legend">
                <span><span class="dot" style="background: #3498db"></span> Mänty ${stats.speciesPercent.pine}%</span>
                <span><span class="dot" style="background: #27ae60"></span> Kuusi ${stats.speciesPercent.spruce}%</span>
                <span><span class="dot" style="background: #f1c40f"></span> Lehtipuut ${stats.speciesPercent.birch}%</span>
            </div>
        </div>

        <div class="summary-section">
            <h3>Puusto</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgAge, 0)}</div>
                    <div class="stat-label">Keski-ikä (v) ${tip('keskiIka')}</div>
                    <div class="stat-range">${formatNumber(stats.minAge, 0)} – ${formatNumber(stats.maxAge, 0)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgHeight, 1)}</div>
                    <div class="stat-label">Keskipituus (m) ${tip('keskipituus')}</div>
                    <div class="stat-range">${formatNumber(stats.minHeight, 1)} – ${formatNumber(stats.maxHeight, 1)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgDiameter, 1)}</div>
                    <div class="stat-label">Keskiläpimitta (cm) ${tip('keskilapimitta')}</div>
                    <div class="stat-range">${formatNumber(stats.minDiameter, 1)} – ${formatNumber(stats.maxDiameter, 1)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgGrowth, 1)}</div>
                    <div class="stat-label">Kasvu (m³/ha/v) ${tip('kasvu')}</div>
                    <div class="stat-range">${formatNumber(stats.minGrowth, 1)} – ${formatNumber(stats.maxGrowth, 1)}</div>
                </div>
            </div>
        </div>

        <div class="summary-section">
            <h3>Tukkipuu / Kuitupuu</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgSawlog, 0)}</div>
                    <div class="stat-label">Tukkia (m³/ha) ${tip('tukkipuu')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgPulpwood, 0)}</div>
                    <div class="stat-label">Kuitua (m³/ha) ${tip('kuitupuu')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.totalSawlog, 0)}</div>
                    <div class="stat-label">Tukkia yht. (m³)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.totalPulpwood, 0)}</div>
                    <div class="stat-label">Kuitua yht. (m³)</div>
                </div>
            </div>
        </div>

        <div class="summary-section">
            <h3>Kasvupaikka</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgBasalArea, 1)}</div>
                    <div class="stat-label">Pohjapinta-ala (m²/ha) ${tip('pohjapintaAla')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgStemCount, 0)}</div>
                    <div class="stat-label">Runkoluku (kpl/ha) ${tip('runkoluku')}</div>
                </div>
            </div>
            ${stats.fertilityDistribution.length > 0 ? `
            <div class="distribution-list">
                <strong>Kasvupaikkatyypit:</strong>
                ${stats.fertilityDistribution.map(f => `<span class="dist-item">${f.name} (${f.area} ha)</span>`).join('')}
            </div>
            ` : ''}
            ${stats.developmentDistribution.length > 0 ? `
            <div class="distribution-list">
                <strong>Kehitysluokat:</strong>
                ${stats.developmentDistribution.map(d => `<span class="dist-item">${d.name} (${d.count} kpl)</span>`).join('')}
            </div>
            ` : ''}
        </div>

        ${stats.cuttingRecommendations.length > 0 ? `
        <div class="summary-section">
            <h3>Hakkuuehdotukset ${tip('hakkuuehdotus')}</h3>
            <ul class="recommendations-list clickable">
                ${stats.cuttingRecommendations.map(r => `
                    <li data-filter="cutting" data-value="${r.code}">
                        <span class="recommendation-type">${r.name}</span>
                        <span class="recommendation-info">
                            <span class="recommendation-count">${r.count} kuviota</span>
                            ${r.year ? `<span class="recommendation-year">${r.year}</span>` : ''}
                        </span>
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        ${stats.silvicultureRecommendations.length > 0 ? `
        <div class="summary-section">
            <h3>Metsänhoitoehdotukset ${tip('metsanhoitoehdotus')}</h3>
            <ul class="recommendations-list clickable">
                ${stats.silvicultureRecommendations.map(r => `
                    <li data-filter="silviculture" data-value="${r.code}">
                        <span class="recommendation-type">${r.name}</span>
                        <span class="recommendation-info">
                            <span class="recommendation-count">${r.count} kuviota</span>
                            ${r.year ? `<span class="recommendation-year">${r.year}</span>` : ''}
                        </span>
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="summary-section stands-section">
            <h3>Kuviot <span class="stands-count">(${features.length} kpl)</span></h3>
            <div class="stands-list">
                ${features.map((f, idx) => renderStandItem(f, idx)).join('')}
            </div>
        </div>
        ` : `
        <div class="no-data">
            <div class="no-data-icon">🌲</div>
            <p>Ei metsävaratietoja tällä kiinteistöllä.</p>
        </div>
        `}
    `;

    // Add event listeners for stand items
    attachStandEventListeners();
    attachFilterEventListeners();
}

/**
 * Render a single stand item for the list
 */
function renderStandItem(feature, index) {
    const p = feature.properties;
    const species = CODES.treeSpecies[p.MAINTREESPECIES] || '-';
    const devClass = CODES.developmentClass[p.DEVELOPMENTCLASS] || p.DEVELOPMENTCLASS || '-';
    const fertility = CODES.fertilityClass[p.FERTILITYCLASS] || '-';
    const accessibility = CODES.accessibility[p.ACCESSIBILITY] || '-';
    const drainage = CODES.drainageState[p.DRAINAGESTATE] || '-';
    const soil = CODES.soilType[p.SOILTYPE] || '-';
    const cutting = CODES.cuttingType[p.CUTTINGTYPE];
    const silviculture = CODES.silvicultureType[p.SILVICULTURETYPE];
    const measureDate = p.MEASUREMENTDATE ? new Date(p.MEASUREMENTDATE).toLocaleDateString('fi-FI') : '-';

    // Calculate species percentages
    const pineP = Math.round((p.PROPORTIONPINE || 0) * 100);
    const spruceP = Math.round((p.PROPORTIONSPRUCE || 0) * 100);
    const otherP = Math.round((p.PROPORTIONOTHER || 0) * 100);

    return `
        <div class="stand-item" data-index="${index}">
            <div class="stand-header">
                <div class="stand-title">
                    <span class="stand-number">Kuvio ${p.STANDNUMBER || (index + 1)}</span>
                    <span class="stand-species">${species}</span>
                </div>
                <div class="stand-summary">
                    <span class="stand-area">${formatNumber(p.AREA, 2)} ha</span>
                    <span class="stand-volume">${formatNumber(p.VOLUME, 0)} m³/ha</span>
                </div>
                <div class="stand-toggle">▼</div>
            </div>
            <div class="stand-details">
                <div class="detail-group">
                    <div class="detail-title">Perustiedot</div>
                    <div class="detail-grid">
                        <div class="detail-row"><span>Kehitysluokka ${tip('kehitysluokka')}:</span><span>${devClass}</span></div>
                        <div class="detail-row"><span>Kasvupaikka ${tip('kasvupaikka')}:</span><span>${fertility}</span></div>
                        <div class="detail-row"><span>Maalaji ${tip('maalaji')}:</span><span>${soil}</span></div>
                        <div class="detail-row"><span>Ojitustilanne ${tip('ojitustilanne')}:</span><span>${drainage}</span></div>
                        <div class="detail-row"><span>Kulkukelpoisuus ${tip('kulkukelpoisuus')}:</span><span>${accessibility}</span></div>
                    </div>
                </div>
                <div class="detail-group">
                    <div class="detail-title">Puusto</div>
                    <div class="detail-grid">
                        <div class="detail-row"><span>Ikä:</span><span>${p.MEANAGE || '-'} v</span></div>
                        <div class="detail-row"><span>Pituus:</span><span>${formatNumber(p.MEANHEIGHT, 1)} m</span></div>
                        <div class="detail-row"><span>Läpimitta:</span><span>${formatNumber(p.MEANDIAMETER, 1)} cm</span></div>
                        <div class="detail-row"><span>Pohjapinta-ala:</span><span>${formatNumber(p.BASALAREA, 1)} m²/ha</span></div>
                        <div class="detail-row"><span>Runkoluku:</span><span>${formatNumber(p.STEMCOUNT, 0)} kpl/ha</span></div>
                        <div class="detail-row"><span>Kasvu:</span><span>${formatNumber(p.VOLUMEGROWTH, 1)} m³/ha/v</span></div>
                    </div>
                </div>
                <div class="detail-group">
                    <div class="detail-title">Puulajijakauma</div>
                    <div class="mini-species-bar">
                        ${pineP > 0 ? `<div class="pine" style="width: ${pineP}%" title="Mänty ${pineP}%"></div>` : ''}
                        ${spruceP > 0 ? `<div class="spruce" style="width: ${spruceP}%" title="Kuusi ${spruceP}%"></div>` : ''}
                        ${otherP > 0 ? `<div class="birch" style="width: ${otherP}%" title="Lehtipuut ${otherP}%"></div>` : ''}
                    </div>
                    <div class="mini-species-legend">
                        ${pineP > 0 ? `<span>Mänty ${pineP}%</span>` : ''}
                        ${spruceP > 0 ? `<span>Kuusi ${spruceP}%</span>` : ''}
                        ${otherP > 0 ? `<span>Lehtipuut ${otherP}%</span>` : ''}
                    </div>
                </div>
                <div class="detail-group">
                    <div class="detail-title">Puutavaralajit</div>
                    <div class="detail-grid">
                        <div class="detail-row"><span>Tukkipuu:</span><span>${formatNumber(p.SAWLOGVOLUME, 0)} m³/ha</span></div>
                        <div class="detail-row"><span>Kuitupuu:</span><span>${formatNumber(p.PULPWOODVOLUME, 0)} m³/ha</span></div>
                        <div class="detail-row"><span>Yhteensä:</span><span>${formatNumber(p.VOLUME, 0)} m³/ha</span></div>
                        <div class="detail-row"><span>Kuviolla yht:</span><span>${formatNumber((p.VOLUME || 0) * (p.AREA || 0), 0)} m³</span></div>
                    </div>
                </div>
                ${cutting || silviculture ? `
                <div class="detail-group">
                    <div class="detail-title">Toimenpide-ehdotukset</div>
                    <div class="detail-grid">
                        ${cutting ? `<div class="detail-row highlight"><span>Hakkuu:</span><span>${cutting}${p.CUTTINGPROPOSALYEAR ? ` (${p.CUTTINGPROPOSALYEAR})` : ''}</span></div>` : ''}
                        ${silviculture ? `<div class="detail-row highlight"><span>Hoito:</span><span>${silviculture}${p.SILVICULTUREPROPOSALYEAR ? ` (${p.SILVICULTUREPROPOSALYEAR})` : ''}</span></div>` : ''}
                    </div>
                </div>
                ` : ''}
                <div class="detail-footer">
                    <span class="measurement-date">Mitattu: ${measureDate}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Attach event listeners for stand items
 */
function attachStandEventListeners() {
    document.querySelectorAll('.stand-item').forEach(item => {
        const header = item.querySelector('.stand-header');
        const details = item.querySelector('.stand-details');
        const toggle = item.querySelector('.stand-toggle');
        const index = parseInt(item.dataset.index);

        header.addEventListener('click', () => {
            const isExpanded = item.classList.toggle('expanded');
            toggle.textContent = isExpanded ? '▲' : '▼';

            // Highlight stand on map
            highlightStand(index, isExpanded);
        });
    });
}

/**
 * Attach event listeners for filter items (recommendations)
 */
function attachFilterEventListeners() {
    document.querySelectorAll('.recommendations-list.clickable li').forEach(item => {
        item.addEventListener('click', () => {
            const filterType = item.dataset.filter;
            const filterValue = parseInt(item.dataset.value);

            // Toggle active state
            const wasActive = item.classList.contains('active');
            document.querySelectorAll('.recommendations-list.clickable li').forEach(li => li.classList.remove('active'));

            if (!wasActive) {
                item.classList.add('active');
                highlightFilteredStands(filterType, filterValue);
            } else {
                highlightedStandLayer.clearLayers();
            }
        });
    });
}

/**
 * Highlight stands matching a filter
 */
function highlightFilteredStands(filterType, filterValue) {
    highlightedStandLayer.clearLayers();

    const matchingFeatures = currentFeatures.filter(f => {
        const p = f.properties;
        if (filterType === 'cutting') {
            return p.CUTTINGTYPE === filterValue;
        } else if (filterType === 'silviculture') {
            return p.SILVICULTURETYPE === filterValue;
        }
        return false;
    });

    matchingFeatures.forEach(f => highlightedStandLayer.addData(f));

    // Fit bounds to highlighted features if any
    if (matchingFeatures.length > 0) {
        const bounds = highlightedStandLayer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: map.getZoom() });
        }
    }
}

/**
 * Highlight a single stand on the map
 */
function highlightStand(index, highlight) {
    highlightedStandLayer.clearLayers();
    document.querySelectorAll('.recommendations-list.clickable li').forEach(li => li.classList.remove('active'));

    if (highlight && currentFeatures[index]) {
        const feature = currentFeatures[index];
        highlightedStandLayer.addData(feature);

        // Pan to the stand
        const bounds = getGeometryBounds3067(feature.geometry);
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const [lng, lat] = proj4('EPSG:3067', 'WGS84', [centerX, centerY]);
        map.panTo([lat, lng]);

        selectedStandIndex = index;
    } else {
        selectedStandIndex = null;
    }
}

/**
 * Calculate statistics from features
 */
function calculateStatistics(features) {
    const stats = {
        count: features.length,
        totalArea: 0,
        totalVolume: 0,
        avgVolume: 0,
        avgAge: 0,
        avgHeight: 0,
        avgDiameter: 0,
        avgGrowth: 0,
        avgSawlog: 0,
        avgPulpwood: 0,
        totalSawlog: 0,
        totalPulpwood: 0,
        avgBasalArea: 0,
        avgStemCount: 0,
        // Min/max values
        minAge: null, maxAge: null,
        minHeight: null, maxHeight: null,
        minDiameter: null, maxDiameter: null,
        minVolume: null, maxVolume: null,
        minGrowth: null, maxGrowth: null,
        speciesPercent: { pine: 0, spruce: 0, birch: 0, other: 0 },
        cuttingRecommendations: [],
        silvicultureRecommendations: [],
        fertilityDistribution: [],
        developmentDistribution: [],
        measurementYearMin: null,
        measurementYearMax: null
    };

    if (features.length === 0) return stats;

    let totalPine = 0, totalSpruce = 0, totalBirch = 0;
    let totalSpecies = 0;
    let validAgeCount = 0, validHeightCount = 0, validDiameterCount = 0, validGrowthCount = 0;
    let validSawlogCount = 0, validPulpwoodCount = 0;
    let validBasalAreaCount = 0, validStemCountCount = 0;

    const cuttingCounts = {};
    const silvicultureCounts = {};
    const fertilityCounts = {};
    const developmentCounts = {};

    features.forEach(f => {
        const p = f.properties;
        const area = p.AREA || 0;

        stats.totalArea += area;
        stats.totalVolume += (p.VOLUME || 0) * area;
        stats.avgVolume += p.VOLUME || 0;
        stats.totalSawlog += (p.SAWLOGVOLUME || 0) * area;
        stats.totalPulpwood += (p.PULPWOODVOLUME || 0) * area;

        // Track measurement years
        if (p.MEASUREMENTDATE) {
            const year = new Date(p.MEASUREMENTDATE).getFullYear();
            if (!isNaN(year)) {
                if (stats.measurementYearMin === null || year < stats.measurementYearMin) stats.measurementYearMin = year;
                if (stats.measurementYearMax === null || year > stats.measurementYearMax) stats.measurementYearMax = year;
            }
        }

        // Track min/max for volume
        if (p.VOLUME != null) {
            if (stats.minVolume === null || p.VOLUME < stats.minVolume) stats.minVolume = p.VOLUME;
            if (stats.maxVolume === null || p.VOLUME > stats.maxVolume) stats.maxVolume = p.VOLUME;
        }

        if (p.MEANAGE) {
            stats.avgAge += p.MEANAGE;
            validAgeCount++;
            if (stats.minAge === null || p.MEANAGE < stats.minAge) stats.minAge = p.MEANAGE;
            if (stats.maxAge === null || p.MEANAGE > stats.maxAge) stats.maxAge = p.MEANAGE;
        }
        if (p.MEANHEIGHT) {
            stats.avgHeight += p.MEANHEIGHT;
            validHeightCount++;
            if (stats.minHeight === null || p.MEANHEIGHT < stats.minHeight) stats.minHeight = p.MEANHEIGHT;
            if (stats.maxHeight === null || p.MEANHEIGHT > stats.maxHeight) stats.maxHeight = p.MEANHEIGHT;
        }
        if (p.MEANDIAMETER) {
            stats.avgDiameter += p.MEANDIAMETER;
            validDiameterCount++;
            if (stats.minDiameter === null || p.MEANDIAMETER < stats.minDiameter) stats.minDiameter = p.MEANDIAMETER;
            if (stats.maxDiameter === null || p.MEANDIAMETER > stats.maxDiameter) stats.maxDiameter = p.MEANDIAMETER;
        }
        if (p.VOLUMEGROWTH) {
            stats.avgGrowth += p.VOLUMEGROWTH;
            validGrowthCount++;
            if (stats.minGrowth === null || p.VOLUMEGROWTH < stats.minGrowth) stats.minGrowth = p.VOLUMEGROWTH;
            if (stats.maxGrowth === null || p.VOLUMEGROWTH > stats.maxGrowth) stats.maxGrowth = p.VOLUMEGROWTH;
        }
        if (p.SAWLOGVOLUME) { stats.avgSawlog += p.SAWLOGVOLUME; validSawlogCount++; }
        if (p.PULPWOODVOLUME) { stats.avgPulpwood += p.PULPWOODVOLUME; validPulpwoodCount++; }
        if (p.BASALAREA) { stats.avgBasalArea += p.BASALAREA; validBasalAreaCount++; }
        if (p.STEMCOUNT) { stats.avgStemCount += p.STEMCOUNT; validStemCountCount++; }

        // PROPORTION fields come as decimals (0.0-1.0), convert to percentages
        let pine = (p.PROPORTIONPINE || 0) * 100;
        let spruce = (p.PROPORTIONSPRUCE || 0) * 100;
        let deciduous = (p.PROPORTIONOTHER || 0) * 100;

        // Fallback: if no proportion data, use main tree species
        if ((pine + spruce + deciduous) === 0 && p.MAINTREESPECIES) {
            const species = Number(p.MAINTREESPECIES);
            if (species === 1) pine = 100;
            else if (species === 2) spruce = 100;
            else deciduous = 100;
        }

        totalPine += pine * area;
        totalSpruce += spruce * area;
        totalBirch += deciduous * area;
        totalSpecies += area;

        if (p.CUTTINGTYPE) {
            const code = p.CUTTINGTYPE;
            const name = CODES.cuttingType[code] || `Tyyppi ${code}`;
            const year = p.CUTTINGPROPOSALYEAR;
            const key = `${code}`;
            if (!cuttingCounts[key]) {
                cuttingCounts[key] = { code, name, count: 0, years: [] };
            }
            cuttingCounts[key].count++;
            if (year) cuttingCounts[key].years.push(year);
        }

        if (p.SILVICULTURETYPE) {
            const code = p.SILVICULTURETYPE;
            const name = CODES.silvicultureType[code] || `Tyyppi ${code}`;
            const year = p.SILVICULTUREPROPOSALYEAR;
            const key = `${code}`;
            if (!silvicultureCounts[key]) {
                silvicultureCounts[key] = { code, name, count: 0, years: [] };
            }
            silvicultureCounts[key].count++;
            if (year) silvicultureCounts[key].years.push(year);
        }

        if (p.FERTILITYCLASS) {
            const code = p.FERTILITYCLASS;
            const name = CODES.fertilityClass[code] || `Tyyppi ${code}`;
            if (!fertilityCounts[code]) {
                fertilityCounts[code] = { name, area: 0 };
            }
            fertilityCounts[code].area += area;
        }

        if (p.DEVELOPMENTCLASS) {
            const code = p.DEVELOPMENTCLASS;
            const name = CODES.developmentClass[code] || code;
            if (!developmentCounts[code]) {
                developmentCounts[code] = { name, count: 0 };
            }
            developmentCounts[code].count++;
        }
    });

    stats.avgVolume = stats.avgVolume / features.length;
    stats.avgAge = validAgeCount > 0 ? stats.avgAge / validAgeCount : 0;
    stats.avgHeight = validHeightCount > 0 ? stats.avgHeight / validHeightCount : 0;
    stats.avgDiameter = validDiameterCount > 0 ? stats.avgDiameter / validDiameterCount : 0;
    stats.avgGrowth = validGrowthCount > 0 ? stats.avgGrowth / validGrowthCount : 0;
    stats.avgSawlog = validSawlogCount > 0 ? stats.avgSawlog / validSawlogCount : 0;
    stats.avgPulpwood = validPulpwoodCount > 0 ? stats.avgPulpwood / validPulpwoodCount : 0;
    stats.avgBasalArea = validBasalAreaCount > 0 ? stats.avgBasalArea / validBasalAreaCount : 0;
    stats.avgStemCount = validStemCountCount > 0 ? stats.avgStemCount / validStemCountCount : 0;

    if (totalSpecies > 0) {
        stats.speciesPercent.pine = Math.round(totalPine / totalSpecies);
        stats.speciesPercent.spruce = Math.round(totalSpruce / totalSpecies);
        stats.speciesPercent.birch = Math.round(totalBirch / totalSpecies);

        const total = stats.speciesPercent.pine + stats.speciesPercent.spruce + stats.speciesPercent.birch;
        if (total !== 100 && total > 0) {
            stats.speciesPercent.birch += (100 - total);
        }
    }

    stats.cuttingRecommendations = Object.values(cuttingCounts)
        .map(r => ({
            code: r.code,
            name: r.name,
            count: r.count,
            year: r.years.length > 0 ? Math.min(...r.years) : null
        }))
        .sort((a, b) => b.count - a.count);

    stats.silvicultureRecommendations = Object.values(silvicultureCounts)
        .map(r => ({
            code: r.code,
            name: r.name,
            count: r.count,
            year: r.years.length > 0 ? Math.min(...r.years) : null
        }))
        .sort((a, b) => b.count - a.count);

    stats.fertilityDistribution = Object.values(fertilityCounts)
        .map(f => ({ name: f.name, area: formatNumber(f.area, 2) }))
        .sort((a, b) => parseFloat(b.area) - parseFloat(a.area));

    stats.developmentDistribution = Object.values(developmentCounts)
        .sort((a, b) => b.count - a.count);

    return stats;
}

/**
 * Format number with specified decimals
 */
function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) return '-';
    return value.toLocaleString('fi-FI', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Download forest stand data as CSV file
 */
function downloadCSV() {
    if (!currentFeatures || currentFeatures.length === 0) {
        alert('Ei ladattavia metsäkuviotietoja.');
        return;
    }

    const parcelId = currentParcel?.properties?.nationalCadastralReference ||
                     currentParcel?.properties?.label || 'tuntematon';

    // CSV headers
    const headers = [
        'Kuvio', 'Pinta-ala (ha)', 'Pääpuulaji', 'Kehitysluokka', 'Kasvupaikka',
        'Maalaji', 'Ikä (v)', 'Pituus (m)', 'Läpimitta (cm)', 'Pohjapinta-ala (m²/ha)',
        'Runkoluku (kpl/ha)', 'Tilavuus (m³/ha)', 'Kasvu (m³/ha/v)', 'Tukkipuu (m³/ha)',
        'Kuitupuu (m³/ha)', 'Mänty (%)', 'Kuusi (%)', 'Lehtipuut (%)',
        'Hakkuuehdotus', 'Hakkuuvuosi', 'Hoitoehdotus', 'Hoitovuosi', 'Mittauspäivä'
    ];

    // Generate CSV rows
    const rows = currentFeatures.map((f, idx) => {
        const p = f.properties;
        return [
            p.STANDNUMBER || (idx + 1),
            p.AREA || '',
            CODES.treeSpecies[p.MAINTREESPECIES] || '',
            CODES.developmentClass[p.DEVELOPMENTCLASS] || p.DEVELOPMENTCLASS || '',
            CODES.fertilityClass[p.FERTILITYCLASS] || '',
            CODES.soilType[p.SOILTYPE] || '',
            p.MEANAGE || '',
            p.MEANHEIGHT || '',
            p.MEANDIAMETER || '',
            p.BASALAREA || '',
            p.STEMCOUNT || '',
            p.VOLUME || '',
            p.VOLUMEGROWTH || '',
            p.SAWLOGVOLUME || '',
            p.PULPWOODVOLUME || '',
            Math.round((p.PROPORTIONPINE || 0) * 100),
            Math.round((p.PROPORTIONSPRUCE || 0) * 100),
            Math.round((p.PROPORTIONOTHER || 0) * 100),
            CODES.cuttingType[p.CUTTINGTYPE] || '',
            p.CUTTINGPROPOSALYEAR || '',
            CODES.silvicultureType[p.SILVICULTURETYPE] || '',
            p.SILVICULTUREPROPOSALYEAR || '',
            p.MEASUREMENTDATE ? new Date(p.MEASUREMENTDATE).toLocaleDateString('fi-FI') : ''
        ];
    });

    // Escape CSV field (handle commas, quotes, newlines)
    const escapeCSV = (field) => {
        const str = String(field ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    // Build CSV content with BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM +
        headers.map(escapeCSV).join(';') + '\n' +
        rows.map(row => row.map(escapeCSV).join(';')).join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `metsavaratiedot_${parcelId.replace(/[^a-zA-Z0-9-]/g, '_')}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
