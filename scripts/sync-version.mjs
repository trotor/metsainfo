#!/usr/bin/env node
/**
 * Kopioi public/version.js:n versionumeron iOS- ja Android-projekteihin.
 *
 * - Versio (iOS MARKETING_VERSION, Android versionName) = version.js:n
 *   app-kenttä (kauppojen versio, erillinen verkkoversion numerosta)
 * - Build-numero (iOS CURRENT_PROJECT_VERSION, Android versionCode) =
 *   git-committien määrä, joka kasvaa aina (molemmat kaupat vaativat
 *   kasvavan numeron)
 *
 * Käyttö: node scripts/sync-version.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function parseVersionJs(source) {
    const match = source.match(/app:\s*'([^']+)'/);
    if (!match) throw new Error('version.js: app-kenttää (App Storen versio) ei löytynyt');
    const version = match[1];
    // App Store hyväksyy enintään kolme pisteillä erotettua kokonaislukua
    if (!/^\d+\.\d+(\.\d+)?$/.test(version)) {
        throw new Error(`version.js: "${version}" ei kelpaa iOS:n versioksi (muoto x.y tai x.y.z)`);
    }
    return version;
}

export function applyVersion(pbxproj, { marketing, build }) {
    return pbxproj
        .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${marketing};`)
        .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`);
}

export function applyAndroidVersion(gradle, { name, code }) {
    return gradle
        .replace(/versionCode \d+/, `versionCode ${code}`)
        .replace(/versionName "[^"]*"/, `versionName "${name}"`);
}

function updateFile(url, transform) {
    let before;
    try {
        before = readFileSync(url, 'utf8');
    } catch {
        return false; // alustaa ei ole lisätty
    }
    const after = transform(before);
    if (after !== before) writeFileSync(url, after);
    return true;
}

function main() {
    const root = new URL('..', import.meta.url);
    const marketing = parseVersionJs(readFileSync(new URL('public/version.js', root), 'utf8'));
    const build = Number(execSync('git rev-list --count HEAD', { cwd: fileURLToPath(root) }).toString().trim());
    if (updateFile(new URL('ios/App/App.xcodeproj/project.pbxproj', root),
        (s) => applyVersion(s, { marketing, build }))) {
        console.log(`iOS-versio ${marketing} (${build})`);
    }
    if (updateFile(new URL('android/app/build.gradle', root),
        (s) => applyAndroidVersion(s, { name: marketing, code: build }))) {
        console.log(`Android-versio ${marketing} (${build})`);
    }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main();
}
