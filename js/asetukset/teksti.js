/** Asetusten tekstit suomeksi, ruotsiksi ja englanniksi (#23). */
import { pick } from '../i18n.js';

export const TEKSTIT = {
    fi: {
        nappi: 'Asetukset',
        otsikko: 'Asetukset',
        sulje: 'Sulje',
        kokeilu: 'Kokeilu · vain testiversiossa',
        kieli: 'Kieli · Language',
        laite: 'Laitteen kieli',
        kattavuus: 'Kielivalinta on kokeilu. Suomeksi jäävät vielä tietosuojaseloste, kaupan ostodialogi sekä hintojen lähde ja viikko.',
        epavirallinen: 'Englanninkieliset puulajien ja koodiston nimet ovat epävirallisia käännöksiä.',
        vainLaitteella: 'Asetukset tallentuvat vain tälle laitteelle.',
        esittely: 'Näytä esittely uudelleen'
    },
    sv: {
        nappi: 'Inställningar',
        otsikko: 'Inställningar',
        sulje: 'Stäng',
        kokeilu: 'Försöksfunktion · endast i testversionen',
        kieli: 'Språk · Kieli',
        laite: 'Enhetens språk',
        kattavuus: 'Språkvalet är ett försök. Fortfarande på finska: integritetspolicyn, butikens köpdialog samt prisernas källa och vecka.',
        epavirallinen: 'De flesta svenska namnen på trädslag och koder kommer från de officiella kodlistorna i Metsärekisteri, men en del är inofficiella översättningar.',
        vainLaitteella: 'Inställningarna sparas endast på den här enheten.',
        esittely: 'Visa introduktionen igen'
    },
    en: {
        nappi: 'Settings',
        otsikko: 'Settings',
        sulje: 'Close',
        kokeilu: 'Trial · test version only',
        kieli: 'Language · Kieli',
        laite: 'Device language',
        kattavuus: 'Language choice is a trial. Still in Finnish: the privacy policy, the store purchase dialog, and the price source and week.',
        epavirallinen: 'English names of tree species and other codes are unofficial translations.',
        vainLaitteella: 'Settings are saved on this device only.',
        esittely: 'Show the introduction again'
    }
};
// Käyttöohjeen osio (js/ui/ohje-osiot.js)
const OHJE = {
    fi: {
        otsikko: "Asetukset ja kieli",
        html: `<p>Karttapainike <strong>Asetukset</strong> (ratas) avaa asetukset. Kieleksi voi valita suomen, ruotsin, englannin tai laitteen kielen. Sovellus latautuu uudelleen valitulla kielellä.</p>
<p>Osa ruotsin- ja englanninkielisistä puulajien ja koodien nimistä on epävirallisia käännöksiä. Asetukset tallentuvat vain tälle laitteelle. Maksuton.</p>`
    },
    sv: {
        otsikko: "Inställningar och språk",
        html: `<p>Kartknappen <strong>Inställningar</strong> (kugghjulet) öppnar inställningarna. Som språk kan du välja finska, svenska, engelska eller enhetens språk. Appen laddas om på det valda språket.</p>
<p>En del svenska och engelska namn på trädslag och koder är inofficiella översättningar. Inställningarna sparas bara på den här enheten. Avgiftsfri.</p>`
    },
    en: {
        otsikko: "Settings and language",
        html: `<p>The map button <strong>Settings</strong> (gear) opens the settings. You can choose Finnish, Swedish, English or the device language. The app reloads in the chosen language.</p>
<p>Some Swedish and English names of tree species and codes are unofficial translations. Settings are saved on this device only. Free of charge.</p>`
    }
};
for (const lang of Object.keys(OHJE)) TEKSTIT[lang].ohjeOsio = OHJE[lang];

export const T = pick(TEKSTIT);

/** Kielten nimet omalla kielellään, jotta ne löytyvät kielestä riippumatta. */
export const KIELTEN_NIMET = { fi: 'Suomi', sv: 'Svenska', en: 'English' };
