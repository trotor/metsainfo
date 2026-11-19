/**
 * Puukaupan hinta-arvio (maksullinen lisäosa, vain kaupan sovelluksessa).
 * - Arvio-välilehti: hinta-alue, kantohinnat (verkosta tai omat), tulokset
 * - arvo-kortti yhteenvetoon (lukittuna ilman ostoa: summaa ei näytetä)
 * - ostonäkymä ja kuvitteellinen esimerkkimetsä kokeiluun
 * Verkkoversiossa (ostot eivät käytössä) mikään tästä ei renderöidy.
 */

import { purchases } from '../platform/purchases.js';
import { FEATURES } from '../features.js';
import { isNative } from '../platform/index.js';
import { fetchPrices, loadCachedPrices, loadOverrides, saveOverrides, lookupKunta } from '../platform/prices.js';
import { shareTextFile } from '../platform/share.js';
import { PRICE_REGIONS, regionForKunta, parcelPoint } from '../pricing/region.js';
import { applyOverrides, METHODS, SPECIES } from '../pricing/prices.js';
import { estimateParcel, cuttingSummary, DEFAULT_REMOVAL } from '../pricing/estimate.js';
import { formatNumber } from '../utils.js';
import { locale } from '../i18n.js';
import { T } from './estimate-teksti.js';
import { parsePriceInput, formatEuro, formatPrice, yearRangeLabel, buildEstimateReport, METHOD_LABELS, SPECIES_LABELS } from '../pricing/format.js';

const STALE_MS = 7 * 24 * 3600 * 1000;
const SEEN_KEY = 'metsainfo.hintaArvioNahty';

// Nykyinen kiinteistö (yhteenvedosta) ja esimerkkimetsä omina tiloinaan
const parcelCtx = newCtx();
const demoCtx = newCtx();
let demoData = null;
let wired = false;
const kuntaCache = new Map();

function newCtx() {
    return { gen: 0, features: [], label: '', region: null, regionAuto: '', prices: null, autoRegion: null, loading: false, resolving: false, error: '', method: 'uudistus', demo: false, valinta: false, pricesOpen: false, breakdownOpen: false };
}

/** Julkiset kauppasivut: verkkoversio ohjaa hinta-arvioon sovelluksen kautta (#36). */
export const STORE_LINKS = {
    appStore: 'https://apps.apple.com/fi/app/mets%C3%A4info/id6832988855',
    googlePlay: 'https://play.google.com/store/apps/details?id=fi.inetor.metsainfo'
};

/** Verkkoversio: ei kauppaa eikä sovellusta. Hinta-arvio näkyy esittelynä ja esimerkkinä. */
const webOnly = () => !purchases.isAvailable() && !isNative();

export function estimateEnabled() {
    return purchases.isAvailable() || webOnly();
}

// Ostonäkymän listaan vain kertaostoon kuuluvat toiminnot (js/features.js product);
// maksuttomat (myöhemmin ehkä maksulliset) eivät ole listalla
const ETU_TOIMINNOT = [['maastotila', 'etuMaasto'], ['lahihaku', 'etuLahihaku'], ['arvovari', 'etuArvovari'], ['huomiot', 'etuHuomiot'], ['saavutettavuus', 'etuSaavutettavuus']];

const storeLinksHtml = () => `<div class="est-kaupat">
    <a class="est-btn est-kauppa" href="${STORE_LINKS.appStore}" target="_blank" rel="noopener">${T.appStore}</a>
    <a class="est-btn est-kauppa" href="${STORE_LINKS.googlePlay}" target="_blank" rel="noopener">${T.googlePlay}</a>
</div>`;

const unlocked = (ctx) => ctx.demo || purchases.isEntitled();

/* ---------- Yhteenvedon osat (summary.js) ---------- */

export function estimateTabButton() {
    if (!estimateEnabled()) return '';
    const badge = isNew() ? ` <span class="est-new">${T.uutta}</span>` : '';
    return `<button type="button" role="tab" data-tab="arvio">${T.valilehti}${badge}</button>`;
}

