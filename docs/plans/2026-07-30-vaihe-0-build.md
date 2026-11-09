# Vaihe 0: Vite-build — toteutussuunnitelma

> **Agenteille:** PAKOLLINEN ALITAITO: käytä `superpowers:subagent-driven-development` (suositus) tai `superpowers:executing-plans` tämän suunnitelman toteuttamiseen tehtävä kerrallaan. Vaiheet käyttävät valintaruutusyntaksia (`- [ ]`) etenemisen seurantaan.

**Issue**: #20 · **Spec**: [2026-07-28-mobiilisovellukset-design.md](2026-07-28-mobiilisovellukset-design.md) vaihe 0

**Tavoite:** Lisätä Metsäinfoon npm- ja Vite-pohjainen build-vaihe, siirtää CDN-kirjastot paikallisiksi riippuvuuksiksi ja automatisoida verkkosovelluksen julkaisu — **muuttamatta sovelluksen toimintaa lainkaan**.

**Arkkitehtuuri:** Vite ottaa `index.html`:n entrypointiksi ja rakentaa `dist/`-hakemistoon. CDN-tagit korvataan npm-riippuvuuksilla, jotka tarjoillaan sovelluskoodille globaaleina `window.L` ja `window.proj4` — nykyinen koodi käyttää niitä globaaleina eikä sitä kirjoiteta tässä vaiheessa uusiksi. GitHub Actions rakentaa ja julkaisee `dist/`-sisällön `gh-pages`-haaraan, joka on jo Pagesin lähde.

**Teknologiat:** Vite 8, Vitest 4, Leaflet 1.9.4, Proj4js 2.9.0, Proj4Leaflet 1.0.2, Node 24 LTS, vähintään 24.15 (`.nvmrc`; jsdom 30 vaatii `^22.22.2 || ^24.15.0`, Capacitor 8 vähintään Node 22)

> **Päivitetty 9.11.2026:** suunnitelma tarkistettu ennen toteutusta. Muutokset: Node-vaatimus (yllä), `.nvmrc` (tehtävä 1), `version.js` siirtyy `public/`-hakemistoon (tehtävä 3 — Vite ei kopioi tavallista `<script>`-tagia buildiin, todennettu Vite 8.3.7:llä), Actions-versiot v4 → v7 ja Node-versio `.nvmrc`:stä (tehtävä 4), dokumentaation `version.js`-polut (tehtävä 5).

## Globaalit rajoitteet

Nämä koskevat jokaista tehtävää.

- **Ei toiminnallista muutosta.** Sovelluksen ulkoasun ja käyttäytymisen on oltava identtinen ennen ja jälkeen. Tämä on vaiheen ainoa hyväksymiskriteeri.
- **Riippuvuudet pinnataan täsmälleen CDN:n tarjoamiin versioihin**: `leaflet@1.9.4`, `proj4@2.9.0`, `proj4leaflet@1.0.2`. Ei caret-merkkejä (`^`) näille kolmelle. Versionostot ovat oma päätöksensä, ei tämän vaiheen sivutuote.
- **`base: './'`** Viten konfiguraatiossa. Suhteelliset polut ovat pakolliset sekä GitHub Pagesin alipolulle `/metsainfo/` että Capacitorille, joka lataa sovelluksen `capacitor://localhost`-juuresta.
- **Julkaistut osoitteet eivät muutu**: `https://trotor.github.io/metsainfo/` ja `https://trotor.github.io/metsainfo/tietosuoja.html`. Jälkimmäinen on jo annettu kauppalomakkeisiin.
- **GitHub Pagesin asetusta ei kosketa.** Lähde pysyy `gh-pages`-haarana, polku `/`. Muutos tehdään siihen, mitä haaraan kirjoitetaan.
- **`gh-pages`-haaraa ei enää päivitetä käsin** tämän vaiheen jälkeen — Actions omistaa sen.
- **Käyttöliittymän kieli on suomi.** Mikään näkyvä teksti ei muutu tässä vaiheessa.

## Lähtötilanne

