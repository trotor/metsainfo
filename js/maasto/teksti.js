/**
 * Maastotilan tekstit suomeksi, ruotsiksi ja englanniksi (#23). Myös paikan kuvauksen
 * ja visan lauseet ovat täällä, koska suomen taivutus, ruotsin suku ja englannin
 * artikkelit vaativat omat lauserakenteensa: paikka.js ja visa.js antavat
 * vain tiedot, ja lause muodostetaan tämän kielen funktiolla.
 */

import { pick } from '../i18n.js';

const fi = {
    nappi: 'Kerro tästä paikasta',
    kuvaus: 'Napauta karttaa tai käytä sijaintia: kuvion tiedot ja metsävisa.',
    otsikko: 'Tässä kohtaa',
    sulje: 'Sulje',
    haetaanSijaintia: 'Haetaan sijaintia…',
    haetaanKuvioita: 'Haetaan metsätietoja…',
    eiVerkkoa: 'Metsätietoja ei saatu. Tarkista verkkoyhteys.',
    palveluPoissa: 'Metsäkeskuksen palvelu ei nyt vastaa odotetusti, joten toiminto ei ole käytettävissä. Yritä myöhemmin uudelleen.',
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
    kartalta: 'Kokeile kartalta (ilman maastoa)',
    karttaOhje: 'Kokeilu kartalta: siirrä karttaa niin, että risti on kohdassa, josta haluat tietoa ja kysymyksiä.',
    omaSijainti: 'Käytä omaa sijaintia',
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
    kuvaus: 'Tap the map or use your location: stand details and a forest quiz.',
    otsikko: 'Right here',
    sulje: 'Close',
    haetaanSijaintia: 'Finding your location…',
    haetaanKuvioita: 'Loading forest data…',
    eiVerkkoa: 'Could not load forest data. Check your connection.',
    palveluPoissa: 'The Finnish Forest Centre service is not responding as expected, so this feature is unavailable. Please try again later.',
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
    kartalta: 'Try it on the map (no field trip)',
    karttaOhje: 'Map trial: move the map so the cross is on the spot you want to learn about and be quizzed on.',
    omaSijainti: 'Use my location',
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

// Ruotsissa adjektiivi taipuu substantiivin suvun mukaan: en talldominerad
// skog, ett talldominerat bestånd. Kehitysvaiheen teksti alkaa artikkelilla
// (en/ett), josta seisot päättelee suvun; puulajin adjektiivit ovat
// en-suvun muodossa.
const SV_SEKA = 'blandad';
const svNeutrum = (adj) => adj.replace(/ad$/, 'at');

const sv = {
    nappi: 'Berätta om den här platsen',
    kuvaus: 'Tryck på kartan eller använd din position: figurens uppgifter och ett skogsquiz.',
    otsikko: 'Just här',
    sulje: 'Stäng',
    haetaanSijaintia: 'Söker din position…',
    haetaanKuvioita: 'Hämtar skogsdata…',
    eiVerkkoa: 'Skogsdata kunde inte hämtas. Kontrollera nätverksanslutningen.',
    palveluPoissa: 'Skogscentralens tjänst svarar inte som väntat, så funktionen är inte tillgänglig. Försök igen senare.',
    yritaUudelleen: 'Försök igen',
    epatarkka: (m) => `Positionen är ännu inte exakt (±${m} m). Vänta en stund på en öppen plats.`,
    eiKuviota: 'Det finns ingen skogsdata för den här platsen. Det kan vara en åker, en gårdsplan, en väg eller vatten.',
    reunalla: (m) => `Du är vid kanten av en figur (GPS ±${m} m). Uppgifterna kan gälla grannfiguren.`,
    kuvio: (n, ha) => `Figur ${n} · ${ha} ha`,
    lahde: (inv, nyt) => `Skogscentralen: inventering ${inv}${nyt ? `, nuläget beräknat som prognos ${nyt}` : ''}.`,
    kysyMinulta: 'Fråga mig',
    takaisin: 'Tillbaka till platsen',
    seuraava: 'Nästa fråga',
    oikein: 'Rätt!',
    vaarin: (oikea) => `Inte riktigt. Rätt svar: ${oikea}.`,
    kiitosHavainnosta: 'Tack för din observation! Den sparades på den här enheten.',
    kaikkiVastattu: 'Du har svarat på alla frågor om den här figuren. Gå vidare till nästa figur!',
    tasoVastattu: 'Du har svarat på frågorna på den här nivån. Byt nivå eller gå vidare till nästa figur.',
    reunallaEiKysymyksia: 'Frågorna väntar tills du är tydligt inne i en figur.',
    taso: 'Nivå',
    tasot: { helppo: 'Lätt', keski: 'Medel', vaikea: 'Svår', havainto: 'Observation' },
    putkibonus: (n) => `svitbonus +${n}`,
    pisteet: (p) => `${p} poäng`,
    kuviot: (n) => `${n} ${n === 1 ? 'figur' : 'figurer'}`,
    putki: (n) => `svit ${n}`,
    uusiKuvio: (p) => `Ny figur hittad! +${p}`,
    kokeilu: 'Försöksfunktion · endast i testversionen',
    lukittu: 'Hela beskrivningen, skogsquizet och poängen ingår i tillägget Prisuppskattning för virkesaffär (samma engångsköp).',
    avaaLisaosa: 'Lås upp tillägget',
    kartalta: 'Testa på kartan (utan att gå ut i skogen)',
    karttaOhje: 'Test på kartan: flytta kartan så att krysset är på platsen du vill veta mer om och få frågor om.',
    omaSijainti: 'Använd min position',
    arvonimet: ['Skogsvandrare', 'Stigtrampare', 'Figurkännare', 'Skogsläsare', 'Skogsmästare'],

    lower: (s) => s.toLowerCase(),
    prosentti: (n) => `${n} %`,
    paiva: (y, m, d) => `${d}.${m}.${y}`,
    eiMetsamaata: (group) => `Du står på mark som inte är skogsmark (${group.toLowerCase()}).`,
    maaluokka: (n) => `markklass ${n}`,
    aukea: 'Du står på en öppen plats. Träden har avverkats eller platsen väntar på förnyelse.',
    metsakuvio: 'Du står i en skogsfigur.',
    vaiheessa: {
        T1: 'ett plantbestånd där plantorna är under 1,3 meter höga',
        T2: 'ett plantbestånd',
        Y1: 'ett plantbestånd med överståndare',
        '02': 'ett klenare gallringsbestånd',
        '03': 'ett grövre gallringsbestånd',
        '04': 'en förnyelsemogen skog',
        '05': 'ett bestånd i skärmställning',
        S0: 'ett bestånd i fröträdsställning',
        ER: 'ett olikåldrigt bestånd'
    },
    valtainen: {
        1: 'talldominerad', 2: 'grandominerad', 3: 'björkdominerad', 4: 'björkdominerad',
        5: 'aspdominerad', 6: 'aldominerad', 7: 'aldominerad', 29: 'lövträdsdominerad'
    },
    seka: SV_SEKA,
    // "Du står i en cirka 76 år gammal talldominerad förnyelsemogen skog."
    // "Du står i ett cirka 35 år gammalt grandominerat klenare gallringsbestånd."
    // Blandade trädslag efter substantivet, om vaiheessa inte redan har en bisats.
    seisot: ({ age, species, stage }) => {
        const [, art, noun] = /^(en|ett) (.+)$/.exec(stage) || [null, 'en', stage];
        const ett = art === 'ett';
        const efter = species === SV_SEKA && !/ (med|där|i) /.test(noun);
        const adj = [
            age ? `cirka ${age} år ${ett ? 'gammalt' : 'gammal'}` : '',
            species && !efter ? (ett ? svNeutrum(species) : species) : ''
        ].filter(Boolean);
        return `Du står i ${[art, ...adj, noun].join(' ')}${efter ? ' med blandade trädslag' : ''}.`;
    },
    tunnuskasvi: {
        1: 'I lundar växer rikligt med örter och ormbunkar.',
        2: 'På lundartad mo växer harsyra, ekorrbär och blåbär.',
        3: 'Karaktärsväxten för frisk mo är blåbär.',
        4: 'Karaktärsväxten för torr mo är lingon.',
        5: 'På karg mo växer ljung och lavar.',
        6: 'På lavmo täcker lavarna marken.'
    },
    puulaji: (n) => `trädslag ${n}`,
    muut: 'övriga',
    luokka: (n) => `klass ${n}`,
    hakkuu: (n) => `avverkning ${n}`,
    faktat: {
        puut: 'Träd', puulajit: 'Trädslag', puita: 'Stamantal', puuta: 'Virkesförråd', kasvu: 'Tillväxt',
        kasvupaikka: 'Växtplats', maapera: 'Jordart'
    },
    puutKokoJaPaksuus: (h, d) => `i genomsnitt ${h} m höga och ${d} cm grova`,
    puutKoko: (h) => `i genomsnitt ${h} m höga`,
    puitaHehtaarilla: (n) => `cirka ${n} per hektar`,
    puutaHehtaarilla: (v) => `${v} m³ per hektar`,
    kasvuHehtaarilla: (v) => `${v} m³ per hektar och år`,
    ehdotus: (type, year) => `Beräknat förslag: ${type.toLowerCase()} år ${year}.`,

    lajit: [
        { value: 'manty', label: 'Tall' },
        { value: 'kuusi', label: 'Gran' },
        { value: 'koivu', label: 'Björk' },
        { value: 'lehti', label: 'Annat lövträd (t.ex. asp eller al)' }
    ],
    vaiheet: [
        { value: 'taimikko', label: 'Plantbestånd' },
        { value: 'nuori', label: 'Klenare gallringsbestånd' },
        { value: 'varttunut', label: 'Grövre gallringsbestånd' },
        { value: 'kypsa', label: 'Förnyelsemogen skog' }
    ],
    vaiheSelitys: {
        taimikko: 'I ett plantbestånd är träden unga och klena, under 8 cm i brösthöjd.',
        nuori: 'I ett klenare gallringsbestånd är trädens medeldiameter cirka 8–16 cm. Första gallringen görs i det här skedet.',
        varttunut: 'I ett grövre gallringsbestånd är trädens medeldiameter över 16 cm, men skogen är ännu inte förnyelsemogen.',
        kypsa: 'En förnyelsemogen skog är så gammal eller grov att den kan förnyas.'
    },
    alle: (v, unit) => `under ${v} ${unit}`,
    yli: (v, unit) => `över ${v} ${unit}`,
    vuotta: 'år',
    q: {
        puulaji: 'Vilket trädslag dominerar på den här figuren?',
        puulajiSelitys: (name, pct) => `Enligt uppgifterna är huvudträdslaget ${name.toLowerCase()}, cirka ${pct} % av trädbeståndet.`,
        vaihe: 'Vilken utvecklingsklass hör den här skogen till?',
        pituus: 'Hur höga är träden här i genomsnitt?',
        pituusSelitys: (h) => `Enligt uppgifterna är trädens medelhöjd ${h} m.`,
        ika: 'Hur gammalt är trädbeståndet i genomsnitt?',
        ikaSelitys: (a) => `Enligt uppgifterna är trädbeståndets medelålder cirka ${a} år.`,
        maa: 'Är marken här mineraljord eller torv?',
        kivennainen: 'Mineraljord (sand, morän)',
        turve: 'Torv (myr eller dikad myr)',
        maaSelitys: (soil) => `Enligt uppgifterna är jordarten ${soil.toLowerCase()}.`,
        kasvupaikka: 'Vilken växtplats är det här? Titta på riset och markvegetationen.',
        kasvupaikkaSelitys: (site, hint) => `Enligt uppgifterna är växtplatsen ${site.toLowerCase()}. ${hint}`,
        tilavuus: 'Hur mycket virke finns det per hektar på den här figuren?',
        tilavuusSelitys: (v) => `Enligt uppgifterna finns det ${v} m³ virke per hektar. En hektar är ett område på 100 × 100 meter.`,
        havainto: (main, h) => `Enligt uppgifterna ${main ? `är huvudträdslaget ${main.toLowerCase()}` : 'växer här blandade trädslag'} och träden är cirka ${h} m höga. Stämmer det med det du ser?`,
        kylla: 'Ja, det stämmer',
        ei: 'Nej, det stämmer inte',
        eos: 'Jag kan inte säga'
    }
};

export const TEKSTIT = { fi, sv, en };
// Käyttöohjeen osio (js/ui/ohje-osiot.js)
const OHJE = {
    fi: {
        otsikko: "Kerro tästä paikasta ja metsävisa",
        html: `<p>Karttapainike <strong>Kerro tästä paikasta</strong> kertoo, millaisessa metsässä seisot: kuvion puulajit, iän, kehitysluokan ja puuston. Tiedot tulevat Metsäkeskuksen metsävaratiedoista sijaintisi kohdalta, eikä kiinteistöä tarvitse valita.</p>
<ul>
<li><strong>Metsävisa</strong>: <em>Kysy minulta</em> antaa kysymyksiä kuviosta, jossa olet. Valitse taso: helppo, keskitaso, vaikea tai havainto. Pisteitä saa oikeista vastauksista, uusista kuvioista ja vastausputkista.</li>
<li><strong>Kokeile kartalta</strong>: ilman maastoa voit siirtää karttaa niin, että risti on haluamassasi kohdassa.</li>
<li>Pisteet ja havainnot tallentuvat vain tälle laitteelle.</li>
</ul>
<p>Maksuton nyt. Toiminto voi myöhemmin muuttua maksulliseksi.</p>`
    },
    sv: {
        otsikko: "Berätta om den här platsen och skogsquiz",
        html: `<p>Kartknappen <strong>Berätta om den här platsen</strong> visar vilken slags skog du står i: figurens trädslag, ålder, utvecklingsklass och virkesförråd. Uppgifterna kommer från Skogscentralens skogsdata för din position, och du behöver inte välja en fastighet.</p>
<ul>
<li><strong>Skogsquiz</strong>: <em>Fråga mig</em> ger frågor om figuren där du är. Välj nivå: lätt, medel, svår eller observation. Poäng får du för rätta svar, nya figurer och svit av rätta svar.</li>
<li><strong>Testa på kartan</strong>: utan att vara i terrängen kan du flytta kartan så att krysset är där du vill.</li>
<li>Poäng och observationer sparas bara på den här enheten.</li>
</ul>
<p>Kostnadsfri nu. Funktionen kan senare bli avgiftsbelagd.</p>`
    },
    en: {
        otsikko: "Tell me about this place and forest quiz",
        html: `<p>The map button <strong>Tell me about this place</strong> describes the forest you are standing in: the stand’s tree species, age, development class and volume. The data comes from the Finnish Forest Centre’s forest data at your location, and you do not need to select a property.</p>
<ul>
<li><strong>Forest quiz</strong>: <em>Quiz me</em> gives questions about the stand you are in. Choose a level: easy, medium, hard or observation. You earn points for correct answers, new stands and answer streaks.</li>
<li><strong>Try it on the map</strong>: without going outdoors, move the map so that the crosshair is where you want.</li>
<li>Points and observations are saved on this device only.</li>
</ul>
<p>Free for now. This feature may become paid later.</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);

/** Pistemäärään perustuva arvonimi (vain tällä laitteella). */
export const ARVONIMI_RAJAT = [0, 100, 300, 600, 1000];
export const ARVONIMET = ARVONIMI_RAJAT.map((raja, i) => [raja, T.arvonimet[i]]);

export function arvonimi(pisteet) {
    let nimi = ARVONIMET[0][1];
    for (const [raja, n] of ARVONIMET) if (pisteet >= raja) nimi = n;
    return nimi;
}
