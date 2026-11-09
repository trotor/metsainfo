/**
 * Alusta-abstraktio: sovelluskoodi ei kutsu Capacitor-plugineja suoraan,
 * vaan tämän hakemiston funktioita. Verkossa käytetään selaimen rajapintoja.
 */

import { Capacitor } from '@capacitor/core';

/** Julkinen verkkoversio: jaettavat linkit osoittavat aina tänne */
export const PUBLIC_BASE_URL = 'https://trotor.github.io/metsainfo/';

export function isNative(cap = Capacitor) {
    return !!cap?.isNativePlatform?.();
}

/**
 * Jaettava kiinteistölinkki. Sovelluksessa sivun osoite on
 * capacitor://localhost/..., joka ei toimi muilla, joten linkki
 * muodostetaan julkisesta perusosoitteesta.
 */
export function shareableParcelUrl(locationHref, { native = isNative() } = {}) {
    if (!native) return locationHref;
    const parcel = new URL(locationHref).searchParams.get('parcel');
    const url = new URL(PUBLIC_BASE_URL);
    if (parcel) url.searchParams.set('parcel', parcel);
    return url.href;
}

export function csvFileName(parcelId) {
    return `metsavaratiedot_${String(parcelId).replace(/[^a-zA-Z0-9-]/g, '_')}.csv`;
}
