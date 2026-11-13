import { describe, it, expect } from 'vitest';
import { weeklyQuery, monthlyQuery, parseWeekly, parseMonthly, fillMissing, METHODS, SPECIES } from '../js/pricing/prices.js';

import weekly from './fixtures/luke-viikko.json';
import monthly from './fixtures/luke-kuukausi.json';

describe('kyselyt', () => {
    it('viikkokysely: alueet, uusimmat viikot, kolme hakkuutapaa, kuusi puutavaralajia', () => {
        const q = weeklyQuery(['3', '9'], 4);
        const by = Object.fromEntries(q.query.map(x => [x.code, x.selection]));
        expect(by.W).toEqual({ filter: 'top', values: ['4'] });
        expect(by.MPKH.values).toEqual(['3', '9']);
        expect(by.HAKT.values).toEqual(['8021', '8023', '8022']);
        expect(by.PTL.values).toHaveLength(6);
        expect(q.response.format).toBe('json-stat2');
    });
    it('kuukausikysely pyytää vain hinnat (E_M3)', () => {
        const q = monthlyQuery(['MPKH02', 'SSS']);
        const by = Object.fromEntries(q.query.map(x => [x.code, x.selection]));
        expect(by.INFO.values).toEqual(['E_M3']);
        expect(by.M).toEqual({ filter: 'top', values: ['1'] });
        expect(by.KAUP.values).toEqual(['UUD', 'HAR', 'ENS']);
    });
});

describe('parseWeekly', () => {
    const ks = parseWeekly(weekly, '3');
    it('käyttää uusinta viikkoa ja kertoo jakson ja lähteen', () => {
        expect(ks.period).toBe('2026W42');
        expect(ks.periodLabel).toBe('vko 42/2026');
        expect(ks.source).toMatch(/Metsäteollisuus/);
        expect(ks.table.uudistus.manty.tukki).toBeCloseTo(81.02, 2);
        expect(ks.table.uudistus.kuusi.kuitu).toBeCloseTo(25.23, 2);
        expect(ks.table.harvennus.koivu.tukki).toBeCloseTo(52.64, 2);
    });
    it('täydentää puuttuvan solun saman alueen edelliseltä viikolta', () => {
        // Ensiharvennuksen kuusitukki puuttuu vkolta 41 mutta on vkolla 42; mäntytukki puuttuu molemmilta
        expect(ks.table.ensiharvennus.kuusi.tukki).toBeCloseTo(44.95, 2);
        expect(ks.table.ensiharvennus.manty.tukki).toBeNull();
    });
    it('rakenne kattaa kaikki hakkuutavat, puulajit ja puutavaralajit', () => {
        for (const m of METHODS) for (const s of SPECIES) {
            expect(ks.table[m][s]).toHaveProperty('tukki');
            expect(ks.table[m][s]).toHaveProperty('kuitu');
        }
    });
    it('tuntematon alue palauttaa tyhjän taulukon', () => {
        expect(parseWeekly(weekly, '72').table.uudistus.manty.tukki).toBeNull();
    });
});

describe('parseMonthly', () => {
    it('lukee Luken virallisen kuukausitilaston', () => {
        const ks = parseMonthly(monthly, 'MPKH02');
        expect(ks.period).toBe('2026M09');
        expect(ks.periodLabel).toBe('9/2026');
        expect(ks.source).toMatch(/Luonnonvarakeskus/);
        expect(ks.table.uudistus.manty.tukki).toBeCloseTo(80.87, 2);
        expect(ks.table.ensiharvennus.manty.tukki).toBeNull();
        expect(ks.table.ensiharvennus.koivu.kuitu).toBeCloseTo(16.68, 2);
    });
});

describe('fillMissing', () => {
    it('täyttää puuttuvat solut varalähteistä järjestyksessä ja kirjaa täytöt', () => {
        const primary = parseWeekly(weekly, '3');
        const fallbackMonthly = parseMonthly(monthly, 'MPKH02');
        const fallbackCountry = parseWeekly(weekly, '9');
        const { table, filled } = fillMissing(primary, fallbackMonthly, fallbackCountry);
        // Keski-Suomen kuukausitilastossakin puuttuu → koko maan viikkohinta
        expect(table.ensiharvennus.manty.tukki).toBe(fallbackCountry.table.ensiharvennus.manty.tukki);
        expect(table.ensiharvennus.manty.tukki).not.toBeNull();
        expect(filled).toContainEqual({ method: 'ensiharvennus', species: 'manty', assortment: 'tukki', source: fallbackCountry.source, period: fallbackCountry.period });
        // Olemassa olevaa arvoa ei korvata
        expect(table.uudistus.manty.tukki).toBeCloseTo(81.02, 2);
    });
    it('ei muuta alkuperäistä taulukkoa', () => {
        const primary = parseWeekly(weekly, '3');
        fillMissing(primary, parseWeekly(weekly, '9'));
        expect(primary.table.ensiharvennus.manty.tukki).toBeNull();
    });
});
