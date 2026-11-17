/**
 * Rajoittavien kohteiden osuminen kiinteistöön ja kuvioon (EPSG:3067).
 * Puhtaat funktiot.
 *
 * Suojelualueen monikulmiossa voi olla kymmeniätuhansia pisteitä, ja
 * kuvioita on satoja: kohteen rajaus, pisteet ja janat lasketaan kerran
 * (WeakMap), ja rajauslaatikot karsivat kaukaiset parit ennen tarkkoja testejä.
 */

import { containsPoint } from '../location/logic.js';

export const TOL = 20;   // m: kohde "kiinteistöllä", kun enintään näin kaukana rajasta
export const INSET = 2;  // m: kuviolla vain todellinen päällekkäisyys (ei yhteinen raja)
export const RYHMAT = ['muinais', 'kulttuuri', 'suojelu', 'natura', 'erama', 'mete'];

function rings(g) {
    if (!g) return [];
    if (g.type === 'Polygon') return g.coordinates;
    if (g.type === 'MultiPolygon') return g.coordinates.flat();
    return [];
}

function vertices(g) {
    if (g.type === 'Point') return [g.coordinates];
    if (g.type === 'MultiPoint' || g.type === 'LineString') return g.coordinates;
    if (g.type === 'MultiLineString') return g.coordinates.flat();
    return rings(g).flat();
}

function segments(g) {
    const segs = [];
    const add = (line) => { for (let i = 1; i < line.length; i++) segs.push([line[i - 1], line[i]]); };
    if (g.type === 'LineString') add(g.coordinates);
    else if (g.type === 'MultiLineString') g.coordinates.forEach(add);
    else rings(g).forEach(add);
    return segs;
}

function bboxOfPoints(pts) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of pts) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    return { minX, minY, maxX, maxY };
}

const isArea = (g) => g?.type === 'Polygon' || g?.type === 'MultiPolygon';
const grow = (b, m) => ({ minX: b.minX - m, minY: b.minY - m, maxX: b.maxX + m, maxY: b.maxY + m });
const overlaps = (a, b) => a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
const inBox = (b, [x, y]) => x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY;
const segBox = ([a, b]) => ({ minX: Math.min(a[0], b[0]), minY: Math.min(a[1], b[1]), maxX: Math.max(a[0], b[0]), maxY: Math.max(a[1], b[1]) });

const prepared = new WeakMap();
/** Geometrian pisteet, janat ja rajaus kerran laskettuina. */
function prep(g) {
    let p = prepared.get(g);
    if (!p) {
        const vs = vertices(g);
        p = { vs, segs: segments(g), bbox: bboxOfPoints(vs), area: isArea(g) };
        prepared.set(g, p);
    }
    return p;
}

function distToSegment(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
    return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t));
}

/** Aito leikkaus: kosketus tai samalla suoralla oleminen ei riitä. */
function properCross(a, b, c, d) {
    const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
    return o1 * o2 < 0 && o3 * o4 < 0;
}

function anyCross(segsA, segsB, box) {
    const near = segsB.filter(s => overlaps(segBox(s), box));
    if (!near.length) return false;
    return segsA.some(([a, b]) => overlaps(segBox([a, b]), box) && near.some(([c, d]) => properCross(a, b, c, d)));
}

/** Kiinteistö: kohde osuu alueeseen tai on enintään tol päässä. */
function touchesArea(geom, area, tol) {
    const it = prep(geom), ar = prep(area);
    if (!overlaps(it.bbox, grow(ar.bbox, tol))) return false;
    const near = grow(ar.bbox, tol);
    const vs = it.vs.filter(p => inBox(near, p));
    if (vs.some(p => containsPoint(area, p))) return true;
    if (it.area && ar.vs.some(p => inBox(it.bbox, p) && containsPoint(geom, p))) return true;
    if (tol > 0 && vs.some(p => ar.segs.some(([a, b]) => distToSegment(p, a, b) <= tol))) return true;
    if (anyCross(it.segs, ar.segs, grow(ar.bbox, 0))) return true;
    if (tol > 0 && it.segs.length) {
        const itNear = it.segs.filter(s => overlaps(segBox(s), near));
        if (ar.vs.some(p => itNear.some(([a, b]) => distToSegment(p, a, b) <= tol))) return true;
    }
    return false;
}

/** Kuvion sisäpisteet: kärkipisteet INSET metriä keskustaan päin ja keskus (enintään 13 pistettä). */
function innerPoints(stand, st) {
    const ring = rings(stand)[0] || [];
    if (!ring.length) return [];
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    const pts = [];
    if (containsPoint(stand, [cx, cy])) pts.push([cx, cy]);
    const step = Math.max(1, Math.floor(ring.length / 12));
    for (let k = 0; k < ring.length; k += step) {
        const [x, y] = ring[k];
        const d = Math.hypot(cx - x, cy - y);
        if (d <= INSET) continue;
        const p = [x + ((cx - x) / d) * INSET, y + ((cy - y) / d) * INSET];
        if (containsPoint(stand, p)) pts.push(p);
    }
    return pts.filter(p => inBox(st.bbox, p));
}

/** Kuvio: todellinen päällekkäisyys (ei pelkkä yhteinen raja tai digitointivirhe). */
function overlapsStand(geom, stand) {
    const it = prep(geom), st = prep(stand);
    if (!overlaps(it.bbox, st.bbox)) return false;
    // Kohteen piste kuvion sisällä, ei rajalla
    const vs = it.vs.filter(p => inBox(st.bbox, p));
    if (vs.some(p => containsPoint(stand, p) && st.segs.every(([a, b]) => distToSegment(p, a, b) > INSET))) return true;
    if (!it.area) return false;
    // Kuvion sisäpiste kohdealueella
    if (innerPoints(stand, st).some(p => inBox(it.bbox, p) && containsPoint(geom, p))) return true;
    // Rajat leikkaavat aidosti
    return anyCross(st.segs, it.segs, st.bbox);
}

/** Kohteet, jotka ovat kiinteistön (osien) alueella tai enintään TOL päässä. */
export function matchArea(items, areas, tol = TOL) {
    return items.filter(i => areas.some(a => touchesArea(i.geometry, a, tol)));
}

/** Kohteet kuviolla (todellinen päällekkäisyys). */
export function matchStand(items, standGeometry) {
    return items.filter(i => overlapsStand(i.geometry, standGeometry));
}

/** Ryhmittäin RYHMAT-järjestyksessä; sama nimi kerran (esim. Natura SAC ja SPA). */
export function groupItems(items) {
    return RYHMAT.map(ryhma => {
        const own = items.filter(i => i.ryhma === ryhma);
        const nimet = [...new Set(own.map(i => i.nimi).filter(Boolean))];
        const nimettomat = own.filter(i => !i.nimi).length;
        return { ryhma, maara: nimet.length + nimettomat, nimet };
    }).filter(g => g.maara > 0);
}
