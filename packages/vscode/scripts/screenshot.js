// Renders the real webview HTML (lib/panel.js + media/*) with VS Code Dark+ theme
// variables in headless Chrome and saves images/screenshot.png.
// Run: npm run screenshot   (needs google-chrome or chromium on PATH, or CHROME=/path)
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const panel = require('../lib/panel');

const root = path.join(__dirname, '..');
const media = (f) => 'file://' + path.join(root, 'media', f);
const theme = `<style>:root{--vscode-font-family:"Segoe UI",system-ui,sans-serif;--vscode-font-size:14px;--vscode-foreground:#cccccc;--vscode-editor-background:#1e1e1e;--vscode-sideBar-background:#252526;--vscode-panel-border:#3c3c3c;--vscode-descriptionForeground:#9d9d9d;--vscode-input-background:#3c3c3c;--vscode-input-foreground:#cccccc;--vscode-input-border:#555;--vscode-button-background:#0e639c;--vscode-button-foreground:#ffffff;--vscode-button-secondaryBackground:#3a3d41;--vscode-button-secondaryForeground:#ffffff;--vscode-errorForeground:#f48771}</style>`;
let html = panel.html({ cspSource: 'file: \'unsafe-inline\'', nonce: 'screenshot', coreUri: media('core.js'), scriptUri: media('panel.js'), styleUri: media('panel.css'), settings: {} });
html = html.replace('</head>', theme + '</head>');
const harness = path.join(root, 'images', 'screenshot-harness.html');
fs.writeFileSync(harness, html);
const out = path.join(root, 'images', 'screenshot.png');
const chrome = process.env.CHROME || ['google-chrome', 'chromium', 'chromium-browser'].find((c) => { try { execFileSync('which', [c]); return true; } catch { return false; } });
execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files', '--window-size=' + (process.env.SIZE || '1280,800'), '--virtual-time-budget=2000', `--screenshot=${out}`, 'file://' + harness], { stdio: 'inherit' });
console.log('wrote', out);
