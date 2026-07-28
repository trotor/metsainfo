# Android- ja iOS-mobiilisovellukset — Design

**Issue**: #20 Android- ja iOS-mobiilisovellukset kauppoihin
**Päivämäärä**: 2026-07-28
**Tavoite**: Julkaista Metsäinfo natiivisovelluksena Google Play -kauppaan ja Apple App Storeen, maastokäyttöön optimoiduilla lisäominaisuuksilla.

## Yleiskuvaus

Nykyinen selainsovellus paketoidaan Capacitorilla natiiviksi Android- ja iOS-sovellukseksi. Koodikanta pysyy yhtenä: sama `js/`-hakemisto palvelee GitHub Pages -verkkosovellusta ja molempia kauppaversioita. Mobiiliversioihin lisätään neljä maastokäyttöä palvelevaa ominaisuutta, jotka verkkosovelluksesta puuttuvat: sijaintiseuranta, offline-vektoridata, paikkasidonnaiset muistiinpanot valokuvineen sekä suosikit ja natiivi jako.

Nämä lisäominaisuudet eivät ole pelkkää kuorrutusta — ne ovat myös se peruste, jolla sovellus läpäisee Applen 4.2-säännön (ks. [Kauppavaatimukset](#7-kauppavaatimukset)).

## Päätökset

| Kysymys | Päätös | Perustelu |
|---------|--------|-----------|
| Kunnianhimo | Maastokäyttöön optimoitu | Todellinen lisäarvo puhelimessa, ei täyttä uudelleenkirjoitusta |
| Julkaisukanavat | Google Play + Apple App Store | Koko yleisö tavoitetaan |
| Julkaisija | Henkilökohtainen kehittäjätili | Harrasteprojekti; edellyttää suljettua testiä (ks. vaihe 8) |
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
| Capacitor | 8.x |
| iOS-kohde | 15.0+ |
| Xcode | 26.0+ (vaatii macOS) |
| Android-kohde | API 24+ (compile/target uusin Playn vaatima) |
| Android Studio | 2025.2.1+ |
| Node | 20 LTS+ |

**Kustannukset**: Google Play Console 25 $ kertamaksu, Apple Developer Program 99 $/vuosi.

## 2. Repositorion rakenne

```
├── package.json            # UUSI: npm-riippuvuudet, Vite-skriptit
├── vite.config.js          # UUSI: build dist/-hakemistoon
├── capacitor.config.ts     # UUSI: sovellustunnus, nimi, plugin-asetukset
├── index.html              # Vite-entry (CDN-tagit poistuvat)
├── version.js              # Säilyy versionumeron lähteenä
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
│   ├── tietosuoja.html     #   tietosuojaseloste (kauppojen vaatima URL)
│   └── .well-known/
│       ├── assetlinks.json #   Android App Links
│       └── apple-app-site-association
└── scripts/
    └── sync-version.mjs    # UUSI: version.js → natiiviprojektien versiokentät
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

**Miksi näin**: `app.js` ja `ui/`-moduulit pysyvät alustatietämättöminä, jokainen rajapinta on testattavissa valeobjektilla ilman laitetta, ja verkkosovellus saa samat ominaisuudet siinä laajuudessa kuin selain sallii.

### WFS-kutsut natiivissa

Natiivissa WebViewssä origin on `capacitor://localhost`, mikä voi kaataa WFS-kutsut CORS-tarkastukseen. Ratkaisu: `CapacitorHttp`-silta otetaan käyttöön `capacitor.config.ts`:ssä, jolloin `fetch()`-kutsut ohjataan natiivin HTTP-pinon läpi eikä CORS-tarkastusta tehdä lainkaan. `js/data.js` ei muutu.

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
- Kompassisuunta `DeviceOrientation`-tapahtumasta. iOS vaatii erillisen käyttäjän eleestä käynnistetyn lupapyynnön (`requestPermission`) — toteutetaan napin painalluksen yhteydessä.
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
- Natiivi jakonäkymä `share`-rajapinnan kautta; jaettava sisältö on nykyinen URL-jako-ominaisuuden tuottama linkki.
- **Syvälinkit** kahdella mekanismilla:
  - Android App Links / iOS Universal Links osoitteeseen `https://trotor.github.io/metsainfo/?kiinteisto=...`. Vaatii `assetlinks.json`- ja `apple-app-site-association`-tiedostot polussa `public/.well-known/`, josta ne päätyvät buildissa Pagesiin. Huom: Universal Links vaatii tiedoston polusta `/.well-known/` sivuston juuressa — koska Pages tarjoilee sovelluksen alipolussa `/metsainfo/`, tämä täytyy varmistaa laitteella vaiheessa 6, ja tarvittaessa turvaudutaan pelkkään custom scheme -mekanismiin iOS:llä.
  - `metsainfo://kiinteisto/<tunnus>` varamekanismina.
- Sovellus käsittelee saapuvan linkin `appUrlOpen`-tapahtumassa ja avaa kiinteistön suoraan.

### 5.4 Mobiilikäyttöliittymä

- Sivupaneeli korvautuu **bottom sheetillä**: kolme pysäytyskohtaa (kahva, puolikas, koko näyttö), vedettävissä, ei estä kartan käyttöä.
- Kosketuskohteet vähintään 44×44 pt, hover-riippuvaiset vuorovaikutukset korvataan.
- `env(safe-area-inset-*)` huomioidaan ylä- ja alareunassa.
- Karttakontrollit siirtyvät peukalon ulottuville näytön alaosaan.
- Nykyinen `@media (max-width: 768px)` -tyylittely toimii pohjana; sheet-ohjain on uusi `ui/sheet.js`.

## 6. Versionhallinta ja allekirjoitus

`version.js` säilyy versionumeron ainoana lähteenä. `scripts/sync-version.mjs` lukee sen ja kirjoittaa:

- `android/app/build.gradle`: `versionName` (esim. `4.0.0`) ja `versionCode` (monotoninen kokonaisluku)
- `ios/App/App/Info.plist`: `CFBundleShortVersionString` ja `CFBundleVersion`

Skripti ajetaan `npm run build` -vaiheen osana.

**Android-allekirjoitus**: upload-avain generoidaan kerran, säilytetään turvassa ja lisätään GitHub Secretsiin base64-koodattuna yhdessä salasanojen kanssa. Play App Signing hoitaa lopullisen allekirjoituksen.

**iOS-allekirjoitus**: ensimmäinen julkaisu tehdään paikallisesti Xcodella automaattisella allekirjoituksella. CI-automaatio (App Store Connect API -avain) lisätään vasta, kun julkaisuputki on todettu toimivaksi.

## 7. Kauppavaatimukset

### Tietosuoja

Molemmat kaupat vaativat julkisen tietosuojaselosteen URL:n. Toteutetaan `public/tietosuoja.html`, jonka Vite kopioi buildissa `dist/`-hakemistoon ja joka päätyy siten GitHub Pagesiin osoitteeseen `https://trotor.github.io/metsainfo/tietosuoja.html`. Sisältö on suoraviivainen: sovellus ei kerää käyttäjätietoja, ei sisällä analytiikkaa eikä mainoksia, ja sijainti sekä valokuvat käsitellään ja säilytetään ainoastaan käyttäjän laitteella. Kolmansien osapuolten palvelut rajoittuvat Metsäkeskuksen ja Maanmittauslaitoksen avoimiin rajapintoihin sekä karttalaattoihin.

Playn **Data Safety** -lomake ja Applen **tietosuojatarrat** täytetään vastaavasti: sijainti ja kuvat kerätään, mutta niitä ei siirretä laitteelta pois.

### Lupaperustelut

| Alusta | Avain | Teksti |
|--------|-------|--------|
| iOS | `NSLocationWhenInUseUsageDescription` | Sijaintia käytetään oman paikan näyttämiseen kartalla ja sen tunnistamiseen, millä metsikkökuviolla olet. |
| iOS | `NSCameraUsageDescription` | Kameraa käytetään maastohavaintojen valokuvaamiseen muistiinpanoihin. |
| iOS | `NSPhotoLibraryAddUsageDescription` | Tarvitaan, jos käyttäjä tallentaa kuvan laitteen kuvakirjastoon. |
| Android | `ACCESS_FINE_LOCATION` | — (perustelu näytetään sovelluksen omassa dialogissa ennen järjestelmäkyselyä) |
| Android | `CAMERA` | — |

`ACCESS_BACKGROUND_LOCATION` **ei** ole mukana.

### Applen sääntö 4.2 (minimum functionality)

Apple hylkää sovellukset, jotka ovat käytännössä verkkosivun kuori. Riski on todellinen, koska sovellus perustuu olemassa olevaan verkkosovellukseen. Torjunta: offline-vektoridata, GPS-seuranta ja kamerahavainnot ovat toimintoja, joita verkkoversiossa ei ole. Nämä kirjataan eksplisiittisesti App Review -muistiinpanoihin, ja katselmoijalle annetaan esimerkkikiinteistötunnus, jolla offline-lataus voidaan testata.

### Nimi, brändi ja työnantajasuhde

Sovellus julkaistaan henkilökohtaisella tilillä, käyttää työnantajan (Suomen metsäkeskus) avointa dataa ja kantaa nimeä "Metsäinfo". Tämä edellyttää kolme toimenpidettä ennen kauppatilin avaamista:

1. **Selkeä erottautuminen.** Sekä kauppakuvaukseen että sovelluksen ohjenäkymään lisätään maininta: sovellus on itsenäinen harrasteprojekti, joka hyödyntää Suomen metsäkeskuksen ja Maanmittauslaitoksen avoimia aineistoja, eikä ole näiden organisaatioiden virallinen tuote tai palvelu.
2. **Lähdeviittaukset.** CC BY 4.0 -attribuutiot molemmille tietolähteille sovelluksen tietonäkymässä.
3. **Varmistukset.** Asia kannattaa varmistaa esihenkilöltä ennen julkaisua, ja nimi "Metsäinfo" tarkistaa PRH:n tavaramerkkirekisteristä.

### Muut kauppavaatimukset

- Sisältöluokitus: kummallakin alustalla alin ikäluokka (ei käyttäjäsisältöä, ei ostoksia, ei mainoksia).
- Tilin poisto -vaatimus ei koske sovellusta, koska tilejä ei ole.
- Kuvakkeet ja splash-näytöt generoidaan `@capacitor/assets`-työkalulla yhdestä lähdekuvasta.
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

Jokainen vaihe on oma pull requestinsa. Vaiheet 0–1 ovat riskialttiimmat, koska ne koskevat olemassa olevaa verkkosovellusta.

| Vaihe | Sisältö | Riippuu |
|-------|---------|---------|
| **0** | Build-vaihe: `package.json`, Vite, CDN-kirjastot npm-riippuvuuksiksi, GitHub Actions julkaisee `dist/` Pagesiin. **Ei toiminnallista muutosta** — verkkosovelluksen on toimittava identtisesti. | — |
| **1** | Alusta-abstraktio `js/platform/`, `ui.js`:n pilkkominen, Capacitor-runko, `android/`- ja `ios/`-projektit. Molemmat alustat käynnistyvät ja näyttävät nykyisen sovelluksen. | 0 |
| **2** | Mobiilikäyttöliittymä: bottom sheet, kosketuskohteet, safe-area, kontrollien sijoittelu. | 1 |
| **3** | Sijainti ja seuranta: GPS-piste, keskitys, kompassi, "olet kuviolla". | 1 |
| **4** | Offline-välimuisti: lataus, tarjoilu, hallintanäkymä, offline-indikaattori. | 1 |
| **5** | Muistiinpanot ja valokuvat: tallennus, kartan markkerit, GeoJSON- ja CSV-vienti. | 3, 4 |
| **6** | Suosikit, natiivi jako, syvälinkit (App Links, Universal Links, custom scheme). | 1 |
| **7** | Kauppavalmius: kuvakkeet, splash, tietosuojaseloste, kauppametadata, kuvakaappaukset, allekirjoitusavaimet, versionsynkronointi. | 2–6 |
| **8** | Julkaisu: Play suljettu testi (12 testaajaa / 14 vrk) → tuotanto; iOS TestFlight → App Review. | 7 |

### Kriittinen polku

Vaihe 8 on aikataulun pullonkaula. Henkilökohtaisen kehittäjätilin on ajettava suljettu testi, jossa **12 testaajaa on opt-in-tilassa 14 peräkkäisen vuorokauden ajan**, ennen kuin tuotantojulkaisua voi edes hakea. Laskuri käynnistyy vasta kun Google on hyväksynyt julkaisun *ja* 12 testaajaa on asentanut sovelluksen omalla Google-tilillään — pelkkä kutsun lähettäminen ei riitä.

Käytännön seuraukset:

- Testaajien kokoaminen kannattaa aloittaa jo vaiheessa 5, ei vaiheessa 8.
- Suljettu testi käynnistetään heti vaiheen 7 valmistuttua.
- iOS:n App Review -kierros ajetaan rinnakkain, ei peräkkäin. App Review kestää tyypillisesti päiviä, joten iOS voi hyvinkin päästä kauppaan ensin.
- Realistinen kokonaisaikataulu vaiheesta 7 julkaisuun: **3–5 viikkoa**, josta 14 vrk on pelkkää odotusta.

## 10. Riskit

| Riski | Vaikutus | Torjunta |
|-------|----------|----------|
| Applen 4.2-hylkäys | iOS-julkaisu viivästyy | Offline, GPS ja kamera perusteluina katselmointimuistiinpanoissa; testikiinteistötunnus katselmoijalle |
| WFS-kutsut kaatuvat natiivissa CORS-tarkastukseen | Sovellus ei toimi lainkaan | `CapacitorHttp`-silta käyttöön jo vaiheessa 1; varmistetaan laitteella heti |
| Vaihe 0 rikkoo verkkosovelluksen | Nykyinen demo hajoaa | Ei toiminnallisia muutoksia; manuaalinen läpikäynti ennen mergeä; Pages-julkaisu vasta kun `dist/` todettu toimivaksi |
| 12 testaajaa ei löydy | Play-julkaisu blokkautuu | Kokoaminen aloitetaan vaiheessa 5; varasuunnitelmana organisaatiotilin harkinta |
| Nimi- tai brändiristiriita työnantajan kanssa | Julkaisu estyy tai vaatii uudelleennimeämisen | Varmistus esihenkilöltä ja PRH-tarkistus ennen kauppatilin avaamista |
| Kapsi-laattojen kuormitus mobiilikäytöstä | Palvelun väärinkäyttö | Ei esilatausta; normaali selauskäyttö vain. Jos kuormitus nousee, siirrytään MML:n rajapintaan API-avaimella |
| Metsäkeskuksen WFS:n ~2000 kuvion raja offline-latauksessa | Puutteellinen data ilman virheilmoitusta | Lataus tehdään kiinteistö kerrallaan, ei laajalta alueelta; kuviomäärä tarkistetaan ja käyttäjää varoitetaan rajan lähestyessä |

## 11. Versionumerointi

Mobiilijulkaisu on **4.0.0** — merkittävä arkkitehtuurimuutos (build-vaihe, alusta-abstraktio, uusi jakelukanava). `version.js` päivitetään vaiheessa 7, ja välivaiheet käyttävät esiversioita (`4.0.0-alpha.N`).
