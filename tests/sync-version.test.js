import { describe, it, expect } from 'vitest';
import { parseVersionJs, applyVersion } from '../scripts/sync-version.mjs';

const PBX = `
				CURRENT_PROJECT_VERSION = 1;
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = fi.inetor.metsainfo;
				CURRENT_PROJECT_VERSION = 1;
				MARKETING_VERSION = 1.0;
`;

describe('sync-version', () => {
    it('lukee versionumeron version.js:stä', () => {
        const src = "const VERSION = {\n    number: '3.2.0',\n    date: '2026-11-09',\n};";
        expect(parseVersionJs(src)).toBe('3.2.0');
    });

    it('hylkää muun kuin x.y.z-muotoisen version', () => {
        expect(() => parseVersionJs("number: '4.0.0-alpha.1'")).toThrow();
    });

    it('päivittää kaikki versiokentät', () => {
        const out = applyVersion(PBX, { marketing: '3.2.0', build: 57 });
        expect(out.match(/MARKETING_VERSION = 3\.2\.0;/g)).toHaveLength(2);
        expect(out.match(/CURRENT_PROJECT_VERSION = 57;/g)).toHaveLength(2);
        expect(out).toContain('PRODUCT_BUNDLE_IDENTIFIER = fi.inetor.metsainfo;');
    });
});
