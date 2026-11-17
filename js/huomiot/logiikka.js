/**
 * Huomioiden puhdas logiikka (#33): kuvio ja kiinteistö pisteestä,
 * koordinaattien muotoilu. Koordinaatit EPSG:3067.
 */

import { containsPoint } from '../location/logic.js';
import { normalizeParcelId } from '../utils.js';

function standIdOf(feature) {
    const fromId = Number(String(feature?.id ?? '').replace(/^stand\./, ''));
    return Number.isFinite(fromId) && fromId > 0 ? fromId : feature?.properties?.STANDID ?? null;
}

/** Kuvion viite huomiolle: { standId, standNumber } (numero listan järjestyksestä, jos puuttuu). */
export function standRefOf(feature, index) {
    return { standId: standIdOf(feature), standNumber: String(feature?.properties?.STANDNUMBER ?? index + 1) };
}

/** Kuvio, jolla piste on: { standId, standNumber, index } tai null. */
export function standAt(features, point) {
    if (!Array.isArray(features)) return null;
    const index = features.findIndex(f => containsPoint(f?.geometry, point));
    if (index < 0) return null;
    return { ...standRefOf(features[index], index), index };
}

function parcelGeometries(parcel) {
    if (!parcel) return [];
    return (parcel.parts ? parcel.parts : [parcel]).map(p => p?.geometry).filter(Boolean);
}

/**
 * Huomion liitos yhteenvedon kiinteistöön ja kuvioon. Kuviovalinnan
 * näennäiskiinteistöä ei tallenneta kiinteistöksi.
 */
export function linkFromSummary(ctx, point) {
    const none = { parcel: null, stand: null };
    if (!ctx) return none;
    const hit = standAt(ctx.features, point);
    const stand = hit ? { standId: hit.standId, standNumber: hit.standNumber } : null;
    const isReal = ctx.reference && !ctx.parcel?.properties?.valinta;
    const onParcel = isReal && (hit || parcelGeometries(ctx.parcel).some(g => containsPoint(g, point)));
    return {
        parcel: onParcel ? { reference: ctx.reference, label: ctx.label || ctx.reference } : null,
        stand
    };
}

/** ETRS-TM35FIN (N, E metreinä) ja WGS84 (5 desimaalia). */
export function formatCoords([x, y]) {
    const [lon, lat] = proj4('EPSG:3067', 'WGS84', [x, y]);
    return { n: String(Math.round(y)), e: String(Math.round(x)), lat: lat.toFixed(5), lon: lon.toFixed(5) };
}

const sameRef = (a, b) => {
    if (!a || !b) return false;
    try {
        return normalizeParcelId(String(a)) === normalizeParcelId(String(b));
    } catch {
        return false;
    }
};

/** Kiinteistön ({ reference }) tai kuvion ({ standId }) huomiot. */
export function notesFor(notes, { reference, standId } = {}) {
    if (standId != null) return notes.filter(n => n.stand && Number(n.stand.standId) === Number(standId));
    if (reference) return notes.filter(n => sameRef(n.parcel?.reference, reference));
    return [];
}
