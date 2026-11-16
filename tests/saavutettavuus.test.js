import "../js/vendor/index.js";
import { describe, it, expect } from 'vitest';
import {
    distToSegment, distToLine, containsPoint, lineCrossesPolygon, lineNearPolygon, samplePoints, bboxOf
} from '../js/saavutettavuus/geometria.js';
import { roadKind, isPublic, createRoadIndex, buildGraph, routeToPublic } from '../js/saavutettavuus/tieverkko.js';

const square = (x, y, s) => ({ type: 'Polygon', coordinates: [[[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]]] });

describe('geometria', () => {
    it('etäisyys janasta', () => {
        expect(distToSegment([0, 5], [0, 0], [10, 0])).toBe(5);
        expect(distToSegment([13, 4], [0, 0], [10, 0])).toBe(5);
        expect(distToLine([5, -3], [[0, 0], [10, 0], [10, 10]])).toBe(3);
    });

    it('piste monikulmiossa, reikä huomioiden', () => {
        const holed = { type: 'Polygon', coordinates: [square(0, 0, 100).coordinates[0], square(40, 40, 20).coordinates[0]] };
        expect(containsPoint(holed, [10, 10])).toBe(true);
        expect(containsPoint(holed, [50, 50])).toBe(false);
        const multi = { type: 'MultiPolygon', coordinates: [square(0, 0, 10).coordinates, square(100, 0, 10).coordinates] };
        expect(containsPoint(multi, [105, 5])).toBe(true);
    });

    it('viiva leikkaa monikulmion ilman sisäpistettä', () => {
        expect(lineCrossesPolygon([[-10, 50], [110, 50]], square(0, 0, 100))).toBe(true);
        expect(lineCrossesPolygon([[-10, 150], [110, 150]], square(0, 0, 100))).toBe(false);
    });

    it('viiva lähellä monikulmiota, myös monipalstaisen toista osaa', () => {
        expect(lineNearPolygon([[140, 0], [140, 100]], square(0, 0, 100), 50)).toBe(true);
        expect(lineNearPolygon([[140, 0], [140, 100]], square(0, 0, 100), 30)).toBe(false);
        const multi = { type: 'MultiPolygon', coordinates: [square(0, 0, 10).coordinates, square(1000, 0, 10).coordinates] };
        expect(lineNearPolygon([[1020, -50], [1020, 50]], multi, 15)).toBe(true);
    });

    it('sisäpistehila', () => {
        expect(samplePoints(square(0, 0, 100), { step: 20 })).toHaveLength(25);
        const big = samplePoints(square(0, 0, 2000), { step: 20, max: 400 });
        expect(big.length).toBeLessThanOrEqual(400);
        expect(big.length).toBeGreaterThan(200);
        // Kapea kuvio, johon hila ei osu: yksi sisäpiste
        expect(samplePoints(square(0, 0, 5), { step: 20 })).toHaveLength(1);
    });

    it('rajaava suorakulmio marginaalilla', () => {
        expect(bboxOf([square(0, 0, 10), square(20, 20, 10)], 5)).toEqual({ minX: -5, minY: -5, maxX: 35, maxY: 35 });
    });
});

const link = (id, coords, props = {}) => ({ id, coords, props: { toiminn_lk: 6, hallinn_lk: 3, ...props } });

describe('tieverkko', () => {
    it('tien laji ja yleinen tie', () => {
        expect(roadKind({ toiminn_lk: 1 })).toBe('auto');
        expect(roadKind({ toiminn_lk: 6 })).toBe('auto');
        expect(roadKind({ toiminn_lk: 7 })).toBe('ajopolku');
        expect(roadKind({ toiminn_lk: 8 })).toBe('kevyt');
        expect(roadKind({})).toBe(null);
        expect(isPublic({ hallinn_lk: 2 })).toBe(true);
        expect(isPublic({ hallinn_lk: 3 })).toBe(false);
    });

    it('lähin autotie, ei ajopolkua', () => {
        const idx = createRoadIndex([
            link('polku', [[0, 10], [100, 10]], { toiminn_lk: 7 }),
            link('tie', [[0, 50], [100, 50]])
        ]);
        const hit = idx.nearest([50, 0]);
        expect(hit.link.id).toBe('tie');
        expect(hit.dist).toBe(50);
        expect(idx.nearest([50, 0], 'ajopolku').dist).toBe(10);
    });

    const network = [
        link('A', [[0, 0], [300, 0]]),
        link('B', [[300, 0], [300, 400]], { hallinn_lk: 2, toiminn_lk: 4 }),
        link('erillinen', [[5000, 0], [5100, 0]])
    ];

    it('reitti yleiselle tielle', () => {
        const route = routeToPublic(buildGraph(network), [[0, 5]]);
        expect(route.length).toBe(300);
        expect(route.linkIds).toEqual(['A']);
    });

    it('lähtö jo yleisellä tiellä: pituus 0', () => {
        expect(routeToPublic(buildGraph(network), [[300, 200]]).length).toBe(0);
    });

    it('ei yhteyttä tai liian pitkä', () => {
        expect(routeToPublic(buildGraph(network), [[5050, 0]])).toBe(null);
        expect(routeToPublic(buildGraph(network), [[0, 0]], { maxLength: 200 })).toBe(null);
        expect(routeToPublic(buildGraph(network), [[0, 500]])).toBe(null); // ei tietä 50 m sisällä
    });
});

