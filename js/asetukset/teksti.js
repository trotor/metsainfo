/** Asetusten tekstit suomeksi ja englanniksi (#24). */
import { pick } from '../i18n.js';

export const TEKSTIT = {
    fi: {
        nappi: 'Asetukset',
        otsikko: 'Asetukset',
        sulje: 'Sulje',
        kokeilu: 'Kokeilu · vain testiversiossa',
        kieli: 'Kieli · Language',
        laite: 'Laitteen kieli',
        kattavuus: 'Englanniksi on toistaiseksi käännetty vain kokeilutoiminnot (maastotila, lähihaku, suosikit, korkeusmalli). Muu sovellus, termien selitykset ja ostonäkymä ovat suomeksi.',
        epavirallinen: 'Englanninkieliset puulajien ja koodiston nimet ovat epävirallisia käännöksiä.',
        vainLaitteella: 'Asetukset tallentuvat vain tälle laitteelle.'
    },
    en: {
        nappi: 'Settings',
        otsikko: 'Settings',
        sulje: 'Close',
        kokeilu: 'Trial · test version only',
        kieli: 'Language · Kieli',
        laite: 'Device language',
        kattavuus: 'So far only the trial features are in English (field mode, nearby search, favourites, terrain map). The rest of the app, term explanations and the purchase screen are in Finnish.',
        epavirallinen: 'English names of tree species and other codes are unofficial translations.',
        vainLaitteella: 'Settings are saved on this device only.'
    }
};
export const T = pick(TEKSTIT);

/** Kielten nimet omalla kielellään, jotta ne löytyvät kielestä riippumatta. */
export const KIELTEN_NIMET = { fi: 'Suomi', en: 'English' };
