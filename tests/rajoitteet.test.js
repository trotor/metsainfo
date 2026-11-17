import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect } from 'vitest';
import { SOURCES, wfsUrl, toItems, createConstraintSource } from '../js/rajoitteet/aineisto.js';
import { matchArea, matchStand, groupItems, TOL } from '../js/rajoitteet/logiikka.js';

const square = (x, y, s) => ({ type: 'Polygon', coordinates: [[[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]]] });
const pt = (x, y) => ({ type: 'Point', coordinates: [x, y] });
const item = (ryhma, geometry, nimi = 'X') => ({ ryhma, nimi, laji: '', geometry });

describe('aineisto', () => {
    it('lähteet: muinaisjäännökset, kulttuuriperintö, suojelu, Natura, erämaa, METE', () => {
        expect([...new Set(SOURCES.map(s => s.ryhma))]).toEqual(['muinais', 'kulttuuri', 'suojelu', 'natura', 'erama', 'mete']);
    });

    it('WFS-pyyntö EPSG:3067-rajauksella', () => {
        const s = SOURCES.find(x => x.typeName === 'rajapinta_suojellut:muinaisjaannos_piste');
        const url = wfsUrl(s, { minX: 1, minY: 2, maxX: 3, maxY: 4 });
        expect(url).toContain('geoserver.museovirasto.fi/geoserver/rajapinta_suojellut/wfs');
        expect(url).toContain('typeNames=rajapinta_suojellut%3Amuinaisjaannos_piste');
        expect(url).toContain('bbox=1%2C2%2C3%2C4%2CEPSG%3A3067');
        expect(url).toContain('srsName=EPSG%3A3067');
    });

    it('kohteiden nimet ja lajit (välilyönnit pois)', () => {
        const s = SOURCES.find(x => x.typeName === 'rajapinta_suojellut:muinaisjaannos_alue');
        const items = toItems(s, { features: [{ geometry: pt(1, 1), properties: { kohdenimi: 'Hiekkaranta   ', Laji: 'kiinteä muinaisjäännös   ', tyyppi: 'asuinpaikat' } }, { geometry: null, properties: {} }] });
        expect(items).toEqual([{ ryhma: 'muinais', nimi: 'Hiekkaranta', laji: 'kiinteä muinaisjäännös, asuinpaikat', geometry: pt(1, 1) }]);
        const n = SOURCES.find(x => x.ryhma === 'natura');
        expect(toItems(n, { features: [{ geometry: pt(0, 0), properties: { nimisuomi: 'Jurvon alue', aluetyyppi: 'SAC' } }] })[0]).toMatchObject({ nimi: 'Jurvon alue', laji: 'SAC' });
    });

    it('yhden lähteen virhe ei kaada muita: osittainen tulos', async () => {
        const fetchFn = async (url) => {
            if (url.includes('museovirasto')) throw new Error('verkko');
            return { ok: true, json: async () => ({ features: [{ geometry: pt(5, 5), properties: { nimi: 'Suo' } }] }) };
        };
        const src = createConstraintSource({ fetchFn });
        const res = await src.items({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
        expect(res.partial).toBe(true);
        expect(res.items.length).toBeGreaterThan(0);
        expect(res.items.every(i => i.ryhma !== 'muinais')).toBe(true);
    });
});

describe('päättely', () => {
    const parcel = [square(0, 0, 100)];

    it('piste kiinteistöllä tai enintään 20 m päässä', () => {
        const items = [item('muinais', pt(50, 50), 'A'), item('muinais', pt(115, 50), 'B'), item('muinais', pt(150, 50), 'C')];
        expect(TOL).toBe(20);
        expect(matchArea(items, parcel).map(i => i.nimi)).toEqual(['A', 'B']);
    });

    it('alue: osittain päällekkäin, kokonaan sisällä tai ympäröi kiinteistön', () => {
        const items = [item('suojelu', square(90, 90, 50), 'osin'), item('suojelu', square(-100, -100, 400), 'ympäröi'),
            item('suojelu', square(40, 40, 10), 'sisällä'), item('suojelu', square(300, 300, 10), 'kaukana')];
        expect(matchArea(items, parcel).map(i => i.nimi)).toEqual(['osin', 'ympäröi', 'sisällä']);
    });

    it('kuviolla vain osuvat, ilman marginaalia', () => {
        const items = [item('muinais', pt(5, 5), 'A'), item('muinais', pt(15, 5), 'B')];
        expect(matchStand(items, square(0, 0, 10)).map(i => i.nimi)).toEqual(['A']);
    });

    it('ryhmittely: sama nimi kerran, ryhmien järjestys', () => {
        const g = groupItems([item('suojelu', pt(0, 0), 'S'), item('muinais', pt(0, 0), 'M'), item('muinais', pt(0, 0), 'M')]);
        expect(g.map(x => [x.ryhma, x.nimet])).toEqual([['muinais', ['M']], ['suojelu', ['S']]]);
    });
});
