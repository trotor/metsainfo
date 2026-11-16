/**
 * Maksulliset ja kokeilussa olevat toiminnot ja niiden avaus.
 *
 * Jokainen toiminto on oma kokonaisuutensa, jonka voi myöhemmin myydä
 * omana lisäosanaan tai siirtää omaan sovellukseen
 * (docs/plans/2026-11-16-maastotila-erillinen-sovellus.md):
 *
 * - koodi omassa hakemistossaan (js/maasto/, js/lahihaku/ …) ja tekstit
 *   sen omassa teksti.js:ssä
 * - yhteinen tieto vain jaetuista moduuleista (js/rest2.js, js/location/,
 *   js/config.js), ei toisen toiminnon hakemistosta
 * - kokeilu vain kokeilubuildissa: app.js lataa toiminnon dynaamisella
 *   importilla VITE_KOKEILU-ehdon takana, ei merkintöjä index.html:ään
 * - avaus aina isUnlocked(id):llä, ei suoraan purchases.isEntitled():llä
 *
 * Oma lisäosa myöhemmin: uusi tuote `product`-kenttään, tuote kauppoihin ja
 * purchases.js tukemaan useampaa tuotetta. Toimintojen koodi ei muutu.
 */

import { purchases, PRODUCT_ID } from './platform/purchases.js';

export const FEATURES = {
    // Julkaistu: hinta-arvio (js/ui/estimate.js, js/pricing/)
    hintaArvio: { product: PRODUCT_ID, kokeilu: false },
    // Kokeilu #26/#27: "Kerro tästä paikasta" ja metsävisa (js/maasto/)
    maastotila: { product: PRODUCT_ID, kokeilu: true },
    // Suunniteltu #28: tietynlaiset metsät 1 km × 1 km alueelta (js/lahihaku/)
    lahihaku: { product: PRODUCT_ID, kokeilu: true }
};

/**
 * Onko toiminto käytössä. Ilman kauppaa (verkko, kehitysselain) kokeilut
 * ovat auki, jotta niitä voi kehittää selaimessa; kokeilukoodi ei ole
 * tavallisessa buildissa lainkaan.
 */
export function isUnlocked(id, p = purchases) {
    const feature = FEATURES[id];
    if (!feature) return false;
    if (!p.isAvailable()) return feature.kokeilu;
    // Nyt kaikki toiminnot kuuluvat samaan tuotteeseen
    return feature.product === PRODUCT_ID && p.isEntitled();
}
