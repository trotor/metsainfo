/**
 * Puukaupan hinta-arvion tekstit suomeksi ja englanniksi (#24):
 * Arvio-välilehti, yhteenvedon kortti, ostonäkymä, esimerkkimetsä
 * (js/ui/estimate.js) sekä hakkuutavat, puulajit ja jaettava raportti
 * (js/pricing/format.js).
 *
 * Kaupan tuote on vain suomeksi ("Puukaupan hinta-arvio"); englanniksi
 * toiminto on "Timber sale estimate". Hinta tulee aina kaupasta.
 */

import { pick } from '../i18n.js';
import { PRICE_REGIONS } from '../pricing/region.js';

const fi = {
    /* ---------- Välilehti ja kortti ---------- */
    uutta: 'Uutta',
    valilehti: 'Arvio',
    korttiOtsikko: 'Arvio nykyhinnoin',
    hakkuidenArvo: 'Hakkuiden arvo tämän viikon kantohinnoilla',
    avaa: 'Avaa',
    naytaArvo: 'Näytä arvo',
    nayta: 'Näytä',
    hinnatPuuttuvat: 'Hinnat puuttuvat.',
    korttiVajaa: 'Osalta kuvioista puuttuu hintoja, joten arvio on vajaa.',
    korttiHakkuut: (range) => `ehdotetut hakkuut${range ? ` ${range}` : ''}`,

    /* ---------- Houkutin (ilman ostoa) ---------- */
    vuonna: (year) => `Vuonna ${year}. `,
    vuosina: (first, last) => `Vuosina ${first}–${last}. `,
    ehdotuksia: (n, volume) => `${n} ${n === 1 ? 'hakkuuehdotus' : 'hakkuuehdotusta'}, n.&nbsp;${volume}&nbsp;m³`,
    ehdotusKysymys: (years, n) => `${years}Paljonko ${n === 1 ? 'se on' : 'ne ovat'} arvoltaan tämän viikon kantohinnoilla?`,
    eiEhdotuksia: (volume) => `Ei hakkuuehdotuksia, puustoa n.&nbsp;${volume}&nbsp;m³`,
    puustoKysymys: 'Paljonko puusto on arvoltaan tämän viikon kantohinnoilla?',

    /* ---------- Lataus ja virheet ---------- */
    selvitetaanAluetta: 'Hetkinen – selvitetään hinta-aluetta…',
    haetaanHintoja: 'Hetkinen – haetaan kantohintoja…',
    paivitysEpaonnistui: 'Hintojen päivitys ei onnistunut. Käytössä aiemmin haetut hinnat.',
    hintojaEiSaatu: 'Hintoja ei saatu haettua. Tarkista verkkoyhteys tai syötä hinnat itse.',

    /* ---------- Lukittu Arvio-välilehti ---------- */
    nimi: 'Puukaupan hinta-arvio',
    esittely: 'Näe, paljonko kiinteistön ehdotetut hakkuut ovat arvoltaan alueen tuoreilla kantohinnoilla. Voit käyttää myös omia hintoja, esimerkiksi saamasi puukauppatarjouksen mukaan.',
    kokeileEsimerkilla: 'Kokeile esimerkkimetsällä',
    avaaArvio: 'Avaa hinta-arvio',

    /* ---------- Arvio-välilehti ---------- */
    haetaan: 'Haetaan…',
    eiHaettujaHintoja: 'Ei haettuja hintoja',
    taydennetty: (sources) => `Osa hinnoista täydennetty: ${sources}.`,
    haetaanPieni: 'haetaan…',
    eiHintoja: 'ei hintoja',
    omiaHintoja: 'omia hintoja',
    ehdotetutHakkuut: 'Ehdotetut hakkuut',
    hinnatPuuttuvatHae: 'Hinnat puuttuvat. Hae ne verkosta tai syötä itse alla.',
    kokoPuusto: 'Koko puusto uudistushakkuun hinnoin',
    kantoraha: 'Kantoraha-arvo, ei kerralla hakattavissa.',
    puustoVajaa: (n) => `${n} kuviolta puuttuu uudistushakkuun hintoja, joten arvo on vajaa.`,
    hinnat: 'Hinnat',
    piilota: 'Piilota',
    muokkaa: 'Muokkaa',
    hintaAlue: 'Hinta-alue',
    kunta: (name) => ` · kunta ${name}`,
    haeVerkosta: '↻ Hae verkosta',
    tukki: 'Tukki',
    kuitu: 'Kuitu',
    // Hintakentän aria-label: "Mänty tukki €/m³"
    lajite: { tukki: 'tukki', kuitu: 'kuitu' },
    omatSyotetty: 'Korostetut hinnat on syötetty itse.',
    palautaVerkon: 'Palauta verkon hinnat',
    jaa: 'Jaa arvio',
    hienoArvio: (harvennus, ensiharvennus) => `Suuntaa-antava arvio, ei korvaa puukauppatarjousta. Tukki- ja kuitupuu on jaettu puulajiosuuksien mukaan; harvennuksissa poistuma ${harvennus}, ensiharvennuksissa ${ensiharvennus}, uudistushakkuissa koko puusto.`,
    hienoLahteet: (source, ccLink) => `Hinnat: ${source} ja Luonnonvarakeskus (tilastotietokanta), kunta: Tilastokeskus. Luken ja Tilastokeskuksen aineistot ${ccLink}.`,
    oletusLahde: 'Metsäteollisuus ry:n puukaupan viikkoseuranta',
    ccBy: 'https://creativecommons.org/licenses/by/4.0/deed.fi',
    eiEhdotuksiaKiinteistolla: 'Kiinteistöllä ei ole hakkuuehdotuksia.',
    summaVajaa: (n) => `${n} kuviolta puuttuu osa hinnoista, joten summa on vajaa. Tarkista hakkuutapojen hinnat taulukosta.`,
    prosentti: (n) => `${n} %`,
    viikko: (week, year) => `vko ${week}/${year}`,
    // Hinta-alueiden nimet (js/pricing/region.js)
    alueet: Object.fromEntries(Object.entries(PRICE_REGIONS).map(([key, r]) => [key, r.name])),

    /* ---------- Jaettava raportti ---------- */
    tiedosto: (label) => `hinta-arvio_${label}.csv`,
    tiedostoEsimerkki: 'esimerkkimetsa',
    tiedostoKiinteisto: 'kiinteisto',
    esimerkkiRaportissa: 'Esimerkkimetsä (kuvitteellinen)',

    /* ---------- Ostonäkymä ---------- */
    sulje: 'Sulje',
    pwEsittely: 'Näe, paljonko kiinteistön ehdotetut hakkuut ovat arvoltaan alueen tuoreilla kantohinnoilla.',
    esimerkkiAria: 'Esimerkki hinta-arviosta',
    esikatselu: 'Tältä arvio näyttää · esimerkkimetsä',
    lasketaanEsimerkkia: 'Hetkinen – lasketaan esimerkkiä…',
    etuHinnat: 'Alueen tuoreet kantohinnat tai omat hinnat, esim. puukauppatarjouksen mukaan',
    etuRaportti: 'Arvio vuosittain ja jaettava raportti, esim. kuolinpesän osakkaille',
    etuMaasto: 'Kokeilu: maastotila – kerro tästä paikasta ja metsävisa',
    etuLahihaku: 'Kokeilu: etsi läheltä – tietynlaiset metsät ympäriltäsi kartalle',
    etuKertaosto: 'Kertaosto, ei tilausta – kaikki kiinteistöt',
    kertamaksu: 'Kertamaksu',
    osta: 'Osta hinta-arvio',
    palautaOsto: 'Palauta aiempi osto',
    haetaanHintaa: 'Hetkinen – haetaan hintaa kaupasta…',
    pwHieno: 'Hinnat: Metsäteollisuus ry:n puukaupan viikkoseuranta ja Luonnonvarakeskuksen tilastot. Arvio on suuntaa-antava.',
    eiTuotetta: 'Tuotetta ei saatu kaupasta juuri nyt. Yritä myöhemmin uudelleen.',
    eiYhteytta: 'Kauppaan ei saatu yhteyttä.',
    avattu: 'Hinta-arvio avattu kaikille kiinteistöille.',
    odottaa: 'Osto odottaa hyväksyntää.',
    ostoEpaonnistui: 'Osto ei onnistunut. Yritä uudelleen.',
    palautettu: 'Osto palautettu – hinta-arvio on käytössä.',
    eiAiempaa: 'Aiempaa ostoa ei löytynyt tällä kauppatilillä.',
    palautusEpaonnistui: 'Palautus ei onnistunut. Yritä uudelleen.',

    /* ---------- Esimerkkimetsä ---------- */
    esimerkkimetsa: 'Esimerkkimetsä',
    kuvitteellinen: 'Kuvitteellinen tila hinta-arvion kokeiluun',
    avaaOmille: 'Avaa hinta-arvio omille kiinteistöille',

    /* ---------- js/pricing/format.js ---------- */
    euro: (amount) => `≈ ${amount} €`,
    hakkuutavat: {
        uudistus: 'Uudistushakkuu',
        harvennus: 'Harvennus',
        ensiharvennus: 'Ensiharvennus'
    },
    puulajit: {
        manty: 'Mänty',
        kuusi: 'Kuusi',
        koivu: 'Koivu ja muut'
    },
    raportti: {
        otsikko: 'Metsäinfo – puukaupan hinta-arvio',
        kiinteisto: 'Kiinteistö',
        hintaAlue: 'Hinta-alue',
        hinnat: 'Hinnat',
        omatHinnat: 'omat hinnat',
        yhteensa: 'Ehdotetut hakkuut yhteensä (€)',
        kokoPuusto: 'Koko puusto uudistushakkuun hinnoin (€)',
        huom: 'Huom',
        vajaa: (n) => `Osalta kuvioista puuttuu hintoja (${n} kuviota), joten arvio on vajaa`,
        hintaSarakkeet: ['Hakkuutapa', 'Puulaji', 'Tukki (€/m³)', 'Kuitu (€/m³)'],
        kuvioSarakkeet: ['Kuvio', 'Vuosi', 'Hakkuutapa', 'Pinta-ala (ha)', 'Arvio (€)'],
        loppu: 'Arvio on suuntaa-antava eikä korvaa puukauppatarjousta. Tukki- ja kuitupuu on jaettu puulajiosuuksien mukaan; harvennuksissa poistuma 30 %, ensiharvennuksissa 35 %.'
    }
};

