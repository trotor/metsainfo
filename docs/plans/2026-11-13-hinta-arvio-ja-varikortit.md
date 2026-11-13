# Hinta-arvio (maksullinen lisäosa) ja värikoodatut inforuudut — ehdotus

**Tila:** ehdotus 13.11.2026, odottaa päätöksiä (luku 9). Ei vielä toteutussuunnitelma.

**Tavoite:**
1. Sovellukseen tulee **puukaupan hinta-arvio**. Kantohinnat haetaan verkosta tai käyttäjä syöttää ne itse, ja sovellus laskee kiinteistön ehdotettujen hakkuiden ja koko puuston arvon. Arvio on maksullinen lisäosa vain kaupoista ladattavassa sovelluksessa.
2. Mobiilin **inforuudut värikoodataan** asiaryhmittäin, jotta ne erottuvat selvemmin.
3. Julkaisujärjestys: ensin App Store, sitten Google Play.

**Mallikuvat:** [2026-11-13-hinta-arvio-luonnos.png](2026-11-13-hinta-arvio-luonnos.png). Niissä ovat yhteenveto värikorteilla, Arvio-välilehti ja ostonäkymä. Luvut ovat testikiinteistön 592-404-1-32 oikeita lukuja.

## 1. Testattu: hintojen haku toimii ilman tekoälyä

Testattu 13.11.2026.

**Lähde:** Metsäteollisuus ry:n puukaupan viikkoseuranta Luonnonvarakeskuksen tilastotietokannassa (PxWeb).
- Taulukko on `0100_metryv.px`, "Kantohinnat viikoittain". Se päivittyy viikoittain, viimeksi 10.11.2026, viikko 2026W45.
- Metsälehden hintakatsaukset perustuvat samaan seurantaan. Metsälehden sivuja ei kannata lukea koneellisesti, koska käyttöehdot ja tekijänoikeus estävät sen eikä sivujen rakenne ole vakaa.

**Rajapinta:**
- Haku: `POST https://statdb.luke.fi/PxWeb/api/v1/fi/LUKE/met/metryv/0100_metryv.px`, vastausmuoto `json-stat2`.
- Ulottuvuudet:
  - Viikko (`W`), aikasarja 2020W01 alkaen
  - Hinta-alue (`MPKH`), 9 aluetta:
    - koko maa 9
    - Etelä-Suomi 1
    - Keski-Suomi 3
    - Savo-Karjala 4
    - Kymi-Savo 5
    - Etelä-Pohjanmaa 6
    - Pohjois-Pohjanmaa 71
    - Kainuu-Koillismaa 72
    - Lappi 8
  - Hakkuutapa (`HAKT`): uudistushakkuu 8021, harvennushakkuu 8023, ensiharvennus 8022
  - Puutavaralaji (`PTL`): mänty-, kuusi- ja koivutukki N1–N3, mänty-, kuusi- ja koivukuitu N4–N6 sekä mänty- ja kuusipikkutukki N7–N8
- Vastaus on 2,4 kt ja tulee 0,14–0,17 sekunnissa. Tavallinen `fetch` riittää, eikä tekoälyä tai välipalvelinta tarvita.

**CORS:** palvelin vastaa `access-control-allow-origin: *` myös esitarkistukseen. Haku toimii siis suoraan:
- julkiselta sivulta (`https://trotor.github.io`, testattu oikealla selaimella)
- iOS-sovelluksesta (`capacitor://localhost`)
- Android-sovelluksesta (`https://localhost`)

**Huomioita datasta:**
- Viikon hinta on jo neljän viikon liukuva keskiarvo, kuten taulukon huomautus kertoo.
- Osa soluista on tyhjiä, esimerkiksi ensiharvennuksen mäntytukki viikolla 42 Keski-Suomessa. Varasääntö tyhjälle solulle:
  1. edellinen viikko samalta alueelta
  2. koko maa
  3. tyhjä kenttä, jonka käyttäjä täyttää
- **Tiedoista vastaa Metsäteollisuus ry, ei Luke.** Lisenssiä ei mainita erikseen. Maksulliseen tuotteeseen pitää varmistaa käyttölupa ja lähdemerkintä Lukelta (tietopalvelu@luke.fi) tai Metsäteollisuudelta. Tämä on avoin kohta luvussa 9.

