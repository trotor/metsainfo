import "../js/vendor/index.js";
import { describe, it, expect } from 'vitest';
import { deviceLang, pick } from '../js/i18n.js';
import { codeName, CODES_EN_EPAVIRALLINEN, CODES_SV_VIRALLINEN, CODES_SV_EPAVIRALLINEN } from '../js/koodit.js';
import { CODES } from '../js/config.js';
import { TEKSTIT as MAASTO } from '../js/maasto/teksti.js';
import { TEKSTIT as LAHIHAKU } from '../js/lahihaku/teksti.js';
import { TEKSTIT as SUOSIKIT } from '../js/suosikit/teksti.js';
import { TEKSTIT as KORKEUSMALLI } from '../js/korkeusmalli/teksti.js';
import { TEKSTIT as ASETUKSET } from '../js/asetukset/teksti.js';
import { TEKSTIT as SAAVUTETTAVUUS } from '../js/saavutettavuus/teksti.js';
import { TEKSTIT as OHJEOSIOT } from '../js/ui/ohje-osiot.js';
import { TEKSTIT as ESTIMATE } from '../js/ui/estimate-teksti.js';
import { formatNumber } from '../js/utils.js';
import { TEKSTIT as UI } from '../js/ui/teksti.js';
import { TEKSTIT as SIVU } from '../js/ui/sivu-teksti.js';

/** Kaikki avaimet sisäkkäin, taulukot pituuksineen. */
function shape(obj, prefix = '') {
    const out = [];
    for (const [k, v] of Object.entries(obj)) {
        const key = `${prefix}${k}`;
        if (Array.isArray(v)) out.push(`${key}[${v.length}]`);
        else if (v && typeof v === 'object') out.push(...shape(v, `${key}.`));
        else out.push(`${key}:${typeof v}`);
    }
    return out.sort();
}

describe('kielet', () => {
    it.each([
        ['maasto', MAASTO], ['lähihaku', LAHIHAKU], ['suosikit', SUOSIKIT],
        ['korkeusmalli', KORKEUSMALLI], ['asetukset', ASETUKSET], ['käyttöliittymä', UI],
        ['hinta-arvio', ESTIMATE], ['sivu', SIVU], ['saavutettavuus', SAAVUTETTAVUUS], ['ohjeosiot', OHJEOSIOT]
    ])('%s: kaikilla kielillä samat avaimet', (_, t) => {
        expect(shape(t.en)).toEqual(shape(t.fi));
        expect(t.sv, 'ruotsinkieliset tekstit puuttuvat').toBeDefined();
        expect(shape(t.sv)).toEqual(shape(t.fi));
    });

    it('laitteen kieli: suomi, ruotsi tai englanti, muu → fi', () => {
        expect(deviceLang(['fi-FI', 'en-US'])).toBe('fi');
        expect(deviceLang(['en-GB', 'fi'])).toBe('en');
        expect(deviceLang(['sv-FI'])).toBe('sv');
        expect(deviceLang(['de-DE', 'en-US'])).toBe('en');
        expect(deviceLang(['de-DE'])).toBe('fi');
        expect(deviceLang([])).toBe('fi');
    });

    it('pick: puuttuva kieli → suomi', () => {
        expect(pick({ fi: 'a', en: 'b' }, 'en')).toBe('b');
        expect(pick({ fi: 'a' }, 'sv')).toBe('a');
    });

    it('koodin nimi: englanti epävirallisesta taulusta, puuttuva suomeksi', () => {
        expect(codeName('treeSpecies', 2, 'en')).toBe('Norway spruce');
        expect(codeName('treeSpecies', 2, 'fi')).toBe('Kuusi');
        expect(codeName('cuttingType', 90, 'en')).toBe('Cutting for change of land use');
        expect(codeName('tuntematon', 1, 'en')).toBeNull();
        expect(codeName('treeSpecies', 999, 'en')).toBeNull();
        expect(codeName('treeSpecies', null, 'en')).toBeNull();
        expect(codeName('treeSpecies', 2, 'sv')).toBe('Gran');
        expect(codeName('developmentClass', '04', 'sv')).toBe('Förnyelsemogen skog');
        expect(codeName('accessibility', 1, 'sv')).toBe('Året runt');
        // Jokainen käännetty koodi on myös virallisessa koodistossa
        for (const [table, codes] of [...Object.entries(CODES_EN_EPAVIRALLINEN), ...Object.entries(CODES_SV_VIRALLINEN), ...Object.entries(CODES_SV_EPAVIRALLINEN)]) {
            for (const code of Object.keys(codes)) expect(CODES[table][code], `${table} ${code}`).toBeDefined();
        }
    });

    it('englanninkielinen pääkappale artikkelilla', () => {
        const en = MAASTO.en;
        expect(en.seisot({ age: '76', species: 'pine-dominated', stage: 'mature forest' }))
            .toBe('You are standing in a roughly 76-year-old pine-dominated mature forest.');
        expect(en.seisot({ age: null, species: '', stage: en.vaiheessa.ER }))
            .toBe('You are standing in an uneven-aged forest.');
        expect(en.lower('Scots pine')).toBe('Scots pine');
        expect(en.lower('Silver birch')).toBe('silver birch');
        expect(en.paiva(2021, 6, 11)).toBe('11 Jun 2021');
    });

    it('lukujen muotoilu kielen mukaan', () => {
        expect(formatNumber(1234.5, 1).replace(/\s/g, ' ')).toBe('1 234,5');
        expect(formatNumber(1234.5, 1, 'en-GB')).toBe('1,234.5');
    });
});

