/**
 * Saavutettavuuden tekstit suomeksi, ruotsiksi ja englanniksi.
 * Maapohjan luokat Metsäkeskuksen korjuukelpoisuuskartan selitteestä
 * ajankohtina (ruotsi ja englanti epävirallisia käännöksiä).
 */

import { pick } from '../i18n.js';

const fi = {
    nappi: 'Saavutettavuus kartalla',
    variTila: 'Saavutettavuus (arvio)',
    otsikko: 'Saavutettavuus',
    arvioMerkki: 'Arvio',
    kokeilu: 'Kokeilu',
    selite: 'Saavutettavuus (arvio)',
    seliteReitti: 'Reitti yleiselle tielle',
    valitseKiinteisto: 'Valitse ensin kiinteistö, niin sen kuviot väritetään saavutettavuuden mukaan.',
    eiKuvioita: 'Kiinteistöllä ei ole metsävaratietoja.',
    lasketaan: 'Lasketaan tieyhteyttä ja korjuukelpoisuutta…',
    virhe: 'Tietoja ei saatu haettua. Tarkista verkkoyhteys.',
    yritaUudelleen: 'Yritä uudelleen',
    osittain: 'Osa tiedoista jäi hakematta, joten tulos voi olla puutteellinen.',
    tieVirhe: 'Teitä ei saatu haettua, joten metsäkuljetus ja tieyhteys puuttuvat. Maapohja on laskettu.',
    tieKiinteistolle: 'Tie kiinteistölle',
    // Kuviovalinnalle (js/valinta/) kiinteistön sijaan
    valinta: {
        tieKiinteistolle: 'Tie valinnalle',
        tieTulee: 'Autotie tulee ainakin yhdelle valituista kuvioista.',
        eiTieta: 'Autotietä ei ole 50 metrin sisällä valituista kuvioista.',
        yleisenTienVarrella: 'Valinta on yleisen tien varrella.',
        eiTietaLyhyt: 'ei autotietä valinnalle'
    },
    tieTulee: 'Autotie tulee kiinteistölle.',
    eiTieta: 'Autotietä ei ole 50 metrin sisällä kiinteistöstä.',
    yleisenTienVarrella: 'Kiinteistö on yleisen tien varrella.',
    reitti: (m) => `Yleiselle tielle noin ${m}.`,
    eiReittia: 'Yhteyttä yleiselle tielle ei löytynyt 5 km:n matkalta.',
    tiekunta: 'Tiellä on tiekunta.',
    rajoitukset: 'Rajoitukset',
    kelirikko: (t, alku, loppu) => `Kelirikkorajoitus ${t} t${alku ? ` ${alku}–${loppu}` : ''}`,
    massa: (t) => `Painorajoitus ${t} t`,
    naytaKartalla: 'Näytä kuviot kartalla väreinä',
    piilotaKartalta: 'Piilota värit kartalta',
    kuvionLaatikko: 'Kuvion arvio näkyy kuvion tiedoissa kuvioluettelossa.',
    luokat: { hyva: 'Hyvä', kohtalainen: 'Kohtalainen', heikko: 'Heikko' },
    pisteet: (n) => `${n}/100`,
    merkki: (n, luokka) => `Saavutettavuus ${n}/100, ${luokka}`,
    metsakuljetus: 'Metsäkuljetus',
    tieKuviolla: 'tie kulkee kuviolla',
    noin: (m) => `noin ${m}`,
    korjuukelpoisuus: 'Korjuukelpoisuus',
    tieyhteys: 'Tieyhteys',
    markyys: 'Märkyys',
    markyysArvo: (p) => (p < 1 ? 'kuiva, ei märkiä kohtia' : `märkää tai kosteaa noin ${p} %`),
    kaltevuus: 'Kaltevuus',
    kaltevuusArvo: (p) => (p < 8 ? 'tasainen' : `jyrkin noin ${p} %`),
    eiTietaLyhyt: 'ei autotietä kiinteistölle',
    yleisenTienVarrellaLyhyt: 'yleisen tien varrella',
    reittiLyhyt: (m) => `yleiselle tielle ${m}`,
    eiReittiaLyhyt: 'ei yhteyttä yleiselle tielle 5 km:n matkalla',
    maapohja: {
        1: 'Ympärivuotinen, myös kelirikko',
        2: 'Normaali kesä, kivennäismaa',
        3: 'Vain kuiva kesä, kivennäismaa',
        4: 'Normaali kesä, turvemaa',
        5: 'Vain kuiva kesä, turvemaa',
        6: 'Vain talvi (maa jäässä)'
    },
    kuvionTieto: (nimi) => `${nimi} (kuvion tiedoista)`,
    osat: { M: 'maapohja', K: 'metsäkuljetus', W: 'märkyys', S: 'kaltevuus', Y: 'tieyhteys' },
    puuttuu: (list) => `Ei tietoa: ${list}`,
    arvio: 'Arvio avoimista aineistoista, ei Metsäkeskuksen kuviotieto. Matka tiehen on suora etäisyys, joka ei huomioi vesistöjä, rinteitä eikä naapurin maata.',
    lisamaksu: 'Kuuluu nyt hinta-arvion lisäosaan. Saavutettavuudesta voi myöhemmin tulla erillinen maksullinen lisäosa.',
    lukittu: 'Saavutettavuus arvioi jokaisen kuvion metsäkuljetusmatkan, maapohjan korjuukelpoisuuden ja tieyhteyden kiinteistölle sekä värittää kuviot kartalla. Toiminto kuuluu puukaupan hinta-arvion lisäosaan (sama kertaosto). Saavutettavuudesta voi myöhemmin tulla erillinen maksullinen lisäosa.',
    avaaLisaosa: 'Avaa lisäosa',
    lahteet: (alue) => `Lähteet: © Väylävirasto, Digiroad (CC BY 4.0). Sisältää Suomen metsäkeskuksen korjuukelpoisuuskartta-aineistoa${alue ? ` (alue ${alue})` : ''} ja metsävaratietoja (CC BY 4.0), Luonnonvarakeskuksen DTW-kosteusindeksiä ja Maanmittauslaitoksen korkeusmallia (CC BY 4.0, CSC Paituli); muokattu: luokat pisteytetty indeksiksi.`,
    ohjeOsio: {
        otsikko: 'Saavutettavuus',
        html: `<p>Saavutettavuus arvioi, kuinka helposti kuvion puut saadaan korjattua ja kuljetettua.</p>
<ul>
<li><strong>Kartalla</strong>: karttapainike <strong>Saavutettavuus kartalla</strong> värittää avatun kiinteistön kuviot: vihreä hyvä, keltainen kohtalainen, punainen heikko. Kartalla näkyvät myös autotiet ja reitti yleiselle tielle.</li>
<li><strong>Kuvion tiedoissa</strong>: avaa kuvio kuvioluettelosta. Saavutettavuus on omassa laatikossaan merkinnällä <em>Arvio</em>, erillään Metsäkeskuksen kuviotiedoista.</li>
<li><strong>Indeksi 0–100</strong> kootaan viidestä osasta: maapohja 30 % (Metsäkeskuksen korjuukelpoisuuskartta: ympärivuotinen, normaali kesä, vain kuiva kesä tai vain talvi), metsäkuljetus 30 % (keskimääräinen suora matka lähimpään autotiehen), märkyys 15 % (Luken DTW-kosteusindeksi kuviolla ja metsäkuljetuksen linjoilla tielle), kaltevuus 10 % (jyrkät rinteet MML:n korkeusmallista) ja tieyhteys 15 % (tuleeko autotie kiinteistölle ja löytyykö sieltä reitti yleiselle tielle, Digiroad). Koko kuvaus: <a href="https://github.com/trotor/metsainfo/blob/main/docs/saavutettavuusindeksi.md" target="_blank">saavutettavuusindeksi</a>.</li>
<li>Kiinteistön yhteenvedossa näkyvät tieyhteys, tiekunta sekä kelirikko- ja painorajoitukset.</li>
</ul>
<p>Tulos on arvio avoimista aineistoista. Matka ei huomioi vesistöjä, rinteitä eikä naapurin maata. Toiminto kuuluu nyt puukaupan hinta-arvion lisäosaan; saavutettavuudesta voi myöhemmin tulla erillinen maksullinen lisäosa.</p>`
    }
};