/* ---------- Uutta-merkki: näkyy, kunnes hinta-arvioon on tutustuttu ---------- */

function isNew() {
    if (purchases.isEntitled()) return false;
    try {
        return localStorage.getItem(SEEN_KEY) !== '1';
    } catch {
        return false;
    }
}

function markSeen() {
    try {
        localStorage.setItem(SEEN_KEY, '1');
    } catch {
        // Ei tallennustilaa: merkki poistuu tästä näkymästä
    }
    document.querySelectorAll('.est-new').forEach(el => el.remove());
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
    // Uusi sukupolvi: edellisen kiinteistön keskeneräiset haut hylätään
    Object.assign(parcelCtx, newCtx(), { gen: parcelCtx.gen + 1, features, label: label || '', valinta: Boolean(parcel?.properties?.valinta) });
    renderAll();
    if (purchases.isEntitled()) ensurePrices(parcelCtx, parcel);
    else parcelCtx.pendingParcel = parcel;
}

/* ---------- Tila ja haut ---------- */

/** Palauttaa false, jos konteksti vaihtui haun aikana (tulos hylätään). */
async function resolveRegion(ctx, parcel, gen) {
    if (ctx.region) return true;
    // Kuvitteellinen tila (kuvaustila): alue annettu, kuntaa ei haeta
    if (parcel?.properties?.priceRegion) {
        ctx.region = parcel.properties.priceRegion;
        ctx.autoRegion = ctx.region;
        ctx.regionAuto = '';
        return true;
    }
    let region = null;
    let kuntaName = '';
    const point = parcelPoint(parcel);
    if (point) {
        const id = parcel.properties?.nationalCadastralReference || point.join(',');
        let kunta = kuntaCache.get(id);
        if (kunta === undefined) {
            ctx.resolving = true;
            renderAll();
            kunta = await lookupKunta(point[0], point[1]);
            if (ctx.gen !== gen) return false;
            ctx.resolving = false;
            // Epäonnistunutta hakua ei tallenneta: yritetään uudelleen seuraavalla kerralla
            if (kunta) kuntaCache.set(id, kunta);
        }
        region = regionForKunta(kunta?.kunta);
        kuntaName = kunta?.nimi || '';
    }
    ctx.region = region || 'koko-maa';
    ctx.autoRegion = ctx.region;
    ctx.regionAuto = kuntaName;
    return true;
}

async function ensurePrices(ctx, parcel, { force = false } = {}) {
    const gen = ctx.gen;
    if (!(await resolveRegion(ctx, parcel, gen))) return;
    const region = ctx.region;
    const cached = loadCachedPrices(region);
    if (cached) ctx.prices = cached;
    const stale = !cached || Date.now() - (cached.fetchedAt || 0) > STALE_MS;
    if (!force && !stale) { renderAll(); return; }
    ctx.loading = true;
    ctx.error = '';
    renderAll();
    let result = null;
    let failed = false;
    try {
        result = await fetchPrices(region);
    } catch {
        failed = true;
    }
    // Kiinteistö tai alue vaihtui haun aikana: uudempi haku hoitaa näkymän
    if (ctx.gen !== gen || ctx.region !== region) return;
    if (failed) {
        ctx.error = cached
            ? T.paivitysEpaonnistui
            : T.hintojaEiSaatu;
    } else {
        ctx.prices = result;
    }
    ctx.loading = false;
    renderAll();
}

const overrideScope = (ctx) => (ctx.demo ? 'demo' : 'kiinteisto');

function currentTable(ctx) {
    const base = ctx.prices?.table || emptyFromSpecies();
    return applyOverrides(base, loadOverrides(overrideScope(ctx)));
}

