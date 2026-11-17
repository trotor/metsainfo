/**
 * Kuviovalinta (kokeilu, #32): kuvioita valitaan kartalta vapaasti, myös
 * kiinteistörajojen yli, ja valinnasta avautuu sama yhteenveto kuin
 * kiinteistöstä (VIESTIT.naytaValinta). Mukana vain kokeilubuildissa
 * (VITE_KOKEILU=1, dynaaminen import app.js:ssä).
 *
 * Kuviot ladataan WFS:stä (v1:stand, samat kentät kuin kiinteistön
 * yhteenvedossa) 1 km ruuduissa näkyvältä alueelta. Valinta pidetään
 * muistissa istunnon ajan; sitä ei tallenneta.
 * Suunnitelma: docs/plans/2026-11-17-kuviovalinta-design.md
 */

import './valinta.css';
import * as state from '../state.js';
import { emit, VIESTIT } from '../vayla.js';
import { fetchForestDataByBounds } from '../data.js';
import { codeName } from '../koodit.js';
import { locale } from '../i18n.js';
import { formatNumber, coordsEPSG3067ToLatLng } from '../utils.js';
import { isMobileLayout } from '../ui/layout.js';
import { showToast } from '../ui/location-ui.js';
import { createCard, cardHeader } from '../ui/kortti.js';
import { registerTool } from '../ui/tyokalut.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import {
    MIN_ZOOM, MAX_TILES, PANE_Z_INDEX, standKey, tileKeys, tileBounds, createSelection, selectionSummary, canShow, toPseudoParcel
} from './logiikka.js';
import { T } from './teksti.js';

const ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 5h7v7H4zM13 12h7v7h-7z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M15 4.5l2 2 3.5-3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const STYLE = { color: '#14532d', weight: 1.5, opacity: 0.9, fill: true, fillColor: '#bbf7d0', fillOpacity: 0.15 };
const STYLE_SELECTED = { color: '#7c3aed', weight: 3, opacity: 1, fill: true, fillColor: '#a78bfa', fillOpacity: 0.45 };
const PANE = 'valintaPane';

