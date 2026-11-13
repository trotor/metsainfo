import { describe, it, expect } from 'vitest';
import { parsePriceInput, formatEuro, formatPrice, yearRangeLabel, buildEstimateReport } from '../js/pricing/format.js';
import { emptyTable } from '../js/pricing/prices.js';

describe('parsePriceInput', () => {
    it('hyväksyy pilkun ja pisteen', () => {
        expect(parsePriceInput('86,44')).toBe(86.44);
        expect(parsePriceInput(' 88.5 ')).toBe(88.5);
        expect(parsePriceInput('90')).toBe(90);
    });
    it('tyhjä tai virheellinen palauttaa null', () => {
        expect(parsePriceInput('')).toBeNull();
        expect(parsePriceInput('abc')).toBeNull();
        expect(parsePriceInput('-5')).toBeNull();
        expect(parsePriceInput('1000')).toBeNull(); // epärealistinen €/m³
    });
});

describe('muotoilu', () => {
    it('euroarvio pyöristetään sataan euroon', () => {
        expect(formatEuro(99113)).toMatch(/^≈ 99\s100 €$/);
        expect(formatEuro(40)).toBe('≈ 0 €');
    });
    it('hinta kahdella desimaalilla pilkulla', () => {
        expect(formatPrice(86.4)).toBe('86,40');
        expect(formatPrice(null)).toBe('');
    });
    it('vuosiväli', () => {
        expect(yearRangeLabel([{ year: 2027 }, { year: 2036 }, { year: null }])).toBe('2027–2036');
        expect(yearRangeLabel([{ year: 2027 }])).toBe('2027');
        expect(yearRangeLabel([])).toBe('');
    });
});

describe('buildEstimateReport', () => {
    it('sisältää kiinteistön, lähteen, hinnat ja kuviokohtaiset rivit', () => {
        const table = emptyTable();
        table.uudistus.manty = { tukki: 81.38, kuitu: 24.5 };
        const report = buildEstimateReport({
            label: '592-404-1-32',
            regionName: 'Keski-Suomi',
            prices: { source: 'Metsäteollisuus ry:n puukaupan viikkoseuranta', periodLabel: 'vko 45/2026' },
            table,
            estimate: {
                total: 99113,
                stock: { value: 226265 },
                plans: [{ standNumber: 7, year: 2031, method: 'uudistus', area: 1.98, value: 31215.4 }]
            }
        });
        expect(report).toContain('592-404-1-32');
        expect(report).toContain('Keski-Suomi');
        expect(report).toContain('vko 45/2026');
        expect(report).toContain('Uudistushakkuu;Mänty;81,38;24,50');
        expect(report).toContain('7;2031;Uudistushakkuu;1,98;31215');
        expect(report).toMatch(/suuntaa-antava/i);
    });
    it('kertoo raportissa puuttuvista hinnoista', () => {
        const report = buildEstimateReport({
            label: 'X', regionName: 'Lappi', prices: null, table: emptyTable(),
            estimate: { total: 0, stock: { value: 0, missing: 2 }, plans: [], missing: 1 }
        });
        expect(report).toMatch(/Huom.*puuttuu hintoja/);
    });
});

