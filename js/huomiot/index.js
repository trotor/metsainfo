/**
 * Huomiot (kokeilu, #33): pistemuotoiset muistiinpanot kartalle. Huomio
 * tallennetaan tarkkaan koordinaattiin (EPSG:3067) ja liitetään kiinteistöön
 * ja kuvioon, joilla piste on. Näkyy kartalla merkkinä sekä kiinteistön ja
 * kuvion tiedoissa. Hinta-arvion lisäosaa (js/features.js 'huomiot').
 * Vain kokeilubuildissa (VITE_KOKEILU=1, dynaaminen import app.js:ssä).
 * Suunnitelma: docs/plans/2026-11-17-huomiot-design.md
 *
 * Ei jakoa eikä vientiä vielä (Tero 17.11.2026); tallennusmuoto sallii sen myöhemmin.
 * Valokuvat (#37): enintään 5 kuvaa huomiota kohden, sovelluksen omissa tiedostoissa
 * (js/platform/kuvat.js); kameralla otettu kuva myös laitteen kuvagalleriaan.
 */

import './huomiot.css';
import * as state from '../state.js';
import { on, emit, VIESTIT } from '../vayla.js';
import { coordsEPSG3067ToLatLng } from '../utils.js';
import { locale } from '../i18n.js';
import { isUnlocked, kokeiluMerkki } from '../features.js';
import { purchases } from '../platform/purchases.js';
import { isStale } from '../location/logic.js';
import { isMobileLayout } from '../ui/layout.js';
import { showToast, onPositionChange, requestLocation } from '../ui/location-ui.js';
import { createCard, cardHeader } from '../ui/kortti.js';
import { registerTool } from '../ui/tyokalut.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { showPaywall } from '../ui/estimate.js';
import { takePhoto, choosePhoto, photoSrc, photoIo } from '../platform/kuvat.js';
import { TYYPIT, createNotes } from './varasto.js';
import { MAX_KUVAT, newPhotoId, commitPhotos, removeAllPhotos } from './kuvat.js';
import { standRefOf, linkFromSummary, formatCoords, notesFor } from './logiikka.js';
import { T } from './teksti.js';

const ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.5c-3.6 0-6.5 2.8-6.5 6.4 0 4.7 6.5 12.6 6.5 12.6s6.5-7.9 6.5-12.6c0-3.6-2.9-6.4-6.5-6.4z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M9.5 9h5M12 6.5v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const MERKIT = { tuulenkaato: '⟋', rajapyykki: '◆', oja: '≈', varasto: '▤', muu: '!' };
const LOCATE_TIMEOUT_MS = 15000;
const PARCEL_TIMEOUT_MS = 10000;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const locked = () => !isUnlocked('huomiot');
const cm = (v) => Math.round(v * 100) / 100;
const fromWgs = (lon, lat) => proj4('WGS84', 'EPSG:3067', [lon, lat]).map(cm);
const toPoint = (latlng) => fromWgs(latlng.lng, latlng.lat);
const dateOf = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(locale());
};
/** Kuvion avain valintalistaan: tunnus, tai numero, jos tunnus puuttuu (esim. esimerkkimetsä). */
const standKey = (ref) => (ref ? (ref.standId != null ? `id:${ref.standId}` : `nro:${ref.standNumber}`) : '');

