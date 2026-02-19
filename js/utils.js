/**
 * Utility functions: coordinates, geometry, formatting
 */

/**
 * Convert EPSG:3067 coordinates to WGS84 LatLng for Leaflet
 */
export function coordsEPSG3067ToLatLng(coords) {
    const [x, y] = coords;
    const [lng, lat] = proj4('EPSG:3067', 'WGS84', [x, y]);
    return L.latLng(lat, lng);
}

/**
 * Check if a point is inside a polygon (EPSG:3067 coordinates)
 */
export function pointInPolygon3067(point, geometry) {
    if (!geometry || !geometry.coordinates) return false;

    const [px, py] = point;
    const rings = geometry.type === 'Polygon' ? [geometry.coordinates[0]] :
                  geometry.type === 'MultiPolygon' ? geometry.coordinates.map(p => p[0]) : [];

    for (const ring of rings) {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];

            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        if (inside) return true;
    }
    return false;
}

/**
 * Get bounding box from geometry in EPSG:3067 coordinates
 */
export function getGeometryBounds3067(geometry) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    function processCoords(coords) {
        if (typeof coords[0] === 'number') {
            minX = Math.min(minX, coords[0]);
            minY = Math.min(minY, coords[1]);
            maxX = Math.max(maxX, coords[0]);
            maxY = Math.max(maxY, coords[1]);
        } else {
            coords.forEach(processCoords);
        }
    }

    processCoords(geometry.coordinates);
    return { minX, minY, maxX, maxY };
}

/**
 * Calculate polygon area using shoelace formula (square meters for EPSG:3067)
 */
export function calculatePolygonArea(coordinates) {
    if (!coordinates || coordinates.length < 3) return 0;

    let area = 0;
    const n = coordinates.length;
    for (let i = 0; i < n; i++) {
        const [x1, y1] = coordinates[i];
        const [x2, y2] = coordinates[(i + 1) % n];
        area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area) / 2;
}

/**
 * Calculate total area from geometry (Polygon or MultiPolygon)
 */
export function calculateGeometryArea(geometry) {
    if (!geometry || !geometry.coordinates) return 0;

    if (geometry.type === 'Polygon') {
        let area = calculatePolygonArea(geometry.coordinates[0]);
        for (let i = 1; i < geometry.coordinates.length; i++) {
            area -= calculatePolygonArea(geometry.coordinates[i]);
        }
        return area;
    } else if (geometry.type === 'MultiPolygon') {
        let totalArea = 0;
        geometry.coordinates.forEach(polygon => {
            let area = calculatePolygonArea(polygon[0]);
            for (let i = 1; i < polygon.length; i++) {
                area -= calculatePolygonArea(polygon[i]);
            }
            totalArea += area;
        });
        return totalArea;
    }
    return 0;
}

/**
 * Calculate total parcel area from parcel object (single or multi-part)
 */
export function calculateParcelArea(parcel, partCount) {
    if (!parcel) return null;

    if (parcel.parts && parcel.parts.length > 0) {
        let totalArea = 0;
        parcel.parts.forEach(part => {
            if (part.geometry) {
                totalArea += calculateGeometryArea(part.geometry);
            }
        });
        return totalArea > 0 ? totalArea : null;
    }

    if (parcel.geometry) {
        const area = calculateGeometryArea(parcel.geometry);
        return area > 0 ? area : null;
    }

    return null;
}

/**
 * Format number with specified decimals
 */
export function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) return '-';
    return value.toLocaleString('fi-FI', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Format cadastral reference for display
 */
export function formatCadastralReference(ref) {
    if (!ref || ref.includes('-')) return ref;
    if (ref.length === 14) {
        return `${parseInt(ref.slice(0, 3))}-${parseInt(ref.slice(3, 6))}-${parseInt(ref.slice(6, 10))}-${parseInt(ref.slice(10, 14))}`;
    }
    return ref;
}

/**
 * Convert user input to 14-digit nationalCadastralReference format
 */
export function normalizeParcelId(input) {
    const clean = input.replace(/[^0-9]/g, '');

    if (clean.length === 14) {
        return clean;
    }

    const parts = input.split(/[-\s]+/);
    if (parts.length === 4) {
        const [kunta, kyla, tila, yksikko] = parts.map(p => p.replace(/[^0-9]/g, ''));
        return kunta.padStart(3, '0') +
               kyla.padStart(3, '0') +
               tila.padStart(4, '0') +
               yksikko.padStart(4, '0');
    }

    return null;
}
