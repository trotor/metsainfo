/**
 * Shared application state
 */

export let map = null;
export let forestLayer = null;
export let cadastralLayer = null;
export let selectedParcelLayer = null;
export let parcelLabelsLayer = null;
export let highlightedStandLayer = null;
export let habitatLayer = null;
export let clickMarker = null;
export let currentFeatures = [];
export let currentParcel = null;
export let selectedStandIndex = null;
export let loadedParcels = new Map();
export let currentColorMode = 'volume';

export function setState(key, value) {
    switch (key) {
        case 'map': map = value; break;
        case 'forestLayer': forestLayer = value; break;
        case 'cadastralLayer': cadastralLayer = value; break;
        case 'selectedParcelLayer': selectedParcelLayer = value; break;
        case 'parcelLabelsLayer': parcelLabelsLayer = value; break;
        case 'highlightedStandLayer': highlightedStandLayer = value; break;
        case 'habitatLayer': habitatLayer = value; break;
        case 'clickMarker': clickMarker = value; break;
        case 'currentFeatures': currentFeatures = value; break;
        case 'currentParcel': currentParcel = value; break;
        case 'selectedStandIndex': selectedStandIndex = value; break;
        case 'loadedParcels': loadedParcels = value; break;
        case 'currentColorMode': currentColorMode = value; break;
    }
}
