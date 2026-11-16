/**
 * Suosikkien tekstit suomeksi ja englanniksi (#24).
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
    tallennettu: 'Tallennettu suosikkeihin'
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
    tallennettu: 'Saved to favourites'
};

export const TEKSTIT = { fi, en };
export const T = pick(TEKSTIT);
