/**
 * Kauppakuvien kuvaustila: kartalla on vain kuvitteellinen Esimerkkimetsä.
 * Oikeita kiinteistöjä, kiinteistötunnuksia, luontokohteita tai
 * metsänkäyttöilmoituksia ei haeta, joten kuviin ei päädy kenenkään tilaa.
 *
 * Päälle vain erillisellä buildilla: VITE_KUVAUSTILA=1 npm run build
 * (tai npm run dev). Tavallisessa buildissa KUVAUSTILA on false, ja
 * Vite karsii tilan koodin pois. ios:sync ja android:sync ajavat aina
 * tavallisen buildin.
 */
export const KUVAUSTILA = import.meta.env?.VITE_KUVAUSTILA === '1';

let data = null;

/** Esimerkkimetsän kiinteistö ja kuviot (public/demo/esimerkkimetsa.json). */
export async function loadEsimerkkimetsa() {
    if (!data) data = await (await fetch('demo/esimerkkimetsa.json')).json();
    return data;
}

/* ---------- Kuvitteellinen taustakartta (saari) ---------- */

// Peruskartan kaltaiset värit: vesi, metsä (valkoinen), korkeuskäyrät, tiet
const WATER = '#b7def0';
const SHORE = '#3d9ad1';
const STYLES = {
    island: { color: SHORE, weight: 1.5, fillColor: '#fdfdfb', fillOpacity: 1 },
    pond: { color: SHORE, weight: 1.2, fillColor: WATER, fillOpacity: 1 },
    contour: { color: '#c9853f', weight: 1, fill: false },
    stream: { color: SHORE, weight: 1.6, fill: false },
    road: { color: '#222', weight: 2.2, fill: false },
    path: { color: '#222', weight: 1.4, dashArray: '6 5', fill: false }
};

/**
 * Taustakartaksi kuvitteellinen saari oikeiden karttatiilien sijaan.
 * Palauttaa tason heti; sisältö ladataan esimerkkimetsän tiedostosta.
 */
export function createKuvitteellinenKartta(map, coordsToLatLng) {
    map.createPane('kuvitteellinen');
    map.getPane('kuvitteellinen').style.zIndex = 200;
    map.getContainer().style.background = WATER;
    const group = L.layerGroup();
    loadEsimerkkimetsa().then(({ map: fc }) => {
        if (!fc) return;
        L.geoJSON(fc, {
            pane: 'kuvitteellinen',
            interactive: false,
            coordsToLatLng,
            filter: f => f.properties.kind !== 'label',
            style: f => ({ ...STYLES[f.properties.kind], ...(f.properties.index ? { weight: 1.8 } : {}) })
        }).addTo(group);
        for (const f of fc.features.filter(x => x.properties.kind === 'label')) {
            L.marker(coordsToLatLng(f.geometry.coordinates), {
                pane: 'kuvitteellinen',
                interactive: false,
                icon: L.divIcon({ className: 'kuvitteellinen-nimi', html: f.properties.text, iconSize: null })
            }).addTo(group);
        }
    });
    return group;
}
