# Metsäinfo ja tekoäly

Tämä dokumentti kuvaa miten Metsäinfo-sovellus on kehitetty tekoälyn avulla, ja miten tekoälyä voidaan hyödyntää sekä sovelluksen kehittämisessä että metsätiedon ymmärtämisessä.

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
Toteuta hakkuusuunnitelma-näkymä, joka näyttää ehdotetut hakkuut
aikajärjestyksessä seuraavalle 10 vuodelle. Ryhmittele kuviot
hakkuuvuoden mukaan.
```

```
Lisää mahdollisuus verrata kahta kiinteistöä rinnakkain. Käyttäjä
voi valita kaksi kiinteistöä ja nähdä niiden metsävaratilastot
vierekkäin.
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

Tekoäly voi auttaa käyttäjiä ymmärtämään metsävaratietoja paremmin. Tässä ideoita:

### Chatbot-integraatio

Sovellukseen voisi lisätä tekoälychatbotin, joka vastaa metsänhoitoon liittyviin kysymyksiin:

- "Mitä tarkoittaa harvennushakkuu?"
- "Miksi tällä kuviolla suositellaan taimikonhoitoa?"
- "Milloin tämä metsä on hakkuukypsä?"
- "Mikä on tukkipuun ja kuitupuun ero?"

### Henkilökohtaiset suositukset

Tekoäly voisi analysoida kiinteistön metsätietoja ja antaa:

- Priorisoituja hoitoehdotuksia
- Arvioita puuston arvosta
- Suosituksia optimaalisesta hakkuuajankohdasta
- Varoituksia mahdollisista riskeistä (tuholaiset, myrskytuhot)

## Tekoälybackendin integrointi

Jos haluat lisätä sovellukseen tekoälytoiminnallisuuksia, voit integroida esimerkiksi Claude API:n.

### API-avaimen käyttö (client-side)

**Huom:** Client-side API-kutsuissa API-avain paljastuu käyttäjille. Tämä sopii vain henkilökohtaiseen käyttöön tai demoihin.

```javascript
// Lisää index.html:ään
<script>
const ANTHROPIC_API_KEY = 'your-api-key-here';
</script>
```

```javascript
// app.js - Tekoälyfunktio
async function askForestAI(question, forestData) {
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
            system: `Olet metsäasiantuntija. Vastaa käyttäjän kysymyksiin
                     suomeksi perustuen annettuihin metsävaratietoihin.`,
            messages: [{
                role: 'user',
                content: `Metsätiedot: ${JSON.stringify(forestData)}

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
            system: 'Olet metsäasiantuntija...',
            messages: [{ role: 'user', content: `...` }]
        })
    });

    return response;
}
```

### Käyttöliittymäidea

```html
<!-- Lisää sivupaneeliin -->
<div class="ai-assistant">
    <h3>Metsäneuvoja</h3>
    <div class="ai-chat"></div>
    <input type="text" placeholder="Kysy metsästäsi..." id="ai-input">
    <button id="ai-ask">Kysy</button>
</div>
```

## Jatkokehitysideoita

1. **Metsän arvon laskenta** - Tekoäly laskee puuston arvon nykyhinnoilla
2. **Hoitosuunnitelman generointi** - PDF-raportti suosituksista
3. **Vertailu naapurikiinteistöihin** - Anonyymi vertailu alueen keskiarvoihin
4. **Säätietojen integrointi** - Varoitukset myrskyistä ja kuivuudesta
5. **Puukauppa-avustaja** - Tekoäly auttaa tarjousten vertailussa

## Resurssit

- [Claude Code](https://claude.ai/code) - Tekoälyavusteinen kehitystyökalu
- [Claude API dokumentaatio](https://docs.anthropic.com/)
- [Metsäkeskuksen avoin data](https://www.metsakeskus.fi/fi/avoin-metsa-ja-luontotieto)
- [MML:n rajapinnat](https://www.maanmittauslaitos.fi/rajapinnat)
