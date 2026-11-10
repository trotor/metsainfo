import { describe, it, expect } from 'vitest';
import { normalizePosition, classifyLocationError } from '../js/platform/location.js';
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
        expect(classifyLocationError(new Error('location services are not enabled'))).toBe('unavailable');
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
