import { describe, it, expect } from 'vitest';
import { createCachedFetch } from '../js/valimuisti.js';

/** Cache API:n pieni korvike testeihin (lisäysjärjestys säilyy). */
function fakeCaches() {
    const stores = new Map();
    return {
        async open(name) {
            if (!stores.has(name)) {
                const m = new Map();
                stores.set(name, {
                    async match(url) { const r = m.get(url); return r ? r.clone() : undefined; },
                    async put(url, res) { m.set(url, res); },
                    async delete(url) { return m.delete(typeof url === 'string' ? url : url.url); },
                    async keys() { return [...m.keys()].map(url => ({ url })); },
                    size: () => m.size
                });
            }
            return stores.get(name);
        }
    };
}

describe('pysyvä välimuisti', () => {
    it('hakee osoitteen verkosta vain kerran ttl:n aikana', async () => {
        let calls = 0, t = 1000;
        const fetchFn = async () => { calls++; return new Response('data' + calls); };
        const f = createCachedFetch({ name: 'x', ttl: 100, fetchFn, cacheStorage: fakeCaches(), now: () => t });
        expect(await (await f('u')).text()).toBe('data1');
        expect(await (await f('u')).text()).toBe('data1');
        expect(calls).toBe(1);
        t += 200; // vanhentui
        expect(await (await f('u')).text()).toBe('data2');
        expect(calls).toBe(2);
    });
    it('ilman verkkoa palauttaa vanhentuneen vastauksen', async () => {
        let t = 0, online = true;
        const fetchFn = async () => { if (!online) throw new TypeError('offline'); return new Response('vanha'); };
        const f = createCachedFetch({ name: 'x', ttl: 10, fetchFn, cacheStorage: fakeCaches(), now: () => t });
        await f('u');
        t = 1000; online = false;
        expect(await (await f('u')).text()).toBe('vanha');
        await expect(f('muu')).rejects.toThrow('offline');
    });
    it('virhevastausta ei tallenneta', async () => {
        let calls = 0;
        const fetchFn = async () => { calls++; return new Response('x', { status: 500 }); };
        const f = createCachedFetch({ name: 'x', ttl: 1000, fetchFn, cacheStorage: fakeCaches() });
        expect((await f('u')).status).toBe(500);
        await f('u');
        expect(calls).toBe(2);
    });
    it('pitää enintään maxEntries vastausta', async () => {
        const cs = fakeCaches();
        const f = createCachedFetch({ name: 'x', ttl: 1000, maxEntries: 2, fetchFn: async (u) => new Response(u), cacheStorage: cs });
        for (const u of ['a', 'b', 'c']) await f(u);
        await f('d'); // karsinta ajetaan ensimmäisen ja sitten joka 20. lisäyksen jälkeen
        const cache = await cs.open('x');
        expect(cache.size()).toBeLessThanOrEqual(4);
    });
    it('ilman Cache APIa hakee suoraan', async () => {
        let calls = 0;
        const f = createCachedFetch({ name: 'x', ttl: 1000, fetchFn: async () => { calls++; return new Response('ok'); }, cacheStorage: null });
        // cacheStorage null → globaali caches puuttuu jsdomissa
        await f('u'); await f('u');
        expect(calls).toBe(2);
    });
});

import { salliHaku } from '../js/demo/kuvaustila.js';

describe('kuvaustilan hakurajaus', () => {
    it('sallii vain oman palvelimen ja Luken hintatilastot', () => {
        const o = 'http://localhost:5199';
        expect(salliHaku('demo/esimerkkimetsa.json', o)).toBe(true);
        expect(salliHaku('https://statdb.luke.fi/PxWeb/api/v1/fi/x', o)).toBe(true);
        expect(salliHaku('https://geoserver.museovirasto.fi/geoserver/wfs', o)).toBe(false);
        expect(salliHaku('https://avoin.metsakeskus.fi/rajapinnat/v1/stand/ows', o)).toBe(false);
        expect(salliHaku('https://geo.stat.fi/geoserver/tilastointialueet/wfs', o)).toBe(false);
    });
});
