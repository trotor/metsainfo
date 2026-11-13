/**
 * Puukaupan hinta-alueet (Luke: Hinta-alueet ja maakunnat 2021) ja niiden
 * koodit kahdessa hintataulukossa:
 * - weekly: Metsäteollisuus ry:n viikkoseuranta (met/metryv/0100_metryv.px, MPKH)
 * - monthly: Luke, Teollisuuspuun kauppa (met/teokau/kk/0100_teokau.px, MPKH)
 */

import { KUNTA_MAAKUNTA } from './kunnat.js';

export const PRICE_REGIONS = {
    'etela-suomi': { name: 'Etelä-Suomi', weekly: '1', monthly: 'MPKH01' },
    'keski-suomi': { name: 'Keski-Suomi', weekly: '3', monthly: 'MPKH02' },
    'savo-karjala': { name: 'Savo-Karjala', weekly: '4', monthly: 'MPKH03' },
    'kymi-savo': { name: 'Kymi-Savo', weekly: '5', monthly: 'MPKH04' },
    'etela-pohjanmaa': { name: 'Etelä-Pohjanmaa', weekly: '6', monthly: 'MPKH05' },
    'pohjois-pohjanmaa': { name: 'Pohjois-Pohjanmaa', weekly: '71', monthly: 'MPKH06' },
    'kainuu-koillismaa': { name: 'Kainuu-Koillismaa', weekly: '72', monthly: 'MPKH07' },
    'lappi': { name: 'Lappi', weekly: '8', monthly: 'MPKH08' },
    'koko-maa': { name: 'Koko maa', weekly: '9', monthly: 'SSS' }
};

// Maakunta → hinta-alue. Ahvenanmaa (21) ei ole aluejaossa; lähin on Etelä-Suomi.
const MAAKUNTA_REGION = {
    '01': 'etela-suomi', '02': 'etela-suomi', '04': 'etela-suomi', '05': 'etela-suomi',
    '07': 'etela-suomi', '21': 'etela-suomi',
    '06': 'keski-suomi', '13': 'keski-suomi',
    '11': 'savo-karjala', '12': 'savo-karjala',
    '08': 'kymi-savo', '09': 'kymi-savo', '10': 'kymi-savo',
    '14': 'etela-pohjanmaa', '15': 'etela-pohjanmaa', '16': 'etela-pohjanmaa',
    '17': 'pohjois-pohjanmaa',
    '18': 'kainuu-koillismaa',
    '19': 'lappi'
};

// Koillismaa: Pohjois-Pohjanmaan maakuntaa, mutta Kainuu-Koillismaan hinta-aluetta
const KOILLISMAA = new Set(['305', '615', '832']);

/**
 * Kuntanumero (esim. '592' tai 592) → hinta-alueen avain tai null.
 */
export function regionForKunta(kunta) {
    if (kunta === null || kunta === undefined || kunta === '') return null;
    const code = String(kunta).padStart(3, '0');
    if (KOILLISMAA.has(code)) return 'kainuu-koillismaa';
    const maakunta = KUNTA_MAAKUNTA[code];
    return (maakunta && MAAKUNTA_REGION[maakunta]) || null;
}

function refCoords(props) {
    const c = props?.referencePoint?.coordinates;
    return Array.isArray(c) && c.length >= 2 ? [c[0], c[1]] : null;
}

function boundsCenter(geometry) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const walk = (c) => {
        if (typeof c[0] === 'number') {
            minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]);
            minY = Math.min(minY, c[1]); maxY = Math.max(maxY, c[1]);
        } else c.forEach(walk);
    };
    if (!geometry?.coordinates) return null;
    walk(geometry.coordinates);
    return Number.isFinite(minX) ? [(minX + maxX) / 2, (minY + maxY) / 2] : null;
}

/**
 * Kiinteistön sijaintipiste (EPSG:3067) kunnan selvittämiseen: INSPIRE-
 * viitepiste (kiinteistön sisällä), muuten ensimmäisen palstan viitepiste tai
 * geometrian rajauksen keskipiste. Moniosaisella kiinteistöllä on `parts`.
 */
export function parcelPoint(parcel) {
    if (!parcel) return null;
    return refCoords(parcel.properties)
        || refCoords(parcel.parts?.[0]?.properties)
        || boundsCenter(parcel.geometry)
        || boundsCenter(parcel.parts?.[0]?.geometry)
        || null;
}
