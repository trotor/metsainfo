/** Asetusten tekstit suomeksi, ruotsiksi ja englanniksi (#24). */
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
        vainLaitteella: 'Asetukset tallentuvat vain tälle laitteelle.'
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
        vainLaitteella: 'Inställningarna sparas endast på den här enheten.'
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
        vainLaitteella: 'Settings are saved on this device only.'
    }
};
export const T = pick(TEKSTIT);

/** Kielten nimet omalla kielellään, jotta ne löytyvät kielestä riippumatta. */
export const KIELTEN_NIMET = { fi: 'Suomi', sv: 'Svenska', en: 'English' };
