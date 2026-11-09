/**
 * Mobiilin tietopaneeli (bottom sheet): pysäytyskohdat ja tila
 *
 * Paneeli on sama #info-panel kuin työpöydällä. Mobiilissa sen korkeutta
 * ohjaavat data-snap ja CSS-muuttuja --sheet-height. --sheet-offset
 * (documentElement) kertoo, paljonko paneeli peittää näkymän alareunasta,
 * jotta värinauha ja Leafletin alakontrollit voivat asettua sen yläpuolelle.
 */

import { isMobileLayout, topInset } from './layout.js';

export const PEEK_HEIGHT = 140;
export const TAP_THRESHOLD = 6;
export const FLING_MS = 150;

const SNAPS = ['peek', 'half', 'full'];

export function computeSnapHeights(viewportHeight, topInsetPx, safeBottom = 0) {
    const peek = PEEK_HEIGHT + safeBottom;
    const half = Math.max(Math.round(viewportHeight * 0.5), peek);
    const full = Math.max(viewportHeight - topInsetPx, half);
    return { peek, half, full };
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
    let heights = computeSnapHeights(win.innerHeight, topInset(doc), safeBottom());
    const root = doc.documentElement;

    const isHidden = () => panelEl.classList.contains('hidden');

    function clearInline() {
        delete panelEl.dataset.snap;
        panelEl.style.removeProperty('--sheet-height');
        root.style.removeProperty('--sheet-offset');
    }

    function apply() {
        if (!isMobileLayout(win)) {
            clearInline();
            return;
        }
        const h = heights[snap];
        panelEl.dataset.snap = snap;
        panelEl.style.setProperty('--sheet-height', `${h}px`);
        root.style.setProperty('--sheet-offset', isHidden() ? '0px' : `${h}px`);
    }

    function recompute() {
        heights = computeSnapHeights(win.innerHeight, topInset(doc), safeBottom());
        apply();
    }

    return {
        setSnap(name) {
            if (!SNAPS.includes(name)) return;
            snap = name;
            apply();
            onChange?.(snap);
        },
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
        recompute,
        destroy: clearInline
    };
}
