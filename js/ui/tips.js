/**
 * Termien selitteet (info-tip)
 */

import { TOOLTIPS } from '../config.js';

/**
 * Generate tooltip HTML for a term
 */
export function tip(key) {
    const text = TOOLTIPS[key];
    if (!text) return '';
    return `<span class="info-tip" tabindex="0" aria-label="${text}"><span class="info-tip-icon">i</span><span class="info-tip-text">${text}</span></span>`;
}
