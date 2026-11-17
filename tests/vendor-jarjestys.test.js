/**
 * config.js kutsuu proj4.defs() ja new L.Proj.CRS() latausaikana. Kokeilubuildissa
 * Rollup voi siirtää config.js:n jaettuun palaan, joka ajetaan ennen app.js:n
 * vendor-tuontia (TestFlight-kokeilussa tyhjä kartta: "Can't find variable: proj4").
 * Siksi config.js tuo vendorin itse, ensimmäisenä.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const firstImport = (file) => readFileSync(`js/${file}`, "utf8")
    .split('\n').find(l => /^\s*import\s/.test(l))?.trim();

describe('vendor-kirjastot ennen niiden käyttöä', () => {
    it('config.js tuo vendorin ensimmäisenä', () => {
        expect(firstImport('config.js')).toBe("import './vendor/index.js';");
    });
});
