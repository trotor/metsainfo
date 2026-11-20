/**
 * Työkalujen, valikon ja väritysten rekisteri (käyttöliittymä B,
 * docs/plans/2026-11-17-kayttoliittyma-b-design.md).
 *
 * Toiminnot (kokeilut) ilmoittavat itsensä tänne eivätkä lisää omia
 * karttanappeja:
 * - registerTool: kartan Työkalut-napin listaan (kuvake, nimi, kuvaus).
 *   Päällä oleva työkalu, jonka kortti on piilossa, näkyy sirussa.
 * - registerMenuItem: ☰-valikkoon (korvaa ?-napit; Käyttöohje viimeisenä).
 * - registerColorMode: Väritys-valitsimeen (#color-mode-select) oma vaihtoehto.
 * Napit, lista, siru, valikko ja ohjeen osio luodaan vasta ensimmäisestä
 * rekisteröinnistä, joten ilman kokeiluja (julkinen build) mikään ei muutu.
 * Lista ei ole createCard-kortti: sen avaaminen ei sulje käynnissä olevaa
 * työkalua.
 */

import './tyokalut.css';
import * as state from '../state.js';
import { isMobileLayout, onLayoutChange } from './layout.js';
import { addHelpSection } from './ohje-osiot.js';
import { T } from './tyokalut-teksti.js';

const PIN_KEY = 'metsainfo.tyokalutKiinni';
const TOOLS_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M17 13.5v7M13.5 17h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const PIN_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 3h6l-1 6 3 3H7l3-3zM12 12v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const LOCK = '<span class="tk-lukko" aria-hidden="true">🔒</span>';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let tools, menuItems, colorModes, statuses, ui;
reset();

function reset() {
    tools = [];
    menuItems = [];
    colorModes = [];
    statuses = new Map(); // työkalu → { active, cardOpen, detail }
    ui = { control: null, button: null, list: null, chip: null, menu: null, select: null, current: null, builtin: null, helpQueued: false, docWired: false, menuWired: false };
}

/** Testejä varten: rekisteri tyhjäksi. */
export function _resetForTests() {
    ui.control?.remove();
    for (const el of [ui.list, ui.chip, ui.menu]) el?.remove();
    reset();
}

const byOrder = (a, b) => (a.order ?? 100) - (b.order ?? 100);

function pinned() {
    if (isMobileLayout()) return false;
    try {
        return localStorage.getItem(PIN_KEY) === '1';
    } catch {
        return false;
    }
}

function setPinned(on) {
    try {
        if (on) localStorage.setItem(PIN_KEY, '1');
        else localStorage.removeItem(PIN_KEY);
    } catch {
        // Ei tallennustilaa: kiinnitys vain tähän näkymään
    }
}

/* ---------- Yhteiset tapahtumat ---------- */

function wireDocument() {
    if (ui.docWired) return;
    ui.docWired = true;
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (ui.list && !ui.list.hidden && !pinned()) closeList({ focus: true });
        if (ui.menu && !ui.menu.hidden) closeMenu();
    });
    document.addEventListener('click', (e) => {
        if (ui.list && !ui.list.hidden && !pinned()
            && !e.target.closest('#tyokalut-lista, .tyokalut-control')) closeList();
        if (ui.menu && !ui.menu.hidden
            && !e.target.closest('#sovellus-valikko, #help-toggle, #mobile-help-toggle')) closeMenu();
    });
}

function scheduleHelp() {
    if (ui.helpQueued) return;
    ui.helpQueued = true;
    queueMicrotask(() => {
        ui.helpQueued = false;
        addHelpSection({ id: 'tyokalut', title: T.ohjeOsio.otsikko, html: helpSectionHtml() });
    });
}

/* ---------- Työkalut ---------- */

function ensureControl() {
    if (ui.control || !state.map) return;
    const Control = L.Control.extend({
        onAdd() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control tyokalut-control');
            const btn = L.DomUtil.create('a', '', container);
            btn.href = '#';
            btn.setAttribute('role', 'button');
            btn.setAttribute('aria-label', T.tyokalut);
            btn.setAttribute('aria-expanded', 'false');
            btn.title = T.tyokalut;
            btn.innerHTML = TOOLS_ICON;
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(btn, 'click', (e) => {
                L.DomEvent.preventDefault(e);
                if (ui.list && !ui.list.hidden) closeList();
                else openList();
            });
            ui.button = btn;
            return container;
        }
    });
    const position = () => (isMobileLayout() ? 'topright' : 'topleft');
    ui.control = new Control({ position: position() }).addTo(state.map);
    onLayoutChange(() => {
        if (ui.control && ui.control.getPosition() !== position()) ui.control.setPosition(position());
        if (ui.list && !ui.list.hidden) renderList();
    });
    if (pinned()) queueMicrotask(openList);
}

