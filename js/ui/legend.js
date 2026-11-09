/**
 * Väritystilat ja selitteet
 */

import { COLOR_MODES, MKI_COLOR_MODES } from '../config.js';
import * as state from '../state.js';
import { featureStyle, mkiStyle } from '../styles.js';

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
        <div class="legend-title">${mode.label}</div>
        <div class="legend-items">
            ${mode.legend.map(item =>
                `<div class="legend-item"><span class="legend-color" style="background:${item.color}"></span>${item.label}</div>`
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
    title.textContent = mode.label;

    const items = document.createElement('div');
    items.className = 'legend-items';
    mode.legend.forEach(item => {
        const el = document.createElement('div');
        el.className = 'legend-item';
        const color = document.createElement('span');
        color.className = 'legend-color';
        color.style.background = item.color;
        el.appendChild(color);
        el.appendChild(document.createTextNode(item.label));
        items.appendChild(el);
    });

    legendEl.replaceChildren(title, items);
}
