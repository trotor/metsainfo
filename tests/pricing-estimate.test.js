import { describe, it, expect } from 'vitest';
import { cuttingMethod, speciesShares, standValue, estimateParcel, DEFAULT_REMOVAL } from '../js/pricing/estimate.js';
import { emptyTable } from '../js/pricing/prices.js';

function prices() {
    const t = emptyTable();
    const set = (m, s, tukki, kuitu) => { t[m][s] = { tukki, kuitu }; };
    set('uudistus', 'manty', 80, 25); set('uudistus', 'kuusi', 86, 26); set('uudistus', 'koivu', 60, 25);
    set('harvennus', 'manty', 70, 20); set('harvennus', 'kuusi', 72, 21); set('harvennus', 'koivu', 50, 21);
    set('ensiharvennus', 'manty', 44, 15); set('ensiharvennus', 'kuusi', 43, 16); set('ensiharvennus', 'koivu', 37, 16);
    return t;
}

const stand = (p) => ({ properties: { AREA: 2, SAWLOGVOLUME: 100, PULPWOODVOLUME: 50,
    PROPORTIONPINE: 1, PROPORTIONSPRUCE: 0, PROPORTIONOTHER: 0, ...p } });

describe('cuttingMethod', () => {
    it('kartoittaa Metsäkeskuksen hakkuutyypit hintojen hakkuutapoihin', () => {
        expect(cuttingMethod(2)).toBe('ensiharvennus');
        expect(cuttingMethod(20)).toBe('ensiharvennus');
        for (const c of [3, 11, 13, 14, 94]) expect(cuttingMethod(c)).toBe('harvennus');
        for (const c of [1, 4, 5, 6, 7, 8, 12, 15, 93]) expect(cuttingMethod(c)).toBe('uudistus');
    });
    it('lepo, erikoishakkuut ja puuttuva koodi eivät kuulu arvioon', () => {
        for (const c of [0, 9, 90, 91, 92, null, undefined]) expect(cuttingMethod(c)).toBeNull();
    });
});

describe('speciesShares', () => {
    it('normalisoi osuudet summaan 1', () => {
        const s = speciesShares({ PROPORTIONPINE: 0.3, PROPORTIONSPRUCE: 0.3, PROPORTIONOTHER: 0.4 * 0.9 });
        expect(s.manty + s.kuusi + s.koivu).toBeCloseTo(1, 10);
    });
    it('käyttää pääpuulajia, kun osuudet puuttuvat', () => {
        expect(speciesShares({ MAINTREESPECIES: 2 })).toEqual({ manty: 0, kuusi: 1, koivu: 0 });
        expect(speciesShares({ MAINTREESPECIES: 4 })).toEqual({ manty: 0, kuusi: 0, koivu: 1 });
        expect(speciesShares({ MAINTREESPECIES: 1, PROPORTIONPINE: 0, PROPORTIONSPRUCE: 0, PROPORTIONOTHER: 0 })).toEqual({ manty: 1, kuusi: 0, koivu: 0 });
    });
    it('ilman tietoja palauttaa null', () => {
        expect(speciesShares({})).toBeNull();
    });
});

describe('standValue', () => {
    it('tukki- ja kuitupuu × hinnat × pinta-ala puulajiosuuksin', () => {
        const p = stand({ PROPORTIONPINE: 0.5, PROPORTIONSPRUCE: 0.5 }).properties;
        // tukki 200 m³, kuitu 100 m³; puolet männyn, puolet kuusen hinnoin
        const expected = 0.5 * (200 * 80 + 100 * 25) + 0.5 * (200 * 86 + 100 * 26);
        expect(standValue(p, prices().uudistus)).toEqual({ value: expected, missing: false });
    });
    it('puuttuva hinta merkitään, eikä tulos ole NaN', () => {
        const t = prices(); t.uudistus.manty.tukki = null;
        const r = standValue(stand().properties, t.uudistus);
        expect(r.missing).toBe(true);
        expect(r.value).toBe(100 * 25); // vain kuitu
    });
    it('puuttuva hinta ei haittaa, jos puulajia ei ole kuviolla', () => {
        const t = prices(); t.uudistus.koivu.tukki = null;
        expect(standValue(stand().properties, t.uudistus).missing).toBe(false);
    });
    it('ilman puustotietoa arvo on 0', () => {
        expect(standValue({ AREA: 1 }, prices().uudistus)).toEqual({ value: 0, missing: false });
    });
});

describe('estimateParcel', () => {
    const features = [
        stand({ STANDNUMBER: 1, CUTTINGTYPE: 3, CUTTINGPROPOSALYEAR: 2027 }),
        stand({ STANDNUMBER: 2, CUTTINGTYPE: 5, CUTTINGPROPOSALYEAR: 2031 }),
        stand({ STANDNUMBER: 3, CUTTINGTYPE: 2, CUTTINGPROPOSALYEAR: 2027 }),
        stand({ STANDNUMBER: 4, CUTTINGTYPE: 0, CUTTINGPROPOSALYEAR: 2030 }),
        stand({ STANDNUMBER: 5 })
    ];
    const full = (m) => 200 * prices()[m].manty.tukki + 100 * prices()[m].manty.kuitu;
    const r = estimateParcel(features, prices());

    it('ehdotetut hakkuut poistumilla', () => {
        expect(r.plans).toHaveLength(3);
        expect(r.plans.find(x => x.standNumber === 1).value).toBeCloseTo(full('harvennus') * DEFAULT_REMOVAL.harvennus, 6);
        expect(r.plans.find(x => x.standNumber === 2).value).toBeCloseTo(full('uudistus'), 6);
        expect(r.plans.find(x => x.standNumber === 3).value).toBeCloseTo(full('ensiharvennus') * DEFAULT_REMOVAL.ensiharvennus, 6);
    });
    it('vuosittain järjestettynä ja yhteensä', () => {
        expect(r.byYear.map(y => y.year)).toEqual([2027, 2031]);
        expect(r.byYear[0].count).toBe(2);
        expect(r.total).toBeCloseTo(r.byYear.reduce((a, y) => a + y.value, 0), 6);
    });
    it('koko puuston arvo uudistushakkuun hinnoin sisältää kaikki kuviot', () => {
        expect(r.stock.value).toBeCloseTo(5 * full('uudistus'), 6);
        expect(r.stock.missing).toBe(0);
    });
    it('omat poistumat ohittavat oletukset', () => {
        const r2 = estimateParcel(features, prices(), { removal: { ...DEFAULT_REMOVAL, harvennus: 0.5 } });
        expect(r2.plans.find(x => x.standNumber === 1).value).toBeCloseTo(full('harvennus') * 0.5, 6);
    });
    it('kuviot, joilta hinta puuttuu, lasketaan', () => {
        const t = prices(); t.harvennus.manty.tukki = null;
        expect(estimateParcel(features, t).missing).toBe(1);
    });
});
