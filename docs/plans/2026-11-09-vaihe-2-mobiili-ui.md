# Vaihe 2: mobiilikäyttöliittymä — toteutussuunnitelma

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verkkosovellus toimii puhelimella koko näytön karttana ja bottom sheetinä (luku 5.4), ja työpöytänäkymä yli 768 px:n leveydellä säilyy toiminnallisesti ennallaan. Versio 3.2.0.

**Architecture:** `js/ui.js` pilkotaan hakemistoksi `js/ui/`. Mobiilikäyttäytyminen valitaan ajonaikaisesti `isMobileLayout()`-funktiolla, joka käyttää samaa media-kyselyä kuin CSS. Sheet on sama `#info-panel`-elementti: mobiilissa sen korkeutta ohjaavat `data-snap` ja CSS-muuttuja `--sheet-height`, ja työpöydällä ne poistetaan. Puhdas laskenta on omissa funktioissaan, joita testataan Vitestillä: pysäytyskohdat, vedon tulkinta, kartan täytteet ja CSV.

**Tech Stack:** Vite 8, Vitest 4 + jsdom, Leaflet 1.9.4 (globaali `L`), selaimen Pointer Events, CSS-muuttujat. Uusia riippuvuuksia ei tule.

**Spec:** [2026-07-28-mobiilisovellukset-design.md](2026-07-28-mobiilisovellukset-design.md), luku 5.4 sekä luvut 3 ("ui.js:n pilkkominen") ja 7 ("Tietosuojaselosteen linkki sovelluksessa"). Paikannus (luku 5.1) kuuluu vaiheeseen 3 eikä tähän. Tässä tehdään kuitenkin paikannuspainikkeelle varattu paikka kontrollipinoon.

## Global Constraints

- Mobiilinäkymä: `@media (max-width: 768px), (max-height: 500px) and (pointer: coarse)`. JS:ssä sama merkkijono vakiona `MOBILE_QUERY`.
- Työpöytä (kysely ei täsmää) säilyy toiminnallisesti ennallaan. Ainoa sallittu näkyvä muutos on kahden tasovalitsimen yhdistäminen yhdeksi (ks. Task 7).
- Kosketuskohteet mobiilissa vähintään 44×44 px. Syöttökenttien ja valikoiden fonttikoko vähintään 16 px.
- Sheetin pysäytyskohdat: *peek* 140 px + `env(safe-area-inset-bottom)`, *half* 50 % näkymän korkeudesta, *full* näkymän korkeus − hakukentän alareuna.
- `100dvh`, `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">` ja `env(safe-area-inset-*)`.
- Paletti `:root`-muuttujina: Havu `#2d5a27`, Kuusikko `#1a3518`, Jäkälä `#f3f6f1`, Kaarna `#3b3a36`, Sammal `#6b7a63`, Sijainti `#1a73e8`. Uutta tyyliä käytetään vain mobiilikyselyn sisällä.
- Fontti: järjestelmäfontti, ja numeroille `font-variant-numeric: tabular-nums`.
- Pyöristykset: sheetin yläkulmat 16 px, painikkeet 10 px, sisäiset rivit 0 (hiusviiva).
- Liike: enintään 200 ms, vain vastauksena käyttäjän toimintoon. `prefers-reduced-motion: reduce` poistaa siirtymät.
- Mobiilissa tekstit puhuvat napauttamisesta, eivät klikkaamisesta.
- Versio 3.2.0 tiedostoihin `public/version.js` (`number`, `date`) ja `package.json`.
- CC BY 4.0: Leafletin attribuution on näyttävä mobiilissa sheetin yläpuolella.
- Kenttiin `index.html`/innerHTML ei lisätä käyttäjän syötettä ilman käsittelyä (CLAUDE.md).

## Testausratkaisu

Luvun 8 mukaan käyttöliittymälle ei kirjoiteta automaattitestejä. TDD koskee tässä suunnitelmassa **eristettyä puhdasta logiikkaa**: `tests/`-hakemistoon tulevat Vitest-testit (jsdom) pysäytyskorkeuksille, vedon ja napautuksen tulkinnalle, kartan täyte- ja siirtolaskennalle, CSV-merkkijonolle, välilehtien tilalle, `openStand`-indeksivahdeille ja selitteiden avaus- ja sulkulogiikalle.

Asettelu ja ulkoasu tarkistetaan jokaisessa tehtävässä Playwright MCP:llä osoitteessa `http://localhost:5173/?parcel=592-404-1-32` kolmessa koossa: **390×844**, **844×390** (vaakasuuntainen puhelin, `hasTouch`) ja **1280×800**. Jokaisella tarkistuksella on odotettu havainto.

jsdom:sta puuttuvat `matchMedia` ja `scrollIntoView`. Niitä käyttävät funktiot ottavat `win`-parametrin tai tarkistavat olemassaolon (`el.scrollIntoView?.()`). Jokainen testitiedosto tuo ensin `../js/vendor/index.js`:n ja `../js/config.js`:n, koska config rekisteröi EPSG:3067:n ja käyttää `L`:ää latausaikana.

**Työpöydän vertailuarvot** mitattiin live-versiosta 3.1.0 9.11.2026 koossa 1280×800, kun `?parcel=592-404-1-32` on valittu (`[x, y, leveys, korkeus]`):

| Elementti | Arvo |
|-----------|------|
| `#header` | `[0, 0, 1280, 73]` |
| `#footer` | `[0, 770, 1280, 30]` |
| `#info-panel` | `[10, 70, 420, 660]` |
| `#search-control` | `[1192, 80, 34, 34]` |
| `.leaflet-control-zoom` | `[10, 83, 34, 64]` |
| `.leaflet-control-layers` | kaksi: `[1222, 83, 48, 48]`, `[1222, 141, 48, 48]` |
| `.stand-item` | 19 kpl |
| `.summary-section` | 9 kpl |
| `#info-content` scrollHeight | 2896 (sallittu ±8) |

Tarkistusskripti `browser_evaluate`illa (sama kaikissa tehtävissä, kutsutaan "työpöytämittaukseksi"):

```js
() => { const r = s => { const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]; }; return { header: r('#header'), footer: r('#footer'), panel: r('#info-panel'), search: r('#search-control'), zoom: r('.leaflet-control-zoom'), layers: [...document.querySelectorAll('.leaflet-control-layers')].map(e=>{const b=e.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y)]}), stands: document.querySelectorAll('.stand-item').length, sections: document.querySelectorAll('.summary-section').length, scroll: document.querySelector('#info-content').scrollHeight }; }
```

## Ratkaisut, joita spec ei tee

