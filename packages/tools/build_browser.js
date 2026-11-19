// Wraps packages/npm/lib/index.js as a browser global (window.KitchenRemodelingCost)
// for the HF Space and the Docker page. Run: node packages/tools/build_browser.js
'use strict';
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../npm/lib/index.js'), 'utf8');
const out = `/* kitchen-remodeling-cost 1.0.0 (browser build of packages/npm/lib/index.js), MIT */
(function (root) {
  var module = { exports: {} };
${src.replace(/^'use strict';\n/, '')}
  root.KitchenRemodelingCost = module.exports;
})(typeof window !== 'undefined' ? window : globalThis);
`;
for (const dest of ['../hf-space/planner.js', '../docker/public/planner.js']) {
  fs.writeFileSync(path.join(__dirname, dest), out);
}
console.log('wrote planner.js to hf-space and docker/public');
