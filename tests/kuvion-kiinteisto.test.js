import "../js/vendor/index.js";
import { describe, it, expect } from 'vitest';
import { standCentroid, filterFeaturesByParcels } from '../js/data.js';

// U:n muotoinen kuvio (niemi): kärkien keskiarvo osuu aukkoon eli kuvion ulkopuolelle (#30)
const U = {
    type: 'Polygon',
    coordinates: [[[0, 0], [300, 0], [300, 300], [200, 300], [200, 100], [100, 100], [100, 300], [0, 300], [0, 0]]]
};
const square = (x, y, s) => ({ type: 'Polygon', coordinates: [[[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]]] });

describe('kuvion kiinteistö (#30)', () => {
    it('tavallinen kuvio: kärkien keskiarvo kuten ennen', () => {
        expect(standCentroid(square(0, 0, 100))).toEqual([40, 40]); // 5 kärkeä, sulkeva kärki mukana
    });

    it('U-kuvio: keskiarvo aukossa, käytetään kuvion sisäpistettä', () => {
        const p = standCentroid(U);
        // Keskiarvo olisi (133.3, 166.7) aukossa (x 100–200, y 100–300)
        expect(p[0] >= 100 && p[0] <= 200 && p[1] > 100).toBe(false);
        expect(p).toEqual([20, 20]);
    });

    it('U-kuvio kuuluu kiinteistölle, jolla sen maa-alue on', () => {
        const parcel = { geometry: { type: 'Polygon', coordinates: [[[-10, -10], [310, -10], [310, 90], [-10, 90], [-10, -10]]] } };
        expect(filterFeaturesByParcels([{ geometry: U }], [parcel])).toHaveLength(1);
    });
});
