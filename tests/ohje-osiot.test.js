import { describe, it, expect } from 'vitest';
import { addHelpSection } from '../js/ui/ohje-osiot.js';

describe('ohjeen lisätoimintojen osiot', () => {
    it('lisää osion ennen alatunnistetta, sama id kerran', () => {
        document.body.innerHTML = `<div id="help-content"><div class="help-section">A</div><div class="help-section help-footer">F</div></div>`;
        addHelpSection({ id: 'x', title: 'Otsikko <b>', html: '<p>Teksti</p>', kokeilu: true });
        addHelpSection({ id: 'x', title: 'Uusi', html: '<p>Toinen</p>', kokeilu: true });
        addHelpSection({ id: 'y', title: 'Y', html: '', kokeilu: true });
        addHelpSection({ id: 'j', title: 'Julkaistu', html: '' });
        addHelpSection({ id: 'j', title: 'Julkaistu 2', html: '' });
        const help = document.getElementById('help-content');
        const sections = [...help.children].map(el => el.className);
        expect(sections).toEqual(['help-section', 'help-section help-toiminto', 'help-section help-kokeilut', 'help-section help-kokeilu', 'help-section help-kokeilu', 'help-section help-footer']);
        expect(help.querySelector('[data-osio="j"] h3').textContent).toBe('Julkaistu 2');
        expect(help.querySelectorAll('[data-osio="x"]')).toHaveLength(1);
        expect(help.querySelector('[data-osio="x"] h3').textContent).toBe('Uusi');
    });

    it('otsikko escapataan', () => {
        document.body.innerHTML = `<div id="help-content"></div>`;
        addHelpSection({ id: 'z', title: '<img>', html: '' });
        addHelpSection({ id: 'k', title: '<img>', html: '', kokeilu: true });
        expect(document.querySelector('[data-osio="k"] h3').innerHTML).toBe('&lt;img&gt;');
        expect(document.querySelector('[data-osio="z"] h3').innerHTML).toBe('&lt;img&gt;');
    });
});
