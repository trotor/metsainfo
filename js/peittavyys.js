/**
 * Kuvioiden värityksen peittävyys (0–1), jaettu tieto karttatasoille.
 *
 * Oletus 1: tavallinen build piirtää kuten ennenkin. Läpinäkyvyyssäädin
 * (kokeilu, js/lapinakyvyys/) muuttaa kerrointa ja ilmoittaa
 * VIESTIT.peittavyys (js/vayla.js), jolloin kuvioita värittävät tasot
 * piirtävät täyttönsä uudelleen täyttö(perus)-arvolla. Reunaviivat,
 * valinnat ja korostukset eivät muutu.
 */

let kerroin = 1;

/** Nykyinen kerroin 0–1. */
export function peittavyys() {
    return kerroin;
}

/** Asettaa kertoimen (rajataan välille 0–1; virheellinen arvo → 1). */
export function setPeittavyys(arvo) {
    const n = Number(arvo);
    kerroin = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
    return kerroin;
}

/** Tason oma täytön peittävyys kerrottuna säätimen arvolla. */
export function taytto(perus) {
    return Math.round(perus * kerroin * 1000) / 1000;
}
