import { describe, it, expect } from 'vitest';
import { parseVersionJs, applyVersion, applyAndroidVersion } from '../scripts/sync-version.mjs';

const PBX = `
				CURRENT_PROJECT_VERSION = 1;
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = fi.inetor.metsainfo;
				CURRENT_PROJECT_VERSION = 1;
				MARKETING_VERSION = 1.0;
`;

describe('sync-version', () => {
    it('lukee sovelluksen version app-kentästä, ei verkkoversiota', () => {
        const src = "const VERSION = {\n    number: '3.3.0',\n    app: '1.0',\n    date: '2026-11-10',\n};";
        expect(parseVersionJs(src)).toBe('1.0');
    });

    it('hyväksyy x.y- ja x.y.z-muodot', () => {
        expect(parseVersionJs("app: '1.0.1'")).toBe('1.0.1');
    });

    it('hylkää puuttuvan tai virheellisen sovellusversion', () => {
        expect(() => parseVersionJs("number: '3.3.0'")).toThrow();
        expect(() => parseVersionJs("app: '1.0-beta'")).toThrow();
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
