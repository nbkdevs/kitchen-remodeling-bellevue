// Copies the shared calculator (packages/npm/lib/index.js) into this extension
// and wraps a browser copy for the webview. Run: npm run sync-core
'use strict';
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../npm/lib/index.js'), 'utf8');
fs.writeFileSync(path.join(__dirname, '../lib/core.js'), src);
const browser = `/* kitchen-remodeling-cost (browser build of packages/npm/lib/index.js), MIT */
(function (root) {
  var module = { exports: {} };
${src.replace(/^'use strict';\n/, '')}
  root.KitchenRemodelingCost = module.exports;
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(__dirname, '../media/core.js'), browser);
console.log('synced lib/core.js and media/core.js');
