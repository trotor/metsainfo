/**
 * Maastotilan tekstit suomeksi ja englanniksi (#24). Myös paikan kuvauksen
 * ja visan lauseet ovat täällä, koska suomen taivutus ja englannin
 * artikkelit vaativat omat lauserakenteensa: paikka.js ja visa.js antavat
 * vain tiedot, ja lause muodostetaan tämän kielen funktiolla.
 */

import { pick } from '../i18n.js';

const fi = {
    nappi: 'Kerro tästä paikasta',
    otsikko: 'Tässä kohtaa',
    sulje: 'Sulje',
    haetaanSijaintia: 'Haetaan sijaintia…',
    haetaanKuvioita: 'Haetaan metsätietoja…',
    eiVerkkoa: 'Metsätietoja ei saatu. Tarkista verkkoyhteys.',
    yritaUudelleen: 'Yritä uudelleen',
    epatarkka: (m) => `Sijainti on vielä epätarkka (±${m} m). Odota hetki avoimella paikalla.`,
    eiKuviota: 'Tästä kohdasta ei ole metsävaratietoa. Se voi olla pelto, piha, tie tai vesi.',
    reunalla: (m) => `Olet kuvion reunalla (GPS ±${m} m). Tiedot voivat koskea naapurikuviota.`,
    kuvio: (n, ha) => `Kuvio ${n} · ${ha} ha`,
    lahde: (inv, nyt) => `Metsäkeskus: inventointi ${inv}${nyt ? `, nykytila laskettu ennuste ${nyt}` : ''}.`,
    kysyMinulta: 'Kysy minulta',
    takaisin: 'Takaisin paikkaan',
    seuraava: 'Seuraava kysymys',
    oikein: 'Oikein!',
    vaarin: (oikea) => `Ei aivan. Oikea vastaus: ${oikea}.`,
    kiitosHavainnosta: 'Kiitos havainnosta! Se tallentui tähän laitteeseen.',
    kaikkiVastattu: 'Olet vastannut kaikkiin tämän kuvion kysymyksiin. Kävele seuraavalle kuviolle!',
    tasoVastattu: 'Tämän tason kysymykset on vastattu. Vaihda tasoa tai kävele seuraavalle kuviolle.',
    reunallaEiKysymyksia: 'Kysymykset odottavat, kunnes olet selvästi kuvion sisällä.',
    taso: 'Taso',
    tasot: { helppo: 'Helppo', keski: 'Keskitaso', vaikea: 'Vaikea', havainto: 'Havainto' },
    putkibonus: (n) => `putkibonus +${n}`,
    pisteet: (p) => `${p} pistettä`,
    kuviot: (n) => `${n} ${n === 1 ? 'kuvio' : 'kuviota'}`,
    putki: (n) => `putki ${n}`,
    uusiKuvio: (p) => `Uusi kuvio löydetty! +${p}`,
    kokeilu: 'Kokeilu · vain testiversiossa',
    lukittu: 'Koko kuvaus, metsävisa ja pisteet kuuluvat Puukaupan hinta-arvio -lisäosaan (sama kertaosto).',
    avaaLisaosa: 'Avaa lisäosa',
    arvonimet: ['Metsäretkeläinen', 'Polkujen kulkija', 'Kuvioiden tuntija', 'Metsänlukija', 'Metsämestari'],

    /* ---------- Paikan kuvaus (paikka.js) ---------- */
    lower: (s) => s.toLowerCase(),
    prosentti: (n) => `${n} %`,
    paiva: (y, m, d) => `${d}.${m}.${y}`,
    eiMetsamaata: (group) => `Seisot alueella, joka ei ole kasvavaa metsämaata (${group.toLowerCase()}).`,
    maaluokka: (n) => `maaluokka ${n}`,
    aukea: 'Seisot aukealla. Puusto on hakattu tai paikka odottaa uudistamista.',
    metsakuvio: 'Seisot metsäkuviolla.',
    vaiheessa: {
        T1: 'taimikossa, jonka taimet ovat alle 1,3 metrin',
        T2: 'taimikossa',
        Y1: 'taimikossa, jonka yllä kasvaa vanhoja puita',
        '02': 'nuoressa kasvatusmetsässä',
        '03': 'varttuneessa kasvatusmetsässä',
        '04': 'uudistuskypsässä metsässä',
        '05': 'suojuspuumetsikössä',
        S0: 'siemenpuumetsikössä',
        ER: 'eri-ikäisessä metsässä'
    },
    valtainen: {
        1: 'mäntyvaltaisessa', 2: 'kuusivaltaisessa', 3: 'koivuvaltaisessa', 4: 'koivuvaltaisessa',
        5: 'haapavaltaisessa', 6: 'leppävaltaisessa', 7: 'leppävaltaisessa', 29: 'lehtipuuvaltaisessa'
    },
    seka: 'sekapuustoisessa',
    // "Seisot noin 76-vuotiaassa mäntyvaltaisessa uudistuskypsässä metsässä."
    seisot: ({ age, species, stage }) =>
        `Seisot ${age ? `noin ${age}-vuotiaassa ` : ''}${species ? `${species} ` : ''}${stage}.`,
    tunnuskasvi: {
        1: 'Lehdossa kasvaa runsaasti ruohoja ja saniaisia.',
        2: 'Lehtomaisella kankaalla kasvaa käenkaalia, oravanmarjaa ja mustikkaa.',
        3: 'Tuoreen kankaan tunnuskasvi on mustikka.',
        4: 'Kuivahkon kankaan tunnuskasvi on puolukka.',
        5: 'Kuivalla kankaalla kasvaa kanervaa ja jäkäliä.',
        6: 'Karukkokankaalla maata peittävät jäkälät.'
    },
    puulaji: (n) => `puulaji ${n}`,
    muut: 'muut',
    luokka: (n) => `luokka ${n}`,
    hakkuu: (n) => `hakkuu ${n}`,
    faktat: {
        puut: 'Puut', puulajit: 'Puulajit', puita: 'Puita', puuta: 'Puuta', kasvu: 'Kasvu',
        kasvupaikka: 'Kasvupaikka', maapera: 'Maaperä'
    },
    puutKokoJaPaksuus: (h, d) => `keskimäärin ${h} m pitkiä ja ${d} cm paksuja`,
    puutKoko: (h) => `keskimäärin ${h} m pitkiä`,
    puitaHehtaarilla: (n) => `noin ${n} hehtaarilla`,
    puutaHehtaarilla: (v) => `${v} m³ hehtaarilla`,
    kasvuHehtaarilla: (v) => `${v} m³ hehtaarilla vuodessa`,
    ehdotus: (type, year) => `Laskennallinen ehdotus: ${type.toLowerCase()} vuonna ${year}.`,

    /* ---------- Visa (visa.js) ---------- */
    lajit: [
        { value: 'manty', label: 'Mänty' },
        { value: 'kuusi', label: 'Kuusi' },
        { value: 'koivu', label: 'Koivu' },
        { value: 'lehti', label: 'Muu lehtipuu (esim. haapa tai leppä)' }
    ],
    vaiheet: [
        { value: 'taimikko', label: 'Taimikko' },
        { value: 'nuori', label: 'Nuori kasvatusmetsä' },
        { value: 'varttunut', label: 'Varttunut kasvatusmetsä' },
        { value: 'kypsa', label: 'Uudistuskypsä metsä' }
    ],
    vaiheSelitys: {
        taimikko: 'Taimikossa puut ovat nuoria ja ohuita, rinnankorkeudelta alle 8 cm.',
        nuori: 'Nuoressa kasvatusmetsässä puiden keskiläpimitta on noin 8–16 cm. Ensiharvennus tehdään tässä vaiheessa.',
        varttunut: 'Varttuneessa kasvatusmetsässä puiden keskiläpimitta on yli 16 cm, mutta metsä ei ole vielä uudistuskypsä.',
        kypsa: 'Uudistuskypsä metsä on niin vanha tai järeä, että se voidaan uudistaa.'
    },
    alle: (v, unit) => `alle ${v} ${unit}`,
    yli: (v, unit) => `yli ${v} ${unit}`,
    vuotta: 'vuotta',
    q: {
        puulaji: 'Mikä puulaji on tällä kuviolla vallitseva?',
        puulajiSelitys: (name, pct) => `Tietojen mukaan pääpuulaji on ${name.toLowerCase()}, noin ${pct} % puustosta.`,
        vaihe: 'Missä kehitysvaiheessa tämä metsä on?',
        pituus: 'Kuinka pitkiä puut ovat täällä keskimäärin?',
        pituusSelitys: (h) => `Puiden keskipituus on tietojen mukaan ${h} m.`,
        ika: 'Kuinka vanhaa puusto on keskimäärin?',
        ikaSelitys: (a) => `Puuston keski-ikä on tietojen mukaan noin ${a} vuotta.`,
        maa: 'Onko maa tässä kivennäismaata vai turvetta?',
        kivennainen: 'Kivennäismaata (hiekkaa, moreenia)',
        turve: 'Turvetta (suota tai ojitettua suota)',
        maaSelitys: (soil) => `Maalaji on tietojen mukaan ${soil.toLowerCase()}.`,
        kasvupaikka: 'Mikä kasvupaikka tämä on? Katso varvikkoa ja aluskasvillisuutta.',
        kasvupaikkaSelitys: (site, hint) => `Tietojen mukaan kasvupaikka on ${site.toLowerCase()}. ${hint}`,
        tilavuus: 'Paljonko puuta tällä kuviolla on hehtaarilla?',
        tilavuusSelitys: (v) => `Tietojen mukaan puuta on ${v} m³ hehtaarilla. Hehtaari on 100 × 100 metrin alue.`,
        havainto: (main, h) => `Tietojen mukaan ${main ? `pääpuulaji on ${main.toLowerCase()}` : 'täällä on sekapuustoa'} ja puut ovat noin ${h} m pitkiä. Vastaako tämä sitä, mitä näet?`,
        kylla: 'Kyllä, vastaa',
        ei: 'Ei vastaa',
        eos: 'En osaa sanoa'
    }
};