- **Uusi valinta avaa sheetin peek-tilaan** ja Yhteenveto-välilehdelle. Kartta jää näkyviin, ja avainluvut näkyvät heti. `searchParcel`in `fitBounds` ajetaan ennen kuin paneeli avautuu, joten täytefunktio käyttää piilossa olevalle sheetille peek-korkeutta (`sheet.targetHeight()`).
- **Napautussykli kahvassa:** peek → half → full → peek.
- **Vain kahva ja peek-rivi vetävät sheetiä** (`touch-action: none`). Sisältö vierittyy natiivisti, joten vedot eivät kilpaile vierityksen kanssa.
- **Mobiilin ×** pienentää peekiin, ja se näkyy vain half- ja full-tiloissa. **⋯-valikko** peek-rivillä: Kopioi linkki, Lataa CSV, Tulosta, Poista valinta. `.parcel-actions` piilotetaan mobiilissa, koska valikko korvaa sen. Työpöydän × poistaa valinnan kuten ennenkin.
- **Ehdotukset-välilehti** näytetään vain, jos hakkuu- tai hoitoehdotuksia on. Nollalla kuviolla välilehtiä ei ole, ja peek näyttää tekstin "Ei metsävaratietoja".
- **Kuvion avaus kartalta** sulkee muut avatut kuviot, jotta avattu kuvio löytyy listasta.
- **Hakupalkki on mobiilissa aina näkyvissä.** `#search-form.hidden` ohitetaan CSS:llä mobiilikyselyssä. `initControls`in ulkoklikkaus voi jatkaa luokan lisäämistä, koska sillä ei ole mobiilissa vaikutusta.
- **Tasovalitsimet yhdistetään myös työpöydällä** (`addOverlay` `initMap`in kontrolliin). Toiminto säilyy, ja yksi kontrolli on helpompi pitää samana molemmissa asetteluissa.
- **Zoom-kontrolli** siirretään mobiilissa oikealle `map.zoomControl.setPosition('topright')`illa ja palautetaan `'topleft'`iin, kun asettelu vaihtuu työpöydäksi.

## Review Focus

1. **Asettelun vaihto sheetin ollessa auki** (puhelimen kääntö tai työpöytäikkunan kavennus alle 768 px:n): korkeudet lasketaan uudelleen, ja työpöydälle palattaessa `data-snap` sekä `--sheet-height` poistetaan, jotta työpöydän paneeli ei saa mobiilin korkeutta. Testi Task 3:ssa (`createSheet … removes inline sizing on desktop`).
2. **Uusi valinta, kun edellinen on auki Kuviot-välilehdellä, tai valinta ilman kuvioita:** aktiivinen välilehti palaa Yhteenvetoon, eikä nollalla kuviolla näytetä välilehtiä. Testi Task 4:ssä.
3. **Lyhyt veto vs. napautus ja nopea pyyhkäisy:** alle 6 px:n liike on napautus, ja nopeus vie pyyhkäisyn seuraavaan pysäytyskohtaan. Testi Task 3:ssa.
4. **Kartan kuvio, jota ei ole `state.currentFeatures`issa** (vanhentunut taso): `openStand(-1)` ei tee mitään eikä kaadu. Testi Task 5:ssä.
5. **Tulostus puhelimella:** `@media print` näyttää kaikki välilehtipaneelit, ei pelkkää aktiivista, ja piilottaa sheetin kahvan, peek-rivin, valikon ja nauhan. Tarkistus Task 4:ssä (`browser_emulate_media print`).

---

### Task 1: Pilko `js/ui.js` moduuleiksi ilman toiminnallista muutosta

**Files:**
- Create: `js/ui/index.js` (uudelleenvienti), `js/ui/map-features.js`, `js/ui/legend.js`, `js/ui/actions.js`, `js/ui/tips.js`, `js/ui/summary.js`, `js/ui/stands.js`
- Delete: `js/ui.js`
- Modify: `js/app.js:20` (tuonti `./ui/index.js`:stä)
- Test: `tests/fixtures/stands.js`, `tests/csv.test.js`, `tests/summary.test.js`

**Interfaces:**
- Produces (siirretään sellaisenaan, nimet ja allekirjoitukset ennallaan):
  - `map-features.js`: `showFeaturePopup`, `onEachFeature`, `onEachHabitat`, `onEachMkiFeature`, `onEachParcel`, `addParcelLabel`
  - `legend.js`: `setColorMode`, `setMkiColorMode`, `updateLegend`, `updateMkiLegend`
  - `actions.js`: `toggleHelp()`, `copyParcelLink(btn = document.getElementById('copy-link-btn'))`, `downloadCSV()`, uusi `buildCSV(features: object[]): string` (BOM + otsikkorivi + rivit, erotin `;`, rivinvaihto `\n`, sama `escapeCSV`)
  - `tips.js`: `tip(key: string): string`
  - `stands.js`: `renderStandItem(feature, index): string`, `highlightStand(index, highlight)`, `highlightFilteredStands(type, value)`, `attachStandEventListeners(root = document)`, `attachFilterEventListeners(root = document)`
  - `summary.js`: `showSummary(features, parcel, partCount = 1)`
  - `index.js` vie kaikki yllä luetellut.

- [ ] **Step 1: Tallenna vertailukuvat.** Aja `npm run dev` taustalle. Ota Playwright MCP:llä koossa 1280×800 kuvakaappaus osoitteesta `http://localhost:5173/?parcel=592-404-1-32` tiedostoon `.superpowers/baseline/desktop-1280.png`. Aja työpöytämittaus.
  Expected: arvot vastaavat vertailutaulukkoa.

- [ ] **Step 2: Kirjoita fixture ja epäonnistuvat testit**

`tests/fixtures/stands.js` vie `STANDS`-taulukon, jossa on kolme GeoJSON-kuviota. Kuviot ovat 100 m × 100 m neliöitä EPSG:3067:ssä alkaen kohdasta `[500000, 6822000]`. Ominaisuudet:
- kuvio 1: `STANDNUMBER: 1, AREA: 1.5, VOLUME: 150, MAINTREESPECIES: 2, MEANAGE: 60, CUTTINGTYPE: 3, CUTTINGPROPOSALYEAR: 2027, PROPORTIONPINE: 0.2, PROPORTIONSPRUCE: 0.7, PROPORTIONOTHER: 0.1, MEASUREMENTDATE: '2021-06-01'`
- kuvio 2: `STANDNUMBER: 2, AREA: 2.25, VOLUME: 80, MAINTREESPECIES: 1, MEANAGE: 35`
- kuvio 3: `STANDNUMBER: 3, AREA: 0.75, VOLUME: 0, MAINTREESPECIES: 4`, jolla on lisäksi kenttä, jonka arvossa on puolipiste ja lainausmerkki: `DEVELOPMENTCLASS: 'X;"y"'`

```js
// tests/csv.test.js
import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect } from 'vitest';
import { buildCSV } from '../js/ui/actions.js';
import { STANDS } from './fixtures/stands.js';

describe('buildCSV', () => {
  it('alkaa BOMilla ja otsikkorivillä', () => {
    const csv = buildCSV(STANDS);
    expect(csv.startsWith('﻿Kuvio;Pinta-ala (ha);Pääpuulaji;')).toBe(true);
  });
  it('tuottaa rivin per kuvio', () => {
    expect(buildCSV(STANDS).split('\n')).toHaveLength(4);
  });
  it('lainaa kentän, jossa on lainausmerkki', () => {
    expect(buildCSV(STANDS).split('\n')[3]).toContain('"X;""y"""');
  });
});
```

