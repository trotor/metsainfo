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
});
