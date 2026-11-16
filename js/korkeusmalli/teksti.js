/** Korkeusmallin tekstit suomeksi ja englanniksi (#24). */
import { pick } from '../i18n.js';

export const TEKSTIT = {
    fi: {
        taustakartta: 'Maastonmuodot (laserkeilaus)',
        varjoste: 'Rinnevarjoste (kokeilu)'
    },
    en: {
        taustakartta: 'Terrain (laser scanning)',
        varjoste: 'Hillshade (trial)'
    }
};
export const T = pick(TEKSTIT);
