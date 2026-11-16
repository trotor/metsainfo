import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { pointInPolygon3067 } from '../js/utils.js';

const data = JSON.parse(readFileSync('public/demo/esimerkkimetsa.json', 'utf8'));

const ringArea = (r) => {
    let a = 0;
    for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
    return Math.abs(a) / 2 / 10000;
};

describe('kuvitteellinen Esimerkkimetsä', () => {
    it('kiinteistötunnusta ei ole olemassa (kunta 999) ja tila on merkitty esimerkiksi', () => {
        expect(data.parcel.properties.nationalCadastralReference.startsWith('999')).toBe(true);
        expect(data.parcel.properties.esimerkki).toBe(true);
        expect(data.parcel.properties.label).toBe('Esimerkkimetsä');
    });

    it('kuviot täyttävät tilan ilman rakoja ja päällekkäisyyksiä', () => {
        const stands = data.features.reduce((a, f) => a + ringArea(f.geometry.coordinates[0]), 0);
        expect(stands).toBeCloseTo(ringArea(data.parcel.geometry.coordinates[0]), 2);
        expect(stands).toBeCloseTo(data.features.reduce((a, f) => a + f.properties.AREA, 0), 1);
    });

    it('jokaisen kuvion pisteet ovat tilan sisällä tai rajalla', () => {
        const parcel = data.parcel.geometry;
        for (const f of data.features) {
            const r = f.geometry.coordinates[0];
            const cx = r.reduce((a, p) => a + p[0], 0) / r.length;
            const cy = r.reduce((a, p) => a + p[1], 0) / r.length;
            expect(pointInPolygon3067([cx, cy], parcel)).toBe(true);
        }
    });

    it('kuvitteellinen saari ympäröi tilan, joten kuviin ei tarvita oikeaa karttaa', () => {
        const island = data.map.features.find(f => f.properties.kind === 'island').geometry;
        for (const p of data.parcel.geometry.coordinates[0]) expect(pointInPolygon3067(p, island)).toBe(true);
        expect(data.map.features.some(f => f.properties.kind === 'contour')).toBe(true);
    });

    it('kuvionumerot ovat yksilöllisiä', () => {
        const numbers = data.features.map(f => f.properties.STANDNUMBER);
        expect(new Set(numbers).size).toBe(numbers.length);
    });
});
