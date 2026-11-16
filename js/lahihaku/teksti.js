/**
 * Lähihaun tekstit suomeksi, ruotsiksi ja englanniksi (#24).
 */

import { pick } from '../i18n.js';

const fi = {
    nappi: 'Etsi läheltä',
    otsikko: 'Etsi läheltä',
    sulje: 'Sulje',
    kokeilu: 'Kokeilu · vain testiversiossa',
    ohje: 'Etsi tietynlaisia metsiä 1 km × 1 km alueelta ympäriltäsi.',
    vaihe: 'Vaihe',
    puulaji: 'Puulaji',
    muuta: 'Muuta',
    vaiheet: {
        taimikko: 'Taimikko',
        nuori: 'Nuori kasvatusmetsä',
        varttunut: 'Varttunut kasvatusmetsä',
        uudistuskypsa: 'Uudistuskypsä',
        vanha: 'Vanha metsä (yli 100 v)'
    },
    puulajit: { manty: 'Männikkö', kuusi: 'Kuusikko', koivu: 'Koivikko', lehti: 'Muu lehtimetsä', seka: 'Sekametsä' },
    hakkuu: 'Hakkuuehdotus lähivuosina',
    hae: 'Hae',
    valitseEhto: 'Valitse vähintään yksi ehto.',
    keskiSijainti: 'Hakualue: sijaintisi ympäriltä.',
    keskiKartta: 'Sijaintia ei ole, joten haetaan kartan keskeltä.',
    keskiLahde: {
        sijainti: 'Hakualue: sijaintisi ympäriltä.',
        kartta: 'Hakualue: kartan keskeltä (sijaintia ei ollut).',
        tallennettu: 'Hakualue: tallennetun haun alue.'
    },
    tallennaHaku: 'Tallenna haku suosikiksi',
    tallennaKuvio: 'Tallenna kuvio suosikiksi',
    haetaan: (n, kaikki) => `Haetaan metsätietoja… ${n}/${kaikki}`,
    eiVerkkoa: 'Metsätietoja ei saatu. Tarkista verkkoyhteys.',
    osittain: (n, kaikki) => `Osa alueesta jäi hakematta (${n}/${kaikki} ruutua puuttuu), joten kaikkia kuvioita ei ehkä löytynyt.`,
    yritaUudelleen: 'Yritä uudelleen',
    tulokset: (n) => (n === 1 ? '1 kuvio' : `${n} kuviota`),
    eiTuloksia: 'Alueelta ei löytynyt tällaisia kuvioita. Kokeile väljempää hakua.',
    muutaHakua: 'Muuta hakua',
    haeTasta: 'Hae uudelleen tästä',
    takaisinListaan: 'Takaisin listaan',
    tallaKuviolla: 'olet tällä kuviolla',
    etaisyys: (m, suunta) => `${m} m ${suunta}`,
    suunnat: {
        pohjoinen: 'pohjoiseen', koillinen: 'koilliseen', 'itä': 'itään', kaakko: 'kaakkoon',
        'etelä': 'etelään', lounas: 'lounaaseen', 'länsi': 'länteen', luode: 'luoteeseen'
    },
    kuvio: (n, ha) => `Kuvio ${n} · ${ha} ha`,
    kehitysluokka: 'Kehitysluokka',
    paapuulaji: 'Pääpuulaji',
    ika: 'Ikä',
    vuotta: (n) => `${n} v`,
    prosentti: (n) => `${n} %`,
    pituus: 'Keskipituus',
    tilavuus: 'Puuston määrä',
    hakkuuehdotus: 'Hakkuuehdotus',
    lahde: (nyt) => `Metsäkeskus${nyt ? `, laskettu nykytila ${nyt}` : ''}.`,
    lukittu: (n) => `Alueelta löytyi ${n === 1 ? '1 kuvio' : `${n} kuviota`}. Kuviot kartalla ja listana kuuluvat Puukaupan hinta-arvio -lisäosaan (sama kertaosto).`,
    avaaLisaosa: 'Avaa lisäosa'
};

