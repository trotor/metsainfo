import { describe, it, expect, beforeEach, vi } from 'vitest';

// Verkkoversio (#36): ei kauppaa eikä natiivia sovellusta
vi.mock('../js/platform/purchases.js', () => ({
    PRODUCT_ID: 'testi',
    purchases: { isAvailable: () => false, isEntitled: () => false, onChange: () => () => {}, getProduct: vi.fn() }
}));
vi.mock('../js/platform/index.js', () => ({ isNative: () => false }));
vi.mock('../js/platform/share.js', () => ({ shareTextFile: vi.fn() }));
vi.mock('../js/platform/prices.js', () => ({
    lookupKunta: vi.fn(() => Promise.resolve(null)),
    fetchPrices: vi.fn(() => Promise.reject(new Error('offline'))),
    loadCachedPrices: () => null,
    loadOverrides: () => ({}),
    saveOverrides: () => {}
}));

const { initEstimate, estimateTabButton, estimateTabPanel, estimateSummaryCard, STORE_LINKS } = await import('../js/ui/estimate.js');
const { purchases } = await import('../js/platform/purchases.js');
const { lookupKunta } = await import('../js/platform/prices.js');

const stand = { properties: { STANDNUMBER: 1, AREA: 2, SAWLOGVOLUME: 100, PULPWOODVOLUME: 50, PROPORTIONPINE: 1, CUTTINGTYPE: 5, CUTTINGPROPOSALYEAR: 2030 } };
const parcel = { properties: { nationalCadastralReference: 'W', referencePoint: { coordinates: [400000, 6900000] } } };
const flush = () => new Promise(r => setTimeout(r, 0));

beforeEach(() => {
    document.body.innerHTML = `${estimateSummaryCard()}${estimateTabPanel()}`;
    localStorage.clear();
});

describe('verkkoversio mainostaa hinta-arviota (#36)', () => {
    it('välilehti, kortti ja paneeli näkyvät verkossa', () => {
        expect(estimateTabButton()).toContain('data-tab="arvio"');
        expect(document.querySelector('.estimate-card')).not.toBeNull();
        expect(document.querySelector('.estimate-root')).not.toBeNull();
    });

    it('kortti näyttää hakkuuehdotukset ilman euroja eikä hae hintoja tai kuntaa', async () => {
        initEstimate(null, { features: [stand], parcel, label: 'W' });
        await flush();
        expect(document.querySelector('.estimate-card').textContent).toMatch(/1 hakkuuehdotus|hakkuuehdotu/);
        expect(lookupKunta).not.toHaveBeenCalled();
    });

    it('lukittu paneeli kertoo sovelluksesta ja linkittää kauppoihin', async () => {
        initEstimate(null, { features: [stand], parcel, label: 'W' });
        await flush();
        const root = document.querySelector('.estimate-root');
        expect(root.textContent).toContain('Metsäinfo-sovelluksen maksullinen lisäosa');
        expect(root.querySelector(`a[href="${STORE_LINKS.appStore}"]`)).not.toBeNull();
        expect(root.querySelector(`a[href="${STORE_LINKS.googlePlay}"]`)).not.toBeNull();
        expect(root.querySelector('[data-est="demo"]')).not.toBeNull();
    });

    it('arvo-painike avaa sovellusesittelyn ilman ostoa ja palautusta', async () => {
        initEstimate(null, { features: [stand], parcel, label: 'W' });
        await flush();
        document.querySelector('.estimate-card [data-est="paywall"]').click();
        await flush();
        const sheet = document.getElementById('paywall');
        expect(sheet).not.toBeNull();
        expect(sheet.querySelector('[data-est="buy"]')).toBeNull();
        expect(sheet.querySelector('[data-est="restore"]')).toBeNull();
        expect(sheet.querySelector(`a[href="${STORE_LINKS.appStore}"]`)).not.toBeNull();
        expect(sheet.querySelector(`a[href="${STORE_LINKS.googlePlay}"]`)).not.toBeNull();
        expect(purchases.getProduct).not.toHaveBeenCalled();
    });

    it('kauppalinkit ovat julkiset kauppasivut', () => {
        expect(STORE_LINKS.appStore).toMatch(/^https:\/\/apps\.apple\.com\/fi\/app\//);
        expect(STORE_LINKS.googlePlay).toBe('https://play.google.com/store/apps/details?id=fi.inetor.metsainfo');
    });
});
