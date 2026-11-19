/**
 * Käyttöohje englanniksi (#23). Sama rakenne ja luokat kuin index.html:n
 * suomenkielisessä #help-contentissa, joka pysyy alkuperäisenä. sivu.js
 * vaihtaa tämän paikalleen, kun kieli on englanti.
 *
 * Säilytä: #app-version (initNative täyttää), href="tietosuoja.html"
 * (initNative vaihtaa sovelluksessa julkiseen osoitteeseen) ja näkyvyysluokat
 * web-only, app-only, estimate-only, ios-only, android-only, store-generic.
 * Kun suomenkielistä ohjetta muutetaan, päivitä myös tämä.
 */

export const OHJE_EN = `
                <div class="help-section">
                    <h3>How do I use the app?</h3>
                    <ol>
                        <li><strong>Zoom the map</strong> to the area you want — property boundaries appear as you zoom in.</li>
                        <li><strong>Select a property</strong> on the map or <strong>search by property ID</strong> in the search field.</li>
                        <li>A <strong>summary</strong> of the property's forest data opens in the information panel.</li>
                        <li>Select a stand from the list or on the map to see its <strong>details</strong>. The stand is highlighted on the map.</li>
                    </ol>
                </div>

                <div class="help-section">
                    <h3>Your location</h3>
                    <ul>
                        <li><span class="help-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2 4.5 20.3l.7.7L12 18l6.8 3 .7-.7z" fill="currentColor"/></svg></span>The <strong>location button</strong> (the arrow below the map controls) shows where you are as a blue dot. The first tap centres the map on you, the second shows your direction of travel (if the device has a compass), and the third stops locating.</li>
                        <li>The <strong>You are in</strong> row tells you which stand you are standing in. Tap the row to see the stand's details.</li>
                        <li>If no property is selected, the app automatically selects the property you are on.</li>
                        <li>A grey dot means the location is more than 30 seconds old. Your location is only used on your device.</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3><span class="web-only">On a phone</span><span class="app-only">Information panel</span></h3>
                    <ul>
                        <li>The <strong>information panel</strong> is at the bottom of the screen. Drag or tap its handle to make the panel larger or smaller.</li>
                        <li>The <strong>tabs</strong> Summary, Stands and Proposals keep the information short.</li>
                        <li><strong>Tapping a stand on the map</strong> opens its details in the Stands tab.</li>
                        <li>The <strong>⋯ menu</strong> has <span class="web-only">link copying, CSV download, printing</span><span class="app-only">sharing the link and the CSV file</span> and clearing the selection.</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3>Features</h3>
                    <ul>
                        <li><strong>Property search</strong> — Search by property ID, e.g. 91-416-1-123</li>
                        <li><strong>Forest resources</strong> — Growing stock volume, age, tree species, growth, logs/pulpwood</li>
                        <li><strong>Colour options</strong> — Colour the stands by volume, age, tree species or development class with the colour selector <span class="help-select" aria-hidden="true">Volume (m³/ha) ▾</span> at the bottom of the map</li>
                        <li><strong>Habitats</strong> — Particularly important habitats under the Forest Act (layer selector)</li>
                        <li><strong>Forest use declarations</strong> — Declared felling areas on the map, colour-coded (layer selector)</li>
                        <li><strong>Glossary tooltips</strong> — The (i) icon next to a term shows an explanation</li>
                        <li><strong>CSV file</strong> — <span class="web-only">Download</span><span class="app-only">Share</span> the stand data for a spreadsheet program</li>
                        <li class="web-only"><strong>Printing</strong> — Print the summary on paper</li>
                        <li><strong>Link</strong> — <span class="web-only">Copy</span><span class="app-only">Share</span> a direct link to the property</li>
                    </ul>
                </div>

                <div class="help-section estimate-only">
                    <h3>Timber sale estimate (add-on)</h3>
                    <p>The timber sale estimate shows what the property's proposed fellings are worth at recent stumpage prices in the area. It is indicative only and does not replace an offer from a timber buyer.</p>
                    <h4>Where to find it</h4>
                    <ul>
                        <li><strong>The Value at current prices card in the summary</strong> shows the property's proposed fellings and their timber volume before purchase, and their value in euros after purchase.</li>
                        <li><strong>The Estimate tab</strong> shows the total by year, the value of the whole growing stock and the prices used.</li>
                        <li><strong>Try with an example forest</strong> shows the whole feature free of charge on a fictional property.</li>
                    </ul>
                    <h4>Price and purchase</h4>
                    <ul>
                        <li><strong>One-time purchase, no subscription.</strong> The launch price is €9.99 until 31 January 2027, then €12.99. The current price is shown in the purchase view.</li>
                        <li>One purchase unlocks the estimate for all properties. Stumpage prices are updated at no extra cost.</li>
                        <li>The purchase is paid <span class="ios-only">with your Apple ID through the App Store</span><span class="android-only">with your Google account through Google Play</span><span class="store-generic">through the app store</span>. On a new device or after reinstalling, choose <strong>Restore previous purchase</strong> in the purchase view.</li>
                    </ul>
                    <h4>How the estimate is calculated</h4>
                    <ul>
                        <li><strong>Stumpage prices</strong> come from the Finnish Forest Industries Federation's weekly timber trade monitoring, published in the statistics of Natural Resources Institute Finland (Luke). Missing prices are filled in from the monthly statistics or from nationwide figures.</li>
                        <li><strong>The price region</strong> is determined from the property's municipality. You can change it under Prices (Edit).</li>
                        <li><strong>Timber volumes</strong> come from the Finnish Forest Centre's stand data: logs and pulpwood are divided according to the tree species shares. Other broadleaved trees are priced at birch prices.</li>
                        <li><strong>Fellings:</strong> in a regeneration felling the whole growing stock is sold, in a thinning about 30% and in a first thinning about 35%.</li>
                    </ul>
                    <h4>Your own prices and sharing</h4>
                    <ul>
                        <li>Open Prices and enter a price in the table, for example based on a timber sale offer you have received. Your own prices are highlighted, and <strong>Restore online prices</strong> removes them.</li>
                        <li><strong>Share estimate</strong> creates a table that you can send, for example, to the co-owners of a deceased person's estate.</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3>Map layers</h3>
                    <p><span class="help-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 3 2 8l10 5 10-5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m2 12.5 10 5 10-5M2 16.5l10 5 10-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></span>You can change the background map with the layer selector (top right corner of the map):</p>
                    <ul>
                        <li><strong>Topographic map</strong> — Detailed terrain map (default)</li>
                        <li><strong>Background map</strong> — Simplified base map</li>
                        <li><strong>Aerial photo</strong> — National Land Survey orthophoto</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3>Data sources</h3>
                    <p>The app uses open data directly from the source interfaces:</p>
                    <ul>
                        <li><strong>Forest data:</strong> <a href="https://www.metsakeskus.fi/fi/avoin-metsa-ja-luontotieto" target="_blank">Finnish Forest Centre</a></li>
                        <li><strong>Property boundaries:</strong> <a href="https://www.maanmittauslaitos.fi/" target="_blank">National Land Survey of Finland</a> (INSPIRE WFS)</li>
                        <li><strong>Background maps:</strong> <a href="https://kartat.kapsi.fi/" target="_blank">Kapsi</a> / <a href="https://www.maanmittauslaitos.fi/" target="_blank">National Land Survey of Finland</a></li>
                    </ul>
                </div>

                <div class="help-section web-only">
                    <h3>MCP server (AI integration)</h3>
                    <p>Metsäinfo's data is also available in AI tools through an <a href="https://modelcontextprotocol.io/" target="_blank">MCP server</a>. You can look up forest data directly in a conversation with an AI assistant.</p>
                    <ul>
                        <li><strong>Tool:</strong> <code>hae_metsavaratieto(kiinteistotunnus)</code></li>
                        <li><strong>Example:</strong> <em>"Get the forest data for property 999-1-1-1"</em></li>
                        <li><strong>Compatibility:</strong> Claude Code, Claude Desktop and other MCP-compatible applications</li>
                    </ul>
                    <p>Installation instructions: <a href="https://github.com/trotor/metsainfo" target="_blank">GitHub</a></p>
                </div>

                <div class="help-section">
                    <h3>What's new</h3>
                    <div class="changelog app-only">
                        <div class="changelog-entry">
                            <span class="changelog-version">4.1.0</span>
                            <span class="changelog-date">2026</span>
                            <p>New tools and map layers: stand selection, favourites, Things to note in forestry work, tree height, terrain forms, outdoor sites and stand transparency. New free tools: Tell me about this place and a forest quiz, Search nearby, notes and accessibility. The timber sale estimate purchase now also includes timber value on the map. A short introduction on first launch.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">4.0.2</span>
                            <span class="changelog-date">2026</span>
                            <p>Timber sale estimate: the card shows the property's proposed fellings even before purchase, the purchase view includes an example, the result is shown first, and the guide has its own section on the price and the calculation.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">4.0.1</span>
                            <span class="changelog-date">2026</span>
                            <p>The You are in row shows the full development class on narrow screens too.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">4.0.0</span>
                            <span class="changelog-date">2026</span>
                            <p>Colour-coded info tiles, the timber sale estimate (add-on) and an example forest. The version number is now the same as in the web version.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">1.0</span>
                            <span class="changelog-date">2026</span>
                            <p>First release</p>
                        </div>
                    </div>
                    <div class="changelog web-only">
                        <div class="changelog-entry">
                            <span class="changelog-version">v4.1.0</span>
                            <span class="changelog-date">2026-11-19</span>
                            <p>New tools and map layers: stand selection, favourites, Things to note in forestry work, tree height, terrain forms, outdoor sites and stand transparency. New free tools: Tell me about this place and a forest quiz, Search nearby, notes and accessibility. A short introduction on first launch.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v4.0.2</span>
                            <span class="changelog-date">2026-11-16</span>
                            <p>Getting started with the estimate in the apps is clearer. No changes to the web version.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v4.0.1</span>
                            <span class="changelog-date">2026-11-15</span>
                            <p>The You are in row shows the full development class on narrow screens too.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v4.0.0</span>
                            <span class="changelog-date">2026-11-13</span>
                            <p>Colour-coded info tiles on phones. Same version number as the iOS and Android apps.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v3.3.0</span>
                            <span class="changelog-date">2026-11-10</span>
                            <p>Your location, centring and direction of travel, You are in information</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v3.2.0</span>
                            <span class="changelog-date">2026-11-09</span>
                            <p>Mobile interface: full-screen map, information panel at the bottom, tabs</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v3.1.0</span>
                            <span class="changelog-date">2026-11-09</span>
                            <p>Automatic publishing and unit tests</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v3.0.0</span>
                            <span class="changelog-date">2026-03-05</span>
                            <p>Forest use declarations map layer</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v2.3.0</span>
                            <span class="changelog-date">2026-02-21</span>
                            <p>MCP server documentation</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v2.1.0</span>
                            <span class="changelog-date">2026-02-19</span>
                            <p>User guide (this window)</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v2.0.0</span>
                            <span class="changelog-date">2026-02-19</span>
                            <p>Code split into ES6 modules</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v1.9.0</span>
                            <span class="changelog-date">2026-02-19</span>
                            <p>Nature data layer, glossary tooltips, colour options, print support</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v1.8.0</span>
                            <span class="changelog-date">2026-02-19</span>
                            <p>Link sharing and measurement year indicator</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v1.6.0</span>
                            <span class="changelog-date">2026-01-22</span>
                            <p>EPSG:3067 projection, Finnish background maps</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v1.0.0</span>
                            <span class="changelog-date">2026-01-19</span>
                            <p>First release</p>
                        </div>
                    </div>
                </div>

                <div class="help-section help-footer">
                    <p>Metsäinfo is an educational viewer for open data. The information does not replace an assessment by a forestry professional.</p>
                    <p>Personal forest management recommendations: <a href="https://www.metsaan.fi" target="_blank">metsään.fi</a></p>
                    <p><a href="tietosuoja.html" target="_blank">Privacy policy</a></p>
                    <p class="help-contact web-only">Tero Rönkkö — <a href="mailto:inetoroy@gmail.com">inetoroy@gmail.com</a> — <a href="https://github.com/trotor/metsainfo" target="_blank">GitHub</a></p>
                    <p class="help-contact app-only">Metsäinfo <span id="app-version"></span> — © Inetor Oy — <a href="mailto:inetoroy@gmail.com">inetoroy@gmail.com</a></p>
                </div>
`;
