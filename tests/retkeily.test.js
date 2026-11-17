import '../js/vendor/index.js';
import { describe, it, expect } from 'vitest';
import { LAYERS, wfsUrl, toSites, viewKey } from '../js/retkeily/aineisto.js';

describe('retkeily: LIPAS', () => {
    it('tasot: laavut, tulentekopaikat, retkeilyreitit, luontopolut', () => {
        expect(LAYERS.map(l => l.id)).toEqual(['laavu', 'tuli', 'reitti', 'polku']);
    });

    it('WFS-pyyntö lipas.fi:hin EPSG:3067-rajauksella', () => {
        const url = wfsUrl(LAYERS[0], { minX: 1, minY: 2, maxX: 3, maxY: 4 });
        expect(url).toContain('https://lipas.fi/geoserver/lipas/ows?');
        expect(url).toContain('typeNames=lipas%3Alipas_301_laavu_kota_kammi');
        expect(url).toContain('bbox=1%2C2%2C3%2C4%2CEPSG%3A3067');
    });

    it('kohteet: nimi, kunta, reitin pituus', () => {
        const sites = toSites(LAYERS[2], { features: [
            { geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: { nimi_fi: 'Maakuntaura', kunta_nimi_fi: 'Saarijärvi', reitin_pituus_km: '40', www: 'http://x' } },
            { geometry: null, properties: {} }
        ] });
        expect(sites).toEqual([{ laji: 'reitti', nimi: 'Maakuntaura', kunta: 'Saarijärvi', pituusKm: 40, www: 'http://x', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } }]);
    });

    it('näkymän avain pyöristää 1 km:iin (pienet siirrot eivät hae uudelleen)', () => {
        expect(viewKey({ minX: 1200, minY: 2900, maxX: 5100, maxY: 7000 })).toBe('1,2,6,7');
    });
});
