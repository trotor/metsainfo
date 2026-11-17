/**
 * Kuviovalinnan tekstit suomeksi, ruotsiksi ja englanniksi (#32).
 */

import { pick } from '../i18n.js';

const fi = {
    nappi: 'Valitse kuvioita',
    kuvaus: 'Kokoa kuvioita valinnaksi myös kiinteistörajojen yli ja katso niiden yhteenveto.',
    otsikko: 'Valitse kuvioita',
    sulje: 'Sulje',
    kokeilu: 'Kokeilu · vain testiversiossa',
    ohje: 'Napauta kartalta kuvioita valintaan, myös eri kiinteistöiltä. Napauta uudelleen poistaaksesi.',
    zoomaa: 'Zoomaa lähemmäs, niin kuviot näkyvät valittaviksi.',
    ladataan: 'Ladataan kuvioita…',
    virhe: 'Osa kuvioista jäi lataamatta. Siirrä karttaa yrittääksesi uudelleen.',
    liianLaaja: 'Valinta saa olla enintään 10 km × 10 km.',
    tyhja: 'Ei vielä valittuja kuvioita.',
    yhteenveto: (n, ha, m3) => `${n} ${n === 1 ? 'kuvio' : 'kuviota'} · ${ha} ha · ${m3} m³`,
    kuvio: (nro) => `Kuvio ${nro}`,
    poista: 'Poista valinnasta',
    nayta: 'Näytä yhteenveto',
    paivita: 'Päivitä yhteenveto',
    muuttunut: 'Valinta muuttunut näytetystä yhteenvedosta.',
    tyhjenna: 'Tyhjennä',
    lopeta: 'Lopeta valinta',
    valintaOtsikko: (n) => `Oma valinta · ${n} ${n === 1 ? 'kuvio' : 'kuviota'}`,
    huom: 'Valitaan kokonaisia kuvioita. Hinta-arvio koskee vain puustoa, ei maapohjaa. Valintaa ei tallenneta.'
};

const sv = {
    nappi: 'Välj figurer',
    kuvaus: 'Sätt ihop figurer till ett urval, även över fastighetsgränser, och se sammandraget.',
    otsikko: 'Välj figurer',
    sulje: 'Stäng',
    kokeilu: 'Försök · endast i testversionen',
    ohje: 'Tryck på figurer på kartan för att lägga till dem i urvalet, även från olika fastigheter. Tryck igen för att ta bort.',
    zoomaa: 'Zooma in så att figurerna kan väljas.',
    ladataan: 'Figurer laddas…',
    virhe: 'En del figurer kunde inte laddas. Flytta kartan för att försöka igen.',
    liianLaaja: 'Urvalet får vara högst 10 km × 10 km.',
    tyhja: 'Inga valda figurer ännu.',
    yhteenveto: (n, ha, m3) => `${n} ${n === 1 ? 'figur' : 'figurer'} · ${ha} ha · ${m3} m³`,
    kuvio: (nro) => `Figur ${nro}`,
    poista: 'Ta bort ur urvalet',
    nayta: 'Visa sammandrag',
    paivita: 'Uppdatera sammandraget',
    muuttunut: 'Urvalet har ändrats sedan sammandraget visades.',
    tyhjenna: 'Töm',
    lopeta: 'Avsluta urvalet',
    valintaOtsikko: (n) => `Eget urval · ${n} ${n === 1 ? 'figur' : 'figurer'}`,
    huom: 'Hela figurer väljs. Prisuppskattningen gäller endast trädbeståndet, inte marken. Urvalet sparas inte.'
};

const en = {
    nappi: 'Select stands',
    kuvaus: 'Build a selection of stands, also across property borders, and see its summary.',
    otsikko: 'Select stands',
    sulje: 'Close',
    kokeilu: 'Trial · test version only',
    ohje: 'Tap stands on the map to add them to the selection, also across properties. Tap again to remove.',
    zoomaa: 'Zoom in to make the stands selectable.',
    ladataan: 'Loading stands…',
    virhe: 'Some stands could not be loaded. Move the map to try again.',
    liianLaaja: 'The selection can be at most 10 km × 10 km.',
    tyhja: 'No stands selected yet.',
    yhteenveto: (n, ha, m3) => `${n} ${n === 1 ? 'stand' : 'stands'} · ${ha} ha · ${m3} m³`,
    kuvio: (nro) => `Stand ${nro}`,
    poista: 'Remove from selection',
    nayta: 'Show summary',
    paivita: 'Update summary',
    muuttunut: 'The selection has changed since the summary was shown.',
    tyhjenna: 'Clear',
    lopeta: 'Stop selecting',
    valintaOtsikko: (n) => `Own selection · ${n} ${n === 1 ? 'stand' : 'stands'}`,
    huom: 'Whole stands are selected. The price estimate covers the trees only, not the land. The selection is not saved.'
};

