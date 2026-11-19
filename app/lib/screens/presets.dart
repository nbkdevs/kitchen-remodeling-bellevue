import 'package:flutter/material.dart';
import 'package:kitchen_remodeling_cost/kitchen_remodeling_cost.dart';

import '../state.dart';

class PresetsScreen extends StatelessWidget {
  const PresetsScreen({super.key, required this.state, required this.onPick});
  final PlannerState state;
  final VoidCallback onPick;

  static const _scope = {
    'minor-midrange':
        'Same layout. Cabinets refaced or replaced in place, new counters, sink, faucet and appliances.',
    'major-midrange':
        'Full gut. Semi-custom cabinets, new counters, flooring and lighting, new layout.',
    'major-upscale':
        'Custom cabinets, stone counters, built-in fridge, pro-style range and hood.',
  };

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Cost vs Value 2025 averages for the Pacific region (200 sq ft kitchen), with your '
          'tax rate and reserve applied.',
          style: t.bodyMedium,
        ),
        const SizedBox(height: 12),
        for (final p in presets) ...[
          Builder(builder: (context) {
            final r = state.compute(p.construction,
                permitOverride: p.permit, as: Mode.estimate);
            return Card(
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () {
                  state.applyPreset(p);
                  onPick();
                },
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Icon(Icons.kitchen, color: cs.primary),
                        const SizedBox(width: 8),
                        Expanded(child: Text(p.label, style: t.titleMedium)),
                        Text(money(p.construction), style: t.titleMedium),
                      ]),
                      const SizedBox(height: 6),
                      Text(_scope[p.key] ?? '', style: t.bodyMedium),
                      const SizedBox(height: 10),
                      Wrap(spacing: 8, runSpacing: 6, children: [
                        Chip(label: Text('Tax ${money(r.tax)}')),
                        Chip(label: Text('Reserve ${money(r.contingency)}')),
                        Chip(label: Text('Permits ${money(r.permit)}')),
                      ]),
                      const SizedBox(height: 6),
                      Row(children: [
                        Text('All-in', style: t.labelLarge),
                        const Spacer(),
                        Text(money(r.total),
                            style: t.titleLarge?.copyWith(
                                color: cs.primary, fontWeight: FontWeight.w600)),
                      ]),
                    ],
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 8),
        ],
        Text('Tap a preset to open it in the planner.',
            style: t.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
      ],
    );
  }
}
