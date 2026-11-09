---
name: manuaalinen-testaus
description: Manual verification checklist for Metsäinfo — basic flow, cadastral search, stand interaction, CSV export, mobile layout, and edge cases. UI has no automated tests (only `npm test` for pure logic), so use this whenever verifying a change before commit or release.
---

# Testing

Run `npm test` for logic. UI has no automated tests — verify it manually:

## Basic flow
1. Start server: `npm run dev`
2. Open http://localhost:5173
3. Map loads, centered on Suolahti area
4. Zoom in → parcel boundaries appear (zoom ≥10)
5. Click a parcel → side panel shows statistics, stands appear on map with green coloring

## Search
6. Enter a cadastral reference in search box (format: `91-416-1-123`)
7. Map zooms to parcel, statistics load in side panel
8. Try invalid input → error message appears

## Stand interaction
9. Click a stand header in the list → stand expands, highlights on map
10. Click a cutting recommendation → matching stands highlight in orange
11. Click another stand → previous highlight clears

## CSV export
12. With a parcel selected, click "Lataa CSV"
13. File downloads, opens in Excel with correct Finnish characters (ääkköset)
14. Semicolon-delimited, comma as decimal separator

## Mobile (390×844, and 844×390 with touch)
15. Header and footer hidden, map fills the screen, search bar always visible at top
16. Search input font is 16 px (iOS does not zoom), buttons ≥ 44×44 px
17. Select a parcel → bottom sheet opens in peek: parcel id + four key figures, parcel visible above the sheet
18. Tap the handle → peek → half → full → peek; dragging the handle snaps to the nearest stop; search bar stays visible in full
19. Tabs Yhteenveto / Kuviot (N) / Ehdotukset; a new search returns to Yhteenveto and peek
20. Tap a stand on the map → no popup, sheet rises to half, Kuviot tab opens with that stand expanded and highlighted above the sheet
21. Tap an (i) icon → explanation opens as a line under the term, one at a time, tap again closes
22. ⋯ menu: Kopioi linkki, Lataa CSV, Tulosta, Poista valinta (clears map + URL)
23. Colour selector and legend sit above the sheet and move with it; Leaflet attribution visible above the sheet; MKI controls appear in the same strip
24. Right column: one layer control, zoom below it, nothing under the search bar
25. Print preview on phone prints all tabs including the parcel id
26. On a real iPhone: safe-area (notch, home indicator), handle drag, keyboard in the search field

## Desktop regression (1280×800)
27. Panel at left (x 10, y 70, width 420), header and footer visible, one layer control top right, stand click opens a Leaflet popup, (i) tooltips open on hover

## Edge cases
- Zoom out past level 10 → parcels disappear (expected)
- Click area with no forest data → panel shows "Ei metsävaratietoja"
- Search for non-existent parcel → "Kiinteistöä ei löytynyt"