/** Latausilmaisin: hidas haku ei näytä jumittuneelta. */
function busyHtml(ctx) {
    if (ctx.resolving) return `<div class="est-loading" role="status"><span class="est-spinner"></span>${T.selvitetaanAluetta}</div>`;
    if (ctx.loading) return `<div class="est-loading" role="status"><span class="est-spinner"></span>${T.haetaanHintoja}</div>`;
    return '';
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
    const head = `<h3>${T.korttiOtsikko}</h3>`;
    if (!unlocked(ctx)) {
        const t = teaser(ctx.features);
        if (!t) {
            return `${head}<div class="est-card-row"><div><div class="est-big est-locked">🔒 ? ??? €</div>
                <div class="est-muted">${T.hakkuidenArvo}</div></div>
                <button type="button" class="est-btn-arvo" data-est="paywall">${T.avaa}</button></div>`;
        }
        return `${head}<div class="est-card-row"><div><div class="est-teaser">${t.line}</div>
            <div class="est-muted">${t.question}</div></div>
            <button type="button" class="est-btn-arvo" data-est="paywall">${T.naytaArvo}</button></div>`;
    }
    if ((ctx.loading || ctx.resolving) && !ctx.prices) return `${head}${busyHtml(ctx)}`;
    const { table, estimate } = compute(ctx);
    if (!hasPrices(table)) {
        return `${head}<div class="est-card-row"><div class="est-muted">${ctx.error || T.hinnatPuuttuvat}</div>
            <button type="button" class="est-btn-arvo" data-est="open-tab">${T.avaa}</button></div>`;
    }
    const range = yearRangeLabel(estimate.byYear);
    const region = regionName(ctx.region);
    const missing = estimate.missing || estimate.stock.missing
        ? `<div class="est-warn">${T.korttiVajaa}</div>` : '';
    return `${head}<div class="est-card-row"><div><div class="est-big">${formatEuro(estimate.total)}</div>
        <div class="est-muted">${T.korttiHakkuut(range)} · ${region} ${escapeHtml(ctx.prices?.periodLabel || '')}</div></div>
        <button type="button" class="est-btn-arvo" data-est="open-tab">${T.nayta}</button></div>${missing}${busyHtml(ctx)}`;
}

/** Kiinteistön hakkuuehdotukset ilman euroja: kertoo, mitä osto avaa. */
function teaser(features) {
    const s = cuttingSummary(features || []);
    if (s.count > 0) {
        const first = s.years[0];
        const last = s.years[s.years.length - 1];
        const years = s.years.length === 0 ? '' : first === last ? T.vuonna(first) : T.vuosina(first, last);
        return {
            line: T.ehdotuksia(s.count, formatNumber(roundVolume(s.volume), 0, locale())),
            question: T.ehdotusKysymys(years, s.count)
        };
    }
    if (s.stockVolume > 0) {
        return {
            line: T.eiEhdotuksia(formatNumber(roundVolume(s.stockVolume), 0, locale())),
            question: T.puustoKysymys
        };
    }
    return null;
}

const roundVolume = (v) => (v >= 100 ? Math.round(v / 10) * 10 : Math.round(v));

function lockedPanelHtml(ctx) {
    const t = teaser(ctx.features);
    return `<div class="summary-section group-arvo est-intro">
        <h3>${T.nimi}</h3>
        ${t ? `<div class="est-teaser">${t.line}</div><div class="est-muted">${t.question}</div>` : ''}
        <p>${ctx.valinta ? T.esittelyValinta : T.esittely}</p>
        ${webOnly() ? `<p class="est-sovellus">${T.sovelluksessa}</p>${storeLinksHtml()}` : ''}
        <div class="est-actions">
            <button type="button" class="est-btn-outline" data-est="demo">${T.kokeileEsimerkilla}</button>
            ${webOnly() ? '' : `<button type="button" class="est-btn" data-est="paywall">${T.avaaArvio}</button>`}
        </div>
    </div>`;
}

