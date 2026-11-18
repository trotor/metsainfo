/**
 * Puuston arvo kartalla (kokeilu, #34): Väritys-valitsimen vaihtoehto, joka
 * värittää kuviot puuston arvon (€/ha, uudistushakkuun kantohinnoin) mukaan
 * ja näyttää kuvion arvon sen tiedoissa. Hinta-arvion lisäosaa
 * (js/features.js 'arvovari'). Vain kokeilubuildissa (VITE_KOKEILU=1).
 *
 * Hinnat samoista lähteistä kuin hinta-arviossa (jaetut moduulit
 * js/platform/prices.js ja js/pricing/): alue kiinteistön kunnasta,
 * välimuisti tai tuore haku, omat hinnat päälle.
 */

import './arvovari.css';
import * as state from '../state.js';
import { on, VIESTIT } from '../vayla.js';
import { taytto } from '../peittavyys.js';
import { formatNumber, coordsEPSG3067ToLatLng } from '../utils.js';
import { locale } from '../i18n.js';
import { isUnlocked } from '../features.js';
import { showToast } from '../ui/location-ui.js';
import { addHelpSection } from '../ui/ohje-osiot.js';
import { registerColorMode } from '../ui/tyokalut.js';
import { fetchPrices, loadCachedPrices, loadOverrides, lookupKunta } from '../platform/prices.js';
import { PRICE_REGIONS, regionForKunta, parcelPoint } from '../pricing/region.js';
import { applyOverrides } from '../pricing/prices.js';
import { VARIT, valuePerHa, classIndex } from './logiikka.js';
import { T } from './teksti.js';

const STALE_MS = 7 * 24 * 3600 * 1000;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (v) => formatNumber(Math.round(v / 100) * 100, 0, locale());
const locked = () => !isUnlocked('arvovari');

export function startArvovari() {
    addHelpSection({ id: 'arvovari', title: T.ohjeOsio.otsikko, html: T.ohjeOsio.html });

    const ui = { on: false, ctx: null, prices: null, region: null, status: 'idle' };
    const regionCache = new Map();
    let token = 0;

    const standLayer = L.geoJSON(null, {
        interactive: false, // kuvion napautus menee sovelluksen kuviotasolle
        coordsToLatLng: coordsEPSG3067ToLatLng,
        style: (f) => ({ color: '#5b3a12', weight: 1, fillColor: VARIT[f.properties.luokka], fillOpacity: taytto(0.7) })
    });
    // Läpinäkyvyyssäädin (kokeilu): täyttö uudelleen
    on(VIESTIT.peittavyys, () => standLayer.setStyle(standLayer.options.style));

    const legend = document.createElement('div');
    legend.id = 'av-selite';
    legend.hidden = true;
    document.getElementById('color-legend')?.after(legend);

    registerColorMode({
        id: 'arvo', feature: 'arvovari', label: T.variTila,
        onSelect: () => setOn(true),
        onDeselect: () => setOn(false)
    });

    function openPaywall() {
        // Hinta-arvion ostonäkymä avautuu data-est="paywall" -painikkeesta (js/ui/estimate.js)
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.est = 'paywall';
        b.hidden = true;
        document.body.appendChild(b);
        b.click();
        b.remove();
    }

    /** Palauttaa false, jos väritys ei käynnisty (lukittu tai ei kuvioita). */
    function setOn(next) {
        if (next && locked()) { openPaywall(); return false; }
        if (next && !ui.ctx?.features?.length) { showToast(T.valitseKiinteisto); return false; }
        ui.on = next;
        if (next) load(); else draw();
    }

    async function regionOf(parcel) {
        if (parcel?.properties?.priceRegion) return parcel.properties.priceRegion;
        const p = parcelPoint(parcel);
        if (!p) return 'koko-maa';
        const key = p.map(Math.round).join(',');
        if (!regionCache.has(key)) {
            const kunta = await lookupKunta(p[0], p[1]).catch(() => null);
            if (!kunta) return 'koko-maa'; // ei välimuistiin: yritetään seuraavalla kerralla
            regionCache.set(key, regionForKunta(kunta.kunta) || 'koko-maa');
        }
        return regionCache.get(key);
    }

    async function load() {
        const my = ++token;
        ui.status = 'loading';
        draw();
        try {
            const region = await regionOf(ui.ctx.parcel);
            if (my !== token) return;
            let prices = loadCachedPrices(region);
            if (!prices || Date.now() - (prices.fetchedAt || 0) > STALE_MS) {
                showToast(T.haetaan, 2500);
                prices = await fetchPrices(region).catch(() => prices);
                if (my !== token) return;
            }
            if (!prices) throw new Error('ei hintoja');
            ui.region = region;
            ui.prices = { ...prices, table: applyOverrides(prices.table, loadOverrides('kiinteisto')) };
            ui.status = 'done';
        } catch {
            if (my !== token) return;
            ui.status = 'error';
            showToast(T.virhe);
        }
        draw();
    }

    function values() {
        if (!ui.prices || !ui.ctx) return [];
        return ui.ctx.features.map(f => valuePerHa(f.properties || {}, ui.prices.table));
    }

    function draw() {
        standLayer.clearLayers();
        const show = ui.on && ui.status === 'done' && ui.ctx?.features?.length;
        document.body.classList.toggle('av-varit', Boolean(show));
        legend.hidden = !show;
        decorateStands(show ? values() : null);
        if (!show) { standLayer.remove(); return; }
        const vals = values();
        ui.ctx.features.forEach((f, i) => {
            if (!f.geometry || !vals[i]) return;
            standLayer.addData({ type: 'Feature', geometry: f.geometry, properties: { luokka: classIndex(vals[i].perHa) } });
        });
        standLayer.addTo(state.map);
        legend.innerHTML = `<div class="av-selite-otsikko">${esc(T.selite)}</div>
            <div class="legend-items">${VARIT.map((c, k) => `<div class="legend-item"><span class="legend-color" style="background:${c}"></span>${esc(T.luokat[k])}</div>`).join('')}</div>`;
    }

    function decorateStands(vals) {
        const content = ui.ctx?.content;
        if (!content?.isConnected) return;
        content.querySelectorAll('.av-lisa').forEach(el => el.remove());
        if (!vals) return;
        const regionName = PRICE_REGIONS[ui.region]?.name || '';
        content.querySelectorAll('.stand-item').forEach(itemEl => {
            const v = vals[Number(itemEl.dataset.index)];
            if (!v) return;
            const details = itemEl.querySelector('.stand-details');
            if (!details) return;
            const div = document.createElement('div');
            div.className = 'detail-group av-lisa';
            div.innerHTML = `<div class="detail-grid"><div class="detail-row"><span>${esc(T.kuvionArvo)}</span><span>${esc(T.arvo(fmt(v.total), fmt(v.perHa)))}</span></div></div>
                <p class="av-hinnat">${esc(T.hinnat(regionName, ui.prices?.periodLabel || ''))}</p>`;
            const footer = details.querySelector('.detail-footer');
            if (footer) footer.before(div); else details.appendChild(div);
        });
    }

    on(VIESTIT.yhteenveto, (ctx) => {
        ui.ctx = ctx;
        token++;
        ui.status = 'idle';
        if (ui.on && ctx?.features?.length) load(); else draw();
    }, { replay: true });

    on(VIESTIT.tyhjennys, () => {
        ui.ctx = null;
        token++;
        draw();
    });
}
