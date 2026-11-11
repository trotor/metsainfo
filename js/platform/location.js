/**
 * Sijainti: sovelluksessa @capacitor/geolocation (iOS:n oma lupadialogi),
 * verkossa navigator.geolocation. Vain etualan sijainti.
 *
 * onError(kind, { fatal }) saa luokan 'denied' | 'off' | 'unavailable' |
 * 'timeout'. fatal = seuranta ei ole käynnissä (lupa evätty, palvelut pois,
 * tai käynnistys epäonnistui).
 */

import { Geolocation } from '@capacitor/geolocation';
import { isNative } from './index.js';

const WEB_OPTIONS = { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 };
// Natiivi plugin lopettaa seurannan aikakatkaisussa, joten aikaraja on
// pitkä ja seuranta käynnistetään uudelleen katkaisun jälkeen. Android
// käyttäisi aikakatkaisua myös päivitysvälinä, joten väli annetaan erikseen
// (iOS ei käytä interval-kenttiä).
const NATIVE_OPTIONS = {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 60000,
    interval: 2000,
    minimumUpdateInterval: 1000
};

export function normalizePosition(raw) {
    const c = raw.coords;
    const heading = Number.isFinite(c.heading) ? c.heading : null;
    return { lat: c.latitude, lon: c.longitude, accuracy: c.accuracy, heading, timestamp: raw.timestamp };
}

export function classifyLocationError(err) {
    if (err && typeof err.code === 'number') {
        if (err.code === 1) return 'denied';
        if (err.code === 3) return 'timeout';
        return 'unavailable';
    }
    const code = String(err?.code || '');
    const msg = String(err?.message || err || '').toLowerCase();
    if (code.endsWith('0007') || code.endsWith('0008') || msg.includes('not enabled') || msg.includes('restricted')) return 'off';
    if (code.endsWith('0003') || msg.includes('denied') || msg.includes('permission')) return 'denied';
    if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout';
    return 'unavailable';
}

/**
 * Natiivi seuranta injektoitavalla pluginilla (testattavissa). Palauttaa
 * lopetusfunktion; käynnistyksen virhe raportoidaan fatal-lipulla.
 */
export async function createNativeWatch(geo, onPosition, onError) {
    try {
        const perm = await geo.checkPermissions();
        if (perm.location !== 'granted') {
            const req = await geo.requestPermissions({ permissions: ['location'] });
            if (req.location !== 'granted') {
                onError('denied', { fatal: true });
                return () => {};
            }
        }
    } catch (err) {
        const kind = classifyLocationError(err);
        onError(kind === 'timeout' ? 'unavailable' : kind, { fatal: true });
        return () => {};
    }

    let currentId = null;
    let stopped = false;

    const begin = async () => {
        const id = await geo.watchPosition(NATIVE_OPTIONS, (position, err) => {
            if (err) {
                const kind = classifyLocationError(err);
                const fatal = kind === 'denied' || kind === 'off';
                onError(kind, { fatal });
                if (kind === 'timeout' && !stopped) {
                    geo.clearWatch({ id });
                    begin();
                }
            } else if (position) {
                onPosition(normalizePosition(position));
            }
        });
        if (stopped) {
            geo.clearWatch({ id });
            return;
        }
        currentId = id;
    };

    try {
        await begin();
    } catch (err) {
        onError(classifyLocationError(err), { fatal: true });
        return () => {};
    }

    return () => {
        stopped = true;
        if (currentId) geo.clearWatch({ id: currentId });
    };
}

/**
 * Aloittaa sijainnin seurannan. Palauttaa funktion, joka lopettaa sen.
 */
export async function watchPosition(onPosition, onError) {
    if (isNative()) {
        return createNativeWatch(Geolocation, onPosition, onError);
    }

    if (!navigator.geolocation) {
        onError('unavailable', { fatal: true });
        return () => {};
    }
    const id = navigator.geolocation.watchPosition(
        position => onPosition(normalizePosition(position)),
        err => {
            const kind = classifyLocationError(err);
            onError(kind, { fatal: kind === 'denied' });
        },
        WEB_OPTIONS
    );
    return () => navigator.geolocation.clearWatch(id);
}