function panelHtml(ctx) {
    if (!unlocked(ctx)) return lockedPanelHtml(ctx);
    const { table, estimate } = compute(ctx);
    const overrides = loadOverrides(overrideScope(ctx));
    const p = ctx.prices;
    const busy = ctx.loading || ctx.resolving;
    const priced = hasPrices(table);
    const region = regionName(ctx.region);
    const regionOptions = Object.keys(PRICE_REGIONS)
        .map(key => `<option value="${key}"${key === ctx.region ? ' selected' : ''}>${regionName(key)}</option>`).join('');

    const srcLine = p ? escapeHtml(`${p.source}, ${p.periodLabel}`) : (busy ? T.haetaan : T.eiHaettujaHintoja);
    const filledNote = p?.filled?.length
        ? `<div class="est-muted">${T.taydennetty(escapeHtml([...new Set(p.filled.map(f => `${f.source} ${periodShort(f.period)}`))].join(', ')))}</div>` : '';

    const m = ctx.method;
    const rows = SPECIES.map(s => `<tr><td>${SPECIES_LABELS[s]}</td>${['tukki', 'kuitu'].map(a => {
        const own = typeof overrides?.[m]?.[s]?.[a] === 'number';
        return `<td><input inputmode="decimal" class="est-price${own ? ' edited' : ''}" data-m="${m}" data-s="${s}" data-a="${a}" value="${formatPrice(table[m][s][a])}" aria-label="${SPECIES_LABELS[s]} ${T.lajite[a]} €/m³"></td>`;
    }).join('')}</tr>`).join('');
    const anyOverride = Object.keys(overrides).length > 0;
    // Hinnat auki, jos niitä ei ole: käyttäjä voi hakea tai syöttää ne
    const open = ctx.pricesOpen || (!priced && !busy);
    const priceSummary = [region, p?.periodLabel || (busy ? T.haetaanPieni : T.eiHintoja), anyOverride ? T.omiaHintoja : '']
        .filter(Boolean).map(escapeHtml).join(' · ');

    const result = priced
        ? resultHtml(estimate, { valinta: ctx.valinta })
        : (busy ? '' : `<div class="summary-section group-arvo est-result"><h3>${T.ehdotetutHakkuut}</h3><div class="est-muted">${T.hinnatPuuttuvatHae}</div></div>`);

    return `
    ${busyHtml(ctx)}
    ${ctx.error ? `<div class="est-error">${ctx.error}</div>` : ''}
    ${result}
    ${priced ? `<div class="summary-section group-puusto est-stock">
        <h3>${T.kokoPuusto}</h3>
        <div class="est-big est-green">${formatEuro(estimate.stock.value)}</div>
        <div class="est-muted">${T.kantoraha}</div>
        ${estimate.stock.missing ? `<div class="est-warn">${T.puustoVajaa(estimate.stock.missing)}</div>` : ''}
    </div>` : ''}
    ${priced ? breakdownHtml(ctx, estimate) : ''}

    <div class="est-prices">
        <button type="button" class="est-prices-head" data-est="toggle-prices" aria-expanded="${open}">
            <span><b>${T.hinnat}</b> ${priceSummary}</span><span class="est-prices-act">${open ? T.piilota : T.muokkaa}</span>
        </button>
        <div class="est-prices-body"${open ? '' : ' hidden'}>
            <div class="est-src">
                <div><label class="est-region">${T.hintaAlue} <select data-est="region">${regionOptions}</select></label>
                    <div class="est-muted">${srcLine}${ctx.regionAuto && !ctx.demo && ctx.region === ctx.autoRegion ? T.kunta(escapeHtml(ctx.regionAuto)) : ''}</div></div>
                <button type="button" class="est-btn" data-est="refresh"${busy ? ' disabled' : ''}>${T.haeVerkosta}</button>
            </div>
            ${filledNote}
            <div class="est-seg" role="tablist">${METHODS.map(x => `<button type="button" data-est="method" data-m="${x}" aria-selected="${x === m}">${METHOD_LABELS[x]}</button>`).join('')}</div>
            <table class="est-table"><thead><tr><th>€/m³</th><th>${T.tukki}</th><th>${T.kuitu}</th></tr></thead><tbody>${rows}</tbody></table>
            ${anyOverride ? `<div class="est-muted">${T.omatSyotetty} <button type="button" class="est-link" data-est="reset">${T.palautaVerkon}</button></div>` : ''}
        </div>
    </div>

    <div class="est-actions">
        <button type="button" class="est-btn-outline" data-est="share"${priced ? '' : ' disabled'}>${T.jaa}</button>
    </div>
    <p class="est-fine">${T.hienoArvio(pct(DEFAULT_REMOVAL.harvennus), pct(DEFAULT_REMOVAL.ensiharvennus))}
    ${T.hienoLahteet(escapeHtml(p?.source || T.oletusLahde), `<a href="${T.ccBy}" target="_blank" rel="noopener">CC BY 4.0</a>`)}</p>`;
}

