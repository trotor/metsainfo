/**
 * Kauppakuvien kuvaustila: kartalla on vain kuvitteellinen Esimerkkimetsä.
 * Oikeita kiinteistöjä, kiinteistötunnuksia, luontokohteita tai
 * metsänkäyttöilmoituksia ei haeta, joten kuviin ei päädy kenenkään tilaa.
 *
 * Päälle vain erillisellä buildilla: VITE_KUVAUSTILA=1 npm run build
 * (tai npm run dev). Tavallisessa buildissa KUVAUSTILA on false, ja
 * Vite karsii tilan koodin pois. ios:sync ja android:sync ajavat aina
 * tavallisen buildin.
 */
export const KUVAUSTILA = import.meta.env?.VITE_KUVAUSTILA === '1';

let data = null;

/** Esimerkkimetsän kiinteistö ja kuviot (public/demo/esimerkkimetsa.json). */
export async function loadEsimerkkimetsa() {
    if (!data) data = await (await fetch('demo/esimerkkimetsa.json')).json();
    return data;
}
