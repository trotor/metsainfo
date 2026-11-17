/**
 * Huomioiden valokuvat (#37): kamera ja sovelluksen omat kuvatiedostot.
 * Sovelluskoodi ei kutsu plugineja suoraan vaan tätä moduulia.
 *
 * Puhelimessa kameran kuva on väliaikainen tiedosto (uri), joka kopioidaan
 * tallennettaessa sovelluksen tiedostoihin (Directory.Data); kameralla otettu
 * kuva tallentuu lisäksi laitteen kuvagalleriaan. Verkossa kuva valitaan
 * tiedostona ja Filesystem tallentaa sen selaimen IndexedDB:hen.
 */

import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

const OPTIONS = { quality: 80, targetWidth: 1600, targetHeight: 1600, correctOrientation: true, webUseInput: true };
const native = () => Capacitor.isNativePlatform();

const cancelled = (error) => /cancel/i.test(String(error?.message || error));

/** Kameran tai gallerian tulos luonnokseksi: { src (näyttö), source (tallennus) } */
function toDraft(media) {
    if (!media) return null;
    if (native() && media.uri) return { src: media.webPath || Capacitor.convertFileSrc(media.uri), source: { uri: media.uri } };
    if (media.thumbnail) return { src: media.webPath || `data:image/jpeg;base64,${media.thumbnail}`, source: { data: media.thumbnail } };
    return null;
}

/** Ota kuva kameralla (tallentuu myös galleriaan). null, jos käyttäjä perui. */
export async function takePhoto() {
    try {
        return toDraft(await Camera.takePhoto({ ...OPTIONS, saveToGallery: true }));
    } catch (error) {
        if (cancelled(error)) return null;
        throw error;
    }
}

/** Valitse kuva galleriasta. null, jos käyttäjä perui. */
export async function choosePhoto() {
    try {
        const { results } = await Camera.chooseFromGallery({ ...OPTIONS, limit: 1 });
        return toDraft(results?.[0]);
    } catch (error) {
        if (cancelled(error)) return null;
        throw error;
    }
}

/** Luonnoksen kuva sovelluksen tiedostoihin polkuun path. */
export async function writePhoto(path, source) {
    const dir = path.split('/').slice(0, -1).join('/');
    if (source?.uri) {
        await Filesystem.mkdir({ path: dir, directory: Directory.Data, recursive: true }).catch(() => {});
        await Filesystem.copy({ from: source.uri, to: path, toDirectory: Directory.Data });
        return;
    }
    if (!source?.data) throw new Error('Kuvan data puuttuu');
    await Filesystem.writeFile({ path, data: source.data, directory: Directory.Data, recursive: true });
}

/** Tallennetun kuvan osoite <img src>:ksi. */
export async function photoSrc(path) {
    if (native()) {
        const { uri } = await Filesystem.getUri({ path, directory: Directory.Data });
        return Capacitor.convertFileSrc(uri);
    }
    const { data } = await Filesystem.readFile({ path, directory: Directory.Data });
    return typeof data === 'string' ? `data:image/jpeg;base64,${data}` : URL.createObjectURL(data);
}

export async function removePhoto(path) {
    await Filesystem.deleteFile({ path, directory: Directory.Data }).catch(() => {});
}

/** io-olio js/huomiot/kuvat.js:n commitPhotos- ja removeAllPhotos-funktioille. */
export const photoIo = { write: writePhoto, remove: removePhoto };
