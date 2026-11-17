import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { showSummary } from '../js/ui/summary.js';
import { STANDS } from './fixtures/stands.js';
import { toPseudoParcel } from '../js/valinta/logiikka.js';

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

    it('luo kolme välilehteä kun ehdotuksia on', () => {
        showSummary(STANDS, null);
        const tabs = [...document.querySelectorAll('.tabbar [data-tab]')].map(b => b.dataset.tab);
        const panels = [...document.querySelectorAll('section.tab-panel')].map(s => s.dataset.tab);
        // Verkossa myös Arvio-välilehti esittelynä (#36)
        expect(tabs).toEqual(['summary', 'stands', 'recs', 'arvio']);
        expect(panels).toEqual(['summary', 'recs', 'arvio', 'stands']);
    });

    it('ei välilehtiä ilman kuvioita', () => {
        showSummary([], null);
        expect(document.querySelector('.tabbar')).toBeNull();
        expect(document.getElementById('sheet-peek').textContent).toContain('Ei metsävaratietoja');
    });

    it('peek näyttää kuvioiden määrän', () => {
        showSummary(STANDS, null);
        const peek = document.getElementById('sheet-peek').textContent.replace(/\s+/g, ' ');
        expect(peek).toMatch(/\b3 kuviota\b/);
    });

    it('värikoodaa osiot asiaryhmittäin', () => {
        showSummary(STANDS, null);
        const group = (h) => [...document.querySelectorAll('.summary-section')]
            .find(sec => sec.querySelector('h3')?.textContent.startsWith(h))?.className || '';
        expect(group('Metsävarat yhteenveto')).toContain('group-puusto');
        expect(group('Puulajijakauma')).toContain('group-puusto');
        expect(group('Puusto')).toContain('group-puusto');
        expect(group('Tukkipuu')).toContain('group-puusto');
        expect(group('Kasvupaikka')).toContain('group-maa');
        expect(group('Hakkuuehdotukset')).toContain('group-hakkuu');
        expect(document.querySelector('.measurement-info').className).toContain('group-aineisto');
    });

    it('korostaa lähivuosien (0–2 v) hakkuuvuoden', () => {
        const thisYear = new Date().getFullYear();
        const stands = STANDS.map((f, i) => ({ ...f, properties: { ...f.properties,
            CUTTINGTYPE: i === 0 ? 3 : 5, CUTTINGPROPOSALYEAR: i === 0 ? thisYear + 1 : thisYear + 6 } }));
        showSummary(stands, null);
        const years = [...document.querySelectorAll('.group-hakkuu .recommendation-year')];
        expect(years.find(y => y.textContent === String(thisYear + 1)).classList.contains('soon')).toBe(true);
        expect(years.find(y => y.textContent === String(thisYear + 6)).classList.contains('soon')).toBe(false);
    });

    it('verkkoversio esittelee hinta-arvion: välilehti ja kortti, ei ostonäkymää ennen napautusta (#36)', () => {
        showSummary(STANDS, null);
        expect(document.querySelector('.tabbar [data-tab="arvio"]')).not.toBeNull();
        expect(document.querySelector('.tab-panel[data-tab="arvio"]')).not.toBeNull();
        expect(document.querySelector('.estimate-card')).not.toBeNull();
        expect(document.getElementById('paywall')).toBeNull();
        expect(document.querySelector('.tab-panel[data-tab="arvio"]').textContent).toContain('Metsäinfo-sovelluksen maksullinen lisäosa');
    });

    it('valinta: otsikko Valinta, ei linkkipainiketta, ⋯-valikon linkki piilossa', () => {
        document.body.innerHTML += '<div id="sheet-menu"><button data-action="copy"></button></div>';
        showSummary(STANDS, toPseudoParcel(STANDS, 'Oma valinta · 3 kuviota'), 1);
        expect(document.querySelector('.parcel-section h3').textContent).toBe('Valinta');
        expect(document.querySelector('.parcel-id').textContent).toBe('Oma valinta · 3 kuviota');
        expect(document.getElementById('copy-link-btn')).toBeNull();
        expect(document.querySelector('#sheet-menu [data-action="copy"]').hidden).toBe(true);
    });

    it('valinta ilman metsävaratietoja ei puhu kiinteistöstä', () => {
        showSummary([], toPseudoParcel([], 'Oma valinta'), 1);
        expect(document.getElementById('info-content').textContent).toContain('Valinnassa ei ole metsävaratietoja.');
    });

    it('kiinteistö valinnan jälkeen: linkki taas näkyvissä', () => {
        document.body.innerHTML += '<div id="sheet-menu"><button data-action="copy"></button></div>';
        showSummary(STANDS, toPseudoParcel(STANDS, 'x'), 1);
        showSummary(STANDS, { properties: { nationalCadastralReference: '99900100010001' }, geometry: STANDS[0].geometry });
        expect(document.querySelector('.parcel-section h3').textContent).toBe('Kiinteistö');
        expect(document.getElementById('copy-link-btn')).not.toBeNull();
        expect(document.querySelector('#sheet-menu [data-action="copy"]').hidden).toBe(false);
    });
});