- `index.html` lataa neljä ulkoista resurssia CDN:stä (rivit 11, 14, 17, 20) ja `version.js`:n tavallisena skriptinä (rivi 23).
- `js/config.js` kutsuu `proj4.defs()` ja `new L.Proj.CRS()` **moduulin latausaikana** (rivit 6 ja 9). Latausjärjestys on siksi kriittinen: proj4 ja Leaflet on oltava globaaleina ennen kuin `config.js` evaluoituu.
- `js/app.js` on ainoa moduuli-entrypoint (`<script type="module" src="js/app.js">`, rivi 213), ja sen ensimmäinen tuonti on `./config.js`.
- Sovelluksessa **ei ole** Leafletin oletusmarkkereita — `js/ui.js:133` käyttää `L.divIcon()`. Niputtajien klassinen markkerikuvaongelma ei siis koske tätä projektia.
- `main` ja `gh-pages` osoittavat tällä hetkellä samaan committiin: sivusto tarjoillaan repon juuresta sellaisenaan, mukaan lukien `CLAUDE.md`, `docs/` ja `mcp-server/`.
- Testikehystä ei ole.

## Tiedostorakenne

| Tiedosto | Vastuu | Tehtävä |
|----------|--------|---------|
| `package.json` | npm-projekti, riippuvuudet, skriptit | 1 |
| `vite.config.js` | Build- ja testikonfiguraatio | 1 |
| `.gitignore` | `node_modules/` ja `dist/` pois versionhallinnasta | 1 |
| `.nvmrc` | Node-versio kehityskoneelle ja CI:lle | 1 |
| `js/vendor/globals.js` | Tuo Leaflet ja proj4, asettaa ne globaaleiksi | 2 |
| `js/vendor/index.js` | Takaa latausjärjestyksen: globaalit ennen Proj4Leafletia | 2 |
| `js/app.js` | Lisätään vendor-tuonti ensimmäiseksi (muuten ennallaan) | 2 |
| `index.html` | CDN-tagit pois, Leafletin CSS tuonniksi | 2 |
| `tests/utils.test.js` | Koordinaattimuunnosten ja geometrian testit | 2 |
| `public/tietosuoja.html` | Siirretään juuresta; Vite kopioi buildiin | 3 |
| `public/version.js` | Siirretään juuresta; Vite kopioi buildiin, polku `version.js` säilyy | 3 |
| `.github/workflows/deploy.yml` | Build ja julkaisu gh-pages-haaraan | 4 |
| `README.md`, `CLAUDE.md` | Kehitysohjeet vastaamaan todellisuutta | 5 |

`js/`-moduuleihin ei kosketa `app.js`:n yhtä tuontiriviä lukuun ottamatta. `style.css` ja `mcp-server/` säilyvät ennallaan. `version.js`:n sisältö säilyy, mutta tiedosto siirtyy `public/`-hakemistoon (tehtävä 3).

---

## Tehtävä 1: npm-projekti ja Vite

**Tiedostot:**
- Luo: `package.json`
- Luo: `vite.config.js`
- Muokkaa: `.gitignore`
- Luo: `.nvmrc`

**Rajapinnat:**
- Tuottaa: npm-skriptit `dev`, `build`, `preview`, `test`; Viten `base: './'` ja `outDir: 'dist'`.

Tässä tehtävässä **CDN-tagit jäävät paikoilleen**. Tarkoitus on todentaa, että Vite tarjoilee nykyisen sovelluksen muuttumattomana ennen kuin riippuvuuksiin kosketaan. Jos jokin menee rikki myöhemmin, tiedät sen johtuvan tehtävästä 2, ei työkaluketjusta.

- [ ] **Vaihe 0: Luo `.nvmrc` ja ota Node-versio käyttöön**

```bash
echo 24 > .nvmrc
nvm use
node -v
```

Odotettu: `v24.15.0` tai uudempi. Vanhemmalla 24-versiolla jsdom ei asennu tehtävässä 2 (`EBADENGINE`). Korjaus: `nvm install 24`.

- [ ] **Vaihe 1: Luo `package.json`**

```json
{
  "name": "metsainfo",
  "version": "3.0.0",
  "description": "Suomen metsävaratiedot kartalla",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vite": "^8.1.5"
  }
}
```

- [ ] **Vaihe 2: Asenna riippuvuudet**

Aja: `npm install`
Odotettu: `node_modules/` syntyy, `package-lock.json` syntyy, ei virheitä.