import { initialLang, getLang } from '../js/i18n.js';

describe('julkaisu pysyy suomeksi', () => {
    it('ilman kielivalintaa aina fi, vaikka tallennettu tai laitteen kieli olisi en', () => {
        expect(initialLang({ enabled: false, saved: 'en', device: () => 'en' })).toBe('fi');
        expect(initialLang({ enabled: true, saved: 'en', device: () => 'fi' })).toBe('en');
        expect(initialLang({ enabled: true, saved: null, device: () => 'en' })).toBe('en');
        expect(initialLang({ enabled: true, saved: 'xx', device: () => 'fi' })).toBe('fi');
        // Testit ajetaan tavallisena buildina
        expect(getLang()).toBe('fi');
    });
});

import { readFileSync } from 'node:fs';
import { applyPageTexts, parseAttrSpec } from '../js/ui/sivu.js';

describe('sivun (index.html) staattiset tekstit', () => {
    const html = readFileSync(new URL('../index.html', `file://${process.cwd()}/tests/`), 'utf8');
    const parse = () => new DOMParser().parseFromString(html, 'text/html');

    it('jokainen merkintä löytyy tekstitaulusta ja suomi on täsmälleen sivun teksti', () => {
        const doc = parse();
        const marked = [...doc.querySelectorAll('[data-i18n]')];
        expect(marked.length).toBeGreaterThan(10);
        for (const el of marked) {
            expect(SIVU.fi[el.dataset.i18n], el.dataset.i18n).toBe(el.textContent);
        }
        for (const el of doc.querySelectorAll('[data-i18n-attr]')) {
            const pairs = parseAttrSpec(el.dataset.i18nAttr);
            expect(pairs.length).toBeGreaterThan(0);
            for (const [attr, key] of pairs) expect(SIVU.fi[key], key).toBe(el.getAttribute(attr));
        }
        expect(SIVU.fi.sivuOtsikko).toBe(doc.title);
        expect(SIVU.fi.sivuKuvaus).toBe(doc.querySelector('meta[name="description"]').getAttribute('content'));
    });

    it('suomeksi sivuun ei kosketa', () => {
        const doc = parse();
        const before = doc.documentElement.outerHTML;
        applyPageTexts(doc, 'fi');
        expect(doc.documentElement.outerHTML).toBe(before);
    });

    it('englanniksi merkityt tekstit ja ohje vaihtuvat, sovelluksen kiinnekohdat säilyvät', () => {
        const doc = parse();
        const helpBefore = doc.getElementById('help-content');
        const classes = (root) => [...root.querySelectorAll('[class]')].map(el => el.className).sort();
        const fiClasses = classes(helpBefore);
        applyPageTexts(doc, 'en');
        expect(doc.documentElement.lang).toBe('en');
        expect(doc.title).toBe(SIVU.en.sivuOtsikko);
        expect(doc.getElementById('search-button').textContent).toBe('Search');
        expect(doc.getElementById('search-input').getAttribute('placeholder')).toBe(SIVU.en.hakuEsimerkki);
        expect(doc.getElementById('mobile-help-toggle').getAttribute('aria-label')).toBe('User guide');
        const help = doc.getElementById('help-content');
        expect(help.querySelector('h3').textContent).toBe('How do I use the app?');
        expect(help.querySelector('#app-version')).not.toBeNull();
        expect(help.querySelector('a[href="tietosuoja.html"]')).not.toBeNull();
        expect(classes(help)).toEqual(fiClasses);
    });
});
