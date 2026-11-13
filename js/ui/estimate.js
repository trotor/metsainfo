/**
 * Puukaupan hinta-arvio (maksullinen lisäosa, vain kaupan sovelluksessa).
 * - Arvio-välilehti: hinta-alue, kantohinnat (verkosta tai omat), tulokset
 * - arvo-kortti yhteenvetoon (lukittuna ilman ostoa: summaa ei näytetä)
 * - ostonäkymä ja kuvitteellinen esimerkkimetsä kokeiluun
 * Verkkoversiossa (ostot eivät käytössä) mikään tästä ei renderöidy.
 */

import { purchases } from '../platform/purchases.js';
import { fetchPrices, loadCachedPrices, loadOverrides, saveOverrides, lookupKunta } from '../platform/prices.js';
import { shareTextFile } from '../platform/share.js';
import { PRICE_REGIONS, regionForKunta, parcelPoint } from '../pricing/region.js';
import { applyOverrides, METHODS, SPECIES } from '../pricing/prices.js';
import { estimateParcel, DEFAULT_REMOVAL } from '../pricing/estimate.js';
import { parsePriceInput, formatEuro, formatPrice, yearRangeLabel, buildEstimateReport, METHOD_LABELS, SPECIES_LABELS } from '../pricing/format.js';

const STALE_MS = 7 * 24 * 3600 * 1000;
const CC_BY = 'https://creativecommons.org/licenses/by/4.0/deed.fi';

// Nykyinen kiinteistö (yhteenvedosta) ja esimerkkimetsä omina tiloinaan
const parcelCtx = newCtx();
const demoCtx = newCtx();
let demoData = null;
let wired = false;
const kuntaCache = new Map();

function newCtx() {
    return { features: [], label: '', region: null, regionAuto: '', prices: null, loading: false, error: '', method: 'uudistus', demo: false };
}

export function estimateEnabled() {
    return purchases.isAvailable();
}

const unlocked = (ctx) => ctx.demo || purchases.isEntitled();

/* ---------- Yhteenvedon osat (summary.js) ---------- */

export function estimateTabButton() {
    return estimateEnabled() ? '<button type="button" role="tab" data-tab="arvio">Arvio</button>' : '';
}

export function estimateTabPanel() {
    return estimateEnabled() ? '<section class="tab-panel" data-tab="arvio"><div class="estimate-root" data-ctx="parcel"></div></section>' : '';
}

export function estimateSummaryCard() {
    return estimateEnabled() ? '<div class="summary-section group-arvo estimate-card" data-ctx="parcel"></div>' : '';
}

/** Kutsutaan, kun yhteenveto on renderöity uudelle kiinteistölle. */
export function initEstimate(contentEl, { features, parcel, label }) {
    if (!estimateEnabled()) return;
    wireOnce();
    Object.assign(parcelCtx, newCtx(), { features, label: label || '' });
    renderAll();
    if (purchases.isEntitled()) ensurePrices(parcelCtx, parcel);
    else parcelCtx.pendingParcel = parcel;
}

/* ---------- Tila ja haut ---------- */

async function resolveRegion(ctx, parcel) {
    if (ctx.region) return;
    let region = null;
    const point = parcelPoint(parcel);
    if (point) {
        const id = parcel.properties?.nationalCadastralReference || point.join(',');
        let kunta = kuntaCache.get(id);
        if (kunta === undefined) {
            kunta = await lookupKunta(point[0], point[1]);
            kuntaCache.set(id, kunta);
        }
        region = regionForKunta(kunta?.kunta);
        ctx.regionAuto = kunta?.nimi || '';
    }
    ctx.region = region || 'koko-maa';
}

async function ensurePrices(ctx, parcel, { force = false } = {}) {
    await resolveRegion(ctx, parcel);
    const cached = loadCachedPrices(ctx.region);
    if (cached) ctx.prices = cached;
    const stale = !cached || Date.now() - (cached.fetchedAt || 0) > STALE_MS;
    if (!force && !stale) { renderAll(); return; }
    ctx.loading = true;
    ctx.error = '';
    renderAll();
    try {
        ctx.prices = await fetchPrices(ctx.region);
    } catch {
        ctx.error = cached
            ? 'Hintojen päivitys ei onnistunut. Käytössä aiemmin haetut hinnat.'
            : 'Hintoja ei saatu haettua. Tarkista verkkoyhteys tai syötä hinnat itse.';
    } finally {
        ctx.loading = false;
        renderAll();
    }
}

