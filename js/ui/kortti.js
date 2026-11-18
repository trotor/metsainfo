/**
 * Kartan päällä oleva kortti lisäosien ja kokeilujen toiminnoille
 * (maastotila, lähihaku). Kortit ovat samassa kohdassa, joten kerrallaan
 * on auki vain yksi: kortti ilmoittaa avautumisestaan tapahtumalla, ja
 * muut sulkeutuvat. Toiminnot eivät tunne toisiaan (js/features.js).
 */

import './kortti.css';
import { getLang } from '../i18n.js';

const OPEN_EVENT = 'metsainfo:kortti-auki';

let stripWatched = false;

/**
 * Tabletissa kortti on värinauhan (#map-strip) yläpuolella (kortti.css).
 * Nauhan korkeus vaihtelee (selite rivittyy, kokeilujen valitsimet), joten
 * se välitetään CSS:lle muuttujana --map-strip-h.
 */
function watchMapStrip(doc = document) {
    if (stripWatched || typeof ResizeObserver === 'undefined') return;
    const strip = doc.getElementById('map-strip');
    if (!strip) return;
    stripWatched = true;
    new ResizeObserver(() => {
        doc.documentElement.style.setProperty('--map-strip-h', `${strip.offsetHeight}px`);
    }).observe(strip);
}

/**
 * Luo kortin. onClose kutsutaan, kun toinen kortti avautuu. notifyHidden:
 * kutsutaan myös, kun kortti on piilossa (toiminto, jonka tila jatkuu kortin
 * ollessa piilossa, kuten kuviovalinta mobiilissa yhteenvedon aikana).
 * Palauttaa { el, open(), close(), isOpen }.
 */
export function createCard({ id, label, className = '', onClose, notifyHidden = false }) {
    const el = document.createElement('section');
    el.className = `kortti ${className}`.trim();
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', label);
    el.lang = getLang(); // muu sovellus on suomeksi, kortti valitulla kielellä
    document.body.appendChild(el);
    watchMapStrip();

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
        if (e.detail !== id && (notifyHidden || !el.hidden)) onClose?.();
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
