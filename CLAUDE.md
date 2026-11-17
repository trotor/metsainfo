# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Metsäinfo is a client-side web application for viewing Finnish forest data (metsävaratiedot) on an interactive map. Users click cadastral parcels to see aggregated forest statistics. No backend server required.

**Live demo**: https://trotor.github.io/metsainfo/

## Development

```bash
npm install          # ensimmäisellä kerralla
npm run dev          # kehityspalvelin, oletuksena http://localhost:5173
npm test             # yksikkötestit (Vitest)
npm run build        # tuotantobuild dist/-hakemistoon
npm run preview      # tuotantobuildin esikatselu
npm run ios:sync     # build + versio iOS-projektiin + cap sync ios
npm run ios:open     # avaa ios/App/App.xcodeproj Xcodessa
npm run android:sync # build + versio Android-projektiin + cap sync android
npm run android:open # avaa android/ Android Studiossa
```

### iOS-sovellus (Capacitor 8)
- `capacitor.config.json`: appId `fi.inetor.metsainfo`, webDir `dist`. `ios/` on versionhallinnassa (SPM, ei CocoaPodsia), vain iPhone, tiimi Inetor oy `TTND84D98U`.
- Sovelluskoodi ei kutsu Capacitor-plugineja suoraan vaan `js/platform/`-moduuleja. `isNative()` erottaa sovelluksen verkkoversiosta; sovelluksessa linkki ja CSV jaetaan iOS:n jakonäkymällä, tulostus on piilotettu ja jaettavat linkit osoittavat julkiseen verkkoversioon.
- Versio: **yksi yhteinen versio** verkossa, App Storessa ja Google Playssa (`public/version.js` `number`, 4.0.0 alkaen). **Näkyvää versionumeroa ei käytetä kahdesti** (Tero 16.11.2026): jokainen kauppaan tai TestFlightiin ladattu build saa uuden näkyvän version, myös hylätyn tilalle tuleva. Ladatut versiot ovat `scripts/kaytetyt-versiot.json`:ssa; `sync-version.mjs` kieltäytyy käytetystä tai pienemmästä numerosta. Latauksen jälkeen `node scripts/sync-version.mjs --kaytetty` (kauppa) tai `--kaytetty-kokeilu`. `scripts/sync-version.mjs` kirjoittaa sen `MARKETING_VERSION`iksi ja git-committien määrän build-numeroksi. Aja `npm run ios:sync` ennen jokaista iOS-buildia.
- `ios/App/App/PrivacyInfo.xcprivacy` ja Info.plistin käyttötarkoitustekstit: tarkista aina, kun lisäät pluginin. Geolocation-plugin vaatii myös avaimen `NSLocationAlwaysAndWhenInUseUsageDescription` (ITMS-90683), vaikka sovellus pyytää vain etualan luvan.
- App Store Connect: `fastlane/` (Fastfile, kauppatekstit `fastlane/metadata/fi/`, tarkastusmuistiinpanot yksityisessä repossa). API-avain ja App Reviewn yhteystiedot tulevat ympäristöstä: `source ~/code/appstoreconnect.env` — ei koskaan repoon. Lanet: `check`, `metadata`, `screenshots`, `availability` (jakelu vain Suomeen), `release_settings` (ikäluokitus 4+, sisältöoikeudet, hinta ilmainen, uusin kelvollinen build versioon), `submit` (lähettää App Reviewiin; vain käyttäjän luvalla). App Privacy -kysely ja DSA-kauppiastieto eivät onnistu API-avaimella, vaan ne täytetään selaimessa. Buildin lataus: `xcodebuild -exportArchive` `destination = upload` -asetuksella (Xcoden kirjautunut tili).
- Kauppakuvat otetaan vain kuvitteellisesta Esimerkkimetsästä kuvitteellisella saarella (ei oikeaa karttaa) kuvaustilassa (`npm run build:kuvat` / `dev:kuvat`, `js/demo/kuvaustila.js`), ei koskaan oikealta kiinteistöltä. Ohje: yksityisen repon `kauppa/kauppatekstit.md` → Kuvakaappaukset.
- **Julkaisupolun tiedot eivät ole tässä julkisessa repossa** (Tero 17.11.2026): julkaisuloki (versiot, buildit, ASC/Play-tunnisteet), kauppatekstien taustat, App Review -ohje ja -muistiinpanot, tietosuojalomakkeiden vastaukset ja kaupalliset suunnitelmat ovat yksityisessä repossa `trotor/metsainfo-julkaisu` (paikallisesti `~/code/metsainfo-julkaisu`, `fastlane` lukee sen polusta `METSAINFO_JULKAISU`). **Myös kaikki suunnitelmat** (suunnittelu- ja toteutusdokumentit, luonnoskuvat) ovat siellä kansiossa `suunnitelmat/`: tässä repossa `docs/plans` on gitignoroitu paikallinen symlinkki sinne, joten uudet suunnitelmat kirjoitetaan `docs/plans/`-polkuun (ei `docs/superpowers/`) ja commitoidaan ja pushataan yksityisessä repossa. `tests/julkinen-repo.test.js` kaatuu, jos suunnitelmia, julkaisupolun tiedostoja, henkilökohtainen sähköposti tai oikea esimerkkikiinteistö päätyy tähän repoon. Esimerkkikiinteistö on kuvitteellinen `999-1-1-1`. **Issuet (työlista) ovat yksityisessä repossa** (`gh issue … -R trotor/metsainfo-julkaisu`); koodikommenttien ja committien issue-numerot (`#34`) viittaavat sinne, paitsi ennen 17.11.2026 tehdyissä commiteissa numerot 22–36, jotka ovat nyt 21–35. Tämän repon issuet ovat ulkopuolisten virheilmoituksia varten. Ei sähköpostiosoitteita, tarjouskoodeja, kauppojen sisäisiä tunnisteita, hinnoittelu- tai liiketoimintasuunnitelmia eikä oikeiden kiinteistöjen tietoja sisältäviä kuvia tähän repoon.
- Paikannus: `js/platform/location.js` (Capacitor Geolocation / navigator.geolocation), `js/platform/compass.js`, puhdas logiikka `js/location/logic.js`, käyttöliittymä `js/ui/location-ui.js`. Vain evätty lupa lopettaa seurannan; tilapäiset katkot eivät. Sijaintipiste piirretään omaan paneeliin `locationPane` kuviotasojen yläpuolelle.

