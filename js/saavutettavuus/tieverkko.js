/**
 * Digiroadin tieverkko: lähin tie ja lyhin reitti yleiselle tielle.
 * Linkki = { id, linkId?, coords: [[x, y], …], props } EPSG:3067:ssa (linkId = Digiroadin
 * link_id, kun monirivinen linkki on pilkottu osiin). Puhtaat funktiot.
 */

import Flatbush from 'flatbush';
import { distToSegment } from './geometria.js';

/** Toiminnallinen luokka: 1–6 autotiet (myös yksityis- ja metsäautotiet), 7 ajopolku, 8 kevyt liikenne. */
export function roadKind(props) {
    const lk = Number(props?.toiminn_lk);
    if (lk >= 1 && lk <= 6) return 'auto';
    if (lk === 7) return 'ajopolku';
    if (lk === 8) return 'kevyt';
    return null;
}

/** Hallinnollinen luokka 1 valtio, 2 kunta. */
export function isPublic(props) {
    const lk = Number(props?.hallinn_lk);
    return lk === 1 || lk === 2;
}

/** Janat spatiaali-indeksiin. */
function segmentIndex(links) {
    const segs = [];
    for (const link of links) {
        for (let i = 1; i < link.coords.length; i++) segs.push({ a: link.coords[i - 1], b: link.coords[i], link });
    }
    if (!segs.length) return null;
    const index = new Flatbush(segs.length);
    for (const { a, b } of segs) {
        index.add(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]));
    }
    index.finish();
    return { index, segs };
}

/** Lähin jana: rajaavien suorakulmioiden etäisyys on alaraja, joten tarkistetaan kaikki sitä lähempänä olevat. */
function nearestSegment(si, p, filter = () => true, maxDistance = Infinity) {
    if (!si) return null;
    const keep = (i) => filter(si.segs[i]);
    const first = si.index.neighbors(p[0], p[1], 8, maxDistance, keep);
    if (!first.length) return null;
    let best = null;
    const consider = (i) => {
        const d = distToSegment(p, si.segs[i].a, si.segs[i].b);
        if (!best || d < best.dist) best = { dist: d, seg: si.segs[i] };
    };
    first.forEach(consider);
    si.index.neighbors(p[0], p[1], Infinity, Math.min(best.dist, maxDistance), keep).forEach(consider);
    return best.dist <= maxDistance ? best : null;
}

export function createRoadIndex(links) {
    const si = segmentIndex(links);
    return {
        nearest(p, kind = 'auto') {
            const hit = nearestSegment(si, p, s => roadKind(s.link.props) === kind);
            return hit ? { dist: hit.dist, link: hit.seg.link } : null;
        }
    };
}

const key = ([x, y]) => `${Math.round(x * 2) / 2},${Math.round(y * 2) / 2}`;

/** Autoteiden verkko: solmut taitepisteissä, paino = janan pituus. */
export function buildGraph(links) {
    const auto = links.filter(l => roadKind(l.props) === 'auto');
    const nodes = new Map();
    const node = (p) => {
        const k = key(p);
        if (!nodes.has(k)) nodes.set(k, { k, edges: [], public: false });
        return nodes.get(k);
    };
    for (const link of auto) {
        const pub = isPublic(link.props);
        for (let i = 1; i < link.coords.length; i++) {
            const a = node(link.coords[i - 1]), b = node(link.coords[i]);
            const len = Math.hypot(link.coords[i][0] - link.coords[i - 1][0], link.coords[i][1] - link.coords[i - 1][1]);
            const linkId = link.linkId ?? link.id;
            a.edges.push({ to: b, len, linkId });
            b.edges.push({ to: a, len, linkId });
            if (pub) a.public = b.public = true;
        }
    }
    return { nodes, segments: segmentIndex(auto) };
}

/** Pieni binäärikeko [etäisyys, solmu]. */
function heap() {
    const a = [];
    return {
        get size() { return a.length; },
        push(item) {
            a.push(item);
            let i = a.length - 1;
            while (i > 0) {
                const p = (i - 1) >> 1;
                if (a[p][0] <= a[i][0]) break;
                [a[p], a[i]] = [a[i], a[p]];
                i = p;
            }
        },
        pop() {
            const top = a[0], last = a.pop();
            if (a.length) {
                a[0] = last;
                let i = 0;
                for (;;) {
                    const l = 2 * i + 1, r = l + 1;
                    let m = i;
                    if (l < a.length && a[l][0] < a[m][0]) m = l;
                    if (r < a.length && a[r][0] < a[m][0]) m = r;
                    if (m === i) break;
                    [a[m], a[i]] = [a[i], a[m]];
                    i = m;
                }
            }
            return top;
        }
    };
}

/**
 * Lyhin reitti autoteitse yleiselle tielle. Lähtöpisteet liitetään lähimpään
 * autotiehen (enintään snap m). Palauttaa { length, linkIds } tai null.
 */
export function routeToPublic(graph, startPoints, { maxLength = 5000, snap = 50 } = {}) {
    const dist = new Map();
    const prev = new Map(); // solmu → { from, linkId }
    const q = heap();
    const seed = (n, d, linkId) => {
        if (d < (dist.get(n) ?? Infinity)) {
            dist.set(n, d);
            prev.set(n, { from: null, linkId });
            q.push([d, n]);
        }
    };
    for (const p of startPoints) {
        const hit = nearestSegment(graph.segments, p, () => true, snap);
        if (!hit) continue;
        const { a, b, link } = hit.seg;
        if (isPublic(link.props)) return { length: 0, linkIds: [] };
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        // Projektion paikka janalla
        const t = len ? Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (len * len))) : 0;
        seed(graph.nodes.get(key(a)), t * len, link.linkId ?? link.id);
        seed(graph.nodes.get(key(b)), (1 - t) * len, link.linkId ?? link.id);
    }
    const done = new Set();
    while (q.size) {
        const [d, n] = q.pop();
        if (done.has(n)) continue;
        done.add(n);
        if (d > maxLength) return null;
        if (n.public) {
            const ids = [];
            for (let cur = n; cur; cur = prev.get(cur)?.from) {
                const id = prev.get(cur)?.linkId;
                if (id != null && ids[ids.length - 1] !== id) ids.push(id);
            }
            return { length: Math.round(d), linkIds: ids.reverse() };
        }
        for (const e of n.edges) {
            const nd = d + e.len;
            if (nd < (dist.get(e.to) ?? Infinity)) {
                dist.set(e.to, nd);
                prev.set(e.to, { from: n, linkId: e.linkId });
                q.push([nd, e.to]);
            }
        }
    }
    return null;
}
