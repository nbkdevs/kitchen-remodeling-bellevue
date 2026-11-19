import 'package:flutter/material.dart';
import 'package:kitchen_remodeling_cost/kitchen_remodeling_cost.dart';

import '../state.dart';

class SharesScreen extends StatelessWidget {
  const SharesScreen({super.key, required this.state});
  final PlannerState state;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    final sum = state.shares.values.fold<double>(0, (a, b) => a + b);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Weights for each line item. They are scaled to 100%, so raise one and the others shrink. '
          'Defaults: $shareSource.',
          style: t.bodyMedium,
        ),
        const SizedBox(height: 8),
        for (final i in lineItems)
          Row(children: [
            SizedBox(width: 150, child: Text(i.label)),
            Expanded(
              child: Slider(
                value: state.shares[i.key]!.clamp(0, 50),
                min: 0,
                max: 50,
                divisions: 100,
                label: '${state.shares[i.key]!.toStringAsFixed(1)}%',
                onChanged: (v) => state.update((s) => s.shares[i.key] = v),
              ),
            ),
            SizedBox(
              width: 52,
              child: Text(
                sum > 0
                    ? '${(state.shares[i.key]! / sum * 100).toStringAsFixed(1)}%'
                    : '-',
                textAlign: TextAlign.end,
                style: t.bodyMedium?.copyWith(color: cs.primary),
              ),
            ),
          ]),
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerLeft,
          child: OutlinedButton.icon(
            key: const Key('resetShares'),
            icon: const Icon(Icons.restart_alt),
            label: const Text('Reset to defaults'),
            onPressed: state.resetShares,
          ),
        ),
      ],
    );
  }
}
