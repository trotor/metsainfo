/**
 * Tietopaneelin tilanhallinta: mobiilin bottom sheet, valikko ja
 * kartan täytteet paneelin korkeuden mukaan
 */

import { T } from './teksti.js';
import { isMobileLayout, isTabletLayout, onLayoutChange, topInset, fitPadding, panIntoView, visibleCenterOffset, tabletCenterOffset } from './layout.js';
import { createSheet, resolveRelease, nextSnapOnTap, TAP_THRESHOLD } from './sheet.js';
import { copyParcelLink, downloadCSV } from './actions.js';
import { initTips } from './tips.js';
import * as state from '../state.js';

let sheet = null;
let panelEl = null;

const TABS = ['summary', 'stands', 'recs', 'arvio'];

/**
 * Aktivoi välilehden. Jos välilehteä ei ole (esim. ei ehdotuksia),
 * palataan yhteenvetoon.
 */
export function setActiveTab(name) {
    const content = document.getElementById('info-content');
    if (!content) return;
    const exists = TABS.includes(name) && content.querySelector(`.tab-panel[data-tab="${name}"]`);
    const tab = exists ? name : 'summary';
    content.dataset.activeTab = tab;
    content.querySelectorAll('.tabbar [data-tab]').forEach(btn => {
        btn.setAttribute('aria-selected', btn.dataset.tab === tab ? 'true' : 'false');
    });
}

export function getActiveTab() {
    return document.getElementById('info-content')?.dataset.activeTab || 'summary';
}

export function initTabs(contentEl) {
    contentEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.tabbar [data-tab]');
        if (!btn) return;
        setActiveTab(btn.dataset.tab);
        contentEl.scrollTop = 0;
    });
}

export function getSheet() {
    return sheet;
}

/**
 * Leafletin fitBounds-asetukset, jotka huomioivat hakupalkin ja paneelin
 */
export function mapFitOptions(extra = {}, { newSelection = false } = {}) {
    if (isTabletLayout()) {
        // Uusi valinta avaa paneelin, joten sovitetaan auki olevan paneelin viereen
        const shown = panelEl && !panelEl.classList.contains('hidden');
        const open = newSelection || (shown && sheet?.getSnap() !== 'peek');
        return {
            ...fitPadding({
                mobile: true,
                tablet: true,
                topInset: topInset(),
                open: newSelection || shown ? open : undefined,
                panelRight: tabletPanelRight(),
                collapsedBottom: sheet ? sheet.collapsedBottom() : 0
            }),
            ...extra
        };
    }
    return {
        ...fitPadding({
            mobile: isMobileLayout(),
            sheetHeight: sheet ? sheet.fitHeight({ newSelection }) : 0,
            topInset: topInset()
        }),
        ...extra
    };
}

/** Tabletin sivupaneelin oikea reuna; hakupalkki on saman levyinen, joten se kelpaa myös piilotetulle paneelille. */
function tabletPanelRight() {
    const rect = panelEl && !panelEl.classList.contains('hidden') ? panelEl.getBoundingClientRect() : null;
    if (rect?.width) return Math.round(rect.right);
    const search = document.getElementById('search-control')?.getBoundingClientRect();
    return search ? Math.round(search.right) : 0;
}

/**
 * Siirtää valitun kiinteistön näkyvälle alueelle, jos paneeli peittää sen.
 * Zoomiin ei kosketa, jotta käyttäjän oma zoomaus säilyy.
 */
function revealIfCovered() {
    const map = state.map;
    const layer = state.selectedParcelLayer;
    if (!map || !layer || panelEl.classList.contains('hidden')) return;
    const bounds = layer.getBounds?.();
    if (!bounds?.isValid()) return;
    const a = map.latLngToContainerPoint(bounds.getNorthWest());
    const b = map.latLngToContainerPoint(bounds.getSouthEast());
    const box = { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y) };
    const [dx, dy] = panIntoView(box, map.getSize(), mapFitOptions());
    if (dx || dy) map.panBy([dx, dy]);
}

