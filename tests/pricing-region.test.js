import { describe, it, expect } from 'vitest';
import { regionForKunta, PRICE_REGIONS, parcelPoint } from '../js/pricing/region.js';

describe('hinta-alue kunnasta (Luke: Hinta-alueet ja maakunnat 2021)', () => {
    it('Petäjävesi on Keski-Suomi', () => {
        expect(regionForKunta('592')).toBe('keski-suomi');
    });
    it('Pirkanmaa kuuluu Keski-Suomen hinta-alueeseen', () => {
        expect(regionForKunta('837')).toBe('keski-suomi'); // Tampere
    });
    it('Uusimaa on Etelä-Suomi', () => {
        expect(regionForKunta('091')).toBe('etela-suomi'); // Helsinki
    });
    it('Koillismaan kunnat kuuluvat Kainuu-Koillismaahan, muu Pohjois-Pohjanmaa ei', () => {
        expect(regionForKunta('305')).toBe('kainuu-koillismaa'); // Kuusamo
        expect(regionForKunta('615')).toBe('kainuu-koillismaa'); // Pudasjärvi
        expect(regionForKunta('832')).toBe('kainuu-koillismaa'); // Taivalkoski
        expect(regionForKunta('205')).toBe('kainuu-koillismaa'); // Kajaani
        expect(regionForKunta('564')).toBe('pohjois-pohjanmaa'); // Oulu
    });
    it('Kymi-Savo ja Savo-Karjala', () => {
        expect(regionForKunta('491')).toBe('kymi-savo'); // Mikkeli
        expect(regionForKunta('297')).toBe('savo-karjala'); // Kuopio
    });
    it('Pohjanmaat ja Lappi', () => {
        expect(regionForKunta('905')).toBe('etela-pohjanmaa'); // Vaasa
        expect(regionForKunta('698')).toBe('lappi'); // Rovaniemi
    });
    it('hyväksyy numeron ilman etunollia', () => {
        expect(regionForKunta(91)).toBe('etela-suomi');
    });
    it('tuntematon kunta palauttaa null', () => {
        expect(regionForKunta('999')).toBeNull();
        expect(regionForKunta(null)).toBeNull();
    });
    it('jokaisella alueella on viikko- ja kuukausitaulun koodi', () => {
        expect(Object.keys(PRICE_REGIONS)).toHaveLength(9); // 8 aluetta + koko maa
        for (const r of Object.values(PRICE_REGIONS)) {
            expect(r.name).toBeTruthy();
            expect(r.weekly).toBeTruthy();
            expect(r.monthly).toBeTruthy();
        }
        expect(PRICE_REGIONS['keski-suomi']).toMatchObject({ weekly: '3', monthly: 'MPKH02' });
        expect(PRICE_REGIONS['koko-maa']).toMatchObject({ weekly: '9', monthly: 'SSS' });
    });
});

describe('parcelPoint', () => {
    it('käyttää kiinteistön INSPIRE-viitepistettä', () => {
        expect(parcelPoint({ properties: { referencePoint: { type: 'Point', coordinates: [400557.5, 6900270.6] } }, parts: [] }))
            .toEqual([400557.5, 6900270.6]);
    });
    it('moniosaisella kiinteistöllä ensimmäisen palstan viitepiste', () => {
        expect(parcelPoint({ properties: {}, parts: [{ properties: { referencePoint: { coordinates: [1, 2] } } }] })).toEqual([1, 2]);
    });
    it('ilman viitepistettä geometrian rajauksen keskipiste', () => {
        const geometry = { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 20], [0, 20], [0, 0]]] };
        expect(parcelPoint({ properties: {}, geometry })).toEqual([5, 10]);
        expect(parcelPoint({ properties: {}, parts: [{ geometry }] })).toEqual([5, 10]);
    });
    it('ilman tietoja null', () => {
        expect(parcelPoint(null)).toBeNull();
        expect(parcelPoint({ properties: {} })).toBeNull();
    });
});

