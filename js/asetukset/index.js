/**
 * Asetukset (kokeilu, #24): ensimmäisenä kielivalinta. Mukana vain
 * kokeilubuildissa (VITE_KOKEILU=1), maksuton (js/features.js).
 */

import './asetukset.css';
import * as state from '../state.js';
import { createCard, cardHeader } from '../ui/kortti.js';
import { registerMenuItem } from '../ui/tyokalut.js';
import { isUnlocked } from '../features.js';
import { KIELET, getLang, setLang, isLangChosen, deviceLang } from '../i18n.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { T, KIELTEN_NIMET } from './teksti.js';

const ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.5 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function startAsetukset() {
    addHelpSection({ id: 'asetukset', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });
    if (!isUnlocked('asetukset')) return;
    let open = false;

    // ☰-valikkoon (js/ui/tyokalut.js)
    registerMenuItem({ id: 'asetukset', label: T.nappi, icon: ICON, order: 20, onSelect: () => toggle(true) });
    const button = { setPressed() {} };
    const card = createCard({ id: 'asetukset', label: T.nappi, className: 'asetukset-kortti', onClose: () => toggle(false) });

    function toggle(force) {
        open = force ?? !open;
        if (open) { card.open(); render(); } else card.close();
        button.setPressed(open);
    }

    card.el.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) toggle(false);
    });
    card.el.addEventListener('change', (e) => {
        if (e.target.name === 'kieli' && e.target.value !== getLang()) setLang(e.target.value);
    });

    function render() {
        const device = KIELTEN_NIMET[deviceLang()];
        const options = KIELET.map(l => `
            <label class="as-valinta">
                <input type="radio" name="kieli" value="${l}" ${getLang() === l ? 'checked' : ''}>
                <span lang="${l}">${esc(KIELTEN_NIMET[l])}</span>
            </label>`).join('');
        card.el.innerHTML = `${cardHeader({ title: T.otsikko, badge: T.kokeilu, closeLabel: T.sulje })}
            <fieldset class="as-ryhma">
                <legend>${esc(T.kieli)}</legend>
                ${options}
                ${isLangChosen() ? '' : `<p class="as-huom">${esc(T.laite)}: ${esc(device)}</p>`}
            </fieldset>
            <p class="as-huom">${esc(T.kattavuus)}</p>
            ${getLang() === 'en' ? `<p class="as-huom">${esc(T.epavirallinen)}</p>` : ''}
            <p class="as-huom">${esc(T.vainLaitteella)}</p>`;
    }
}