- [ ] **Vaihe 3: Luo `vite.config.js`**

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
    // Suhteelliset polut: vaaditaan sekä GitHub Pagesin alipolulle
    // (/metsainfo/) että Capacitorille (capacitor://localhost)
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
});
```

- [ ] **Vaihe 4: Käynnistä kehityspalvelin ja todenna sovellus ennallaan**

Aja: `npm run dev`
Avaa selaimessa Viten tulostama osoite (oletuksena `http://localhost:5173`).

Tarkista silmämääräisesti:
- Kartta latautuu ja on keskitetty Suolahden seudulle
- Versiomerkki otsikkorivillä näyttää `v3.0.0`
- Zoomaa lähemmäs → kiinteistörajat ilmestyvät
- Hae kiinteistötunnus `592-404-1-32` → kartta siirtyy ja sivupaneeliin tulee yhteenveto
- Selaimen konsolissa **ei ole virheitä**

Jos jokin näistä epäonnistuu, pysähdy — vika on Viten konfiguraatiossa, ei sovelluksessa.

Sammuta palvelin (Ctrl+C).

- [ ] **Vaihe 5: Päivitä `.gitignore`**

Lisää tiedoston loppuun:

```gitignore
# Node ja build
node_modules/
dist/
```

- [ ] **Vaihe 6: Todenna että build tuottaa jotain järkevää**

Aja: `npm run build`
Odotettu: `dist/` syntyy ja sisältää `index.html`:n sekä `assets/`-hakemiston.

Aja: `npm run preview`
Odotettu: sovellus toimii samalla tavalla kuin kehityspalvelimella. Sammuta (Ctrl+C).

- [ ] **Vaihe 7: Commit**

```bash
git add package.json package-lock.json vite.config.js .gitignore .nvmrc
git commit -m "build: lisää Vite-build-vaihe (#20)"
```

---

## Tehtävä 2: CDN-kirjastot npm-riippuvuuksiksi

**Tiedostot:**
- Luo: `js/vendor/globals.js`
- Luo: `js/vendor/index.js`
- Luo: `tests/utils.test.js`
- Muokkaa: `js/app.js` (tuontirivit alussa)
- Muokkaa: `index.html:10-20` (CDN-tagit)
- Muokkaa: `package.json` (riippuvuudet ja testiskripti)
- Muokkaa: `vite.config.js` (testikonfiguraatio)

**Rajapinnat:**
- Kuluttaa: tehtävän 1 Vite-konfiguraatio.
- Tuottaa: `js/vendor/index.js`, jonka tuonti asettaa `window.L` (Leaflet, laajennettuna `L.Proj`-nimiavaruudella) ja `window.proj4`. Moduuli ei vie ulos mitään — sen vaikutus on sivuvaikutus.

**Miksi globaalit eikä tuonnit joka moduuliin:** `js/config.js`, `js/utils.js`, `js/ui.js` ja `js/app.js` käyttävät `L`- ja `proj4`-tunnisteita globaaleina yhteensä yli 30 kohdassa. Niiden muuttaminen tuonneiksi olisi laaja muutos, joka rikkoisi tämän vaiheen ainoan säännön. Globaalit poistetaan vaiheessa 1, kun moduulirakenne muutenkin liikkuu.

**Miksi kaksi vendor-tiedostoa:** ES-moduulien tuonnit nostetaan (hoisting) ja evaluoidaan ennen moduulin omaa koodia. Jos `import 'proj4leaflet'` ja `window.L = L` olisivat samassa tiedostossa, Proj4Leaflet ajautuisi ennen globaalien asettamista. Kahdella tiedostolla evaluointijärjestys on taattu: `globals.js` on `index.js`:n ensimmäinen tuonti, joten se ajetaan kokonaan ensin.

- [ ] **Vaihe 1: Asenna riippuvuudet täsmällisillä versioilla**

Aja:
```bash
npm install --save-exact leaflet@1.9.4 proj4@2.9.0 proj4leaflet@1.0.2
npm install --save-dev vitest@^4.1.10 jsdom@^30.0.1
```

Odotettu: `package.json`:n `dependencies`-lohkossa versiot ilman `^`-merkkiä.

- [ ] **Vaihe 2: Lisää testikonfiguraatio `vite.config.js`:ään**

