/**
 * Metsäkeskuksen korjuukelpoisuuskartta (WMS-rasteri). Kuva haetaan
 * kiinteistön alueelta ja pikselin väri muutetaan selitteen luokaksi
 * (palettikuva, ei sekoittuneita reunavärejä; tarkistettu 16.11.2026).
 */

import { containsPoint, bboxOf } from './geometria.js';

export const WMS_URL = 'https://avoin.metsakeskus.fi/rajapinnat/v1/ows';

// Selite (GetLegendGraphic): luokka → väri
export const LEGEND = {
    1: [0x00, 0x61, 0x00], // Kelirikko
    2: [0x61, 0x99, 0x00], // Normaali kesä, kivennäismaa
    3: [0xa0, 0xdb, 0x00], // Kuiva kesä, kivennäismaa
    4: [0xff, 0xfa, 0x00], // Normaali kesä, turvemaa
    5: [0xff, 0x84, 0x00], // Kuiva kesä, turvemaa
    6: [0xff, 0x26, 0x00], // Talvi
    254: [0x80, 0xff, 0xff] // Vesistö
};
const MAX_COLOR_DIST = 40;

export function classifyPixel(r, g, b, a) {
    if (!a) return null;
    let best = null, bestD = Infinity;
    for (const [cls, [lr, lg, lb]] of Object.entries(LEGEND)) {
        const d = Math.hypot(r - lr, g - lg, b - lb);
        if (d < bestD) { bestD = d; best = Number(cls); }
    }
    return bestD <= MAX_COLOR_DIST ? best : null;
}

/** GetMap-pyyntö: resolution m/px, pidempi sivu enintään maxPx. */
export function rasterRequest(bbox, { maxPx = 1024, resolution = 8 } = {}) {
    const w = bbox.maxX - bbox.minX, h = bbox.maxY - bbox.minY;
    const res = Math.max(resolution, Math.max(w, h) / maxPx);
    const width = Math.max(1, Math.round(w / res)), height = Math.max(1, Math.round(h / res));
    const params = new URLSearchParams({
        service: 'WMS', version: '1.3.0', request: 'GetMap', layers: 'Korjuukelpoisuus', styles: '',
        crs: 'EPSG:3067', bbox: [bbox.minX, bbox.minY, bbox.maxX, bbox.maxY].join(','),
        width: String(width), height: String(height), format: 'image/png', transparent: 'true'
    });
    return { url: `${WMS_URL}?${params}`, width, height, bbox };
}

/** Luokkien osuudet kuvion sisällä olevista pikselikeskuksista; null, jos ei pikseleitä. */
export function classShares(raster, geometry) {
    const { data, width, height, bbox } = raster;
    const px = (bbox.maxX - bbox.minX) / width, py = (bbox.maxY - bbox.minY) / height;
    const counts = {};
    let total = 0;
    // Vain kuvion rajaavan suorakulmion pikselit (iso kiinteistö, satoja kuvioita)
    const g = bboxOf([geometry]);
    const i0 = Math.max(0, Math.floor((g.minX - bbox.minX) / px)), i1 = Math.min(width - 1, Math.ceil((g.maxX - bbox.minX) / px));
    const j0 = Math.max(0, Math.floor((bbox.maxY - g.maxY) / py)), j1 = Math.min(height - 1, Math.ceil((bbox.maxY - g.minY) / py));
    for (let j = j0; j <= j1; j++) {
        const y = bbox.maxY - (j + 0.5) * py; // kuvan rivit ylhäältä alas
        for (let i = i0; i <= i1; i++) {
            const x = bbox.minX + (i + 0.5) * px;
            if (!containsPoint(geometry, [x, y])) continue;
            const o = (j * width + i) * 4;
            const cls = classifyPixel(data[o], data[o + 1], data[o + 2], data[o + 3]);
            if (cls == null) continue;
            counts[cls] = (counts[cls] || 0) + 1;
            total++;
        }
    }
    if (!total) return null;
    return Object.fromEntries(Object.entries(counts).map(([k, n]) => [k, n / total]));
}

/** Hakee rasterin ja lukee pikselit (CORS sallittu, joten canvas ei saastu). */
export async function fetchRaster(bbox, { fetchFn = fetch, signal } = {}) {
    const req = rasterRequest(bbox);
    const res = await fetchFn(req.url, { signal });
    if (!res.ok) throw new Error(`Korjuukelpoisuus HTTP ${res.status}`);
    const bitmap = await createImageBitmap(await res.blob());
    const canvas = document.createElement('canvas');
    canvas.width = req.width;
    canvas.height = req.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bitmap, 0, 0, req.width, req.height);
    const { data } = ctx.getImageData(0, 0, req.width, req.height);
    return { data, width: req.width, height: req.height, bbox: req.bbox };
}