Huom: nykyinen `escapeCSV` lainaa kentän vain, jos siinä on pilkku, lainausmerkki tai rivinvaihto, mutta ei pelkän puolipisteen takia. Testi lukitsee nykyisen käytöksen (lainausmerkki laukaisee lainauksen). Käytöstä ei muuteta tässä tehtävässä.

```js
// tests/summary.test.js
import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { showSummary } from '../js/ui/summary.js';
import { STANDS } from './fixtures/stands.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="info-panel"><div id="sheet-peek"></div><div id="info-content"></div></div>';
});

describe('showSummary', () => {
  it('renderöi kuvion per piirre', () => {
    showSummary(STANDS, null);
    expect(document.querySelectorAll('.stand-item')).toHaveLength(3);
  });
  it('näyttää kuvioiden määrän', () => {
    showSummary(STANDS, null);
    expect(document.querySelector('.stands-count').textContent).toBe('(3 kpl)');
  });
  it('näyttää ei-dataa-tilan tyhjällä taulukolla', () => {
    showSummary([], null);
    expect(document.querySelector('.no-data')).not.toBeNull();
  });
});
```

- [ ] **Step 3: Aja testit.** Run: `npm test`
  Expected: FAIL, koska `../js/ui/actions.js` ja `../js/ui/summary.js` puuttuvat.

- [ ] **Step 4: Pilko tiedosto.** Siirrä funktiot `Interfaces`-listan mukaisiin tiedostoihin. Jokainen tiedosto tuo tarvitsemansa suoraan (`config.js`, `state.js`, `utils.js`, `styles.js`, `statistics.js`), ja `summary.js` tuo `stands.js`:n sekä `tips.js`:n. Poimi `downloadCSV`in otsikko-, rivi- ja `escapeCSV`-logiikka funktioon `buildCSV`, jota `downloadCSV` kutsuu. Poista `js/ui.js`. Päivitä `js/app.js`:n tuonti: `from './ui/index.js'`.

- [ ] **Step 5: Aja testit.** Run: `npm test`
  Expected: PASS, mukaan lukien aiemmat `utils.test.js`-testit.

- [ ] **Step 6: Tarkista työpöytä.** Kehityspalvelin on käynnissä. Aja työpöytämittaus 1280×800:ssa, ja vertaa kuvakaappausta vertailukuvaan.
  Expected: identtiset arvot. Kuvion napautus kartalla avaa Leaflet-popupin, CSV-lataus tuottaa tiedoston, ja selitteet aukeavat hoverilla. Konsolissa ei ole virheitä.

- [ ] **Step 7: Commit**

```bash
git add js/ui js/app.js tests && git rm js/ui.js
git commit -m "refactor: pilko ui.js moduuleiksi js/ui/ (#20)"
```

---

### Task 2: Asettelun perusta — viewport, paletti, mobiilikysely, kelluva hakupalkki

**Files:**
- Create: `js/ui/layout.js`
- Modify: `index.html` (viewport-meta, ohjepainike hakupalkkiin), `style.css` (`:root`-muuttujat; `#app` `100dvh`; korvaa rivien 969–1030 `@media (max-width: 768px)` -lohko uudella mobiilikyselyllä), `js/ui/index.js`
- Test: `tests/layout.test.js`

**Interfaces:**
- Produces (`js/ui/layout.js`):
  - `MOBILE_QUERY: string` = `'(max-width: 768px), (max-height: 500px) and (pointer: coarse)'`
  - `isMobileLayout(win = window): boolean` palauttaa `false`, jos `win.matchMedia` puuttuu
  - `onLayoutChange(cb: (mobile: boolean) => void, win = window): () => void` kuuntelee `MediaQueryList`in `change`-tapahtumaa ja palauttaa kuuntelijan poistavan funktion
  - `topInset(doc = document): number` palauttaa `#search-control`in alareunan `getBoundingClientRect().bottom`-arvon pyöristettynä, tai 0 jos elementti puuttuu
  - `fitPadding({ mobile, sheetHeight, topInset }): object`: työpöydällä `{ padding: [50, 50] }`, mobiilissa `{ paddingTopLeft: [16, topInset + 16], paddingBottomRight: [16, sheetHeight + 16] }`
  - `visibleCenterOffset(sheetHeight: number, topInset: number): [number, number]` = `[0, Math.round((sheetHeight - topInset) / 2)]`

- [ ] **Step 1: Kirjoita epäonnistuvat testit** `tests/layout.test.js`:

```js
const fakeWin = (matches) => ({ matchMedia: (q) => ({ matches, media: q, addEventListener() {}, removeEventListener() {} }) });

it('MOBILE_QUERY vastaa speciä', () => {
  expect(MOBILE_QUERY).toBe('(max-width: 768px), (max-height: 500px) and (pointer: coarse)');
});
it('isMobileLayout käyttää matchMediaa', () => {
  expect(isMobileLayout(fakeWin(true))).toBe(true);
  expect(isMobileLayout(fakeWin(false))).toBe(false);
});
it('isMobileLayout on false ilman matchMediaa', () => {
  expect(isMobileLayout({})).toBe(false);
});
it('fitPadding työpöydällä säilyttää 50 px', () => {
  expect(fitPadding({ mobile: false, sheetHeight: 300, topInset: 60 })).toEqual({ padding: [50, 50] });
});
it('fitPadding mobiilissa varaa sheetin ja hakupalkin', () => {
  expect(fitPadding({ mobile: true, sheetHeight: 174, topInset: 64 }))
    .toEqual({ paddingTopLeft: [16, 80], paddingBottomRight: [16, 190] });
});
it('visibleCenterOffset siirtää keskipistettä alaspäin', () => {
  expect(visibleCenterOffset(422, 64)).toEqual([0, 179]);
});
it('topInset on 0 ilman hakukontrollia', () => {
  document.body.innerHTML = '';
  expect(topInset(document)).toBe(0);
});
```

- [ ] **Step 2: Aja testit.** Run: `npm test`
  Expected: FAIL, koska `layout.js` puuttuu.

- [ ] **Step 3: Toteuta `js/ui/layout.js`** Interfaces-listan mukaan, ja vie se `index.js`:stä.

- [ ] **Step 4: Aja testit.** Run: `npm test`
  Expected: PASS

- [ ] **Step 5: Merkintä ja tyylit.**
  - `index.html`: viewport-metaan lisätään `viewport-fit=cover`. `#search-control`iin lisätään `#search-form`in jälkeen `<button id="mobile-help-toggle" aria-label="Käyttöohje" onclick="toggleHelp()">?</button>` ja hakukenttään `enterkeyhint="search"` sekä `autocomplete="off"`. `inputmode="numeric"`ia ei käytetä, koska iOS:n numeronäppäimistöstä puuttuu tavuviiva.
  - `style.css`:
    - `:root` saa palettimuuttujat `--havu`, `--kuusikko`, `--jakala`, `--kaarna`, `--sammal` ja `--sijainti`.
    - `#app` saa `height: 100vh; height: 100dvh;`.
    - Vanha 768 px:n lohko korvataan mobiilikyselyllä, jossa:
      - `#header` ja `#footer` piilotetaan.
      - `#search-control` kelluu yläreunassa: `top: calc(env(safe-area-inset-top) + 8px)`, `left: calc(env(safe-area-inset-left) + 8px)`, `right: calc(env(safe-area-inset-right) + 8px)`.
      - `#search-toggle` piilotetaan.
      - `#search-form, #search-form.hidden` ovat `display: flex` (rivi, ei modaali).
      - Hakukenttä on 16 px ja 44 px korkea, ja `#search-button` sekä `#mobile-help-toggle` ovat 44×44 px, pyöristys 10 px.
      - `.leaflet-top.leaflet-right` siirtyy hakupalkin alle: `margin-top: calc(env(safe-area-inset-top) + 60px)`.
      - `#help-modal` mahtuu `100dvh`:hen safe-area huomioiden.
    - Työpöydällä `#mobile-help-toggle` on `display: none`.

