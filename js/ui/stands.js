/**
 * Kuviolista: renderöinti, avaus ja korostus kartalla
 */

import { codeName } from '../koodit.js';
import { locale } from '../i18n.js';
import { T } from './teksti.js';
import * as state from '../state.js';
import { formatNumber, getGeometryBounds3067 } from '../utils.js';
import { tip } from './tips.js';
import { isMobileLayout, visibleCenterOffset, topInset } from './layout.js';
import { setActiveTab, getSheet, mapFitOptions } from './panel.js';

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

        if (isMobileLayout()) {
            // Keskitä näkyvään alueeseen hakupalkin ja tietopaneelin väliin
            const sheet = getSheet();
            const offset = visibleCenterOffset(sheet ? sheet.targetHeight() : 0, topInset());
            const point = state.map.project(L.latLng(lat, lng)).add(offset);
            state.map.panTo(state.map.unproject(point));
        } else {
            state.map.panTo([lat, lng]);
        }

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
        // Full-tilassa kartasta ei näkyisi mitään: lasketaan paneeli puolikkaaksi
        const sheet = getSheet();
        if (sheet && isMobileLayout() && sheet.getSnap() === 'full') sheet.setSnap('half');
        const bounds = state.highlightedStandLayer.getBounds();
        if (bounds.isValid()) {
            state.map.fitBounds(bounds, mapFitOptions({ maxZoom: state.map.getZoom() }));
        }
    }
}

/**
 * Avaa kuvion kuviolistassa (kartan napautus mobiilissa): Kuviot-välilehti,
 * paneeli vähintään puolikkaaksi, muut kuviot kiinni, kuvio näkyviin.
 * Palauttaa false, jos kuviota ei ole listassa.
 */
export function openStand(index, { win = window } = {}) {
    if (!Number.isInteger(index) || index < 0 || index >= state.currentFeatures.length) return false;
    const item = document.querySelector(`.stand-item[data-index="${index}"]`);
    if (!item) return false;

    setActiveTab('stands');

    const sheet = getSheet();
    if (sheet && isMobileLayout(win) && sheet.getSnap() === 'peek') {
        sheet.setSnap('half');
    }

    document.querySelectorAll('.stand-item.expanded').forEach(other => {
        if (other === item) return;
        other.classList.remove('expanded');
        other.querySelector('.stand-toggle').textContent = '▼';
    });
    item.classList.add('expanded');
    item.querySelector('.stand-toggle').textContent = '▲';

    highlightStand(index, true);
    item.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
    return true;
}

/**
 * Attach event listeners for stand items
 */
