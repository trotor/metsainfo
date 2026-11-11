import { describe, it, expect } from 'vitest';
import { normalizePosition, classifyLocationError, createNativeWatch } from '../js/platform/location.js';
import { headingFromEvent, compassSupported } from '../js/platform/compass.js';

describe('normalizePosition', () => {
    it('hyväksyy selaimen ja Capacitorin muodon', () => {
        const raw = { timestamp: 123, coords: { latitude: 62.5, longitude: 25.8, accuracy: 7, heading: 90 } };
        expect(normalizePosition(raw)).toEqual({ lat: 62.5, lon: 25.8, accuracy: 7, heading: 90, timestamp: 123 });
    });

    it('puuttuva suunta on null', () => {
        const raw = { timestamp: 1, coords: { latitude: 1, longitude: 2, accuracy: 3, heading: NaN } };
        expect(normalizePosition(raw).heading).toBeNull();
    });
});

describe('classifyLocationError', () => {
    it('selaimen koodit', () => {
        expect(classifyLocationError({ code: 1 })).toBe('denied');
        expect(classifyLocationError({ code: 2 })).toBe('unavailable');
        expect(classifyLocationError({ code: 3 })).toBe('timeout');
    });

    it('Capacitorin viestit', () => {
        expect(classifyLocationError(new Error('Location permission was denied'))).toBe('denied');
        expect(classifyLocationError(new Error('location services are not enabled'))).toBe('off');
        expect(classifyLocationError(new Error('kCLErrorLocationUnknown'))).toBe('unavailable');
    });
});

describe('kompassi', () => {
    it('webkitCompassHeading käytetään sellaisenaan', () => {
        expect(headingFromEvent({ webkitCompassHeading: 42 })).toBe(42);
    });

    it('absoluuttinen alpha muunnetaan kompassisuunnaksi', () => {
        expect(headingFromEvent({ absolute: true, alpha: 90 })).toBe(270);
        expect(headingFromEvent({ absolute: true, alpha: 0 })).toBe(0);
    });

    it('suhteellinen tai puuttuva arvo on null', () => {
        expect(headingFromEvent({ absolute: false, alpha: 90 })).toBeNull();
        expect(headingFromEvent({})).toBeNull();
    });

    it('compassSupported vaatii DeviceOrientationEventin', () => {
        expect(compassSupported({})).toBe(false);
        expect(compassSupported({ DeviceOrientationEvent: function () {} })).toBe(true);
    });
});

describe('classifyLocationError: sijaintipalvelut pois', () => {
    it('palvelut pois tai rajoitettu', () => {
        expect(classifyLocationError(new Error('Location services are not enabled.'))).toBe('off');
        expect(classifyLocationError({ code: 'OS-PLUG-GLOC-0008', message: 'restricted' })).toBe('off');
    });
});

function fakeGeo({ perm = 'granted', req = 'granted', checkError = null } = {}) {
    const geo = {
        watches: [], cleared: [],
        async checkPermissions() { if (checkError) throw checkError; return { location: perm }; },
        async requestPermissions() { return { location: req }; },
        async watchPosition(opts, cb) { const id = 'w' + geo.watches.length; geo.watches.push({ opts, cb, id }); return id; },
        async clearWatch({ id }) { geo.cleared.push(id); }
    };
    return geo;
}

const flush = () => new Promise(r => setTimeout(r, 0));

describe('createNativeWatch', () => {
    it('palvelut pois on pysäyttävä virhe', async () => {
        const errors = [];
        const geo = fakeGeo({ checkError: new Error('Location services are not enabled.') });
        await createNativeWatch(geo, () => {}, (k, info) => errors.push([k, info?.fatal]));
        expect(errors).toEqual([['off', true]]);
        expect(geo.watches).toHaveLength(0);
    });

    it('evätty lupa on pysäyttävä virhe', async () => {
        const errors = [];
        await createNativeWatch(fakeGeo({ perm: 'prompt', req: 'denied' }), () => {}, (k, info) => errors.push([k, info?.fatal]));
        expect(errors).toEqual([['denied', true]]);
    });

    it('aikakatkaisu käynnistää seurannan uudelleen', async () => {
        const geo = fakeGeo();
        const errors = [];
        await createNativeWatch(geo, () => {}, (k, info) => errors.push([k, !!info?.fatal]));
        geo.watches[0].cb(null, { code: 'OS-PLUG-GLOC-0010', message: 'timeout' });
        await flush();
        expect(geo.watches).toHaveLength(2);
        expect(geo.cleared).toContain('w0');
        expect(errors).toEqual([['timeout', false]]);
    });

    it('lopetus poistaa voimassa olevan seurannan', async () => {
        const geo = fakeGeo();
        const stop = await createNativeWatch(geo, () => {}, () => {});
        geo.watches[0].cb(null, new Error('timeout'));
        await flush();
        stop();
        await flush();
        expect(geo.cleared).toContain('w1');
    });

    it('sijainti välitetään normalisoituna', async () => {
        const geo = fakeGeo();
        const got = [];
        await createNativeWatch(geo, p => got.push(p), () => {});
        geo.watches[0].cb({ timestamp: 5, coords: { latitude: 1, longitude: 2, accuracy: 3, heading: null } });
        expect(got[0]).toEqual({ lat: 1, lon: 2, accuracy: 3, heading: null, timestamp: 5 });
    });

    it('Androidin päivitysväli on lyhyt eikä seuraa aikakatkaisua', async () => {
        // Android-plugin käyttää muuten aikakatkaisua (60 s) päivitysvälinä,
        // jolloin piste harmaantuu (vanha > 30 s) kävellessäkin
        const geo = fakeGeo();
        await createNativeWatch(geo, () => {}, () => {});
        const opts = geo.watches[0].opts;
        expect(opts.interval).toBeLessThanOrEqual(5000);
        expect(opts.minimumUpdateInterval).toBeLessThanOrEqual(opts.interval);
        expect(opts.timeout).toBeGreaterThan(30000);
    });
});
