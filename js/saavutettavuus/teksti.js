/**
 * Saavutettavuuden tekstit suomeksi, ruotsiksi ja englanniksi.
 * Maapohjan luokat Metsäkeskuksen korjuukelpoisuuskartan selitteestä
 * (ruotsi ja englanti epävirallisia käännöksiä).
 */

import { pick } from '../i18n.js';

const fi = {
    nappi: 'Saavutettavuus',
    otsikko: 'Saavutettavuus',
    sulje: 'Sulje',
    kokeilu: 'Kokeilu · vain testiversiossa',
    avaa: 'Saavutettavuus ja tieyhteys',
    valitseKiinteisto: 'Valitse ensin kiinteistö kartalta.',
    eiKuvioita: 'Kiinteistöllä ei ole metsävaratietoja.',
    lasketaan: 'Lasketaan tieyhteyttä ja korjuukelpoisuutta…',
    virhe: 'Tietoja ei saatu haettua. Tarkista verkkoyhteys.',
    yritaUudelleen: 'Yritä uudelleen',
    osittain: 'Osa tiedoista jäi hakematta, joten tulos voi olla puutteellinen.',
    tieKiinteistolle: 'Tie kiinteistölle',
    tieTulee: 'Autotie tulee kiinteistölle.',
    eiTieta: 'Autotietä ei ole 50 metrin sisällä kiinteistöstä.',
    yleisenTienVarrella: 'Kiinteistö on yleisen tien varrella.',
    reitti: (m) => `Yleiselle tielle noin ${m}.`,
    eiReittia: 'Yhteyttä yleiselle tielle ei löytynyt 5 km:n matkalta.',
    tiekunta: 'Tiellä on tiekunta.',
    rajoitukset: 'Rajoitukset',
    kelirikko: (t, alku, loppu) => `Kelirikkorajoitus ${t} t${alku ? ` ${alku}–${loppu}` : ''}`,
    massa: (t) => `Painorajoitus ${t} t`,
    kuviot: 'Kuviot',
    kuvio: (n) => `Kuvio ${n}`,
    luokat: { hyva: 'Hyvä', kohtalainen: 'Kohtalainen', heikko: 'Heikko' },
    pisteet: (n) => `${n}/100`,
    merkki: (n, luokka) => `Saavutettavuus ${n}/100, ${luokka}`,
    metsakuljetus: (m) => `Metsäkuljetus noin ${m}`,
    tieKuviolla: 'Tie kulkee kuviolla',
    maapohja: {
        1: 'Kelirikko',
        2: 'Normaali kesä, kivennäismaa',
        3: 'Kuiva kesä, kivennäismaa',
        4: 'Normaali kesä, turvemaa',
        5: 'Kuiva kesä, turvemaa',
        6: 'Talvi'
    },
    korjuukelpoisuus: (nimi) => `Korjuukelpoisuus: ${nimi}`,
    kuvionTieto: (nimi) => `Korjuukelpoisuus kuvion tiedoista: ${nimi}`,
    osat: { M: 'maapohja', K: 'metsäkuljetus', Y: 'tieyhteys' },
    puuttuu: (list) => `Ei tietoa: ${list}`,
    naytaKuvio: 'Näytä kuviotiedot',
    kartalla: 'Kartalla autotiet, ajopolut katkoviivalla ja reitti yleiselle tielle sinisellä.',
    arvio: 'Arvio avoimista aineistoista. Matka tiehen on suora etäisyys, joka ei huomioi vesistöjä, rinteitä eikä naapurin maata. Indeksin painot ovat ensimmäinen versio.',
    lisamaksu: 'Kuuluu nyt hinta-arvion lisäosaan. Saavutettavuudesta voi myöhemmin tulla erillinen maksullinen lisäosa.',
    lukittu: 'Saavutettavuus kertoo jokaisen kuvion metsäkuljetusmatkan, maapohjan korjuukelpoisuuden ja tieyhteyden kiinteistölle. Toiminto kuuluu puukaupan hinta-arvion lisäosaan (sama kertaosto). Saavutettavuudesta voi myöhemmin tulla erillinen maksullinen lisäosa.',
    avaaLisaosa: 'Avaa lisäosa',
    lahteet: (alue) => `Lähteet: © Väylävirasto, Digiroad (CC BY 4.0); © Suomen metsäkeskus, korjuukelpoisuuskartta${alue ? ` (alue ${alue})` : ''} ja metsävaratiedot.`,
    ohjeOsio: {
        otsikko: 'Saavutettavuus',
        html: `<p>Saavutettavuus arvioi, kuinka helposti kuvion puut saadaan korjattua ja kuljetettua. Avaa kiinteistö ja valitse yhteenvedosta <strong>Saavutettavuus ja tieyhteys</strong> tai kartan painike.</p>
<ul>
<li><strong>Indeksi 0–100</strong> ja luokka (hyvä, kohtalainen, heikko) jokaiselle kuviolle. Indeksi kootaan kolmesta osasta: maapohja 40 %, metsäkuljetus 40 % ja tieyhteys 20 %.</li>
<li><strong>Maapohja</strong>: Metsäkeskuksen korjuukelpoisuuskartta (milloin maasto kantaa koneita: kelirikko, kesä, kuiva kesä tai talvi). Jos karttaa ei ole, käytetään kuvion omaa korjuukelpoisuustietoa.</li>
<li><strong>Metsäkuljetus</strong>: keskimääräinen suora matka kuviolta lähimpään autotiehen.</li>
<li><strong>Tieyhteys</strong>: tuleeko autotie kiinteistölle, löytyykö sieltä reitti yleiselle tielle sekä tiekunta ja kelirikko- tai painorajoitukset Digiroadista.</li>
</ul>
<p>Tulos on arvio avoimista aineistoista. Matka ei huomioi vesistöjä, rinteitä eikä naapurin maata. Toiminto kuuluu nyt puukaupan hinta-arvion lisäosaan; saavutettavuudesta voi myöhemmin tulla erillinen maksullinen lisäosa.</p>`
    }
};

