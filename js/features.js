/**
 * Maksulliset ja kokeilussa olevat toiminnot ja niiden avaus.
 *
 * Jokainen toiminto on oma kokonaisuutensa, jonka voi myöhemmin myydä
 * omana lisäosanaan tai siirtää omaan sovellukseen
 * (vertailu yksityisessä julkaisurepossa):
 *
 * - koodi omassa hakemistossaan (js/maasto/, js/lahihaku/, js/suosikit/ …) ja tekstit
 *   sen omassa teksti.js:ssä
 * - yhteinen tieto vain jaetuista moduuleista (js/rest2.js, js/kuviotieto.js,
 *   js/location/, js/config.js, js/ui/kortti.js), ei toisen toiminnon
 *   hakemistosta; viestit toiminnolta toiselle js/vayla.js:n kautta
 * - kokeilu vain kokeilubuildissa: app.js lataa toiminnon dynaamisella
 *   importilla VITE_KOKEILU-ehdon takana, ei merkintöjä index.html:ään;
 *   julkaistu toiminto (kokeilu: false) ladataan kaikissa buildeissa
 *   (versio 4.1.0: kaikki paitsi asetukset ja kielivalinta)
 * - avaus aina isUnlocked(id):llä, ei suoraan purchases.isEntitled():llä
 *
 * Oma lisäosa myöhemmin: uusi tuote `product`-kenttään, tuote kauppoihin ja
 * purchases.js tukemaan useampaa tuotetta. Toimintojen koodi ei muutu.
 */

import { purchases, PRODUCT_ID } from './platform/purchases.js';

const KOKEILUBUILD = import.meta.env?.VITE_KOKEILU === '1';

export const FEATURES = {
    // Julkaistu: hinta-arvio (js/ui/estimate.js, js/pricing/)
    hintaArvio: { product: PRODUCT_ID, kokeilu: false },
    // Kokeilu #25/#26: "Kerro tästä paikasta" ja metsävisa (js/maasto/)
    maastotila: { product: PRODUCT_ID, kokeilu: false },
    // Suunniteltu #27: tietynlaiset metsät 1 km × 1 km alueelta (js/lahihaku/)
    lahihaku: { product: PRODUCT_ID, kokeilu: false },
    // Kokeilu #24: suosikit ja omat muistiinpanot, maksuton (js/suosikit/)
    suosikit: { product: null, kokeilu: false },
    // Kokeilu #28: laserkeilauksen korkeusmalli taustakartaksi, maksuton (js/korkeusmalli/)
    korkeusmalli: { product: null, kokeilu: false },
    // Kokeilu: Metsäkeskuksen latvusmalli (puuston korkeus) taustakartaksi, maksuton (js/latvusmalli/)
    latvusmalli: { product: null, kokeilu: false },
    // Kokeilu #23: asetukset ja kielivalinta, maksuton (js/asetukset/, js/i18n.js)
    asetukset: { product: null, kokeilu: true },
    // Kokeilu: kuvion saavutettavuus ja tieyhteys (js/saavutettavuus/); nyt hinta-arvion
    // kertaostossa, voi myöhemmin olla oma maksullinen lisäosa
    saavutettavuus: { product: PRODUCT_ID, kokeilu: false },
    // Kokeilu #31: kuviovalinta kiinteistörajojen yli, maksuton (js/valinta/); hinta-arvio
    // ja saavutettavuus pysyvät kertaoston takana
    valinta: { product: null, kokeilu: false },
    // Kokeilu: metsätöiden rajoitteet (muinaisjäännökset, suojelualueet …), maksuton (js/rajoitteet/)
    rajoitteet: { product: null, kokeilu: false },
    // Kokeilu: LIPAS-retkeilykohteet karttatasona, maksuton (js/retkeily/)
    retkeily: { product: null, kokeilu: false },
    // Kokeilu #34: puuston arvo €/ha kartan värityksenä (js/arvovari/), hinta-arvion kertaostossa
    arvovari: { product: PRODUCT_ID, kokeilu: false },
    // Kokeilu #33: pistemuotoiset huomiot kartalle (js/huomiot/), hinta-arvion kertaostossa
    huomiot: { product: PRODUCT_ID, kokeilu: false },
    // Kokeilu trotor/metsainfo#37: kuvioiden värien läpinäkyvyys ilmakuvan päällä, maksuton (js/lapinakyvyys/)
    lapinakyvyys: { product: null, kokeilu: false },
    // Kokeilu: esittely ensimmäisellä avauksella, oston jälkeen ja zoomausvihje, maksuton (js/esittely/)
    esittely: { product: null, kokeilu: false }
};

/**
 * Onko toiminto käytössä. Ilman kauppaa (verkko, kehitysselain) kokeilut
 * ovat auki, jotta niitä voi kehittää selaimessa; kokeilukoodi ei ole
 * tavallisessa buildissa lainkaan.
 */
/** Kortin Kokeilu-merkki vain toiminnolle, joka on vielä kokeilussa. */
export function kokeiluMerkki(id, teksti) {
    return FEATURES[id]?.kokeilu ? teksti : '';
}

export function isUnlocked(id, p = purchases) {
    const feature = FEATURES[id];
    if (!feature) return false;
    if (!feature.product) return true; // maksuton toiminto
    // Ilman kauppaa: verkkoversiossa maksulliset ovat lukossa (ostonäkymä ohjaa
    // kauppoihin), kokeilubuildin kehitysselaimessa auki
    if (!p.isAvailable()) return feature.kokeilu || KOKEILUBUILD;
    // Nyt kaikki toiminnot kuuluvat samaan tuotteeseen
    return feature.product === PRODUCT_ID && p.isEntitled();
}
