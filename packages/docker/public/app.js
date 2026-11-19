/* global KitchenRemodelingCost */
(function () {
  var K = KitchenRemodelingCost;
  var $ = function (id) { return document.getElementById(id); };
  var mode = 'split';
  var shares = {};
  var last = null;

  function resetShares() {
    shares = {};
    K.LINE_ITEMS.forEach(function (i) { shares[i.key] = Math.round(i.share * 1000) / 10; });
    var box = $('shares'); box.innerHTML = '';
    K.LINE_ITEMS.forEach(function (i) {
      var l = document.createElement('span'); l.textContent = i.label;
      var inp = document.createElement('input');
      inp.type = 'number'; inp.min = '0'; inp.step = '0.5'; inp.value = shares[i.key];
      inp.setAttribute('aria-label', i.label + ' share');
      inp.addEventListener('input', function () { shares[i.key] = Number(inp.value); render(); });
      box.appendChild(l); box.appendChild(inp);
    });
  }

  function render() {
    $('modeHint').textContent = mode === 'split'
      ? 'Enter your all-in budget. Tax, reserve and permits come out first; the rest is split by line item.'
      : 'Enter a construction cost (or pick a preset). Reserve, tax and permits are added on top.';
    try {
      var o = {
        taxRate: Number($('tax').value) / 100,
        contingencyRate: Number($('cont').value) / 100,
        permit: Number($('permit').value),
        shares: shares,
      };
      var amt = Number($('amount').value);
      last = mode === 'split' ? K.splitBudget(amt, o) : K.estimate(amt, o);
      $('err').textContent = '';
    } catch (e) { $('err').textContent = e.message; return; }
    var r = last;
    $('total').textContent = K.money(r.total);
    var max = Math.max.apply(null, r.lines.map(function (l) { return l.amount; })) || 1;
    $('table').tBodies[0].innerHTML = r.lines.map(function (l) {
      return '<tr><td>' + l.label + '<div class="bar" style="width:' + (l.amount / max * 100).toFixed(1) + '%"></div></td><td>' +
        (l.share * 100).toFixed(1) + '%</td><td>' + K.money(l.amount) + '</td></tr>';
    }).join('');
    $('table').tFoot.innerHTML = [
      ['Construction subtotal', r.construction],
      ['Contingency reserve (' + +(r.contingencyRate * 100).toFixed(2) + '%)', r.contingency],
      ['Sales tax (' + +(r.taxRate * 100).toFixed(2) + '%)', r.tax],
      ['Permit allowance', r.permit],
      ['Total', r.total],
    ].map(function (x) { return '<tr><td>' + x[0] + '</td><td></td><td>' + K.money(x[1]) + '</td></tr>'; }).join('');
  }

  document.querySelectorAll('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.mode;
      document.querySelectorAll('.tabs button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      render();
    });
  });
  Object.keys(K.PRESETS).forEach(function (key) {
    var p = K.PRESETS[key];
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = p.label + ' · ' + K.money(p.construction).replace('.00', '');
    b.addEventListener('click', function () {
      mode = 'estimate';
      document.querySelectorAll('.tabs button').forEach(function (x) { x.setAttribute('aria-selected', String(x.dataset.mode === 'estimate')); });
      $('amount').value = p.construction; $('permit').value = p.permit; render();
    });
    $('presets').appendChild(b);
  });
  ['amount', 'tax', 'cont', 'permit'].forEach(function (id) { $(id).addEventListener('input', render); });
  $('resetShares').addEventListener('click', function () { resetShares(); render(); });
  $('copy').addEventListener('click', function () {
    if (!last) return;
    var rows = [['Line item', 'Share', 'Amount']].concat(last.lines.map(function (l) { return [l.label, (l.share * 100).toFixed(1) + '%', l.amount.toFixed(2)]; }));
    rows.push(['Construction subtotal', '', last.construction.toFixed(2)], ['Contingency reserve', '', last.contingency.toFixed(2)],
      ['Sales tax', '', last.tax.toFixed(2)], ['Permit allowance', '', last.permit.toFixed(2)], ['Total', '', last.total.toFixed(2)]);
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    navigator.clipboard.writeText(csv).then(function () { $('copy').textContent = 'Copied'; setTimeout(function () { $('copy').textContent = 'Copy as CSV'; }, 1500); });
  });
  resetShares();
  render();
})();
