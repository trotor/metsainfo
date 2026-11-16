/**
 * Maastotilan pisteet, löydetyt kuviot, vastatut kysymykset ja havainnot.
 * Tallennetaan vain tälle laitteelle (localStorage); mitään ei lähetetä.
 */

import { POINTS } from './visa.js';

const KEY = 'metsainfo.maasto';
const MAX_OBSERVATIONS = 500;

function empty() {
    return { points: 0, streak: 0, level: 'helppo', stands: {}, observations: [] };
}

export function createStore(storage = globalThis.localStorage) {
    let data = empty();
    try {
        const raw = storage?.getItem(KEY);
        if (raw) data = { ...empty(), ...JSON.parse(raw) };
    } catch {
        data = empty();
    }

    const save = () => {
        try {
            storage?.setItem(KEY, JSON.stringify(data));
        } catch {
            // Tallennus ei ole välttämätöntä
        }
    };

    return {
        get points() { return data.points; },
        get streak() { return data.streak; },
        get level() { return data.level; },
        get standCount() { return Object.keys(data.stands).length; },
        get observations() { return data.observations.slice(); },

        setLevel(level) {
            data.level = level;
            save();
        },

        /** Merkitsee kuvion löydetyksi. Palauttaa pisteet (0, jos jo löydetty). */
        visit(standId) {
            if (standId == null || data.stands[standId]) return 0;
            data.stands[standId] = { found: new Date().toISOString(), answered: [] };
            data.points += POINTS.uusiKuvio;
            save();
            return POINTS.uusiKuvio;
        },

        answered(standId) {
            return new Set(data.stands[standId]?.answered || []);
        },

        /** Kirjaa vastauksen: pisteet, putki ja havainto. */
        record(standId, question, value, result, meta = {}) {
            const stand = data.stands[standId] || (data.stands[standId] = { found: new Date().toISOString(), answered: [] });
            if (!stand.answered.includes(question.id)) stand.answered.push(question.id);
            if (meta.source === 'kartta') stand.kartalta = true; // vastattu kokeilussa kartalta
            data.points += result.points;
            if (result.correct !== null) data.streak = result.streak;
            if (question.kind === 'observe') {
                data.observations.push({ standId, time: new Date().toISOString(), answer: value, ...meta });
                if (data.observations.length > MAX_OBSERVATIONS) data.observations.shift();
            }
            save();
        },

        reset() {
            data = empty();
            save();
        }
    };
}
