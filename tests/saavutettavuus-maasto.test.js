import '../js/vendor/index.js';
import { describe, it, expect } from 'vitest';
import {
    classifyDtw, dtwRequest, demRequest, parseDem, slopeAt, linePoints, wetnessStats, slopeStats
} from '../js/saavutettavuus/maasto.js';
import { wetnessScore, slopeScore, combine, WEIGHTS } from '../js/saavutettavuus/indeksi.js';
import { createRoadIndex } from '../js/saavutettavuus/tieverkko.js';

// Paitulin text/plain-vastauksen muoto (lyhennetty)
const demText = (cols, rows, cell, x0, y0, f) => [
    'Grid bounds: GeneralBounds[(0, 0), (1, 1)]',
    `Grid range: GridEnvelope2D[0..${cols - 1}, 0..${rows - 1}]`,
    'Grid to world: PARAM_MT["Affine", ',
    '  PARAMETER["num_row", 3], ',
    `  PARAMETER["elt_0_0", ${cell}], `,
    `  PARAMETER["elt_0_2", ${x0}], `,
    `  PARAMETER["elt_1_1", -${cell}], `,
    `  PARAMETER["elt_1_2", ${y0}]]`,
    'Contents:',
    'Band 0:',
    ...Array.from({ length: rows }, (_, j) => Array.from({ length: cols }, (_, i) => f(i, j)).join(' '))
].join('\n');

describe('DTW-kosteusindeksi', () => {
    it('värit luokiksi (cm) selitteen mukaan', () => {
        expect(classifyDtw(0x08, 0x30, 0x6b, 255)).toBe(0);
        expect(classifyDtw(0x08, 0x51, 0x9c, 255)).toBe(25);
        expect(classifyDtw(0x21, 0x71, 0xb5, 255)).toBe(50);
        expect(classifyDtw(0xc6, 0xdb, 0xef, 255)).toBe(150);
        expect(classifyDtw(255, 255, 255, 255)).toBe(151);
        expect(classifyDtw(0, 0, 0, 0)).toBeNull();
        expect(classifyDtw(255, 0, 0, 255)).toBeNull();
    });

    it('pyyntö Paitulin WMS:ään, liian karkea resoluutio hylätään', () => {
        const r = dtwRequest({ minX: 0, minY: 0, maxX: 2000, maxY: 1000 });
        expect(r.url).toContain('paituli.csc.fi/geoserver/paituli/wms');
        expect(r.url).toContain('layers=paituli%3Aluke_dtw_01_2023');
        expect(r.width).toBe(1000);
        expect(r.height).toBe(500);
        expect(dtwRequest({ minX: 0, minY: 0, maxX: 20000, maxY: 1000 })).toBeNull();
    });

    it('märkyysosuus näytteistä: märkä 1, kostea 0,5', () => {
        const raster = { width: 2, height: 1, bbox: { minX: 0, minY: 0, maxX: 20, maxY: 10 },
            data: new Uint8ClampedArray([0x08, 0x30, 0x6b, 255, 0x21, 0x71, 0xb5, 255]) };
        const s = wetnessStats(raster, [[5, 5], [15, 5], [15, 5], [100, 100]]);
        expect(s.n).toBe(3);
        expect(s.share).toBeCloseTo((1 + 0.5 + 0.5) / 3);
    });
});

describe('korkeusmalli ja kaltevuus', () => {
    it('jäsentää Paitulin tekstiruudukon', () => {
        const dem = parseDem(demText(3, 2, 10, 100005, 200015, (i, j) => i + 10 * j));
        expect(dem).toMatchObject({ cols: 3, rows: 2, cell: 10, x0: 100005, y0: 200015 });
        expect(Array.from(dem.values)).toEqual([0, 1, 2, 10, 11, 12]);
    });

    it('pyyntö WCS:ään, iso alue hylätään', () => {
        const url = demRequest({ minX: 1000, minY: 2000, maxX: 3000, maxY: 4000 });
        expect(url).toContain('coverageId=paituli__mml_korkeusmalli_10m_2019');
        expect(url).toContain('format=text%2Fplain');
        expect(url).toContain('subset=E(1000,3000)');
        expect(demRequest({ minX: 0, minY: 0, maxX: 7000, maxY: 7000 })).toBeNull();
    });

    it('kaltevuus prosentteina: 1 m nousu 10 m matkalla = 10 %', () => {
        const dem = parseDem(demText(5, 5, 10, 5, 45, (i) => i * 1));
        expect(slopeAt(dem, [25, 25])).toBeCloseTo(10);
        expect(slopeAt(dem, [500, 500])).toBeNull();
    });

    it('jyrkkien osuus ja yli 35 %:n rinteet', () => {
        const dem = parseDem(demText(5, 5, 10, 5, 45, (i) => i * 3)); // 30 %
        const s = slopeStats(dem, [[25, 25], [15, 15], [999, 999]]);
        expect(s.n).toBe(2);
        expect(s.steepShare).toBe(1);
        expect(s.verySteepShare).toBe(0);
        expect(s.max).toBeCloseTo(30);
    });
});

describe('linjanäytteet', () => {
    it('pisteet 8 m välein päätepisteet mukaan', () => {
        const pts = linePoints([0, 0], [20, 0], 8);
        expect(pts.map(p => p[0])).toEqual([0, 8, 16, 20]);
    });
    it('lähin autotien piste', () => {
        const idx = createRoadIndex([{ coords: [[0, 0], [100, 0]], props: { toiminn_lk: 5 } }]);
        expect(idx.nearest([30, 40]).point).toEqual([30, 0]);
    });
});

describe('pisteytys v2', () => {
    it('märkyys ja kaltevuus pisteiksi', () => {
        expect(wetnessScore(0)).toBe(100);
        expect(wetnessScore(0.25)).toBe(50);
        expect(wetnessScore(0.8)).toBe(0);
        expect(wetnessScore(null)).toBeNull();
        expect(slopeScore({ steepShare: 0, verySteepShare: 0 })).toBe(100);
        expect(slopeScore({ steepShare: 0.2, verySteepShare: 0 })).toBe(50);
        expect(slopeScore({ steepShare: 0.1, verySteepShare: 0.1 })).toBe(30);
        expect(slopeScore(null)).toBeNull();
    });
    it('painot v2 ja puuttuvien skaalaus', () => {
        expect(WEIGHTS).toEqual({ M: 0.3, K: 0.3, W: 0.15, S: 0.1, Y: 0.15 });
        expect(combine({ M: 100, K: 100, W: 0, S: 100, Y: 100 }).score).toBe(85);
        expect(combine({ M: 100, K: 100, W: null, S: null, Y: 100 }).score).toBe(100);
    });
});