function currentTable(ctx) {
    const base = ctx.prices?.table || emptyFromSpecies();
    return applyOverrides(base, loadOverrides());
}

function emptyFromSpecies() {
    const t = {};
    for (const m of METHODS) { t[m] = {}; for (const s of SPECIES) t[m][s] = { tukki: null, kuitu: null }; }
    return t;
}

function compute(ctx) {
    const table = currentTable(ctx);
    return { table, estimate: estimateParcel(ctx.features, table) };
}

const hasPrices = (table) => METHODS.some(m => SPECIES.some(s => table[m][s].tukki !== null || table[m][s].kuitu !== null));

/* ---------- Renderöinti ---------- */

function renderAll() {
    document.querySelectorAll('.estimate-card[data-ctx="parcel"]').forEach(el => { el.innerHTML = cardHtml(parcelCtx); });
    document.querySelectorAll('.estimate-root[data-ctx="parcel"]').forEach(el => { el.innerHTML = panelHtml(parcelCtx); });
    const demoRoot = document.querySelector('.estimate-root[data-ctx="demo"]');
    if (demoRoot) demoRoot.innerHTML = panelHtml(demoCtx);
}

function cardHtml(ctx) {
    const head = '<h3>Arvio nykyhinnoin</h3>';
    if (!unlocked(ctx)) {
        return `${head}<div class="est-card-row"><div><div class="est-big est-locked">🔒 ? ??? €</div>
            <div class="est-muted">Hakkuiden arvo tämän viikon kantohinnoilla</div></div>
            <button type="button" class="est-btn-arvo" data-est="paywall">Kokeile</button></div>`;
    }
    if (ctx.loading && !ctx.prices) return `${head}<div class="est-muted">Haetaan kantohintoja…</div>`;
    const { table, estimate } = compute(ctx);
    if (!hasPrices(table)) {
        return `${head}<div class="est-card-row"><div class="est-muted">${ctx.error || 'Hinnat puuttuvat.'}</div>
            <button type="button" class="est-btn-arvo" data-est="open-tab">Avaa</button></div>`;
    }
    const range = yearRangeLabel(estimate.byYear);
    const region = PRICE_REGIONS[ctx.region]?.name || '';
    return `${head}<div class="est-card-row"><div><div class="est-big">${formatEuro(estimate.total)}</div>
        <div class="est-muted">ehdotetut hakkuut${range ? ` ${range}` : ''} · ${region} ${ctx.prices?.periodLabel || ''}</div></div>
        <button type="button" class="est-btn-arvo" data-est="open-tab">Näytä</button></div>`;
}

function lockedPanelHtml() {
    return `<div class="summary-section group-arvo est-intro">
        <h3>Puukaupan hinta-arvio</h3>
        <p>Näe, paljonko kiinteistön ehdotetut hakkuut ovat arvoltaan alueen tuoreilla kantohinnoilla. Voit käyttää myös omia hintoja, esimerkiksi saamasi puukauppatarjouksen mukaan.</p>
        <div class="est-actions">
            <button type="button" class="est-btn-outline" data-est="demo">Kokeile esimerkkimetsällä</button>
            <button type="button" class="est-btn" data-est="paywall">Avaa hinta-arvio</button>
        </div>
    </div>`;
}

