/**
 * Asettaa Leafletin ja proj4:n globaaleiksi.
 *
 * Sovelluskoodi (config.js, utils.js, ui.js, app.js) käyttää tunnisteita
 * `L` ja `proj4` globaaleina, kuten CDN-latauksen aikaan. Tämä moduuli
 * tarjoaa ne npm-paketeista.
 *
 * ÄLÄ tuo Proj4Leafletia tässä tiedostossa — ks. index.js.
 */
import L from 'leaflet';
import proj4 from 'proj4';
import 'leaflet/dist/leaflet.css';

window.L = L;
window.proj4 = proj4;
