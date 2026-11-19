/// A default line item and its share of the construction budget.
class LineItem {
  const LineItem(this.key, this.label, this.share);
  final String key;
  final String label;
  final double share;
}

/// Default shares (HomeGuide kitchen remodel cost breakdown).
const List<LineItem> lineItems = [
  LineItem('cabinets', 'Cabinets and shelving', 0.25),
  LineItem('labor', 'Installation and labor', 0.15),
  LineItem('appliances', 'Appliances', 0.15),
  LineItem('countertops', 'Countertops and backsplash', 0.10),
  LineItem('flooring', 'Flooring', 0.07),
  LineItem('lighting', 'Lighting', 0.05),
  LineItem('painting', 'Painting and drywall', 0.05),
  LineItem('design', 'Designer', 0.05),
  LineItem('sink', 'Sink and faucet', 0.05),
  LineItem('doors_windows', 'Doors and windows', 0.04),
  LineItem('plumbing', 'Plumbing', 0.03),
  LineItem('misc', 'Miscellaneous', 0.01),
];

/// A Cost vs Value preset (Pacific region averages).
class Preset {
  const Preset(this.key, this.label, this.construction, this.permit);
  final String key;
  final String label;
  final double construction;
  final double permit;
}

const List<Preset> presets = [
  Preset('minor-midrange', 'Minor remodel, midrange', 29728, 500),
  Preset('major-midrange', 'Major remodel, midrange', 86480, 2500),
  Preset('major-upscale', 'Major remodel, upscale', 171950, 4000),
];

const double defaultTaxRate = 0.103;
const double defaultContingencyRate = 0.10;
const String presetSource =
    'Cost vs Value 2025, Pacific region averages (200 sq ft kitchen)';
const String shareSource = 'HomeGuide kitchen remodel cost breakdown';

/// One computed line.
class Line {
  const Line(this.key, this.label, this.share, this.amount);
  final String key;
  final String label;
  final double share;
  final double amount;
  Map<String, Object> toJson() =>
      {'key': key, 'label': label, 'share': share, 'amount': amount};
}

/// Full result.
class Breakdown {
  const Breakdown({
    required this.mode,
    required this.lines,
    required this.construction,
    required this.contingency,
    required this.tax,
    required this.permit,
    required this.total,
    required this.taxRate,
    required this.contingencyRate,
  });
  final String mode;
  final List<Line> lines;
  final double construction, contingency, tax, permit, total;
  final double taxRate, contingencyRate;

  Map<String, Object> toJson() => {
        'mode': mode,
        'lines': lines.map((l) => l.toJson()).toList(),
        'construction': construction,
        'contingency': contingency,
        'tax': tax,
        'permit': permit,
        'total': total,
        'taxRate': taxRate,
        'contingencyRate': contingencyRate,
      };
}

int _round(double x) => (x + 0.5).floor();

double _num(String name, double v, [double? max]) {
  if (!v.isFinite || v < 0) {
    throw ArgumentError('$name must be a finite number >= 0');
  }
  if (max != null && v > max) throw ArgumentError('$name must be <= $max');
  return v;
}

/// Defaults merged with [overrides] (key -> weight), normalised to sum to 1.
List<LineItem> normaliseShares([Map<String, double>? overrides]) {
  final shares = {for (final i in lineItems) i.key: i.share};
  overrides?.forEach((k, v) {
    if (!shares.containsKey(k)) throw ArgumentError('unknown line item: $k');
    shares[k] = _num('share $k', v);
  });
  var sum = 0.0;
  for (final i in lineItems) {
    sum += shares[i.key]!;
  }
  if (sum <= 0) throw ArgumentError('shares must not all be zero');
  return [for (final i in lineItems) LineItem(i.key, i.label, shares[i.key]! / sum)];
}

List<Line> _allocate(int cents, List<LineItem> items) {
  final base = <int>[];
  final frac = <(int, double)>[];
  for (var i = 0; i < items.length; i++) {
    final raw = cents * items[i].share;
    final b = raw.floorToDouble();
    base.add(b.toInt());
    frac.add((i, raw - b));
  }
  var left = cents - base.fold<int>(0, (s, c) => s + c);
  frac.sort((a, b) {
    final c = b.$2.compareTo(a.$2);
    return c != 0 ? c : a.$1.compareTo(b.$1);
  });
  for (var j = 0; left > 0; j++, left--) {
    base[frac[j % frac.length].$1] += 1;
  }
  return [
    for (var i = 0; i < items.length; i++)
      Line(items[i].key, items[i].label, items[i].share, base[i] / 100)
  ];
}

