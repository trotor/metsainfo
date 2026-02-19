# Metsäinfo ja tekoäly

**[Kokeile sovellusta](https://trotor.github.io/metsainfo/)** | [README](README.md) | [Lähdekoodi](https://github.com/trotor/metsainfo)

Tämä dokumentti kuvaa miten Metsäinfo-sovellus on kehitetty tekoälyn avulla, ja miten tekoälyä voidaan hyödyntää sovelluksen kehittämisessä ja metsätiedon ymmärtämisessä.

## Positiointi

Metsäinfo on **avoimen datan opetuksellinen katselusovellus**. Se täydentää virallista [metsään.fi](https://www.metsaan.fi)-palvelua, mutta **ei kilpaile** sen kanssa.

Sovellus **EI tarjoa**:
- Henkilökohtaisia hoitosuosituksia tai kustannusarvioita
- Metsän arvon laskentaa
- Puukauppa- tai asiointipalveluja
- Kirjautumista vaativaa toiminnallisuutta
- Viranomaisasiointia (metsänkäyttöilmoitukset, METKA-tuet)

Sovelluksen tarkoitus on **auttaa ymmärtämään avointa metsätietoa** — kuka tahansa voi katsoa minkä tahansa alueen metsävaratietoja ilman kirjautumista.

## Miten sovellus on luotu

Metsäinfo on kehitetty kokonaan **Claude Code** -työkalulla (claude.ai/code). Claude Code on Anthropicin CLI-työkalu, joka mahdollistaa tekoälyavusteisen ohjelmistokehityksen suoraan komentorivillä.

### Kehitysprosessi

1. **Konseptin suunnittelu**: Keskustelu tekoälyn kanssa siitä, mitä sovelluksen tulisi tehdä
2. **Arkkitehtuurin valinta**: Päätös käyttää puhdasta client-side JavaScriptia ilman backend-palvelinta
3. **Iteratiivinen kehitys**: Ominaisuuksien lisääminen keskustelemalla ja antamalla palautetta
4. **Virheiden korjaus**: Tekoäly auttoi debuggauksessa ja ongelmien ratkaisussa
5. **Refaktorointi**: Koodin siistiminen ja optimointi tekoälyn avustuksella

### Käytetyt tekniikat

- Vanilla JavaScript (ES6+) - ei build-vaihetta
- Leaflet.js karttoihin
- Proj4js koordinaattimuunnoksiin
- WFS-rajapinnat avoimeen dataan

## Esimerkkiprompteja sovelluksen kehittämiseen

Alla on esimerkkejä prompteista, joilla Claude Codea voi käyttää Metsäinfon kehittämiseen:

### Uusien ominaisuuksien lisääminen

```
Lisää sovellukseen mahdollisuus tallentaa kiinteistöt suosikkeihin
localStorage:en. Käyttäjä voi merkitä kiinteistön suosikiksi ja nähdä
listan suosikeistaan erillisessä valikossa.
```

```
Lisää metsäkuvioiden väritysvaihtoehdot: käyttäjä voi valita
pudotusvalikosta väritetäänkö kuviot tilavuuden (oletus), iän,
pääpuulajin vai kehitysluokan mukaan. Päivitä myös legenda.
```

```
Lisää URL-parametrituki: kun käyttäjä valitsee kiinteistön, päivitä
URL muotoon ?parcel=091-416-0001-0123. Sivun latautuessa tarkista
parametri ja hae kiinteistö automaattisesti.
```

### Käyttöliittymän parantaminen

```
Paranna mobiilikäyttöliittymää: tee sivupaneelista alhaalta ylös
liu'utettava, lisää suuremmat kosketusalueet ja optimoi fonttikoot
pienille näytöille.
```

```
Lisää tumma teema (dark mode) sovellukseen. Käytä CSS-muuttujia
väreille ja tallenna käyttäjän valinta localStorageen.
```

```
Lisää sanasto-tooltipit sivupaneeliin: jokaisen metsätermin
(kehitysluokka, kasvupaikkatyyppi, pohjapinta-ala) viereen
(i)-ikoni, joka näyttää selkokielisen selityksen.
```

### Datan visualisointi

```
Lisää puuston ikäjakauma pylväsdiagrammina yhteenvetoon. Ryhmittele
kuviot 10 vuoden ikäluokkiin ja näytä kunkin luokan pinta-ala.
```

```
Toteuta lämpökartta (heatmap) joka näyttää puuston tilavuuden
värigradienttina kartalla. Käytä punaisesta vihreään värikarttaa.
```

### Bugien korjaus ja optimointi

```
Kiinteistöjen lataus on hidas kun näkymässä on paljon palstoja.
Optimoi loadParcelsInView-funktio käyttämään debouncea ja
välimuistia tehokkaammin.
```

```
Sivupaneelin scrollaus ei toimi kunnolla iOS-laitteilla.
Tutki ongelma ja korjaa se.
```

## Tekoälyn hyödyntäminen metsätiedon ymmärtämisessä

Tekoäly voi auttaa käyttäjiä **ymmärtämään** metsävaratietoja paremmin. Huom: kyse on termien ja käsitteiden selittämisestä, ei henkilökohtaisesta neuvonnasta.

### Sanastoselitykset

Sovellukseen voisi lisätä tekoälypohjaisen sanastoselittäjän, joka vastaa käsitteisiin liittyviin kysymyksiin:

- "Mitä tarkoittaa harvennushakkuu?"
- "Mikä on tukkipuun ja kuitupuun ero?"
- "Mitä kehitysluokka 02 tarkoittaa?"
- "Mikä on pohjapinta-ala?"

**Huom:** Selittäjä ei anna hoitosuosituksia, ei arvioi metsän arvoa eikä neuvo hakkuuajankohdasta — nämä kuuluvat [metsään.fi](https://www.metsaan.fi)-palveluun ja metsäammattilaisille.

## Tekoälybackendin integrointi

Jos haluat lisätä sovellukseen tekoälypohjaisen sanastoselittäjän, voit integroida esimerkiksi Claude API:n.

### API-avaimen käyttö (client-side)

**Huom:** Client-side API-kutsuissa API-avain paljastuu käyttäjille. Tämä sopii vain henkilökohtaiseen käyttöön tai demoihin.

```javascript
// Lisää index.html:ään
<script>
const ANTHROPIC_API_KEY = 'your-api-key-here';
</script>
```

```javascript
// app.js - Sanastoselitysfunktio
async function askForestTerms(question, forestData) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2024-01-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: `Olet metsäalan sanastoselittäjä. Selitä metsäalan termejä
                     ja käsitteitä selkokielellä suomeksi. Voit viitata annettuihin
                     metsävaratietoihin esimerkkeinä.
                     ÄLÄ anna hoitosuosituksia, älä arvioi metsän arvoa,
                     älä neuvo hakkuuajankohdasta. Ohjaa käyttäjä metsään.fi-palveluun
                     henkilökohtaista neuvontaa varten.`,
            messages: [{
                role: 'user',
                content: `Metsätiedot kontekstina: ${JSON.stringify(forestData)}

                Kysymys: ${question}`
            }]
        })
    });

    const data = await response.json();
    return data.content[0].text;
}
```

### Backend-proxy (tuotantokäyttöön)

Turvallisempaa on käyttää backend-proxya, joka piilottaa API-avaimen:

```javascript
// Serverless function (esim. Cloudflare Workers, Vercel Edge)
export default async function handler(request) {
    const { question, forestData } = await request.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2024-01-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: 'Olet metsäalan sanastoselittäjä. Selitä termejä selkokielellä...',
            messages: [{ role: 'user', content: `...` }]
        })
    });

    return response;
}
```

### Käyttöliittymäidea

```html
<!-- Lisää sivupaneeliin -->
<div class="ai-glossary">
    <h3>Sanastoselitykset</h3>
    <div class="ai-chat"></div>
    <input type="text" placeholder="Kysy metsätermistä..." id="ai-input">
    <button id="ai-ask">Selitä</button>
</div>
```

## Jatkokehitysideoita

1. **Aluevertailu** - Anonyymi vertailu kunnan/alueen keskiarvoihin (avoin ruutuaineisto)
2. **Luontotietokerros** - Metsälain erityisen tärkeät elinympäristöt kartalle (avoin data)
3. **Mittausvuosi-indikaattori** - Näytä selkeästi milloin aineisto on mitattu ja varoita vanhasta datasta
4. **Sanasto-tooltipit** - Jokaisen termin vieressä selkokielinen selitys ilman tekoälyä
5. **Väritysvaihtoehdot** - Kuvioiden väritys iän, puulajin tai kehitysluokan mukaan

## Resurssit

- [Claude Code](https://claude.ai/code) - Tekoälyavusteinen kehitystyökalu
- [Claude API dokumentaatio](https://docs.anthropic.com/)
- [Metsäkeskuksen avoin data](https://www.metsakeskus.fi/fi/avoin-metsa-ja-luontotieto)
- [MML:n rajapinnat](https://www.maanmittauslaitos.fi/rajapinnat)
- [Metsään.fi](https://www.metsaan.fi) - Metsäkeskuksen virallinen palvelu metsänomistajille
