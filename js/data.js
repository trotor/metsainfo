/**
 * WFS data fetching and geometry filtering
 */

import { CONFIG, CODES } from './config.js';
import { pointInPolygon3067 } from './utils.js';

/**
 * Fetch forest data by bounding box (EPSG:3067)
 */
export async function fetchForestDataByBounds(bounds) {
    const buffer = 10;
    const bbox = `${bounds.minX - buffer},${bounds.minY - buffer},${bounds.maxX + buffer},${bounds.maxY + buffer}`;

    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: 'v1:stand',
        outputFormat: 'application/json',
        srsName: 'EPSG:3067',
        bbox: bbox + ',EPSG:3067'
    });

    const url = `${CONFIG.wfsUrl}?${params}`;
    console.log('Fetching forest data:', url);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features || [];
}

/**
 * Fetch all parcel parts by cadastral reference
 */
export async function fetchParcelsByReference(reference) {
    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: 'cp:CadastralParcel',
        outputFormat: 'application/json',
        srsName: 'EPSG:3067',
        CQL_FILTER: `nationalCadastralReference='${reference}'`
    });

    const response = await fetch(`${CONFIG.cadastralWfsUrl}?${params}`);
    if (!response.ok) {
        throw new Error('Haku epäonnistui');
    }

    const data = await response.json();
    return data.features || [];
}

/**
 * Fetch cadastral parcel at a specific point (legacy fallback)
 */
export async function fetchCadastralParcel(x, y) {
    const r = 200;
    const bbox = `${x - r},${y - r},${x + r},${y + r},EPSG:3067`;

    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: 'cp:CadastralParcel',
        outputFormat: 'application/json',
        srsName: 'EPSG:3067',
        bbox: bbox
    });

    const url = `${CONFIG.cadastralWfsUrl}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            for (const parcel of data.features) {
                if (pointInPolygon3067([x, y], parcel.geometry)) {
                    return parcel;
                }
            }
            return data.features[0];
        }
        return null;
    } catch (error) {
        console.warn('Failed to fetch cadastral parcel:', error);
        return null;
    }
}

/**
 * Fetch forest use declarations by bounding box (EPSG:3067)
 * Filtered to last 5 years
 */
export async function fetchForestUseDeclarations(bounds) {
    const minYear = new Date().getFullYear() - 5;

    // bbox and CQL_FILTER can't be used as separate params on this WFS — combine into CQL_FILTER
    const cqlFilter = `BBOX(GEOMETRY,${bounds.minX},${bounds.minY},${bounds.maxX},${bounds.maxY},'EPSG:3067') AND DECLARATIONARRIVALYEAR >= '${minYear}'`;

    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: 'v1:forestusedeclaration',
        outputFormat: 'application/json',
        srsName: 'EPSG:3067',
        CQL_FILTER: cqlFilter
    });

    const url = `${CONFIG.mkiWfsUrl}?${params}`;
    console.log('Fetching MKI data:', url);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features || [];
}

/**
 * Filter forest features - only include stands whose centroid is inside the parcel
 */
export function filterFeaturesByParcel(features, parcel) {
    if (!parcel || !parcel.geometry) return features;

    return features.filter(feature => {
        if (!feature.geometry) return false;
        try {
            return featureBelongsToParcel(feature.geometry, parcel.geometry);
        } catch (e) {
            console.warn('Error checking feature:', e);
            return false;
        }
    });
}

/**
 * Filter forest features - only include stands whose centroid is inside any of the parcels
 */
export function filterFeaturesByParcels(features, parcels) {
    if (!parcels || parcels.length === 0) return features;

    return features.filter(feature => {
        if (!feature.geometry) return false;
        try {
            return parcels.some(parcel =>
                parcel.geometry && featureBelongsToParcel(feature.geometry, parcel.geometry)
            );
        } catch (e) {
            console.warn('Error checking feature:', e);
            return false;
        }
    });
}

/**
 * Check if a forest stand belongs to a parcel (centroid must be inside)
 */
function featureBelongsToParcel(featureGeom, parcelGeom) {
    const ring = featureGeom.type === 'Polygon' ? featureGeom.coordinates[0] :
                 featureGeom.type === 'MultiPolygon' ? featureGeom.coordinates[0][0] : null;

    if (!ring || ring.length === 0) return false;

    let sumX = 0, sumY = 0;
    for (const [x, y] of ring) {
        sumX += x;
        sumY += y;
    }
    const centroid = [sumX / ring.length, sumY / ring.length];

    return pointInPolygon3067(centroid, parcelGeom);
}
