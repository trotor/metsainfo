/**
 * "Kerro tästä paikasta": kuvion tunnistus sijainnista ja tietojen
 * kertominen tavallisella kielellä. Puhdas logiikka, ei DOMia.
 * Geometria EPSG:3067:ssä.
 */

import { formatNumber } from '../utils.js';
import { locale } from '../i18n.js';
import { codeName } from '../koodit.js';
import { containsPoint } from '../location/logic.js';
import { mainShare, clearlyDominant } from '../kuviotieto.js';
import { T } from './teksti.js';

export const MAX_ACCURACY = 50; // m; tätä epätarkemmalla sijainnilla ei kerrota kuviota

/** Kuvio, jonka sisällä piste on (reiät huomioiden). */
export function standAt(stands, point) {
    return (stands || []).find(f => containsPoint(f.geometry, point)) || null;
}

function segmentDistance([px, py], [ax, ay], [bx, by]) {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Pisteen etäisyys geometrian lähimpään reunaan (myös reikien reunat), metreinä. */
export function distanceToEdge(geometry, point) {
    const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates]
        : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
    let min = Infinity;
    for (const rings of polygons) {
        for (const ring of rings) {
            for (let i = 1; i < ring.length; i++) {
                min = Math.min(min, segmentDistance(point, ring[i - 1], ring[i]));
            }
        }
    }
    return min;
}

/**
 * Paikan tila: 'inaccurate' (GPS liian epätarkka), 'none' (ei kuviota),
 * 'edge' (tarkkuusympyrä ulottuu kuvion rajan yli) tai 'ok'.
 */
export function placeStatus({ stand, point, accuracy }) {
    if (accuracy == null || accuracy > MAX_ACCURACY) return 'inaccurate';
    if (!stand) return 'none';
    return distanceToEdge(stand.geometry, point) < accuracy ? 'edge' : 'ok';
}

/* ---------- Kuvaus tavallisella kielellä (lauseet: teksti.js) ---------- */

const fmt = (v, d = 0) => formatNumber(v, d, locale());

/**
 * Kasvupaikan tunnuskasvit kankailla (Cajanderin metsätyypit). Vain
 * kivennäismailla (alaryhmä 1, kangas); soilla luokka tarkoittaa vastaavaa suota.
 */
export const INDICATOR = T.tunnuskasvi;

export { mainShare, clearlyDominant };

function speciesWord(p) {
    if (mainShare(p) != null && !clearlyDominant(p)) return T.seka;
    return T.valtainen[p.MAINTREESPECIES] || '';
}

/** Pääkappale: "Seisot noin 76-vuotiaassa mäntyvaltaisessa uudistuskypsässä metsässä." */
export function leadSentence(p) {
    if (p.MAINGROUP != null && p.MAINGROUP !== 1) {
        return T.eiMetsamaata(codeName('mainGroup', p.MAINGROUP) || T.maaluokka(p.MAINGROUP));
    }
    if (p.DEVELOPMENTCLASS === 'A0') return T.aukea;
    const stage = T.vaiheessa[p.DEVELOPMENTCLASS];
    if (!stage) return T.metsakuvio;
    const age = p.MEANAGE && !['T1', 'T2'].includes(p.DEVELOPMENTCLASS) ? fmt(p.MEANAGE) : null;
    return T.seisot({ age, species: speciesWord(p), stage });
}

function pct(share) {
    return T.prosentti(fmt(share * 100));
}

/** Puulajien osuudet tekstinä: "mänty 73 %, kuusi 21 %, muut 6 %". */
export function speciesMix(p) {
    const shares = (p.SPECIESSHARES || []).filter(s => s.share >= 0.05);
    if (!shares.length) return null;
    const parts = shares.slice(0, 3).map(s => `${T.lower(codeName('treeSpecies', s.species) || T.puulaji(s.species))} ${pct(s.share)}`);
    const rest = 1 - shares.slice(0, 3).reduce((a, s) => a + s.share, 0);
    if (rest >= 0.05) parts.push(`${T.muut} ${pct(rest)}`);
    return parts.join(', ');
}

function dateText(iso) {
    if (!iso) return null;
    const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
    return y && m && d ? T.paiva(y, m, d) : null;
}

/**
 * Kortin sisältö: pääkappale, faktat (label, value, tip-avain) ja
 * tietolähteen päivämäärät. Puuttuvaa tietoa ei näytetä eikä arvata.
 */
export function describePlace(p) {
    const facts = [];
    const add = (label, value, tip) => { if (value) facts.push({ label, value, tip }); };
    const F = T.faktat;

    if (p.MEANHEIGHT && p.MEANDIAMETER) {
        add(F.puut, T.puutKokoJaPaksuus(fmt(p.MEANHEIGHT), fmt(p.MEANDIAMETER)), 'keskipituus');
    } else if (p.MEANHEIGHT) {
        add(F.puut, T.puutKoko(fmt(p.MEANHEIGHT, 1)), 'keskipituus');
    }
    add(F.puulajit, speciesMix(p), 'puulajijakauma');
    if (p.STEMCOUNT) add(F.puita, T.puitaHehtaarilla(fmt(Math.round(p.STEMCOUNT / 10) * 10)), 'runkoluku');
    if (p.VOLUME >= 1) add(F.puuta, T.puutaHehtaarilla(fmt(p.VOLUME)), 'tilavuus');
    if (p.VOLUMEGROWTH > 0) add(F.kasvu, T.kasvuHehtaarilla(fmt(p.VOLUMEGROWTH, 1)), 'kasvu');

    const fertility = codeName('fertilityClass', p.FERTILITYCLASS) ?? (p.FERTILITYCLASS != null ? T.luokka(p.FERTILITYCLASS) : null);
    add(F.kasvupaikka, fertility, 'kasvupaikka');
    add(F.maapera, codeName('soilType', p.SOILTYPE) ?? (p.SOILTYPE != null ? T.luokka(p.SOILTYPE) : null), 'maalaji');

    const hint = p.SUBGROUP === 1 ? INDICATOR[p.FERTILITYCLASS] : null;

    let proposal = null;
    if (p.CUTTINGTYPE != null && p.CUTTINGPROPOSALYEAR) {
        const type = codeName('cuttingType', p.CUTTINGTYPE) || T.hakkuu(p.CUTTINGTYPE);
        proposal = T.ehdotus(type, p.CUTTINGPROPOSALYEAR);
    }

    return {
        lead: leadSentence(p),
        facts,
        hint,
        proposal,
        source: {
            inventory: dateText(p.MEASUREMENTDATE),
            current: dateText(p.TREESTANDDATE)
        }
    };
}