import { soilScore, attributeScore, haulScore, connectionScore, combine } from '../js/saavutettavuus/indeksi.js';
import { classifyPixel, rasterRequest, classShares } from '../js/saavutettavuus/rasteri.js';

describe('pisteytys', () => {
    it('maapohja pinta-alalla painotettuna, vesistö ei mukana', () => {
        expect(soilScore({ 2: 0.5, 6: 0.5 })).toBe(50);
        expect(soilScore({ 1: 0.5, 254: 0.5 })).toBe(100);
        expect(soilScore({ 254: 1 })).toBe(null);
        expect(soilScore(null)).toBe(null);
    });

    it('kuvion oma korjuukelpoisuus', () => {
        expect(attributeScore(1)).toBe(100);
        expect(attributeScore(4)).toBe(20);
        expect(attributeScore(5)).toBe(null);
    });

    it('metsäkuljetusmatka', () => {
        expect(haulScore(50)).toBe(100);
        expect(haulScore(100)).toBe(100);
        expect(haulScore(550)).toBe(50);
        expect(haulScore(1000)).toBe(0);
        expect(haulScore(3000)).toBe(0);
        expect(haulScore(null)).toBe(null);
    });

    it('tieyhteys', () => {
        expect(connectionScore({ reachesParcel: true, route: { length: 300 } })).toBe(100);
        expect(connectionScore({ reachesParcel: true, route: null })).toBe(60);
        expect(connectionScore({ reachesParcel: false, route: null })).toBe(0);
        expect(connectionScore({ reachesParcel: true, route: { length: 1 }, restricted: true })).toBe(80);
        expect(connectionScore({ reachesParcel: false, restricted: true })).toBe(0);
    });

    it('yhdistelmä, puuttuva osa ja luokkarajat', () => {
        expect(combine({ M: 100, K: 50, Y: null })).toEqual({ score: 75, luokka: 'hyva', puuttuu: ['Y'] });
        expect(combine({ M: 70, K: 70, Y: 70 }).luokka).toBe('hyva');
        expect(combine({ M: 69, K: 69, Y: 69 }).luokka).toBe('kohtalainen');
        expect(combine({ M: 39, K: 39, Y: 39 }).luokka).toBe('heikko');
        expect(combine({}).score).toBe(null);
    });
});

describe('korjuukelpoisuusrasteri', () => {
    it('väri → luokka', () => {
        expect(classifyPixel(0x61, 0x99, 0, 255)).toBe(2);
        expect(classifyPixel(0x63, 0x9b, 0x02, 255)).toBe(2); // värinhallinnan pieni poikkeama
        expect(classifyPixel(0x80, 0xff, 0xff, 255)).toBe(254);
        expect(classifyPixel(0x61, 0x99, 0, 0)).toBe(null);
        expect(classifyPixel(0x00, 0x00, 0xff, 255)).toBe(null);
    });

    it('pyynnön koko', () => {
        const r = rasterRequest({ minX: 0, minY: 0, maxX: 2000, maxY: 2000 });
        expect([r.width, r.height]).toEqual([250, 250]);
        const big = rasterRequest({ minX: 0, minY: 0, maxX: 20000, maxY: 10000 });
        expect([big.width, big.height]).toEqual([1024, 512]);
        expect(r.url).toContain('layers=Korjuukelpoisuus');
    });

    it('luokkien osuudet kuvion sisältä', () => {
        // 4 × 4 px, 10 m/px; vasen puoli luokka 2, oikea puoli luokka 6
        const width = 4, height = 4, data = new Uint8ClampedArray(width * height * 4);
        for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
            const c = i < 2 ? [0x61, 0x99, 0] : [0xff, 0x26, 0];
            data.set([...c, 255], (j * width + i) * 4);
        }
        const raster = { data, width, height, bbox: { minX: 0, minY: 0, maxX: 40, maxY: 40 } };
        expect(classShares(raster, square(0, 0, 40))).toEqual({ 2: 0.5, 6: 0.5 });
        expect(classShares(raster, square(0, 0, 20))).toEqual({ 2: 1 });
        expect(classShares(raster, square(100, 100, 10))).toBe(null);
    });
});

