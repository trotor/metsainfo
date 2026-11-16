/**
 * Maastotila (kokeilu, #26 ja #27): "Kerro tästä paikasta" -kortti ja
 * metsävisa sijainnin kuviosta. Mukana vain kokeilubuildissa
 * (VITE_KOKEILU=1); app.js lataa tämän dynaamisella importilla, joten
 * tavallinen build (verkko, App Store, Google Play) ei sisällä tätä koodia.
 */

import './maasto.css';
import * as state from '../state.js';
import { formatNumber } from '../utils.js';
import { latLonTo3067 } from '../location/logic.js';
import { coordsEPSG3067ToLatLng } from '../utils.js';
import { isMobileLayout, onLayoutChange } from '../ui/layout.js';
import { onPositionChange, requestLocation } from '../ui/location-ui.js';
import { tip, initTips } from '../ui/tips.js';
import { tileKey, neighbourKeys, fetchTile } from './rest.js';
import { standAt, placeStatus, describePlace } from './paikka.js';
import { LEVELS, nextQuestion, questionsFor, scoreAnswer, answerLabel } from './visa.js';
import { createStore } from './tila.js';
import { T, arvonimi } from './teksti.js';
import { purchases } from '../platform/purchases.js';

const ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2 6 10h3l-4 6h5v6h4v-6h5l-4-6h3z" fill="currentColor"/></svg>';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Maastotila kuuluu kokeiluvaiheessa hinta-arvion lisäosaan (sama kertaosto).
 * Ilman ostoa näkyy kuvio ja pääkappale, ja ostonäkymä aukeaa hinta-arvion
 * omasta painikkeesta (data-est="paywall", js/ui/estimate.js). Verkossa
 * ostoja ei ole, joten kehitysselaimessa tila on auki.
 */
function locked() {
    return purchases.isAvailable() && !purchases.isEntitled();
}

