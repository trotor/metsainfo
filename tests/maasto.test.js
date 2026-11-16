import "../js/vendor/index.js";
import { describe, it, expect } from 'vitest';
import { tileKey, tileWkt, neighbourKeys, toStand, speciesShares, fetchTile } from '../js/maasto/rest.js';
import { standAt, distanceToEdge, placeStatus, leadSentence, describePlace, speciesMix } from '../js/maasto/paikka.js';
import { questionsFor, nextQuestion, scoreAnswer, bucketOf, speciesGroup, POINTS } from '../js/maasto/visa.js';
import { createStore } from '../js/maasto/tila.js';
import { arvonimi } from '../js/maasto/teksti.js';

// Käsin tehty REST 2.0 -kuvio (Metsätietostandardi 1.0), ei oikean tilan dataa
const square = (x, y, s) => [[[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]]];

function restFeature({ id = 'MV-123', number = '7', dev = '04', main = '1', strata, summary = {}, soil = {}, operations = [] } = {}) {
    return {
        type: 'Feature',
        geometry: { type: 'Polygon', crs: { type: 'name', properties: { name: 'EPSG:3067' } }, coordinates: square(1000, 2000, 100) },
        properties: {
            objectId: id,
            geomMetaData: { geomArea: 1 },
            standData: {
                standNumber: number,
                inventoryDate: '2021-06-11',
                soilData: { mainGroup: '1', subGroup: '1', fertilityClass: '3', soilType: '10', drainageState: '1', ...soil },
                accessibilityData: { accessibility: '2' },
                activeForestDevelopmentData: {
                    treeData: [
                        { type: '1', date: '2021-06-11', treeStrata: [] },
                        {
                            type: '2', date: '2027-01-01',
                            treeStrata: strata ?? [
                                { treeSpecies: '1', storey: '1', amount: 200, stemCount: 400 },
                                { treeSpecies: '2', storey: '1', amount: 50, stemCount: 200 },
                                { treeSpecies: '3', storey: '1', amount: 50, stemCount: 100 }
                            ],
                            treeBasedData: { mainTreeSpecies: main, developmentClass: dev },
                            treeSummaries: [{ amount: 300, meanAge: 80, meanHeight: 22.4, meanDiameter: 28.6, basalArea: 30, stemCount: 700, amountGrowth: 6.5, sawLogAmount: 200, pulpWoodAmount: 90, ...summary }]
                        },
                        { type: '3', date: '2037-01-01', treeBasedData: { mainTreeSpecies: '2', developmentClass: 'T2' } }
                    ],
                    operations
                }
            }
        }
    };
}

describe('REST 2.0 -ruudut', () => {
    it('ruutu on kiinteän ruudukon solu, ei tarkka sijainti', () => {
        expect(tileKey([465462, 6826455])).toBe('930:13652');
        expect(tileKey([465001, 6826001])).toBe(tileKey([465499, 6826499]));
        expect(tileWkt('930:13652')).toBe('POLYGON((465000 6826000,465500 6826000,465500 6826500,465000 6826500,465000 6826000))');
    });
    it('naapuriruutuja on kahdeksan', () => {
        const n = neighbourKeys('10:20');
        expect(n).toHaveLength(8);
        expect(n).toContain('9:19');
        expect(n).not.toContain('10:20');
    });
    it('hakee ruudun ja muuntaa kuviot', async () => {
        let url = '';
        const fetchFn = async (u) => { url = u; return { ok: true, json: async () => ({ features: [restFeature()] }) }; };
        const stands = await fetchTile('2:4', { fetchFn });
        expect(url).toContain('stand-data/area?geometry=POLYGON');
        expect(stands[0].properties.STANDNUMBER).toBe('7');
    });
    it('epäonnistunut haku heittää virheen', async () => {
        const fetchFn = async () => ({ ok: false, status: 503 });
        await expect(fetchTile('2:4', { fetchFn })).rejects.toThrow('503');
    });
});

