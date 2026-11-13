import { describe, it, expect, beforeEach } from 'vitest';
import { createPurchases, PRODUCT_ID } from '../js/platform/purchases.js';

function fakePlugin({ owned = [], purchaseStatus = 'purchased', products = [{ id: PRODUCT_ID, title: 'Hinta-arvio', displayPrice: '9,99 €' }] } = {}) {
    const calls = [];
    return {
        calls,
        owned,
        async getProducts({ productIds }) { calls.push(['getProducts', productIds]); return { products }; },
        async purchase({ productId }) {
            calls.push(['purchase', productId]);
            if (purchaseStatus === 'purchased') this.owned = [productId];
            return { status: purchaseStatus };
        },
        async getEntitlements() { calls.push(['getEntitlements']); return { owned: this.owned }; },
        async restore() { calls.push(['restore']); }
    };
}

beforeEach(() => localStorage.clear());

describe('ostot', () => {
    it('verkkoversiossa ostot eivät ole käytössä', async () => {
        const p = createPurchases({ native: false, plugin: fakePlugin() });
        expect(p.isAvailable()).toBe(false);
        expect(await p.refreshEntitlement()).toBe(false);
        expect(p.isEntitled()).toBe(false);
    });

    it('ilman natiivia pluginia (esim. Android ennen Billingiä) ostot eivät ole käytössä', () => {
        expect(createPurchases({ native: true, plugin: null }).isAvailable()).toBe(false);
    });

    it('hakee tuotteen hinnan kaupasta', async () => {
        const p = createPurchases({ native: true, plugin: fakePlugin() });
        expect((await p.getProduct()).displayPrice).toBe('9,99 €');
    });

    it('onnistunut osto avaa oikeuden ja tallentaa sen laitteelle', async () => {
        const plugin = fakePlugin();
        const p = createPurchases({ native: true, plugin });
        expect(p.isEntitled()).toBe(false);
        expect(await p.purchase()).toBe('purchased');
        expect(p.isEntitled()).toBe(true);
        // Uusi käynnistys ilman verkkoa: tallennettu tila säilyy
        expect(createPurchases({ native: true, plugin: fakePlugin() }).isEntitled()).toBe(true);
    });

    it('peruttu osto ei avaa oikeutta', async () => {
        const p = createPurchases({ native: true, plugin: fakePlugin({ purchaseStatus: 'cancelled' }) });
        expect(await p.purchase()).toBe('cancelled');
        expect(p.isEntitled()).toBe(false);
    });

    it('palautus tarkistaa omistuksen kaupasta', async () => {
        const plugin = fakePlugin({ owned: [PRODUCT_ID] });
        const p = createPurchases({ native: true, plugin });
        expect(await p.restore()).toBe(true);
        expect(plugin.calls.map(c => c[0])).toEqual(['restore', 'getEntitlements']);
        expect(p.isEntitled()).toBe(true);
    });

    it('palautettu tai hyvitetty osto poistaa oikeuden seuraavassa tarkistuksessa', async () => {
        const plugin = fakePlugin({ owned: [PRODUCT_ID] });
        const p = createPurchases({ native: true, plugin });
        await p.refreshEntitlement();
        plugin.owned = [];
        expect(await p.refreshEntitlement()).toBe(false);
        expect(p.isEntitled()).toBe(false);
    });

    it('tarkistuksen virhe (ei verkkoa) pitää tallennetun tilan', async () => {
        const plugin = fakePlugin({ owned: [PRODUCT_ID] });
        const p = createPurchases({ native: true, plugin });
        await p.refreshEntitlement();
        plugin.getEntitlements = async () => { throw new Error('offline'); };
        expect(await p.refreshEntitlement()).toBe(true);
    });

    it('ilmoittaa kuuntelijoille muutoksesta', async () => {
        const p = createPurchases({ native: true, plugin: fakePlugin() });
        const seen = [];
        p.onChange(v => seen.push(v));
        await p.purchase();
        expect(seen).toEqual([true]);
    });
});