**Koko ketju testattiin kehityspalvelimella sovelluksen omilla moduuleilla:**
- Kiinteistön 2 palstaa ja 19 kuviota haettiin Metsäkeskukselta, kantohinnat Lukelta, ja arvo laskettiin kuvioittain.
- Aikaa kului yhteensä 622 ms.
- Tulokset Keski-Suomen viikon 45 hinnoilla:
  - Koko puusto uudistushakkuun hinnoin: noin 226 300 € (tukkia 1 872 m³, kuitua 2 968 m³)
  - Ehdotetut hakkuut 2027–2036 yhteensä: noin 99 100 €
    - 2027 (ensiharvennus ja 2 harvennusta): 7 200 €
    - 2031 (uudistus): 31 200 €
    - 2035: 38 200 €

## 2. Laskentamalli

Metsäkeskuksen kuviotiedoista saadaan tukki- ja kuitupuun määrä (m³/ha), puulajiosuudet (mänty, kuusi ja muut), pinta-ala sekä hakkuuehdotuksen tyyppi ja vuosi. Puulajikohtaista tukki- ja kuitujakoa ei ole, joten se johdetaan puulajiosuuksista.

1. **Puulajiosuudet:** `PROPORTIONPINE`, `PROPORTIONSPRUCE` ja `PROPORTIONOTHER` normalisoidaan summaan 1. Jos osuudet puuttuvat, käytetään pääpuulajia (`MAINTREESPECIES`). "Muut" hinnoitellaan koivun hinnoilla.
2. **Kuvion arvo hakkuutavalla h:**
   `Σ puulaji osuus × (tukki_m³ × tukkihinta[h] + kuitu_m³ × kuituhinta[h])`
   missä `tukki_m³ = SAWLOGVOLUME × AREA`.
3. **Hakkuuehdotuksen tyyppi hintojen hakkuutavaksi:**
   - ensiharvennus: koodit 2 ja 20
   - harvennus: koodit 3, 11, 13, 14 ja 94
   - uudistushakkuu: koodit 1, 4–8, 12, 15 ja 93
   - Muut koodit eivät kuulu arvioon (lepo 0, erikoishakkuut 9 ja 90–92).
4. **Poistuma:**
   - uudistushakkuu 100 %
   - harvennus 30 %
   - ensiharvennus 35 %

   Nämä ovat oletuksia, jotka näytetään käyttäjälle, ja niitä voi myöhemmin muuttaa asetuksista. Metsäkeskuksen aineisto ei kerro kertymää.
5. **Näytettävät luvut:**
   - ehdotetut hakkuut vuosittain ja yhteensä
   - koko puuston kantoraha-arvo uudistushakkuun hinnoin. Selite kertoo, ettei puustoa voi hakata kerralla.
   - kuviokohtainen arvo Kuviot-välilehdellä
6. Kaikki laskenta on puhtaita funktioita. Testit tehdään Vitestillä json-stat2- ja kuvio-fixtureilla.

## 3. Käyttöliittymä

- **Arvio-välilehti** neljänneksi välilehdeksi. Se näkyy vain sovelluksessa (`isNative()`), ei verkkoversiossa.
  - **Hintalähde-rivi:** hinta-alue ja viikko, esimerkiksi "Keski-Suomi, vko 45/2026", sekä painike **"Hae verkosta"**. Hinta-alue päätellään kunnasta ja sitä voi vaihtaa (luku 9).
  - **Hakkuutapa:** valinta uudistushakkuun, harvennuksen ja ensiharvennuksen välillä. Valitun hakkuutavan 3 × 2 hintataulukko on muokattavissa. Itse syötetty hinta korostetaan meripihkalla, ja verkon hinnat voi palauttaa.
  - **Hinnat tallennetaan laitteelle.** Edellinen haku toimii ilman verkkoa, ja käyttäjän omat hinnat, esimerkiksi saadun puukauppatarjouksen mukaiset, säilyvät.
  - **Tulokset:** vuosipalkit, yhteissumma ja koko puuston arvo, sekä aina näkyvä selite "Suuntaa-antava arvio…".
  - **Arvioraportti:** jakonäkymällä tekstinä ja CSV:nä. Esimerkiksi kuolinpesän osakkaille jaettavaksi.
