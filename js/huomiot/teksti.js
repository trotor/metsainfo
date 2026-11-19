/**
 * Huomioiden tekstit suomeksi, ruotsiksi ja englanniksi (#33).
 */

import { pick } from '../i18n.js';

const fi = {
    nappi: 'Huomiot',
    kuvaus: 'Tallenna huomio tarkkaan paikkaan kartalle',
    otsikko: 'Huomiot',
    sulje: 'Sulje',
    kokeilu: 'Kokeilu',
    uusi: 'Uusi huomio',
    tahan: 'Tähän sijaintiin',
    napauta: 'Napauta kartalta',
    napautaOhje: 'Napauta kartalta kohta, johon huomio tallennetaan.',
    haetaanSijaintia: 'Haetaan sijaintia…',
    eiSijaintia: 'Sijaintia ei saatu. Napauta kohta kartalta.',
    takaisin: 'Takaisin',
    tyhja: 'Ei vielä huomioita. Tallenna esimerkiksi tuulenkaato, rajapyykki tai ojan tukos tarkkaan paikkaan.',
    otsikkoKentta: 'Otsikko',
    otsikkoOhje: 'Esim. tuulenkaato tien päällä',
    tyyppiKentta: 'Tyyppi',
    tyypit: { tuulenkaato: 'Tuulenkaato', rajapyykki: 'Rajapyykki', oja: 'Oja', varasto: 'Varastopaikka', muu: 'Muu' },
    tekstiKentta: 'Huomio',
    tekstiOhje: 'Mitä paikalla on tai mitä pitää tehdä',
    kiinteisto: 'Kiinteistö',
    eiKiinteistoa: 'Ei kiinteistöä',
    haetaanKiinteistoa: 'Haetaan kiinteistöä…',
    kuvio: 'Kuvio',
    eiKuviota: 'Ei kuviota',
    kuvioNro: (n) => `Kuvio ${n}`,
    koordinaatit: 'Koordinaatit',
    tarkkuus: (m) => `sijainnin tarkkuus noin ${m} m`,
    siirraOhje: 'Voit siirtää pistettä vetämällä merkkiä kartalla.',
    tallenna: 'Tallenna',
    poista: 'Poista huomio',
    vahvistaPoisto: 'Poistetaanko? Paina uudelleen',
    nayta: 'Näytä kartalla',
    avaa: 'Avaa',
    nimeton: 'Nimetön huomio',
    vainLaitteella: 'Huomiot tallentuvat vain tälle laitteelle.',
    tallennettu: 'Huomio tallennettu',
    eiTallennettu: 'Huomiota ei voitu tallentaa laitteelle (muisti täynnä tai estetty). Se katoaa, kun sovellus suljetaan.',
    huomiotMaara: (n) => `Huomiot (${n})`,
    kuvionHuomiot: 'Huomiot',
    lisaosa: 'Kuuluu hinta-arvion lisäosaan.',
    kuvat: 'Kuvat',
    otaKuva: 'Ota kuva',
    valitseKuva: 'Valitse kuvista',
    poistaKuva: 'Poista kuva',
    kuvaAlt: (n) => `Huomion kuva ${n}`,
    suljeKuva: 'Sulje kuva',
    kuvaGalleriaan: 'Kameralla otettu kuva tallentuu myös laitteen kuviin.',
    kuvatMax: (n) => `Enintään ${n} kuvaa.`,
    kuvaEiOnnistunut: 'Kuvan lisääminen ei onnistunut. Tarkista kameran ja kuvien käyttöoikeus laitteen asetuksista.',
    kuviaEiTallennettu: (n) => (n === 1 ? 'Yhtä kuvaa ei voitu tallentaa.' : `${n} kuvaa ei voitu tallentaa.`),
    kuviaMaara: (n) => (n === 1 ? '1 kuva' : `${n} kuvaa`)
};

