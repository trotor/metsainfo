import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { TOOLTIPS } from '../js/config.js';
import { tip, initTips, placeTip } from '../js/ui/tips.js';

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

    it('työpöydällä napautus ei jätä vihjettä auki', () => {
        tips()[0].click();
        expect(tips()[0].classList.contains('open')).toBe(false);
        expect(inline()).toHaveLength(0);
    });
});

describe('selitteen paikka työpöydällä', () => {
    const vp = { width: 1280, height: 800 };
    const size = { width: 220, height: 60 };
    const icon = (left, top) => ({ left, top, right: left + 14, bottom: top + 14, width: 14, height: 14 });

    it('termin yläpuolelle, kun tilaa on', () => {
        const p = placeTip(icon(400, 300), size, vp);
        expect(p.below).toBe(false);
        expect(p.top).toBe(300 - 8 - 60);
        expect(p.left).toBe(407 - 110);
        expect(p.arrowX).toBe(110);
    });

    it('alle, kun yläpuolella ei ole tilaa (esim. paneelin yläreuna)', () => {
        const p = placeTip(icon(400, 40), size, vp);
        expect(p.below).toBe(true);
        expect(p.top).toBe(40 + 14 + 8);
    });

    it('pysyy ikkunassa reunoilla, nuoli osoittaa termiin', () => {
        const l = placeTip(icon(2, 300), size, vp);
        expect(l.left).toBe(8);
        expect(l.arrowX).toBe(10); // nuoli pysyy laatikon sisällä
        const r = placeTip(icon(1270, 300), size, vp);
        expect(r.left).toBe(1280 - 8 - 220);
        expect(r.arrowX).toBeLessThanOrEqual(220 - 10);
    });
});

describe('selite työpöydällä ei leikkaudu paneeliin', () => {
    beforeEach(() => setup(false));

    it('hover ja fokus sijoittavat selitteen ikkunaan (position: fixed)', () => {
        const t = tips()[0];
        t.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        const text = t.querySelector('.info-tip-text');
        expect(text.style.position).toBe('fixed');
        tips()[1].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        expect(tips()[1].querySelector('.info-tip-text').style.position).toBe('fixed');
    });
});
