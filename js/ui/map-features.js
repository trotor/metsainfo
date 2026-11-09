/**
 * Karttakohteiden popupit, klikkaukset ja kiinteistötunnukset
 */

import { CODES } from '../config.js';
import * as state from '../state.js';
import { formatNumber, formatCadastralReference, getGeometryBounds3067 } from '../utils.js';
import { isMobileLayout } from './layout.js';
import { openStand } from './stands.js';

/**
 * Show popup for a single feature
 */
export function showFeaturePopup(feature, layer) {
    const props = feature.properties;

    const content = `
        <strong>Kuvio ${props.STANDNUMBER || '-'}</strong><br>
        Pinta-ala: ${formatNumber(props.AREA, 2)} ha<br>
        Tilavuus: ${formatNumber(props.VOLUME, 0)} m³/ha<br>
        Pääpuulaji: ${CODES.treeSpecies[props.MAINTREESPECIES] || '-'}<br>
        Ikä: ${props.MEANAGE || '-'} v
    `;

    layer.bindPopup(content).openPopup();
}

/**
 * Attach click handler to each forest feature
 */
export function onEachFeature(feature, layer) {
    layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (isMobileLayout()) {
            // Mobiilissa ei popupia: kuvio avautuu tietopaneelin listaan
            openStand(state.currentFeatures.indexOf(feature));
        } else {
            showFeaturePopup(feature, layer);
        }
    });
}

/**
 * Attach popup to each habitat feature
 */
export function onEachHabitat(feature, layer) {
    const p = feature.properties;
    const typeName = CODES.habitatType[p.SPECIALFEATURECODE] || `Tyyppi ${p.SPECIALFEATURECODE || '-'}`;
    const area = formatNumber(p.AREA, 2);

    layer.bindPopup(`
        <strong>Luontokohde</strong><br>
        <span style="color:#c0392b;font-weight:600">${typeName}</span><br>
        Pinta-ala: ${area} ha<br>
        <span style="font-size:0.8em;color:#888">Metsälain 10 § erityisen tärkeä elinympäristö</span>
    `);
}

/**
 * Attach popup and tooltip to each MKI feature
 */
export function onEachMkiFeature(feature, layer) {
    const p = feature.properties;
    const purpose = CODES.cuttingPurpose[p.CUTTINGPURPOSE] || `Koodi ${p.CUTTINGPURPOSE || '-'}`;
    const practice = CODES.cuttingType[p.CUTTINGREALIZATIONPRACTICE] || `Koodi ${p.CUTTINGREALIZATIONPRACTICE || '-'}`;
    const species = CODES.treeSpecies[p.DECLARATIONMAINTREESPECIES] || '-';
    const area = formatNumber(p.AREA, 2);
    const year = p.DECLARATIONARRIVALYEAR || '-';

    layer.bindPopup(
        '<strong>Metsänkäyttöilmoitus</strong><br>' +
        '<span style="color:#c0392b;font-weight:600">' + purpose + '</span><br>' +
        'Hakkuutapa: ' + practice + '<br>' +
        'Pinta-ala: ' + area + ' ha<br>' +
        'Vuosi: ' + year + '<br>' +
        'Puulaji: ' + species
    );

    layer.bindTooltip(year + ' – ' + purpose, {
        sticky: true,
        direction: 'top',
        opacity: 0.9
    });
}

/**
 * Attach click handler to each parcel
 */
export function onEachParcel(feature, layer, selectParcelFn) {
    layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectParcelFn(feature);
    });
}

/**
 * Add a label marker for a parcel
 */
export function addParcelLabel(feature) {
    const props = feature.properties;
    const label = props?.label || formatCadastralReference(props?.nationalCadastralReference);
    if (!label) return;

    let latLng;
    if (props?.referencePoint?.coordinates) {
        const [x, y] = props.referencePoint.coordinates;
        const [lng, lat] = proj4('EPSG:3067', 'WGS84', [x, y]);
        latLng = L.latLng(lat, lng);
    } else {
        const bounds = getGeometryBounds3067(feature.geometry);
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const [lng, lat] = proj4('EPSG:3067', 'WGS84', [centerX, centerY]);
        latLng = L.latLng(lat, lng);
    }

    const labelMarker = L.marker(latLng, {
        icon: L.divIcon({
            className: 'parcel-label',
            html: `<span>${label}</span>`,
            iconSize: null
        }),
        interactive: false
    });

    state.parcelLabelsLayer.addLayer(labelMarker);
}