const en = {
    /* ---------- Tab and card ---------- */
    uutta: 'New',
    valilehti: 'Estimate',
    korttiOtsikko: 'Value at current prices',
    hakkuidenArvo: 'Value of the fellings at this week’s stumpage prices',
    avaa: 'Open',
    naytaArvo: 'Show value',
    nayta: 'Show',
    hinnatPuuttuvat: 'Prices are missing.',
    korttiVajaa: 'Prices are missing for some stands, so the estimate is incomplete.',
    korttiHakkuut: (range) => `proposed fellings${range ? ` ${range}` : ''}`,

    /* ---------- Teaser (not purchased) ---------- */
    vuonna: (year) => `In ${year}. `,
    vuosina: (first, last) => `In ${first}–${last}. `,
    ehdotuksia: (n, volume) => `${n} proposed ${n === 1 ? 'felling' : 'fellings'}, approx.&nbsp;${volume}&nbsp;m³`,
    ehdotusKysymys: (years, n) => `${years}What ${n === 1 ? 'is it' : 'are they'} worth at this week’s stumpage prices?`,
    eiEhdotuksia: (volume) => `No proposed fellings, growing stock approx.&nbsp;${volume}&nbsp;m³`,
    puustoKysymys: 'What is the growing stock worth at this week’s stumpage prices?',

    /* ---------- Loading and errors ---------- */
    selvitetaanAluetta: 'One moment – finding the price region…',
    haetaanHintoja: 'One moment – fetching stumpage prices…',
    paivitysEpaonnistui: 'Prices could not be updated. Using previously fetched prices.',
    hintojaEiSaatu: 'Prices could not be fetched. Check your internet connection or enter the prices yourself.',

    /* ---------- Locked Estimate tab ---------- */
    nimi: 'Timber sale estimate',
    esittely: 'See what the proposed fellings on the property are worth at recent stumpage prices for the area. You can also use your own prices, for example from a timber sale offer you have received.',
    kokeileEsimerkilla: 'Try with an example forest',
    avaaArvio: 'Unlock timber sale estimate',

    /* ---------- Estimate tab ---------- */
    haetaan: 'Fetching…',
    eiHaettujaHintoja: 'No prices fetched',
    taydennetty: (sources) => `Some prices filled in from: ${sources}.`,
    haetaanPieni: 'fetching…',
    eiHintoja: 'no prices',
    omiaHintoja: 'own prices',
    ehdotetutHakkuut: 'Proposed fellings',
    hinnatPuuttuvatHae: 'Prices are missing. Fetch them online or enter them yourself below.',
    kokoPuusto: 'Whole growing stock at regeneration felling prices',
    kantoraha: 'Stumpage value, not all fellable at once.',
    puustoVajaa: (n) => `${n} ${n === 1 ? 'stand is' : 'stands are'} missing regeneration felling prices, so the value is incomplete.`,
    hinnat: 'Prices',
    piilota: 'Hide',
    muokkaa: 'Edit',
    hintaAlue: 'Price region',
    kunta: (name) => ` · municipality ${name}`,
    haeVerkosta: '↻ Fetch online',
    tukki: 'Sawlog',
    kuitu: 'Pulpwood',
    lajite: { tukki: 'sawlog', kuitu: 'pulpwood' },
    omatSyotetty: 'Highlighted prices have been entered by you.',
    palautaVerkon: 'Restore online prices',
    jaa: 'Share estimate',
    hienoArvio: (harvennus, ensiharvennus) => `A rough estimate that does not replace a timber sale offer. Sawlogs and pulpwood are split by tree species shares; removal in thinnings ${harvennus}, in first thinnings ${ensiharvennus}, in regeneration fellings the whole growing stock.`,
    hienoLahteet: (source, ccLink) => `Prices: ${source} and Natural Resources Institute Finland (statistics database), municipality: Statistics Finland. Luke and Statistics Finland data ${ccLink}.`,
    oletusLahde: 'Finnish Forest Industries’ weekly timber trade survey',
    ccBy: 'https://creativecommons.org/licenses/by/4.0/deed.en',
    eiEhdotuksiaKiinteistolla: 'The property has no proposed fellings.',
    summaVajaa: (n) => `${n} ${n === 1 ? 'stand is' : 'stands are'} missing some prices, so the total is incomplete. Check the prices for each felling method in the table.`,
    prosentti: (n) => `${n}%`,
    viikko: (week, year) => `week ${week}/${year}`,
    alueet: {
        'etela-suomi': 'Southern Finland',
        'keski-suomi': 'Central Finland',
        'savo-karjala': 'Savo-Karelia',
        'kymi-savo': 'Kymi-Savo',
        'etela-pohjanmaa': 'South Ostrobothnia',
        'pohjois-pohjanmaa': 'North Ostrobothnia',
        'kainuu-koillismaa': 'Kainuu-Koillismaa',
        'lappi': 'Lapland',
        'koko-maa': 'Whole country'
    },

    /* ---------- Shared report ---------- */
    tiedosto: (label) => `timber-sale-estimate_${label}.csv`,
    tiedostoEsimerkki: 'example-forest',
    tiedostoKiinteisto: 'property',
    esimerkkiRaportissa: 'Example forest (fictional)',

    /* ---------- Paywall ---------- */
    sulje: 'Close',
    pwEsittely: 'See what the proposed fellings on the property are worth at recent stumpage prices for the area.',
    esimerkkiAria: 'Example of a timber sale estimate',
    esikatselu: 'What the estimate looks like · example forest',
    lasketaanEsimerkkia: 'One moment – calculating the example…',
    etuHinnat: 'Recent stumpage prices for the area or your own prices, e.g. from a timber sale offer',
    etuRaportti: 'Estimate by year and a shareable report, e.g. for the co-owners of an estate',
    etuMaasto: 'Trial: field mode – tell me about this place, and a forest quiz',
    etuLahihaku: 'Trial: search nearby – specific kinds of forest around you on the map',
    etuKertaosto: 'One-off purchase, no subscription – all properties',
    kertamaksu: 'One-off payment',
    osta: 'Buy timber sale estimate',
    palautaOsto: 'Restore previous purchase',
    haetaanHintaa: 'One moment – fetching the price from the store…',
    pwHieno: 'Prices: Finnish Forest Industries’ weekly timber trade survey and Natural Resources Institute Finland statistics. The estimate is indicative.',
    eiTuotetta: 'The product could not be loaded from the store right now. Please try again later.',
    eiYhteytta: 'Could not connect to the store.',
    avattu: 'Timber sale estimate unlocked for all properties.',
    odottaa: 'Purchase is awaiting approval.',
    ostoEpaonnistui: 'Purchase failed. Please try again.',
    palautettu: 'Purchase restored – timber sale estimate is unlocked.',
    eiAiempaa: 'No previous purchase was found for this store account.',
    palautusEpaonnistui: 'Restore failed. Please try again.',

    /* ---------- Example forest ---------- */
    esimerkkimetsa: 'Example forest',
    kuvitteellinen: 'A fictional property for trying out the timber sale estimate',
    avaaOmille: 'Unlock timber sale estimate for your own properties',

    /* ---------- js/pricing/format.js ---------- */
    euro: (amount) => `≈ €${amount}`,
    hakkuutavat: {
        uudistus: 'Regeneration felling',
        harvennus: 'Thinning',
        ensiharvennus: 'First thinning'
    },
    puulajit: {
        manty: 'Pine',
        kuusi: 'Spruce',
        koivu: 'Birch and others'
    },
    raportti: {
        otsikko: 'Metsäinfo – timber sale estimate',
        kiinteisto: 'Property',
        hintaAlue: 'Price region',
        hinnat: 'Prices',
        omatHinnat: 'own prices',
        yhteensa: 'Proposed fellings total (€)',
        kokoPuusto: 'Whole growing stock at regeneration felling prices (€)',
        huom: 'Note',
        vajaa: (n) => `Prices are missing for some stands (${n} ${n === 1 ? 'stand' : 'stands'}), so the estimate is incomplete`,
        hintaSarakkeet: ['Felling method', 'Tree species', 'Sawlog (€/m³)', 'Pulpwood (€/m³)'],
        kuvioSarakkeet: ['Stand', 'Year', 'Felling method', 'Area (ha)', 'Estimate (€)'],
        loppu: 'The estimate is indicative and does not replace a timber sale offer. Sawlogs and pulpwood are split by tree species shares; removal in thinnings 30%, in first thinnings 35%.'
    }
};

export const TEKSTIT = { fi, en };
export const T = pick(TEKSTIT);
