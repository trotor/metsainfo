/**
 * Leaflet layer style functions
 */

import { COLOR_MODES, MKI_COLOR_MODES } from './config.js';
import { currentColorMode, mkiColorMode } from './state.js';

export function featureStyle(feature) {
    const mode = COLOR_MODES[currentColorMode] || COLOR_MODES.volume;
    return {
        fillColor: mode.getColor(feature.properties),
        weight: 2,
        opacity: 0.9,
        color: mode.border,
        fillOpacity: 0.6
    };
}

export function cadastralStyle() {
    return {
        color: '#8B4513',
        weight: 2,
        opacity: 0.7,
        fillColor: 'transparent',
        fillOpacity: 0,
        interactive: true
    };
}

export function selectedParcelStyle() {
    return {
        color: '#e74c3c',
        weight: 4,
        opacity: 1,
        fillColor: '#e74c3c',
        fillOpacity: 0.15
    };
}

export function highlightedStandStyle() {
    return {
        fillColor: '#f39c12',
        weight: 4,
        opacity: 1,
        color: '#e67e22',
        fillOpacity: 0.7
    };
}

export function habitatStyle() {
    return {
        fillColor: '#e74c3c',
        weight: 2,
        opacity: 0.9,
        color: '#c0392b',
        fillOpacity: 0.3,
        dashArray: '5, 5'
    };
}

export function mkiStyle(feature) {
    const mode = MKI_COLOR_MODES[mkiColorMode] || MKI_COLOR_MODES.year;
    return {
        fillColor: mode.getColor(feature.properties),
        weight: 2,
        opacity: 0.8,
        color: mode.border,
        fillOpacity: 0.5,
        dashArray: '4, 4'
    };
}
