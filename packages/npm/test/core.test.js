'use strict';
const test = require('node:test');
const assert = require('node:assert');
const k = require('../lib/index.js');

const sum = (r) => Math.round(r.lines.reduce((s, l) => s + l.amount * 100, 0));

test('default shares add to 100%', () => {
  assert.strictEqual(Math.round(k.LINE_ITEMS.reduce((s, i) => s + i.share, 0) * 1000), 1000);
});

test('estimate adds reserve, tax and permit', () => {
  const r = k.estimate(60000, { permit: 1500 });
  assert.strictEqual(r.construction, 60000);
  assert.strictEqual(r.contingency, 6000);
  assert.strictEqual(r.tax, 6798);
  assert.strictEqual(r.total, 74298);
  assert.strictEqual(r.lines[0].amount, 15000);
  assert.strictEqual(sum(r), 6000000);
});

test('split total matches the budget exactly', () => {
  for (const t of [10000, 33333.33, 60000, 98765.43, 250000]) {
    const r = k.splitBudget(t, { permit: 1000 });
    assert.strictEqual(Math.round(r.total * 100), Math.round(t * 100));
    assert.strictEqual(sum(r), Math.round(r.construction * 100));
  }
});

test('split reference values', () => {
  const r = k.splitBudget(100000, { permit: 2500 });
  assert.strictEqual(r.construction, 80359.35);
  assert.strictEqual(r.contingency, 8035.94);
  assert.strictEqual(r.tax, 9104.71);
  assert.strictEqual(r.lines.find((l) => l.key === 'cabinets').amount, 20089.84);
});

test('rounding cents go to the largest remainders, ties in table order', () => {
  const r = k.splitBudget(33333.33);
  assert.strictEqual(r.construction, 27473.28);
  assert.strictEqual(r.contingency, 2747.33);
  assert.strictEqual(r.tax, 3112.72);
  assert.strictEqual(r.lines[6].amount, 1373.67);
  assert.strictEqual(r.lines[7].amount, 1373.66);
});

test('presets', () => {
  const r = k.estimatePreset('major-midrange');
  assert.strictEqual(r.construction, 86480);
  assert.strictEqual(r.permit, 2500);
  assert.strictEqual(r.tax, 9798.18);
  assert.strictEqual(r.total, 107426.18);
  assert.throws(() => k.estimatePreset('nope'), RangeError);
});

test('share overrides are normalised', () => {
  const r = k.estimate(1000, { contingencyRate: 0, taxRate: 0, shares: { cabinets: 50 } });
  assert.ok(r.lines[0].share > 0.5);
  assert.strictEqual(sum(r), 100000);
  assert.throws(() => k.estimate(1, { shares: { garage: 1 } }), RangeError);
});

test('validation', () => {
  assert.throws(() => k.estimate(-1), RangeError);
  assert.throws(() => k.estimate(1, { taxRate: 2 }), RangeError);
  assert.throws(() => k.splitBudget(100, { permit: 200 }), RangeError);
});

test('table output', () => {
  const t = k.formatTable(k.estimate(60000, { permit: 1500 }));
  assert.match(t, /Cabinets and shelving\s+25\.0%\s+\$15,000\.00/);
  assert.match(t, /Total\s+\$74,298\.00/);
});