const sv = {
    nappi: 'Åtkomlighet på kartan',
    variTila: 'Åtkomlighet (uppskattning)',
    otsikko: 'Åtkomlighet',
    arvioMerkki: 'Uppskattning',
    kokeilu: 'Försök',
    selite: 'Åtkomlighet (uppskattning)',
    seliteReitti: 'Rutt till allmän väg',
    valitseKiinteisto: 'Välj först en fastighet, så färgläggs dess figurer efter åtkomlighet.',
    eiKuvioita: 'Fastigheten har inga skogsdata.',
    lasketaan: 'Vägförbindelse och drivningsförhållanden beräknas…',
    virhe: 'Uppgifterna kunde inte hämtas. Kontrollera nätförbindelsen.',
    yritaUudelleen: 'Försök igen',
    osittain: 'En del uppgifter kunde inte hämtas, så resultatet kan vara ofullständigt.',
    tieVirhe: 'Vägarna kunde inte hämtas, så terrängtransport och vägförbindelse saknas. Markförhållandena är beräknade.',
    tieKiinteistolle: 'Väg till fastigheten',
    valinta: {
        tieKiinteistolle: 'Väg till urvalet',
        tieTulee: 'En bilväg når minst en av de valda figurerna.',
        eiTieta: 'Det finns ingen bilväg inom 50 meter från de valda figurerna.',
        yleisenTienVarrella: 'Urvalet ligger vid en allmän väg.',
        eiTietaLyhyt: 'ingen bilväg till urvalet'
    },
    tieTulee: 'En bilväg når fastigheten.',
    eiTieta: 'Det finns ingen bilväg inom 50 meter från fastigheten.',
    yleisenTienVarrella: 'Fastigheten ligger vid en allmän väg.',
    reitti: (m) => `Cirka ${m} till allmän väg.`,
    eiReittia: 'Ingen förbindelse till allmän väg hittades inom 5 km.',
    tiekunta: 'Vägen har ett väglag.',
    rajoitukset: 'Begränsningar',
    kelirikko: (t, alku, loppu) => `Begränsning under menföre ${t} t${alku ? ` ${alku}–${loppu}` : ''}`,
    massa: (t) => `Viktbegränsning ${t} t`,
    naytaKartalla: 'Visa figurerna i färg på kartan',
    piilotaKartalta: 'Dölj färgerna på kartan',
    kuvionLaatikko: 'Figurens uppskattning visas i figurens uppgifter i figurlistan.',
    luokat: { hyva: 'God', kohtalainen: 'Måttlig', heikko: 'Svag' },
    pisteet: (n) => `${n}/100`,
    merkki: (n, luokka) => `Åtkomlighet ${n}/100, ${luokka}`,
    metsakuljetus: 'Terrängtransport',
    tieKuviolla: 'vägen går genom figuren',
    noin: (m) => `cirka ${m}`,
    korjuukelpoisuus: 'Drivningsförhållanden',
    tieyhteys: 'Vägförbindelse',
    markyys: 'Fuktighet',
    markyysArvo: (p) => (p < 1 ? 'torrt, inga blöta ställen' : `blött eller fuktigt cirka ${p} %`),
    kaltevuus: 'Lutning',
    kaltevuusArvo: (p) => (p < 8 ? 'plant' : `brantast cirka ${p} %`),
    eiTietaLyhyt: 'ingen bilväg till fastigheten',
    yleisenTienVarrellaLyhyt: 'vid allmän väg',
    reittiLyhyt: (m) => `${m} till allmän väg`,
    eiReittiaLyhyt: 'ingen förbindelse till allmän väg inom 5 km',
    maapohja: {
        1: 'Året runt, även under menföre',
        2: 'Normal sommar, mineraljord',
        3: 'Bara torr sommar, mineraljord',
        4: 'Normal sommar, torvmark',
        5: 'Bara torr sommar, torvmark',
        6: 'Bara vinter (frusen mark)'
    },
    kuvionTieto: (nimi) => `${nimi} (enligt figurens uppgifter)`,
    osat: { M: 'markförhållanden', K: 'terrängtransport', W: 'fuktighet', S: 'lutning', Y: 'vägförbindelse' },
    puuttuu: (list) => `Uppgift saknas: ${list}`,
    arvio: 'Uppskattning utifrån öppna data, inte Skogscentralens figuruppgift. Avståndet till vägen är fågelvägen och tar inte hänsyn till vattendrag, sluttningar eller grannens mark.',
    lisamaksu: 'Ingår nu i tillägget Prisuppskattning. Åtkomligheten kan senare bli ett separat avgiftsbelagt tillägg.',
    lukittu: 'Åtkomligheten uppskattar varje figurs terrängtransportavstånd, markens drivningsförhållanden och vägförbindelsen till fastigheten och färglägger figurerna på kartan. Funktionen ingår i tillägget Prisuppskattning för virkesaffär (samma engångsköp). Åtkomligheten kan senare bli ett separat avgiftsbelagt tillägg.',
    avaaLisaosa: 'Lås upp tillägget',
    lahteet: (alue) => `Källor: © Trafikledsverket, Digiroad (CC BY 4.0). Innehåller data från Finlands skogscentrals karta över drivningsförhållanden${alue ? ` (område ${alue})` : ''} och skogsdata (CC BY 4.0), Naturresursinstitutets DTW-fuktighetsindex och Lantmäteriverkets höjdmodell (CC BY 4.0, CSC Paituli); bearbetat: klasserna poängsatta till ett index.`,
    ohjeOsio: {
        otsikko: 'Åtkomlighet',
        html: `<p>Åtkomligheten uppskattar hur lätt virket på en figur kan avverkas och transporteras.</p>
<ul>
<li><strong>På kartan</strong>: kartknappen <strong>Åtkomlighet på kartan</strong> färglägger den öppnade fastighetens figurer: grönt god, gult måttlig, rött svag. Kartan visar också bilvägar och rutten till allmän väg.</li>
<li><strong>I figurens uppgifter</strong>: öppna en figur i figurlistan. Åtkomligheten finns i en egen ruta märkt <em>Uppskattning</em>, skild från Skogscentralens figuruppgifter.</li>
<li><strong>Index 0–100</strong> består av fem delar: markförhållanden 30 % (Skogscentralens karta över drivningsförhållanden), terrängtransport 30 % (genomsnittligt rakt avstånd till närmaste bilväg), fuktighet 15 % (Naturresursinstitutets DTW-fuktighetsindex på figuren och längs terrängtransportens linjer till vägen), lutning 10 % (branta sluttningar enligt Lantmäteriverkets höjdmodell) och vägförbindelse 15 % (Digiroad). Fullständig beskrivning: <a href="https://github.com/trotor/metsainfo/blob/main/docs/saavutettavuusindeksi.md" target="_blank">åtkomlighetsindex</a> (på finska).</li>
<li>I fastighetens sammandrag visas vägförbindelse, väglag och begränsningar under menföre eller viktbegränsningar.</li>
</ul>
<p>Resultatet är en uppskattning utifrån öppna data. Avståndet tar inte hänsyn till vattendrag, sluttningar eller grannens mark. Funktionen ingår nu i tillägget Prisuppskattning för virkesaffär; åtkomligheten kan senare bli ett separat avgiftsbelagt tillägg.</p>`
    }
};

