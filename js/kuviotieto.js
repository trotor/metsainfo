/**
 * Kuvion tietojen tulkinta, jota useampi toiminto käyttää (maastotila,
 * lähihaku). Ei riipu yhdestäkään toiminnosta, jotta ne voi irrottaa
 * omiksi lisäosikseen (js/features.js).
 */

import { containsPoint } from './location/logic.js';

const CONIFERS = new Set([1, 2, 8, 10, 11, 12, 14, 16, 19, 22, 23, 30]);
const BIRCHES = new Set([3, 4, 27]);

/** Puulajiryhmä: manty, kuusi, koivu, lehti tai null (ei varmaa ryhmää). */
export function speciesGroup(code) {
    if (code === 1) return 'manty';
    if (code === 2) return 'kuusi';
    if (BIRCHES.has(code)) return 'koivu';
    if (code === 29) return null; // "Lehtipuu" ilman lajia: voi olla koivu
    if (code != null && !CONIFERS.has(code)) return 'lehti';
    return null;
}

/**
 * Pääpuulajin (MAINTREESPECIES) oma osuus puustosta (0–1), null jos
 * osuuksia ei ole. Metsäkeskuksen pääpuulaji voi olla eri kuin runsain
 * laji (esim. kuusitaimikko, jossa lehtipuuta on enemmän), joten osuus
 * lasketaan nimenomaan pääpuulajista.
 */
export function mainShare(p) {
    const shares = p?.SPECIESSHARES;
    if (!shares?.length || p.MAINTREESPECIES == null) return null;
    return shares.find(s => s.species === p.MAINTREESPECIES)?.share ?? 0;
}

/** Onko pääpuulaji selvästi vallitseva (vähintään 60 % ja runsain laji). */
export function clearlyDominant(p) {
    const share = mainShare(p);
    return share != null && share >= 0.6 && p.SPECIESSHARES[0].species === p.MAINTREESPECIES;
}

/**
 * Piste kuvion sisältä (EPSG:3067): rajojen keskipiste, jos se on kuviolla,
 * muuten ensimmäinen kuvion sisällä oleva piste tiheästä ruudukosta.
 * Kaarevan tai rengasmaisen kuvion keskipiste voi olla kuvion ulkopuolella.
 */
export function pointInside(geometry) {
    const rings = geometry?.type === 'Polygon' ? geometry.coordinates
        : geometry?.type === 'MultiPolygon' ? geometry.coordinates.flat() : [];
    const pts = rings.flat();
    if (!pts.length) return null;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const round = ([x, y]) => [Math.round(x), Math.round(y)];
    const center = [(minX + maxX) / 2, (minY + maxY) / 2];
    if (containsPoint(geometry, center)) return round(center);
    const n = 15;
    for (let i = 1; i < n; i++) {
        for (let j = 1; j < n; j++) {
            const p = [minX + (maxX - minX) * i / n, minY + (maxY - minY) * j / n];
            if (containsPoint(geometry, p)) return round(p);
        }
    }
    return round(center);
}
