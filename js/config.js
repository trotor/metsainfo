/**
 * Configuration, code mappings, tooltips, and color modes
 */

// Define EPSG:3067 (ETRS-TM35FIN) projection for Proj4
proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// EPSG:3067 CRS for Leaflet (MML/Kapsi tile grid)
export const crsEPSG3067 = new L.Proj.CRS(
    'EPSG:3067',
    '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    {
        origin: [-548576, 8388608],
        resolutions: [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
        bounds: L.bounds([-548576, 8388608], [1548576, 6291456])
    }
);

export const CONFIG = {
    defaultCenter: [62.57, 25.90],
    defaultZoom: 5,
    minZoomForParcels: 10,
    wfsUrl: 'https://avoin.metsakeskus.fi/rajapinnat/v1/stand/ows',
    habitatWfsUrl: 'https://avoin.metsakeskus.fi/rajapinnat/v1/habitat/ows',
    mkiWfsUrl: 'https://avoin.metsakeskus.fi/rajapinnat/v1/forestusedeclaration/ows',
    cadastralWfsUrl: 'https://inspire-wfs.maanmittauslaitos.fi/inspire-wfs/cp/ows',
    layers: {
        taustakartta: 'https://tiles.kartat.kapsi.fi/taustakartta_3067/{z}/{x}/{y}.jpg',
        peruskartta: 'https://tiles.kartat.kapsi.fi/peruskartta_3067/{z}/{x}/{y}.jpg',
        ortokuva: 'https://tiles.kartat.kapsi.fi/ortokuva_3067/{z}/{x}/{y}.jpg'
    }
};

export const CODES = {
    treeSpecies: {
        1: 'Mänty', 2: 'Kuusi', 3: 'Rauduskoivu', 4: 'Hieskoivu', 5: 'Haapa',
        6: 'Harmaaleppä', 7: 'Tervaleppä', 8: 'Muu havupuu', 9: 'Muu lehtipuu',
        10: 'Douglaskuusi', 11: 'Kataja', 12: 'Kontortamänty', 13: 'Kynäjalava',
        14: 'Lehtikuusi', 15: 'Metsälehmus', 16: 'Mustakuusi', 17: 'Paju',
        18: 'Pihlaja', 19: 'Pihta', 20: 'Raita', 21: 'Saarni', 22: 'Sembramänty',
        23: 'Serbiankuusi', 24: 'Tammi', 25: 'Tuomi', 26: 'Vaahtera', 27: 'Visakoivu',
        28: 'Vuorijalava', 29: 'Lehtipuu', 30: 'Havupuu'
    },
    cuttingType: {
        0: 'Määräaikainen lepo', 1: 'Ylispuiden poisto', 2: 'Ensiharvennus',
        3: 'Harvennus', 4: 'Kaistalehakkuu', 5: 'Avohakkuu', 6: 'Verhopuuhakkuu',
        7: 'Suojuspuuhakkuu', 8: 'Siemenpuuhakkuu', 9: 'Erikoishakkuu',
        11: 'Yläharvennus', 12: 'Väljennyshakkuu', 13: 'Kunnostushakkuu',
        14: 'Poimintahakkuu', 15: 'Pienaukkohakkuu', 20: 'Energiapuuharvennus',
        90: 'Maankäyttömuodon muutoshakkuu', 91: 'Erityishakkuu (6§)',
        92: 'Muu hakkuu', 93: 'Uudistushakkuu tuhoalueella', 94: 'Kasvatushakkuu tuhoalueella'
    },
    silvicultureType: {
        1: 'Taimikon perustaminen', 2: 'Taimikon varhaishoito', 3: 'Taimikon hoito',
        4: 'Nuoren metsän hoito', 5: 'Muut hoitotyöt'
    },
    fertilityClass: {
        1: 'Lehto', 2: 'Lehtomainen kangas', 3: 'Tuore kangas', 4: 'Kuivahko kangas',
        5: 'Kuiva kangas', 6: 'Karukkokangas', 7: 'Kalliomaa/hietikko', 8: 'Lakimetsä/tunturi'
    },
    soilType: {
        10: 'Keskikarkea/karkea kangasmaa', 11: 'Karkea moreeni', 12: 'Karkea lajittunut',
        20: 'Hienojakoinen kangasmaa', 21: 'Hienoainesmoreeni', 22: 'Hienojakoinen lajittunut',
        23: 'Silttipitoinen maalaji', 24: 'Savimaa', 30: 'Kivinen keskikarkea kangasmaa',
        31: 'Kivinen karkea moreeni', 32: 'Kivinen karkea lajittunut',
        40: 'Kivinen hienojakoinen kangasmaa', 50: 'Kallio/kivikko',
        60: 'Turvemaa', 61: 'Saraturve', 62: 'Rahkaturve', 63: 'Puuvaltainen turve',
        64: 'Eroosioherkkä saraturve', 65: 'Eroosioherkkä rahkaturve',
        66: 'Maatumaton saraturve', 67: 'Maatumaton rahkaturve', 70: 'Multamaa', 80: 'Liejumaa'
    },
    developmentClass: {
        'A0': 'Aukea', 'S0': 'Siemenpuumetsikkö', 'Y1': 'Ylispuustoinen taimikko',
        '02': 'Nuori kasvatusmetsikkö', '03': 'Varttunut kasvatusmetsikkö',
        '04': 'Uudistuskypsä metsikkö', '05': 'Suojuspuumetsikkö',
        'T1': 'Taimikko (alle 1,3 m)', 'T2': 'Taimikko (yli 1,3 m)', 'ER': 'Eri-ikäisrakenteinen'
    },
    drainageState: {
        1: 'Ojittamaton kangas', 2: 'Soistunut kangas', 3: 'Ojitettu kangas',
        6: 'Luonnontilainen suo', 7: 'Ojikko', 8: 'Muuttuma', 9: 'Turvekangas'
    },
    accessibility: {
        1: 'Ympärivuotinen', 2: 'Sulan maan (ei kelirikko)', 3: 'Kuivana kautena',
        4: 'Vain maa jäässä', 5: 'Ei määritelty'
    },
    mainGroup: {
        1: 'Metsämaa', 2: 'Kitumaa', 3: 'Joutomaa', 4: 'Muu metsätalousmaa',
        5: 'Tontti', 6: 'Maatalousmaa', 7: 'Muu maa', 8: 'Vesistö'
    },
    cuttingPurpose: {
        1: 'Kasvatushakkuu',
        2: 'Uudistushakkuu',
        3: 'Muu hakkuu',
        4: 'Erityishakkuu (6§)',
        5: 'Maankäyttömuodon muutos',
        6: 'Metsätuhoalue'
    },
    habitatType: {
        530: 'Jyrkänne', 540: 'Kallio', 543: 'Kallio', 545: 'Louhikko/kivikko',
        570: 'Kuiva lehto', 571: 'Tuore lehto', 572: 'Kostea lehto',
        577: 'Letto', 578: 'Rehevä korpi',
        600: 'Metsäsaareke', 602: 'Vähäpuustoinen suo',
        613: 'Lampi', 614: 'Lähde', 615: 'Lähteikkö',
        618: 'Puro', 620: 'Luhta', 623: 'Noro', 624: 'Tihkupinta', 625: 'Vesistö'
    }
};

