# App Review -muistiinpanot ja julkaisun tarkistuslista

**Päivitetty**: 2026-07-29

---

## Apple — App Review Information

Kenttä löytyy App Store Connectista kohdasta *App Review Information → Notes*. Katselmoija lukee sen ennen testausta, ja hyvin kirjoitettuna se estää suurimman osan turhista hylkäyksistä.

### Kirjautumistiedot

Ei tarvita. Sovelluksessa ei ole käyttäjätilejä eikä kirjautumista.

### Muistiinpanot katselmoijalle

```
Metsäinfo näyttää Suomen avoimet metsävaratiedot kartalla ja on tarkoitettu
metsänomistajien ja metsäammattilaisten maastokäyttöön.

TESTAAMINEN
Sovellus ei vaadi kirjautumista. Aineisto kattaa vain Suomen.

1. Anna sovelluksen käynnistyä — kartta avautuu Keski-Suomeen.
2. Kirjoita hakukenttään kiinteistötunnus 592-404-1-32 ja hae.
   Kartta siirtyy kiinteistölle ja sivupaneeliin latautuu metsävarayhteenveto.
3. Napauta paneelin "Lataa maastoon" -painiketta. Kiinteistön tiedot
   tallentuvat laitteelle.
4. Kytke laite lentotilaan ja avaa sama kiinteistö uudelleen — tiedot
   näkyvät edelleen, koska ne luetaan laitteelta.
5. Sijaintitoiminto vaatii, että olet Suomessa. Simulaattorissa voi käyttää
   sijainnin simulointia; sen ulkopuolella kartalla ei näy kuviotietoa.

GUIDELINE 4.2 — MINIMUM FUNCTIONALITY
Sovelluksella on olemassa myös verkkoversio, mutta natiivisovellus tarjoaa
toimintoja, joita verkkoversiossa ei ole eikä voi olla:

• Offline-käyttö: metsikkökuviot, kiinteistörajat ja hakkuuilmoitukset
  ladataan laitteelle ja ovat käytettävissä ilman verkkoyhteyttä. Tämä on
  sovelluksen keskeisin ominaisuus, koska kohdealueilla eli talousmetsissä
  ei useinkaan ole mobiiliverkkoa.
• Jatkuva GPS-seuranta ja kompassisuunta, joiden avulla sovellus kertoo,
  millä metsikkökuviolla käyttäjä seisoo juuri sillä hetkellä.
• Kameralla otetut maastohavainnot, jotka tallentuvat laitteelle
  sijaintitietoineen ja ovat vietävissä GeoJSON- ja CSV-muodossa.

TIETOSUOJA
Sovellus ei kerää käyttäjätietoja. Sijainti, valokuvat ja muistiinpanot
käsitellään ja säilytetään ainoastaan laitteella. Ei tilejä, ei analytiikkaa,
ei mainoksia, ei kolmansien osapuolten seuranta-SDK:ita.
Tietosuojaseloste: https://trotor.github.io/metsainfo/tietosuoja.html

AINEISTOT
Metsävaratiedot: Suomen metsäkeskus, avoin data, CC BY 4.0
Kiinteistörajat ja karttapohjat: Maanmittauslaitos, CC BY 4.0
Sovellus on itsenäinen tuote eikä näiden organisaatioiden virallinen palvelu.
```

### Yhteystiedot

| Kenttä | Arvo |
|--------|------|
| Etunimi / Sukunimi | [TÄYTÄ] |
| Puhelinnumero | [TÄYTÄ] |
| Sähköposti | [TÄYTÄ: tukisähköposti] |

---

## Todennäköiset hylkäysperusteet ja niiden torjunta

