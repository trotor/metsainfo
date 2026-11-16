/**
 * Suosikkien tekstit suomeksi, ruotsiksi ja englanniksi (#24).
 */

import { pick } from '../i18n.js';

const fi = {
    nappi: 'Suosikit',
    otsikko: 'Suosikit ja muistiinpanot',
    sulje: 'Sulje',
    kokeilu: 'Kokeilu · vain testiversiossa',
    kaikki: 'Kaikki',
    tyypit: { kiinteisto: 'Kiinteistöt', kuvio: 'Kuviot', haku: 'Haut' },
    tyyppi: { kiinteisto: 'Kiinteistö', kuvio: 'Kuvio', haku: 'Lähihaku' },
    hae: 'Hae nimestä tai muistiinpanosta',
    tyhja: 'Ei vielä suosikkeja. Lisää kiinteistö tai kuvio tähdellä (☆) kiinteistön tiedoista tai tallenna lähihaku.',
    eiOsumia: 'Ei osumia.',
    avaa: 'Avaa',
    muokkaa: 'Muokkaa',
    nimi: 'Nimi',
    muistiinpano: 'Oma muistiinpano',
    muistiinpanoOhje: 'Esim. rajapyykki, marjapaikka, sovittu harvennus…',
    tallenna: 'Tallenna',
    peruuta: 'Peruuta',
    poista: 'Poista suosikki',
    vahvistaPoisto: 'Poistetaanko? Paina uudelleen',
    vainLaitteella: 'Suosikit ja muistiinpanot tallentuvat vain tälle laitteelle.',
    lisaa: 'Lisää suosikkeihin',
    suosikki: 'Suosikki',
    lisaaKuvio: (n) => `Lisää kuvio ${n} suosikkeihin`,
    kuvioSuosikki: (n) => `Kuvio ${n} on suosikki`,
    omaMuistiinpano: 'Oma muistiinpano',
    kuvioNimi: (n, kiinteisto) => `Kuvio ${n}${kiinteisto ? `, ${kiinteisto}` : ''}`,
    kuvioKartalla: 'Kuvio näkyy kartalla. Napauta karttaa kuvion kohdalta nähdäksesi kiinteistön.',
    tallennettu: 'Tallennettu suosikkeihin',
    kuvioEiListassa: 'Kuvio näkyy kartalla merkillä, mutta ei tämän kiinteistön kuvioissa.'
};

const en = {
    nappi: 'Favourites',
    otsikko: 'Favourites and notes',
    sulje: 'Close',
    kokeilu: 'Trial · test version only',
    kaikki: 'All',
    tyypit: { kiinteisto: 'Properties', kuvio: 'Stands', haku: 'Searches' },
    tyyppi: { kiinteisto: 'Property', kuvio: 'Stand', haku: 'Nearby search' },
    hae: 'Search names and notes',
    tyhja: 'No favourites yet. Add a property or a stand with the star (☆) in the property details, or save a nearby search.',
    eiOsumia: 'No matches.',
    avaa: 'Open',
    muokkaa: 'Edit',
    nimi: 'Name',
    muistiinpano: 'Your note',
    muistiinpanoOhje: 'E.g. boundary marker, berry spot, agreed thinning…',
    tallenna: 'Save',
    peruuta: 'Cancel',
    poista: 'Remove favourite',
    vahvistaPoisto: 'Remove? Tap again',
    vainLaitteella: 'Favourites and notes are saved on this device only.',
    lisaa: 'Add to favourites',
    suosikki: 'Favourite',
    lisaaKuvio: (n) => `Add stand ${n} to favourites`,
    kuvioSuosikki: (n) => `Stand ${n} is a favourite`,
    omaMuistiinpano: 'Your note',
    kuvioNimi: (n, kiinteisto) => `Stand ${n}${kiinteisto ? `, ${kiinteisto}` : ''}`,
    kuvioKartalla: 'The stand is shown on the map. Tap the map at the stand to see the property.',
    tallennettu: 'Saved to favourites',
    kuvioEiListassa: 'The stand is marked on the map but is not listed among this property\'s stands.'
};

