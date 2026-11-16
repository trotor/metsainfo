/**
 * Kartan päällä oleva kortti lisäosien ja kokeilujen toiminnoille
 * (maastotila, lähihaku). Kortit ovat samassa kohdassa, joten kerrallaan
 * on auki vain yksi: kortti ilmoittaa avautumisestaan tapahtumalla, ja
 * muut sulkeutuvat. Toiminnot eivät tunne toisiaan (js/features.js).
 */

import './kortti.css';
import { getLang } from '../i18n.js';

const OPEN_EVENT = 'metsainfo:kortti-auki';

/**
 * Luo kortin. onClose kutsutaan, kun toinen kortti avautuu.
 * Palauttaa { el, open(), close(), isOpen }.
 */
export function createCard({ id, label, className = '', onClose }) {
    const el = document.createElement('section');
    el.className = `kortti ${className}`.trim();
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', label);
    el.lang = getLang(); // muu sovellus on suomeksi, kortti valitulla kielellä
    document.body.appendChild(el);

    const card = {
        el,
        get isOpen() { return !el.hidden; },
        open() {
            el.hidden = false;
            document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
        },
        close() {
            el.hidden = true;
        }
    };

    document.addEventListener(OPEN_EVENT, (e) => {
        if (e.detail !== id && !el.hidden) onClose?.();
    });
    return card;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Kortin otsikkorivi: otsikko, merkki (esim. "Kokeilu") ja sulkupainike data-close. */
export function cardHeader({ title, badge, closeLabel = 'Sulje' }) {
    return `
        <header class="kortti-head">
            <div>
                <h2>${esc(title)}</h2>
                ${badge ? `<span class="kortti-merkki">${esc(badge)}</span>` : ''}
            </div>
            <button type="button" class="kortti-close" data-close aria-label="${esc(closeLabel)}">×</button>
        </header>`;
}

/**
 * Karttapainike kortin avaamiseen paikannuspainikkeen alle (mobiilissa
 * oikealle ylös). Palauttaa { setPressed(bool) }.
 */
export function addMapButton({ map, label, icon, onClick, isMobile, onLayoutChange }) {
    let btn;
    const Control = L.Control.extend({
        onAdd() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control kortti-control');
            btn = L.DomUtil.create('a', '', container);
            btn.href = '#';
            btn.setAttribute('role', 'button');
            btn.setAttribute('aria-label', label);
            btn.setAttribute('aria-pressed', 'false');
            btn.title = label;
            btn.innerHTML = icon;
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(btn, 'click', (e) => {
                L.DomEvent.preventDefault(e);
                onClick();
            });
            return container;
        }
    });
    const position = () => (isMobile() ? 'topright' : 'topleft');
    const control = new Control({ position: position() }).addTo(map);
    onLayoutChange(() => control.setPosition(position()));
    return {
        setPressed(on) { btn?.setAttribute('aria-pressed', String(Boolean(on))); }
    };
}