- [ ] **Step 6: Tarkista selaimessa.**
  - **390×844:** otsikko ja alapalkki puuttuvat, kartta täyttää näkymän ja hakupalkki näkyy yläreunassa. Kentän `getComputedStyle(...).fontSize` on `16px`, ja hakupainikkeen sekä ohjepainikkeen mitat ovat vähintään 44×44. Ohjepainike avaa ohjeen. Haku `592-404-1-32` toimii.
  - **844×390, `hasTouch`:** sama mobiiliasettelu.
  - **1280×800:** työpöytämittaus vastaa vertailutaulukkoa.

- [ ] **Step 7: Commit**

```bash
git add index.html style.css js/ui tests/layout.test.js
git commit -m "feat: mobiiliasettelun perusta ja kelluva hakupalkki (#20)"
```

---

### Task 3: Bottom sheet

**Files:**
- Create: `js/ui/sheet.js`, `js/ui/panel.js`
- Modify: `index.html` (`#info-panel`in sisältö), `style.css` (sheet mobiilikyselyssä, print-sääntö), `js/app.js` (`selectParcels`, sulkemiskäsittelijä, `searchParcel`in `fitBounds`), `js/ui/index.js`
- Test: `tests/sheet.test.js`

**Interfaces:**
- Consumes: `isMobileLayout`, `onLayoutChange`, `topInset`, `fitPadding` (Task 2)
- Produces (`js/ui/sheet.js`):
  - `PEEK_HEIGHT = 140`, `TAP_THRESHOLD = 6`, `FLING_MS = 150`
  - `computeSnapHeights(viewportHeight, topInset, safeBottom = 0): { peek, half, full }` laskee `peek = 140 + safeBottom`, `half = Math.round(viewportHeight * 0.5)` ja `full = viewportHeight - topInset`. Sen jälkeen arvot pakotetaan nouseviksi: `half = max(half, peek)` ja `full = max(full, half)`.
  - `resolveRelease(startHeight, dy, velocityY, heights): 'tap' | 'peek' | 'half' | 'full'`. Arvo `dy` on osoittimen pystysiirtymä (positiivinen alaspäin) ja `velocityY` px/ms (positiivinen alaspäin). Jos `|dy| < TAP_THRESHOLD`, tulos on `'tap'`. Muuten lasketaan `projected = startHeight - dy - velocityY * FLING_MS` ja valitaan lähin pysäytyskohta.
  - `nextSnapOnTap(snap): snap` kiertää peek → half → full → peek.
  - `readSafeBottom(doc = document): number` palauttaa `#safe-area-probe`-elementin korkeuden, tai 0 jos elementti puuttuu. Elementti on `position: fixed; visibility: hidden; height: env(safe-area-inset-bottom)`.
  - `createSheet(panelEl, { win = window, doc = document, onChange, safeBottom = () => readSafeBottom(doc) } = {})` palauttaa `{ setSnap(name), getSnap(), targetHeight(), recompute(), destroy() }`.
    - Mobiilissa `setSnap` asettaa `panelEl.dataset.snap` ja `panelEl.style --sheet-height` (px) sekä `doc.documentElement`in `--sheet-offset`in. Arvo on nykyinen korkeus, kun paneeli on näkyvissä, ja 0, kun sillä on `.hidden`.
    - Työpöydällä `setSnap` ja `recompute` poistavat `data-snap`in, `--sheet-height`in ja `--sheet-offset`in.
    - `targetHeight()` palauttaa piilotetun paneelin peek-korkeuden ja muuten nykyisen pysäytyskohdan korkeuden.
    - `onChange(snap)` kutsutaan jokaisen muutoksen jälkeen.
- Produces (`js/ui/panel.js`):
  - `initPanel({ onClearSelection }): void` kytkee kahvan vedon ja napautuksen (Pointer Events, `setPointerCapture`), ×-painikkeen (mobiilissa `setSnap('peek')`, työpöydällä `onClearSelection()`), ⋯-valikon ja asettelun vaihdon (`onLayoutChange` → `sheet.recompute()` ja zoom-kontrollin paikka). Lisäksi se kuuntelee `resize`-tapahtumaa (`recompute`).
  - `openPanelForSelection(): void` poistaa `.hidden`in, asettaa `setSnap('peek')` ja kutsuu `setPeekMessage('Haetaan tietoja…')`.
  - `setPeekMessage(text: string): void` kirjoittaa `#sheet-peek`iin tekstin `textContent`illa. `selectParcels`in virhehaara kutsuu sitä tekstillä `Metsätietojen haku epäonnistui.`
  - `getSheet(): ReturnType<typeof createSheet>`
  - `mapFitOptions(extra = {}): object` palauttaa `{ ...fitPadding({ mobile: isMobileLayout(), sheetHeight: getSheet().targetHeight(), topInset: topInset() }), ...extra }`.

- [ ] **Step 1: Kirjoita epäonnistuvat testit** `tests/sheet.test.js`:

```js
const H = computeSnapHeights(844, 64, 34);
it('laskee pysäytyskohdat', () => {
  expect(H).toEqual({ peek: 174, half: 422, full: 780 });
});
it('pitää korkeudet nousevina matalassa näkymässä', () => {
  const h = computeSnapHeights(300, 64, 21);
  expect(h.half).toBeGreaterThanOrEqual(h.peek);
  expect(h.full).toBeGreaterThanOrEqual(h.half);
});
it('alle 6 px:n liike on napautus', () => {
  expect(resolveRelease(174, 5, 0, H)).toBe('tap');
  expect(resolveRelease(174, -5, 0, H)).toBe('tap');
});
it('hidas veto päätyy lähimpään kohtaan', () => {
  expect(resolveRelease(174, -230, 0, H)).toBe('half');
});
it('nopea pyyhkäisy ylös ohittaa lähimmän', () => {
  expect(resolveRelease(174, -120, -2.5, H)).toBe('full');
});
it('nopea pyyhkäisy alas palaa peekiin', () => {
  expect(resolveRelease(780, 150, 3, H)).toBe('peek');
});
it('napautussykli', () => {
  expect(['peek', 'half', 'full'].map(nextSnapOnTap)).toEqual(['half', 'full', 'peek']);
});
```

