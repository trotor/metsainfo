/**
 * Sovelluksen käyttöliittymän tekstit suomeksi ja englanniksi (#24):
 * tietopaneeli, kuviolista, karttapopupit, selitteet, termien selitykset,
 * paikannus. Suomenkieliset tekstit ovat täsmälleen samat kuin ennen
 * käännöstä (tests/suomi-snapshot.test.js).
 *
 * Tavallinen build on aina suomeksi (js/i18n.js); englanti vain kokeilubuildissa.
 * CSV-tiedoston sarakkeet pysyvät suomeksi (taulukkolaskenta, yhteensopivuus).
 */

import { pick } from '../i18n.js';
import { TOOLTIPS } from '../config.js';

const fi = {
    // Kurkistusrivi
    toiminnot: 'Toiminnot',
    kuviotaYksikko: 'kuviota',
    eiMetsavaratietoja: 'Ei metsävaratietoja',
    palstaa: (n) => `${n} palstaa`,
    palstaaSulkeissa: (n) => ` (${n} palstaa)`,
    haetaanTietoja: 'Haetaan tietoja…',

    // Välilehdet
    yhteenveto: 'Yhteenveto',
    kuviotTab: (n) => `Kuviot (${n})`,
    ehdotukset: 'Ehdotukset',

    // Yhteenveto
    kiinteisto: 'Kiinteistö',
    kopioiLinkki: 'Kopioi linkki',
    lataaCsv: 'Lataa CSV',
    tulosta: 'Tulosta',
    mittausvuosi: (v) => `Aineiston mittausvuosi: ${v}`,
    vanhentuneita: 'Tiedot voivat olla vanhentuneita',
    metsavaratYhteenveto: 'Metsävarat yhteenveto',
    kuviota: 'Kuviota',
    hehtaaria: 'Hehtaaria',
    keskiarvoTilavuus: 'm³/ha keskiarvo',
    yhteensaTilavuus: 'm³ yhteensä',
    puulajijakauma: 'Puulajijakauma',
    manty: 'Mänty',
    kuusi: 'Kuusi',
    lehtipuut: 'Lehtipuut',
    puusto: 'Puusto',
    keskiIka: 'Keski-ikä (v)',
    keskipituus: 'Keskipituus (m)',
    keskilapimitta: 'Keskiläpimitta (cm)',
    kasvu: 'Kasvu (m³/ha/v)',
    tukkiKuitu: 'Tukkipuu / Kuitupuu',
    tukkia: 'Tukkia (m³/ha)',
    kuitua: 'Kuitua (m³/ha)',
    tukkiaYht: 'Tukkia yht. (m³)',
    kuituaYht: 'Kuitua yht. (m³)',
    kasvupaikka: 'Kasvupaikka',
    pohjapintaAla: 'Pohjapinta-ala (m²/ha)',
    runkoluku: 'Runkoluku (kpl/ha)',
    kasvupaikkatyypit: 'Kasvupaikkatyypit:',
    kehitysluokat: 'Kehitysluokat:',
    kplSulkeissa: (n) => `${n} kpl`,
    hakkuuehdotukset: 'Hakkuuehdotukset',
    metsanhoitoehdotukset: 'Metsänhoitoehdotukset',
    kuvioLkm: (n) => `${n} ${n === 1 ? 'kuvio' : 'kuviota'}`,
    kuviot: 'Kuviot',
    kplYhteensa: (n) => `(${n} kpl)`,
    eiMetsavaratietojaKiinteistolla: 'Ei metsävaratietoja tällä kiinteistöllä.',
    tyyppi: (c) => `Tyyppi ${c}`,

    // Kuviolista
    kuvio: (n) => `Kuvio ${n}`,
    perustiedot: 'Perustiedot',
    kehitysluokka: 'Kehitysluokka',
    maalaji: 'Maalaji',
    ojitustilanne: 'Ojitustilanne',
    kulkukelpoisuus: 'Kulkukelpoisuus',
    ika: 'Ikä:',
    pituus: 'Pituus:',
    lapimitta: 'Läpimitta:',
    pohjapintaAlaLyhyt: 'Pohjapinta-ala:',
    runkolukuLyhyt: 'Runkoluku:',
    kasvuLyhyt: 'Kasvu:',
    vuotta: 'v',
    kplHa: 'kpl/ha',
    m3haV: 'm³/ha/v',
    lehtipuutLyhyt: 'Lehtipuut',
    puutavaralajit: 'Puutavaralajit',
    tukkipuu: 'Tukkipuu:',
    kuitupuu: 'Kuitupuu:',
    yhteensa: 'Yhteensä:',
    kuviollaYht: 'Kuviolla yht:',
    toimenpideEhdotukset: 'Toimenpide-ehdotukset',
    hakkuu: 'Hakkuu:',
    hoito: 'Hoito:',
    mitattu: (d) => `Mitattu: ${d}`,

    // Karttapopupit
    pintaAla: 'Pinta-ala',
    tilavuus: 'Tilavuus',
    paapuulaji: 'Pääpuulaji',
    ikaPopup: 'Ikä',
    luontokohde: 'Luontokohde',
    metsalaki: 'Metsälain 10 § erityisen tärkeä elinympäristö',
    metsankayttoilmoitus: 'Metsänkäyttöilmoitus',
    hakkuutapa: 'Hakkuutapa',
    vuosi: 'Vuosi',
    puulaji: 'Puulaji',
    koodi: (c) => `Koodi ${c}`,

    // Selitteet (COLOR_MODES / MKI_COLOR_MODES)
    varitila: {
        volume: { label: 'Tilavuus (m³/ha)' },
        age: { label: 'Ikä (v)' },
        species: { label: 'Pääpuulaji', legend: ['Mänty', 'Kuusi', 'Koivu', 'Muu lehtipuu'] },
        devclass: { label: 'Kehitysluokka', legend: ['Aukea', 'Taimikko', 'Nuori kasvatus', 'Varttunut', 'Uudistuskypsä', 'Ylispuust./eri-ik.'] }
    },
    mkiVaritila: {
        year: { label: 'Vuoden mukaan', legend: ['Tänä vuonna', '1 v sitten', '2 v sitten', '3 v sitten', '4–5 v sitten'] },
        purpose: { label: 'Hakkuutarkoitus', legend: ['Kasvatushakkuu', 'Uudistushakkuu', 'Muu hakkuu', 'Erityishakkuu', 'Maankäytön muutos', 'Metsätuhoalue'] }
    },

    // Toiminnot
    kopioitu: 'Kopioitu!',
    eiLadattavia: 'Ei ladattavia metsäkuviotietoja.',
    csvJakoEpaonnistui: 'CSV-tiedoston jako epäonnistui.',

    // Paikannus
    sijainti: {
        off: 'Näytä oma sijainti',
        show: 'Keskitä omaan sijaintiin',
        followKompassi: 'Näytä kulkusuunta',
        lopeta: 'Lopeta paikannus',
        estettyNatiivi: 'Sijainti ei ole käytössä. Salli se kohdassa Asetukset → Metsäinfo → Sijainti.',
        estettySelain: 'Sijainti ei ole käytössä. Salli sijainti selaimen asetuksista.',
        palvelutPois: 'Sijaintipalvelut ovat pois päältä. Kytke ne päälle kohdassa Asetukset → Tietosuoja ja turvallisuus → Sijaintipalvelut.',
        eiSaatu: 'Sijaintia ei saatu. Tarkista, että sijaintipalvelut ovat päällä.',
        haetaan: 'Sijaintia haetaan. Tarkista, että sijaintipalvelut ovat päällä.',
        olet: (t) => `Olet: ${t}`,
        eiKiinteistoa: 'Tästä kohdasta ei löytynyt kiinteistöä. Zoomaa lähemmäs.',
        ulkopuolella: 'Valitun kiinteistön ulkopuolella',
        eiKuviotietoa: 'Ei kuviotietoa tässä kohdassa'
    },

    // Sovellus (app.js)
    sovellus: {
        eiLoytynyt: 'Kiinteistöä ei löytynyt',
        hakuEpaonnistui: 'Kiinteistön haku epäonnistui',
        jaaLinkki: 'Jaa linkki',
        kuvitteellinenKartta: 'Kuvitteellinen kartta',
        taustakartta: 'Taustakartta',
        peruskartta: 'Peruskartta',
        ortokuva: 'Ortokuva',
        luontokohteet: 'Luontokohteet',
        metsankayttoilmoitukset: 'Metsänkäyttöilmoitukset',
        syotaTunnus: 'Syötä kiinteistötunnus',
        virheellinenMuoto: 'Virheellinen muoto. Käytä muotoa 91-416-1-123',
        haetaan: 'Haetaan...',
        hakuEpaonnistuiYrita: 'Haku epäonnistui. Yritä uudelleen.',
        hae: 'Hae',
        metsatietojenHakuEpaonnistui: 'Metsätietojen haku epäonnistui.'
    },

    // Termien selitykset
    tooltips: TOOLTIPS
};

