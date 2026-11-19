import { describe, it, expect } from 'vitest';
import { parseVersionJs, applyVersion, applyAndroidVersion, parseKokeiluVersion, assertUnusedVersion, compareVersions, containsKokeilu } from '../scripts/sync-version.mjs';

const PBX = `
				CURRENT_PROJECT_VERSION = 1;
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = fi.inetor.metsainfo;
				CURRENT_PROJECT_VERSION = 1;
				MARKETING_VERSION = 1.0;
`;

describe('sync-version', () => {
    it('lukee yhteisen version number-kentästä (verkko, iOS ja Android)', () => {
        const src = "const VERSION = {\n    number: '4.0.0',\n    date: '2026-11-13',\n};";
        expect(parseVersionJs(src)).toBe('4.0.0');
    });

    it('hyväksyy x.y- ja x.y.z-muodot', () => {
        expect(parseVersionJs("number: '4.1'")).toBe('4.1');
        expect(parseVersionJs("number: '4.0.1'")).toBe('4.0.1');
    });

    it('hylkää puuttuvan tai virheellisen version', () => {
        expect(() => parseVersionJs("app: '1.0'")).toThrow();
        expect(() => parseVersionJs("number: '4.0-beta'")).toThrow();
    });

    it('päivittää kaikki versiokentät', () => {
        const out = applyVersion(PBX, { marketing: '3.2.0', build: 57 });
        expect(out.match(/MARKETING_VERSION = 3\.2\.0;/g)).toHaveLength(2);
        expect(out.match(/CURRENT_PROJECT_VERSION = 57;/g)).toHaveLength(2);
        expect(out).toContain('PRODUCT_BUNDLE_IDENTIFIER = fi.inetor.metsainfo;');
    });

    it('päivittää Androidin versionCode- ja versionName-kentät', () => {
        const gradle = `        applicationId "fi.inetor.metsainfo"
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "x"`;
        const out = applyAndroidVersion(gradle, { name: '1.0.1', code: 80 });
        expect(out).toContain('versionCode 80\n');
        expect(out).toContain('versionName "1.0.1"\n');
        expect(out).toContain('applicationId "fi.inetor.metsainfo"');
    });
});

describe('yhteinen versiojono (4.1.0 alkaen)', () => {
    it('kokeiluversio version.js:n kokeilu-kentästä, muoto x.y.z', () => {
        expect(parseKokeiluVersion("const VERSION = { number: '4.1.0', kokeilu: '4.1.1' };")).toBe('4.1.1');
        expect(() => parseKokeiluVersion("kokeilu: '4.1'")).toThrow();
        expect(() => parseKokeiluVersion("number: '4.0.2'")).toThrow();
    });

    it('samaa näkyvää versiota ei käytetä kummassakaan jonossa eikä pienempää kuin mikään ladattu', () => {
        const used = { kauppa: ['4.0.1', '4.0.2'], kokeilu: ['4.0.906', '4.0.907'] };
        expect(() => assertUnusedVersion('4.0.907', used, 'kauppa')).toThrow(/jo käytetty/);
        expect(() => assertUnusedVersion('4.0.2', used, 'kokeilu')).toThrow(/jo käytetty/);
        expect(() => assertUnusedVersion('4.0.3', used, 'kauppa')).toThrow(/pienempi/);
        expect(() => assertUnusedVersion('4.1.0', used, 'kauppa')).not.toThrow();
        const after = { kauppa: [...used.kauppa, '4.1.0'], kokeilu: [...used.kokeilu, '4.1.1'] };
        expect(() => assertUnusedVersion('4.1.0', after, 'kokeilu')).toThrow(/jo käytetty/);
        expect(() => assertUnusedVersion('4.1.2', after, 'kauppa')).not.toThrow();
        expect(compareVersions('4.0.10', '4.0.9')).toBeGreaterThan(0);
        expect(compareVersions('4.1', '4.1.0')).toBe(0);
    });

    it('tunnistaa kokeilukoodin buildista', () => {
        expect(containsKokeilu(['a', 'b .asetukset-kortti{}'])).toBe(true);
        expect(containsKokeilu(['a', 'maasto-kortti'])).toBe(false);
        expect(containsKokeilu(['a', 'b'])).toBe(false);
        expect(containsKokeilu([])).toBe(false);
    });
});
