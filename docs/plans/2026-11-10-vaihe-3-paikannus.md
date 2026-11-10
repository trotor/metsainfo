# Vaihe 3: paikannus — toteutussuunnitelma

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Oma sijainti kartalla, keskitys ja suunta, "Olet kuviolla" -rivi ja automaattinen kiinteistövalinta (spec luku 5.1). Toimii verkossa ja iOS-sovelluksessa. Versio 3.3.0.

**Architecture:** Alustariippuvat osat ovat `js/platform/`-moduuleissa: `location.js` (Capacitorin Geolocation natiivissa, `navigator.geolocation` verkossa) ja `compass.js` (`deviceorientation`). Puhdas logiikka on tiedostossa `js/location/logic.js`, ja sitä testataan Vitestillä. Kartta, painike ja rivi ovat tiedostossa `js/ui/location-ui.js`.

**Tech Stack:** `@capacitor/geolocation` 8.2.4, Leaflet 1.9.4, proj4.

**Spec:** [2026-07-28-mobiilisovellukset-design.md](2026-07-28-mobiilisovellukset-design.md), luku 5.1. Lupateksti on luvussa 7.

## Global Constraints

- Sijaintipiste on sininen `#1a73e8` (`--sijainti`), ja sen ympärillä on tarkkuusympyrä. Yli 30 sekuntia vanha sijainti näytetään harmaana.
- Painikkeen tilat: pois → keskitys → keskitys + suunta → pois. Suunta jätetään pois, jos kompassia ei ole.
- Kartan vetäminen lopettaa keskityksen, mutta piste pysyy näkyvissä (tila `show`). Painikkeen napautus palauttaa keskityksen.
- "Olet kuviolla" -rivillä näkyvät kuvionumero, pääpuulaji, m³/ha ja kehitysluokka. Rivin tausta on havu ja teksti valkoinen. Napautus avaa kuvion (`openStand`). Sheetin sisältö ei hyppää itsestään.
- Kun kiinteistöä ei ole valittu, ensimmäinen sijainti valitsee kiinteistön, jonka sisällä käyttäjä on. Tämä tehdään kerran per paikannuksen käynnistys. Tarvittaessa zoomataan ensin tasolle 13.
- Kun käyttäjä on valitun kiinteistön ulkopuolella, rivi näyttää tekstin "Valitun kiinteistön ulkopuolella". Napautus valitsee kiinteistön, jonka sisällä sijainti on.
- Vain etualan sijainti. Kieltäytyminen ei estä käyttöä, ja käyttäjälle näytetään ohje.
- iOS: `NSLocationWhenInUseUsageDescription` = "Sijaintia käytetään oman paikan näyttämiseen kartalla ja sen tunnistamiseen, millä metsikkökuviolla olet."
- Työpöydän asettelu säilyy. Sijaintipainike tulee työpöydällä zoomin alle.

## Review Focus

1. Sijainti valitun kiinteistön palstojen (`parts`) välissä: rivin on näytettävä "ulkopuolella" eikä väärää kuviota.
2. Sijaintilupa evätty tai laite ilman GPS:ää: painike palaa pois-tilaan ja näyttää ohjeen. Mitään ei kaadu.
3. Automaattivalinta ei toistu jokaisella sijaintipäivityksellä eikä ohita käyttäjän omaa valintaa.
4. Kuvio vaihtuu kävellessä: rivi päivittyy, mutta aktiivinen välilehti ja vieritys eivät muutu.
5. Sheetin peek-korkeus kasvaa, kun rivi on näkyvissä, eikä peitä avainlukuja.

---

### Task 1: Paikannuslogiikka

**Files:** Create `js/location/logic.js`. Test `tests/location.test.js`.

**Produces:**
- `latLonTo3067(lat, lon): [x, y]`
- `findFeatureIndexAt(features, point): number` palauttaa ensimmäisen kuvion, jonka geometria sisältää pisteen, tai -1.
- `findParcelAt(parcels: Iterable<Feature>, point): Feature | null`
- `isInsideParcel(currentParcel, point): boolean` tarkistaa `currentParcel.parts`-taulukon, jos se on olemassa, ja muuten `currentParcel.geometry`n.
- `nextFollowMode(mode, hasCompass): 'off' | 'follow' | 'heading'`. Siirtymät:
  - `off` ja `show` → `follow`
  - `follow` → `heading`, jos kompassi on, muuten `off`
  - `heading` → `off`
- `isStale(timestamp, now, maxAgeMs = 30000): boolean`
- `hereRowModel({ hasParcel, inside, feature }): { kind: 'stand' | 'outside' | 'none', text }`. Mallin tekstit:
  - `stand`: `Kuvio 7 · Kuusi · 148 m³/ha · Varttunut kasvatusmetsikkö`. Puuttuvat osat jätetään pois.
  - `outside`: "Valitun kiinteistön ulkopuolella"
  - `none`: kun kiinteistöä ei ole tai sijainti on kiinteistöllä mutta ei kuviolla. Teksti on "Ei kuviotietoa tässä kohdassa", jos kiinteistö on valittu.