Korvaa tiedoston sisältö:

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
    // Suhteelliset polut: vaaditaan sekä GitHub Pagesin alipolulle
    // (/metsainfo/) että Capacitorille (capacitor://localhost)
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true
    },
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.js']
    }
});
```

- [ ] **Vaihe 3: Kirjoita epäonnistuva testi**

Luo `tests/utils.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import '../js/vendor/index.js';
import { coordsEPSG3067ToLatLng, pointInPolygon3067, normalizeParcelId } from '../js/utils.js';

describe('coordsEPSG3067ToLatLng', () => {
    it('muuntaa UTM-vyöhykkeen 35 keskimeridiaanin tasan 27 asteeksi', () => {
        // Itäkoordinaatti 500000 on määritelmän mukaan vyöhykkeen 35
        // keskimeridiaani, joka on 27°E. Tämä on matemaattinen tosiasia,
        // ei proj4:n toteutuksesta johdettu arvo.
        const latLng = coordsEPSG3067ToLatLng([500000, 6822000]);
        expect(latLng.lng).toBeCloseTo(27, 9);
        expect(latLng.lat).toBeCloseTo(61.53158462496459, 9);
    });

    it('muuntaa Keski-Suomen pisteen odotetusti', () => {
        // Vertailuarvo laskettu proj4 2.9.0:lla. Testi lukitsee nykyisen
        // käyttäytymisen: jos proj4-versio vaihtuu ja tulos muuttuu,
        // tämä kertoo siitä ennen kuin kartta menee vinoon.
        const latLng = coordsEPSG3067ToLatLng([432000, 6923000]);
        expect(latLng.lng).toBeCloseTo(25.68297593148831, 9);
        expect(latLng.lat).toBeCloseTo(62.432002347939275, 9);
    });

    it('palauttaa Leafletin LatLng-olion', () => {
        const latLng = coordsEPSG3067ToLatLng([432000, 6923000]);
        expect(typeof latLng.distanceTo).toBe('function');
    });
});

describe('pointInPolygon3067', () => {
    const neliö = {
        type: 'Polygon',
        coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]
    };

    it('tunnistaa sisäpuolisen pisteen', () => {
        expect(pointInPolygon3067([5, 5], neliö)).toBe(true);
    });

    it('tunnistaa ulkopuolisen pisteen', () => {
        expect(pointInPolygon3067([15, 5], neliö)).toBe(false);
    });

    it('palauttaa false kun geometria puuttuu', () => {
        expect(pointInPolygon3067([5, 5], null)).toBe(false);
    });
});

describe('normalizeParcelId', () => {
    it('muuntaa väliviivamuodon 14-numeroiseksi tunnukseksi', () => {
        expect(normalizeParcelId('592-404-1-32')).toBe('59240400010032');
    });
});
```

- [ ] **Vaihe 4: Aja testit ja todenna että ne epäonnistuvat**

Aja: `npm test`
Odotettu: EPÄONNISTUU virheeseen, joka koskee puuttuvaa tiedostoa `js/vendor/index.js` (`Failed to resolve import`).

Tämä on oikea epäonnistuminen — moduulia ei ole vielä olemassa.

- [ ] **Vaihe 5: Luo `js/vendor/globals.js`**

```javascript
/**
 * Asettaa Leafletin ja proj4:n globaaleiksi.
 *
 * Sovelluskoodi (config.js, utils.js, ui.js, app.js) käyttää tunnisteita
 * `L` ja `proj4` globaaleina, kuten CDN-latauksen aikaan. Tämä moduuli
 * tarjoaa ne npm-paketeista.
 *
 * ÄLÄ tuo Proj4Leafletia tässä tiedostossa — ks. index.js.
 */
import L from 'leaflet';
import proj4 from 'proj4';
import 'leaflet/dist/leaflet.css';

window.L = L;
window.proj4 = proj4;
```

- [ ] **Vaihe 6: Luo `js/vendor/index.js`**

```javascript
/**
 * Vendor-kirjastojen latausjärjestys.
 *
 * Proj4Leaflet on laajennus, joka odottaa Leafletin ja proj4:n olevan
 * saatavilla, ja liittää `L.Proj`-nimiavaruuden. ES-moduulien tuonnit
 * evaluoidaan syvyyssuunnassa tuontijärjestyksessä, joten globals.js
 * ajetaan kokonaan ennen proj4leafletia.
 *
 * Tämän moduulin on oltava app.js:n ENSIMMÄINEN tuonti, koska
 * js/config.js kutsuu proj4.defs() ja new L.Proj.CRS() latausaikana.
 */
