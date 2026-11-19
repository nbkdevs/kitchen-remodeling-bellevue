'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { createServer } = require('../server.js');

async function withServer(fn) {
  const s = createServer().listen(0);
  await new Promise((r) => s.once('listening', r));
  try { await fn(`http://127.0.0.1:${s.address().port}`); } finally { s.close(); }
}

test('api and page', () => withServer(async (base) => {
  let r = await fetch(`${base}/api/split?total=60000&permit=1500`);
  assert.strictEqual(r.status, 200);
  let j = await r.json();
  assert.strictEqual(j.total, 60000);
  assert.strictEqual(j.lines.length, 12);
  j = await (await fetch(`${base}/api/preset/major-midrange`)).json();
  assert.strictEqual(j.total, 107426.18);
  j = await (await fetch(`${base}/api/estimate?amount=60000&permit=1500&share_cabinets=30`)).json();
  assert.ok(j.lines[0].share > 0.25);
  const t = await (await fetch(`${base}/api/estimate?amount=60000&permit=1500&format=text`)).text();
  assert.match(t, /Total\s+\$74,298\.00/);
  assert.strictEqual((await fetch(`${base}/api/split`)).status, 400);
  assert.strictEqual((await fetch(`${base}/api/preset/nope`)).status, 400);
  assert.strictEqual((await fetch(`${base}/../server.js`)).status, 404);
  const page = await (await fetch(`${base}/`)).text();
  assert.match(page, /Kitchen Remodeling Budget Calculator/);
  assert.match(await (await fetch(`${base}/planner.js`)).text(), /KitchenRemodelingCost/);
}));