function ensureList() {
    if (ui.list) return;
    const el = document.createElement('section');
    el.id = 'tyokalut-lista';
    el.className = 'tyokalut-lista';
    el.hidden = true;
    el.setAttribute('aria-label', T.tyokalut);
    el.addEventListener('click', (e) => {
        const item = e.target.closest('[data-tool]');
        if (item) {
            const t = tools.find(x => x.id === item.dataset.tool);
            if (!pinned()) closeList();
            t?.onSelect();
            return;
        }
        const action = e.target.closest('[data-tk]')?.dataset.tk;
        if (action === 'kiinnita') {
            setPinned(!pinned());
            renderList();
        } else if (action === 'sulje') {
            setPinned(false);
            closeList({ focus: true });
        }
    });
    document.body.appendChild(el);
    ui.list = el;
    // Kiinnitetty lista seuraa nappisarakkeen siirtymää (tietopaneeli auki/kiinni, ikkunan koko)
    const follow = () => { if (ui.list && !ui.list.hidden) position(); };
    window.addEventListener('resize', follow);
    const panel = document.getElementById('info-panel');
    if (panel && typeof MutationObserver === 'function') {
        new MutationObserver(follow).observe(panel, { attributes: true, attributeFilter: ['class'] });
    }
}

function renderList() {
    if (!ui.list) return;
    const pin = pinned();
    ui.list.classList.toggle('tk-kiinni', pin);
    ui.list.innerHTML = `
        <header class="tk-head">
            <h2>${esc(T.tyokalut)}</h2>
            ${isMobileLayout() ? '' : `<button type="button" class="tk-pin" data-tk="kiinnita" aria-pressed="${pin}" title="${esc(pin ? T.irrota : T.kiinnita)}" aria-label="${esc(pin ? T.irrota : T.kiinnita)}">${PIN_ICON}</button>`}
            <button type="button" class="tk-sulje" data-tk="sulje" aria-label="${esc(T.sulje)}">×</button>
        </header>
        <ul class="tk-items">${[...tools].sort(byOrder).map(t => {
            const s = statuses.get(t.id);
            const locked = t.locked?.();
            return `<li><button type="button" class="tk-item${s?.active ? ' tk-paalla' : ''}" data-tool="${esc(t.id)}" aria-pressed="${Boolean(s?.active)}">
                <span class="tk-icon">${t.icon}</span>
                <span class="tk-text"><span class="tk-label">${esc(t.label)}${locked ? ` ${LOCK}<span class="tk-lisaosa">${esc(T.lisaosa)}</span>` : ''}</span>
                ${t.description ? `<span class="tk-desc">${esc(t.description)}</span>` : ''}</span>
            </button></li>`;
        }).join('')}</ul>`;
    position();
}

/** Työpöydällä lista Työkalut-napin viereen; mobiilissa CSS asettaa alas. */
function position() {
    if (!ui.list) return;
    if (isMobileLayout() || !ui.button) {
        ui.list.style.left = ui.list.style.top = '';
        return;
    }
    const r = ui.button.getBoundingClientRect();
    ui.list.style.left = `${Math.round(r.right + 8)}px`;
    // Napin viereen, mutta matalassa ikkunassa kokonaan näkyviin
    const h = ui.list.getBoundingClientRect().height || 0;
    const top = Math.min(r.top - 120, window.innerHeight - h - 8);
    ui.list.style.top = `${Math.round(Math.max(8, top))}px`;
}

function openList() {
    ensureList();
    wireDocument();
    closeMenu();
    ui.list.hidden = false;
    renderList();
    ui.button?.setAttribute('aria-expanded', 'true');
}

function closeList({ focus = false } = {}) {
    if (!ui.list) return;
    ui.list.hidden = true;
    ui.button?.setAttribute('aria-expanded', 'false');
    if (focus) ui.button?.focus();
}

function ensureChip() {
    if (ui.chip) return;
    const el = document.createElement('div');
    el.id = 'tyokalu-siru';
    el.className = 'tyokalu-siru';
    el.hidden = true;
    el.addEventListener('click', (e) => {
        const action = e.target.closest('[data-tk]')?.dataset.tk;
        const t = tools.find(x => x.id === el.dataset.tool);
        if (!t) return;
        if (action === 'avaa') t.onSelect();
        else if (action === 'lopeta') t.onStop?.();
    });
    document.body.appendChild(el);
    ui.chip = el;
}