/* ---------- Erittely: mistä arvio koostuu ---------- */

const whole = (v) => formatNumber(Math.round(v || 0), 0, locale());

function assortmentTable(rows, total) {
    // Useampi hakkuutapa: rivit hakkuutavan väliotsikoiden alle (hinnat eroavat hakkuutavoittain)
    const grouped = new Set(rows.map(r => r.method)).size > 1;
    const C = T.sarakkeet;
    const body = rows.map((r, i) => {
        const head = grouped && (i === 0 || rows[i - 1].method !== r.method)
            ? `<tr class="est-ryhma"><td colspan="4">${METHOD_LABELS[r.method]}</td></tr>` : '';
        return `${head}<tr><td>${SPECIES_LABELS[r.species]}, ${T.lajite[r.assortment]}</td><td>${whole(r.volume)}</td><td>${r.price === null ? '–' : formatPrice(r.price)}</td><td>${r.value === null ? '–' : whole(r.value)}</td></tr>`;
    }).join('');
    return `<table class="est-table est-erittely-table">
        <thead><tr><th>${C.laji}</th><th>${C.m3}</th><th>${C.hinta}</th><th>${C.arvo}</th></tr></thead>
        <tbody>${body}
        <tr class="est-sum"><td>${T.yhteensaRivi}</td><td>${whole(rows.reduce((a, r) => a + r.volume, 0))}</td><td></td><td>${whole(total)}</td></tr></tbody>
    </table>`;
}

function averageLine(value, volume, area) {
    if (!(volume > 0) || !(area > 0)) return '';
    return `<div class="est-muted">${T.keskiarvo(whole(value / volume), whole(value / area), formatNumber(area, 1, locale()))}</div>`;
}

/** Kokoontaitettava erittely Arvio-välilehdellä: puutavaralajit, kuviot, keskiarvot ja huomiot. */
function breakdownHtml(ctx, estimate) {
    const open = ctx.breakdownOpen;
    const K = T.kuvioSarakkeet;
    const plans = [...estimate.plans].sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity) || (a.standNumber ?? 0) - (b.standNumber ?? 0));
    const hakkuut = estimate.plans.length ? `
        <h4>${T.erittelyHakkuut}</h4>
        ${assortmentTable(estimate.assortments, estimate.total)}
        ${averageLine(estimate.total, estimate.volume, estimate.area)}
        <h4>${T.erittelyKuviot}</h4>
        <table class="est-table est-erittely-table">
            <thead><tr><th>${K.kuvio}</th><th class="est-txt">${K.hakkuu}</th><th>${K.vuosi}</th><th>${K.ha}</th><th>${K.m3}</th><th>${K.arvo}</th></tr></thead>
            <tbody>${plans.map(p => `<tr><td>${p.standNumber ?? '–'}</td><td class="est-txt">${METHOD_LABELS[p.method]}${p.removal < 1 ? ` ${pct(p.removal)}` : ''}</td><td>${p.year ?? '–'}</td><td>${formatNumber(p.area, 1, locale())}</td><td>${whole(p.log + p.pulp)}</td><td>${p.missing ? '–' : whole(p.value)}</td></tr>`).join('')}</tbody>
        </table>
        <p class="est-muted">${T.poistumaHuom(pct(DEFAULT_REMOVAL.harvennus), pct(DEFAULT_REMOVAL.ensiharvennus))}</p>` : '';
    return `<div class="est-prices est-erittely">
        <button type="button" class="est-prices-head" data-est="toggle-breakdown" aria-expanded="${open}">
            <span><b>${T.erittely}</b></span><span class="est-prices-act">${open ? T.piilota : T.erittelyAvaa}</span>
        </button>
        <div class="est-prices-body"${open ? '' : ' hidden'}>
            <p class="est-muted">${T.laskenta}</p>
            ${hakkuut}
            <h4>${T.erittelyPuusto}</h4>
            ${assortmentTable(estimate.stock.assortments, estimate.stock.value)}
            ${averageLine(estimate.stock.value, estimate.stock.volume, estimate.stock.area)}
            <h4>${T.huomOtsikko}</h4>
            <ul class="est-huomiot">${T.huomiot.map(h => `<li>${h}</li>`).join('')}</ul>
        </div>
    </div>`;
}

