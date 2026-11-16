/**
 * Kiinteistön saavutettavuusanalyysi: metsäkuljetusmatka, maapohja ja
 * tieyhteys kuvioittain. Haut annetaan parametreina (testattavuus).
 */

import { bboxOf, samplePoints, lineCrossesPolygon, lineNearPolygon, distToLine } from './geometria.js';
import { roadKind, isPublic, createRoadIndex, buildGraph, routeToPublic } from './tieverkko.js';
import { classShares } from './rasteri.js';
import { soilScore, attributeScore, haulScore, connectionScore, combine } from './indeksi.js';

export const NEAR = 2000;      // m, tiet kiinteistön ympäriltä
export const FAR = 5000;       // m, laajempi alue, jos yhteyttä ei löydy
export const PARCEL_TOL = 50;  // m, tie "kiinteistölle", kun enintään näin kaukana
export const MAX_ROUTE = 5000; // m

const linkBox = (l) => {
    const xs = l.coords.map(p => p[0]), ys = l.coords.map(p => p[1]);
    return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
};
const overlaps = (a, b, m = 0) => a.minX <= b.maxX + m && a.maxX >= b.minX - m && a.minY <= b.maxY + m && a.maxY >= b.minY - m;
const grow = (b, m) => ({ minX: b.minX - m, minY: b.minY - m, maxX: b.maxX + m, maxY: b.maxY + m });

export function parcelGeometries(parcel) {
    if (!parcel) return [];
    return (parcel.parts ? parcel.parts : [parcel]).map(p => p.geometry).filter(Boolean);
}

/** Pääluokka: suurin osuus maaluokista (vesistö 254 ei). */
function mainClass(shares) {
    let best = null;
    for (const [cls, share] of Object.entries(shares || {})) {
        if (cls === '254') continue;
        if (!best || share > best.share) best = { cls: Number(cls), share };
    }
    return best?.cls ?? null;
}

/** Tiet, jotka tulevat kiinteistölle, ja niiden pisteet lähinnä kiinteistöä. */
function roadsToParcel(autoLinks, parts) {
    const pbox = bboxOf(parts);
    const reaching = autoLinks.filter(l => overlaps(l.box, pbox, PARCEL_TOL)
        && parts.some(g => lineNearPolygon(l.coords, g, PARCEL_TOL)));
    const rings = parts.flatMap(g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map(poly => poly[0]));
    const starts = reaching.map(l => {
        let best = l.coords[0], bestD = Infinity;
        for (const p of l.coords) {
            const d = Math.min(...rings.map(r => distToLine(p, r)));
            if (d < bestD) { bestD = d; best = p; }
        }
        return best;
    });
    return { reaching, starts };
}

/**
 * analyseParcel({ parcel, features }, { roads, raster, area }) →
 * { tie, kuviot: Map(index → tulos), lahteet, partial, tiet, reitti }
 * roads: createRoadSource(); raster(bbox) → rasteri tai null; area([x, y]) → nimi tai null.
 */
export async function analyseParcel({ parcel, features }, { roads, raster = async () => null, area = async () => null }) {
    const parts = parcelGeometries(parcel);
    const stands = features.map(f => f.geometry).filter(Boolean);
    const all = bboxOf([...parts, ...stands]);

    const rasterP = raster(grow(all, 20)).catch(() => null);
    const areaP = area([(all.minX + all.maxX) / 2, (all.minY + all.maxY) / 2]).catch(() => null);

    let { links, partial } = await roads.links(grow(all, NEAR));
    const prep = (ls) => ls.map(l => ({ ...l, box: linkBox(l), kind: roadKind(l.props) }));
    let all3 = prep(links);
    let auto = all3.filter(l => l.kind === 'auto');
    const index = createRoadIndex(auto);

    // Tie kiinteistölle ja yhteys yleiselle tielle
    const { reaching, starts } = roadsToParcel(auto, parts);
    let route = null;
    if (reaching.some(l => isPublic(l.props))) route = { length: 0, linkIds: [] };
    else if (reaching.length) {
        route = routeToPublic(buildGraph(auto), starts, { maxLength: MAX_ROUTE });
        if (!route) {
            const far = await roads.links(grow(all, FAR)).catch(() => null);
            if (far) {
                partial = partial || far.partial;
                all3 = prep(far.links);
                auto = all3.filter(l => l.kind === 'auto');
                route = routeToPublic(buildGraph(auto), starts, { maxLength: MAX_ROUTE });
            }
        }
    }

    // Rajoitukset kiinteistölle tulevilla teillä ja reitillä
    const routeIds = new Set([...(route?.linkIds || []), ...reaching.map(l => l.linkId ?? l.id)]);
    const routeLinks = auto.filter(l => routeIds.has(l.linkId ?? l.id));
    let rajoitukset = [], tiekunta = false;
    if (routeLinks.length) {
        const rbox = routeLinks.map(l => l.box).reduce((a, b) => ({
            minX: Math.min(a.minX, b.minX), minY: Math.min(a.minY, b.minY),
            maxX: Math.max(a.maxX, b.maxX), maxY: Math.max(a.maxY, b.maxY)
        }));
        const r = await roads.restrictions(grow(rbox, 10)).catch(() => null);
        if (r) {
            partial = partial || r.partial;
            for (const id of routeIds) {
                if (r.tiekunta.has(id)) tiekunta = true;
                const k = r.kelirikko.get(id);
                if (k) rajoitukset.push({ tyyppi: 'kelirikko', ...k });
                const m = r.massa.get(id);
                if (m) rajoitukset.push({ tyyppi: 'massa', ...m });
            }
            // Sama rajoitus monella linkillä näytetään kerran
            const seen = new Set();
            rajoitukset = rajoitukset.filter(x => {
                const k = `${x.tyyppi}|${x.kg}|${x.alku}|${x.loppu}`;
                return !seen.has(k) && seen.add(k);
            }).sort((a, b) => a.kg - b.kg);
        }
    }
    const reachesParcel = reaching.length > 0;
    const Y = connectionScore({ reachesParcel, route, restricted: rajoitukset.length > 0 });

    // Kuviot
    const ras = await rasterP;
    const kuviot = new Map();
    features.forEach((f, i) => {
        const g = f.geometry;
        if (!g) return;
        const pts = samplePoints(g);
        const dists = pts.map(p => Math.min(index.nearest(p)?.dist ?? NEAR, NEAR));
        const meanDist = dists.length ? dists.reduce((a, b) => a + b, 0) / dists.length : null;
        const sbox = bboxOf([g]);
        const tieKuviolla = auto.some(l => overlaps(l.box, sbox) && lineCrossesPolygon(l.coords, g));
        const shares = ras ? classShares(ras, g) : null;
        const fromMap = soilScore(shares);
        const M = fromMap ?? attributeScore(f.properties?.ACCESSIBILITY);
        const K = haulScore(meanDist);
        kuviot.set(i, {
            ...combine({ M, K, Y }),
            M, K, Y,
            meanDist: meanDist == null ? null : Math.round(meanDist),
            tieKuviolla,
            paaluokka: mainClass(shares),
            maapohjaLahde: fromMap != null ? 'kartta' : M != null ? 'kuvio' : null
        });
    });

    const view = grow(all, 500);
    return {
        tie: { reachesParcel, route, tiekunta, rajoitukset },
        kuviot,
        lahteet: { alue: await areaP, rasteri: Boolean(ras) },
        partial,
        tiet: all3.filter(l => l.kind && overlaps(l.box, view)),
        reitti: auto.filter(l => (route?.linkIds || []).includes(l.linkId ?? l.id))
    };
}