function panelHtml(ctx) {
    if (!unlocked(ctx)) return lockedPanelHtml();
    const { table, estimate } = compute(ctx);
    const overrides = loadOverrides();
    const p = ctx.prices;
    const regionOptions = Object.entries(PRICE_REGIONS)
        .map(([key, r]) => `<option value="${key}"${key === ctx.region ? ' selected' : ''}>${r.name}</option>`).join('');

    const srcLine = ctx.loading ? 'Haetaan…'
        : p ? `${p.source}, ${p.periodLabel}` : 'Ei haettuja hintoja';
    const filledNote = p?.filled?.length
        ? `<div class="est-muted">Osa hinnoista täydennetty: ${[...new Set(p.filled.map(f => `${f.source} ${periodShort(f.period)}`))].join(', ')}.</div>` : '';

    const m = ctx.method;
    const rows = SPECIES.map(s => `<tr><td>${SPECIES_LABELS[s]}</td>${['tukki', 'kuitu'].map(a => {
        const own = typeof overrides?.[m]?.[s]?.[a] === 'number';
        return `<td><input inputmode="decimal" class="est-price${own ? ' edited' : ''}" data-m="${m}" data-s="${s}" data-a="${a}" value="${formatPrice(table[m][s][a])}" aria-label="${SPECIES_LABELS[s]} ${a} €/m³"></td>`;
    }).join('')}</tr>`).join('');
    const anyOverride = Object.keys(overrides).length > 0;

    const maxYear = Math.max(1, ...estimate.byYear.map(y => y.value));
    const bars = estimate.byYear.map(y => `<div class="est-yr${hasUudistus(estimate, y.year) ? ' u' : ''}">
        <span>${y.year ?? '–'}</span><div style="width:${Math.max(2, Math.round(100 * y.value / maxYear))}%"></div><b>${formatEuro(y.value).replace('≈ ', '')}</b></div>`).join('');

    return `
    <div class="est-src">
        <div><label class="est-region">Hinta-alue <select data-est="region">${regionOptions}</select></label>
            <div class="est-muted">${srcLine}${ctx.regionAuto && !ctx.demo ? ` · kunta ${escapeHtml(ctx.regionAuto)}` : ''}</div></div>
        <button type="button" class="est-btn" data-est="refresh"${ctx.loading ? ' disabled' : ''}>↻ Hae verkosta</button>
    </div>
    ${ctx.error ? `<div class="est-error">${ctx.error}</div>` : ''}
    ${filledNote}
    <div class="est-seg" role="tablist">${METHODS.map(x => `<button type="button" data-est="method" data-m="${x}" aria-selected="${x === m}">${METHOD_LABELS[x]}</button>`).join('')}</div>
    <table class="est-table"><thead><tr><th>€/m³</th><th>Tukki</th><th>Kuitu</th></tr></thead><tbody>${rows}</tbody></table>
    ${anyOverride ? '<div class="est-muted">Korostetut hinnat on syötetty itse. <button type="button" class="est-link" data-est="reset">Palauta verkon hinnat</button></div>' : ''}

    <div class="summary-section group-arvo est-result">
        <h3>Ehdotetut hakkuut${estimate.byYear.length ? ` ${yearRangeLabel(estimate.byYear)}` : ''}</h3>
        ${estimate.plans.length ? `<div class="est-big">${formatEuro(estimate.total)}</div><div class="est-bars">${bars}</div>`
            : '<div class="est-muted">Kiinteistöllä ei ole hakkuuehdotuksia.</div>'}
        ${estimate.missing ? `<div class="est-muted">${estimate.missing} kuviolta puuttuu osa hinnoista; syötä ne taulukkoon.</div>` : ''}
    </div>
    <div class="summary-section group-puusto">
        <h3>Koko puusto uudistushakkuun hinnoin</h3>
        <div class="est-big est-green">${formatEuro(estimate.stock.value)}</div>
        <div class="est-muted">Kantoraha-arvo, ei kerralla hakattavissa.</div>
    </div>
    <div class="est-actions">
        <button type="button" class="est-btn-outline" data-est="share">Jaa arvio</button>
    </div>
    <p class="est-fine">Suuntaa-antava arvio, ei korvaa puukauppatarjousta. Tukki- ja kuitupuu on jaettu puulajiosuuksien mukaan; harvennuksissa poistuma ${pct(DEFAULT_REMOVAL.harvennus)}, ensiharvennuksissa ${pct(DEFAULT_REMOVAL.ensiharvennus)}, uudistushakkuissa koko puusto.
    Hinnat: ${p?.source || 'Metsäteollisuus ry:n puukaupan viikkoseuranta'} ja Luonnonvarakeskus (tilastotietokanta), kunta: Tilastokeskus. Luken ja Tilastokeskuksen aineistot <a href="${CC_BY}" target="_blank" rel="noopener">CC BY 4.0</a>.</p>`;
}

function hasUudistus(estimate, year) {
    return estimate.plans.some(p => p.year === year && p.method === 'uudistus');
}