/** Ehdotettujen hakkuiden summa ja vuosipalkit (Arvio-välilehti ja ostonäkymän esimerkki). */
function resultHtml(estimate, { valinta = false } = {}) {
    const maxYear = Math.max(1, ...estimate.byYear.map(y => y.value));
    const bars = estimate.byYear.map(y => `<div class="est-yr${hasUudistus(estimate, y.year) ? ' u' : ''}">
        <span>${y.year ?? '–'}</span><div style="width:${Math.max(2, Math.round(100 * y.value / maxYear))}%"></div><b>${formatEuro(y.value).replace('≈ ', '')}</b></div>`).join('');
    return `<div class="summary-section group-arvo est-result">
        <h3>${T.ehdotetutHakkuut}${estimate.byYear.length ? ` ${yearRangeLabel(estimate.byYear)}` : ''}</h3>
        ${estimate.plans.length ? `<div class="est-big">${formatEuro(estimate.total)}</div><div class="est-bars">${bars}</div>`
            : `<div class="est-muted">${valinta ? T.eiEhdotuksiaValinnalla : T.eiEhdotuksiaKiinteistolla}</div>`}
        ${estimate.missing ? `<div class="est-warn">${T.summaVajaa(estimate.missing)}</div>` : ''}
    </div>`;
}

function hasUudistus(estimate, year) {
    return estimate.plans.some(p => p.year === year && p.method === 'uudistus');
}

const pct = (v) => T.prosentti(Math.round(v * 100));

/** Hinta-alueen nimi valitulla kielellä. */
const regionName = (key) => T.alueet[key] || PRICE_REGIONS[key]?.name || '';

/** Ulkoisesta lähteestä tuleva teksti (esim. kunnan nimi WFS:stä) HTML:ään. */
function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function periodShort(period) {
    const w = period?.match(/^(\d{4})W(\d{2})$/);
    if (w) return T.viikko(Number(w[2]), w[1]);
    const m = period?.match(/^(\d{4})M(\d{2})$/);
    return m ? `${Number(m[2])}/${m[1]}` : '';
}

/* ---------- Tapahtumat ---------- */

function ctxOf(el) {
    return el.closest('[data-ctx="demo"]') ? demoCtx : parcelCtx;
}

/**
 * Avaa hinta-arvion ostonäkymän myös ennen ensimmäistä kiinteistöä
 * (lisäosat, esim. js/huomiot/: työkalun voi avata heti käynnistyksen jälkeen).
 */
export function showPaywall() {
    wireOnce();
    openPaywall();
}