const en = {
    nappi: 'Accessibility on the map',
    variTila: 'Accessibility (estimate)',
    otsikko: 'Accessibility',
    arvioMerkki: 'Estimate',
    kokeilu: 'Trial',
    selite: 'Accessibility (estimate)',
    seliteReitti: 'Route to a public road',
    valitseKiinteisto: 'First select a property, and its stands are coloured by accessibility.',
    eiKuvioita: 'The property has no forest data.',
    lasketaan: 'Calculating road access and harvesting conditions…',
    virhe: 'Could not fetch the data. Check your network connection.',
    yritaUudelleen: 'Try again',
    osittain: 'Some data could not be fetched, so the result may be incomplete.',
    tieVirhe: 'Roads could not be fetched, so forwarding and road access are missing. The ground has been assessed.',
    tieKiinteistolle: 'Road to the property',
    valinta: {
        tieKiinteistolle: 'Road to the selection',
        tieTulee: 'A road reaches at least one of the selected stands.',
        eiTieta: 'There is no road within 50 metres of the selected stands.',
        yleisenTienVarrella: 'The selection is next to a public road.',
        eiTietaLyhyt: 'no road to the selection'
    },
    tieTulee: 'A road reaches the property.',
    eiTieta: 'There is no road within 50 metres of the property.',
    yleisenTienVarrella: 'The property is next to a public road.',
    reitti: (m) => `About ${m} to a public road.`,
    eiReittia: 'No connection to a public road was found within 5 km.',
    tiekunta: 'The road has a road association.',
    rajoitukset: 'Restrictions',
    kelirikko: (t, alku, loppu) => `Spring thaw limit ${t} t${alku ? ` ${alku}–${loppu}` : ''}`,
    massa: (t) => `Weight limit ${t} t`,
    naytaKartalla: 'Show stands in colour on the map',
    piilotaKartalta: 'Hide colours on the map',
    kuvionLaatikko: 'Each stand’s estimate is shown in its details in the stand list.',
    luokat: { hyva: 'Good', kohtalainen: 'Moderate', heikko: 'Poor' },
    pisteet: (n) => `${n}/100`,
    merkki: (n, luokka) => `Accessibility ${n}/100, ${luokka}`,
    metsakuljetus: 'Forwarding',
    tieKuviolla: 'a road runs through the stand',
    noin: (m) => `about ${m}`,
    korjuukelpoisuus: 'Harvesting conditions',
    tieyhteys: 'Road access',
    markyys: 'Wetness',
    markyysArvo: (p) => (p < 1 ? 'dry, no wet spots' : `wet or moist about ${p} %`),
    kaltevuus: 'Slope',
    kaltevuusArvo: (p) => (p < 8 ? 'level' : `steepest about ${p} %`),
    eiTietaLyhyt: 'no road to the property',
    yleisenTienVarrellaLyhyt: 'next to a public road',
    reittiLyhyt: (m) => `${m} to a public road`,
    eiReittiaLyhyt: 'no connection to a public road within 5 km',
    maapohja: {
        1: 'Year-round, even during thaw',
        2: 'Normal summer, mineral soil',
        3: 'Dry summer only, mineral soil',
        4: 'Normal summer, peatland',
        5: 'Dry summer only, peatland',
        6: 'Winter only (frozen ground)'
    },
    kuvionTieto: (nimi) => `${nimi} (from stand data)`,
    osat: { M: 'ground', K: 'forwarding', W: 'wetness', S: 'slope', Y: 'road access' },
    puuttuu: (list) => `No data: ${list}`,
    arvio: 'An estimate from open data, not Finnish Forest Centre stand data. The distance to the road is a straight line and ignores water, slopes and neighbouring land.',
    lisamaksu: 'Currently part of the price estimate add-on. Accessibility may later become a separate paid add-on.',
    lukittu: 'Accessibility estimates the forwarding distance, the ground’s harvesting conditions and the road access to the property for every stand, and colours the stands on the map. It is part of the timber sale price estimate add-on (same one-time purchase). Accessibility may later become a separate paid add-on.',
    avaaLisaosa: 'Unlock add-on',
    lahteet: (alue) => `Sources: © Finnish Transport Infrastructure Agency, Digiroad (CC BY 4.0). Contains data from the Finnish Forest Centre’s harvesting conditions map${alue ? ` (area ${alue})` : ''} and forest data (CC BY 4.0), the Natural Resources Institute Finland’s DTW wetness index and the National Land Survey’s elevation model (CC BY 4.0, CSC Paituli); modified: classes scored into an index.`,
    ohjeOsio: {
        otsikko: 'Accessibility',
        html: `<p>Accessibility estimates how easily the timber on a stand can be harvested and transported.</p>
<ul>
<li><strong>On the map</strong>: the map button <strong>Accessibility on the map</strong> colours the open property’s stands: green good, yellow moderate, red poor. The map also shows roads and the route to a public road.</li>
<li><strong>In the stand details</strong>: open a stand in the stand list. Accessibility is in its own box marked <em>Estimate</em>, separate from the Finnish Forest Centre’s stand data.</li>
<li><strong>Index 0–100</strong> built from five parts: ground 30 % (the Finnish Forest Centre’s harvesting conditions map), forwarding 30 % (mean straight distance to the nearest road), wetness 15 % (Natural Resources Institute Finland’s DTW wetness index on the stand and along the forwarding lines to the road), slope 10 % (steep slopes from the National Land Survey’s elevation model) and road access 15 % (Digiroad). Full description: <a href="https://github.com/trotor/metsainfo/blob/main/docs/saavutettavuusindeksi.md" target="_blank">accessibility index</a> (in Finnish).</li>
<li>The property summary shows road access, road associations and thaw or weight limits.</li>
</ul>
<p>The result is an estimate from open data. The distance ignores water, slopes and neighbouring land. The feature is currently part of the timber sale price estimate add-on; accessibility may later become a separate paid add-on.</p>`
    }
};

export const TEKSTIT = { fi, sv, en };
export const T = pick(TEKSTIT);
