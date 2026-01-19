/**
 * Metsäinfo - Suomen metsävaratiedot kartalla
 *
 * Käyttää:
 * - Metsäkeskuksen avointa WFS-rajapintaa metsävaratietoihin
 * - Kartat.kapsi.fi taustakarttoja ja kiinteistörajoja
 */

// Define EPSG:3067 (ETRS-TM35FIN) projection
proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// Configuration
const CONFIG = {
    // Default center: Somewhere in central Finland
    defaultCenter: [62.5, 25.5],
    defaultZoom: 6,

    // WFS endpoint for forest data
    wfsUrl: 'https://avoin.metsakeskus.fi/rajapinnat/v1/stand/ows',

    // Search radius in meters
    searchRadius: 200,

    // Map layers
    layers: {
        // OpenStreetMap as base layer (works with Web Mercator)
        background: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        // Kapsi.fi WMS for property boundaries (no API key required)
        boundariesWMS: 'https://tiles.kartat.kapsi.fi/kiinteistorajat'
    }
};

// Code mappings for forest data
const CODES = {
    // Main tree species
    treeSpecies: {
        1: 'Mänty',
        2: 'Kuusi',
        3: 'Rauduskoivu',
        4: 'Hieskoivu',
        5: 'Haapa',
        6: 'Harmaaleppä',
        7: 'Tervaleppä',
        8: 'Muu havupuu',
        9: 'Muu lehtipuu',
        10: 'Douglas-kuusi',
        11: 'Kataja',
        12: 'Kontortamänty',
        13: 'Visakoivu',
        14: 'Tammi',
        15: 'Kynäjalava',
        16: 'Vuorijalava',
        17: 'Lehmus',
        18: 'Saarni',
        19: 'Pihlaja',
        20: 'Raita',
        21: 'Tuomi',
        22: 'Lehtikuusi',
        23: 'Pihta',
        24: 'Sembramänty',
        25: 'Vaahtera',
        26: 'Poppeli',
        27: 'Muu jalolehtipuu',
        28: 'Paju',
        29: 'Hybridihaapa'
    },

    // Fertility class
    fertilityClass: {
        1: 'Lehto',
        2: 'Lehtomainen kangas',
        3: 'Tuore kangas',
        4: 'Kuivahko kangas',
        5: 'Kuiva kangas',
        6: 'Karukkokangas',
        7: 'Kallio/hietikko',
        8: 'Lakimetsä/tunturi'
    },

    // Cutting type recommendations
    cuttingType: {
        1: 'Avohakkuu',
        2: 'Siemenpuuhakkuu',
        3: 'Suojuspuuhakkuu',
        4: 'Ylispuiden poisto',
        5: 'Ensiharvennus',
        6: 'Harvennushakkuu',
        7: 'Kaistalehakkuu',
        8: 'Poimintahakkuu',
        9: 'Pienaukkohakkuu',
        10: 'Erikoishakkuu'
    },

    // Silviculture type recommendations
    silvicultureType: {
        1: 'Raivaus',
        2: 'Maanmuokkaus',
        3: 'Kylvö',
        4: 'Istutus',
        5: 'Täydennysviljely',
        6: 'Taimikonhoito',
        7: 'Nuoren metsän kunnostus',
        8: 'Pystykarsinta',
        9: 'Lannoitus',
        10: 'Kunnostusojitus',
        11: 'Metsätien rakentaminen',
        12: 'Metsätien perusparannus'
    },

    // Development class
    developmentClass: {
        '02': 'Nuori kasvatusmetsikkö',
        '03': 'Varttunut kasvatusmetsikkö',
        '04': 'Uudistuskypsä metsikkö',
        'A0': 'Aukea uudistusala',
        'S0': 'Siemenpuumetsikkö',
        'T1': 'Pieni taimikko',
        'T2': 'Varttunut taimikko',
        'Y1': 'Ylispuustoinen taimikko',
        'ER': 'Eri-ikäisrakenteinen metsikkö'
    }
};

