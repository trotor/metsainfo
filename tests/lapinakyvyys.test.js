import "../js/vendor/index.js";
import { describe, it, expect, afterEach } from 'vitest';
import { peittavyys, setPeittavyys, taytto } from '../js/peittavyys.js';
import { featureStyle } from '../js/styles.js';
import { lueTallennettu, kerroin } from '../js/lapinakyvyys/index.js';

const muisti = (arvo) => ({ getItem: () => arvo });

describe('kuvioiden peittävyys (trotor/metsainfo#37)', () => {
    afterEach(() => setPeittavyys(1));

    it('oletuksena kuviot piirretään kuten ennen', () => {
        expect(peittavyys()).toBe(1);
        expect(featureStyle({ properties: {} }).fillOpacity).toBe(0.6);
    });

    it('kerroin pienentää vain täytön, ei reunaviivaa', () => {
        setPeittavyys(0.5);
        const s = featureStyle({ properties: {} });
        expect(s.fillOpacity).toBe(0.3);
        expect(s.opacity).toBe(0.9);
        expect(taytto(0.7)).toBe(0.35);
    });

    it('rajaa kertoimen välille 0–1', () => {
        expect(setPeittavyys(2)).toBe(1);
        expect(setPeittavyys(-1)).toBe(0);
        expect(setPeittavyys('roskaa')).toBe(1);
    });

    it('läpinäkyvyysprosentti muuttuu peittävyydeksi', () => {
        expect(kerroin(0)).toBe(1);
        expect(kerroin(60)).toBeCloseTo(0.4);
    });

    it('tallennettu arvo luetaan turvallisesti', () => {
        expect(lueTallennettu(muisti(null))).toBe(0);
        expect(lueTallennettu(muisti('40'))).toBe(40);
        expect(lueTallennettu(muisti('100'))).toBe(90);
        expect(lueTallennettu(muisti('x'))).toBe(0);
        expect(lueTallennettu({ getItem: () => { throw new Error('estetty'); } })).toBe(0);
    });
});