describe('toStand: REST 2.0 → WFS-kentät', () => {
    it('muuntaa nykypuuston, maaperän ja koodit numeroiksi', () => {
        const p = toStand(restFeature()).properties;
        expect(p).toMatchObject({
            STANDID: 123, STANDNUMBER: '7', MAINGROUP: 1, SUBGROUP: 1, FERTILITYCLASS: 3, SOILTYPE: 10,
            ACCESSIBILITY: 2, DEVELOPMENTCLASS: '04', MAINTREESPECIES: 1, VOLUME: 300, MEANAGE: 80,
            MEANHEIGHT: 22.4, STEMCOUNT: 700, VOLUMEGROWTH: 6.5, MEASUREMENTDATE: '2021-06-11',
            TREESTANDDATE: '2027-01-01', FORECASTYEAR: 2037, FORECASTMAINTREESPECIES: 2
        });
        expect(p.PROPORTIONPINE).toBeCloseTo(200 / 300);
        expect(p.PROPORTIONSPRUCE).toBeCloseTo(50 / 300);
        expect(p.PROPORTIONOTHER).toBeCloseTo(50 / 300);
    });
    it('poistaa geometrian crs-kentän', () => {
        expect(toStand(restFeature()).geometry).toEqual({ type: 'Polygon', coordinates: square(1000, 2000, 100) });
    });
    it('puuttuva puusto on null, ei nolla', () => {
        const f = restFeature();
        f.properties.standData.activeForestDevelopmentData = {};
        const p = toStand(f).properties;
        expect(p.VOLUME).toBeNull();
        expect(p.MAINTREESPECIES).toBeNull();
        expect(p.PROPORTIONPINE).toBeNull();
    });
    it('taimikon osuudet runkoluvusta ja vain vallitsevasta jaksosta', () => {
        const p = toStand(restFeature({
            dev: 'T2', main: '2',
            strata: [
                { treeSpecies: '2', storey: '1', amount: 0, stemCount: 1500 },
                { treeSpecies: '29', storey: '1', amount: 0.1, stemCount: 500 },
                { treeSpecies: '1', storey: '3', amount: 40, stemCount: 30 }
            ]
        })).properties;
        expect(p.PROPORTIONSPRUCE).toBeCloseTo(0.75);
        expect(p.PROPORTIONPINE).toBe(0);
    });
    it('hakkuuehdotus vain hakkuutavoista, aikaisin ensin', () => {
        const p = toStand(restFeature({
            operations: [
                { operationType: '410', planningData: { proposalDate: '2026-01-01' } },
                { operationType: '3', planningData: { proposalDate: '2030-01-01' } },
                { operationType: '5', planningData: { proposalDate: '2028-01-01' } }
            ]
        })).properties;
        expect(p.CUTTINGTYPE).toBe(5);
        expect(p.CUTTINGPROPOSALYEAR).toBe(2028);
    });
    it('speciesShares järjestää suurimmasta pienimpään', () => {
        expect(speciesShares([{ treeSpecies: '2', amount: 1 }, { treeSpecies: '1', amount: 3 }]))
            .toEqual([{ species: 1, share: 0.75 }, { species: 2, share: 0.25 }]);
        expect(speciesShares([])).toEqual([]);
    });
});