const fmt = (v, d = 0) => formatNumber(v, d, locale());
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function startValinta() {
    addHelpSection({ id: 'valinta', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });

    const selection = createSelection();
    const tiles = new Map();   // ruutu → { status: 'loading'|'ok'|'error', keys: string[] }
    const stands = new Map();  // standKey → Feature (kaikki ladatut)
    const ui = {
        on: false,             // valintatila
        status: 'idle',        // idle | zoom | loading | error
        shown: null            // valinnan tunniste, kun yhteenveto viimeksi näytettiin
    };
    let viewKeys = [];

    /* ---------- Kartta ---------- */

    const pane = state.map.createPane(PANE);
    pane.style.zIndex = PANE_Z_INDEX;

    const layer = L.geoJSON(null, {
        pane: PANE,
        style: (f) => (selection.has(standKey(f)) ? STYLE_SELECTED : STYLE),
        coordsToLatLng: coordsEPSG3067ToLatLng,
        bubblingMouseEvents: false, // ei kiinteistön valintaa kartan alta
        onEachFeature(feature, l) {
            l.on('click', () => toggleStand(feature));
        }
    });

    // Työkalut-listaan (js/ui/tyokalut.js). Tila jatkuu kortin ollessa piilossa
    // (mobiilissa yhteenvedon ajan), jolloin rekisteri näyttää sirun.
    const tool = registerTool({
        id: 'valinta', label: T.nappi, description: T.kuvaus, icon: ICON, order: 30,
        onSelect: () => onButton(), onStop: () => setMode(false)
    });
    const sync = () => tool.setStatus({ active: ui.on, cardOpen: card.isOpen, detail: String(selection.size) });

    function bounds3067() {
        const b = state.map.getBounds();
        const [minX, minY] = proj4('WGS84', 'EPSG:3067', [b.getWest(), b.getSouth()]);
        const [maxX, maxY] = proj4('WGS84', 'EPSG:3067', [b.getEast(), b.getNorth()]);
        return { minX, minY, maxX, maxY };
    }

    function draw() {
        layer.clearLayers();
        if (!ui.on) return;
        const keys = new Set();
        for (const t of viewKeys) for (const k of tiles.get(t)?.keys || []) keys.add(k);
        for (const f of selection.list()) keys.add(standKey(f));
        for (const k of keys) {
            const f = stands.get(k) || selection.list().find(s => standKey(s) === k);
            if (f) layer.addData(f);
        }
    }

    function restyle() {
        layer.eachLayer(l => l.setStyle(selection.has(standKey(l.feature)) ? STYLE_SELECTED : STYLE));
    }

    async function loadView() {
        if (!ui.on) return;
        if (state.map.getZoom() < MIN_ZOOM) {
            viewKeys = [];
            setStatus('zoom');
            draw();
            return;
        }
        const keys = tileKeys(bounds3067());
        if (keys.length > MAX_TILES) {
            viewKeys = [];
            setStatus('zoom');
            draw();
            return;
        }
        viewKeys = keys;
        const missing = keys.filter(k => !tiles.has(k) || tiles.get(k).status === 'error');
        draw();
        if (!missing.length) return setStatus('idle');
        setStatus('loading');
        await Promise.all(missing.map(loadTile));
        if (!ui.on) return;
        setStatus(viewKeys.some(k => tiles.get(k)?.status === 'error') ? 'error' : 'idle');
        draw();
    }

    async function loadTile(key) {
        tiles.set(key, { status: 'loading', keys: [] });
        try {
            const features = await fetchForestDataByBounds(tileBounds(key));
            const keys = features.map(f => {
                const k = standKey(f);
                stands.set(k, f);
                return k;
            });
            tiles.set(key, { status: 'ok', keys });
        } catch {
            tiles.set(key, { status: 'error', keys: [] }); // yritetään uudelleen seuraavalla siirrolla
        }
    }

    state.map.on('moveend', () => { if (ui.on) loadView(); });

    function toggleStand(feature) {
        const result = selection.toggle(feature);
        if (result === 'too-large') showToast(T.liianLaaja);
        restyle();
        render();
    }

    /* ---------- Kortti ---------- */

    // notifyHidden: mobiilissa kortti on piilossa yhteenvedon ajan, mutta tila päättyy silti,
    // kun toinen kortti (lähihaku, maastotila …) avautuu: tasot eivät saa olla päällä yhtä aikaa
    const card = createCard({ id: 'valinta', label: T.nappi, className: 'valinta-kortti', onClose: () => setMode(false), notifyHidden: true });

    card.el.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) return setMode(false);
        const el = e.target.closest('[data-va]');
        if (!el) return;
        const action = el.dataset.va;
        if (action === 'nayta') showSelection();
        else if (action === 'tyhjenna') { selection.clear(); restyle(); draw(); render(); }
        else if (action === 'lopeta') setMode(false);
        else if (action === 'poista') {
            const f = selection.list().find(s => standKey(s) === el.dataset.key);
            if (f) toggleStand(f);
            draw();
        }
    });

    function onButton() {
        // Mobiilissa kortti piiloutuu yhteenvedon ajaksi: lista tai siru tuo sen takaisin
        if (ui.on && !card.isOpen) {
            card.open();
            render();
            return;
        }
        if (!ui.on) setMode(true);
    }

    function setMode(on) {
        if (ui.on === on) {
            if (!on) card.close();
            return;
        }
        ui.on = on;
        emit(VIESTIT.valintatila, { paalla: on });
        if (on) {
            layer.addTo(state.map);
            card.open();
            render();
            loadView();
        } else {
            card.close();
            layer.remove();
            layer.clearLayers();
        }
        sync();
    }

    function setStatus(s) {
        ui.status = s;
        render();
    }

    function showSelection() {
        const features = selection.list();
        if (!features.length) return;
        ui.shown = selection.signature();
        emit(VIESTIT.naytaValinta, { features, parcel: toPseudoParcel(features, T.valintaOtsikko(features.length)) });
        if (isMobileLayout()) card.close(); // tietopaneeli tarvitsee tilan; tila jää päälle
        render();
    }

    function statusHtml() {
        if (ui.status === 'zoom') return `<p class="va-status">${esc(T.zoomaa)}</p>`;
        if (ui.status === 'loading') return `<p class="va-status">${esc(T.ladataan)}</p>`;
        if (ui.status === 'error') return `<p class="va-status va-virhe">${esc(T.virhe)}</p>`;
        return '';
    }

    function listHtml(features) {
        if (!features.length) return `<p class="va-status">${esc(T.tyhja)}</p>`;
        return `<ul class="va-lista">${features.map(f => {
            const p = f.properties || {};
            const species = p.MAINTREESPECIES != null ? codeName('treeSpecies', p.MAINTREESPECIES) : '';
            const info = [species, p.AREA != null ? `${fmt(p.AREA, 2)} ha` : ''].filter(Boolean).join(' · ');
            return `<li class="va-rivi">
                <span><strong>${esc(T.kuvio(p.STANDNUMBER ?? '–'))}</strong>${info ? ` <span class="va-tiedot">${esc(info)}</span>` : ''}</span>
                <button type="button" class="va-poista" data-va="poista" data-key="${esc(standKey(f))}" aria-label="${esc(T.poista)}">×</button>
            </li>`;
        }).join('')}</ul>`;
    }

    function render() {
        sync();
        if (!card.isOpen) return;
        const features = selection.list();
        const sum = selectionSummary(features);
        const changed = ui.shown !== null && ui.shown !== selection.signature() && features.length > 0;
        card.el.innerHTML = `${cardHeader({ title: T.otsikko, badge: T.kokeilu, closeLabel: T.sulje })}
            <div class="va-body">
                <p class="va-ohje">${esc(T.ohje)}</p>
                ${statusHtml()}
                ${features.length ? `<p class="va-summa">${esc(T.yhteenveto(sum.count, fmt(sum.areaHa, 2), fmt(sum.volume, 0)))}</p>` : ''}
                ${listHtml(features)}
                ${changed ? `<p class="va-muuttunut">${esc(T.muuttunut)}</p>` : ''}
                <button type="button" class="kortti-btn kortti-primary" data-va="nayta" ${canShow(selection) ? '' : 'disabled'}>${esc(changed ? T.paivita : T.nayta)}</button>
                <div class="va-actions">
                    <button type="button" class="kortti-btn" data-va="tyhjenna" ${features.length ? '' : 'disabled'}>${esc(T.tyhjenna)}</button>
                    <button type="button" class="kortti-btn" data-va="lopeta">${esc(T.lopeta)}</button>
                </div>
                <p class="va-huom">${esc(T.huom)}</p>
            </div>`;
    }
}
