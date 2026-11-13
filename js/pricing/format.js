/**
 * Hinta-arvion muotoilu ja jaettava raportti (puhtaita funktioita).
 */

import { METHODS, SPECIES } from './prices.js';

export const METHOD_LABELS = {
    uudistus: 'Uudistushakkuu',
    harvennus: 'Harvennus',
    ensiharvennus: 'Ensiharvennus'
};

export const SPECIES_LABELS = {
    manty: 'Mänty',
    kuusi: 'Kuusi',
    koivu: 'Koivu ja muut'
};

const fi = (value, decimals) => new Intl.NumberFormat('fi-FI', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
}).format(value);

/** Käyttäjän syöttämä €/m³ tai null (tyhjä, virheellinen tai epärealistinen). */
export function parsePriceInput(text) {
    const s = String(text ?? '').trim().replace(/\s/g, '').replace(',', '.');
    if (s === '') return null;
    const v = Number(s);
    return Number.isFinite(v) && v >= 0 && v < 500 ? v : null;
}

/** Arvio sadan euron tarkkuudella: "≈ 99 100 €". */
export function formatEuro(value) {
    return `≈ ${fi(Math.round((value || 0) / 100) * 100, 0)} €`;
}

export function formatPrice(value) {
    return value === null || value === undefined ? '' : fi(value, 2);
}

export function yearRangeLabel(byYear) {
    const years = byYear.map(y => y.year).filter(y => y !== null && y !== undefined);
    if (years.length === 0) return '';
    const min = Math.min(...years);
    const max = Math.max(...years);
    return min === max ? String(min) : `${min}–${max}`;
}

const csvNumber = (v, d) => (v === null || v === undefined ? '' : fi(v, d).replace(/\s/g, ''));

/** Jaettava raportti (CSV, puolipiste ja desimaalipilkku taulukkolaskentaa varten). */
export function buildEstimateReport({ label, regionName, prices, table, estimate }) {
    const lines = [
        'Metsäinfo – puukaupan hinta-arvio',
        `Kiinteistö;${label}`,
        `Hinta-alue;${regionName}`,
        `Hinnat;${prices?.source || 'omat hinnat'} ${prices?.periodLabel || ''}`.trim(),
        `Ehdotetut hakkuut yhteensä (€);${Math.round(estimate.total)}`,
        `Koko puusto uudistushakkuun hinnoin (€);${Math.round(estimate.stock.value)}`,
        ...((estimate.missing || estimate.stock?.missing)
            ? [`Huom;Osalta kuvioista puuttuu hintoja (${Math.max(estimate.missing || 0, estimate.stock?.missing || 0)} kuviota), joten arvio on vajaa`]
            : []),
        '',
        'Hakkuutapa;Puulaji;Tukki (€/m³);Kuitu (€/m³)'
    ];
    for (const m of METHODS) for (const s of SPECIES) {
        lines.push(`${METHOD_LABELS[m]};${SPECIES_LABELS[s].split(' ')[0]};${csvNumber(table[m][s].tukki, 2)};${csvNumber(table[m][s].kuitu, 2)}`);
    }
    lines.push('', 'Kuvio;Vuosi;Hakkuutapa;Pinta-ala (ha);Arvio (€)');
    for (const p of estimate.plans) {
        lines.push(`${p.standNumber ?? ''};${p.year ?? ''};${METHOD_LABELS[p.method]};${csvNumber(p.area, 2)};${Math.round(p.value)}`);
    }
    lines.push('', 'Arvio on suuntaa-antava eikä korvaa puukauppatarjousta. Tukki- ja kuitupuu on jaettu puulajiosuuksien mukaan; harvennuksissa poistuma 30 %, ensiharvennuksissa 35 %.');
    return lines.join('\n');
}