export function attachStandEventListeners(root = document) {
    root.querySelectorAll('.stand-item').forEach(item => {
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
export function attachFilterEventListeners(root = document) {
    root.querySelectorAll('.recommendations-list.clickable li').forEach(item => {
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
export function renderStandItem(feature, index) {
    const p = feature.properties;
    const fmt = (v, d = 0) => formatNumber(v, d, locale());
    const species = codeName('treeSpecies', p.MAINTREESPECIES) || '-';
    const devClass = codeName('developmentClass', p.DEVELOPMENTCLASS) || p.DEVELOPMENTCLASS || '-';
    const fertility = codeName('fertilityClass', p.FERTILITYCLASS) || '-';
    const accessibility = codeName('accessibility', p.ACCESSIBILITY) || '-';
    const drainage = codeName('drainageState', p.DRAINAGESTATE) || '-';
    const soil = codeName('soilType', p.SOILTYPE) || '-';
    const cutting = codeName('cuttingType', p.CUTTINGTYPE);
    const silviculture = codeName('silvicultureType', p.SILVICULTURETYPE);
    const measureDate = p.MEASUREMENTDATE ? new Date(p.MEASUREMENTDATE).toLocaleDateString(locale()) : '-';

    const pineP = Math.round((p.PROPORTIONPINE || 0) * 100);
    const spruceP = Math.round((p.PROPORTIONSPRUCE || 0) * 100);
    const otherP = Math.round((p.PROPORTIONOTHER || 0) * 100);

    return `
        <div class="stand-item" data-index="${index}">
            <div class="stand-header">
                <div class="stand-title">
                    <span class="stand-number">${T.kuvio(p.STANDNUMBER || (index + 1))}</span>
                    <span class="stand-species">${species}</span>
                </div>
                <div class="stand-summary">
                    <span class="stand-area">${fmt(p.AREA, 2)} ha</span>
                    <span class="stand-volume">${fmt(p.VOLUME, 0)} m³/ha</span>
                </div>
                <div class="stand-toggle">▼</div>
            </div>
            <div class="stand-details">
                <div class="detail-group">
                    <div class="detail-title">${T.perustiedot}</div>
                    <div class="detail-grid">
                        <div class="detail-row"><span>${T.kehitysluokka} ${tip('kehitysluokka')}:</span><span>${devClass}</span></div>
                        <div class="detail-row"><span>${T.kasvupaikka} ${tip('kasvupaikka')}:</span><span>${fertility}</span></div>
                        <div class="detail-row"><span>${T.maalaji} ${tip('maalaji')}:</span><span>${soil}</span></div>
                        <div class="detail-row"><span>${T.ojitustilanne} ${tip('ojitustilanne')}:</span><span>${drainage}</span></div>
                        <div class="detail-row"><span>${T.kulkukelpoisuus} ${tip('kulkukelpoisuus')}:</span><span>${accessibility}</span></div>
                    </div>
                </div>
                <div class="detail-group">
                    <div class="detail-title">${T.puusto}</div>
                    <div class="detail-grid">
                        <div class="detail-row"><span>${T.ika}</span><span>${p.MEANAGE || '-'} ${T.vuotta}</span></div>
                        <div class="detail-row"><span>${T.pituus}</span><span>${fmt(p.MEANHEIGHT, 1)} m</span></div>
                        <div class="detail-row"><span>${T.lapimitta}</span><span>${fmt(p.MEANDIAMETER, 1)} cm</span></div>
                        <div class="detail-row"><span>${T.pohjapintaAlaLyhyt}</span><span>${fmt(p.BASALAREA, 1)} m²/ha</span></div>
                        <div class="detail-row"><span>${T.runkolukuLyhyt}</span><span>${fmt(p.STEMCOUNT, 0)} ${T.kplHa}</span></div>
                        <div class="detail-row"><span>${T.kasvuLyhyt}</span><span>${fmt(p.VOLUMEGROWTH, 1)} ${T.m3haV}</span></div>
                    </div>
                </div>
                <div class="detail-group">
                    <div class="detail-title">${T.puulajijakauma}</div>
                    <div class="mini-species-bar">
                        ${pineP > 0 ? `<div class="pine" style="width: ${pineP}%" title="${T.manty} ${pineP}%"></div>` : ''}
                        ${spruceP > 0 ? `<div class="spruce" style="width: ${spruceP}%" title="${T.kuusi} ${spruceP}%"></div>` : ''}
                        ${otherP > 0 ? `<div class="birch" style="width: ${otherP}%" title="${T.lehtipuutLyhyt} ${otherP}%"></div>` : ''}
                    </div>
                    <div class="mini-species-legend">
                        ${pineP > 0 ? `<span>${T.manty} ${pineP}%</span>` : ''}
                        ${spruceP > 0 ? `<span>${T.kuusi} ${spruceP}%</span>` : ''}
                        ${otherP > 0 ? `<span>${T.lehtipuutLyhyt} ${otherP}%</span>` : ''}
                    </div>
                </div>
                <div class="detail-group">
                    <div class="detail-title">${T.puutavaralajit}</div>
                    <div class="detail-grid">
                        <div class="detail-row"><span>${T.tukkipuu}</span><span>${fmt(p.SAWLOGVOLUME, 0)} m³/ha</span></div>
                        <div class="detail-row"><span>${T.kuitupuu}</span><span>${fmt(p.PULPWOODVOLUME, 0)} m³/ha</span></div>
                        <div class="detail-row"><span>${T.yhteensa}</span><span>${fmt(p.VOLUME, 0)} m³/ha</span></div>
                        <div class="detail-row"><span>${T.kuviollaYht}</span><span>${fmt((p.VOLUME || 0) * (p.AREA || 0), 0)} m³</span></div>
                    </div>
                </div>
                ${cutting || silviculture ? `
                <div class="detail-group">
                    <div class="detail-title">${T.toimenpideEhdotukset}</div>
                    <div class="detail-grid">
                        ${cutting ? `<div class="detail-row highlight"><span>${T.hakkuu}</span><span>${cutting}${p.CUTTINGPROPOSALYEAR ? ` (${p.CUTTINGPROPOSALYEAR})` : ''}</span></div>` : ''}
                        ${silviculture ? `<div class="detail-row highlight"><span>${T.hoito}</span><span>${silviculture}${p.SILVICULTUREPROPOSALYEAR ? ` (${p.SILVICULTUREPROPOSALYEAR})` : ''}</span></div>` : ''}
                    </div>
                </div>
                ` : ''}
                <div class="detail-footer">
                    <span class="measurement-date">${T.mitattu(measureDate)}</span>
                </div>
            </div>
        </div>
    `;
}
