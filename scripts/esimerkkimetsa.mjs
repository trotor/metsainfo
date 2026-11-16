#!/usr/bin/env node
/**
 * Kuvitteellisen Esimerkkimetsän kuviotiedot ja rajat.
 *
 * Kirjoittaa tiedoston public/demo/esimerkkimetsa.json. Hinta-arvion
 * esimerkkimetsä ja ostonäkymän esimerkki käyttävät sen kuviotietoja.
 * Kauppakuvien kuvaustila (VITE_KUVAUSTILA=1) piirtää sen rajat kartalle
 * kuvitteellisen saaren päälle oikean taustakartan sijaan.
 * Tila ja saari ovat kokonaan keksittyjä: kiinteistötunnusta ei ole olemassa
 * (kuntaa 999 ei ole), ja rajat, kuviot, rantaviiva, korkeuskäyrät, lampi,
 * puro ja tie on laskettu tässä skriptissä.
 *
 *   node scripts/esimerkkimetsa.mjs
 */
import { writeFileSync } from 'node:fs';

const OUT = new URL('../public/demo/esimerkkimetsa.json', import.meta.url);

// Tilan keskipiste (EPSG:3067), kiertokulma ja koko. Pinta-ala 400 m × 610 m = 24,4 ha
// vastaa kuvioiden yhteenlaskettua pinta-alaa.
const CENTER = [427440, 6947220];
const ROTATION_DEG = -14;
const WIDTH = 400;
const HEIGHT = 610;
const SLANT = 70;          // suunnikkaan vino sivu (m)
const WOBBLE = 14;         // kuviorajojen mutkat (m)

// Kuviot sarakkeittain alhaalta ylös. Hinta-arvion luvut (pinta-ala, puusto,
// hakkuuehdotukset) ovat ennallaan; muut kentät täydentävät karttaa ja kuvioluetteloa.
const COLUMNS = [
    [1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11, 12]
];

const BASE = { MAINGROUP: 1, DRAINAGESTATE: 1, ACCESSIBILITY: 1, SOILTYPE: 10, MEASUREMENTDATE: '2023-06-14' };

