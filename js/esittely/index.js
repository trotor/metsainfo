/**
 * Esittely (kokeilu): lyhyt opastus ensimmäisellä avauskerralla, kortti
 * oston jälkeen ja zoomausvihje kartalle. Mukana vain kokeilubuildissa
 * (VITE_KOKEILU=1), maksuton (js/features.js).
 *
 * Kortit osoittavat oikeita nappeja (haku, tasovalitsin, Työkalut).
 * Maksullisten kortti kootaan Työkalujen ja Väritys-valitsimen rekisteristä
 * (js/ui/tyokalut.js rekisteroidyt()), joten se näyttää vain tässä buildissa
 * olevat toiminnot. Kun esittelyn ohittaa tai käy läpi, se ei tule enää
 * itsestään (localStorage TILA_KEY); asetuksista ja käyttöohjeesta sen saa
 * uudelleen (VIESTIT.avaaEsittely). Käynnistetään viimeisenä, kun muut
 * kokeilut ovat ilmoittautuneet rekisteriin.
 */

import './esittely.css';
import * as state from '../state.js';
import { CONFIG } from '../config.js';
import { FEATURES, isUnlocked } from '../features.js';
import { purchases } from '../platform/purchases.js';
import { rekisteroidyt } from '../ui/tyokalut.js';
import { estimateEnabled, showDemo } from '../ui/estimate.js';
import { requestLocation } from '../ui/location-ui.js';
import { isMobileLayout } from '../ui/layout.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { on, VIESTIT } from '../vayla.js';
import { T } from './teksti.js';
import { TILA_KEY, OSTO_KEY, VIHJE_KEY, lue, tallenna, naytetaankoAlussa, naytetaankoOsto, aiempiOsto, maksulliset, sijoita, naytetaankoZoomVihje } from './logiikka.js';
import { KUVAUSTILA } from '../demo/kuvaustila.js';
import { registerBackStep } from '../ui/back.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const storage = (() => { try { return window.localStorage; } catch { return null; } })();

let ui = null;      // { blocker, spot, card, steps, index, onDone }
let vihje = null;   // zoomausvihjeen elementti
// Vihjeen × tallentuu pysyvästi (Tero 19.11.2026: suljettu vihje ei tule enää)
let vihjeSuljettu = lue(storage, VIHJE_KEY) === '1';

/** Ensimmäinen näkyvä elementti valitsimista (mobiilissa ja työpöydällä eri). */
function kohde(selectors) {
    for (const sel of selectors || []) {
        const el = document.querySelector(sel);
        const r = el?.getBoundingClientRect();
        if (r && r.width > 0 && r.height > 0) return el;
    }
    return null;
}

function maksullisetHtml() {
    const omistettu = purchases.isEntitled();
    const rivit = [`<li><strong>${esc(T.hintaArvio)}</strong>: ${esc(T.hintaArvioKuvaus)} <span class="es-paikka">(${esc(T.paikkaArvio)})</span></li>`];
    for (const t of maksulliset(rekisteroidyt(), FEATURES)) {
        const paikka = t.paikka === 'vari' ? T.paikkaVari : T.paikkaTyokalut;
        rivit.push(`<li><strong>${esc(t.label)}</strong>${t.description ? `: ${esc(t.description)}` : ''} <span class="es-paikka">(${esc(paikka)})</span></li>`);
    }
    // Sama lupaus ja varaus kuin ostonäkymässä ja kauppateksteissä (#38): kertaosto
    // takaa hinta-arvion, muut työkalut maksuttomia ja ehkä myöhemmin maksullisia
    const huomio = `<p class="es-huomio">${esc(T.muuttuu)}</p>`;
    return { omistettu, html: `<ul class="es-lista">${rivit.join('')}</ul>${huomio}` };
}

