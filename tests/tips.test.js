import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { TOOLTIPS } from '../js/config.js';
import { tip, initTips } from '../js/ui/tips.js';

const win = (matches) => ({
    matchMedia: () => ({ matches, addEventListener() {}, removeEventListener() {} })
});

let root;

function setup(mobile) {
    document.body.innerHTML = `
        <div id="root">
            <div class="detail-row"><span>Kehitysluokka ${tip('kehitysluokka')}:</span><span>x</span></div>
            <div class="detail-row"><span>Kasvupaikka ${tip('kasvupaikka')}:</span><span>y</span></div>
        </div>`;
    root = document.getElementById('root');
    initTips(root, { win: win(mobile) });
}

const tips = () => root.querySelectorAll('.info-tip');
const inline = () => [...root.querySelectorAll('.tip-inline')];

describe('selitteet mobiilissa', () => {
    beforeEach(() => setup(true));

    it('napautus avaa selitteen termin alle', () => {
        tips()[0].click();
        expect(inline()).toHaveLength(1);
        expect(root.querySelectorAll('.detail-row')[0].nextElementSibling).toBe(inline()[0]);
        expect(inline()[0].textContent).toBe(TOOLTIPS.kehitysluokka);
    });

    it('toinen napautus sulkee', () => {
        tips()[0].click();
        tips()[0].click();
        expect(inline()).toHaveLength(0);
        expect(root.querySelector('.info-tip.open')).toBeNull();
    });

    it('vain yksi auki kerrallaan', () => {
        tips()[1].click();
        tips()[0].click();
        expect(inline()).toHaveLength(1);
        expect(inline()[0].textContent).toBe(TOOLTIPS.kehitysluokka);
        expect(root.querySelectorAll('.info-tip.open')).toHaveLength(1);
    });

    it('Escape sulkee', () => {
        tips()[0].click();
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(inline()).toHaveLength(0);
        expect(root.querySelector('.info-tip.open')).toBeNull();
    });
});

describe('selitteet työpöydällä', () => {
    beforeEach(() => setup(false));

    it('työpöydällä ei lisätä riviä', () => {
        tips()[0].click();
        expect(tips()[0].classList.contains('open')).toBe(true);
        expect(inline()).toHaveLength(0);
    });
});