const STANDS = {
    1: { AREA: 2.6, MAINTREESPECIES: 1, DEVELOPMENTCLASS: '04', PROPORTIONPINE: 0.8, PROPORTIONSPRUCE: 0.1, PROPORTIONOTHER: 0.1, VOLUME: 192, SAWLOGVOLUME: 118, PULPWOODVOLUME: 74, MEANAGE: 78, MEANHEIGHT: 21.4, MEANDIAMETER: 26.8, BASALAREA: 22, STEMCOUNT: 520, VOLUMEGROWTH: 4.6, FERTILITYCLASS: 4, CUTTINGTYPE: 5, CUTTINGPROPOSALYEAR: 2027, SILVICULTURETYPE: null, SILVICULTUREPROPOSALYEAR: null },
    2: { AREA: 1.9, MAINTREESPECIES: 2, DEVELOPMENTCLASS: '04', PROPORTIONPINE: 0.15, PROPORTIONSPRUCE: 0.75, PROPORTIONOTHER: 0.1, VOLUME: 193, SAWLOGVOLUME: 132, PULPWOODVOLUME: 61, MEANAGE: 72, MEANHEIGHT: 22.8, MEANDIAMETER: 25.9, BASALAREA: 24, STEMCOUNT: 610, VOLUMEGROWTH: 5.8, FERTILITYCLASS: 3, CUTTINGTYPE: 5, CUTTINGPROPOSALYEAR: 2029, SILVICULTURETYPE: null, SILVICULTUREPROPOSALYEAR: null },
    3: { AREA: 3.4, MAINTREESPECIES: 1, DEVELOPMENTCLASS: '03', PROPORTIONPINE: 0.6, PROPORTIONSPRUCE: 0.3, PROPORTIONOTHER: 0.1, VOLUME: 150, SAWLOGVOLUME: 58, PULPWOODVOLUME: 92, MEANAGE: 48, MEANHEIGHT: 17.2, MEANDIAMETER: 18.6, BASALAREA: 21, STEMCOUNT: 980, VOLUMEGROWTH: 7.1, FERTILITYCLASS: 3, CUTTINGTYPE: 3, CUTTINGPROPOSALYEAR: 2027, SILVICULTURETYPE: null, SILVICULTUREPROPOSALYEAR: null },
    4: { AREA: 2.2, MAINTREESPECIES: 2, DEVELOPMENTCLASS: '03', PROPORTIONPINE: 0.2, PROPORTIONSPRUCE: 0.65, PROPORTIONOTHER: 0.15, VOLUME: 152, SAWLOGVOLUME: 64, PULPWOODVOLUME: 88, MEANAGE: 45, MEANHEIGHT: 16.8, MEANDIAMETER: 17.9, BASALAREA: 22, STEMCOUNT: 1060, VOLUMEGROWTH: 8.0, FERTILITYCLASS: 3, CUTTINGTYPE: 3, CUTTINGPROPOSALYEAR: 2028, SILVICULTURETYPE: null, SILVICULTUREPROPOSALYEAR: null },
    5: { AREA: 1.5, MAINTREESPECIES: 1, DEVELOPMENTCLASS: '02', PROPORTIONPINE: 0.7, PROPORTIONSPRUCE: 0.1, PROPORTIONOTHER: 0.2, VOLUME: 80, SAWLOGVOLUME: 9, PULPWOODVOLUME: 71, MEANAGE: 31, MEANHEIGHT: 11.6, MEANDIAMETER: 12.4, BASALAREA: 15, STEMCOUNT: 1420, VOLUMEGROWTH: 6.2, FERTILITYCLASS: 4, CUTTINGTYPE: 2, CUTTINGPROPOSALYEAR: 2027, SILVICULTURETYPE: null, SILVICULTUREPROPOSALYEAR: null },
    6: { AREA: 2.8, MAINTREESPECIES: 1, DEVELOPMENTCLASS: '02', PROPORTIONPINE: 0.4, PROPORTIONSPRUCE: 0.3, PROPORTIONOTHER: 0.3, VOLUME: 70, SAWLOGVOLUME: 6, PULPWOODVOLUME: 64, MEANAGE: 28, MEANHEIGHT: 10.9, MEANDIAMETER: 11.5, BASALAREA: 14, STEMCOUNT: 1530, VOLUMEGROWTH: 6.6, FERTILITYCLASS: 3, CUTTINGTYPE: 2, CUTTINGPROPOSALYEAR: 2030, SILVICULTURETYPE: null, SILVICULTUREPROPOSALYEAR: null },
    7: { AREA: 1.2, MAINTREESPECIES: 4, DEVELOPMENTCLASS: '03', PROPORTIONPINE: 0.1, PROPORTIONSPRUCE: 0.2, PROPORTIONOTHER: 0.7, VOLUME: 92, SAWLOGVOLUME: 22, PULPWOODVOLUME: 70, MEANAGE: 42, MEANHEIGHT: 17.5, MEANDIAMETER: 16.2, BASALAREA: 15, STEMCOUNT: 820, VOLUMEGROWTH: 5.1, FERTILITYCLASS: 2, CUTTINGTYPE: 3, CUTTINGPROPOSALYEAR: 2031, SILVICULTURETYPE: null, SILVICULTUREPROPOSALYEAR: null },
    8: { AREA: 2.0, MAINTREESPECIES: 1, DEVELOPMENTCLASS: '03', PROPORTIONPINE: 0.85, PROPORTIONSPRUCE: 0.05, PROPORTIONOTHER: 0.1, VOLUME: 151, SAWLOGVOLUME: 71, PULPWOODVOLUME: 80, MEANAGE: 55, MEANHEIGHT: 17.9, MEANDIAMETER: 19.8, BASALAREA: 20, STEMCOUNT: 760, VOLUMEGROWTH: 5.0, FERTILITYCLASS: 4, CUTTINGTYPE: 3, CUTTINGPROPOSALYEAR: 2033, SILVICULTURETYPE: null, SILVICULTUREPROPOSALYEAR: null },
    9: { AREA: 1.7, MAINTREESPECIES: 2, DEVELOPMENTCLASS: '04', PROPORTIONPINE: 0.3, PROPORTIONSPRUCE: 0.6, PROPORTIONOTHER: 0.1, VOLUME: 199, SAWLOGVOLUME: 141, PULPWOODVOLUME: 58, MEANAGE: 74, MEANHEIGHT: 23.1, MEANDIAMETER: 27.4, BASALAREA: 25, STEMCOUNT: 540, VOLUMEGROWTH: 5.4, FERTILITYCLASS: 3, CUTTINGTYPE: 5, CUTTINGPROPOSALYEAR: 2034, SILVICULTURETYPE: null, SILVICULTUREPROPOSALYEAR: null },
    10: { AREA: 2.4, MAINTREESPECIES: 1, DEVELOPMENTCLASS: '02', PROPORTIONPINE: 0.5, PROPORTIONSPRUCE: 0.3, PROPORTIONOTHER: 0.2, VOLUME: 18, SAWLOGVOLUME: 0, PULPWOODVOLUME: 18, MEANAGE: 16, MEANHEIGHT: 6.8, MEANDIAMETER: 7.2, BASALAREA: 6, STEMCOUNT: 2100, VOLUMEGROWTH: 3.9, FERTILITYCLASS: 3, CUTTINGTYPE: null, CUTTINGPROPOSALYEAR: null, SILVICULTURETYPE: 4, SILVICULTUREPROPOSALYEAR: 2027 },
    11: { AREA: 1.1, MAINTREESPECIES: null, DEVELOPMENTCLASS: 'A0', PROPORTIONPINE: 0, PROPORTIONSPRUCE: 0, PROPORTIONOTHER: 0, VOLUME: 0, SAWLOGVOLUME: 0, PULPWOODVOLUME: 0, MEANAGE: null, MEANHEIGHT: null, MEANDIAMETER: null, BASALAREA: null, STEMCOUNT: null, VOLUMEGROWTH: null, FERTILITYCLASS: 3, CUTTINGTYPE: null, CUTTINGPROPOSALYEAR: null, SILVICULTURETYPE: 1, SILVICULTUREPROPOSALYEAR: 2027 },
    12: { AREA: 1.6, MAINTREESPECIES: 1, DEVELOPMENTCLASS: '03', PROPORTIONPINE: 0.55, PROPORTIONSPRUCE: 0.35, PROPORTIONOTHER: 0.1, VOLUME: 130, SAWLOGVOLUME: 46, PULPWOODVOLUME: 84, MEANAGE: 46, MEANHEIGHT: 16.4, MEANDIAMETER: 17.1, BASALAREA: 19, STEMCOUNT: 950, VOLUMEGROWTH: 6.4, FERTILITYCLASS: 3, CUTTINGTYPE: 3, CUTTINGPROPOSALYEAR: 2036, SILVICULTURETYPE: null, SILVICULTUREPROPOSALYEAR: null }
};

