/**
 * Suosikkien tekstit yhdessä paikassa kielivalintaa (#24) varten.
 * Toistaiseksi vain suomi.
 */

export const T = {
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
