/**
 * "Kerro tästä paikasta": kuvion tunnistus sijainnista ja tietojen
 * kertominen tavallisella kielellä. Puhdas logiikka, ei DOMia.
 * Geometria EPSG:3067:ssä.
 */

import { CODES } from '../config.js';
import { formatNumber } from '../utils.js';
import { containsPoint } from '../location/logic.js';
import { mainShare, clearlyDominant } from '../kuviotieto.js';

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

/* ---------- Kuvaus tavallisella kielellä ---------- */

// Kehitysluokka sisäpaikallisjona: "Seisot … metsässä"
const DEV_PHRASE = {
    T1: 'taimikossa, jonka taimet ovat alle 1,3 metrin',
    T2: 'taimikossa',
    Y1: 'taimikossa, jonka yllä kasvaa vanhoja puita',
    '02': 'nuoressa kasvatusmetsässä',
    '03': 'varttuneessa kasvatusmetsässä',
    '04': 'uudistuskypsässä metsässä',
    '05': 'suojuspuumetsikössä',
    S0: 'siemenpuumetsikössä',
    ER: 'eri-ikäisessä metsässä'
};

const SPECIES_ADJ = {
    1: 'mäntyvaltaisessa', 2: 'kuusivaltaisessa', 3: 'koivuvaltaisessa', 4: 'koivuvaltaisessa',
    5: 'haapavaltaisessa', 6: 'leppävaltaisessa', 7: 'leppävaltaisessa', 29: 'lehtipuuvaltaisessa'
};

/**
 * Kasvupaikan tunnuskasvit kankailla (Cajanderin metsätyypit). Vain
 * kivennäismailla (alaryhmä 1, kangas); soilla luokka tarkoittaa vastaavaa suota.
 */
export const INDICATOR = {
    1: 'Lehdossa kasvaa runsaasti ruohoja ja saniaisia.',
    2: 'Lehtomaisella kankaalla kasvaa käenkaalia, oravanmarjaa ja mustikkaa.',
    3: 'Tuoreen kankaan tunnuskasvi on mustikka.',
    4: 'Kuivahkon kankaan tunnuskasvi on puolukka.',
    5: 'Kuivalla kankaalla kasvaa kanervaa ja jäkäliä.',
    6: 'Karukkokankaalla maata peittävät jäkälät.'
};

export { mainShare, clearlyDominant };

function speciesWord(p) {
    if (mainShare(p) == null) return SPECIES_ADJ[p.MAINTREESPECIES] || '';
    if (!clearlyDominant(p)) return 'sekapuustoisessa';
    return SPECIES_ADJ[p.MAINTREESPECIES] || '';
}

/** Pääkappale: "Seisot noin 76-vuotiaassa mäntyvaltaisessa uudistuskypsässä metsässä." */
export function leadSentence(p) {
    if (p.MAINGROUP != null && p.MAINGROUP !== 1) {
        const group = CODES.mainGroup[p.MAINGROUP] || `maaluokka ${p.MAINGROUP}`;
        return `Seisot alueella, joka ei ole kasvavaa metsämaata (${group.toLowerCase()}).`;
    }
    if (p.DEVELOPMENTCLASS === 'A0') return 'Seisot aukealla. Puusto on hakattu tai paikka odottaa uudistamista.';
    const dev = DEV_PHRASE[p.DEVELOPMENTCLASS];
    if (!dev) return 'Seisot metsäkuviolla.';
    const age = p.MEANAGE && !['T1', 'T2'].includes(p.DEVELOPMENTCLASS) ? `noin ${formatNumber(p.MEANAGE, 0)}-vuotiaassa ` : '';
    const species = speciesWord(p);
    // "mäntyvaltaisessa taimikossa" / "noin 76-vuotiaassa mäntyvaltaisessa uudistuskypsässä metsässä"
    return `Seisot ${age}${species ? `${species} ` : ''}${dev}.`;
}

function pct(share) {
    return `${formatNumber(share * 100, 0)} %`;
}

/** Puulajien osuudet tekstinä: "mänty 73 %, kuusi 21 %, muut 6 %". */
export function speciesMix(p) {
    const shares = (p.SPECIESSHARES || []).filter(s => s.share >= 0.05);
    if (!shares.length) return null;
    const parts = shares.slice(0, 3).map(s => `${(CODES.treeSpecies[s.species] || `puulaji ${s.species}`).toLowerCase()} ${pct(s.share)}`);
    const rest = 1 - shares.slice(0, 3).reduce((a, s) => a + s.share, 0);
    if (rest >= 0.05) parts.push(`muut ${pct(rest)}`);
    return parts.join(', ');
}

function dateFi(iso) {
    if (!iso) return null;
    const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
    return y && m && d ? `${d}.${m}.${y}` : null;
}

/**
 * Kortin sisältö: pääkappale, faktat (label, value, tip-avain) ja
 * tietolähteen päivämäärät. Puuttuvaa tietoa ei näytetä eikä arvata.
 */
export function describePlace(p) {
    const facts = [];
    const add = (label, value, tip) => { if (value) facts.push({ label, value, tip }); };

    if (p.MEANHEIGHT && p.MEANDIAMETER) {
        add('Puut', `keskimäärin ${formatNumber(p.MEANHEIGHT, 0)} m pitkiä ja ${formatNumber(p.MEANDIAMETER, 0)} cm paksuja`, 'keskipituus');
    } else if (p.MEANHEIGHT) {
        add('Puut', `keskimäärin ${formatNumber(p.MEANHEIGHT, 1)} m pitkiä`, 'keskipituus');
    }
    add('Puulajit', speciesMix(p), 'puulajijakauma');
    if (p.STEMCOUNT) add('Puita', `noin ${formatNumber(Math.round(p.STEMCOUNT / 10) * 10, 0)} hehtaarilla`, 'runkoluku');
    if (p.VOLUME >= 1) add('Puuta', `${formatNumber(p.VOLUME, 0)} m³ hehtaarilla`, 'tilavuus');
    if (p.VOLUMEGROWTH > 0) add('Kasvu', `${formatNumber(p.VOLUMEGROWTH, 1)} m³ hehtaarilla vuodessa`, 'kasvu');

    const fertility = CODES.fertilityClass[p.FERTILITYCLASS] ?? (p.FERTILITYCLASS != null ? `luokka ${p.FERTILITYCLASS}` : null);
    add('Kasvupaikka', fertility, 'kasvupaikka');
    add('Maaperä', CODES.soilType[p.SOILTYPE] ?? (p.SOILTYPE != null ? `luokka ${p.SOILTYPE}` : null), 'maalaji');

    const hint = p.SUBGROUP === 1 ? INDICATOR[p.FERTILITYCLASS] : null;

    let proposal = null;
    if (p.CUTTINGTYPE != null && p.CUTTINGPROPOSALYEAR) {
        const type = CODES.cuttingType[p.CUTTINGTYPE] || `hakkuu ${p.CUTTINGTYPE}`;
        proposal = `Laskennallinen ehdotus: ${type.toLowerCase()} vuonna ${p.CUTTINGPROPOSALYEAR}.`;
    }

    return {
        lead: leadSentence(p),
        facts,
        hint,
        proposal,
        source: {
            inventory: dateFi(p.MEASUREMENTDATE),
            current: dateFi(p.TREESTANDDATE)
        }
    };
}
