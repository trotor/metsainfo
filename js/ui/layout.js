/**
 * Asettelun tunnistus ja kartan täytteet tietopaneelin kanssa
 *
 * Asettelut (#32, #30):
 * - mobiili: kapea näyttö tai mikä tahansa kosketusnäyttö (MOBILE_QUERY)
 * - tabletti: mobiilin tyylit, mutta alapaneelin tilalla sivupaneeli
 *   (TABLET_QUERY, osa mobiilia): iPadit, avattu Duo vaakatasossa
 * - työpöytä: kaikki muu (hiiri, yli 768 px)
 *
 * Kyselyt ovat samat merkkijonot kuin CSS:n mediakyselyissä (style.css ja
 * toimintojen omat CSS-tiedostot; tests/layout.test.js tarkistaa). Pidä ne samoina.
 */

export const MOBILE_QUERY = '(max-width: 768px), (pointer: coarse)';
export const TABLET_QUERY = '(pointer: coarse) and (min-width: 700px) and (min-height: 501px)';
/** Leveä kosketusnäyttö alle tablettirajan (Duo avattuna pystyssä): alapaneeli rajataan */
export const MOBILE_WIDE_QUERY = '(pointer: coarse) and (min-width: 600px) and (max-width: 699px) and (min-height: 501px)';

const matches = (win, query) => Boolean(win && typeof win.matchMedia === 'function' && win.matchMedia(query).matches);

export function isMobileLayout(win = window) {
    return matches(win, MOBILE_QUERY);
}

export function isTabletLayout(win = window) {
    return matches(win, TABLET_QUERY);
}

/** cb(mobile, tablet) kutsutaan, kun mobiili- tai tablettiasettelu vaihtuu. */
export function onLayoutChange(cb, win = window) {
    if (!win || typeof win.matchMedia !== 'function') return () => {};
    const mqls = [MOBILE_QUERY, TABLET_QUERY].map(q => win.matchMedia(q));
    const handler = () => cb(isMobileLayout(win), isTabletLayout(win));
    mqls.forEach(m => m.addEventListener('change', handler));
    return () => mqls.forEach(m => m.removeEventListener('change', handler));
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
 * tietopaneelin väliin, tabletissa sivupaneelin oikealle puolelle (auki)
 * tai pienennetyn paneelin alle, työpöydällä täyte on ennallaan
 */
export function fitPadding({ mobile, tablet = false, sheetHeight = 0, topInset, open, panelRight = 0, collapsedBottom = 0 }) {
    if (!mobile) return { padding: [50, 50] };
    if (tablet) {
        let topLeft = [16, topInset + 16];
        if (open === true) topLeft = [panelRight + 16, topInset + 16];
        else if (open === false) topLeft = [16, Math.max(collapsedBottom, topInset) + 16];
        return { paddingTopLeft: topLeft, paddingBottomRight: [16, 16] };
    }
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

/**
 * Tabletin vastine: auki oleva sivupaneeli peittää vasemman reunan, joten
 * keskipiste siirtyy oikealle (ja hakupalkin verran alas)
 */
export function tabletCenterOffset(panelRight, topInset) {
    return [0 - Math.round(panelRight / 2), 0 - Math.round(topInset / 2)];
}

/**
 * Mahtuuko kohde (näyttökoordinaatit { left, top, right, bottom }) näkyvälle
 * alueelle, kun reunoilta varataan fitPaddingin täytteet
 */
export function fitsVisibleArea(box, size, pad) {
    const [l, t] = pad.paddingTopLeft || pad.padding || [0, 0];
    const [r, b] = pad.paddingBottomRight || pad.padding || [0, 0];
    return box.left >= l && box.top >= t && box.right <= size.x - r && box.bottom <= size.y - b;
}
