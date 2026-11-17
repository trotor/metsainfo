/**
 * Kiinteistön yhteenvedon renderöinti tietopaneeliin
 */

import { calculateStatistics } from '../statistics.js';
import { formatNumber, formatCadastralReference, calculateParcelArea } from '../utils.js';
import { emit, VIESTIT } from '../vayla.js';
import { locale } from '../i18n.js';
import { T } from './teksti.js';

const fmt = (v, d = 0) => formatNumber(v, d, locale());
import { tip, closeTips } from './tips.js';
import { renderStandItem, attachStandEventListeners, attachFilterEventListeners } from './stands.js';
import { setActiveTab } from './panel.js';
import { estimateTabButton, estimateTabPanel, estimateSummaryCard, initEstimate } from './estimate.js';

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
            <button type="button" id="sheet-menu-btn" aria-label="${T.toiminnot}" aria-haspopup="menu">⋯</button>
        </div>
        ${featureCount > 0 ? `
        <div class="peek-stats">
            ${stat(fmt(areaHa, 2), 'ha')}
            ${stat(featureCount, T.kuviotaYksikko)}
            ${stat(fmt(stats.avgVolume, 0), 'm³/ha')}
            ${stat(fmt(stats.totalVolume, 0), 'm³')}
        </div>
        ` : `
        <div class="peek-empty">${T.eiMetsavaratietoja}</div>
        `}
    `;
}

/**
 * Show summary of forest features and parcel info
 */
/** Hakkuuvuosi on lähivuosina (0–2 v), jolloin se korostetaan. */
function isSoon(year) {
    return Number(year) - new Date().getFullYear() <= 2;
}

export function showSummary(features, parcel, partCount = 1) {
    const content = document.getElementById('info-content');
    const stats = calculateStatistics(features);

    const parcelProps = parcel ? parcel.properties : null;
    // Kuviovalinta (kokeilu): näennäiskiinteistö ilman kiinteistötunnusta
    const valinta = Boolean(parcelProps?.valinta);
    const parcelLabel = parcelProps?.label || formatCadastralReference(parcelProps?.nationalCadastralReference) || '-';
    const parcelArea = calculateParcelArea(parcel, partCount);
    const parcelAreaText = parcelArea ? `${fmt(parcelArea / 10000, 2)} ha` : '';
    const partsInfo = partCount > 1 ? T.palstaaSulkeissa(partCount) : '';
    const hasRecs = stats.cuttingRecommendations.length > 0 || stats.silvicultureRecommendations.length > 0;

    closeTips(content);

    const peek = document.getElementById('sheet-peek');
    if (peek) {
        peek.innerHTML = renderPeek({
            label: parcelLabel,
            areaHa: parcelArea ? parcelArea / 10000 : stats.totalArea,
            partsInfo: partCount > 1 ? T.palstaa(partCount) : '',
            stats,
            featureCount: features.length
        });
    }

    content.innerHTML = `
        ${features.length > 0 ? `
        <div class="tabbar" role="tablist">
            <button type="button" role="tab" data-tab="summary">${T.yhteenveto}</button>
            <button type="button" role="tab" data-tab="stands">${T.kuviotTab(features.length)}</button>
            ${hasRecs ? `<button type="button" role="tab" data-tab="recs">${T.ehdotukset}</button>` : ''}
            ${estimateTabButton()}
        </div>
        ` : ''}

        <section class="tab-panel" data-tab="summary">
        ${parcel ? `
        <div class="summary-section parcel-section">
            <h3>${valinta ? T.valinta : T.kiinteisto}</h3>
            <div class="parcel-info">
                <div class="parcel-id">${parcelLabel}</div>
                <div class="parcel-details">${parcelAreaText}${partsInfo}</div>
            </div>
            <div class="parcel-actions">
                ${valinta ? '' : `<button class="action-btn copy-link-btn" id="copy-link-btn" onclick="copyParcelLink()">
                    <span class="action-icon">🔗</span> ${T.kopioiLinkki}
                </button>`}
                ${features.length > 0 ? `
                <button class="action-btn download-btn" onclick="downloadCSV()">
                    <span class="action-icon">⬇</span> ${T.lataaCsv}
                </button>
                <button class="action-btn print-btn" onclick="window.print()">
                    <span class="action-icon">🖨</span> ${T.tulosta}
                </button>
                ` : ''}
            </div>
        </div>
        ` : ''}

        ${features.length > 0 && stats.measurementYearMin ? `
        <div class="measurement-info group-aineisto${(new Date().getFullYear() - stats.measurementYearMax) >= 5 ? ' measurement-old' : ''}">
            <span class="measurement-label">${T.mittausvuosi(stats.measurementYearMin === stats.measurementYearMax ? stats.measurementYearMin : `${stats.measurementYearMin}–${stats.measurementYearMax}`)}</span>
            ${(new Date().getFullYear() - stats.measurementYearMax) >= 5 ? `<span class="measurement-warning">${T.vanhentuneita}</span>` : ''}
        </div>
        ` : ''}

        ${features.length > 0 ? `
        <div class="summary-section group-puusto">
            <h3>${T.metsavaratYhteenveto}</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.count}</div>
                    <div class="stat-label">${T.kuviota} ${tip('kuvio')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.totalArea, 2)}</div>
                    <div class="stat-label">${T.hehtaaria}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.avgVolume, 0)}</div>
                    <div class="stat-label">${T.keskiarvoTilavuus} ${tip('tilavuus')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.totalVolume, 0)}</div>
                    <div class="stat-label">${T.yhteensaTilavuus}</div>
                </div>
            </div>
        </div>

        ${estimateSummaryCard()}

        <div class="summary-section group-puusto">
            <h3>${T.puulajijakauma} ${tip('puulajijakauma')}</h3>
            <div class="species-bar">
                ${stats.speciesPercent.pine > 0 ? `<div class="pine" style="width: ${stats.speciesPercent.pine}%"></div>` : ''}
                ${stats.speciesPercent.spruce > 0 ? `<div class="spruce" style="width: ${stats.speciesPercent.spruce}%"></div>` : ''}
                ${stats.speciesPercent.birch > 0 ? `<div class="birch" style="width: ${stats.speciesPercent.birch}%"></div>` : ''}
            </div>
            <div class="species-legend">
                <span><span class="dot" style="background: #3498db"></span> ${T.manty} ${stats.speciesPercent.pine}%</span>
                <span><span class="dot" style="background: #27ae60"></span> ${T.kuusi} ${stats.speciesPercent.spruce}%</span>
                <span><span class="dot" style="background: #f1c40f"></span> ${T.lehtipuut} ${stats.speciesPercent.birch}%</span>
            </div>
        </div>

        <div class="summary-section group-puusto">
            <h3>${T.puusto}</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.avgAge, 0)}</div>
                    <div class="stat-label">${T.keskiIka} ${tip('keskiIka')}</div>
                    <div class="stat-range">${fmt(stats.minAge, 0)} – ${fmt(stats.maxAge, 0)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.avgHeight, 1)}</div>
                    <div class="stat-label">${T.keskipituus} ${tip('keskipituus')}</div>
                    <div class="stat-range">${fmt(stats.minHeight, 1)} – ${fmt(stats.maxHeight, 1)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.avgDiameter, 1)}</div>
                    <div class="stat-label">${T.keskilapimitta} ${tip('keskilapimitta')}</div>
                    <div class="stat-range">${fmt(stats.minDiameter, 1)} – ${fmt(stats.maxDiameter, 1)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.avgGrowth, 1)}</div>
                    <div class="stat-label">${T.kasvu} ${tip('kasvu')}</div>
                    <div class="stat-range">${fmt(stats.minGrowth, 1)} – ${fmt(stats.maxGrowth, 1)}</div>
                </div>
            </div>
        </div>

        <div class="summary-section group-puusto">
            <h3>${T.tukkiKuitu}</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.avgSawlog, 0)}</div>
                    <div class="stat-label">${T.tukkia} ${tip('tukkipuu')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.avgPulpwood, 0)}</div>
                    <div class="stat-label">${T.kuitua} ${tip('kuitupuu')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.totalSawlog, 0)}</div>
                    <div class="stat-label">${T.tukkiaYht}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.totalPulpwood, 0)}</div>
                    <div class="stat-label">${T.kuituaYht}</div>
                </div>
            </div>
        </div>

        <div class="summary-section group-maa">
            <h3>${T.kasvupaikka}</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.avgBasalArea, 1)}</div>
                    <div class="stat-label">${T.pohjapintaAla} ${tip('pohjapintaAla')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${fmt(stats.avgStemCount, 0)}</div>
                    <div class="stat-label">${T.runkoluku} ${tip('runkoluku')}</div>
                </div>
            </div>
            ${stats.fertilityDistribution.length > 0 ? `
            <div class="distribution-list">
                <strong>${T.kasvupaikkatyypit}</strong>
                ${stats.fertilityDistribution.map(f => `<span class="dist-item">${f.name} (${f.area} ha)</span>`).join('')}
            </div>
            ` : ''}
            ${stats.developmentDistribution.length > 0 ? `
            <div class="distribution-list">
                <strong>${T.kehitysluokat}</strong>
                ${stats.developmentDistribution.map(d => `<span class="dist-item">${d.name} (${T.kplSulkeissa(d.count)})</span>`).join('')}
            </div>
            ` : ''}
        </div>
        </section>

        ${hasRecs ? '<section class="tab-panel" data-tab="recs">' : ''}
        ${stats.cuttingRecommendations.length > 0 ? `
        <div class="summary-section group-hakkuu">
            <h3>${T.hakkuuehdotukset} ${tip('hakkuuehdotus')}</h3>
            <ul class="recommendations-list clickable">
                ${stats.cuttingRecommendations.map(r => `
                    <li data-filter="cutting" data-value="${r.code}">
                        <span class="recommendation-type">${r.name}</span>
                        <span class="recommendation-info">
                            <span class="recommendation-count">${T.kuvioLkm(r.count)}</span>
                            ${r.year ? `<span class="recommendation-year${isSoon(r.year) ? ' soon' : ''}">${r.year}</span>` : ''}
                        </span>
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        ${stats.silvicultureRecommendations.length > 0 ? `
        <div class="summary-section group-hoito">
            <h3>${T.metsanhoitoehdotukset} ${tip('metsanhoitoehdotus')}</h3>
            <ul class="recommendations-list clickable">
                ${stats.silvicultureRecommendations.map(r => `
                    <li data-filter="silviculture" data-value="${r.code}">
                        <span class="recommendation-type">${r.name}</span>
                        <span class="recommendation-info">
                            <span class="recommendation-count">${T.kuvioLkm(r.count)}</span>
                            ${r.year ? `<span class="recommendation-year">${r.year}</span>` : ''}
                        </span>
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}
        ${hasRecs ? '</section>' : ''}

        ${estimateTabPanel()}

        <section class="tab-panel" data-tab="stands">
        <div class="summary-section stands-section">
            <h3>${T.kuviot} <span class="stands-count">${T.kplYhteensa(features.length)}</span></h3>
            <div class="stands-list">
                ${features.map((f, idx) => renderStandItem(f, idx)).join('')}
            </div>
        </div>
        </section>
        ` : `
        <div class="no-data">
            <div class="no-data-icon">🌲</div>
            <p>${valinta ? T.eiMetsavaratietojaValinnalla : T.eiMetsavaratietojaKiinteistolla}</p>
        </div>
        </section>
        `}
    `;

    // ⋯-valikon linkki ei toimi valinnalle (ei kiinteistötunnusta)
    const copyItem = document.querySelector('#sheet-menu [data-action="copy"]');
    if (copyItem) copyItem.hidden = valinta;

    attachStandEventListeners(content);
    attachFilterEventListeners(content);
    if (features.length > 0) initEstimate(content, { features, parcel, label: parcelLabel });
    setActiveTab('summary');
    // Lisäosat (kokeilubuildissa suosikit) voivat täydentää yhteenvetoa
    emit(VIESTIT.yhteenveto, {
        content, parcel, features, label: parcelLabel,
        reference: parcelProps?.nationalCadastralReference || null
    });
}
