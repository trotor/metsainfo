/**
 * Metsäkeskuksen REST 2.0 (https://avoin.metsakeskus.fi/rest/data/docs).
 * Jaettu tietokerros toiminnoille, jotka hakevat kuvioita sijainnin
 * ympäriltä (maastotila, lähihaku). Ei riipu yhdestäkään toiminnosta,
 * jotta ne voi irrottaa omiksi lisäosikseen tai sovelluksikseen.
 *
 * Kuviot haetaan kiinteän 500 m ruudukon ruutuina, ei käyttäjän tarkalla
 * sijainnilla: sijainti ei lähde verkkoon, ja ruudun kuviot toimivat
 * myös ilman verkkoa. Kuvio, jolla käyttäjä seisoo, ratkaistaan laitteella.
 *
 * Vastaus on Metsätietostandardin 1.0 sisäkkäistä GeoJSONia. toStand()
 * muuntaa sen samoiksi litteiksi kentiksi kuin WFS v1:stand palauttaa
 * (STANDNUMBER, MAINTREESPECIES, VOLUME …), jotta CODES-taulut ja
 * olemassa oleva näyttökoodi toimivat sellaisenaan.
 */

export const REST_URL = 'https://avoin.metsakeskus.fi/rest/data/stand-data/area';
export const TILE_SIZE = 500; // m, EPSG:3067

/** Ruudun tunnus pisteelle [x, y] (EPSG:3067). */
export function tileKey([x, y], size = TILE_SIZE) {
    return `${Math.floor(x / size)}:${Math.floor(y / size)}`;
}

/** Ruudun suorakulmio WKT-polygonina. */
export function tileWkt(key, size = TILE_SIZE) {
    const [i, j] = key.split(':').map(Number);
    const x0 = i * size, y0 = j * size, x1 = x0 + size, y1 = y0 + size;
    return `POLYGON((${x0} ${y0},${x1} ${y0},${x1} ${y1},${x0} ${y1},${x0} ${y0}))`;
}

/** Naapuriruudut (8 kpl) esihakua varten. */
export function neighbourKeys(key) {
    const [i, j] = key.split(':').map(Number);
    const keys = [];
    for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
            if (di || dj) keys.push(`${i + di}:${j + dj}`);
        }
    }
    return keys;
}

const num = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const year = (date) => (date ? Number(String(date).slice(0, 4)) : null);

// Puulajit osuuksiin samoin kuin WFS: mänty, kuusi, muut
const PINE = 1;
const SPRUCE = 2;

/**
 * Hakkuutavat (Metsärekisterin hakkuutapa-koodisto). Toimenpiteistä
 * vain nämä ovat hakkuita; muut (esim. 302, 410) ovat metsänhoitotöitä,
 * joiden koodisto ei vastaa WFS:n SILVICULTURETYPEä, joten niitä ei muunneta.
 */
const CUTTING_METHODS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15]);

function pickTreeData(list, type) {
    return (list || []).filter(t => String(t.type) === type)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
}

// Taimikossa tilavuus on pieni, joten osuudet lasketaan runkoluvusta (kuten WFS)
const SAPLING_CLASSES = new Set(['T1', 'T2', 'Y1']);

/** Puulajiosuudet nykypuuston ositteista: tilavuuden tai runkoluvun mukaan. */
export function speciesShares(strata, { byStems = false } = {}) {
    const totals = new Map();
    let sum = 0;
    for (const s of strata || []) {
        const amount = num(byStems ? s.stemCount : s.amount) || 0;
        const species = num(s.treeSpecies);
        if (!amount || species == null) continue;
        totals.set(species, (totals.get(species) || 0) + amount);
        sum += amount;
    }
    if (!sum) return [];
    return [...totals].map(([species, amount]) => ({ species, share: amount / sum }))
        .sort((a, b) => b.share - a.share);
}

/**
 * REST 2.0 -kuvio → { type, geometry, properties } WFS:n kentillä.
 * Puuttuva tieto on null (ei arvattu). Nykypuusto on treeData type 2
 * (laskennallinen nykytila), inventointi type 1, ennuste type 3.
 */
