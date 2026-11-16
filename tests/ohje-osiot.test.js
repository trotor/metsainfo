import { describe, it, expect } from 'vitest';
import { addHelpSection } from '../js/ui/ohje-osiot.js';

describe('ohjeen kokeiluosiot', () => {
    it('lisää osion ennen alatunnistetta, sama id kerran', () => {
        document.body.innerHTML = `<div id="help-content"><div class="help-section">A</div><div class="help-section help-footer">F</div></div>`;
        addHelpSection({ id: 'x', title: 'Otsikko <b>', html: '<p>Teksti</p>' });
        addHelpSection({ id: 'x', title: 'Uusi', html: '<p>Toinen</p>' });
        addHelpSection({ id: 'y', title: 'Y', html: '' });
        const help = document.getElementById('help-content');
        const sections = [...help.children].map(el => el.className);
        expect(sections).toEqual(['help-section', 'help-section help-kokeilut', 'help-section help-kokeilu', 'help-section help-kokeilu', 'help-section help-footer']);
        expect(help.querySelectorAll('[data-osio="x"]')).toHaveLength(1);
        expect(help.querySelector('[data-osio="x"] h3').textContent).toBe('Uusi');
    });

    it('otsikko escapataan', () => {
        document.body.innerHTML = `<div id="help-content"></div>`;
        addHelpSection({ id: 'z', title: '<img>', html: '' });
        expect(document.querySelector('[data-osio="z"] h3').innerHTML).toBe('&lt;img&gt;');
    });
});