import './globals.js';
import 'proj4leaflet';
```

- [ ] **Vaihe 7: Aja testit ja todenna että ne menevät läpi**

Aja: `npm test`
Odotettu: kaikki 8 testiä LÄPI.

Jos `coordsEPSG3067ToLatLng`-testit epäonnistuvat siihen, ettei `L.Proj` ole määritelty, tarkista että `index.js`:n tuontijärjestys on juuri yllä kuvattu.

- [ ] **Vaihe 8: Lisää vendor-tuonti `js/app.js`:ään**

Muokkaa tiedoston tuontilohkoa niin, että vendor on **ensimmäisenä**:

```javascript
/**
 * Metsäinfo - Suomen metsävaratiedot kartalla
 *
 * Main application module: initialization, map setup, event handling
 */

// Vendor-kirjastot globaaleiksi — tämän on oltava ensimmäinen tuonti,
// koska config.js käyttää proj4:ää ja L:ää latausaikana
import './vendor/index.js';

import { CONFIG, crsEPSG3067 } from './config.js';
```

Loput tuontirivit säilyvät ennallaan.

- [ ] **Vaihe 9: Poista CDN-tagit `index.html`:stä**

Korvaa rivit 10–20 (Leafletin CSS, proj4, Leaflet, Proj4Leaflet) — koko lohko poistuu. Tiedoston `<head>` alkaa muutoksen jälkeen näin:

```html
<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metsäinfo - Suomen metsävaratiedot kartalla</title>
    <meta name="description" content="Interaktiivinen karttasovellus Suomen metsävaratietojen tarkasteluun. Hae kiinteistötunnuksella tai klikkaa kartalta.">
    <meta name="author" content="Tero Rönkkö">

    <!-- Version info -->
    <script src="version.js"></script>

    <!-- Custom styles -->
    <link rel="stylesheet" href="style.css">
</head>
```

Leafletin CSS tulee nyt `js/vendor/globals.js`:n tuonnista, joten erillistä `<link>`-tagia ei tarvita.

- [ ] **Vaihe 10: Todenna sovellus kehityspalvelimella**

Aja: `npm run dev`

Käy läpi sama tarkistuslista kuin tehtävässä 1 vaiheessa 4, ja lisäksi:
- Karttatasovalitsin oikeassa yläkulmassa näyttää oikein muotoillulta (todistaa että Leafletin CSS latautui)
- Klikkaa kiinteistöä → kuviot värittyvät vihreän sävyillä
- Verkkovälilehdessä **ei ole pyyntöjä** osoitteisiin `unpkg.com` tai `cdnjs.cloudflare.com`

Sammuta palvelin.

- [ ] **Vaihe 11: Commit**

```bash
git add package.json package-lock.json vite.config.js js/vendor/ js/app.js index.html tests/
git commit -m "build: siirrä CDN-kirjastot npm-riippuvuuksiksi (#20)"
```

---

## Tehtävä 3: Tietosuojaseloste ja versiotiedosto buildiin, tuotantobuildin todennus

**Tiedostot:**
- Siirrä: `tietosuoja.html` → `public/tietosuoja.html`
- Siirrä: `version.js` → `public/version.js`

**Rajapinnat:**
- Kuluttaa: tehtävän 1 `outDir: 'dist'`.
- Tuottaa: `dist/tietosuoja.html`, joka vastaa osoitetta `https://trotor.github.io/metsainfo/tietosuoja.html`, ja `dist/version.js`.

Vite kopioi `public/`-hakemiston sisällön sellaisenaan buildin juureen. Ilman tätä siirtoa tietosuojaseloste katoaisi julkaisusta, ja kauppalomakkeisiin annettu osoite lakkaisi toimimasta.

