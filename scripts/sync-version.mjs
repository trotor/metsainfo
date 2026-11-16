#!/usr/bin/env node
/**
 * Kopioi public/version.js:n versionumeron iOS- ja Android-projekteihin.
 *
 * - Versio (iOS MARKETING_VERSION, Android versionName) = version.js:n
 *   number-kenttä: sama versio verkossa, App Storessa ja Google Playssa
 * - Build-numero (iOS CURRENT_PROJECT_VERSION, Android versionCode) =
 *   git-committien määrä, joka kasvaa aina (molemmat kaupat vaativat
 *   kasvavan numeron)
 *
 * Kokeilubuild (METSAINFO_KOKEILU=1, npm run ios:sync:kokeilu): iOS-versioksi
 * tulee version.js:n kokeilu-kenttä (oma jono 4.0.9xx). Se on oma
 * TestFlight-versiojononsa, joten fastlanen release_settings (joka liittää
 * uusimman buildin *saman versionumeron* buildeista) ei voi liittää
 * kokeilubuildia kauppaversioon. Android jätetään kokeilussa ennalleen.
 *
 * Näkyvää versionumeroa ei käytetä kahdesti (Teron sääntö 16.11.2026):
 * ladatut versiot ovat scripts/kaytetyt-versiot.json:ssa, ja skripti
 * kieltäytyy käytetystä numerosta. Latauksen jälkeen:
 * node scripts/sync-version.mjs --kaytetty (kauppa) tai --kaytetty-kokeilu.
 * Tavallinen ajo kieltäytyy, jos dist/ sisältää kokeilukoodia, ja
 * kokeiluajo, jos ei sisällä.
 *
 * Käyttö: node scripts/sync-version.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function parseVersionJs(source) {
    const match = source.match(/number:\s*'([^']+)'/);
    if (!match) throw new Error('version.js: number-kenttää ei löytynyt');
    const version = match[1];
    // App Store hyväksyy enintään kolme pisteillä erotettua kokonaislukua
    if (!/^\d+\.\d+(\.\d+)?$/.test(version)) {
        throw new Error(`version.js: "${version}" ei kelpaa kauppojen versioksi (muoto x.y tai x.y.z)`);
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

// Kunkin kokeilutoiminnon tunnusluokka (js/maasto/, js/lahihaku/, js/suosikit/, js/korkeusmalli/, js/asetukset/)
export const KOKEILU_MARKERS = ['maasto-kortti', 'lahihaku-kortti', 'suosikit-kortti', 'korkeusmalli-taso', 'asetukset-kortti', 'sv-laatikko'];
export const KOKEILU_PATCH_OFFSET = 900;

/** version.js:n kokeilu-kenttä (TestFlight-kokeilun näkyvä versio). */
export function parseKokeiluVersion(source) {
    const match = source.match(/kokeilu:\s*'([^']+)'/);
    if (!match) throw new Error('version.js: kokeilu-kenttää ei löytynyt');
    const version = match[1];
    if (!/^\d+\.\d+\.\d+$/.test(version) || Number(version.split('.')[2]) < KOKEILU_PATCH_OFFSET) {
        throw new Error(`version.js: kokeiluversion "${version}" pitää olla muotoa x.y.9zz (oma jono)`);
    }
    return version;
}

export function compareVersions(a, b) {
    const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pa[i] || 0) - (pb[i] || 0);
        if (d) return d;
    }
    return 0;
}

/**
 * Näkyvä versio ei saa olla jo käytetty, ja sen pitää olla suurempi kuin
 * saman jonon aiemmat. Heittää virheen, jos sääntö rikkoutuu.
 */
export function assertUnusedVersion(version, used, jono) {
    const list = used[jono] || [];
    if (list.some(v => compareVersions(v, version) === 0)) {
        throw new Error(`Versio ${version} on jo käytetty (${jono}). Kasvata public/version.js:n ${jono === 'kokeilu' ? 'kokeilu' : 'number'}-kenttää.`);
    }
    const max = list.reduce((m, v) => (compareVersions(v, m) > 0 ? v : m), '0');
    if (compareVersions(version, max) < 0) {
        throw new Error(`Versio ${version} on pienempi kuin jo käytetty ${max} (${jono}).`);
    }
}

/** Sisältääkö buildin tiedostot kokeilukoodia (jokin KOKEILU_MARKERS). */
export function containsKokeilu(files) {
    return files.some(text => KOKEILU_MARKERS.some(m => text.includes(m)));
}

function distFiles(root) {
    const dir = new URL('dist/assets/', root);
    try {
        return readdirSync(dir).filter(f => /\.(js|css)$/.test(f)).map(f => readFileSync(new URL(f, dir), 'utf8'));
    } catch {
        return [];
    }
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
    const versionJs = readFileSync(new URL('public/version.js', root), 'utf8');
    const base = parseVersionJs(versionJs);
    const usedUrl = new URL('scripts/kaytetyt-versiot.json', root);
    const used = JSON.parse(readFileSync(usedUrl, 'utf8'));

    // Latauksen jälkeen: merkitään näkyvä versio käytetyksi
    const markJono = process.argv.includes('--kaytetty-kokeilu') ? 'kokeilu'
        : process.argv.includes('--kaytetty') ? 'kauppa' : null;
    if (markJono) {
        const v = markJono === 'kokeilu' ? parseKokeiluVersion(versionJs) : base;
        if (!used[markJono].includes(v)) used[markJono].push(v);
        writeFileSync(usedUrl, JSON.stringify(used, null, 2) + '\n');
        console.log(`Merkitty käytetyksi: ${v} (${markJono})`);
        return;
    }

    const kokeilu = process.env.METSAINFO_KOKEILU === '1';
    const hasKokeilu = containsKokeilu(distFiles(root));
    if (kokeilu && !hasKokeilu) {
        throw new Error('Kokeiluversio, mutta dist/ ei sisällä kokeilukoodia: aja npm run build:kokeilu');
    }
    if (!kokeilu && hasKokeilu) {
        throw new Error('dist/ sisältää kokeilukoodia (VITE_KOKEILU=1). Aja tavallinen npm run build ennen kauppabuildia.');
    }

    const marketing = kokeilu ? parseKokeiluVersion(versionJs) : base;
    const jono = kokeilu ? 'kokeilu' : 'kauppa';
    assertUnusedVersion(marketing, used, jono);
    const build = Number(execSync('git rev-list --count HEAD', { cwd: fileURLToPath(root) }).toString().trim());
    if (updateFile(new URL('ios/App/App.xcodeproj/project.pbxproj', root),
        (s) => applyVersion(s, { marketing, build }))) {
        console.log(`iOS-versio ${marketing} (${build})${kokeilu ? ' – KOKEILU, vain TestFlightiin' : ''}`);
    }
    if (kokeilu) return; // Android ei saa kokeiluversiota
    if (updateFile(new URL('android/app/build.gradle', root),
        (s) => applyAndroidVersion(s, { name: marketing, code: build }))) {
        console.log(`Android-versio ${marketing} (${build})`);
    }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main();
}
