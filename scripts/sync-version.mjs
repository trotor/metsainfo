#!/usr/bin/env node
/**
 * Kopioi public/version.js:n versionumeron iOS-projektiin.
 *
 * - MARKETING_VERSION (CFBundleShortVersionString) = version.js:n number
 * - CURRENT_PROJECT_VERSION (CFBundleVersion) = git-committien määrä,
 *   joka kasvaa aina (App Store Connect vaatii kasvavan build-numeron)
 *
 * Käyttö: node scripts/sync-version.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function parseVersionJs(source) {
    const match = source.match(/number:\s*'([^']+)'/);
    if (!match) throw new Error('version.js: number-kenttää ei löytynyt');
    const version = match[1];
    // App Store hyväksyy vain enintään kolme pisteillä erotettua kokonaislukua
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
        throw new Error(`version.js: "${version}" ei kelpaa iOS:n versioksi (muoto x.y.z)`);
    }
    return version;
}

export function applyVersion(pbxproj, { marketing, build }) {
    return pbxproj
        .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${marketing};`)
        .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`);
}

function main() {
    const root = new URL('..', import.meta.url);
    const pbxPath = new URL('ios/App/App.xcodeproj/project.pbxproj', root);
    const marketing = parseVersionJs(readFileSync(new URL('public/version.js', root), 'utf8'));
    const build = Number(execSync('git rev-list --count HEAD', { cwd: fileURLToPath(root) }).toString().trim());
    const before = readFileSync(pbxPath, 'utf8');
    const after = applyVersion(before, { marketing, build });
    if (after !== before) writeFileSync(pbxPath, after);
    console.log(`iOS-versio ${marketing} (${build})`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main();
}
