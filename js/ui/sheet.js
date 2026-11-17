/**
 * Mobiilin tietopaneeli (bottom sheet): pysäytyskohdat ja tila
 *
 * Paneeli on sama #info-panel kuin työpöydällä. Mobiilissa sen korkeutta
 * ohjaavat data-snap ja CSS-muuttuja --sheet-height. --sheet-offset
 * (documentElement) kertoo, paljonko paneeli peittää näkymän alareunasta,
 * jotta värinauha ja Leafletin alakontrollit voivat asettua sen yläpuolelle.
 */

import { isMobileLayout, isTabletLayout, topInset } from './layout.js';

export const PEEK_HEIGHT = 140;
/** Tabletin pienennetty paneeli: kurkistusrivi ilman vetokahvaa (oletus, jos riviä ei voi mitata) */
export const TABLET_PEEK_HEIGHT = 96;
const TABLET_GAP = 8;
export const TAP_THRESHOLD = 6;
export const FLING_MS = 150;

const SNAPS = ['peek', 'half', 'full'];

export function computeSnapHeights(viewportHeight, topInsetPx, safeBottom = 0, peekExtra = 0) {
    const peek = PEEK_HEIGHT + safeBottom + peekExtra;
    const half = Math.max(Math.round(viewportHeight * 0.5), peek);
    const full = Math.max(viewportHeight - topInsetPx, half);
    return { peek, half, full };
}

/**
 * Tabletin sivupaneeli (#32): yläreuna hakupalkin alla, auki koko korkeudelta
 * (half = full), pienennettynä vain kurkistusrivi
 */
export function computeTabletHeights(viewportHeight, panelTop, safeBottom = 0, peekExtra = 0, peekRow = TABLET_PEEK_HEIGHT) {
    const peek = (peekRow || TABLET_PEEK_HEIGHT) + peekExtra;
    const full = Math.max(viewportHeight - panelTop - TABLET_GAP - safeBottom, peek);
    return { peek, half: full, full };
}

/**
 * Tulkitsee vedon päättymisen: napautus tai lähin pysäytyskohta, kun
 * nopeus heijastetaan FLING_MS eteenpäin
 */
export function resolveRelease(startHeight, dy, velocityY, heights) {
    if (Math.abs(dy) < TAP_THRESHOLD) return 'tap';
    const projected = startHeight - dy - velocityY * FLING_MS;
    let best = SNAPS[0];
    for (const snap of SNAPS) {
        if (Math.abs(heights[snap] - projected) < Math.abs(heights[best] - projected)) best = snap;
    }
    return best;
}

export function nextSnapOnTap(snap) {
    const i = SNAPS.indexOf(snap);
    return SNAPS[(i + 1) % SNAPS.length];
}

/**
 * Paneelin korkeus kartan sovitusta varten. Full-tilassa kartasta näkyisi
 * vain kaistale, joten sovitus tehdään enintään half-korkeudelle. Uusi
 * valinta avautuu peek-tilaan, joten sille käytetään peek-korkeutta.
 */
export function sheetHeightForFit(heights, snap, hidden, newSelection = false) {
    if (hidden || newSelection) return heights.peek;
    return Math.min(heights[snap], heights.half);
}

export function readSafeBottom(doc = document) {
    const probe = doc.getElementById('safe-area-probe');
    if (!probe) return 0;
    return probe.getBoundingClientRect().height || 0;
}

export function createSheet(panelEl, { win = window, doc = document, onChange, safeBottom = () => readSafeBottom(doc) } = {}) {
    let snap = 'peek';
    let peekExtra = 0;
    let tablet = false;
    let panelTop = 0;
    let heights;
    const root = doc.documentElement;

    const isHidden = () => panelEl.classList.contains('hidden');

    function clearInline() {
        delete panelEl.dataset.snap;
        panelEl.style.removeProperty('--sheet-height');
        root.style.removeProperty('--sheet-offset');
        root.style.removeProperty('--sheet-top');
    }

    function apply() {
        if (!isMobileLayout(win)) {
            clearInline();
            return;
        }
        const h = heights[snap];
        panelEl.dataset.snap = snap;
        panelEl.style.setProperty('--sheet-height', `${h}px`);
        if (tablet) {
            // Sivupaneeli ei peitä alareunaa: alakontrollit ja värinauha pysyvät alhaalla
            root.style.setProperty('--sheet-offset', '0px');
            root.style.setProperty('--sheet-top', `${panelTop}px`);
        } else {
            root.style.setProperty('--sheet-offset', isHidden() ? '0px' : `${h}px`);
            root.style.removeProperty('--sheet-top');
        }
    }

    function recompute() {
        tablet = isTabletLayout(win);
        const top = topInset(doc);
        if (tablet) {
            panelTop = top + TABLET_GAP;
            // Kurkistusrivin korkeus vaihtelee paneelin leveyden mukaan (luvut voivat rivittyä)
            const peekRow = doc.getElementById('sheet-peek')?.offsetHeight;
            heights = computeTabletHeights(win.innerHeight, panelTop, safeBottom(), peekExtra, peekRow);
            if (snap === 'half') snap = 'full';
        } else {
            heights = computeSnapHeights(win.innerHeight, top, safeBottom(), peekExtra);
        }
        apply();
    }

    recompute();

    return {
        setSnap(name) {
            if (!SNAPS.includes(name)) return;
            // Tabletissa ei ole puolikasta: paneeli on auki tai pienennetty
            snap = tablet && name === 'half' ? 'full' : name;
            if (tablet && snap === 'peek') recompute();
            else apply();
            onChange?.(snap);
        },
        isTablet: () => tablet,
        /** Pienennetyn tablettipaneelin alareuna (kartan sovitus) */
        collapsedBottom: () => panelTop + heights.peek,
        getSnap: () => snap,
        getHeights: () => heights,
        targetHeight: () => (isHidden() ? heights.peek : heights[snap]),
        fitHeight: ({ newSelection = false } = {}) => sheetHeightForFit(heights, snap, isHidden(), newSelection),
        /** Vedon aikainen korkeus ilman pysäytyskohtaa */
        setDragHeight(px) {
            const h = Math.min(Math.max(px, heights.peek), heights.full);
            panelEl.style.setProperty('--sheet-height', `${h}px`);
            root.style.setProperty('--sheet-offset', `${h}px`);
        },
        /** Päivittää --sheet-offsetin, kun paneeli piilotetaan tai näytetään */
        refresh: apply,
        /** Lisäkorkeus peek-tilaan, esim. "Olet kuviolla" -riville */
        setPeekExtra(px) {
            if (px === peekExtra) return;
            peekExtra = px;
            recompute();
        },
        recompute,
        destroy: clearInline
    };
}
