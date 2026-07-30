# Tietosuojalomakkeet — Play Data Safety ja Apple Privacy Labels

**Päivitetty**: 2026-07-29

Molemmat kaupat vaativat julkaisijan ilmoituksen siitä, mitä tietoja sovellus kerää. Ilmoitus on **sitova**: väärä ilmoitus voi johtaa sovelluksen poistoon kaupasta. Alla suositellut vastaukset perusteluineen, mutta lopullisen ilmoituksen antaa julkaisija ja vastuu on hänen.

**Tarkista lomakkeiden kysymykset julkaisuhetkellä** — Google ja Apple muuttavat niitä säännöllisesti, eivätkä alla olevat sanamuodot välttämättä vastaa lomaketta sellaisenaan.

---

## Lähtökohta: mikä on "keräämistä"

Tämä ratkaisee lähes kaikki vastaukset, joten se kannattaa ymmärtää ensin.

Molemmissa kaupoissa "kerääminen" tarkoittaa **tiedon siirtymistä pois laitteelta**. Tieto, joka syntyy laitteella, käsitellään laitteella ja jää laitteelle, ei ole kerättyä tietoa.

Metsäinfossa sijainti, valokuvat, muistiinpanot ja offline-aineistot eivät koskaan lähde laitteelta. Sovelluksessa ei ole palvelinta, tiliä eikä analytiikkaa. Siksi perusvastaus molemmissa kaupoissa on **ei kerättyä tietoa**.

Yksi asia vaatii harkintaa: sovellus tekee verkkohakuja kolmansien osapuolten avoimiin rajapintoihin, jolloin näille päätyy IP-osoite ja haettu karttaruutu tai kiinteistötunnus. Tämä on tavanomaista verkkoliikennettä, jota kumpikaan kauppa ei lue sovelluksen tiedonkeruuksi — mutta se on kuvattu tietosuojaselosteessa avoimuuden vuoksi, ja se on syytä mainita, jos katselmoija kysyy.

---

## Google Play — Data Safety

### Päävastaukset

| Kysymys | Vastaus |
|---------|---------|
| Kerääkö tai jakaako sovelluksesi vaadittuja käyttäjätietotyyppejä? | **Ei** |
| Salataanko tiedot siirron aikana? | Ei sovellu (tietoja ei siirretä) — jos lomake pakottaa vastauksen, verkkohaut käyttävät HTTPS:ää |
| Voiko käyttäjä pyytää tietojensa poistoa? | Ei sovellu — tiedot ovat vain laitteella ja poistuvat sovelluksen mukana |
| Onko sovellus riippumattoman turvallisuusarvioinnin läpikäynyt? | Ei |
| Sisältääkö sovellus mainoksia? | Ei |
| Onko sovelluksessa käyttäjätilejä? | Ei |

### Tietotyyppikohtaisesti

Jos vastaat "ei" pääkysymykseen, alla olevia ei kysytä lainkaan. Ne on kirjattu tähän, jotta perustelu on tallessa, jos katselmoija kysyy erikseen.

| Tietotyyppi | Kerätään? | Perustelu |
|-------------|-----------|-----------|
| Sijainti (tarkka) | Ei | Luetaan laitteen GPS:ltä, näytetään kartalla, ei tallenneta eikä lähetetä |
| Valokuvat | Ei | Tallennetaan sovelluksen omaan hakemistoon laitteella, ei siirretä |
| Tiedostot ja asiakirjat | Ei | Offline-aineistot ja muistiinpanot ovat laitteen sisäisiä |
| Henkilötiedot (nimi, sähköposti) | Ei | Sovellus ei pyydä näitä |
| Sovelluksen toiminta ja diagnostiikka | Ei | Ei analytiikkaa, ei kaatumisraportointia kolmannelle osapuolelle |
| Laite- ja muut tunnisteet | Ei | Ei mainostunnisteita, ei laitetunnisteiden keräystä |

### Käyttöoikeudet, jotka Play näyttää käyttäjälle

`ACCESS_FINE_LOCATION` ja `CAMERA`. Kumpikin on käyttäjän hyväksyttävissä ja evättävissä, ja sovellus toimii ilman kumpaakin.

**`ACCESS_BACKGROUND_LOCATION` ei ole mukana.** Jos se joskus lisätään, Play vaatii erillisen käyttötarkoituslomakkeen ja videon, joka esittelee toiminnon — se on oma projektinsa, ei sivutuote.

---

## Apple — App Privacy (Privacy Nutrition Labels)

### Päävastaus

| Kysymys | Vastaus |
|---------|---------|
| Kerääkö sovellus tietoja tästä sovelluksesta? | **Ei — "Data Not Collected"** |

Tämä tuottaa App Storeen merkinnän "Kehittäjä ei kerää tietoja tästä sovelluksesta", joka on tässä tapauksessa totuudenmukainen.

### Perustelu, jos katselmoija kysyy

Sijainti ja valokuvat käsitellään laitteella eikä niitä siirretä kehittäjälle, palvelimelle eikä kolmannelle osapuolelle. Sovelluksessa ei ole taustapalvelinta, käyttäjätilejä, analytiikkaa, mainos-SDK:ita eikä kaatumisraportointia. Verkkoliikenne rajoittuu julkisten avointen rajapintojen hakuihin, joissa ei välitetä käyttäjää yksilöiviä tietoja.

### Tracking

| Kysymys | Vastaus |
|---------|---------|
| Seurataanko käyttäjää eri yritysten sovellusten tai sivustojen välillä? | **Ei** |

Sovellus ei käytä App Tracking Transparency -kehystä, koska se ei seuraa. `NSUserTrackingUsageDescription` **ei** kuulu Info.plistiin — sen lisääminen ilman seurantaa aiheuttaa turhan lupakyselyn ja voi johtaa hylkäykseen.

### Kolmansien osapuolten SDK:t

Ei yhtään mainos-, analytiikka- tai seuranta-SDK:ta. Riippuvuudet ovat Capacitorin viralliset laajennukset (sijainti, kamera, tiedostojärjestelmä, jako, asetukset) sekä karttakirjasto Leaflet — mikään näistä ei kerää tietoja.

---

## Tarkistuslista ennen lomakkeiden lähetystä

- [ ] Tietosuojaseloste on julkisesti saatavilla osoitteessa https://trotor.github.io/metsainfo/tietosuoja.html ja aukeaa ilman kirjautumista
- [ ] Selosteen rekisterinpitäjätiedot ja yhteyssähköposti on täytetty
- [ ] Selosteen sisältö vastaa lomakkeisiin annettuja vastauksia — ristiriita on yleisin hylkäyksen syy
- [ ] Sovelluksessa ei ole yhtään analytiikka- tai mainoskirjastoa (tarkista riippuvuuslista, älä luota muistiin)
- [ ] `NSUserTrackingUsageDescription` ei ole Info.plistissä
- [ ] `ACCESS_BACKGROUND_LOCATION` ei ole manifestissa
- [ ] Jos jokin ominaisuus muuttuu myöhemmin niin, että tietoa siirtyy laitteelta, molemmat lomakkeet päivitetään **ennen** kyseisen version julkaisua
