import { describe, it, expect, vi } from 'vitest';
import { MAX_KUVAT, photoPath, cleanPhotos, commitPhotos, removeAllPhotos } from '../js/huomiot/kuvat.js';
import { createNotes } from '../js/huomiot/varasto.js';

function memoryStorage() {
    const data = new Map();
    return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
}

function fakeIo({ failWrite = () => false } = {}) {
    const files = new Map();
    return {
        files,
        write: vi.fn(async (path, data) => { if (failWrite(path)) throw new Error('täynnä'); files.set(path, data); }),
        remove: vi.fn(async (path) => { files.delete(path); })
    };
}

describe('huomion kuvat (#37)', () => {
    it('enintään viisi kuvaa', () => {
        expect(MAX_KUVAT).toBe(5);
    });

    it('polku sovelluksen omissa tiedostoissa, tunnus turvalliseksi', () => {
        expect(photoPath('h:abc12', 'k1')).toBe('huomiot/h_abc12/k1.jpg');
        expect(photoPath('../x', 'k/2')).toBe('huomiot/___x/k_2.jpg');
    });

    it('ladatut viitteet siistitään: vain kelvolliset, enintään viisi', () => {
        const ok = (n) => ({ id: `k${n}`, path: `huomiot/h/k${n}.jpg` });
        expect(cleanPhotos(undefined)).toEqual([]);
        expect(cleanPhotos([ok(1), { id: 2 }, null, { id: 'x' }, ok(3)])).toEqual([ok(1), ok(3)]);
        expect(cleanPhotos([1, 2, 3, 4, 5, 6].map(ok))).toHaveLength(5);
        // Luonnoksen data ei päädy tallennukseen
        expect(cleanPhotos([{ ...ok(1), src: 'blob:x', source: { uri: 'file:///tmp/a.jpg' } }])).toEqual([ok(1)]);
    });

    it('tallennus kirjoittaa uudet kuvat ja poistaa poistetut', async () => {
        const io = fakeIo();
        io.files.set('huomiot/h_1/vanha.jpg', 'V');
        io.files.set('huomiot/h_1/pois.jpg', 'P');
        const before = [{ id: 'vanha', path: 'huomiot/h_1/vanha.jpg' }, { id: 'pois', path: 'huomiot/h_1/pois.jpg' }];
        const draft = [{ id: 'vanha', path: 'huomiot/h_1/vanha.jpg' }, { id: 'uusi', src: 'blob:x', source: 'UUSI' }];
        const r = await commitPhotos({ noteId: 'h:1', before, draft, io });
        expect(r.photos).toEqual([{ id: 'vanha', path: 'huomiot/h_1/vanha.jpg' }, { id: 'uusi', path: 'huomiot/h_1/uusi.jpg' }]);
        expect(r.failed).toBe(0);
        expect(io.files.get('huomiot/h_1/uusi.jpg')).toBe('UUSI');
        expect(io.files.has('huomiot/h_1/pois.jpg')).toBe(false);
    });

    it('epäonnistunut kirjoitus jättää kuvan pois ja kertoo määrän', async () => {
        const io = fakeIo({ failWrite: (p) => p.endsWith('b.jpg') });
        const r = await commitPhotos({ noteId: 'h:2', before: [], draft: [{ id: 'a', source: 'A' }, { id: 'b', source: 'B' }], io });
        expect(r.photos).toEqual([{ id: 'a', path: 'huomiot/h_2/a.jpg' }]);
        expect(r.failed).toBe(1);
    });

    it('huomion poisto poistaa sen kuvat (ei galleriaa)', async () => {
        const io = fakeIo();
        io.files.set('huomiot/h_3/a.jpg', 'A');
        await removeAllPhotos({ photos: [{ id: 'a', path: 'huomiot/h_3/a.jpg' }] }, io);
        expect(io.files.size).toBe(0);
        await expect(removeAllPhotos({}, io)).resolves.toBeUndefined();
    });

    it('varasto säilyttää kuvaviitteet ja päivittää ne', () => {
        const storage = memoryStorage();
        const notes = createNotes(storage);
        const n = notes.add({ point: [1, 2], photos: [{ id: 'a', path: 'huomiot/x/a.jpg' }] });
        expect(n.photos).toEqual([{ id: 'a', path: 'huomiot/x/a.jpg' }]);
        notes.update(n.id, { photos: [] });
        expect(createNotes(storage).get(n.id).photos).toEqual([]);
        // Vanha huomio ilman kuvia
        const plain = notes.add({ point: [3, 4] });
        expect(createNotes(storage).get(plain.id).photos).toEqual([]);
    });
});