### Lisäosat ja kokeilut (eriytettävät toiminnot)
- Maksulliset ja kokeilussa olevat toiminnot pidetään irrotettavina omaksi lisäosakseen tai omaan sovellukseensa. Rekisteri ja säännöt: `js/features.js`. Vertailu: yksityisen repon `suunnitelmat/2026-11-16-maastotila-erillinen-sovellus.md`.
- Jokainen toiminto omassa hakemistossaan (`js/maasto/`, `js/lahihaku/`, `js/suosikit/`, `js/korkeusmalli/`, `js/asetukset/`, `js/saavutettavuus/`, `js/valinta/`, `js/rajoitteet/`, `js/retkeily/`, `js/arvovari/`, `js/huomiot/`) omine teksteineen ja käyttöohjeen osioineen (`ohjeOsio`, lisätään `js/ui/ohje-osiot.js`:n `addHelpSection`illa): `teksti.js` vie `TEKSTIT = { fi, sv, en }` ja `T = pick(TEKSTIT)` (`js/i18n.js`, avainten vastaavuus testataan `tests/kieli.test.js`:ssä). Koodiston nimet `codeName()` (`js/koodit.js`; englanti epävirallinen). Sovelluksen omat tekstit: `js/ui/teksti.js`, `js/ui/estimate-teksti.js`, `js/ui/sivu-teksti.js` (index.html `data-i18n`), `js/ui/ohje-en.js`. Kielivalinta vain kokeilubuildissa; tavallinen build on aina suomeksi (`initialLang`). Suomenkielinen tuloste on lukittu tilannekuviin (`tests/suomi-snapshot.test.js`): päivitä niitä (`vitest -u`) vain, kun suomenkielistä tekstiä muutetaan tarkoituksella. Yhteinen tieto vain jaetuista moduuleista: REST 2.0 ja ruutuvälimuisti `js/rest2.js`, kuvion tulkinta (puulajiryhmä, vallitseva puulaji) `js/kuviotieto.js`, kortti `js/ui/kortti.js` (kerrallaan yksi kortti auki), napit `js/ui/tyokalut.js` (käyttöliittymä B: työkalu Työkalut-listaan `registerTool`, sovelluksen osa ☰-valikkoon `registerMenuItem`, kuvioiden väritys Väritys-valitsimeen `registerColorMode`; ei omia karttanappeja, ohjeen osio "Työkalut ja valikko" kootaan rekisteristä), paikannus `js/location/` ja `js/ui/location-ui.js` (`onPositionChange`, `requestLocation`), koodistot `js/config.js`. Ei tuonteja toisen toiminnon hakemistosta; viestit toiminnolta toiselle ja sovellukselta toiminnoille `js/vayla.js`:n kautta (esim. yhteenveto piirretty, avaa kiinteistö, tallenna suosikki).
- Avaus aina `isUnlocked(id)`:llä. Maastotila, lähihaku, saavutettavuus, puuston arvo -väritys (`js/arvovari/`) ja huomiot (`js/huomiot/`, pistemuotoiset muistiinpanot kartalle, vain laitteelle) kuuluvat nyt hinta-arvion kertaostoon (saavutettavuudesta voi tulla oma maksullinen lisäosa, ja se mainitaan käyttäjälle), suosikit, korkeusmalli, asetukset, kuviovalinta, rajoitteet (muinaisjäännökset, suojelualueet, METE) ja retkeily (LIPAS) ovat maksuttomat (`product: null`). Saavutettavuusindeksin kuvaus: `docs/saavutettavuusindeksi.md` (päivitä, kun painoja tai osia muutetaan). Kuviovalinta (`js/valinta/`) näyttää valinnan sovelluksen omana yhteenvetona näennäiskiinteistönä (`properties.valinta`, `parts` Feature-muotoisina, `VIESTIT.naytaValinta`); yhteenveto, hinta-arvio ja saavutettavuus vaihtavat silloin kiinteistö-sanat valinta-sanoiksi.
- Kokeilut vain kokeilubuildissa: `VITE_KOKEILU=1` (`npm run dev:kokeilu`, `build:kokeilu`, `ios:sync:kokeilu`), dynaaminen import `app.js`:ssä, ei merkintöjä `index.html`:ään. Tavallinen build ei sisällä koodia; `sync-version.mjs` kieltäytyy kauppabuildista, jos `dist/` sisältää kokeilukoodia (`KOKEILU_MARKERS`: lisää uuden toiminnon kortin luokka). iOS-kokeilubuild menee omaan TestFlight-versiojonoon (`version.js` `kokeilu`, 4.0.902 → 4.0.903 → …; kasvatetaan ennen jokaista latausta, ja kokeilubuild näyttää tämän numeron), ei koskaan kauppaversioon. Palautus latauksen jälkeen: `git checkout ios/App/App.xcodeproj/project.pbxproj`, `npm run build`, `npx cap copy ios`.

