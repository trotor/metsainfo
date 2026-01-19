/**
 * Metsäinfo - Suomen metsävaratiedot kartalla
 *
 * Käyttää:
 * - Metsäkeskuksen avointa WFS-rajapintaa metsävaratietoihin
 * - MML INSPIRE WFS kiinteistötietoihin
 */

// Define EPSG:3067 (ETRS-TM35FIN) projection for Proj4 (used for coordinate conversion)
proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// Configuration
const CONFIG = {
    // Default center in WGS84 (lat, lng) - central Finland
    defaultCenter: [64.0, 26.0],
    defaultZoom: 6,
    minZoomForParcels: 14, // Minimum zoom level to load parcels

    // WFS endpoint for forest data
    wfsUrl: 'https://avoin.metsakeskus.fi/rajapinnat/v1/stand/ows',

    // MML INSPIRE WFS for cadastral parcels
    cadastralWfsUrl: 'https://inspire-wfs.maanmittauslaitos.fi/inspire-wfs/cp/ows',

    // Map layers
    layers: {
        osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
};

// Code mappings for forest data
const CODES = {
    treeSpecies: {
        1: 'Mänty', 2: 'Kuusi', 3: 'Rauduskoivu', 4: 'Hieskoivu', 5: 'Haapa',
        6: 'Harmaaleppä', 7: 'Tervaleppä', 8: 'Muu havupuu', 9: 'Muu lehtipuu'
    },
    cuttingType: {
        1: 'Avohakkuu', 2: 'Siemenpuuhakkuu', 3: 'Suojuspuuhakkuu', 4: 'Ylispuiden poisto',
        5: 'Ensiharvennus', 6: 'Harvennushakkuu', 7: 'Kaistalehakkuu', 8: 'Poimintahakkuu',
        9: 'Pienaukkohakkuu', 10: 'Erikoishakkuu'
    },
    silvicultureType: {
        1: 'Raivaus', 2: 'Maanmuokkaus', 3: 'Kylvö', 4: 'Istutus', 5: 'Täydennysviljely',
        6: 'Taimikonhoito', 7: 'Nuoren metsän kunnostus', 8: 'Pystykarsinta', 9: 'Lannoitus',
        10: 'Kunnostusojitus', 11: 'Metsätien rakentaminen', 12: 'Metsätien perusparannus'
    }
};

// Application state
let map = null;
let forestLayer = null;
let cadastralLayer = null;      // All parcels in view
let selectedParcelLayer = null; // Selected/highlighted parcel
let clickMarker = null;
let currentFeatures = [];
let currentParcel = null;
let loadedParcels = new Map();  // Cache loaded parcels by ID

/**
 * Initialize the application
 */
function init() {
    initMap();
    initLayers();
    initControls();
    initEventListeners();
}

/**
 * Initialize the Leaflet map with standard Web Mercator CRS
 */
function initMap() {
    map = L.map('map', {
        center: CONFIG.defaultCenter,
        zoom: CONFIG.defaultZoom,
        zoomControl: true
    });

    // Add OpenStreetMap as base layer
    L.tileLayer(CONFIG.layers.osm, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        minZoom: 2
    }).addTo(map);
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
 * Style function for forest features
 */
function featureStyle(feature) {
    const props = feature.properties;
    const volume = props.VOLUME || 0;

    let fillColor = '#a8d5a2';
    if (volume > 200) fillColor = '#1e7d1e';
    else if (volume > 150) fillColor = '#3cb043';
    else if (volume > 100) fillColor = '#6cc66c';
    else if (volume > 50) fillColor = '#8cd98c';

    return {
        fillColor: fillColor,
        weight: 2,
        opacity: 0.9,
        color: '#2d5a27',
        fillOpacity: 0.6
    };
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
 * Initialize layer controls
 */
function initControls() {
    const toggleForest = document.getElementById('toggle-forest');

    toggleForest.addEventListener('change', (e) => {
        if (e.target.checked) {
            forestLayer.addTo(map);
        } else {
            map.removeLayer(forestLayer);
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
    });
}

/**
 * Load cadastral parcels in the current map view
 */
async function loadParcelsInView() {
    const zoom = map.getZoom();

    // Only load parcels at sufficient zoom level
    if (zoom < CONFIG.minZoomForParcels) {
        cadastralLayer.clearLayers();
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
            loadedParcels.clear();

            data.features.forEach(feature => {
                const id = feature.properties?.nationalCadastralReference || feature.id;
                loadedParcels.set(id, feature);
                cadastralLayer.addData(feature);
            });
        }
    } catch (error) {
        console.warn('Failed to load parcels:', error);
    }
}

/**
 * Select a parcel and load its forest data
 */
async function selectParcel(parcel) {
    const panel = document.getElementById('info-panel');
    const loading = document.getElementById('loading');
    const content = document.getElementById('info-content');

    panel.classList.remove('hidden');
    loading.classList.remove('hidden');
    content.innerHTML = '';

    // Clear previous selection
    selectedParcelLayer.clearLayers();
    forestLayer.clearLayers();

    // Highlight selected parcel
    selectedParcelLayer.addData(parcel);
    currentParcel = parcel;

    try {
        // Get parcel bounds for forest data query
        const bounds = getGeometryBounds3067(parcel.geometry);

        // Fetch forest data within the parcel's bounding box
        const features = await fetchForestDataByBounds(bounds);

        // Filter features that belong to the parcel
        const filteredFeatures = filterFeaturesByParcel(features, parcel);
        currentFeatures = filteredFeatures;

        loading.classList.add('hidden');

        // Add forest features to map
        if (filteredFeatures.length > 0) {
            filteredFeatures.forEach(f => forestLayer.addData(f));
        }

        // Show summary with parcel info
        showSummary(filteredFeatures, parcel);

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
 * Show summary of forest features and parcel info
 */
function showSummary(features, parcel) {
    const content = document.getElementById('info-content');
    const stats = calculateStatistics(features);

    const parcelProps = parcel ? parcel.properties : null;
    const parcelLabel = parcelProps?.label || formatCadastralReference(parcelProps?.nationalCadastralReference) || '-';

    content.innerHTML = `
        ${parcel ? `
        <div class="summary-section parcel-section">
            <h3>Kiinteistö</h3>
            <div class="parcel-info">
                <div class="parcel-id">${parcelLabel}</div>
                <div class="parcel-details">Kiinteistötunnus</div>
            </div>
        </div>
        ` : ''}

        ${features.length > 0 ? `
        <div class="summary-section">
            <h3>Metsävarat yhteenveto</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.count}</div>
                    <div class="stat-label">Kuviota</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.totalArea, 2)}</div>
                    <div class="stat-label">Hehtaaria</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgVolume, 0)}</div>
                    <div class="stat-label">m³/ha keskiarvo</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.totalVolume, 0)}</div>
                    <div class="stat-label">m³ yhteensä</div>
                </div>
            </div>
        </div>

        <div class="summary-section">
            <h3>Puulajijakauma</h3>
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
                    <div class="stat-label">Keski-ikä (v)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgHeight, 1)}</div>
                    <div class="stat-label">Keskipituus (m)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgDiameter, 1)}</div>
                    <div class="stat-label">Keskiläpimitta (cm)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgGrowth, 1)}</div>
                    <div class="stat-label">Kasvu (m³/ha/v)</div>
                </div>
            </div>
        </div>

        <div class="summary-section">
            <h3>Tukkipuu / Kuitupuu</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgSawlog, 0)}</div>
                    <div class="stat-label">Tukkia (m³/ha)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatNumber(stats.avgPulpwood, 0)}</div>
                    <div class="stat-label">Kuitua (m³/ha)</div>
                </div>
            </div>
        </div>

        ${stats.cuttingRecommendations.length > 0 ? `
        <div class="summary-section">
            <h3>Hakkuuehdotukset</h3>
            <ul class="recommendations-list">
                ${stats.cuttingRecommendations.map(r => `
                    <li>
                        <span class="recommendation-type">${r.name}</span>
                        <span class="recommendation-count">${r.count} kuviota</span>
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        ${stats.silvicultureRecommendations.length > 0 ? `
        <div class="summary-section">
            <h3>Metsänhoitoehdotukset</h3>
            <ul class="recommendations-list">
                ${stats.silvicultureRecommendations.map(r => `
                    <li>
                        <span class="recommendation-type">${r.name}</span>
                        <span class="recommendation-count">${r.count} kuviota</span>
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}
        ` : `
        <div class="no-data">
            <div class="no-data-icon">🌲</div>
            <p>Ei metsävaratietoja tällä kiinteistöllä.</p>
        </div>
        `}
    `;
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
        speciesPercent: { pine: 0, spruce: 0, birch: 0, other: 0 },
        cuttingRecommendations: [],
        silvicultureRecommendations: []
    };

    if (features.length === 0) return stats;

    let totalPine = 0, totalSpruce = 0, totalBirch = 0;
    let totalSpecies = 0;
    let validAgeCount = 0, validHeightCount = 0, validDiameterCount = 0, validGrowthCount = 0;
    let validSawlogCount = 0, validPulpwoodCount = 0;

    const cuttingCounts = {};
    const silvicultureCounts = {};

    features.forEach(f => {
        const p = f.properties;
        const area = p.AREA || 0;

        stats.totalArea += area;
        stats.totalVolume += (p.VOLUME || 0) * area;
        stats.avgVolume += p.VOLUME || 0;

        if (p.MEANAGE) { stats.avgAge += p.MEANAGE; validAgeCount++; }
        if (p.MEANHEIGHT) { stats.avgHeight += p.MEANHEIGHT; validHeightCount++; }
        if (p.MEANDIAMETER) { stats.avgDiameter += p.MEANDIAMETER; validDiameterCount++; }
        if (p.VOLUMEGROWTH) { stats.avgGrowth += p.VOLUMEGROWTH; validGrowthCount++; }
        if (p.SAWLOGVOLUME) { stats.avgSawlog += p.SAWLOGVOLUME; validSawlogCount++; }
        if (p.PULPWOODVOLUME) { stats.avgPulpwood += p.PULPWOODVOLUME; validPulpwoodCount++; }

        let pine = p.PROPORTIONPINE || 0;
        let spruce = p.PROPORTIONSPRUCE || 0;
        let deciduous = p.PROPORTIONOTHER || 0;

        if ((pine + spruce + deciduous) === 0 && p.MAINTREESPECIES) {
            if (p.MAINTREESPECIES === 1) pine = 100;
            else if (p.MAINTREESPECIES === 2) spruce = 100;
            else deciduous = 100;
        }

        totalPine += pine * area;
        totalSpruce += spruce * area;
        totalBirch += deciduous * area;
        totalSpecies += area;

        if (p.CUTTINGTYPE) {
            const name = CODES.cuttingType[p.CUTTINGTYPE] || `Tyyppi ${p.CUTTINGTYPE}`;
            cuttingCounts[name] = (cuttingCounts[name] || 0) + 1;
        }

        if (p.SILVICULTURETYPE) {
            const name = CODES.silvicultureType[p.SILVICULTURETYPE] || `Tyyppi ${p.SILVICULTURETYPE}`;
            silvicultureCounts[name] = (silvicultureCounts[name] || 0) + 1;
        }
    });

    stats.avgVolume = stats.avgVolume / features.length;
    stats.avgAge = validAgeCount > 0 ? stats.avgAge / validAgeCount : 0;
    stats.avgHeight = validHeightCount > 0 ? stats.avgHeight / validHeightCount : 0;
    stats.avgDiameter = validDiameterCount > 0 ? stats.avgDiameter / validDiameterCount : 0;
    stats.avgGrowth = validGrowthCount > 0 ? stats.avgGrowth / validGrowthCount : 0;
    stats.avgSawlog = validSawlogCount > 0 ? stats.avgSawlog / validSawlogCount : 0;
    stats.avgPulpwood = validPulpwoodCount > 0 ? stats.avgPulpwood / validPulpwoodCount : 0;

    if (totalSpecies > 0) {
        stats.speciesPercent.pine = Math.round(totalPine / totalSpecies);
        stats.speciesPercent.spruce = Math.round(totalSpruce / totalSpecies);
        stats.speciesPercent.birch = Math.round(totalBirch / totalSpecies);

        const total = stats.speciesPercent.pine + stats.speciesPercent.spruce + stats.speciesPercent.birch;
        if (total !== 100 && total > 0) {
            stats.speciesPercent.birch += (100 - total);
        }
    }

    stats.cuttingRecommendations = Object.entries(cuttingCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    stats.silvicultureRecommendations = Object.entries(silvicultureCounts)
        .map(([name, count]) => ({ name, count }))
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