- **Lukittu tila:** arvo-kortti näkyy yhteenvedossa, mutta summa on piilotettu ("? ??? €") ja kortissa on painike "Kokeile". Oikean kiinteistön summaa ei näytetä ennen ostoa.
- **Ostonäkymä:**
  - edut ja kertahinta
  - "Kokeile esimerkkimetsällä"
  - "Osta"
  - "Palauta aiempi osto"
  - lähdemerkintä ja tietosuojalinkki

## 4. Värikoodatut inforuudut

Jokaisella asiaryhmällä on oma väripari: tumma teksti ja reunus sekä vaalea pohja. Kontrasti on vähintään 4,5:1. Värit lisätään `:root`-muuttujiksi nykyisen maastopaletin rinnalle.

| Ryhmä | Teksti / reunus | Pohja | Sisältö |
|---|---|---|---|
| Puusto | `#2d5a27` (havu) | `#e6f0e2` | tilavuus, puulajit, tukki/kuitu, kasvu |
| Arvo | `#7a4d00` / `#d9a32b` | `#fbefd2` | hinta-arvio (maksullinen) |
| Hakkuut | `#9a3a0b` / `#e07a3f` | `#fce6da` | hakkuuehdotukset. Vuosisiru on täysi väri, kun hakkuu on 0–2 vuoden päässä, ja ääriviiva myöhemmille. |
| Metsänhoito | `#155e66` / `#3a9aa6` | `#dceff1` | taimikonhoito, perustaminen |
| Suojelu | `#5b318a` | `#eee5f7` | METSO-, metsälaki- ja erityiskohteet, rajoitukset |
| Sijainti | `#1a73e8` | – | oma sijainti ("Olet: …"), kuten nyt |
| Aineisto | `#4f5a49` | `#eceee9` | mittausvuosi ja lähde. Keltainen huomio, jos aineisto on yli 10 vuotta vanhaa. |

- Värit tulevat vain mobiilinäkymään (`MOBILE_QUERY`), ja työpöytä säilyy ennallaan CLAUDE.md:n mukaisesti.
- Värikortit ovat ilmaisia ja tulevat myös verkkoversion mobiilinäkymään. Vain Arvio on maksullinen.
- Tieto ei saa olla pelkän värin varassa, joten kortin otsikko kertoo aina ryhmän.

## 5. Kaupallistaminen

**Kohderyhmät:**
- kuolinpesät, jotka jakavat tai myyvät metsää
- pienmetsän ostajat, jotka arvioivat myynnissä olevaa tilaa
- satunnaiset metsänomistajat ennen puukauppaa

Yhteistä on, että tarve on **kertaluonteinen tai jaksoittainen**. Arvio tarvitaan muutaman viikon aikana, ja sitten pitkään ei.

| Malli | Plussat | Miinukset |
|---|---|---|
| **Kertaosto** (non-consumable / one-time product) | Sopii kertatarpeeseen. Ei unohtuneita tilauksia eikä niistä tulevia huonoja arvosteluja. Yksinkertaisin molemmissa kaupoissa: ei EULA- ja uusiutumisehtovaatimuksia eikä palvelinta. Palautus toimii laitteiden välillä. | Ei toistuvaa tuloa. Ilmaista kokeilua kaupat eivät tarjoa kertaostolle. |
| **Vuositilaus + ilmainen kokeilu** (esim. 7 pv, sitten 14,99 €/v) | Toistuva tulo. Molemmat kaupat hoitavat kokeilun. | Kuolinpesä käyttää viikon, ja tilaus jatkuu, mikä johtaa peruutuksiin ja huonoihin arvosteluihin. Arvio perustuu ilmaiseen dataan, joten maksajan on vaikea nähdä, mistä hän maksaa jatkuvasti. Applen 3.1.2-vaatimukset koskevat tilauksia (ehdot, uusiutumisteksti ja EULA), ja TassuTie hylättiin näistä. Käytettävä summa jää pieneksi. |
| **Aikarajattu käyttöoikeus** (30 pv / 1 v) | Vastaa kertatarvetta. | Applen ei-uusiutuva tilaus vaatii oman palautusmekanismin laitteiden välille, käytännössä käyttäjätilin. Google ei tue tätä suoraan. Raskain toteuttaa. |
| **Esimerkkimetsä** (kuvitteellinen kiinteistö) | Toimiva kokeilu ilman aikarajaa tai tiliä. Näyttää koko toiminnon oikeilla tämän viikon hinnoilla. Tarkastaja näkee ominaisuuden. | Ei yksin tuota tuloa. Kuuluu muiden mallien rinnalle. |