/* ---------- Geometria ---------- */

// Paikalliset koordinaatit: suunnikas, alareuna y = 0, yläreuna y = HEIGHT, x vasemmalta.
// Sarakkeiden rajat ovat suoria vinoja viivoja, joten sarakkeet ovat suunnikkaita, ja
// vaakasuora jako korkeuden suhteessa antaa tarkat pinta-alat.
const xAt = (x0, y) => x0 + SLANT * (y / HEIGHT);

const theta = (ROTATION_DEG * Math.PI) / 180;
function toMap([x, y]) {
    const lx = x - WIDTH / 2 - SLANT / 2;
    const ly = y - HEIGHT / 2;
    return [
        Math.round((CENTER[0] + lx * Math.cos(theta) - ly * Math.sin(theta)) * 100) / 100,
        Math.round((CENTER[1] + lx * Math.sin(theta) + ly * Math.cos(theta)) * 100) / 100
    ];
}

// Kuviorajan mutkat: nollakeskiarvoiset aallot, jotka häviävät rajan päissä,
// joten pinta-alat pysyvät lähes ennallaan ja naapurikuviot jakavat saman rajan.
function wavyLine(a, b, seed) {
    const pts = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const w = WOBBLE * Math.sin(Math.PI * t) * Math.sin(3 * Math.PI * t + seed);
        pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + w]);
    }
    return pts;
}

const totalArea = Object.values(STANDS).reduce((a, s) => a + s.AREA, 0);

