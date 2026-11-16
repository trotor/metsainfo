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
