/**
 * Repo on julkinen: suunnitelmat ja julkaisupolun tiedot kuuluvat yksityiseen
 * repoon trotor/metsainfo-julkaisu (Tero 17.11.2026). CI ajaa testit ennen
 * julkaisua, joten vuoto pysäyttää julkaisun.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

const git = (...args) => {
    try {
        return execFileSync('git', args, { encoding: 'utf8' });
    } catch (e) {
        if (e.status === 1) return ''; // git grep: ei osumia
        throw e;
    }
};

describe('julkinen repo', () => {
    it('ei suunnitelmia eikä julkaisupolun tiedostoja', () => {
        const tracked = git('ls-files', '--', 'docs/plans', 'docs/superpowers', 'docs/kauppa',
            'fastlane/metadata/review_information', '.superpowers');
        expect(tracked.trim()).toBe('');
    });

    it('ei henkilökohtaista sähköpostia eikä oikeaa esimerkkikiinteistöä', () => {
        // Kielletyt merkkijonot paloista, jotta ne eivät ole tässä tiedostossa sellaisenaan
        const kielletyt = [['tero', 'ronkko'].join('\\.'), ['592', '404', '1', '32'].join('-'), '5924040' + '0010032'];
        const hits = git('grep', '-nIE', kielletyt.join('|'), '--', '.');
        expect(hits.trim()).toBe('');
    });
});
