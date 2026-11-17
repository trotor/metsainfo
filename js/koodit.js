/**
 * Koodiston nimet valitulla kielellä (#23).
 *
 * Suomenkieliset nimet: CODES (js/config.js, Metsäkeskuksen virallinen koodisto).
 * Englanninkieliset nimet ovat EPÄVIRALLISIA: Metsärekisterin koodistoissa
 * (koodistot.suomi.fi, metsarek) on vain suomi ja ruotsi (tarkistettu
 * 16.11.2026). Ruotsinkieliset nimet kannattaa hakea sieltä, kun ruotsi
 * otetaan mukaan. Puuttuva englanninkielinen nimi näytetään suomeksi.
 * Ruotsi: ks. CODES_SV_VIRALLINEN ja CODES_SV_EPAVIRALLINEN alla.
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

/**
 * Ruotsinkieliset nimet. VIRALLISET: Metsärekisterin koodistot
 * (koodistot.suomi.fi, metsarek: paapuulaji, kehitysluokka, kasvupaikkaluokka,
 * maalaji, hakkuutapa, paaryhma), haettu 16.11.2026; vain koodit, joiden
 * suomenkielinen nimi vastaa CODESia. Kasvupaikoista vain pääsana (kuten CODES),
 * maalajeista ilman von Post -tarkennusta.
 */
export const CODES_SV_VIRALLINEN = {
    treeSpecies: { 1: "Tall", 2: "Gran", 3: "Vårtbjörk", 4: "Glasbjörk", 5: "Asp", 6: "Gråal", 7: "Klibbal", 8: "Annat barrträdslag", 9: "Annat lövträdslag", 10: "Douglasgran", 11: "En", 12: "Contortatall", 13: "Vresalm", 14: "Lärkträd", 15: "Skogslind", 16: "Svartgran", 17: "Vide", 18: "Rönn", 19: "Pichtagran", 20: "Sälg", 21: "Ask", 22: "Cembratall", 23: "Omorikagran", 24: "Ek", 25: "Hägg", 26: "Lönn", 27: "Masurbjörk", 28: "Skogsalm", 29: "Lövträd", 30: "Barrträd" },
    developmentClass: { "A0": "Kalmark", "S0": "Bestånd i fröträdsställning", "Y1": "Plantbestånd med överståndare", "02": "Klenare gallringsbestånd", "03": "Grövre gallringsbestånd", "04": "Förnyelsemogen skog", "05": "Bestånd i skärmställning", "T1": "Yngre plantbestånd", "T2": "Äldre plantbestånd", "ER": "Olikåldrigt bestånd" },
    fertilityClass: { 1: "Lund", 2: "Lundartad mo", 3: "Frisk mo", 4: "Torr mo", 5: "Karg mo", 6: "Lavmo", 7: "Bergbundna marker och sandfält", 8: "Skog i höjdläge och fjäll" },
    soilType: { 11: "Grov morän", 12: "Grov sorterad jordart", 20: "Finkornig momark", 21: "Finjordsmorän", 22: "Finkornig sorterad jordart", 23: "Silthaltig jordart", 24: "Lerjord", 31: "Stenig grov morän", 32: "Stenig grov sorterad jordart", 40: "Stenig finkornig momark", 60: "Torvjord", 61: "Starrtorv", 62: "Vitmosstorv", 63: "Trädtorv", 64: "Erosionskänslig starrtorv", 65: "Erosionskänslig sphagnumtorv", 66: "Svagt förmultnad starrtorv", 67: "Svagt förmultnad sphagnumtorv", 70: "Mulljord", 80: "Gyttjejord", 10: "Medelgrov och grov momark", 30: "Stenig medelgrov eller grov momark", 50: "Berg eller stenbunden mark" },
    cuttingType: { 0: "Vila för viss tid", 1: "Avlägsnande av överståndare", 2: "Första gallring", 3: "Gallring", 4: "Kant- och teghuggning", 5: "Kalavverkning", 6: "Avverkning i lågskärm", 7: "Avverkning i skärmställning", 8: "Avverkning i fröträdsställning", 9: "Specialavverkning", 11: "Höggallring", 12: "Ljushuggning", 13: "Iståndsättningsavverkning", 14: "Plockhuggning", 15: "Luckhuggning" },
    mainGroup: { 1: "Skogsmark", 2: "Tvinmark", 3: "Impediment", 4: "Annan skogsbruksmark", 5: "Tomtmark", 6: "Jordbruksmark", 7: "Annan mark", 8: "Vattendrag" }
};

/**
 * EPÄVIRALLISET ruotsinkieliset nimet tauluille, joiden WFS-koodit eivät
 * vastaa Metsärekisterin koodistoa (kulkukelpoisuus, metsänkäyttöilmoituksen
 * hakkuutarkoitus) tai joita koodistossa ei ole.
 */
export const CODES_SV_EPAVIRALLINEN = {
    cuttingType: {
        20: 'Gallring av energived', 90: 'Avverkning för ändrad markanvändning', 91: 'Specialavverkning (6 §)',
        92: 'Annan avverkning', 93: 'Förnyelseavverkning på skadeområde', 94: 'Gallring på skadeområde'
    },
    silvicultureType: {
        1: 'Anläggning av plantbestånd', 2: 'Tidig plantskogsvård', 3: 'Plantskogsvård',
        4: 'Vård av ungskog', 5: 'Övriga skogsvårdsarbeten'
    },
    drainageState: {
        1: 'Odikad mo', 2: 'Försumpad mo', 3: 'Dikad mo',
        6: 'Orörd myr', 7: 'Nydikad myr', 8: 'Omvandlingsmyr', 9: 'Torvmo'
    },
    accessibility: {
        1: 'Året runt', 2: 'Barmark (ej menföre)', 3: 'Torr period',
        4: 'Endast tjälad mark', 5: 'Inte definierad'
    },
    cuttingPurpose: {
        1: 'Beståndsvårdande avverkning', 2: 'Förnyelseavverkning', 3: 'Annan avverkning',
        4: 'Specialavverkning (6 §)', 5: 'Ändrad markanvändning', 6: 'Skogsskadeområde'
    },
    habitatType: {
        530: 'Brant', 540: 'Berg', 543: 'Berg', 545: 'Stenbunden mark',
        570: 'Torr lund', 571: 'Frisk lund', 572: 'Fuktig lund',
        577: 'Rikkärr', 578: 'Frodig kärr',
        600: 'Skogsholme', 602: 'Trädfattig myr',
        613: 'Tjärn', 614: 'Källa', 615: 'Källområde',
        618: 'Bäck', 620: 'Strandäng', 623: 'Rännil', 624: 'Sippervatten', 625: 'Vattendrag'
    }
};

/** Koodin nimi valitulla kielellä, tai null jos koodia ei tunneta. */
export function codeName(table, code, lang = getLang()) {
    if (code == null) return null;
    if (lang === 'en') {
        const en = CODES_EN_EPAVIRALLINEN[table]?.[code];
        if (en) return en;
    }
    if (lang === 'sv') {
        const sv = CODES_SV_VIRALLINEN[table]?.[code] ?? CODES_SV_EPAVIRALLINEN[table]?.[code];
        if (sv) return sv;
    }
    return CODES[table]?.[code] ?? null;
}