const en = {
    toiminnot: 'Actions',
    kuviotaYksikko: 'stands',
    eiMetsavaratietoja: 'No forest data',
    palstaa: (n) => `${n} parts`,
    palstaaSulkeissa: (n) => ` (${n} parts)`,
    haetaanTietoja: 'Loading data…',

    yhteenveto: 'Summary',
    kuviotTab: (n) => `Stands (${n})`,
    ehdotukset: 'Proposals',

    kiinteisto: 'Property',
    kopioiLinkki: 'Copy link',
    lataaCsv: 'Download CSV',
    tulosta: 'Print',
    mittausvuosi: (v) => `Data surveyed: ${v}`,
    vanhentuneita: 'The data may be out of date',
    metsavaratYhteenveto: 'Forest resources summary',
    kuviota: 'Stands',
    hehtaaria: 'Hectares',
    keskiarvoTilavuus: 'm³/ha average',
    yhteensaTilavuus: 'm³ in total',
    puulajijakauma: 'Tree species',
    manty: 'Pine',
    kuusi: 'Spruce',
    lehtipuut: 'Broadleaves',
    puusto: 'Trees',
    keskiIka: 'Mean age (years)',
    keskipituus: 'Mean height (m)',
    keskilapimitta: 'Mean diameter (cm)',
    kasvu: 'Growth (m³/ha/yr)',
    tukkiKuitu: 'Logs / Pulpwood',
    tukkia: 'Logs (m³/ha)',
    kuitua: 'Pulpwood (m³/ha)',
    tukkiaYht: 'Logs in total (m³)',
    kuituaYht: 'Pulpwood in total (m³)',
    kasvupaikka: 'Site',
    pohjapintaAla: 'Basal area (m²/ha)',
    runkoluku: 'Stem count (per ha)',
    kasvupaikkatyypit: 'Site types:',
    kehitysluokat: 'Development classes:',
    kplSulkeissa: (n) => `${n}`,
    hakkuuehdotukset: 'Proposed cuttings',
    metsanhoitoehdotukset: 'Proposed silviculture',
    kuvioLkm: (n) => `${n} ${n === 1 ? 'stand' : 'stands'}`,
    kuviot: 'Stands',
    kplYhteensa: (n) => `(${n})`,
    eiMetsavaratietojaKiinteistolla: 'No forest data for this property.',
    tyyppi: (c) => `Type ${c}`,

    kuvio: (n) => `Stand ${n}`,
    perustiedot: 'Basic data',
    kehitysluokka: 'Development class',
    maalaji: 'Soil type',
    ojitustilanne: 'Drainage',
    kulkukelpoisuus: 'Accessibility',
    ika: 'Age:',
    pituus: 'Height:',
    lapimitta: 'Diameter:',
    pohjapintaAlaLyhyt: 'Basal area:',
    runkolukuLyhyt: 'Stem count:',
    kasvuLyhyt: 'Growth:',
    vuotta: 'yrs',
    kplHa: 'per ha',
    m3haV: 'm³/ha/yr',
    lehtipuutLyhyt: 'Broadleaves',
    puutavaralajit: 'Timber assortments',
    tukkipuu: 'Logs:',
    kuitupuu: 'Pulpwood:',
    yhteensa: 'Total:',
    kuviollaYht: 'Whole stand:',
    toimenpideEhdotukset: 'Proposed operations',
    hakkuu: 'Cutting:',
    hoito: 'Silviculture:',
    mitattu: (d) => `Surveyed: ${d}`,

    pintaAla: 'Area',
    tilavuus: 'Volume',
    paapuulaji: 'Main species',
    ikaPopup: 'Age',
    luontokohde: 'Habitat',
    metsalaki: 'Particularly important habitat under section 10 of the Forest Act',
    metsankayttoilmoitus: 'Forest use declaration',
    hakkuutapa: 'Cutting method',
    vuosi: 'Year',
    puulaji: 'Species',
    koodi: (c) => `Code ${c}`,

    varitila: {
        volume: { label: 'Volume (m³/ha)' },
        age: { label: 'Age (years)' },
        species: { label: 'Main species', legend: ['Pine', 'Spruce', 'Birch', 'Other broadleaf'] },
        devclass: { label: 'Development class', legend: ['Open area', 'Sapling stand', 'Young thinning', 'Advanced thinning', 'Mature', 'Holdover / uneven-aged'] }
    },
    mkiVaritila: {
        year: { label: 'By year', legend: ['This year', '1 year ago', '2 years ago', '3 years ago', '4–5 years ago'] },
        purpose: { label: 'Cutting purpose', legend: ['Thinning', 'Regeneration cutting', 'Other cutting', 'Special cutting', 'Change of land use', 'Forest damage area'] }
    },

    kopioitu: 'Copied!',
    eiLadattavia: 'No stand data to download.',
    csvJakoEpaonnistui: 'Could not share the CSV file.',

    sijainti: {
        off: 'Show my location',
        show: 'Centre on my location',
        followKompassi: 'Show heading',
        lopeta: 'Stop locating',
        estettyNatiivi: 'Location is not allowed. Allow it in Settings → Metsäinfo → Location.',
        estettySelain: 'Location is not allowed. Allow location in your browser settings.',
        palvelutPois: 'Location services are off. Turn them on in Settings → Privacy & Security → Location Services.',
        eiSaatu: 'Could not get your location. Check that location services are on.',
        haetaan: 'Finding your location. Check that location services are on.',
        olet: (t) => `You are in: ${t}`,
        eiKiinteistoa: 'No property found at this spot. Zoom in closer.',
        ulkopuolella: 'Outside the selected property',
        eiKuviotietoa: 'No stand data at this spot'
    },

    sovellus: {
        eiLoytynyt: 'Property not found',
        hakuEpaonnistui: 'Property search failed',
        jaaLinkki: 'Share link',
        kuvitteellinenKartta: 'Fictional map',
        taustakartta: 'Background map',
        peruskartta: 'Topographic map',
        ortokuva: 'Aerial photo',
        luontokohteet: 'Habitats',
        metsankayttoilmoitukset: 'Forest use declarations',
        syotaTunnus: 'Enter a property ID',
        virheellinenMuoto: 'Invalid format. Use the format 91-416-1-123',
        haetaan: 'Searching...',
        hakuEpaonnistuiYrita: 'Search failed. Please try again.',
        hae: 'Search',
        metsatietojenHakuEpaonnistui: 'Could not load forest data.'
    },

    tooltips: {
        kuvio: 'A forest stand is a uniform area where the trees and the site are similar.',
        tilavuus: 'Volume of growing stock per hectare (m³/ha), all timber assortments included.',
        puulajijakauma: 'Shares of tree species weighted by area. Based on airborne laser scanning.',
        keskiIka: 'Mean age in years, weighted by basal area.',
        keskipituus: 'Mean height in metres, weighted by basal area.',
        keskilapimitta: 'Mean diameter at breast height (1.3 m) in centimetres, weighted by basal area.',
        kasvu: 'Annual volume growth per hectare (m³/ha/yr).',
        tukkipuu: 'Raw material for sawmills. Butt diameter usually over 15 cm (pine) or 16 cm (spruce).',
        kuitupuu: 'Raw material for the pulp and paper industry. Smaller in diameter than logs.',
        pohjapintaAla: 'Total cross-sectional area of tree stems at breast height (1.3 m), in m²/ha.',
        runkoluku: 'Number of trees per hectare.',
        kehitysluokka: 'Development stage of the stand: open area, sapling stand, thinning stand, mature, etc.',
        kasvupaikka: 'Classification based on soil fertility. Herb-rich forest is the most fertile, barren heath the poorest.',
        maalaji: 'Soil quality: mineral soil (sand, till) or peat (sphagnum, sedge).',
        ojitustilanne: 'Drainage of the forest land: undrained, drained or recently drained mire.',
        kulkukelpoisuus: 'Access for forest machines: all year, summer/winter, or frozen ground only.',
        hakkuuehdotus: 'The Finnish Forest Centre\'s calculated proposal for cutting needs. It does not replace an assessment by a forestry professional.',
        metsanhoitoehdotus: 'The Finnish Forest Centre\'s calculated proposal for silviculture, e.g. sapling stand tending or pruning.'
    }
};

export const TEKSTIT = { fi, en };
export const T = pick(TEKSTIT);

/** Termin selitys valitulla kielellä (suomi varalla). */
export function tooltipText(key) {
    return T.tooltips[key] ?? TOOLTIPS[key];
}
