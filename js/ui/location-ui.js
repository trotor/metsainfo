/**
 * Oma sijainti kartalla: paikannuspainike (pois / keskitys / keskitys +
 * suunta), sijaintipiste ja tarkkuusympyrä, "Olet kuviolla" -rivi ja
 * automaattinen kiinteistövalinta (spec luku 5.1).
 */

import * as state from '../state.js';
import { coordsEPSG3067ToLatLng } from '../utils.js';
import { isMobileLayout, onLayoutChange, visibleCenterOffset, topInset } from './layout.js';
import { getSheet } from './panel.js';
import { openStand } from './stands.js';
import { isNative } from '../platform/index.js';
import { watchPosition } from '../platform/location.js';
import { requestCompassPermission, watchCompass } from '../platform/compass.js';
import {
    latLonTo3067, findFeatureIndexAt, findParcelAt, isInsideParcel,
    nextFollowMode, isStale, hereRowModel, shouldStopOnError
} from '../location/logic.js';

const HERE_ROW_HEIGHT = 52;
const FOLLOW_MIN_ZOOM = 13;
const LOCATION_COLOR = '#1a73e8';
const STALE_COLOR = '#9aa0a6';
// Oma karttataso kuviotasojen (overlayPane 400) yläpuolelle
const PANE = 'locationPane';

let mode = 'off';            // off | show | follow | heading
let stopWatch = null;
let stopCompass = null;
let last = null;             // { lat, lon, accuracy, heading, timestamp }
let lastHeading = null;
let hasCompass = false;
let autoSelectPending = false;
let firstFix = true;
let hereStandIndex = -1;
let staleTimer = null;
let selectParcelFn = () => {};
let control = null;
let marker = null;
let accuracyCircle = null;
let headingMarker = null;
let hereLayer = null;

export function showToast(text, ms = 5000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.hidden = true; }, ms);
}

const ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2 4.5 20.3l.7.7L12 18l6.8 3 .7-.7z" fill="currentColor"/></svg>';

const LocateControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control locate-control');
        const btn = L.DomUtil.create('a', 'locate-btn', container);
        btn.href = '#';
        btn.setAttribute('role', 'button');
        btn.setAttribute('aria-label', 'Näytä oma sijainti');
        btn.title = 'Oma sijainti';
        btn.innerHTML = ICON;
        btn.dataset.mode = mode;
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(btn, 'click', (e) => {
            L.DomEvent.preventDefault(e);
            onButton();
        });
        this._btn = btn;
        return container;
    }
});

function setMode(next) {
    mode = next;
    const btn = control?._btn;
    if (btn) {
        btn.dataset.mode = mode;
        btn.setAttribute('aria-pressed', mode === 'off' ? 'false' : 'true');
        btn.setAttribute('aria-label', {
            off: 'Näytä oma sijainti',
            show: 'Keskitä omaan sijaintiin',
            follow: hasCompass ? 'Näytä kulkusuunta' : 'Lopeta paikannus',
            heading: 'Lopeta paikannus'
        }[mode]);
    }
    updateHeadingMarker();
}

function onButton() {
    const next = nextFollowMode(mode, hasCompass);

    if (mode === 'off') {
        // Kompassilupa on pyydettävä napautuksen yhteydessä (iOS Safari)
        requestCompassPermission().then(granted => {
            if (granted && !stopCompass) {
                stopCompass = watchCompass(heading => {
                    hasCompass = true;
                    lastHeading = heading;
                    updateHeadingMarker();
                });
            }
        });
        start();
    }

    if (next === 'off') {
        stop();
        return;
    }

    setMode(next);
    if (last) centerOn(last);
}

async function start() {
    autoSelectPending = !state.currentParcel;
    firstFix = true;
    warnedUnavailable = false;
    stopWatch = await watchPosition(onPosition, onError);
    clearInterval(staleTimer);
    staleTimer = setInterval(updateStale, 5000);
}

