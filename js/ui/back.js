/**
 * Androidin takaisin-painike: suljetaan ensin auki oleva näkymä, ja vasta
 * kun mitään ei ole auki, poistutaan sovelluksesta.
 */

export function backAction({ helpOpen, menuOpen, snap, hidden = false }) {
    if (helpOpen) return 'help';
    if (menuOpen) return 'menu';
    if (!hidden && (snap === 'half' || snap === 'full')) return 'peek';
    return 'exit';
}

/**
 * Palauttaa käsittelijän, joka suorittaa takaisin-toiminnon ja palauttaa
 * false, kun sovelluksesta pitää poistua.
 */
export function createBackHandler({ toggleHelp, closeMenu, getSheet, doc = document }) {
    return () => {
        // Hinta-arvion ostonäkymä ja esimerkkimetsä ovat päällimmäisinä
        for (const id of ['paywall', 'demo-view']) {
            const overlay = doc.getElementById(id);
            if (overlay) {
                overlay.remove();
                return true;
            }
        }
        const sheet = getSheet();
        const action = backAction({
            helpOpen: doc.getElementById('help-modal')?.classList.contains('hidden') === false,
            menuOpen: doc.getElementById('sheet-menu')?.hidden === false,
            snap: sheet?.getSnap(),
            hidden: doc.getElementById('info-panel')?.classList.contains('hidden') === true
        });
        if (action === 'help') toggleHelp();
        else if (action === 'menu') closeMenu();
        else if (action === 'peek') sheet.setSnap('peek');
        return action !== 'exit';
    };
}