export const TOOLTIPS = {
    kuvio: 'Metsikkökuvio on yhtenäinen metsäalue, jolla puusto ja kasvupaikka ovat samankaltaisia.',
    tilavuus: 'Puuston tilavuus hehtaarilla (m³/ha). Sisältää kaikki puutavaralajit.',
    puulajijakauma: 'Puulajien osuudet pinta-alalla painotettuna. Perustuu laserkeilaukseen.',
    keskiIka: 'Puuston pohjapinta-alalla painotettu keski-ikä vuosina.',
    keskipituus: 'Puuston pohjapinta-alalla painotettu keskipituus metreinä.',
    keskilapimitta: 'Puuston pohjapinta-alalla painotettu keskiläpimitta rinnankorkeudelta (1,3 m) senttimetreinä.',
    kasvu: 'Puuston vuotuinen tilavuuskasvu hehtaarilla (m³/ha/v).',
    tukkipuu: 'Sahateollisuuden raaka-aine. Tyvilläpimitta yleensä yli 15 cm (mänty) tai 16 cm (kuusi).',
    kuitupuu: 'Sellu- ja paperiteollisuuden raaka-aine. Pienempiläpimittaista puuta kuin tukkipuu.',
    pohjapintaAla: 'Puunrunkojen yhteenlaskettu poikkileikkauspinta-ala rinnankorkeudella (1,3 m), yksikkö m²/ha.',
    runkoluku: 'Puiden lukumäärä hehtaarilla.',
    kehitysluokka: 'Metsikön kehitysvaihe: aukea, taimikko, kasvatusmetsä, uudistuskypsä jne.',
    kasvupaikka: 'Maaperän ravinteisuuteen perustuva luokitus. Lehto on ravinteikkain, karukkokangas karujen.',
    maalaji: 'Maaperän laatu: kivennäismaa (hiekka, moreeni) tai turvemaa (rahka, sara).',
    ojitustilanne: 'Metsämaan kuivatustilanne: ojittamaton, ojitettu tai ojikko.',
    kulkukelpoisuus: 'Metsäkoneiden kulkumahdollisuus: ympärivuotinen, kesä/talvi, tai vain jäätynyt maa.',
    hakkuuehdotus: 'Metsäkeskuksen laskennallinen ehdotus hakkuutarpeesta. Ei korvaa metsäammattilaisen arviota.',
    metsanhoitoehdotus: 'Metsäkeskuksen laskennallinen ehdotus hoitotarpeesta, esim. taimikonhoito tai pystykarsinta.'
};