const sv = {
    nappi: 'Åtkomlighet',
    otsikko: 'Åtkomlighet',
    sulje: 'Stäng',
    kokeilu: 'Försök · bara i testversionen',
    avaa: 'Åtkomlighet och vägförbindelse',
    valitseKiinteisto: 'Välj först en fastighet på kartan.',
    eiKuvioita: 'Fastigheten har inga skogsdata.',
    lasketaan: 'Vägförbindelse och drivningsförhållanden beräknas…',
    virhe: 'Uppgifterna kunde inte hämtas. Kontrollera nätförbindelsen.',
    yritaUudelleen: 'Försök igen',
    osittain: 'En del uppgifter kunde inte hämtas, så resultatet kan vara ofullständigt.',
    tieKiinteistolle: 'Väg till fastigheten',
    tieTulee: 'En bilväg når fastigheten.',
    eiTieta: 'Det finns ingen bilväg inom 50 meter från fastigheten.',
    yleisenTienVarrella: 'Fastigheten ligger vid en allmän väg.',
    reitti: (m) => `Cirka ${m} till allmän väg.`,
    eiReittia: 'Ingen förbindelse till allmän väg hittades inom 5 km.',
    tiekunta: 'Vägen har ett väglag.',
    rajoitukset: 'Begränsningar',
    kelirikko: (t, alku, loppu) => `Begränsning under menföre ${t} t${alku ? ` ${alku}–${loppu}` : ''}`,
    massa: (t) => `Viktbegränsning ${t} t`,
    kuviot: 'Figurer',
    kuvio: (n) => `Figur ${n}`,
    luokat: { hyva: 'God', kohtalainen: 'Måttlig', heikko: 'Svag' },
    pisteet: (n) => `${n}/100`,
    merkki: (n, luokka) => `Åtkomlighet ${n}/100, ${luokka}`,
    metsakuljetus: (m) => `Terrängtransport cirka ${m}`,
    tieKuviolla: 'Vägen går genom figuren',
    maapohja: {
        1: 'Menföre',
        2: 'Normal sommar, mineraljord',
        3: 'Torr sommar, mineraljord',
        4: 'Normal sommar, torvmark',
        5: 'Torr sommar, torvmark',
        6: 'Vinter'
    },
    korjuukelpoisuus: (nimi) => `Drivningsförhållanden: ${nimi}`,
    kuvionTieto: (nimi) => `Drivningsförhållanden enligt figurens uppgifter: ${nimi}`,
    osat: { M: 'markförhållanden', K: 'terrängtransport', Y: 'vägförbindelse' },
    puuttuu: (list) => `Uppgift saknas: ${list}`,
    naytaKuvio: 'Visa figurens uppgifter',
    kartalla: 'På kartan bilvägar, körstigar streckade och rutten till allmän väg i blått.',
    arvio: 'Uppskattning utifrån öppna data. Avståndet till vägen är fågelvägen och tar inte hänsyn till vattendrag, sluttningar eller grannens mark. Indexets vikter är en första version.',
    lisamaksu: 'Ingår nu i tillägget Prisuppskattning. Åtkomligheten kan senare bli ett separat avgiftsbelagt tillägg.',
    lukittu: 'Åtkomligheten visar varje figurs terrängtransportavstånd, markens drivningsförhållanden och vägförbindelsen till fastigheten. Funktionen ingår i tillägget Prisuppskattning för virkesaffär (samma engångsköp). Åtkomligheten kan senare bli ett separat avgiftsbelagt tillägg.',
    avaaLisaosa: 'Lås upp tillägget',
    lahteet: (alue) => `Källor: © Trafikledsverket, Digiroad (CC BY 4.0); © Finlands skogscentral, karta över drivningsförhållanden${alue ? ` (område ${alue})` : ''} och skogsdata.`,
    ohjeOsio: {
        otsikko: 'Åtkomlighet',
        html: `<p>Åtkomligheten uppskattar hur lätt virket på en figur kan avverkas och transporteras. Öppna en fastighet och välj <strong>Åtkomlighet och vägförbindelse</strong> i sammandraget eller kartknappen.</p>
<ul>
<li><strong>Index 0–100</strong> och klass (god, måttlig, svag) för varje figur. Indexet består av tre delar: markförhållanden 40 %, terrängtransport 40 % och vägförbindelse 20 %.</li>
<li><strong>Markförhållanden</strong>: Skogscentralens karta över drivningsförhållanden (när marken bär maskiner: menföre, sommar, torr sommar eller vinter). Saknas kartan används figurens egen uppgift.</li>
<li><strong>Terrängtransport</strong>: genomsnittligt avstånd fågelvägen från figuren till närmaste bilväg.</li>
<li><strong>Vägförbindelse</strong>: om en bilväg når fastigheten, om det finns en rutt till allmän väg samt väglag och begränsningar under menföre eller viktbegränsningar enligt Digiroad.</li>
</ul>
<p>Resultatet är en uppskattning utifrån öppna data. Avståndet tar inte hänsyn till vattendrag, sluttningar eller grannens mark. Funktionen ingår nu i tillägget Prisuppskattning för virkesaffär; åtkomligheten kan senare bli ett separat avgiftsbelagt tillägg.</p>`
    }
};

