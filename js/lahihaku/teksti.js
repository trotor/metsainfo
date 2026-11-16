/**
 * Lähihaun tekstit yhdessä paikassa kielivalintaa (#24) varten.
 * Toistaiseksi vain suomi.
 */

export const T = {
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
    pituus: 'Keskipituus',
    tilavuus: 'Puuston määrä',
    hakkuuehdotus: 'Hakkuuehdotus',
    lahde: (nyt) => `Metsäkeskus${nyt ? `, laskettu nykytila ${nyt}` : ''}.`,
    lukittu: (n) => `Alueelta löytyi ${n === 1 ? '1 kuvio' : `${n} kuviota`}. Kuviot kartalla ja listana kuuluvat Puukaupan hinta-arvio -lisäosaan (sama kertaosto).`,
    avaaLisaosa: 'Avaa lisäosa'
};
