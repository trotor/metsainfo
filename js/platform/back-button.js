/**
 * Androidin takaisin-painike (App-plugin). handler palauttaa false, kun
 * sovelluksesta poistutaan. iOS:llä tapahtumaa ei ole.
 */

import { App } from '@capacitor/app';

export function onBackButton(handler) {
    App.addListener('backButton', () => {
        if (!handler()) App.exitApp();
    });
}