export const TEKSTIT = { fi, sv, en };

// Käyttöohjeen osio (js/ui/ohje-osiot.js)
const OHJE = {
    fi: {
        otsikko: 'Valitse kuvioita',
        html: `<p>Karttapainike <strong>Valitse kuvioita</strong> kokoaa valinnan yksittäisistä kuvioista, myös usean kiinteistön alueelta. Sillä voi arvioida esimerkiksi kiinteistön osaa tai määräalaa ennen kauppaa.</p>
<ul>
<li>Zoomaa lähelle, niin kuviot näkyvät kartalla. Napauta kuviota lisätäksesi sen valintaan ja uudelleen poistaaksesi. Valintatilassa kiinteistön napautus ei avaa kiinteistöä.</li>
<li><strong>Näytä yhteenveto</strong> avaa valinnasta saman yhteenvedon kuin kiinteistöstä: tilastot, kuviot, hakkuuehdotukset, hinta-arvion ja saavutettavuuden. Kun valinta muuttuu, paina <strong>Päivitä yhteenveto</strong>.</li>
<li>Valitaan kokonaisia kuvioita, ja valinta saa olla enintään 10 km × 10 km. Hinta-arvio koskee vain puustoa, ei maapohjaa.</li>
<li>Valinta säilyy, kunnes tyhjennät sen tai suljet sovelluksen. Sitä ei tallenneta.</li>
</ul>
<p>Valinta on maksuton. Hinta-arvio ja saavutettavuus kuuluvat puukaupan hinta-arvion lisäosaan (sama kertaosto).</p>`
    },
    sv: {
        otsikko: 'Välj figurer',
        html: `<p>Kartknappen <strong>Välj figurer</strong> sätter ihop ett urval av enskilda figurer, även från flera fastigheter. Du kan till exempel bedöma en del av en fastighet eller ett outbrutet område före en affär.</p>
<ul>
<li>Zooma in så att figurerna syns på kartan. Tryck på en figur för att lägga till den och igen för att ta bort den. I urvalsläget öppnar ett tryck på en fastighet inte fastigheten.</li>
<li><strong>Visa sammandrag</strong> öppnar samma sammandrag som för en fastighet: statistik, figurer, avverkningsförslag, prisuppskattning och åtkomlighet. När urvalet ändras, tryck <strong>Uppdatera sammandraget</strong>.</li>
<li>Hela figurer väljs, och urvalet får vara högst 10 km × 10 km. Prisuppskattningen gäller endast trädbeståndet, inte marken.</li>
<li>Urvalet finns kvar tills du tömmer det eller stänger appen. Det sparas inte.</li>
</ul>
<p>Urvalet är gratis. Prisuppskattningen och åtkomligheten ingår i tillägget för prisuppskattning (samma engångsköp).</p>`
    },
    en: {
        otsikko: 'Select stands',
        html: `<p>The map button <strong>Select stands</strong> builds a selection of individual stands, also across several properties. Use it, for example, to assess part of a property before a purchase.</p>
<ul>
<li>Zoom in so the stands show on the map. Tap a stand to add it and tap again to remove it. While selecting, tapping a property does not open it.</li>
<li><strong>Show summary</strong> opens the same summary as for a property: statistics, stands, proposed fellings, price estimate and accessibility. When the selection changes, tap <strong>Update summary</strong>.</li>
<li>Whole stands are selected, and the selection can be at most 10 km × 10 km. The price estimate covers the trees only, not the land.</li>
<li>The selection is kept until you clear it or close the app. It is not saved.</li>
</ul>
<p>Selecting is free. The price estimate and accessibility belong to the price estimate add-on (same one-time purchase).</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
