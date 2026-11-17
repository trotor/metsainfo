/**
 * Puuston arvo -värityksen tekstit suomeksi, ruotsiksi ja englanniksi (#34).
 */

import { pick } from '../i18n.js';

const fi = {
    variTila: 'Puuston arvo (€/ha)',
    selite: 'Puuston arvo, €/ha',
    luokat: ['alle 2 000', '2 000–5 000', '5 000–8 000', '8 000–12 000', 'yli 12 000'],
    haetaan: 'Haetaan kantohintoja…',
    virhe: 'Kantohintoja ei saatu haettua.',
    valitseKiinteisto: 'Valitse ensin kiinteistö, niin sen kuviot väritetään puuston arvon mukaan.',
    kuvionArvo: 'Puuston arvo',
    arvo: (total, perHa) => `noin ${total} € (${perHa} €/ha)`,
    hinnat: (alue, jakso) => `Uudistushakkuun kantohinnat: ${alue}${jakso ? `, ${jakso}` : ''}.`
};

const sv = {
    variTila: 'Trädbeståndets värde (€/ha)',
    selite: 'Trädbeståndets värde, €/ha',
    luokat: ['under 2 000', '2 000–5 000', '5 000–8 000', '8 000–12 000', 'över 12 000'],
    haetaan: 'Rotpriser hämtas…',
    virhe: 'Rotpriserna kunde inte hämtas.',
    valitseKiinteisto: 'Välj först en fastighet, så färgläggs dess figurer efter trädbeståndets värde.',
    kuvionArvo: 'Trädbeståndets värde',
    arvo: (total, perHa) => `cirka ${total} € (${perHa} €/ha)`,
    hinnat: (alue, jakso) => `Rotpriser för förnyelseavverkning: ${alue}${jakso ? `, ${jakso}` : ''}.`
};

const en = {
    variTila: 'Timber value (€/ha)',
    selite: 'Timber value, €/ha',
    luokat: ['under 2,000', '2,000–5,000', '5,000–8,000', '8,000–12,000', 'over 12,000'],
    haetaan: 'Fetching stumpage prices…',
    virhe: 'Stumpage prices could not be fetched.',
    valitseKiinteisto: 'First select a property, and its stands are coloured by timber value.',
    kuvionArvo: 'Timber value',
    arvo: (total, perHa) => `about ${total} € (${perHa} €/ha)`,
    hinnat: (alue, jakso) => `Regeneration felling stumpage prices: ${alue}${jakso ? `, ${jakso}` : ''}.`
};

export const TEKSTIT = { fi, sv, en };

const OHJE = {
    fi: {
        otsikko: 'Puuston arvo kartalla',
        html: `<p>Väritys-valitsimen vaihtoehto <strong>Puuston arvo (€/ha)</strong> värittää kuviot puuston arvon mukaan euroina hehtaarilta: vaaleasta (alle 2 000 €/ha, esimerkiksi taimikko) tummanruskeaan (yli 12 000 €/ha, esimerkiksi järeä uudistuskypsä kuusikko).</p>
<p>Arvo lasketaan samoin kuin hinta-arvion koko puuston arvo: alueen tuoreilla uudistushakkuun kantohinnoilla ja omilla hinnoillasi, jos olet syöttänyt niitä. Kuvion tiedoissa näkyy kuvion arvo euroina. Väritys kuuluu hinta-arvion lisäosaan (sama kertaosto).</p>`
    },
    sv: {
        otsikko: 'Trädbeståndets värde på kartan',
        html: `<p>Alternativet <strong>Trädbeståndets värde (€/ha)</strong> i färgväljaren färglägger figurerna efter trädbeståndets värde i euro per hektar: från ljust (under 2 000 €/ha, till exempel plantbestånd) till mörkbrunt (över 12 000 €/ha, till exempel grov förnyelsemogen granskog).</p>
<p>Värdet beräknas som hela trädbeståndets värde i prisuppskattningen: med områdets färska rotpriser för förnyelseavverkning och dina egna priser, om du har angett sådana. Figurens uppgifter visar figurens värde i euro. Färgläggningen ingår i tillägget för prisuppskattning (samma engångsköp).</p>`
    },
    en: {
        otsikko: 'Timber value on the map',
        html: `<p>The colour selector option <strong>Timber value (€/ha)</strong> colours the stands by timber value in euros per hectare: from light (under 2,000 €/ha, for example a seedling stand) to dark brown (over 12,000 €/ha, for example a mature spruce stand ready for regeneration).</p>
<p>The value is calculated like the whole stock value in the price estimate: with recent regeneration felling stumpage prices for the area and your own prices, if you have entered any. The stand details show the stand value in euros. The colouring belongs to the price estimate add-on (same one-time purchase).</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
