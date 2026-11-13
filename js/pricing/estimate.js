/**
 * Puukaupan hinta-arvio Metsäkeskuksen kuviotiedoista ja kantohinnoista.
 *
 * Kuviolla on tukki- ja kuitupuun määrä (m³/ha) ja puulajiosuudet, mutta ei
 * puulajikohtaista tukki/kuitu-jakoa: se johdetaan osuuksista. "Muut"
 * puulajit hinnoitellaan koivun hinnoilla.
 */

/** Harvennusten poistumaoletukset (osuus puustosta); näytetään käyttäjälle. */
export const DEFAULT_REMOVAL = { uudistus: 1.0, harvennus: 0.30, ensiharvennus: 0.35 };

const ENSIHARVENNUS = new Set([2, 20]);
const HARVENNUS = new Set([3, 11, 13, 14, 94]);
const UUDISTUS = new Set([1, 4, 5, 6, 7, 8, 12, 15, 93]);

/** Metsäkeskuksen hakkuutyyppi → hintojen hakkuutapa tai null. */
export function cuttingMethod(code) {
    if (ENSIHARVENNUS.has(code)) return 'ensiharvennus';
    if (HARVENNUS.has(code)) return 'harvennus';
    if (UUDISTUS.has(code)) return 'uudistus';
    return null;
}

/** Puulajiosuudet (summa 1) tai null, jos tietoa ei ole. */
export function speciesShares(p) {
    const pine = p.PROPORTIONPINE || 0;
    const spruce = p.PROPORTIONSPRUCE || 0;
    const other = p.PROPORTIONOTHER || 0;
    const sum = pine + spruce + other;
    if (sum > 0) return { manty: pine / sum, kuusi: spruce / sum, koivu: other / sum };
    switch (p.MAINTREESPECIES) {
        case 1: case 8: case 12: return { manty: 1, kuusi: 0, koivu: 0 };
        case 2: case 10: case 14: case 16: return { manty: 0, kuusi: 1, koivu: 0 };
        case undefined: case null: return null;
        default: return { manty: 0, kuusi: 0, koivu: 1 };
    }
}

/**
 * Kuvion arvo yhden hakkuutavan hinnoilla (prices = taulukko[hakkuutapa]).
 * missing = jokin tarvittu hinta puuttuu (sen osuus jää pois).
 */
export function standValue(p, prices) {
    const area = p.AREA || 0;
    const log = (p.SAWLOGVOLUME || 0) * area;
    const pulp = (p.PULPWOODVOLUME || 0) * area;
    const shares = speciesShares(p);
    if (!shares || (log === 0 && pulp === 0)) return { value: 0, missing: false };
    let value = 0;
    let missing = false;
    for (const s of Object.keys(shares)) {
        const share = shares[s];
        if (share === 0) continue;
        for (const [volume, price] of [[log, prices[s].tukki], [pulp, prices[s].kuitu]]) {
            if (volume === 0) continue;
            if (price === null || price === undefined) { missing = true; continue; }
            value += share * volume * price;
        }
    }
    return { value, missing };
}

/**
 * Kiinteistön arvio: ehdotetut hakkuut (poistumilla) vuosittain sekä koko
 * puuston arvo uudistushakkuun hinnoin.
 */
export function estimateParcel(features, table, { removal = DEFAULT_REMOVAL } = {}) {
    const plans = [];
    const stock = { value: 0, missing: 0 };
    let missing = 0;

    for (const f of features) {
        const p = f.properties || {};
        const s = standValue(p, table.uudistus);
        stock.value += s.value;
        if (s.missing) stock.missing++;

        const method = cuttingMethod(p.CUTTINGTYPE);
        if (!method) continue;
        const v = standValue(p, table[method]);
        if (v.missing) missing++;
        plans.push({
            standNumber: p.STANDNUMBER ?? null,
            year: p.CUTTINGPROPOSALYEAR ?? null,
            method,
            area: p.AREA || 0,
            value: v.value * (removal[method] ?? 1),
            missing: v.missing
        });
    }

    const years = new Map();
    for (const plan of plans) {
        const y = years.get(plan.year) || { year: plan.year, value: 0, count: 0 };
        y.value += plan.value;
        y.count++;
        years.set(plan.year, y);
    }
    // Vuodettomat viimeisiksi
    const byYear = [...years.values()].sort((a, b) =>
        (a.year ?? Infinity) - (b.year ?? Infinity));

    return {
        plans,
        byYear,
        total: plans.reduce((a, p) => a + p.value, 0),
        stock,
        missing
    };
}
