/**
 * Maastotilan tekstit yhdessä paikassa, jotta kielivalinta (#24) on
 * myöhemmin helppo lisätä. Toistaiseksi vain suomi.
 */

export const T = {
    nappi: 'Kerro tästä paikasta',
    otsikko: 'Tässä kohtaa',
    sulje: 'Sulje',
    haetaanSijaintia: 'Haetaan sijaintia…',
    haetaanKuvioita: 'Haetaan metsätietoja…',
    eiVerkkoa: 'Metsätietoja ei saatu. Tarkista verkkoyhteys.',
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
    tasot: { helppo: 'Helppo', keski: 'Keskitaso', vaikea: 'Vaikea' },
    pisteet: (p) => `${p} pistettä`,
    kuviot: (n) => `${n} ${n === 1 ? 'kuvio' : 'kuviota'}`,
    putki: (n) => `putki ${n}`,
    uusiKuvio: (p) => `Uusi kuvio löydetty! +${p}`,
    kokeilu: 'Kokeilu · vain testiversiossa',
    lukittu: 'Koko kuvaus, metsävisa ja pisteet kuuluvat Puukaupan hinta-arvio -lisäosaan (sama kertaosto).',
    avaaLisaosa: 'Avaa lisäosa'
};

/** Pistemäärään perustuva arvonimi (vain tällä laitteella). */
export const ARVONIMET = [
    [0, 'Metsäretkeläinen'],
    [100, 'Polkujen kulkija'],
    [300, 'Kuvioiden tuntija'],
    [600, 'Metsänlukija'],
    [1000, 'Metsämestari']
];

export function arvonimi(pisteet) {
    let nimi = ARVONIMET[0][1];
    for (const [raja, n] of ARVONIMET) if (pisteet >= raja) nimi = n;
    return nimi;
}
