import { describe, it, expect, beforeEach } from 'vitest';
import { computeSnapHeights, resolveRelease, nextSnapOnTap, createSheet, sheetHeightForFit } from '../js/ui/sheet.js';

const H = computeSnapHeights(844, 64, 34);

describe('sheetin laskenta', () => {
    it('laskee pysäytyskohdat', () => {
        expect(H).toEqual({ peek: 174, half: 422, full: 780 });
    });

    it('pitää korkeudet nousevina matalassa näkymässä', () => {
        const h = computeSnapHeights(300, 64, 21);
        expect(h.half).toBeGreaterThanOrEqual(h.peek);
        expect(h.full).toBeGreaterThanOrEqual(h.half);
    });

    it('alle 6 px:n liike on napautus', () => {
        expect(resolveRelease(174, 5, 0, H)).toBe('tap');
        expect(resolveRelease(174, -5, 0, H)).toBe('tap');
    });

    it('hidas veto päätyy lähimpään kohtaan', () => {
        expect(resolveRelease(174, -230, 0, H)).toBe('half');
    });

    it('nopea pyyhkäisy ylös ohittaa lähimmän', () => {
        expect(resolveRelease(174, -120, -2.5, H)).toBe('full');
    });

    it('nopea pyyhkäisy alas palaa peekiin', () => {
        expect(resolveRelease(780, 150, 3, H)).toBe('peek');
    });

    it('kartan sovitus ei käytä full-korkeutta', () => {
        expect(sheetHeightForFit(H, 'full', false)).toBe(422);
        expect(sheetHeightForFit(H, 'half', false)).toBe(422);
        expect(sheetHeightForFit(H, 'peek', false)).toBe(174);
    });

    it('uusi valinta ja piilotettu paneeli sovittavat peek-korkeudella', () => {
        expect(sheetHeightForFit(H, 'full', false, true)).toBe(174);
        expect(sheetHeightForFit(H, 'full', true)).toBe(174);
    });

    it('napautussykli', () => {
        expect(['peek', 'half', 'full'].map(nextSnapOnTap)).toEqual(['half', 'full', 'peek']);
    });
});

describe('createSheet', () => {
    let mobile;
    let panel;
    const win = {
        innerHeight: 844,
        matchMedia: () => ({ matches: mobile, addEventListener() {}, removeEventListener() {} })
    };

    beforeEach(() => {
        mobile = true;
        document.documentElement.removeAttribute('style');
        document.body.innerHTML = '<div id="search-control"></div><div id="info-panel"></div>';
        document.getElementById('search-control').getBoundingClientRect = () => ({ bottom: 64 });
        panel = document.getElementById('info-panel');
    });

    it('createSheet asettaa korkeuden mobiilissa', () => {
        const sheet = createSheet(panel, { win, doc: document, safeBottom: () => 34 });
        sheet.setSnap('half');
        expect(panel.dataset.snap).toBe('half');
        expect(panel.style.getPropertyValue('--sheet-height')).toBe('422px');
        expect(document.documentElement.style.getPropertyValue('--sheet-offset')).toBe('422px');
    });

    it('createSheet removes inline sizing on desktop', () => {
        const sheet = createSheet(panel, { win, doc: document, safeBottom: () => 34 });
        sheet.setSnap('full');
        mobile = false;
        sheet.recompute();
        expect(panel.dataset.snap).toBeUndefined();
        expect(panel.style.getPropertyValue('--sheet-height')).toBe('');
        expect(document.documentElement.style.getPropertyValue('--sheet-offset')).toBe('');
    });
});