export const COLOR_MODES = {
    volume: {
        label: 'Tilavuus (m³/ha)',
        getColor: (p) => {
            const v = p.VOLUME || 0;
            if (v > 200) return '#1e7d1e';
            if (v > 150) return '#3cb043';
            if (v > 100) return '#6cc66c';
            if (v > 50) return '#8cd98c';
            return '#a8d5a2';
        },
        border: '#2d5a27',
        legend: [
            { color: '#a8d5a2', label: '0–50' },
            { color: '#8cd98c', label: '50–100' },
            { color: '#6cc66c', label: '100–150' },
            { color: '#3cb043', label: '150–200' },
            { color: '#1e7d1e', label: '200+' }
        ]
    },
    age: {
        label: 'Ikä (v)',
        getColor: (p) => {
            const a = p.MEANAGE || 0;
            if (a > 100) return '#4a1486';
            if (a > 80) return '#8b5cf6';
            if (a > 60) return '#c084fc';
            if (a > 40) return '#e9d5ff';
            if (a > 20) return '#fef3c7';
            return '#fef9c3';
        },
        border: '#4a1486',
        legend: [
            { color: '#fef9c3', label: '0–20' },
            { color: '#fef3c7', label: '20–40' },
            { color: '#e9d5ff', label: '40–60' },
            { color: '#c084fc', label: '60–80' },
            { color: '#8b5cf6', label: '80–100' },
            { color: '#4a1486', label: '100+' }
        ]
    },
    species: {
        label: 'Pääpuulaji',
        getColor: (p) => {
            const s = Number(p.MAINTREESPECIES);
            if (s === 1) return '#3498db';
            if (s === 2) return '#27ae60';
            if (s === 3 || s === 4) return '#f1c40f';
            if (s >= 5) return '#e67e22';
            return '#bdc3c7';
        },
        border: '#555',
        legend: [
            { color: '#3498db', label: 'Mänty' },
            { color: '#27ae60', label: 'Kuusi' },
            { color: '#f1c40f', label: 'Koivu' },
            { color: '#e67e22', label: 'Muu lehtipuu' }
        ]
    },
    devclass: {
        label: 'Kehitysluokka',
        getColor: (p) => {
            const d = String(p.DEVELOPMENTCLASS);
            if (d === 'A0') return '#fef9c3';
            if (d === 'S0' || d === 'T1') return '#bbf7d0';
            if (d === 'T2') return '#86efac';
            if (d === '02') return '#4ade80';
            if (d === '03') return '#22c55e';
            if (d === '04') return '#16a34a';
            if (d === '05') return '#15803d';
            if (d === 'Y1') return '#a78bfa';
            if (d === 'ER') return '#94a3b8';
            return '#e2e8f0';
        },
        border: '#555',
        legend: [
            { color: '#fef9c3', label: 'Aukea' },
            { color: '#bbf7d0', label: 'Taimikko' },
            { color: '#4ade80', label: 'Nuori kasvatus' },
            { color: '#22c55e', label: 'Varttunut' },
            { color: '#16a34a', label: 'Uudistuskypsä' },
            { color: '#a78bfa', label: 'Ylispuust./eri-ik.' }
        ]
    }
};

export const MKI_COLOR_MODES = {
    year: {
        label: 'Vuoden mukaan',
        getColor: (p) => {
            const year = parseInt(p.DECLARATIONARRIVALYEAR) || 0;
            const currentYear = new Date().getFullYear();
            const age = currentYear - year;
            if (age <= 0) return '#e74c3c';
            if (age <= 1) return '#e67e22';
            if (age <= 2) return '#f39c12';
            if (age <= 3) return '#f1c40f';
            return '#fad7a0';
        },
        border: '#c0392b',
        legend: [
            { color: '#e74c3c', label: 'Tänä vuonna' },
            { color: '#e67e22', label: '1 v sitten' },
            { color: '#f39c12', label: '2 v sitten' },
            { color: '#f1c40f', label: '3 v sitten' },
            { color: '#fad7a0', label: '4–5 v sitten' }
        ]
    },
    purpose: {
        label: 'Hakkuutarkoitus',
        getColor: (p) => {
            const c = Number(p.CUTTINGPURPOSE);
            if (c === 1) return '#3498db';
            if (c === 2) return '#e74c3c';
            if (c === 3) return '#f39c12';
            if (c === 4) return '#9b59b6';
            if (c === 5) return '#1abc9c';
            if (c === 6) return '#e67e22';
            return '#95a5a6';
        },
        border: '#555',
        legend: [
            { color: '#3498db', label: 'Kasvatushakkuu' },
            { color: '#e74c3c', label: 'Uudistushakkuu' },
            { color: '#f39c12', label: 'Muu hakkuu' },
            { color: '#9b59b6', label: 'Erityishakkuu' },
            { color: '#1abc9c', label: 'Maankäytön muutos' },
            { color: '#e67e22', label: 'Metsätuhoalue' }
        ]
    }
};