let revealTimer = null;
/** Viivästetty: Leaflet päivittää kokonsa ja mahdollinen sovitusanimaatio päättyy ensin. */
function scheduleReveal(ms = 300) {
    clearTimeout(revealTimer);
    revealTimer = setTimeout(revealIfCovered, ms);
}

/**
 * Tabletissa uusi valinta avaa paneelin koko korkeudelle: kartan
 * napautuksella valittu kiinteistö siirretään paneelin vierestä näkyviin
 */
export function revealSelection() {
    if (isTabletLayout()) scheduleReveal();
}

/**
 * Siirtymä, jolla kartan kohde osuu näkyvän alueen keskelle (paikannus,
 * kuvion korostus). Työpöydällä ei siirtymää.
 */
export function visibleOffset() {
    if (!isMobileLayout()) return [0, 0];
    if (isTabletLayout()) {
        const open = panelEl && !panelEl.classList.contains('hidden') && sheet?.getSnap() !== 'peek';
        return tabletCenterOffset(open ? tabletPanelRight() : 0, topInset());
    }
    return visibleCenterOffset(sheet ? sheet.targetHeight() : 0, topInset());
}

/**
 * Kurkistusrivin viesti (haku käynnissä, virhe). ⋯-painike säilyy, jotta
 * valinnan voi poistaa myös virhetilanteessa.
 */
export function setPeekMessage(text) {
    const peek = document.getElementById('sheet-peek');
    if (!peek) return;
    peek.innerHTML = `
        <div class="peek-head">
            <span class="peek-message"></span>
            <button type="button" id="sheet-menu-btn" aria-label="Toiminnot" aria-haspopup="menu">⋯</button>
        </div>`;
    peek.querySelector('.peek-message').textContent = text;
}

/**
 * Uusi valinta: paneeli näkyviin, mobiilissa kurkistustilaan, tabletissa
 * auki (kiinteistö ja tiedot mahtuvat näkyviin yhtä aikaa)
 */
export function openPanelForSelection() {
    panelEl.classList.remove('hidden');
    closeMenu();
    sheet.setSnap(isTabletLayout() ? 'full' : 'peek');
    setPeekMessage(T.haetaanTietoja);
}

function hidePanel() {
    panelEl.classList.add('hidden');
    closeMenu();
    sheet.setSnap('peek');
}

export function closeMenu() {
    const menu = document.getElementById('sheet-menu');
    if (menu) menu.hidden = true;
}

/**
 * Kahvan ja kurkistusrivin veto. Sisältö vierittyy natiivisti, joten vain
 * nämä kaksi elementtiä vetävät paneelia.
 */
function attachDrag(el) {
    let drag = null;

    el.addEventListener('pointerdown', (e) => {
        if (!isMobileLayout() || e.target.closest('button')) return;
        if (isTabletLayout()) {
            // Tabletissa ei vetoa: napautus avaa tai pienentää paneelin
            drag = { id: e.pointerId, startY: e.clientY, startX: e.clientX, tablet: true };
            return;
        }
        drag = {
            id: e.pointerId,
            startY: e.clientY,
            startH: sheet.targetHeight(),
            samples: [{ y: e.clientY, t: e.timeStamp }]
        };
        el.setPointerCapture?.(e.pointerId);
        panelEl.classList.add('dragging');
    });

    el.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id || drag.tablet) return;
        sheet.setDragHeight(drag.startH - (e.clientY - drag.startY));
        drag.samples.push({ y: e.clientY, t: e.timeStamp });
        if (drag.samples.length > 6) drag.samples.shift();
    });

    const end = (e, cancelled) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (drag.tablet) {
            const moved = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
            drag = null;
            if (!cancelled && moved < TAP_THRESHOLD) sheet.setSnap(sheet.getSnap() === 'peek' ? 'full' : 'peek');
            return;
        }
        panelEl.classList.remove('dragging');
        const dy = e.clientY - drag.startY;
        const first = drag.samples[0];
        const dt = e.timeStamp - first.t;
        const velocityY = dt > 0 ? (e.clientY - first.y) / dt : 0;
        const result = cancelled ? sheet.getSnap() : resolveRelease(drag.startH, dy, velocityY, sheet.getHeights());
        drag = null;
        sheet.setSnap(result === 'tap' ? nextSnapOnTap(sheet.getSnap()) : result);
    };

    el.addEventListener('pointerup', (e) => end(e, false));
    el.addEventListener('pointercancel', (e) => end(e, true));
}

