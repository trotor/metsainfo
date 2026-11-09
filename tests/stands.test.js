import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect, beforeEach } from 'vitest';
import * as state from '../js/state.js';
import { showSummary } from '../js/ui/summary.js';
import { openStand } from '../js/ui/stands.js';
import { getActiveTab } from '../js/ui/panel.js';
import { STANDS } from './fixtures/stands.js';

beforeEach(() => {
    document.body.innerHTML = '<div id="info-panel"><div id="sheet-peek"></div><div id="info-content"></div></div>';
    state.setState('map', {
        panTo() {}, project: () => ({ add: () => ({}) }), unproject: () => ({}), getZoom: () => 12
    });
    state.setState('highlightedStandLayer', { clearLayers() {}, addData() {} });
    state.setState('currentFeatures', STANDS);
    showSummary(STANDS, null);
});

const expanded = () => [...document.querySelectorAll('.stand-item.expanded')].map(e => e.dataset.index);

describe('openStand', () => {
    it('openStand(-1) ei tee mitään', () => {
        expect(openStand(-1)).toBe(false);
        expect(getActiveTab()).toBe('summary');
        expect(expanded()).toEqual([]);
    });

    it('openStand indeksin ulkopuolella ei tee mitään', () => {
        expect(openStand(3)).toBe(false);
        expect(getActiveTab()).toBe('summary');
    });

    it('openStand avaa Kuviot-välilehden ja kuvion', () => {
        expect(openStand(1)).toBe(true);
        expect(getActiveTab()).toBe('stands');
        expect(expanded()).toEqual(['1']);
    });

    it('openStand sulkee muut avatut', () => {
        openStand(0);
        openStand(2);
        expect(expanded()).toEqual(['2']);
        expect(document.querySelector('.stand-item[data-index="0"] .stand-toggle').textContent).toBe('▼');
    });
});
