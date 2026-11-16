/**
 * Metsävisa: kysymykset muodostetaan kuvion tiedoista ja Metsäkeskuksen
 * koodistosta säännöillä, ei kielimallilla, jotta oikea vastaus on aina
 * se, mitä tiedoissa lukee. Kysymys jätetään pois, jos tieto puuttuu tai
 * on niin lähellä luokkarajaa, ettei vastausta voi maastossa erottaa.
 *
 * Tiedot ovat inventoinnista ja laskennallisesta ennusteesta, eivät
 * maastototuus. Siksi mukana on myös havaintokysymys: "Vastaako tämä
 * sitä, mitä näet?"
 */

import { CODES } from '../config.js';
import { formatNumber } from '../utils.js';
import { dominantShare, INDICATOR } from './paikka.js';

export const LEVELS = ['helppo', 'keski', 'vaikea'];
export const POINTS = { helppo: 10, keski: 20, vaikea: 30, havainto: 5, uusiKuvio: 5, putkiBonus: 5 };
export const STREAK_BONUS_FROM = 3;

/* ---------- Luokittelut ---------- */

const CONIFERS = new Set([1, 2, 8, 10, 11, 12, 14, 16, 19, 22, 23, 30]);
const BIRCHES = new Set([3, 4, 27]);

/** Puulajiryhmä visaan: manty, kuusi, koivu, lehti tai null (ei kysytä). */
export function speciesGroup(code) {
    if (code === 1) return 'manty';
    if (code === 2) return 'kuusi';
    if (BIRCHES.has(code)) return 'koivu';
    if (code === 29) return null; // "Lehtipuu" ilman lajia: voi olla koivu, ei kysytä
    if (code != null && !CONIFERS.has(code)) return 'lehti';
    return null;
}

const SPECIES_OPTIONS = [
    { value: 'manty', label: 'Mänty' },
    { value: 'kuusi', label: 'Kuusi' },
    { value: 'koivu', label: 'Koivu' },
    { value: 'lehti', label: 'Muu lehtipuu (esim. haapa tai leppä)' }
];

const STAGE = { T1: 'taimikko', T2: 'taimikko', Y1: 'taimikko', '02': 'nuori', '03': 'varttunut', '04': 'kypsa' };
const STAGE_OPTIONS = [
    { value: 'taimikko', label: 'Taimikko' },
    { value: 'nuori', label: 'Nuori kasvatusmetsä' },
    { value: 'varttunut', label: 'Varttunut kasvatusmetsä' },
    { value: 'kypsa', label: 'Uudistuskypsä metsä' }
];
const STAGE_EXPLAIN = {
    taimikko: 'Taimikossa puut ovat nuoria ja ohuita, rinnankorkeudelta alle 8 cm.',
    nuori: 'Nuoressa kasvatusmetsässä puiden keskiläpimitta on noin 8–16 cm. Ensiharvennus tehdään tässä vaiheessa.',
    varttunut: 'Varttuneessa kasvatusmetsässä puiden keskiläpimitta on yli 16 cm, mutta metsä ei ole vielä uudistuskypsä.',
    kypsa: 'Uudistuskypsä metsä on niin vanha tai järeä, että se voidaan uudistaa.'
};

/**
 * Lukuarvon luokat [raja, raja, …]. Arvo luokitellaan vain, jos se on
 * vähintään `margin` päässä jokaisesta rajasta.
 */
export function bucketOf(value, bounds, margin) {
    if (value == null || Number.isNaN(value)) return null;
    if (bounds.some(b => Math.abs(value - b) < margin)) return null;
    let i = 0;
    while (i < bounds.length && value >= bounds[i]) i++;
    return i;
}

function bucketOptions(bounds, unit) {
    const fmt = (v) => formatNumber(v, 0);
    const opts = [{ value: 0, label: `alle ${fmt(bounds[0])} ${unit}` }];
    for (let i = 1; i < bounds.length; i++) {
        opts.push({ value: i, label: `${fmt(bounds[i - 1])}–${fmt(bounds[i])} ${unit}` });
    }
    opts.push({ value: bounds.length, label: `yli ${fmt(bounds[bounds.length - 1])} ${unit}` });
    return opts;
}

const HEIGHT_BOUNDS = [5, 12, 20];
const AGE_BOUNDS = [20, 40, 70];
const VOLUME_BOUNDS = [50, 150, 250];
const FERTILITY_ORDER = [1, 2, 3, 4, 5, 6];

/* ---------- Kysymykset ---------- */

function choice(id, level, text, options, answer, explain) {
    return { id, level, kind: 'choice', text, options, answer, explain, points: POINTS[level] };
}

