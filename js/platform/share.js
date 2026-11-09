/**
 * Jakaminen sovelluksessa: iOS:n jakonäkymä (Share-plugin). WKWebView ei
 * tue <a download> -latausta, joten CSV kirjoitetaan välimuistihakemistoon
 * ja jaetaan tiedostona.
 */

import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

function ignoreCancel(error) {
    // Käyttäjä sulki jakonäkymän: ei virhe
    if (/cancel/i.test(String(error?.message || error))) return;
    throw error;
}

export async function shareLink({ title, url }) {
    try {
        await Share.share({ title, url, dialogTitle: title });
    } catch (error) {
        ignoreCancel(error);
    }
}

export async function shareTextFile(fileName, content) {
    const { uri } = await Filesystem.writeFile({
        path: fileName,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
    });
    try {
        await Share.share({ title: fileName, files: [uri] });
    } catch (error) {
        ignoreCancel(error);
    }
}
