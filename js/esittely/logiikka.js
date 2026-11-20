/**
 * Esittelyn puhdas logiikka (js/esittely/): milloin esittely näytetään,
 * mitkä toiminnot ovat maksullisia ja mihin kortti sijoitetaan.
 */

/** Yleinen esittely: 'ohitettu' tai 'katsottu' → ei enää itsestään. */
export const TILA_KEY = 'metsainfo.esittely';
/** Oston jälkeinen esittely nähty: '1'. */
export const OSTO_KEY = 'metsainfo.esittely.osto';
/** Zoomausvihje suljettu ×:llä: '1' → ei enää koskaan. */
export const VIHJE_KEY = 'metsainfo.esittely.vihje';

export function lue(storage, key) {
    try {
        return storage?.getItem(key) ?? null;
    } catch {
        return null;
    }
}

export function tallenna(storage, key, value) {
    try {
        storage?.setItem(key, value);
    } catch {
        // Ei tallennustilaa: esittely voi tulla uudelleen seuraavalla avauksella
    }
}

/**
 * Näytetäänkö esittely käynnistyksessä: vain jos sitä ei ole ohitettu tai
 * katsottu. Jaetulla kiinteistölinkillä (?parcel=) esittely odottaa
 * seuraavaan tavalliseen avaukseen, jotta linkin avaaja näkee kiinteistön.
 */
export function naytetaankoAlussa({ tila, search = '' }) {
    if (tila) return false;
    return !new URLSearchParams(search).has('parcel');
}

/** Oston jälkeinen kortti: kun osto on voimassa, sitä ei ole nähty eikä yleinen esittely ole kesken tai vielä edessä. */
export function naytetaankoOsto({ entitled, nahty, kaynnissa, tila }) {
    return Boolean(entitled && !nahty && !kaynnissa && tila);
}

/**
 * Käynnistyksessä jo ostanut (osto tehty ennen esittelyä tai aiemmassa
 * versiossa): kiitoskortti merkitään nähdyksi, joten se tulee vain uuden
 * oston tai palautuksen jälkeen (purchases.onChange).
 */
export function aiempiOsto({ entitled, nahty }) {
    return Boolean(entitled && !nahty);
}

/**
 * Maksulliset toiminnot rekisteristä (js/ui/tyokalut.js rekisteroidyt()):
 * ne, joilla on js/features.js:ssä tuote. paikka: 'tyokalut' tai 'vari'.
 */
export function maksulliset({ tyokalut = [], varit = [] }, features) {
    const paid = (f) => Boolean(features[f]?.product);
    return [
        ...tyokalut.filter(t => paid(t.feature)).map(t => ({ ...t, paikka: 'tyokalut' })),
        ...varit.filter(v => paid(v.feature)).map(v => ({ ...v, paikka: 'vari' }))
    ];
}

/**
 * Kortin paikka kohteen viereen: alle, jos tilaa on, muuten yläpuolelle;
 * vaakasuunnassa ikkunan sisään 16 px reunoin. Ilman kohdetta keskelle.
 * Kapealla näytöllä (mobiili) kortti on aina alareunassa tai, jos kohde on
 * alhaalla, yläreunassa.
 */
export function sijoita(kohde, kortti, ikkuna, { mobiili = false, rako = 12, reuna = 16 } = {}) {
    const maxLeft = Math.max(reuna, ikkuna.width - kortti.width - reuna);
    if (mobiili) {
        const alhaalla = kohde && kohde.top + kohde.height / 2 > ikkuna.height * 0.6;
        return { left: reuna, top: alhaalla ? reuna + 56 : ikkuna.height - kortti.height - reuna - 8 };
    }
    if (!kohde) {
        return { left: Math.round((ikkuna.width - kortti.width) / 2), top: Math.round((ikkuna.height - kortti.height) / 2) };
    }
    const left = Math.min(maxLeft, Math.max(reuna, Math.round(kohde.left + kohde.width / 2 - kortti.width / 2)));
    const alle = kohde.top + kohde.height + rako;
    if (alle + kortti.height <= ikkuna.height - reuna) return { left, top: alle };
    const ylle = kohde.top - rako - kortti.height;
    if (ylle >= reuna) return { left, top: ylle };
    return { left, top: Math.max(reuna, ikkuna.height - kortti.height - reuna) };
}

/** Zoomausvihje: kun ollaan liian kaukana kiinteistöille eikä kiinteistö ole auki. */
export function naytetaankoZoomVihje({ zoom, minZoom, kiinteistoAuki, suljettu }) {
    return !suljettu && !kiinteistoAuki && zoom < minZoom;
}

/**
 * Uutta-ikkuna päivittäjille (Tero 20.11.2026): kerran versiota kohden.
 * UUTTA_VERSIO kasvatetaan, kun ikkunan sisältö vaihdetaan uuteen versioon.
 */
export const UUTTA_KEY = 'metsainfo.uutta';
export const UUTTA_VERSIO = '4.1';
const EI_KAYTTOA = ['metsainfo.esittely', UUTTA_KEY, 'metsainfo.kieli', 'metsainfo.devOstot'];

/** Onko laitteella aiemman käytön jälkiä (avaimet luettu ennen kuin tämä käynnistys kirjoittaa mitään). */
export function vanhaKayttaja(keys) {
    return keys.some(k => k.startsWith('metsainfo') && !EI_KAYTTOA.some(e => k === e || k.startsWith(`${e}.`)));
}

/**
 * Näytetäänkö uutuudet: ei, jos tämän version uutuudet on nähty tai avataan
 * jaettu kiinteistölinkki. Muuten kyllä, jos esittely on jo nähty tai laite
 * on ollut käytössä ennen esittelyä (4.0.x). Uusi käyttäjä saa esittelyn.
 */
export function naytetaankoUutta({ nahty, tila, vanha, search = '' }) {
    if (nahty === UUTTA_VERSIO) return false;
    if (new URLSearchParams(search).has('parcel')) return false;
    return Boolean(tila || vanha);
}