### Android-sovellus (Capacitor 8)
- `android/` on versionhallinnassa: applicationId `fi.inetor.metsainfo`, minSdk 24, target 36. Komentoriviltä `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`.
- Versio: `scripts/sync-version.mjs` kirjoittaa saman `number`-version `versionName`ksi ja committien määrän `versionCode`ksi (`npm run android:sync`).
- Release-allekirjoitus: upload-avain `~/Documents/keystores/metsainfo-upload.jks`, salasanat `~/Documents/keystores/metsainfo-keystore.properties` (tai `METSAINFO_KEYSTORE_PROPERTIES`). Ei koskaan repoon; Play App Signing hallitsee varsinaista avainta.
- Takaisin-painike: `js/ui/back.js` (puhdas logiikka) + `js/platform/back-button.js` (`@capacitor/app`): sulkee ohjeen, valikon ja pienentää paneelin ennen poistumista.
- Sijainti: Android-plugin käyttää muuten aikakatkaisua päivitysvälinä, siksi `interval`/`minimumUpdateInterval` on annettu `NATIVE_OPTIONS`issa.
- Testaus emulaattorilla: debug-buildin WebView näkyy DevToolsille (`adb forward tcp:9333 localabstract:webview_devtools_remote_<pid>`), sijainti `adb emu geo fix <lon> <lat>`.
- Google Play: `fastlane android check|build|metadata|internal`, tekstit ja kuvat `fastlane/android/metadata/fi-FI` (ei `fastlane/metadata/android`, koska iOS:n deliver tulkitsisi sen kielikansioksi). Palvelutili on Inetorin yhteinen `tassutie-play-uploader`: `source ~/code/googleplay.env` (`HEARTH_PLAY_JSON`) tai `GOOGLE_PLAY_JSON_KEY`. Build kieltäytyy ilman upload-avainta ja tarkistaa allekirjoittajan; ohjeet myös `app-store-release`-skillissä. Uusi sovellus hyväksyy API:n kautta vain luonnosjulkaisuja; maarajaus (vain Suomi), Data safety ja IARC-luokitus tehdään Play Consolessa.

