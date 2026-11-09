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

## Mobile
15. Resize browser to ≤768px width → panel moves to bottom
16. Search form accessible, map interactive with touch

## Edge cases
- Zoom out past level 10 → parcels disappear (expected)
- Click area with no forest data → panel shows "Ei metsävaratietoja"
- Search for non-existent parcel → "Kiinteistöä ei löytynyt"
