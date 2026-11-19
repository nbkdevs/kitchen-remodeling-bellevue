# Notes for certification: Cabinet & Countertop Measure

- The extension is a popup-only calculator (manifest v3) with no permissions, host permissions, background worker or content scripts.
- No network requests and no remote code. All logic is in `js/measure.js` and `js/app.js`, which are unminified.
- localStorage is used only to remember the user's last inputs inside the popup.
- To test: click the toolbar icon.
  - On the Countertop tab, enter a 120 x 25.5 in run with one 33 x 22 in sink cutout. The popup shows the square footage.
  - Switch to the Backsplash and Cabinets tabs to try the other calculators.
- No account or test credentials are needed.