const pct = (v) => `${Math.round(v * 100)} %`;

/** Ulkoisesta lähteestä tuleva teksti (esim. kunnan nimi WFS:stä) HTML:ään. */
function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function periodShort(period) {
    const w = period?.match(/^(\d{4})W(\d{2})$/);
    if (w) return `vko ${Number(w[2])}/${w[1]}`;
    const m = period?.match(/^(\d{4})M(\d{2})$/);
    return m ? `${Number(m[2])}/${m[1]}` : '';
}

/* ---------- Tapahtumat ---------- */

function ctxOf(el) {
    return el.closest('[data-ctx="demo"]') ? demoCtx : parcelCtx;
}

function wireOnce() {
    if (wired) return;
    wired = true;
    purchases.onChange(() => {
        renderAll();
        if (purchases.isEntitled() && parcelCtx.pendingParcel !== undefined) {
            ensurePrices(parcelCtx, parcelCtx.pendingParcel);
            delete parcelCtx.pendingParcel;
        }
    });

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-est]');
        if (!btn || btn.tagName === 'SELECT') return;
        const ctx = ctxOf(btn);
        switch (btn.dataset.est) {
            case 'paywall': openPaywall(); break;
            case 'demo': closePaywall(); openDemo(); break;
            case 'open-tab': document.querySelector('.tabbar [data-tab="arvio"]')?.click(); break;
            case 'refresh': ensurePrices(ctx, null, { force: true }); break;
            case 'method': ctx.method = btn.dataset.m; renderAll(); break;
            case 'reset': saveOverrides({}); renderAll(); break;
            case 'share': shareReport(ctx); break;
            case 'buy': buy(btn); break;
            case 'restore': restore(btn); break;
            case 'close-paywall': closePaywall(); break;
            case 'close-demo': closeDemo(); break;
        }
    });

    document.addEventListener('change', (e) => {
        const el = e.target;
        if (el.matches?.('select[data-est="region"]')) {
            const ctx = ctxOf(el);
            ctx.region = el.value;
            ctx.prices = loadCachedPrices(ctx.region);
            ensurePrices(ctx, null);
        } else if (el.matches?.('input.est-price')) {
            const { m, s, a } = el.dataset;
            const overrides = loadOverrides();
            const value = parsePriceInput(el.value);
            const net = ctxOf(el).prices?.table?.[m]?.[s]?.[a] ?? null;
            overrides[m] = overrides[m] || {};
            overrides[m][s] = overrides[m][s] || {};
            if (value === null || value === net) delete overrides[m][s][a];
            else overrides[m][s][a] = value;
            if (Object.keys(overrides[m][s]).length === 0) delete overrides[m][s];
            if (Object.keys(overrides[m]).length === 0) delete overrides[m];
            saveOverrides(overrides);
            renderAll();
        }
    });
}

async function shareReport(ctx) {
    const { table, estimate } = compute(ctx);
    const label = ctx.demo ? 'esimerkkimetsa' : (ctx.label || 'kiinteisto');
    const report = buildEstimateReport({
        label: ctx.demo ? 'Esimerkkimetsä (kuvitteellinen)' : ctx.label,
        regionName: PRICE_REGIONS[ctx.region]?.name || '',
        prices: ctx.prices,
        table,
        estimate
    });
    try {
        await shareTextFile(`hinta-arvio_${label.replace(/[^\w-]+/g, '_')}.csv`, report);
    } catch {
        // Jakaminen peruttu tai ei mahdollinen
    }
}

/* ---------- Ostonäkymä ---------- */

