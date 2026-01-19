# Metsäinfo

Interaktiivinen karttasovellus Suomen metsävaratietojen tarkasteluun. Klikkaa karttaa ja saat yhteenvedon alueen metsäkuvioista.

**[Kokeile sovellusta](https://trotor.github.io/metsainfo/)**

## Ominaisuudet

- **Metsävaratiedot** - Kuviokohtaiset tiedot Metsäkeskuksen avoimesta datasta
- **Kiinteistörajat** - MML:n kiinteistörajat näkyvät kartalla
- **Yhteenveto** sisältäen:
  - Kuvioiden lukumäärä ja pinta-ala
  - Puuston tilavuus (m³/ha ja yhteensä)
  - Puulajijakauma (mänty, kuusi, lehtipuut)
  - Puuston keski-ikä, -pituus, -läpimitta ja kasvu
  - Tukkipuu/kuitupuu -jako
  - Hakkuu- ja metsänhoitoehdotukset

## Käyttö

1. Avaa sovellus selaimessa
2. Zoomaa haluamallesi alueelle Suomessa
3. Klikkaa karttaa metsäalueella
4. Tarkastele metsätietoja infoikkunassa

Kiinteistörajat näkyvät zoomattaessa lähemmäs (noin 1:25000 mittakaavasta alkaen).

## Tekniikka

Sovellus toimii kokonaan selaimessa ilman backendiä.

- **Leaflet.js** - Karttakirjasto
- **Proj4js** - Koordinaatistomuunnokset (EPSG:3067 ↔ WGS84)
- **OpenStreetMap** - Taustakartta

## Datalähteet

| Data | Lähde | Rajapinta |
|------|-------|-----------|
| Metsävaratiedot | [Metsäkeskus](https://www.metsakeskus.fi/fi/avoin-metsa-ja-luontotieto) | WFS |
| Kiinteistörajat | [Kapsi.fi](https://kartat.kapsi.fi/) / MML | WMS |
| Taustakartta | [OpenStreetMap](https://www.openstreetmap.org/) | TMS |

## Kehitys

Kloonaa repositorio ja käynnistä paikallinen palvelin:

```bash
git clone git@github.com:trotor/metsainfo.git
cd metsainfo
python3 -m http.server 8080
```

Avaa selaimessa: http://localhost:8080

## Lisenssi

MIT

## Tekijät

Tehty Claude Coden avustuksella.
