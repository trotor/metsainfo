/**
 * Saavutettavuus v2: maaston märkyys ja kaltevuus metsäkuljetuksen reitillä
 * (docs/saavutettavuusindeksi.md).
 *
 * - Märkyys: Luken DTW-kosteusindeksi (2 m, 1 ha:n uomaverkko, 2023),
 *   Paitulin WMS, CC BY 4.0. Värit muutetaan selitteen luokiksi.
 * - Kaltevuus: MML:n korkeusmalli 10 m (2019), Paitulin WCS text/plain,
 *   CC BY 4.0.
 * Molemmat palvelimet sallivat CORS-haun (tarkistettu 17.11.2026).
 */

import { fetchImageRaster } from './rasteri.js';

export const DTW_WMS = 'https://paituli.csc.fi/geoserver/paituli/wms';
export const DTW_LAYER = 'paituli:luke_dtw_01_2023';
export const DEM_WCS = 'https://paituli.csc.fi/geoserver/paituli/wcs';
export const DEM_COVERAGE = 'paituli__mml_korkeusmalli_10m_2019';
export const DTW_MAX_RES = 5;      // m/px: WMS-tyyli piirtää vain 1:21 000 tarkemmin
export const DTW_MAX_PX = 2048;
export const DEM_MAX_CELLS = 600;  // solua kumpaankin suuntaan (10 m)
export const STEEP = 20;           // %, metsäkuljetusta hidastava rinne
export const VERY_STEEP = 35;      // %, vaikea tai mahdoton ajaa

// GetLegendGraphic (intervals): yläraja cm → väri; 151 = yli 150 cm (palvelin piirtää
// sen läpinäkyvänä, ks. dtwAt)
const DTW_LEGEND = [
    [0, [0x08, 0x30, 0x6b]], [25, [0x08, 0x51, 0x9c]], [50, [0x21, 0x71, 0xb5]],
    [75, [0x42, 0x92, 0xc6]], [100, [0x6b, 0xae, 0xd6]], [125, [0x9e, 0xca, 0xe1]],
    [150, [0xc6, 0xdb, 0xef]], [151, [0xff, 0xff, 0xff]]
];
const MAX_COLOR_DIST = 30;

/** Pikselin DTW-luokka (cm, yläraja) tai null (läpinäkyvä tai tuntematon väri). */
export function classifyDtw(r, g, b, a) {
    if (!a) return null;
    let best = null, bestD = Infinity;
    for (const [cm, [lr, lg, lb]] of DTW_LEGEND) {
        const d = Math.hypot(r - lr, g - lg, b - lb);
        if (d < bestD) { bestD = d; best = cm; }
    }
    return bestD <= MAX_COLOR_DIST ? best : null;
}

/** GetMap-pyyntö tai null, jos alue on liian iso piirrettäväksi tarkkuudella. */
export function dtwRequest(bbox) {
    const w = bbox.maxX - bbox.minX, h = bbox.maxY - bbox.minY;
    const res = Math.max(2, Math.max(w, h) / DTW_MAX_PX);
    if (res > DTW_MAX_RES) return null;
    const width = Math.max(1, Math.round(w / res)), height = Math.max(1, Math.round(h / res));
    const params = new URLSearchParams({
        service: 'WMS', version: '1.3.0', request: 'GetMap', layers: DTW_LAYER, styles: '',
        crs: 'EPSG:3067', bbox: [bbox.minX, bbox.minY, bbox.maxX, bbox.maxY].join(','),
        width: String(width), height: String(height), format: 'image/png', transparent: 'true'
    });
    return { url: `${DTW_WMS}?${params}`, width, height, bbox };
}

export async function fetchDtw(bbox, opts = {}) {
    const req = dtwRequest(bbox);
    return req ? fetchImageRaster(req, opts) : null;
}

/** WCS GetCoverage -osoite tai null, jos alue on liian iso. */
export function demRequest(bbox) {
    const minX = Math.floor(bbox.minX / 10) * 10, maxX = Math.ceil(bbox.maxX / 10) * 10;
    const minY = Math.floor(bbox.minY / 10) * 10, maxY = Math.ceil(bbox.maxY / 10) * 10;
    if ((maxX - minX) / 10 > DEM_MAX_CELLS || (maxY - minY) / 10 > DEM_MAX_CELLS) return null;
    const params = new URLSearchParams({
        service: 'WCS', version: '2.0.1', request: 'GetCoverage', coverageId: DEM_COVERAGE, format: 'text/plain'
    });
    // subset-parametrit toistuvat, joten ne lisätään sellaisinaan (sulkeet ja pilkku)
    return `${DEM_WCS}?${params}&subset=E(${minX},${maxX})&subset=N(${minY},${maxY})`;
}

