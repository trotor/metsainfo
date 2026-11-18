/** Latvusmallin tekstit suomeksi, ruotsiksi ja englanniksi. */
import { pick } from '../i18n.js';

export const TEKSTIT = {
    fi: { taustakartta: 'Puuston korkeus (latvusmalli)' },
    sv: { taustakartta: 'Trädhöjd (laserskanning)' },
    en: { taustakartta: 'Tree height (canopy model)' }
};
// Käyttöohjeen osio (js/ui/ohje-osiot.js); {selite} korvataan liukuvärillä
const OHJE = {
    fi: {
        otsikko: 'Puuston korkeus',
        html: `<p>Tasovalitsimesta saa taustakartaksi <strong>Puuston korkeus (latvusmalli)</strong>. Se näyttää laserkeilauksesta mitatun puuston korkeuden: aukot, taimikot ja järeät kuviot erottuvat, myös kuvion sisällä. Taso näkyy, kun karttaa on lähennetty.</p>
{selite}<div class="lm-asteikko"><span>alle 5 m</span><span>12 m</span><span>yli 25 m</span></div>
<p>Siellä, missä näkyy pelkkä taustakartta, ei ole puustoa (alle puoli metriä). Kuvioiden värin saa läpikuultavaksi tasovalitsimen säätimellä. Latvusmalli on uusimmasta saatavilla olevasta keilauksesta, joten tuoreet hakkuut eivät välttämättä näy.</p>
<p>Latvusmalli: © Suomen metsäkeskus. Maksuton.</p>`
    },
    sv: {
        otsikko: 'Trädhöjd',
        html: `<p>I lagerväljaren kan du välja <strong>Trädhöjd (laserskanning)</strong> som bakgrundskarta. Den visar trädbeståndets höjd mätt med laserskanning: kalhyggen, plantskog och grova figurer syns, även inne i en figur. Lagret syns när kartan är inzoomad.</p>
{selite}<div class="lm-asteikko"><span>under 5 m</span><span>12 m</span><span>över 25 m</span></div>
<p>Där bara bakgrundskartan syns finns inga träd (under en halv meter). Figurernas färg kan göras genomskinlig med reglaget i lagerväljaren. Modellen bygger på den senaste tillgängliga skanningen, så nya avverkningar syns inte nödvändigtvis.</p>
<p>Trädhöjdsmodell: © Finlands skogscentral. Avgiftsfri.</p>`
    },
    en: {
        otsikko: 'Tree height',
        html: `<p>In the layer selector you can choose <strong>Tree height (canopy model)</strong> as the background map. It shows tree height measured by laser scanning: clearings, young stands and mature stands stand out, also within a stand. The layer appears when the map is zoomed in.</p>
{selite}<div class="lm-asteikko"><span>under 5 m</span><span>12 m</span><span>over 25 m</span></div>
<p>Where only the background map shows, there are no trees (under half a metre). The stand colours can be made see-through with the slider in the layer selector. The model is from the latest available scan, so recent cuttings may not show.</p>
<p>Canopy height model: © Finnish Forest Centre. Free of charge.</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
