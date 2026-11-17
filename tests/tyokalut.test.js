import '../js/vendor/index.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as state from '../js/state.js';
import { registerTool, registerMenuItem, registerColorMode, helpSectionHtml, _resetForTests } from '../js/ui/tyokalut.js';

const ICON = '<svg viewBox="0 0 24 24"></svg>';

beforeEach(() => {
    _resetForTests();
    document.body.innerHTML = `
        <header><button id="help-toggle" onclick="toggleHelp()">?</button></header>
        <button id="mobile-help-toggle" onclick="toggleHelp()">?</button>
        <select id="color-mode-select"><option value="volume">Tilavuus</option><option value="age">Ikä</option></select>
        <div id="map" style="width:800px;height:600px"></div>`;
    state.setState('map', L.map('map', { center: [62.6, 25.8], zoom: 10 }));
    try { localStorage.clear(); } catch { /* ei tallennustilaa */ }
});

const toolButton = () => document.querySelector('.tyokalut-control a');
const list = () => document.getElementById('tyokalut-lista');
const openList = () => toolButton().click();

function tool(over = {}) {
    return {
        id: 'valinta', label: 'Valitse kuvioita', description: 'Kokoa kuvioita valinnaksi.', icon: ICON,
        onSelect: vi.fn(), onStop: vi.fn(), ...over
    };
}

describe('työkalut', () => {
    it('ilman työkaluja ei nappia', () => {
        expect(toolButton()).toBeNull();
        registerTool(tool());
        expect(toolButton()).not.toBeNull();
        expect(toolButton().getAttribute('aria-label')).toBe('Työkalut');
    });

    it('lista näyttää nimen, kuvauksen ja lukon', () => {
        registerTool(tool());
        registerTool(tool({ id: 'lahihaku', label: 'Etsi läheltä', description: 'Etsi metsiä.', locked: () => true, order: 50 }));
        openList();
        const items = [...list().querySelectorAll('[data-tool]')];
        expect(items.map(i => i.dataset.tool)).toEqual(['lahihaku', 'valinta']);
        expect(items[0].textContent).toContain('Etsi läheltä');
        expect(items[0].textContent).toContain('Etsi metsiä.');
        expect(items[0].querySelector('.tk-lukko')).not.toBeNull();
        expect(items[1].querySelector('.tk-lukko')).toBeNull();
    });

    it('valinta kutsuu onSelect ja sulkee listan, myös lukitulle', () => {
        const t = tool({ locked: () => true });
        registerTool(t);
        openList();
        list().querySelector('[data-tool="valinta"]').click();
        expect(t.onSelect).toHaveBeenCalledTimes(1);
        expect(list().hidden).toBe(true);
    });

    it('listan avaus ja sulku ei lopeta työkalua eikä sulje kortteja', () => {
        const t = tool();
        registerTool(t);
        const opened = vi.fn();
        document.addEventListener('metsainfo:kortti-auki', opened);
        openList();
        expect(list().hidden).toBe(false);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(list().hidden).toBe(true);
        expect(t.onStop).not.toHaveBeenCalled();
        expect(opened).not.toHaveBeenCalled();
        document.removeEventListener('metsainfo:kortti-auki', opened);
    });

    it('siru vain kun aktiivinen ja kortti piilossa', () => {
        const t = tool();
        const h = registerTool(t);
        const chip = () => document.getElementById('tyokalu-siru');
        h.setStatus({ active: true, cardOpen: true });
        expect(chip()?.hidden ?? true).toBe(true);
        h.setStatus({ active: true, cardOpen: false, detail: '3' });
        expect(chip().hidden).toBe(false);
        expect(chip().textContent).toContain('Valitse kuvioita · 3');
        chip().querySelector('[data-tk="avaa"]').click();
        expect(t.onSelect).toHaveBeenCalledTimes(1);
        chip().querySelector('[data-tk="lopeta"]').click();
        expect(t.onStop).toHaveBeenCalledTimes(1);
        h.setStatus({ active: false });
        expect(chip().hidden).toBe(true);
    });

    it('kiinnitetty lista seuraa nappia, kun tietopaneeli avautuu', async () => {
        document.body.insertAdjacentHTML('beforeend', '<div id="info-panel" class="hidden"></div>');
        registerTool(tool());
        let right = 60;
        toolButton().getBoundingClientRect = () => ({ right, top: 300, bottom: 344, left: right - 44 });
        openList();
        list().querySelector('[data-tk="kiinnita"]').click();
        expect(list().style.left).toBe('68px');
        right = 500; // paneeli siirtää nappisarakkeen oikealle
        document.getElementById('info-panel').classList.remove('hidden');
        await new Promise(r => setTimeout(r, 0));
        expect(list().style.left).toBe('508px');
        right = 120;
        window.dispatchEvent(new Event('resize'));
        expect(list().style.left).toBe('128px');
    });

    it('kiinnitys muistetaan ja lista pysyy auki valinnan jälkeen', () => {
        const t = tool();
        registerTool(t);
        openList();
        list().querySelector('[data-tk="kiinnita"]').click();
        expect(localStorage.getItem('metsainfo.tyokalutKiinni')).toBe('1');
        list().querySelector('[data-tool="valinta"]').click();
        expect(list().hidden).toBe(false);
    });
});

