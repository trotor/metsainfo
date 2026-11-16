/**
 * Kuvion tietojen tulkinta, jota useampi toiminto käyttää (maastotila,
 * lähihaku). Ei riipu yhdestäkään toiminnosta, jotta ne voi irrottaa
 * omiksi lisäosikseen (js/features.js).
 */

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