| Sääntö | Riski | Torjunta |
|--------|-------|----------|
| 4.2 Minimum Functionality | Sovellus tulkitaan verkkosivun kuoreksi | Offline, GPS ja kamera kuvattu muistiinpanoissa yllä. Varmista että ne **toimivat** ennen lähetystä — pelkkä maininta ei riitä, katselmoija testaa. |
| 5.1.1 Data Collection and Storage | Lupaperustelut liian ylimalkaisia | Info.plist-tekstit kirjoitettu konkreettisiksi, ks. `kauppatekstit.md` |
| 5.1.1(v) Account Sign-In | Turha lupa- tai kirjautumisvaatimus | Sovelluksessa ei ole kirjautumista, eikä sijaintia pyydetä ennen kuin käyttäjä painaa sijaintipainiketta |
| 2.1 App Completeness | Kaatuu tai näyttää tyhjää aineiston puuttuessa | Testaa Suomen ulkopuolisella sijainnilla — sovelluksen on kerrottava selkeästi, ettei aineistoa ole, ei näytettävä tyhjää virhettä |
| 5.2.1 Intellectual Property | Nimi tai aineisto tulkitaan viranomaisen omaksi | Vastuuvapauslauseke kauppakuvauksessa ja sovelluksen ohjenäkymässä, CC BY 4.0 -viittaukset näkyvissä |

---

## Google Play — julkaisupolku

Organisaatiotilillä **ei ole suljetun testin vaatimusta**. Sovelluksen voi viedä suoraan tuotantoon, kun kauppalistaus ja lomakkeet ovat valmiit.

Suositeltu eteneminen silti:

1. **Internal testing** — oma laite ja pari kollegaa. Nopein palautekierros, ei katselmointia.
2. **Production** — julkaisu. Ensimmäisen julkaisun katselmointi kestää tyypillisesti päivistä viikkoon, päivitykset nopeammin.

Ensimmäisessä julkaisussa kannattaa käyttää **porrastettua julkaisua** (esim. 20 %), jotta kaatumiset näkyvät ennen kuin koko käyttäjäkunta saa version.

### Vaaditut Play Console -tiedot

- [ ] Kauppalistaus: nimi, lyhyt ja täysi kuvaus, kuvakaappaukset, kuvake 512×512, esittelykuva 1024×500
- [ ] Sisältöluokituskysely täytetty
- [ ] Kohdeyleisö ja sisältö: ei suunnattu lapsille
- [ ] Data Safety -lomake (ks. `tietosuojalomakkeet.md`)
- [ ] Tietosuojaselosteen URL
- [ ] Sovelluksen käyttöoikeudet perusteltu, jos Play kysyy
- [ ] App signing: Play App Signing käytössä, upload-avain tallessa ja varmuuskopioitu
- [ ] Target API level täyttää Playn kulloisenkin vaatimuksen

---

## Apple — julkaisupolku

1. **TestFlight, sisäinen testaus** — oma tiimi, ei App Review -kierrosta. Rakenna tänne heti kun sovellus käynnistyy laitteella.
2. **TestFlight, ulkoinen testaus** — vaatii kevyen katselmoinnin. Ohita, jos ulkoisia testaajia ei tarvita.
3. **App Store -lähetys** — täysi App Review. Tyypillisesti muutama päivä, mutta varaudu useampaan kierrokseen.

### Vaaditut App Store Connect -tiedot

- [ ] Kauppalistaus: nimi, alaotsikko, avainsanat, kuvaus, mainosteksti
- [ ] Kuvakaappaukset 6,9" iPhone ja 13" iPad
- [ ] Sovelluskuvake 1024×1024, ei läpinäkyvyyttä, ei pyöristettyjä kulmia
- [ ] App Privacy -tiedot (ks. `tietosuojalomakkeet.md`)
- [ ] Ikäraja 4+
- [ ] Tuki- ja markkinointi-URL
- [ ] App Review Information -muistiinpanot (yllä)
- [ ] Export Compliance: sovellus käyttää vain standardia HTTPS:ää → vapautettu, mutta kysymykseen on vastattava

---

## Julkaisujärjestys

Aja molemmat rinnakkain, älä peräkkäin.

```
Vaihe 7 valmis
        │
        ├── Play: Internal testing → Production (porrastettu 20 % → 100 %)
        │
        └── Apple: TestFlight sisäinen → App Store -lähetys → App Review
```

Realistinen aika vaiheen 7 valmistumisesta molempiin kauppoihin: **1–2 viikkoa**, riippuen App Review -kierrosten määrästä. Play on tyypillisesti nopeampi.
