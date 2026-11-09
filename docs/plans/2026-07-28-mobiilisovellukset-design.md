# Android- ja iOS-mobiilisovellukset — Design

**Issue**: #20 Android- ja iOS-mobiilisovellukset kauppoihin
**Päivämäärä**: 2026-07-28 · **Katselmoitu**: 2026-11-09 (iOS ensin, App Store -vaatimukset marraskuu 2026, koodivertailu)
**Tavoite**: Julkaista Metsäinfo natiivisovelluksena Google Play -kauppaan ja Apple App Storeen, maastokäyttöön optimoiduilla lisäominaisuuksilla.

## Yleiskuvaus

Nykyinen selainsovellus paketoidaan Capacitorilla natiiviksi Android- ja iOS-sovellukseksi. Koodikanta pysyy yhtenä: sama `js/`-hakemisto palvelee GitHub Pages -verkkosovellusta ja molempia kauppaversioita. Mobiiliversioihin lisätään neljä maastokäyttöä palvelevaa ominaisuutta, jotka verkkosovelluksesta puuttuvat: sijaintiseuranta, offline-vektoridata, paikkasidonnaiset muistiinpanot valokuvineen sekä suosikit ja natiivi jako.

Nämä lisäominaisuudet eivät ole pelkkää kuorrutusta — ne ovat myös se peruste, jolla sovellus läpäisee Applen 4.2-säännön (ks. [Kauppavaatimukset](#7-kauppavaatimukset)).

## Päätökset

| Kysymys | Päätös | Perustelu |
|---------|--------|-----------|
| Kunnianhimo | Maastokäyttöön optimoitu | Todellinen lisäarvo puhelimessa, ei täyttä uudelleenkirjoitusta |
| Julkaisukanavat | Apple App Store ensin, Google Play sen jälkeen | Päätetty 9.11.2026: iPhone ja App Store julkaistaan ensin, Android-projekti ja Play-julkaisu tehdään vasta sen jälkeen. Koodikanta pysyy alustariippumattomana, joten Android ei vaadi uudelleentyötä. |
| Julkaisija | Oman yrityksen organisaatiotili | Tilit ovat jo olemassa molempiin kauppoihin; organisaatiotili vapauttaa Playn suljetun testin vaatimuksesta |
| Tekninen ratkaisu | Capacitor 8, jaettu koodikanta | Ainoa vaihtoehto, joka täyttää ominaisuustavoitteet ilman koodikannan kahdentumista |
| Build | Vite + npm, verkkosovellus buildataan `dist/`-hakemistoon | Offline vaatii paikalliset kirjastot; CDN ei kelpaa natiivissa |
| Offline-kartat | Ei esiladata karttalaattoja | Kapsi on vapaaehtoispalvelu; massalataus olisi väärinkäyttöä. Vain vektoridata offline. |

### Hylätyt vaihtoehdot

**TWA (Android) + PWA (iOS)** — halvin toteuttaa, mutta iOS-PWA:ta ei voi julkaista App Storeen lainkaan, ja Safarin offline-tallennus voidaan tyhjentää käytön puutteessa. Ei sovi yhteen "molemmat kaupat" -tavoitteen kanssa.

**React Native / Flutter -uudelleenkirjoitus** — paras natiivitunnelma, mutta koko käyttöliittymä ja EPSG:3067-karttalogiikka rakennettaisiin uusiksi, ja ylläpidettäväksi jäisi kaksi rinnakkaista koodikantaa.

**MML:n rajapinta offline-laatoille** — teknisesti mahdollinen (API-avain, maksuton), mutta lisää avainten suojaustarpeen ja merkittävästi tallennustilaa. Karsittiin ensimmäisestä versiosta; harkittavissa myöhemmin, jos katvealueiden käyttö osoittautuu ongelmaksi.

## 1. Ympäristövaatimukset

| Kohde | Vaatimus |
|-------|----------|
| Capacitor | 8.x (9.11.2026: core/cli/ios 8.6.0) |
| iOS-kohde | 15.0+ (Capacitor 8:n minimi; Apple vaatii saman huhtikuusta 2027) |
| Xcode | Käytetään Xcode 27:ää. App Store Connect vaatii 28.4.2026 alkaen Xcode 26:n ja iOS 26 SDK:n, huhtikuusta 2027 alkaen iOS 27 SDK:n. |
| iOS-riippuvuudet | Swift Package Manager (Capacitor 8:n oletus `npx cap add ios`:lle). CocoaPodsia ei tarvita. |
| Android-kohde | API 24+ (compile/target uusin Playn vaatima) |
| Android Studio | 2025.2.1+ |
| Node | 24 LTS, vähintään 24.15 (`.nvmrc`; jsdom 30 ja Capacitor CLI 8 eivät tue Node 20:tä) |
| JDK | Android Studion mukana tuleva JBR (Capacitor 8 ei vaadi erillistä asennusta). Komentorivibuildit (`npx cap run android`, Gradle) tarvitsevat `JAVA_HOME`-muuttujan, joka osoittaa siihen. |

**Kehityskoneen tila 9.11.2026** (tarkistettu ennen vaihetta 0):

| Kohde | Tila | Toimenpide ennen vaihetta 1 |
|-------|------|------------------------------|
| Node | 24.22.2 (nvm, oletus `24`) | — |
| Xcode | 27.2 | — |
| CocoaPods | asennettu, mutta ei tarvita (SPM) | — |
| Android SDK | platforms 34–37, build-tools 37.0.0 | — |
| JDK | Ei `JAVA_HOME`-muuttujaa; Android Studion JBR 21.0.10 löytyy | `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"` shellin profiiliin |
| `adb` | Ei PATHissa | `export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"` |
| Capacitor | Uusin 8.6.0 | — |

**Kustannukset**: ei uusia. Google Play Console- ja Apple Developer Program -tilit ovat jo olemassa oman yrityksen nimissä.

## 2. Repositorion rakenne

```
├── package.json            # UUSI: npm-riippuvuudet, Vite-skriptit
├── vite.config.js          # UUSI: build dist/-hakemistoon
├── capacitor.config.ts     # UUSI: sovellustunnus, nimi, plugin-asetukset
├── index.html              # Vite-entry (CDN-tagit poistuvat)
├── android/                # UUSI: Capacitorin generoima, versionhallinnassa
├── ios/                    # UUSI: Capacitorin generoima, versionhallinnassa
├── js/
│   ├── platform/           # UUSI: alusta-abstraktio
│   │   ├── index.js        #   valitsee toteutuksen ajonaikaisesti
│   │   ├── location.js     #   Geolocation | selaimen navigator.geolocation
│   │   ├── storage.js      #   Filesystem | IndexedDB
│   │   ├── camera.js       #   Camera | <input type=file> (web: no-op)
│   │   └── share.js        #   Share | navigator.share | leikepöytä
│   ├── offline/            # UUSI
│   │   ├── cache.js        #   kiinteistöpakettien tallennus ja haku
│   │   └── sync.js         #   lataus, ikä, poisto
│   ├── notes/              # UUSI
│   │   ├── store.js        #   muistiinpanojen CRUD
│   │   └── export.js       #   GeoJSON- ja CSV-vienti
│   ├── favorites.js        # UUSI
│   ├── ui/                 # js/ui.js pilkotaan tänne
│   │   ├── summary.js
│   │   ├── stands.js
│   │   ├── panel.js
│   │   ├── sheet.js        #   UUSI: bottom sheet -ohjain
│   │   └── notes-ui.js     #   UUSI
│   └── ...                 # app, config, state, utils, styles, data, statistics
├── public/                 # UUSI: Vite kopioi sellaisenaan dist/-hakemistoon
│   ├── version.js          #   siirretään juuresta; versionumeron ainoa lähde
│   ├── tietosuoja.html     #   siirretään juuresta; osoite ei saa muuttua
│   └── .well-known/
│       ├── assetlinks.json #   Android App Links
│       └── apple-app-site-association
└── scripts/
    └── sync-version.mjs    # UUSI: public/version.js → natiiviprojektien versiokentät
```

`mcp-server/` säilyy ennallaan.

## 3. Alusta-abstraktio

Sovelluskoodi ei saa kutsua Capacitor-plugineja suoraan. Kaikki natiivit kyvyt kulkevat `js/platform/`-rajapintojen kautta, joilla on kaksi toteutusta: Capacitor natiivissa ja selain-API webissä. `platform/index.js` valitsee toteutuksen `Capacitor.isNativePlatform()`-tarkistuksella.

Rajapinnat:

```js
// location.js
watchPosition(callback) -> unsubscribe   // {lat, lon, accuracy, heading}
getCurrentPosition() -> Promise<Position>
requestPermission() -> Promise<'granted'|'denied'>

// storage.js
put(key, value) -> Promise<void>          // JSON-serialisoituva
get(key) -> Promise<value|null>
remove(key) -> Promise<void>
list(prefix) -> Promise<[{key, size}]>
putBlob(key, blob) -> Promise<uri>        // valokuvat
getBlobUri(key) -> Promise<uri|null>

// camera.js
capturePhoto() -> Promise<{uri, width, height}|null>
isAvailable() -> boolean

// share.js
shareText({title, text, url}) -> Promise<void>
shareFile({uri, mimeType, title}) -> Promise<void>
```

Capacitor-pluginit (versiot 9.11.2026): `@capacitor/geolocation` 8.2, `@capacitor/camera` 8.2, `@capacitor/filesystem` 8.1, `@capacitor/share` 8.0, `@capacitor/app` 8.1 (`appUrlOpen`) ja `@capacitor/preferences` 8.0. Sijainti haetaan aina `@capacitor/geolocation`-pluginilla eikä `navigator.geolocation`illa, koska WKWebView'n oma kysely voi tuottaa toisen, WebKitin oman lupadialogin.

**Miksi näin**: `app.js` ja `ui/`-moduulit pysyvät alustatietämättöminä, jokainen rajapinta on testattavissa valeobjektilla ilman laitetta, ja verkkosovellus saa samat ominaisuudet siinä laajuudessa kuin selain sallii.

### WFS-kutsut natiivissa

Natiivissa WebViewssä origin on `capacitor://localhost`. **Tarkistettu 9.11.2026:** kaikki kolme lähdettä vastaavat tällä originilla otsakkeella `Access-Control-Allow-Origin: *` (Metsäkeskuksen WFS, MML:n INSPIRE-WFS ja Kapsin laatat). Kaikki haut ovat lisäksi GET-pyyntöjä ilman omia otsakkeita, joten preflight-pyyntöä ei synny. CORS ei siis estä hakuja.

Päätös: **`CapacitorHttp` jätetään pois päältä.** Se korvaisi `fetch()`-toteutuksen globaalisti natiivilla HTTP-pinolla, jolloin natiivi ja web käyttäytyisivät eri tavoin ilman todellista tarvetta. `js/data.js` ei muutu. Silta otetaan käyttöön vain, jos laitetestauksessa vaiheessa 1 ilmenee ongelma. Lähteet voivat muuttaa CORS-otsakkeitaan, joten tarkistus toistetaan ennen App Store -lähetystä.

### Verkkosovelluksen toiminnot, jotka eivät toimi WKWebView'ssä

Nykyisessä koodissa on kolme toimintoa, jotka toimivat selaimessa mutta eivät iOS-sovelluksessa sellaisenaan. Ne korjataan vaiheessa 1 `js/platform/`-rajapintojen kautta.

| Toiminto | Nykyinen toteutus | Ongelma natiivissa | Ratkaisu |
|----------|-------------------|--------------------|----------|
| CSV-lataus (`downloadCSV`, `js/ui.js`) | `Blob` + `<a download>` + `link.click()` | WKWebView ei tue `download`-attribuuttia, eikä mitään tapahdu | Natiivissa tiedosto kirjoitetaan Filesystem-pluginilla väliaikaishakemistoon ja avataan jakonäkymä (`share.shareFile`) |
| Linkin kopiointi (`copyParcelLink`, `js/ui.js`) | `window.location.href` leikepöydälle | Osoite on `capacitor://localhost/?parcel=...`, eikä se toimi kenelläkään muulla | Jaettava linkki muodostetaan julkisesta perusosoitteesta (`https://trotor.github.io/metsainfo/?parcel=...`), ja natiivissa käytetään jakonäkymää |
| Tulostus (`window.print()`, `js/ui.js`) | Selaimen tulostusdialogi | WKWebView'ssä `window.print()` ei tee mitään | Tulostuspainike piilotetaan natiivissa. CSV-jako korvaa sen maastokäytössä. |

Muita vaiheessa 2 huomioitavia: `.info-tip:hover`-työkaluvihjeet eivät aukea kosketuksella, ja `target="_blank"`-ulkolinkkien on avauduttava Safariin eikä sovelluksen sisään (varmistetaan laitteella).

**Ohjenäkymän yhteystieto:** `index.html` näyttää henkilökohtaisen gmail-osoitteen. Kun sovellus julkaistaan yrityksen nimissä, ohjenäkymässä on syytä käyttää samaa tukisähköpostia kuin kauppalistauksessa ja tietosuojaselosteessa.

### ui.js:n pilkkominen

`js/ui.js` on 710 riviä. Mobiilikäyttöliittymä lisäisi siihen bottom sheetin, muistiinpanonäkymän ja sijaintikontrollit — tiedosto kasvaisi yli hallittavan. Pilkotaan vaiheessa 1 samalla kun moduulirakenne muutenkin liikkuu: `summary.js` (yhteenvedon renderöinti), `stands.js` (kuviolista ja korostukset), `panel.js` (paneelin tilanhallinta ja tapahtumat). Julkinen rajapinta säilyy, `app.js`:n tuonnit päivittyvät.

## 4. Offline-malli

Karttapohja vaatii verkon. Vektoridata toimii offline.

### Kiinteistöpaketti

Yksi paketti per kiinteistötunnus, tallennettuna `platform/storage`-rajapinnan taakse avaimella `offline/parcel/<kiinteistotunnus>`:

```json
{
  "kiinteistotunnus": "59240400010032",
  "haettu": "2026-07-28T09:14:00Z",
  "parcels":   { "type": "FeatureCollection", "features": [] },
  "stands":    { "type": "FeatureCollection", "features": [] },
  "mki":       { "type": "FeatureCollection", "features": [] },
  "mete":      { "type": "FeatureCollection", "features": [] }
}
```

Geometriat tallennetaan EPSG:3067-koordinaatteina, samassa muodossa kuin WFS ne palauttaa — ei muunnosta tallennusvaiheessa.

### Lataus ja käyttö

- Valitun kiinteistön paneelissa **"Lataa maastoon"** -painike hakee kaikki neljä aineistoa ja tallentaa paketin.
- Kun WFS-haku epäonnistuu (ei verkkoa tai virhe), `data.js` tarjoaa välimuistin paketin ja käyttöliittymä näyttää ilmoituksen aineiston hakupäivästä.
- Otsikkorivillä offline-indikaattori, kun laite on verkotta.
- **Asetusnäkymä** listaa ladatut kiinteistöt, koot ja hakupäivät sekä sallii yksittäisen paketin päivityksen ja poiston. Automaattista vanhenemista ei toteuteta — maastossa vanha data on parempi kuin ei dataa.

### Tallennustilan arvio

Tyypillinen kiinteistö noin 20–80 kuviota, GeoJSON pakkaamattomana arviolta 50–300 kt. Sadan kiinteistön välimuisti mahtuu kymmeniin megatavuihin. Ei kiintiöiden hallintaa ensimmäisessä versiossa; asetusnäkymä näyttää yhteiskoon.

## 5. Maasto-ominaisuudet

### 5.1 Sijainti ja seuranta

- GPS-piste kartalla tarkkuusympyrällä, päivittyy `watchPosition`-virrasta.
- **"Keskitä minuun"** -painike, jolla kolme tilaa: pois, keskitys, keskitys + suunta.
- Kompassisuunta `DeviceOrientation`-tapahtumasta (`webkitCompassHeading`). Capacitor 8:n iOS-WebView myöntää liike- ja suuntaluvan automaattisesti ilman järjestelmädialogia (`WebViewDelegationHandler`), mutta `requestPermission()` kutsutaan silti napin painalluksesta. **Varmistetaan oikealla iPhonella heti vaiheen 3 alussa**, ennen kuin kompassi luvataan kauppakuvauksessa. Varasuunnitelma on CoreLocationin suuntatietoa käyttävä plugin, esimerkiksi `@capgo/capacitor-compass`.
- **"Olet kuviolla"** -indikaattori: nykyinen `pointInPolygon3067` ratkaisee, minkä kuvion sisällä sijainti on, ja paneeli hyppää kyseisen kuvion tietoihin.
- **Vain etualan sijainti.** Taustasijaintia ei pyydetä. Perustelu: `ACCESS_BACKGROUND_LOCATION` laukaisisi Google Playn erillisen taustasijainti-ilmoituslomakkeen ja videokatselmoinnin, mikä hidastaisi julkaisua merkittävästi ilman todellista hyötyä.
- Luvan epääminen ei estä sovelluksen käyttöä: kartta toimii normaalisti, sijaintipainike näyttää ohjeen asetuksiin.

### 5.2 Muistiinpanot ja valokuvat

Tietue:

```json
{
  "id": "uuid",
  "kiinteistotunnus": "59240400010032",
  "standId": "12345",
  "coords3067": [432100, 6923400],
  "teksti": "Tuulenkaatoja pohjoisrinteessä",
  "kuvat": ["notes/photo/<uuid>.jpg"],
  "luotu": "2026-07-28T09:14:00Z"
}
```

- Muistiinpanon voi lisätä kuviolle (paneelista) tai vapaaseen pisteeseen (kartan pitkä painallus).
- Kuvat tallennetaan sovelluksen omaan hakemistoon, ei kameran rullaan. Metatiedot kirjataan tietueeseen, ei EXIF-riippuvuutta.
- Muistiinpanot näkyvät kartalla omina markkereinaan, kytkettävissä pois layer controlista.
- **Vienti** GeoJSON- ja CSV-muodossa jakonäkymän kautta. CSV noudattaa nykyistä käytäntöä: puolipiste erottimena, pilkku desimaalierottimena, UTF-8 BOM.
- Kaikki tallennus on paikallista. Ei pilvisynkronointia, ei tiliä, ei palvelinta.

### 5.3 Suosikit ja jako

- Suosikkikiinteistöt `platform/storage`-avaimessa `favorites`, järjestys viimeksi käytetty ensin.
- Natiivi jakonäkymä `share`-rajapinnan kautta. Jaettava sisältö on nykyisen URL-jako-ominaisuuden muotoinen linkki `https://trotor.github.io/metsainfo/?parcel=<tunnus>`, mutta muodostettuna julkisesta perusosoitteesta eikä `window.location`ista (ks. luku 3).
- **Syvälinkit**:
  - **Universal Links / App Links eivät ole nykyisellä osoitteella mahdollisia.** Apple ja Google hakevat varmennustiedoston verkkotunnuksen juuresta (`https://trotor.github.io/.well-known/...`), eikä Pagesin projektisivusto `/metsainfo/` voi tarjoilla sitä. Tarkistettu 9.11.2026: käyttäjäsivustorepoa `trotor.github.io` ei ole, eikä Pagesilla ole omaa verkkotunnusta. Vaihtoehdot ovat (a) oma verkkotunnus Pagesille, esimerkiksi yrityksen aliverkkotunnus, tai (b) käyttäjäsivustorepo `trotor.github.io`, joka tarjoilee vain `.well-known/`-tiedostot. Vaihtoehto (a) muuttaisi myös tietosuojaselosteen osoitteen, joten se on päätettävä **ennen** kuin osoite annetaan App Store Connectiin.
  - `metsainfo://parcel/<tunnus>` custom scheme toimii ilman verkkotunnusta, ja se toteutetaan joka tapauksessa.
  - Ensimmäisessä iOS-versiossa riittää custom scheme. Universal Links on parannus, ei julkaisun edellytys.
- Sovellus käsittelee saapuvan linkin `appUrlOpen`-tapahtumassa ja avaa kiinteistön suoraan.

### 5.4 Mobiilikäyttöliittymä

- Sivupaneeli korvautuu **bottom sheetillä**: kolme pysäytyskohtaa (kahva, puolikas, koko näyttö), vedettävissä, ei estä kartan käyttöä.
- Kosketuskohteet vähintään 44×44 pt, hover-riippuvaiset vuorovaikutukset korvataan.
- `env(safe-area-inset-*)` huomioidaan ylä- ja alareunassa.
- Karttakontrollit siirtyvät peukalon ulottuville näytön alaosaan.
- Nykyinen `@media (max-width: 768px)` -tyylittely toimii pohjana; sheet-ohjain on uusi `ui/sheet.js`.

## 6. Versionhallinta ja allekirjoitus

`public/version.js` säilyy versionumeron ainoana lähteenä. `scripts/sync-version.mjs` lukee sen ja kirjoittaa:

- `android/app/build.gradle`: `versionName` (esim. `4.0.0`) ja `versionCode` (monotoninen kokonaisluku)
- `ios/App/App/Info.plist`: `CFBundleShortVersionString` ja `CFBundleVersion`

Skripti ajetaan `npm run build` -vaiheen osana.

**Android-allekirjoitus**: upload-avain generoidaan kerran, säilytetään turvassa ja lisätään GitHub Secretsiin base64-koodattuna yhdessä salasanojen kanssa. Play App Signing hoitaa lopullisen allekirjoituksen.

**iOS-allekirjoitus**: ensimmäinen julkaisu tehdään paikallisesti Xcodella automaattisella allekirjoituksella. CI-automaatio (App Store Connect API -avain) lisätään vasta, kun julkaisuputki on todettu toimivaksi.

## 7. Kauppavaatimukset

### Tietosuoja

Molemmat kaupat vaativat julkisen tietosuojaselosteen URL:n. Seloste on **jo kirjoitettu ja repossa**: `tietosuoja.html` juuressa, julkaistuna osoitteessa `https://trotor.github.io/metsainfo/tietosuoja.html`. Vaiheessa 0 se siirtyy `public/`-hakemistoon, josta Vite kopioi sen buildiin — **osoite ei muutu**, mikä on olennaista, koska osoite on jo annettu kauppalomakkeissa.

Sisältö: sovellus ei kerää käyttäjätietoja, ei sisällä analytiikkaa eikä mainoksia, ja sijainti, valokuvat sekä muistiinpanot käsitellään ja säilytetään ainoastaan käyttäjän laitteella. Seloste kertoo avoimesti myös sen, että avointen rajapintojen haut paljastavat kolmansille osapuolille käyttäjän IP-osoitteen ja haetun alueen.

Playn **Data Safety** -lomake ja Applen **tietosuojatarrat** täytetään vastaavasti. Molempien perusvastaus on **ei kerättyä tietoa**, koska kummankin kaupan määritelmässä "kerääminen" tarkoittaa tiedon siirtymistä pois laitteelta — eikä Metsäinfossa mikään lähde. Valmiit lomakevastaukset perusteluineen: [docs/kauppa/tietosuojalomakkeet.md](../kauppa/tietosuojalomakkeet.md).

### Lupaperustelut

| Alusta | Avain | Teksti |
|--------|-------|--------|
| iOS | `NSLocationWhenInUseUsageDescription` | Sijaintia käytetään oman paikan näyttämiseen kartalla ja sen tunnistamiseen, millä metsikkökuviolla olet. |
| iOS | `NSCameraUsageDescription` | Kameraa käytetään maastohavaintojen valokuvaamiseen muistiinpanoihin. |
| iOS | `NSPhotoLibraryAddUsageDescription` | Vain jos kuvan tallennus kuvakirjastoon toteutetaan. Muuten avain jätetään pois. |
| Android | `ACCESS_FINE_LOCATION` | — (perustelu näytetään sovelluksen omassa dialogissa ennen järjestelmäkyselyä) |
| Android | `CAMERA` | — |

`ACCESS_BACKGROUND_LOCATION` **ei** ole mukana. iOS:llä `NSLocationAlwaysAndWhenInUseUsageDescription` jätetään myös pois. Geolocation-pluginin dokumentti listaa sen, mutta sovellus pyytää vain käytönaikaista sijaintia. Jos Xcode tai App Store Connect vaatii avaimen, sille annetaan sama teksti.

### Privacy manifest (`PrivacyInfo.xcprivacy`)

Apple vaatii manifestin "required reason" -rajapinnoille. Capacitorin coren manifesti on tyhjä, eikä yksikään käytetyistä plugineista (geolocation, camera, filesystem, share, app, preferences) tuo omaansa. Tarkistettu Capacitor 8.6.0:n lähdekoodista. Sovellustason manifestiin tulevat siksi:

| Kenttä | Arvo | Syy |
|--------|------|-----|
| `NSPrivacyTracking` | `false` | Ei seurantaa |
| `NSPrivacyCollectedDataTypes` | tyhjä | Ei kerättyä tietoa |
| `NSPrivacyAccessedAPICategoryUserDefaults` | `CA92.1` | `@capacitor/preferences` käyttää UserDefaultsia |
| `NSPrivacyAccessedAPICategoryFileTimestamp` | `C617.1` | `@capacitor/filesystem` lukee tiedostojen luonti- ja muokkausajat |

Manifesti luodaan vaiheessa 1 samalla kun `ios/`-projekti syntyy, ja se tarkistetaan uudelleen aina, kun lisätään plugin.

### Tietosuojaselosteen linkki sovelluksessa

Sääntö 5.1.1(i) vaatii tietosuojaselosteen linkin sekä App Store Connectiin **että sovelluksen sisälle**. Linkki lisätään ohjenäkymään. Sääntö 1.5 vaatii lisäksi tuki-URL:n, jolta löytyy yhteystieto. Nykyinen tuki-URL (sovelluksen etusivu) näyttää yhteystiedon vain ohjeikkunassa, joten tukiosoitteeksi kannattaa vaihtaa tietosuojaseloste tai erillinen tukisivu.

### Applen sääntö 4.2 (minimum functionality)

Apple hylkää sovellukset, jotka ovat käytännössä verkkosivun kuori. Riski on todellinen, koska sovellus perustuu olemassa olevaan verkkosovellukseen. Torjunta: offline-vektoridata, GPS-seuranta ja kamerahavainnot ovat toimintoja, joita verkkoversiossa ei ole. Nämä kirjataan eksplisiittisesti App Review -muistiinpanoihin, ja katselmoijalle annetaan esimerkkikiinteistötunnus, jolla offline-lataus voidaan testata.

### Nimi, brändi ja sivutoimi

Sovellus julkaistaan oman yrityksen nimissä, käyttää Suomen metsäkeskuksen avointa dataa ja kantaa nimeä "Metsäinfo". Aineisto on CC BY 4.0 -lisensoitua ja vapaasti käytettävää, joten kyse ei ole datan käyttöoikeudesta. Kolme toimenpidettä silti:

1. **Selkeä erottautuminen.** Sekä kauppakuvaukseen että sovelluksen ohjenäkymään lisätään maininta: sovellus on itsenäinen tuote, joka hyödyntää Suomen metsäkeskuksen ja Maanmittauslaitoksen avoimia aineistoja, eikä ole näiden organisaatioiden virallinen tuote tai palvelu.
2. **Lähdeviittaukset.** CC BY 4.0 -attribuutiot molemmille tietolähteille sovelluksen tietonäkymässä.
3. **Varmistukset.** Nimi "Metsäinfo" tarkistetaan PRH:n tavaramerkkirekisteristä, ja oman yrityksen kautta tapahtuva julkaisu suhteessa työsuhteeseen Suomen metsäkeskukseen tarkistetaan organisaation sivutoimikäytäntöä vasten.

Valmiit tekstit näihin: [docs/kauppa/](../kauppa/).

### Muut kauppavaatimukset

- Sisältöluokitus: kummallakin alustalla alin ikäluokka (ei käyttäjäsisältöä, ei ostoksia, ei mainoksia). Applen uusi ikäluokituskysely on ollut pakollinen 31.1.2026 alkaen (luokat 4+, 9+, 13+, 16+ ja 18+). 4+ edellyttää vastausta "ei" kohtaan *Unrestricted Web Access*, joten kaikkien ulkolinkkien on avauduttava Safariin eikä sovelluksen WebView'hun.
- **Vain iPhone.** Capacitorin iOS-pohja tukee oletuksena myös iPadia (`TARGETED_DEVICE_FAMILY = "1,2"`). Ensimmäinen versio rajataan iPhoneen (`1`), jolloin iPadin 13" kuvakaappauksia ja iPad-asettelun katselmointia ei tarvita.
- **EU:n DSA-kauppiasilmoitus** (trader status). Ilman vahvistettua kauppiasstatusta sovellusta ei jaella EU:ssa. Organisaatiolla D-U-N-S-osoite näkyy tuotesivulla automaattisesti, ja lisäksi näkyvät vahvistettu puhelinnumero ja sähköposti, joten niiden on oltava yrityksen yhteystietoja.
- Export compliance: `ITSAppUsesNonExemptEncryption = NO` Info.plistiin. Sovellus käyttää vain käyttöjärjestelmän HTTPS:ää.
- Tilin poisto -vaatimus ei koske sovellusta, koska tilejä ei ole.
- Kuvakkeet ja splash-näytöt generoidaan `@capacitor/assets`-työkalulla (4.0.0) yhdestä lähdekuvasta.
- Kuvakaappaukset molempiin kauppoihin vaadituilla laitekoilla, suomeksi.
- Kauppakuvaus, avainsanat ja lyhyt kuvaus suomeksi; englanninkielinen versio valinnainen.

## 8. Testaus

Projektissa ei ole tällä hetkellä testikehystä. Otetaan käyttöön **Vitest** ainoastaan puhtaalle logiikalle, jossa hyötysuhde on paras eikä DOM:ia tarvita:

- `utils.js` — koordinaattimuunnokset, `pointInPolygon3067`, `getGeometryBounds3067`, `normalizeParcelId`
- `statistics.js` — tilastolaskenta tunnetulla kuviojoukolla
- `offline/cache.js` — paketin tallennus, haku, poisto valeobjektistoragella
- `notes/store.js` ja `notes/export.js` — CRUD ja vientimuotojen oikeellisuus

Käyttöliittymälle ei kirjoiteta automaattitestejä.

### Manuaalinen laitematriisi

| Tapaus | Android | iOS |
|--------|---------|-----|
| Sovellus käynnistyy, kartta latautuu | ☐ | ☐ |
| Kiinteistöhaku ja klikkaus | ☐ | ☐ |
| Sijaintilupa myönnetty → piste kartalla | ☐ | ☐ |
| Sijaintilupa evätty → sovellus toimii, ohje näkyy | ☐ | ☐ |
| Kompassisuunta (iOS: lupapyyntö) | ☐ | ☐ |
| Offline-lataus ja käyttö lentotilassa | ☐ | ☐ |
| Kameralupa, kuvan liittäminen muistiinpanoon | ☐ | ☐ |
| Muistiinpanojen vienti ja jako | ☐ | ☐ |
| Syvälinkki avaa oikean kiinteistön | ☐ | ☐ |
| Bottom sheet, safe-area pienellä ja isolla näytöllä | ☐ | ☐ |
| Verkkosovellus toimii ennallaan buildin jälkeen | ☐ | ☐ |

Testaus tehdään fyysisillä laitteilla, ei pelkällä emulaattorilla — GPS ja kamera vaativat sen.

## 9. Vaiheistus

Jokainen vaihe on oma pull requestinsa. iOS julkaistaan ensin (vaiheet 1–8), Android seuraa (vaihe 9). Vaiheet 0–1 ovat riskialttiimmat, koska ne koskevat olemassa olevaa verkkosovellusta.

| Vaihe | Sisältö | Riippuu |
|-------|---------|---------|
| **0** | Build-vaihe: `package.json`, Vite, CDN-kirjastot npm-riippuvuuksiksi, GitHub Actions julkaisee `dist/` Pagesiin. **Ei toiminnallista muutosta** — verkkosovelluksen on toimittava identtisesti. | — |
| **1** | Alusta-abstraktio `js/platform/`, `ui.js`:n pilkkominen, Capacitor-runko ja `ios/`-projekti (SPM, vain iPhone, privacy manifest). WKWebView-korjaukset: CSV-jako, jaettava linkki, tulostuksen piilotus. Sovellus käynnistyy iPhonella ja näyttää nykyisen sovelluksen. | 0 |
| **2** | Mobiilikäyttöliittymä: bottom sheet, kosketuskohteet, safe-area, kontrollien sijoittelu. | 1 |
| **3** | Sijainti ja seuranta: GPS-piste, keskitys, kompassi, "olet kuviolla". | 1 |
| **4** | Offline-välimuisti: lataus, tarjoilu, hallintanäkymä, offline-indikaattori. | 1 |
| **5** | Muistiinpanot ja valokuvat: tallennus, kartan markkerit, GeoJSON- ja CSV-vienti. | 3, 4 |
| **6** | Suosikit, natiivi jako, syvälinkit (custom scheme; Universal Links vain jos verkkotunnus on ratkaistu). | 1 |
| **7** | iOS-kauppavalmius: kuvakkeet, splash, kuvakaappaukset (iPhone), versionsynkronointi, DSA-kauppiasilmoitus, ikäluokituskysely. Tekstit, tietosuojaseloste ja lomakevastaukset ovat jo valmiina kansiossa `docs/kauppa/`. | 2–6 |
| **8** | App Store -julkaisu: TestFlight (sisäinen) → App Review → julkaisu. | 7 |
| **9** | Android: `android/`-projekti, Android-erityiset korjaukset, Play-kauppavalmius (allekirjoitusavain, Data Safety, kuvakaappaukset) ja Play-julkaisu (internal testing → porrastettu tuotanto). | 8 |

### Kriittinen polku

Organisaatiotilillä julkaisu **ei ole enää aikataulun pullonkaula**. Playn 12 testaajan ja 14 vuorokauden suljettu testi koskee vain henkilökohtaisia tilejä, jotka on avattu 13.11.2023 jälkeen — yrityksen organisaatiotililtä voi julkaista suoraan tuotantoon. Kaksi viikkoa odotusta ja testaajien värvääminen poistuvat suunnitelmasta kokonaan.

Käytännön seuraukset (iOS ensin, päätetty 9.11.2026):

- Pullonkaulaksi jää **vaihe 7** eli kauppavalmius: kuvakkeet, kuvakaappaukset ja metadata syntyvät vasta kun sovellus on ajettavissa laitteella.
- **Pitkät hallinnolliset asiat aloitetaan heti, ei vaiheessa 7**: DSA-kauppiasstatuksen vahvistus (vaatii yritysasiakirjan), PRH-nimitarkistus, sivutoimi-ilmoitus, verkkotunnuspäätös ja tietosuojaselosteen täyttäminen. Ne eivät riipu koodista.
- TestFlight-sisäinen jakelu otetaan käyttöön heti vaiheen 1 jälkeen, jotta maastotestaus omalla iPhonella alkaa varhain.
- App Review vie päiviä ja voi vaatia useamman kierroksen. Realistinen aika vaiheesta 7 App Store -julkaisuun: **1–2 viikkoa**.
- Android (vaihe 9) seuraa iOS-julkaisua. Organisaatiotililtä Playhin voi julkaista suoraan tuotantoon porrastettuna (20 % → 100 %).

Kauppatekstit, lomakevastaukset ja katselmointimuistiinpanot ovat valmiina: [docs/kauppa/](../kauppa/).

## 10. Riskit

| Riski | Vaikutus | Torjunta |
|-------|----------|----------|
| Applen 4.2-hylkäys | iOS-julkaisu viivästyy | Offline, GPS ja kamera perusteluina katselmointimuistiinpanoissa; testikiinteistötunnus katselmoijalle |
| WFS-kutsut kaatuvat natiivissa CORS-tarkastukseen | Sovellus ei toimi lainkaan | Pieni riski: kaikki lähteet palauttavat `Access-Control-Allow-Origin: *` (tarkistettu 9.11.2026). Varmistetaan laitteella vaiheessa 1. `CapacitorHttp` on varasuunnitelma. |
| Selaintoiminnot (CSV-lataus, tulostus, linkin kopiointi) eivät toimi WKWebView'ssä | Katselmoija painaa nappia, eikä mitään tapahdu (hylkäysperuste 2.1) | Korjataan vaiheessa 1, ks. luku 3 |
| Tietosuojaseloste julkaistaan täyttämättömänä | Selosteeseen jää `[TÄYTÄ]`-merkintöjä julkiseen osoitteeseen | Vaiheen 0 Actions-julkaisu vie `public/tietosuoja.html`:n Pagesiin. Täytä yrityksen tiedot ennen vaihetta 0 tai viimeistään ennen URL:n antamista kauppaan. |
| Vaihe 0 rikkoo verkkosovelluksen | Nykyinen demo hajoaa | Ei toiminnallisia muutoksia; manuaalinen läpikäynti ennen mergeä; Pages-julkaisu vasta kun `dist/` todettu toimivaksi |
| Nimi- tai tavaramerkkiristiriita | Julkaisu estyy tai vaatii uudelleennimeämisen | PRH-tarkistus ennen kuin nimi lyödään lukkoon ikoneihin ja kauppametadataan |
| Sivutoimikäytäntö estää julkaisun | Koko projekti pysähtyy | Tarkistetaan organisaation sivutoimikäytäntö ennen vaihetta 7 |
| Kapsi-laattojen kuormitus mobiilikäytöstä | Palvelun väärinkäyttö | Ei esilatausta; normaali selauskäyttö vain. Jos kuormitus nousee, siirrytään MML:n rajapintaan API-avaimella |
| Metsäkeskuksen WFS:n ~2000 kuvion raja offline-latauksessa | Puutteellinen data ilman virheilmoitusta | Lataus tehdään kiinteistö kerrallaan, ei laajalta alueelta; kuviomäärä tarkistetaan ja käyttäjää varoitetaan rajan lähestyessä |

## 11. Versionumerointi

Mobiilijulkaisu on **4.0.0** — merkittävä arkkitehtuurimuutos (build-vaihe, alusta-abstraktio, uusi jakelukanava). `version.js` päivitetään vaiheessa 7, ja välivaiheet käyttävät esiversioita (`4.0.0-alpha.N`).
