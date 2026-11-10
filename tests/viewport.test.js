import { describe, it, expect } from 'vitest';
import { expandBbox, bboxContains } from '../js/viewport.js';

describe('näkymän rajat', () => {
    const b = { minX: 1000, minY: 2000, maxX: 2000, maxY: 3000 };

    it('expandBbox laajentaa joka suuntaan suhteessa kokoon', () => {
        expect(expandBbox(b, 0.25)).toEqual({ minX: 750, minY: 1750, maxX: 2250, maxY: 3250 });
    });

    it('bboxContains: sisällä oleva näkymä', () => {
        expect(bboxContains(expandBbox(b, 0.25), { minX: 1100, minY: 2100, maxX: 2100, maxY: 3100 })).toBe(true);
    });

    it('bboxContains: reunan yli menevä näkymä', () => {
        expect(bboxContains(expandBbox(b, 0.25), { minX: 1500, minY: 2000, maxX: 2500, maxY: 3000 })).toBe(false);
        expect(bboxContains(null, b)).toBe(false);
    });
});
