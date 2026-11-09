/**
 * Kolme metsäkuviota testeihin: 100 m × 100 m neliöt EPSG:3067:ssä
 * vierekkäin alkaen kohdasta [500000, 6822000].
 */
function square(x0, y0) {
    return {
        type: 'Polygon',
        coordinates: [[[x0, y0], [x0 + 100, y0], [x0 + 100, y0 + 100], [x0, y0 + 100], [x0, y0]]]
    };
}

export const STANDS = [
    {
        type: 'Feature',
        geometry: square(500000, 6822000),
        properties: {
            STANDNUMBER: 1, AREA: 1.5, VOLUME: 150, MAINTREESPECIES: 2, MEANAGE: 60,
            CUTTINGTYPE: 3, CUTTINGPROPOSALYEAR: 2027,
            PROPORTIONPINE: 0.2, PROPORTIONSPRUCE: 0.7, PROPORTIONOTHER: 0.1,
            MEASUREMENTDATE: '2021-06-01'
        }
    },
    {
        type: 'Feature',
        geometry: square(500100, 6822000),
        properties: { STANDNUMBER: 2, AREA: 2.25, VOLUME: 80, MAINTREESPECIES: 1, MEANAGE: 35 }
    },
    {
        type: 'Feature',
        geometry: square(500200, 6822000),
        properties: { STANDNUMBER: 3, AREA: 0.75, VOLUME: 0, MAINTREESPECIES: 4, DEVELOPMENTCLASS: 'X;"y"' }
    }
];
