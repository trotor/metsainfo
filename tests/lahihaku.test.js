import "../js/vendor/index.js";
import { describe, it, expect } from 'vitest';
import {
    matches, hasCriteria, emptyCriteria, searchBox, boxTileKeys, intersectsBox,
    nearest, direction, search, tilesStatus
} from '../js/lahihaku/haku.js';

// Käsin tehdyt kuviot, ei oikean tilan dataa
const square = (x, y, s) => ({ type: 'Polygon', coordinates: [[[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]]] });
const stand = (props, geometry = square(0, 0, 100)) => ({
    type: 'Feature',
    geometry,
    properties: {
        STANDID: props.STANDID ?? 1, AREA: 1, DEVELOPMENTCLASS: '04', MAINTREESPECIES: 2, MEANAGE: 90,
        SPECIESSHARES: [{ species: 2, share: 0.8 }, { species: 1, share: 0.2 }],
        CUTTINGPROPOSALYEAR: null, ...props
    }
});

describe('lähihaku: ehdot', () => {
    it('vaatii vähintään yhden ehdon', () => {
        expect(hasCriteria(emptyCriteria())).toBe(false);
        expect(matches(stand({}).properties, emptyCriteria())).toBe(false);
    });

    it('kehitysluokka', () => {
        const p = stand({}).properties;
        expect(matches(p, { vaihe: 'uudistuskypsa' })).toBe(true);
        expect(matches(p, { vaihe: 'taimikko' })).toBe(false);
        expect(matches({ ...p, DEVELOPMENTCLASS: 'T2' }, { vaihe: 'taimikko' })).toBe(true);
        expect(matches({ ...p, DEVELOPMENTCLASS: null }, { vaihe: 'nuori' })).toBe(false);
    });

    it('vanha metsä iän mukaan, puuttuva ikä ei täytä', () => {
        const p = stand({}).properties;
        expect(matches(p, { vaihe: 'vanha' })).toBe(false);
        expect(matches({ ...p, MEANAGE: 120 }, { vaihe: 'vanha' })).toBe(true);
        expect(matches({ ...p, MEANAGE: null }, { vaihe: 'vanha' })).toBe(false);
    });

    it('puulaji vain selvästi vallitsevana, ei pelkän MAINTREESPECIESin mukaan', () => {
        const p = stand({}).properties;
        expect(matches(p, { puulaji: 'kuusi' })).toBe(true);
        expect(matches(p, { puulaji: 'manty' })).toBe(false);
        // Kuusitaimikko, jossa lehtipuuta on eniten: ei kuusikko vaan sekapuusto
        const mixed = { ...p, SPECIESSHARES: [{ species: 9, share: 0.7 }, { species: 2, share: 0.3 }] };
        expect(matches(mixed, { puulaji: 'kuusi' })).toBe(false);
        expect(matches(mixed, { puulaji: 'seka' })).toBe(true);
        expect(matches({ ...p, SPECIESSHARES: [] }, { puulaji: 'seka' })).toBe(false);
    });

    it('hakkuuehdotus lähivuosina, myös myöhässä oleva', () => {
        const p = stand({}).properties;
        expect(matches(p, { hakkuu: true }, 2026)).toBe(false);
        expect(matches({ ...p, CUTTINGPROPOSALYEAR: 2028 }, { hakkuu: true }, 2026)).toBe(true);
        expect(matches({ ...p, CUTTINGPROPOSALYEAR: 2020 }, { hakkuu: true }, 2026)).toBe(true);
        expect(matches({ ...p, CUTTINGPROPOSALYEAR: 2035 }, { hakkuu: true }, 2026)).toBe(false);
    });

    it('ehdot yhdistetään JA-ehdoin', () => {
        const p = stand({ CUTTINGPROPOSALYEAR: 2027 }).properties;
        expect(matches(p, { vaihe: 'uudistuskypsa', puulaji: 'kuusi', hakkuu: true }, 2026)).toBe(true);
        expect(matches(p, { vaihe: 'uudistuskypsa', puulaji: 'manty', hakkuu: true }, 2026)).toBe(false);
    });
});

describe('lähihaku: alue', () => {
    it('1 km laatikko osuu enintään 3 × 3 ruutuun', () => {
        expect(boxTileKeys(searchBox([1250, 1250]))).toHaveLength(9);
        // Ruutujen rajoilla tasan 2 × 2
        expect(boxTileKeys(searchBox([1000, 1000]))).toEqual(['1:1', '1:2', '2:1', '2:2'].sort());
    });

    it('kuvio laatikossa, osittain, ympäröivänä tai ulkona', () => {
        const box = searchBox([0, 0]);
        expect(intersectsBox(square(-50, -50, 100), box)).toBe(true);
        expect(intersectsBox(square(450, 450, 200), box)).toBe(true);
        expect(intersectsBox(square(-1000, -1000, 3000), box)).toBe(true);
        expect(intersectsBox(square(600, 600, 100), box)).toBe(false);
        // Pitkä kaistale, jonka kärjet ovat ulkona mutta keskiosa ylittää laatikon
        const strip = { type: 'Polygon', coordinates: [[[-800, -10], [800, -10], [800, 10], [-800, 10], [-800, -10]]] };
        expect(intersectsBox(strip, box)).toBe(true);
        expect(intersectsBox(null, box)).toBe(false);
    });

    it('etäisyys reunaan ja ilmansuunta', () => {
        expect(nearest(square(0, 0, 100), [50, 50]).distance).toBe(0);
        const n = nearest(square(0, 300, 100), [50, 50]);
        expect(n.distance).toBe(250);
        expect(direction([50, 50], n.point)).toBe('pohjoinen');
        expect(direction([0, 0], [100, 100])).toBe('koillinen');
        expect(direction([0, 0], [-100, 0])).toBe('länsi');
    });
});

describe('lähihaku: haku', () => {
    it('suodattaa, rajaa laatikkoon ja järjestää lähimmästä', () => {
        const stands = [
            stand({ STANDID: 1 }, square(300, 300, 100)),
            stand({ STANDID: 2 }, square(-50, -50, 100)),
            stand({ STANDID: 3 }, square(700, 700, 100)), // laatikon ulkopuolella
            stand({ STANDID: 4, DEVELOPMENTCLASS: '02' }, square(100, 0, 50))
        ];
        const res = search(stands, { vaihe: 'uudistuskypsa' }, [0, 0]);
        expect(res.map(r => r.stand.properties.STANDID)).toEqual([2, 1]);
        expect(res[0].distance).toBe(0);
        expect(res[0].direction).toBeNull();
        expect(res[1].direction).toBe('koillinen');
    });

    it('ruutujen tila', () => {
        expect(tilesStatus([{ status: 'ok' }, { status: 'loading' }])).toBe('loading');
        expect(tilesStatus([{ status: 'ok' }, { status: 'error' }])).toBe('partial');
        expect(tilesStatus([{ status: 'error' }])).toBe('error');
        expect(tilesStatus([{ status: 'ok' }])).toBe('ok');
    });
});
