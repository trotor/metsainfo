/**
 * Paikannuksen puhdas logiikka: koordinaattimuunnos, kuvion ja kiinteistön
 * tunnistus, painikkeen tilat ja "Olet kuviolla" -rivin sisältö.
 * Geometria lasketaan EPSG:3067:ssä kuten muuallakin sovelluksessa.
 */

import { CODES } from '../config.js';
import { pointInPolygon3067, formatNumber } from '../utils.js';

export const STALE_MS = 30000;

export function latLonTo3067(lat, lon) {
    return proj4('WGS84', 'EPSG:3067', [lon, lat]);
}

export function findFeatureIndexAt(features, point) {
    if (!features) return -1;
    return features.findIndex(f => pointInPolygon3067(point, f.geometry));
}

export function findParcelAt(parcels, point) {
    for (const parcel of parcels) {
        if (pointInPolygon3067(point, parcel.geometry)) return parcel;
    }
    return null;
}

export function isInsideParcel(currentParcel, point) {
    if (!currentParcel) return false;
    const parts = currentParcel.parts || [currentParcel];
    return parts.some(part => pointInPolygon3067(point, part.geometry));
}

/**
 * Painikkeen tila: off → follow → heading → off. 'show' tarkoittaa, että
 * sijaintia seurataan mutta kartta ei keskity (käyttäjä vei karttaa).
 */
export function nextFollowMode(mode, hasCompass) {
    if (mode === 'off' || mode === 'show') return 'follow';
    if (mode === 'follow') return hasCompass ? 'heading' : 'off';
    return 'off';
}

export function isStale(timestamp, now, maxAgeMs = STALE_MS) {
    return now - timestamp > maxAgeMs;
}

export function hereRowModel({ hasParcel, inside, feature }) {
    if (!hasParcel) return { kind: 'none', text: '' };
    if (!inside) return { kind: 'outside', text: 'Valitun kiinteistön ulkopuolella' };
    if (!feature) return { kind: 'none', text: 'Ei kuviotietoa tässä kohdassa' };

    const p = feature.properties || {};
    const parts = [`Kuvio ${p.STANDNUMBER ?? '-'}`];
    const species = CODES.treeSpecies[p.MAINTREESPECIES];
    if (species) parts.push(species);
    if (p.VOLUME != null) parts.push(`${formatNumber(p.VOLUME, 0)} m³/ha`);
    const devClass = CODES.developmentClass[p.DEVELOPMENTCLASS];
    if (devClass) parts.push(devClass);
    return { kind: 'stand', text: parts.join(' · ') };
}

/**
 * Vain evätty lupa lopettaa seurannan. "Sijainti ei saatavilla" ja
 * aikakatkaisu ovat maastossa tilapäisiä (iOS: kCLErrorLocationUnknown),
 * ja seuranta jatkuu niiden jälkeen.
 */
export function shouldStopOnError(kind) {
    return kind === 'denied';
}
