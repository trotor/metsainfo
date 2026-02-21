"""
Code mappings from Metsäkeskus WFS specification.
Ported from js/config.js — keep in sync with browser version.
Source: https://www.metsakeskus.fi/sites/default/files/document/avoin-metsatieto-wfs-stand-habitat-koodisto-ja-tietokantakuvaus.xlsx
"""

WFS_FOREST_URL = "https://avoin.metsakeskus.fi/rajapinnat/v1/stand/ows"
WFS_CADASTRAL_URL = "https://inspire-wfs.maanmittauslaitos.fi/inspire-wfs/cp/ows"

TREE_SPECIES = {
    1: "Mänty", 2: "Kuusi", 3: "Rauduskoivu", 4: "Hieskoivu", 5: "Haapa",
    6: "Harmaaleppä", 7: "Tervaleppä", 8: "Muu havupuu", 9: "Muu lehtipuu",
    10: "Douglaskuusi", 11: "Kataja", 12: "Kontortamänty", 13: "Kynäjalava",
    14: "Lehtikuusi", 15: "Metsälehmus", 16: "Mustakuusi", 17: "Paju",
    18: "Pihlaja", 19: "Pihta", 20: "Raita", 21: "Saarni", 22: "Sembramänty",
    23: "Serbiankuusi", 24: "Tammi", 25: "Tuomi", 26: "Vaahtera", 27: "Visakoivu",
    28: "Vuorijalava", 29: "Lehtipuu", 30: "Havupuu",
}

CUTTING_TYPE = {
    0: "Määräaikainen lepo", 1: "Ylispuiden poisto", 2: "Ensiharvennus",
    3: "Harvennus", 4: "Kaistalehakkuu", 5: "Avohakkuu", 6: "Verhopuuhakkuu",
    7: "Suojuspuuhakkuu", 8: "Siemenpuuhakkuu", 9: "Erikoishakkuu",
    11: "Yläharvennus", 12: "Väljennyshakkuu", 13: "Kunnostushakkuu",
    14: "Poimintahakkuu", 15: "Pienaukkohakkuu", 20: "Energiapuuharvennus",
    90: "Maankäyttömuodon muutoshakkuu", 91: "Erityishakkuu (6§)",
    92: "Muu hakkuu", 93: "Uudistushakkuu tuhoalueella", 94: "Kasvatushakkuu tuhoalueella",
}

SILVICULTURE_TYPE = {
    1: "Taimikon perustaminen", 2: "Taimikon varhaishoito", 3: "Taimikon hoito",
    4: "Nuoren metsän hoito", 5: "Muut hoitotyöt",
}

FERTILITY_CLASS = {
    1: "Lehto", 2: "Lehtomainen kangas", 3: "Tuore kangas", 4: "Kuivahko kangas",
    5: "Kuiva kangas", 6: "Karukkokangas", 7: "Kalliomaa/hietikko", 8: "Lakimetsä/tunturi",
}

SOIL_TYPE = {
    10: "Keskikarkea/karkea kangasmaa", 11: "Karkea moreeni", 12: "Karkea lajittunut",
    20: "Hienojakoinen kangasmaa", 21: "Hienoainesmoreeni", 22: "Hienojakoinen lajittunut",
    23: "Silttipitoinen maalaji", 24: "Savimaa", 30: "Kivinen keskikarkea kangasmaa",
    31: "Kivinen karkea moreeni", 32: "Kivinen karkea lajittunut",
    40: "Kivinen hienojakoinen kangasmaa", 50: "Kallio/kivikko",
    60: "Turvemaa", 61: "Saraturve", 62: "Rahkaturve", 63: "Puuvaltainen turve",
    64: "Eroosioherkkä saraturve", 65: "Eroosioherkkä rahkaturve",
    66: "Maatumaton saraturve", 67: "Maatumaton rahkaturve", 70: "Multamaa", 80: "Liejumaa",
}

DEVELOPMENT_CLASS = {
    "A0": "Aukea", "S0": "Siemenpuumetsikkö", "Y1": "Ylispuustoinen taimikko",
    "02": "Nuori kasvatusmetsikkö", "03": "Varttunut kasvatusmetsikkö",
    "04": "Uudistuskypsä metsikkö", "05": "Suojuspuumetsikkö",
    "T1": "Taimikko (alle 1,3 m)", "T2": "Taimikko (yli 1,3 m)", "ER": "Eri-ikäisrakenteinen",
}

DRAINAGE_STATE = {
    1: "Ojittamaton kangas", 2: "Soistunut kangas", 3: "Ojitettu kangas",
    6: "Luonnontilainen suo", 7: "Ojikko", 8: "Muuttuma", 9: "Turvekangas",
}

ACCESSIBILITY = {
    1: "Ympärivuotinen", 2: "Sulan maan (ei kelirikko)", 3: "Kuivana kautena",
    4: "Vain maa jäässä", 5: "Ei määritelty",
}

MAIN_GROUP = {
    1: "Metsämaa", 2: "Kitumaa", 3: "Joutomaa", 4: "Muu metsätalousmaa",
    5: "Tontti", 6: "Maatalousmaa", 7: "Muu maa", 8: "Vesistö",
}
