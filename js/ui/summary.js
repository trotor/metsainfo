/**
 * Kiinteistön yhteenvedon renderöinti tietopaneeliin
 */

import { calculateStatistics } from '../statistics.js';
import { formatNumber, formatCadastralReference, calculateParcelArea } from '../utils.js';
import { tip, closeTips } from './tips.js';
import { renderStandItem, attachStandEventListeners, attachFilterEventListeners } from './stands.js';
import { setActiveTab } from './panel.js';

/**
 * Mobiilin kurkistusrivi: tunnus, toimintovalikko ja neljä avainlukua
 */
export function renderPeek({ label, areaHa, partsInfo, stats, featureCount }) {
    const stat = (value, unit) =>
        `<div class="peek-stat"><span class="peek-value">${value}</span> <span class="peek-unit">${unit}</span></div>`;

    return `
        <div class="peek-head">
            <span class="peek-id">${label}</span>
            ${partsInfo ? `<span class="peek-parts">${partsInfo}</span>` : ''}
            <button type="button" id="sheet-menu-btn" aria-label="Toiminnot" aria-haspopup="menu">⋯</button>
        </div>
        ${featureCount > 0 ? `
        <div class="peek-stats">
            ${stat(formatNumber(areaHa, 2), 'ha')}
            ${stat(featureCount, 'kuviota')}
            ${stat(formatNumber(stats.avgVolume, 0), 'm³/ha')}
            ${stat(formatNumber(stats.totalVolume, 0), 'm³')}
        </div>
        ` : `
        <div class="peek-empty">Ei metsävaratietoja</div>
        `}
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
    const hasRecs = stats.cuttingRecommendations.length > 0 || stats.silvicultureRecommendations.length > 0;

    closeTips(content);

    const peek = document.getElementById('sheet-peek');
    if (peek) {
        peek.innerHTML = renderPeek({
            label: parcelLabel,
            areaHa: parcelArea ? parcelArea / 10000 : stats.totalArea,
            partsInfo: partCount > 1 ? `${partCount} palstaa` : '',
            stats,
            featureCount: features.length
        });
    }

    content.innerHTML = `
        ${features.length > 0 ? `
        <div class="tabbar" role="tablist">
            <button type="button" role="tab" data-tab="summary">Yhteenveto</button>
            <button type="button" role="tab" data-tab="stands">Kuviot (${features.length})</button>
            ${hasRecs ? '<button type="button" role="tab" data-tab="recs">Ehdotukset</button>' : ''}
        </div>
        ` : ''}

        <section class="tab-panel" data-tab="summary">
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
        </section>

        ${hasRecs ? '<section class="tab-panel" data-tab="recs">' : ''}
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
        ${hasRecs ? '</section>' : ''}

        <section class="tab-panel" data-tab="stands">
        <div class="summary-section stands-section">
            <h3>Kuviot <span class="stands-count">(${features.length} kpl)</span></h3>
            <div class="stands-list">
                ${features.map((f, idx) => renderStandItem(f, idx)).join('')}
            </div>
        </div>
        </section>
        ` : `
        <div class="no-data">
            <div class="no-data-icon">🌲</div>
            <p>Ei metsävaratietoja tällä kiinteistöllä.</p>
        </div>
        </section>
        `}
    `;

    attachStandEventListeners(content);
    attachFilterEventListeners(content);
    setActiveTab('summary');
}
