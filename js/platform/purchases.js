/**
 * Sovelluksen sisäiset ostot (hinta-arvio). Natiivi plugin "Purchases":
 * iOS StoreKit 2 (ios/App/App/PurchasesPlugin.swift), Android Play Billing.
 * Verkkoversiossa ostoja ei ole, eikä hinta-arvio ole siellä käytössä.
 *
 * Oikeus tallennetaan laitteelle, jotta se toimii ilman verkkoa; kauppa on
 * aina lähde, kun tarkistus onnistuu (palautukset ja hyvitykset).
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { isNative } from './index.js';

export const PRODUCT_ID = 'fi.inetor.metsainfo.hintaarvio';
const STORAGE_KEY = 'metsainfo.hintaarvio';

function readFlag() {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

function writeFlag(value) {
    try {
        if (value) localStorage.setItem(STORAGE_KEY, '1');
        else localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Tallennus ei ole välttämätöntä
    }
}

/** Testattava tehdas: plugin ja ympäristö injektoidaan. */
export function createPurchases({ native, plugin }) {
    const available = !!native && !!plugin;
    let entitled = available && readFlag();
    const listeners = new Set();

    const set = (value) => {
        if (value === entitled) return;
        entitled = value;
        writeFlag(value);
        listeners.forEach(fn => fn(value));
    };

    const api = {
        isAvailable: () => available,
        isEntitled: () => entitled,
        onChange(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        async getProduct() {
            if (!available) return null;
            const { products } = await plugin.getProducts({ productIds: [PRODUCT_ID] });
            return products?.find(p => p.id === PRODUCT_ID) || null;
        },
        async refreshEntitlement() {
            if (!available) return false;
            try {
                const { owned } = await plugin.getEntitlements({ productIds: [PRODUCT_ID] });
                set((owned || []).includes(PRODUCT_ID));
            } catch {
                // Ei verkkoa tms.: pidetään tallennettu tila
            }
            return entitled;
        },
        async purchase() {
            if (!available) return 'unavailable';
            const { status } = await plugin.purchase({ productId: PRODUCT_ID });
            if (status === 'purchased') set(true);
            return status;
        },
        async restore() {
            if (!available) return false;
            await plugin.restore();
            const { owned } = await plugin.getEntitlements({ productIds: [PRODUCT_ID] });
            set((owned || []).includes(PRODUCT_ID));
            return entitled;
        }
    };

    // Kaupan ilmoitus muutoksesta (hyväksytty ostopyyntö, hyvitys, toisella laitteella tehty osto)
    if (available && typeof plugin.addListener === 'function') {
        plugin.addListener('entitlementsChanged', () => api.refreshEntitlement());
    }
    return api;
}

const nativePlugin = Capacitor.isPluginAvailable('Purchases') ? registerPlugin('Purchases') : null;

/**
 * Kehitystila: valekauppa selaintestaukseen (vain `npm run dev`, kun
 * localStorage 'metsainfo.devOstot' = '1'). Tuotantobuildissa pois.
 */
function devStore() {
    let owned = [];
    return {
        async getProducts() { return { products: [{ id: PRODUCT_ID, title: 'Hinta-arvio', displayPrice: '9,99 €' }] }; },
        async purchase() { owned = [PRODUCT_ID]; return { status: 'purchased' }; },
        async getEntitlements() { return { owned }; },
        async restore() {}
    };
}

let devMode = false;
if (import.meta.env?.DEV) {
    try {
        devMode = localStorage.getItem('metsainfo.devOstot') === '1';
    } catch {
        devMode = false;
    }
}

/** Sovelluksen ostot (yksi instanssi). */
export const purchases = createPurchases({
    native: isNative() || devMode,
    plugin: nativePlugin || (devMode ? devStore() : null)
});
