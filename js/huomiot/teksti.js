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
    huomiotMaara: (n) => `Huomiot (${n})`,
    kuvionHuomiot: 'Huomiot',
    lisaosa: 'Kuuluu hinta-arvion lisäosaan.'
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
    huomiotMaara: (n) => `Observationer (${n})`,
    kuvionHuomiot: 'Observationer',
    lisaosa: 'Ingår i tillägget för prisuppskattning.'
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
    huomiotMaara: (n) => `Notes (${n})`,
    kuvionHuomiot: 'Notes',
    lisaosa: 'Part of the price estimate add-on.'
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
<li>Huomiot näkyvät kartalla merkkeinä sekä kiinteistön ja kuvion tiedoissa.</li>
<li>Huomiot tallentuvat vain tälle laitteelle.</li>
</ul>
<p>Kuuluu hinta-arvion lisäosaan (kertaosto).</p>`
    },
    sv: {
        otsikko: 'Observationer',
        html: `<p>Spara en observation på en exakt plats, till exempel en vindfälla, ett rårör, ett igensatt dike eller en bra lagringsplats. Välj <strong>Verktyg → Observationer → Ny observation</strong> och sedan <em>På min position</em> eller <em>Tryck på kartan</em>.</p>
<ul>
<li>Observationen kopplas till fastigheten och figuren där punkten ligger. Figuren kan bytas.</li>
<li>Punkten kan flyttas genom att dra markeringen. Koordinaterna visas i ETRS-TM35FIN samt som latitud och longitud.</li>
<li>Observationerna visas som markeringar på kartan och i fastighetens och figurens uppgifter.</li>
<li>Observationerna sparas bara på den här enheten.</li>
</ul>
<p>Ingår i tillägget för prisuppskattning (engångsköp).</p>`
    },
    en: {
        otsikko: 'Notes',
        html: `<p>Save a note at an exact spot, for example a windfall, a boundary marker, a blocked ditch or a good storage spot. Choose <strong>Tools → Notes → New note</strong> and then <em>At my location</em> or <em>Tap on the map</em>.</p>
<ul>
<li>The note is linked to the property and stand where the point is. You can change the stand.</li>
<li>Move the point by dragging the marker. Coordinates are shown in ETRS-TM35FIN and as latitude and longitude.</li>
<li>Notes appear as markers on the map and in the property and stand details.</li>
<li>Notes are saved on this device only.</li>
</ul>
<p>Part of the price estimate add-on (one-time purchase).</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