async function openPaywall() {
    closePaywall();
    const el = document.createElement('div');
    el.id = 'paywall';
    el.innerHTML = `<div class="pw-dim" data-est="close-paywall"></div>
    <div class="pw-sheet" role="dialog" aria-modal="true" aria-labelledby="pw-title">
        <button type="button" class="pw-close" data-est="close-paywall" aria-label="Sulje">×</button>
        <h2 id="pw-title">Puukaupan hinta-arvio</h2>
        <p>Näe, paljonko kiinteistön ehdotetut hakkuut ovat arvoltaan alueen tuoreilla kantohinnoilla.</p>
        <ul>
            <li>Alueen kantohinnat yhdellä napautuksella</li>
            <li>Omat hinnat esim. saamasi puukauppatarjouksen mukaan</li>
            <li>Arvio vuosittain ja kuvioittain</li>
            <li>Arvioraportti jaettavaksi esim. kuolinpesän osakkaille</li>
            <li>Kertaosto, ei tilausta – kaikki kiinteistöt</li>
        </ul>
        <button type="button" class="est-btn-outline pw-wide" data-est="demo">Kokeile esimerkkimetsällä</button>
        <div class="pw-price"><span>Kertamaksu</span><b class="pw-amount">…</b></div>
        <button type="button" class="est-btn pw-wide pw-buy" data-est="buy" disabled>Osta hinta-arvio</button>
        <button type="button" class="est-link pw-restore" data-est="restore">Palauta aiempi osto</button>
        <div class="pw-msg" aria-live="polite"></div>
        <p class="est-fine">Hinnat: Metsäteollisuus ry:n puukaupan viikkoseuranta ja Luonnonvarakeskuksen tilastot. Arvio on suuntaa-antava.</p>
    </div>`;
    document.body.appendChild(el);
    try {
        const product = await purchases.getProduct();
        if (!document.getElementById('paywall')) return;
        if (product) {
            el.querySelector('.pw-amount').textContent = product.displayPrice;
            el.querySelector('.pw-buy').disabled = false;
        } else {
            el.querySelector('.pw-amount').textContent = '–';
            el.querySelector('.pw-msg').textContent = 'Tuotetta ei saatu kaupasta juuri nyt. Yritä myöhemmin uudelleen.';
        }
    } catch {
        el.querySelector('.pw-amount').textContent = '–';
        el.querySelector('.pw-msg').textContent = 'Kauppaan ei saatu yhteyttä.';
    }
}

function closePaywall() {
    document.getElementById('paywall')?.remove();
}

async function buy(btn) {
    const msg = document.querySelector('#paywall .pw-msg');
    btn.disabled = true;
    try {
        const status = await purchases.purchase();
        if (status === 'purchased') {
            closePaywall();
            closeDemo();
            document.querySelector('.tabbar [data-tab="arvio"]')?.click();
        } else if (status === 'pending') {
            if (msg) msg.textContent = 'Osto odottaa hyväksyntää.';
        }
    } catch {
        if (msg) msg.textContent = 'Osto ei onnistunut. Yritä uudelleen.';
    } finally {
        btn.disabled = false;
    }
}

async function restore(btn) {
    const msg = document.querySelector('#paywall .pw-msg');
    btn.disabled = true;
    try {
        const owned = await purchases.restore();
        if (owned) closePaywall();
        else if (msg) msg.textContent = 'Aiempaa ostoa ei löytynyt tällä Apple ID:llä.';
    } catch {
        if (msg) msg.textContent = 'Palautus ei onnistunut. Yritä uudelleen.';
    } finally {
        btn.disabled = false;
    }
}

/* ---------- Esimerkkimetsä ---------- */

async function openDemo() {
    closeDemo();
    const el = document.createElement('div');
    el.id = 'demo-view';
    el.innerHTML = `<div class="demo-head">
        <div><b>Esimerkkimetsä</b><span>Kuvitteellinen tila hinta-arvion kokeiluun</span></div>
        <button type="button" class="pw-close" data-est="close-demo" aria-label="Sulje">×</button>
    </div>
    <div class="demo-body" data-ctx="demo"><div class="estimate-root" data-ctx="demo"></div>
        ${purchases.isEntitled() ? '' : '<button type="button" class="est-btn pw-wide" data-est="paywall">Avaa hinta-arvio omille kiinteistöille</button>'}
    </div>`;
    document.body.appendChild(el);
    if (!demoData) {
        try {
            demoData = await (await fetch('demo/esimerkkimetsa.json')).json();
        } catch {
            demoData = { features: [], region: 'koko-maa' };
        }
    }
    Object.assign(demoCtx, newCtx(), { demo: true, features: demoData.features, label: demoData.name, region: demoData.region || 'keski-suomi' });
    renderAll();
    ensurePrices(demoCtx, null);
}

function closeDemo() {
    document.getElementById('demo-view')?.remove();
}
