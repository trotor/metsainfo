import "../js/vendor/index.js";
import { describe, it, expect } from 'vitest';
import { deviceLang, pick } from '../js/i18n.js';
import { codeName, CODES_EN_EPAVIRALLINEN } from '../js/koodit.js';
import { CODES } from '../js/config.js';
import { TEKSTIT as MAASTO } from '../js/maasto/teksti.js';
import { TEKSTIT as LAHIHAKU } from '../js/lahihaku/teksti.js';
import { TEKSTIT as SUOSIKIT } from '../js/suosikit/teksti.js';
import { TEKSTIT as KORKEUSMALLI } from '../js/korkeusmalli/teksti.js';
import { TEKSTIT as ASETUKSET } from '../js/asetukset/teksti.js';
import { formatNumber } from '../js/utils.js';

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
        ['korkeusmalli', KORKEUSMALLI], ['asetukset', ASETUKSET]
    ])('%s: suomella ja englannilla samat avaimet', (_, t) => {
        expect(shape(t.en)).toEqual(shape(t.fi));
    });

    it('laitteen kieli: suomi tai ruotsi → fi, englanti → en, muu → fi', () => {
        expect(deviceLang(['fi-FI', 'en-US'])).toBe('fi');
        expect(deviceLang(['en-GB', 'fi'])).toBe('en');
        expect(deviceLang(['sv-FI'])).toBe('fi');
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
        expect(codeName('cuttingType', 90, 'en')).toBe(CODES.cuttingType[90]);
        expect(codeName('treeSpecies', 999, 'en')).toBeNull();
        expect(codeName('treeSpecies', null, 'en')).toBeNull();
        // Jokainen englanninkielinen koodi on myös virallisessa koodistossa
        for (const [table, codes] of Object.entries(CODES_EN_EPAVIRALLINEN)) {
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
