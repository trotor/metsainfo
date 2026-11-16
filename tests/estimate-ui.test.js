import { describe, it, expect, beforeEach, vi } from 'vitest';
import { emptyTable } from '../js/pricing/prices.js';

// Alustamoduulit korvataan valeilla: hakujen järjestystä ohjataan testissä
const mocks = vi.hoisted(() => ({
    lookupKunta: null,
    fetchPrices: null,
    cache: new Map(),
    overrides: {},
    entitled: true
}));

vi.mock('../js/platform/purchases.js', () => ({
    purchases: { isAvailable: () => true, isEntitled: () => mocks.entitled, onChange: () => () => {} }
}));
vi.mock('../js/platform/share.js', () => ({ shareTextFile: vi.fn() }));
vi.mock('../js/platform/prices.js', () => ({
    lookupKunta: (...a) => mocks.lookupKunta(...a),
    fetchPrices: (...a) => mocks.fetchPrices(...a),
    loadCachedPrices: (r) => mocks.cache.get(r) || null,
    loadOverrides: () => mocks.overrides,
    saveOverrides: (o) => { mocks.overrides = o; }
}));

const { initEstimate, estimateTabButton } = await import('../js/ui/estimate.js');

function deferred() {
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    return { promise, resolve };
}

function pricesFor(region, mantyTukki) {
    const table = emptyTable();
    for (const m of ['uudistus', 'harvennus', 'ensiharvennus']) {
        for (const s of ['manty', 'kuusi', 'koivu']) table[m][s] = { tukki: mantyTukki, kuitu: 20 };
    }
    return { region, period: '2026W45', periodLabel: 'vko 45/2026', source: 'testi', fetchedAt: Date.now(), table, filled: [] };
}

const stand = { properties: { STANDNUMBER: 1, AREA: 1, SAWLOGVOLUME: 100, PULPWOODVOLUME: 0, PROPORTIONPINE: 1, CUTTINGTYPE: 5, CUTTINGPROPOSALYEAR: 2030 } };
const parcel = (ref, x) => ({ properties: { nationalCadastralReference: ref, referencePoint: { coordinates: [x, 6900000] } } });

const flush = () => new Promise(r => setTimeout(r, 0));
const shownRegion = () => document.querySelector('.estimate-root select[data-est="region"]').value;
const shownMantyTukki = () => document.querySelector('.estimate-root input[data-s="manty"][data-a="tukki"]').value;

beforeEach(() => {
    document.body.innerHTML = '<div class="estimate-card" data-ctx="parcel"></div><div class="estimate-root" data-ctx="parcel"></div>';
    mocks.cache = new Map();
    mocks.overrides = {};
    mocks.entitled = true;
    localStorage.clear();
});

describe('hinta-arvion haut eivät sekoitu', () => {
    it('hitaasti valmistuva edellisen kiinteistön haku ei korvaa nykyisen tietoja', async () => {
        const slowKunta = deferred();
        mocks.lookupKunta = (x) => x === 1 ? slowKunta.promise : Promise.resolve({ kunta: '698', nimi: 'Rovaniemi' });
        mocks.fetchPrices = (region) => Promise.resolve(pricesFor(region, region === 'lappi' ? 70 : 80));

        initEstimate(null, { features: [stand], parcel: parcel('A', 1), label: 'A' });
        initEstimate(null, { features: [stand], parcel: parcel('B', 2), label: 'B' });
        await flush(); await flush();
        expect(shownRegion()).toBe('lappi');

        slowKunta.resolve({ kunta: '592', nimi: 'Petäjävesi' });
        await flush(); await flush();
        expect(shownRegion()).toBe('lappi');
        expect(shownMantyTukki()).toBe('70,00');
        expect(document.querySelector('.estimate-root').textContent).not.toContain('Petäjävesi');
    });

    it('alueen vaihdon jälkeen valmistuva vanhan alueen haku ei korvaa hintoja', async () => {
        const slowPrices = deferred();
        mocks.lookupKunta = () => Promise.resolve({ kunta: '592', nimi: 'Petäjävesi' });
        mocks.fetchPrices = (region) => region === 'keski-suomi' ? slowPrices.promise : Promise.resolve(pricesFor(region, 70));

        initEstimate(null, { features: [stand], parcel: parcel('A', 1), label: 'A' });
        await flush(); await flush();
        const select = document.querySelector('.estimate-root select[data-est="region"]');
        select.value = 'lappi';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await flush(); await flush();
        expect(shownMantyTukki()).toBe('70,00');

        slowPrices.resolve(pricesFor('keski-suomi', 80));
        await flush(); await flush();
        expect(shownRegion()).toBe('lappi');
        expect(shownMantyTukki()).toBe('70,00');
        // Itse valittu alue: ei väitetä kunnan perusteella valituksi
        expect(document.querySelector('.est-src').textContent).not.toContain('Petäjävesi');
    });
});