function renderChip() {
    const shown = [...tools].sort(byOrder).find(t => {
        const s = statuses.get(t.id);
        return s?.active && !s.cardOpen;
    });
    if (!shown) {
        if (ui.chip) ui.chip.hidden = true;
        return;
    }
    ensureChip();
    const s = statuses.get(shown.id);
    ui.chip.dataset.tool = shown.id;
    ui.chip.innerHTML = `
        <button type="button" class="ts-avaa" data-tk="avaa"><span class="tk-icon">${shown.icon}</span><span>${esc(shown.label)}${s.detail ? ` · ${esc(s.detail)}` : ''}</span></button>
        <button type="button" class="ts-lopeta" data-tk="lopeta" aria-label="${esc(T.lopeta)}: ${esc(shown.label)}">×</button>`;
    ui.chip.hidden = false;
}

/**
 * Työkalu listaan. onSelect avaa työkalun (sen kortin), onStop lopettaa sen.
 * locked() näyttää lukon; lukitus itse on toiminnon omassa koodissa.
 * feature: js/features.js-tunnus, jos se eroaa id:stä (esittely).
 */
export function registerTool({ id, label, description = '', icon, onSelect, onStop, locked = () => false, order = 100, feature }) {
    tools = tools.filter(t => t.id !== id).concat({ id, label, description, icon, onSelect, onStop, locked, order, feature });
    ensureControl();
    if (ui.list && !ui.list.hidden) renderList();
    scheduleHelp();
    return {
        setStatus({ active = false, cardOpen = false, detail = '' } = {}) {
            statuses.set(id, { active, cardOpen, detail });
            renderChip();
            if (ui.list && !ui.list.hidden) renderList();
        }
    };
}

/* ---------- Valikko ☰ ---------- */

function ensureMenu() {
    if (ui.menuWired) return;
    ui.menuWired = true;
    const el = document.createElement('div');
    el.id = 'sovellus-valikko';
    el.className = 'sovellus-valikko';
    el.setAttribute('role', 'menu');
    el.hidden = true;
    el.addEventListener('click', (e) => {
        const item = e.target.closest('[data-menu]');
        if (!item) return;
        closeMenu();
        if (item.dataset.menu === 'ohje') window.toggleHelp?.();
        else menuItems.find(m => m.id === item.dataset.menu)?.onSelect();
    });
    document.body.appendChild(el);
    ui.menu = el;
    for (const id of ['help-toggle', 'mobile-help-toggle']) {
        const btn = document.getElementById(id);
        if (!btn) continue;
        btn.removeAttribute('onclick');
        btn.onclick = null;
        btn.textContent = '☰';
        btn.setAttribute('aria-label', T.valikko);
        btn.title = T.valikko;
        btn.setAttribute('aria-haspopup', 'menu');
        // Painallus saa kulkea dokumentille: ⋯-valikko ja hakukenttä sulkeutuvat
        // omilla kuuntelijoillaan; oma kuuntelija (wireDocument) ohittaa napit.
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!ui.menu.hidden) closeMenu();
            else openMenu(btn);
        });
    }
}

function openMenu(anchor) {
    wireDocument();
    if (!pinned()) closeList();
    const items = [...menuItems].sort(byOrder);
    ui.menu.innerHTML = items.map(m => `<button type="button" role="menuitem" data-menu="${esc(m.id)}"><span class="tk-icon">${m.icon || ''}</span>${esc(m.label)}</button>`).join('')
        + `<button type="button" role="menuitem" data-menu="ohje"><span class="tk-icon tk-ohje-merkki" aria-hidden="true">?</span>${esc(T.ohje)}</button>`;
    ui.menu.hidden = false;
    const r = anchor.getBoundingClientRect();
    ui.menu.style.top = `${Math.round(r.bottom + 6)}px`;
    ui.menu.style.right = `${Math.max(8, Math.round(window.innerWidth - r.right))}px`;
    anchor.setAttribute('aria-expanded', 'true');
}

function closeMenu() {
    if (!ui.menu || ui.menu.hidden) return;
    ui.menu.hidden = true;
    for (const id of ['help-toggle', 'mobile-help-toggle']) document.getElementById(id)?.setAttribute('aria-expanded', 'false');
}

