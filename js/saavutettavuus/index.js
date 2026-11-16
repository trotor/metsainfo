/**
 * Kuvion saavutettavuus (kokeilu): metsäkuljetusmatka, maapohjan
 * korjuukelpoisuus ja tieyhteys kiinteistölle kuvioittain.
 * Vain VITE_KOKEILU=1 -buildissa (dynaaminen import app.js:ssä).
 * Suunnitelma: docs/plans/2026-11-16-saavutettavuus-kokeilu.md
 */

import './saavutettavuus.css';
import * as state from '../state.js';
import { codeName } from '../koodit.js';
import { locale } from '../i18n.js';
import { formatNumber, coordsEPSG3067ToLatLng } from '../utils.js';
import { on, VIESTIT } from '../vayla.js';
import { isMobileLayout, onLayoutChange } from '../ui/layout.js';
import { createCard, cardHeader, addMapButton } from '../ui/kortti.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { openStand } from '../ui/stands.js';
import { purchases } from '../platform/purchases.js';
import { isUnlocked } from '../features.js';
import { analyseParcel } from './analyysi.js';
import { createRoadSource, harvestArea } from './aineisto.js';
import { fetchRaster } from './rasteri.js';
import { T } from './teksti.js';

const ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 21 11 3M16 21 13 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 7v2M12 12v2M12 17v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

