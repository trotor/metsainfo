import { describe, it, expect } from 'vitest';
import { liukuvari, VARIT, MIN_ZOOM, TYYLI } from '../js/latvusmalli/index.js';
// Kartan EPSG:3067-ruudukon resoluutiot (js/config.js crsEPSG3067)
const res = z => 8192 / 2 ** z;

describe('latvusmalli', () => {
    it('selitteen liukuväri alkaa matalasta ja päättyy korkeimpaan', () => {
        const g = liukuvari();
        expect(g.startsWith('linear-gradient(to right, #4daf50 2%')).toBe(true);
        expect(g.endsWith('#e44a33 100%)')).toBe(true);
        expect(g.split('#').length - 1).toBe(VARIT.length);
    });

    it('taso alkaa mittakaavasta, jolla palvelu vielä piirtää (alle 23 m/px)', () => {
        expect(res(MIN_ZOOM)).toBeLessThanOrEqual(23);
        expect(res(MIN_ZOOM - 1)).toBeGreaterThan(23);
    });

    it('käyttää luokiteltua väritystä', () => {
        expect(TYYLI).toBe('CHM classification style');
    });
});