/** Avaa Esimerkkimetsän (esittelyn maksullisten kortista, js/esittely/). */
export function showDemo() {
    wireOnce();
    openDemo();
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
        if (e.target.closest?.('.tabbar [data-tab="arvio"]')) markSeen();
        const btn = e.target.closest('[data-est]');
        if (!btn || btn.tagName === 'SELECT') return;
        const ctx = ctxOf(btn);
        switch (btn.dataset.est) {
            case 'paywall': openPaywall(); break;
            case 'demo': closePaywall(); openDemo(); break;
            case 'open-tab': document.querySelector('.tabbar [data-tab="arvio"]')?.click(); break;
            case 'refresh': ensurePrices(ctx, null, { force: true }); break;
            case 'method': ctx.method = btn.dataset.m; renderAll(); break;
            case 'toggle-prices': ctx.pricesOpen = btn.getAttribute('aria-expanded') !== 'true'; renderAll(); break;
            case 'toggle-breakdown': ctx.breakdownOpen = btn.getAttribute('aria-expanded') !== 'true'; renderAll(); break;
            case 'reset': saveOverrides({}, overrideScope(ctx)); renderAll(); break;
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
            ctx.gen++;
            ctx.region = el.value;
            ctx.prices = loadCachedPrices(ctx.region);
            ctx.loading = false;
            ctx.resolving = false;
            ctx.error = '';
            ensurePrices(ctx, null);
        } else if (el.matches?.('input.est-price')) {
            const { m, s, a } = el.dataset;
            const ctx = ctxOf(el);
            const scope = overrideScope(ctx);
            const overrides = loadOverrides(scope);
            const value = parsePriceInput(el.value);
            // Virheellinen syöte ei poista aiempaa hintaa: palautetaan näkymä ennalleen
            if (value === null && el.value.trim() !== '') { renderAll(); return; }
            const net = ctx.prices?.table?.[m]?.[s]?.[a] ?? null;
            overrides[m] = overrides[m] || {};
            overrides[m][s] = overrides[m][s] || {};
            if (value === null || value === net) delete overrides[m][s][a];
            else overrides[m][s][a] = value;
            if (Object.keys(overrides[m][s]).length === 0) delete overrides[m][s];
            if (Object.keys(overrides[m]).length === 0) delete overrides[m];
            saveOverrides(overrides, scope);
            renderAll();
        }
    });
}

async function shareReport(ctx) {
    const { table, estimate } = compute(ctx);
    const label = ctx.demo ? T.tiedostoEsimerkki : (ctx.label || (ctx.valinta ? T.tiedostoValinta : T.tiedostoKiinteisto));
    const report = buildEstimateReport({
        label: ctx.demo ? T.esimerkkiRaportissa : ctx.label,
        regionName: regionName(ctx.region),
        prices: ctx.prices,
        table,
        estimate,
        valinta: ctx.valinta
    });
    try {
        await shareTextFile(T.tiedosto(label.replace(/[^\w-]+/g, '_')), report);
    } catch {
        // Jakaminen peruttu tai ei mahdollinen
    }
}

/* ---------- Ostonäkymä ---------- */

