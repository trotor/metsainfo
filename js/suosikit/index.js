/**
 * Suosikit ja omat muistiinpanot (kokeilu, #24). Mukana vain
 * kokeilubuildissa (VITE_KOKEILU=1, dynaaminen import app.js:ssä).
 *
 * - Tähti (☆/★) kiinteistön yhteenvetoon ja jokaiseen kuvioon: lisätään,
 *   kun yhteenveto on piirretty (viesti VIESTIT.yhteenveto), joten
 *   tavallisen sovelluksen koodiin ei tule suosikkien merkintöjä.
 * - Hallinta kortissa: suodatus tyypin ja tekstin mukaan, nimen ja
 *   muistiinpanon muokkaus, poisto ja avaus.
 * - Muut toiminnot (lähihaku) tallentavat viestillä VIESTIT.tallennaSuosikki.
 */

import './suosikit.css';
import * as state from '../state.js';
import { coordsEPSG3067ToLatLng, formatCadastralReference } from '../utils.js';
import { openStand } from '../ui/stands.js';
import { releaseFollow, showToast } from '../ui/location-ui.js';
import { isUnlocked } from '../features.js';
import { createCard, cardHeader } from '../ui/kortti.js';
import { registerMenuItem } from '../ui/tyokalut.js';
import { on, emit, VIESTIT } from '../vayla.js';
import { pointInside } from '../kuviotieto.js';
import { createFavorites, filterFavorites, TYYPIT } from './varasto.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { T } from './teksti.js';

const ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="currentColor"/></svg>';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** WFS:n kuviotunnus (feature.id "stand.74234401") tai REST 2.0:n STANDID. */
function standIdOf(feature) {
    const fromId = Number(String(feature?.id ?? '').replace(/^stand\./, ''));
    return Number.isFinite(fromId) && fromId > 0 ? fromId : feature?.properties?.STANDID ?? null;
}

const centerOf = (geometry) => pointInside(geometry);

