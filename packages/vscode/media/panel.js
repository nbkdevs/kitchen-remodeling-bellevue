/* Planner webview script. Uses window.KitchenRemodelingCost (media/core.js). No network access. */
(function () {
  'use strict';
  var K = window.KitchenRemodelingCost;
  var vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : { postMessage: function () {}, getState: function () {}, setState: function () {} };
  var cfg = window.__PLANNER_SETTINGS__ || {};
  var $ = function (id) { return document.getElementById(id); };
  var mode = 'split';
  var preset = null;
  var last = null;

  $('tax').value = +(((cfg.taxRate != null ? cfg.taxRate : K.DEFAULT_TAX_RATE) * 100).toFixed(2));
  $('cont').value = +(((cfg.contingencyRate != null ? cfg.contingencyRate : K.DEFAULT_CONTINGENCY_RATE) * 100).toFixed(2));

  var st = vscode.getState && vscode.getState();
  if (st) { mode = st.mode || mode; ['amount', 'tax', 'cont', 'permit'].forEach(function (k) { if (st[k] != null) $(k).value = st[k]; }); }

  Object.keys(K.PRESETS).forEach(function (name) {
    var b = document.createElement('button');
    b.textContent = K.PRESETS[name].label;
    b.addEventListener('click', function () {
      preset = name; mode = 'estimate';
      $('amount').value = K.PRESETS[name].construction;
      $('permit').value = K.PRESETS[name].permit;
      setTabs(); render();
    });
    $('presets').appendChild(b);
  });

  function num(id) { var v = parseFloat(String($(id).value).replace(/[$,\s%]/g, '')); return isFinite(v) ? v : NaN; }
  function setTabs() {
    ['split', 'estimate'].forEach(function (m) { $('tab-' + m).setAttribute('aria-selected', String(m === mode)); });
    $('amount-label').textContent = mode === 'split' ? 'All-in budget (USD)' : 'Construction cost before tax (USD)';
  }
  function inputs() {
    return { mode: mode, amount: num('amount'), taxRate: num('tax') / 100, contingencyRate: num('cont') / 100, permit: num('permit') || 0, preset: preset };
  }
  function row(cells, tag) {
    var tr = document.createElement('tr');
    cells.forEach(function (c) { var td = document.createElement(tag || 'td'); if (c instanceof Node) td.appendChild(c); else td.textContent = c; tr.appendChild(td); });
    return tr;
  }
  function render() {
    var i = inputs();
    vscode.setState && vscode.setState({ mode: mode, amount: $('amount').value, tax: $('tax').value, cont: $('cont').value, permit: $('permit').value });
    try {
      var o = { taxRate: i.taxRate, contingencyRate: i.contingencyRate, permit: i.permit };
      var r = i.mode === 'split' ? K.splitBudget(i.amount, o) : K.estimate(i.amount, o);
      last = i; $('err').textContent = '';
      $('total').textContent = K.money(r.total);
      $('total-label').textContent = i.mode === 'split' ? 'All-in total' : 'Estimated total';
      var tb = $('lines'); tb.textContent = '';
      r.lines.forEach(function (l) {
        var lab = document.createElement('div'); lab.textContent = l.label;
        var bar = document.createElement('div'); bar.className = 'bar'; bar.style.width = Math.round(l.share * 400) + '%';
        lab.appendChild(bar);
        tb.appendChild(row([lab, (l.share * 100).toFixed(1) + '%', K.money(l.amount)]));
      });
      var f = $('foot'); f.textContent = '';
      f.appendChild(row(['Construction subtotal', '', K.money(r.construction)]));
      f.appendChild(row(['Contingency (' + +(r.contingencyRate * 100).toFixed(2) + '%)', '', K.money(r.contingency)]));
      f.appendChild(row(['Sales tax (' + +(r.taxRate * 100).toFixed(2) + '%)', '', K.money(r.tax)]));
      f.appendChild(row(['Permits', '', K.money(r.permit)]));
    } catch (e) { last = null; $('err').textContent = e.message; }
  }
  document.querySelectorAll('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () { mode = b.getAttribute('data-mode'); preset = null; setTabs(); render(); });
  });
  ['amount', 'tax', 'cont', 'permit'].forEach(function (id) { $(id).addEventListener('input', function () { preset = null; render(); }); });
  $('insert').addEventListener('click', function () { if (last) vscode.postMessage({ type: 'insert', inputs: last }); });
  $('copy').addEventListener('click', function () { if (last) vscode.postMessage({ type: 'copy', inputs: last }); });
  setTabs(); render();
})();
