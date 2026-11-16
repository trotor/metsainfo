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
