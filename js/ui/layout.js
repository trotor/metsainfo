/**
 * Asettelun tunnistus ja kartan täytteet mobiilin tietopaneelin kanssa
 *
 * MOBILE_QUERY on sama merkkijono kuin style.css:n mobiilikyselyssä.
 * Pidä ne samoina.
 */

export const MOBILE_QUERY = '(max-width: 768px), (max-height: 500px) and (pointer: coarse)';

export function isMobileLayout(win = window) {
    if (!win || typeof win.matchMedia !== 'function') return false;
    return win.matchMedia(MOBILE_QUERY).matches;
}

export function onLayoutChange(cb, win = window) {
    if (!win || typeof win.matchMedia !== 'function') return () => {};
    const mql = win.matchMedia(MOBILE_QUERY);
    const handler = (e) => cb(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
}

/**
 * Hakupalkin alareuna pikseleinä näkymän yläreunasta
 */
export function topInset(doc = document) {
    const el = doc.getElementById('search-control');
    if (!el) return 0;
    return Math.round(el.getBoundingClientRect().bottom);
}

/**
 * Leafletin fitBounds-täytteet: mobiilissa kohde jää hakupalkin ja
 * tietopaneelin väliin, työpöydällä täyte on ennallaan
 */
export function fitPadding({ mobile, sheetHeight, topInset }) {
    if (!mobile) return { padding: [50, 50] };
    return {
        paddingTopLeft: [16, topInset + 16],
        paddingBottomRight: [16, sheetHeight + 16]
    };
}

/**
 * Siirtymä, jolla kartan keskipiste osuu näkyvän alueen keskelle
 */
export function visibleCenterOffset(sheetHeight, topInset) {
    return [0, Math.round((sheetHeight - topInset) / 2)];
}
