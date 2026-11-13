# Versio 4.0.0: yhtenäinen versio, värikortit ja hinta-arvio — toteutussuunnitelma

> Toteutetaan inline (superpowers:executing-plans), haarassa `feature/4.0-hinta-arvio`. Testit ensin puhtaalle logiikalle.

**Goal:** Kaikki julkaisut (verkko, iOS, Android) siirtyvät samaan versioon 4.0.0. Mobiilin inforuudut värikoodataan. Kauppojen sovellukseen tulee maksullinen hinta-arvio (kertaosto 12,99 €, aloitushinta 9,99 €) ja ilmainen esimerkkimetsä.

**Spec:** [2026-11-13-hinta-arvio-ja-varikortit.md](2026-11-13-hinta-arvio-ja-varikortit.md) (ehdotus ja päätökset).

## Global Constraints

- **Yksi versionumero:** `public/version.js` `number` (x.y.z) on ainoa versio. iOS `MARKETING_VERSION`, Android `versionName` ja verkon versio luetaan siitä. Build-numero on committien määrä.
- **Hinta-arvio vain sovelluksessa:** verkkoversiossa (`!isNative()`) ei ole Arvio-välilehteä, arvo-korttia eikä ostonäkymää. Koodi saa olla repossa.
- **Ilman ostoa oikean kiinteistön summaa ei näytetä.** Esimerkkimetsässä kaikki toimii.
- **Hintalähteet:**
  1. Ensisijainen: Metsäteollisuus ry:n viikkoseuranta, Luke PxWeb `met/metryv/0100_metryv.px`.
  2. Varalla: Luken virallinen Teollisuuspuun kauppa (SVT, CC BY 4.0), `met/teokau/kk/0100_teokau.px`.
  3. Tyhjä solu täytetään varalähteestä ja sitten koko maan arvolla.
  4. Lähdemerkintä ja viikko tai kuukausi näkyvät aina.
- **Hinta-alue:** Luken "Hinta-alueet ja maakunnat 2021".
  - Kunta selvitetään kiinteistön sijainnista Tilastokeskuksen WFS:llä (`kunta4500k`, INTERSECTS).
  - Kunta → maakunta tulee staattisesta taulukosta (Tilastokeskus 2026, 308 kuntaa).
  - Kuusamo (305), Pudasjärvi (615) ja Taivalkoski (832) kuuluvat Kainuu-Koillismaahan.
  - Käyttäjä voi vaihtaa alueen.
- **Poistumaoletukset:** uudistushakkuu 100 %, harvennus 30 %, ensiharvennus 35 %. Ne näytetään selitteessä.
- **Värikortit vain mobiilissa** (`MOBILE_QUERY`). Työpöytä säilyy ennallaan. Kortin otsikko kertoo aina ryhmän.
- **Ei kolmannen osapuolen osto-SDK:ta:** iOS StoreKit 2 ja Android Play Billing omina paikallisina Capacitor-plugineina.
- **IAP-tuote:** `fi.inetor.metsainfo.hintaarvio`, non-consumable / one-time.
- **Tietosuoja:** App Privacy ja Data safety pysyvät "ei kerää". Tietosuojasivulle lisätään maininta hintahausta (Luke) ja kuntahausta (Tilastokeskus, vain kiinteistön keskipiste).

## Review Focus

1. Puuttuvat hintasolut (null) eivät saa tuottaa `NaN`-arvoa eivätkä nollaeuron kuviota ilman merkintää.
2. Verkkoversio: mikään hinta-arvion osa ei näy, eikä yksikään pyyntö mene Lukelle tai Tilastokeskukselle.
3. Ilman verkkoa: välimuistissa olevat hinnat ja omat hinnat toimivat, ja virheestä tulee selkeä ilmoitus.
4. Ostotila säilyy uudelleenkäynnistyksessä ja ilman verkkoa, ja palautus toimii.
5. Moniosainen kiinteistö: kunnan sijainti otetaan ensimmäisen palstan keskipisteestä, ja alueen voi vaihtaa.

---

