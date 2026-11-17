/**
 * Lähihaku (#27): tietynlaiset kuviot 1 km × 1 km alueelta hakupisteen
 * ympäriltä. Puhdas logiikka ilman karttaa ja verkkoa, jotta sen voi
 * testata ja irrottaa (js/features.js).
 *
 * Hakuehdot ovat tavallinen, tallennettava olio (suosikit #24):
 *   { vaihe: 'taimikko' | 'nuori' | 'varttunut' | 'uudistuskypsa' | 'vanha' | null,
 *     puulaji: 'manty' | 'kuusi' | 'koivu' | 'lehti' | 'seka' | null,
 *     hakkuu: boolean }
 * Ehdot yhdistetään JA-ehdoin.
 */

import { containsPoint } from '../location/logic.js';
import { speciesGroup, clearlyDominant } from '../kuviotieto.js';
import { TILE_SIZE, tileKey } from '../rest2.js';

export const SEARCH_HALF = 500; // m joka suuntaan
export const OLD_AGE = 100; // v, "vanha metsä"
export const CUTTING_YEARS = 5; // hakkuuehdotus tänä vuonna tai seuraavina vuosina

export const VAIHEET = ['taimikko', 'nuori', 'varttunut', 'uudistuskypsa', 'vanha'];
export const PUULAJIT = ['manty', 'kuusi', 'koivu', 'lehti', 'seka'];

const DEV_CLASSES = {
    taimikko: new Set(['T1', 'T2', 'Y1']),
    nuori: new Set(['02']),
    varttunut: new Set(['03']),
    uudistuskypsa: new Set(['04'])
};

export function emptyCriteria() {
    return { vaihe: null, puulaji: null, hakkuu: false };
}

export function hasCriteria(c) {
    return Boolean(c && (c.vaihe || c.puulaji || c.hakkuu));
}

/** Täyttääkö kuvio hakuehdot. Puuttuva tieto ei täytä ehtoa. */
export function matches(p, c, year = new Date().getFullYear()) {
    if (!hasCriteria(c)) return false;
    if (c.vaihe === 'vanha') {
        if (p.MEANAGE == null || p.MEANAGE < OLD_AGE) return false;
    } else if (c.vaihe && !DEV_CLASSES[c.vaihe]?.has(p.DEVELOPMENTCLASS)) {
        return false;
    }
    if (c.puulaji) {
        // Sama sääntö kuin maastotilassa: pääpuulaji ei aina ole runsain laji
        if (!p.SPECIESSHARES?.length) return false;
        if (c.puulaji === 'seka') {
            if (clearlyDominant(p)) return false;
        } else if (!clearlyDominant(p) || speciesGroup(p.MAINTREESPECIES) !== c.puulaji) {
            return false;
        }
    }
    if (c.hakkuu && (p.CUTTINGPROPOSALYEAR == null || p.CUTTINGPROPOSALYEAR > year + CUTTING_YEARS)) {
        return false;
    }
    return true;
}

/* ---------- Hakualue ---------- */

/** Hakulaatikko pisteen [x, y] ympärille (EPSG:3067). */
export function searchBox([x, y], half = SEARCH_HALF) {
    return { minX: x - half, minY: y - half, maxX: x + half, maxY: y + half };
}

/** Ruudut, jotka laatikko kattaa (1 km laatikolle enintään 3 × 3). */
export function boxTileKeys(box, size = TILE_SIZE) {
    const [i0, j0] = tileKey([box.minX, box.minY], size).split(':').map(Number);
    // Yläreuna rajalla ei tarvitse seuraavaa ruutua
    const [i1, j1] = tileKey([box.maxX - 1e-6, box.maxY - 1e-6], size).split(':').map(Number);
    const keys = [];
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) keys.push(`${i}:${j}`);
    return keys;
}

function rings(geometry) {
    if (!geometry?.coordinates) return [];
    if (geometry.type === 'Polygon') return geometry.coordinates;
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
    return [];
}

const inBox = ([x, y], b) => x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY;

// Liang–Barsky: leikkaako jana laatikon
function segmentHitsBox([x0, y0], [x1, y1], b) {
    let t0 = 0, t1 = 1;
    const dx = x1 - x0, dy = y1 - y0;
    const checks = [[-dx, x0 - b.minX], [dx, b.maxX - x0], [-dy, y0 - b.minY], [dy, b.maxY - y0]];
    for (const [p, q] of checks) {
        if (p === 0) {
            if (q < 0) return false;
        } else {
            const t = q / p;
            if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
            else { if (t < t0) return false; if (t < t1) t1 = t; }
        }
    }
    return true;
}

/** Osuuko kuvion alue laatikkoon (myös osittain). */
export function intersectsBox(geometry, box) {
    const rs = rings(geometry);
    if (!rs.length) return false;
    for (const ring of rs) {
        for (let k = 0; k < ring.length; k++) {
            if (inBox(ring[k], box)) return true;
            if (k > 0 && segmentHitsBox(ring[k - 1], ring[k], box)) return true;
        }
    }
    // Laatikko kokonaan kuvion sisällä
    return containsPoint(geometry, [(box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2]);
}

/**
 * Lähin kohta kuviosta: { distance, point }. Etäisyys 0 ja point = piste,
 * jos piste on kuvion sisällä.
 */
export function nearest(geometry, point) {
    if (containsPoint(geometry, point)) return { distance: 0, point };
    const [px, py] = point;
    let best = { distance: Infinity, point: null };
    for (const ring of rings(geometry)) {
        for (let k = 1; k < ring.length; k++) {
            const [ax, ay] = ring[k - 1], [bx, by] = ring[k];
            const dx = bx - ax, dy = by - ay;
            const len2 = dx * dx + dy * dy;
            const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
            const q = [ax + t * dx, ay + t * dy];
            const d = Math.hypot(px - q[0], py - q[1]);
            if (d < best.distance) best = { distance: d, point: q };
        }
    }
    return best;
}

export const SUUNNAT = ['pohjoinen', 'koillinen', 'itä', 'kaakko', 'etelä', 'lounas', 'länsi', 'luode'];

/** Ilmansuunta pisteestä toiseen (EPSG:3067: y kasvaa pohjoiseen). */
export function direction([x0, y0], [x1, y1]) {
    const deg = (Math.atan2(x1 - x0, y1 - y0) * 180 / Math.PI + 360) % 360;
    return SUUNNAT[Math.round(deg / 45) % 8];
}

/**
 * Haun tulokset lähimmästä alkaen: [{ stand, distance, direction }].
 * Mukana kuviot, jotka osuvat laatikkoon ja täyttävät ehdot.
 */
export function search(stands, criteria, center, { half = SEARCH_HALF, year } = {}) {
    const box = searchBox(center, half);
    const out = [];
    for (const stand of stands) {
        if (!matches(stand.properties, criteria, year)) continue;
        if (!intersectsBox(stand.geometry, box)) continue;
        const n = nearest(stand.geometry, center);
        out.push({
            stand,
            distance: n.distance,
            direction: n.distance > 0 && n.point ? direction(center, n.point) : null
        });
    }
    return out.sort((a, b) => a.distance - b.distance || (b.stand.properties.AREA ?? 0) - (a.stand.properties.AREA ?? 0));
}

/** Ruutujen yhteistila: loading, kunnes kaikki valmiita; sitten ok tai partial. */
export function tilesStatus(entries) {
    if (entries.some(e => !e || e.status === 'loading')) return 'loading';
    const failed = entries.filter(e => e.status === 'error').length;
    if (failed === entries.length) return 'error';
    return failed ? 'partial' : 'ok';
}
