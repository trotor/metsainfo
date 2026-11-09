import { describe, it, expect } from 'vitest';
import '../js/vendor/index.js';
// config.js rekisteröi EPSG:3067-määrityksen proj4:lle latausaikana,
// kuten sovelluksessa app.js:n kautta
import '../js/config.js';
import { coordsEPSG3067ToLatLng, pointInPolygon3067, normalizeParcelId } from '../js/utils.js';

describe('coordsEPSG3067ToLatLng', () => {
    it('muuntaa UTM-vyöhykkeen 35 keskimeridiaanin tasan 27 asteeksi', () => {
        // Itäkoordinaatti 500000 on määritelmän mukaan vyöhykkeen 35
        // keskimeridiaani, joka on 27°E. Tämä on matemaattinen tosiasia,
        // ei proj4:n toteutuksesta johdettu arvo.
        const latLng = coordsEPSG3067ToLatLng([500000, 6822000]);
        expect(latLng.lng).toBeCloseTo(27, 9);
        expect(latLng.lat).toBeCloseTo(61.53158462496459, 9);
    });

    it('muuntaa Keski-Suomen pisteen odotetusti', () => {
        // Vertailuarvo laskettu proj4 2.9.0:lla. Testi lukitsee nykyisen
        // käyttäytymisen: jos proj4-versio vaihtuu ja tulos muuttuu,
        // tämä kertoo siitä ennen kuin kartta menee vinoon.
        const latLng = coordsEPSG3067ToLatLng([432000, 6923000]);
        expect(latLng.lng).toBeCloseTo(25.68297593148831, 9);
        expect(latLng.lat).toBeCloseTo(62.432002347939275, 9);
    });

    it('palauttaa Leafletin LatLng-olion', () => {
        const latLng = coordsEPSG3067ToLatLng([432000, 6923000]);
        expect(typeof latLng.distanceTo).toBe('function');
    });
});

describe('pointInPolygon3067', () => {
    const neliö = {
        type: 'Polygon',
        coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]
    };

    it('tunnistaa sisäpuolisen pisteen', () => {
        expect(pointInPolygon3067([5, 5], neliö)).toBe(true);
    });

    it('tunnistaa ulkopuolisen pisteen', () => {
        expect(pointInPolygon3067([15, 5], neliö)).toBe(false);
    });

    it('palauttaa false kun geometria puuttuu', () => {
        expect(pointInPolygon3067([5, 5], null)).toBe(false);
    });
});

describe('normalizeParcelId', () => {
    it('muuntaa väliviivamuodon 14-numeroiseksi tunnukseksi', () => {
        expect(normalizeParcelId('592-404-1-32')).toBe('59240400010032');
    });
});
