/**
 * UI rendering, interactions, and DOM manipulation
 */

import { CODES, TOOLTIPS, COLOR_MODES, MKI_COLOR_MODES } from './config.js';
import * as state from './state.js';
import { calculateStatistics } from './statistics.js';
import { formatNumber, formatCadastralReference, calculateParcelArea, getGeometryBounds3067 } from './utils.js';
import { featureStyle, mkiStyle } from './styles.js';

/**
 * Toggle the help modal
 */
export function toggleHelp() {
    const modal = document.getElementById('help-modal');
    const overlay = document.getElementById('help-overlay');
    const isHidden = modal.classList.contains('hidden');
    modal.classList.toggle('hidden', !isHidden);
    overlay.classList.toggle('hidden', !isHidden);
}

/**
 * Generate tooltip HTML for a term
 */
export function tip(key) {
    const text = TOOLTIPS[key];
    if (!text) return '';
    return `<span class="info-tip" tabindex="0" aria-label="${text}"><span class="info-tip-icon">i</span><span class="info-tip-text">${text}</span></span>`;
}

/**
 * Show popup for a single feature
 */
export function showFeaturePopup(feature, layer) {
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
 * Attach click handler to each forest feature
 */
export function onEachFeature(feature, layer) {
    layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        showFeaturePopup(feature, layer);
    });
}

/**
 * Attach popup to each habitat feature
 */
export function onEachHabitat(feature, layer) {
    const p = feature.properties;
    const typeName = CODES.habitatType[p.SPECIALFEATURECODE] || `Tyyppi ${p.SPECIALFEATURECODE || '-'}`;
    const area = formatNumber(p.AREA, 2);

    layer.bindPopup(`
        <strong>Luontokohde</strong><br>
        <span style="color:#c0392b;font-weight:600">${typeName}</span><br>
        Pinta-ala: ${area} ha<br>
        <span style="font-size:0.8em;color:#888">Metsälain 10 § erityisen tärkeä elinympäristö</span>
    `);
}

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
        '<strong>Metsänkäyttöilmoitus</strong><br>' +
        '<span style="color:#c0392b;font-weight:600">' + purpose + '</span><br>' +
        'Hakkuutapa: ' + practice + '<br>' +
        'Pinta-ala: ' + area + ' ha<br>' +
        'Vuosi: ' + year + '<br>' +
        'Puulaji: ' + species
    );

    layer.bindTooltip(year + ' – ' + purpose, {
        sticky: true,
        direction: 'top',
        opacity: 0.9
    });
}

/**
 * Attach click handler to each parcel
 */
export function onEachParcel(feature, layer, selectParcelFn) {
    layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectParcelFn(feature);
    });
}

/**
 * Add a label marker for a parcel
 */
export function addParcelLabel(feature) {
    const props = feature.properties;
    const label = props?.label || formatCadastralReference(props?.nationalCadastralReference);
    if (!label) return;

    let latLng;
    if (props?.referencePoint?.coordinates) {
        const [x, y] = props.referencePoint.coordinates;
        const [lng, lat] = proj4('EPSG:3067', 'WGS84', [x, y]);
        latLng = L.latLng(lat, lng);
    } else {
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

    state.parcelLabelsLayer.addLayer(labelMarker);
}

/**
 * Change color mode and refresh forest layer styling + legend
 */
export function setColorMode(mode) {
    if (!COLOR_MODES[mode]) return;
    state.setState('currentColorMode', mode);

    state.forestLayer.eachLayer(layer => {
        if (layer.feature) {
            layer.setStyle(featureStyle(layer.feature));
        }
    });

    updateLegend();
}

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

/**
 * Update the color legend display
 */
export function updateLegend() {
    const legendEl = document.getElementById('color-legend');
    if (!legendEl) return;

    const mode = COLOR_MODES[state.currentColorMode];
    if (!mode || !state.forestLayer || state.forestLayer.getLayers().length === 0) {
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

/**
 * Copy shareable link to clipboard
 */
export function copyParcelLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copy-link-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Kopioitu!';
        setTimeout(() => { btn.textContent = originalText; }, 2000);
    });
}

