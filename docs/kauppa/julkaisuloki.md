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
- Julkaisuyhteenveto: 11 muutosta odottaa lähetystä tarkastukseen. Hallinnoitu julkaiseminen pois päältä, joten hyväksytty sovellus julkaistaan heti. Lähetys vasta Teron luvalla.
