/**
 * Metsätöiden rajoitteiden tekstit suomeksi, ruotsiksi ja englanniksi.
 */

import { pick } from '../i18n.js';

const fi = {
    otsikko: 'Huomioitavaa metsätöissä',
    kokeilu: 'Kokeilu',
    lasketaan: 'Haetaan muinaisjäännöksiä, suojelualueita ja elinympäristöjä…',
    ryhmat: {
        muinais: 'Muinaisjäännökset',
        kulttuuri: 'Muut kulttuuriperintökohteet',
        suojelu: 'Luonnonsuojelualueet',
        natura: 'Natura 2000 -alueet',
        erama: 'Erämaa-alueet',
        mete: 'Metsälain erityisen tärkeät elinympäristöt'
    },
    maara: (n) => `${n} kpl`,
    muuta: (n) => `ja ${n} muuta`,
    eiKohteita: 'Avoimista aineistoista ei löytynyt kiinteistöltä muinaisjäännöksiä, suojelualueita eikä erityisen tärkeitä elinympäristöjä.',
    eiKohteitaValinta: 'Avoimista aineistoista ei löytynyt valinnan alueelta muinaisjäännöksiä, suojelualueita eikä erityisen tärkeitä elinympäristöjä.',
    osittain: 'Osa aineistoista jäi hakematta, joten luettelo voi olla vajaa.',
    virhe: 'Kohteiden haku epäonnistui.',
    yritaUudelleen: 'Yritä uudelleen',
    huom: 'Luettelo ei ole kattava. Muinaisjäännökset ovat muinaismuistolain suojaamia, ja suojelualueilla, Natura-alueilla ja erityisen tärkeissä elinympäristöissä hakkuuta rajoitetaan. Tarkista kohteet ennen hakkuuta tai metsätöitä esimerkiksi Metsäkeskukselta tai Museovirastolta.',
    kuviolla: 'Kuviolla',
    merkki: 'Kuviolla on muinaisjäännös, suojelualue tai erityisen tärkeä elinympäristö',
    naytaKartalla: 'Näytä kohteet kartalla',
    piilotaKartalta: 'Piilota kohteet kartalta',
    lahteet: 'Lähteet: Museovirasto (muinaisjäännösrekisteri, kulttuuriperintökohteet), Suomen ympäristökeskus (luonnonsuojelualueet, Natura 2000, erämaat), Suomen metsäkeskus (erityisen tärkeät elinympäristöt); CC BY 4.0.'
};

const sv = {
    otsikko: 'Att beakta vid skogsarbeten',
    kokeilu: 'Försök',
    lasketaan: 'Fornlämningar, skyddsområden och livsmiljöer hämtas…',
    ryhmat: {
        muinais: 'Fornlämningar',
        kulttuuri: 'Övriga kulturarvsobjekt',
        suojelu: 'Naturskyddsområden',
        natura: 'Natura 2000-områden',
        erama: 'Ödemarksområden',
        mete: 'Särskilt viktiga livsmiljöer enligt skogslagen'
    },
    maara: (n) => `${n} st.`,
    muuta: (n) => `och ${n} andra`,
    eiKohteita: 'I öppna data hittades inga fornlämningar, skyddsområden eller särskilt viktiga livsmiljöer på fastigheten.',
    eiKohteitaValinta: 'I öppna data hittades inga fornlämningar, skyddsområden eller särskilt viktiga livsmiljöer i urvalets område.',
    osittain: 'En del data kunde inte hämtas, så listan kan vara ofullständig.',
    virhe: 'Objekten kunde inte hämtas.',
    yritaUudelleen: 'Försök igen',
    huom: 'Listan är inte fullständig. Fornlämningar är fredade enligt lagen om fornminnen, och avverkning begränsas i skyddsområden, Natura-områden och särskilt viktiga livsmiljöer. Kontrollera objekten före avverkning eller skogsarbeten, till exempel hos Skogscentralen eller Museiverket.',
    kuviolla: 'På figuren',
    merkki: 'På figuren finns en fornlämning, ett skyddsområde eller en särskilt viktig livsmiljö',
    naytaKartalla: 'Visa objekten på kartan',
    piilotaKartalta: 'Dölj objekten från kartan',
    lahteet: 'Källor: Museiverket (fornlämningsregistret, kulturarvsobjekt), Finlands miljöcentral (naturskyddsområden, Natura 2000, ödemarker), Finlands skogscentral (särskilt viktiga livsmiljöer); CC BY 4.0.'
};