**Miksi myös `version.js`:** Vite jättää `<script src="version.js">`-tagin (ilman `type="module"`) koskematta `index.html`:ään, mutta **ei kopioi tiedostoa `dist/`-hakemistoon**. Tuotannossa tagi osoittaisi olemattomaan tiedostoon ja inline-skripti kaatuisi virheeseen `VERSION is not defined`. Kehityspalvelimella vika ei näy, koska se tarjoilee repon juuren. `public/`-hakemistossa polku säilyy samana (`version.js`), joten `index.html`:ää ei tarvitse muuttaa. Todennettu Vite 8.3.7:llä 9.11.2026.

- [ ] **Vaihe 1: Siirrä tiedostot**

```bash
mkdir -p public
git mv tietosuoja.html public/tietosuoja.html
git mv version.js public/version.js
```

Build tulostaa tämän jälkeen varoituksen `<script src="version.js"> in "/index.html" can't be bundled without type="module" attribute`. Varoitus on odotettu ja harmiton: tiedostoa ei ole tarkoituskaan niputtaa.

- [ ] **Vaihe 2: Rakenna ja todenna hakemistorakenne**

Aja: `npm run build`

Aja: `ls dist/`
Odotettu: hakemisto sisältää vähintään `index.html`, `tietosuoja.html`, `version.js` ja `assets/`.

Aja: `ls dist/ | grep -c "CLAUDE\|mcp-server\|docs"`
Odotettu: `0` — lähdekoodi ja dokumentaatio eivät päädy julkaistavaan sisältöön.

- [ ] **Vaihe 3: Todenna tuotantobuild selaimessa**

Aja: `npm run preview`

Tarkista:
- Sovellus toimii identtisesti kehityspalvelimeen verrattuna
- Versiomerkki näyttää `v3.0.0` (todistaa että `version.js` ja sitä käyttävä inline-skripti selvisivät buildista)
- Avaa `/tietosuoja.html` → seloste latautuu tyyleineen
- Selaimen konsolissa ei virheitä

Sammuta palvelin.

- [ ] **Vaihe 4: Todenna suhteelliset polut**

Aja: `grep -o 'src="[^"]*"' dist/index.html`
Odotettu: `src="version.js"` sekä `./assets/`-alkuiset polut. Mikään polku ei saa alkaa `/`-merkillä — absoluuttinen polku rikkoisi sekä `/metsainfo/`-alipolun että Capacitorin.

- [ ] **Vaihe 5: Commit**

```bash
git add public/ tietosuoja.html version.js
git commit -m "build: siirrä tietosuojaseloste ja versiotiedosto public-hakemistoon (#20)"
```

---

## Tehtävä 4: Automaattinen julkaisu GitHub Actionsilla

**Tiedostot:**
- Luo: `.github/workflows/deploy.yml`

**Rajapinnat:**
- Kuluttaa: tehtävän 1 `npm run build` ja tehtävän 3 `dist/`-rakenne.
- Tuottaa: julkaisuputki, joka kirjoittaa `dist/`-sisällön `gh-pages`-haaraan jokaisella `main`-pushilla.

**Tausta:** GitHub Pages on jo konfiguroitu tarjoilemaan `gh-pages`-haaran juuresta. Tällä hetkellä haara osoittaa samaan committiin kuin `main`, eli sivusto tarjoillaan lähdekoodihakemistosta. Muutoksen jälkeen haaraan kirjoitetaan vain buildin tulos. **Pagesin asetuksia ei tarvitse muuttaa.**

- [ ] **Vaihe 1: Luo työnkulku**

Luo `.github/workflows/deploy.yml`:

```yaml
name: Julkaise GitHub Pagesiin

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: pages-deploy
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Hae lähdekoodi
        uses: actions/checkout@v7

      - name: Asenna Node
        uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Asenna riippuvuudet
        run: npm ci

      - name: Aja testit
        run: npm test

      - name: Rakenna
        run: npm run build

      - name: Julkaise gh-pages-haaraan
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
```

Testit ajetaan ennen buildia tarkoituksella: rikkinäinen koordinaattimuunnos ei saa päätyä tuotantoon.