function vaiheet() {
    const list = [
        { id: 'tervetuloa', otsikko: T.tervetuloaOtsikko, html: `<p>${esc(T.tervetuloa)}</p>` },
        { id: 'haku', otsikko: T.hakuOtsikko, html: `<p>${esc(T.haku)}</p>`, kohteet: ['#search-form:not(.hidden)', '#search-control'], toinen: ['.locate-btn'] },
        { id: 'tasot', otsikko: T.tasotOtsikko, html: `<p>${esc(T.tasot)}</p>`, kohteet: ['.leaflet-control-layers'] }
    ];
    if (document.querySelector('.tyokalut-control')) {
        list.push({ id: 'tyokalut', otsikko: T.tyokalutOtsikko, html: `<p>${esc(T.tyokalut)}</p>`, kohteet: ['.tyokalut-control'], toinen: ['#mobile-help-toggle', '#help-toggle'] });
    }
    if (estimateEnabled()) {
        const m = maksullisetHtml();
        list.push({
            id: 'maksulliset', otsikko: T.maksullisetOtsikko,
            html: `<p>${esc(m.omistettu ? T.omistetut : T.maksulliset)}</p>${m.html}`,
            lisanappi: m.omistettu ? null : { label: T.kokeile, toiminto: 'demo' }
        });
    }
    return list;
}

function rakenna() {
    const blocker = document.createElement('div');
    blocker.className = 'es-blocker';
    const spot = document.createElement('div');
    spot.className = 'es-spot';
    spot.setAttribute('aria-hidden', 'true');
    const spot2 = document.createElement('div');
    spot2.className = 'es-spot es-spot-toinen';
    spot2.setAttribute('aria-hidden', 'true');
    const card = document.createElement('div');
    card.className = 'es-kortti';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'es-otsikko');
    document.body.append(blocker, spot, spot2, card);
    card.addEventListener('click', (e) => {
        const b = e.target.closest('[data-es]');
        if (!b) return;
        const a = b.dataset.es;
        if (a === 'seuraava') siirry(1);
        else if (a === 'edellinen') siirry(-1);
        else if (a === 'ohita') lopeta('ohitettu');
        else if (a === 'valmis') lopeta('katsottu');
        else if (a === 'demo') { lopeta('katsottu'); showDemo(); }
    });
    return { blocker, spot, spot2, card };
}