export function initPanel({ onClearSelection }) {
    panelEl = document.getElementById('info-panel');
    sheet = createSheet(panelEl);

    const handle = document.getElementById('sheet-handle');
    const peek = document.getElementById('sheet-peek');
    const menu = document.getElementById('sheet-menu');

    initTabs(document.getElementById('info-content'));
    initTips(document.getElementById('info-content'));
    attachDrag(handle);
    attachDrag(peek);

    handle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            sheet.setSnap(nextSnapOnTap(sheet.getSnap()));
        }
    });

    document.getElementById('close-panel').addEventListener('click', () => {
        if (isMobileLayout()) {
            sheet.setSnap('peek');
        } else {
            onClearSelection();
            sheet.refresh();
        }
    });

    // ⋯-painike renderöidään kurkistusriville, joten kuuntelu delegoidaan
    panelEl.addEventListener('click', (e) => {
        if (e.target.closest('#sheet-menu-btn')) {
            menu.hidden = !menu.hidden;
            return;
        }
        const item = e.target.closest('#sheet-menu [data-action]');
        if (!item) return;
        const action = item.dataset.action;
        if (action === 'copy') {
            copyParcelLink(item);
            return; // valikko jää auki, jotta "Kopioitu!" näkyy
        }
        closeMenu();
        if (action === 'csv') downloadCSV();
        if (action === 'print') window.print();
        if (action === 'clear') {
            onClearSelection();
            hidePanel();
        }
    });

    document.addEventListener('click', (e) => {
        if (!menu.hidden && !e.target.closest('#sheet-menu, #sheet-menu-btn')) closeMenu();
    });

    // Mobiilissa zoom oikean reunan pinoon tasovalitsimen alle
    const placeZoom = (mobile) => {
        const zoom = state.map?.zoomControl;
        const corner = mobile ? 'topright' : 'topleft';
        if (zoom && zoom.getPosition() !== corner) zoom.setPosition(corner);
    };
    placeZoom(isMobileLayout());

    let wasTablet = isTabletLayout();
    onLayoutChange((mobile, tablet) => {
        // Tabletin auki oleva paneeli peittäisi puhelimessa koko näkymän: puolikkaaksi
        if (wasTablet && !tablet && mobile && sheet.getSnap() === 'full') {
            sheet.recompute();
            sheet.setSnap('half');
        } else {
            sheet.recompute();
        }
        const swapped = wasTablet !== tablet;
        wasTablet = tablet;
        placeZoom(mobile);
        // Paneeli vaihtoi paikkaa (Duon avaus, kierto): valittu kiinteistö
        // näkyviin, jos se jäi paneelin alle. Leaflet päivittää kokonsa ensin.
        if (swapped) scheduleReveal();
    });
    window.addEventListener('resize', () => {
        sheet.recompute();
        // Tabletin kierto ja Split View muuttavat paneelin leveyttä ja kartan kokoa
        if (isTabletLayout()) scheduleReveal();
    });
    // Tabletin pienennetty paneeli on kurkistusrivin korkuinen, ja rivi vaihtuu
    // (haetaan → yhteenveto) ja rivittyy paneelin leveyden mukaan
    if (typeof ResizeObserver === 'function') {
        new ResizeObserver(() => {
            if (isTabletLayout()) sheet.recompute();
        }).observe(peek);
    }
}
