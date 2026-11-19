/** Korkeusmallin tekstit suomeksi, ruotsiksi ja englanniksi (#23). */
import { pick } from '../i18n.js';

export const TEKSTIT = {
    fi: {
        taustakartta: 'Maastonmuodot (laserkeilaus)',
        varjoste: 'Rinnevarjoste'
    },
    sv: {
        taustakartta: 'Terrängformer (laserskanning)',
        varjoste: 'Terrängskuggning'
    },
    en: {
        taustakartta: 'Terrain (laser scanning)',
        varjoste: 'Hillshade'
    }
};
// Käyttöohjeen osio (js/ui/ohje-osiot.js)
const OHJE = {
    fi: {
        otsikko: "Maastonmuodot",
        html: `<p>Tasovalitsimesta saa taustakartaksi <strong>Maastonmuodot (laserkeilaus)</strong> tai peruskartan päälle <strong>Rinnevarjosteen</strong>. Ne näyttävät laserkeilauksesta tehdystä korkeusmallista maaston muodot: rinteet, ojat, kivikot, harjut ja vanhat tiepohjat.</p>
<p>Korkeusmalli: Geologian tutkimuskeskus (GTK), aineisto © Maanmittauslaitos. Maksuton.</p>`
    },
    sv: {
        otsikko: "Terrängformer",
        html: `<p>I lagerväljaren kan du välja <strong>Terrängformer (laserskanning)</strong> som bakgrundskarta eller lägga <strong>Terrängskuggning</strong> ovanpå grundkartan. De visar terrängens former från en höjdmodell gjord med laserskanning: sluttningar, diken, stenfält, åsar och gamla vägbankar.</p>
<p>Höjdmodell: Geologiska forskningscentralen (GTK), data © Lantmäteriverket. Avgiftsfri.</p>`
    },
    en: {
        otsikko: "Terrain",
        html: `<p>In the layer selector you can choose <strong>Terrain (laser scanning)</strong> as the background map or add <strong>Hillshade</strong> on top of the base map. They show the shape of the ground from a laser-scanned elevation model: slopes, ditches, boulder fields, eskers and old road beds.</p>
<p>Elevation model: Geological Survey of Finland (GTK), data © National Land Survey of Finland. Free of charge.</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