// Sarakkeiden väliset rajat: x = suora vino viiva + mutka, joka häviää tilan
// ala- ja yläreunassa. Ulkoreunat ovat suoria (kiinteistöraja).
const colAreas = COLUMNS.map(col => col.reduce((a, n) => a + STANDS[n].AREA, 0));
const colX = [0];
colAreas.forEach(a => colX.push(colX[colX.length - 1] + WIDTH * (a / totalArea)));
const boundaryX = colX.map((x0, i) => {
    const outer = i === 0 || i === colX.length - 1;
    return (y) => {
        const t = y / HEIGHT;
        const w = outer ? 0 : 1.6 * WOBBLE * Math.sin(Math.PI * t) * Math.sin(5 * Math.PI * t + i * 1.3);
        return xAt(x0, y) + w;
    };
});
const STEP = 8;
function boundaryPath(i, yFrom, yTo) {
    const pts = [];
    const dir = yTo > yFrom ? 1 : -1;
    pts.push([boundaryX[i](yFrom), yFrom]);
    // Yhteinen ruudukko, jotta naapurisarakkeet jakavat samat pisteet
    let y = dir > 0 ? Math.floor(yFrom / STEP) * STEP + STEP : Math.ceil(yFrom / STEP) * STEP - STEP;
    while (dir > 0 ? y < yTo : y > yTo) {
        pts.push([boundaryX[i](y), y]);
        y += dir * STEP;
    }
    pts.push([boundaryX[i](yTo), yTo]);
    return pts;
}

const features = [];
COLUMNS.forEach((col, ci) => {
    const colArea = colAreas[ci];
    const cuts = [0];
    let acc = 0;
    for (const n of col) { acc += STANDS[n].AREA; cuts.push(HEIGHT * (acc / colArea)); }
    // Vaakasuorat rajat: päät sarakerajoilla, mutka häviää päissä
    const lines = cuts.map((y, k) => {
        const a = [boundaryX[ci](y), y];
        const b = [boundaryX[ci + 1](y), y];
        return k === 0 || k === cuts.length - 1 ? [a, b] : wavyLine(a, b, ci * 1.7 + k * 2.3);
    });
    col.forEach((n, k) => {
        const y0 = cuts[k];
        const y1 = cuts[k + 1];
        const ring = [
            ...lines[k],
            ...boundaryPath(ci + 1, y0, y1).slice(1, -1),
            ...[...lines[k + 1]].reverse(),
            ...boundaryPath(ci, y1, y0).slice(1, -1)
        ];
        ring.push(ring[0]);
        features.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [ring.map(toMap)] },
            properties: { STANDNUMBER: n, ...BASE, ...STANDS[n] }
        });
    });
});
features.sort((a, b) => a.properties.STANDNUMBER - b.properties.STANDNUMBER);

const outline = [[xAt(0, 0), 0], [xAt(WIDTH, 0), 0], [xAt(WIDTH, HEIGHT), HEIGHT], [xAt(0, HEIGHT), HEIGHT], [xAt(0, 0), 0]].map(toMap);

const parcel = {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [outline] },
    properties: {
        label: 'Esimerkkimetsä',
        nationalCadastralReference: '99940100010001',
        esimerkki: true,
        priceRegion: 'keski-suomi'
    }
};

/* ---------- Kuvitteellinen saari (kuvaustilan taustakartta) ---------- */

const at = (dx, dy) => [CENTER[0] + dx, CENTER[1] + dy];
const round2 = ([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100];

/** Suljettu muoto: säde kulman funktiona, aallot tekevät rannasta rikkonaisen. */
function blob(c, r, waves, { sx = 1, sy = 1, n = 160 } = {}) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
        const a = (2 * Math.PI * i) / n;
        const k = 1 + waves.reduce((acc, [amp, f, ph]) => acc + amp * Math.sin(f * a + ph), 0);
        pts.push([c[0] + Math.cos(a) * r * k * sx, c[1] + Math.sin(a) * r * k * sy]);
    }
    pts[n] = pts[0];
    return pts;
}

function inside([x, y], ring) {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
}

const ISLAND_C = at(-60, 30);
const ISLAND_WAVES = [[0.11, 2, 1.0], [0.08, 3, 2.1], [0.05, 5, 0.4], [0.03, 9, 1.7], [0.015, 17, 0.9]];
const island = blob(ISLAND_C, 760, ISLAND_WAVES, { sx: 1.2 });
// Ensimmäinen korkeuskäyrä myötäilee rantaa
const shoreContour = blob(ISLAND_C, 690, ISLAND_WAVES, { sx: 1.2 });