const en = {
    nappi: 'Search nearby',
    otsikko: 'Search nearby',
    sulje: 'Close',
    kokeilu: 'Trial · test version only',
    ohje: 'Find forests of a certain kind within 1 km × 1 km around you.',
    vaihe: 'Stage',
    puulaji: 'Tree species',
    muuta: 'Other',
    vaiheet: {
        taimikko: 'Sapling stand',
        nuori: 'Young thinning stand',
        varttunut: 'Advanced thinning stand',
        uudistuskypsa: 'Mature forest',
        vanha: 'Old forest (over 100 years)'
    },
    puulajit: { manty: 'Pine forest', kuusi: 'Spruce forest', koivu: 'Birch forest', lehti: 'Other broadleaf forest', seka: 'Mixed forest' },
    hakkuu: 'Cutting proposed in the next few years',
    hae: 'Search',
    valitseEhto: 'Choose at least one option.',
    keskiSijainti: 'Search area: around your location.',
    keskiKartta: 'No location yet, so searching around the map centre.',
    keskiLahde: {
        sijainti: 'Search area: around your location.',
        kartta: 'Search area: around the map centre (no location).',
        tallennettu: 'Search area: the saved search area.'
    },
    tallennaHaku: 'Save search as a favourite',
    tallennaKuvio: 'Save stand as a favourite',
    haetaan: (n, kaikki) => `Loading forest data… ${n}/${kaikki}`,
    eiVerkkoa: 'Could not load forest data. Check your connection.',
    osittain: (n, kaikki) => `Part of the area could not be loaded (${n}/${kaikki} tiles missing), so some stands may be missing.`,
    yritaUudelleen: 'Try again',
    tulokset: (n) => (n === 1 ? '1 stand' : `${n} stands`),
    eiTuloksia: 'No such stands in this area. Try a broader search.',
    muutaHakua: 'Change search',
    haeTasta: 'Search again here',
    takaisinListaan: 'Back to the list',
    tallaKuviolla: 'you are in this stand',
    etaisyys: (m, suunta) => `${m} m ${suunta}`,
    suunnat: {
        pohjoinen: 'north', koillinen: 'north-east', 'itä': 'east', kaakko: 'south-east',
        'etelä': 'south', lounas: 'south-west', 'länsi': 'west', luode: 'north-west'
    },
    kuvio: (n, ha) => `Stand ${n} · ${ha} ha`,
    kehitysluokka: 'Development class',
    paapuulaji: 'Main species',
    ika: 'Age',
    vuotta: (n) => `${n} years`,
    prosentti: (n) => `${n}%`,
    pituus: 'Mean height',
    tilavuus: 'Volume',
    hakkuuehdotus: 'Proposed cutting',
    lahde: (nyt) => `Finnish Forest Centre${nyt ? `, current state calculated for ${nyt}` : ''}.`,
    lukittu: (n) => `Found ${n === 1 ? '1 stand' : `${n} stands`} in this area. Stands on the map and as a list are part of the Timber sale estimate add-on (one purchase).`,
    avaaLisaosa: 'Unlock the add-on'
};