const en = {
    nappi: 'Accessibility',
    otsikko: 'Accessibility',
    sulje: 'Close',
    kokeilu: 'Trial · test version only',
    avaa: 'Accessibility and road access',
    valitseKiinteisto: 'First select a property on the map.',
    eiKuvioita: 'The property has no forest data.',
    lasketaan: 'Calculating road access and harvesting conditions…',
    virhe: 'Could not fetch the data. Check your network connection.',
    yritaUudelleen: 'Try again',
    osittain: 'Some data could not be fetched, so the result may be incomplete.',
    tieKiinteistolle: 'Road to the property',
    tieTulee: 'A road reaches the property.',
    eiTieta: 'There is no road within 50 metres of the property.',
    yleisenTienVarrella: 'The property is next to a public road.',
    reitti: (m) => `About ${m} to a public road.`,
    eiReittia: 'No connection to a public road was found within 5 km.',
    tiekunta: 'The road has a road association.',
    rajoitukset: 'Restrictions',
    kelirikko: (t, alku, loppu) => `Spring thaw limit ${t} t${alku ? ` ${alku}–${loppu}` : ''}`,
    massa: (t) => `Weight limit ${t} t`,
    kuviot: 'Stands',
    kuvio: (n) => `Stand ${n}`,
    luokat: { hyva: 'Good', kohtalainen: 'Moderate', heikko: 'Poor' },
    pisteet: (n) => `${n}/100`,
    merkki: (n, luokka) => `Accessibility ${n}/100, ${luokka}`,
    metsakuljetus: (m) => `Forwarding about ${m}`,
    tieKuviolla: 'A road runs through the stand',
    maapohja: {
        1: 'Thaw season',
        2: 'Normal summer, mineral soil',
        3: 'Dry summer, mineral soil',
        4: 'Normal summer, peatland',
        5: 'Dry summer, peatland',
        6: 'Winter'
    },
    korjuukelpoisuus: (nimi) => `Harvesting conditions: ${nimi}`,
    kuvionTieto: (nimi) => `Harvesting conditions from stand data: ${nimi}`,
    osat: { M: 'ground', K: 'forwarding', Y: 'road access' },
    puuttuu: (list) => `No data: ${list}`,
    naytaKuvio: 'Show stand details',
    kartalla: 'On the map: roads, tracks as dashed lines and the route to a public road in blue.',
    arvio: 'Estimate from open data. The distance to the road is a straight line and ignores water, slopes and neighbouring land. The index weights are a first version.',
    lisamaksu: 'Currently part of the price estimate add-on. Accessibility may later become a separate paid add-on.',
    lukittu: 'Accessibility shows the forwarding distance, the ground’s harvesting conditions and the road access to the property for every stand. It is part of the timber sale price estimate add-on (same one-time purchase). Accessibility may later become a separate paid add-on.',
    avaaLisaosa: 'Unlock add-on',
    lahteet: (alue) => `Sources: © Finnish Transport Infrastructure Agency, Digiroad (CC BY 4.0); © Finnish Forest Centre, harvesting conditions map${alue ? ` (area ${alue})` : ''} and forest data.`,
    ohjeOsio: {
        otsikko: 'Accessibility',
        html: `<p>Accessibility estimates how easily the timber on a stand can be harvested and transported. Open a property and choose <strong>Accessibility and road access</strong> in the summary, or use the map button.</p>
<ul>
<li><strong>Index 0–100</strong> and class (good, moderate, poor) for each stand, built from three parts: ground 40 %, forwarding 40 % and road access 20 %.</li>
<li><strong>Ground</strong>: the Finnish Forest Centre’s harvesting conditions map (when the ground carries machines: thaw season, summer, dry summer or winter). Without the map, the stand’s own data is used.</li>
<li><strong>Forwarding</strong>: average straight-line distance from the stand to the nearest road.</li>
<li><strong>Road access</strong>: whether a road reaches the property, whether there is a route to a public road, and road associations and thaw or weight limits from Digiroad.</li>
</ul>
<p>The result is an estimate from open data. The distance ignores water, slopes and neighbouring land. The feature is currently part of the timber sale price estimate add-on; accessibility may later become a separate paid add-on.</p>`
    }
};

export const TEKSTIT = { fi, sv, en };
export const T = pick(TEKSTIT);
