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
 * parts = puutavaralajit { species, assortment, volume, price } erittelyä varten.
 */
export function standValue(p, prices) {
    const area = p.AREA || 0;
    const log = (p.SAWLOGVOLUME || 0) * area;
    const pulp = (p.PULPWOODVOLUME || 0) * area;
    const shares = speciesShares(p);
    if (!shares || (log === 0 && pulp === 0)) return { value: 0, missing: false, log, pulp, parts: [] };
    let value = 0;
    let missing = false;
    const parts = [];
    for (const s of Object.keys(shares)) {
        const share = shares[s];
        if (share === 0) continue;
        for (const [assortment, volume] of [['tukki', log], ['kuitu', pulp]]) {
            if (volume === 0) continue;
            const price = prices[s][assortment];
            const known = price !== null && price !== undefined;
            parts.push({ species: s, assortment, volume: share * volume, price: known ? price : null });
            if (!known) { missing = true; continue; }
            value += share * volume * price;
        }
    }
    return { value, missing, log, pulp, parts };
}

/** Kerää puutavaralajirivit (hakkuutapa + puulaji + tukki/kuitu) yhteen; kerroin = poistuma. */
function addParts(rows, method, parts, factor) {
    for (const part of parts) {
        const key = `${method}|${part.species}|${part.assortment}`;
        let row = rows.get(key);
        if (!row) {
            row = { method, species: part.species, assortment: part.assortment, volume: 0, price: part.price, value: part.price === null ? null : 0 };
            rows.set(key, row);
        }
        const volume = part.volume * factor;
        row.volume += volume;
        if (row.value !== null && part.price !== null) row.value += volume * part.price;
    }
}

const SPECIES_ORDER = ['manty', 'kuusi', 'koivu'];
const METHOD_ORDER = ['uudistus', 'harvennus', 'ensiharvennus'];
const sortRows = (rows) => [...rows.values()].filter(r => r.volume > 0).sort((a, b) =>
    METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method)
    || SPECIES_ORDER.indexOf(a.species) - SPECIES_ORDER.indexOf(b.species)
    || (a.assortment === 'tukki' ? -1 : 1));

/**
 * Kiinteistön arvio: ehdotetut hakkuut (poistumilla) vuosittain sekä koko
 * puuston arvo uudistushakkuun hinnoin.
 */
export function estimateParcel(features, table, { removal = DEFAULT_REMOVAL } = {}) {
    const plans = [];
    const stock = { value: 0, missing: 0, volume: 0, area: 0 };
    const planRows = new Map();
    const stockRows = new Map();
    let missing = 0;

    for (const f of features) {
        const p = f.properties || {};
        const s = standValue(p, table.uudistus);
        stock.value += s.value;
        stock.volume += s.log + s.pulp;
        stock.area += p.AREA || 0;
        addParts(stockRows, 'uudistus', s.parts, 1);
        if (s.missing) stock.missing++;

        const method = cuttingMethod(p.CUTTINGTYPE);
        if (!method) continue;
        const v = standValue(p, table[method]);
        if (v.missing) missing++;
        const share = removal[method] ?? 1;
        addParts(planRows, method, v.parts, share);
        plans.push({
            standNumber: p.STANDNUMBER ?? null,
            year: p.CUTTINGPROPOSALYEAR ?? null,
            method,
            area: p.AREA || 0,
            removal: share,
            log: v.log * share,
            pulp: v.pulp * share,
            value: v.value * share,
            missing: v.missing
        });
    }
    stock.assortments = sortRows(stockRows);

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
        /** Myytävä m³ (poistumilla) ja ehdotettujen kuvioiden pinta-ala keskiarvoja varten */
        volume: plans.reduce((a, p) => a + p.log + p.pulp, 0),
        area: plans.reduce((a, p) => a + p.area, 0),
        assortments: sortRows(planRows),
        stock,
        missing
    };
}

/**
 * Hakkuuehdotukset ilman hintoja (houkutin ennen ostoa): määrä, myytävä
 * kertymä (tukki + kuitu, poistumilla), vuodet ja koko puuston kertymä.
 */
export function cuttingSummary(features, { removal = DEFAULT_REMOVAL } = {}) {
    let count = 0;
    let volume = 0;
    let stockVolume = 0;
    const years = new Set();
    for (const f of features) {
        const p = f.properties || {};
        const v = ((p.SAWLOGVOLUME || 0) + (p.PULPWOODVOLUME || 0)) * (p.AREA || 0);
        stockVolume += v;
        const method = cuttingMethod(p.CUTTINGTYPE);
        if (!method) continue;
        count++;
        volume += v * (removal[method] ?? 1);
        if (p.CUTTINGPROPOSALYEAR !== null && p.CUTTINGPROPOSALYEAR !== undefined) years.add(p.CUTTINGPROPOSALYEAR);
    }
    return { count, volume, years: [...years].sort((a, b) => a - b), stockVolume };
}