export function startSuosikit() {
    addHelpSection({ id: 'suosikit', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });
    if (!isUnlocked('suosikit')) return;
    const store = createFavorites();
    const ui = {
        open: false,
        type: null,          // suodatin: null = kaikki
        text: '',
        editing: null,       // muokattavan suosikin id
        confirmDelete: false
    };
    let lastSummary = null;  // viimeisin yhteenveto, johon tähdet lisättiin
    let pendingStand = null; // { reference, standId } avattava kuvio, kun kiinteistö on ladattu

    /* ---------- Kartta ---------- */

    const marker = L.layerGroup().addTo(state.map);
    // ☰-valikkoon (js/ui/tyokalut.js)
    registerMenuItem({ id: 'suosikit', label: T.nappi, icon: ICON, order: 10, onSelect: () => toggle(true) });

    /* ---------- Kortti ---------- */

    const card = createCard({ id: 'suosikit', label: T.nappi, className: 'suosikit-kortti', onClose: () => toggle(false) });

    function toggle(force) {
        ui.open = force ?? !ui.open;
        if (ui.open) {
            card.open();
            render();
        } else {
            card.close();
            ui.editing = null;
        }
    }

    function openEditor(id) {
        ui.editing = id;
        ui.confirmDelete = false;
        ui.type = null;
        ui.text = '';
        toggle(true);
        card.el.querySelector('.sk-muokkaus textarea')?.focus();
    }

    card.el.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) return toggle(false);
        const el = e.target.closest('[data-sk]');
        if (!el) return;
        const id = el.closest('[data-id]')?.dataset.id;
        switch (el.dataset.sk) {
        case 'tyyppi':
            ui.type = el.dataset.value || null;
            renderList();
            renderFilters();
            break;
        case 'avaa': openFavorite(store.get(id)); break;
        case 'muokkaa': ui.editing = id; ui.confirmDelete = false; renderList(); break;
        case 'peruuta': ui.editing = null; renderList(); break;
        case 'tallenna': {
            const form = el.closest('.sk-muokkaus');
            store.update(id, { name: form.querySelector('input').value, note: form.querySelector('textarea').value });
            ui.editing = null;
            renderList();
            break;
        }
        case 'poista':
            if (!ui.confirmDelete) { ui.confirmDelete = true; renderList(); break; }
            store.remove(id);
            ui.editing = null;
            ui.confirmDelete = false;
            renderList();
            break;
        }
    });

    card.el.addEventListener('input', (e) => {
        if (e.target.matches('.sk-haku')) {
            ui.text = e.target.value;
            renderList();
        }
    });

    function render() {
        if (!ui.open) return;
        card.el.innerHTML = `${cardHeader({ title: T.otsikko, badge: T.kokeilu, closeLabel: T.sulje })}
            <div class="sk-suodatus"></div>
            <input type="search" class="sk-haku" placeholder="${esc(T.hae)}" aria-label="${esc(T.hae)}" value="${esc(ui.text)}">
            <ul class="sk-lista"></ul>
            <p class="sk-huom">${esc(T.vainLaitteella)}</p>`;
        renderFilters();
        renderList();
    }

    function renderFilters() {
        const el = card.el.querySelector('.sk-suodatus');
        if (!el) return;
        const chip = (value, label) => `<button type="button" class="sk-chip" data-sk="tyyppi" data-value="${value}" aria-pressed="${(ui.type || '') === value}">${esc(label)}</button>`;
        el.innerHTML = chip('', T.kaikki) + TYYPIT.map(t => chip(t, T.tyypit[t])).join('');
    }

    function refText(item) {
        if (item.type === 'kiinteisto') return formatCadastralReference(item.ref.reference) || item.ref.reference;
        if (item.type === 'kuvio') return [`${T.tyyppi.kuvio} ${item.ref.standNumber ?? ''}`, item.ref.reference && formatCadastralReference(item.ref.reference)].filter(Boolean).join(' · ');
        return T.tyyppi.haku;
    }

    function itemHtml(item) {
        if (item.id === ui.editing) {
            return `<li class="sk-item sk-muokkaus" data-id="${esc(item.id)}">
                <label>${esc(T.nimi)}<input type="text" value="${esc(item.name)}" maxlength="120"></label>
                <label>${esc(T.muistiinpano)}<textarea rows="4" maxlength="4000" placeholder="${esc(T.muistiinpanoOhje)}">${esc(item.note)}</textarea></label>
                <div class="sk-rivi">
                    <button type="button" class="kortti-btn kortti-primary" data-sk="tallenna">${esc(T.tallenna)}</button>
                </div>
                <div class="sk-rivi">
                    <button type="button" class="kortti-btn" data-sk="peruuta">${esc(T.peruuta)}</button>
                    <button type="button" class="kortti-btn sk-poista" data-sk="poista">${esc(ui.confirmDelete ? T.vahvistaPoisto : T.poista)}</button>
                </div>
            </li>`;
        }
        return `<li class="sk-item" data-id="${esc(item.id)}">
            <div class="sk-tiedot">
                <span class="sk-nimi">${esc(item.name)}</span>
                <span class="sk-tyyppi">${esc(item.type === 'kiinteisto' ? `${T.tyyppi.kiinteisto} · ${refText(item)}` : refText(item))}</span>
                ${item.note ? `<span class="sk-note">${esc(item.note)}</span>` : ''}
            </div>
            <div class="sk-napit">
                <button type="button" class="kortti-btn" data-sk="avaa">${esc(T.avaa)}</button>
                <button type="button" class="kortti-btn kortti-link" data-sk="muokkaa">${esc(T.muokkaa)}</button>
            </div>
        </li>`;
    }

    function renderList() {
        const el = card.el.querySelector('.sk-lista');
        if (!el) return;
        const all = store.list();
        const shown = filterFavorites(all, { type: ui.type, text: ui.text });
        if (!all.length) el.innerHTML = `<li class="sk-tyhja">${esc(T.tyhja)}</li>`;
        else if (!shown.length) el.innerHTML = `<li class="sk-tyhja">${esc(T.eiOsumia)}</li>`;
        else el.innerHTML = shown.map(itemHtml).join('');
    }

    /* ---------- Avaus ---------- */

    function openFavorite(item) {
        if (!item) return;
        marker.clearLayers();
        toggle(false);
        releaseFollow(); // kartta jää avatun kohteen kohdalle
        if (item.type === 'kiinteisto') {
            emit(VIESTIT.avaaKiinteisto, { reference: item.ref.reference });
        } else if (item.type === 'kuvio' && item.ref.reference) {
            pendingStand = { reference: item.ref.reference, standId: item.ref.standId };
            emit(VIESTIT.avaaKiinteisto, { reference: item.ref.reference });
        } else if (item.type === 'kuvio' && item.ref.center) {
            // Ei kiinteistötunnusta (tallennettu lähihausta): kiinteistö kuvion
            // kohdalta ja kuvio auki, kun yhteenveto on piirretty
            pendingStand = { reference: null, standId: item.ref.standId, itemId: item.id };
            const ll = coordsEPSG3067ToLatLng(item.ref.center);
            L.circleMarker(ll, { radius: 9, color: '#e8a317', weight: 3, fillOpacity: 0.3 })
                .bindTooltip(item.name, { permanent: true, direction: 'top' }).addTo(marker);
            state.map.setView(ll, Math.max(state.map.getZoom(), 13));
            // Ensin piste, jolla sovellus liittää kuvion kiinteistöön; jos se on
            // kiinteistöjen ulkopuolella (esim. niemen kuvio, piste vedessä), kuvion sisäpiste
            emit(VIESTIT.avaaKohta, { points: [item.ref.parcelPoint, item.ref.center] });
        } else if (item.type === 'haku') {
            emit(VIESTIT.avaaHaku, { criteria: item.ref.criteria, center: item.ref.center });
        }
    }

    /* ---------- Tähdet kiinteistön yhteenvetoon ---------- */

    const sameRef = (a, b) => a && b && String(a).replace(/\D/g, '') === String(b).replace(/\D/g, '');

    function decorate(ctx) {
        lastSummary = ctx;
        const { content, reference, label, features } = ctx;
        if (!content?.isConnected || !reference) return;
        content.querySelectorAll('.sk-lisa').forEach(el => el.remove());

        const parcelInfo = content.querySelector('.parcel-section .parcel-info');
        if (parcelInfo) {
            const fav = store.get(`k:${reference}`);
            const div = document.createElement('div');
            div.className = 'sk-lisa sk-kiinteisto';
            div.innerHTML = `
                <button type="button" class="sk-tahti-btn" aria-pressed="${Boolean(fav)}">${fav ? '★' : '☆'} ${esc(fav ? T.suosikki : T.lisaa)}</button>
                ${fav?.note ? `<p class="sk-oma"><strong>${esc(T.omaMuistiinpano)}:</strong> ${esc(fav.note)}</p>` : ''}`;
            div.querySelector('button').addEventListener('click', () => {
                const item = fav || store.add({ type: 'kiinteisto', name: label, ref: { reference } });
                openEditor(item.id);
            });
            parcelInfo.after(div);
        }

        content.querySelectorAll('.stand-item').forEach(itemEl => {
            const feature = features[Number(itemEl.dataset.index)];
            const standId = standIdOf(feature);
            if (standId == null) return;
            const fav = store.get(`s:${standId}`);
            const number = feature.properties.STANDNUMBER ?? Number(itemEl.dataset.index) + 1;
            const star = document.createElement('button');
            star.type = 'button';
            star.className = 'sk-lisa sk-tahti';
            star.textContent = fav ? '★' : '☆';
            star.setAttribute('aria-pressed', String(Boolean(fav)));
            star.setAttribute('aria-label', fav ? T.kuvioSuosikki(number) : T.lisaaKuvio(number));
            star.addEventListener('click', (e) => {
                e.stopPropagation(); // ei avaa/sulje kuviota
                const item = fav || store.add({
                    type: 'kuvio',
                    name: T.kuvioNimi(number, label),
                    ref: { standId, standNumber: String(number), reference, center: centerOf(feature.geometry) }
                });
                openEditor(item.id);
            });
            itemEl.querySelector('.stand-title')?.prepend(star);
            if (fav?.note) {
                const note = document.createElement('p');
                note.className = 'sk-lisa sk-oma';
                note.innerHTML = `<strong>${esc(T.omaMuistiinpano)}:</strong> ${esc(fav.note)}`;
                itemEl.querySelector('.stand-details')?.prepend(note);
            }
        });

        if (pendingStand && (pendingStand.reference == null || sameRef(pendingStand.reference, reference))) {
            const { standId, itemId } = pendingStand;
            const index = features.findIndex(f => standIdOf(f) === standId);
            pendingStand = null;
            if (index >= 0) {
                marker.clearLayers();
                openStand(index);
                // Kiinteistö selvisi: seuraavalla kerralla avataan suoraan tunnuksella
                if (itemId) store.setReference(itemId, reference);
            } else {
                // Kuvio ei kuulu kiinteistön kuvioihin: merkki jää kartalle
                showToast(T.kuvioEiListassa);
            }
        }
    }

    on(VIESTIT.yhteenveto, decorate, { replay: true });
    store.onChange(() => {
        if (lastSummary) decorate(lastSummary);
        if (ui.open && !ui.editing) renderList();
    });

    /* ---------- Tallennus muista toiminnoista ---------- */

    on(VIESTIT.tallennaSuosikki, ({ type, name, ref }) => {
        const item = store.add({ type, name, ref });
        openEditor(item.id);
    });
}
