/* kitchen-remodeling-cost (browser build of packages/npm/lib/index.js), MIT */
(function (root) {
  var module = { exports: {} };

/**
 * Kitchen remodeling cost planner: split a kitchen remodel budget by line item,
 * add Washington sales tax, a contingency reserve and a permit allowance.
 * Zero dependencies. All arithmetic is done in integer cents.
 */

const LINE_ITEMS = Object.freeze([
  { key: 'cabinets', label: 'Cabinets and shelving', share: 0.25 },
  { key: 'labor', label: 'Installation and labor', share: 0.15 },
  { key: 'appliances', label: 'Appliances', share: 0.15 },
  { key: 'countertops', label: 'Countertops and backsplash', share: 0.10 },
  { key: 'flooring', label: 'Flooring', share: 0.07 },
  { key: 'lighting', label: 'Lighting', share: 0.05 },
  { key: 'painting', label: 'Painting and drywall', share: 0.05 },
  { key: 'design', label: 'Designer', share: 0.05 },
  { key: 'sink', label: 'Sink and faucet', share: 0.05 },
  { key: 'doors_windows', label: 'Doors and windows', share: 0.04 },
  { key: 'plumbing', label: 'Plumbing', share: 0.03 },
  { key: 'misc', label: 'Miscellaneous', share: 0.01 },
].map(Object.freeze));

const PRESETS = Object.freeze({
  'minor-midrange': Object.freeze({ label: 'Minor remodel, midrange', construction: 29728, permit: 500 }),
  'major-midrange': Object.freeze({ label: 'Major remodel, midrange', construction: 86480, permit: 2500 }),
  'major-upscale': Object.freeze({ label: 'Major remodel, upscale', construction: 171950, permit: 4000 }),
});

const DEFAULT_TAX_RATE = 0.103;
const DEFAULT_CONTINGENCY_RATE = 0.10;
const PRESET_SOURCE = 'Cost vs Value 2025, Pacific region averages (200 sq ft kitchen)';
const SHARE_SOURCE = 'HomeGuide kitchen remodel cost breakdown';

const round = (x) => Math.floor(x + 0.5);

function num(name, v, { max } = {}) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    throw new RangeError(`${name} must be a finite number >= 0`);
  }
  if (max !== undefined && v > max) throw new RangeError(`${name} must be <= ${max}`);
  return v;
}

function options(opts = {}) {
  return {
    taxRate: num('taxRate', opts.taxRate ?? DEFAULT_TAX_RATE, { max: 1 }),
    contingencyRate: num('contingencyRate', opts.contingencyRate ?? DEFAULT_CONTINGENCY_RATE, { max: 1 }),
    permit: num('permit', opts.permit ?? 0),
    shares: normaliseShares(opts.shares),
  };
}

/** Merge share overrides ({key: weight}) into the defaults and normalise to 1. */
function normaliseShares(overrides) {
  const items = LINE_ITEMS.map((it) => ({ key: it.key, label: it.label, share: it.share }));
  if (overrides) {
    for (const [k, v] of Object.entries(overrides)) {
      const it = items.find((i) => i.key === k);
      if (!it) throw new RangeError(`unknown line item: ${k}`);
      it.share = num(`share ${k}`, v);
    }
  }
  const sum = items.reduce((s, i) => s + i.share, 0);
  if (sum <= 0) throw new RangeError('shares must not all be zero');
  for (const i of items) i.share = i.share / sum;
  return items;
}

/** Split construction cents across line items (largest remainder, ties by order). */
function allocate(cents, items) {
  const rows = items.map((it, idx) => {
    const raw = cents * it.share;
    const base = Math.floor(raw);
    return { idx, key: it.key, label: it.label, share: it.share, cents: base, frac: raw - base };
  });
  let left = cents - rows.reduce((s, r) => s + r.cents, 0);
  const order = [...rows].sort((a, b) => b.frac - a.frac || a.idx - b.idx);
  for (let i = 0; left > 0; i = (i + 1) % order.length, left--) order[i].cents += 1;
  return rows.map(({ key, label, share, cents: c }) => ({ key, label, share, amount: c / 100 }));
}

function result(mode, C, K, T, P, o) {
  return {
    mode,
    lines: allocate(C, o.shares),
    construction: C / 100,
    contingency: K / 100,
    tax: T / 100,
    permit: P / 100,
    total: (C + K + T + P) / 100,
    taxRate: o.taxRate,
    contingencyRate: o.contingencyRate,
  };
}

/** Forward estimate from a construction (pre-tax) cost. */
function estimate(construction, opts) {
  const o = options(opts);
  const C = round(num('construction', construction) * 100);
  const K = round(C * o.contingencyRate);
  const T = round((C + K) * o.taxRate);
  return result('estimate', C, K, T, round(o.permit * 100), o);
}

/** Split an all-in budget (tax, reserve and permits included) into line items. */
function splitBudget(total, opts) {
  const o = options(opts);
  const P = round(o.permit * 100);
  const A = round(num('total', total) * 100) - P;
  if (A <= 0) throw new RangeError('total must be larger than the permit allowance');
  const C = round(A / ((1 + o.contingencyRate) * (1 + o.taxRate)));
  let K = round(C * o.contingencyRate);
  const T = round((C + K) * o.taxRate);
  K += A - C - K - T;
  return result('split', C, K, T, P, o);
}

/** Estimate one of the Cost vs Value presets. opts.permit overrides the preset allowance. */
function estimatePreset(name, opts = {}) {
  const p = PRESETS[name];
  if (!p) throw new RangeError(`unknown preset: ${name} (use ${Object.keys(PRESETS).join(', ')})`);
  return { preset: name, label: p.label, ...estimate(p.construction, { permit: p.permit, ...opts }) };
}

function money(v) {
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Plain-text itemised table. */
function formatTable(r) {
  const rows = r.lines.map((l) => [l.label, (l.share * 100).toFixed(1) + '%', money(l.amount)]);
  rows.push(['Construction subtotal', '', money(r.construction)]);
  rows.push([`Contingency reserve (${+(r.contingencyRate * 100).toFixed(2)}%)`, '', money(r.contingency)]);
  rows.push([`Sales tax (${+(r.taxRate * 100).toFixed(2)}%)`, '', money(r.tax)]);
  rows.push(['Permit allowance', '', money(r.permit)]);
  rows.push(['Total', '', money(r.total)]);
  const w = [0, 1, 2].map((c) => Math.max(...rows.map((x) => x[c].length), ['Line item', 'Share', 'Amount'][c].length));
  const line = (x) => `${x[0].padEnd(w[0])}  ${x[1].padStart(w[1])}  ${x[2].padStart(w[2])}`;
  const sep = '-'.repeat(w[0] + w[1] + w[2] + 4);
  const body = rows.map(line);
  body.splice(r.lines.length, 0, sep);
  body.splice(body.length - 1, 0, sep);
  return [line(['Line item', 'Share', 'Amount']), sep, ...body].join('\n');
}

module.exports = {
  LINE_ITEMS, PRESETS, DEFAULT_TAX_RATE, DEFAULT_CONTINGENCY_RATE, PRESET_SOURCE, SHARE_SOURCE,
  estimate, splitBudget, estimatePreset, normaliseShares, formatTable, money,
};

  root.KitchenRemodelingCost = module.exports;
})(typeof window !== 'undefined' ? window : globalThis);
