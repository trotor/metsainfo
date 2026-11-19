/**
 * Käyttöohjeen osiot lisätoiminnoille. Jokainen toiminto lisää oman
 * osionsa omista teksteistään (teksti.js `ohjeOsio`), joten toiminnon voi
 * irrottaa ohjeineen. Kokeilussa olevan toiminnon osio (kokeilu: true)
 * menee "Testiversion kokeilut" -otsikon alle.
 */

import { pick, getLang } from '../i18n.js';

export const TEKSTIT = {
    fi: {
        otsikko: 'Testiversion kokeilut',
        kuvaus: 'Nämä toiminnot ovat vain testiversiossa. Ne voivat vielä muuttua tai poistua ennen julkaisua.'
    },
    sv: {
        otsikko: 'Försök i testversionen',
        kuvaus: 'De här funktionerna finns bara i testversionen. De kan ännu ändras eller tas bort före publiceringen.'
    },
    en: {
        otsikko: 'Trials in the test version',
        kuvaus: 'These features are only in the test version. They may still change or be removed before release.'
    }
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function section(doc, cls, inner) {
    const el = doc.createElement('div');
    el.className = `help-section ${cls}`;
    el.lang = getLang();
    el.innerHTML = inner;
    return el;
}

/**
 * Lisää osion ohjeeseen ennen alatunnistetta; sama id korvaa edellisen.
 * html on toiminnon omaa, luotettua tekstiä.
 */
export function addHelpSection({ id, title, html, kokeilu = false }, doc = document) {
    const help = doc.getElementById('help-content');
    if (!help) return;
    const footer = help.querySelector('.help-footer');
    // Julkaistujen toimintojen osiot ennen "Testiversion kokeilut" -otsikkoa,
    // kokeilujen osiot sen jälkeen
    if (!kokeilu) {
        const old = help.querySelector(`[data-osio="${CSS.escape(id)}"]`);
        const el = section(doc, 'help-toiminto', `<h3>${esc(title)}</h3>${html}`);
        el.dataset.osio = id;
        if (old) old.replaceWith(el);
        else help.insertBefore(el, help.querySelector('.help-kokeilut') || footer);
        return;
    }
    if (!help.querySelector('.help-kokeilut')) {
        const t = pick(TEKSTIT);
        help.insertBefore(section(doc, 'help-kokeilut', `<h3>${esc(t.otsikko)}</h3><p>${esc(t.kuvaus)}</p>`), footer);
    }
    const old = help.querySelector(`[data-osio="${CSS.escape(id)}"]`);
    const el = section(doc, 'help-kokeilu', `<h3>${esc(title)}</h3>${html}`);
    el.dataset.osio = id;
    if (old) old.replaceWith(el);
    else help.insertBefore(el, footer);
}
