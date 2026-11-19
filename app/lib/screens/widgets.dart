import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:kitchen_remodeling_cost/kitchen_remodeling_cost.dart';

/// Itemised table with share bars and the totals block.
class BreakdownCard extends StatelessWidget {
  const BreakdownCard({super.key, required this.r});
  final Breakdown r;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final t = Theme.of(context).textTheme;
    final max = r.lines.map((l) => l.amount).fold<double>(1, (a, b) => a > b ? a : b);
    String pct(double x) {
      final s = (x * 100).toStringAsFixed(2);
      return s.replaceFirst(RegExp(r'\.?0+$'), '');
    }

    Widget row(String label, double v, {bool bold = false}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Row(children: [
            Expanded(
                child: Text(label,
                    style: bold ? t.titleMedium : t.bodyMedium)),
            Text(money(v), style: bold ? t.titleMedium : t.bodyMedium),
          ]),
        );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (final l in r.lines)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(children: [
                      Expanded(child: Text(l.label)),
                      Text('${(l.share * 100).toStringAsFixed(1)}%',
                          style: t.bodySmall?.copyWith(color: cs.outline)),
                      const SizedBox(width: 12),
                      SizedBox(
                          width: 96,
                          child: Text(money(l.amount),
                              textAlign: TextAlign.end)),
                    ]),
                    const SizedBox(height: 3),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: l.amount / max,
                        minHeight: 5,
                        backgroundColor: cs.surfaceContainerHighest,
                      ),
                    ),
                  ],
                ),
              ),
            const Divider(height: 24),
            row('Construction subtotal', r.construction),
            row('Contingency reserve (${pct(r.contingencyRate)}%)', r.contingency),
            row('Sales tax (${pct(r.taxRate)}%)', r.tax),
            row('Permit allowance', r.permit),
            const Divider(height: 20),
            row('Total', r.total, bold: true),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                key: const Key('copyTable'),
                icon: const Icon(Icons.copy_all_outlined),
                label: const Text('Copy table'),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: formatTable(r)));
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Table copied')));
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