Lisäksi kaksi DOM-testiä `createSheet`ille valeikkunalla. `win` = `{ innerHeight: 844, matchMedia: () => ({ matches: mobile, addEventListener() {}, removeEventListener() {} }) }`, jossa `mobile` on muutettava muuttuja.
- `'createSheet asettaa korkeuden mobiilissa'`: `setSnap('half')` → `panel.dataset.snap === 'half'` ja `panel.style.getPropertyValue('--sheet-height') === '422px'`. Paneeli on näkyvissä, joten `--sheet-offset` on `422px`.
- `'createSheet removes inline sizing on desktop'`: ensin `setSnap('full')` mobiilissa, sitten `mobile = false; sheet.recompute()` → `panel.dataset.snap` on `undefined` ja `--sheet-height` on tyhjä.

`topInset` saadaan korvaamalla `#search-control`in `getBoundingClientRect` funktiolla `() => ({ bottom: 64 })`, ja safe-area annetaan optiona `safeBottom: () => 34`. jsdom ei laske `env()`iä, joten probe-elementtiä ei käytetä testeissä.

- [ ] **Step 2: Aja testit.** Run: `npm test`
  Expected: FAIL, koska `sheet.js` puuttuu.

- [ ] **Step 3: Toteuta `js/ui/sheet.js`.** Interfaces määrää kaiken. Kahvan vetäessä `--sheet-height` päivitetään suoraan, ja siirtymä on pois päältä vedon ajan (luokka `.dragging`).

- [ ] **Step 4: Aja testit.** Run: `npm test`
  Expected: PASS

- [ ] **Step 5: Merkintä, paneeli ja kytkentä.**
  - `index.html`: `<body>`n alkuun `<div id="safe-area-probe" aria-hidden="true"></div>`. `#info-panel`in alkuun lisätään `<div id="sheet-handle" role="button" tabindex="0" aria-label="Muuta tietopaneelin kokoa"></div>` ja `<div id="sheet-peek"></div>` sekä `<div id="sheet-menu" role="menu" hidden>`. Valikon painikkeet ovat Kopioi linkki, Lataa CSV, Tulosta ja Poista valinta, ja niillä on `data-action` = `copy`, `csv`, `print`, `clear`.
  - `js/ui/panel.js` Interfaces-listan mukaan. ⋯-painike `#sheet-menu-btn` renderöidään peek-riville Task 4:ssä. Tässä tehtävässä valikko avataan painikkeesta `#sheet-menu-btn`, jos se on olemassa. Valikon toiminnot:
    - `copy` → `copyParcelLink(menuItem)`
    - `csv` → `downloadCSV()`
    - `print` → `window.print()`
    - `clear` → `onClearSelection()` ja `panel.classList.add('hidden')`
  - `js/app.js`:
    - Sulkemiskäsittelijän runko siirtyy funktioon `clearSelection()`, ja `initPanel({ onClearSelection: clearSelection })` kutsutaan `init`issä `initControls`in jälkeen.
    - `selectParcels` kutsuu `openPanelForSelection()`ia suoran `classList.remove('hidden')`in sijaan.
    - `searchParcel`in `fitBounds` saa asetukset `mapFitOptions({ maxZoom: 16 })`.
  - `style.css`, mobiilikysely:
    - `#info-panel`: `position: fixed; left: 0; right: 0; bottom: 0; top: auto; width: auto; max-height: none; height: var(--sheet-height, 174px); border-radius: 16px 16px 0 0; padding-bottom: env(safe-area-inset-bottom); transition: height 200ms ease`.
    - `.dragging` ja `prefers-reduced-motion` poistavat siirtymän.
    - `#sheet-handle` on 44 px korkea, ja siinä on 36×5 px:n keskitetty viiva. `touch-action: none` asetetaan kahvalle ja peek-riville.
    - `#info-panel h2` piilotetaan mobiilissa.
    - `#close-panel` on 44×44 ja näkyy vain, kun `[data-snap="half"]` tai `[data-snap="full"]`.
    - `.parcel-actions` piilotetaan mobiilissa.
  - Työpöydällä `#sheet-handle`, `#sheet-peek` ja `#sheet-menu` ovat `display: none`.
  - `@media print`: `#sheet-handle, #sheet-peek, #sheet-menu { display: none !important }` ja `#info-panel { height: auto !important; position: static !important }`.

- [ ] **Step 6: Tarkista selaimessa.**
  - **390×844, `?parcel=592-404-1-32`:** sheet avautuu peek-tilaan (`data-snap="peek"`, korkeus noin 140 px + safe-area), ja kiinteistö näkyy kokonaan sheetin yläpuolella. Kahvan napautus vaihtaa tilat peek → half → full → peek. Full-tilassa hakupalkki jää näkyviin. Vedä kahvaa `browser_drag`illa noin 250 px ylös peekistä, jolloin tilaksi tulee half.
  - **Valikko:** Poista valinta poistaa korostuksen kartalta, piilottaa sheetin ja poistaa `?parcel`in osoitteesta.
  - **Asettelun vaihto:** vaihda kooksi 1280×800 sheetin ollessa full-tilassa. Työpöytämittaus vastaa vertailutaulukkoa, eikä `#info-panel`illa ole `data-snap`-attribuuttia.

- [ ] **Step 7: Commit**

```bash
git add index.html style.css js tests/sheet.test.js
git commit -m "feat: bottom sheet mobiiliin, peek/half/full (#20)"
```

---

### Task 4: Välilehdet ja tiivis yhteenveto

**Files:**
- Modify: `js/ui/summary.js`, `js/ui/panel.js`, `style.css`
- Test: `tests/tabs.test.js`, `tests/summary.test.js` (laajennus)

**Interfaces:**
- Consumes: `getSheet`, `openPanelForSelection` (Task 3), `STANDS`-fixture (Task 1)
- Produces:
  - `panel.js`: `setActiveTab(name: 'summary' | 'stands' | 'recs'): void` asettaa `#info-content`ille `data-active-tab`in ja tabipainikkeille `aria-selected`in. Jos välilehteä ei ole DOMissa, käytetään `'summary'`a.
  - `panel.js`: `getActiveTab(): string`
  - `panel.js`: `initTabs(contentEl: Element): void` lisää `contentEl`iin delegoidun `click`-kuuntelijan, joka kutsuu `setActiveTab(button.dataset.tab)`ia. `initPanel` kutsuu sitä.
  - `summary.js`: `renderPeek({ label, areaText, partsInfo, stats, featureCount }): string`. Peek-rivillä näkyvät tunnus, ⋯-painike `#sheet-menu-btn` ja neljä avainlukua: pinta-ala (ha), kuvioiden määrä, m³/ha keskiarvo ja m³ yhteensä. Jos `featureCount === 0`, avainlukujen tilalla on teksti "Ei metsävaratietoja".
  - `showSummary` kirjoittaa `#sheet-peek`iin `renderPeek`in tuloksen ja `#info-content`iin seuraavan rakenteen:
    - Ensin `<div class="tabbar" role="tablist">` ja sen painikkeet `button[data-tab]`. Tekstit ovat "Yhteenveto", "Kuviot (N)" ja "Ehdotukset". Ehdotukset tulee vain, jos ehdotuksia on.
    - Sitten `<section class="tab-panel" data-tab="summary">`, jossa ovat nykyiset kiinteistöosio, mittausvuosi ja yhteenvedon neljä osiota.
    - Sitten `data-tab="recs"`, jossa ovat hakkuu- ja hoitoehdotukset, jos niitä on.
    - Viimeisenä `data-tab="stands"`, jossa on kuviolista.
    - Järjestys on sama kuin nykyinen yhden vierityksen järjestys.
    - Nollalla kuviolla tabbaria ei ole, ja `.no-data` on summary-paneelissa.
    - Lopuksi kutsutaan `setActiveTab('summary')`.

