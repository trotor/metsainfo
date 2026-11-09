/**
 * Toiminnot: ohje, linkin kopiointi, CSV-lataus
 */

import { CODES } from '../config.js';
import * as state from '../state.js';
import { isNative, shareableParcelUrl, csvFileName } from '../platform/index.js';
import { shareLink, shareTextFile } from '../platform/share.js';

/**
 * Toggle the help modal
 */
export function toggleHelp() {
    const modal = document.getElementById('help-modal');
    const overlay = document.getElementById('help-overlay');
    const isHidden = modal.classList.contains('hidden');
    modal.classList.toggle('hidden', !isHidden);
    overlay.classList.toggle('hidden', !isHidden);
}

/**
 * Copy shareable link to clipboard
 */
export function copyParcelLink(btn = document.getElementById('copy-link-btn')) {
    if (isNative()) {
        // Sovelluksessa jakonäkymä ja julkinen verkko-osoite
        shareLink({ title: 'Metsäinfo', url: shareableParcelUrl(window.location.href) })
            .catch(error => console.error('Jako epäonnistui:', error));
        return;
    }

    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        if (!btn) return;
        const originalText = btn.textContent;
        btn.textContent = 'Kopioitu!';
        setTimeout(() => { btn.textContent = originalText; }, 2000);
    });
}

/**
 * Build CSV content (BOM, ;-separated) from forest stand features
 */
export function buildCSV(features) {
    const headers = [
        'Kuvio', 'Pinta-ala (ha)', 'Pääpuulaji', 'Kehitysluokka', 'Kasvupaikka',
        'Maalaji', 'Ikä (v)', 'Pituus (m)', 'Läpimitta (cm)', 'Pohjapinta-ala (m²/ha)',
        'Runkoluku (kpl/ha)', 'Tilavuus (m³/ha)', 'Kasvu (m³/ha/v)', 'Tukkipuu (m³/ha)',
        'Kuitupuu (m³/ha)', 'Mänty (%)', 'Kuusi (%)', 'Lehtipuut (%)',
        'Hakkuuehdotus', 'Hakkuuvuosi', 'Hoitoehdotus', 'Hoitovuosi', 'Mittauspäivä'
    ];

    const rows = features.map((f, idx) => {
        const p = f.properties;
        return [
            p.STANDNUMBER || (idx + 1),
            p.AREA || '',
            CODES.treeSpecies[p.MAINTREESPECIES] || '',
            CODES.developmentClass[p.DEVELOPMENTCLASS] || p.DEVELOPMENTCLASS || '',
            CODES.fertilityClass[p.FERTILITYCLASS] || '',
            CODES.soilType[p.SOILTYPE] || '',
            p.MEANAGE || '',
            p.MEANHEIGHT || '',
            p.MEANDIAMETER || '',
            p.BASALAREA || '',
            p.STEMCOUNT || '',
            p.VOLUME || '',
            p.VOLUMEGROWTH || '',
            p.SAWLOGVOLUME || '',
            p.PULPWOODVOLUME || '',
            Math.round((p.PROPORTIONPINE || 0) * 100),
            Math.round((p.PROPORTIONSPRUCE || 0) * 100),
            Math.round((p.PROPORTIONOTHER || 0) * 100),
            CODES.cuttingType[p.CUTTINGTYPE] || '',
            p.CUTTINGPROPOSALYEAR || '',
            CODES.silvicultureType[p.SILVICULTURETYPE] || '',
            p.SILVICULTUREPROPOSALYEAR || '',
            p.MEASUREMENTDATE ? new Date(p.MEASUREMENTDATE).toLocaleDateString('fi-FI') : ''
        ];
    });

    const escapeCSV = (field) => {
        const str = String(field ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    const BOM = '\uFEFF';
    return BOM +
        headers.map(escapeCSV).join(';') + '\n' +
        rows.map(row => row.map(escapeCSV).join(';')).join('\n');
}

/**
 * Download forest stand data as CSV file
 */
export function downloadCSV() {
    if (!state.currentFeatures || state.currentFeatures.length === 0) {
        alert('Ei ladattavia metsäkuviotietoja.');
        return;
    }

    const parcelId = state.currentParcel?.properties?.nationalCadastralReference ||
                     state.currentParcel?.properties?.label || 'tuntematon';

    const csvContent = buildCSV(state.currentFeatures);

    if (isNative()) {
        shareTextFile(csvFileName(parcelId), csvContent)
            .catch(error => {
                console.error('CSV:n jako epäonnistui:', error);
                alert('CSV-tiedoston jako epäonnistui.');
            });
        return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', csvFileName(parcelId));
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
