/**
 * Vendor-kirjastojen latausjärjestys.
 *
 * Proj4Leaflet on laajennus, joka odottaa Leafletin ja proj4:n olevan
 * saatavilla, ja liittää `L.Proj`-nimiavaruuden. ES-moduulien tuonnit
 * evaluoidaan syvyyssuunnassa tuontijärjestyksessä, joten globals.js
 * ajetaan kokonaan ennen proj4leafletia.
 *
 * Tämän moduulin on oltava app.js:n ENSIMMÄINEN tuonti, koska
 * js/config.js kutsuu proj4.defs() ja new L.Proj.CRS() latausaikana.
 */
import './globals.js';
import 'proj4leaflet';