- [ ] Kirjoita testit, joissa käytetään `STANDS`-fixturea (pisteet `[500050, 6822050]` → 0, `[500150, 6822050]` → 1, `[499000, 6822050]` → -1), kaksiosaista kiinteistöä palstojen välisellä pisteellä, `nextFollowMode`n kaikkia siirtymiä, `isStale`n rajaa 30 000 ms ja `hereRowModel`in kolmea tapausta. Aja ja totea FAIL.
- [ ] Toteuta. Aja ja totea PASS. Commit.

### Task 2: Alustarajapinnat ja iOS-lupa

**Files:** Create `js/platform/location.js` ja `js/platform/compass.js`. Modify `package.json` (`@capacitor/geolocation@8.2.4`), `ios/App/App/Info.plist`. Test `tests/platform-location.test.js`.

**Produces:**
- `normalizePosition(raw): { lat, lon, accuracy, heading, timestamp }` hyväksyy sekä Capacitorin että selaimen muodon (`coords.latitude`…).
- `classifyLocationError(err): 'denied' | 'unavailable' | 'timeout'`. Selaimen koodit ovat 1/2/3, ja Capacitorin viesti sisältää sanan "denied" tai "permission".
- `watchPosition(onPosition, onError): Promise<() => void>`
- `compassSupported(win = window): boolean`, `requestCompassPermission(win = window): Promise<boolean>`, `watchCompass(cb, win = window): () => void`. `watchCompass` käyttää `webkitCompassHeading`ia. Jos sitä ei ole, se käyttää `deviceorientationabsolute`-tapahtuman `alpha`a: `(360 - alpha) % 360`.
- `headingFromEvent(e): number | null`

- [ ] Testaa `normalizePosition`, `classifyLocationError` ja `headingFromEvent` (webkit, absolute alpha 90 → 270, puuttuva → null). FAIL → toteuta → PASS.
- [ ] Asenna plugin. Lisää lupateksti Info.plistiin. Aja `npm run ios:sync`. Commit.

### Task 3: Sijainti kartalla ja painike

**Files:** Create `js/ui/location-ui.js`. Modify `js/app.js` (`initLocation`), `js/ui/sheet.js` (peek-lisä), `style.css`, `index.html` (`#here-row`, `#toast`). Test `tests/sheet.test.js` (laajennus).

**Produces:**
- `computeSnapHeights(viewportHeight, topInset, safeBottom = 0, peekExtra = 0)`: `peek = 140 + safeBottom + peekExtra`.
- `createSheet` saa metodin `setPeekExtra(px)`, joka laskee korkeudet uudelleen.
- `initLocation({ selectParcel })` lisää painikkeen `L.Control` oikeaan yläpinoon (mobiili) tai zoomin alle (työpöytä). Lisäksi se lisää sijaintipisteen (`L.circleMarker`), tarkkuusympyrän (`L.circle`), suuntakartion (`L.marker` + divIcon, kierto `transform`) ja kuviokorostuksen (oma `L.geoJSON`-taso, sininen katkoviiva).
- `refreshHereRow()`, jota `app.js` kutsuu `showSummary`n jälkeen.
- `showToast(text, ms = 5000)`

- [ ] Testi: `computeSnapHeights(844, 64, 34, 48).peek === 222`. FAIL → toteuta → PASS.
- [ ] Toteuta UI. Kiinteistöjen latauksen jälkeen `app.js` lähettää tapahtuman `document.dispatchEvent(new CustomEvent('parcels-loaded'))`. Automaattivalinta odottaa tätä tapahtumaa, jos ensimmäisellä sijainnilla kiinteistöjä ei vielä ole.
- [ ] Selain (Playwright `context.setGeolocation` + `grantPermissions`):
  - 390×844: napautus → piste näkyy, kartta keskittyy, ja kiinteistö 592-404-1-32 valitaan automaattisesti, kun sijainti on sen sisällä.
  - Rivi näyttää kuvion, ja sen napautus avaa Kuviot-välilehden.
  - Kun sijainti siirretään ulos, rivi näyttää tekstin "Valitun kiinteistön ulkopuolella".
  - Evätty lupa näyttää ohjeen.
  - 1280×800: työpöytämittaus ennallaan, ja painike on zoomin alla.
- [ ] Commit.

### Task 4: Ohje, versio ja laite

**Files:** `index.html` (ohje ja muutosloki), `public/version.js` ja `package.json` (3.3.0), `CLAUDE.md`, `manuaalinen-testaus`.

- [ ] Lisää ohjeeseen kohta "Oma sijainti" ja muutoslokiin rivi `v3.3.0 Oma sijainti, keskitys ja suunta, Olet kuviolla -tieto`.
- [ ] Aja `npm test` ja `npm run build`. Aja sitten `npm run ios:sync`, rakenna Release iPhonelle ja asenna `devicectl`illä.
- [ ] Commit.
