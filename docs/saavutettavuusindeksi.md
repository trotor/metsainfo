# Saavutettavuusindeksi

Metsäinfon saavutettavuusindeksi (0–100) arvioi, kuinka helposti metsikkökuvion puut saadaan korjattua ja kuljetettua tienvarteen ja sieltä yleiselle tielle. Indeksi on **Metsäinfon oma arvio** avoimesta datasta. Se ei ole Metsäkeskuksen kuviotieto eikä korvaa maastokäyntiä tai korjuuyrittäjän arviota.

Indeksi on testiversion kokeilu (versio 2, 17.11.2026). Painot ja raja-arvot tarkentuvat, kun arvioita verrataan oikeisiin kiinteistöihin.

## Luokat

| Pisteet | Luokka | Kartalla |
|---------|--------|----------|
| 70–100 | Hyvä | vihreä |
| 40–69 | Kohtalainen | keltainen |
| 0–39 | Heikko | punainen |

## Kaava

```
indeksi = 0,30 × M + 0,30 × K + 0,15 × W + 0,10 × S + 0,15 × Y
```

Jos jokin osa puuttuu (aineisto ei latautunut tai alue on liian iso), se jätetään pois ja muiden painot skaalataan niin, että niiden summa on 1. Puuttuvat osat näkyvät kuvion arviolaatikossa ("Ei tietoa: …").

### M – maapohja (30 %)

Maaperän kantavuus Metsäkeskuksen **korjuukelpoisuuskartasta** (16 m ruudut, laserkeilaus ja maastotietokanta). Pisteet ovat kuvion ruutujen pinta-alalla painotettu keskiarvo:

| Luokka | Kuvaus | Pisteet |
|--------|--------|---------|
| 1 | Ympärivuotinen, myös kelirikko | 100 |
| 2 | Normaali kesä, kivennäismaa | 80 |
| 3 | Vain kuiva kesä, kivennäismaa | 60 |
| 4 | Normaali kesä, turvemaa | 50 |
| 5 | Vain kuiva kesä, turvemaa | 35 |
| 6 | Vain talvi | 20 |

Jos kartta ei kata kuviota, käytetään kuvion omaa korjuukelpoisuustietoa (1 → 100, 2 → 70, 3 → 50, 4 → 20). Vesistöruudut eivät ole mukana.

### K – metsäkuljetus (30 %)

Kuvion pisteiden (20 m välein, enintään 400) **keskimääräinen suora etäisyys lähimpään autotiehen** (Digiroad, toiminnallinen luokka 1–6). Enintään 100 m = 100 pistettä, vähintään 1 000 m = 0 pistettä, siltä väliltä lineaarisesti.

### W – märkyys (15 %)

Luonnonvarakeskuksen **DTW-kosteusindeksi** (depth-to-water, 2 m, 1 ha:n uomaverkko, 2023): arvioitu korkeus pohjaveden pinnasta. Palvelin piirtää luokan yli 150 cm läpinäkyvänä, joten läpinäkyvä kohta lasketaan kuivaksi (myös vesistöt, joita metsäkuljetuslinjat harvoin ylittävät). Näytteet otetaan kuviolta ja **metsäkuljetuksen linjoilta**: enintään 25 suoraa linjaa kuvion pisteistä lähimpään autotiehen (enintään 300 m), näytteet 8 m välein.

```
märkyysosuus = (märät + 0,5 × kosteat) / näytteet
märkä  = DTW ≤ 25 cm
kostea = DTW 25–50 cm
W = 100 − 200 × märkyysosuus   (0–100)
```

Esimerkki: jos neljännes näytteistä on märkiä, W = 50. Märkyys paljastaa painanteet, purot ja korpijuotit, joita 16 m korjuukelpoisuusluokka ei näytä ja joiden yli metsäkuljetus joutuu ajamaan.

### S – kaltevuus (10 %)

