/**
 * Suomenkielisen käyttöliittymän kultaiset tilannekuvat (#23).
 * Koko sovelluksen käännöksen aikana suomenkielisen tulosteen pitää pysyä
 * täsmälleen samana: tämä korvaa puuttuvat käyttöliittymätestit.
 * Päivitä tilannekuva (vitest -u) vain, kun suomenkielistä tekstiä
 * muutetaan tarkoituksella.
 */
import '../js/vendor/index.js';
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { emptyTable } from '../js/pricing/prices.js';
import { STANDS } from './fixtures/stands.js';

const mocks = vi.hoisted(() => ({ entitled: false, cache: new Map() }));
vi.mock('../js/platform/purchases.js', () => ({
    PRODUCT_ID: 'fi.inetor.metsainfo.hinta_arvio',
    purchases: {
        isAvailable: () => true, isEntitled: () => mocks.entitled, onChange: () => () => {},
        getProduct: () => Promise.resolve({ price: '9,99 €' }), purchase: () => Promise.resolve(), restore: () => Promise.resolve()
    }
}));
vi.mock('../js/platform/share.js', () => ({ shareTextFile: vi.fn() }));
vi.mock('../js/platform/prices.js', () => ({
    lookupKunta: () => Promise.resolve({ kunta: '592', nimi: 'Petäjävesi' }),
    fetchPrices: (region) => Promise.resolve(pricesFor(region)),
    loadCachedPrices: (r) => mocks.cache.get(r) || null,
    loadOverrides: () => ({}),
    saveOverrides: () => {}
}));

const { showSummary, renderPeek } = await import('../js/ui/summary.js');
const { renderStandItem } = await import('../js/ui/stands.js');
const { buildCSV } = await import('../js/ui/actions.js');
const { showFeaturePopup, onEachHabitat, onEachMkiFeature } = await import('../js/ui/map-features.js');
const { initEstimate } = await import('../js/ui/estimate.js');
const { buildEstimateReport, METHOD_LABELS, SPECIES_LABELS, yearRangeLabel } = await import('../js/pricing/format.js');
const { COLOR_MODES, MKI_COLOR_MODES, TOOLTIPS, CODES } = await import('../js/config.js');
const { calculateStatistics } = await import('../js/statistics.js');

function pricesFor(region) {
    const table = emptyTable();
    for (const m of ['uudistus', 'harvennus', 'ensiharvennus']) {
        for (const s of ['manty', 'kuusi', 'koivu']) table[m][s] = { tukki: 70, kuitu: 20 };
    }
    return { region, period: '2026W45', periodLabel: 'vko 45/2026', source: 'testi', fetchedAt: Date.UTC(2026, 10, 10), table, filled: [] };
}

const norm = (html) => String(html).replace(/\s+/g, ' ').replace(/> </g, '><').trim();
const flush = () => new Promise(r => setTimeout(r, 0));
const parcel = { properties: { nationalCadastralReference: '99900100010001', label: '999-1-1-1', referencePoint: { coordinates: [400000, 6900000] } }, geometry: { type: 'Polygon', coordinates: [[[400000, 6900000], [400100, 6900000], [400100, 6900100], [400000, 6900100], [400000, 6900000]]] } };

function fakeLayer() {
    return { bindPopup(c) { this.popup = c; return this; }, openPopup() { return this; }, bindTooltip(t) { this.tooltip = t; return this; } };
}

// Tuloste riippuu kuluvasta vuodesta (lähivuosien hakkuut, vanhat tiedot):
// kello kiinnitetään tilannekuvien tallennuspäivään. Vain Date, jotta
// setTimeout (flush) toimii.
beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-16T12:00:00Z'));
});
afterAll(() => vi.useRealTimers());

beforeEach(() => {
    document.body.innerHTML = '<div id="info-panel"><div id="sheet-peek"></div><div id="info-content"></div></div>';
    localStorage.clear();
    localStorage.setItem('metsainfo.kieli', 'fi');
});

