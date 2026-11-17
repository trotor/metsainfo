import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect } from 'vitest';
import { TYYPIT, createNotes } from '../js/huomiot/varasto.js';

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
