import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect } from 'vitest';
import {
    latLonTo3067, findFeatureIndexAt, findParcelAt, isInsideParcel,
    nextFollowMode, isStale, hereRowModel
} from '../js/location/logic.js';
import { STANDS } from './fixtures/stands.js';

const square = (x0, y0, size = 100) => ({
    type: 'Polygon',
    coordinates: [[[x0, y0], [x0 + size, y0], [x0 + size, y0 + size], [x0, y0 + size], [x0, y0]]]
});

describe('latLonTo3067', () => {
    it('27°E on vyöhykkeen keskimeridiaani eli x = 500000', () => {
        const [x] = latLonTo3067(62, 27);
        expect(x).toBeCloseTo(500000, 3);
    });
});

describe('findFeatureIndexAt', () => {
    it('löytää kuvion, jonka sisällä piste on', () => {
        expect(findFeatureIndexAt(STANDS, [500050, 6822050])).toBe(0);
        expect(findFeatureIndexAt(STANDS, [500150, 6822050])).toBe(1);
    });

    it('palauttaa -1 kuvioiden ulkopuolella', () => {
        expect(findFeatureIndexAt(STANDS, [499000, 6822050])).toBe(-1);
        expect(findFeatureIndexAt([], [500050, 6822050])).toBe(-1);
    });
});

describe('kiinteistöt', () => {
    const partA = { type: 'Feature', properties: { nationalCadastralReference: 'A' }, geometry: square(500000, 6822000) };
    const partB = { type: 'Feature', properties: { nationalCadastralReference: 'A' }, geometry: square(500300, 6822000) };
    const other = { type: 'Feature', properties: { nationalCadastralReference: 'B' }, geometry: square(500100, 6822000) };

    it('findParcelAt löytää kiinteistön Map-arvoista', () => {
        const map = new Map([['A', partA], ['B', other]]);
        expect(findParcelAt(map.values(), [500150, 6822050])).toBe(other);
        expect(findParcelAt(map.values(), [600000, 6822050])).toBeNull();
    });

    it('isInsideParcel tarkistaa kaikki palstat', () => {
        const multi = { properties: partA.properties, parts: [partA, partB] };
        expect(isInsideParcel(multi, [500350, 6822050])).toBe(true);
        expect(isInsideParcel(multi, [500050, 6822050])).toBe(true);
    });

    it('palstojen välissä ollaan kiinteistön ulkopuolella', () => {
        const multi = { properties: partA.properties, parts: [partA, partB] };
        expect(isInsideParcel(multi, [500200, 6822050])).toBe(false);
    });

    it('yksiosainen kiinteistö ja puuttuva valinta', () => {
        expect(isInsideParcel(partA, [500050, 6822050])).toBe(true);
        expect(isInsideParcel(null, [500050, 6822050])).toBe(false);
    });
});

describe('nextFollowMode', () => {
    it('kiertää pois → keskitys → suunta → pois kompassin kanssa', () => {
        expect(nextFollowMode('off', true)).toBe('follow');
        expect(nextFollowMode('follow', true)).toBe('heading');
        expect(nextFollowMode('heading', true)).toBe('off');
    });

    it('ilman kompassia suunta jää pois', () => {
        expect(nextFollowMode('follow', false)).toBe('off');
    });

    it('pelkkä näyttö palaa keskitykseen', () => {
        expect(nextFollowMode('show', true)).toBe('follow');
        expect(nextFollowMode('show', false)).toBe('follow');
    });
});

describe('isStale', () => {
    it('yli 30 s vanha sijainti on vanhentunut', () => {
        expect(isStale(1000, 31000)).toBe(false);
        expect(isStale(1000, 31001)).toBe(true);
    });
});

describe('hereRowModel', () => {
    it('kuviolla: numero, puulaji, tilavuus ja kehitysluokka', () => {
        const feature = { properties: { STANDNUMBER: 7, MAINTREESPECIES: 2, VOLUME: 148, DEVELOPMENTCLASS: '03' } };
        const m = hereRowModel({ hasParcel: true, inside: true, feature });
        expect(m.kind).toBe('stand');
        expect(m.text).toBe('Kuvio 7 · Kuusi · 148 m³/ha · Varttunut kasvatusmetsikkö');
    });

    it('puuttuvat tiedot jätetään pois', () => {
        const m = hereRowModel({ hasParcel: true, inside: true, feature: { properties: { STANDNUMBER: 3 } } });
        expect(m.text).toBe('Kuvio 3');
    });

    it('valitun kiinteistön ulkopuolella', () => {
        const m = hereRowModel({ hasParcel: true, inside: false, feature: null });
        expect(m).toEqual({ kind: 'outside', text: 'Valitun kiinteistön ulkopuolella' });
    });

    it('kiinteistöllä mutta ei kuviolla', () => {
        expect(hereRowModel({ hasParcel: true, inside: true, feature: null }))
            .toEqual({ kind: 'none', text: 'Ei kuviotietoa tässä kohdassa' });
    });

    it('ilman kiinteistöä ei riviä', () => {
        expect(hereRowModel({ hasParcel: false, inside: false, feature: null }).kind).toBe('none');
    });
});