describe('paikka', () => {
    const stand = toStand(restFeature());
    it('löytää kuvion pisteestä', () => {
        expect(standAt([stand], [1050, 2050])).toBe(stand);
        expect(standAt([stand], [5000, 5000])).toBeNull();
    });
    it('etäisyys reunaan', () => {
        expect(distanceToEdge(stand.geometry, [1050, 2050])).toBe(50);
        expect(distanceToEdge(stand.geometry, [1010, 2050])).toBe(10);
    });
    it('tila: epätarkka, ei kuviota, reunalla, ok', () => {
        expect(placeStatus({ stand, point: [1050, 2050], accuracy: 80 })).toBe('inaccurate');
        expect(placeStatus({ stand, point: [1050, 2050], accuracy: null })).toBe('inaccurate');
        expect(placeStatus({ stand: null, point: [1050, 2050], accuracy: 10 })).toBe('none');
        expect(placeStatus({ stand, point: [1010, 2050], accuracy: 15 })).toBe('edge');
        expect(placeStatus({ stand, point: [1050, 2050], accuracy: 15 })).toBe('ok');
    });
    it('pääkappale tavallisella kielellä', () => {
        expect(leadSentence(stand.properties)).toBe('Seisot noin 80-vuotiaassa mäntyvaltaisessa uudistuskypsässä metsässä.');
        expect(leadSentence({ ...stand.properties, DEVELOPMENTCLASS: 'T2', MAINTREESPECIES: 2 })).toBe('Seisot kuusivaltaisessa taimikossa.');
        expect(leadSentence({ ...stand.properties, DEVELOPMENTCLASS: 'A0' })).toMatch(/^Seisot aukealla/);
        expect(leadSentence({ ...stand.properties, MAINGROUP: 3 })).toMatch(/joutomaa/);
    });
    it('sekapuusto, kun pääpuulajia on alle 60 %', () => {
        const p = { ...stand.properties, SPECIESSHARES: [{ species: 1, share: 0.5 }, { species: 2, share: 0.5 }] };
        expect(leadSentence(p)).toContain('sekapuustoisessa');
    });
    it('kuvaus: faktat, tunnuskasvi, lähteen päivämäärät', () => {
        const d = describePlace(stand.properties);
        expect(d.facts.map(f => f.label)).toEqual(['Puut', 'Puulajit', 'Puita', 'Puuta', 'Kasvu', 'Kasvupaikka', 'Maaperä']);
        expect(d.facts[0].value).toBe('keskimäärin 22 m pitkiä ja 29 cm paksuja');
        expect(d.hint).toBe('Tuoreen kankaan tunnuskasvi on mustikka.');
        expect(d.source).toEqual({ inventory: '11.6.2021', current: '1.1.2027' });
        expect(d.proposal).toBeNull();
    });
    it('turvemaalla ei kerrota kankaan tunnuskasvia', () => {
        expect(describePlace({ ...stand.properties, SUBGROUP: 2 }).hint).toBeNull();
    });
    it('puulajiseos', () => {
        expect(speciesMix(stand.properties)).toBe('mänty 67 %, kuusi 17 %, rauduskoivu 17 %');
    });
});