const sv = {
    nappi: 'Favoriter',
    otsikko: 'Favoriter och anteckningar',
    sulje: 'Stäng',
    kokeilu: 'Försöksfunktion · endast i testversionen',
    kaikki: 'Alla',
    tyypit: { kiinteisto: 'Fastigheter', kuvio: 'Figurer', haku: 'Sökningar' },
    tyyppi: { kiinteisto: 'Fastighet', kuvio: 'Figur', haku: 'Sök i närheten' },
    hae: 'Sök i namn och anteckningar',
    tyhja: 'Inga favoriter ännu. Lägg till en fastighet eller en figur med stjärnan (☆) i fastighetens uppgifter eller spara en sökning i närheten.',
    eiOsumia: 'Inga träffar.',
    avaa: 'Öppna',
    muokkaa: 'Redigera',
    nimi: 'Namn',
    muistiinpano: 'Egen anteckning',
    muistiinpanoOhje: 'T.ex. rårör, bärställe, överenskommen gallring…',
    tallenna: 'Spara',
    peruuta: 'Avbryt',
    poista: 'Ta bort favorit',
    vahvistaPoisto: 'Ta bort? Tryck igen',
    vainLaitteella: 'Favoriter och anteckningar sparas endast på den här enheten.',
    lisaa: 'Lägg till i favoriter',
    suosikki: 'Favorit',
    lisaaKuvio: (n) => `Lägg till figur ${n} i favoriter`,
    kuvioSuosikki: (n) => `Figur ${n} är en favorit`,
    omaMuistiinpano: 'Egen anteckning',
    kuvioNimi: (n, kiinteisto) => `Figur ${n}${kiinteisto ? `, ${kiinteisto}` : ''}`,
    kuvioKartalla: 'Figuren visas på kartan. Tryck på kartan vid figuren för att se fastigheten.',
    tallennettu: 'Sparad i favoriter',
    kuvioEiListassa: 'Figuren visas med en markering på kartan men inte bland fastighetens figurer.'
};

export const TEKSTIT = { fi, sv, en };
// Käyttöohjeen osio (js/ui/ohje-osiot.js)
const OHJE = {
    fi: {
        otsikko: "Suosikit ja muistiinpanot",
        html: `<p>Lisää kiinteistö tai kuvio suosikkeihin tähdellä (☆) kiinteistön tiedoista tai tallenna lähihaku. Karttapainike <strong>Suosikit</strong> avaa listan.</p>
<ul>
<li>Suosikille voi antaa nimen ja oman muistiinpanon, esim. rajapyykki, marjapaikka tai sovittu harvennus.</li>
<li>Listaa voi rajata tyypin mukaan ja hakea nimestä tai muistiinpanosta. <em>Avaa</em> vie kiinteistölle, kuviolle tai hakuun.</li>
<li>Suosikit tallentuvat vain tälle laitteelle.</li>
</ul>
<p>Maksuton.</p>`
    },
    sv: {
        otsikko: "Favoriter och anteckningar",
        html: `<p>Lägg till en fastighet eller figur bland favoriterna med stjärnan (☆) i fastighetens uppgifter, eller spara en närsökning. Kartknappen <strong>Favoriter</strong> öppnar listan.</p>
<ul>
<li>Favoriten kan få ett namn och en egen anteckning, t.ex. rårör, bärställe eller överenskommen gallring.</li>
<li>Listan kan avgränsas efter typ och sökas på namn eller anteckning. <em>Öppna</em> tar dig till fastigheten, figuren eller sökningen.</li>
<li>Favoriterna sparas bara på den här enheten.</li>
</ul>
<p>Avgiftsfri.</p>`
    },
    en: {
        otsikko: "Favourites and notes",
        html: `<p>Add a property or stand to favourites with the star (☆) in the property details, or save a nearby search. The map button <strong>Favourites</strong> opens the list.</p>
<ul>
<li>A favourite can have a name and your own note, e.g. a boundary marker, a berry spot or an agreed thinning.</li>
<li>Filter the list by type and search by name or note. <em>Open</em> takes you to the property, stand or search.</li>
<li>Favourites are saved on this device only.</li>
</ul>
<p>Free of charge.</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
