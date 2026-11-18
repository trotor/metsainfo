/** Läpinäkyvyyssäätimen tekstit suomeksi, ruotsiksi ja englanniksi (#23). */
import { pick } from '../i18n.js';

export const TEKSTIT = {
    fi: {
        otsikko: 'Kuvioiden läpinäkyvyys',
        kuvaus: 'Kuvioiden värit läpinäkyvämmiksi, jotta ilmakuva tai kartta näkyy alta'
    },
    sv: {
        otsikko: 'Figurernas genomskinlighet',
        kuvaus: 'Gör figurernas färger mer genomskinliga så att flygbilden eller kartan syns under'
    },
    en: {
        otsikko: 'Stand colour transparency',
        kuvaus: 'Make the stand colours more transparent so the aerial photo or map shows through'
    }
};
// Käyttöohjeen osio (js/ui/ohje-osiot.js)
const OHJE = {
    fi: {
        otsikko: 'Kuvioiden läpinäkyvyys',
        html: `<p>Tasovalitsimen alareunan liukusäätimellä kuvioiden värit saa läpinäkyvämmiksi. Silloin <strong>ilmakuva</strong> tai kartta näkyy kuvioiden alta, ja metsän voi verrata kuvioiden tietoihin.</p>
<p>Säätö koskee kuvioiden väritystä sekä puuston arvon ja saavutettavuuden värejä. Kuvioiden rajat ja valinnat pysyvät näkyvinä. Valinta tallentuu vain tälle laitteelle. Maksuton.</p>`
    },
    sv: {
        otsikko: 'Figurernas genomskinlighet',
        html: `<p>Med reglaget längst ner i lagerväljaren blir figurernas färger mer genomskinliga. Då syns <strong>flygbilden</strong> eller kartan under figurerna, och du kan jämföra skogen med figurernas uppgifter.</p>
<p>Inställningen gäller figurernas färgläggning samt färgerna för virkesvärde och tillgänglighet. Figurernas gränser och val syns fortfarande. Valet sparas bara på den här enheten. Avgiftsfri.</p>`
    },
    en: {
        otsikko: 'Stand colour transparency',
        html: `<p>The slider at the bottom of the layer selector makes the stand colours more transparent. The <strong>aerial photo</strong> or map then shows through the stands, so you can compare the forest with the stand data.</p>
<p>It applies to the stand colouring and to the timber value and accessibility colours. Stand borders and selections stay visible. The setting is saved on this device only. Free of charge.</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);