const hills = [
    { c: at(60, 120), radii: [40, 80, 120, 160, 200, 240, 280], waves: [[0.14, 3, 0.3], [0.07, 5, 1.9]] },
    { c: at(-380, -340), radii: [35, 70, 105, 140, 175], waves: [[0.12, 2, 2.4], [0.08, 4, 0.7]] },
    { c: at(420, -250), radii: [35, 70, 105, 140], waves: [[0.1, 3, 1.2], [0.06, 6, 2.2]] }
];
function segmentsCross(a, b) {
    const cross = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    for (let i = 0; i < a.length - 1; i++) {
        for (let j = 0; j < b.length - 1; j++) {
            const [p1, p2, q1, q2] = [a[i], a[i + 1], b[j], b[j + 1]];
            if (cross(p1, p2, q1) * cross(p1, p2, q2) < 0 && cross(q1, q2, p1) * cross(q1, q2, p2) < 0) return true;
        }
    }
    return false;
}

const pond = blob(at(-430, 200), 60, [[0.18, 2, 0.6], [0.08, 3, 1.4]], { sx: 1.3, n: 60 });

const contours = [{ line: shoreContour, index: false, hill: -1 }];
hills.forEach((h, hi) => {
    h.radii.forEach((r, i) => {
        const ring = blob(h.c, r, h.waves, { sx: 1.15 });
        // Käyrät eivät saa leikata rantakäyrää eivätkä toisten mäkien käyriä
        if (!ring.every(p => inside(p, shoreContour))) return;
        if (contours.some(c => c.hill !== hi && c.hill >= 0 && segmentsCross(c.line, ring))) return;
        // Lampi on notkossa: mäen käyrä ei kierrä eikä leikkaa sitä
        if (segmentsCross(ring, pond) || inside(pond[0], ring)) return;
        contours.push({ line: ring, index: i === 1, hill: hi });
    });
});


/** Viiva, joka katkaistaan rantaan (vain saaren sisäosat). */
function clipToIsland(line) {
    const parts = [];
    let cur = [];
    for (const p of line) {
        if (inside(p, island)) cur.push(p);
        else if (cur.length) { parts.push(cur); cur = []; }
    }
    if (cur.length > 1) parts.push(cur);
    return parts.filter(l => l.length > 1);
}

const wiggly = (from, to, amp, waves, n = 40) => Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.hypot(dx, dy);
    const w = amp * Math.sin(waves * Math.PI * t) * Math.sin(Math.PI * t);
    return [from[0] + dx * t - (dy / len) * w, from[1] + dy * t + (dx / len) * w];
});

const stream = clipToIsland(wiggly(at(-505, 190), at(-1500, 60), 40, 3));
const road = clipToIsland([
    ...wiggly(at(1200, -180), at(560, -60), 30, 2, 20),
    ...wiggly(at(560, -60), at(300, 40), 15, 1, 10).slice(1)
]);
const path = clipToIsland(wiggly(at(300, 40), at(-300, -650), 50, 2, 30));

const mapFeature = (kind, type, coordinates, extra = {}) => ({
    type: 'Feature',
    properties: { kind, ...extra },
    geometry: { type, coordinates }
});
const ring = (r) => r.map(round2);
const map = {
    type: 'FeatureCollection',
    features: [
        mapFeature('island', 'Polygon', [ring(island)]),
        ...contours.map(c => mapFeature('contour', 'LineString', ring(c.line), { index: c.index })),
        ...stream.map(l => mapFeature('stream', 'LineString', ring(l))),
        mapFeature('pond', 'Polygon', [ring(pond)]),
        ...path.map(l => mapFeature('path', 'LineString', ring(l))),
        ...road.map(l => mapFeature('road', 'LineString', ring(l))),
        mapFeature('label', 'Point', round2(at(-520, 520)), { text: 'Esimerkkisaari' })
    ]
};

// Tila ja lampi ovat saarella, eikä lampi ole tilan päällä
if (!outline.every(p => inside(p, shoreContour))) throw new Error('Tila ei mahdu saarelle');
if (pond.some(p => inside(p, outline))) throw new Error('Lampi on tilan päällä');

const data = {
    name: 'Esimerkkimetsä (kuvitteellinen)',
    region: 'keski-suomi',
    note: 'Kuvitteellinen tila hinta-arvion kokeiluun ja kauppakuviin. Ei todellinen kiinteistö: tunnusta, rajoja ja kuvioita ei ole olemassa.',
    parcel,
    features,
    map
};

writeFileSync(OUT, JSON.stringify(data, null, 1) + '\n');
console.log(`Kirjoitettu ${OUT.pathname}: ${features.length} kuviota, ${totalArea.toFixed(1)} ha, ${contours.length} korkeuskäyrää`);