const sv = {
    nappi: 'Observationer',
    kuvaus: 'Spara en observation på en exakt plats på kartan',
    otsikko: 'Observationer',
    sulje: 'Stäng',
    kokeilu: 'Försök',
    uusi: 'Ny observation',
    tahan: 'På min position',
    napauta: 'Tryck på kartan',
    napautaOhje: 'Tryck på kartan där observationen ska sparas.',
    haetaanSijaintia: 'Hämtar position…',
    eiSijaintia: 'Ingen position. Tryck på platsen på kartan.',
    takaisin: 'Tillbaka',
    tyhja: 'Inga observationer ännu. Spara till exempel en vindfälla, ett rårör eller ett igensatt dike på en exakt plats.',
    otsikkoKentta: 'Rubrik',
    otsikkoOhje: 'T.ex. vindfälla över vägen',
    tyyppiKentta: 'Typ',
    tyypit: { tuulenkaato: 'Vindfälle', rajapyykki: 'Rårör', oja: 'Dike', varasto: 'Lagringsplats', muu: 'Annat' },
    tekstiKentta: 'Observation',
    tekstiOhje: 'Vad finns på platsen eller vad ska göras',
    kiinteisto: 'Fastighet',
    eiKiinteistoa: 'Ingen fastighet',
    haetaanKiinteistoa: 'Hämtar fastighet…',
    kuvio: 'Figur',
    eiKuviota: 'Ingen figur',
    kuvioNro: (n) => `Figur ${n}`,
    koordinaatit: 'Koordinater',
    tarkkuus: (m) => `positionens noggrannhet cirka ${m} m`,
    siirraOhje: 'Du kan flytta punkten genom att dra markeringen på kartan.',
    tallenna: 'Spara',
    poista: 'Ta bort observationen',
    vahvistaPoisto: 'Ta bort? Tryck igen',
    nayta: 'Visa på kartan',
    avaa: 'Öppna',
    nimeton: 'Observation utan rubrik',
    vainLaitteella: 'Observationerna sparas bara på den här enheten.',
    tallennettu: 'Observationen sparad',
    eiTallennettu: 'Observationen kunde inte sparas på enheten (minnet är fullt eller blockerat). Den försvinner när appen stängs.',
    huomiotMaara: (n) => `Observationer (${n})`,
    kuvionHuomiot: 'Observationer',
    lisaosa: 'Ingår i tillägget för prisuppskattning.',
    kuvat: 'Bilder',
    otaKuva: 'Ta en bild',
    valitseKuva: 'Välj bland bilder',
    poistaKuva: 'Ta bort bilden',
    kuvaAlt: (n) => `Observationens bild ${n}`,
    suljeKuva: 'Stäng bilden',
    kuvaGalleriaan: 'En bild som tas med kameran sparas också bland enhetens bilder.',
    kuvatMax: (n) => `Högst ${n} bilder.`,
    kuvaEiOnnistunut: 'Bilden kunde inte läggas till. Kontrollera behörigheten till kameran och bilderna i enhetens inställningar.',
    kuviaEiTallennettu: (n) => (n === 1 ? 'En bild kunde inte sparas.' : `${n} bilder kunde inte sparas.`),
    kuviaMaara: (n) => (n === 1 ? '1 bild' : `${n} bilder`)
};

const en = {
    nappi: 'Notes',
    kuvaus: 'Save a note at an exact spot on the map',
    otsikko: 'Notes',
    sulje: 'Close',
    kokeilu: 'Trial',
    uusi: 'New note',
    tahan: 'At my location',
    napauta: 'Tap on the map',
    napautaOhje: 'Tap the spot on the map where the note is saved.',
    haetaanSijaintia: 'Getting your location…',
    eiSijaintia: 'No location. Tap the spot on the map.',
    takaisin: 'Back',
    tyhja: 'No notes yet. Save, for example, a windfall, a boundary marker or a blocked ditch at an exact spot.',
    otsikkoKentta: 'Title',
    otsikkoOhje: 'E.g. windfall across the road',
    tyyppiKentta: 'Type',
    tyypit: { tuulenkaato: 'Windfall', rajapyykki: 'Boundary marker', oja: 'Ditch', varasto: 'Storage spot', muu: 'Other' },
    tekstiKentta: 'Note',
    tekstiOhje: 'What is there or what needs to be done',
    kiinteisto: 'Property',
    eiKiinteistoa: 'No property',
    haetaanKiinteistoa: 'Finding the property…',
    kuvio: 'Stand',
    eiKuviota: 'No stand',
    kuvioNro: (n) => `Stand ${n}`,
    koordinaatit: 'Coordinates',
    tarkkuus: (m) => `location accuracy about ${m} m`,
    siirraOhje: 'You can move the point by dragging the marker on the map.',
    tallenna: 'Save',
    poista: 'Delete note',
    vahvistaPoisto: 'Delete? Tap again',
    nayta: 'Show on map',
    avaa: 'Open',
    nimeton: 'Untitled note',
    vainLaitteella: 'Notes are saved on this device only.',
    tallennettu: 'Note saved',
    eiTallennettu: 'The note could not be saved on this device (storage full or blocked). It will be lost when the app is closed.',
    huomiotMaara: (n) => `Notes (${n})`,
    kuvionHuomiot: 'Notes',
    lisaosa: 'Part of the price estimate add-on.',
    kuvat: 'Photos',
    otaKuva: 'Take a photo',
    valitseKuva: 'Choose from photos',
    poistaKuva: 'Remove photo',
    kuvaAlt: (n) => `Note photo ${n}`,
    suljeKuva: 'Close photo',
    kuvaGalleriaan: 'A photo taken with the camera is also saved to the device’s photos.',
    kuvatMax: (n) => `Up to ${n} photos.`,
    kuvaEiOnnistunut: 'The photo could not be added. Check camera and photo access in the device settings.',
    kuviaEiTallennettu: (n) => (n === 1 ? 'One photo could not be saved.' : `${n} photos could not be saved.`),
    kuviaMaara: (n) => (n === 1 ? '1 photo' : `${n} photos`)
};