function korosta(spot, el) {
    if (!el) { spot.hidden = true; return null; }
    const r = el.getBoundingClientRect();
    const pad = 6;
    Object.assign(spot.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    spot.hidden = false;
    return r;
}

function piirra() {
    const { card, spot, spot2, steps, index, oma } = ui;
    const v = steps[index];
    const viimeinen = index === steps.length - 1;
    const lisa = v.lisanappi ? `<button type="button" class="es-nappi es-toissijainen" data-es="${v.lisanappi.toiminto}">${esc(v.lisanappi.label)}</button>` : '';
    const askel = steps.length > 1 ? `<span class="es-askel">${esc(T.vaihe(index + 1, steps.length))}</span>` : '';
    const napit = oma
        ? `<button type="button" class="es-nappi" data-es="valmis">${esc(oma.nappi)}</button>`
        : `${index > 0 ? `<button type="button" class="es-nappi es-toissijainen" data-es="edellinen">${esc(T.edellinen)}</button>` : `<button type="button" class="es-linkki" data-es="ohita">${esc(T.ohita)}</button>`}
           <button type="button" class="es-nappi" data-es="${viimeinen ? 'valmis' : 'seuraava'}">${esc(viimeinen ? T.valmis : T.seuraava)}</button>`;
    card.innerHTML = `<button type="button" class="es-sulje" data-es="${oma ? 'valmis' : 'ohita'}" aria-label="${esc(T.sulje)}">×</button>
        ${askel}
        <h2 id="es-otsikko">${esc(v.otsikko)}</h2>
        <div class="es-teksti">${v.html}</div>
        ${lisa ? `<div class="es-lisa">${lisa}</div>` : ''}
        <div class="es-napit">${napit}</div>`;
    const r = korosta(spot, kohde(v.kohteet));
    korosta(spot2, kohde(v.toinen));
    const mobiili = isMobileLayout();
    card.classList.toggle('es-mobiili', mobiili);
    const paikka = sijoita(r, { width: card.offsetWidth, height: card.offsetHeight }, { width: window.innerWidth, height: window.innerHeight }, { mobiili });
    Object.assign(card.style, { left: `${paikka.left}px`, top: `${paikka.top}px` });
    card.querySelector('[data-es="seuraava"], [data-es="valmis"]')?.focus({ preventScroll: true });
}

function siirry(d) {
    ui.index = Math.min(ui.steps.length - 1, Math.max(0, ui.index + d));
    piirra();
}

function avaa(steps, { oma = null, onDone } = {}) {
    if (ui) sulje();
    piilotaVihje();
    ui = { ...rakenna(), steps, index: 0, oma, onDone };
    piirra();
}

function sulje() {
    if (!ui) return;
    for (const el of [ui.blocker, ui.spot, ui.spot2, ui.card]) el.remove();
    const done = ui.onDone;
    ui = null;
    done?.();
}

function lopeta(tila) {
    if (ui?.oma) tallenna(storage, OSTO_KEY, '1');
    else tallenna(storage, TILA_KEY, tila);
    sulje();
    paivitaVihje();
    tarkistaOsto();
}

/** Yleinen esittely alusta (myös asetuksista ja ohjeesta). */
export function aloitaEsittely() {
    avaa(vaiheet());
}

function tarkistaOsto() {
    if (!naytetaankoOsto({ entitled: purchases.isEntitled(), nahty: lue(storage, OSTO_KEY), kaynnissa: Boolean(ui), tila: lue(storage, TILA_KEY) })) return;
    const m = maksullisetHtml();
    avaa([{ id: 'osto', otsikko: T.ostoOtsikko, html: `<p>${esc(T.osto)}</p>${m.html}`, kohteet: ['.tyokalut-control'] }], { oma: { nappi: T.selva } });
}

/* ---------- Zoomausvihje ---------- */

function piilotaVihje() {
    if (vihje) vihje.hidden = true;
}

function paivitaVihje() {
    const map = state.map;
    if (!map || ui) return piilotaVihje();
    const nayta = naytetaankoZoomVihje({ zoom: map.getZoom(), minZoom: CONFIG.minZoomForParcels, kiinteistoAuki: Boolean(state.currentParcel), suljettu: vihjeSuljettu });
    if (!nayta) return piilotaVihje();
    if (!vihje) {
        vihje = document.createElement('div');
        vihje.className = 'es-vihje';
        vihje.setAttribute('role', 'status');
        vihje.innerHTML = `<span class="es-vihje-teksti">${esc(T.zoomVihje)}</span>
            <span class="es-vihje-napit">
                <button type="button" data-vihje="sijainti">${esc(T.zoomSijainti)}</button>
                <button type="button" data-vihje="lahenna">${esc(T.zoomLahenna)}</button>
            </span>
            <button type="button" class="es-vihje-sulje" data-vihje="sulje" aria-label="${esc(T.zoomSulje)}">×</button>`;
        L.DomEvent.disableClickPropagation(vihje);
        vihje.addEventListener('click', (e) => {
            const a = e.target.closest('[data-vihje]')?.dataset.vihje;
            if (a === 'sijainti') requestLocation();
            else if (a === 'lahenna') map.setZoom(CONFIG.minZoomForParcels);
            else if (a === 'sulje') { vihjeSuljettu = true; tallenna(storage, VIHJE_KEY, '1'); piilotaVihje(); }
        });
        map.getContainer().appendChild(vihje);
    }
    vihje.hidden = false;
}

export function startEsittely() {
    addHelpSection({ id: 'esittely', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });
    // Kauppakuvien kuvaustilassa ei esittelyä eikä vihjettä
    if (!isUnlocked('esittely') || KUVAUSTILA) return;
    if (aiempiOsto({ entitled: purchases.isEntitled(), nahty: lue(storage, OSTO_KEY) })) tallenna(storage, OSTO_KEY, 'aiempi');
    on(VIESTIT.avaaEsittely, () => aloitaEsittely());
    document.addEventListener('click', (e) => {
        if (!e.target.closest('[data-esittely="avaa"]')) return;
        window.toggleHelp?.();
        aloitaEsittely();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && ui) lopeta(ui.oma ? 'katsottu' : 'ohitettu');
    });
    window.addEventListener('resize', () => { if (ui) piirra(); });
    // Androidin takaisin-painike: kuin Esc
    registerBackStep(() => {
        if (!ui) return false;
        lopeta(ui.oma ? 'katsottu' : 'ohitettu');
        return true;
    });
    purchases.onChange(() => tarkistaOsto());

    const map = state.map;
    if (map) {
        map.on('zoomend', paivitaVihje);
        on(VIESTIT.yhteenveto, paivitaVihje);
        on(VIESTIT.tyhjennys, () => setTimeout(paivitaVihje, 0));
    }
    // Kartta ja napit ehtivät asettua ennen esittelyä
    setTimeout(() => {
        if (naytetaankoAlussa({ tila: lue(storage, TILA_KEY), search: window.location.search })) aloitaEsittely();
        else tarkistaOsto();
        paivitaVihje();
    }, 600);
}
