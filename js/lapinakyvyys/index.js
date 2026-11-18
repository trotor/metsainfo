/**
 * Kuvioiden läpinäkyvyys (kokeilu, trotor/metsainfo#37): liukusäädin
 * tasovalitsimen alareunaan. Kuvioita värittävät tasot (kuviot, puuston
 * arvo, saavutettavuus) piirtävät täyttönsä läpinäkyvämpänä, jotta
 * ilmakuva tai kartta näkyy alta. Mukana vain kokeilubuildissa
 * (VITE_KOKEILU=1), maksuton (js/features.js).
 */

import './lapinakyvyys.css';
import * as state from '../state.js';
import { emit, VIESTIT } from '../vayla.js';
import { setPeittavyys } from '../peittavyys.js';
import { isUnlocked } from '../features.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { T } from './teksti.js';

const AVAIN = 'metsainfo.lapinakyvyys';
const MAKSIMI = 90; // %, värit eivät katoa kokonaan

/** Tallennettu läpinäkyvyys prosentteina (0–90, kymmenen välein). */
export function lueTallennettu(storage = globalThis.localStorage) {
    try {
        const raw = storage?.getItem(AVAIN);
        if (raw == null) return 0;
        const n = Number(raw);
        return Number.isFinite(n) ? Math.min(MAKSIMI, Math.max(0, Math.round(n / 10) * 10)) : 0;
    } catch {
        return 0;
    }
}

function tallenna(arvo) {
    try { localStorage.setItem(AVAIN, String(arvo)); } catch { /* yksityinen ikkuna tms. */ }
}

/** Läpinäkyvyys prosentteina → peittävyyskerroin. */
export const kerroin = (prosentti) => 1 - prosentti / 100;

export function startLapinakyvyys() {
    addHelpSection({ id: 'lapinakyvyys', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });
    const control = state.layersControl;
    if (!control || !isUnlocked('lapinakyvyys')) return;
    const list = control.getContainer().querySelector('.leaflet-control-layers-list');
    if (!list) return;

    const el = document.createElement('div');
    el.className = 'lp-saadin';
    el.innerHTML = `<div class="leaflet-control-layers-separator"></div>
        <div class="lp-rivi"><span id="lp-otsikko">${T.otsikko}</span><output for="lp-arvo"></output></div>
        <input id="lp-arvo" type="range" min="0" max="${MAKSIMI}" step="10" aria-labelledby="lp-otsikko" title="${T.kuvaus}">`;
    // Säätimen veto ei saa liikuttaa karttaa eikä sulkea valitsinta
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
    list.appendChild(el);

    const input = el.querySelector('input');
    const output = el.querySelector('output');

    function aseta(prosentti, talteen) {
        input.value = String(prosentti);
        output.textContent = `${prosentti} %`;
        setPeittavyys(kerroin(prosentti));
        emit(VIESTIT.peittavyys, { peittavyys: kerroin(prosentti) });
        if (talteen) tallenna(prosentti);
    }

    input.addEventListener('input', () => aseta(Number(input.value), true));
    aseta(lueTallennettu(), false);
}
