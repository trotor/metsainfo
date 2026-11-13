import { describe, it, expect, beforeEach } from 'vitest';
import weekly from './fixtures/luke-viikko.json';
import monthly from './fixtures/luke-kuukausi.json';
import { fetchPrices, loadCachedPrices, lookupKunta, saveOverrides, loadOverrides } from '../js/platform/prices.js';
import { applyOverrides, emptyTable, WEEKLY_URL, MONTHLY_URL } from '../js/pricing/prices.js';

function fakeFetch(routes) {
    const calls = [];
    const fn = async (url, init) => {
        calls.push({ url: String(url), init });
        const r = routes(String(url), init);
        if (r instanceof Error) throw r;
        return { ok: r.ok ?? true, status: r.status ?? 200, json: async () => r.body };
    };
    fn.calls = calls;
    return fn;
}

beforeEach(() => localStorage.clear());

describe('fetchPrices', () => {
    it('hakee viikko- ja kuukausitaulun ja täydentää puuttuvat', async () => {
        const f = fakeFetch(url => ({ body: url === WEEKLY_URL ? weekly : monthly }));
        const r = await fetchPrices('keski-suomi', { fetch: f, now: () => 1000 });
        expect(f.calls).toHaveLength(2);
        const wq = JSON.parse(f.calls.find(c => c.url === WEEKLY_URL).init.body);
        expect(wq.query.find(q => q.code === 'MPKH').selection.values).toEqual(['3', '9']);
        expect(r.region).toBe('keski-suomi');
        expect(r.periodLabel).toBe('vko 42/2026');
        expect(r.table.uudistus.manty.tukki).toBeCloseTo(81.02, 2);
        expect(r.table.ensiharvennus.manty.tukki).not.toBeNull();
        expect(r.filled.length).toBeGreaterThan(0);
        expect(r.fetchedAt).toBe(1000);
    });
    it('tallentaa tuloksen välimuistiin alueittain', async () => {
        const f = fakeFetch(url => ({ body: url === WEEKLY_URL ? weekly : monthly }));
        await fetchPrices('keski-suomi', { fetch: f, now: () => 5 });
        expect(loadCachedPrices('keski-suomi').fetchedAt).toBe(5);
        expect(loadCachedPrices('lappi')).toBeNull();
    });
    it('käyttää kuukausitilastoa, jos viikkohaku epäonnistuu', async () => {
        const f = fakeFetch(url => url === WEEKLY_URL ? new Error('verkko') : { body: monthly });
        const r = await fetchPrices('keski-suomi', { fetch: f });
        expect(r.periodLabel).toBe('9/2026');
        expect(r.source).toMatch(/Luonnonvarakeskus/);
    });
    it('koko maan haussa aluekoodi ei toistu (PxWeb hylkää kaksoiskoodit)', async () => {
        const f = fakeFetch(url => ({ body: url === WEEKLY_URL ? weekly : monthly }));
        await fetchPrices('koko-maa', { fetch: f });
        const wq = JSON.parse(f.calls.find(c => c.url === WEEKLY_URL).init.body);
        const mq = JSON.parse(f.calls.find(c => c.url === MONTHLY_URL).init.body);
        expect(wq.query.find(q => q.code === 'MPKH').selection.values).toEqual(['9']);
        expect(mq.query.find(q => q.code === 'MPKH').selection.values).toEqual(['SSS']);
    });

    it('heittää virheen, jos kumpikaan haku ei onnistu', async () => {
        const f = fakeFetch(() => ({ ok: false, status: 503, body: null }));
        await expect(fetchPrices('keski-suomi', { fetch: f })).rejects.toThrow();
    });
});

describe('lookupKunta', () => {
    it('kysyy kunnan pisteestä Tilastokeskuksen WFS:ltä', async () => {
        const f = fakeFetch(() => ({ body: { features: [{ properties: { kunta: '592', nimi: 'Petäjävesi' } }] } }));
        expect(await lookupKunta(400700, 6900500, { fetch: f })).toEqual({ kunta: '592', nimi: 'Petäjävesi' });
        expect(f.calls[0].url).toContain('geo.stat.fi');
        expect(new URL(f.calls[0].url).searchParams.get('CQL_FILTER')).toBe('INTERSECTS(geom,POINT(400700 6900500))');
    });
    it('palauttaa null, jos kuntaa ei löydy tai haku epäonnistuu', async () => {
        expect(await lookupKunta(0, 0, { fetch: fakeFetch(() => ({ body: { features: [] } })) })).toBeNull();
        expect(await lookupKunta(0, 0, { fetch: fakeFetch(() => new Error('x')) })).toBeNull();
    });
});

describe('omat hinnat', () => {
    it('tallentuvat ja korvaavat verkon hinnat', () => {
        saveOverrides({ uudistus: { kuusi: { tukki: 88 } } });
        const t = emptyTable(); t.uudistus.kuusi.tukki = 86.44; t.uudistus.kuusi.kuitu = 25;
        const merged = applyOverrides(t, loadOverrides());
        expect(merged.uudistus.kuusi.tukki).toBe(88);
        expect(merged.uudistus.kuusi.kuitu).toBe(25);
        expect(t.uudistus.kuusi.tukki).toBe(86.44); // alkuperäinen ennallaan
    });
    it('tyhjä tai rikkinäinen tallennus palauttaa tyhjän', () => {
        localStorage.setItem('metsainfo.hintaOverrides', '{rikki');
        expect(loadOverrides()).toEqual({});
    });
    it('esimerkkimetsän omat hinnat eivät sekoitu kiinteistöjen hintoihin', () => {
        saveOverrides({ uudistus: { manty: { tukki: 99 } } }, 'demo');
        expect(loadOverrides('demo').uudistus.manty.tukki).toBe(99);
        expect(loadOverrides()).toEqual({});
    });
});

describe('välimuistin rakenne', () => {
    it('vanhan tai rikkinäisen rakenteen välimuisti hylätään', () => {
        localStorage.setItem('metsainfo.hinnat.lappi', JSON.stringify({ table: { uudistus: {} }, fetchedAt: 1 }));
        expect(loadCachedPrices('lappi')).toBeNull();
    });
});

