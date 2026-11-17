/**
 * Puukaupan hinta-arvion tekstit suomeksi, ruotsiksi ja englanniksi (#23):
 * Arvio-välilehti, yhteenvedon kortti, ostonäkymä, esimerkkimetsä
 * (js/ui/estimate.js) sekä hakkuutavat, puulajit ja jaettava raportti
 * (js/pricing/format.js).
 *
 * Kaupan tuote on vain suomeksi ("Puukaupan hinta-arvio"); englanniksi
 * toiminto on "Timber sale estimate", ruotsiksi
 * "Prisuppskattning för virkesaffär". Hinta tulee aina kaupasta.
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
    esittelyValinta: 'Näe, paljonko valinnan ehdotetut hakkuut ovat arvoltaan alueen tuoreilla kantohinnoilla. Voit käyttää myös omia hintoja, esimerkiksi saamasi puukauppatarjouksen mukaan.',
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
    erittely: 'Mistä arvio koostuu?',
    erittelyAvaa: 'Näytä',
    erittelyHakkuut: 'Ehdotetut hakkuut puutavaralajeittain',
    erittelyKuviot: 'Ehdotetut hakkuut kuvioittain',
    erittelyPuusto: 'Koko puusto uudistushakkuun hinnoin',
    sarakkeet: { laji: 'Puutavaralaji', m3: 'm³', hinta: '€/m³', arvo: '€' },
    kuvioSarakkeet: { kuvio: 'Kuvio', hakkuu: 'Hakkuu', vuosi: 'Vuosi', ha: 'ha', m3: 'm³', arvo: '€' },
    yhteensaRivi: 'Yhteensä',
    keskiarvo: (eurM3, eurHa, ha) => `Keskimäärin ${eurM3} €/m³ ja ${eurHa} €/ha (${ha} ha).`,
    poistumaHuom: (h, e) => `Myytävä määrä: uudistushakkuussa koko tukki- ja kuitupuu, harvennuksessa ${h} ja ensiharvennuksessa ${e} siitä.`,
    laskenta: 'Laskenta: kuvion tukki- ja kuitupuu (m³/ha) kerrotaan pinta-alalla ja jaetaan puulajiosuuksien mukaan, ja kukin erä kerrotaan hakkuutavan kantohinnalla (€/m³).',
    huomOtsikko: 'Huomioitavaa',
    huomiot: [
        'Kantohinta on hinta pystypuusta ennen veroja. Puun myyntitulo on pääomatuloa (verokanta 30–34 %), ja metsävähennys voi pienentää veroa.',
        'Tilavuudet ovat Metsäkeskuksen kaukokartoitukseen perustuvia arvioita. Toteutuva kertymä jää usein pienemmäksi, ja tukin osuus voi poiketa.',
        'Leimikon koko, korjuuolot, kelirikko ja ostajan tarjous vaikuttavat todelliseen hintaan.',
        'Kuvio voi olla jo hakattu, vaikka ehdotus näkyy aineistossa.'
    ],
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
    eiEhdotuksiaValinnalla: 'Valinnassa ei ole hakkuuehdotuksia.',
    summaVajaa: (n) => `${n} kuviolta puuttuu osa hinnoista, joten summa on vajaa. Tarkista hakkuutapojen hinnat taulukosta.`,
    prosentti: (n) => `${n} %`,
    viikko: (week, year) => `vko ${week}/${year}`,
    // Hinta-alueiden nimet (js/pricing/region.js)
    alueet: Object.fromEntries(Object.entries(PRICE_REGIONS).map(([key, r]) => [key, r.name])),

    /* ---------- Jaettava raportti ---------- */
    tiedosto: (label) => `hinta-arvio_${label}.csv`,
    tiedostoEsimerkki: 'esimerkkimetsa',
    tiedostoKiinteisto: 'kiinteisto',
    tiedostoValinta: 'valinta',
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
    etuSaavutettavuus: 'Kokeilu: kuvioiden saavutettavuus ja tieyhteys – voi myöhemmin olla erillinen maksullinen lisäosa',
    etuKertaosto: 'Kertaosto, ei tilausta – kaikki kiinteistöt',
    kertamaksu: 'Kertamaksu',
    osta: 'Osta hinta-arvio',
    palautaOsto: 'Palauta aiempi osto',
    haetaanHintaa: 'Hetkinen – haetaan hintaa kaupasta…',
    pwLisat: 'Kertaosto sisältää hinta-arvion ja sen nykyiset toiminnot. Uusiin lisäominaisuuksiin voi liittyä erillisiä maksuja.',
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
        valinta: 'Valinta',
        hintaAlue: 'Hinta-alue',
        hinnat: 'Hinnat',
        omatHinnat: 'omat hinnat',
        yhteensa: 'Ehdotetut hakkuut yhteensä (€)',
        kokoPuusto: 'Koko puusto uudistushakkuun hinnoin (€)',
        huom: 'Huom',
        vajaa: (n) => `Osalta kuvioista puuttuu hintoja (${n} kuviota), joten arvio on vajaa`,
        hintaSarakkeet: ['Hakkuutapa', 'Puulaji', 'Tukki (€/m³)', 'Kuitu (€/m³)'],
        kuvioSarakkeet: ['Kuvio', 'Vuosi', 'Hakkuutapa', 'Pinta-ala (ha)', 'Arvio (€)', 'Myytävä tukki (m³)', 'Myytävä kuitu (m³)'],
        erittely: 'Ehdotetut hakkuut puutavaralajeittain',
        erittelyPuusto: 'Koko puusto puutavaralajeittain (uudistushakkuun hinnoin)',
        lajiSarakkeet: ['Hakkuutapa', 'Puulaji', 'Puutavaralaji', 'Määrä (m³)', 'Hinta (€/m³)', 'Arvo (€)'],
        loppu: 'Arvio on suuntaa-antava eikä korvaa puukauppatarjousta. Tukki- ja kuitupuu on jaettu puulajiosuuksien mukaan; harvennuksissa poistuma 30 %, ensiharvennuksissa 35 %.'
    }
};