Breakdown _result(String mode, int c, int k, int t, int p, double tax,
        double cont, List<LineItem> items) =>
    Breakdown(
      mode: mode,
      lines: _allocate(c, items),
      construction: c / 100,
      contingency: k / 100,
      tax: t / 100,
      permit: p / 100,
      total: (c + k + t + p) / 100,
      taxRate: tax,
      contingencyRate: cont,
    );

/// Forward estimate from a construction (pre-tax) cost.
Breakdown estimate(
  double construction, {
  double taxRate = defaultTaxRate,
  double contingencyRate = defaultContingencyRate,
  double permit = 0,
  Map<String, double>? shares,
}) {
  final tax = _num('taxRate', taxRate, 1);
  final cont = _num('contingencyRate', contingencyRate, 1);
  final items = normaliseShares(shares);
  final c = _round(_num('construction', construction) * 100);
  final k = _round(c * cont);
  final t = _round((c + k) * tax);
  return _result('estimate', c, k, t, _round(_num('permit', permit) * 100),
      tax, cont, items);
}

/// Split an all-in budget (tax, reserve and permits included) into line items.
Breakdown splitBudget(
  double total, {
  double taxRate = defaultTaxRate,
  double contingencyRate = defaultContingencyRate,
  double permit = 0,
  Map<String, double>? shares,
}) {
  final tax = _num('taxRate', taxRate, 1);
  final cont = _num('contingencyRate', contingencyRate, 1);
  final items = normaliseShares(shares);
  final p = _round(_num('permit', permit) * 100);
  final a = _round(_num('total', total) * 100) - p;
  if (a <= 0) {
    throw ArgumentError('total must be larger than the permit allowance');
  }
  final c = _round(a / ((1 + cont) * (1 + tax)));
  var k = _round(c * cont);
  final t = _round((c + k) * tax);
  k += a - c - k - t;
  return _result('split', c, k, t, p, tax, cont, items);
}

/// Look up a preset by key.
Preset presetByKey(String key) => presets.firstWhere((p) => p.key == key,
    orElse: () => throw ArgumentError(
        'unknown preset: $key (use ${presets.map((p) => p.key).join(', ')})'));

/// Estimate a preset; [permit] overrides the preset allowance.
Breakdown estimatePreset(
  String key, {
  double taxRate = defaultTaxRate,
  double contingencyRate = defaultContingencyRate,
  double? permit,
  Map<String, double>? shares,
}) {
  final p = presetByKey(key);
  return estimate(p.construction,
      taxRate: taxRate,
      contingencyRate: contingencyRate,
      permit: permit ?? p.permit,
      shares: shares);
}

/// `$12,345.67`
String money(double v) {
  final c = _round(v * 100);
  final d = (c ~/ 100).toString();
  final r = (c % 100).toString().padLeft(2, '0');
  final b = StringBuffer();
  for (var i = 0; i < d.length; i++) {
    if (i > 0 && (d.length - i) % 3 == 0) b.write(',');
    b.write(d[i]);
  }
  return '\$$b.$r';
}

String _pct(double rate) {
  var s = (rate * 100).toStringAsFixed(2);
  s = s.replaceFirst(RegExp(r'0+$'), '');
  return s.endsWith('.') ? s.substring(0, s.length - 1) : s;
}

/// Plain-text itemised table.
String formatTable(Breakdown r) {
  final rows = <List<String>>[
    for (final l in r.lines)
      [l.label, '${(l.share * 100).toStringAsFixed(1)}%', money(l.amount)],
    ['Construction subtotal', '', money(r.construction)],
    ['Contingency reserve (${_pct(r.contingencyRate)}%)', '', money(r.contingency)],
    ['Sales tax (${_pct(r.taxRate)}%)', '', money(r.tax)],
    ['Permit allowance', '', money(r.permit)],
    ['Total', '', money(r.total)],
  ];
  const head = ['Line item', 'Share', 'Amount'];
  final w = [
    for (var c = 0; c < 3; c++)
      rows.map((x) => x[c].length).fold(head[c].length, (a, b) => a > b ? a : b)
  ];
  String line(List<String> x) =>
      '${x[0].padRight(w[0])}  ${x[1].padLeft(w[1])}  ${x[2].padLeft(w[2])}';
  final sep = '-' * (w[0] + w[1] + w[2] + 4);
  final body = rows.map(line).toList();
  body.insert(r.lines.length, sep);
  body.insert(body.length - 1, sep);
  return [line(head), sep, ...body].join('\n');
}