describe('puuttuvat hinnat näkyvät', () => {
    it('kortti ja koko puuston arvo kertovat puuttuvista hinnoista', async () => {
        const partial = pricesFor('keski-suomi', null);
        partial.table.uudistus.manty = { tukki: null, kuitu: 20 };
        mocks.lookupKunta = () => Promise.resolve({ kunta: '592', nimi: 'Petäjävesi' });
        mocks.fetchPrices = () => Promise.resolve(partial);
        initEstimate(null, { features: [stand], parcel: parcel('A', 1), label: 'A' });
        await flush(); await flush();
        expect(document.querySelector('.estimate-card').textContent).toMatch(/puuttuu/i);
        expect(document.querySelector('.est-stock').textContent).toMatch(/puuttuu/i);
    });
});

describe('käyttöönotto', () => {
    const stands = [
        stand,
        { properties: { ...stand.properties, STANDNUMBER: 2, CUTTINGTYPE: 3, CUTTINGPROPOSALYEAR: 2027 } }
    ];

    it('lukittu kortti kertoo kiinteistön hakkuuehdotukset ilman euroja', () => {
        mocks.entitled = false;
        initEstimate(null, { features: stands, parcel: parcel('A', 1), label: 'A' });
        const card = document.querySelector('.estimate-card').textContent;
        expect(card).toContain('2 hakkuuehdotusta');
        expect(card).toContain('Vuosina 2027–2030.');
        expect(card.replace(/\s/g, ' ')).toContain('130 m³');
        expect(card).not.toMatch(/\d\s*€/);
        expect(document.querySelector('.estimate-card [data-est="paywall"]').textContent).toBe('Näytä arvo');
    });

    it('ostettuna tulos näkyy ensin ja hintataulukko on piilossa, kunnes sen avaa', async () => {
        mocks.cache.set('lappi', pricesFor('lappi', 70));
        mocks.lookupKunta = () => Promise.resolve({ kunta: '698', nimi: 'Rovaniemi' });
        mocks.fetchPrices = (region) => Promise.resolve(pricesFor(region, 70));
        // Oma tunnus: kuntien välimuisti on moduulin laajuinen
        initEstimate(null, { features: stands, parcel: parcel('L', 3), label: 'L' });
        await flush(); await flush();
        const root = document.querySelector('.estimate-root');
        const body = root.querySelector('.est-prices-body');
        // Tulos ennen hintataulukkoa
        expect(root.querySelector('.est-result').compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(body.hidden).toBe(true);
        expect(root.querySelector('.est-prices-head').textContent).toContain('Lappi');
        root.querySelector('[data-est="toggle-prices"]').click();
        expect(document.querySelector('.estimate-root .est-prices-body').hidden).toBe(false);
    });

    it('ilman hintoja hintataulukko on auki', async () => {
        mocks.lookupKunta = () => Promise.resolve(null);
        mocks.fetchPrices = () => Promise.reject(new Error('offline'));
        initEstimate(null, { features: stands, parcel: parcel('B', 1), label: 'B' });
        await flush(); await flush();
        expect(document.querySelector('.estimate-root .est-prices-body').hidden).toBe(false);
        expect(document.querySelector('.estimate-root').textContent).toContain('Hinnat puuttuvat');
    });

    it('Uutta-merkki näkyy, kunnes Arvio-välilehti avataan', () => {
        mocks.entitled = false;
        document.body.innerHTML = `<div class="tabbar">${estimateTabButton()}</div>`;
        initEstimate(null, { features: stands, parcel: parcel('A', 1), label: 'A' });
        expect(document.querySelector('.est-new')).not.toBeNull();
        document.querySelector('.tabbar [data-tab="arvio"]').click();
        expect(document.querySelector('.est-new')).toBeNull();
        expect(estimateTabButton()).not.toContain('Uutta');
    });

    it('ostaneelle ei näytetä Uutta-merkkiä', () => {
        mocks.entitled = true;
        expect(estimateTabButton()).not.toContain('Uutta');
    });
});

describe('kuvitteellinen tila', () => {
    it('käyttää annettua hinta-aluetta eikä hae kuntaa', async () => {
        let kuntaCalls = 0;
        mocks.lookupKunta = () => { kuntaCalls++; return Promise.resolve({ kunta: '698', nimi: 'Rovaniemi' }); };
        mocks.fetchPrices = (region) => Promise.resolve(pricesFor(region, 70));
        const parcel = { properties: { label: 'Esimerkkimetsä', esimerkki: true, priceRegion: 'keski-suomi' } };
        initEstimate(null, { features: [stand], parcel, label: 'Esimerkkimetsä' });
        await flush(); await flush();
        expect(kuntaCalls).toBe(0);
        expect(shownRegion()).toBe('keski-suomi');
        expect(document.querySelector('.estimate-root').textContent).not.toContain('· kunta');
    });
});
