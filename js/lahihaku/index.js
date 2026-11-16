/**
 * Lähihaku (kokeilu, #28): tietynlaiset kuviot 1 km × 1 km alueelta
 * sijainnin ympäriltä kartalle ja listaksi. Mukana vain kokeilubuildissa
 * (VITE_KOKEILU=1, dynaaminen import app.js:ssä).
 *
 * Oma toimintonsa (js/features.js 'lahihaku'): käyttää vain jaettuja
 * moduuleja (rest2.js, kuviotieto.js, ui/kortti.js, paikannus), ei
 * maastotilan koodia.
 *
 * Haku on tilannekuva: alue lukitaan hakuhetken sijaintiin, eikä lista
 * järjesty uudelleen kävellessä. "Hae uudelleen tästä" päivittää alueen.
 */

import './lahihaku.css';
import * as state from '../state.js';
import { CODES } from '../config.js';
import { formatNumber, coordsEPSG3067ToLatLng } from '../utils.js';
import { latLonTo3067 } from '../location/logic.js';
import { isMobileLayout, onLayoutChange } from '../ui/layout.js';
import { onPositionChange, requestLocation } from '../ui/location-ui.js';
import { createCard, cardHeader, addMapButton } from '../ui/kortti.js';
import { tileCache } from '../rest2.js';
import { mainShare } from '../kuviotieto.js';
import { purchases } from '../platform/purchases.js';
import { isUnlocked } from '../features.js';
import {
    VAIHEET, PUULAJIT, emptyCriteria, hasCriteria, searchBox, boxTileKeys, search, tilesStatus
} from './haku.js';
import { T } from './teksti.js';

const ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="m15 15 5.5 5.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STYLE = { color: '#c2410c', weight: 2, fill: true, fillColor: '#f97316', fillOpacity: 0.25 };
const STYLE_SELECTED = { color: '#e8a317', weight: 4, fillColor: '#e8a317', fillOpacity: 0.3 };

const locked = () => !isUnlocked('lahihaku');