export const TEKSTIT = { fi, sv, en };
// Käyttöohjeen osio (js/ui/ohje-osiot.js)
const OHJE = {
    fi: {
        otsikko: 'Huomiot',
        html: `<p>Tallenna huomio tarkkaan paikkaan, esimerkiksi tuulenkaato, rajapyykki, ojan tukos tai hyvä varastopaikka. Valitse <strong>Työkalut → Huomiot → Uusi huomio</strong> ja sitten <em>Tähän sijaintiin</em> tai <em>Napauta kartalta</em>.</p>
<ul>
<li>Huomio liitetään kiinteistöön ja kuvioon, joilla piste on. Kuvion voi vaihtaa.</li>
<li>Pistettä voi siirtää vetämällä merkkiä. Koordinaatit näkyvät ETRS-TM35FIN-muodossa sekä leveys- ja pituusasteina.</li>
<li>Huomioon voi liittää enintään viisi kuvaa: ota kuva kameralla (tallentuu myös laitteen kuviin) tai valitse kuvista. Kuvan napautus avaa sen koko näytölle.</li>
<li>Huomiot näkyvät kartalla merkkeinä sekä kiinteistön ja kuvion tiedoissa.</li>
<li>Huomiot ja niiden kuvat tallentuvat vain tälle laitteelle.</li>
</ul>
<p>Maksuton nyt. Toiminto voi myöhemmin muuttua maksulliseksi.</p>`
    },
    sv: {
        otsikko: 'Observationer',
        html: `<p>Spara en observation på en exakt plats, till exempel en vindfälla, ett rårör, ett igensatt dike eller en bra lagringsplats. Välj <strong>Verktyg → Observationer → Ny observation</strong> och sedan <em>På min position</em> eller <em>Tryck på kartan</em>.</p>
<ul>
<li>Observationen kopplas till fastigheten och figuren där punkten ligger. Figuren kan bytas.</li>
<li>Punkten kan flyttas genom att dra markeringen. Koordinaterna visas i ETRS-TM35FIN samt som latitud och longitud.</li>
<li>Du kan lägga till högst fem bilder till en observation: ta en bild med kameran (sparas också bland enhetens bilder) eller välj bland bilder. Tryck på en bild för att visa den i helskärm.</li>
<li>Observationerna visas som markeringar på kartan och i fastighetens och figurens uppgifter.</li>
<li>Observationerna och deras bilder sparas bara på den här enheten.</li>
</ul>
<p>Kostnadsfri nu. Funktionen kan senare bli avgiftsbelagd.</p>`
    },
    en: {
        otsikko: 'Notes',
        html: `<p>Save a note at an exact spot, for example a windfall, a boundary marker, a blocked ditch or a good storage spot. Choose <strong>Tools → Notes → New note</strong> and then <em>At my location</em> or <em>Tap on the map</em>.</p>
<ul>
<li>The note is linked to the property and stand where the point is. You can change the stand.</li>
<li>Move the point by dragging the marker. Coordinates are shown in ETRS-TM35FIN and as latitude and longitude.</li>
<li>You can add up to five photos to a note: take one with the camera (also saved to the device’s photos) or choose from photos. Tap a photo to view it full screen.</li>
<li>Notes appear as markers on the map and in the property and stand details.</li>
<li>Notes and their photos are saved on this device only.</li>
</ul>
<p>Free for now. This feature may become paid later.</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