- [ ] **Step 1: Kirjoita epäonnistuvat testit.**
  - `tests/summary.test.js`:
    - `'luo kolme välilehteä kun ehdotuksia on'`: `STANDS` (kuviolla 1 on `CUTTINGTYPE`) → painikkeiden `.tabbar [data-tab]` järjestys on `['summary', 'stands', 'recs']` ja paneelien `section.tab-panel` järjestys `['summary', 'recs', 'stands']`.
    - `'ei välilehtiä ilman kuvioita'`: `[]` → `.tabbar` on `null` ja `#sheet-peek` sisältää tekstin "Ei metsävaratietoja".
    - `'peek näyttää kuvioiden määrän'`: `#sheet-peek` sisältää tekstin `3`, ja sen yhteydessä on yksikkö "kuviota".
  - `tests/tabs.test.js`:
    - `'setActiveTab merkitsee aktiivisen'`: `setActiveTab('stands')` → `#info-content`in `dataset.activeTab === 'stands'`, ja vain Kuviot-painikkeella on `aria-selected="true"`.
    - `'tuntematon tai puuttuva välilehti palaa yhteenvetoon'`: ilman recs-paneelia `setActiveTab('recs')` → `'summary'`.
    - `'uusi showSummary palauttaa yhteenvetoon'`: ensin `setActiveTab('stands')`, sitten `showSummary(STANDS, null)` → `getActiveTab() === 'summary'`.
    - `'tabipainikkeen napautus vaihtaa välilehteä'`: `initTabs(#info-content)`, sitten `.tabbar [data-tab="stands"]`.click() → `'stands'`.

- [ ] **Step 2: Aja testit.** Run: `npm test`
  Expected: FAIL (tabbar puuttuu, `setActiveTab` puuttuu).

- [ ] **Step 3: Toteuta** `setActiveTab`, `getActiveTab`, `initTabs`, `renderPeek` ja `showSummary`n uusi rakenne Interfaces-listan mukaan.

- [ ] **Step 4: Aja testit.** Run: `npm test`
  Expected: PASS

- [ ] **Step 5: Tyylit.**
  - Työpöytä: `.tabbar { display: none }` ja `.tab-panel { display: block }` ilman marginaalia tai täytettä.
  - Mobiilikysely:
    - `.tabbar` on segmentoitu valitsin: painikkeet 44 px korkeita ja pyöristys 10 px, aktiivinen havu-taustalla ja valkoisella tekstillä, tausta jäkälä.
    - `.tab-panel` on `display: none`, ja paneeli `[data-active-tab="X"] .tab-panel[data-tab="X"]` on `block`.
    - `#info-content` vierittyy. Tausta on jäkälä ja teksti kaarna.
    - `.stat-grid` on kaksi saraketta ilman laatikoita ja varjoja, ja rivien välissä on hiusviiva.
    - `.stat-value` on 22 px puolilihava `tabular-nums`, ja `.stat-label` sekä yksiköt ovat sammal-värisiä.
    - Peek: tunnus 17 px puolilihava, avainluvut 22 px (yksikkö 13 px samalla rivillä) ja neljä saraketta, alle 360 px:n leveydellä 2×2. `#sheet-menu-btn` on 44×44.
    - `.recommendations-list li` ja `.stand-header` ovat vähintään 44 px korkeita.
    - Välilehden vaihdossa on enintään 200 ms:n opacity-siirtymä. `prefers-reduced-motion` poistaa sen.
  - `@media print`: `.tabbar { display: none !important }` ja `.tab-panel { display: block !important }`.

- [ ] **Step 6: Tarkista selaimessa.**
  - **390×844:** peek näyttää tunnuksen 592-404-1-32 ja neljä avainlukua yhdellä rivillä ilman ylivuotoa. Myös 375×667:ssä `document.documentElement.scrollWidth === 375`. Half-tilassa Yhteenveto näkyy tiiviinä, Kuviot (19) näyttää kuviolistan, ja Ehdotukset näkyy, jos kiinteistöllä on ehdotuksia.
  - **Uusi haku:** Kuviot-välilehdeltä tehty uusi haku palaa Yhteenvetoon ja peek-tilaan.
  - **Tulostus:** `browser_emulate_media` `print` → kaikki `.tab-panel`-elementit ovat näkyvissä, ja `.tabbar` on piilossa.
  - **1280×800:** työpöytämittaus vastaa vertailutaulukkoa (scrollHeight ±8, sections 9, stands 19).

- [ ] **Step 7: Commit**

```bash
git add js style.css tests
git commit -m "feat: välilehdet ja tiivis yhteenveto mobiiliin (#20)"
```

---

### Task 5: Kartan ja sheetin yhteys

**Files:**
- Modify: `js/ui/stands.js`, `js/ui/map-features.js`, `js/ui/index.js`
- Test: `tests/stands.test.js`

**Interfaces:**
- Consumes: `setActiveTab` (Task 4), `getSheet`, `mapFitOptions` (Task 3), `isMobileLayout`, `visibleCenterOffset`, `topInset` (Task 2)
- Produces (`stands.js`):
  - `openStand(index: number, { win = window } = {}): boolean` palauttaa `false` eikä tee mitään, jos `index < 0`, `index >= state.currentFeatures.length` tai `.stand-item[data-index="index"]` puuttuu. Muuten se:
    - kutsuu `setActiveTab('stands')`ia
    - nostaa sheetin half-tilaan, jos se on peek-tilassa (`getSheet()?.`, koska testeissä sheetiä ei ole luotu)
    - sulkee muut avatut kuviot (`.expanded` ja `▲` → `▼`)
    - avaa kohteen
    - kutsuu `highlightStand(index, true)`ia
    - kutsuu `item.scrollIntoView?.({ block: 'start', behavior: 'smooth' })`ia
    - palauttaa `true`.
  - `highlightStand` keskittää kartan mobiilissa näkyvään alueeseen: `map.panTo(map.unproject(map.project(latLng).add(visibleCenterOffset(sheet.targetHeight(), topInset()))))`. Työpöydällä keskitys on ennallaan `panTo([lat, lng])`.
  - `highlightFilteredStands` käyttää `fitBounds`issa `mapFitOptions({ maxZoom: state.map.getZoom() })`. Työpöydällä tulos on sama `padding: [50, 50]` kuin ennen.
- Produces (`map-features.js`): `onEachFeature`in klikkaus avaa mobiilissa `openStand(state.currentFeatures.indexOf(feature))`n ja työpöydällä `showFeaturePopup`in.