export function startHuomiot() {
    addHelpSection({ id: 'huomiot', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });

    const store = createNotes();
    const ui = {
        view: 'list',          // list | choose | edit
        ctx: null,             // viimeisin yhteenveto (VIESTIT.yhteenveto)
        draft: null,           // muokattava huomio { id?, point, accuracy?, title, type, text, parcel, stand }
        standChosen: false,    // käyttäjä valitsi kuvion itse: ei korvata automaattisesti
        standOptions: [],      // kuvion valintalistan kuviot (näkymän piirtohetkeltä)
        tapping: false,
        locating: false,
        confirmDelete: false,
        saving: false,
        show: true
    };
    // Tallennettujen kuvien osoitteet (polku → <img src>)
    const srcCache = new Map();
    // Kiinteistön avaus pisteestä kesken: { draft } (muokattava) tai { id } (jo tallennettu), point
    let pending = null;
    let parcelTimer = null;
    let stopLocating = null;

    /* ---------- Kartta ---------- */

    const layer = L.layerGroup();
    let draftMarker = null;

    const iconFor = (type, editing = false) => L.divIcon({
        className: `hu-merkki hu-${type}${editing ? ' hu-muokattava' : ''}`,
        html: `<span>${MERKIT[type] || '!'}</span>`,
        iconSize: [28, 28], iconAnchor: [14, 14]
    });

    function drawMarkers() {
        layer.clearLayers();
        draftMarker = null;
        if (locked() || (!ui.show && !ui.draft)) { layer.remove(); return; }
        for (const n of store.list()) {
            if (ui.draft?.id === n.id || !ui.show) continue;
            const m = L.marker(coordsEPSG3067ToLatLng(n.point), { icon: iconFor(n.type), title: n.title || T.nimeton, keyboard: true });
            m.on('click', () => openNote(n.id));
            layer.addLayer(m);
        }
        if (ui.draft?.point) {
            draftMarker = L.marker(coordsEPSG3067ToLatLng(ui.draft.point), {
                icon: iconFor(ui.draft.type, true), draggable: true, zIndexOffset: 1000, keyboard: false
            });
            draftMarker.on('dragend', () => setPoint(toPoint(draftMarker.getLatLng()), undefined, { dragged: true }));
            layer.addLayer(draftMarker);
        }
        layer.addTo(state.map);
    }

    /** Puhelimessa kortti peittää kartan alaosan: piste näkyviin yläosaan. */
    function revealPoint(point) {
        if (!isMobileLayout()) return;
        const map = state.map;
        const at = map.latLngToContainerPoint(coordsEPSG3067ToLatLng(point));
        map.panBy([0, at.y - map.getSize().y * 0.22], { animate: true });
    }

    /* ---------- Napautustila ja sijainti (vain toinen kerrallaan) ---------- */

    function onMapTap(e) {
        if (!ui.tapping) return;
        setPoint(toPoint(e.latlng));
    }

    function startTap() {
        stopLocate();
        ui.tapping = true;
        // Vektoritasot läpäisevät napautuksen: piste ei valitse kiinteistöä eikä kuviota
        state.map.getContainer().classList.add('hu-napautus');
        state.map.on('click', onMapTap);
        if (isMobileLayout()) card.close(); // kartta näkyviin; siru tuo kortin takaisin
        showToast(T.napautaOhje, 4000);
        render();
    }

    function stopTap() {
        if (!ui.tapping) return;
        ui.tapping = false;
        state.map.getContainer().classList.remove('hu-napautus');
        state.map.off('click', onMapTap);
        sync();
    }

    function startLocate() {
        stopTap();
        stopLocate();
        ui.locating = true;
        render();
        requestLocation();
        let done = false;
        let off = null;
        const timer = setTimeout(() => {
            if (!ui.locating) return;
            stopLocate();
            showToast(T.eiSijaintia);
            render();
        }, LOCATE_TIMEOUT_MS);
        stopLocating = () => { done = true; clearTimeout(timer); off?.(); off = null; };
        off = onPositionChange((pos) => {
            // Välimuistissa oleva vanha sijainti (katko maastossa) ei kelpaa: odotetaan tuoretta
            if (done || !ui.locating || !pos || isStale(pos.timestamp, Date.now())) return;
            done = true; // vain ensimmäinen tuore sijainti
            const point = fromWgs(pos.lon, pos.lat);
            queueMicrotask(() => setPoint(point, pos.accuracy)); // tilaus valmis ennen purkua
        });
    }

    function stopLocate() {
        ui.locating = false;
        stopLocating?.();
        stopLocating = null;
    }

    /* ---------- Huomion piste, kiinteistö ja kuvio ---------- */

    function newDraft() {
        return { point: null, title: '', type: 'muu', text: '', parcel: null, stand: null, photos: [] };
    }

    function setPoint(point, accuracy, { dragged = false } = {}) {
        stopTap();
        stopLocate();
        if (!ui.draft) ui.draft = newDraft();
        readFormSafe(); // kirjoitettu mutta tallentamaton teksti säilyy
        ui.draft.point = point;
        if (!dragged) ui.draft.accuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : undefined;
        else delete ui.draft.accuracy; // siirretty käsin: sijainnin tarkkuus ei enää koske pistettä
        if (dragged) ui.standChosen = false;
        relink();
        ui.view = 'edit';
        ui.confirmDelete = false;
        card.open();
        drawMarkers();
        render();
        if (!dragged) revealPoint(point);
    }

    function cancelPendingDraft() {
        if (pending?.draft) { pending = null; clearTimeout(parcelTimer); }
    }

    function relink() {
        const d = ui.draft;
        const link = linkFromSummary(ui.ctx, d.point);
        d.parcel = link.parcel;
        if (!ui.standChosen) d.stand = link.stand;
        cancelPendingDraft();
        // Kiinteistöä ei ole auki pisteen kohdalla: sovellus avaa sen, ja seuraava yhteenveto täyttää liitoksen
        if (!link.parcel && !(ui.ctx?.parcel?.properties?.valinta && link.stand)) {
            pending = { draft: d, point: d.point };
            emit(VIESTIT.avaaKohta, { points: [d.point] });
            clearTimeout(parcelTimer);
            parcelTimer = setTimeout(() => { pending = null; updateLinkRows(); }, PARCEL_TIMEOUT_MS);
        }
    }

    /** Yhteenveto saapui: täydennä kesken jäänyt liitos (muokattava tai jo tallennettu huomio). */
    function completePending(ctx) {
        if (!pending) return;
        const link = linkFromSummary(ctx, pending.point);
        if (pending.draft) {
            if (pending.draft === ui.draft) {
                ui.draft.parcel = link.parcel;
                if (!ui.standChosen) ui.draft.stand = link.stand;
            }
        } else if (pending.id && link.parcel) {
            const n = store.get(pending.id);
            if (n && !n.parcel) store.update(pending.id, { parcel: link.parcel, ...(pending.standChosen || n.stand ? {} : { stand: link.stand }) });
        }
        pending = null;
        clearTimeout(parcelTimer);
    }

    function openNote(id) {
        const n = store.get(id);
        if (!n) return;
        stopTap();
        stopLocate();
        cancelPendingDraft();
        ui.draft = { ...n, point: [...n.point], photos: (n.photos || []).map(p => ({ ...p })) };
        ui.standChosen = true; // tallennettu kuvio pysyy, kunnes käyttäjä muuttaa sitä tai siirtää pistettä
        ui.view = 'edit';
        ui.confirmDelete = false;
        card.open();
        state.map.setView(coordsEPSG3067ToLatLng(n.point), Math.max(state.map.getZoom(), 14), { animate: false });
        drawMarkers();
        render();
        revealPoint(n.point);
    }

    function readForm() {
        const f = card.el.querySelector('.hu-lomake');
        if (!f || !ui.draft) return;
        ui.draft.title = f.querySelector('[name=title]').value;
        ui.draft.type = f.querySelector('[name=type]').value;
        ui.draft.text = f.querySelector('[name=text]').value;
    }

    function readFormSafe() {
        if (ui.view === 'edit' && card.el.querySelector('.hu-lomake')) readForm();
    }

    async function save() {
        readForm();
        const d = ui.draft;
        if (!d?.point || ui.saving) return;
        ui.saving = true;
        render();
        const fields = { point: d.point, title: d.title, type: d.type, text: d.text, parcel: d.parcel, stand: d.stand, accuracy: d.accuracy };
        const before = d.id ? (store.get(d.id)?.photos || []) : [];
        let item = d.id ? store.update(d.id, fields) : store.add(fields);
        // Kiinteistö vielä tulossa: täydennetään tallennettuun huomioon, kun yhteenveto saapuu
        if (pending?.draft === d && item) pending = { id: item.id, point: d.point, standChosen: ui.standChosen };
        let failed = 0;
        if (item) {
            // Kuvat kirjoitetaan vasta nyt (huomion tunnus tiedossa); poistetut kuvat pois
            const r = await commitPhotos({ noteId: item.id, before, draft: d.photos || [], io: photoIo });
            failed = r.failed;
            item = store.update(item.id, { photos: r.photos }) || item;
        }
        ui.saving = false;
        if (failed) showToast(T.kuviaEiTallennettu(failed), 8000);
        else showToast(store.saved ? T.tallennettu : T.eiTallennettu, store.saved ? 2500 : 8000);
        if (ui.draft === d) toList();
        else render();
    }

    /* ---------- Kuvat ---------- */

    async function addPhoto(source) {
        readFormSafe();
        const d = ui.draft;
        if (!d || (d.photos || []).length >= MAX_KUVAT) return;
        try {
            const photo = await (source === 'camera' ? takePhoto() : choosePhoto());
            if (!photo || ui.draft !== d) return; // peruttu tai huomio vaihtui kesken
            d.photos = [...(d.photos || []), { id: newPhotoId(), ...photo }];
            readFormSafe();
            render();
        } catch {
            showToast(T.kuvaEiOnnistunut, 6000);
        }
    }

    function removeDraftPhoto(id) {
        readFormSafe();
        if (!ui.draft) return;
        ui.draft.photos = (ui.draft.photos || []).filter(p => p.id !== id);
        render();
    }

    /** Tallennettujen kuvien osoitteet haetaan piirron jälkeen. */
    function fillPhotos() {
        card.el.querySelectorAll('img[data-path]').forEach(async (img) => {
            const path = img.dataset.path;
            try {
                const src = srcCache.get(path) || await photoSrc(path);
                srcCache.set(path, src);
                if (img.isConnected) img.src = src;
            } catch {
                // Tiedosto puuttuu: pikkukuva jää tyhjäksi, viitteen voi poistaa
            }
        });
    }

    function closeViewer() {
        document.querySelector('.hu-katselu')?.remove();
        document.removeEventListener('keydown', onViewerKey);
    }

    function onViewerKey(e) {
        if (e.key === 'Escape') closeViewer();
    }

    function openViewer(img) {
        const src = img?.currentSrc || img?.getAttribute('src');
        if (!src) return;
        closeViewer();
        const el = document.createElement('div');
        el.className = 'hu-katselu';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('aria-label', img.alt);
        el.innerHTML = `<img alt="${esc(img.alt)}"><button type="button" class="hu-katselu-sulje" aria-label="${esc(T.suljeKuva)}">×</button>`;
        el.querySelector('img').src = src;
        el.addEventListener('click', closeViewer);
        document.addEventListener('keydown', onViewerKey);
        document.body.appendChild(el);
        el.querySelector('button').focus();
    }

    function toList() {
        stopTap();
        stopLocate();
        cancelPendingDraft();
        ui.draft = null;
        ui.view = 'list';
        ui.confirmDelete = false;
        drawMarkers();
        render();
    }

    /* ---------- Kortti ---------- */

    // notifyHidden: puhelimessa kortti on piilossa napautustilan ajan, mutta tila päättyy silti,
    // kun toinen kortti avautuu (muuten kartan kuviot jäisivät napautuksia läpäiseviksi)
    const card = createCard({ id: 'huomiot', label: T.nappi, className: 'huomiot-kortti', onClose: () => close(), notifyHidden: true });

    const tool = registerTool({
        id: 'huomiot', label: T.nappi, description: T.kuvaus, icon: ICON, order: 40,
        onSelect: () => openCard(), onStop: () => close(), locked
    });
    const sync = () => tool.setStatus({ active: card.isOpen || ui.tapping || ui.locating, cardOpen: card.isOpen, detail: String(store.list().length) });

    function openCard() {
        if (locked()) { showPaywall(); return; }
        readFormSafe();
        card.open();
        render();
    }

    function close() {
        toList();
        card.close();
        sync();
    }

    card.el.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) return close();
        const el = e.target.closest('[data-hu]');
        if (!el) return;
        const action = el.dataset.hu;
        if (action === 'uusi') { ui.draft = newDraft(); ui.standChosen = false; ui.view = 'choose'; render(); }
        else if (action === 'tahan') startLocate();
        else if (action === 'napauta') startTap();
        else if (action === 'takaisin') toList();
        else if (action === 'avaa') openNote(el.dataset.id);
        else if (action === 'tallenna') save();
        else if (action === 'ota-kuva') addPhoto('camera');
        else if (action === 'valitse-kuva') addPhoto('photos');
        else if (action === 'poista-kuva') removeDraftPhoto(el.dataset.kuva);
        else if (action === 'nayta-kuva') openViewer(el.querySelector('img'));
        else if (action === 'poista') {
            if (!ui.confirmDelete) { ui.confirmDelete = true; readForm(); render(); return; }
            if (ui.draft?.id) {
                // Sovelluksen kopiot pois; gallerian kuvat jäävät
                const note = store.get(ui.draft.id);
                if (note) removeAllPhotos(note, photoIo);
                store.remove(ui.draft.id);
            }
            toList();
        }
    });

    card.el.addEventListener('change', (e) => {
        if (e.target.name === 'nayta') { ui.show = e.target.checked; drawMarkers(); return; }
        if (e.target.name === 'stand' && ui.draft) {
            ui.standChosen = true;
            const key = e.target.value;
            if (key === '') ui.draft.stand = null;
            else {
                const hit = ui.standOptions.find(o => o.key === key);
                if (hit) ui.draft.stand = hit.ref;
            }
            return;
        }
        if (e.target.name === 'type' && ui.draft) { readForm(); drawMarkers(); }
    });

    function listHtml() {
        const notes = store.list();
        if (!notes.length) return `<p class="hu-teksti">${esc(T.tyhja)}</p>`;
        const ref = ui.ctx?.reference;
        const own = ref ? notesFor(notes, { reference: ref }) : [];
        const ordered = [...own, ...notes.filter(n => !own.includes(n))];
        return `<ul class="hu-lista">${ordered.map(n => {
            const where = [n.parcel?.label, n.stand ? T.kuvioNro(n.stand.standNumber) : ''].filter(Boolean).join(' · ');
            return `<li><button type="button" class="hu-rivi" data-hu="avaa" data-id="${esc(n.id)}">
                <span class="hu-ikoni hu-${esc(n.type)}" aria-hidden="true">${MERKIT[n.type] || '!'}</span>
                <span class="hu-rivi-teksti"><strong>${esc(n.title || T.nimeton)}</strong>
                <span class="hu-pieni">${esc([T.tyypit[n.type], where, dateOf(n.created), n.photos?.length ? T.kuviaMaara(n.photos.length) : ''].filter(Boolean).join(' · '))}</span></span>
            </button></li>`;
        }).join('')}</ul>`;
    }

    /** Kuvion valintalista avoimen kiinteistön (tai kuviovalinnan) kuvioista; avaimet talteen muutoksen tulkintaan. */
    function standOptionsHtml(d) {
        const sameParcel = d.parcel && ui.ctx?.reference === d.parcel.reference;
        const valinta = !d.parcel && ui.ctx?.parcel?.properties?.valinta;
        const features = (sameParcel || valinta) ? ui.ctx.features || [] : [];
        ui.standOptions = features.map((f, i) => {
            const ref = standRefOf(f, i);
            return { key: standKey(ref), ref, label: T.kuvioNro(ref.standNumber), n: Number(ref.standNumber) };
        }).sort((a, b) => (a.n - b.n) || 0);
        const current = standKey(d.stand);
        const known = ui.standOptions.some(o => o.key === current);
        if (d.stand && !known) ui.standOptions.unshift({ key: current, ref: d.stand, label: T.kuvioNro(d.stand.standNumber) });
        return `<option value=""${d.stand ? '' : ' selected'}>${esc(T.eiKuviota)}</option>${ui.standOptions.map(o => `<option value="${esc(o.key)}"${o.key === current ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}`;
    }

    const parcelText = (d) => (pending?.draft === d ? T.haetaanKiinteistoa : (d.parcel?.label || T.eiKiinteistoa));

    /** Kiinteistö ja kuvio päivitetään paikallaan: kirjoitus ja näppäimistö eivät katkea. */
    function updateLinkRows() {
        const f = card.el.querySelector('.hu-lomake');
        if (!f || !ui.draft || ui.view !== 'edit') return;
        const p = f.querySelector('.hu-kiinteisto');
        if (p) p.textContent = parcelText(ui.draft);
        const s = f.querySelector('[name=stand]');
        if (s && document.activeElement !== s) s.innerHTML = standOptionsHtml(ui.draft);
    }

    function photosHtml(d) {
        const photos = d.photos || [];
        const thumbs = photos.map((p, i) => `<div class="hu-kuva">
            <button type="button" class="hu-kuva-avaa" data-hu="nayta-kuva" data-kuva="${esc(p.id)}"><img alt="${esc(T.kuvaAlt(i + 1))}" ${p.src ? `src="${esc(p.src)}"` : `data-path="${esc(p.path)}"`}></button>
            <button type="button" class="hu-kuva-pois" data-hu="poista-kuva" data-kuva="${esc(p.id)}" aria-label="${esc(`${T.poistaKuva} ${i + 1}`)}">×</button>
        </div>`).join('');
        const add = photos.length >= MAX_KUVAT
            ? `<p class="hu-pieni">${esc(T.kuvatMax(MAX_KUVAT))}</p>`
            : `<div class="hu-actions"><button type="button" class="kortti-btn" data-hu="ota-kuva">${esc(T.otaKuva)}</button><button type="button" class="kortti-btn" data-hu="valitse-kuva">${esc(T.valitseKuva)}</button></div>
               <p class="hu-pieni">${esc(T.kuvaGalleriaan)}</p>`;
        return `<div class="hu-kuvat-osio"><span class="hu-osio-otsikko">${esc(T.kuvat)}</span>${thumbs ? `<div class="hu-kuvat">${thumbs}</div>` : ''}${add}</div>`;
    }

    function editHtml() {
        const d = ui.draft;
        const c = formatCoords(d.point);
        return `<form class="hu-lomake" onsubmit="return false">
            <label>${esc(T.otsikkoKentta)}<input name="title" type="text" maxlength="120" value="${esc(d.title)}" placeholder="${esc(T.otsikkoOhje)}"></label>
            <label>${esc(T.tyyppiKentta)}<select name="type">${TYYPIT.map(t => `<option value="${t}"${t === d.type ? ' selected' : ''}>${esc(T.tyypit[t])}</option>`).join('')}</select></label>
            <label>${esc(T.tekstiKentta)}<textarea name="text" rows="3" maxlength="2000" placeholder="${esc(T.tekstiOhje)}">${esc(d.text)}</textarea></label>
            ${photosHtml(d)}
            <div class="hu-rivi-tieto"><span>${esc(T.kiinteisto)}</span><span class="hu-kiinteisto">${esc(parcelText(d))}</span></div>
            <label>${esc(T.kuvio)}<select name="stand">${standOptionsHtml(d)}</select></label>
            <div class="hu-rivi-tieto"><span>${esc(T.koordinaatit)}</span><span>N ${esc(c.n)} E ${esc(c.e)}<br><span class="hu-pieni">${esc(c.lat)}, ${esc(c.lon)}${d.accuracy ? ` · ${esc(T.tarkkuus(d.accuracy))}` : ''}</span></span></div>
            <p class="hu-pieni">${esc(T.siirraOhje)}</p>
            <button type="button" class="kortti-btn kortti-primary" data-hu="tallenna"${ui.saving ? ' disabled' : ''}>${esc(T.tallenna)}</button>
            <div class="hu-actions">
                <button type="button" class="kortti-btn" data-hu="takaisin">${esc(T.takaisin)}</button>
                ${d.id ? `<button type="button" class="kortti-btn hu-poista" data-hu="poista">${esc(ui.confirmDelete ? T.vahvistaPoisto : T.poista)}</button>` : ''}
            </div>
        </form>`;
    }

    function render() {
        sync();
        if (!card.isOpen) return;
        let body;
        if (ui.view === 'edit' && ui.draft?.point) body = editHtml();
        else if (ui.view === 'choose') {
            body = `<div class="hu-valinta">
                <button type="button" class="kortti-btn kortti-primary" data-hu="tahan" ${ui.locating ? 'disabled' : ''}>${esc(ui.locating ? T.haetaanSijaintia : T.tahan)}</button>
                <button type="button" class="kortti-btn" data-hu="napauta">${esc(T.napauta)}</button>
                ${ui.tapping ? `<p class="hu-teksti">${esc(T.napautaOhje)}</p>` : ''}
                <button type="button" class="kortti-btn" data-hu="takaisin">${esc(T.takaisin)}</button>
            </div>`;
        } else {
            body = `<button type="button" class="kortti-btn kortti-primary" data-hu="uusi">${esc(T.uusi)}</button>
                <label class="hu-nayta"><input type="checkbox" name="nayta" ${ui.show ? 'checked' : ''}> ${esc(T.nayta)}</label>
                ${listHtml()}`;
        }
        card.el.innerHTML = `${cardHeader({ title: T.otsikko, badge: kokeiluMerkki('huomiot', T.kokeilu), closeLabel: T.sulje, feature: 'huomiot' })}
            <div class="hu-body">${body}<p class="hu-pieni hu-huom">${esc(T.vainLaitteella)}</p></div>`;
        fillPhotos();
    }

    /* ---------- Kiinteistön ja kuvion tiedot ---------- */

    function decorate() {
        const content = ui.ctx?.content;
        if (!content?.isConnected) return;
        content.querySelectorAll('.hu-lisa').forEach(el => el.remove());
        if (locked()) return;
        const notes = store.list();
        const ref = ui.ctx.reference;
        const own = ref && !ui.ctx.parcel?.properties?.valinta ? notesFor(notes, { reference: ref }) : [];
        const anchor = content.querySelector('.parcel-section');
        if (own.length && anchor) {
            const div = document.createElement('div');
            div.className = 'hu-lisa hu-yhteenveto';
            div.innerHTML = `<button type="button" class="hu-linkki">${esc(T.huomiotMaara(own.length))}</button>`;
            div.querySelector('button').addEventListener('click', () => { if (ui.view !== 'edit') ui.view = 'list'; openCard(); });
            anchor.appendChild(div);
        }
        content.querySelectorAll('.stand-item').forEach(itemEl => {
            const i = Number(itemEl.dataset.index);
            const f = ui.ctx.features?.[i];
            if (!f) return;
            const ref = standRefOf(f, i);
            if (ref.standId == null) return; // ilman tunnusta kuviota ei voi yhdistää huomioihin luotettavasti
            const hits = notesFor(notes, { standId: ref.standId });
            const details = itemEl.querySelector('.stand-details');
            if (!hits.length || !details) return;
            const div = document.createElement('div');
            div.className = 'detail-group hu-lisa hu-kuvio';
            div.innerHTML = `<p><strong>${esc(T.kuvionHuomiot)}:</strong> ${hits.map(n => `<button type="button" class="hu-linkki" data-id="${esc(n.id)}">${esc(n.title || T.nimeton)}</button>`).join(', ')}</p>`;
            div.addEventListener('click', (e) => {
                const id = e.target.closest('[data-id]')?.dataset.id;
                if (id) { e.stopPropagation(); openNote(id); }
            });
            const footer = details.querySelector('.detail-footer');
            if (footer) footer.before(div); else details.appendChild(div);
        });
    }

    /* ---------- Viestit ---------- */

    on(VIESTIT.yhteenveto, (ctx) => {
        ui.ctx = ctx;
        completePending(ctx);
        updateLinkRows();
        decorate();
    }, { replay: true });

    on(VIESTIT.tyhjennys, () => { ui.ctx = null; updateLinkRows(); });

    store.onChange(() => { decorate(); sync(); });
    purchases.onChange(() => {
        if (locked() && (card.isOpen || ui.draft || ui.tapping)) close(); // osto peruttu tai oikeus poistui
        drawMarkers();
        decorate();
        sync();
    });

    drawMarkers();
    sync();
}
