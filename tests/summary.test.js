import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { showSummary } from '../js/ui/summary.js';
import { STANDS } from './fixtures/stands.js';

beforeEach(() => {
    document.body.innerHTML = '<div id="info-panel"><div id="sheet-peek"></div><div id="info-content"></div></div>';
});

describe('showSummary', () => {
    it('renderöi kuvion per piirre', () => {
        showSummary(STANDS, null);
        expect(document.querySelectorAll('.stand-item')).toHaveLength(3);
    });

    it('näyttää kuvioiden määrän', () => {
        showSummary(STANDS, null);
        expect(document.querySelector('.stands-count').textContent).toBe('(3 kpl)');
    });

    it('näyttää ei-dataa-tilan tyhjällä taulukolla', () => {
        showSummary([], null);
        expect(document.querySelector('.no-data')).not.toBeNull();
    });
});
