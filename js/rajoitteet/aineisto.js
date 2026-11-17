/**
 * Metsätöitä rajoittavat kohteet avoimista WFS-rajapinnoista (kokeilu).
 * Kaikki palvelimet sallivat CORS-haun ja EPSG:3067:n (tarkistettu
 * 17.11.2026). Lisenssit: Museovirasto, Syke ja Metsäkeskus CC BY 4.0.
 */

import { CONFIG } from '../config.js';
import { codeName } from '../koodit.js';

const MUSEO = 'https://geoserver.museovirasto.fi/geoserver/rajapinta_suojellut/wfs';
const SYKE = 'https://paikkatiedot.ymparisto.fi/geoserver/inspire_ps/wfs';
const MAX_FEATURES = 500;

const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const first = (p, keys) => keys.map(k => clean(p[k])).find(Boolean) || '';

/** Lähteet ryhmittäin; nimi ja laji poimitaan ominaisuuksista. */
export const SOURCES = [
    { ryhma: 'muinais', url: MUSEO, typeName: 'rajapinta_suojellut:muinaisjaannos_piste' },
    { ryhma: 'muinais', url: MUSEO, typeName: 'rajapinta_suojellut:muinaisjaannos_alue' },
    { ryhma: 'kulttuuri', url: MUSEO, typeName: 'rajapinta_suojellut:muu_kulttuuriperintokohde_piste' },
    { ryhma: 'kulttuuri', url: MUSEO, typeName: 'rajapinta_suojellut:muu_kulttuuriperintokohde_alue' },
    { ryhma: 'suojelu', url: SYKE, typeName: 'inspire_ps:PS.ProtectedSitesValtionOmistamaLuonnonsuojelualue' },
    { ryhma: 'suojelu', url: SYKE, typeName: 'inspire_ps:PS.ProtectedSitesYksityistenMaillaOlevaLuonnonsuojelualue' },
    { ryhma: 'natura', url: SYKE, typeName: 'inspire_ps:PS.ProtectedSitesSpecialAreaOfConservation' },
    { ryhma: 'natura', url: SYKE, typeName: 'inspire_ps:PS.ProtectedSitesSpecialProtectionArea' },
    { ryhma: 'erama', url: SYKE, typeName: 'inspire_ps:PS.ProtectedSitesEramaaAlue' },
    { ryhma: 'mete', url: CONFIG.habitatWfsUrl, typeName: 'v1:habitat' }
];

export function wfsUrl(source, bbox) {
    const params = new URLSearchParams({
        service: 'WFS', version: '2.0.0', request: 'GetFeature', typeNames: source.typeName,
        outputFormat: 'application/json', srsName: 'EPSG:3067', count: String(MAX_FEATURES),
        bbox: `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY},EPSG:3067`
    });
    return `${source.url}?${params}`;
}

function describe(source, p) {
    if (source.ryhma === 'mete') {
        return { nimi: codeName('habitatType', p.SPECIALFEATURECODE) || '', laji: '' };
    }
    const nimi = first(p, ['kohdenimi', 'nimi', 'nimisuomi', 'Nimi']);
    const laji = [first(p, ['Laji', 'tyyppinimi', 'aluetyyppi', 'laji']), clean(p.tyyppi)].filter(Boolean).join(', ');
    return { nimi, laji };
}

/** GeoJSON-vastaus kohteiksi { ryhma, nimi, laji, geometry }. */
export function toItems(source, json) {
    return (json?.features || [])
        .filter(f => f.geometry)
        .map(f => ({ ryhma: source.ryhma, ...describe(source, f.properties || {}), geometry: f.geometry }));
}

/** Haut kaikista lähteistä rinnakkain; yhden virhe → partial. Välimuisti rajauksen mukaan. */
export function createConstraintSource({ fetchFn = fetch } = {}) {
    const cache = new Map();
    async function one(source, bbox) {
        const res = await fetchFn(wfsUrl(source, bbox));
        if (!res.ok) throw new Error(`${source.typeName} HTTP ${res.status}`);
        const json = await res.json();
        // Yläraja täynnä: alueella voi olla enemmän kohteita kuin palautettiin
        return { items: toItems(source, json), capped: (json?.features?.length || 0) >= MAX_FEATURES };
    }
    return {
        async items(bbox) {
            const key = [bbox.minX, bbox.minY, bbox.maxX, bbox.maxY].map(Math.round).join(',');
            if (cache.has(key)) return cache.get(key);
            const p = Promise.allSettled(SOURCES.map(s => one(s, bbox))).then(results => {
                // Kaikki epäonnistuivat (esim. ei verkkoa): virhe, ei "ei kohteita"
                if (results.every(r => r.status === 'rejected')) throw new Error('Rajoitteiden haku epäonnistui');
                return {
                    items: results.flatMap(r => (r.status === 'fulfilled' ? r.value.items : [])),
                    partial: results.some(r => r.status === 'rejected' || r.value.capped)
                };
            });
            cache.set(key, p);
            let out;
            try {
                out = await p;
            } catch (err) {
                cache.delete(key);
                throw err;
            }
            if (out.partial) cache.delete(key); // yritetään uudelleen seuraavalla kerralla
            return out;
        }
    };
}
