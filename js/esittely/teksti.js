/** Esittelyn tekstit suomeksi, ruotsiksi ja englanniksi. */
import { pick } from '../i18n.js';

export const TEKSTIT = {
    fi: {
        ohita: 'Ohita',
        seuraava: 'Seuraava',
        edellinen: 'Edellinen',
        valmis: 'Valmis',
        sulje: 'Sulje esittely',
        vaihe: (n, m) => `${n}/${m}`,
        tervetuloaOtsikko: 'Tervetuloa Metsäinfoon',
        tervetuloa: 'Metsäinfo näyttää kiinteistön metsävaratiedot kartalla. Lähennä karttaa, niin kiinteistöjen rajat tulevat näkyviin, ja napauta kiinteistöä: saat yhteenvedon puustosta ja kuvioista.',
        hakuOtsikko: 'Löydä oma metsäsi',
        haku: 'Hae kiinteistötunnuksella, esimerkiksi 91-416-1-123, tai näytä sijaintisi nuolinapista. Molemmat vievät kartan suoraan sopivalle etäisyydelle.',
        tasotOtsikko: 'Kartta ja tasot',
        tasot: 'Tästä vaihdat taustakartaksi esimerkiksi ilmakuvan ja laitat päälle lisätasoja, kuten luontokohteet ja metsänkäyttöilmoitukset.',
        tyokalutOtsikko: 'Työkalut ja valikko',
        tyokalut: 'Työkalut-napista löytyvät kartan työkalut. ☰-valikossa ovat käyttöohje ja muut sovelluksen osat.',
        maksullisetOtsikko: 'Lisää kertaostolla',
        maksulliset: 'Kertaostolla saat käyttöön:',
        omistetut: 'Nämä ovat käytössäsi:',
        hintaArvio: 'Puukaupan hinta-arvio',
        hintaArvioKuvaus: 'paljonko kiinteistön ehdotetut hakkuut ovat arvoltaan alueen tuoreilla kantohinnoilla',
        paikkaArvio: 'kiinteistön Arvio-välilehdellä',
        paikkaTyokalut: 'Työkaluissa',
        paikkaVari: 'Väritys-valitsimessa',
        muuttuu: 'Kertaosto sisältää nämä toiminnot. Jatkossa uudet toiminnot voivat olla erikseen ostettavia tai kuukausimaksullisia.',
        kokeile: 'Kokeile esimerkillä',
        ostoOtsikko: 'Kiitos ostosta!',
        osto: 'Nyt käytössäsi ovat:',
        selva: 'Selvä',
        zoomVihje: 'Lähennä karttaa, niin kiinteistöt ja kuviot tulevat näkyviin.',
        zoomSijainti: 'Näytä sijaintini',
        zoomLahenna: 'Lähennä',
        zoomSulje: 'Sulje vihje'
    },
    sv: {
        ohita: 'Hoppa över',
        seuraava: 'Nästa',
        edellinen: 'Föregående',
        valmis: 'Klar',
        sulje: 'Stäng introduktionen',
        vaihe: (n, m) => `${n}/${m}`,
        tervetuloaOtsikko: 'Välkommen till Metsäinfo',
        tervetuloa: 'Metsäinfo visar fastighetens skogsdata på kartan. Zooma in så syns fastighetsgränserna, och tryck på en fastighet: du får en sammanfattning av trädbeståndet och figurerna.',
        hakuOtsikko: 'Hitta din skog',
        haku: 'Sök med fastighetsbeteckning, till exempel 91-416-1-123, eller visa din position med pilknappen. Båda tar kartan direkt till ett lämpligt avstånd.',
        tasotOtsikko: 'Karta och lager',
        tasot: 'Här byter du bakgrundskarta, till exempel till flygbild, och lägger till lager som naturobjekt och skogsbruksanmälningar.',
        tyokalutOtsikko: 'Verktyg och meny',
        tyokalut: 'Under Verktyg-knappen finns kartans verktyg. I ☰-menyn finns bruksanvisningen och appens övriga delar.',
        maksullisetOtsikko: 'Mer med ett engångsköp',
        maksulliset: 'Med ett engångsköp får du:',
        omistetut: 'Dessa har du tillgång till:',
        hintaArvio: 'Prisuppskattning för virkesaffär',
        hintaArvioKuvaus: 'hur mycket fastighetens föreslagna avverkningar är värda till färska rotpriser i området',
        paikkaArvio: 'på fastighetens flik Uppskattning',
        paikkaTyokalut: 'under Verktyg',
        paikkaVari: 'i färgväljaren',
        muuttuu: 'Engångsköpet omfattar de här funktionerna. Nya funktioner kan i framtiden köpas separat eller ha en månadsavgift.',
        kokeile: 'Prova med ett exempel',
        ostoOtsikko: 'Tack för köpet!',
        osto: 'Nu har du tillgång till:',
        selva: 'Okej',
        zoomVihje: 'Zooma in så syns fastigheter och figurer.',
        zoomSijainti: 'Visa min position',
        zoomLahenna: 'Zooma in',
        zoomSulje: 'Stäng tipset'
    },
    en: {
        ohita: 'Skip',
        seuraava: 'Next',
        edellinen: 'Back',
        valmis: 'Done',
        sulje: 'Close the introduction',
        vaihe: (n, m) => `${n}/${m}`,
        tervetuloaOtsikko: 'Welcome to Metsäinfo',
        tervetuloa: 'Metsäinfo shows forest data for a property on the map. Zoom in to see property boundaries, then tap a property for a summary of its trees and stands.',
        hakuOtsikko: 'Find your forest',
        haku: 'Search by property ID, for example 91-416-1-123, or show your location with the arrow button. Both take the map straight to a suitable distance.',
        tasotOtsikko: 'Map and layers',
        tasot: 'Here you change the background map, for example to an aerial photo, and add layers such as habitats and forest use declarations.',
        tyokalutOtsikko: 'Tools and menu',
        tyokalut: 'The Tools button holds the map tools. The ☰ menu has the user guide and the rest of the app.',
        maksullisetOtsikko: 'More with a one-time purchase',
        maksulliset: 'A one-time purchase gives you:',
        omistetut: 'You have access to:',
        hintaArvio: 'Timber sale estimate',
        hintaArvioKuvaus: 'what the proposed fellings on the property are worth at recent stumpage prices for the area',
        paikkaArvio: 'on the property’s Estimate tab',
        paikkaTyokalut: 'under Tools',
        paikkaVari: 'in the colour selector',
        muuttuu: 'The one-time purchase includes these features. New features may in future be sold separately or as a monthly subscription.',
        kokeile: 'Try it with an example',
        ostoOtsikko: 'Thank you for your purchase!',
        osto: 'You now have:',
        selva: 'Got it',
        zoomVihje: 'Zoom in to see properties and stands.',
        zoomSijainti: 'Show my location',
        zoomLahenna: 'Zoom in',
        zoomSulje: 'Close the tip'
    }
};
// Käyttöohjeen osio (js/ui/ohje-osiot.js)
const OHJE = {
    fi: {
        otsikko: 'Esittely',
        html: `<p>Lyhyt esittely näytetään ensimmäisellä avauskerralla. Kun sen on ohittanut tai käynyt läpi, se ei tule enää itsestään. Sen saa uudelleen asetuksista tai tästä:</p>
<p><button type="button" class="es-ohjenappi" data-esittely="avaa">Näytä esittely</button></p>`
    },
    sv: {
        otsikko: 'Introduktion',
        html: `<p>En kort introduktion visas första gången appen öppnas. När du har hoppat över den eller gått igenom den visas den inte längre av sig själv. Du kan visa den igen i inställningarna eller här:</p>
<p><button type="button" class="es-ohjenappi" data-esittely="avaa">Visa introduktionen</button></p>`
    },
    en: {
        otsikko: 'Introduction',
        html: `<p>A short introduction is shown the first time the app opens. Once you have skipped it or gone through it, it no longer appears by itself. You can show it again in the settings or here:</p>
<p><button type="button" class="es-ohjenappi" data-esittely="avaa">Show the introduction</button></p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