// Application state
let map = null;
let forestLayer = null;
let boundaryLayer = null;
let clickMarker = null;
let currentFeatures = [];

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
 * Initialize the Leaflet map
 */
function initMap() {
    map = L.map('map', {
        center: CONFIG.defaultCenter,
        zoom: CONFIG.defaultZoom,
        zoomControl: true
    });

    // Add OpenStreetMap base layer
    L.tileLayer(CONFIG.layers.background, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);
}

/**
 * Initialize map layers
 */
function initLayers() {
    // Property boundaries WMS layer from Kapsi.fi (no API key required)
    boundaryLayer = L.tileLayer.wms(CONFIG.layers.boundariesWMS, {
        layers: 'kiinteistorajat',
        format: 'image/png',
        transparent: true,
        attribution: '&copy; <a href="https://www.maanmittauslaitos.fi/">MML</a>',
        opacity: 0.7,
        maxZoom: 19
    });

    // Add boundaries layer to map (visible at higher zoom levels)
    boundaryLayer.addTo(map);

    // Forest stands layer (GeoJSON, populated on click)
    forestLayer = L.geoJSON(null, {
        style: featureStyle,
        onEachFeature: onEachFeature
    }).addTo(map);
}

/**
 * Style function for forest features
 */
function featureStyle(feature) {
    const props = feature.properties;
    const volume = props.VOLUME || 0;

    // Color based on volume
    let fillColor = '#a8d5a2';
    if (volume > 200) fillColor = '#1e7d1e';
    else if (volume > 150) fillColor = '#3cb043';
    else if (volume > 100) fillColor = '#6cc66c';
    else if (volume > 50) fillColor = '#8cd98c';

    return {
        fillColor: fillColor,
        weight: 1,
        opacity: 0.8,
        color: '#2d5a27',
        fillOpacity: 0.5
    };
}

/**
 * Attach events to each feature
 */
function onEachFeature(feature, layer) {
    layer.on('click', () => {
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
    const toggleBoundaries = document.getElementById('toggle-boundaries');
    const toggleForest = document.getElementById('toggle-forest');

    // Disable boundaries toggle if layer not available
    if (!boundaryLayer) {
        toggleBoundaries.disabled = true;
        toggleBoundaries.checked = false;
        toggleBoundaries.parentElement.style.opacity = '0.5';
        toggleBoundaries.parentElement.title = 'Kiinteistörajat vaativat MML API-avaimen';
    } else {
        toggleBoundaries.addEventListener('change', (e) => {
            if (e.target.checked) {
                boundaryLayer.addTo(map);
            } else {
                map.removeLayer(boundaryLayer);
            }
        });
    }

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
    // Map click handler
    map.on('click', onMapClick);

    // Close panel button
    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('info-panel').classList.add('hidden');
        if (clickMarker) {
            map.removeLayer(clickMarker);
            clickMarker = null;
        }
        forestLayer.clearLayers();
    });
}

/**
 * Handle map click
 */
