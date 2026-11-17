/**
 * Kielivalinta (#23). Oletuksena laitteen kieli, valinta tallennetaan
 * laitteelle. Suomi on varakieli: puuttuva käännös näytetään suomeksi.
 *
 * Käännetty koko sovellus (js/ui/teksti.js, estimate-teksti.js, sivu-teksti.js,
 * ohje-en.js ja kunkin toiminnon teksti.js). Kielivalinta on vain kokeilubuildissa.
 * Tekstit luetaan moduulien latautuessa, joten kielen vaihto lataa sivun uudelleen.
 */

export const KIELET = ['fi', 'sv', 'en'];
const KEY = 'metsainfo.kieli';
const LOCALES = { fi: 'fi-FI', sv: 'sv-FI', en: 'en-GB' };

function stored() {
    try {
        return globalThis.localStorage?.getItem(KEY) || null;
    } catch {
        return null;
    }
}

/** Laitteen kieli: ensimmäinen laitteen kielistä, joka on suomi, ruotsi tai englanti; muuten suomi. */
export function deviceLang(languages = globalThis.navigator?.languages || [globalThis.navigator?.language]) {
    for (const l of languages || []) {
        const code = String(l || '').slice(0, 2).toLowerCase();
        if (code === 'fi') return 'fi';
        if (code === 'sv') return 'sv';
        if (code === 'en') return 'en';
    }
    return 'fi';
}

// Tavallinen build (verkko, App Store, Google Play) on aina suomeksi, kunnes
// kielivalinta julkaistaan: laitteen kieli tai TestFlightissa tallennettu
// valinta (sama bundle id) ei vaikuta siihen.
export const KIELIVALINTA = import.meta.env?.VITE_KOKEILU === '1';

export function initialLang({ enabled = KIELIVALINTA, saved = stored(), device = deviceLang } = {}) {
    if (!enabled) return 'fi';
    return KIELET.includes(saved) ? saved : device();
}

let current = initialLang();

export function getLang() {
    return current;
}

/** Onko kieli valittu itse (vai laitteen oletus). */
export function isLangChosen() {
    return KIELET.includes(stored());
}

/** Vaihtaa kielen ja tallentaa valinnan. reload: lataa sivun uudelleen (tekstit luetaan käynnistyksessä). */
export function setLang(lang, { reload = true } = {}) {
    if (!KIELET.includes(lang)) return;
    current = lang;
    try {
        globalThis.localStorage?.setItem(KEY, lang);
    } catch {
        // Ei tallennusta: valinta pätee tämän istunnon ajan
    }
    if (reload) globalThis.location?.reload();
}

/** Valitsee nykyisen kielen tekstit: pick({ fi: {...}, en: {...} }). */
export function pick(byLang, lang = current) {
    return byLang[lang] ?? byLang.fi;
}

export function locale(lang = current) {
    return LOCALES[lang] || LOCALES.fi;
}