function stop() {
    stopWatch?.();
    stopWatch = null;
    stopCompass?.();
    stopCompass = null;
    clearInterval(staleTimer);
    last = null;
    autoSelectPending = false;
    [marker, accuracyCircle, headingMarker].forEach(layer => layer && state.map.removeLayer(layer));
    marker = accuracyCircle = headingMarker = null;
    setMode('off');
    refreshHereRow();
}

let warnedUnavailable = false;

function onError(kind) {
    if (shouldStopOnError(kind)) {
        stop();
        showToast(isNative()
            ? 'Sijainti ei ole käytössä. Salli se kohdassa Asetukset → Metsäinfo → Sijainti.'
            : 'Sijainti ei ole käytössä. Salli sijainti selaimen asetuksista.', 8000);
        return;
    }
    // Tilapäinen katko: seuranta jatkuu, ja vanha piste harmaantuu.
    // Ohje näytetään vain, jos sijaintia ei ole saatu lainkaan.
    if (!last && !warnedUnavailable) {
        warnedUnavailable = true;
        showToast('Sijaintia haetaan. Tarkista, että sijaintipalvelut ovat päällä.');
    }
}

function onPosition(pos) {
    if (mode === 'off') return; // lopetettu ennen kuin sijainti ehti
    last = pos;
    drawPosition(pos);
    if (mode === 'follow' || mode === 'heading' || firstFix) centerOn(pos);
    firstFix = false;
    autoSelect();
    refreshHereRow();
}

function drawPosition(pos) {
    const latlng = L.latLng(pos.lat, pos.lon);
    if (!marker) {
        accuracyCircle = L.circle(latlng, {
            radius: pos.accuracy, color: LOCATION_COLOR, weight: 1,
            fillColor: LOCATION_COLOR, fillOpacity: 0.12, interactive: false, pane: PANE
        }).addTo(state.map);
        marker = L.circleMarker(latlng, {
            radius: 8, color: '#ffffff', weight: 3,
            fillColor: LOCATION_COLOR, fillOpacity: 1, interactive: false, pane: PANE
        }).addTo(state.map);
    } else {
        marker.setLatLng(latlng);
        accuracyCircle.setLatLng(latlng).setRadius(pos.accuracy);
    }
    updateStale();
    updateHeadingMarker();
}

function updateStale() {
    if (!marker || !last) return;
    const color = isStale(last.timestamp, Date.now()) ? STALE_COLOR : LOCATION_COLOR;
    marker.setStyle({ fillColor: color });
    accuracyCircle.setStyle({ color, fillColor: color });
}

function updateHeadingMarker() {
    const show = mode === 'heading' && last && lastHeading != null;
    if (!show) {
        if (headingMarker) {
            state.map.removeLayer(headingMarker);
            headingMarker = null;
        }
        return;
    }
    const latlng = L.latLng(last.lat, last.lon);
    if (!headingMarker) {
        headingMarker = L.marker(latlng, {
            icon: L.divIcon({ className: 'heading-cone', html: '<div class="cone"></div>', iconSize: [64, 64] }),
            interactive: false,
            keyboard: false,
            pane: PANE
        }).addTo(state.map);
    } else {
        headingMarker.setLatLng(latlng);
    }
    const cone = headingMarker.getElement()?.querySelector('.cone');
    if (cone) cone.style.transform = `rotate(${lastHeading}deg)`;
}

/**
 * Keskittää sijaintiin niin, että piste jää hakupalkin ja tietopaneelin
 * väliin. Ensimmäisellä kerralla zoomataan vähintään tasolle 13.
 */
function centerOn(pos) {
    const map = state.map;
    const zoom = Math.max(map.getZoom(), FOLLOW_MIN_ZOOM);
    const sheet = getSheet();
    const offset = isMobileLayout()
        ? visibleCenterOffset(sheet ? sheet.targetHeight() : 0, topInset())
        : [0, 0];
    const point = map.project(L.latLng(pos.lat, pos.lon), zoom).add(offset);
    map.setView(map.unproject(point, zoom), zoom);
}

