'use strict';
/** Builds the planner webview HTML. Kept free of the VS Code API so it can be rendered for screenshots. */
function html({ cspSource, nonce, coreUri, scriptUri, styleUri, settings }) {
  const s = JSON.stringify(settings || {}).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${styleUri}">
<title>Kitchen Remodeling Cost Planner</title>
</head>
<body>
<header>
  <h1>Kitchen Remodeling Cost Planner</h1>
  <p>Split a remodel budget into line items with sales tax, a contingency reserve and a permit allowance. Everything runs locally.</p>
</header>
<main>
  <section class="card" aria-label="Inputs">
    <div class="tabs" role="tablist">
      <button role="tab" id="tab-split" aria-selected="true" data-mode="split">Split a budget</button>
      <button role="tab" id="tab-estimate" aria-selected="false" data-mode="estimate">Estimate from cost</button>
    </div>
    <label><span id="amount-label">All-in budget (USD)</span><input id="amount" inputmode="decimal" value="60000"></label>
    <div class="grid">
      <label>Sales tax %<input id="tax" inputmode="decimal"></label>
      <label>Contingency %<input id="cont" inputmode="decimal"></label>
      <label>Permits (USD)<input id="permit" inputmode="decimal" value="1500"></label>
    </div>
    <p class="hint">Cost vs Value presets:</p>
    <div class="presets" id="presets"></div>
    <p class="err" id="err" role="alert"></p>
  </section>
  <section class="card" aria-label="Breakdown">
    <div class="total"><span id="total-label">Total</span><strong id="total">$0.00</strong></div>
    <table>
      <thead><tr><th>Line item</th><th>Share</th><th>Amount</th></tr></thead>
      <tbody id="lines"></tbody>
      <tfoot id="foot"></tfoot>
    </table>
    <div class="actions">
      <button id="insert">Insert as Markdown table</button>
      <button id="copy" class="secondary">Copy Markdown</button>
    </div>
  </section>
</main>
<script nonce="${nonce}">window.__PLANNER_SETTINGS__ = ${s};</script>
<script nonce="${nonce}" src="${coreUri}"></script>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

module.exports = { html };
