# Metsäinfo

Interaktiivinen karttasovellus Suomen metsävaratietojen tarkasteluun. Hae kiinteistötunnuksella tai klikkaa karttaa ja saat yhteenvedon alueen metsäkuvioista.

**[Kokeile sovellusta](https://trotor.github.io/metsainfo/)**

![Metsäinfo screenshot](screenshot.png)

## Ominaisuudet

- **Kiinteistöhaku** - Hae kiinteistötunnuksella (esim. 592-404-1-32)
- **Kiinteistörajat** - MML:n kiinteistörajat näkyvät kartalla zoomattaessa
- **Metsävaratiedot** - Kuviokohtaiset tiedot Metsäkeskuksen avoimesta datasta
- **Yhteenveto** sisältäen:
  - Kuvioiden lukumäärä ja pinta-ala
  - Puuston tilavuus (m³/ha ja yhteensä)
  - Puulajijakauma (mänty, kuusi, lehtipuut)
  - Puuston keski-ikä, -pituus, -läpimitta ja kasvu
  - Tukkipuu/kuitupuu -jako (keskiarvo ja kokonaismäärä)
  - Kasvupaikkatyypit ja kehitysluokat
  - Hakkuu- ja metsänhoitoehdotukset vuosineen
- **Kuviokohtaiset tiedot** - Laajennettava lista kaikista kuvioista yksityiskohtineen
- **Karttakorostukset** - Klikkaa kuviota tai ehdotusta korostaaksesi sen kartalla
- **Väritysvaihtoehdot** - Kuvioiden väritys tilavuuden, iän, puulajin tai kehitysluokan mukaan
- **Luontotietokerros** - Metsälain erityisen tärkeät elinympäristöt (METE-kohteet)
- **Sanasto-tooltipit** - (i)-kuvake selittää metsäalan termit selkokielellä
- **URL-jako** - Kopioi suora linkki kiinteistöön jaettavaksi
- **Mittausvuosi-indikaattori** - Näyttää aineiston mittausvuoden ja varoittaa vanhasta datasta
- **CSV-lataus** - Lataa kuviotiedot taulukkolaskentaohjelmaan
- **Tulostus** - Tulosta yhteenveto paperille
- **Käyttöohje** - Otsikkorivin ?-napista aukeava ohjeikkuna

## Käyttö

1. Avaa sovellus selaimessa
2. **Hae kiinteistötunnuksella** oikeasta yläkulmasta (esim. 592-404-1-32)
3. Tai zoomaa haluamallesi alueelle ja **klikkaa kiinteistöä** kartalla
4. Tarkastele metsätietoja infoikkunassa
5. Klikkaa kuviota listassa nähdäksesi yksityiskohdat ja korostaaksesi kartalla

Kiinteistörajat ja -tunnukset näkyvät zoomattaessa lähemmäs (noin 1:50000 mittakaavasta alkaen).

Lisätietoja löytyy sovelluksen otsikkorivin **?**-napista.

## Tekniikka

Sovellus toimii kokonaan selaimessa ilman backendiä. Koodi on jaettu ES6-moduuleihin.

- **Leaflet.js** - Karttakirjasto
- **Proj4js** - Koordinaatistomuunnokset (EPSG:3067 ↔ WGS84)
- **Proj4Leaflet** - EPSG:3067 natiivituki Leafletille
- **Kapsi/MML** - Suomalaiset taustakartat (peruskartta, taustakartta, ortokuva)

### Tiedostorakenne

```
├── index.html          # HTML-runko, CDN-importit
├── js/
│   ├── app.js          # Päämoduuli: alustus, tapahtumat
│   ├── config.js       # Asetukset, koodistot, värimoodit
│   ├── state.js        # Sovelluksen tila
│   ├── utils.js        # Koordinaatit, geometria, muotoilu
│   ├── styles.js       # Karttatasojen tyylit
│   ├── data.js         # WFS-haut ja suodatus
│   ├── statistics.js   # Tilastolaskenta
│   └── ui.js           # Käyttöliittymän renderöinti
├── style.css           # Tyylit
└── version.js          # Versiotiedot
```

## Datalähteet

| Data | Lähde | Rajapinta |
|------|-------|-----------|
| Metsävaratiedot | [Metsäkeskus](https://www.metsakeskus.fi/fi/avoin-metsa-ja-luontotieto) | WFS |
| Luontokohteet | [Metsäkeskus](https://www.metsakeskus.fi/fi/avoin-metsa-ja-luontotieto) | WFS |
| Kiinteistörajat | [MML INSPIRE](https://www.maanmittauslaitos.fi/) | WFS |
| Taustakartat | [Kapsi](https://kartat.kapsi.fi/) / [MML](https://www.maanmittauslaitos.fi/) | TMS (EPSG:3067) |

## Kehitys

Kloonaa repositorio ja käynnistä paikallinen palvelin:

```bash
git clone git@github.com:trotor/metsainfo.git
cd metsainfo
python3 -m http.server 8080
```

Avaa selaimessa: http://localhost:8080

Ei build-vaihetta, ei riippuvuuksia asennettavaksi.

### Tekoälyavusteinen kehitys

Tämä sovellus on kehitetty kokonaan [Claude Code](https://claude.ai/code) -työkalulla. Claude Code on Anthropicin CLI-työkalu tekoälyavusteiseen ohjelmistokehitykseen.

Katso [CLAUDE-HOWTO.md](CLAUDE-HOWTO.md) jossa on:
- Kuvaus kehitysprosessista
- Esimerkkiprompteja sovelluksen jatkokehittämiseen
- Ideoita tekoälyominaisuuksien lisäämiseen sovellukseen
- Ohjeet Claude API:n integrointiin

## Versiohistoria

- **v2.1.0** (2026-02-19) - Käyttöohjeet ja versiohistoria sovelluksessa
- **v2.0.0** (2026-02-19) - Koodin modularisointi ES6-moduuleiksi
- **v1.9.0** (2026-02-19) - Luontotietokerros, sanasto-tooltipit, väritysvaihtoehdot, tulostustuki
- **v1.8.0** (2026-02-19) - URL-jako ja mittausvuosi-indikaattori
- **v1.6.0** (2026-01-22) - EPSG:3067 projektio, Kapsi/MML taustakartat, karttatasojen valitsin
- **v1.5.0** (2026-01-22) - Koodistojen korjaus Metsäkeskuksen virallisen määrityksen mukaiseksi
- **v1.4.0** (2026-01-22) - CSV-lataus metsäkuviotiedoille
- **v1.3.0** (2026-01-21) - Moniosaisten kiinteistöjen tuki, min/max-tilastot
- **v1.1.0** (2026-01-20) - Kiinteistöhaku, kuviokohtaiset tiedot, karttakorostukset
- **v1.0.0** (2026-01-19) - Ensimmäinen julkaisu

## Lisenssi

MIT

## Tekijä

**Tero Rönkkö**

Tehty [Claude Code](https://claude.ai/code) -työkalun avustuksella.
