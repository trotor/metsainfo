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
import { locale } from '../i18n.js';
import { codeName } from '../koodit.js';
import { INDICATOR } from './paikka.js';
import { T } from './teksti.js';
import { speciesGroup, mainShare, clearlyDominant } from '../kuviotieto.js';

export const LEVELS = ['helppo', 'keski', 'vaikea'];
export const POINTS = { helppo: 10, keski: 20, vaikea: 30, havainto: 5, uusiKuvio: 5, putkiBonus: 5 };
export const STREAK_BONUS_FROM = 3;

/* ---------- Luokittelut ---------- */

export { speciesGroup };

const fmt = (v, d = 0) => formatNumber(v, d, locale());

const SPECIES_OPTIONS = T.lajit;

const STAGE = { T1: 'taimikko', T2: 'taimikko', Y1: 'taimikko', '02': 'nuori', '03': 'varttunut', '04': 'kypsa' };
const STAGE_OPTIONS = T.vaiheet;
const STAGE_EXPLAIN = T.vaiheSelitys;

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
    const opts = [{ value: 0, label: T.alle(fmt(bounds[0]), unit) }];
    for (let i = 1; i < bounds.length; i++) {
        opts.push({ value: i, label: `${fmt(bounds[i - 1])}–${fmt(bounds[i])} ${unit}` });
    }
    opts.push({ value: bounds.length, label: T.yli(fmt(bounds[bounds.length - 1]), unit) });
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
    const share = mainShare(p);
    if (forest && group && clearlyDominant(p)) {
        const name = codeName('treeSpecies', p.MAINTREESPECIES);
        qs.push(choice('puulaji', 'helppo', T.q.puulaji, SPECIES_OPTIONS, group,
            T.q.puulajiSelitys(name, fmt(share * 100))));
    }
    const stage = STAGE[p.DEVELOPMENTCLASS];
    if (forest && stage) {
        qs.push(choice('vaihe', 'helppo', T.q.vaihe, STAGE_OPTIONS, stage, STAGE_EXPLAIN[stage]));
    }

    // Keskitaso: pituus, ikä, maaperä
    const h = bucketOf(p.MEANHEIGHT, HEIGHT_BOUNDS, 1);
    if (forest && h != null) {
        qs.push(choice('pituus', 'keski', T.q.pituus, bucketOptions(HEIGHT_BOUNDS, 'm'), h,
            T.q.pituusSelitys(fmt(p.MEANHEIGHT, 1))));
    }
    const a = bucketOf(p.MEANAGE, AGE_BOUNDS, 3);
    if (forest && a != null) {
        qs.push(choice('ika', 'keski', T.q.ika, bucketOptions(AGE_BOUNDS, T.vuotta), a,
            T.q.ikaSelitys(fmt(p.MEANAGE))));
    }
    if (p.SOILTYPE != null && CODES.soilType[p.SOILTYPE]) {
        const peat = p.SOILTYPE >= 60 && p.SOILTYPE < 70;
        qs.push(choice('maa', 'keski', T.q.maa, [
            { value: 'kivennainen', label: T.q.kivennainen },
            { value: 'turve', label: T.q.turve }
        ], peat ? 'turve' : 'kivennainen', T.q.maaSelitys(codeName('soilType', p.SOILTYPE))));
    }

    // Vaikea: kasvupaikka (vain kankailla) ja tilavuus
    if (forest && p.SUBGROUP === 1 && FERTILITY_ORDER.includes(p.FERTILITYCLASS)) {
        const i = FERTILITY_ORDER.indexOf(p.FERTILITYCLASS);
        const start = Math.max(0, Math.min(i - 1, FERTILITY_ORDER.length - 4));
        const options = FERTILITY_ORDER.slice(start, start + 4).map(c => ({ value: c, label: codeName('fertilityClass', c) }));
        qs.push(choice('kasvupaikka', 'vaikea', T.q.kasvupaikka, options, p.FERTILITYCLASS,
            T.q.kasvupaikkaSelitys(codeName('fertilityClass', p.FERTILITYCLASS), INDICATOR[p.FERTILITYCLASS])));
    }
    const v = bucketOf(p.VOLUME, VOLUME_BOUNDS, 10);
    if (forest && v != null && p.VOLUME >= 1) {
        qs.push(choice('tilavuus', 'vaikea', T.q.tilavuus, bucketOptions(VOLUME_BOUNDS, 'm³'), v,
            T.q.tilavuusSelitys(fmt(p.VOLUME))));
    }

    // Havainto: tieto vs. mitä käyttäjä näkee (kaikilla tasoilla)
    const mainName = codeName('treeSpecies', p.MAINTREESPECIES);
    if (forest && mainName && p.MEANHEIGHT) {
        qs.push({
            id: 'havainto', level: 'havainto', kind: 'observe', points: POINTS.havainto,
            text: T.q.havainto(mainShare(p) == null || clearlyDominant(p) ? mainName : null, fmt(p.MEANHEIGHT)),
            options: [
                { value: 'kylla', label: T.q.kylla },
                { value: 'ei', label: T.q.ei },
                { value: 'eos', label: T.q.eos }
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