- [ ] **Step 1: Kirjoita epäonnistuvat testit** `tests/stands.test.js`. `state.map` ja `state.highlightedStandLayer` korvataan valeobjekteilla (`panTo`, `project`, `unproject`, `getZoom`; `clearLayers`, `addData`). `state.currentFeatures` asetetaan `setState`illa `STANDS`iksi, ja DOM renderöidään `showSummary(STANDS, null)`:lla.
  - `'openStand(-1) ei tee mitään'` → `false`, `getActiveTab() === 'summary'`.
  - `'openStand indeksin ulkopuolella ei tee mitään'`: `openStand(3)` → `false`.
  - `'openStand avaa Kuviot-välilehden ja kuvion'`: `openStand(1)` → `true`, `getActiveTab() === 'stands'` ja `.stand-item[data-index="1"]` on `.expanded`.
  - `'openStand sulkee muut avatut'`: ensin `openStand(0)`, sitten `openStand(2)` → vain indeksi 2 on `.expanded`.

- [ ] **Step 2: Aja testit.** Run: `npm test`
  Expected: FAIL, koska `openStand` puuttuu.

- [ ] **Step 3: Toteuta** `openStand`, mobiilikeskitys ja `onEachFeature`in haarautuminen Interfaces-listan mukaan.

- [ ] **Step 4: Aja testit.** Run: `npm test`
  Expected: PASS

- [ ] **Step 5: Tarkista selaimessa.**
  - **390×844:** kartan kuvion napautus ei avaa Leaflet-popupia. Sen sijaan sheet nousee half-tilaan, Kuviot-välilehti aukeaa, kuvio on avattuna listan näkyvässä osassa, ja se on korostettuna kartalla sheetin yläpuolella. Ehdotuksen napautus Ehdotukset-välilehdellä sovittaa korostetut kuviot sheetin yläpuolelle.
  - **1280×800:** kuvion klikkaus avaa popupin kuten ennen, ja kuvion avaus listasta keskittää sen kuten ennen.

- [ ] **Step 6: Commit**

```bash
git add js tests/stands.test.js
git commit -m "feat: kartan kuvio avaa sheetin kuviolistan mobiilissa (#20)"
```

---

### Task 6: Selitteet napautuksella

**Files:**
- Modify: `js/ui/tips.js`, `js/ui/panel.js` (kutsu `initTips`), `style.css`
- Test: `tests/tips.test.js`

**Interfaces:**
- Consumes: `isMobileLayout` (Task 2), `tip(key)` (Task 1)
- Produces (`tips.js`):
  - `initTips(root: Element, { win = window } = {}): void` lisää delegoidun `click`-kuuntelijan ja `keydown`-kuuntelijan (Escape) `root`iin.
    - **Napautus `.info-tip`issä** kutsuu `stopPropagation`ia ja vaihtaa tilaa.
      - Mobiilissa avaus lisää `.open`-luokan ja lisää elementin `<div class="tip-inline" role="note">teksti</div>` heti lähimmän elementin `.detail-row, .stat-item, h3` jälkeen.
      - Työpöydällä avaus lisää vain `.open`-luokan, jolloin nykyinen kelluva vihje näkyy.
    - Kerrallaan on auki yksi. Uuden avaus sulkee edellisen (poistaa `.open`in ja `.tip-inline`n).
    - Saman napautus sulkee sen, ja Escape sulkee avoimen.
  - `closeTips(root: Element): void`

- [ ] **Step 1: Kirjoita epäonnistuvat testit** `tests/tips.test.js`. DOM: kaksi `.detail-row`a, joissa kummassakin `tip('kehitysluokka')` ja `tip('kasvupaikka')`. `win` on mobiili-vale.
  - `'napautus avaa selitteen termin alle'` → yksi `.tip-inline`, joka on ensimmäisen `.detail-row`n `nextElementSibling` ja jonka teksti on `TOOLTIPS.kehitysluokka`.
  - `'toinen napautus sulkee'` → `.tip-inline` ja `.open` ovat poissa.
  - `'vain yksi auki kerrallaan'` → ensin toisen avaus, sitten ensimmäisen → yksi `.tip-inline`, jonka teksti on `TOOLTIPS.kasvupaikka`.
  - `'Escape sulkee'`.
  - `'työpöydällä ei lisätä riviä'`: `win` on työpöytä-vale → `.open` on, `.tip-inline` puuttuu.

- [ ] **Step 2: Aja testit.** Run: `npm test`
  Expected: FAIL, koska `initTips` puuttuu.

- [ ] **Step 3: Toteuta** `initTips` ja `closeTips`, ja kutsu `initTips(document.getElementById('info-content'))` `initPanel`issa. `showSummary` kutsuu `closeTips`iä ennen uutta renderöintiä.

- [ ] **Step 4: Aja testit.** Run: `npm test`
  Expected: PASS

- [ ] **Step 5: Tyylit.**
  - Mobiilikysely:
    - `.info-tip` saa 44×44 px:n kosketusalueen pseudoelementillä: `::before`, `position: absolute; inset: -15px`. Kuvake pysyy 14 px:n kokoisena.
    - `.info-tip-text` on aina `display: none`. Myös hover piilotetaan mobiilissa.
    - `.tip-inline` on sammal-värinen teksti 14 px jäkälä-taustalla, ja siinä on vasen havu-reunus 3 px. `.stat-grid`in sisällä sillä on `grid-column: 1 / -1`.
  - Työpöytä: `.info-tip.open .info-tip-text { display: block }`.

- [ ] **Step 6: Tarkista selaimessa.**
  - **390×844:** "Kuviota (i)" -napautus näyttää selitteen rivinä statistiikan alla, ja toinen napautus sulkee sen. Avatun kuvion "Kehitysluokka (i)" toimii samoin. Kosketusalueen `getBoundingClientRect` on vähintään 44×44 (mitataan `::before`ista `elementFromPoint`illa kuvakkeen keskeltä ±20 px).
  - **1280×800:** hover näyttää kelluvan vihjeen kuten ennen.

- [ ] **Step 7: Commit**

```bash
git add js style.css tests/tips.test.js
git commit -m "feat: selitteet avautuvat napautuksella (#20)"
```

---

### Task 7: Karttakontrollit ja nauha sheetin yllä

**Files:**
- Modify: `js/app.js` (`initMap`, `initLayers`), `js/state.js` (`layersControl`), `js/ui/panel.js` (zoomin paikka asettelun vaihtuessa), `index.html` (`#map-strip`), `style.css`

**Interfaces:**
- Consumes: `onLayoutChange`, `isMobileLayout` (Task 2), `--sheet-offset` (Task 3)
- Produces: `state.layersControl`. Lisää `state.js`:ään `layersControl` (`setState('layersControl', ...)`).

Tässä tehtävässä ei ole uutta puhdasta logiikkaa. Toteutus on Leaflet-kontrollien uudelleenjärjestelyä ja CSS:ää, joten testiaskelena ajetaan olemassa oleva testisarja regressiona ja tarkistus tehdään selaimessa.

- [ ] **Step 1: Yhdistä tasovalitsimet.** `initMap` tallentaa `L.control.layers(baseLayers, null, …)`in tilaan `state.layersControl`. `initLayers` kutsuu toisen kontrollin luomisen sijaan `state.layersControl.addOverlay(state.habitatLayer, 'Luontokohteet')`ia ja `addOverlay(state.mkiLayer, 'Metsänkäyttöilmoitukset')`ia.