### Task 1: Yhtenäinen versio 4.0.0
**Files:** `public/version.js`, `scripts/sync-version.mjs`, `tests/sync-version.test.js`, `fastlane/Fastfile`, `js/app.js`, `index.html` (muutosloki), `CLAUDE.md`.
- `parseVersionJs` lukee `number`-kentän, ja `app`-kenttä poistetaan.
- Testit: lukee `number`-kentän, hylkää `app`-pohjaisen lähteen ilman `number`ia, hyväksyy muodon x.y.z.
- Fastlanen `app_version` ja Androidin `internal`-lane lukevat `number`in.

### Task 2: Hinta-alue (`js/pricing/region.js`, `js/pricing/kunnat.js`)
- Tuotetaan:
  - `PRICE_REGIONS`: koodi, nimi, viikkotaulun koodi ja kuukausitaulun koodi
  - `regionForKunta(kunta)`: palauttaa alueen avaimen tai `null`
- Testit:
  - 592 → Keski-Suomi
  - 305 → Kainuu-Koillismaa
  - 564 (Oulu) → Pohjois-Pohjanmaa
  - 091 → Etelä-Suomi
  - 837 (Tampere) → Keski-Suomi
  - tuntematon kunta → `null`

### Task 3: Hintojen jäsennys (`js/pricing/prices.js`)
- Tuotetaan:
  - `weeklyQuery(regionCodes)` ja `monthlyQuery(regionCodes)`
  - `parseWeekly(jsonstat, regionCode)` ja `parseMonthly(...)`, jotka palauttavat `{ period, source, table }`
  - `table` on muotoa `{ uudistus|harvennus|ensiharvennus: { manty|kuusi|koivu: { tukki, kuitu } } }`
  - `fillMissing(primary, ...fallbacks)`
- Fixturet: oikeat vastaukset `tests/fixtures/`-kansioon.

### Task 4: Arviolaskenta (`js/pricing/estimate.js`)
- Tuotetaan:
  - `cuttingMethod(code)`
  - `estimateStand(props, table)`
  - `estimateParcel(features, table, { removal, years })`, joka palauttaa `{ total, byYear, stock, stands, missing }`
- Testit:
  - puulajiosuuksien normalisointi
  - pääpuulaji, kun osuudet puuttuvat
  - poistumat
  - koodi 0 (lepo) jätetään pois
  - puuttuva hinta → `missing`

### Task 5: Verkkohaut ja tallennus (`js/platform/prices.js`)
- Tuotetaan:
  - `lookupKunta(x, y)`
  - `fetchPrices(regionKey)`, joka hakee viikko- ja kuukausitaulun yhtä aikaa ja täydentää puuttuvat
  - `loadCachedPrices()`, `saveOverrides()` ja `loadOverrides()`
- localStorage käärittynä try/catchiin.

### Task 6: Värikortit
**Files:** `style.css` (värimuuttujat ja mobiilin `.card-*`), `js/ui/summary.js` (osioille ryhmäluokat).
- Testi: `tests/summary.test.js` tarkistaa osioiden ryhmäluokat.

### Task 7: Ostot
- `js/platform/purchases.js`: `isAvailable()`, `getProduct()`, `purchase()`, `restore()` ja `isEntitled()`. Tila tallennetaan välimuistiin.
- iOS: `ios/App/App/PurchasesPlugin.swift` (StoreKit 2) ja `Metsainfo.storekit` simulaattoritestiin.
- Android: `PurchasesPlugin.kt` (Billing). Androidille tehdään runko, ja kauppatuote tulee vaiheessa C.

### Task 8: Käyttöliittymä
- `js/ui/estimate.js`:
  - Arvio-välilehti: alue, hakkuutapa, hintataulukko, "Hae verkosta", tulokset ja selite
  - arvo-kortti yhteenvetoon
- `js/ui/paywall.js`: ostonäkymä.
- `public/demo/esimerkkimetsa.json`: kuvitteellinen kiinteistö.
- Tarkistus selaimessa (Playwright) ja iOS-simulaattorissa StoreKit-konfiguraatiolla.

### Task 9: Kaupat
- App Store:
  - versio 4.0.0
  - IAP rajapinnalla: hinta 12,99 €, aloitushinta 9,99 € ajastettuna hinnanmuutoksena
  - tarkastuskuva ja tarkastusmuistiinpanot
- Teron tehtävät:
  - lisää IAP:n versioon
  - App Privacy pysyy ennallaan
- Google: vaihe C.
- Lähetys kauppoihin vasta Teron luvalla.