**Suositus: kertaosto 9,99 € ja ilmainen esimerkkimetsä.**
- Metsätilan hakkuiden arvo on kymmeniä tuhansia euroja, joten 9,99 € on pieni summa. Hinta sopii myös kuolinpesän yhteiskustannukseksi.
- Julkaisuun voi tehdä aloitushinnan, esimerkiksi 6,99 €, App Storen ajastetulla hinnanmuutoksella. Playssa hinta vaihdetaan käsin.
- Esimerkkimetsä on sovelluksen mukana tuleva kuvitteellinen tila "Esimerkkimetsä (kuvitteellinen)", jossa on noin 10–12 kuviota. Siinä Arvio toimii kokonaan, myös "Hae verkosta". Näin käyttäjä näkee, mitä ostaa, mutta oikean kiinteistön summa vaatii oston.
- Jos käyttö osoittautuu toistuvaksi, esimerkiksi metsäammattilaisilla, vuosilisenssi voidaan lisätä myöhemmin kertaoston rinnalle. Ostaneet pitävät tuotteensa.

## 6. Arkkitehtuuri

```
js/pricing/prices.js      json-stat2 → hintataulukko, varasääntö tyhjille soluille, alueen valinta (puhdas)
js/pricing/estimate.js    kuvio- ja kiinteistöarvio, hakkuutapojen kartoitus, poistumat (puhdas)
js/pricing/region.js      kuntanumero → hinta-alue (taulukko, puhdas)
js/platform/prices.js     Luke-haku, välimuisti laitteelle, omat hinnat
js/platform/purchases.js  isAvailable(), getProduct(), purchase(), restore(), isEntitled()
js/ui/estimate.js         Arvio-välilehti ja arvo-kortti
js/ui/paywall.js          ostonäkymä ja esimerkkimetsän avaus
public/demo/esimerkkimetsa.json   kuvitteellinen kiinteistö ja kuviot
ios/App/App/PurchasesPlugin.swift            StoreKit 2 (paikallinen Capacitor-plugin)
android/app/src/main/java/.../PurchasesPlugin.kt   Play Billing 8 (paikallinen plugin)
```

- **Verkkoversiossa ei ole ostoja:** `purchases.isAvailable()` palauttaa `false`, eikä Arvio-välilehteä renderöidä. Koodi on GitHubissa, mutta toiminto ei ole verkossa käytössä.
- **Osto-plugin tehdään itse, ei kolmannen osapuolen SDK:lla:**
  - iOS:llä StoreKit 2 (`Product.purchase()`, `Transaction.currentEntitlements`) ja Androidilla Billing 8 (`queryPurchasesAsync`, kuittaus kolmen päivän kuluessa). Kumpikin on noin 150 riviä.
  - RevenueCat jakaisi ostotiedot kolmannelle osapuolelle, jolloin App Privacy- ja Data safety -ilmoituksia pitäisi muuttaa ja maksaa palvelusta.
  - cordova-plugin-purchase on vaihtoehto, mutta riippuvuuden pitää pysyä Googlen vaatiman Billing-version tahdissa.
  - Inetorilla on kokemusta StoreKit 2:sta (Liikennemerkit) ja Billingistä (app-store-release-skill).
- **Oikeus tarkistetaan laitteella:** iOS:llä allekirjoitettu transaktio ja Androidilla Billingin ostot. Tila säilytetään välimuistissa, jotta se toimii ilman verkkoa.
- **Tietosuoja ei muutu:**
  - Hintahaku Lukelle ei sisällä tunnisteita eikä sijaintia, vain hinta-alueen.
  - Ostot hoitaa kauppa.
  - App Privacy ("Data Not Collected") ja Data safety ("ei kerää") pysyvät ennallaan. Tietosuojasivulle lisätään maininta hintahausta ja kaupan ostoista.