Verkkosovellus julkaistaan automaattisesti GitHub Actionsilla `gh-pages`-haaraan
jokaisella `main`-pushilla. Älä päivitä `gh-pages`-haaraa käsin.

Kirjastot (Leaflet, Proj4js, Proj4Leaflet) ovat npm-riippuvuuksia ja pinnattu
täsmällisiin versioihin. Ne asetetaan globaaleiksi `js/vendor/`-moduuleissa,
koska sovelluskoodi käyttää `L`- ja `proj4`-tunnisteita globaaleina.
`style.css` tuodaan `js/app.js`:ssä vendorin jälkeen, jotta omat tyylit
ohittavat Leafletin oletukset.

## Architecture

### UI modules (`js/ui/`)
- `summary.js` renders the panel (tab panels `summary` / `recs` / `stands` + mobile peek row), `stands.js` the stand list and map highlights, `panel.js` panel state (tabs, ⋯ menu, sheet wiring, `mapFitOptions()`), `sheet.js` the mobile bottom sheet (peek / half / full), `layout.js` layout detection, `tips.js` tap-to-open term explanations, `map-features.js` popups, `legend.js` colour modes, `actions.js` help / link / CSV. `index.js` re-exports them.
- **Mobile layout** is selected by `MOBILE_QUERY` in `js/ui/layout.js`, identical to the mobile media query in `style.css` — keep them the same. Desktop (> 768 px) must stay functionally unchanged; mobile-only styles go inside that media query.

### Data Sources (WFS)
- **Metsäkeskus** (`avoin.metsakeskus.fi`) - Forest stand data (`v1:stand`), forest use declarations (`v1:forestusedeclaration`)
- **MML INSPIRE** (`inspire-wfs.maanmittauslaitos.fi`) - Cadastral parcel boundaries (`cp:CadastralParcel`)

### MCP Server

The `mcp-server/` directory provides a FastMCP Python server that exposes forest data lookup as an MCP tool for AI assistants (Claude Code, Claude Desktop, etc.).

- **Tools**: `hae_metsavaratieto(kiinteistotunnus)` — human-readable summary; `hae_raakadata(kiinteistotunnus)` — raw JSON data for AI analysis
- **Framework**: FastMCP Python (part of official MCP SDK)
- **Run**: `uv run --with fastmcp --with certifi fastmcp run mcp-server/server.py`
- **Config**: `.mcp.json` in project root (Claude Code auto-discovers this)
- **Pipeline**: `pipeline.py` is a port of the browser-side JS (`data.js`, `utils.js`, `statistics.js`). Keep them in sync when modifying WFS queries, geometry logic, or statistics calculation.
- **Dependencies**: `fastmcp`, `certifi` (installed automatically via `uv run --with`)

### Coordinate Handling
The map uses EPSG:3067 (Finnish national projection) natively via Proj4Leaflet CRS. Base map tiles from Kapsi use EPSG:3067 tile grid. WFS data also uses EPSG:3067. The `coordsEPSG3067ToLatLng()` function converts coordinates to WGS84 LatLng for Leaflet's internal use. Geometry operations (`pointInPolygon3067`, `getGeometryBounds3067`) work in EPSG:3067.

### Code Mappings (CODES object)

**IMPORTANT:** All code mappings must match the official Metsäkeskus WFS specification:
- **Official source:** https://www.metsakeskus.fi/sites/default/files/document/avoin-metsatieto-wfs-stand-habitat-koodisto-ja-tietokantakuvaus.xlsx
- **Local reference:** [KOODISTO.md](KOODISTO.md)

