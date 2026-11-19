/**
 * Kuvion saavutettavuus (kokeilu): metsäkuljetusmatka, maapohjan
 * korjuukelpoisuus ja tieyhteys kiinteistölle kuvioittain.
 * Vain VITE_KOKEILU=1 -buildissa (dynaaminen import app.js:ssä).
 * Suunnitelma: docs/plans/2026-11-16-saavutettavuus-kokeilu.md
 *
 * - Karttapainike värittää avatun kiinteistön kuviot indeksin luokan mukaan.
 * - Kuvion tietokorttiin (kuvioluettelon avattu rivi) tulee arviolaatikko,
 *   joka erottuu Metsäkeskuksen faktatiedoista.
 * - Yhteenvetoon tulee kiinteistön tieyhteys samanlaisessa laatikossa.
 * - Lasketaan vasta tarvittaessa (Tero 19.11.2026): kun kuvion tiedot avataan,
 *   väritys valitaan tai yhteenvedon Laske-nappia painetaan. Tulos säilyy
 *   muistissa kiinteistöittäin (TULOKSET), joten uudelleen avaus ei hae uudelleen.
 */

import './saavutettavuus.css';
import * as state from '../state.js';
import { codeName } from '../koodit.js';
import { locale } from '../i18n.js';
import { formatNumber, coordsEPSG3067ToLatLng } from '../utils.js';
import { on, VIESTIT } from '../vayla.js';
import { taytto } from '../peittavyys.js';
import { registerColorMode } from '../ui/tyokalut.js';
import { seliteNappi } from '../ui/legend.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { showToast } from '../ui/location-ui.js';
import { purchases } from '../platform/purchases.js';
import { isUnlocked, kokeiluMerkki } from '../features.js';
import { analyseParcel } from './analyysi.js';
import { createRoadSource, harvestArea } from './aineisto.js';
import { fetchRaster } from './rasteri.js';
import { fetchDtw, fetchDem } from './maasto.js';
import { T } from './teksti.js';
import { createCachedFetch } from '../valimuisti.js';
import { showPaywall } from '../ui/estimate.js';


