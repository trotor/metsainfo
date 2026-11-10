/**
 * Kompassisuunta laitteen suuntatapahtumista. iOS antaa
 * webkitCompassHeadingin (asteet pohjoisesta myötäpäivään); muualla
 * käytetään absoluuttista alphaa, joka kasvaa vastapäivään.
 */

export function headingFromEvent(e) {
    if (typeof e.webkitCompassHeading === 'number') return e.webkitCompassHeading;
    if (e.absolute && typeof e.alpha === 'number') return (360 - e.alpha) % 360;
    return null;
}

export function compassSupported(win = window) {
    return typeof win.DeviceOrientationEvent === 'function';
}

/**
 * iOS vaatii luvan napautuksen yhteydessä. Muualla lupaa ei tarvita.
 */
export async function requestCompassPermission(win = window) {
    if (!compassSupported(win)) return false;
    const request = win.DeviceOrientationEvent.requestPermission;
    if (typeof request !== 'function') return true;
    try {
        return (await request.call(win.DeviceOrientationEvent)) === 'granted';
    } catch {
        return false;
    }
}

export function watchCompass(cb, win = window) {
    const handler = (e) => {
        const heading = headingFromEvent(e);
        if (heading != null) cb(heading);
    };
    win.addEventListener('deviceorientationabsolute', handler);
    win.addEventListener('deviceorientation', handler);
    return () => {
        win.removeEventListener('deviceorientationabsolute', handler);
        win.removeEventListener('deviceorientation', handler);
    };
}
