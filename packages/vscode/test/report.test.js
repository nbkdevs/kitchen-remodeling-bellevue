'use strict';
const test = require('node:test');
const assert = require('node:assert');
const core = require('../lib/core');
const report = require('../lib/report');
const panel = require('../lib/panel');

test('split budget reference values match the shared library', () => {
  const r = report.build({ mode: 'split', amount: 100000, permit: 2500 });
  assert.strictEqual(r.construction, 80359.35);
  assert.strictEqual(r.contingency, 8035.94);
  assert.strictEqual(r.tax, 9104.71);
  assert.strictEqual(r.total, 100000);
  const cents = Math.round(r.lines.reduce((s, l) => s + l.amount * 100, 0));
  assert.strictEqual(cents, Math.round(r.construction * 100));
});

test('estimate adds reserve, tax and permit', () => {
  const r = report.build({ mode: 'estimate', amount: 60000, permit: 1500 });
  assert.strictEqual(r.total, 74298);
});

test('preset uses the preset permit unless overridden', () => {
  const r = report.build({ preset: 'major-midrange' });
  assert.strictEqual(r.construction, 86480);
  assert.strictEqual(r.permit, 2500);
  assert.strictEqual(report.build({ preset: 'major-midrange', permit: 900 }).permit, 900);
});

test('markdown table has every line item and the totals', () => {
  const md = report.toMarkdown(report.build({ mode: 'split', amount: 60000, permit: 1500 }));
  assert.match(md, /^### Kitchen remodel budget split: \$60,000\.00 all-in/);
  assert.match(md, /\| Line item \| Share \| Amount \|\n\|---\|---:\|---:\|/);
  for (const it of core.LINE_ITEMS) assert.ok(md.includes(`| ${it.label} |`), it.label);
  assert.match(md, /\| Sales tax \(10\.3%\) \|  \| \$[\d,]+\.\d\d \|/);
  assert.match(md, /\| \*\*Total\*\* \|  \| \*\*\$60,000\.00\*\* \|/);
  assert.ok(!/https?:\/\//.test(md), 'inserted text carries no links');
});

test('parseMoney accepts common formats', () => {
  assert.strictEqual(report.parseMoney('$60,000'), 60000);
  assert.strictEqual(report.parseMoney('60k'), 60000);
  assert.strictEqual(report.parseMoney('1.25m'), 1250000);
  assert.strictEqual(report.parseMoney('1500.5'), 1500.5);
  assert.ok(Number.isNaN(report.parseMoney('abc')));
  assert.ok(Number.isNaN(report.parseMoney('-5')));
});

test('parseRate reads percent or fraction', () => {
  assert.strictEqual(report.parseRate('10.3'), 0.103);
  assert.strictEqual(report.parseRate('10.3%'), 0.103);
  assert.strictEqual(report.parseRate('0.1'), 0.1);
  assert.ok(Number.isNaN(report.parseRate('')));
});

test('invalid input throws a readable error', () => {
  assert.throws(() => report.build({ mode: 'split', amount: 1000, permit: 2000 }), /larger than the permit/);
});

test('webview html has a strict CSP and no remote resources', () => {
  const h = panel.html({ cspSource: 'vscode-resource:', nonce: 'abc', coreUri: 'c.js', scriptUri: 'p.js', styleUri: 's.css', settings: { taxRate: 0.1 } });
  assert.match(h, /default-src 'none'/);
  assert.match(h, /script-src 'nonce-abc'/);
  assert.ok(!/https?:\/\//.test(h));
});
