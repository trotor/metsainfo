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
- Kesken, tehdään Play Consolessa: App content -ilmoitukset (Data safety: ei tietojen keruuta, IARC, kohdeyleisö, mainokset: ei, sovelluksen käyttö: ei rajoituksia), kategoria, maat (vain Suomi), tuotantojulkaisu ja lähetys tarkastukseen. Nämä tehdään vasta Teron luvalla.
