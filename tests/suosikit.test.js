import "../js/vendor/index.js";
import { describe, it, expect } from 'vitest';
import { createFavorites, filterFavorites, favoriteId } from '../js/suosikit/varasto.js';

function memoryStorage() {
    const m = new Map();
    return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), _m: m };
}
let t = 0;
const clock = () => new Date(Date.UTC(2026, 10, 16, 12, 0, t++));

describe('suosikit', () => {
    it('lisää, ei tuplaa samaa kiinteistöä ja tallentaa laitteelle', () => {
        const s = memoryStorage();
        const f = createFavorites(s, { now: clock });
        const a = f.add({ type: 'kiinteisto', name: '91-416-1-123', ref: { reference: '09141600010123' } });
        const b = f.add({ type: 'kiinteisto', name: 'toinen nimi', ref: { reference: '09141600010123' } });
        expect(b).toBe(a);
        expect(a.id).toBe('k:09141600010123');
        expect(createFavorites(s).list()).toHaveLength(1);
    });

    it('muokkaa nimeä ja muistiinpanoa, tyhjä nimi ei korvaa', () => {
        const f = createFavorites(memoryStorage(), { now: clock });
        const a = f.add({ type: 'kuvio', name: 'Kuvio 3', ref: { standId: 74234401, standNumber: '3', center: [1, 2] } });
        f.update(a.id, { name: '  ', note: 'Kanttarellipaikka' });
        expect(f.get(a.id).name).toBe('Kuvio 3');
        expect(f.get(a.id).note).toBe('Kanttarellipaikka');
        f.update(a.id, { name: 'Vanha kuusikko' });
        expect(f.get(a.id).name).toBe('Vanha kuusikko');
    });

    it('lista uusin muutos ensin, poisto ja ilmoitus muutoksesta', () => {
        const f = createFavorites(memoryStorage(), { now: clock });
        let changes = 0;
        f.onChange(() => changes++);
        const a = f.add({ type: 'kiinteisto', name: 'A', ref: { reference: '1' } });
        f.add({ type: 'kiinteisto', name: 'B', ref: { reference: '2' } });
        f.update(a.id, { note: 'x' });
        expect(f.list().map(i => i.name)).toEqual(['A', 'B']);
        f.remove(a.id);
        expect(f.list().map(i => i.name)).toEqual(['B']);
        expect(changes).toBe(4);
    });

    it('rikkinäinen tallennus ei kaada', () => {
        const s = memoryStorage();
        s.setItem('metsainfo.suosikit', '{rikki');
        expect(createFavorites(s).list()).toEqual([]);
        s.setItem('metsainfo.suosikit', JSON.stringify([{ id: 'x', type: 'tuntematon' }, { id: 'k:1', type: 'kiinteisto', name: 'A' }]));
        expect(createFavorites(s).list()).toHaveLength(1);
    });

    it('haulle oma tunnus joka tallennuksella', () => {
        expect(favoriteId('haku', {}, 1000)).not.toBe(favoriteId('haku', {}, 2000));
    });

    it('suodatus tyypin ja tekstin mukaan, ääkköset ja kirjainkoko', () => {
        const items = [
            { id: 'k:1', type: 'kiinteisto', name: 'Mökkitila', note: '', ref: { reference: '09141600010123' } },
            { id: 's:2', type: 'kuvio', name: 'Kuvio 3', note: 'Vanha KUUSIKKO, kääpiä', ref: { standId: 2, standNumber: '3' } },
            { id: 'h:3', type: 'haku', name: 'Kuusikot', note: '', ref: { criteria: {} } }
        ];
        expect(filterFavorites(items, { type: 'kuvio' }).map(i => i.id)).toEqual(['s:2']);
        expect(filterFavorites(items, { text: 'kuusikko' }).map(i => i.id)).toEqual(['s:2']);
        expect(filterFavorites(items, { text: 'kaapia' }).map(i => i.id)).toEqual(['s:2']);
        expect(filterFavorites(items, { text: 'mokki' }).map(i => i.id)).toEqual(['k:1']);
        expect(filterFavorites(items, { text: '0914160' }).map(i => i.id)).toEqual(['k:1']);
        expect(filterFavorites(items, { text: '' })).toHaveLength(3);
    });
});

import { on, emit } from '../js/vayla.js';

describe('viestiväylä', () => {
    it('replay antaa jo lähetetyn viestin myöhään liittyvälle', () => {
        emit('testi:replay', { n: 1 });
        const got = [];
        on('testi:replay', d => got.push(d.n), { replay: true });
        on('testi:replay', d => got.push(-d.n));
        emit('testi:replay', { n: 2 });
        expect(got).toEqual([1, 2, -2]);
    });
});

import { pointInside } from '../js/kuviotieto.js';
import { containsPoint } from '../js/location/logic.js';

describe('piste kuvion sisältä', () => {
    it('U-muotoinen kuvio: rajojen keskipiste ei ole kuviolla, palautettu piste on', () => {
        const u = { type: 'Polygon', coordinates: [[[0, 0], [300, 0], [300, 300], [200, 300], [200, 100], [100, 100], [100, 300], [0, 300], [0, 0]]] };
        expect(containsPoint(u, [150, 150])).toBe(false);
        const p = pointInside(u);
        expect(containsPoint(u, p)).toBe(true);
    });

    it('kuvion kiinteistötunnus tallentuu, kun se selviää', () => {
        const m = new Map();
        const f = createFavorites({ getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) });
        const a = f.add({ type: 'kuvio', name: 'K', ref: { standId: 5, center: [1, 2] } });
        f.setReference(a.id, '99240300020062');
        expect(f.get(a.id).ref).toEqual({ standId: 5, center: [1, 2], reference: '99240300020062' });
    });
});

import { fetchParcelContaining } from '../js/data.js';

describe('kiinteistö pisteessä', () => {
    it('kasvattaa hakualuetta, kunnes pisteen sisältävä kiinteistö löytyy', async () => {
        const big = { type: 'Feature', properties: { nationalCadastralReference: 'X' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1000, 0], [1000, 1000], [0, 1000], [0, 0]]] } };
        const calls = [];
        const fetchFn = async (url) => {
            const r = Number(new URL(url).searchParams.get('bbox').split(',')[2]) - 500;
            calls.push(r);
            // Kuten MML: kokonaan kiinteistön sisällä oleva laatikko ei palauta sitä
            return { ok: true, json: async () => ({ features: r >= 700 ? [big] : [] }) };
        };
        const hit = await fetchParcelContaining(500, 500, { fetchFn });
        expect(hit.properties.nationalCadastralReference).toBe('X');
        expect(calls).toEqual([200, 700]);
        expect(await fetchParcelContaining(5000, 5000, { fetchFn })).toBeNull();
    });
});
