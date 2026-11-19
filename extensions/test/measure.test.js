'use strict';
const test = require('node:test');
const assert = require('node:assert');
const M = require('../shared/js/measure.js');

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('parseLength', () => {
  assert.strictEqual(M.parseLength('25'), 25);
  assert.strictEqual(M.parseLength('25 1/2'), 25.5);
  assert.strictEqual(M.parseLength('1/4'), 0.25);
  assert.strictEqual(M.parseLength('2\' 6"'), 30);
  assert.strictEqual(M.parseLength('10ft'), 120);
  near(M.parseLength('76.2cm'), 30);
  near(M.parseLength('76.2', 'cm'), 30);
  assert.ok(Number.isNaN(M.parseLength('abc')));
  assert.ok(Number.isNaN(M.parseLength('')));
  assert.ok(Number.isNaN(M.parseLength('1/0')));
});

test('countertop L-shape with sink cutout', () => {
  const r = M.countertop([{ length: 120, depth: 25.5 }, { length: 72, depth: 25.5 }], [{ length: 33, depth: 22 }], 10);
  near(r.gross.sqft, 34);
  near(r.net.sqft, 34 - 726 / 144);
  near(r.order.sqft, 37.4);
  assert.throws(() => M.countertop([{ length: 10, depth: 10 }], [{ length: 20, depth: 20 }]), RangeError);
  assert.throws(() => M.countertop([{ length: -1, depth: 10 }]), RangeError);
});

test('backsplash tiles and boxes', () => {
  const r = M.backsplash([{ length: 120, height: 18 }], 0, { width: 3, height: 6 }, 10, 40);
  near(r.net.sqft, 15);
  assert.strictEqual(r.tiles, 132);
  assert.strictEqual(r.boxes, 4);
  assert.throws(() => M.backsplash([{ length: 10, height: 10 }], 0, { width: 0, height: 6 }), RangeError);
});

test('cabinet run uses standard widths and leaves under 3in filler', () => {
  const r = M.cabinetRun(120);
  assert.strictEqual(r.boxWidth, 120);
  assert.deepStrictEqual(r.boxes, [36, 36, 36, 12]);
  near(r.linearFeet, 10);
  const s = M.cabinetRun(100.5, 1);
  assert.ok(s.filler >= 1 && s.filler < 4);
  assert.strictEqual(s.boxes.reduce((a, b) => a + b, 0), s.boxWidth);
  assert.deepStrictEqual(M.cabinetRun(6).boxes, []);
});