describe('metsävisa', () => {
    const p = toStand(restFeature()).properties;

    it('puulajiryhmät', () => {
        expect(speciesGroup(1)).toBe('manty');
        expect(speciesGroup(4)).toBe('koivu');
        expect(speciesGroup(5)).toBe('lehti');
        expect(speciesGroup(29)).toBeNull();
        expect(speciesGroup(14)).toBeNull();
    });
    it('luokkaa ei anneta rajan lähellä', () => {
        expect(bucketOf(22.4, [5, 12, 20], 1)).toBe(3);
        expect(bucketOf(12.5, [5, 12, 20], 1)).toBeNull();
        expect(bucketOf(3, [5, 12, 20], 1)).toBe(0);
        expect(bucketOf(null, [5], 1)).toBeNull();
    });
    it('kysymykset tasoittain ja oikeat vastaukset tiedoista', () => {
        const qs = questionsFor(p);
        const byId = Object.fromEntries(qs.map(q => [q.id, q]));
        expect(byId.puulaji).toMatchObject({ level: 'helppo', answer: 'manty' });
        expect(byId.vaihe).toMatchObject({ level: 'helppo', answer: 'kypsa' });
        expect(byId.pituus).toMatchObject({ level: 'keski', answer: 3 });
        expect(byId.ika).toMatchObject({ level: 'keski', answer: 3 });
        expect(byId.maa).toMatchObject({ level: 'keski', answer: 'kivennainen' });
        expect(byId.kasvupaikka).toMatchObject({ level: 'vaikea', answer: 3 });
        expect(byId.tilavuus).toMatchObject({ level: 'vaikea', answer: 3 });
        expect(byId.havainto.kind).toBe('observe');
        // Oikea vastaus on aina vaihtoehdoissa
        qs.filter(q => q.kind === 'choice').forEach(q => expect(q.options.map(o => o.value)).toContain(q.answer));
    });
    it('kasvupaikan vaihtoehdot ovat oikean luokan naapureita', () => {
        const q = questionsFor({ ...p, FERTILITYCLASS: 1 }).find(x => x.id === 'kasvupaikka');
        expect(q.options.map(o => o.value)).toEqual([1, 2, 3, 4]);
        const q6 = questionsFor({ ...p, FERTILITYCLASS: 6 }).find(x => x.id === 'kasvupaikka');
        expect(q6.options.map(o => o.value)).toEqual([3, 4, 5, 6]);
    });
    it('ei puulajikysymystä sekametsässä eikä kasvupaikkaa suolla', () => {
        const mixed = { ...p, SPECIESSHARES: [{ species: 1, share: 0.55 }, { species: 2, share: 0.45 }] };
        expect(questionsFor(mixed).some(q => q.id === 'puulaji')).toBe(false);
        expect(questionsFor({ ...p, SUBGROUP: 3 }).some(q => q.id === 'kasvupaikka')).toBe(false);
    });
    it('ei kysymyksiä muusta kuin metsämaasta (paitsi maalaji)', () => {
        expect(questionsFor({ ...p, MAINGROUP: 3 }).map(q => q.id)).toEqual(['maa']);
    });
    it('seuraava kysymys: valittu taso ensin, sitten havainto', () => {
        expect(nextQuestion(p, 'helppo').id).toBe('puulaji');
        expect(nextQuestion(p, 'helppo', new Set(['puulaji'])).id).toBe('vaihe');
        expect(nextQuestion(p, 'helppo', new Set(['puulaji', 'vaihe'])).id).toBe('havainto');
        expect(nextQuestion(p, 'helppo', new Set(['puulaji', 'vaihe', 'havainto']))).toBeNull();
    });
    it('pisteet ja putkibonus', () => {
        const q = questionsFor(p).find(x => x.id === 'puulaji');
        expect(scoreAnswer(q, 'manty', 0)).toMatchObject({ correct: true, points: POINTS.helppo, streak: 1 });
        expect(scoreAnswer(q, 'manty', 2)).toMatchObject({ correct: true, points: POINTS.helppo + POINTS.putkiBonus, streak: 3 });
        expect(scoreAnswer(q, 'kuusi', 5)).toMatchObject({ correct: false, points: 0, streak: 0 });
        const obs = questionsFor(p).find(x => x.id === 'havainto');
        expect(scoreAnswer(obs, 'ei', 4)).toMatchObject({ correct: null, points: POINTS.havainto, streak: 4 });
    });
});

describe('maastotilan tallennus', () => {
    function memoryStorage() {
        const m = new Map();
        return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
    }

    it('uusi kuvio antaa pisteet vain kerran', () => {
        const s = createStore(memoryStorage());
        expect(s.visit(1)).toBe(POINTS.uusiKuvio);
        expect(s.visit(1)).toBe(0);
        expect(s.standCount).toBe(1);
        expect(s.points).toBe(POINTS.uusiKuvio);
    });
    it('vastaukset, putki ja havainnot säilyvät', () => {
        const storage = memoryStorage();
        const s = createStore(storage);
        const p = toStand(restFeature()).properties;
        const q = questionsFor(p).find(x => x.id === 'puulaji');
        s.record(123, q, 'manty', scoreAnswer(q, 'manty', 0));
        const obs = questionsFor(p).find(x => x.id === 'havainto');
        s.record(123, obs, 'ei', scoreAnswer(obs, 'ei', 1), { dataDate: '2027-01-01' });
        const again = createStore(storage);
        expect(again.points).toBe(POINTS.helppo + POINTS.havainto);
        expect(again.streak).toBe(1);
        expect([...again.answered(123)]).toEqual(['puulaji', 'havainto']);
        expect(again.observations[0]).toMatchObject({ standId: 123, answer: 'ei', dataDate: '2027-01-01' });
    });
    it('rikkinäinen tallenne ei kaada', () => {
        const s = createStore({ getItem: () => '{rikki', setItem: () => { throw new Error('täynnä'); } });
        expect(s.points).toBe(0);
        expect(() => s.visit(5)).not.toThrow();
    });
    it('arvonimet', () => {
        expect(arvonimi(0)).toBe('Metsäretkeläinen');
        expect(arvonimi(350)).toBe('Kuvioiden tuntija');
        expect(arvonimi(5000)).toBe('Metsämestari');
    });
});