The `CODES` object in `js/config.js` maps numeric IDs to Finnish names. When modifying or adding codes, always verify against the official Metsäkeskus documentation. Key mappings:
- `treeSpecies` - Tree species (1-30)
- `cuttingType` - Cutting/logging types (0-94)
- `silvicultureType` - Silviculture operations (1-5)
- `developmentClass` - Forest development stages (A0, S0, T1, T2, 02-05, Y1, ER)
- `drainageState` - Drainage status (1-3, 6-9)
- `soilType` - Soil types (10-80)
- `fertilityClass` - Site fertility (1-8)
- `accessibility` - Harvesting accessibility (1-5)
- `mainGroup` - Land use category (1-8)
- `cuttingPurpose` - Forest use declaration cutting purpose (1-6)

## Reference (loaded on demand)

These live as skills in `.claude/skills/` so they don't sit in context every session:

- **`wfs-rajapinnat`** – WFS endpoints, request formats, response shapes and known quirks for all three data sources
- **`laajennuspisteet`** – which files to touch when adding a map layer, statistic, search mode, code mapping, color mode, or WFS source
- **`manuaalinen-testaus`** – manual verification checklist (UI has no automated tests)

## Common Pitfalls

### Coordinates – most common source of bugs
- WFS returns EPSG:3067 (meters). Leaflet uses WGS84 (degrees) internally.
- **Never mix them.** Use `coordsEPSG3067ToLatLng()` when converting WFS data → Leaflet LatLng.
- Geometry operations (`pointInPolygon3067`, `getGeometryBounds3067`) work in EPSG:3067. Do NOT convert to WGS84 first.
- WFS bbox parameters must be EPSG:3067 coordinates. Converting map bounds: `proj4('WGS84', 'EPSG:3067', [lng, lat])`.

### CODES object
- All codes come from official Metsäkeskus xlsx specification. Never invent codes.
- If WFS returns an unknown code, display the raw number (don't hide data).
- Always verify against [KOODISTO.md](KOODISTO.md) and the [official source](https://www.metsakeskus.fi/sites/default/files/document/avoin-metsatieto-wfs-stand-habitat-koodisto-ja-tietokantakuvaus.xlsx).

### WFS requests
- Metsäkeskus WFS returns max ~2000 features per request.
- Too large bbox → silently missing features (no error, just incomplete data).
- HTTP 200 + empty FeatureCollection = no data in area, not an error.
- 10m buffer is added to bbox in `fetchForestDataByBounds()` to catch edge features.

### HTML rendering
- `showSummary()` and `renderStandItem()` build HTML as template strings.
- WFS data is generally safe, but always sanitize any user input before inserting into HTML.
- Use `formatNumber()` for all numeric display (handles fi-FI locale, comma as decimal separator).

### version.js is not a module
`version.js` is loaded as a regular `<script>`, not an ES module, so `VERSION` is available globally for the inline script in `index.html`. Don't convert it to a module. It lives in `public/` so Vite copies it to `dist/` unchanged — a classic `<script>` tag is not bundled.

### Multi-part parcels
- A single cadastral reference (e.g., 091-416-0001-0123) can have multiple geometry parts.
- `fetchParcelsByReference()` returns an array — always handle multiple features.
- `selectParcels()` combines all parts. `filterFeaturesByParcels()` checks against all parts.

## Testing

`npm test` runs Vitest unit tests (`tests/`, jsdom) for pure logic: coordinate conversion, geometry, parcel IDs. UI has no automated tests — verify it manually with the `manuaalinen-testaus` skill checklist. CI runs the tests before every deploy.

## Notes

- UI is in Finnish (Suomi)
- Parcels only load at zoom level ≥10 for performance (EPSG:3067 zoom levels)
- Forest volume colors: darker green = higher m³/ha
- Default center: Suolahti, Finland (62.57°N, 25.85°E)

## Version Management

When making changes to the application, remember to update the version number in `public/version.js`:
- **Patch** (1.x.Y): Bug fixes, minor tweaks
- **Minor** (1.X.0): New features, enhancements
- **Major** (X.0.0): Breaking changes, major rewrites

Update both `number` and `date` fields.

## AI Development Guide

See [CLAUDE-HOWTO.md](CLAUDE-HOWTO.md) for:
- How this application was built using AI (Claude Code)
- Example prompts for developing the application further
- Ideas for integrating AI features into the application itself
