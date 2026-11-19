'use strict';
// Kitchen remodeling cost planner API + calculator page. No dependencies, no outbound requests.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
let k;
try { k = require('kitchen-remodeling-cost'); } catch { k = require('../npm/lib'); } // repo checkout fallback

const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const HELP = 'Try /api/split?total=60000&permit=1500, /api/estimate?amount=50000&tax=10.3&contingency=10, '
  + '/api/preset/major-midrange, /api/presets. Optional: tax, contingency (percent), permit, share_<key>=percent, format=text';

function staticFile(p) {
  const rel = p === '/' ? 'index.html' : p.slice(1);
  const full = path.normalize(path.join(PUBLIC, rel));
  if (!full.startsWith(PUBLIC + path.sep) || !TYPES[path.extname(full)] || !fs.existsSync(full)) return null;
  return { type: TYPES[path.extname(full)], body: fs.readFileSync(full) };
}

function options(sp) {
  const o = {};
  const n = (key) => { const v = Number(sp.get(key)); if (!Number.isFinite(v)) throw new RangeError(`${key} must be a number`); return v; };
  if (sp.has('tax')) o.taxRate = n('tax') / 100;
  if (sp.has('contingency')) o.contingencyRate = n('contingency') / 100;
  if (sp.has('permit')) o.permit = n('permit');
  const shares = {};
  for (const [key] of sp) if (key.startsWith('share_')) shares[key.slice(6)] = n(key);
  if (Object.keys(shares).length) o.shares = shares;
  return o;
}

function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const sp = url.searchParams;
  const send = (code, body) => {
    if (sp.get('format') === 'text' && code === 200 && body.lines) {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' });
      return res.end(k.formatTable(body) + '\n');
    }
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
    return res.end(JSON.stringify(body, null, 2));
  };
  try {
    if (url.pathname === '/healthz') return send(200, { ok: true });
    if (!url.pathname.startsWith('/api/')) {
      const f = staticFile(url.pathname);
      if (!f) return send(404, { error: `Not found. ${HELP}` });
      res.writeHead(200, { 'content-type': f.type });
      return res.end(f.body);
    }
    if (url.pathname === '/api/presets') return send(200, { presets: k.PRESETS, source: k.PRESET_SOURCE });
    if (url.pathname.startsWith('/api/preset/')) return send(200, k.estimatePreset(decodeURIComponent(url.pathname.slice(12)), options(sp)));
    if (url.pathname === '/api/split') {
      if (!sp.has('total')) return send(400, { error: `total is required. ${HELP}` });
      return send(200, k.splitBudget(Number(sp.get('total')), options(sp)));
    }
    if (url.pathname === '/api/estimate') {
      if (!sp.has('amount')) return send(400, { error: `amount is required. ${HELP}` });
      return send(200, k.estimate(Number(sp.get('amount')), options(sp)));
    }
    return send(404, { error: HELP });
  } catch (e) {
    return send(400, { error: e.message });
  }
}

function createServer() { return http.createServer(handle); }

if (require.main === module) {
  const port = Number(process.env.PORT) || 8080;
  createServer().listen(port, () => console.log(`kitchen-remodeling-cost listening on :${port}`));
}

module.exports = { createServer };
