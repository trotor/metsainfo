import '../js/vendor/index.js';
import '../js/config.js';
import { describe, it, expect } from 'vitest';
import { buildCSV } from '../js/ui/actions.js';
import { STANDS } from './fixtures/stands.js';

describe('buildCSV', () => {
    it('alkaa BOMilla ja otsikkorivillä', () => {
        const csv = buildCSV(STANDS);
        expect(csv.startsWith('﻿Kuvio;Pinta-ala (ha);Pääpuulaji;')).toBe(true);
    });

    it('tuottaa rivin per kuvio', () => {
        expect(buildCSV(STANDS).split('\n')).toHaveLength(4);
    });

    it('lainaa kentän, jossa on lainausmerkki', () => {
        expect(buildCSV(STANDS).split('\n')[3]).toContain('"X;""y"""');
    });
});
