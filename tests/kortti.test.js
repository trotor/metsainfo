import '../js/vendor/index.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCard } from '../js/ui/kortti.js';

beforeEach(() => { document.body.innerHTML = ''; });

describe('createCard', () => {
    it('toisen kortin avaus sulkee auki olevan', () => {
        const onClose = vi.fn();
        const a = createCard({ id: 'a', label: 'A', onClose });
        const b = createCard({ id: 'b', label: 'B' });
        a.open();
        b.open();
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it('piilossa olevaa korttia ei suljeta oletuksena', () => {
        const onClose = vi.fn();
        createCard({ id: 'c', label: 'C', onClose });
        createCard({ id: 'd', label: 'D' }).open();
        expect(onClose).not.toHaveBeenCalled();
    });
    it('notifyHidden: tila päättyy, vaikka kortti on piilossa (kuviovalinta mobiilissa)', () => {
        const onClose = vi.fn();
        createCard({ id: 'e', label: 'E', onClose, notifyHidden: true });
        createCard({ id: 'f', label: 'F' }).open();
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
