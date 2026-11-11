/**
 * Androidin takaisin-painike: suljetaan ensin auki oleva näkymä, ja vasta
 * kun mitään ei ole auki, poistutaan sovelluksesta.
 */

export function backAction({ helpOpen, menuOpen, snap }) {
    if (helpOpen) return 'help';
    if (menuOpen) return 'menu';
    if (snap === 'half' || snap === 'full') return 'peek';
    return 'exit';
}

/**
 * Palauttaa käsittelijän, joka suorittaa takaisin-toiminnon ja palauttaa
 * false, kun sovelluksesta pitää poistua.
 */
export function createBackHandler({ toggleHelp, closeMenu, getSheet, doc = document }) {
    return () => {
        const sheet = getSheet();
        const action = backAction({
            helpOpen: doc.getElementById('help-modal')?.classList.contains('hidden') === false,
            menuOpen: doc.getElementById('sheet-menu')?.hidden === false,
            snap: sheet?.getSnap()
        });
        if (action === 'help') toggleHelp();
        else if (action === 'menu') closeMenu();
        else if (action === 'peek') sheet.setSnap('peek');
        return action !== 'exit';
    };
}
