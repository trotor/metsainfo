import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { showSummary } from '../js/ui/summary.js';
import { setActiveTab, getActiveTab, initTabs } from '../js/ui/panel.js';
import { STANDS } from './fixtures/stands.js';

beforeEach(() => {
    document.body.innerHTML = '<div id="info-panel"><div id="sheet-peek"></div><div id="info-content"></div></div>';
});

describe('välilehdet', () => {
    it('setActiveTab merkitsee aktiivisen', () => {
        showSummary(STANDS, null);
        setActiveTab('stands');
        expect(document.getElementById('info-content').dataset.activeTab).toBe('stands');
        const selected = [...document.querySelectorAll('.tabbar [aria-selected="true"]')].map(b => b.dataset.tab);
        expect(selected).toEqual(['stands']);
    });

    it('tuntematon tai puuttuva välilehti palaa yhteenvetoon', () => {
        showSummary(STANDS.slice(1), null);
        setActiveTab('recs');
        expect(getActiveTab()).toBe('summary');
    });

    it('uusi showSummary palauttaa yhteenvetoon', () => {
        showSummary(STANDS, null);
        setActiveTab('stands');
        showSummary(STANDS, null);
        expect(getActiveTab()).toBe('summary');
    });

    it('tabipainikkeen napautus vaihtaa välilehteä', () => {
        showSummary(STANDS, null);
        initTabs(document.getElementById('info-content'));
        document.querySelector('.tabbar [data-tab="stands"]').click();
        expect(getActiveTab()).toBe('stands');
    });
});