describe('valikko', () => {
    it('korvaa ohjenapit ja Ohje on viimeisenä', () => {
        window.toggleHelp = vi.fn();
        const fav = vi.fn();
        registerMenuItem({ id: 'asetukset', label: 'Asetukset', icon: ICON, onSelect: vi.fn(), order: 20 });
        registerMenuItem({ id: 'suosikit', label: 'Suosikit', icon: ICON, onSelect: fav, order: 10 });
        const help = document.getElementById('help-toggle');
        expect(help.textContent).toBe('☰');
        expect(help.getAttribute('aria-label')).toBe('Valikko');
        help.click();
        const menu = document.getElementById('sovellus-valikko');
        expect(menu.hidden).toBe(false);
        expect([...menu.querySelectorAll('[data-menu]')].map(b => b.dataset.menu)).toEqual(['suosikit', 'asetukset', 'ohje']);
        expect(window.toggleHelp).not.toHaveBeenCalled();
        menu.querySelector('[data-menu="suosikit"]').click();
        expect(fav).toHaveBeenCalledTimes(1);
        expect(menu.hidden).toBe(true);
        document.getElementById('mobile-help-toggle').click();
        menu.querySelector('[data-menu="ohje"]').click();
        expect(window.toggleHelp).toHaveBeenCalledTimes(1);
    });
});

describe('väritys', () => {
    const select = () => document.getElementById('color-mode-select');
    const change = (v) => { select().value = v; select().dispatchEvent(new Event('change')); };

    it('väritystila valitsimeen', () => {
        const onSelect = vi.fn(), onDeselect = vi.fn();
        const m = registerColorMode({ id: 'saavutettavuus', label: 'Saavutettavuus (arvio)', onSelect, onDeselect });
        expect([...select().options].map(o => o.value)).toContain('x:saavutettavuus');
        change('x:saavutettavuus');
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(m.isSelected()).toBe(true);
        change('volume');
        expect(onDeselect).toHaveBeenCalledTimes(1);
        expect(m.isSelected()).toBe(false);
    });

    it('lukittu väritys palaa edelliseen', () => {
        registerColorMode({ id: 'saavutettavuus', label: 'S', onSelect: () => false, onDeselect: vi.fn() });
        change('age');
        change('x:saavutettavuus');
        expect(select().value).toBe('age');
    });

    it('select() ja deselect() koodista', () => {
        const onSelect = vi.fn(), onDeselect = vi.fn();
        const m = registerColorMode({ id: 's', label: 'S', onSelect, onDeselect });
        m.select();
        expect(select().value).toBe('x:s');
        expect(onSelect).toHaveBeenCalledTimes(1);
        m.deselect();
        expect(select().value).toBe('volume');
        expect(onDeselect).toHaveBeenCalledTimes(1);
    });
});

describe('ohje', () => {
    it('helpSectionHtml sisältää työkalut, valikon ja väritykset', () => {
        registerTool(tool());
        registerMenuItem({ id: 'suosikit', label: 'Suosikit', icon: ICON, onSelect: vi.fn() });
        registerColorMode({ id: 's', label: 'Saavutettavuus (arvio)', onSelect: vi.fn(), onDeselect: vi.fn() });
        const html = helpSectionHtml();
        expect(html).toContain('Valitse kuvioita');
        expect(html).toContain('Kokoa kuvioita valinnaksi.');
        expect(html).toContain('Suosikit');
        expect(html).toContain('Saavutettavuus (arvio)');
        expect(html).toContain('<svg');
    });
});
