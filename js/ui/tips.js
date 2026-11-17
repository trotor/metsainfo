/**
 * Termien selitteet (info-tip)
 */

import { tooltipText } from './teksti.js';
import { isMobileLayout } from './layout.js';

/**
 * Generate tooltip HTML for a term
 */
export function tip(key) {
    const text = tooltipText(key);
    if (!text) return '';
    return `<span class="info-tip" tabindex="0" aria-label="${text}"><span class="info-tip-icon">i</span><span class="info-tip-text">${text}</span></span>`;
}

/**
 * Sulkee avoimen selitteen
 */
export function closeTips(root) {
    root.querySelectorAll('.info-tip.open').forEach(t => t.classList.remove('open'));
    root.querySelectorAll('.tip-inline').forEach(el => el.remove());
}

function openTip(tipEl) {
    // Mobiilissa selite avautuu tekstiriviksi termin alle
    tipEl.classList.add('open');
    const anchor = tipEl.closest('.detail-row, .stat-item, h3') || tipEl;
    const line = document.createElement('div');
    line.className = 'tip-inline';
    line.setAttribute('role', 'note');
    line.textContent = tipEl.querySelector('.info-tip-text')?.textContent || '';
    anchor.after(line);
}

const GAP = 8;     // px termin ja selitteen väli
const MARGIN = 8;  // px ikkunan reunasta
const ARROW = 10;  // px nuolen vähimmäisetäisyys laatikon reunasta

/**
 * Selitteen paikka ikkunassa (työpöytä): termin yläpuolelle, tai alle, jos
 * yläpuolella ei ole tilaa; vaakasuunnassa ikkunan sisään. arrowX on nuolen
 * paikka laatikon vasemmasta reunasta.
 */
export function placeTip(icon, size, viewport) {
    const center = icon.left + icon.width / 2;
    const below = icon.top - GAP - size.height < MARGIN;
    const top = below ? icon.bottom + GAP : icon.top - GAP - size.height;
    const maxLeft = Math.max(MARGIN, viewport.width - MARGIN - size.width);
    const left = Math.min(Math.max(center - size.width / 2, MARGIN), maxLeft);
    const arrowX = Math.min(Math.max(center - left, ARROW), size.width - ARROW);
    return { top, left, below, arrowX };
}

/** Työpöydällä selite sijoitetaan ikkunaan, jottei paneelin reuna leikkaa sitä. */
function positionTip(tipEl, win) {
    const text = tipEl.querySelector('.info-tip-text');
    if (!text) return;
    Object.assign(text.style, { position: 'fixed', right: 'auto', bottom: 'auto', transform: 'none' });
    const r = text.getBoundingClientRect();
    const p = placeTip(tipEl.getBoundingClientRect(), { width: r.width, height: r.height },
        { width: win.innerWidth || 0, height: win.innerHeight || 0 });
    text.style.left = `${Math.round(p.left)}px`;
    text.style.top = `${Math.round(p.top)}px`;
    text.style.setProperty('--nuoli-x', `${Math.round(p.arrowX)}px`);
    text.classList.toggle('alla', p.below);
}

/**
 * Selitteet avautuvat napautuksella, yksi kerrallaan. Escape sulkee.
 */
export function initTips(root, { win = window } = {}) {
    root.addEventListener('click', (e) => {
        const tipEl = e.target.closest('.info-tip');
        if (!tipEl || !root.contains(tipEl)) return;
        // Työpöydällä vihje näkyy hoverilla ja fokuksella kuten ennenkin
        if (!isMobileLayout(win)) return;
        e.stopPropagation();
        const wasOpen = tipEl.classList.contains('open');
        closeTips(root);
        if (!wasOpen) openTip(tipEl);
    });

    const onEnter = (e) => {
        const tipEl = e.target.closest?.('.info-tip');
        if (!tipEl || !root.contains(tipEl) || isMobileLayout(win)) return;
        positionTip(tipEl, win);
    };
    root.addEventListener('mouseover', onEnter);
    root.addEventListener('focusin', onEnter);

    root.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeTips(root);
    });
}
