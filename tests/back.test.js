import { describe, it, expect } from 'vitest';
import { backAction, createBackHandler } from '../js/ui/back.js';

describe('Androidin takaisin-painike', () => {
    it('sulkee ensin ohjeen', () => {
        expect(backAction({ helpOpen: true, menuOpen: true, snap: 'full' })).toBe('help');
    });
    it('sulkee sitten valikon', () => {
        expect(backAction({ helpOpen: false, menuOpen: true, snap: 'full' })).toBe('menu');
    });
    it('pienentää avoimen paneelin', () => {
        expect(backAction({ helpOpen: false, menuOpen: false, snap: 'full' })).toBe('peek');
        expect(backAction({ helpOpen: false, menuOpen: false, snap: 'half' })).toBe('peek');
    });
    it('piilotettu paneeli ei pidätä painallusta, vaikka sen tila olisi auki', () => {
        expect(backAction({ helpOpen: false, menuOpen: false, snap: 'full', hidden: true })).toBe('exit');
    });

    it('poistuu, kun mitään ei ole auki', () => {
        expect(backAction({ helpOpen: false, menuOpen: false, snap: 'peek' })).toBe('exit');
        expect(backAction({ helpOpen: false, menuOpen: false, snap: undefined })).toBe('exit');
    });
});

describe('createBackHandler', () => {
    function setup({ help = false, menu = false, snap = 'peek' } = {}) {
        document.body.innerHTML = `<div id="help-modal" class="${help ? '' : 'hidden'}"></div><div id="sheet-menu"></div>`;
        document.getElementById('sheet-menu').hidden = !menu;
        const calls = [];
        const sheet = { getSnap: () => snap, setSnap: (s) => calls.push('snap:' + s) };
        const handler = createBackHandler({
            toggleHelp: () => calls.push('help'),
            closeMenu: () => calls.push('menu'),
            getSheet: () => sheet
        });
        return { handler, calls };
    }
    it('sulkee ohjeen ja jää sovellukseen', () => {
        const { handler, calls } = setup({ help: true });
        expect(handler()).toBe(true);
        expect(calls).toEqual(['help']);
    });
    it('pienentää paneelin', () => {
        const { handler, calls } = setup({ snap: 'full' });
        expect(handler()).toBe(true);
        expect(calls).toEqual(['snap:peek']);
    });
    it('palauttaa false, kun pitää poistua', () => {
        const { handler, calls } = setup();
        expect(handler()).toBe(false);
        expect(calls).toEqual([]);
    });
    it('sulkee ostonäkymän tai esimerkkimetsän ennen muuta', () => {
        const { handler, calls } = setup({ help: true });
        const pw = document.createElement('div'); pw.id = 'paywall'; document.body.appendChild(pw);
        expect(handler()).toBe(true);
        expect(document.getElementById('paywall')).toBeNull();
        expect(calls).toEqual([]);
        const demo = document.createElement('div'); demo.id = 'demo-view'; document.body.appendChild(demo);
        expect(handler()).toBe(true);
        expect(document.getElementById('demo-view')).toBeNull();
    });
});

describe('lisäosien takaisin-askeleet', () => {
    it('viimeksi rekisteröity ensin, ennen ohjetta ja paneelia', async () => {
        const { registerBackStep, createBackHandler: create } = await import('../js/ui/back.js');
        const calls = [];
        let korttiAuki = true, esittelyAuki = true;
        registerBackStep(() => { if (!korttiAuki) return false; korttiAuki = false; calls.push('kortti'); return true; });
        registerBackStep(() => { if (!esittelyAuki) return false; esittelyAuki = false; calls.push('esittely'); return true; });
        document.body.innerHTML = '';
        const handler = create({ toggleHelp: () => {}, closeMenu: () => {}, getSheet: () => null });
        expect(handler()).toBe(true);
        expect(handler()).toBe(true);
        expect(handler()).toBe(false);
        expect(calls).toEqual(['esittely', 'kortti']);
    });
});
