/**
 * Korkeusmalli (kokeilu, #28): laserkeilauksesta tehty vinovalaistu
 * korkeusmalli (GTK:n karttapalvelu, aineisto © Maanmittauslaitos)
 * taustakartaksi ja läpikuultavaksi varjosteeksi peruskartan päälle.
 * Mukana vain kokeilubuildissa (VITE_KOKEILU=1), maksuton (js/features.js).
 *
 * Palvelu on EPSG:3067:ssä kuten kartta, joten WMS-ruudut sopivat suoraan.
 * Ruudut piirretään pyynnöstä (noin 0,15 s). Aineiston tarkkuus on noin
 * 2 m; lähempänä Leaflet suurentaa 1 m/px ruutuja (maxNativeZoom 13).
 */

import './korkeusmalli.css';
import * as state from '../state.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { T } from './teksti.js';
import { isUnlocked } from '../features.js';

export const WMS_URL = 'https://gtkdata.gtk.fi/arcgis/services/Rajapinnat/Korkeusmalli/MapServer/WMSServer';

const ATTRIBUTION = 'Korkeusmalli: <a href="https://www.gtk.fi/" target="_blank" rel="noopener">GTK</a>, aineisto © <a href="https://www.maanmittauslaitos.fi/" target="_blank" rel="noopener">Maanmittauslaitos</a>';

function wmsLayer(extra = {}) {
    return L.tileLayer.wms(WMS_URL, {
        layers: '0',
        styles: '',
        format: 'image/png',
        version: '1.3.0',
        transparent: false,
        attribution: ATTRIBUTION,
        minZoom: 1,
        maxZoom: 15,
        maxNativeZoom: 13,
        ...extra
    });
}

export function startKorkeusmalli() {
    addHelpSection({ id: 'korkeusmalli', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });
    const control = state.layersControl;
    if (!control || !isUnlocked('korkeusmalli')) return;
    // Taustakartaksi: pelkkä maaston muoto
    control.addBaseLayer(wmsLayer({ className: 'korkeusmalli-taso' }), T.taustakartta);
    // Päälle: varjoste peruskartan tai ortokuvan päälle, nimet ja tiet näkyvät
    control.addOverlay(wmsLayer({ className: 'korkeusmalli-taso korkeusmalli-varjoste', opacity: 0.55, zIndex: 5 }), T.varjoste);
}