export const VARIT = { hyva: '#15803d', kohtalainen: '#ca8a04', heikko: '#b91c1c' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (v, d = 0) => formatNumber(v, d, locale());
const meters = (m) => (m >= 1000 ? `${fmt(m / 1000, 1)} km` : `${fmt(Math.round(m / 10) * 10)} m`);
const tonnes = (kg) => fmt(kg / 1000, kg % 1000 ? 1 : 0);
const locked = () => !isUnlocked('saavutettavuus');

export function startSaavutettavuus() {
    addHelpSection({ id: 'saavutettavuus', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });

    // Aineistot pysyvään välimuistiin (Tero 19.11.2026: nopeutus): tiet ja rajoitukset
    // muuttuvat (kelirikko), joten viikko; maapohja, kosteus ja korkeusmalli harvoin
    const DAY = 24 * 3600 * 1000;
    const tieHaku = createCachedFetch({ name: 'metsainfo-tiet-v1', ttl: 7 * DAY });
    const maastoHaku = createCachedFetch({ name: 'metsainfo-maasto-v1', ttl: 90 * DAY, maxEntries: 200 });
    const roads = createRoadSource({ fetchFn: tieHaku });
    const ui = { colors: false, ctx: null, status: 'idle', result: null };
    let token = 0;
    let observer = null; // kuvioluettelon avaukset (watchStands)
    let popup = null;    // työpöydän kuvioponnahdus { index, el, paivita }

    // Valmiit tulokset muistissa kiinteistön (tai valinnan kuvioiden) mukaan, enintään 12
    const TULOKSET = new Map();
    const tulosAvain = (ctx) => ctx?.reference
        || ctx?.features?.map(f => f.properties?.STANDID ?? '').join(',')
        || null;
    function muista(ctx, result) {
        const key = tulosAvain(ctx);
        if (!key) return;
        TULOKSET.delete(key);
        TULOKSET.set(key, result);
        if (TULOKSET.size > 12) TULOKSET.delete(TULOKSET.keys().next().value);
    }

    /** Laske, jos ei jo laskettu tai kesken (kuvion tiedot avattu, väritys, Laske-nappi). */
    function ensure() {
        if (ui.status === 'idle' || ui.status === 'error') run();
    }

    /* ---------- Kartta: kuviot luokan väreillä ---------- */

    const roadLayer = L.layerGroup();
    // Ei klikattava: kuvion napautus menee alla olevalle kuviotasolle (kuvion tiedot)
    const standLayer = L.geoJSON(null, {
        coordsToLatLng: coordsEPSG3067ToLatLng,
        interactive: false,
        style: (f) => {
            const r = ui.result?.kuviot.get(f.properties.__index);
            const color = VARIT[r?.luokka] || '#6b7280';
            return { color, weight: 1.5, fillColor: color, fillOpacity: taytto(0.55) };
        }
    });
    // Läpinäkyvyyssäädin (kokeilu): täyttö uudelleen
    on(VIESTIT.peittavyys, () => standLayer.setStyle(standLayer.options.style));

    const line = (l, style) => L.polyline(l.coords.map(coordsEPSG3067ToLatLng), { interactive: false, ...style });

    // Selite samaan kohtaan kuin sovelluksen väriselite (mobiilissa karttanauhaan)
    const legend = document.createElement('div');
    legend.id = 'sv-selite';
    legend.hidden = true;
    document.getElementById('color-legend')?.after(legend);

    function drawMap() {
        roadLayer.clearLayers();
        standLayer.clearLayers();
        const r = ui.result;
        const show = Boolean(ui.colors && r && !locked());
        // Väritys valittu, mutta analyysi kesken tai epäonnistui: selite kertoo sen,
        // eikä tilavuuden selite näy Saavutettavuus-valinnan alla
        const pending = Boolean(ui.colors && !r && !locked() && ui.ctx?.features?.length);
        document.body.classList.toggle('sv-varit', show || pending);
        legend.hidden = !(show || pending);
        if (!show) {
            roadLayer.remove();
            standLayer.remove();
            if (pending) legend.innerHTML = `<div class="sv-selite-otsikko">${esc(T.selite)}</div><div>${esc(ui.status === 'error' ? T.virhe : T.lasketaan)}</div>`;
            return;
        }
        for (const l of r.tiet) {
            if (l.kind === 'auto') line(l, { color: '#1f2937', weight: 2.5, opacity: 0.75 }).addTo(roadLayer);
            else if (l.kind === 'ajopolku') line(l, { color: '#1f2937', weight: 1.5, dashArray: '4 6', opacity: 0.6 }).addTo(roadLayer);
        }
        for (const l of r.reitti) line(l, { color: '#2563eb', weight: 4, opacity: 0.85 }).addTo(roadLayer);
        ui.ctx.features.forEach((f, i) => {
            if (f.geometry) standLayer.addData({ type: 'Feature', geometry: f.geometry, properties: { __index: i } });
        });
        standLayer.addTo(state.map);
        roadLayer.addTo(state.map);
        legend.innerHTML = `${seliteNappi()}<div class="sv-selite-otsikko legend-title">${esc(T.selite)}</div>
            <div class="legend-items">
                ${['hyva', 'kohtalainen', 'heikko'].map(k => `<div class="legend-item"><span class="legend-color" style="background:${VARIT[k]}"></span>${esc(T.luokat[k])}</div>`).join('')}
                ${r.reitti.length ? `<div class="legend-item"><span class="sv-selite-viiva"></span>${esc(T.seliteReitti)}</div>` : ''}
            </div>`;
    }

    // Väritys-valitsimeen (js/ui/tyokalut.js) Tilavuuden, iän … rinnalle
    const mode = registerColorMode({
        id: 'saavutettavuus', label: T.variTila,
        onSelect: () => setColors(true),
        onDeselect: () => setColors(false)
    });

    // Hinta-arvion ostonäkymä (js/ui/estimate.js); toimii myös ennen ensimmäistä kiinteistöä
    const openPaywall = () => showPaywall();

    /** Palauttaa false, jos väritys ei käynnisty (lukittu tai ei kuvioita). */
    function setColors(next) {
        if (next && locked()) { openPaywall(); return false; }
        if (next && !ui.ctx?.features?.length) {
            showToast(ui.ctx ? T.eiKuvioita : T.valitseKiinteisto);
            return false;
        }
        ui.colors = next;
        if (ui.colors) ensure();
        drawMap();
        renderSummaryBox();
    }

    /* ---------- Analyysi ---------- */

    async function run() {
        const ctx = ui.ctx;
        if (!ctx?.features?.length || locked()) return;
        const my = ++token;
        ui.status = 'loading';
        ui.result = null;
        renderSummaryBox();
        try {
            const result = await analyseParcel({ parcel: ctx.parcel, features: ctx.features }, {
                roads,
                raster: (bbox) => fetchRaster(bbox, { fetchFn: maastoHaku }),
                dtw: (bbox) => fetchDtw(bbox, { fetchFn: maastoHaku }),
                dem: (bbox) => fetchDem(bbox, { fetchFn: maastoHaku }),
                area: (p) => harvestArea(p, { fetchFn: maastoHaku })
            });
            if (my !== token) return;
            ui.result = result;
            ui.status = 'done';
            if (!result.partial && !result.tie?.virhe) muista(ctx, result);
        } catch (err) {
            if (my !== token) return;
            console.warn('[saavutettavuus]', err);
            ui.status = 'error';
        }
        renderSummaryBox();
        decorateStands();
        drawMap();
        renderPopup();
    }

    on(VIESTIT.yhteenveto, (ctx) => {
        ui.ctx = ctx;
        const muistissa = TULOKSET.get(tulosAvain(ctx));
        ui.result = muistissa || null;
        ui.status = muistissa ? 'done' : 'idle';
        token++;
        renderSummaryBox();
        if (muistissa) decorateStands();
        drawMap();
        watchStands(ctx?.content);
        // Väritys valittuna: lasketaan heti, muuten vasta kun tietoja katsotaan
        if (!locked() && ctx?.features?.length && (ui.colors || openStandIndex(ctx.content) != null)) ensure();
    }, { replay: true });

    /* ---------- Työpöydän kuvioponnahdus: saavutettavuusrivi ---------- */

    on(VIESTIT.kuvioPopup, ({ index, el, paivita }) => {
        if (locked() || !ui.ctx?.features?.length || index < 0 || !el) { popup = null; return; }
        popup = { index, el, paivita };
        ensure();
        renderPopup();
    });

    function renderPopup() {
        if (!popup?.el?.isConnected) return;
        popup.el.querySelector('.sv-popup')?.remove();
        const k = ui.result?.kuviot.get(popup.index);
        let html;
        if (ui.status === 'loading') html = esc(T.lasketaan);
        else if (ui.status === 'error') html = esc(T.virhe);
        else if (k?.score != null) html = `<span class="sv-merkki sv-${esc(k.luokka)}">${k.score}</span> ${esc(T.luokat[k.luokka])} · ${esc(T.pisteet(k.score))}`;
        else return;
        const row = document.createElement('div');
        row.className = 'sv-popup';
        row.innerHTML = `<strong>${esc(T.otsikko)}:</strong> ${html}`;
        popup.el.append(row);
        popup.paivita?.();
    }

    /* ---------- Kuvion tiedot avattu → laske ---------- */

    function openStandIndex(content) {
        const el = content?.querySelector?.('.stand-item.expanded');
        return el ? Number(el.dataset.index) : null;
    }

    function watchStands(content) {
        observer?.disconnect();
        observer = null;
        if (!content || typeof MutationObserver === 'undefined') return;
        observer = new MutationObserver((records) => {
            const avattu = records.some(r => r.target.classList?.contains('stand-item') && r.target.classList.contains('expanded'));
            if (!avattu || locked() || !ui.ctx?.features?.length) return;
            if (ui.status === 'done') return;
            ensure();
            renderStandPending();
        });
        observer.observe(content, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    // Avatun kuvion tietoihin "lasketaan" siksi aikaa, kun analyysi on kesken
    function renderStandPending() {
        const content = ui.ctx?.content;
        if (!content?.isConnected) return;
        content.querySelectorAll('.stand-item .sv-odottaa').forEach(el => el.remove());
        if (ui.status !== 'loading') return;
        const details = content.querySelector('.stand-item.expanded .stand-details');
        if (!details) return;
        const box = document.createElement('div');
        box.className = 'detail-group sv-lisa sv-laatikko sv-kuvio sv-odottaa';
        box.innerHTML = `${boxHead()}<p class="sv-status" role="status">${esc(T.lasketaan)}</p>`;
        details.insertBefore(box, details.querySelector('.detail-footer'));
    }

    // Kiinteistö suljettu: väritys ja tiet pois kartalta. Väritystila jää valituksi,
    // joten seuraava kiinteistö väritetään taas.
    on(VIESTIT.tyhjennys, () => {
        observer?.disconnect();
        ui.ctx = null;
        ui.result = null;
        ui.status = 'idle';
        token++;
        drawMap();
    });

    purchases.onChange(() => { renderSummaryBox(); decorateStands(); drawMap(); });

    /* ---------- Yhteenveto: kiinteistön laatikko ---------- */

    function boxHead({ kokeilu = false } = {}) {
        return `<div class="sv-laatikko-otsikko">
            <span>${esc(T.otsikko)}</span>
            <span class="sv-arvio-merkki">${esc(T.arvioMerkki)}</span>
            ${kokeilu && kokeiluMerkki('saavutettavuus', T.kokeilu) ? `<span class="sv-kokeilu-merkki">${esc(T.kokeilu)}</span>` : ''}
        </div>`;
    }

    // Kuviovalinnalla (näennäiskiinteistö) tieteksteissä "valinta" kiinteistön sijaan
    const tt = () => (ui.ctx?.parcel?.properties?.valinta ? { ...T, ...T.valinta } : T);

    function roadLines(r) {
        const t = r.tie;
        if (t.virhe) return [];
        if (!t.reachesParcel) return [tt().eiTieta];
        const lines = [tt().tieTulee];
        if (t.route?.length === 0) lines.push(tt().yleisenTienVarrella);
        else if (t.route) lines.push(T.reitti(meters(t.route.length)));
        else lines.push(T.eiReittia);
        if (t.tiekunta) lines.push(T.tiekunta);
        return lines;
    }

    function limitsText(r) {
        return r.tie.rajoitukset.map(x => x.tyyppi === 'kelirikko' ? T.kelirikko(tonnes(x.kg), x.alku, x.loppu) : T.massa(tonnes(x.kg)));
    }

    function summaryBody() {
        if (locked()) {
            return `<p class="sv-rivi-teksti">${esc(T.lukittu)}</p>
                <button type="button" class="kortti-btn kortti-primary" data-est="paywall">${esc(T.avaaLisaosa)}</button>`;
        }
        if (ui.status === 'idle') {
            return `<p class="sv-rivi-teksti">${esc(T.laskeKuvaus)}</p>
                <button type="button" class="kortti-btn kortti-primary" data-sv="laske">${esc(T.laske)}</button>
                <p class="sv-huom">${esc(T.lisamaksu)}</p>`;
        }
        if (ui.status === 'loading') return `<p class="sv-status" role="status">${esc(T.lasketaan)}</p>`;
        if (ui.status === 'error') {
            return `<p class="sv-status">${esc(T.virhe)}</p>
                <button type="button" class="kortti-btn" data-sv="retry">${esc(T.yritaUudelleen)}</button>`;
        }
        const r = ui.result;
        const limits = limitsText(r);
        const warn = r.tie.virhe ? T.tieVirhe : r.partial ? T.osittain : null;
        return `${warn ? `<div class="sv-varoitus"><p>${esc(warn)}</p>
                <button type="button" class="kortti-btn" data-sv="retry">${esc(T.yritaUudelleen)}</button></div>` : ''}
            ${r.tie.virhe ? '' : `<div class="sv-ryhma">${esc(tt().tieKiinteistolle)}</div>`}
            ${roadLines(r).map(l => `<p class="sv-rivi-teksti">${esc(l)}</p>`).join('')}
            ${limits.length ? `<p class="sv-rajoitus"><strong>${esc(T.rajoitukset)}:</strong> ${esc(limits.join(', '))}</p>` : ''}
            <button type="button" class="kortti-btn sv-kartalle" data-sv="varit" aria-pressed="${ui.colors}">${esc(ui.colors ? T.piilotaKartalta : T.naytaKartalla)}</button>
            <p class="sv-huom">${esc(T.kuvionLaatikko)}</p>
            <p class="sv-huom">${esc(T.lisamaksu)}</p>
            <p class="sv-lahde">${esc(T.lahteet(r.lahteet.alue, { dtw: r.lahteet.dtw, dem: r.lahteet.dem }))}</p>`;
    }

    function renderSummaryBox() {
        const content = ui.ctx?.content;
        if (!content?.isConnected) return;
        content.querySelector('.sv-kiinteisto')?.remove();
        if (!ui.ctx.features?.length) return;
        const parcelInfo = content.querySelector('.parcel-section .parcel-info');
        if (!parcelInfo) return;
        const box = document.createElement('section');
        box.className = 'sv-lisa sv-laatikko sv-kiinteisto';
        box.innerHTML = `${boxHead({ kokeilu: true })}${summaryBody()}`;
        box.addEventListener('click', (e) => {
            const el = e.target.closest('[data-sv]');
            if (!el) return;
            if (el.dataset.sv === 'retry') run();
            else if (el.dataset.sv === 'laske') ensure();
            else if (el.dataset.sv === 'varit') (ui.colors ? mode.deselect() : mode.select());
        });
        parcelInfo.after(box);
    }

    /* ---------- Kuvioluettelo: merkki ja arviolaatikko kuvion tiedoissa ---------- */

    function soilText(k, feature) {
        if (k.maapohjaLahde === 'kartta' && k.paaluokka) return T.maapohja[k.paaluokka];
        if (k.maapohjaLahde === 'kuvio') return T.kuvionTieto(codeName('accessibility', feature?.properties?.ACCESSIBILITY));
        return null;
    }

    function connectionText(r) {
        const t = r.tie;
        if (t.virhe) return null;
        if (!t.reachesParcel) return tt().eiTietaLyhyt;
        if (t.route?.length === 0) return T.yleisenTienVarrellaLyhyt;
        if (t.route) return T.reittiLyhyt(meters(t.route.length));
        return T.eiReittiaLyhyt;
    }

    function standBox(k, feature, r) {
        const rows = [
            [T.metsakuljetus, k.tieKuviolla ? T.tieKuviolla : k.meanDist != null ? T.noin(meters(k.meanDist)) : null],
            [T.korjuukelpoisuus, soilText(k, feature)],
            [T.markyys, k.markyys != null ? T.markyysArvo(Math.round(k.markyys * 100)) : null],
            [T.kaltevuus, k.kaltevuus != null ? T.kaltevuusArvo(Math.round(k.kaltevuus)) : null],
            [T.tieyhteys, connectionText(r)]
        ].filter(([, v]) => v);
        const limits = limitsText(r);
        return `<div class="detail-group sv-lisa sv-laatikko sv-kuvio">
            ${boxHead()}
            <div class="sv-pisteet"><span class="sv-merkki sv-${esc(k.luokka)}">${k.score}</span><span>${esc(T.luokat[k.luokka])} · ${esc(T.pisteet(k.score))}</span></div>
            <div class="detail-grid">
                ${rows.map(([a, b]) => `<div class="detail-row"><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join('')}
            </div>
            ${limits.length ? `<p class="sv-rajoitus"><strong>${esc(T.rajoitukset)}:</strong> ${esc(limits.join(', '))}</p>` : ''}
            ${k.puuttuu.length ? `<p class="sv-huom">${esc(T.puuttuu(k.puuttuu.map(p => T.osat[p]).join(', ')))}</p>` : ''}
            <p class="sv-huom">${esc(T.arvio)}</p>
        </div>`;
    }

    function decorateStands() {
        const content = ui.ctx?.content;
        const r = ui.result;
        if (!content?.isConnected) return;
        content.querySelectorAll('.stand-item .sv-lisa').forEach(el => el.remove());
        if (!r || locked()) return;
        content.querySelectorAll('.stand-item').forEach(itemEl => {
            const i = Number(itemEl.dataset.index);
            const k = r.kuviot.get(i);
            if (!k || k.score == null) return;
            const badge = document.createElement('span');
            badge.className = `sv-lisa sv-merkki sv-${k.luokka}`;
            badge.textContent = k.score;
            badge.title = T.merkki(k.score, T.luokat[k.luokka]);
            badge.setAttribute('aria-label', badge.title);
            itemEl.querySelector('.stand-summary')?.prepend(badge);
            const details = itemEl.querySelector('.stand-details');
            if (!details) return;
            const holder = document.createElement('div');
            holder.innerHTML = standBox(k, ui.ctx.features[i], r);
            details.insertBefore(holder.firstElementChild, details.querySelector('.detail-footer'));
        });
    }
}
