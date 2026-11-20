/**
 * Pysyvä välimuisti avoimien aineistojen GET-hauille (Cache API): sama
 * osoite haetaan verkosta vain, kun tallennettu vastaus on vanhentunut.
 * Laitteelle jää vain julkisten rajapintojen vastauksia (ei käyttäjän tietoja).
 *
 * - ttl: kuinka kauan vastaus kelpaa (ms)
 * - ilman verkkoa vanhentunutkin vastaus palautetaan, jos sellainen on
 * - enintään maxEntries vastausta; vanhimmat poistetaan
 * - ilman Cache APIa (vanha selain, testit) haetaan suoraan verkosta
 */

import { KUVAUSTILA } from './demo/kuvaustila.js';

const AIKA = 'x-metsainfo-tallennettu';

export function createCachedFetch({ name, ttl, maxEntries = 400, fetchFn = (...a) => fetch(...a), cacheStorage, now = () => Date.now() }) {
    // Kuvaustilassa ei välimuistia: aiemmin tallennettu oikea aineisto ei saa päätyä kauppakuviin
    const storage = () => cacheStorage ?? (!KUVAUSTILA && typeof caches !== 'undefined' ? caches : null);
    let avoin = null;
    const avaa = () => (avoin ??= storage()?.open(name).catch(() => null) ?? Promise.resolve(null));
    let lisatty = 0;

    async function karsi(cache) {
        const keys = await cache.keys();
        // keys() palauttaa lisäysjärjestyksessä: vanhimmat ensin
        for (const req of keys.slice(0, Math.max(0, keys.length - maxEntries))) await cache.delete(req);
    }

    async function tallenna(cache, url, res) {
        const body = await res.clone().arrayBuffer();
        const headers = new Headers(res.headers);
        headers.set(AIKA, String(now()));
        await cache.delete(url);
        await cache.put(url, new Response(body, { status: res.status, statusText: res.statusText, headers }));
        if (++lisatty % 20 === 1) await karsi(cache);
    }

    return async function cachedFetch(url, opts = {}) {
        const cache = await avaa();
        if (!cache) return fetchFn(url, opts);
        let tallessa = null;
        try {
            tallessa = await cache.match(url);
        } catch { /* ei välimuistia */ }
        const aika = Number(tallessa?.headers.get(AIKA));
        if (tallessa && Number.isFinite(aika) && now() - aika < ttl) return tallessa;
        let res;
        try {
            res = await fetchFn(url, opts);
        } catch (error) {
            if (tallessa) return tallessa; // ei verkkoa: vanhentunut parempi kuin ei mitään
            throw error;
        }
        if (res.ok) await tallenna(cache, url, res).catch(() => {});
        else if (tallessa) return tallessa;
        return res;
    };
}
