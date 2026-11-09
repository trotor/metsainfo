/**
 * Tietopaneelin tilanhallinta: mobiilin bottom sheet, valikko ja
 * kartan täytteet paneelin korkeuden mukaan
 */

import { isMobileLayout, onLayoutChange, topInset, fitPadding } from './layout.js';
import { createSheet, resolveRelease, nextSnapOnTap } from './sheet.js';
import { copyParcelLink, downloadCSV } from './actions.js';
import { initTips } from './tips.js';
import * as state from '../state.js';

let sheet = null;
let panelEl = null;

const TABS = ['summary', 'stands', 'recs'];

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
    return {
        ...fitPadding({
            mobile: isMobileLayout(),
            sheetHeight: sheet ? sheet.fitHeight({ newSelection }) : 0,
            topInset: topInset()
        }),
        ...extra
    };
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
 * Uusi valinta: paneeli näkyviin, mobiilissa kurkistustilaan
 */
export function openPanelForSelection() {
    panelEl.classList.remove('hidden');
    closeMenu();
    sheet.setSnap('peek');
    setPeekMessage('Haetaan tietoja…');
}

function hidePanel() {
    panelEl.classList.add('hidden');
    closeMenu();
    sheet.refresh();
}

function closeMenu() {
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
        if (!drag || e.pointerId !== drag.id) return;
        sheet.setDragHeight(drag.startH - (e.clientY - drag.startY));
        drag.samples.push({ y: e.clientY, t: e.timeStamp });
        if (drag.samples.length > 6) drag.samples.shift();
    });

    const end = (e, cancelled) => {
        if (!drag || e.pointerId !== drag.id) return;
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
    const placeZoom = (mobile) => state.map?.zoomControl?.setPosition(mobile ? 'topright' : 'topleft');
    placeZoom(isMobileLayout());

    onLayoutChange((mobile) => {
        sheet.recompute();
        placeZoom(mobile);
    });
    window.addEventListener('resize', () => sheet.recompute());
}
