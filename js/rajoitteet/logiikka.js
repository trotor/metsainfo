/**
 * Rajoittavien kohteiden osuminen kiinteistöön ja kuvioon (EPSG:3067).
 * Puhtaat funktiot.
 */

import { containsPoint } from '../location/logic.js';

export const TOL = 20; // m: kohde "kiinteistöllä", kun enintään näin kaukana rajasta
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

function distToSegment(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
    return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t));
}

function cross(a, b, c, d) {
    const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}

const isArea = (g) => g?.type === 'Polygon' || g?.type === 'MultiPolygon';

/** Osuuko kohde alueeseen (monikulmio) tai on enintään tol päässä siitä. */
function touches(geom, area, tol) {
    const vs = vertices(geom);
    if (vs.some(p => containsPoint(area, p))) return true;
    if (isArea(geom) && vertices(area).some(p => containsPoint(geom, p))) return true;
    const aSegs = segments(area);
    if (tol > 0 && vs.some(p => aSegs.some(([a, b]) => distToSegment(p, a, b) <= tol))) return true;
    const gSegs = segments(geom);
    if (gSegs.some(([a, b]) => aSegs.some(([c, d]) => cross(a, b, c, d)))) return true;
    if (tol > 0 && gSegs.length && vertices(area).some(p => gSegs.some(([a, b]) => distToSegment(p, a, b) <= tol))) return true;
    return false;
}

/** Kohteet, jotka ovat kiinteistön (osien) alueella tai enintään TOL päässä. */
export function matchArea(items, areas, tol = TOL) {
    return items.filter(i => areas.some(a => touches(i.geometry, a, tol)));
}

/** Kohteet kuviolla (ilman marginaalia). */
export function matchStand(items, standGeometry) {
    return items.filter(i => touches(i.geometry, standGeometry, 0));
}

/** Ryhmittäin RYHMAT-järjestyksessä, sama nimi kerran. */
export function groupItems(items) {
    return RYHMAT.map(ryhma => {
        const own = items.filter(i => i.ryhma === ryhma);
        const nimet = [...new Set(own.map(i => i.nimi).filter(Boolean))];
        return { ryhma, maara: own.length, nimet };
    }).filter(g => g.maara > 0);
}
