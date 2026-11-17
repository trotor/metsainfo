import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect } from 'vitest';
import {
    MAX_EXTENT, standKey, tileKeys, tileBounds, createSelection, selectionSummary, canShow, toPseudoParcel
} from '../js/valinta/logiikka.js';
import { calculateParcelArea } from '../js/utils.js';

const SQ = (x, y, s = 100) => ({
    type: 'Polygon',
    coordinates: [[[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]]]
});
const SQF = (id, x, y, props = {}) => ({ type: 'Feature', id, properties: { STANDNUMBER: 1, AREA: 1, VOLUME: 100, ...props }, geometry: SQ(x, y) });
const F = (props) => SQF(undefined, 430000, 6935000, props);
const A = SQF('stand.1', 430000, 6935000);

describe('standKey', () => {
    it('käyttää WFS-id:tä', () => {
        expect(standKey({ id: 'stand.1', properties: {}, geometry: SQ(0, 0) })).toBe('stand.1');
    });
    it('ilman id:tä kuvionumero ja sisäpiste', () => {
        expect(standKey({ properties: { STANDNUMBER: 7 }, geometry: SQ(1000, 2000) })).toBe('7:1040:2040');
    });
});

describe('createSelection', () => {
    it('toggle lisää ja poistaa', () => {
        const s = createSelection();
        expect(s.toggle(A)).toBe('added');
        expect(s.has('stand.1')).toBe(true);
        expect(s.toggle(A)).toBe('removed');
        expect(s.size).toBe(0);
    });
    it('sama kuvio kahdesta ruudusta vain kerran', () => {
        const s = createSelection();
        s.toggle(A);
        s.toggle({ ...A });
        expect(s.size).toBe(0);
    });
    it(`yli ${MAX_EXTENT / 1000} km rajaus hylätään`, () => {
        const s = createSelection();
        s.toggle(SQF('a', 0, 0));
        expect(s.toggle(SQF('b', 10500, 0))).toBe('too-large');
        expect(s.toggle(SQF('c', 0, 10500))).toBe('too-large');
        expect(s.size).toBe(1);
        expect(s.toggle(SQF('d', 9000, 9000))).toBe('added');
    });
    it('list palauttaa valitut lisäysjärjestyksessä', () => {
        const s = createSelection();
        s.toggle(SQF('a', 0, 0));
        s.toggle(SQF('b', 200, 0));
        expect(s.list().map(f => f.id)).toEqual(['a', 'b']);
    });
    it('clear tyhjentää', () => {
        const s = createSelection();
        s.toggle(A);
        s.clear();
        expect(s.size).toBe(0);
        expect(s.list()).toEqual([]);
    });
    it('signature muuttuu valinnan mukana', () => {
        const s = createSelection();
        const a = s.signature();
        s.toggle(A);
        expect(s.signature()).not.toBe(a);
        s.toggle(A);
        expect(s.signature()).toBe(a);
    });
});

describe('selectionSummary', () => {
    it('summaa määrän, pinta-alan ja tilavuuden', () => {
        expect(selectionSummary([F({ AREA: 2, VOLUME: 100 }), F({ AREA: 1, VOLUME: 50 })]))
            .toEqual({ count: 2, areaHa: 3, volume: 250 });
    });
    it('puuttuvat arvot nollina', () => {
        expect(selectionSummary([F({ AREA: null, VOLUME: undefined })])).toEqual({ count: 1, areaHa: 0, volume: 0 });
    });
});

describe('ruudut', () => {
    it('tileKeys kattaa rajauksen', () => {
        expect(tileKeys({ minX: 500, minY: 500, maxX: 1500, maxY: 900 })).toEqual(['0:0', '1:0']);
    });
    it('tileBounds', () => {
        expect(tileBounds('2:3')).toEqual({ minX: 2000, minY: 3000, maxX: 3000, maxY: 4000 });
    });
});

describe('canShow ja toPseudoParcel', () => {
    it('canShow tyhjällä false, valinnalla true', () => {
        const s = createSelection();
        expect(canShow(s)).toBe(false);
        s.toggle(A);
        expect(canShow(s)).toBe(true);
    });
    it('parts Feature-muotoisina, pinta-ala lasketaan', () => {
        const p = toPseudoParcel([A], 'Oma valinta');
        expect(p.properties).toEqual({ label: 'Oma valinta', valinta: true });
        expect(p.parts[0].type).toBe('Feature');
        expect(p.parts[0].geometry).toBe(A.geometry);
        expect(calculateParcelArea(p, 1)).toBeCloseTo(10000);
    });
});