describe('suomenkielinen käyttöliittymä pysyy ennallaan', () => {
    it('yhteenveto ja peek', () => {
        mocks.entitled = false;
        showSummary(STANDS, parcel, 1);
        expect(norm(document.getElementById('info-content').innerHTML)).toMatchSnapshot();
        expect(norm(document.getElementById('sheet-peek').innerHTML)).toMatchSnapshot();
        showSummary([], parcel, 2);
        expect(norm(document.getElementById('info-content').innerHTML)).toMatchSnapshot();
        expect(norm(renderPeek({ label: 'X', areaHa: 12.5, partsInfo: '2 palstaa', stats: calculateStatistics(STANDS), featureCount: 3 }))).toMatchSnapshot();
    });

    it('kuviolista', () => {
        expect(STANDS.map((f, i) => norm(renderStandItem(f, i)))).toMatchSnapshot();
    });

    it('CSV', () => {
        expect(buildCSV(STANDS)).toMatchSnapshot();
    });

    it('karttapopupit', () => {
        const a = fakeLayer();
        showFeaturePopup(STANDS[0], a);
        const h = fakeLayer();
        onEachHabitat({ properties: { SPECIALFEATURECODE: 571, AREA: 0.5 } }, h);
        const h2 = fakeLayer();
        onEachHabitat({ properties: { SPECIALFEATURECODE: 9999, AREA: 0.5 } }, h2);
        const m = fakeLayer();
        onEachMkiFeature({ properties: { CUTTINGPURPOSE: 2, CUTTINGREALIZATIONPRACTICE: 5, DECLARATIONMAINTREESPECIES: 1, AREA: 2.3, DECLARATIONARRIVALYEAR: 2024 } }, m);
        // Kuvion ponnahdus on elementti (lisäosat voivat lisätä siihen rivin)
        expect([a.popup, h.popup, h2.popup, m.popup, m.tooltip].map(x => x?.innerHTML ?? x).map(norm)).toMatchSnapshot();
    });

    it('selitteet, termit ja koodistot', () => {
        expect({ COLOR_MODES, MKI_COLOR_MODES, TOOLTIPS, CODES }).toMatchSnapshot();
    });

    it('hinta-arvio: lukittu kortti ja ostonäkymä', async () => {
        mocks.entitled = false;
        document.body.innerHTML = '<div class="estimate-card" data-ctx="parcel"></div><div class="estimate-root" data-ctx="parcel"></div>';
        initEstimate(null, { features: STANDS, parcel, label: '999-1-1-1' });
        await flush(); await flush();
        expect(norm(document.body.innerHTML)).toMatchSnapshot();
        document.querySelector('[data-est="paywall"]')?.click();
        await flush(); await flush();
        expect(norm(document.getElementById('paywall')?.innerHTML || '')).toMatchSnapshot();
    });

    it('hinta-arvio: ostettu', async () => {
        mocks.entitled = true;
        mocks.cache.set('keski-suomi', pricesFor('keski-suomi'));
        document.body.innerHTML = '<div class="estimate-card" data-ctx="parcel"></div><div class="estimate-root" data-ctx="parcel"></div>';
        initEstimate(null, { features: STANDS, parcel, label: '999-1-1-1' });
        await flush(); await flush();
        expect(norm(document.body.innerHTML)).toMatchSnapshot();
    });

    it('hinta-arvion tekstit ja raportti', async () => {
        const { estimateParcel } = await import('../js/pricing/estimate.js');
        const table = pricesFor('keski-suomi').table;
        const estimate = estimateParcel(STANDS, table);
        expect({ METHOD_LABELS, SPECIES_LABELS, years: yearRangeLabel([{ year: 2027 }, { year: 2030 }]) }).toMatchSnapshot();
        expect(buildEstimateReport({ label: '999-1-1-1', regionName: 'Keski-Suomi', prices: pricesFor('keski-suomi'), table, estimate })).toMatchSnapshot();
    });

    it('index.html', () => {
        const html = readFileSync(new URL('../index.html', `file://${process.cwd()}/tests/`), 'utf8');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const attrs = [...doc.querySelectorAll('[title],[aria-label],[placeholder],[alt]')]
            .map(el => ['title', 'aria-label', 'placeholder', 'alt'].map(a => el.getAttribute(a)).filter(Boolean).join(' | '));
        expect({ text: norm(doc.body.textContent), attrs, title: doc.title }).toMatchSnapshot();
    });
});
