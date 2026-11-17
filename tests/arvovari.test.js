import { describe, it, expect } from 'vitest';
import { RAJAT, VARIT, valuePerHa, classIndex } from '../js/arvovari/logiikka.js';
import { emptyTable } from '../js/pricing/prices.js';

const table = () => {
    const t = emptyTable();
    for (const s of ['manty', 'kuusi', 'koivu']) t.uudistus[s] = { tukki: 60, kuitu: 20 };
    return t;
};

describe('puuston arvo €/ha', () => {
    it('uudistushakkuun hinnoin: (tukki × 60 + kuitu × 20) €/ha', () => {
        const p = { AREA: 2, SAWLOGVOLUME: 100, PULPWOODVOLUME: 50, PROPORTIONSPRUCE: 100, PROPORTIONPINE: 0, PROPORTIONOTHER: 0, MAINTREESPECIES: 2 };
        const v = valuePerHa(p, table());
        expect(v.perHa).toBeCloseTo(100 * 60 + 50 * 20);
        expect(v.total).toBeCloseTo(2 * (100 * 60 + 50 * 20));
    });
    it('ei pinta-alaa tai puustoa → null', () => {
        expect(valuePerHa({ AREA: 0 }, table())).toBeNull();
        expect(valuePerHa({ AREA: 1 }, table()).perHa).toBe(0);
    });
    it('luokat: < 2000, 2000–5000, 5000–8000, 8000–12000, > 12000', () => {
        expect(RAJAT).toEqual([2000, 5000, 8000, 12000]);
        expect(VARIT).toHaveLength(5);
        expect([0, 1999, 2000, 4999, 5000, 8000, 12000, 30000].map(classIndex)).toEqual([0, 0, 1, 1, 2, 3, 4, 4]);
    });
});
