/**
 * Metsätöiden rajoitteet (kokeilu): muinaisjäännökset, kulttuuriperintö-
 * kohteet, luonnonsuojelu-, Natura- ja erämaa-alueet sekä Metsälain
 * erityisen tärkeät elinympäristöt kiinteistön tai kuviovalinnan alueelta.
 *
 * Yhteenvetoon laatikko "Huomioitavaa metsätöissä", kuvion tietoihin rivi
 * ja kohteet kartalle. Maksuton (js/features.js 'rajoitteet'). Vain
 * kokeilubuildissa (VITE_KOKEILU=1, dynaaminen import app.js:ssä).
 * Suunnitelma: docs/plans/2026-11-17-saavutettavuus-v2-rajoitteet-retkeily.md
 */

import './rajoitteet.css';
import * as state from '../state.js';
import { on, VIESTIT } from '../vayla.js';
import { coordsEPSG3067ToLatLng, getGeometryBounds3067 } from '../utils.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { createConstraintSource } from './aineisto.js';
import { matchArea, matchStand, groupItems, TOL } from './logiikka.js';
import { T } from './teksti.js';

const VARIT = {
    muinais: '#92400e', kulttuuri: '#b45309', suojelu: '#166534',
    natura: '#0f766e', erama: '#3f6212', mete: '#c0392b'
};
const NAMES_SHOWN = 4;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function areasOf(parcel) {
    if (!parcel) return [];
    return (parcel.parts ? parcel.parts : [parcel]).map(p => p.geometry).filter(g => g && (g.type === 'Polygon' || g.type === 'MultiPolygon'));
}

function bboxOf(geoms, margin) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const g of geoms) {
        const b = getGeometryBounds3067(g);
        minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY);
        maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY);
    }
    return { minX: minX - margin, minY: minY - margin, maxX: maxX + margin, maxY: maxY + margin };
}

