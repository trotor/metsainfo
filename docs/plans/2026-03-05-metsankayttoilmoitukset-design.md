# Metsänkäyttöilmoitukset karttataso — Design

**Issue**: #19 Lisätään metsänkäyttöilmoitukset näkyviin
**Päivämäärä**: 2026-03-05

## Yleiskuvaus

Lisätään metsänkäyttöilmoitukset (MKI) uutena overlay-karttatasonaan, joka näyttää ilmoitetut hakkuualueet kartalla. Taso on kytkettävissä päälle/pois Leaflet layer controlista. Kuviot näytetään värikoodattuina ja klikkaus avaa popup-ikkunan perustiedoilla.

## Tietolähde

- **WFS endpoint**: `https://avoin.metsakeskus.fi/rajapinnat/v1/forestusedeclaration/ows`
- **typeName**: `v1:forestusedeclaration`
- **CRS**: EPSG:3067 (sama kuin muut tietolähteet)
- **Suodatus**: CQL_FILTER rajaa viimeiseen 5 vuoteen (DECLARATIONARRIVALYEAR >= dynaaminen vuosiluku)
- **Haku**: bbox-perusteinen, kuten metsävarakuviot

### Käytetyt kentät

| Kenttä | Tyyppi | Kuvaus |
|--------|--------|--------|
| GEOMETRY | Polygon | Kuvion rajat |
| CUTTINGPURPOSE | decimal | Hakkuutarkoitus (koodi) |
| CUTTINGREALIZATIONPRACTICE | decimal | Hakkuutapa (koodi) |
| AREA | decimal | Pinta-ala (ha) |
| DECLARATIONARRIVALYEAR | string | Ilmoituksen saapumisvuosi |
| DECLARATIONARRIVALDATE | dateTime | Ilmoituksen saapumispäivä |
| DECLARATIONMAINTREESPECIES | decimal | Pääpuulaji (koodi) |
| MEANAGE | decimal | Keski-ikä |

## Karttataso

- **Overlay** layer controlissa nimellä "Metsänkäyttöilmoitukset"
- Latautuu `overlayadd`-eventissä ja `moveend`-eventissä kun taso päällä
- Minimizoomtaso: 14 (estää liian suuria bbox-hakuja)
- Kuvioilla **tooltip** jossa vuosi ja hakkuutarkoitus (esim. "2024 – Avohakkuu")

## Värimoodit

Kaksi vaihdettavaa värimoodia, valinta dropdown-valikosta:

### Oletusmoodi: Vuoden mukaan
| Aikajakso | Väri |
|-----------|------|
| Tänä vuonna | Kirkas punainen/oranssi |
| 1-2 vuotta sitten | Oranssi |
| 3-4 vuotta sitten | Keltainen |
| 5+ vuotta sitten | Vaalean keltainen |

### Vaihtoehtoinen moodi: Hakkuutarkoituksen mukaan
- Eri väri kullekin CUTTINGPURPOSE-koodille

Dropdown-valikko ilmestyy näkyviin kun MKI-taso aktivoidaan.

## Popup (klikkaus)

Kompakti popup kuvion tiedoilla:
- Hakkuutarkoitus (CUTTINGPURPOSE → suomenkielinen nimi)
- Hakkuutapa (CUTTINGREALIZATIONPRACTICE → suomenkielinen nimi)
- Pinta-ala (AREA ha)
- Saapumisvuosi (DECLARATIONARRIVALYEAR)
- Puulaji (DECLARATIONMAINTREESPECIES → suomenkielinen nimi, käyttää olemassa olevaa treeSpecies-koodistoa)

## Koodilistaukset

Lisätään `config.js` CODES-objektiin:
- `cuttingPurpose` — hakkuutarkoituskoodit (Metsäkeskuksen koodisto)
- `cuttingRealizationPractice` — hakkuutapakoodit

## Muutettavat tiedostot

| Tiedosto | Muutos |
|----------|--------|
| `js/config.js` | Uusi WFS endpoint CONFIG.mkiWfsUrl, CODES.cuttingPurpose, CODES.cuttingRealizationPractice, MKI_COLOR_MODES |
| `js/state.js` | forestUseDeclarationLayer, mkiColorMode |
| `js/data.js` | fetchForestUseDeclarations(bounds) |
| `js/styles.js` | mkiStyle(feature), MKI värimoodifunktiot |
| `js/ui.js` | onEachMkiFeature(), MKI värimoodin vaihto |
| `js/app.js` | Tason alustus, latauslogiikka, layer control, event listeners |
| `index.html` | MKI värimoodin dropdown |
| `style.css` | Dropdown-tyylitys |