const en = {
    otsikko: 'Things to note in forestry work',
    kokeilu: 'Trial',
    lasketaan: 'Fetching ancient monuments, protected areas and habitats…',
    ryhmat: {
        muinais: 'Ancient monuments',
        kulttuuri: 'Other cultural heritage sites',
        suojelu: 'Nature conservation areas',
        natura: 'Natura 2000 areas',
        erama: 'Wilderness areas',
        mete: 'Particularly important habitats under the Forest Act'
    },
    maara: (n) => `${n}`,
    muuta: (n) => `and ${n} more`,
    eiKohteita: 'No ancient monuments, protected areas or particularly important habitats were found on the property in open data.',
    eiKohteitaValinta: 'No ancient monuments, protected areas or particularly important habitats were found in the selection area in open data.',
    osittain: 'Some data could not be fetched, so the list may be incomplete.',
    virhe: 'Fetching the sites failed.',
    yritaUudelleen: 'Try again',
    huom: 'The list is not exhaustive. Ancient monuments are protected by the Antiquities Act, and felling is restricted in protected areas, Natura areas and particularly important habitats. Check the sites before felling or forestry work, for example with the Finnish Forest Centre or the Finnish Heritage Agency.',
    kuviolla: 'On the stand',
    merkki: 'The stand has an ancient monument, a protected area or a particularly important habitat',
    naytaKartalla: 'Show sites on the map',
    piilotaKartalta: 'Hide sites from the map',
    lahteet: 'Sources: Finnish Heritage Agency (ancient monuments register, cultural heritage sites), Finnish Environment Institute (conservation areas, Natura 2000, wilderness areas), Finnish Forest Centre (particularly important habitats); CC BY 4.0.'
};

export const TEKSTIT = { fi, sv, en };

// Käyttöohjeen osio (js/ui/ohje-osiot.js)
const OHJE = {
    fi: {
        otsikko: 'Huomioitavaa metsätöissä',
        html: `<p>Kiinteistön ja kuviovalinnan yhteenvedossa on laatikko <strong>Huomioitavaa metsätöissä</strong>. Siinä ovat kohteet, jotka ovat kiinteistöllä tai enintään 20 metrin päässä sen rajasta:</p>
<ul>
<li><strong>Muinaisjäännökset</strong> ja muut kulttuuriperintökohteet (Museovirasto). Muinaisjäännökset ovat muinaismuistolain suojaamia: metsäkoneella ei saa ajaa niiden päältä.</li>
<li><strong>Luonnonsuojelualueet, Natura 2000 -alueet ja erämaat</strong> (Suomen ympäristökeskus).</li>
<li><strong>Metsälain erityisen tärkeät elinympäristöt</strong> (Suomen metsäkeskus).</li>
</ul>
<p>Kohteet näkyvät kartalla, ja kuvion tiedoissa kerrotaan, jos kohde on kuviolla. Luettelo ei ole kattava: tarkista kohteet ennen hakkuuta tai metsätöitä.</p>`
    },
    sv: {
        otsikko: 'Att beakta vid skogsarbeten',
        html: `<p>I fastighetens och urvalets sammandrag finns rutan <strong>Att beakta vid skogsarbeten</strong>. Där finns objekt på fastigheten eller högst 20 meter från dess gräns:</p>
<ul>
<li><strong>Fornlämningar</strong> och övriga kulturarvsobjekt (Museiverket). Fornlämningar är fredade enligt lagen om fornminnen: skogsmaskiner får inte köra över dem.</li>
<li><strong>Naturskyddsområden, Natura 2000-områden och ödemarker</strong> (Finlands miljöcentral).</li>
<li><strong>Särskilt viktiga livsmiljöer enligt skogslagen</strong> (Finlands skogscentral).</li>
</ul>
<p>Objekten visas på kartan, och figurens uppgifter berättar om ett objekt finns på figuren. Listan är inte fullständig: kontrollera objekten före avverkning eller skogsarbeten.</p>`
    },
    en: {
        otsikko: 'Things to note in forestry work',
        html: `<p>The property and selection summary has a box <strong>Things to note in forestry work</strong>. It lists sites on the property or at most 20 metres from its boundary:</p>
<ul>
<li><strong>Ancient monuments</strong> and other cultural heritage sites (Finnish Heritage Agency). Ancient monuments are protected by the Antiquities Act: forest machines must not drive over them.</li>
<li><strong>Nature conservation areas, Natura 2000 areas and wilderness areas</strong> (Finnish Environment Institute).</li>
<li><strong>Particularly important habitats under the Forest Act</strong> (Finnish Forest Centre).</li>
</ul>
<p>The sites are shown on the map, and the stand details tell if a site is on the stand. The list is not exhaustive: check the sites before felling or forestry work.</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
