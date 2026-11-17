import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MOBILE_QUERY, TABLET_QUERY, MOBILE_WIDE_QUERY, isMobileLayout, isTabletLayout, onLayoutChange, fitPadding, fitsVisibleArea, visibleCenterOffset, tabletCenterOffset, topInset } from '../js/ui/layout.js';

const fakeWin = (matches) => ({
    matchMedia: (q) => ({ matches, media: q, addEventListener() {}, removeEventListener() {} })
});

describe('layout', () => {
    it('MOBILE_QUERY kattaa kapeat näytöt ja kaikki kosketusnäytöt', () => {
        expect(MOBILE_QUERY).toBe('(max-width: 768px), (pointer: coarse)');
    });

    it('TABLET_QUERY: kosketus, vähintään 700 px leveä ja yli 500 px korkea', () => {
        expect(TABLET_QUERY).toBe('(pointer: coarse) and (min-width: 700px) and (min-height: 501px)');
    });

    it('isTabletLayout käyttää TABLET_QUERYä', () => {
        const win = { matchMedia: (q) => ({ matches: q === TABLET_QUERY }) };
        expect(isTabletLayout(win)).toBe(true);
        expect(isTabletLayout({})).toBe(false);
    });

    it('CSS-kopiot käyttävät samoja kyselyitä', () => {
        for (const file of ['style.css', 'js/ui/tyokalut.css', 'js/valinta/valinta.css', 'js/saavutettavuus/saavutettavuus.css', 'js/arvovari/arvovari.css']) {
            const css = readFileSync(file, 'utf8');
            const queries = [...css.matchAll(/@media ([^{]*pointer: coarse[^{]*)\{/g)].map(m => m[1].trim());
            expect(queries.length, file).toBeGreaterThan(0);
            for (const q of queries) expect([MOBILE_QUERY, TABLET_QUERY, MOBILE_WIDE_QUERY], `${file}: ${q}`).toContain(q);
        }
        expect(readFileSync('style.css', 'utf8')).toContain(`@media ${TABLET_QUERY} {`);
    });

    it('MOBILE_WIDE_QUERY: leveä kosketusnäyttö alle tablettirajan', () => {
        expect(MOBILE_WIDE_QUERY).toBe('(pointer: coarse) and (min-width: 600px) and (max-width: 699px) and (min-height: 501px)');
    });

    it('onLayoutChange kuuntelee molempia kyselyitä', () => {
        const listeners = [];
        const win = {
            matchMedia: (q) => ({
                matches: q === MOBILE_QUERY,
                addEventListener: (_, fn) => listeners.push(fn),
                removeEventListener() {}
            })
        };
        const calls = [];
        onLayoutChange((mobile, tablet) => calls.push([mobile, tablet]), win);
        expect(listeners).toHaveLength(2);
        listeners[1]();
        expect(calls).toEqual([[true, false]]);
    });

    it('fitPadding tabletissa: auki paneeli vasemmalla', () => {
        expect(fitPadding({ mobile: true, tablet: true, open: true, panelRight: 428, topInset: 64 }))
            .toEqual({ paddingTopLeft: [444, 80], paddingBottomRight: [16, 16] });
    });

    it('fitPadding tabletissa: pienennetty paneeli yläreunassa', () => {
        expect(fitPadding({ mobile: true, tablet: true, open: false, collapsedBottom: 190, topInset: 64 }))
            .toEqual({ paddingTopLeft: [16, 206], paddingBottomRight: [16, 16] });
    });

    it('fitPadding tabletissa ilman paneelia', () => {
        expect(fitPadding({ mobile: true, tablet: true, topInset: 64 }))
            .toEqual({ paddingTopLeft: [16, 80], paddingBottomRight: [16, 16] });
    });

    it('tabletCenterOffset siirtää keskipistettä paneelin verran', () => {
        expect(tabletCenterOffset(428, 64)).toEqual([-214, -32]);
        expect(tabletCenterOffset(0, 64)).toEqual([0, -32]);
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

    it('fitsVisibleArea: kohde täytteiden sisällä tai peitossa', () => {
        const pad = { paddingTopLeft: [16, 80], paddingBottomRight: [16, 476] };
        const size = { x: 669, y: 951 };
        expect(fitsVisibleArea({ left: 100, top: 100, right: 500, bottom: 400 }, size, pad)).toBe(true);
        expect(fitsVisibleArea({ left: 100, top: 300, right: 500, bottom: 700 }, size, pad)).toBe(false);
        expect(fitsVisibleArea({ left: 60, top: 60, right: 100, bottom: 100 }, { x: 1280, y: 800 }, { padding: [50, 50] })).toBe(true);
    });
});
