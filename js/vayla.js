/**
 * Pieni viestiväylä toimintojen välille (suosikit, lähihaku, maastotila).
 * Toiminnot eivät tuo toistensa koodia (js/features.js), vaan ilmoittavat
 * tänne. has() kertoo, onko viestille vastaanottajaa, jotta painike
 * näytetään vain, kun toiminto on mukana buildissa.
 */

const handlers = new Map();

export function on(name, fn) {
    if (!handlers.has(name)) handlers.set(name, new Set());
    handlers.get(name).add(fn);
    return () => handlers.get(name)?.delete(fn);
}

export function emit(name, detail) {
    for (const fn of handlers.get(name) || []) fn(detail);
}

export function has(name) {
    return (handlers.get(name)?.size ?? 0) > 0;
}

/** Viestien nimet yhdessä paikassa. */
export const VIESTIT = {
    // Sovellus → lisäosat: yhteenveto piirretty { content, parcel, reference, label, features }
    yhteenveto: 'sovellus:yhteenveto',
    // Lisäosat → sovellus: avaa kiinteistö tunnuksella (string) → Promise<boolean>
    avaaKiinteisto: 'sovellus:avaa-kiinteisto',
    // Lisäosat → suosikit: tallenna { type, name, ref }
    tallennaSuosikki: 'suosikit:tallenna',
    // Suosikit → lähihaku: avaa tallennettu haku { criteria, center }
    avaaHaku: 'lahihaku:avaa'
};