// Puulajien nimissä erisnimet pidetään isolla
const enLower = (s) => (/^(Scots|Norway|Douglas|Serbian|Swiss)\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const article = (word) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

const en = {
    nappi: 'Tell me about this place',
    otsikko: 'Right here',
    sulje: 'Close',
    haetaanSijaintia: 'Finding your location…',
    haetaanKuvioita: 'Loading forest data…',
    eiVerkkoa: 'Could not load forest data. Check your connection.',
    yritaUudelleen: 'Try again',
    epatarkka: (m) => `Your location is still inaccurate (±${m} m). Wait a moment in an open spot.`,
    eiKuviota: 'There is no forest data for this spot. It may be a field, a yard, a road or water.',
    reunalla: (m) => `You are at the edge of a stand (GPS ±${m} m). The data may describe the neighbouring stand.`,
    kuvio: (n, ha) => `Stand ${n} · ${ha} ha`,
    lahde: (inv, nyt) => `Finnish Forest Centre: surveyed ${inv}${nyt ? `, current state forecast ${nyt}` : ''}.`,
    kysyMinulta: 'Quiz me',
    takaisin: 'Back to this place',
    seuraava: 'Next question',
    oikein: 'Correct!',
    vaarin: (oikea) => `Not quite. The right answer: ${oikea}.`,
    kiitosHavainnosta: 'Thanks for your observation! It was saved on this device.',
    kaikkiVastattu: 'You have answered every question for this stand. Walk on to the next one!',
    tasoVastattu: 'You have answered this level. Change the level or walk on to the next stand.',
    reunallaEiKysymyksia: 'Questions will wait until you are clearly inside a stand.',
    taso: 'Level',
    tasot: { helppo: 'Easy', keski: 'Medium', vaikea: 'Hard', havainto: 'Observation' },
    putkibonus: (n) => `streak bonus +${n}`,
    pisteet: (p) => `${p} points`,
    kuviot: (n) => `${n} ${n === 1 ? 'stand' : 'stands'}`,
    putki: (n) => `streak ${n}`,
    uusiKuvio: (p) => `New stand found! +${p}`,
    kokeilu: 'Trial · test version only',
    lukittu: 'The full description, the forest quiz and points are part of the Timber sale estimate add-on (one purchase).',
    avaaLisaosa: 'Unlock the add-on',
    arvonimet: ['Forest rambler', 'Trail walker', 'Stand spotter', 'Forest reader', 'Forest master'],

    lower: enLower,
    prosentti: (n) => `${n}%`,
    paiva: (y, m, d) => new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
    eiMetsamaata: (group) => `You are on land that is not productive forest (${enLower(group)}).`,
    maaluokka: (n) => `land class ${n}`,
    aukea: 'You are standing in an open area. The trees have been cut or the site is waiting to be regenerated.',
    metsakuvio: 'You are standing in a forest stand.',
    vaiheessa: {
        T1: 'sapling stand with saplings under 1.3 metres',
        T2: 'sapling stand',
        Y1: 'sapling stand with older trees above it',
        '02': 'young thinning stand',
        '03': 'advanced thinning stand',
        '04': 'mature forest',
        '05': 'shelterwood stand',
        S0: 'seed tree stand',
        ER: 'uneven-aged forest'
    },
    valtainen: {
        1: 'pine-dominated', 2: 'spruce-dominated', 3: 'birch-dominated', 4: 'birch-dominated',
        5: 'aspen-dominated', 6: 'alder-dominated', 7: 'alder-dominated', 29: 'broadleaf-dominated'
    },
    seka: 'mixed',
    // "You are standing in a roughly 76-year-old pine-dominated mature forest."
    seisot: ({ age, species, stage }) => {
        const words = [age ? `roughly ${age}-year-old` : '', species, stage].filter(Boolean).join(' ');
        return `You are standing in ${article(words)} ${words}.`;
    },
    tunnuskasvi: {
        1: 'Herb-rich forests have plenty of herbs and ferns.',
        2: 'Herb-rich heath forests have wood sorrel, May lily and bilberry.',
        3: 'The indicator plant of mesic heath forest is bilberry.',
        4: 'The indicator plant of sub-xeric heath forest is lingonberry.',
        5: 'Xeric heath forests have heather and lichens.',
        6: 'In barren heath forests, lichens cover the ground.'
    },
    puulaji: (n) => `species ${n}`,
    muut: 'others',
    luokka: (n) => `class ${n}`,
    hakkuu: (n) => `cutting ${n}`,
    faktat: {
        puut: 'Trees', puulajit: 'Species', puita: 'Stems', puuta: 'Volume', kasvu: 'Growth',
        kasvupaikka: 'Site type', maapera: 'Soil'
    },
    puutKokoJaPaksuus: (h, d) => `on average ${h} m tall and ${d} cm thick`,
    puutKoko: (h) => `on average ${h} m tall`,
    puitaHehtaarilla: (n) => `about ${n} per hectare`,
    puutaHehtaarilla: (v) => `${v} m³ per hectare`,
    kasvuHehtaarilla: (v) => `${v} m³ per hectare per year`,
    ehdotus: (type, year) => `Calculated proposal: ${enLower(type)} in ${year}.`,

    lajit: [
        { value: 'manty', label: 'Pine' },
        { value: 'kuusi', label: 'Spruce' },
        { value: 'koivu', label: 'Birch' },
        { value: 'lehti', label: 'Other broadleaf (e.g. aspen or alder)' }
    ],
    vaiheet: [
        { value: 'taimikko', label: 'Sapling stand' },
        { value: 'nuori', label: 'Young thinning stand' },
        { value: 'varttunut', label: 'Advanced thinning stand' },
        { value: 'kypsa', label: 'Mature forest' }
    ],
    vaiheSelitys: {
        taimikko: 'In a sapling stand the trees are young and thin, under 8 cm at breast height.',
        nuori: 'In a young thinning stand the mean diameter is about 8–16 cm. The first thinning is done at this stage.',
        varttunut: 'In an advanced thinning stand the mean diameter is over 16 cm, but the forest is not yet mature.',
        kypsa: 'A mature forest is old or large enough to be regenerated.'
    },
    alle: (v, unit) => `under ${v} ${unit}`,
    yli: (v, unit) => `over ${v} ${unit}`,
    vuotta: 'years',
    q: {
        puulaji: 'Which tree species dominates this stand?',
        puulajiSelitys: (name, pct) => `According to the data, the main species is ${enLower(name)}, about ${pct}% of the trees.`,
        vaihe: 'Which development stage is this forest in?',
        pituus: 'How tall are the trees here on average?',
        pituusSelitys: (h) => `According to the data, the mean height of the trees is ${h} m.`,
        ika: 'How old are the trees on average?',
        ikaSelitys: (a) => `According to the data, the mean age of the trees is about ${a} years.`,
        maa: 'Is the ground here mineral soil or peat?',
        kivennainen: 'Mineral soil (sand, till)',
        turve: 'Peat (a mire or a drained mire)',
        maaSelitys: (soil) => `According to the data, the soil type is ${enLower(soil)}.`,
        kasvupaikka: 'Which site type is this? Look at the dwarf shrubs and ground vegetation.',
        kasvupaikkaSelitys: (site, hint) => `According to the data, the site type is ${enLower(site)}. ${hint}`,
        tilavuus: 'How much wood is there per hectare in this stand?',
        tilavuusSelitys: (v) => `According to the data, there are ${v} m³ of wood per hectare. A hectare is 100 × 100 metres.`,
        havainto: (main, h) => `According to the data, ${main ? `the main species is ${enLower(main)}` : 'this is a mixed stand'} and the trees are about ${h} m tall. Does this match what you see?`,
        kylla: 'Yes, it matches',
        ei: 'No, it does not',
        eos: 'I cannot tell'
    }
};

export const TEKSTIT = { fi, en };
export const T = pick(TEKSTIT);

/** Pistemäärään perustuva arvonimi (vain tällä laitteella). */
export const ARVONIMI_RAJAT = [0, 100, 300, 600, 1000];
export const ARVONIMET = ARVONIMI_RAJAT.map((raja, i) => [raja, T.arvonimet[i]]);

export function arvonimi(pisteet) {
    let nimi = ARVONIMET[0][1];
    for (const [raja, n] of ARVONIMET) if (pisteet >= raja) nimi = n;
    return nimi;
}