export function startMaasto() {
    const store = createStore();
    purchases.onChange(() => update());
    const tiles = new Map(); // key → { status: 'loading' | 'ok' | 'error', stands }

    const ui = {
        open: false,
        view: 'place',       // place | quiz
        pos: null,
        point: null,
        stand: null,
        status: 'waiting',   // waiting | inaccurate | loading | error | none | edge | ok
        question: null,
        questionStand: null,
        feedback: null,      // { correct, text, points }
        flash: null
    };

    /* ---------- Kartta: painike ja kuvion korostus ---------- */

    const highlight = L.geoJSON(null, {
        style: { color: '#e8a317', weight: 4, fill: true, fillColor: '#e8a317', fillOpacity: 0.12 },
        interactive: false,
        coordsToLatLng: coordsEPSG3067ToLatLng
    }).addTo(state.map);

    const Control = L.Control.extend({
        onAdd() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control maasto-control');
            const btn = L.DomUtil.create('a', 'maasto-btn', container);
            btn.href = '#';
            btn.setAttribute('role', 'button');
            btn.setAttribute('aria-label', T.nappi);
            btn.title = T.nappi;
            btn.innerHTML = ICON;
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(btn, 'click', (e) => {
                L.DomEvent.preventDefault(e);
                toggle();
            });
            return container;
        }
    });
    const position = () => (isMobileLayout() ? 'topright' : 'topleft');
    const control = new Control({ position: position() }).addTo(state.map);
    onLayoutChange(() => control.setPosition(position()));

    /* ---------- Kortti ---------- */

    const card = document.createElement('section');
    card.className = 'maasto-kortti';
    card.hidden = true;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', T.nappi);
    document.body.appendChild(card);
    initTips(card);

    card.addEventListener('click', (e) => {
        const el = e.target.closest('[data-mk]');
        if (!el) return;
        const action = el.dataset.mk;
        if (action === 'close') toggle(false);
        else if (action === 'quiz' && !locked()) { ui.view = 'quiz'; pickQuestion(); render(); }
        else if (action === 'place') { ui.view = 'place'; ui.feedback = null; render(); }
        else if (action === 'retry') { tiles.delete(tileKey(ui.point)); update(); }
        else if (action === 'level') { store.setLevel(el.dataset.level); ui.feedback = null; pickQuestion(); render(); }
        else if (action === 'answer') answer(el.dataset.value);
        else if (action === 'next') { ui.feedback = null; pickQuestion(); render(); }
    });

    function toggle(force) {
        ui.open = force ?? !ui.open;
        card.hidden = !ui.open;
        document.documentElement.classList.toggle('maasto-auki', ui.open);
        if (ui.open) {
            requestLocation();
            update();
        } else {
            highlight.clearLayers();
        }
    }

    /* ---------- Sijainti → kuvio ---------- */

    function ensureTile(key) {
        if (tiles.has(key)) return tiles.get(key);
        const entry = { status: 'loading', stands: [] };
        tiles.set(key, entry);
        fetchTile(key).then(stands => {
            entry.status = 'ok';
            entry.stands = stands;
        }).catch(() => {
            entry.status = 'error';
        }).finally(() => {
            update();
            if (entry.status === 'ok') prefetch(key);
        });
        return entry;
    }

    // Naapuriruudut taustalla yksi kerrallaan: kävely viereiseen ruutuun
    // toimii katvealueella, kun sovellus on ollut auki ruudun haun ajan.
    const queue = [];
    let prefetching = false;
    async function prefetch(key) {
        for (const k of neighbourKeys(key)) if (!tiles.has(k) && !queue.includes(k)) queue.push(k);
        if (prefetching) return;
        prefetching = true;
        while (queue.length) {
            const k = queue.shift();
            if (tiles.has(k)) continue;
            const entry = { status: 'loading', stands: [] };
            tiles.set(k, entry);
            try {
                entry.stands = await fetchTile(k);
                entry.status = 'ok';
            } catch {
                tiles.delete(k); // yritetään uudelleen, kun ruutuun tullaan
            }
            // Käyttäjä ehti ruutuun, jota esihaettiin
            if (ui.point && tileKey(ui.point) === k) update();
        }
        prefetching = false;
    }

    function update() {
        if (!ui.open) return;
        const pos = ui.pos;
        if (!pos) {
            ui.status = 'waiting';
            ui.stand = null;
            return render();
        }
        ui.point = latLonTo3067(pos.lat, pos.lon);
        const entry = ensureTile(tileKey(ui.point));
        if (entry.status !== 'ok') {
            ui.status = entry.status;
            return render();
        }
        const stand = standAt(entry.stands, ui.point);
        const status = placeStatus({ stand, point: ui.point, accuracy: pos.accuracy });
        const changed = stand?.properties.STANDID !== ui.stand?.properties.STANDID;
        ui.status = status;
        ui.stand = status === 'inaccurate' ? null : stand;

        if (changed) {
            highlight.clearLayers();
            if (ui.stand) highlight.addData(ui.stand);
            if (!ui.feedback) ui.question = null;
        }
        if (locked()) ui.view = 'place';
        if (status === 'ok' && !locked()) {
            const gained = store.visit(stand.properties.STANDID);
            if (gained) ui.flash = T.uusiKuvio(gained);
        }
        if (ui.view === 'quiz' && !ui.question && !ui.feedback) pickQuestion();
        render();
    }

    onPositionChange((pos) => {
        ui.pos = pos;
        update();
    });

    /* ---------- Visa ---------- */

    function pickQuestion() {
        ui.question = null;
        ui.questionStand = null;
        if (ui.status !== 'ok' || !ui.stand) return;
        const id = ui.stand.properties.STANDID;
        ui.question = nextQuestion(ui.stand.properties, store.level, store.answered(id));
        ui.questionStand = ui.stand;
    }

    function answer(raw) {
        const q = ui.question;
        const stand = ui.questionStand;
        if (!q || !stand || ui.feedback) return;
        const value = q.options.find(o => String(o.value) === raw)?.value;
        const result = scoreAnswer(q, value, store.streak);
        store.record(stand.properties.STANDID, q, value, result, {
            question: q.id, dataDate: stand.properties.TREESTANDDATE
        });
        ui.feedback = q.kind === 'observe'
            ? { correct: null, text: T.kiitosHavainnosta, points: result.points, chosen: value }
            : {
                correct: result.correct,
                text: `${result.correct ? T.oikein : T.vaarin(answerLabel(q))} ${q.explain}`,
                points: result.points,
                bonus: result.bonus,
                chosen: value
            };
        render();
    }

    /* ---------- Piirto ---------- */

    function scoreBar() {
        const parts = [
            `<strong>${esc(arvonimi(store.points))}</strong>`,
            esc(T.pisteet(formatNumber(store.points, 0))),
            esc(T.kuviot(store.standCount))
        ];
        if (store.streak >= 2) parts.push(esc(T.putki(store.streak)));
        return `<div class="mk-score">${parts.join('<span aria-hidden="true"> · </span>')}</div>`;
    }

    function statusHtml() {
        const acc = Math.round(ui.pos?.accuracy ?? 0);
        switch (ui.status) {
        case 'waiting': return `<p class="mk-status">${esc(T.haetaanSijaintia)}</p>`;
        case 'inaccurate': return `<p class="mk-status">${esc(T.epatarkka(acc))}</p>`;
        case 'loading': return `<p class="mk-status">${esc(T.haetaanKuvioita)}</p>`;
        case 'error': return `<p class="mk-status">${esc(T.eiVerkkoa)}</p><button type="button" class="mk-btn" data-mk="retry">Yritä uudelleen</button>`;
        case 'none': return `<p class="mk-status">${esc(T.eiKuviota)}</p>`;
        default: return '';
        }
    }

    function placeHtml() {
        const p = ui.stand.properties;
        const d = describePlace(p);
        const area = p.AREA != null ? formatNumber(p.AREA, 1) : '–';
        const edge = ui.status === 'edge'
            ? `<p class="mk-edge">${esc(T.reunalla(Math.round(ui.pos.accuracy)))}</p>` : '';
        if (locked()) {
            return `
            <p class="mk-kuvio">${esc(T.kuvio(p.STANDNUMBER ?? '–', area))}</p>
            <p class="mk-lead">${esc(d.lead)}</p>
            ${edge}
            <div class="mk-locked">
                <p>${esc(T.lukittu)}</p>
                <button type="button" class="mk-btn mk-primary" data-est="paywall">${esc(T.avaaLisaosa)}</button>
            </div>`;
        }
        const facts = d.facts.map(f => `<div class="mk-fact"><dt>${esc(f.label)} ${tip(f.tip)}</dt><dd>${esc(f.value)}</dd></div>`).join('');
        return `
            <p class="mk-kuvio">${esc(T.kuvio(p.STANDNUMBER ?? '–', area))}</p>
            <p class="mk-lead">${esc(d.lead)}</p>
            ${edge}
            <dl class="mk-facts">${facts}</dl>
            ${d.hint ? `<p class="mk-hint">${esc(d.hint)}</p>` : ''}
            ${d.proposal ? `<p class="mk-proposal">${esc(d.proposal)} ${tip('hakkuuehdotus')}</p>` : ''}
            <p class="mk-source">${esc(T.lahde(d.source.inventory || '–', d.source.current))}</p>
            <div class="mk-actions">
                ${ui.status === 'ok'
                    ? `<button type="button" class="mk-btn mk-primary" data-mk="quiz">${esc(T.kysyMinulta)}</button>`
                    : `<p class="mk-note">${esc(T.reunallaEiKysymyksia)}</p>`}
            </div>`;
    }

    function quizHtml() {
        const levels = LEVELS.map(l => `<button type="button" class="mk-level" data-mk="level" data-level="${l}" aria-pressed="${store.level === l}">${esc(T.tasot[l])}</button>`).join('');
        const head = `<div class="mk-levels" role="group" aria-label="${esc(T.taso)}">${levels}</div>`;
        const back = `<button type="button" class="mk-btn mk-link" data-mk="place">${esc(T.takaisin)}</button>`;

        if (ui.status !== 'ok' && !ui.feedback) {
            const note = ui.status === 'edge' ? `<p class="mk-note">${esc(T.reunallaEiKysymyksia)}</p>` : statusHtml();
            return `${head}${note}${back}`;
        }
        const q = ui.question;
        if (!q) {
            const answered = store.answered(ui.stand.properties.STANDID);
            const left = questionsFor(ui.stand.properties).some(x => !answered.has(x.id));
            return `${head}<p class="mk-note">${esc(left ? T.tasoVastattu : T.kaikkiVastattu)}</p>${back}`;
        }

        const fb = ui.feedback;
        const options = q.options.map(o => {
            let cls = 'mk-option';
            if (fb && q.kind === 'choice') {
                if (o.value === q.answer) cls += ' oikea';
                else if (o.value === fb.chosen) cls += ' vaara';
            } else if (fb && o.value === fb.chosen) cls += ' valittu';
            return `<button type="button" class="${cls}" data-mk="answer" data-value="${esc(o.value)}" ${fb ? 'disabled' : ''}>${esc(o.label)}</button>`;
        }).join('');

        const feedback = fb ? `
            <div class="mk-feedback ${fb.correct === false ? 'vaara' : 'oikea'}" role="status">
                <p>${esc(fb.text)}</p>
                ${fb.points ? `<p class="mk-plus">+${fb.points}${fb.bonus ? ` (putkibonus +${fb.bonus})` : ''}</p>` : ''}
            </div>
            <button type="button" class="mk-btn mk-primary" data-mk="next">${esc(T.seuraava)}</button>` : '';

        const label = q.kind === 'observe' ? 'Havainto' : T.tasot[q.level];
        return `${head}
            <p class="mk-qlevel">${esc(label)} · +${q.points}</p>
            <p class="mk-question">${esc(q.text)}</p>
            <div class="mk-options">${options}</div>
            ${feedback}
            ${back}`;
    }

    function render() {
        if (!ui.open) return;
        const body = ui.stand && (ui.status === 'ok' || ui.status === 'edge' || ui.view === 'quiz')
            ? (ui.view === 'quiz' ? quizHtml() : placeHtml())
            : statusHtml();
        const flash = ui.flash ? `<p class="mk-flash" role="status">${esc(ui.flash)}</p>` : '';
        ui.flash = null;
        card.innerHTML = `
            <header class="mk-head">
                <div>
                    <h2>${esc(T.otsikko)}</h2>
                    <span class="mk-kokeilu">${esc(T.kokeilu)}</span>
                </div>
                <button type="button" class="mk-close" data-mk="close" aria-label="${esc(T.sulje)}">×</button>
            </header>
            ${locked() ? '' : scoreBar()}
            ${flash}
            <div class="mk-body">${body}</div>`;
    }
}