export function startRajoitteet() {
    addHelpSection({ id: 'rajoitteet', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });

    const source = createConstraintSource();
    const ui = { ctx: null, status: 'idle', items: [], partial: false, showMap: true };
    let token = 0;

    // Alueet kuviotasojen alle (omassa paneelissa), jotta kuvion napautus avaa kuvion;
    // pisteet (muinaisjäännökset) kuvioiden päällä ja napautettavina.
    const pane = state.map.createPane('rajoitteetPane');
    pane.style.zIndex = 390;
    const areaLayer = L.geoJSON(null, {
        pane: 'rajoitteetPane',
        coordsToLatLng: coordsEPSG3067ToLatLng,
        style: (f) => ({ color: VARIT[f.properties.ryhma], weight: 2, dashArray: '5 4', fillOpacity: 0.12 }),
        onEachFeature: (f, l) => l.bindPopup(popupHtml(f.properties))
    });
    const layer = L.geoJSON(null, {
        coordsToLatLng: coordsEPSG3067ToLatLng,
        // style koskee myös pistemerkkejä (CircleMarker), joten pisteille oma tyyli
        style: (f) => (f.geometry.type === 'Point'
            ? { color: '#fff', weight: 2, fillColor: VARIT[f.properties.ryhma], fillOpacity: 0.95 }
            : { color: VARIT[f.properties.ryhma], weight: 2, dashArray: '5 4', fillOpacity: 0.12 }),
        pointToLayer: (f, latlng) => L.circleMarker(latlng, {
            radius: 7, color: '#fff', weight: 2, fillColor: VARIT[f.properties.ryhma], fillOpacity: 0.95
        }),
        onEachFeature: (f, l) => l.bindPopup(popupHtml(f.properties))
    });

    function popupHtml(p) {
        return `<strong>${esc(T.ryhmat[p.ryhma])}</strong><br>${esc(p.nimi || '–')}${p.laji ? `<br><span class="rj-laji">${esc(p.laji)}</span>` : ''}`;
    }

    function drawMap() {
        layer.clearLayers();
        areaLayer.clearLayers();
        if (!ui.ctx || !ui.showMap || !ui.items.length) { layer.remove(); areaLayer.remove(); return; }
        for (const i of ui.items) {
            const f = { type: 'Feature', geometry: i.geometry, properties: { ryhma: i.ryhma, nimi: i.nimi, laji: i.laji } };
            (i.geometry.type === 'Point' || i.geometry.type === 'MultiPoint' ? layer : areaLayer).addData(f);
        }
        areaLayer.addTo(state.map);
        layer.addTo(state.map);
    }

    async function run() {
        const my = ++token;
        const ctx = ui.ctx;
        const areas = areasOf(ctx.parcel);
        if (!areas.length) return;
        ui.status = 'loading';
        render();
        try {
            const { items, partial } = await source.items(bboxOf(areas, TOL + 10));
            if (my !== token) return;
            ui.items = matchArea(items, areas);
            ui.partial = partial;
            ui.status = 'done';
        } catch {
            if (my !== token) return;
            ui.items = [];
            ui.status = 'error';
        }
        render();
        decorateStands();
        drawMap();
    }

    function boxHtml() {
        const valinta = Boolean(ui.ctx?.parcel?.properties?.valinta);
        let body;
        if (ui.status === 'loading') body = `<p class="rj-teksti">${esc(T.lasketaan)}</p>`;
        else if (ui.status === 'error') body = `<p class="rj-teksti">${esc(T.virhe)}</p><button type="button" class="kortti-btn" data-rj="retry">${esc(T.yritaUudelleen)}</button>`;
        else {
            const groups = groupItems(ui.items);
            body = groups.length
                ? `<ul class="rj-lista">${groups.map(g => {
                    const shown = g.nimet.slice(0, NAMES_SHOWN);
                    const rest = g.nimet.length - shown.length;
                    return `<li><span class="rj-piste" style="background:${VARIT[g.ryhma]}"></span><span><strong>${esc(T.ryhmat[g.ryhma])}</strong> · ${esc(T.maara(g.maara))}${shown.length ? `<br><span class="rj-nimet">${esc(shown.join(', '))}${rest > 0 ? ` ${esc(T.muuta(rest))}` : ''}</span>` : ''}</span></li>`;
                }).join('')}</ul>
                    <button type="button" class="kortti-btn rj-kartta" data-rj="kartta" aria-pressed="${ui.showMap}">${esc(ui.showMap ? T.piilotaKartalta : T.naytaKartalla)}</button>`
                : `<p class="rj-teksti">${esc(valinta ? T.eiKohteitaValinta : T.eiKohteita)}</p>`;
            if (ui.partial) body += `<p class="rj-huom">${esc(T.osittain)}</p>`;
        }
        return `<div class="rj-otsikko"><span>${esc(T.otsikko)}</span><span class="rj-kokeilu">${esc(T.kokeilu)}</span></div>
            ${body}
            <p class="rj-huom">${esc(T.huom)}</p>
            <p class="rj-lahde">${esc(T.lahteet)}</p>`;
    }

    function render() {
        const content = ui.ctx?.content;
        if (!content?.isConnected) return;
        let box = content.querySelector('.rj-laatikko');
        if (!box) {
            box = document.createElement('section');
            box.className = 'summary-section rj-laatikko';
            box.addEventListener('click', (e) => {
                const action = e.target.closest('[data-rj]')?.dataset.rj;
                if (action === 'retry') run();
                else if (action === 'kartta') { ui.showMap = !ui.showMap; render(); drawMap(); }
            });
            const anchor = content.querySelector('.parcel-section');
            if (!anchor) return;
            anchor.after(box);
        }
        box.innerHTML = boxHtml();
    }

    function decorateStands() {
        const content = ui.ctx?.content;
        if (!content?.isConnected) return;
        content.querySelectorAll('.rj-lisa').forEach(el => el.remove());
        if (ui.status !== 'done' || !ui.items.length) return;
        content.querySelectorAll('.stand-item').forEach(itemEl => {
            const f = ui.ctx.features[Number(itemEl.dataset.index)];
            if (!f?.geometry) return;
            const hits = matchStand(ui.items, f.geometry);
            if (!hits.length) return;
            const summary = itemEl.querySelector('.stand-summary');
            if (summary) {
                const badge = document.createElement('span');
                badge.className = 'rj-lisa rj-merkki';
                badge.title = T.merkki;
                badge.setAttribute('aria-label', T.merkki);
                badge.textContent = '!';
                summary.prepend(badge);
            }
            const details = itemEl.querySelector('.stand-details');
            if (details) {
                const div = document.createElement('div');
                div.className = 'detail-group rj-lisa rj-kuvio';
                div.innerHTML = `<p><strong>${esc(T.kuviolla)}:</strong> ${groupItems(hits).map(g => `${esc(T.ryhmat[g.ryhma])}${g.nimet.length ? ` (${esc(g.nimet.slice(0, NAMES_SHOWN).join(', '))})` : ''}`).join('; ')}</p>`;
                const footer = details.querySelector('.detail-footer');
                if (footer) footer.before(div); else details.appendChild(div);
            }
        });
    }

    on(VIESTIT.yhteenveto, (ctx) => {
        ui.ctx = ctx;
        ui.items = [];
        ui.partial = false;
        ui.status = 'idle';
        token++;
        drawMap();
        if (ctx?.parcel) run();
    }, { replay: true });

    on(VIESTIT.tyhjennys, () => {
        ui.ctx = null;
        ui.items = [];
        token++;
        drawMap();
    });
}
