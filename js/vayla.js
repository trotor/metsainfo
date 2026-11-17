/**
 * Pieni viestiväylä toimintojen välille (suosikit, lähihaku, maastotila).
 * Toiminnot eivät tuo toistensa koodia (js/features.js), vaan ilmoittavat
 * tänne. has() kertoo, onko viestille vastaanottajaa, jotta painike
 * näytetään vain, kun toiminto on mukana buildissa.
 */

const handlers = new Map();
const latest = new Map();

/**
 * Kuuntelee viestiä. replay: kutsutaan heti viimeisimmällä viestillä, jos
 * sellainen on jo lähetetty (esim. yhteenveto piirtyi ennen kuin lisäosa latautui).
 */
export function on(name, fn, { replay = false } = {}) {
    if (!handlers.has(name)) handlers.set(name, new Set());
    handlers.get(name).add(fn);
    if (replay && latest.has(name)) fn(latest.get(name));
    return () => handlers.get(name)?.delete(fn);
}

export function emit(name, detail) {
    latest.set(name, detail);
    for (const fn of handlers.get(name) || []) fn(detail);
}

export function has(name) {
    return (handlers.get(name)?.size ?? 0) > 0;
}

/** Viestien nimet yhdessä paikassa. */
export const VIESTIT = {
    // Sovellus → lisäosat: yhteenveto piirretty { content, parcel, reference, label, features }
    yhteenveto: 'sovellus:yhteenveto',
    // Lisäosat → sovellus: avaa kiinteistö tunnuksella { reference }
    avaaKiinteisto: 'sovellus:avaa-kiinteisto',
    // Lisäosat → sovellus: avaa kiinteistö, jolla piste on { points: [[x, y], …] } (EPSG:3067);
    // pisteitä kokeillaan järjestyksessä
    avaaKohta: 'sovellus:avaa-kohta',
    // Lisäosat → suosikit: tallenna { type, name, ref }
    tallennaSuosikki: 'suosikit:tallenna',
    // Suosikit → lähihaku: avaa tallennettu haku { criteria, center }
    avaaHaku: 'lahihaku:avaa',
    // Kuviovalinta → sovellus: valintatila päällä { paalla }; kiinteistöä ei avata karttanapautuksesta
    valintatila: 'valinta:tila',
    // Kuviovalinta → sovellus: näytä valinta yhteenvetona { features, parcel } (parcel = näennäiskiinteistö)
    naytaValinta: 'sovellus:nayta-valinta'
};