/** Kohta ☰-valikkoon (Käyttöohje on aina viimeisenä). */
export function registerMenuItem({ id, label, icon, onSelect, order = 100 }) {
    menuItems = menuItems.filter(m => m.id !== id).concat({ id, label, icon, onSelect, order });
    ensureMenu();
    scheduleHelp();
}

/* ---------- Väritys ---------- */

const optionValue = (id) => `x:${id}`;
const modeOf = (value) => colorModes.find(m => optionValue(m.id) === value);

function wireSelect() {
    if (ui.select) return ui.select;
    const select = document.getElementById('color-mode-select');
    if (!select) return null;
    ui.select = select;
    ui.current = select.value;
    ui.builtin = select.value;
    select.addEventListener('change', () => apply(select.value));
    return select;
}

/** Vaihtaa valitsimen arvon: rekisteröidyn tilan onSelect/onDeselect. */
function apply(value) {
    const prev = ui.current;
    if (value === prev) return;
    const next = modeOf(value);
    if (next && next.onSelect() === false) {
        ui.select.value = prev; // lukittu: palataan edelliseen
        return;
    }
    modeOf(prev)?.onDeselect();
    ui.current = value;
    if (!next) ui.builtin = value;
}

/**
 * Oma vaihtoehto Väritys-valitsimeen. onSelect voi palauttaa false (esim.
 * lukittu), jolloin valitsin palaa edelliseen. feature: js/features.js-tunnus,
 * jos se eroaa id:stä (esittely tunnistaa maksulliset sen mukaan).
 */
export function registerColorMode({ id, label, onSelect, onDeselect, feature }) {
    const select = wireSelect();
    colorModes = colorModes.filter(m => m.id !== id).concat({ id, label, onSelect, onDeselect, feature });
    if (select && !select.querySelector(`option[value="${CSS.escape(optionValue(id))}"]`)) {
        const opt = document.createElement('option');
        opt.value = optionValue(id);
        opt.textContent = label;
        select.appendChild(opt);
    }
    scheduleHelp();
    return {
        isSelected: () => ui.current === optionValue(id),
        select() {
            if (!ui.select || ui.current === optionValue(id)) return;
            ui.select.value = optionValue(id);
            apply(optionValue(id));
        },
        deselect() {
            if (!ui.select || ui.current !== optionValue(id)) return;
            ui.select.value = ui.builtin;
            apply(ui.builtin);
        }
    };
}

/**
 * Rekisteröidyt kohdat esittelyä varten (js/esittely/): mitä Työkaluissa ja
 * Väritys-valitsimessa on tässä buildissa. feature = js/features.js-tunnus.
 */
export function rekisteroidyt() {
    return {
        tyokalut: [...tools].sort(byOrder).map(t => ({ id: t.id, feature: t.feature ?? t.id, label: t.label, description: t.description, icon: t.icon })),
        varit: colorModes.map(m => ({ id: m.id, feature: m.feature ?? m.id, label: m.label }))
    };
}

/** Avaa rekisteröity työkalu kuin Työkalut-listasta (esittelyn uutta-ikkuna). */
export function avaaTyokalu(id) {
    const t = tools.find(x => x.id === id);
    if (!t) return false;
    closeList();
    t.onSelect();
    return true;
}

/* ---------- Ohje ---------- */

/** Ohjeen osio: kuvake, nimi ja kuvaus jokaisesta rekisteröidystä kohdasta. */
export function helpSectionHtml() {
    const O = T.ohjeOsio;
    const row = (icon, label, desc) => `<li class="tk-ohje-rivi"><span class="tk-icon">${icon || ''}</span><span><strong>${esc(label)}</strong>${desc ? ` — ${esc(desc)}` : ''}</span></li>`;
    const parts = [`<p>${O.johdanto}</p>`];
    if (tools.length) {
        parts.push(`<h4>${esc(O.tyokalut)} <span class="tk-icon tk-icon-pieni">${TOOLS_ICON}</span></h4><ul class="tk-ohje">${[...tools].sort(byOrder).map(t => row(t.icon, t.label, t.description)).join('')}</ul>`);
    }
    if (menuItems.length) {
        parts.push(`<h4>${esc(O.valikko)}</h4><ul class="tk-ohje">${[...menuItems].sort(byOrder).map(m => row(m.icon, m.label, '')).join('')}</ul>`);
    }
    if (colorModes.length) {
        parts.push(`<h4>${esc(O.varitys)}</h4><ul class="tk-ohje">${colorModes.map(m => row('', m.label, '')).join('')}</ul>`);
    }
    return parts.join('');
}
