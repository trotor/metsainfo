/**
 * Väritystilat ja selitteet
 */

import { COLOR_MODES, MKI_COLOR_MODES } from '../config.js';
import * as state from '../state.js';
import { featureStyle, mkiStyle } from '../styles.js';
import { T } from './teksti.js';

/* ---------- Selitteiden sulkeminen (kaikki selitteet: värit, MKI, lisäosat) ---------- */

const SELITE_KEY = 'metsainfo.selite';
let seliteValmis = false;

function seliteKiinni() {
    return document.body.classList.contains('selitteet-kiinni');
}

function paivitaSeliteNapit() {
    const kiinni = seliteKiinni();
    document.querySelectorAll('[data-selite]').forEach(b => {
        b.setAttribute('aria-expanded', String(!kiinni));
        b.setAttribute('aria-label', kiinni ? T.seliteNayta : T.selitePiilota);
        b.title = kiinni ? T.seliteNayta : T.selitePiilota;
    });
}

function initSelite() {
    if (seliteValmis) return;
    seliteValmis = true;
    let kiinni = false;
    try { kiinni = localStorage.getItem(SELITE_KEY) === 'kiinni'; } catch { /* ei tallennustilaa */ }
    document.body.classList.toggle('selitteet-kiinni', kiinni);
    document.addEventListener('click', (e) => {
        if (!e.target.closest?.('[data-selite]')) return;
        e.preventDefault();
        e.stopPropagation();
        const next = !seliteKiinni();
        document.body.classList.toggle('selitteet-kiinni', next);
        try { localStorage.setItem(SELITE_KEY, next ? 'kiinni' : 'auki'); } catch { /* ei tallennustilaa */ }
        paivitaSeliteNapit();
    }, true);
}

/**
 * Selitteen sulku- ja avausnappi (myös lisäosien selitteisiin, esim.
 * js/saavutettavuus/, js/arvovari/). Suljettuna selite on pieni "Selite"-nappi;
 * tila on yhteinen kaikille selitteille ja säilyy laitteella.
 */
export function seliteNappi() {
    initSelite();
    queueMicrotask(paivitaSeliteNapit);
    const kiinni = seliteKiinni();
    const label = kiinni ? T.seliteNayta : T.selitePiilota;
    return `<button type="button" class="selite-nappi" data-selite aria-expanded="${!kiinni}" aria-label="${label}" title="${label}"><span class="selite-nappi-teksti">${T.selite}</span><span class="selite-nappi-ikoni" aria-hidden="true"></span></button>`;
}

// Selitteen otsikko ja rivit valitulla kielellä (värit config.js:stä)
const labelOf = (texts, key, mode) => texts[key]?.label ?? mode.label;
const itemLabel = (texts, key, item, i) => texts[key]?.legend?.[i] ?? item.label;

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
    legendEl.innerHTML = `${seliteNappi()}
        <div class="legend-title">${labelOf(T.varitila, state.currentColorMode, mode)}</div>
        <div class="legend-items">
            ${mode.legend.map((item, i) =>
                `<div class="legend-item"><span class="legend-color" style="background:${item.color}"></span>${itemLabel(T.varitila, state.currentColorMode, item, i)}</div>`
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
    title.textContent = labelOf(T.mkiVaritila, state.mkiColorMode, mode);

    const items = document.createElement('div');
    items.className = 'legend-items';
    mode.legend.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'legend-item';
        const color = document.createElement('span');
        color.className = 'legend-color';
        color.style.background = item.color;
        el.appendChild(color);
        el.appendChild(document.createTextNode(itemLabel(T.mkiVaritila, state.mkiColorMode, item, i)));
        items.appendChild(el);
    });

    const tmp = document.createElement('div');
    tmp.innerHTML = seliteNappi();
    legendEl.replaceChildren(tmp.firstElementChild, title, items);
}