## 7. Toteutus- ja julkaisujärjestys (Apple ensin)

| Vaihe | Sisältö | Versio |
|---|---|---|
| **A** | Värikortit (ilmainen, myös web-mobiili) | 1.1 iOS + Android + verkko |
| **B** | Hinta-arvio: laskenta, Arvio-välilehti, esimerkkimetsä, StoreKit 2 -plugin | 1.2 iOS |
| **C** | Billing 8 -plugin samaan koodiin | 1.2 Android |

**Vaihe A, värikortit:**
- Ei kauppa- eikä tietosuojamuutoksia.
- Voidaan julkaista heti, kun ensimmäiset 1.0-tarkastukset ovat läpi.

**Vaihe B, App Store:**
1. IAP-tuote `fi.inetor.metsainfo.hintaarvio` (non-consumable) luodaan rajapinnalla. Hinta ja perusalue FIN tehdään `release_settings`-lanen tapaan.
2. Tarkastuskuva ostonäkymästä 6,9" -koossa on pakollinen.
3. Tero lisää IAP:n versiosivulla kohdasta "In-App Purchases → +", koska ensimmäistä non-consumablea ei voi liittää rajapinnalla. Sen jälkeen `fastlane ios submit` liittää version samaan lähetykseen. `submit`-laneen tarvitaan pieni muutos.
4. Ostot ja palautus testataan TestFlightissa oikealla iPhonella sandbox-tilillä.
5. Tarkastusmuistiinpanoihin kirjataan, missä osto on (Arvio-välilehti tai arvo-kortti → "Kokeile"), ja esimerkkimetsä tarkastajan kokeiltavaksi.

**Vaihe C, Google Play:**
1. Ladataan build, jossa on BILLING-lupa, sisäiseen testiin. Tuotteen voi luoda vasta, kun Play on nähnyt BILLING-luvan.
2. Kertaostotuote luodaan rajapinnalla, hinta asetetaan Suomeen.
3. Ostot testataan lisenssitestaajilla sisäisellä raidalla.
4. Tarkastajalle tehdään tarjouskoodi App access -ilmoitukseen. Tarjouskoodien ehdot voi hyväksyä vain kehittäjätilin omistaja, eli Tero, kerran.
5. App access -ilmoitukseen vaihdetaan vastaukseksi "Kyllä" kertaoston takia.
6. Lopuksi tuotantojulkaisu.

**Versioiden tahdistus:** skillin sääntöjen mukaan versio 1.2 on sama molemmissa kaupoissa. Androidin viive kirjataan julkaisulokiin. Jos Billing ei valmistu samaan aikaan, Android 1.2 voi lähteä ilman Arvio-välilehteä, ja maininta tulee vain App Storen julkaisutietoihin.

## 8. Riskit

- **Datan käyttölupa** (luku 1): pitää selvittää ennen vaihetta B.
- **Hinta-alueiden rajat:** kunta → alue -taulukko pitää tarkistaa Metsäteollisuuden aluejaosta. Käyttäjä voi aina vaihtaa alueen.
- **Arvion tarkkuus:** tukki- ja kuitujako on johdettu puulajiosuuksista, poistuma on oletus ja metsävaratieto voi olla vanhaa. Selite näkyy aina, ja Aineisto-kortti varoittaa vanhasta datasta.
- **Applen ohjeet 3.1.1:** ostonäkymässä ei saa mainita verkkoversiota eikä muita hintoja.

## 9. Päätettävät asiat

1. **Malli ja hinta:** kertaosto 9,99 € (suositus) vai vuositilaus kokeilulla? Tehdäänkö aloitushinta?
2. **Datan lupa:** kysytäänkö Lukelta tai Metsäteollisuudelta? Voin luonnostella viestin.
3. **Hinta-alue:** riittääkö automaattinen arvaus kunnasta ja käyttäjän vaihtomahdollisuus?
4. **Värikortit:** tehdäänkö vaihe A erillisenä 1.1-versiona ennen hinta-arviota (suositus), vai yhdessä version 1.2 kanssa?
5. **Poistumaoletukset** (harvennus 30 %, ensiharvennus 35 %): kelpaavatko vai halutaanko asetus?
