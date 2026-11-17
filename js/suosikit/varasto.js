/**
 * Suosikit ja omat muistiinpanot (#24). Tallennetaan vain tälle laitteelle
 * (localStorage); mitään ei lähetetä, joten tietosuojailmoitukset eivät muutu.
 *
 * Suosikki: { id, type, name, note, created, updated, ref }
 *   kiinteisto  id 'k:<tunnus>'   ref { reference }
 *   kuvio       id 's:<STANDID>'  ref { standId, standNumber, reference?, center: [x, y] }
 *   haku        id 'h:<aika>'     ref { criteria, center: [x, y] }
 */

const KEY = 'metsainfo.suosikit';
export const TYYPIT = ['kiinteisto', 'kuvio', 'haku'];

export function favoriteId(type, ref, now = Date.now()) {
    if (type === 'kiinteisto') return `k:${ref.reference}`;
    if (type === 'kuvio') return `s:${ref.standId}`;
    return `h:${now.toString(36)}`;
}

export function createFavorites(storage = globalThis.localStorage, { now = () => new Date() } = {}) {
    let items = [];
    try {
        const raw = storage?.getItem(KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) items = parsed.filter(i => i && i.id && TYYPIT.includes(i.type));
    } catch {
        items = [];
    }
    const listeners = new Set();

    const save = () => {
        try {
            storage?.setItem(KEY, JSON.stringify(items));
        } catch {
            // Täynnä tai estetty: muutos säilyy tämän istunnon ajan
        }
        listeners.forEach(fn => fn());
    };

    return {
        /** Uusin muutos ensin. */
        list() {
            return items.slice().sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
        },
        get(id) {
            return items.find(i => i.id === id) || null;
        },
        /** Lisää tai palauttaa olemassa olevan (sama kiinteistö tai kuvio). */
        add({ type, name, note = '', ref }) {
            if (!TYYPIT.includes(type)) throw new Error(`Tuntematon suosikkityyppi: ${type}`);
            const time = now();
            const id = favoriteId(type, ref, time.getTime());
            const existing = items.find(i => i.id === id);
            if (existing) return existing;
            const item = { id, type, name: String(name || '').trim() || id, note, created: time.toISOString(), updated: time.toISOString(), ref };
            items.push(item);
            save();
            return item;
        },
        update(id, patch) {
            const item = items.find(i => i.id === id);
            if (!item) return null;
            if (patch.name != null) item.name = String(patch.name).trim() || item.name;
            if (patch.note != null) item.note = String(patch.note);
            item.updated = now().toISOString();
            save();
            return item;
        },
        /** Kuvion kiinteistötunnus, kun se selviää (lähihausta tallennettu kuvio). */
        setReference(id, reference) {
            const item = items.find(i => i.id === id);
            if (!item || item.type !== 'kuvio' || !reference || item.ref.reference === reference) return;
            item.ref = { ...item.ref, reference };
            save();
        },
        remove(id) {
            const before = items.length;
            items = items.filter(i => i.id !== id);
            if (items.length !== before) save();
        },
        onChange(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        }
    };
}

const fold = (s) => String(s ?? '').toLocaleLowerCase('fi').normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Suodatus tyypin ja tekstin (nimi, muistiinpano, tunnus) mukaan. */
export function filterFavorites(items, { type = null, text = '' } = {}) {
    const words = fold(text).split(/\s+/).filter(Boolean);
    return items.filter(i => {
        if (type && i.type !== type) return false;
        if (!words.length) return true;
        const hay = fold([i.name, i.note, i.ref?.reference, i.ref?.standNumber].filter(Boolean).join(' '));
        return words.every(w => hay.includes(w));
    });
}
