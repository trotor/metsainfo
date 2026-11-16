/**
 * Haut: Väyläviraston Digiroad (tiet ja rajoitukset, WFS) ja Metsäkeskuksen
 * korjuukelpoisuuskartan alue. Ruudut välimuistissa; sama tielinkki
 * kahdessa ruudussa lasketaan kerran (link_id).
 */

import { WMS_URL } from './rasteri.js';

export const DIGIROAD_URL = 'https://avoinapi.vaylapilvi.fi/vaylatiedot/digiroad/ows';
export const ROAD_TILE = 2000; // m

const LAYERS = {
    tiet: 'digiroad:dr_tielinkki_hall_lk',
    kelirikko: 'digiroad:dr_kelirikko',
    tiekunta: 'digiroad:tiekunnalliset_yksityistiet',
    massa: 'digiroad:dr_max_massa',
    yhdistelma: 'digiroad:dr_yhdistelman_max_massa'
};

export function tileKeys(bbox, size = ROAD_TILE) {
    const keys = [];
    for (let x = Math.floor(bbox.minX / size); x <= Math.floor(bbox.maxX / size); x++) {
        for (let y = Math.floor(bbox.minY / size); y <= Math.floor(bbox.maxY / size); y++) keys.push(`${x},${y}`);
    }
    return keys;
}

function tileBbox(key, size = ROAD_TILE) {
    const [x, y] = key.split(',').map(Number);
    return [x * size, y * size, (x + 1) * size, (y + 1) * size];
}

export function wfsUrl(layer, bbox) {
    const params = new URLSearchParams({
        service: 'WFS', version: '2.0.0', request: 'GetFeature', typeNames: layer,
        outputFormat: 'application/json', srsName: 'EPSG:3067', bbox: `${bbox.join(',')},EPSG:3067`
    });
    return `${DIGIROAD_URL}?${params}`;
}

/** GeoJSON-tielinkki → { id, coords, props } (monirivinen pilkotaan osiin). */
export function toLinks(feature) {
    const g = feature.geometry;
    const parts = g?.type === 'LineString' ? [g.coordinates] : g?.type === 'MultiLineString' ? g.coordinates : [];
    const id = feature.properties?.link_id ?? feature.id;
    return parts.map((coords, i) => ({
        id: parts.length > 1 ? `${id}#${i}` : id,
        linkId: id,
        coords: coords.map(([x, y]) => [x, y]),
        props: feature.properties || {}
    }));
}

/**
 * fetchFn(url) → Response. Palauttaa { links(bbox), restrictions(bbox) }.
 * Kumpikin: { …, partial } — partial, jos jokin ruutu puuttui tai jäi vajaaksi.
 */
export function createRoadSource({ fetchFn = (...a) => fetch(...a) } = {}) {
    const cache = new Map(); // `${layer}|${key}` → Promise<{ features, partial }>

    function tile(layer, key) {
        const k = `${layer}|${key}`;
        if (!cache.has(k)) {
            const p = fetchFn(wfsUrl(layer, tileBbox(key)))
                .then(res => {
                    if (!res.ok) throw new Error(`Digiroad HTTP ${res.status}`);
                    return res.json();
                })
                .then(json => {
                    const features = json.features || [];
                    const matched = Number(json.numberMatched);
                    return { features, partial: Number.isFinite(matched) && matched > features.length };
                });
            p.catch(() => cache.delete(k)); // virhe: seuraava yritys hakee uudelleen
            cache.set(k, p);
        }
        return cache.get(k);
    }

    async function collect(layer, bbox) {
        const results = await Promise.allSettled(tileKeys(bbox).map(key => tile(layer, key)));
        const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        if (!ok.length && results.length) throw results[0].reason;
        return { features: ok.flatMap(r => r.features), partial: ok.length < results.length || ok.some(r => r.partial) };
    }

    return {
        async links(bbox) {
            const { features, partial } = await collect(LAYERS.tiet, bbox);
            const seen = new Map();
            for (const f of features) for (const l of toLinks(f)) seen.set(l.id, l);
            return { links: [...seen.values()], partial };
        },
        /** Rajoitukset link_id:n mukaan; kg-arvot numeroina. */
        async restrictions(bbox) {
            const [kelirikko, tiekunta, massa, yhdistelma] = await Promise.all(
                ['kelirikko', 'tiekunta', 'massa', 'yhdistelma'].map(n => collect(LAYERS[n], bbox)));
            const byLink = (features, value) => {
                const m = new Map();
                for (const f of features) {
                    const p = f.properties || {};
                    const v = value(p);
                    const old = m.get(p.link_id);
                    if (!old || (v?.kg ?? 0) < (old?.kg ?? Infinity)) m.set(p.link_id, v);
                }
                return m;
            };
            return {
                kelirikko: byLink(kelirikko.features, p => ({
                    kg: Number(p.arvo), alku: p.kestoalku1 || null, loppu: p.kestolopp1 || null
                })),
                tiekunta: new Set(tiekunta.features.map(f => f.properties?.link_id)),
                massa: byLink([...massa.features, ...yhdistelma.features], p => ({ kg: Number(p.arvo) })),
                partial: [kelirikko, tiekunta, massa, yhdistelma].some(r => r.partial)
            };
        }
    };
}

/** Korjuukelpoisuuskartan alueen nimi (esim. "Jyvaskyla_2010") pisteessä. */
export async function harvestArea([x, y], { fetchFn = (...a) => fetch(...a) } = {}) {
    const params = new URLSearchParams({
        service: 'WMS', version: '1.3.0', request: 'GetFeatureInfo',
        layers: 'korjuukelpoisuus_aluerajat', query_layers: 'korjuukelpoisuus_aluerajat',
        crs: 'EPSG:3067', bbox: [x - 50, y - 50, x + 50, y + 50].join(','),
        width: '101', height: '101', i: '50', j: '50', info_format: 'application/json'
    });
    try {
        const res = await fetchFn(`${WMS_URL}?${params}`);
        if (!res.ok) return null;
        const json = await res.json();
        return json.features?.[0]?.properties?.nimi || null;
    } catch {
        return null;
    }
}
