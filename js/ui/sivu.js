/**
 * Sivun (index.html) staattisten tekstien käännös (#24).
 *
 * index.html on suomeksi. Käännettävät elementit on merkitty:
 *   data-i18n="avain"                       → textContent
 *   data-i18n-attr="title:avain;aria-label:avain2" → attribuutit
 * Avaimet ja tekstit: sivu-teksti.js. Käyttöohje (#help-content) vaihdetaan
 * kokonaan englanninkieliseen versioon (ohje-en.js).
 *
 * Suomeksi sivuun ei kosketa lainkaan. Kutsutaan init():n alussa ennen
 * initNative():a, joka täyttää ohjeen #app-version-kentän.
 */

import { getLang, pick } from '../i18n.js';
import { TEKSTIT } from './sivu-teksti.js';
import { OHJE_EN } from './ohje-en.js';

// Englanninkielinen ohje vain kokeilubuildiin ja testeihin: tavallinen build
// on aina suomeksi, joten Rollup karsii ohjeen siitä pois.
const OHJEET = import.meta.env.VITE_KOKEILU === '1' || import.meta.env.MODE === 'test' ? { en: OHJE_EN } : {};

/** Purkaa "title:avain;aria-label:avain2" → [['title', 'avain'], ['aria-label', 'avain2']]. */
export function parseAttrSpec(spec) {
    return String(spec || '').split(';')
        .map(part => part.split(':').map(s => s.trim()))
        .filter(([attr, key]) => attr && key);
}

export function applyPageTexts(doc = document, lang = getLang()) {
    if (lang === 'fi') return;
    const t = pick(TEKSTIT, lang);

    doc.documentElement.lang = lang;
    if (t.sivuOtsikko) doc.title = t.sivuOtsikko;
    const description = doc.querySelector('meta[name="description"]');
    if (description && t.sivuKuvaus) description.setAttribute('content', t.sivuKuvaus);

    const help = doc.getElementById('help-content');
    if (help && OHJEET[lang]) help.innerHTML = OHJEET[lang];

    doc.querySelectorAll('[data-i18n]').forEach(el => {
        const text = t[el.dataset.i18n];
        if (typeof text === 'string') el.textContent = text;
    });
    doc.querySelectorAll('[data-i18n-attr]').forEach(el => {
        for (const [attr, key] of parseAttrSpec(el.dataset.i18nAttr)) {
            if (typeof t[key] === 'string') el.setAttribute(attr, t[key]);
        }
    });
}
