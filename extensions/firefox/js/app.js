/* global Measure */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'ccm-state-v1';
  var defaults = {
    unit: 'in', tab: 'counter',
    pieces: [['120', '25.5'], ['72', '25.5']], cutouts: [['33', '22']],
    walls: [['120', '18']]
  };
  var st;
  try { st = Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { st = Object.assign({}, defaults); }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage off */ } }
  function L(v) { return Measure.parseLength(v, st.unit); }
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  function area(a) {
    return st.unit === 'cm'
      ? Measure.fmt(a.sqm, 2) + ' m² (' + Measure.fmt(a.sqft, 1) + ' sq ft)'
      : Measure.fmt(a.sqft, 2) + ' sq ft (' + Measure.fmt(a.sqm, 2) + ' m²)';
  }
  function len(inches) {
    return st.unit === 'cm' ? Measure.fmt(inches * Measure.CM_PER_IN, 1) + ' cm' : Measure.fmt(inches, 2) + ' in';
  }
  function table(rows) {
    var t = el('table');
    rows.forEach(function (r) { var tr = el('tr'); tr.appendChild(el('td', null, r[0])); tr.appendChild(el('td', null, r[1])); t.appendChild(tr); });
    return t;
  }
  function show(box, nodes) { box.textContent = ''; nodes.forEach(function (n) { box.appendChild(n); }); }
  function err(box, msg) { show(box, [el('div', { class: 'err' }, msg)]); }

  var labels = { pieces: ['Length', 'Depth'], cutouts: ['Length', 'Depth'], walls: ['Length', 'Height'] };
  function drawRows(name) {
    var box = $(name); box.textContent = '';
    st[name].forEach(function (pair, i) {
      var row = el('div', { class: 'row' });
      [0, 1].forEach(function (j) {
        var lab = el('label', null, labels[name][j] + ' ' + (i + 1));
        var inp = el('input', { value: pair[j], 'aria-label': labels[name][j] + ' ' + (i + 1) });
        inp.addEventListener('input', function () { st[name][i][j] = inp.value; update(); });
        lab.appendChild(inp); row.appendChild(lab);
      });
      var del = el('button', { class: 'del', type: 'button', title: 'Remove', 'aria-label': 'Remove' }, '×');
      del.addEventListener('click', function () { st[name].splice(i, 1); drawRows(name); update(); });
      row.appendChild(del);
      box.appendChild(row);
    });
  }
  function pairs(name, a, b) {
    return st[name].map(function (p, i) {
      var x = L(p[0]), y = L(p[1]);
      if (isNaN(x) || isNaN(y)) throw new RangeError('Check ' + labels[name][0].toLowerCase() + ' / ' + labels[name][1].toLowerCase() + ' ' + (i + 1));
      var o = {}; o[a] = x; o[b] = y; return o;
    });
  }

  function update() {
    save();
    try {
      var c = Measure.countertop(pairs('pieces', 'length', 'depth'), pairs('cutouts', 'length', 'depth'), Number($('cWaste').value));
      show($('cOut'), [
        el('div', null, 'Countertop area'), el('div', { class: 'big' }, area(c.net)),
        table([['Gross', area(c.gross)], ['Cutouts', area(c.cutouts)], ['Order with ' + c.wastePct + '% extra', area(c.order)]])
      ]);
    } catch (e) { err($('cOut'), e.message); }
    try {
      var tw = L($('tW').value), th = L($('tH').value);
      if (isNaN(tw) || isNaN(th)) throw new RangeError('Check the tile size');
      var open = Number($('open').value || 0) * 144;
      var perBox = Number($('perBox').value || 0) || null;
      var s = Measure.backsplash(pairs('walls', 'length', 'height'), open, { width: tw, height: th }, Number($('sWaste').value), perBox);
      var rows = [['Wall area', area(s.net)], ['With ' + s.wastePct + '% waste', area(s.withWaste)]];
      if (s.boxes != null) rows.push(['Boxes', String(s.boxes)]);
      show($('sOut'), [el('div', null, 'Tiles to buy (' + len(tw) + ' × ' + len(th) + ')'), el('div', { class: 'big' }, Measure.fmt(s.tiles, 0) + ' tiles'), table(rows)]);
    } catch (e) { err($('sOut'), e.message); }
    try {
      var run = L($('runLen').value), keep = L($('filler').value || '0');
      if (isNaN(run)) throw new RangeError('Check the wall length');
      if (isNaN(keep)) throw new RangeError('Check the filler');
      var k = Measure.cabinetRun(run, keep);
      var chips = el('div', { class: 'chips' });
      Object.keys(k.counts).sort(function (a, b) { return b - a; }).forEach(function (w) {
        chips.appendChild(el('span', { class: 'chip' }, k.counts[w] + ' × ' + w + ' in'));
      });
      show($('kOut'), [
        el('div', null, 'Linear feet'), el('div', { class: 'big' }, Measure.fmt(k.linearFeet, 2) + ' ft'),
        table([['Boxes', String(k.boxes.length)], ['Box width total', len(k.boxWidth)], ['Filler / scribe left', len(k.filler)]]),
        k.boxes.length ? chips : el('div', { class: 'err' }, 'Too short for a 9 in box')
      ]);
    } catch (e) { err($('kOut'), e.message); }
  }

  function setTab(t) {
    st.tab = t;
    document.querySelectorAll('nav button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === t)); });
    ['counter', 'splash', 'cab'].forEach(function (id) { $(id).hidden = id !== t; });
    save();
  }

  document.querySelectorAll('nav button').forEach(function (b) { b.addEventListener('click', function () { setTab(b.dataset.tab); }); });
  document.querySelectorAll('.add').forEach(function (b) {
    b.addEventListener('click', function () { st[b.dataset.add].push(['', '']); drawRows(b.dataset.add); update(); });
  });
  ['cWaste', 'tW', 'tH', 'open', 'sWaste', 'perBox', 'runLen', 'filler'].forEach(function (id) { $(id).addEventListener('input', update); });
  $('unit').value = st.unit;
  $('unit').addEventListener('change', function () { st.unit = $('unit').value; update(); });
  ['pieces', 'cutouts', 'walls'].forEach(drawRows);
  setTab(st.tab);
  update();
})();
