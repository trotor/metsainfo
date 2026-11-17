/**
 * LIPAS-retkeilykohteet (Jyväskylän yliopisto, CC BY 4.0) WFS:stä:
 * lipas.fi/geoserver sallii CORS-haun ja EPSG:3067:n (tarkistettu 17.11.2026).
 */

export const WFS = 'https://lipas.fi/geoserver/lipas/ows';
export const MAX_FEATURES = 1000;

export const LAYERS = [
    { id: 'laavu', typeName: 'lipas:lipas_301_laavu_kota_kammi' },
    { id: 'tuli', typeName: 'lipas:lipas_206_ruoanlaittopaikka' },
    { id: 'reitti', typeName: 'lipas:lipas_4405_retkeilyreitti' },
    { id: 'polku', typeName: 'lipas:lipas_4404_luontopolku' }
];

export function wfsUrl(layer, bbox) {
    const params = new URLSearchParams({
        service: 'WFS', version: '2.0.0', request: 'GetFeature', typeNames: layer.typeName,
        outputFormat: 'application/json', srsName: 'EPSG:3067', count: String(MAX_FEATURES),
        bbox: `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY},EPSG:3067`
    });
    return `${WFS}?${params}`;
}

const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

export function toSites(layer, json) {
    return (json?.features || []).filter(f => f.geometry).map(f => {
        const p = f.properties || {};
        const km = Number(p.reitin_pituus_km);
        return {
            laji: layer.id,
            nimi: clean(p.nimi_fi),
            kunta: clean(p.kunta_nimi_fi),
            pituusKm: Number.isFinite(km) && km > 0 ? km : null,
            www: clean(p.www) || null,
            geometry: f.geometry
        };
    });
}

/** Näkymän tunniste kilometrin tarkkuudella (ulospäin pyöristäen). */
export function viewKey(b) {
    return [Math.floor(b.minX / 1000), Math.floor(b.minY / 1000), Math.ceil(b.maxX / 1000), Math.ceil(b.maxY / 1000)].join(',');
}
