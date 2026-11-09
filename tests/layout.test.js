import { describe, it, expect } from 'vitest';
import { MOBILE_QUERY, isMobileLayout, fitPadding, visibleCenterOffset, topInset } from '../js/ui/layout.js';

const fakeWin = (matches) => ({
    matchMedia: (q) => ({ matches, media: q, addEventListener() {}, removeEventListener() {} })
});

describe('layout', () => {
    it('MOBILE_QUERY vastaa speciä', () => {
        expect(MOBILE_QUERY).toBe('(max-width: 768px), (max-height: 500px) and (pointer: coarse)');
    });

    it('isMobileLayout käyttää matchMediaa', () => {
        expect(isMobileLayout(fakeWin(true))).toBe(true);
        expect(isMobileLayout(fakeWin(false))).toBe(false);
    });

    it('isMobileLayout on false ilman matchMediaa', () => {
        expect(isMobileLayout({})).toBe(false);
    });

    it('fitPadding työpöydällä säilyttää 50 px', () => {
        expect(fitPadding({ mobile: false, sheetHeight: 300, topInset: 60 })).toEqual({ padding: [50, 50] });
    });

    it('fitPadding mobiilissa varaa sheetin ja hakupalkin', () => {
        expect(fitPadding({ mobile: true, sheetHeight: 174, topInset: 64 }))
            .toEqual({ paddingTopLeft: [16, 80], paddingBottomRight: [16, 190] });
    });

    it('visibleCenterOffset siirtää keskipistettä alaspäin', () => {
        expect(visibleCenterOffset(422, 64)).toEqual([0, 179]);
    });

    it('topInset on 0 ilman hakukontrollia', () => {
        document.body.innerHTML = '';
        expect(topInset(document)).toBe(0);
    });
});
