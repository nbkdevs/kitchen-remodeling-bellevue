import 'package:kitchen_remodeling_cost/kitchen_remodeling_cost.dart';
import 'package:test/test.dart';

int cents(Breakdown r) =>
    r.lines.fold<int>(0, (s, l) => s + (l.amount * 100).round());

void main() {
  test('estimate', () {
    final r = estimate(60000, permit: 1500);
    expect([r.construction, r.contingency, r.tax, r.total], [60000, 6000, 6798, 74298]);
    expect(r.lines.first.amount, 15000);
    expect(cents(r), 6000000);
  });

  test('split reference', () {
    final r = splitBudget(100000, permit: 2500);
    expect([r.construction, r.contingency, r.tax], [80359.35, 8035.94, 9104.71]);
    expect(r.lines.first.amount, 20089.84);
  });

  test('split matches total exactly', () {
    for (final t in [10000.0, 33333.33, 60000.0, 98765.43, 250000.0]) {
      final r = splitBudget(t, permit: 1000);
      expect((r.total * 100).round(), (t * 100).round());
      expect(cents(r), (r.construction * 100).round());
    }
  });

  test('ties', () {
    final r = splitBudget(33333.33);
    expect([r.construction, r.contingency, r.tax], [27473.28, 2747.33, 3112.72]);
    expect(r.lines[6].amount, 1373.67);
    expect(r.lines[7].amount, 1373.66);
  });

  test('presets and errors', () {
    final r = estimatePreset('major-midrange');
    expect([r.permit, r.tax, r.total], [2500, 9798.18, 107426.18]);
    expect(() => estimatePreset('nope'), throwsArgumentError);
    expect(() => estimate(-1), throwsArgumentError);
    expect(() => estimate(1, taxRate: 2), throwsArgumentError);
    expect(() => splitBudget(100, permit: 200), throwsArgumentError);
    expect(() => estimate(1, shares: {'garage': 1}), throwsArgumentError);
    final s = estimate(1000, taxRate: 0, contingencyRate: 0, shares: {'cabinets': 50});
    expect(s.lines.first.share, greaterThan(0.5));
    expect(cents(s), 100000);
  });

  test('table', () {
    final t = formatTable(estimate(60000, permit: 1500));
    expect(t, contains('Cabinets and shelving       25.0%  \$15,000.00'));
    expect(t, contains('\$74,298.00'));
    expect(money(1234567.891), '\$1,234,567.89');
  });
}