/**
 * Valitsee kiinteistön, jonka sisällä käyttäjä on, kerran per käynnistys.
 * Jos rajat eivät ole vielä latautuneet, odotetaan parcels-loaded-tapahtumaa.
 */
function autoSelect() {
    if (!autoSelectPending || !last) return;
    if (state.currentParcel) {
        autoSelectPending = false;
        return;
    }
    const parcel = findParcelAt(state.loadedParcels.values(), latLonTo3067(last.lat, last.lon));
    if (parcel) {
        autoSelectPending = false;
        selectParcelFn(parcel);
    }
}

/**
 * Päivittää "Olet kuviolla" -rivin ja kuvion korostuksen. Ei vaihda
 * välilehteä eikä vieritä, jotta luettava kohta ei katoa.
 */
export function refreshHereRow() {
    const row = document.getElementById('here-row');
    if (!row) return;

    const sheet = getSheet();
    const hide = () => {
        row.hidden = true;
        hereStandIndex = -1;
        hereLayer?.clearLayers();
        sheet?.setPeekExtra(0);
    };

    if (mode === 'off' || !last || !state.currentParcel) {
        hide();
        return;
    }

    const point = latLonTo3067(last.lat, last.lon);
    const inside = isInsideParcel(state.currentParcel, point);
    const index = inside ? findFeatureIndexAt(state.currentFeatures, point) : -1;
    const feature = index >= 0 ? state.currentFeatures[index] : null;
    const model = hereRowModel({ hasParcel: true, inside, feature });

    hereStandIndex = index;
    row.hidden = false;
    row.dataset.kind = model.kind;
    row.querySelector('.here-text').textContent = model.kind === 'stand' ? `Olet: ${model.text}` : model.text;

    hereLayer.clearLayers();
    if (feature) hereLayer.addData(feature);

    sheet?.setPeekExtra(isMobileLayout() ? HERE_ROW_HEIGHT : 0);
}

function onHereRowTap() {
    const row = document.getElementById('here-row');
    if (row.dataset.kind === 'stand' && hereStandIndex >= 0) {
        openStand(hereStandIndex);
    } else if (row.dataset.kind === 'outside' && last) {
        const parcel = findParcelAt(state.loadedParcels.values(), latLonTo3067(last.lat, last.lon));
        if (parcel) selectParcelFn(parcel);
        else showToast('Tästä kohdasta ei löytynyt kiinteistöä. Zoomaa lähemmäs.');
    }
}

export function initLocation({ selectParcel }) {
    selectParcelFn = selectParcel;

    state.map.createPane(PANE);
    state.map.getPane(PANE).style.zIndex = 450;
    state.map.getPane(PANE).style.pointerEvents = 'none';

    hereLayer = L.geoJSON(null, {
        style: { color: LOCATION_COLOR, weight: 3, dashArray: '6 4', fill: false },
        interactive: false,
        pane: PANE,
        coordsToLatLng: coordsEPSG3067ToLatLng
    }).addTo(state.map);

    const position = () => (isMobileLayout() ? 'topright' : 'topleft');
    control = new LocateControl({ position: position() }).addTo(state.map);
    // Zoom siirretään samaan kulmaan initPanelissa; tämä kuuntelija
    // rekisteröidään sen jälkeen, joten painike jää zoomin alle
    onLayoutChange(() => {
        control.setPosition(position());
        refreshHereRow();
    });

    state.map.on('dragstart', () => {
        if (mode === 'follow' || mode === 'heading') setMode('show');
    });

    document.getElementById('here-row').addEventListener('click', onHereRowTap);
    document.addEventListener('parcels-loaded', autoSelect);
}
