/**
 * Kantohinnat Luken tilastotietokannasta (PxWeb, json-stat2):
 * - viikko: Metsäteollisuus ry:n puukaupan viikkoseuranta (met/metryv/0100_metryv.px)
 * - kuukausi: Luke, Teollisuuspuun kauppa (SVT, CC BY 4.0; met/teokau/kk/0100_teokau.px)
 *
 * Hintataulukko: { uudistus|harvennus|ensiharvennus: { manty|kuusi|koivu: { tukki, kuitu } } }
 * Arvo on €/m³ tai null, jos tietoa ei ole.
 */

export const METHODS = ['uudistus', 'harvennus', 'ensiharvennus'];
export const SPECIES = ['manty', 'kuusi', 'koivu'];
const ASSORTMENTS = ['tukki', 'kuitu'];

export const WEEKLY_URL = 'https://statdb.luke.fi/PxWeb/api/v1/fi/LUKE/met/metryv/0100_metryv.px';
export const MONTHLY_URL = 'https://statdb.luke.fi/PxWeb/api/v1/fi/LUKE/met/teokau/kk/0100_teokau.px';

const WEEKLY_CODES = {
    method: { uudistus: '8021', harvennus: '8023', ensiharvennus: '8022' },
    product: {
        manty: { tukki: 'N1', kuitu: 'N4' },
        kuusi: { tukki: 'N2', kuitu: 'N5' },
        koivu: { tukki: 'N3', kuitu: 'N6' }
    }
};

const MONTHLY_CODES = {
    method: { uudistus: 'UUD', harvennus: 'HAR', ensiharvennus: 'ENS' },
    product: {
        manty: { tukki: 'TUK_MA', kuitu: 'KUI_MA' },
        kuusi: { tukki: 'TUK_KU', kuitu: 'KUI_KU' },
        koivu: { tukki: 'TUK_KO', kuitu: 'KUI_KO' }
    }
};

const productCodes = (codes) => SPECIES.flatMap(s => ASSORTMENTS.map(a => codes.product[s][a]));

export function emptyTable() {
    const t = {};
    for (const m of METHODS) {
        t[m] = {};
        for (const s of SPECIES) t[m][s] = { tukki: null, kuitu: null };
    }
    return t;
}

export function weeklyQuery(regionCodes, weeks = 4) {
    return {
        query: [
            { code: 'W', selection: { filter: 'top', values: [String(weeks)] } },
            { code: 'MPKH', selection: { filter: 'item', values: regionCodes } },
            { code: 'HAKT', selection: { filter: 'item', values: METHODS.map(m => WEEKLY_CODES.method[m]) } },
            { code: 'PTL', selection: { filter: 'item', values: productCodes(WEEKLY_CODES) } }
        ],
        response: { format: 'json-stat2' }
    };
}

export function monthlyQuery(regionCodes) {
    return {
        query: [
            { code: 'INFO', selection: { filter: 'item', values: ['E_M3'] } },
            { code: 'M', selection: { filter: 'top', values: ['1'] } },
            { code: 'MPKH', selection: { filter: 'item', values: regionCodes } },
            { code: 'KAUP', selection: { filter: 'item', values: METHODS.map(m => MONTHLY_CODES.method[m]) } },
            { code: 'PTL', selection: { filter: 'item', values: productCodes(MONTHLY_CODES) } }
        ],
        response: { format: 'json-stat2' }
    };
}

/** Palauttaa json-stat2-datan arvon annetuilla luokilla tai null. */
function cell(js, coords) {
    let index = 0;
    for (let i = 0; i < js.id.length; i++) {
        const dim = js.id[i];
        const pos = js.dimension[dim].category.index[coords[dim]];
        if (pos === undefined) return null;
        index = index * js.size[i] + pos;
    }
    const v = js.value[index];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Ajanjakson luokat vanhimmasta uusimpaan. */
function periods(js, dim) {
    const idx = js.dimension[dim].category.index;
    return Object.keys(idx).sort((a, b) => idx[a] - idx[b]);
}

function parse(js, regionCode, { periodDim, methodDim, codes, base }) {
    const table = emptyTable();
    const all = periods(js, periodDim).reverse(); // uusin ensin
    for (const m of METHODS) for (const s of SPECIES) for (const a of ASSORTMENTS) {
        for (const p of all) {
            const v = cell(js, { ...base, [periodDim]: p, MPKH: regionCode, [methodDim]: codes.method[m], PTL: codes.product[s][a] });
            if (v !== null) { table[m][s][a] = v; break; }
        }
    }
    return { period: all[0] ?? null, table };
}

export function parseWeekly(js, regionCode) {
    const { period, table } = parse(js, regionCode, {
        periodDim: 'W', methodDim: 'HAKT', codes: WEEKLY_CODES, base: { INFO: 'E_M3' }
    });
    const m = period && period.match(/^(\d{4})W(\d{2})$/);
    return {
        period,
        periodLabel: m ? `vko ${Number(m[2])}/${m[1]}` : '',
        source: 'Metsäteollisuus ry:n puukaupan viikkoseuranta',
        table
    };
}

export function parseMonthly(js, regionCode) {
    const { period, table } = parse(js, regionCode, {
        periodDim: 'M', methodDim: 'KAUP', codes: MONTHLY_CODES, base: { INFO: 'E_M3' }
    });
    const m = period && period.match(/^(\d{4})M(\d{2})$/);
    return {
        period,
        periodLabel: m ? `${Number(m[2])}/${m[1]}` : '',
        source: 'Luonnonvarakeskus, Teollisuuspuun kauppa',
        table
    };
}

/**
 * Täyttää ensisijaisen taulukon puuttuvat solut varalähteistä annetussa
 * järjestyksessä. Palauttaa uuden taulukon ja listan täytetyistä soluista.
 */
export function fillMissing(primary, ...fallbacks) {
    const table = emptyTable();
    const filled = [];
    for (const m of METHODS) for (const s of SPECIES) for (const a of ASSORTMENTS) {
        let v = primary.table[m][s][a];
        if (v === null) {
            for (const f of fallbacks) {
                const fv = f?.table?.[m]?.[s]?.[a];
                if (fv !== null && fv !== undefined) {
                    v = fv;
                    filled.push({ method: m, species: s, assortment: a, source: f.source, period: f.period });
                    break;
                }
            }
        }
        table[m][s][a] = v;
    }
    return { table, filled };
}
