# Julkaisuloki (App Store ja Google Play)

Sovellus `fi.inetor.metsainfo`, Inetor Oy. Jakelu vain Suomeen.

## 1.0 — ensimmäinen julkaisu

### iOS (App Store Connect, app id 6832988855)
- 11.11.2026: build 76 (commit 0f76f35) liitetty versioon 1.0. Ikäluokitus 4+, hinta ilmainen, saatavuus FIN.
- 11.11.2026: lähetetty App Reviewiin (`fastlane ios submit`), tila WAITING_FOR_REVIEW. Julkaisu automaattisesti hyväksynnän jälkeen.
- Aiemmat buildit 65, 67, 69 ja 73 ovat kelvollisia mutta korvattuja. Build 73:ssa oli varoitus ITMS-90683, joka on korjattu buildissa 76.

### Android (Google Play)
- 12.11.2026: AAB 1.0 (versionCode 79), upload-avain `metsainfo-upload` (CN=Inetor Oy), sisäinen raita `completed`.
- 12.11.2026: suomenkielinen kauppasivu, kuvake, esittelykuva ja 5 kuvakaappausta (`fastlane android metadata`).
- 12.11.2026 (Teron luvalla, Play Console Chromessa), App content:
  - Tietosuojakäytäntö https://trotor.github.io/metsainfo/tietosuoja.html
  - Sisäänkirjautuminen: ei rajoituksia. Mainokset: ei. Mainostunnus: ei (merged manifestissa ei AD_ID:tä).
  - IARC: "Kaikki muut sovellustyypit", kaikki vastaukset "Ei" → PEGI 3, ESRB Everyone, USK 0, ClassInd L. Yhteysosoite inetoroy@gmail.com.
    - Online-sisältö "Ei": kartta- ja metsävaratiedot ovat sovelluksen toiminto, eivät sisältökirjasto.
  - Kohdeyleisö 18+ (ei alaikäisrajausta).
  - Data safety: ei kerää eikä jaa. GPS-sijainti pysyy laitteella; karttapyynnöt (Metsäkeskus, MML, Kapsi) sisältävät vain katsotun alueen, ei tunnisteita. Linjassa iOS:n App Privacyn ("Data Not Collected") ja tietosuojasivun kanssa.
  - Viranomaissovellus: ei. Finanssi: ei. Terveys: ei. Elinkeinonharjoittaja: kyllä (peritty kehittäjätililtä).
- Kaupan asetukset: luokka Kartat ja navigointi, sähköposti inetoroy@gmail.com, sivusto https://trotor.github.io/metsainfo/.
- Tuotanto: luonnos 1.0 (79) API:lla sisäiseltä raidalta, maat: vain Suomi, julkaisu tallennettu valmiiksi (varoitus: ei deobfuskointitiedostoa, ei estä).
- 12.11.2026: Teron luvalla 11 muutosta (tuotanto 1.0 (79), täysi käyttöönotto, vain Suomi) lähetetty tarkastukseen julkaisuyhteenvedosta, tila "Muutoksia tarkistetaan". Hallinnoitu julkaiseminen pois päältä, joten sovellus julkaistaan heti hyväksynnän jälkeen.

### iOS 1.0 hyväksytty
- 13.11.2026 tarkistettu: 1.0 (76) READY_FOR_SALE, reviewSubmission 580caef9-… COMPLETE. Sovellus on myynnissä App Storessa (Suomi).

## 4.0.0 — yhteinen versionumero, värikortit, hinta-arvio

Haara `feature/4.0-hinta-arvio`. Suunnitelmat: `docs/plans/2026-11-13-*`.

### iOS
- IAP `fi.inetor.metsainfo.hintaarvio` (id 6834435399, NON_CONSUMABLE):
  - Hinta 9,99 € 31.1.2027 asti, sitten 12,99 €. Saatavuus Suomi.
  - Tarkastuskuva ladattu, tila READY_TO_SUBMIT (`fastlane ios iap`, `iap_screenshot`).
- Build 4.0.0 (95) ladattu 13.11.2026, korvattu katselmoinnin korjausten jälkeen buildilla 98 (commit 45504a1).
- Tero lisäsi IAP:n versiosivulla, jolloin syntyi luonnoslähetys. `fastlane ios submit` lisäsi version samaan lähetykseen.
- 13.11.2026: haara yhdistetty `main`iin (c944119). Verkkoversio 4.0.0 ja tietosuojasivu (päivitetty 13.11.2026) ovat julki.
- 13.11.2026: Teron luvalla 4.0.0 (98) ja IAP lähetetty App Reviewiin (reviewSubmission 78d15b77-…). Tila WAITING_FOR_REVIEW, julkaisu automaattisesti hyväksynnän jälkeen.
- TestFlight-hiekkalaatikko-ostoa ei testattu oikealla laitteella ennen lähetystä (Teron päätös).

### Android
- Billing-plugin `android/app/src/main/java/fi/inetor/metsainfo/PurchasesPlugin.java` (Play Billing 9.1.0), rekisteröidään MainActivityssä.
- 13.11.2026: AAB 4.0.0 (versionCode 102, Billing 9.1.0) sisäiselle raidalle `completed`.
- 13.11.2026: Play-kertaostotuote `fi.inetor.metsainfo.hintaarvio` (ostovaihtoehto `buy`, legacy-yhteensopiva) luotu ja aktivoitu, FI 9,99 € (`scripts/play-iap.py --live`).
- **1.2.2027: aja `python3 scripts/play-iap.py --live`, joka vaihtaa hinnaksi 12,99 €.** Playssa ei voi ajastaa kertaostotuotteen hintaa.
- Seuraavaksi:
  - Tero hyväksyy tarjouskoodien ehdot. Vain tilin omistaja voi hyväksyä ne.
  - Tarjouskoodikampanja tehdään tarkastajalle.
  - App access -kohdan vastaukseksi vaihdetaan "Kyllä" ja ohjeeksi tarjouskoodi.
  - Kauppatekstit päivitetään.
  - Tuotanto 4.0.0 julkaistaan ja lähetetään tarkastukseen.