async function onMapClick(e) {
    const { lat, lng } = e.latlng;

    // Show panel and loading state
    const panel = document.getElementById('info-panel');
    const loading = document.getElementById('loading');
    const content = document.getElementById('info-content');

    panel.classList.remove('hidden');
    loading.classList.remove('hidden');
    content.innerHTML = '';

    // Update or create click marker
    if (clickMarker) {
        clickMarker.setLatLng(e.latlng);
    } else {
        clickMarker = L.circleMarker(e.latlng, {
            radius: 8,
            fillColor: '#2d5a27',
            color: '#fff',
            weight: 3,
            fillOpacity: 1
        }).addTo(map);
    }

    // Clear previous features
    forestLayer.clearLayers();

    try {
        // Fetch forest data
        const features = await fetchForestData(lat, lng);
        currentFeatures = features;

        loading.classList.add('hidden');

        if (features.length > 0) {
            // Add features to map
            forestLayer.addData({
                type: 'FeatureCollection',
                features: features
            });

            // Fit bounds to features
            if (forestLayer.getBounds().isValid()) {
                map.fitBounds(forestLayer.getBounds(), { padding: [50, 50] });
            }

            // Show summary
            showSummary(features);
        } else {
            content.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon">🌲</div>
                    <p>Ei metsävaratietoja tällä alueella.</p>
                    <p style="font-size: 0.8rem; margin-top: 8px;">Kokeile klikata metsäaluetta.</p>
                </div>
            `;
        }
    } catch (error) {
        loading.classList.add('hidden');
        console.error('Error fetching forest data:', error);
        content.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">⚠️</div>
                <p>Tietojen haku epäonnistui.</p>
                <p style="font-size: 0.8rem; margin-top: 8px;">${error.message}</p>
            </div>
        `;
    }
}

/**
 * Convert WGS84 coordinates to ETRS-TM35FIN (EPSG:3067)
 */
function toETRS(lng, lat) {
    return proj4('EPSG:4326', 'EPSG:3067', [lng, lat]);
}

/**
 * Convert ETRS-TM35FIN coordinates to WGS84
 */
function toWGS84(x, y) {
    return proj4('EPSG:3067', 'EPSG:4326', [x, y]);
}

/**
 * Fetch forest data from WFS
 */
async function fetchForestData(lat, lng) {
    // Convert to ETRS-TM35FIN
    const [x, y] = toETRS(lng, lat);
    const r = CONFIG.searchRadius;

    // Create BBOX
    const bbox = `${x - r},${y - r},${x + r},${y + r}`;

    // Build WFS GetFeature URL
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

    console.log('Fetching WFS data:', url);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Convert coordinates from EPSG:3067 to WGS84 for Leaflet
    if (data.features) {
        data.features.forEach(feature => {
            if (feature.geometry) {
                feature.geometry = convertGeometry(feature.geometry);
            }
        });
    }

    return data.features || [];
}

/**
 * Convert geometry coordinates from EPSG:3067 to WGS84
 */
function convertGeometry(geometry) {
    if (geometry.type === 'Polygon') {
        geometry.coordinates = geometry.coordinates.map(ring =>
            ring.map(coord => {
                const [lng, lat] = toWGS84(coord[0], coord[1]);
                return [lng, lat];
            })
        );
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates = geometry.coordinates.map(polygon =>
            polygon.map(ring =>
                ring.map(coord => {
                    const [lng, lat] = toWGS84(coord[0], coord[1]);
                    return [lng, lat];
                })
            )
        );
    }
    return geometry;
}

/**
 * Show summary of forest features
 */
function showSummary(features) {
    const content = document.getElementById('info-content');

    // Calculate statistics
    const stats = calculateStatistics(features);

    content.innerHTML = `
        <div class="summary-section">
            <h3>Yleiskatsaus</h3>
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
                ${stats.speciesPercent.pine > 0 ? `<div class="pine" style="width: ${stats.speciesPercent.pine}%" title="Mänty ${stats.speciesPercent.pine}%"></div>` : ''}
                ${stats.speciesPercent.spruce > 0 ? `<div class="spruce" style="width: ${stats.speciesPercent.spruce}%" title="Kuusi ${stats.speciesPercent.spruce}%"></div>` : ''}
                ${stats.speciesPercent.birch > 0 ? `<div class="birch" style="width: ${stats.speciesPercent.birch}%" title="Lehtipuut ${stats.speciesPercent.birch}%"></div>` : ''}
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

    let totalPine = 0, totalSpruce = 0, totalBirch = 0, totalOther = 0;
    let totalSpecies = 0;
    let validAgeCount = 0, validHeightCount = 0, validDiameterCount = 0, validGrowthCount = 0;
    let validSawlogCount = 0, validPulpwoodCount = 0;

    const cuttingCounts = {};
    const silvicultureCounts = {};

    features.forEach(f => {
        const p = f.properties;

        // Area and volume
        const area = p.AREA || 0;
        stats.totalArea += area;
        stats.totalVolume += (p.VOLUME || 0) * area;
        stats.avgVolume += p.VOLUME || 0;

        // Age, height, diameter, growth
        if (p.MEANAGE) { stats.avgAge += p.MEANAGE; validAgeCount++; }
        if (p.MEANHEIGHT) { stats.avgHeight += p.MEANHEIGHT; validHeightCount++; }
        if (p.MEANDIAMETER) { stats.avgDiameter += p.MEANDIAMETER; validDiameterCount++; }
        if (p.VOLUMEGROWTH) { stats.avgGrowth += p.VOLUMEGROWTH; validGrowthCount++; }
        if (p.SAWLOGVOLUME) { stats.avgSawlog += p.SAWLOGVOLUME; validSawlogCount++; }
        if (p.PULPWOODVOLUME) { stats.avgPulpwood += p.PULPWOODVOLUME; validPulpwoodCount++; }

        // Species proportions (weighted by area)
        // If proportions are available, use them; otherwise infer from main tree species
        let pine = p.PROPORTIONPINE || 0;
        let spruce = p.PROPORTIONSPRUCE || 0;
        let deciduous = p.PROPORTIONOTHER || 0;

        // If proportions sum to 0 or are missing, estimate based on main tree species
        const proportionSum = pine + spruce + deciduous;
        if (proportionSum === 0 && p.MAINTREESPECIES) {
            // Assign 100% to main species category
            if (p.MAINTREESPECIES === 1) pine = 100;
            else if (p.MAINTREESPECIES === 2) spruce = 100;
            else deciduous = 100; // All other species (3-29) treated as deciduous
        }

        totalPine += pine * area;
        totalSpruce += spruce * area;
        totalBirch += deciduous * area; // Using "birch" slot for all deciduous
        totalOther += 0;
        totalSpecies += area;

        // Cutting recommendations
        if (p.CUTTINGTYPE) {
            const name = CODES.cuttingType[p.CUTTINGTYPE] || `Tyyppi ${p.CUTTINGTYPE}`;
            cuttingCounts[name] = (cuttingCounts[name] || 0) + 1;
        }

        // Silviculture recommendations
        if (p.SILVICULTURETYPE) {
            const name = CODES.silvicultureType[p.SILVICULTURETYPE] || `Tyyppi ${p.SILVICULTURETYPE}`;
            silvicultureCounts[name] = (silvicultureCounts[name] || 0) + 1;
        }
    });

    // Calculate averages
    stats.avgVolume = stats.avgVolume / features.length;
    stats.avgAge = validAgeCount > 0 ? stats.avgAge / validAgeCount : 0;
    stats.avgHeight = validHeightCount > 0 ? stats.avgHeight / validHeightCount : 0;
    stats.avgDiameter = validDiameterCount > 0 ? stats.avgDiameter / validDiameterCount : 0;
    stats.avgGrowth = validGrowthCount > 0 ? stats.avgGrowth / validGrowthCount : 0;
    stats.avgSawlog = validSawlogCount > 0 ? stats.avgSawlog / validSawlogCount : 0;
    stats.avgPulpwood = validPulpwoodCount > 0 ? stats.avgPulpwood / validPulpwoodCount : 0;

    // Species percentages
    if (totalSpecies > 0) {
        stats.speciesPercent.pine = Math.round(totalPine / totalSpecies);
        stats.speciesPercent.spruce = Math.round(totalSpruce / totalSpecies);
        stats.speciesPercent.birch = Math.round(totalBirch / totalSpecies);
        stats.speciesPercent.other = Math.round(totalOther / totalSpecies);

        // Normalize to 100%
        const total = stats.speciesPercent.pine + stats.speciesPercent.spruce +
                      stats.speciesPercent.birch + stats.speciesPercent.other;
        if (total !== 100 && total > 0) {
            const diff = 100 - total;
            stats.speciesPercent.other += diff;
        }
    }

    // Convert recommendation counts to sorted arrays
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
