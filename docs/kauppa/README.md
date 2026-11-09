# Kauppajulkaisun materiaalit

Metsäinfon Android- ja iOS-julkaisuun tarvittavat tekstit, lomakevastaukset ja tarkistuslistat. Toteutussuunnitelma on erikseen: [../plans/2026-07-28-mobiilisovellukset-design.md](../plans/2026-07-28-mobiilisovellukset-design.md).

| Tiedosto | Sisältö |
|----------|---------|
| [kauppatekstit.md](kauppatekstit.md) | Kauppalistausten tekstit molempiin kauppoihin, lupatekstit, vastuuvapauslauseke, kuvakaappaussuunnitelma |
| [tietosuojalomakkeet.md](tietosuojalomakkeet.md) | Play Data Safety- ja Apple App Privacy -vastaukset perusteluineen |
| [app-review.md](app-review.md) | Applen katselmointimuistiinpanot, hylkäysriskit ja molempien kauppojen julkaisupolut |
| [../../tietosuoja.html](../../tietosuoja.html) | Tietosuojaseloste, julkaistaan GitHub Pagesiin |

## Julkaisijan tiedot

Julkaisu tapahtuu **oman yrityksen organisaatiotilillä**, ei henkilökohtaisella tilillä eikä Suomen metsäkeskuksen nimissä. Tällä on kaksi seurausta:

1. **Playn suljetun testin vaatimus ei koske julkaisua.** 12 testaajaa / 14 vuorokautta koskee vain henkilökohtaisia tilejä, jotka on avattu 13.11.2023 jälkeen. Organisaatiotililtä voi julkaista suoraan tuotantoon.
2. **Sovellus julkaistaan yrityksen nimissä.** Kauppojen julkaisijanimi on yrityksen nimi, ja tietosuojaselosteen rekisterinpitäjä on yritys.

## Täytettävät kohdat

Dokumenteissa on merkintä `[TÄYTÄ: ...]` kohdissa, joihin tarvitaan tieto jota ei voi päätellä repositoriosta. Löydät ne komennolla:

```bash
grep -rn "TÄYTÄ" docs/kauppa/ tietosuoja.html
```

| Tieto | Missä tarvitaan |
|-------|-----------------|
| Yrityksen virallinen nimi | Tietosuojaseloste, kauppatekstit, copyright |
| Y-tunnus | Tietosuojaseloste |
| Tukisähköposti | Tietosuojaseloste, kauppalistaukset, App Review -yhteystiedot |
| Yhteyshenkilön nimi ja puhelin | Applen App Review Information |
| Copyright-vuosi | App Store -listaus |

## Ennen julkaisua varmistettavat asiat

- [ ] **Nimen tarkistus.** "Metsäinfo" PRH:n tavaramerkkirekisteristä ennen kuin nimi lyödään lukkoon ikoneihin ja kauppametadataan.
- [ ] **Sivutoimi.** Työsuhde Suomen metsäkeskukseen ja oman yrityksen kautta julkaistava sovellus, joka käyttää työnantajan avointa dataa — tarkista organisaatiosi sivutoimikäytäntö. Aineisto on avointa ja vapaasti käytettävää, joten kyse ei ole datan käyttöoikeudesta vaan sivutoimen ilmoittamisesta.
- [ ] **Vastuuvapauslauseke näkyviin.** Kauppakuvauksessa, sovelluksen ohjenäkymässä ja tietosuojaselosteessa — kaikissa kolmessa.
- [ ] **Tietosuojaselosteen URL elossa.** Kaupat tarkistavat, että osoite aukeaa. 9.11.2026 osoite vastaa `404`: seloste julkaistaan vasta vaiheen 0 Actions-julkaisussa (`public/tietosuoja.html`), ja `[TÄYTÄ]`-kohdat on täytettävä ennen sitä.
- [ ] **Verkkotunnus päätetty.** Jos Universal Links tai yrityksen oma osoite halutaan, Pagesille on otettava oma verkkotunnus **ennen** kuin tietosuoja- ja tukiosoitteet annetaan App Store Connectiin. Muuten osoitteet joudutaan vaihtamaan myöhemmin (ks. suunnitelman luku 5.3).
- [ ] **Ohjenäkymän yhteystieto.** `index.html` näyttää henkilökohtaisen gmail-osoitteen. Vaihda se samaan tukisähköpostiin, jota kauppalistaus ja tietosuojaseloste käyttävät.

## Tila

Tekstit ovat valmiita täytettäviä kohtia lukuun ottamatta. Kuvakaappaukset, kuvakkeet ja esittelykuva syntyvät vasta kun sovellus on ajettavissa laitteella (toteutussuunnitelman vaihe 7).
