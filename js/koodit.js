/**
 * Koodiston nimet valitulla kielellä (#24).
 *
 * Suomenkieliset nimet: CODES (js/config.js, Metsäkeskuksen virallinen koodisto).
 * Englanninkieliset nimet ovat EPÄVIRALLISIA: Metsärekisterin koodistoissa
 * (koodistot.suomi.fi, metsarek) on vain suomi ja ruotsi (tarkistettu
 * 16.11.2026). Ruotsinkieliset nimet kannattaa hakea sieltä, kun ruotsi
 * otetaan mukaan. Puuttuva englanninkielinen nimi näytetään suomeksi.
 */

import { CODES } from './config.js';
import { getLang } from './i18n.js';

export const CODES_EN_EPAVIRALLINEN = {
    treeSpecies: {
        1: 'Scots pine', 2: 'Norway spruce', 3: 'Silver birch', 4: 'Downy birch', 5: 'Aspen',
        6: 'Grey alder', 7: 'Black alder', 8: 'Other conifer', 9: 'Other broadleaf',
        10: 'Douglas fir', 11: 'Juniper', 12: 'Lodgepole pine', 13: 'European white elm',
        14: 'Larch', 15: 'Small-leaved lime', 16: 'Black spruce', 17: 'Willow',
        18: 'Rowan', 19: 'Fir', 20: 'Goat willow', 21: 'Ash', 22: 'Swiss stone pine',
        23: 'Serbian spruce', 24: 'Oak', 25: 'Bird cherry', 26: 'Maple', 27: 'Curly birch',
        28: 'Wych elm', 29: 'Broadleaf', 30: 'Conifer'
    },
    developmentClass: {
        A0: 'Open area', S0: 'Seed tree stand', Y1: 'Sapling stand with holdover trees',
        '02': 'Young thinning stand', '03': 'Advanced thinning stand',
        '04': 'Mature stand', '05': 'Shelterwood stand',
        T1: 'Sapling stand (under 1.3 m)', T2: 'Sapling stand (over 1.3 m)', ER: 'Uneven-aged stand'
    },
    fertilityClass: {
        1: 'Herb-rich forest', 2: 'Herb-rich heath forest', 3: 'Mesic heath forest',
        4: 'Sub-xeric heath forest', 5: 'Xeric heath forest', 6: 'Barren heath forest',
        7: 'Rocky or sandy soil', 8: 'Treeline forest or fell'
    },
    soilType: {
        10: 'Medium or coarse mineral soil', 11: 'Coarse till', 12: 'Coarse sorted soil',
        20: 'Fine-grained mineral soil', 21: 'Fine till', 22: 'Fine sorted soil',
        23: 'Silty soil', 24: 'Clay', 30: 'Stony medium or coarse mineral soil',
        31: 'Stony coarse till', 32: 'Stony coarse sorted soil',
        40: 'Stony fine-grained mineral soil', 50: 'Bedrock or boulders',
        60: 'Peat', 61: 'Sedge peat', 62: 'Sphagnum peat', 63: 'Woody peat',
        64: 'Erodible sedge peat', 65: 'Erodible sphagnum peat',
        66: 'Undecomposed sedge peat', 67: 'Undecomposed sphagnum peat', 70: 'Humus soil', 80: 'Gyttja'
    },
    cuttingType: {
        0: 'Temporary rest', 1: 'Removal of holdover trees', 2: 'First thinning',
        3: 'Thinning', 4: 'Strip cutting', 5: 'Clear cutting', 6: 'Veil tree cutting',
        7: 'Shelterwood cutting', 8: 'Seed tree cutting', 9: 'Special cutting',
        11: 'Thinning from above', 12: 'Release cutting', 13: 'Restoration cutting',
        14: 'Selection cutting', 15: 'Small gap cutting', 20: 'Energy wood thinning',
        90: 'Cutting for change of land use', 91: 'Special cutting (section 6)',
        92: 'Other cutting', 93: 'Regeneration cutting in a damaged area', 94: 'Thinning in a damaged area'
    },
    silvicultureType: {
        1: 'Stand establishment', 2: 'Early sapling stand tending', 3: 'Sapling stand tending',
        4: 'Young stand tending', 5: 'Other silviculture'
    },
    drainageState: {
        1: 'Undrained mineral soil', 2: 'Paludified mineral soil', 3: 'Drained mineral soil',
        6: 'Undrained mire', 7: 'Recently drained mire', 8: 'Transforming drained mire', 9: 'Drained peatland forest'
    },
    accessibility: {
        1: 'All year', 2: 'Unfrozen ground (not during thaw)', 3: 'Dry season',
        4: 'Frozen ground only', 5: 'Not defined'
    },
    cuttingPurpose: {
        1: 'Thinning', 2: 'Regeneration cutting', 3: 'Other cutting',
        4: 'Special cutting (section 6)', 5: 'Change of land use', 6: 'Forest damage area'
    },
    habitatType: {
        530: 'Cliff', 540: 'Rock outcrop', 543: 'Rock outcrop', 545: 'Boulder field',
        570: 'Dry herb-rich forest', 571: 'Mesic herb-rich forest', 572: 'Moist herb-rich forest',
        577: 'Rich fen', 578: 'Rich spruce mire',
        600: 'Forest island', 602: 'Sparsely wooded mire',
        613: 'Pond', 614: 'Spring', 615: 'Spring area',
        618: 'Brook', 620: 'Flooded meadow', 623: 'Rill', 624: 'Seepage area', 625: 'Water body'
    },
    mainGroup: {
        1: 'Forest land', 2: 'Poorly productive forest land', 3: 'Unproductive land',
        4: 'Other forestry land', 5: 'Building plot', 6: 'Agricultural land', 7: 'Other land', 8: 'Water'
    }
};

/** Koodin nimi valitulla kielellä, tai null jos koodia ei tunneta. */
export function codeName(table, code, lang = getLang()) {
    if (code == null) return null;
    if (lang === 'en') {
        const en = CODES_EN_EPAVIRALLINEN[table]?.[code];
        if (en) return en;
    }
    return CODES[table]?.[code] ?? null;
}