- [ ] **Vaihe 2: Commit ja push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: julkaise verkkosovellus automaattisesti gh-pages-haaraan (#20)"
git push origin main
```

- [ ] **Vaihe 3: Seuraa ajoa**

Aja: `gh run watch`
Odotettu: kaikki vaiheet vihreitä. Jos `npm ci` epäonnistuu, `package-lock.json` puuttuu commitista.

- [ ] **Vaihe 4: Todenna julkaistu sivusto**

Odota noin minuutti Pagesin päivittymistä.

Aja:
```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://trotor.github.io/metsainfo/
curl -sS -o /dev/null -w "%{http_code}\n" https://trotor.github.io/metsainfo/tietosuoja.html
curl -sS -o /dev/null -w "%{http_code}\n" https://trotor.github.io/metsainfo/version.js
```
Odotettu: kaikki kolme `200`.

Avaa `https://trotor.github.io/metsainfo/` selaimessa ja käy läpi tehtävän 2 vaiheen 10 tarkistuslista. **Tämä on koko vaiheen tärkein todennus** — tuotantosivuston on toimittava identtisesti entiseen verrattuna.

Aja: `curl -sS https://trotor.github.io/metsainfo/CLAUDE.md -o /dev/null -w "%{http_code}\n"`
Odotettu: `404` — lähdekoodi ja dokumentaatio eivät ole enää julkisesti tarjolla sivustolta.

- [ ] **Vaihe 5: Jos sivusto on rikki, palauta**

```bash
git revert --no-edit HEAD
git push origin main
```

Actions julkaisee edellisen toimivan buildin. Älä yritä korjata tuotantoa eteenpäin — palauta ensin, korjaa sitten rauhassa.

---

## Tehtävä 5: Dokumentaation päivitys

**Tiedostot:**
- Muokkaa: `README.md` (kehitysohjeet, hakemistopuu)
- Muokkaa: `CLAUDE.md` (Development-osio, `version.js`-polut)
- Muokkaa: `public/version.js`

**Rajapinnat:**
- Kuluttaa: tehtävien 1–4 komennot.

Nykyinen dokumentaatio sanoo, ettei projektissa ole build-vaihetta eikä riippuvuuksia asennettavaksi. Se ei enää pidä paikkaansa, ja väärä ohje on pahempi kuin puuttuva.

- [ ] **Vaihe 1: Päivitä `CLAUDE.md`:n Development-osio**

Nykyinen osio alkaa otsikolla `## Development` ja päättyy riviin `No build step, package manager, or dependencies to install. All libraries are loaded from CDN.` Korvaa koko osio tällä (huomaa: alla neljä aaltoviivaa ulompana rajaimena, itse tiedostoon tulee tavallinen kolmen merkin lohko):

````
## Development

```bash
npm install          # ensimmäisellä kerralla
npm run dev          # kehityspalvelin, oletuksena http://localhost:5173
npm test             # yksikkötestit (Vitest)
npm run build        # tuotantobuild dist/-hakemistoon
npm run preview      # tuotantobuildin esikatselu
```

Verkkosovellus julkaistaan automaattisesti GitHub Actionsilla `gh-pages`-haaraan
jokaisella `main`-pushilla. Älä päivitä `gh-pages`-haaraa käsin.

Kirjastot (Leaflet, Proj4js, Proj4Leaflet) ovat npm-riippuvuuksia ja pinnattu
täsmällisiin versioihin. Ne asetetaan globaaleiksi `js/vendor/`-moduuleissa,
koska sovelluskoodi käyttää `L`- ja `proj4`-tunnisteita globaaleina.
````

- [ ] **Vaihe 2: Päivitä `README.md`**

Osio `## Kehitys` alkaa rivillä 141. Korvaa rivit 143–153 (johdantolause, komentolohko, avausohje ja lause "Ei build-vaihetta, ei riippuvuuksia asennettavaksi.") tällä:

````
Kloonaa repositorio, asenna riippuvuudet ja käynnistä kehityspalvelin:

```bash
git clone git@github.com:trotor/metsainfo.git
cd metsainfo
npm install
npm run dev
```

Avaa selaimessa osoite, jonka Vite tulostaa (oletuksena http://localhost:5173).

Muut komennot: `npm test` ajaa yksikkötestit, `npm run build` rakentaa
tuotantoversion `dist/`-hakemistoon ja `npm run preview` esikatselee sen.
````

Päivitä lisäksi hakemistopuu (rivi 124): `├── version.js          # Versiotiedot` → `├── public/             # Sellaisenaan buildiin kopioitavat (version.js, tietosuoja.html)`.

- [ ] **Vaihe 2b: Päivitä `CLAUDE.md`:n `version.js`-viittaukset**

Tiedosto on nyt `public/version.js`. Muuta polku kahdessa kohdassa:
- Otsikko `### version.js is not a module` ja sen kappale: lisää loppuun lause *"It lives in `public/` so Vite copies it to `dist/` unchanged — a classic `<script>` tag is not bundled."*
- Version Management -osion `update the version number in \`version.js\`` → `public/version.js`.

Aja lopuksi: `grep -rn 'version\.js' CLAUDE.md README.md .claude/`
Odotettu: jokainen osuma joko viittaa `public/version.js`:ään tai on `<script src="version.js">`-tagin kuvaus.

- [ ] **Vaihe 3: Päivitä `manuaalinen-testaus`-skilli**

Tiedostossa `.claude/skills/manuaalinen-testaus/SKILL.md` kohta "Start server: `python3 -m http.server 8080`" korvataan komennolla `npm run dev`, ja portti `8080` muutetaan portiksi `5173`.

- [ ] **Vaihe 4: Nosta versionumero**

Muokkaa `public/version.js` (päivämääräksi toteutuspäivä):

```javascript
const VERSION = {
    number: '3.1.0',
    date: 'VVVV-KK-PP',
    author: 'Tero Rönkkö'
};
```

Minor-nosto: kehitysympäristö muuttuu, sovelluksen toiminta ei.

- [ ] **Vaihe 5: Todenna ja committoi**

Aja: `npm run build && npm run preview`
Tarkista: versiomerkki näyttää `v3.1.0`.

```bash
git add CLAUDE.md README.md .claude/skills/manuaalinen-testaus/SKILL.md public/version.js
git commit -m "docs: päivitä kehitysohjeet vastaamaan build-vaihetta (#20)"
git push origin main
```

- [ ] **Vaihe 6: Todenna julkaisu vielä kerran**

Aja: `gh run watch`, ja tarkista sitten että `https://trotor.github.io/metsainfo/` näyttää versiomerkin `v3.1.0`.

---

## Vaiheen hyväksymiskriteerit

- [ ] `npm run dev`, `npm test`, `npm run build` ja `npm run preview` toimivat puhtaalta kloonilta `npm install`-komennon jälkeen
- [ ] Sovellus toimii tuotannossa identtisesti muutosta edeltäneeseen verrattuna — kartta, haku, kuviotiedot, väritys, CSV, tulostus
- [ ] Verkkopyynnöissä ei ole yhtään CDN-osoitetta
- [ ] `https://trotor.github.io/metsainfo/tietosuoja.html` vastaa `200`
- [ ] `https://trotor.github.io/metsainfo/CLAUDE.md` vastaa `404`
- [ ] Kaikki 8 yksikkötestiä menevät läpi CI:ssä
- [ ] `gh-pages`-haaraan ei ole tehty käsin committeja

## Tunnetut sudenkuopat

| Oire | Syy | Korjaus |
|------|-----|---------|
| `L.Proj is not a constructor` | Proj4Leaflet latautui ennen globaaleja | Tarkista `js/vendor/index.js`:n tuontijärjestys |
| `proj4 is not defined` moduulin latauksessa | Vendor-tuonti ei ole `app.js`:n ensimmäinen | Siirrä `import './vendor/index.js'` ennen kaikkia muita tuonteja |
| Kartta latautuu, mutta kontrollit näyttävät tyylittömiltä | Leafletin CSS puuttuu | Varmista `import 'leaflet/dist/leaflet.css'` tiedostossa `globals.js` |
| Sivusto 404 GitHub Pagesissa | Absoluuttiset polut | `base: './'` puuttuu `vite.config.js`:stä |
| `VERSION is not defined` vain tuotannossa / previewssä | `version.js` ei ole `public/`-hakemistossa, joten Vite ei kopioinut sitä `dist/`-hakemistoon | `git mv version.js public/version.js` (tehtävä 3). Tagin on myös oltava `<script src="version.js">` ilman `type="module"` |
| `npm install` antaa `EBADENGINE` jsdomista | Node on vanhempi kuin 24.15 | `nvm install 24 && nvm use` |
| Actions epäonnistuu `npm ci` -vaiheessa | `package-lock.json` puuttuu versionhallinnasta | `git add package-lock.json` |