/** Kaikki kysymykset, jotka tästä kuviosta voi kysyä, tasoittain. */
export function questionsFor(p) {
    if (!p) return [];
    const qs = [];
    const forest = p.MAINGROUP == null || p.MAINGROUP === 1;

    // Helppo: pääpuulaji ja kehitysvaihe
    const group = speciesGroup(p.MAINTREESPECIES);
    const share = dominantShare(p);
    if (forest && group && share != null && share >= 0.6) {
        const name = CODES.treeSpecies[p.MAINTREESPECIES];
        qs.push(choice('puulaji', 'helppo', 'Mikä puulaji on tällä kuviolla vallitseva?', SPECIES_OPTIONS, group,
            `Tietojen mukaan pääpuulaji on ${name.toLowerCase()}, noin ${formatNumber(share * 100, 0)} % puustosta.`));
    }
    const stage = STAGE[p.DEVELOPMENTCLASS];
    if (forest && stage) {
        qs.push(choice('vaihe', 'helppo', 'Missä kehitysvaiheessa tämä metsä on?', STAGE_OPTIONS, stage, STAGE_EXPLAIN[stage]));
    }

    // Keskitaso: pituus, ikä, maaperä
    const h = bucketOf(p.MEANHEIGHT, HEIGHT_BOUNDS, 1);
    if (forest && h != null) {
        qs.push(choice('pituus', 'keski', 'Kuinka pitkiä puut ovat täällä keskimäärin?', bucketOptions(HEIGHT_BOUNDS, 'm'), h,
            `Puiden keskipituus on tietojen mukaan ${formatNumber(p.MEANHEIGHT, 1)} m.`));
    }
    const a = bucketOf(p.MEANAGE, AGE_BOUNDS, 3);
    if (forest && a != null) {
        qs.push(choice('ika', 'keski', 'Kuinka vanhaa puusto on keskimäärin?', bucketOptions(AGE_BOUNDS, 'vuotta'), a,
            `Puuston keski-ikä on tietojen mukaan noin ${formatNumber(p.MEANAGE, 0)} vuotta.`));
    }
    if (p.SOILTYPE != null && CODES.soilType[p.SOILTYPE]) {
        const peat = p.SOILTYPE >= 60 && p.SOILTYPE < 70;
        qs.push(choice('maa', 'keski', 'Onko maa tässä kivennäismaata vai turvetta?', [
            { value: 'kivennainen', label: 'Kivennäismaata (hiekkaa, moreenia)' },
            { value: 'turve', label: 'Turvetta (suota tai ojitettua suota)' }
        ], peat ? 'turve' : 'kivennainen', `Maalaji on tietojen mukaan ${CODES.soilType[p.SOILTYPE].toLowerCase()}.`));
    }

    // Vaikea: kasvupaikka (vain kankailla) ja tilavuus
    if (forest && p.SUBGROUP === 1 && FERTILITY_ORDER.includes(p.FERTILITYCLASS)) {
        const i = FERTILITY_ORDER.indexOf(p.FERTILITYCLASS);
        const start = Math.max(0, Math.min(i - 1, FERTILITY_ORDER.length - 4));
        const options = FERTILITY_ORDER.slice(start, start + 4).map(c => ({ value: c, label: CODES.fertilityClass[c] }));
        qs.push(choice('kasvupaikka', 'vaikea', 'Mikä kasvupaikka tämä on? Katso varvikkoa ja aluskasvillisuutta.', options, p.FERTILITYCLASS,
            `Tietojen mukaan kasvupaikka on ${CODES.fertilityClass[p.FERTILITYCLASS].toLowerCase()}. ${INDICATOR[p.FERTILITYCLASS]}`));
    }
    const v = bucketOf(p.VOLUME, VOLUME_BOUNDS, 10);
    if (forest && v != null && p.VOLUME >= 1) {
        qs.push(choice('tilavuus', 'vaikea', 'Paljonko puuta tällä kuviolla on hehtaarilla?', bucketOptions(VOLUME_BOUNDS, 'm³'), v,
            `Tietojen mukaan puuta on ${formatNumber(p.VOLUME, 0)} m³ hehtaarilla. Hehtaari on 100 × 100 metrin alue.`));
    }

    // Havainto: tieto vs. mitä käyttäjä näkee (kaikilla tasoilla)
    const nameLower = CODES.treeSpecies[p.MAINTREESPECIES]?.toLowerCase();
    if (forest && nameLower && p.MEANHEIGHT) {
        qs.push({
            id: 'havainto', level: 'havainto', kind: 'observe', points: POINTS.havainto,
            text: `Tietojen mukaan pääpuulaji on ${nameLower} ja puut ovat noin ${formatNumber(p.MEANHEIGHT, 0)} m pitkiä. Vastaako tämä sitä, mitä näet?`,
            options: [
                { value: 'kylla', label: 'Kyllä, vastaa' },
                { value: 'ei', label: 'Ei vastaa' },
                { value: 'eos', label: 'En osaa sanoa' }
            ]
        });
    }
    return qs;
}

/** Seuraava vastaamaton kysymys valitulla tasolla; havainto viimeisenä. */
export function nextQuestion(p, level, answered = new Set()) {
    const all = questionsFor(p).filter(q => !answered.has(q.id));
    return all.find(q => q.level === level) || all.find(q => q.kind === 'observe') || null;
}

/** Tarkistaa vastauksen ja laskee pisteet (putkibonus kolmannesta oikeasta alkaen). */
export function scoreAnswer(q, value, streak = 0) {
    if (q.kind === 'observe') return { correct: null, points: q.points, streak };
    const correct = value === q.answer;
    const nextStreak = correct ? streak + 1 : 0;
    const bonus = correct && nextStreak >= STREAK_BONUS_FROM ? POINTS.putkiBonus : 0;
    return { correct, points: correct ? q.points + bonus : 0, streak: nextStreak, bonus };
}

export function answerLabel(q) {
    return q.options.find(o => o.value === q.answer)?.label ?? '';
}
