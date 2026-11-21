'use strict';
/**
 * Pure helpers that turn a kitchen remodel breakdown into Markdown.
 * No VS Code API here so the maths and formatting stay unit-testable.
 */
const core = require('./core');

const pct = (f) => `${+(f * 100).toFixed(2)}%`;

function rows(r) {
  const out = r.lines.map((l) => [l.label, (l.share * 100).toFixed(1) + '%', core.money(l.amount)]);
  out.push(['**Construction subtotal**', '', `**${core.money(r.construction)}**`]);
  out.push([`Contingency reserve (${pct(r.contingencyRate)})`, '', core.money(r.contingency)]);
  out.push([`Sales tax (${pct(r.taxRate)})`, '', core.money(r.tax)]);
  out.push(['Permit allowance', '', core.money(r.permit)]);
  out.push(['**Total**', '', `**${core.money(r.total)}**`]);
  return out;
}

function title(r) {
  if (r.label) return `Kitchen remodel estimate: ${r.label}`;
  return r.mode === 'split'
    ? `Kitchen remodel budget split: ${core.money(r.total)} all-in`
    : `Kitchen remodel estimate: ${core.money(r.construction)} construction`;
}

/** Markdown section with a heading, table and source note. */
function toMarkdown(r, { heading = true } = {}) {
  const lines = [];
  if (heading) lines.push(`### ${title(r)}`, '');
  lines.push('| Line item | Share | Amount |', '|---|---:|---:|');
  for (const x of rows(r)) lines.push(`| ${x.join(' | ')} |`);
  lines.push('', `_Line-item shares: ${core.SHARE_SOURCE}.${r.preset ? ` Preset: ${core.PRESET_SOURCE}.` : ''} Figures are planning estimates, not a bid._`, '');
  return lines.join('\n');
}

/** Parse "$60,000", "60k", "1.2m" etc. into a dollar number. Returns NaN when invalid. */
function parseMoney(text) {
  if (typeof text !== 'string') return NaN;
  const m = text.trim().toLowerCase().replace(/[$,\s]/g, '').match(/^(\d+(?:\.\d+)?)([km]?)$/);
  if (!m) return NaN;
  const mult = m[2] === 'k' ? 1e3 : m[2] === 'm' ? 1e6 : 1;
  return Math.round(parseFloat(m[1]) * mult * 100) / 100;
}

/** Parse "10.3", "10.3%" or "0.103" into a fraction. Values above 1 are read as percent. */
function parseRate(text) {
  if (typeof text !== 'string' || !text.trim()) return NaN;
  const v = parseFloat(text.replace('%', '').trim());
  if (!Number.isFinite(v) || v < 0) return NaN;
  return Math.round((v > 1 ? v / 100 : v) * 1e8) / 1e8;
}

/** Build a breakdown from user inputs. mode: 'split' | 'estimate'. */
function build({ mode, amount, permit = 0, taxRate, contingencyRate, preset }) {
  const opts = { permit, taxRate, contingencyRate };
  if (preset) return core.estimatePreset(preset, { taxRate, contingencyRate, ...(permit ? { permit } : {}) });
  return mode === 'estimate' ? core.estimate(amount, opts) : core.splitBudget(amount, opts);
}

module.exports = { rows, title, toMarkdown, parseMoney, parseRate, build };
