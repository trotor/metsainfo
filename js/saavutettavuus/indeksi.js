/**
 * Saavutettavuusindeksin pisteytys (versio 1, painot säädetään kokemuksen
 * mukaan; docs/plans/2026-11-16-saavutettavuus-kokeilu.md). Puhtaat funktiot.
 */

// Korjuukelpoisuuskartan luokat: 1 kelirikko … 6 talvi (254 vesistö ei mukana)
export const SOIL_POINTS = { 1: 100, 2: 80, 3: 60, 4: 50, 5: 35, 6: 20 };
// Kuvion oma tieto (CODES.accessibility): 1 ympärivuotinen … 4 vain maa jäässä
export const ATTRIBUTE_POINTS = { 1: 100, 2: 70, 3: 50, 4: 20 };
export const WEIGHTS = { M: 0.4, K: 0.4, Y: 0.2 };
export const HAUL = { best: 100, worst: 1000 }; // m
export const RESTRICTION_PENALTY = 20;

/** Luokkien pinta-alaosuuksista painotettu keskiarvo; null, jos ei maaluokkia. */
export function soilScore(shares) {
    let sum = 0, weight = 0;
    for (const [cls, share] of Object.entries(shares || {})) {
        const points = SOIL_POINTS[cls];
        if (points == null || !share) continue;
        sum += points * share;
        weight += share;
    }
    return weight ? sum / weight : null;
}

export function attributeScore(accessibility) {
    return ATTRIBUTE_POINTS[Number(accessibility)] ?? null;
}

export function haulScore(meanDist) {
    if (meanDist == null || !Number.isFinite(meanDist)) return null;
    const t = (meanDist - HAUL.best) / (HAUL.worst - HAUL.best);
    return 100 * (1 - Math.max(0, Math.min(1, t)));
}

export function connectionScore({ reachesParcel, route, restricted }) {
    const base = !reachesParcel ? 0 : route ? 100 : 60;
    return Math.max(0, base - (restricted && reachesParcel ? RESTRICTION_PENALTY : 0));
}

export function classOf(score) {
    if (score >= 70) return 'hyva';
    if (score >= 40) return 'kohtalainen';
    return 'heikko';
}

/** Puuttuvat osat jätetään pois ja muiden painot skaalataan. */
export function combine(parts) {
    let sum = 0, weight = 0;
    const puuttuu = [];
    for (const [k, w] of Object.entries(WEIGHTS)) {
        const v = parts[k];
        if (v == null || !Number.isFinite(v)) { puuttuu.push(k); continue; }
        sum += v * w;
        weight += w;
    }
    if (!weight) return { score: null, luokka: null, puuttuu };
    const score = Math.round(sum / weight);
    return { score, luokka: classOf(score), puuttuu };
}
