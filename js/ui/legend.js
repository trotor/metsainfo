/**
 * Väritystilat ja selitteet
 */

import { COLOR_MODES, MKI_COLOR_MODES } from '../config.js';
import * as state from '../state.js';
import { featureStyle, mkiStyle } from '../styles.js';
import { T } from './teksti.js';

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
    legendEl.innerHTML = `
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

    legendEl.replaceChildren(title, items);
}
