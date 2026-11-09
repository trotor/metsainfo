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
        const href = 'https://trotor.github.io/metsainfo/?parcel=592-404-1-32';
        expect(shareableParcelUrl(href, { native: false })).toBe(href);
    });

    it('sovelluksessa jaettava linkki osoittaa julkiseen verkkoversioon', () => {
        expect(shareableParcelUrl('capacitor://localhost/?parcel=592-404-1-32', { native: true }))
            .toBe('https://trotor.github.io/metsainfo/?parcel=592-404-1-32');
    });

    it('sovelluksessa ilman valintaa linkki on etusivu', () => {
        expect(shareableParcelUrl('capacitor://localhost/', { native: true }))
            .toBe('https://trotor.github.io/metsainfo/');
    });

    it('CSV-tiedostonimi siivotaan', () => {
        expect(csvFileName('592-404-1-32')).toBe('metsavaratiedot_592-404-1-32.csv');
        expect(csvFileName('59240400010032')).toBe('metsavaratiedot_59240400010032.csv');
        expect(csvFileName('a/b c')).toBe('metsavaratiedot_a_b_c.csv');
    });
});
