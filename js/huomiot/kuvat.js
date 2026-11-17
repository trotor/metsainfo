/**
 * Huomion valokuvat (#37): puhdas logiikka. Kuvat ovat sovelluksen omissa
 * tiedostoissa (js/platform/kuvat.js), huomiossa vain viite { id, path }.
 * Muokkauksen aikana uudet kuvat ovat luonnoksessa ({ id, src, source }: source on
 * puhelimessa kameran väliaikainen tiedosto, verkossa kuvan data) ja kirjoitetaan
 * vasta tallennettaessa; galleriaan tallennettu alkuperäinen ei ole sovelluksen hallinnassa.
 */

export const MAX_KUVAT = 5;

const safe = (s) => String(s).replace(/[^\w-]/g, '_');

export function photoPath(noteId, photoId) {
    return `huomiot/${safe(noteId)}/${safe(photoId)}.jpg`;
}

export function newPhotoId(now = Date.now()) {
    return `k${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Ladatut tai tallennettavat viitteet: vain { id, path } -merkkijonot, enintään MAX_KUVAT. */
export function cleanPhotos(list) {
    if (!Array.isArray(list)) return [];
    return list
        .filter(p => p && typeof p.id === 'string' && typeof p.path === 'string')
        .slice(0, MAX_KUVAT)
        .map(p => ({ id: p.id, path: p.path }));
}

/**
 * Tallennus: uudet kuvat tiedostoiksi, poistetut pois. Palauttaa huomioon
 * tallennettavat viitteet ja epäonnistuneiden kirjoitusten määrän.
 * io = { write(path, source), remove(path) }
 */
export async function commitPhotos({ noteId, before = [], draft = [], io }) {
    const photos = [];
    let failed = 0;
    for (const p of draft.slice(0, MAX_KUVAT)) {
        if (p.path) { photos.push({ id: p.id, path: p.path }); continue; }
        if (!p.source) continue;
        const path = photoPath(noteId, p.id);
        try {
            await io.write(path, p.source);
            photos.push({ id: p.id, path });
        } catch {
            failed++;
        }
    }
    const kept = new Set(photos.map(p => p.path));
    for (const p of before) {
        if (p?.path && !kept.has(p.path)) await io.remove(p.path).catch(() => {});
    }
    return { photos, failed };
}

/** Huomion poisto: sovelluksen kopiot pois (gallerian kuva jää). */
export async function removeAllPhotos(note, io) {
    for (const p of note?.photos || []) {
        if (p?.path) await io.remove(p.path).catch(() => {});
    }
}
