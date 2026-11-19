/* Cabinet & Countertop Measure: pure maths, no DOM. Lengths are inches internally. MIT. */
(function (root) {
  'use strict';
  var CM_PER_IN = 2.54;
  var SQIN_PER_SQFT = 144;
  var SQM_PER_SQFT = 0.09290304;
  var CABINET_WIDTHS = [36, 33, 30, 27, 24, 21, 18, 15, 12, 9];

  /** Parse "25", "25.5", "25 1/2", "1/2", "2' 6\"", "30in", "76.2cm" (unit = default 'in' or 'cm'). Returns inches or NaN. */
  function parseLength(text, unit) {
    var s = String(text == null ? '' : text).trim().toLowerCase().replace(/,/g, '.');
    if (!s) return NaN;
    var u = unit === 'cm' ? 'cm' : 'in';
    var m = s.match(/^(\d+(?:\.\d+)?)\s*(cm|mm|m)$/);
    if (m) return Number(m[1]) * { cm: 1, mm: 0.1, m: 100 }[m[2]] / CM_PER_IN;
    m = s.match(/^(?:(\d+(?:\.\d+)?)\s*(?:'|ft|feet))?\s*(?:(\d+(?:\.\d+)?)?(?:\s*(\d+)\/(\d+))?)\s*(?:"|in|inches)?$/);
    if (!m || (m[1] === undefined && m[2] === undefined && m[3] === undefined)) return NaN;
    var feet = m[1] ? Number(m[1]) : 0;
    var whole = m[2] ? Number(m[2]) : 0;
    var frac = m[3] ? Number(m[3]) / Number(m[4]) : 0;
    if (m[4] !== undefined && Number(m[4]) === 0) return NaN;
    var rest = whole + frac;
    var hasFeet = m[1] !== undefined;
    if (!hasFeet && u === 'cm') return rest / CM_PER_IN;
    return feet * 12 + rest;
  }

  function pos(name, v) {
    if (typeof v !== 'number' || !isFinite(v) || v < 0) throw new RangeError(name + ' must be a number >= 0');
    return v;
  }

  function areaOut(sqin) {
    var sqft = sqin / SQIN_PER_SQFT;
    return { sqin: sqin, sqft: sqft, sqm: sqft * SQM_PER_SQFT };
  }

  /**
   * Countertop area. pieces: [{length, depth}] in inches; cutouts: [{length, depth}] (sink, cooktop).
   * wastePct: extra material for seams and offcuts (default 10).
   */
  function countertop(pieces, cutouts, wastePct) {
    var gross = 0, cut = 0;
    (pieces || []).forEach(function (p, i) { gross += pos('piece ' + (i + 1) + ' length', p.length) * pos('piece ' + (i + 1) + ' depth', p.depth); });
    (cutouts || []).forEach(function (c, i) { cut += pos('cutout ' + (i + 1) + ' length', c.length) * pos('cutout ' + (i + 1) + ' depth', c.depth); });
    if (cut > gross) throw new RangeError('cutouts are larger than the countertop');
    var w = wastePct == null ? 10 : pos('waste', wastePct);
    var net = gross - cut;
    return { gross: areaOut(gross), cutouts: areaOut(cut), net: areaOut(net), order: areaOut(gross * (1 + w / 100)), wastePct: w };
  }

  /**
   * Backsplash tile. walls: [{length, height}] inches; openingsSqin: windows/outlets to skip;
   * tile: {width, height} inches; wastePct default 10; perBox: tiles per box (optional).
   */
  function backsplash(walls, openingsSqin, tile, wastePct, perBox) {
    var gross = 0;
    (walls || []).forEach(function (wl, i) { gross += pos('wall ' + (i + 1) + ' length', wl.length) * pos('wall ' + (i + 1) + ' height', wl.height); });
    var open = pos('openings', openingsSqin || 0);
    if (open > gross) throw new RangeError('openings are larger than the wall area');
    var tw = pos('tile width', tile.width), th = pos('tile height', tile.height);
    if (tw === 0 || th === 0) throw new RangeError('tile size must be larger than 0');
    var w = wastePct == null ? 10 : pos('waste', wastePct);
    var net = gross - open;
    var tiles = Math.ceil((net * (1 + w / 100)) / (tw * th) - 1e-9);
    var boxes = perBox ? Math.ceil(tiles / pos('tiles per box', perBox)) : null;
    return { net: areaOut(net), withWaste: areaOut(net * (1 + w / 100)), tiles: tiles, boxes: boxes, wastePct: w };
  }

  /**
   * Cabinet run: fill a wall length (inches) with standard 3-inch-step box widths (9 to 36),
   * fewest boxes first, leaving filler under 3 inches. fillerMin: inches to keep for fillers/scribe (default 0).
   */
  function cabinetRun(length, fillerMin, widths) {
    var L = pos('run length', length);
    var keep = fillerMin == null ? 0 : pos('filler', fillerMin);
    var ws = (widths && widths.length ? widths : CABINET_WIDTHS).slice().sort(function (a, b) { return b - a; });
    var usable = Math.floor((L - keep) + 1e-9);
    if (usable < Math.min.apply(null, ws)) {
      return { length: L, linearFeet: L / 12, boxes: [], boxWidth: 0, filler: L, counts: {} };
    }
    // DP over whole inches: best[x] = fewest boxes that exactly fill x inches.
    var best = new Array(usable + 1).fill(Infinity), pick = new Array(usable + 1).fill(0);
    best[0] = 0;
    for (var x = 1; x <= usable; x++) {
      for (var j = 0; j < ws.length; j++) {
        var wdt = ws[j];
        if (wdt <= x && best[x - wdt] + 1 < best[x]) { best[x] = best[x - wdt] + 1; pick[x] = wdt; }
      }
    }
    var fill = usable;
    while (fill > 0 && best[fill] === Infinity) fill--;
    var boxes = [];
    for (var y = fill; y > 0; y -= pick[y]) boxes.push(pick[y]);
    boxes.sort(function (a, b) { return b - a; });
    var counts = {};
    boxes.forEach(function (b) { counts[b] = (counts[b] || 0) + 1; });
    return { length: L, linearFeet: L / 12, boxes: boxes, boxWidth: fill, filler: L - fill, counts: counts };
  }

  function fmt(n, d) {
    var p = Math.pow(10, d == null ? 2 : d);
    return (Math.round(n * p) / p).toLocaleString('en-US', { maximumFractionDigits: d == null ? 2 : d });
  }

  var api = { parseLength: parseLength, countertop: countertop, backsplash: backsplash, cabinetRun: cabinetRun, fmt: fmt, CABINET_WIDTHS: CABINET_WIDTHS, CM_PER_IN: CM_PER_IN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Measure = api;
})(typeof window !== 'undefined' ? window : globalThis);
