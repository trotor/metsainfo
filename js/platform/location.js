/**
 * Sijainti: sovelluksessa @capacitor/geolocation (iOS:n oma lupadialogi),
 * verkossa navigator.geolocation. Vain etualan sijainti.
 */

import { Geolocation } from '@capacitor/geolocation';
import { isNative } from './index.js';

const OPTIONS = { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 };

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
    const msg = String(err?.message || err || '').toLowerCase();
    if (msg.includes('denied') || msg.includes('permission')) return 'denied';
    if (msg.includes('timeout')) return 'timeout';
    return 'unavailable';
}

/**
 * Aloittaa sijainnin seurannan. Palauttaa funktion, joka lopettaa sen.
 * onError saa luokan 'denied' | 'unavailable' | 'timeout'.
 */
export async function watchPosition(onPosition, onError) {
    if (isNative()) {
        try {
            const perm = await Geolocation.checkPermissions();
            if (perm.location !== 'granted') {
                const req = await Geolocation.requestPermissions({ permissions: ['location'] });
                if (req.location !== 'granted') {
                    onError('denied');
                    return () => {};
                }
            }
            const id = await Geolocation.watchPosition(OPTIONS, (position, err) => {
                if (err) onError(classifyLocationError(err));
                else if (position) onPosition(normalizePosition(position));
            });
            return () => { Geolocation.clearWatch({ id }); };
        } catch (err) {
            onError(classifyLocationError(err));
            return () => {};
        }
    }

    if (!navigator.geolocation) {
        onError('unavailable');
        return () => {};
    }
    const id = navigator.geolocation.watchPosition(
        position => onPosition(normalizePosition(position)),
        err => onError(classifyLocationError(err)),
        OPTIONS
    );
    return () => navigator.geolocation.clearWatch(id);
}
