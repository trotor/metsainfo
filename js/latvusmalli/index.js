/**
 * Latvusmalli (kokeilu): Metsäkeskuksen laserkeilauksesta tehty puuston
 * korkeus (CHM, uusin saatavilla oleva vuosi) taustakartaksi vaalean
 * taustakartan päälle. Mukana vain kokeilubuildissa (VITE_KOKEILU=1),
 * maksuton (js/features.js).
 *
 * Palvelu on EPSG:3067:ssä kuten kartta. Se palauttaa kuvaa vain noin
 * 23 m/px tarkemmilla mittakaavoilla, joten taso piirretään zoomista 9
 * (16 m/px) alkaen. Väritys "CHM classification style": alle 0,5 m
 * läpinäkyvä, vihreä matala, keltainen noin 12 m, oranssi ja punainen
 * korkea puusto (selite VARIT).
 */

import './latvusmalli.css';
import * as state from '../state.js';
import { CONFIG } from '../config.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { T } from './teksti.js';
import { isUnlocked } from '../features.js';

export const WMS_URL = 'https://avoin.metsakeskus.fi/rajapinnat/v1/CHM_newest/ows';
export const TYYLI = 'CHM classification style';
export const MIN_ZOOM = 9;

// Selitteen värit: korkeus metreinä ja palvelun piirtämä väri (mitattu
// GetFeatureInfo-arvoista 1 m/px tarkkuudella)
export const VARIT = [
    [0.5, '#4daf50'], [5, '#a6d96f'], [12, '#f0f9b1'],
    [17, '#fed791'], [24, '#f07b49'], [28, '#e44a33']
];

const ATTRIBUTION = 'Latvusmalli: © <a href="https://www.metsakeskus.fi/" target="_blank" rel="noopener">Suomen metsäkeskus</a>';
const KAPSI = 'Kartta: <a href="https://www.maanmittauslaitos.fi/" target="_blank" rel="noopener">MML</a> / <a href="https://kartat.kapsi.fi/" target="_blank" rel="noopener">Kapsi</a>';

/** Selitteen liukuväri CSS:nä (ohjeessa). */
export function liukuvari(varit = VARIT) {
    const max = varit[varit.length - 1][0];
    return `linear-gradient(to right, ${varit.map(([m, c]) => `${c} ${Math.round(m / max * 100)}%`).join(', ')})`;
}

function latvusmalliTaso() {
    return L.tileLayer.wms(WMS_URL, {
        layers: 'CHM_newest',
        styles: TYYLI,
        format: 'image/png',
        version: '1.3.0',
        transparent: true,
        attribution: ATTRIBUTION,
        className: 'latvusmalli-taso',
        minZoom: MIN_ZOOM,
        maxZoom: 15,
        maxNativeZoom: 13
    });
}

export function startLatvusmalli() {
    addHelpSection({
        id: 'latvusmalli',
        title: T.ohjeOsio.otsikko,
        html: T.ohjeOsio.html.replace('{selite}',
            `<span class="lm-selite" style="background:${liukuvari()}" aria-hidden="true"></span>`)
    });
    const control = state.layersControl;
    if (!control || !isUnlocked('latvusmalli')) return;
    // Vaalea taustakartta alle, jotta tiet, vedet ja nimet näkyvät aukoissa
    const pohja = L.tileLayer(CONFIG.layers.taustakartta, { attribution: KAPSI, maxZoom: 15, minZoom: 1 });
    control.addBaseLayer(L.layerGroup([pohja, latvusmalliTaso()]), T.taustakartta);
}
