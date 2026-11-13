/**
 * Hinta-arvion verkkohaut ja tallennus laitteelle:
 * - kantohinnat Luken tilastotietokannasta (viikko + kuukausi, puuttuvat täydennetään)
 * - kunta kiinteistön sijainnista Tilastokeskuksen WFS:llä (hinta-alueen päättely)
 * Molemmat palvelut sallivat CORSin, joten haut toimivat suoraan sovelluksesta.
 * Käytetään vain sovelluksessa (hinta-arvio ei ole verkkoversiossa käytössä).
 */

import { PRICE_REGIONS } from '../pricing/region.js';
import { WEEKLY_URL, MONTHLY_URL, weeklyQuery, monthlyQuery, parseWeekly, parseMonthly, fillMissing } from '../pricing/prices.js';

const CACHE_PREFIX = 'metsainfo.hinnat.';
const OVERRIDES_KEY = 'metsainfo.hintaOverrides';
const KUNTA_WFS = 'https://geo.stat.fi/geoserver/tilastointialueet/wfs';

function readJson(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Tallennus ei ole välttämätöntä
    }
}

async function postJson(fetchImpl, url, body) {
    const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Hakee alueen kantohinnat. Ensisijainen lähde on viikkoseuranta; puuttuvat
 * solut täydennetään alueen kuukausitilastosta ja koko maan luvuista.
 */
export async function fetchPrices(regionKey, { fetch: fetchImpl = globalThis.fetch, now = Date.now } = {}) {
    const region = PRICE_REGIONS[regionKey] || PRICE_REGIONS['koko-maa'];
    const country = PRICE_REGIONS['koko-maa'];
    const [w, m] = await Promise.allSettled([
        postJson(fetchImpl, WEEKLY_URL, weeklyQuery([region.weekly, country.weekly], 4)),
        postJson(fetchImpl, MONTHLY_URL, monthlyQuery([region.monthly, country.monthly]))
    ]);
    if (w.status === 'rejected' && m.status === 'rejected') {
        throw new Error('Hintojen haku epäonnistui');
    }
    const sources = [];
    if (w.status === 'fulfilled') sources.push(parseWeekly(w.value, region.weekly));
    if (m.status === 'fulfilled') sources.push(parseMonthly(m.value, region.monthly));
    if (w.status === 'fulfilled') sources.push(parseWeekly(w.value, country.weekly));
    if (m.status === 'fulfilled') sources.push(parseMonthly(m.value, country.monthly));

    const [primary, ...fallbacks] = sources;
    const { table, filled } = fillMissing(primary, ...fallbacks);
    const result = {
        region: regionKey,
        period: primary.period,
        periodLabel: primary.periodLabel,
        source: primary.source,
        fetchedAt: now(),
        table,
        filled
    };
    writeJson(CACHE_PREFIX + regionKey, result);
    return result;
}

export function loadCachedPrices(regionKey) {
    return readJson(CACHE_PREFIX + regionKey);
}

export function loadOverrides() {
    const o = readJson(OVERRIDES_KEY);
    return o && typeof o === 'object' ? o : {};
}

export function saveOverrides(overrides) {
    writeJson(OVERRIDES_KEY, overrides || {});
}

/** Kunta (numero ja nimi) EPSG:3067-pisteestä tai null. */
export async function lookupKunta(x, y, { fetch: fetchImpl = globalThis.fetch } = {}) {
    const params = new URLSearchParams({
        service: 'WFS',
        version: '1.1.0',
        request: 'GetFeature',
        typeName: 'tilastointialueet:kunta4500k',
        outputFormat: 'application/json',
        propertyName: 'kunta,nimi',
        CQL_FILTER: `INTERSECTS(geom,POINT(${Math.round(x)} ${Math.round(y)}))`
    });
    try {
        const res = await fetchImpl(`${KUNTA_WFS}?${params}`);
        if (!res.ok) return null;
        const data = await res.json();
        const p = data?.features?.[0]?.properties;
        return p?.kunta ? { kunta: String(p.kunta), nimi: p.nimi || '' } : null;
    } catch {
        return null;
    }
}
