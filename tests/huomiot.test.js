import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect } from 'vitest';
import { TYYPIT, createNotes } from '../js/huomiot/varasto.js';
import { standAt, linkFromSummary, formatCoords, notesFor } from '../js/huomiot/logiikka.js';

function memoryStorage(initial = {}) {
    const data = { ...initial };
    return {
        getItem: (k) => (k in data ? data[k] : null),
        setItem: (k, v) => { data[k] = String(v); },
        data
    };
}

const clock = () => {
    let t = Date.parse('2026-11-17T10:00:00Z');
    return () => new Date(t += 1000);
};

describe('huomioiden tallennus', () => {
    it('tyypit', () => {
        expect(TYYPIT).toEqual(['tuulenkaato', 'rajapyykki', 'oja', 'varasto', 'muu']);
    });

    it('lisäys: id, oletukset ja ajat', () => {
        const notes = createNotes(memoryStorage(), { now: clock() });
        const n = notes.add({ point: [432000, 6923000] });
        expect(n.id).toMatch(/^h:/);
        expect(n).toMatchObject({ title: '', type: 'muu', text: '', point: [432000, 6923000], parcel: null, stand: null });
        expect(n.created).toBe(n.updated);
        expect(notes.get(n.id)).toEqual(n);
    });

    it('tuntematon tyyppi → muu, tarkkuus ja liitokset säilyvät', () => {
        const notes = createNotes(memoryStorage(), { now: clock() });
        const n = notes.add({ point: [1, 2], type: 'ufo', accuracy: 7, parcel: { reference: '99900100010001', label: '999-1-1-1' }, stand: { standId: 5, standNumber: '3' } });
        expect(n.type).toBe('muu');
        expect(n.accuracy).toBe(7);
        expect(n.parcel.label).toBe('999-1-1-1');
        expect(n.stand.standNumber).toBe('3');
    });

    it('lista: uusin muutos ensin', () => {
        const notes = createNotes(memoryStorage(), { now: clock() });
        const a = notes.add({ point: [1, 1], title: 'A' });
        notes.add({ point: [2, 2], title: 'B' });
        notes.update(a.id, { text: 'muutos' });
        expect(notes.list().map(n => n.title)).toEqual(['A', 'B']);
    });

    it('muokkaus: vain annetut kentät, id ja luontiaika ennallaan, piste siirtyy', () => {
        const notes = createNotes(memoryStorage(), { now: clock() });
        const n = notes.add({ point: [1, 1], title: 'A', type: 'oja' });
        const { id, created, updated } = n;
        const u = notes.update(id, { title: 'B', point: [3, 4], id: 'x', created: 'y' });
        expect(u).toMatchObject({ id, created, title: 'B', type: 'oja', point: [3, 4] });
        expect(u.updated > updated).toBe(true);
        expect(notes.update('puuttuu', { title: 'C' })).toBeNull();
    });

    it('poisto', () => {
        const notes = createNotes(memoryStorage(), { now: clock() });
        const n = notes.add({ point: [1, 1] });
        expect(notes.remove(n.id)).toBe(true);
        expect(notes.list()).toEqual([]);
        expect(notes.remove(n.id)).toBe(false);
    });

    it('säilyy laitteella', () => {
        const storage = memoryStorage();
        const n = createNotes(storage, { now: clock() }).add({ point: [5, 6], title: 'Rajapyykki', type: 'rajapyykki' });
        expect(createNotes(storage).get(n.id)).toMatchObject({ title: 'Rajapyykki', point: [5, 6] });
    });

    it('vioittunut tai vanha tallenne ei kaada: kelvottomat ohitetaan', () => {
        expect(createNotes(memoryStorage({ 'metsainfo.huomiot': '{rikki' })).list()).toEqual([]);
        expect(createNotes(memoryStorage({ 'metsainfo.huomiot': '{"a":1}' })).list()).toEqual([]);
        const raw = JSON.stringify([
            { id: 'h:1', title: 'ok', type: 'oja', point: [1, 2], updated: '2026' },
            { id: 'h:2', point: ['x', 2] }, { id: 'h:3' }, null, { point: [1, 2] }
        ]);
        expect(createNotes(memoryStorage({ 'metsainfo.huomiot': raw })).list().map(n => n.id)).toEqual(['h:1']);
    });

    it('muutoksista kerrotaan kuuntelijalle', () => {
        const notes = createNotes(memoryStorage(), { now: clock() });
        let calls = 0;
        const off = notes.onChange(() => calls++);
        const n = notes.add({ point: [1, 1] });
        notes.update(n.id, { title: 'x' });
        notes.remove(n.id);
        expect(calls).toBe(3);
        off();
        notes.add({ point: [1, 1] });
        expect(calls).toBe(3);
    });

    it('tallennuksen virhe ei kaada (täysi tai estetty muisti)', () => {
        const storage = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
        const notes = createNotes(storage, { now: clock() });
        expect(() => notes.add({ point: [1, 1] })).not.toThrow();
        expect(notes.list()).toHaveLength(1);
    });
});

