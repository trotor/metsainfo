/**
 * Hinta-arvion muotoilu ja jaettava raportti (puhtaita funktioita).
 * Tekstit: js/ui/estimate-teksti.js (#24).
 */

import { METHODS, SPECIES } from './prices.js';
import { locale } from '../i18n.js';
import { T } from '../ui/estimate-teksti.js';

export const METHOD_LABELS = T.hakkuutavat;

export const SPECIES_LABELS = T.puulajit;

const num = (value, decimals, loc = locale()) => new Intl.NumberFormat(loc, {
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
    return T.euro(num(Math.round((value || 0) / 100) * 100, 0));
}

export function formatPrice(value) {
    return value === null || value === undefined ? '' : num(value, 2);
}

export function yearRangeLabel(byYear) {
    const years = byYear.map(y => y.year).filter(y => y !== null && y !== undefined);
    if (years.length === 0) return '';
    const min = Math.min(...years);
    const max = Math.max(...years);
    return min === max ? String(min) : `${min}–${max}`;
}

// Raportin luvut aina suomalaisittain (desimaalipilkku), kielestä riippumatta
const csvNumber = (v, d) => (v === null || v === undefined ? '' : num(v, d, 'fi-FI').replace(/\s/g, ''));

/** Jaettava raportti (CSV, puolipiste ja desimaalipilkku taulukkolaskentaa varten). */
export function buildEstimateReport({ label, regionName, prices, table, estimate, valinta = false }) {
    const R = T.raportti;
    const lines = [
        R.otsikko,
        `${valinta ? R.valinta : R.kiinteisto};${label}`,
        `${R.hintaAlue};${regionName}`,
        `${R.hinnat};${prices?.source || R.omatHinnat} ${prices?.periodLabel || ''}`.trim(),
        `${R.yhteensa};${Math.round(estimate.total)}`,
        `${R.kokoPuusto};${Math.round(estimate.stock.value)}`,
        ...((estimate.missing || estimate.stock?.missing)
            ? [`${R.huom};${R.vajaa(Math.max(estimate.missing || 0, estimate.stock?.missing || 0))}`]
            : []),
        '',
        R.hintaSarakkeet.join(';')
    ];
    for (const m of METHODS) for (const s of SPECIES) {
        lines.push(`${METHOD_LABELS[m]};${SPECIES_LABELS[s].split(' ')[0]};${csvNumber(table[m][s].tukki, 2)};${csvNumber(table[m][s].kuitu, 2)}`);
    }
    lines.push('', R.kuvioSarakkeet.join(';'));
    for (const p of estimate.plans) {
        lines.push(`${p.standNumber ?? ''};${p.year ?? ''};${METHOD_LABELS[p.method]};${csvNumber(p.area, 2)};${Math.round(p.value)}`);
    }
    lines.push('', R.loppu);
    return lines.join('\n');
}
