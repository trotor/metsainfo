/**
 * Sivun (index.html) staattiset tekstit suomeksi ja englanniksi (#24).
 * Avaimet vastaavat index.html:n data-i18n- ja data-i18n-attr-merkintöjä.
 * Suomenkieliset tekstit ovat täsmälleen samat kuin index.html:ssä; sivu.js
 * ei koske sivuun suomeksi. Käyttöohjeen englanninkielinen versio: ohje-en.js.
 */

import { pick } from '../i18n.js';

const fi = {
    sivuOtsikko: 'Metsäinfo - Suomen metsävaratiedot kartalla',
    sivuKuvaus: 'Interaktiivinen karttasovellus Suomen metsävaratietojen tarkasteluun. Hae kiinteistötunnuksella tai klikkaa kartalta.',
    kayttoohje: 'Käyttöohje',
    alaotsikko: 'Suomen metsävaratiedot kartalla - hae kiinteistötunnuksella tai klikkaa karttaa',
    muutaPaneelinKokoa: 'Muuta tietopaneelin kokoa',
    kopioiLinkki: 'Kopioi linkki',
    lataaCsv: 'Lataa CSV',
    tulosta: 'Tulosta',
    poistaValinta: 'Poista valinta',
    sulje: 'Sulje',
    metsavaratiedot: 'Metsävaratiedot',
    haetaanTietoja: 'Haetaan tietoja...',
    variTilavuus: 'Tilavuus (m³/ha)',
    variIka: 'Ikä (v)',
    variPaapuulaji: 'Pääpuulaji',
    variKehitysluokka: 'Kehitysluokka',
    mkiVuosi: 'Vuoden mukaan',
    mkiTarkoitus: 'Hakkuutarkoitus',
    haeTunnuksella: 'Hae kiinteistötunnuksella',
    hakuEsimerkki: 'esim. 91-416-1-123',
    hae: 'Hae',
    ohjeOtsikko: 'Metsäinfo — Käyttöohje',
    alaMetsatiedot: 'Metsätiedot:',
    alaMetsakeskus: 'Metsäkeskus',
    alaKartta: 'Kartta:',
    alaKiinteistot: 'Kiinteistöt:',
    alaMml: 'MML'
};

const en = {
    sivuOtsikko: 'Metsäinfo – Finnish forest data on a map',
    sivuKuvaus: 'Interactive map app for viewing Finnish forest resource data. Search by property ID or click the map.',
    kayttoohje: 'User guide',
    alaotsikko: 'Finnish forest data on a map – search by property ID or click the map',
    muutaPaneelinKokoa: 'Resize the information panel',
    kopioiLinkki: 'Copy link',
    lataaCsv: 'Download CSV',
    tulosta: 'Print',
    poistaValinta: 'Clear selection',
    sulje: 'Close',
    metsavaratiedot: 'Forest data',
    haetaanTietoja: 'Loading data...',
    variTilavuus: 'Volume (m³/ha)',
    variIka: 'Age (years)',
    variPaapuulaji: 'Main tree species',
    variKehitysluokka: 'Development class',
    mkiVuosi: 'By year',
    mkiTarkoitus: 'Cutting purpose',
    haeTunnuksella: 'Search by property ID',
    hakuEsimerkki: 'e.g. 91-416-1-123',
    hae: 'Search',
    ohjeOtsikko: 'Metsäinfo — User guide',
    alaMetsatiedot: 'Forest data:',
    alaMetsakeskus: 'Finnish Forest Centre',
    alaKartta: 'Map:',
    alaKiinteistot: 'Properties:',
    alaMml: 'NLS'
};

export const TEKSTIT = { fi, en };
export const T = pick(TEKSTIT);
