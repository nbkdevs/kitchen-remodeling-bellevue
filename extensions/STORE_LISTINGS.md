# Store listing kit: Cabinet & Countertop Measure (extension) and Walnut Morning (theme)

These are manual uploads. The extension has no keyword, no brand and no link to the website on purpose. Keep it that way in every store field.

## Extension: Cabinet & Countertop Measure 1.0.0

Packages:
- Edge: `extensions/dist/cabinet-countertop-measure-edge-1.0.0.zip`
- Firefox: `extensions/dist/cabinet-countertop-measure-firefox-1.0.0.zip`

Rebuild either one with `python3 extensions/package.py`.

Graphics:
- Icon: `store-graphics/extension-icon-128.png`
- Edge logo: `store-graphics/edge-logo-300x300.png`
- Small promo tile: `store-graphics/extension-promo-440x280.png`
- Screenshots: `store-graphics/extension-screenshot-{1-counter,2-splash,3-cab}-1280x800.png`, with 640x400 copies

**Name:** Cabinet & Countertop Measure

**Summary (Edge max 250 / AMO max 250):**
Countertop square footage with sink and cooktop cutouts, backsplash tile counts with waste, and cabinet runs in standard widths. Works offline with no permissions.

**Description:**
A pocket measuring sheet for kitchen projects, right in the toolbar.

• Countertops: add runs in inches or centimetres, subtract sink and cooktop cutouts, and get the square footage and slab estimate with overhang.
• Backsplash: wall area minus windows and outlets, tile count for any tile size, plus a waste factor.
• Cabinet runs: fill a wall length with standard 3-inch-step cabinet widths and see the filler you need.

Everything runs inside the popup. There is no network access, no tracking and no permissions, and your last inputs are kept only in the popup's local storage.

**Category:** Productivity (AMO: Other / Productivity)

**Support / homepage:** https://github.com/nbkdevs/kitchen-remodeling-bellevue (source repository; not the website)

**Privacy:** The extension collects no data. AMO data collection is set to `none`.

**Permission justification:** None requested. No host permissions and no remote code.

**AMO notes:** The source in the zip is plain, unminified JS. `web-ext lint` gives 0 errors and 2 warnings (strict_min_version 109 is below 140, where data_collection_permissions arrived). These warnings are safe to ignore.

## Chrome Web Store theme: Walnut Morning 1.0.0

- Package: `themes/dist/walnut-morning-chrome-theme-1.0.0.zip`
- Graphics:
  - Icon: `store-graphics/cws-theme-icon-128.png`
  - Screenshots: `store-graphics/cws-theme-screenshot-1280x800.png` (and 640x400)
  - Small promo: `store-graphics/cws-theme-promo-440x280.png`
- **Name:** Walnut Morning
- **Summary:** A warm wood theme: a walnut frame, a soft cream toolbar and a sunlit countertop on every new tab.
- **Description:** Walnut Morning dresses Chrome in warm kitchen tones. It has a deep walnut window frame, cream tabs and toolbar, and a calm morning-light countertop photo on the new tab page. Easy on the eyes for long days.
- **Category:** Themes > Nature/Light
- **Homepage URL (theme listing field):** https://wakitchenremodelingbellevue.com/
- **Privacy:** A theme has no code and collects nothing.
