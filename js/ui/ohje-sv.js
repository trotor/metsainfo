/**
 * Käyttöohje ruotsiksi (#23). Sama rakenne ja luokat kuin index.html:n
 * suomenkielisessä #help-contentissa ja ohje-en.js:ssä. sivu.js vaihtaa
 * tämän paikalleen, kun kieli on ruotsi.
 *
 * Säilytä: #app-version (initNative täyttää), href="tietosuoja.html"
 * (initNative vaihtaa sovelluksessa julkiseen osoitteeseen) ja näkyvyysluokat
 * web-only, app-only, estimate-only, ios-only, android-only, store-generic.
 * Kun suomenkielistä ohjetta muutetaan, päivitä myös tämä.
 */

export const OHJE_SV = `
                <div class="help-section">
                    <h3>Hur använder jag appen?</h3>
                    <ol>
                        <li><strong>Zooma kartan</strong> till det område du vill — fastighetsgränserna syns när du zoomar in.</li>
                        <li><strong>Välj en fastighet</strong> på kartan eller <strong>sök med fastighetsbeteckning</strong> i sökfältet.</li>
                        <li>Ett <strong>sammandrag</strong> av fastighetens skogsdata öppnas i informationspanelen.</li>
                        <li>Välj en figur i listan eller på kartan för att se <strong>detaljerna</strong>. Figuren markeras på kartan.</li>
                    </ol>
                </div>

                <div class="help-section">
                    <h3>Din position</h3>
                    <ul>
                        <li><span class="help-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2 4.5 20.3l.7.7L12 18l6.8 3 .7-.7z" fill="currentColor"/></svg></span><strong>Positionsknappen</strong> (pilen under kartkontrollerna) visar var du är som en blå punkt. Första trycket centrerar kartan på dig, det andra visar färdriktningen (om enheten har kompass) och det tredje avslutar positioneringen.</li>
                        <li>Raden <strong>Du är i</strong> berättar vilken figur du står på. Tryck på raden för att se figurens uppgifter.</li>
                        <li>Om ingen fastighet är vald väljer appen automatiskt den fastighet där du befinner dig.</li>
                        <li>En grå punkt betyder att positionen är över 30 sekunder gammal. Positionen används bara på din enhet.</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3><span class="web-only">På telefonen</span><span class="app-only">Informationspanelen</span></h3>
                    <ul>
                        <li><strong>Informationspanelen</strong> finns längst ner på skärmen. Dra i handtaget eller tryck på det, så blir panelen större eller mindre.</li>
                        <li><strong>Flikarna</strong> Sammandrag, Figurer och Förslag håller uppgifterna korta.</li>
                        <li><strong>Tryck på en figur på kartan</strong> så öppnas dess uppgifter på fliken Figurer.</li>
                        <li>I <strong>⋯-menyn</strong> finns <span class="web-only">kopiering av länk, nedladdning av CSV, utskrift</span><span class="app-only">delning av länk och CSV-fil</span> och borttagning av valet.</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3>Funktioner</h3>
                    <ul>
                        <li><strong>Fastighetssökning</strong> — Sök med beteckning, t.ex. 91-416-1-123</li>
                        <li><strong>Skogstillgångar</strong> — Trädbeståndets virkesförråd, ålder, trädslag, tillväxt, stockvirke/massaved</li>
                        <li><strong>Färgalternativ</strong> — Färglägg figurerna enligt virkesförråd, ålder, trädslag eller utvecklingsklass med färgväljaren <span class="help-select" aria-hidden="true">Virkesförråd (m³/ha) ▾</span> nertill på kartan</li>
                        <li><strong>Naturobjekt</strong> — Särskilt viktiga livsmiljöer enligt skogslagen (lagerväljaren)</li>
                        <li><strong>Anmälningar om användning av skog</strong> — Anmälda avverkningsområden på kartan, färgkodade (lagerväljaren)</li>
                        <li><strong>Ordlista i verktygstips</strong> — Ikonen (i) bredvid en term visar en förklaring</li>
                        <li><strong>CSV-fil</strong> — <span class="web-only">Ladda ner</span><span class="app-only">Dela</span> figuruppgifterna till ett kalkylprogram</li>
                        <li class="web-only"><strong>Utskrift</strong> — Skriv ut sammandraget på papper</li>
                        <li><strong>Länk</strong> — <span class="web-only">Kopiera</span><span class="app-only">Dela</span> en direktlänk till fastigheten</li>
                    </ul>
                </div>

                <div class="help-section estimate-only">
                    <h3>Prisuppskattning (tillägg)</h3>
                    <p>Prisuppskattningen visar hur mycket fastighetens föreslagna avverkningar är värda till färska rotpriser i området. Den är riktgivande och ersätter inte ett anbud på virkesaffär.</p>
                    <h4>Var hittar du den</h4>
                    <ul>
                        <li><strong>Kortet Värde till aktuella priser i sammandraget</strong> visar före köpet fastighetens avverkningsförslag och deras virkesmängd, efter köpet värdet i euro.</li>
                        <li><strong>På fliken Uppskattning</strong> finns summan per år, hela trädbeståndets värde och de priser som används.</li>
                        <li><strong>Prova med en exempelskog</strong> visar hela funktionen gratis på en fiktiv fastighet.</li>
                    </ul>
                    <h4>Pris och köp</h4>
                    <ul>
                        <li><strong>Engångsköp, ingen prenumeration.</strong> Introduktionspriset är 9,99 € till 31.1.2027, därefter 12,99 €. Det aktuella priset visas i köpvyn.</li>
                        <li>Ett köp låser upp prisuppskattningen för alla fastigheter. Rotpriserna uppdateras utan extra avgift.</li>
                        <li>Köpet betalas <span class="ios-only">med ditt Apple-ID via App Store</span><span class="android-only">med ditt Google-konto via Google Play</span><span class="store-generic">via appbutiken</span>. På en ny enhet eller efter ominstallation väljer du <strong>Återställ tidigare köp</strong> i köpvyn.</li>
                    </ul>
                    <h4>Så räknas uppskattningen ut</h4>
                    <ul>
                        <li><strong>Rotpriserna</strong> kommer från Skogsindustrin rf:s veckouppföljning av virkeshandeln i Naturresursinstitutets statistik. Priser som saknas kompletteras från månadsstatistiken eller med siffror för hela landet.</li>
                        <li><strong>Prisområdet</strong> bestäms utifrån fastighetens kommun. Du kan byta det under Priser (Redigera).</li>
                        <li><strong>Virkesmängden</strong> kommer från Skogscentralens figuruppgifter: stockvirke och massaved fördelas enligt trädslagsandelarna. Övriga lövträd prissätts med björkpriser.</li>
                        <li><strong>Avverkningar:</strong> vid förnyelseavverkning säljs hela trädbeståndet, vid gallring cirka 30 % och vid första gallring cirka 35 %.</li>
                    </ul>
                    <h4>Egna priser och delning</h4>
                    <ul>
                        <li>Öppna Priser och skriv in ett pris i tabellen, till exempel enligt ett anbud på virkesaffär som du har fått. Egna priser markeras, och <strong>Återställ priserna från nätet</strong> tar bort dem.</li>
                        <li><strong>Dela uppskattningen</strong> skapar en tabell som du kan skicka till exempel till delägarna i ett dödsbo.</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3>Kartlager</h3>
                    <p><span class="help-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 3 2 8l10 5 10-5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m2 12.5 10 5 10-5M2 16.5l10 5 10-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></span>Med lagerväljaren (kartans övre högra hörn) kan du byta bakgrundskarta:</p>
                    <ul>
                        <li><strong>Grundkarta</strong> — Detaljerad terrängkarta (standard)</li>
                        <li><strong>Bakgrundskarta</strong> — Förenklad baskarta</li>
                        <li><strong>Flygbild</strong> — Lantmäteriverkets flygbild (ortofoto)</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3>Datakällor</h3>
                    <p>Appen använder öppna data direkt från gränssnitten:</p>
                    <ul>
                        <li><strong>Skogsdata:</strong> <a href="https://www.metsakeskus.fi/fi/avoin-metsa-ja-luontotieto" target="_blank">Skogscentralen</a></li>
                        <li><strong>Fastighetsgränser:</strong> <a href="https://www.maanmittauslaitos.fi/" target="_blank">Lantmäteriverket</a> (INSPIRE WFS)</li>
                        <li><strong>Bakgrundskartor:</strong> <a href="https://kartat.kapsi.fi/" target="_blank">Kapsi</a> / <a href="https://www.maanmittauslaitos.fi/" target="_blank">LMV</a></li>
                    </ul>
                </div>

                <div class="help-section web-only">
                    <h3>MCP-server (AI-integration)</h3>
                    <p>Metsäinfos uppgifter finns också i AI-verktyg via en <a href="https://modelcontextprotocol.io/" target="_blank">MCP-server</a>. Du kan söka skogsdata direkt i en konversation med en AI-assistent.</p>
                    <ul>
                        <li><strong>Verktyg:</strong> <code>hae_metsavaratieto(kiinteistotunnus)</code></li>
                        <li><strong>Exempel:</strong> <em>"Hämta skogsdata för fastigheten 999-1-1-1"</em></li>
                        <li><strong>Kompatibilitet:</strong> Claude Code, Claude Desktop och andra MCP-kompatibla appar</li>
                    </ul>
                    <p>Installationsanvisningar: <a href="https://github.com/trotor/metsainfo" target="_blank">GitHub</a></p>
                </div>

                <div class="help-section">
                    <h3>Nytt i versionen</h3>
                    <div class="changelog app-only">
                        <div class="changelog-entry">
                            <span class="changelog-version">4.0.2</span>
                            <span class="changelog-date">2026</span>
                            <p>Prisuppskattning: kortet visar fastighetens avverkningsförslag redan före köpet, köpvyn har ett exempel, resultatet visas först och bruksanvisningen har ett eget avsnitt om priset och beräkningen.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">4.0.1</span>
                            <span class="changelog-date">2026</span>
                            <p>Raden Du är i visar utvecklingsklassen i sin helhet även på smala skärmar.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">4.0.0</span>
                            <span class="changelog-date">2026</span>
                            <p>Färgkodade informationsrutor, prisuppskattning för virkesaffär (tillägg) och en exempelskog. Versionsnumret är nu detsamma som i webbversionen.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">1.0</span>
                            <span class="changelog-date">2026</span>
                            <p>Första versionen</p>
                        </div>
                    </div>
                    <div class="changelog web-only">
                        <div class="changelog-entry">
                            <span class="changelog-version">v4.0.2</span>
                            <span class="changelog-date">2026-11-16</span>
                            <p>Ibruktagningen av prisuppskattningen i apparna har gjorts tydligare. Inga ändringar i webbversionen.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v4.0.1</span>
                            <span class="changelog-date">2026-11-15</span>
                            <p>Raden Du är i visar utvecklingsklassen i sin helhet även på smala skärmar.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v4.0.0</span>
                            <span class="changelog-date">2026-11-13</span>
                            <p>Färgkodade informationsrutor på telefonen. Samma versionsnummer som i iOS- och Android-apparna.</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v3.3.0</span>
                            <span class="changelog-date">2026-11-10</span>
                            <p>Din position, centrering och färdriktning, uppgiften Du är i</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v3.2.0</span>
                            <span class="changelog-date">2026-11-09</span>
                            <p>Mobilt gränssnitt: karta i helskärm, informationspanel längst ner, flikar</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v3.1.0</span>
                            <span class="changelog-date">2026-11-09</span>
                            <p>Automatisk publicering och enhetstester</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v3.0.0</span>
                            <span class="changelog-date">2026-03-05</span>
                            <p>Kartlager för anmälningar om användning av skog</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v2.3.0</span>
                            <span class="changelog-date">2026-02-21</span>
                            <p>Dokumentation av MCP-servern</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v2.1.0</span>
                            <span class="changelog-date">2026-02-19</span>
                            <p>Bruksanvisning (det här fönstret)</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v2.0.0</span>
                            <span class="changelog-date">2026-02-19</span>
                            <p>Koden uppdelad i ES6-moduler</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v1.9.0</span>
                            <span class="changelog-date">2026-02-19</span>
                            <p>Lager för naturdata, ordlista i verktygstips, färgalternativ, stöd för utskrift</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v1.8.0</span>
                            <span class="changelog-date">2026-02-19</span>
                            <p>Delning av länk och indikator för mätåret</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v1.6.0</span>
                            <span class="changelog-date">2026-01-22</span>
                            <p>Projektionen EPSG:3067, finländska bakgrundskartor</p>
                        </div>
                        <div class="changelog-entry">
                            <span class="changelog-version">v1.0.0</span>
                            <span class="changelog-date">2026-01-19</span>
                            <p>Första versionen</p>
                        </div>
                    </div>
                </div>

                <div class="help-section help-footer">
                    <p>Metsäinfo är en pedagogisk visningsapp för öppna data. Uppgifterna ersätter inte en bedömning av en skogsexpert.</p>
                    <p>Personliga skötselrekommendationer: <a href="https://www.metsaan.fi" target="_blank">metsään.fi</a></p>
                    <p><a href="tietosuoja.html" target="_blank">Dataskyddsbeskrivning</a></p>
                    <p class="help-contact web-only">Tero Rönkkö — <a href="mailto:inetoroy@gmail.com">inetoroy@gmail.com</a> — <a href="https://github.com/trotor/metsainfo" target="_blank">GitHub</a></p>
                    <p class="help-contact app-only">Metsäinfo <span id="app-version"></span> — © Inetor Oy — <a href="mailto:inetoroy@gmail.com">inetoroy@gmail.com</a></p>
                </div>
`;
