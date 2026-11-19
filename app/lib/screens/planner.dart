import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:kitchen_remodeling_cost/kitchen_remodeling_cost.dart';

import '../state.dart';
import 'widgets.dart';

class PlannerScreen extends StatefulWidget {
  const PlannerScreen({super.key, required this.state});
  final PlannerState state;

  @override
  State<PlannerScreen> createState() => _PlannerScreenState();
}

class _PlannerScreenState extends State<PlannerScreen> {
  late final TextEditingController _amount;
  late final TextEditingController _permit;

  String _fmt(double v) =>
      v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2);

  @override
  void initState() {
    super.initState();
    _amount = TextEditingController(text: _fmt(widget.state.amount));
    _permit = TextEditingController(text: _fmt(widget.state.permit));
    widget.state.addListener(_sync);
  }

  void _sync() {
    final s = widget.state;
    if (double.tryParse(_amount.text) != s.amount) _amount.text = _fmt(s.amount);
    if (double.tryParse(_permit.text) != s.permit) _permit.text = _fmt(s.permit);
  }

  @override
  void dispose() {
    widget.state.removeListener(_sync);
    _amount.dispose();
    _permit.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final t = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    final r = s.result;
    final money$ = [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        SegmentedButton<Mode>(
          segments: const [
            ButtonSegment(
                value: Mode.split,
                label: Text('Split my budget'),
                icon: Icon(Icons.pie_chart_outline)),
            ButtonSegment(
                value: Mode.estimate,
                label: Text('Price a scope'),
                icon: Icon(Icons.add_chart)),
          ],
          selected: {s.mode},
          onSelectionChanged: (v) => s.update((x) => x.mode = v.first),
        ),
        const SizedBox(height: 8),
        Text(
          s.mode == Mode.split
              ? 'Your all-in budget. Tax, reserve and permits come out first; the rest is split by line item.'
              : 'A construction cost. Reserve, tax and permits are added on top.',
          style: t.bodySmall?.copyWith(color: cs.onSurfaceVariant),
        ),
        const SizedBox(height: 12),
        TextField(
          key: const Key('amount'),
          controller: _amount,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: money$,
          decoration: InputDecoration(
            labelText: s.mode == Mode.split ? 'All-in budget' : 'Construction cost',
            prefixText: '\$ ',
            border: const OutlineInputBorder(),
          ),
          onChanged: (v) => s.update((x) => x.amount = double.tryParse(v) ?? 0),
        ),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 4, children: [
          for (final p in presets)
            ActionChip(
              label: Text(p.label.replaceFirst(' remodel', '')),
              onPressed: () => s.applyPreset(p),
            ),
        ]),
        const SizedBox(height: 8),
        _slider(context, 'Sales tax', s.taxPercent, 0, 15, 150,
            (v) => s.update((x) => x.taxPercent = v), key: 'tax'),
        _slider(context, 'Contingency', s.contingencyPercent, 0, 30, 30,
            (v) => s.update((x) => x.contingencyPercent = v), key: 'cont'),
        TextField(
          key: const Key('permit'),
          controller: _permit,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: money$,
          decoration: const InputDecoration(
            labelText: 'Permit allowance',
            prefixText: '\$ ',
            border: OutlineInputBorder(),
            isDense: true,
          ),
          onChanged: (v) => s.update((x) => x.permit = double.tryParse(v) ?? 0),
        ),
        const SizedBox(height: 16),
        if (r == null)
          Card(
            color: cs.errorContainer,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(s.error ?? 'Check the inputs',
                  style: TextStyle(color: cs.onErrorContainer)),
            ),
          )
        else ...[
          Card(
            color: cs.primaryContainer,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Total with tax and reserve',
                          style: t.labelLarge
                              ?.copyWith(color: cs.onPrimaryContainer)),
                      Text(money(r.total),
                          key: const Key('total'),
                          style: t.headlineMedium?.copyWith(
                              color: cs.onPrimaryContainer,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('Cabinets', style: t.labelMedium?.copyWith(color: cs.onPrimaryContainer)),
                  Text(money(r.lines.first.amount),
                      style: t.titleMedium?.copyWith(color: cs.onPrimaryContainer)),
                ]),
              ]),
            ),
          ),
          const SizedBox(height: 8),
          BreakdownCard(r: r),
        ],
        const SizedBox(height: 8),
        Text(
          'Shares: $shareSource. Presets: $presetSource. '
          '10.3% is the Bellevue, WA combined sales tax rate for Oct to Dec 2026; '
          'Washington taxes the full contract price, labor included. Planning numbers, not a bid.',
          style: t.bodySmall?.copyWith(color: cs.onSurfaceVariant),
        ),
      ],
    );
  }

  Widget _slider(BuildContext context, String label, double value, double min,
      double max, int divisions, ValueChanged<double> onChanged,
      {required String key}) {
    final shown = value.toStringAsFixed(1).replaceFirst(RegExp(r'\.0$'), '');
    return Row(children: [
      SizedBox(width: 150, child: Text('$label $shown%')),
      Expanded(
        child: Slider(
          key: Key(key),
          value: value.clamp(min, max),
          min: min,
          max: max,
          divisions: divisions,
          label: '$shown%',
          onChanged: onChanged,
        ),
      ),
    ]);
  }
}