export function startLahihaku() {
    const ui = {
        open: false,
        view: 'form',            // form | results | detail
        criteria: emptyCriteria(),
        pos: null,               // viimeisin sijainti; null-ilmoitus ei poista hakua
        search: null,            // { criteria, center, fromLocation, keys, status, results, done }
        selected: null           // STANDID
    };
    let token = 0;

    /* ---------- Kartta ---------- */

    const boxLayer = L.layerGroup().addTo(state.map);
    const results = L.geoJSON(null, {
        style: () => STYLE,
        coordsToLatLng: coordsEPSG3067ToLatLng,
        bubblingMouseEvents: false, // ei kiinteistön valintaa kartan alta
        onEachFeature(feature, layer) {
            layer.on('click', () => select(feature.properties.STANDID));
        }
    }).addTo(state.map);

    const button = addMapButton({
        map: state.map, label: T.nappi, icon: ICON, onClick: () => toggle(),
        isMobile: isMobileLayout, onLayoutChange
    });

    function drawMap() {
        boxLayer.clearLayers();
        results.clearLayers();
        const s = ui.search;
        if (!ui.open || !s) return;
        const b = searchBox(s.center);
        const corners = [[b.minX, b.minY], [b.maxX, b.minY], [b.maxX, b.maxY], [b.minX, b.maxY]].map(coordsEPSG3067ToLatLng);
        L.polygon(corners, { color: '#1f4d3a', weight: 2, dashArray: '6 6', fill: false, interactive: false }).addTo(boxLayer);
        if (locked() || !s.done) return;
        for (const r of s.results) results.addData(r.stand);
        results.eachLayer(l => l.setStyle(l.feature.properties.STANDID === ui.selected ? STYLE_SELECTED : STYLE));
    }

    // Kortti peittää kartan vasemman reunan (työpöytä) tai alaosan (mobiili)
    function cardPadding() {
        const r = card.el.getBoundingClientRect();
        return isMobileLayout()
            ? { paddingTopLeft: [16, 16], paddingBottomRight: [16, r.height + 16] }
            : { paddingTopLeft: [r.width + 24, 16], paddingBottomRight: [16, 16] };
    }

    function boxBounds(center) {
        const b = searchBox(center);
        return L.latLngBounds([coordsEPSG3067ToLatLng([b.minX, b.minY]), coordsEPSG3067ToLatLng([b.maxX, b.maxY])]);
    }

    /* ---------- Kortti ---------- */

    const card = createCard({ id: 'lahihaku', label: T.nappi, className: 'lahihaku-kortti', onClose: () => toggle(false) });

    card.el.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) return toggle(false);
        const el = e.target.closest('[data-lh]');
        if (!el) return;
        const action = el.dataset.lh;
        if (action === 'vaihe' || action === 'puulaji') {
            const key = action;
            ui.criteria[key] = ui.criteria[key] === el.dataset.value ? null : el.dataset.value;
            render();
        } else if (action === 'hakkuu') {
            ui.criteria.hakkuu = !ui.criteria.hakkuu;
            render();
        } else if (action === 'hae') runSearch();
        else if (action === 'retry') runSearch(ui.search?.center, ui.search?.fromLocation);
        else if (action === 'muuta') { ui.view = 'form'; render(); }
        else if (action === 'listaan') { ui.view = 'results'; ui.selected = null; drawMap(); render(); }
        else if (action === 'valitse') select(Number(el.dataset.id) || el.dataset.id);
    });

    function toggle(force) {
        ui.open = force ?? !ui.open;
        if (ui.open) {
            card.open();
            requestLocation();
            render();
        } else {
            card.close();
        }
        button.setPressed(ui.open);
        drawMap();
    }

    onPositionChange((pos) => {
        if (pos) ui.pos = pos;
        if (ui.open && ui.view === 'form') render();
    });
    purchases.onChange(() => { drawMap(); render(); });

    /* ---------- Haku ---------- */

    function currentCenter() {
        if (ui.pos) return { center: latLonTo3067(ui.pos.lat, ui.pos.lon), fromLocation: true };
        const c = state.map.getCenter();
        return { center: latLonTo3067(c.lat, c.lng), fromLocation: false };
    }

    function runSearch(center, fromLocation) {
        if (!hasCriteria(ui.criteria)) return;
        if (!center) ({ center, fromLocation } = currentCenter());
        const keys = boxTileKeys(searchBox(center));
        const my = ++token;
        ui.search = { criteria: { ...ui.criteria }, center, fromLocation, keys, status: 'loading', results: [], done: false };
        ui.view = 'results';
        ui.selected = null;
        render();
        state.map.fitBounds(boxBounds(center), cardPadding());
        const entries = keys.map(k => tileCache.get(k));
        for (const entry of entries) entry.promise.then(() => { if (my === token) refresh(); });
        refresh();
    }

    function refresh() {
        const s = ui.search;
        if (!s) return;
        const entries = s.keys.map(k => tileCache.peek(k));
        s.status = tilesStatus(entries);
        s.loaded = entries.filter(e => e && e.status !== 'loading').length;
        s.failed = entries.filter(e => e?.status === 'error').length;
        s.done = s.status !== 'loading';
        if (s.done) {
            const okKeys = s.keys.filter((k, i) => entries[i]?.status === 'ok');
            s.results = search(tileCache.stands(okKeys), s.criteria, s.center);
        }
        drawMap();
        render();
    }

    function select(id) {
        const r = ui.search?.results.find(x => x.stand.properties.STANDID === id);
        if (!r || locked()) return;
        ui.selected = id;
        ui.view = 'detail';
        drawMap();
        const layer = results.getLayers().find(l => l.feature.properties.STANDID === id);
        render();
        if (layer) state.map.fitBounds(layer.getBounds(), { maxZoom: 15, ...cardPadding() });
    }

    /* ---------- Piirto ---------- */

    function chips(kind, values, labels) {
        return values.map(v => `<button type="button" class="lh-chip" data-lh="${kind}" data-value="${v}" aria-pressed="${ui.criteria[kind] === v}">${esc(labels[v])}</button>`).join('');
    }

    function formHtml() {
        const where = ui.pos ? T.keskiSijainti : T.keskiKartta;
        const ok = hasCriteria(ui.criteria);
        return `
            <p class="lh-ohje">${esc(T.ohje)}</p>
            <p class="lh-ryhma">${esc(T.vaihe)}</p>
            <div class="lh-chips">${chips('vaihe', VAIHEET, T.vaiheet)}</div>
            <p class="lh-ryhma">${esc(T.puulaji)}</p>
            <div class="lh-chips">${chips('puulaji', PUULAJIT, T.puulajit)}</div>
            <p class="lh-ryhma">${esc(T.muuta)}</p>
            <div class="lh-chips"><button type="button" class="lh-chip" data-lh="hakkuu" aria-pressed="${ui.criteria.hakkuu}">${esc(T.hakkuu)}</button></div>
            <p class="lh-note">${esc(ok ? where : T.valitseEhto)}</p>
            <button type="button" class="kortti-btn kortti-primary" data-lh="hae" ${ok ? '' : 'disabled'}>${esc(T.hae)}</button>`;
    }

    function criteriaText(c) {
        return [c.vaihe && T.vaiheet[c.vaihe], c.puulaji && T.puulajit[c.puulaji], c.hakkuu && T.hakkuu]
            .filter(Boolean).join(' · ');
    }

    function distanceText(r) {
        if (r.distance === 0) return T.tallaKuviolla;
        return T.etaisyys(formatNumber(Math.round(r.distance / 10) * 10, 0), T.suunnat[r.direction] || '');
    }

    function standLabel(p) {
        const dev = CODES.developmentClass[p.DEVELOPMENTCLASS] || p.DEVELOPMENTCLASS || '';
        const sp = CODES.treeSpecies[p.MAINTREESPECIES] || '';
        return [dev, sp].filter(Boolean).join(' · ');
    }

    function resultsHtml() {
        const s = ui.search;
        const head = `<p class="lh-haku">${esc(criteriaText(s.criteria))}</p>
            <p class="lh-note">${esc(s.fromLocation ? T.keskiSijainti : T.keskiKartta)}</p>`;
        const actions = `
            <div class="lh-actions">
                <button type="button" class="kortti-btn" data-lh="muuta">${esc(T.muutaHakua)}</button>
                <button type="button" class="kortti-btn" data-lh="hae">${esc(T.haeTasta)}</button>
            </div>`;
        if (!s.done) return `${head}<p class="lh-status" role="status">${esc(T.haetaan(s.loaded, s.keys.length))}</p>`;
        if (s.status === 'error') {
            return `${head}<p class="lh-status">${esc(T.eiVerkkoa)}</p>
                <button type="button" class="kortti-btn" data-lh="retry">${esc(T.yritaUudelleen)}</button>${actions}`;
        }
        const partial = s.status === 'partial'
            ? `<div class="lh-varoitus"><p>${esc(T.osittain(s.failed, s.keys.length))}</p>
                <button type="button" class="kortti-btn" data-lh="retry">${esc(T.yritaUudelleen)}</button></div>` : '';
        if (locked()) {
            return `${head}${partial}
                <div class="kortti-lukittu">
                    <p>${esc(T.lukittu(s.results.length))}</p>
                    <button type="button" class="kortti-btn kortti-primary" data-est="paywall">${esc(T.avaaLisaosa)}</button>
                </div>${actions}`;
        }
        if (!s.results.length) return `${head}${partial}<p class="lh-status">${esc(T.eiTuloksia)}</p>${actions}`;
        const items = s.results.map(r => {
            const p = r.stand.properties;
            const ha = p.AREA != null ? formatNumber(p.AREA, 1) : '–';
            return `<li><button type="button" class="lh-tulos" data-lh="valitse" data-id="${esc(p.STANDID)}">
                <span class="lh-tulos-nimi">${esc(standLabel(p))}</span>
                <span class="lh-tulos-tiedot">${esc(T.kuvio(p.STANDNUMBER ?? '–', ha))}</span>
                <span class="lh-tulos-tiedot">${esc(distanceText(r))}</span>
            </button></li>`;
        }).join('');
        return `${head}${partial}
            <p class="lh-maara">${esc(T.tulokset(s.results.length))}</p>
            <ul class="lh-lista">${items}</ul>${actions}`;
    }

    function fact(label, value) {
        return value == null || value === '' ? '' : `<div class="lh-fact"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
    }

    function detailHtml() {
        const r = ui.search.results.find(x => x.stand.properties.STANDID === ui.selected);
        if (!r) { ui.view = 'results'; return resultsHtml(); }
        const p = r.stand.properties;
        const ha = p.AREA != null ? formatNumber(p.AREA, 1) : '–';
        const share = mainShare(p);
        const species = CODES.treeSpecies[p.MAINTREESPECIES];
        const cutting = p.CUTTINGTYPE != null
            ? `${CODES.cuttingType[p.CUTTINGTYPE] || p.CUTTINGTYPE}${p.CUTTINGPROPOSALYEAR ? ` ${p.CUTTINGPROPOSALYEAR}` : ''}` : null;
        const year = p.TREESTANDDATE ? String(p.TREESTANDDATE).slice(0, 4) : null;
        return `
            <p class="lh-kuvio">${esc(T.kuvio(p.STANDNUMBER ?? '–', ha))}</p>
            <p class="lh-lead">${esc(standLabel(p))}</p>
            <p class="lh-note">${esc(distanceText(r))}</p>
            <dl class="lh-facts">
                ${fact(T.kehitysluokka, CODES.developmentClass[p.DEVELOPMENTCLASS] || p.DEVELOPMENTCLASS)}
                ${fact(T.paapuulaji, species ? `${species}${share != null ? ` ${formatNumber(share * 100, 0)} %` : ''}` : null)}
                ${fact(T.ika, p.MEANAGE != null ? `${formatNumber(p.MEANAGE, 0)} v` : null)}
                ${fact(T.pituus, p.MEANHEIGHT != null ? `${formatNumber(p.MEANHEIGHT, 1)} m` : null)}
                ${fact(T.tilavuus, p.VOLUME != null ? `${formatNumber(p.VOLUME, 0)} m³/ha` : null)}
                ${fact(T.hakkuuehdotus, cutting)}
            </dl>
            <p class="lh-source">${esc(T.lahde(year))}</p>
            <button type="button" class="kortti-btn kortti-link" data-lh="listaan">${esc(T.takaisinListaan)}</button>`;
    }

    function render() {
        if (!ui.open) return;
        const body = ui.view === 'detail' && ui.search ? detailHtml()
            : ui.view === 'results' && ui.search ? resultsHtml()
            : formHtml();
        card.el.innerHTML = `${cardHeader({ title: T.otsikko, badge: T.kokeilu, closeLabel: T.sulje })}
            <div class="lh-body">${body}</div>`;
    }
}
