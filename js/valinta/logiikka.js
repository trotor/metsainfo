/**
 * Kuviovalinnan puhdas logiikka (kokeilu, #31): valinta, sen yhteenveto,
 * latausruudut ja näennäiskiinteistö sovelluksen yhteenvedolle. Ei DOM:ia
 * eikä Leafletia, jotta logiikka on testattavissa.
 */

import { standCentroid } from '../data.js';
import { getGeometryBounds3067 } from '../utils.js';

/** Valinnan rajaus enintään MAX_EXTENT × MAX_EXTENT metriä. */
export const MAX_EXTENT = 10000;
/** Latausruudun koko (m): WFS palauttaa enintään ~2000 kuviota kerralla. */
export const TILE = 1000;
/** Ruutuja kerralla enintään (muuten pyydetään zoomaamaan). */
export const MAX_TILES = 30;
/** Valintatason paneeli: kuviotasojen (overlayPane 400) yläpuolella, sijaintipisteen (450) alla. */
export const PANE_Z_INDEX = 440;
/** Kuviot ladataan tästä zoomista alkaen. */
export const MIN_ZOOM = 12;

/** Kuvion pysyvä tunniste: WFS-kohteen id, muuten kuvionumero ja sisäpiste. */
export function standKey(feature) {
    if (feature?.id != null) return String(feature.id);
    const p = standCentroid(feature?.geometry);
    const n = feature?.properties?.STANDNUMBER ?? '';
    return p ? `${n}:${Math.round(p[0])}:${Math.round(p[1])}` : `${n}:?`;
}

/** Rajauksen kattavat ruudut muodossa "i:j". */
export function tileKeys(bounds, size = TILE) {
    const keys = [];
    const i0 = Math.floor(bounds.minX / size), i1 = Math.floor(bounds.maxX / size);
    const j0 = Math.floor(bounds.minY / size), j1 = Math.floor(bounds.maxY / size);
    for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) keys.push(`${i}:${j}`);
    }
    return keys;
}

export function tileBounds(key, size = TILE) {
    const [i, j] = key.split(':').map(Number);
    return { minX: i * size, minY: j * size, maxX: (i + 1) * size, maxY: (j + 1) * size };
}

function union(a, b) {
    return {
        minX: Math.min(a.minX, b.minX), minY: Math.min(a.minY, b.minY),
        maxX: Math.max(a.maxX, b.maxX), maxY: Math.max(a.maxY, b.maxY)
    };
}

/**
 * Valinta muistissa. toggle palauttaa 'added', 'removed' tai 'too-large'
 * (lisäys kasvattaisi rajauksen yli MAX_EXTENT:n).
 */
export function createSelection() {
    const items = new Map(); // key → { feature, bounds }

    const extent = (extra) => {
        let b = extra;
        for (const v of items.values()) b = b ? union(b, v.bounds) : v.bounds;
        return b;
    };

    return {
        has: (key) => items.has(key),
        get size() { return items.size; },
        toggle(feature) {
            const key = standKey(feature);
            if (items.has(key)) {
                items.delete(key);
                return 'removed';
            }
            const bounds = getGeometryBounds3067(feature.geometry);
            const b = extent(bounds);
            if (b.maxX - b.minX > MAX_EXTENT || b.maxY - b.minY > MAX_EXTENT) return 'too-large';
            items.set(key, { feature, bounds });
            return 'added';
        },
        clear() { items.clear(); },
        list: () => [...items.values()].map(v => v.feature),
        signature: () => [...items.keys()].sort().join('|')
    };
}

/** Valittujen kuvioiden määrä, pinta-ala (ha) ja tilavuus (m³). */
export function selectionSummary(features) {
    let areaHa = 0, volume = 0;
    for (const f of features) {
        const area = Number(f.properties?.AREA) || 0;
        areaHa += area;
        volume += (Number(f.properties?.VOLUME) || 0) * area;
    }
    return { count: features.length, areaHa, volume };
}

export const canShow = (selection) => selection.size > 0;

/**
 * Näennäiskiinteistö sovelluksen yhteenvedolle. Osat Feature-muotoisina,
 * koska pinta-ala, hinta-alueen piste ja saavutettavuus lukevat part.geometry.
 */
export function toPseudoParcel(features, label) {
    return {
        type: 'Feature',
        geometry: null,
        properties: { label, valinta: true },
        parts: features.map(f => ({ type: 'Feature', properties: {}, geometry: f.geometry }))
    };
}