/**
 * Paitulin text/plain-ruudukko: "Grid range" (sarakkeet, rivit), "Grid to
 * world" (solukoko ja ensimmäisen solun keskipiste) ja arvorivit "Band 0:"
 * jälkeen ylhäältä alas.
 */
export function parseDem(text) {
    const range = text.match(/GridEnvelope2D\[0\.\.(\d+), 0\.\.(\d+)\]/);
    const num = (name) => Number(text.match(new RegExp(`"${name}", (-?[\\d.Ee+-]+)\\]`))?.[1]);
    if (!range) throw new Error('Korkeusmalli: tuntematon vastaus');
    const cols = Number(range[1]) + 1, rows = Number(range[2]) + 1;
    const cell = num('elt_0_0'), x0 = num('elt_0_2'), y0 = num('elt_1_2');
    const body = text.slice(text.indexOf('Band 0:') + 7);
    const values = new Float32Array(cols * rows);
    let k = 0;
    for (const tok of body.split(/\s+/)) {
        if (!tok) continue;
        if (k >= values.length) break;
        values[k++] = Number(tok);
    }
    if (k < values.length) throw new Error('Korkeusmalli: arvoja puuttuu');
    return { cols, rows, cell, x0, y0, values };
}

export async function fetchDem(bbox, { fetchFn = fetch, signal } = {}) {
    const url = demRequest(bbox);
    if (!url) return null;
    const res = await fetchFn(url, { signal });
    if (!res.ok) throw new Error(`Korkeusmalli HTTP ${res.status}`);
    return parseDem(await res.text());
}

function demValue(dem, i, j) {
    if (i < 0 || j < 0 || i >= dem.cols || j >= dem.rows) return null;
    const v = dem.values[j * dem.cols + i];
    return Number.isFinite(v) && v > -1000 ? v : null;
}

/** Kaltevuus (%) pisteessä keskeisdifferensseillä; null alueen ulkopuolella. */
export function slopeAt(dem, [x, y]) {
    const i = Math.round((x - dem.x0) / dem.cell), j = Math.round((dem.y0 - y) / dem.cell);
    const l = demValue(dem, i - 1, j), r = demValue(dem, i + 1, j);
    const u = demValue(dem, i, j - 1), d = demValue(dem, i, j + 1);
    if (l == null || r == null || u == null || d == null) return null;
    const dx = (r - l) / (2 * dem.cell), dy = (u - d) / (2 * dem.cell);
    return 100 * Math.hypot(dx, dy);
}

/** Pisteet janalla step metrin välein, päätepisteet mukaan. */
export function linePoints(a, b, step = 8) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(len / step));
    const pts = [];
    for (let k = 0; k < n; k++) {
        const t = Math.min(1, (k * step) / len || 0);
        pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    pts.push([b[0], b[1]]);
    return pts;
}

function dtwAt(raster, [x, y]) {
    const { data, width, height, bbox } = raster;
    const i = Math.floor(((x - bbox.minX) / (bbox.maxX - bbox.minX)) * width);
    const j = Math.floor(((bbox.maxY - y) / (bbox.maxY - bbox.minY)) * height);
    if (i < 0 || j < 0 || i >= width || j >= height) return null;
    const o = (j * width + i) * 4;
    // Palvelin piirtää luokan "yli 150 cm" läpinäkyvänä (selitteessä opacity 0),
    // joten läpinäkyvä pikseli rasterin sisällä on kuivaa maata. Myös vesistöt ja
    // aineiston ulkopuoli ovat läpinäkyviä; metsäkuljetuksen linjat ylittävät
    // niitä harvoin.
    if (!data[o + 3]) return 151;
    return classifyDtw(data[o], data[o + 1], data[o + 2], data[o + 3]);
}

/** Märkä (≤ 25 cm) = 1, kostea (≤ 50 cm) = 0,5; osuus näytteistä, joilla on arvo. */
export function wetnessStats(raster, pts) {
    let n = 0, wet = 0;
    for (const p of pts) {
        const cm = dtwAt(raster, p);
        if (cm == null) continue;
        n++;
        if (cm <= 25) wet += 1;
        else if (cm <= 50) wet += 0.5;
    }
    return { n, share: n ? wet / n : null };
}

export function slopeStats(dem, pts) {
    let n = 0, steep = 0, verySteep = 0, max = 0;
    for (const p of pts) {
        const s = slopeAt(dem, p);
        if (s == null) continue;
        n++;
        if (s > STEEP) steep++;
        if (s > VERY_STEEP) verySteep++;
        if (s > max) max = s;
    }
    return n ? { n, steepShare: steep / n, verySteepShare: verySteep / n, max } : { n: 0, steepShare: null, verySteepShare: null, max: null };
}