export const VARIT = { hyva: '#15803d', kohtalainen: '#ca8a04', heikko: '#b91c1c' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (v, d = 0) => formatNumber(v, d, locale());
const meters = (m) => (m >= 1000 ? `${fmt(m / 1000, 1)} km` : `${fmt(Math.round(m / 10) * 10)} m`);
const tonnes = (kg) => fmt(kg / 1000, kg % 1000 ? 1 : 0);
const locked = () => !isUnlocked('saavutettavuus');

export function startSaavutettavuus() {
    addHelpSection({ id: 'saavutettavuus', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });

    const roads = createRoadSource();
    const ui = { open: false, ctx: null, status: 'idle', result: null, selected: null };
    let token = 0;

    /* ---------- Kartta ---------- */

    const roadLayer = L.layerGroup();
    const standLayer = L.geoJSON(null, {
        coordsToLatLng: coordsEPSG3067ToLatLng,
        bubblingMouseEvents: false,
        style: (f) => standStyle(f),
        onEachFeature(feature, layer) {
            layer.on('click', () => select(feature.properties.__index));
        }
    });

    function standStyle(f) {
        const r = ui.result?.kuviot.get(f.properties.__index);
        const color = VARIT[r?.luokka] || '#6b7280';
        const sel = f.properties.__index === ui.selected;
        return { color: sel ? '#111827' : color, weight: sel ? 4 : 1.5, fillColor: color, fillOpacity: 0.35 };
    }

    const line = (l, style) => L.polyline(l.coords.map(coordsEPSG3067ToLatLng), { interactive: false, ...style });

    function drawMap() {
        roadLayer.clearLayers();
        standLayer.clearLayers();
        const r = ui.result;
        const show = ui.open && r && !locked();
        if (!show) {
            roadLayer.remove();
            standLayer.remove();
            return;
        }
        for (const l of r.tiet) {
            if (l.kind === 'auto') line(l, { color: '#1f2937', weight: 3, opacity: 0.8 }).addTo(roadLayer);
            else if (l.kind === 'ajopolku') line(l, { color: '#1f2937', weight: 2, dashArray: '4 6', opacity: 0.7 }).addTo(roadLayer);
        }
        for (const l of r.reitti) line(l, { color: '#2563eb', weight: 5, opacity: 0.9 }).addTo(roadLayer);
        ui.ctx.features.forEach((f, i) => {
            if (f.geometry) standLayer.addData({ type: 'Feature', geometry: f.geometry, properties: { __index: i } });
        });
        roadLayer.addTo(state.map);
        standLayer.addTo(state.map);
    }

    const button = addMapButton({
        map: state.map, label: T.nappi, icon: ICON, onClick: () => toggle(),
        isMobile: isMobileLayout, onLayoutChange
    });

    /* ---------- Analyysi ---------- */

    async function run() {
        const ctx = ui.ctx;
        if (!ctx?.features?.length || locked()) return;
        const my = ++token;
        ui.status = 'loading';
        ui.result = null;
        render();
        try {
            const result = await analyseParcel({ parcel: ctx.parcel, features: ctx.features }, {
                roads,
                raster: (bbox) => fetchRaster(bbox),
                area: (p) => harvestArea(p)
            });
            if (my !== token) return;
            ui.result = result;
            ui.status = 'done';
        } catch (err) {
            if (my !== token) return;
            console.warn('[saavutettavuus]', err);
            ui.status = 'error';
        }
        decorate();
        drawMap();
        render();
    }

    on(VIESTIT.yhteenveto, (ctx) => {
        ui.ctx = ctx;
        ui.selected = null;
        ui.result = null;
        ui.status = 'idle';
        token++;
        addSummaryButton();
        drawMap();
        if (!locked() && ctx?.features?.length) run();
        else render();
    }, { replay: true });

    purchases.onChange(() => {
        if (!locked() && ui.ctx && !ui.result && ui.status !== 'loading') run();
        else { drawMap(); render(); }
    });

    /* ---------- Yhteenveto: painike ja kuvioiden merkit ---------- */

    function addSummaryButton() {
        const content = ui.ctx?.content;
        if (!content?.isConnected) return;
        content.querySelectorAll('.sv-lisa').forEach(el => el.remove());
        const parcelInfo = content.querySelector('.parcel-section .parcel-info');
        if (!parcelInfo) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sv-lisa sv-avaa';
        btn.textContent = T.avaa;
        btn.addEventListener('click', () => toggle(true));
        parcelInfo.after(btn);
    }

    function decorate() {
        const content = ui.ctx?.content;
        const r = ui.result;
        if (!content?.isConnected || !r || locked()) return;
        content.querySelectorAll('.stand-item').forEach(itemEl => {
            itemEl.querySelectorAll('.sv-lisa').forEach(el => el.remove());
            const k = r.kuviot.get(Number(itemEl.dataset.index));
            if (!k || k.score == null) return;
            const badge = document.createElement('span');
            badge.className = `sv-lisa sv-merkki sv-${k.luokka}`;
            badge.textContent = k.score;
            badge.title = T.merkki(k.score, T.luokat[k.luokka]);
            badge.setAttribute('aria-label', badge.title);
            itemEl.querySelector('.stand-summary')?.prepend(badge);
            const row = document.createElement('div');
            row.className = 'sv-lisa detail-row';
            row.innerHTML = `<span>${esc(T.otsikko)}:</span><span>${esc(`${T.pisteet(k.score)} · ${T.luokat[k.luokka]}`)}</span>`;
            itemEl.querySelector('.stand-details')?.prepend(row);
        });
    }

    /* ---------- Kortti ---------- */

    const card = createCard({ id: 'saavutettavuus', label: T.nappi, className: 'saavutettavuus-kortti', onClose: () => toggle(false) });

    card.el.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) return toggle(false);
        const el = e.target.closest('[data-sv]');
        if (!el) return;
        const action = el.dataset.sv;
        if (action === 'retry') run();
        else if (action === 'valitse') select(Number(el.dataset.index));
        else if (action === 'kuvio') {
            toggle(false);
            openStand(Number(el.dataset.index));
        }
    });

    function toggle(force) {
        ui.open = force ?? !ui.open;
        if (ui.open) {
            card.open();
            render();
            fitParcel();
        } else {
            card.close();
            ui.selected = null;
        }
        button.setPressed(ui.open);
        drawMap();
    }

    // Kortti peittää kartan oikean reunan (työpöytä) tai alaosan (mobiili),
    // työpöydällä tietopaneeli vasemman reunan
    function cardPadding() {
        const r = card.el.getBoundingClientRect();
        if (isMobileLayout()) return { paddingTopLeft: [16, 16], paddingBottomRight: [16, r.height + 16] };
        const panel = document.getElementById('info-panel');
        const left = panel && !panel.classList.contains('hidden') ? panel.getBoundingClientRect().right : 0;
        return { paddingTopLeft: [left + 16, 16], paddingBottomRight: [r.width + 24, 16] };
    }

    function fitParcel() {
        const parts = ui.ctx?.parcel ? (ui.ctx.parcel.parts || [ui.ctx.parcel]) : [];
        const layer = L.geoJSON({ type: 'FeatureCollection', features: parts }, { coordsToLatLng: coordsEPSG3067ToLatLng });
        const b = layer.getBounds();
        if (b.isValid()) state.map.fitBounds(b, cardPadding());
    }

    function select(index) {
        ui.selected = ui.selected === index ? null : index;
        standLayer.eachLayer(l => l.setStyle(standStyle(l.feature)));
        render();
        card.el.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' });
    }

    function soilText(k, feature) {
        if (k.maapohjaLahde === 'kartta' && k.paaluokka) return T.korjuukelpoisuus(T.maapohja[k.paaluokka]);
        if (k.maapohjaLahde === 'kuvio') return T.kuvionTieto(codeName('accessibility', feature?.properties?.ACCESSIBILITY));
        return null;
    }

    function roadSection(r) {
        const t = r.tie;
        const lines = [];
        if (!t.reachesParcel) lines.push(T.eiTieta);
        else {
            lines.push(T.tieTulee);
            if (t.route?.length === 0) lines.push(T.yleisenTienVarrella);
            else if (t.route) lines.push(T.reitti(meters(t.route.length)));
            else lines.push(T.eiReittia);
            if (t.tiekunta) lines.push(T.tiekunta);
        }
        const limits = t.rajoitukset.map(x => x.tyyppi === 'kelirikko' ? T.kelirikko(tonnes(x.kg), x.alku, x.loppu) : T.massa(tonnes(x.kg)));
        return `<section class="sv-tie">
            <h3>${esc(T.tieKiinteistolle)}</h3>
            ${lines.map(l => `<p>${esc(l)}</p>`).join('')}
            ${limits.length ? `<p class="sv-rajoitus"><strong>${esc(T.rajoitukset)}:</strong> ${esc(limits.join(', '))}</p>` : ''}
        </section>`;
    }

    function standRow(k, i) {
        const f = ui.ctx.features[i];
        const n = f?.properties?.STANDNUMBER ?? i + 1;
        const details = [
            k.tieKuviolla ? T.tieKuviolla : k.meanDist != null ? T.metsakuljetus(meters(k.meanDist)) : null,
            soilText(k, f),
            k.puuttuu.length ? T.puuttuu(k.puuttuu.map(p => T.osat[p]).join(', ')) : null
        ].filter(Boolean);
        const sel = i === ui.selected;
        return `<li><button type="button" class="sv-rivi${sel ? ' sv-valittu' : ''}" data-sv="valitse" data-index="${i}" aria-pressed="${sel}">
                <span class="sv-merkki sv-${esc(k.luokka)}" aria-hidden="true">${k.score ?? '–'}</span>
                <span class="sv-rivi-teksti">
                    <span class="sv-rivi-nimi">${esc(T.kuvio(n))} · ${esc(k.luokka ? T.luokat[k.luokka] : '–')}</span>
                    ${details.map(d => `<span class="sv-rivi-tieto">${esc(d)}</span>`).join('')}
                </span>
            </button>
            ${sel ? `<button type="button" class="kortti-btn sv-nayta" data-sv="kuvio" data-index="${i}">${esc(T.naytaKuvio)}</button>` : ''}
        </li>`;
    }

    function body() {
        if (!ui.ctx) return `<p class="sv-status">${esc(T.valitseKiinteisto)}</p>`;
        if (!ui.ctx.features?.length) return `<p class="sv-status">${esc(T.eiKuvioita)}</p>`;
        if (locked()) {
            return `<div class="kortti-lukittu">
                <p>${esc(T.lukittu)}</p>
                <button type="button" class="kortti-btn kortti-primary" data-est="paywall">${esc(T.avaaLisaosa)}</button>
            </div>`;
        }
        if (ui.status === 'loading' || ui.status === 'idle') return `<p class="sv-status" role="status">${esc(T.lasketaan)}</p>`;
        if (ui.status === 'error') {
            return `<p class="sv-status">${esc(T.virhe)}</p>
                <button type="button" class="kortti-btn" data-sv="retry">${esc(T.yritaUudelleen)}</button>`;
        }
        const r = ui.result;
        const number = (i) => Number(ui.ctx.features[i]?.properties?.STANDNUMBER ?? i + 1);
        const rows = [...r.kuviot.entries()].sort(([a], [b]) => number(a) - number(b) || a - b)
            .map(([i, k]) => standRow(k, i)).join('');
        return `${r.partial ? `<div class="sv-varoitus"><p>${esc(T.osittain)}</p>
                <button type="button" class="kortti-btn" data-sv="retry">${esc(T.yritaUudelleen)}</button></div>` : ''}
            ${roadSection(r)}
            <h3 class="sv-otsikko">${esc(T.kuviot)}</h3>
            <ul class="sv-lista">${rows}</ul>
            <p class="sv-huom">${esc(T.kartalla)}</p>
            <p class="sv-huom">${esc(T.arvio)}</p>
            <p class="sv-huom">${esc(T.lisamaksu)}</p>
            <p class="sv-lahde">${esc(T.lahteet(r.lahteet.alue))}</p>`;
    }

    function render() {
        if (!ui.open) return;
        const label = ui.ctx?.label ? ` · ${ui.ctx.label}` : '';
        card.el.innerHTML = `${cardHeader({ title: T.otsikko, badge: T.kokeilu, closeLabel: T.sulje })}
            ${ui.ctx ? `<p class="sv-kiinteisto">${esc(label.slice(3))}</p>` : ''}
            <div class="sv-body">${body()}</div>`;
    }
}
