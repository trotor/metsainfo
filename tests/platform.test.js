import { describe, it, expect } from 'vitest';
import { isNative, shareableParcelUrl, csvFileName, PUBLIC_BASE_URL } from '../js/platform/index.js';

describe('alusta', () => {
    it('isNative lukee Capacitorin tiedon', () => {
        expect(isNative({ isNativePlatform: () => true })).toBe(true);
        expect(isNative({ isNativePlatform: () => false })).toBe(false);
        expect(isNative(undefined)).toBe(false);
    });

    it('julkinen perusosoite on GitHub Pages', () => {
        expect(PUBLIC_BASE_URL).toBe('https://trotor.github.io/metsainfo/');
    });

    it('verkossa jaettava linkki on sivun oma osoite', () => {
        const href = 'https://trotor.github.io/metsainfo/?parcel=999-1-1-1';
        expect(shareableParcelUrl(href, { native: false })).toBe(href);
    });

    it('sovelluksessa jaettava linkki osoittaa julkiseen verkkoversioon', () => {
        expect(shareableParcelUrl('capacitor://localhost/?parcel=999-1-1-1', { native: true }))
            .toBe('https://trotor.github.io/metsainfo/?parcel=999-1-1-1');
    });

    it('sovelluksessa ilman valintaa linkki on etusivu', () => {
        expect(shareableParcelUrl('capacitor://localhost/', { native: true }))
            .toBe('https://trotor.github.io/metsainfo/');
    });

    it('CSV-tiedostonimi siivotaan', () => {
        expect(csvFileName('999-1-1-1')).toBe('metsavaratiedot_999-1-1-1.csv');
        expect(csvFileName('99900100010001')).toBe('metsavaratiedot_99900100010001.csv');
        expect(csvFileName('a/b c')).toBe('metsavaratiedot_a_b_c.csv');
    });
});
