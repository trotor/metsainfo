/**
 * Termien selitteet (info-tip)
 */

import { TOOLTIPS } from '../config.js';
import { isMobileLayout } from './layout.js';

/**
 * Generate tooltip HTML for a term
 */
export function tip(key) {
    const text = TOOLTIPS[key];
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

function openTip(tipEl, root, mobile) {
    tipEl.classList.add('open');
    if (!mobile) return; // työpöydällä näkyy kelluva vihje .open-luokalla

    // Mobiilissa selite avautuu tekstiriviksi termin alle
    const anchor = tipEl.closest('.detail-row, .stat-item, h3') || tipEl;
    const line = document.createElement('div');
    line.className = 'tip-inline';
    line.setAttribute('role', 'note');
    line.textContent = tipEl.querySelector('.info-tip-text')?.textContent || '';
    anchor.after(line);
}

/**
 * Selitteet avautuvat napautuksella, yksi kerrallaan. Escape sulkee.
 */
export function initTips(root, { win = window } = {}) {
    root.addEventListener('click', (e) => {
        const tipEl = e.target.closest('.info-tip');
        if (!tipEl || !root.contains(tipEl)) return;
        e.stopPropagation();
        const wasOpen = tipEl.classList.contains('open');
        closeTips(root);
        if (!wasOpen) openTip(tipEl, root, isMobileLayout(win));
    });

    root.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeTips(root);
    });
}