Maanmittauslaitoksen **korkeusmallista** (10 m) lasketaan rinteen kaltevuus samoista näytteistä kuin märkyys.

```
jyrkkä      = kaltevuus > 20 %
hyvin jyrkkä = kaltevuus > 35 %
S = 100 − 250 × jyrkkien osuus      (0–100)
jos hyvin jyrkkiä yli 5 % näytteistä → S enintään 30
```

Kuvion arviolaatikossa näkyy jyrkin kaltevuus.

### Y – tieyhteys (15 %)

Kiinteistön (tai kuviovalinnan) tieyhteys **Digiroad**-tieverkosta:

- Autotie tulee kiinteistölle (enintään 50 m) ja sieltä löytyy reitti yleiselle tielle (valtion tai kunnan tie, enintään 5 km): **100**
- Autotie tulee kiinteistölle, mutta reittiä yleiselle tielle ei löydy: **60**
- Ei autotietä kiinteistölle: **0**
- Reitillä kelirikko- tai painorajoitus: **−20**

Reitti haetaan tieverkosta lyhimmän polun algoritmilla. Kiinteistön yhteenvedossa näkyvät myös tiekunta sekä kelirikon ja painorajoitusten tiedot.

## Aineistot ja lisenssit

| Osa | Aineisto | Julkaisija | Lisenssi |
|-----|----------|------------|----------|
| M | Korjuukelpoisuuskartta (WMS) | Suomen metsäkeskus | CC BY 4.0 |
| M | Metsävaratiedot, kuvion korjuukelpoisuus (WFS) | Suomen metsäkeskus | CC BY 4.0 |
| K, Y | Digiroad: tielinkit, kelirikko, painorajoitukset, tiekunnat (WFS) | Väylävirasto | CC BY 4.0 |
| W | DTW-kosteusindeksi 2 m, 2023 (WMS, CSC Paituli) | Luonnonvarakeskus | CC BY 4.0 |
| S | Korkeusmalli 10 m, 2019 (WCS, CSC Paituli) | Maanmittauslaitos | CC BY 4.0 |

Kaikki haut tehdään laitteelta suoraan julkaisijan rajapintaan. Pyynnöissä on vain katsotun kiinteistön alue.

## Rajat ja tunnetut heikkoudet

- **Suora linja** tiehen ei ole todellinen ajoura. Kiertämistä vaativat esteet, kuten järvet, kalliot ja naapurin pellot, eivät näy matkassa.
- **DTW** haetaan vain, kun kuvan tarkkuus on enintään 5 m/px (kiinteistön ja 300 m reunuksen pidempi sivu enintään noin 10 km). **Korkeusmalli** haetaan enintään 6 × 6 km alueelta. Isommilla alueilla osat puuttuvat.
- **Metsätiet**, joita ei ole Digiroadissa, puuttuvat tieverkosta. (Metsäkeskuksen Kemera-tukitiedoista ei saa metsäteitä luotettavasti: rajapinnan kohteet ovat kuviotason töitä.)
- Kelirikko, routa ja lumi vaihtelevat vuodenajan mukaan. Indeksi kuvaa tavanomaista sulan maan tilannetta, ja talvikorjuun mahdollisuus näkyy maapohjan luokassa.
- Painot on asetettu asiantuntija-arviona. Niitä säädetään, kun tuloksia verrataan toteutuneisiin korjuisiin.

## Toteutus

- Pisteytys: `js/saavutettavuus/indeksi.js`
- Analyysi: `js/saavutettavuus/analyysi.js`
- Märkyys ja kaltevuus: `js/saavutettavuus/maasto.js`
- Tieverkko: `js/saavutettavuus/tieverkko.js`
- Testit: `tests/saavutettavuus.test.js` ja `tests/saavutettavuus-maasto.test.js`

Suunnitelmat: `docs/plans/2026-11-16-saavutettavuus-kokeilu.md` ja `docs/plans/2026-11-17-saavutettavuus-v2-rajoitteet-retkeily.md`.