export function toStand(feature) {
    const p = feature?.properties || {};
    const sd = p.standData || {};
    const soil = sd.soilData || {};
    const dev = sd.activeForestDevelopmentData || {};
    const current = pickTreeData(dev.treeData, '2');
    const forecast = pickTreeData(dev.treeData, '3');
    const summary = (current?.treeSummaries || [])[0] || {};
    const devClass = current?.treeBasedData?.developmentClass || null;
    // Osuudet vallitsevasta jaksosta (storey 1) kuten WFS; muuten kaikista ositteista
    const strata = current?.treeStrata || [];
    const main = strata.filter(s => String(s.storey) === '1');
    const shares = speciesShares(main.length ? main : strata, { byStems: SAPLING_CLASSES.has(devClass) });
    const shareOf = (sp) => shares.find(s => s.species === sp)?.share ?? 0;

    const cutting = (dev.operations || [])
        .filter(o => CUTTING_METHODS.has(num(o.operationType)) && o.planningData?.proposalDate)
        .sort((a, b) => String(a.planningData.proposalDate).localeCompare(String(b.planningData.proposalDate)))[0];

    const standId = String(p.objectId || '').replace(/^MV-/, '');

    return {
        type: 'Feature',
        geometry: feature?.geometry ? { type: feature.geometry.type, coordinates: feature.geometry.coordinates } : null,
        properties: {
            STANDID: standId ? Number(standId) || standId : null,
            STANDNUMBER: sd.standNumber ?? null,
            MAINGROUP: num(soil.mainGroup),
            SUBGROUP: num(soil.subGroup),
            FERTILITYCLASS: num(soil.fertilityClass),
            SOILTYPE: num(soil.soilType),
            DRAINAGESTATE: num(soil.drainageState),
            ACCESSIBILITY: num(sd.accessibilityData?.accessibility),
            AREA: num(p.geomMetaData?.geomArea),
            MEASUREMENTDATE: sd.inventoryDate || null,
            TREESTANDDATE: current?.date || null,
            DEVELOPMENTCLASS: devClass,
            MAINTREESPECIES: num(current?.treeBasedData?.mainTreeSpecies),
            PROPORTIONPINE: shares.length ? shareOf(PINE) : null,
            PROPORTIONSPRUCE: shares.length ? shareOf(SPRUCE) : null,
            PROPORTIONOTHER: shares.length ? 1 - shareOf(PINE) - shareOf(SPRUCE) : null,
            MEANAGE: num(summary.meanAge),
            BASALAREA: num(summary.basalArea),
            STEMCOUNT: num(summary.stemCount),
            MEANDIAMETER: num(summary.meanDiameter),
            MEANHEIGHT: num(summary.meanHeight),
            DOMINANTHEIGHT: num(summary.dominantHeight),
            VOLUME: num(summary.amount),
            SAWLOGVOLUME: num(summary.sawLogAmount),
            PULPWOODVOLUME: num(summary.pulpWoodAmount),
            VOLUMEGROWTH: num(summary.amountGrowth),
            CUTTINGTYPE: cutting ? num(cutting.operationType) : null,
            CUTTINGPROPOSALYEAR: cutting ? year(cutting.planningData.proposalDate) : null,
            // Lisätiedot, joita WFS ei anna
            SPECIESSHARES: shares,
            FORECASTYEAR: year(forecast?.date),
            FORECASTDEVELOPMENTCLASS: forecast?.treeBasedData?.developmentClass || null,
            FORECASTMAINTREESPECIES: num(forecast?.treeBasedData?.mainTreeSpecies)
        }
    };
}

/** Ruudun kuviot. Heittää virheen, jos haku epäonnistuu. */
export async function fetchTile(key, { fetchFn = fetch, signal } = {}) {
    const url = `${REST_URL}?geometry=${encodeURIComponent(tileWkt(key))}`;
    const response = await fetchFn(url, { signal });
    if (!response.ok) throw new Error(`REST 2.0: HTTP ${response.status}`);
    const data = await response.json();
    return (data.features || []).map(toStand).filter(f => f.geometry);
}

/* ---------- Jaettu ruutuvälimuisti ---------- */

/**
 * Ruutuvälimuisti: { status: 'loading' | 'ok' | 'error', stands, promise }.
 * Sama ruutu haetaan vain kerran, vaikka useampi toiminto pyytää sitä.
 * Epäonnistunut ruutu haetaan uudelleen seuraavalla pyynnöllä.
 */
export function createTileCache({ fetchFn = fetch } = {}) {
    const entries = new Map();

    function get(key) {
        const existing = entries.get(key);
        if (existing && existing.status !== 'error') return existing;
        const entry = { status: 'loading', stands: [] };
        entry.promise = fetchTile(key, { fetchFn }).then(
            (stands) => { entry.status = 'ok'; entry.stands = stands; return entry; },
            () => { entry.status = 'error'; return entry; }
        );
        entries.set(key, entry);
        return entry;
    }

    return {
        get,
        peek: (key) => entries.get(key) || null,
        /** Kaikki ladatut kuviot annetuista ruuduista, kukin kuvio kerran. */
        stands(keys) {
            const seen = new Set();
            const out = [];
            for (const k of keys) {
                for (const f of entries.get(k)?.stands || []) {
                    const id = f.properties.STANDID;
                    if (id != null && seen.has(id)) continue;
                    seen.add(id);
                    out.push(f);
                }
            }
            return out;
        }
    };
}

/** Sovelluksen yhteinen välimuisti. */
export const tileCache = createTileCache();