import { analyseParcel } from '../js/saavutettavuus/analyysi.js';
import { createRoadSource, tileKeys, toLinks } from '../js/saavutettavuus/aineisto.js';

describe('aineisto', () => {
    const feature = (id, coords, props = {}) => ({
        type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: { link_id: id, ...props }
    });
    const respond = (json) => Promise.resolve({ ok: true, json: () => Promise.resolve(json) });

    it('ruudut ja monirivinen linkki', () => {
        expect(tileKeys({ minX: 100, minY: 100, maxX: 2100, maxY: 1900 })).toEqual(['0,0', '1,0']);
        const parts = toLinks({ geometry: { type: 'MultiLineString', coordinates: [[[0, 0, 5], [1, 1, 5]], [[2, 2], [3, 3]]] }, properties: { link_id: 'x' } });
        expect(parts.map(p => p.id)).toEqual(['x#0', 'x#1']);
        expect(parts[0].linkId).toBe('x');
        expect(parts[0].coords).toEqual([[0, 0], [1, 1]]);
    });

    it('sama linkki kahdessa ruudussa kerran; vajaa ruutu → partial', async () => {
        const urls = [];
        const source = createRoadSource({
            fetchFn: (url) => {
                urls.push(url);
                const json = { features: [feature('L1', [[1900, 0], [2100, 0]])], numberMatched: url.includes('bbox=2000') ? 5 : 1 };
                return respond(json);
            }
        });
        const { links, partial } = await source.links({ minX: 100, minY: 100, maxX: 2100, maxY: 1900 });
        expect(links).toHaveLength(1);
        expect(partial).toBe(true);
        await source.links({ minX: 100, minY: 100, maxX: 2100, maxY: 1900 });
        expect(urls).toHaveLength(2); // välimuisti
    });

    it('rajoitukset link_id:n mukaan, pienin raja', async () => {
        const source = createRoadSource({
            fetchFn: (url) => {
                if (url.includes('kelirikko')) return respond({ features: [
                    feature('A', [[0, 0], [1, 1]], { arvo: '15000', kestoalku1: '15.03.2027', kestolopp1: '15.06.2027' }),
                    feature('A', [[0, 0], [1, 1]], { arvo: '8000', kestoalku1: '', kestolopp1: '' })
                ] });
                if (url.includes('tiekunnalliset')) return respond({ features: [feature('A', [[0, 0], [1, 1]])] });
                if (url.includes('dr_max_massa')) return respond({ features: [feature('B', [[0, 0], [1, 1]], { arvo: 6000 })] });
                return respond({ features: [] });
            }
        });
        const r = await source.restrictions({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
        expect(r.kelirikko.get('A')).toEqual({ kg: 8000, alku: null, loppu: null });
        expect(r.tiekunta.has('A')).toBe(true);
        expect(r.massa.get('B').kg).toBe(6000);
    });

    it('verkkovirhe: haku epäonnistuu ja yritetään uudelleen', async () => {
        let fail = true;
        const source = createRoadSource({ fetchFn: () => fail ? Promise.reject(new Error('offline')) : respond({ features: [] }) });
        await expect(source.links({ minX: 0, minY: 0, maxX: 10, maxY: 10 })).rejects.toThrow('offline');
        fail = false;
        await expect(source.links({ minX: 0, minY: 0, maxX: 10, maxY: 10 })).resolves.toEqual({ links: [], partial: false });
    });
});

describe('analyysi', () => {
    const P = link('P', [[-500, 200], [0, 200], [1000, 200], [1500, 200]]);
    const Q = link('Q', [[1500, 200], [1500, 2000]], { hallinn_lk: 2, toiminn_lk: 4 });
    const noRestrictions = { kelirikko: new Map(), tiekunta: new Set(), massa: new Map(), partial: false };
    const fakeRoads = (links, restrictions = noRestrictions) => ({
        links: async () => ({ links, partial: false }),
        restrictions: async () => restrictions
    });
    const stand = (geometry, props = {}) => ({ geometry, properties: props });

    it('tie kuviolla, kaukana oleva kuvio, tieyhteys ja kuvion oma korjuukelpoisuus', async () => {
        const parcel = { geometry: square(0, 0, 1000), properties: {} };
        const res = await analyseParcel(
            { parcel, features: [stand(square(100, 100, 200), { ACCESSIBILITY: 1 }), stand(square(600, 600, 100), { ACCESSIBILITY: 4 })] },
            { roads: fakeRoads([P, Q]) });
        expect(res.tie.reachesParcel).toBe(true);
        expect(res.tie.route.length).toBe(1500);
        expect(res.tie.route.linkIds).toEqual(['P']);
        const [a, b] = [res.kuviot.get(0), res.kuviot.get(1)];
        expect(a.tieKuviolla).toBe(true);
        expect(a.meanDist).toBeLessThan(60);
        expect(b.tieKuviolla).toBe(false);
        expect(b.meanDist).toBe(450);
        expect(Math.round(b.K)).toBe(61);
        expect(b.M).toBe(20);
        expect(b.maapohjaLahde).toBe('kuvio');
        expect(a.Y).toBe(100);
    });

    it('monipalstainen kiinteistö: tie vain toisella palstalla', async () => {
        const parcel = { properties: {}, parts: [{ geometry: square(5000, 5000, 100) }, { geometry: square(0, 0, 1000) }] };
        const res = await analyseParcel({ parcel, features: [stand(square(5000, 5000, 100))] }, { roads: fakeRoads([P, Q]) });
        expect(res.tie.reachesParcel).toBe(true);
    });

    it('ei tietä kiinteistölle: tieyhteys 0', async () => {
        const parcel = { geometry: square(0, 5000, 100), properties: {} };
        const res = await analyseParcel({ parcel, features: [stand(square(0, 5000, 100))] }, { roads: fakeRoads([P, Q]) });
        expect(res.tie.reachesParcel).toBe(false);
        expect(res.kuviot.get(0).Y).toBe(0);
    });

    it('tiekunta ja kelirikko reitillä', async () => {
        const parcel = { geometry: square(0, 0, 1000), properties: {} };
        const restrictions = {
            kelirikko: new Map([['P', { kg: 15000, alku: '15.03.2027', loppu: '15.06.2027' }]]),
            tiekunta: new Set(['P']), massa: new Map(), partial: false
        };
        const res = await analyseParcel({ parcel, features: [stand(square(100, 100, 200))] }, { roads: fakeRoads([P, Q], restrictions) });
        expect(res.tie.tiekunta).toBe(true);
        expect(res.tie.rajoitukset).toEqual([{ tyyppi: 'kelirikko', kg: 15000, alku: '15.03.2027', loppu: '15.06.2027' }]);
        expect(res.kuviot.get(0).Y).toBe(80);
    });

    it('maapohja korjuukelpoisuuskartasta', async () => {
        const width = 10, height = 10, data = new Uint8ClampedArray(width * height * 4);
        for (let o = 0; o < data.length; o += 4) data.set([0x61, 0x99, 0, 255], o);
        const parcel = { geometry: square(0, 0, 1000), properties: {} };
        const res = await analyseParcel({ parcel, features: [stand(square(100, 100, 200))] }, {
            roads: fakeRoads([P, Q]),
            raster: async (bbox) => ({ data, width, height, bbox })
        });
        expect(res.kuviot.get(0).M).toBe(80);
        expect(res.kuviot.get(0).paaluokka).toBe(2);
        expect(res.kuviot.get(0).maapohjaLahde).toBe('kartta');
    });
});

describe('analyysi: virheet ja rajoitusten rajaus', () => {
    const P = link('P', [[-500, 200], [0, 200], [1000, 200], [1500, 200]]);
    const Q = link('Q', [[1500, 200], [1500, 2000]], { hallinn_lk: 2, toiminn_lk: 4 });
    const R = link('R', [[200, -300], [200, 50]]); // umpitie kiinteistölle, ei reitillä
    const stand = (geometry, props = {}) => ({ geometry, properties: props });

    it('teiden haku epäonnistuu: maapohja lasketaan, muut puuttuvat', async () => {
        const roads = { links: async () => { throw new Error('offline'); }, restrictions: async () => { throw new Error('x'); } };
        const res = await analyseParcel({ parcel: { geometry: square(0, 0, 1000), properties: {} }, features: [stand(square(100, 100, 200), { ACCESSIBILITY: 1 })] }, { roads });
        expect(res.tie.virhe).toBe(true);
        const k = res.kuviot.get(0);
        expect([k.M, k.K, k.Y]).toEqual([100, null, null]);
        expect(k.score).toBe(100);
        expect(k.puuttuu).toEqual(['K', 'Y']);
    });

    it('vain reitin rajoitukset, ei muiden kiinteistölle tulevien teiden', async () => {
        const restrictions = {
            kelirikko: new Map([['R', { kg: 8000, alku: null, loppu: null }]]),
            tiekunta: new Set(), massa: new Map(), partial: false
        };
        const roads = { links: async () => ({ links: [P, Q, R], partial: false }), restrictions: async () => restrictions };
        const res = await analyseParcel({ parcel: { geometry: square(0, 0, 1000), properties: {} }, features: [stand(square(100, 100, 200))] }, { roads });
        expect(res.tie.route.linkIds).toEqual(['P']);
        expect(res.tie.rajoitukset).toEqual([]);
        expect(res.kuviot.get(0).Y).toBe(100);
    });
});