const sv = {
    nappi: 'Sök i närheten',
    otsikko: 'Sök i närheten',
    sulje: 'Stäng',
    kokeilu: 'Försöksfunktion · endast i testversionen',
    ohje: 'Hitta skogar av ett visst slag inom 1 km × 1 km runt dig.',
    vaihe: 'Skede',
    puulaji: 'Trädslag',
    muuta: 'Övrigt',
    vaiheet: {
        taimikko: 'Plantbestånd',
        nuori: 'Klenare gallringsbestånd',
        varttunut: 'Grövre gallringsbestånd',
        uudistuskypsa: 'Förnyelsemogen skog',
        vanha: 'Gammal skog (över 100 år)'
    },
    puulajit: { manty: 'Tallskog', kuusi: 'Granskog', koivu: 'Björkskog', lehti: 'Annan lövskog', seka: 'Blandskog' },
    hakkuu: 'Avverkningsförslag inom de närmaste åren',
    hae: 'Sök',
    valitseEhto: 'Välj minst ett villkor.',
    keskiSijainti: 'Sökområde: runt din position.',
    keskiKartta: 'Ingen position ännu, så sökningen görs från kartans mitt.',
    keskiLahde: {
        sijainti: 'Sökområde: runt din position.',
        kartta: 'Sökområde: kartans mitt (position saknades).',
        tallennettu: 'Sökområde: den sparade sökningens område.'
    },
    tallennaHaku: 'Spara sökningen som favorit',
    tallennaKuvio: 'Spara figuren som favorit',
    haetaan: (n, kaikki) => `Hämtar skogsdata… ${n}/${kaikki}`,
    eiVerkkoa: 'Skogsdata kunde inte hämtas. Kontrollera nätverksanslutningen.',
    osittain: (n, kaikki) => `En del av området kunde inte hämtas (${n}/${kaikki} rutor saknas), så alla figurer hittades kanske inte.`,
    yritaUudelleen: 'Försök igen',
    tulokset: (n) => (n === 1 ? '1 figur' : `${n} figurer`),
    eiTuloksia: 'Inga sådana figurer hittades i området. Prova en bredare sökning.',
    muutaHakua: 'Ändra sökningen',
    haeTasta: 'Sök på nytt här',
    takaisinListaan: 'Tillbaka till listan',
    tallaKuviolla: 'du är på den här figuren',
    etaisyys: (m, suunta) => `${m} m ${suunta}`,
    suunnat: {
        pohjoinen: 'norrut', koillinen: 'åt nordost', 'itä': 'österut', kaakko: 'åt sydost',
        'etelä': 'söderut', lounas: 'åt sydväst', 'länsi': 'västerut', luode: 'åt nordväst'
    },
    kuvio: (n, ha) => `Figur ${n} · ${ha} ha`,
    kehitysluokka: 'Utvecklingsklass',
    paapuulaji: 'Huvudträdslag',
    ika: 'Ålder',
    vuotta: (n) => `${n} år`,
    prosentti: (n) => `${n} %`,
    pituus: 'Medelhöjd',
    tilavuus: 'Virkesförråd',
    hakkuuehdotus: 'Avverkningsförslag',
    lahde: (nyt) => `Skogscentralen${nyt ? `, nuläget beräknat för ${nyt}` : ''}.`,
    lukittu: (n) => `${n === 1 ? '1 figur' : `${n} figurer`} hittades i området. Figurerna på kartan och i listan ingår i tillägget Prisuppskattning för virkesaffär (samma engångsköp).`,
    avaaLisaosa: 'Lås upp tillägget'
};

export const TEKSTIT = { fi, sv, en };
// Käyttöohjeen osio (js/ui/ohje-osiot.js)
const OHJE = {
    fi: {
        otsikko: "Etsi läheltä",
        html: `<p>Karttapainike <strong>Etsi läheltä</strong> etsii tietynlaisia metsiä 1 km × 1 km alueelta sijaintisi ympäriltä tai kartan keskeltä, jos sijaintia ei ole.</p>
<ul>
<li>Valitse vaihe (esim. taimikko tai uudistuskypsä), puulaji tai hakkuuehdotus lähivuosina ja paina Hae.</li>
<li>Löydetyt kuviot näkyvät kartalla ja listassa etäisyyksineen. Kuvion napautus näyttää sen tiedot.</li>
<li>Haun ja kuvion voi tallentaa suosikkeihin.</li>
</ul>
<p>Kartan ja listan kuviot kuuluvat puukaupan hinta-arvion lisäosaan (sama kertaosto).</p>`
    },
    sv: {
        otsikko: "Sök i närheten",
        html: `<p>Kartknappen <strong>Sök i närheten</strong> söker skogar av ett visst slag inom 1 km × 1 km runt din position, eller mitt på kartan om positionen saknas.</p>
<ul>
<li>Välj skede (t.ex. plantbestånd eller förnyelsemogen skog), trädslag eller avverkningsförslag de närmaste åren och tryck Sök.</li>
<li>Figurerna som hittas visas på kartan och i listan med avstånd. Tryck på en figur för att se uppgifterna.</li>
<li>Sökningen och figuren kan sparas bland favoriterna.</li>
</ul>
<p>Figurerna på kartan och i listan ingår i tillägget Prisuppskattning för virkesaffär (samma engångsköp).</p>`
    },
    en: {
        otsikko: "Search nearby",
        html: `<p>The map button <strong>Search nearby</strong> finds forests of a certain kind within 1 km × 1 km around your location, or around the map centre if your location is not available.</p>
<ul>
<li>Choose a stage (e.g. sapling stand or mature forest), tree species or a cutting proposal in the coming years, and press Search.</li>
<li>The stands found are shown on the map and in a list with distances. Tap a stand to see its details.</li>
<li>The search and the stand can be saved to favourites.</li>
</ul>
<p>The stands on the map and in the list are part of the timber sale price estimate add-on (same one-time purchase).</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
