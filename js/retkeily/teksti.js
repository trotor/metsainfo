/**
 * Retkeilykohteiden tekstit suomeksi, ruotsiksi ja englanniksi.
 */

import { pick } from '../i18n.js';

const fi = {
    taso: 'Retkeilykohteet (LIPAS)',
    lajit: { laavu: 'Laavu, kota tai kammi', tuli: 'Tulentekopaikka', reitti: 'Retkeilyreitti', polku: 'Luontopolku' },
    pituus: (km) => `${km} km`,
    lisatietoja: 'Lisätietoja',
    zoomaa: 'Zoomaa lähemmäs, niin retkeilykohteet näkyvät kartalla.',
    virhe: 'Retkeilykohteiden haku epäonnistui.',
    lahde: 'LIPAS, Jyväskylän yliopisto (CC BY 4.0)'
};

const sv = {
    taso: 'Friluftsobjekt (LIPAS)',
    lajit: { laavu: 'Vindskydd, kåta eller kammi', tuli: 'Eldplats', reitti: 'Vandringsled', polku: 'Naturstig' },
    pituus: (km) => `${km} km`,
    lisatietoja: 'Mer information',
    zoomaa: 'Zooma in så att friluftsobjekten visas på kartan.',
    virhe: 'Friluftsobjekten kunde inte hämtas.',
    lahde: 'LIPAS, Jyväskylä universitet (CC BY 4.0)'
};

const en = {
    taso: 'Outdoor sites (LIPAS)',
    lajit: { laavu: 'Lean-to, hut or kammi', tuli: 'Campfire site', reitti: 'Hiking trail', polku: 'Nature trail' },
    pituus: (km) => `${km} km`,
    lisatietoja: 'More information',
    zoomaa: 'Zoom in to see outdoor sites on the map.',
    virhe: 'Fetching outdoor sites failed.',
    lahde: 'LIPAS, University of Jyväskylä (CC BY 4.0)'
};

export const TEKSTIT = { fi, sv, en };

const OHJE = {
    fi: {
        otsikko: 'Retkeilykohteet',
        html: `<p>Tasovalitsimen taso <strong>Retkeilykohteet (LIPAS)</strong> näyttää kartalla laavut, kodat ja kammit, tulentekopaikat, retkeilyreitit ja luontopolut. Napauta kohdetta nähdäksesi nimen, tyypin ja reitin pituuden.</p>
<p>Kohteet näkyvät, kun karttaa on zoomattu lähemmäs. Tiedot ovat Jyväskylän yliopiston LIPAS-liikuntapaikkatietokannasta (CC BY 4.0), ja ne voivat olla vanhentuneita: tarkista kohteen kunto ja käyttöoikeus paikan päällä.</p>`
    },
    sv: {
        otsikko: 'Friluftsobjekt',
        html: `<p>Lagret <strong>Friluftsobjekt (LIPAS)</strong> i lagerväljaren visar vindskydd, kåtor och kammin, eldplatser, vandringsleder och naturstigar på kartan. Tryck på ett objekt för att se namn, typ och ledens längd.</p>
<p>Objekten visas när kartan är inzoomad. Uppgifterna kommer från Jyväskylä universitets idrottsplatsdatabas LIPAS (CC BY 4.0) och kan vara föråldrade: kontrollera objektets skick och nyttjanderätt på plats.</p>`
    },
    en: {
        otsikko: 'Outdoor sites',
        html: `<p>The layer <strong>Outdoor sites (LIPAS)</strong> in the layer selector shows lean-tos, huts and kammis, campfire sites, hiking trails and nature trails on the map. Tap a site to see its name, type and trail length.</p>
<p>The sites are shown when the map is zoomed in. The data comes from the University of Jyväskylä’s LIPAS sports facility database (CC BY 4.0) and may be out of date: check the condition and right of use on site.</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
