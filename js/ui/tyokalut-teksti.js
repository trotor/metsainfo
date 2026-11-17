/**
 * Työkalujen, valikon ja väritysten rekisterin tekstit (js/ui/tyokalut.js).
 */

import { pick } from '../i18n.js';

export const TEKSTIT = {
    fi: {
        tyokalut: 'Työkalut',
        valikko: 'Valikko',
        ohje: 'Käyttöohje',
        kiinnita: 'Kiinnitä auki',
        irrota: 'Irrota',
        sulje: 'Sulje',
        lisaosa: 'Lisäosa',
        lopeta: 'Lopeta',
        ohjeOsio: {
            otsikko: 'Työkalut ja valikko',
            johdanto: 'Kartan <strong>Työkalut</strong>-painike avaa listan työkaluista. Päällä olevan työkalun nimi näkyy kartan yläreunassa, kun sen kortti on piilossa. Suosikit, asetukset ja käyttöohje ovat valikossa ☰. Työpöydällä listan voi kiinnittää auki.',
            tyokalut: 'Työkalut',
            valikko: 'Valikko ☰',
            varitys: 'Väritys (värivalitsin kartan alareunassa)'
        }
    },
    sv: {
        tyokalut: 'Verktyg',
        valikko: 'Meny',
        ohje: 'Bruksanvisning',
        kiinnita: 'Fäst öppen',
        irrota: 'Lossa',
        sulje: 'Stäng',
        lisaosa: 'Tillägg',
        lopeta: 'Avsluta',
        ohjeOsio: {
            otsikko: 'Verktyg och meny',
            johdanto: 'Kartknappen <strong>Verktyg</strong> öppnar en lista över verktygen. Namnet på ett aktivt verktyg visas överst på kartan när dess kort är dolt. Favoriter, inställningar och bruksanvisningen finns i menyn ☰. På datorn kan listan fästas öppen.',
            tyokalut: 'Verktyg',
            valikko: 'Meny ☰',
            varitys: 'Färgläggning (färgväljaren nertill på kartan)'
        }
    },
    en: {
        tyokalut: 'Tools',
        valikko: 'Menu',
        ohje: 'User guide',
        kiinnita: 'Pin open',
        irrota: 'Unpin',
        sulje: 'Close',
        lisaosa: 'Add-on',
        lopeta: 'Stop',
        ohjeOsio: {
            otsikko: 'Tools and menu',
            johdanto: 'The map button <strong>Tools</strong> opens a list of tools. The name of an active tool is shown at the top of the map while its card is hidden. Favourites, settings and the user guide are in the menu ☰. On a computer the list can be pinned open.',
            tyokalut: 'Tools',
            valikko: 'Menu ☰',
            varitys: 'Colouring (colour selector at the bottom of the map)'
        }
    }
};

export const T = pick(TEKSTIT);
