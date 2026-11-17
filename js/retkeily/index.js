/**
 * Retkeilykohteet (kokeilu): LIPAS-laavut, -tulentekopaikat, -retkeilyreitit
 * ja -luontopolut karttatasona tasovalitsimessa. Maksuton (js/features.js
 * 'retkeily'). Vain kokeilubuildissa (VITE_KOKEILU=1).
 */

import './retkeily.css';
import * as state from '../state.js';
import { coordsEPSG3067ToLatLng, formatNumber } from '../utils.js';
import { locale } from '../i18n.js';
import { showToast } from '../ui/location-ui.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { LAYERS, wfsUrl, toSites, viewKey } from './aineisto.js';
import { T } from './teksti.js';

export const MIN_ZOOM = 10; // kuten kiinteistörajat; laajempi näkymä katkaisisi haun (enintään 1000 kohdetta)
const VARIT = { laavu: '#b45309', tuli: '#dc2626', reitti: '#7c2d12', polku: '#15803d' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null);

function popupHtml(s) {
    const url = safeUrl(s.www);
    return `<div class="rk-taso"><strong>${esc(s.nimi || T.lajit[s.laji])}</strong>
        <div class="rk-laji">${esc(T.lajit[s.laji])}${s.pituusKm ? ` · ${esc(T.pituus(formatNumber(s.pituusKm, s.pituusKm < 10 ? 1 : 0, locale())))}` : ''}${s.kunta ? ` · ${esc(s.kunta)}` : ''}</div>
        ${url ? `<div><a href="${esc(url)}" target="_blank" rel="noopener">${esc(T.lisatietoja)}</a></div>` : ''}
        <div class="rk-lahde">${esc(T.lahde)}</div></div>`;
}

export function startRetkeily() {
    addHelpSection({ id: 'retkeily', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });
    const map = state.map;
    const group = L.layerGroup();
    const geo = L.geoJSON(null, {
        coordsToLatLng: coordsEPSG3067ToLatLng,
        // style koskee myös pistemerkkejä (CircleMarker), joten pisteille oma tyyli
        style: (f) => (f.geometry.type === 'Point'
            ? { color: '#fff', weight: 2, fillColor: VARIT[f.properties.laji], fillOpacity: 1 }
            : { color: VARIT[f.properties.laji], weight: 3, dashArray: f.properties.laji === 'polku' ? '2 6' : '8 6', opacity: 0.85 }),
        pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 6, color: '#fff', weight: 2, fillColor: VARIT[f.properties.laji], fillOpacity: 1 }),
        onEachFeature: (f, l) => l.bindPopup(popupHtml(f.properties))
    }).addTo(group);
    state.layersControl?.addOverlay(group, T.taso);

    let lastKey = null, token = 0, hinted = false;

    function bounds3067() {
        const b = map.getBounds();
        const [minX, minY] = proj4('WGS84', 'EPSG:3067', [b.getWest(), b.getSouth()]);
        const [maxX, maxY] = proj4('WGS84', 'EPSG:3067', [b.getEast(), b.getNorth()]);
        const w = (maxX - minX) * 0.2, h = (maxY - minY) * 0.2;
        return { minX: minX - w, minY: minY - h, maxX: maxX + w, maxY: maxY + h };
    }

    async function load() {
        if (!map.hasLayer(group)) return;
        if (map.getZoom() < MIN_ZOOM) {
            if (!hinted) { showToast(T.zoomaa); hinted = true; }
            return;
        }
        const bbox = bounds3067();
        const key = viewKey(bbox);
        if (key === lastKey) return;
        lastKey = key;
        const my = ++token;
        const results = await Promise.allSettled(LAYERS.map(async (layer) => {
            const res = await fetch(wfsUrl(layer, bbox));
            if (!res.ok) throw new Error(`LIPAS HTTP ${res.status}`);
            return toSites(layer, await res.json());
        }));
        if (my !== token) return;
        geo.clearLayers();
        for (const r of results) {
            if (r.status !== 'fulfilled') continue;
            for (const s of r.value) geo.addData({ type: 'Feature', geometry: s.geometry, properties: s });
        }
        if (results.every(r => r.status === 'rejected')) { lastKey = null; showToast(T.virhe); }
    }

    map.on('overlayadd', (e) => { if (e.layer === group) { lastKey = null; load(); } });
    map.on('moveend', () => { if (map.hasLayer(group)) load(); });
}