- [ ] **Step 2: Zoomin paikka.** `initPanel` asettaa `state.map.zoomControl.setPosition(isMobileLayout() ? 'topright' : 'topleft')` heti ja aina `onLayoutChange`ssa. Leafletin oikea pino on tasot ja zoom. Paikannuspainike lisätään vaiheessa 3 samaan pinoon.

- [ ] **Step 3: Nauha.**
  - `index.html`: `#color-mode-control`, `#color-legend`, `#mki-color-mode-control` ja `#mki-legend` kääritään elementtiin `<div id="map-strip">`.
  - `style.css`:
    - Työpöydällä `#map-strip { display: contents }`, jolloin lasten absoluuttinen sijoittelu säilyy.
    - Mobiilissa `#map-strip` on `position: fixed; left: 8px; right: 8px; bottom: calc(var(--sheet-offset, 0px) + env(safe-area-inset-bottom) + 8px); display: flex; flex-direction: column; gap: 6px; transition: bottom 200ms`, ja lapset ovat `position: static`. Selitteet ovat yhden rivin vaakasuuntaisia ja vieritettäviä (`overflow-x: auto`).
    - Valikkojen fonttikoko on 16 px ja korkeus 44 px.
    - Leafletin kontrollit mobiilissa: `.leaflet-control-zoom a` ja `.leaflet-control-layers-toggle` ovat 44×44, ja `.leaflet-bottom` on `bottom: var(--sheet-offset, 0px)`, jolloin attribuutio näkyy sheetin yläpuolella.
    - `prefers-reduced-motion` poistaa siirtymän.

- [ ] **Step 4: Aja testit.** Run: `npm test`
  Expected: PASS (regressio)

- [ ] **Step 5: Tarkista selaimessa.**
  - **390×844, valinta auki peek-tilassa:** oikealla on yksi tasovalitsin ja sen alla zoom. Kaikki ovat vähintään 44×44, eikä mikään ole hakupalkin alla. Värivalinta ja selite näkyvät sheetin yläpuolella, ja ne nousevat, kun sheet nostetaan half-tilaan. Attribuutio "MML / Kapsi" näkyy sheetin yläpuolella.
  - **Metsänkäyttöilmoitukset:** kun ne kytketään tasovalitsimesta päälle, MKI-valinta ja -selite tulevat nauhaan.
  - **Poista valinta:** nauha laskeutuu alareunaan (`--sheet-offset` on 0).
  - **844×390, `hasTouch`:** kontrollit ja nauha eivät mene päällekkäin.
  - **1280×800:** työpöytämittaus vastaa vertailutaulukkoa sillä poikkeuksella, että `layers` on yksi kontrolli `[1222, 83]`. Värivalinta on `[10, 720]` kuten ennen.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css js
git commit -m "feat: karttakontrollit pinoon ja värinauha sheetin yllä (#20)"
```

---

### Task 8: Ohje, versio ja dokumentaatio

**Files:**
- Modify: `index.html` (ohjeikkuna), `public/version.js`, `package.json`, `package-lock.json`, `CLAUDE.md`, `README.md`, `CLAUDE-HOWTO.md`, `.claude/skills/laajennuspisteet/SKILL.md`, `.claude/skills/manuaalinen-testaus/SKILL.md`

- [ ] **Step 1: Ohjeikkuna.**
  - "Miten käytän sovellusta?" kirjoitetaan neutraaliksi, jolloin se sopii molempiin asetteluihin: "Valitse kiinteistö kartalta tai hae tunnuksella", "Tietopaneeliin avautuu yhteenveto", "Valitse kuvio listasta tai kartalta". Sanoja "klikkaa", "sivupaneeli", "oikeasta yläkulmasta" ja "vasemman alareunan valikko" ei käytetä.
  - Väritys- ja tasokohdat viittaavat "värivalintaan" ja "tasovalitsimeen" ilman sijaintia.
  - Lisätään kohta "Puhelimella": tietopaneelia vedetään tai napautetaan kahvasta, ja välilehdet ovat Yhteenveto, Kuviot ja Ehdotukset.
  - Alaosaan lisätään linkki `<a href="tietosuoja.html" target="_blank">Tietosuojaseloste</a>` (sääntö 5.1.1(i)).
  - Muutoslokiin lisätään `v3.2.0 2026-11-09 Mobiilikäyttöliittymä: koko näytön kartta, tietopaneeli alareunassa, välilehdet` ja `v3.1.0 2026-11-09 Automaattinen julkaisu ja yksikkötestit`.

- [ ] **Step 2: Versio.** `public/version.js`: `number: '3.2.0'`, `date: '2026-11-09'`. Run: `npm version 3.2.0 --no-git-tag-version`, joka päivittää myös lukitustiedoston.
  Expected: `package.json` ja `package-lock.json` ovat versiossa `3.2.0`.

- [ ] **Step 3: Dokumentaatio.**
  - `CLAUDE.md`: Architecture-osioon lisätään lyhyt kuvaus `js/ui/`-tiedostoista. Lisäksi lisätään huomio, että mobiiliasettelu valitaan `MOBILE_QUERY`llä (CSS ja `js/ui/layout.js` pidetään samana) ja että työpöytä yli 768 px:n leveydellä säilyy ennallaan.
  - `laajennuspisteet`: `js/ui.js`-viittaukset vaihdetaan oikeisiin tiedostoihin (`map-features.js`, `summary.js`, `stands.js`). Uusi tilasto lisätään `summary.js`:n oikeaan `tab-panel`iin.
  - `manuaalinen-testaus`: kohta 15 korvataan mobiilin tarkistuslistalla. Siihen kuuluvat peek/half/full, välilehdet, kuvion napautus kartalla, selitteet, 44 px:n kohteet, vaakasuunta, tulostus ja safe-area iPhonella.
  - `README.md`: rakennekuvaan `js/ui/`.
  - `CLAUDE-HOWTO.md:34`: korjataan väite, ettei build-vaihetta ole.

- [ ] **Step 4: Aja testit ja build.** Run: `npm test && npm run build`
  Expected: testit PASS, build onnistuu, ja `dist/version.js` sisältää `3.2.0`.

- [ ] **Step 5: Lopputarkistus.** Käy `manuaalinen-testaus`-skillin uusi mobiilitarkistuslista läpi koossa 390×844, sekä työpöytämittaus 1280×800:ssa.
  Expected: kaikki kohdat ok. Työpöydän ainoa poikkeama vertailutaulukosta on yksi tasovalitsin, ja konsolissa ei ole virheitä.

- [ ] **Step 6: Commit**

```bash
git add index.html public/version.js package.json package-lock.json CLAUDE.md README.md CLAUDE-HOWTO.md .claude/skills
git commit -m "docs: ohje mobiiliin, tietosuojalinkki ja versio 3.2.0 (#20)"
```

Laitetestaus oikealla iPhonella Safarissa (safe-area, kahvan veto, näppäimistö hakukentässä) tehdään, kun PR on yhdistetty ja Pages julkaistu.