const sv = {
    /* ---------- Flik och kort ---------- */
    uutta: 'Nytt',
    valilehti: 'Uppskattning',
    korttiOtsikko: 'Värde till aktuella priser',
    hakkuidenArvo: 'Avverkningarnas värde till veckans rotpriser',
    avaa: 'Öppna',
    naytaArvo: 'Visa värdet',
    nayta: 'Visa',
    hinnatPuuttuvat: 'Priser saknas.',
    korttiVajaa: 'Priser saknas för en del figurer, så uppskattningen är ofullständig.',
    korttiHakkuut: (range) => `föreslagna avverkningar${range ? ` ${range}` : ''}`,

    /* ---------- Lockbete (utan köp) ---------- */
    vuonna: (year) => `År ${year}. `,
    vuosina: (first, last) => `Åren ${first}–${last}. `,
    ehdotuksia: (n, volume) => `${n} avverkningsförslag, ca&nbsp;${volume}&nbsp;m³`,
    ehdotusKysymys: (years, n) => `${years}Hur mycket är ${n === 1 ? 'det' : 'de'} värda till veckans rotpriser?`,
    eiEhdotuksia: (volume) => `Inga avverkningsförslag, trädbestånd ca&nbsp;${volume}&nbsp;m³`,
    puustoKysymys: 'Hur mycket är trädbeståndet värt till veckans rotpriser?',

    /* ---------- Laddning och fel ---------- */
    selvitetaanAluetta: 'Ett ögonblick – prisområdet tas reda på…',
    haetaanHintoja: 'Ett ögonblick – rotpriserna hämtas…',
    paivitysEpaonnistui: 'Priserna kunde inte uppdateras. Tidigare hämtade priser används.',
    hintojaEiSaatu: 'Priserna kunde inte hämtas. Kontrollera nätverksanslutningen eller ange priserna själv.',

    /* ---------- Låst Uppskattning-flik ---------- */
    nimi: 'Prisuppskattning för virkesaffär',
    esittely: 'Se hur mycket fastighetens föreslagna avverkningar är värda till färska rotpriser i området. Du kan också använda egna priser, till exempel enligt ett anbud på virkesaffär som du har fått.',
    esittelyValinta: 'Se hur mycket urvalets föreslagna avverkningar är värda till färska rotpriser i området. Du kan också använda egna priser, till exempel enligt ett anbud på virkesaffär som du har fått.',
    kokeileEsimerkilla: 'Prova med en exempelskog',
    avaaArvio: 'Lås upp prisuppskattningen',

    /* ---------- Uppskattning-fliken ---------- */
    haetaan: 'Hämtas…',
    eiHaettujaHintoja: 'Inga hämtade priser',
    taydennetty: (sources) => `En del priser har kompletterats: ${sources}.`,
    haetaanPieni: 'hämtas…',
    eiHintoja: 'inga priser',
    omiaHintoja: 'egna priser',
    ehdotetutHakkuut: 'Föreslagna avverkningar',
    hinnatPuuttuvatHae: 'Priser saknas. Hämta dem från nätet eller ange dem själv nedan.',
    kokoPuusto: 'Hela trädbeståndet till priser för förnyelseavverkning',
    kantoraha: 'Rotvärde, kan inte avverkas på en gång.',
    puustoVajaa: (n) => `Priser för förnyelseavverkning saknas för ${n} ${n === 1 ? 'figur' : 'figurer'}, så värdet är ofullständigt.`,
    hinnat: 'Priser',
    piilota: 'Dölj',
    erittely: 'Vad består uppskattningen av?',
    erittelyAvaa: 'Visa',
    erittelyHakkuut: 'Föreslagna avverkningar per virkessortiment',
    erittelyKuviot: 'Föreslagna avverkningar per figur',
    erittelyPuusto: 'Hela trädbeståndet till priser för förnyelseavverkning',
    sarakkeet: { laji: 'Sortiment', m3: 'm³', hinta: '€/m³', arvo: '€' },
    kuvioSarakkeet: { kuvio: 'Figur', hakkuu: 'Avverkning', vuosi: 'År', ha: 'ha', m3: 'm³', arvo: '€' },
    yhteensaRivi: 'Totalt',
    keskiarvo: (eurM3, eurHa, ha) => `I genomsnitt ${eurM3} €/m³ och ${eurHa} €/ha (${ha} ha).`,
    poistumaHuom: (h, e) => `Säljbar volym: vid förnyelseavverkning allt stockvirke och all massaved, vid gallring ${h} och vid första gallring ${e} av den.`,
    laskenta: 'Beräkning: figurens stockvirke och massaved (m³/ha) multipliceras med arealen och fördelas enligt trädslagsandelarna, och varje post multipliceras med rotpriset för avverkningssättet (€/m³).',
    huomOtsikko: 'Att beakta',
    huomiot: [
        'Rotpriset är priset för virke på rot före skatt. Inkomsten från virkesförsäljning är kapitalinkomst (skattesats 30–34 %), och skogsavdraget kan minska skatten.',
        'Volymerna är uppskattningar som bygger på Skogscentralens fjärranalys. Det faktiska utfallet blir ofta mindre, och stockandelen kan avvika.',
        'Stämplingens storlek, drivningsförhållandena, menföret och köparens anbud påverkar det faktiska priset.',
        'Figuren kan redan vara avverkad även om förslaget syns i materialet.'
    ],
    muokkaa: 'Redigera',
    hintaAlue: 'Prisområde',
    kunta: (name) => ` · kommun ${name}`,
    haeVerkosta: '↻ Hämta från nätet',
    tukki: 'Stockvirke',
    kuitu: 'Massaved',
    // Priskolumnens aria-label: "Tall stockvirke €/m³"
    lajite: { tukki: 'stockvirke', kuitu: 'massaved' },
    omatSyotetty: 'De markerade priserna har du angett själv.',
    palautaVerkon: 'Återställ priserna från nätet',
    jaa: 'Dela uppskattningen',
    hienoArvio: (harvennus, ensiharvennus) => `En riktgivande uppskattning som inte ersätter ett anbud på virkesaffär. Stockvirke och massaved har fördelats enligt trädslagsandelarna; uttaget vid gallring är ${harvennus}, vid första gallring ${ensiharvennus} och vid förnyelseavverkning hela trädbeståndet.`,
    hienoLahteet: (source, ccLink) => `Priser: ${source} och Naturresursinstitutet (statistikdatabasen), kommun: Statistikcentralen. Lukes och Statistikcentralens material ${ccLink}.`,
    oletusLahde: 'Skogsindustrin rf:s veckouppföljning av virkeshandeln',
    ccBy: 'https://creativecommons.org/licenses/by/4.0/deed.sv',
    eiEhdotuksiaKiinteistolla: 'Fastigheten har inga avverkningsförslag.',
    eiEhdotuksiaValinnalla: 'Urvalet har inga avverkningsförslag.',
    summaVajaa: (n) => `En del priser saknas för ${n} ${n === 1 ? 'figur' : 'figurer'}, så summan är ofullständig. Kontrollera priserna för avverkningssätten i tabellen.`,
    prosentti: (n) => `${n} %`,
    viikko: (week, year) => `v. ${week}/${year}`,
    alueet: {
        'etela-suomi': 'Södra Finland',
        'keski-suomi': 'Mellersta Finland',
        'savo-karjala': 'Savolax-Karelen',
        'kymi-savo': 'Kymmene-Savolax',
        'etela-pohjanmaa': 'Södra Österbotten',
        'pohjois-pohjanmaa': 'Norra Österbotten',
        'kainuu-koillismaa': 'Kajanaland-Koillismaa',
        'lappi': 'Lappland',
        'koko-maa': 'Hela landet'
    },

    /* ---------- Delbar rapport ---------- */
    tiedosto: (label) => `prisuppskattning_${label}.csv`,
    tiedostoEsimerkki: 'exempelskog',
    tiedostoKiinteisto: 'fastighet',
    tiedostoValinta: 'urval',
    esimerkkiRaportissa: 'Exempelskog (fiktiv)',

    /* ---------- Köpvy ---------- */
    sulje: 'Stäng',
    pwEsittely: 'Se hur mycket fastighetens föreslagna avverkningar är värda till färska rotpriser i området.',
    esimerkkiAria: 'Exempel på en prisuppskattning',
    esikatselu: 'Så här ser uppskattningen ut · exempelskog',
    lasketaanEsimerkkia: 'Ett ögonblick – exemplet räknas ut…',
    etuHinnat: 'Färska rotpriser för området eller egna priser, t.ex. enligt ett anbud på virkesaffär',
    etuRaportti: 'Uppskattning per år och en rapport att dela, t.ex. med delägarna i ett dödsbo',
    etuMaasto: 'Försök: terrängläge – berätta om den här platsen och skogsquiz',
    etuLahihaku: 'Försök: sök i närheten – skogar av ett visst slag runt dig på kartan',
    etuSaavutettavuus: 'Försök: figurernas åtkomlighet och vägförbindelse – kan senare bli ett separat avgiftsbelagt tillägg',
    etuKertaosto: 'Engångsköp, ingen prenumeration – alla fastigheter',
    kertamaksu: 'Engångsavgift',
    osta: 'Köp prisuppskattningen',
    palautaOsto: 'Återställ tidigare köp',
    haetaanHintaa: 'Ett ögonblick – priset hämtas från butiken…',
    pwLisat: 'Engångsköpet omfattar prisuppskattningen och dess nuvarande funktioner. Nya tilläggsfunktioner kan vara avgiftsbelagda separat.',
    pwHieno: 'Priser: Skogsindustrin rf:s veckouppföljning av virkeshandeln och Naturresursinstitutets statistik. Uppskattningen är riktgivande.',
    eiTuotetta: 'Produkten kunde inte hämtas från butiken just nu. Försök igen senare.',
    eiYhteytta: 'Ingen anslutning till butiken.',
    avattu: 'Prisuppskattningen har låsts upp för alla fastigheter.',
    odottaa: 'Köpet väntar på godkännande.',
    ostoEpaonnistui: 'Köpet misslyckades. Försök igen.',
    palautettu: 'Köpet har återställts – prisuppskattningen är i bruk.',
    eiAiempaa: 'Inget tidigare köp hittades på det här butikskontot.',
    palautusEpaonnistui: 'Återställningen misslyckades. Försök igen.',

    /* ---------- Exempelskog ---------- */
    esimerkkimetsa: 'Exempelskog',
    kuvitteellinen: 'En fiktiv fastighet för att prova prisuppskattningen',
    avaaOmille: 'Lås upp prisuppskattningen för dina egna fastigheter',

    /* ---------- js/pricing/format.js ---------- */
    euro: (amount) => `≈ ${amount} €`,
    hakkuutavat: {
        uudistus: 'Förnyelseavverkning',
        harvennus: 'Gallring',
        ensiharvennus: 'Första gallring'
    },
    puulajit: {
        manty: 'Tall',
        kuusi: 'Gran',
        koivu: 'Björk och övriga'
    },
    raportti: {
        otsikko: 'Metsäinfo – prisuppskattning för virkesaffär',
        kiinteisto: 'Fastighet',
        valinta: 'Urval',
        hintaAlue: 'Prisområde',
        hinnat: 'Priser',
        omatHinnat: 'egna priser',
        yhteensa: 'Föreslagna avverkningar sammanlagt (€)',
        kokoPuusto: 'Hela trädbeståndet till priser för förnyelseavverkning (€)',
        huom: 'Obs',
        vajaa: (n) => `Priser saknas för en del figurer (${n} ${n === 1 ? 'figur' : 'figurer'}), så uppskattningen är ofullständig`,
        hintaSarakkeet: ['Avverkningssätt', 'Trädslag', 'Stockvirke (€/m³)', 'Massaved (€/m³)'],
        kuvioSarakkeet: ['Figur', 'År', 'Avverkningssätt', 'Areal (ha)', 'Uppskattning (€)', 'Säljbart stockvirke (m³)', 'Säljbar massaved (m³)'],
        erittely: 'Föreslagna avverkningar per virkessortiment',
        erittelyPuusto: 'Hela trädbeståndet per virkessortiment (priser för förnyelseavverkning)',
        lajiSarakkeet: ['Avverkningssätt', 'Trädslag', 'Sortiment', 'Volym (m³)', 'Pris (€/m³)', 'Värde (€)'],
        loppu: 'Uppskattningen är riktgivande och ersätter inte ett anbud på virkesaffär. Stockvirke och massaved har fördelats enligt trädslagsandelarna; uttaget vid gallring är 30 %, vid första gallring 35 %.'
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
    esittelyValinta: 'See what the proposed fellings in the selection are worth at recent stumpage prices for the area. You can also use your own prices, for example from a timber sale offer you have received.',
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
    erittely: 'What makes up the estimate?',
    erittelyAvaa: 'Show',
    erittelyHakkuut: 'Proposed fellings by timber assortment',
    erittelyKuviot: 'Proposed fellings by stand',
    erittelyPuusto: 'Whole growing stock at regeneration felling prices',
    sarakkeet: { laji: 'Assortment', m3: 'm³', hinta: '€/m³', arvo: '€' },
    kuvioSarakkeet: { kuvio: 'Stand', hakkuu: 'Felling', vuosi: 'Year', ha: 'ha', m3: 'm³', arvo: '€' },
    yhteensaRivi: 'Total',
    keskiarvo: (eurM3, eurHa, ha) => `On average ${eurM3} €/m³ and ${eurHa} €/ha (${ha} ha).`,
    poistumaHuom: (h, e) => `Volume sold: in regeneration fellings all sawlogs and pulpwood, in thinnings ${h} and in first thinnings ${e} of it.`,
    laskenta: 'Calculation: the stand’s sawlog and pulpwood volumes (m³/ha) are multiplied by its area and split by tree species shares, and each lot is multiplied by the stumpage price for the felling method (€/m³).',
    huomOtsikko: 'Keep in mind',
    huomiot: [
        'The stumpage price is the price for standing timber before tax. In Finland, income from timber sales is capital income (tax rate 30–34%), and the forest deduction can reduce the tax.',
        'Volumes are estimates based on the Finnish Forest Centre’s remote sensing. The actual harvest is often smaller, and the share of sawlogs may differ.',
        'The size of the sale, harvesting conditions, the thaw season and the buyer’s offer affect the actual price.',
        'The stand may already have been felled even if the proposal still shows in the data.'
    ],
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
    eiEhdotuksiaValinnalla: 'The selection has no proposed fellings.',
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
    tiedostoValinta: 'selection',
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
    etuSaavutettavuus: 'Trial: stand accessibility and road access – may later become a separate paid add-on',
    etuKertaosto: 'One-off purchase, no subscription – all properties',
    kertamaksu: 'One-off payment',
    osta: 'Buy timber sale estimate',
    palautaOsto: 'Restore previous purchase',
    haetaanHintaa: 'One moment – fetching the price from the store…',
    pwLisat: 'The one-off purchase includes the price estimate and its current features. New add-on features may involve separate charges.',
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
        valinta: 'Selection',
        hintaAlue: 'Price region',
        hinnat: 'Prices',
        omatHinnat: 'own prices',
        yhteensa: 'Proposed fellings total (€)',
        kokoPuusto: 'Whole growing stock at regeneration felling prices (€)',
        huom: 'Note',
        vajaa: (n) => `Prices are missing for some stands (${n} ${n === 1 ? 'stand' : 'stands'}), so the estimate is incomplete`,
        hintaSarakkeet: ['Felling method', 'Tree species', 'Sawlog (€/m³)', 'Pulpwood (€/m³)'],
        kuvioSarakkeet: ['Stand', 'Year', 'Felling method', 'Area (ha)', 'Estimate (€)', 'Sawlogs sold (m³)', 'Pulpwood sold (m³)'],
        erittely: 'Proposed fellings by timber assortment',
        erittelyPuusto: 'Whole growing stock by timber assortment (regeneration felling prices)',
        lajiSarakkeet: ['Felling method', 'Tree species', 'Assortment', 'Volume (m³)', 'Price (€/m³)', 'Value (€)'],
        loppu: 'The estimate is indicative and does not replace a timber sale offer. Sawlogs and pulpwood are split by tree species shares; removal in thinnings 30%, in first thinnings 35%.'
    }
};

export const TEKSTIT = { fi, sv, en };
export const T = pick(TEKSTIT);
