import { describe, it, expect } from 'vitest';
import { TILA_KEY, lue, tallenna, naytetaankoAlussa, naytetaankoOsto, aiempiOsto, maksulliset, sijoita, naytetaankoZoomVihje } from '../js/esittely/logiikka.js';

const muisti = () => {
    const m = new Map();
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
};

describe('esittely: milloin näytetään', () => {
    it('ensimmäisellä avauksella kyllä, ohitettuna tai katsottuna ei', () => {
        expect(naytetaankoAlussa({ tila: null })).toBe(true);
        expect(naytetaankoAlussa({ tila: 'ohitettu' })).toBe(false);
        expect(naytetaankoAlussa({ tila: 'katsottu' })).toBe(false);
    });

    it('jaettu kiinteistölinkki ei avaa esittelyä', () => {
        expect(naytetaankoAlussa({ tila: null, search: '?parcel=999-1-1-1' })).toBe(false);
    });

    it('ohitus säilyy tallennuksessa', () => {
        const s = muisti();
        tallenna(s, TILA_KEY, 'ohitettu');
        expect(naytetaankoAlussa({ tila: lue(s, TILA_KEY) })).toBe(false);
    });

    it('tallennustilan virhe ei kaada', () => {
        const rikki = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
        expect(lue(rikki, TILA_KEY)).toBe(null);
        expect(() => tallenna(rikki, TILA_KEY, 'katsottu')).not.toThrow();
    });

    it('oston jälkeen kerran, ei yleisen esittelyn päälle eikä ennen sitä', () => {
        expect(naytetaankoOsto({ entitled: true, nahty: null, kaynnissa: false, tila: 'katsottu' })).toBe(true);
        expect(naytetaankoOsto({ entitled: true, nahty: '1', kaynnissa: false, tila: 'katsottu' })).toBe(false);
        expect(naytetaankoOsto({ entitled: true, nahty: null, kaynnissa: true, tila: 'katsottu' })).toBe(false);
        expect(naytetaankoOsto({ entitled: true, nahty: null, kaynnissa: false, tila: null })).toBe(false);
        expect(naytetaankoOsto({ entitled: false, nahty: null, kaynnissa: false, tila: 'ohitettu' })).toBe(false);
    });
});

describe('esittely: maksulliset toiminnot', () => {
    const FEATURES = { huomiot: { product: 'p' }, valinta: { product: null }, arvovari: { product: 'p' } };
    it('vain tuotteelliset, paikan kanssa', () => {
        const r = maksulliset({
            tyokalut: [{ id: 'huomiot', feature: 'huomiot', label: 'Huomiot' }, { id: 'valinta', feature: 'valinta', label: 'Valitse' }],
            varit: [{ id: 'arvo', feature: 'arvovari', label: 'Puuston arvo' }, { id: 'tuntematon', feature: 'x', label: 'X' }]
        }, FEATURES);
        expect(r.map(t => [t.id, t.paikka])).toEqual([['huomiot', 'tyokalut'], ['arvo', 'vari']]);
    });
});

describe('esittely: kortin paikka', () => {
    const ikkuna = { width: 1280, height: 800 };
    const kortti = { width: 360, height: 200 };
    it('kohteen alle ja ikkunan sisään', () => {
        const p = sijoita({ left: 1200, top: 80, width: 44, height: 44 }, kortti, ikkuna);
        expect(p).toEqual({ left: 1280 - 360 - 16, top: 80 + 44 + 12 });
    });
    it('yläpuolelle, jos alla ei ole tilaa', () => {
        const p = sijoita({ left: 100, top: 700, width: 40, height: 40 }, kortti, ikkuna);
        expect(p.top).toBe(700 - 12 - 200);
    });
    it('ilman kohdetta keskelle', () => {
        expect(sijoita(null, kortti, ikkuna)).toEqual({ left: 460, top: 300 });
    });
    it('mobiilissa alareunaan, kohteen ollessa alhaalla yläreunaan', () => {
        const m = { width: 390, height: 844 };
        expect(sijoita({ left: 0, top: 100, width: 40, height: 40 }, { width: 358, height: 220 }, m, { mobiili: true }).top).toBe(844 - 220 - 16 - 8);
        expect(sijoita({ left: 0, top: 700, width: 40, height: 40 }, { width: 358, height: 220 }, m, { mobiili: true }).top).toBe(72);
    });
});

describe('zoomausvihje', () => {
    it('näkyy kaukaa, ei lähellä, ei kiinteistön ollessa auki eikä suljettuna', () => {
        expect(naytetaankoZoomVihje({ zoom: 5, minZoom: 10, kiinteistoAuki: false, suljettu: false })).toBe(true);
        expect(naytetaankoZoomVihje({ zoom: 10, minZoom: 10, kiinteistoAuki: false, suljettu: false })).toBe(false);
        expect(naytetaankoZoomVihje({ zoom: 5, minZoom: 10, kiinteistoAuki: true, suljettu: false })).toBe(false);
        expect(naytetaankoZoomVihje({ zoom: 5, minZoom: 10, kiinteistoAuki: false, suljettu: true })).toBe(false);
    });
});

describe('aiempi osto', () => {
    it('jo ostanut käynnistyksessä: kiitoskortti merkitään nähdyksi', () => {
        expect(aiempiOsto({ entitled: true, nahty: null })).toBe(true);
        expect(aiempiOsto({ entitled: true, nahty: '1' })).toBe(false);
        expect(aiempiOsto({ entitled: false, nahty: null })).toBe(false);
    });
});

import { UUTTA_VERSIO, vanhaKayttaja, naytetaankoUutta } from '../js/esittely/logiikka.js';

describe('uutta-ikkuna', () => {
    it('vanha käyttäjä tunnistetaan aiemmista metsainfo-avaimista', () => {
        expect(vanhaKayttaja([])).toBe(false);
        expect(vanhaKayttaja(['muu.avain'])).toBe(false);
        // Esittelyn, uutuuksien, kielen ja kehitystilan avaimet eivät kerro aiemmasta käytöstä
        expect(vanhaKayttaja(['metsainfo.esittely.vihje', 'metsainfo.uutta', 'metsainfo.kieli', 'metsainfo.devOstot'])).toBe(false);
        expect(vanhaKayttaja(['metsainfo.hinnat.2026-46'])).toBe(true);
        expect(vanhaKayttaja(['metsainfo.hintaArvioNahty'])).toBe(true);
    });

    it('näytetään päivittäjälle kerran versiota kohden', () => {
        expect(naytetaankoUutta({ nahty: null, tila: 'katsottu', vanha: false })).toBe(true);
        expect(naytetaankoUutta({ nahty: null, tila: null, vanha: true })).toBe(true);
        expect(naytetaankoUutta({ nahty: UUTTA_VERSIO, tila: 'katsottu', vanha: true })).toBe(false);
        expect(naytetaankoUutta({ nahty: '4.0', tila: 'ohitettu', vanha: true })).toBe(true);
    });

    it('uusi käyttäjä saa esittelyn, ei uutuuksia', () => {
        expect(naytetaankoUutta({ nahty: null, tila: null, vanha: false })).toBe(false);
    });

    it('jaettu kiinteistölinkki ei avaa uutuuksia', () => {
        expect(naytetaankoUutta({ nahty: null, tila: 'katsottu', vanha: true, search: '?parcel=999-1-1-1' })).toBe(false);
    });
});
