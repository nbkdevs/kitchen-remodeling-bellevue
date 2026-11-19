#!/usr/bin/env node
'use strict';
const k = require('../lib/index.js');

const HELP = `kitchen-remodeling-cost: kitchen remodeling budget planner

Usage:
  kitchen-remodeling-cost split <total>      split an all-in budget by line item
  kitchen-remodeling-cost estimate <amount>  add reserve, tax and permits to a construction cost
  kitchen-remodeling-cost preset <name>      ${Object.keys(k.PRESETS).join(' | ')}
  kitchen-remodeling-cost presets            list presets

Options:
  --tax <percent>          sales tax, default ${k.DEFAULT_TAX_RATE * 100}
  --contingency <percent>  reserve, default ${k.DEFAULT_CONTINGENCY_RATE * 100}
  --permit <dollars>       permit allowance
  --share key=percent      override a line item share (repeatable)
  --json                   JSON output
`;

function main(argv) {
  const pos = []; const opts = {}; let json = false; const shares = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => { if (i + 1 >= argv.length) throw new Error(`${a} needs a value`); return argv[++i]; };
    if (a === '--json') json = true;
    else if (a === '-h' || a === '--help') { process.stdout.write(HELP); return 0; }
    else if (a === '--tax') opts.taxRate = Number(val()) / 100;
    else if (a === '--contingency') opts.contingencyRate = Number(val()) / 100;
    else if (a === '--permit') opts.permit = Number(val());
    else if (a === '--share') { const [kk, v] = val().split('='); shares[kk] = Number(v); }
    else pos.push(a);
  }
  if (Object.keys(shares).length) opts.shares = shares;
  const [cmd, arg] = pos;
  let r;
  if (cmd === 'presets') {
    for (const [name, p] of Object.entries(k.PRESETS)) {
      process.stdout.write(`${name.padEnd(15)} ${p.label.padEnd(26)} ${k.money(p.construction)}  permit ${k.money(p.permit)}\n`);
    }
    process.stdout.write(`Source: ${k.PRESET_SOURCE}\n`);
    return 0;
  }
  if (cmd === 'split') r = k.splitBudget(Number(arg), opts);
  else if (cmd === 'estimate') r = k.estimate(Number(arg), opts);
  else if (cmd === 'preset') r = k.estimatePreset(arg, opts);
  else { process.stdout.write(HELP); return cmd ? 2 : 0; }
  process.stdout.write((json ? JSON.stringify(r, null, 2) : k.formatTable(r)) + '\n');
  return 0;
}

try { process.exitCode = main(process.argv.slice(2)); }
catch (e) { process.stderr.write(`error: ${e.message}\n`); process.exitCode = 1; }