async function openPaywall() {
    closePaywall();
    markSeen();
    const el = document.createElement('div');
    el.id = 'paywall';
    const web = webOnly();
    el.innerHTML = `<div class="pw-dim" data-est="close-paywall"></div>
    <div class="pw-sheet" role="dialog" aria-modal="true" aria-labelledby="pw-title">
        <button type="button" class="pw-close" data-est="close-paywall" aria-label="${T.sulje}">×</button>
        <h2 id="pw-title">${T.nimi}</h2>
        <p>${T.pwEsittely}</p>
        <div class="pw-preview" aria-label="${T.esimerkkiAria}">
            <div class="pw-preview-label">${T.esikatselu}</div>
            <div class="pw-preview-body"><div class="est-loading"><span class="est-spinner"></span>${T.lasketaanEsimerkkia}</div></div>
        </div>
        <ul>
            <li>${T.etuHinnat}</li>
            <li>${T.etuRaportti}</li>
            ${ETU_TOIMINNOT.filter(([id]) => FEATURES[id]?.product).map(([, k]) => `<li>${T[k]}</li>`).join('')}
            <li>${T.etuKertaosto}</li>
        </ul>
        <button type="button" class="est-btn-outline pw-wide" data-est="demo">${T.kokeileEsimerkilla}</button>
        ${web
        // Verkossa ei ostoa: kerrotaan sovelluksesta ja ohjataan kauppoihin (#36)
        ? `<div class="pw-sovellus"><p>${T.sovelluksessa}</p>${storeLinksHtml()}</div>`
        : `<div class="pw-price"><span>${T.kertamaksu}</span><b class="pw-amount">…</b></div>
        <button type="button" class="est-btn pw-wide pw-buy" data-est="buy" disabled>${T.osta}</button>
        <button type="button" class="est-link pw-restore" data-est="restore">${T.palautaOsto}</button>
        <div class="pw-msg" aria-live="polite"><span class="est-loading pw-wait"><span class="est-spinner"></span>${T.haetaanHintaa}</span></div>
        <p class="est-fine">${T.pwLisat}</p>`}
        <p class="est-fine">${T.pwHieno}</p>
    </div>`;
    document.body.appendChild(el);
    renderPaywallPreview(el);
    if (web) return;
    try {
        // Kauppa ei aina vastaa (esim. ei verkkoa): ei jäädä odottamaan loputtomiin
        const product = await Promise.race([
            purchases.getProduct(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
        ]);
        if (!document.getElementById('paywall')) return;
        el.querySelector('.pw-msg').textContent = '';
        if (product) {
            el.querySelector('.pw-amount').textContent = product.displayPrice;
            el.querySelector('.pw-buy').disabled = false;
        } else {
            el.querySelector('.pw-amount').textContent = '–';
            el.querySelector('.pw-msg').textContent = T.eiTuotetta;
        }
    } catch {
        el.querySelector('.pw-amount').textContent = '–';
        el.querySelector('.pw-msg').textContent = T.eiYhteytta;
    }
}

function closePaywall() {
    document.getElementById('paywall')?.remove();
}

/** Esimerkkimetsän tulos oikeilla hinnoilla; ilman hintoja esikatselu jätetään pois. */
async function renderPaywallPreview(el) {
    const box = el.querySelector('.pw-preview');
    try {
        const demo = await loadDemo();
        if (!demo?.features?.length) throw new Error('ei esimerkkiä');
        const region = demo.region || 'keski-suomi';
        const prices = loadCachedPrices(region) || await withTimeout(fetchPrices(region), 10000);
        const table = applyOverrides(prices.table, loadOverrides('demo'));
        if (!hasPrices(table)) throw new Error('ei hintoja');
        const estimate = estimateParcel(demo.features, table);
        if (!el.isConnected) return;
        box.querySelector('.pw-preview-body').innerHTML = resultHtml(estimate)
            + `<div class="est-muted">${escapeHtml(`${regionName(region)}, ${prices.periodLabel || ''}`)}</div>`;
    } catch {
        box?.remove();
    }
}

function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

async function loadDemo() {
    if (!demoData) {
        try {
            demoData = await (await fetch('demo/esimerkkimetsa.json')).json();
        } catch {
            // Ei tallenneta tyhjää: yritetään uudelleen seuraavalla avauksella
            demoData = null;
        }
    }
    return demoData;
}

/** Lyhyt vahvistus näytön alareunaan. */
function showToast(text) {
    document.querySelector('.est-toast')?.remove();
    const el = document.createElement('div');
    el.className = 'est-toast';
    el.setAttribute('role', 'status');
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
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
            showToast(T.avattu);
        } else if (status === 'pending') {
            if (msg) msg.textContent = T.odottaa;
        }
    } catch {
        if (msg) msg.textContent = T.ostoEpaonnistui;
    } finally {
        btn.disabled = false;
    }
}

async function restore(btn) {
    const msg = document.querySelector('#paywall .pw-msg');
    btn.disabled = true;
    try {
        const owned = await purchases.restore();
        if (owned) {
            closePaywall();
            showToast(T.palautettu);
        } else if (msg) msg.textContent = T.eiAiempaa;
    } catch {
        if (msg) msg.textContent = T.palautusEpaonnistui;
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
        <div><b>${T.esimerkkimetsa}</b><span>${T.kuvitteellinen}</span></div>
        <button type="button" class="pw-close" data-est="close-demo" aria-label="${T.sulje}">×</button>
    </div>
    <div class="demo-body" data-ctx="demo"><div class="estimate-root" data-ctx="demo"></div>
        ${purchases.isEntitled() ? '' : `<button type="button" class="est-btn pw-wide" data-est="paywall">${T.avaaOmille}</button>`}
    </div>`;
    document.body.appendChild(el);
    markSeen();
    await loadDemo();
    Object.assign(demoCtx, newCtx(), { gen: demoCtx.gen + 1, demo: true, features: demoData?.features || [], label: demoData?.name || '', region: demoData?.region || 'keski-suomi' });
    renderAll();
    ensurePrices(demoCtx, null);
}

function closeDemo() {
    document.getElementById('demo-view')?.remove();
}
