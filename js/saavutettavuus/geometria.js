/**
 * Tasogeometria EPSG:3067-metreinä (saavutettavuus). Puhtaat funktiot.
 * Pisteet [x, y]; Digiroadin kolmas koordinaatti (korkeus) ohitetaan.
 */

import { pointInside } from '../kuviotieto.js';

export function distToSegment([px, py], [ax, ay], [bx, by]) {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function distToLine(p, coords) {
    let best = Infinity;
    for (let i = 1; i < coords.length; i++) best = Math.min(best, distToSegment(p, coords[i - 1], coords[i]));
    return coords.length === 1 ? Math.hypot(p[0] - coords[0][0], p[1] - coords[0][1]) : best;
}

/** Monikulmion osat: [[ulkorengas, reikä, …], …]. */
function polygons(geometry) {
    if (geometry?.type === 'Polygon') return [geometry.coordinates];
    if (geometry?.type === 'MultiPolygon') return geometry.coordinates;
    return [];
}

function inRing([px, py], ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

export function containsPoint(geometry, p) {
    return polygons(geometry).some(([outer, ...holes]) => inRing(p, outer) && !holes.some(h => inRing(p, h)));
}

function segmentsIntersect([ax, ay], [bx, by], [cx, cy], [dx, dy]) {
    const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
    const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
    const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}

function rings(geometry) {
    return polygons(geometry).flat();
}

/** Kulkeeko viiva monikulmion kautta (piste sisällä tai jana leikkaa reunan). */
export function lineCrossesPolygon(coords, geometry) {
    if (coords.some(p => containsPoint(geometry, p))) return true;
    for (const ring of rings(geometry)) {
        for (let i = 1; i < coords.length; i++) {
            for (let j = 1; j < ring.length; j++) {
                if (segmentsIntersect(coords[i - 1], coords[i], ring[j - 1], ring[j])) return true;
            }
        }
    }
    return false;
}

/** Onko viiva enintään tol metrin päässä monikulmiosta (tai sen sisällä). */
export function lineNearPolygon(coords, geometry, tol) {
    if (lineCrossesPolygon(coords, geometry)) return true;
    for (const ring of rings(geometry)) {
        for (const p of ring) if (distToLine(p, coords) <= tol) return true;
        for (const p of coords) if (distToLine(p, ring) <= tol) return true;
    }
    return false;
}

export function bboxOf(geometries, margin = 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const g of geometries) {
        for (const ring of rings(g)) {
            for (const [x, y] of ring) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }
    return { minX: minX - margin, minY: minY - margin, maxX: maxX + margin, maxY: maxY + margin };
}

function grid(geometry, b, step) {
    const out = [];
    for (let x = b.minX + step / 2; x < b.maxX; x += step) {
        for (let y = b.minY + step / 2; y < b.maxY; y += step) {
            if (containsPoint(geometry, [x, y])) out.push([x, y]);
        }
    }
    return out;
}

/**
 * Kuvion sisäpisteet hilana (metsäkuljetusmatkan keskiarvoon). Askel kasvaa,
 * kunnes pisteitä on enintään max; jos hila ei osu kuvioon, yksi sisäpiste.
 */
export function samplePoints(geometry, { step = 20, max = 400 } = {}) {
    const b = bboxOf([geometry]);
    if (!Number.isFinite(b.minX)) return [];
    let s = step;
    let pts = grid(geometry, b, s);
    while (pts.length > max) {
        s *= Math.sqrt(pts.length / max) * 1.01;
        pts = grid(geometry, b, s);
    }
    if (!pts.length) {
        const p = pointInside(geometry);
        return p ? [p] : [];
    }
    return pts;
}
