/**
 * Huomiot (#33): pistemuotoiset muistiinpanot. Tallennetaan vain tälle
 * laitteelle (localStorage); mitään ei lähetetä.
 *
 * Huomio: { id, title, type, text, created, updated, point: [x, y] (EPSG:3067),
 *           accuracy?: m, parcel: { reference, label } | null,
 *           stand: { standId, standNumber } | null }
 */

const KEY = 'metsainfo.huomiot';
export const TYYPIT = ['tuulenkaato', 'rajapyykki', 'oja', 'varasto', 'muu'];

const validPoint = (p) => Array.isArray(p) && p.length === 2 && p.every(v => typeof v === 'number' && Number.isFinite(v));
const validType = (t) => (TYYPIT.includes(t) ? t : 'muu');
const EDITABLE = ['title', 'type', 'text', 'point', 'accuracy', 'parcel', 'stand'];

/** Ladattu huomio siistitään: tuntematon tyyppi → muu, puuttuvat kentät oletuksiin. */
function clean(i) {
    const created = typeof i.created === 'string' ? i.created : (typeof i.updated === 'string' ? i.updated : '');
    return {
        ...i,
        title: typeof i.title === 'string' ? i.title : '',
        type: validType(i.type),
        text: typeof i.text === 'string' ? i.text : '',
        created,
        updated: typeof i.updated === 'string' ? i.updated : created,
        parcel: i.parcel && typeof i.parcel === 'object' ? i.parcel : null,
        stand: i.stand && typeof i.stand === 'object' ? i.stand : null
    };
}

export function createNotes(storage, { now = () => new Date() } = {}) {
    let items = [];
    try {
        storage = storage === undefined ? globalThis.localStorage : storage;
        const raw = storage?.getItem(KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) items = parsed.filter(i => i && typeof i.id === 'string' && validPoint(i.point)).map(clean);
    } catch {
        items = [];
    }
    const listeners = new Set();
    let saved = true;

    const save = () => {
        try {
            storage?.setItem(KEY, JSON.stringify(items));
            saved = true;
        } catch {
            // Täynnä tai estetty: muutos säilyy tämän istunnon ajan (käyttöliittymä varoittaa)
            saved = false;
        }
        listeners.forEach(fn => fn());
    };

    return {
        /** Onnistuiko viimeisin tallennus laitteelle. */
        get saved() { return saved; },
        /** Uusin muutos ensin. */
        list() {
            return items.slice().sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
        },
        get(id) {
            return items.find(i => i.id === id) || null;
        },
        add({ point, title = '', type = 'muu', text = '', accuracy, parcel = null, stand = null }) {
            if (!validPoint(point)) throw new Error('Huomion piste puuttuu');
            const time = now();
            const id = `h:${time.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
            const item = {
                id, title: String(title).trim(), type: validType(type), text: String(text),
                created: time.toISOString(), updated: time.toISOString(),
                point: [point[0], point[1]], parcel, stand
            };
            if (Number.isFinite(accuracy)) item.accuracy = accuracy;
            items.push(item);
            save();
            return item;
        },
        update(id, patch) {
            const item = items.find(i => i.id === id);
            if (!item) return null;
            for (const key of EDITABLE) {
                if (!(key in patch)) continue;
                if (key === 'point' && !validPoint(patch.point)) continue;
                if (key === 'type') item.type = validType(patch.type);
                else if (key === 'title') item.title = String(patch.title ?? '').trim();
                else item[key] = patch[key];
            }
            item.updated = now().toISOString();
            save();
            return item;
        },
        remove(id) {
            const before = items.length;
            items = items.filter(i => i.id !== id);
            if (items.length === before) return false;
            save();
            return true;
        },
        onChange(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        }
    };
}