const sq = (x, y, s, holes = []) => ({ type: 'Polygon', coordinates: [[[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]], ...holes] });
const stand = (id, number, geometry) => ({ type: 'Feature', id: `stand.${id}`, geometry, properties: { STANDNUMBER: number } });

describe('huomion kuvio ja kiinteistö', () => {
    const features = [
        stand(11, 1, sq(0, 0, 100, [[[40, 40], [60, 40], [60, 60], [40, 60], [40, 40]]])),
        stand(12, 2, sq(40, 40, 20)),
        { type: 'Feature', geometry: sq(100, 0, 100), properties: { STANDID: 13 } }
    ];
    const parcel = { type: 'Feature', geometry: sq(0, 0, 200), properties: { nationalCadastralReference: '99900100010001' } };
    const ctx = { reference: '99900100010001', label: '999-1-1-1', parcel, features };

    it('kuvio pisteestä; reiässä oleva piste osuu reiän kuvioon', () => {
        expect(standAt(features, [10, 10])).toEqual({ standId: 11, standNumber: '1', index: 0 });
        expect(standAt(features, [50, 50])).toEqual({ standId: 12, standNumber: '2', index: 1 });
        expect(standAt(features, [150, 50])).toEqual({ standId: 13, standNumber: '3', index: 2 });
        expect(standAt(features, [500, 500])).toBeNull();
        expect(standAt(undefined, [1, 1])).toBeNull();
    });

    it('piste kiinteistöllä: kiinteistö ja kuvio', () => {
        expect(linkFromSummary(ctx, [10, 10])).toEqual({
            parcel: { reference: '99900100010001', label: '999-1-1-1' },
            stand: { standId: 11, standNumber: '1' }
        });
    });

    it('piste kiinteistön ulkopuolella tai ei yhteenvetoa: ei liitosta', () => {
        expect(linkFromSummary(ctx, [900, 900])).toEqual({ parcel: null, stand: null });
        expect(linkFromSummary(null, [10, 10])).toEqual({ parcel: null, stand: null });
    });

    it('moniosainen kiinteistö: osien geometriat', () => {
        const multi = { ...ctx, parcel: { geometry: null, parts: [{ geometry: sq(0, 0, 50) }, { geometry: sq(1000, 0, 50) }] }, features: [] };
        expect(linkFromSummary(multi, [1010, 10]).parcel).toEqual({ reference: '99900100010001', label: '999-1-1-1' });
    });

    it('kuviovalinta (näennäiskiinteistö): ei kiinteistöä, kuvio kyllä', () => {
        const valinta = { ...ctx, reference: null, parcel: { geometry: null, properties: { valinta: true }, parts: [{ geometry: sq(0, 0, 200) }] } };
        expect(linkFromSummary(valinta, [10, 10])).toEqual({ parcel: null, stand: { standId: 11, standNumber: '1' } });
    });

    it('koordinaatit: ETRS-TM35FIN metreinä ja WGS84 viidellä desimaalilla', () => {
        const c = formatCoords([432000.4, 6923000.6]);
        expect(c.n).toBe('6923001');
        expect(c.e).toBe('432000');
        expect(Number(c.lat)).toBeCloseTo(62.43200, 4);
        expect(Number(c.lon)).toBeCloseTo(25.68298, 4);
        expect(c.lat).toMatch(/^\d+\.\d{5}$/);
    });

    it('kiinteistön ja kuvion huomiot (tunnus viivoilla tai ilman)', () => {
        const notes = [
            { id: 'a', parcel: { reference: '99900100010001' }, stand: { standId: 11 } },
            { id: 'b', parcel: { reference: '999-1-1-1' }, stand: null },
            { id: 'c', parcel: null, stand: { standId: 11 } },
            { id: 'd', parcel: { reference: '99900200020002' }, stand: { standId: 12 } }
        ];
        expect(notesFor(notes, { reference: '99900100010001' }).map(n => n.id)).toEqual(['a', 'b']);
        expect(notesFor(notes, { standId: 11 }).map(n => n.id)).toEqual(['a', 'c']);
    });
});
