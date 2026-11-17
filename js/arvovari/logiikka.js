/**
 * Puuston arvo €/ha kuvion värittämiseen (kokeilu, #35). Sama laskenta kuin
 * hinta-arvion "Koko puusto uudistushakkuun hinnoin" (js/pricing/estimate.js).
 */

import { standValue } from '../pricing/estimate.js';

export const RAJAT = [2000, 5000, 8000, 12000]; // €/ha
export const VARIT = ['#fef3c7', '#fcd34d', '#f59e0b', '#b45309', '#78350f'];

/** { perHa, total, missing } tai null, jos kuviolla ei ole pinta-alaa. */
export function valuePerHa(p, table) {
    const area = Number(p.AREA) || 0;
    if (area <= 0) return null;
    const { value, missing } = standValue(p, table.uudistus);
    return { perHa: value / area, total: value, missing };
}

export function classIndex(perHa) {
    let i = 0;
    while (i < RAJAT.length && perHa >= RAJAT[i]) i++;
    return i;
}