/**
 * Download forest stand data as CSV file
 */
export function downloadCSV() {
    if (!state.currentFeatures || state.currentFeatures.length === 0) {
        alert('Ei ladattavia metsäkuviotietoja.');
        return;
    }

    const parcelId = state.currentParcel?.properties?.nationalCadastralReference ||
                     state.currentParcel?.properties?.label || 'tuntematon';

    const headers = [
        'Kuvio', 'Pinta-ala (ha)', 'Pääpuulaji', 'Kehitysluokka', 'Kasvupaikka',
        'Maalaji', 'Ikä (v)', 'Pituus (m)', 'Läpimitta (cm)', 'Pohjapinta-ala (m²/ha)',
        'Runkoluku (kpl/ha)', 'Tilavuus (m³/ha)', 'Kasvu (m³/ha/v)', 'Tukkipuu (m³/ha)',
        'Kuitupuu (m³/ha)', 'Mänty (%)', 'Kuusi (%)', 'Lehtipuut (%)',
        'Hakkuuehdotus', 'Hakkuuvuosi', 'Hoitoehdotus', 'Hoitovuosi', 'Mittauspäivä'
    ];

    const rows = state.currentFeatures.map((f, idx) => {
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

    const escapeCSV = (field) => {
        const str = String(field ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    const BOM = '\uFEFF';
    const csvContent = BOM +
        headers.map(escapeCSV).join(';') + '\n' +
        rows.map(row => row.map(escapeCSV).join(';')).join('\n');

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

/**
 * Highlight a single stand on the map
 */
export function highlightStand(index, highlight) {
    state.highlightedStandLayer.clearLayers();
    document.querySelectorAll('.recommendations-list.clickable li').forEach(li => li.classList.remove('active'));

    if (highlight && state.currentFeatures[index]) {
        const feature = state.currentFeatures[index];
        state.highlightedStandLayer.addData(feature);

        const bounds = getGeometryBounds3067(feature.geometry);
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const [lng, lat] = proj4('EPSG:3067', 'WGS84', [centerX, centerY]);
        state.map.panTo([lat, lng]);

        state.setState('selectedStandIndex', index);
    } else {
        state.setState('selectedStandIndex', null);
    }
}

/**
 * Highlight stands matching a filter
 */
export function highlightFilteredStands(filterType, filterValue) {
    state.highlightedStandLayer.clearLayers();

    const matchingFeatures = state.currentFeatures.filter(f => {
        const p = f.properties;
        if (filterType === 'cutting') {
            return p.CUTTINGTYPE === filterValue;
        } else if (filterType === 'silviculture') {
            return p.SILVICULTURETYPE === filterValue;
        }
        return false;
    });

    matchingFeatures.forEach(f => state.highlightedStandLayer.addData(f));

    if (matchingFeatures.length > 0) {
        const bounds = state.highlightedStandLayer.getBounds();
        if (bounds.isValid()) {
            state.map.fitBounds(bounds, { padding: [50, 50], maxZoom: state.map.getZoom() });
        }
    }
}

/**
 * Attach event listeners for stand items
 */
function attachStandEventListeners() {
    document.querySelectorAll('.stand-item').forEach(item => {
        const header = item.querySelector('.stand-header');
        const toggle = item.querySelector('.stand-toggle');
        const index = parseInt(item.dataset.index);

        header.addEventListener('click', () => {
            const isExpanded = item.classList.toggle('expanded');
            toggle.textContent = isExpanded ? '▲' : '▼';
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

            const wasActive = item.classList.contains('active');
            document.querySelectorAll('.recommendations-list.clickable li').forEach(li => li.classList.remove('active'));

            if (!wasActive) {
                item.classList.add('active');
                highlightFilteredStands(filterType, filterValue);
            } else {
                state.highlightedStandLayer.clearLayers();
            }
        });
    });
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
 * Show summary of forest features and parcel info
 */
export function showSummary(features, parcel, partCount = 1) {
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

    attachStandEventListeners();
    attachFilterEventListeners();
}
