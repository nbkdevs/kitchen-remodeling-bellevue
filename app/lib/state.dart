import 'package:flutter/foundation.dart';
import 'package:kitchen_remodeling_cost/kitchen_remodeling_cost.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum Mode { split, estimate }

/// App state: inputs, share overrides and the computed breakdown.
class PlannerState extends ChangeNotifier {
  PlannerState(this._prefs) {
    final p = _prefs;
    if (p != null) {
      mode = Mode.values[p.getInt('mode') ?? 0];
      amount = p.getDouble('amount') ?? amount;
      taxPercent = p.getDouble('tax') ?? taxPercent;
      contingencyPercent = p.getDouble('cont') ?? contingencyPercent;
      permit = p.getDouble('permit') ?? permit;
      for (final i in lineItems) {
        final v = p.getDouble('share_${i.key}');
        if (v != null) shares[i.key] = v;
      }
    }
  }

  final SharedPreferences? _prefs;

  Mode mode = Mode.split;
  double amount = 60000;
  double taxPercent = defaultTaxRate * 100;
  double contingencyPercent = defaultContingencyRate * 100;
  double permit = 1500;
  final Map<String, double> shares = {
    for (final i in lineItems) i.key: i.share * 100,
  };

  Breakdown? get result {
    try {
      return compute(amount);
    } on ArgumentError {
      return null;
    }
  }

  String? get error {
    try {
      compute(amount);
      return null;
    } on ArgumentError catch (e) {
      return '${e.message}';
    }
  }

  Breakdown compute(double value, {double? permitOverride, Mode? as}) {
    final m = as ?? mode;
    final args = (
      taxRate: taxPercent / 100,
      contingencyRate: contingencyPercent / 100,
      permit: permitOverride ?? permit,
    );
    return m == Mode.split
        ? splitBudget(value,
            taxRate: args.taxRate,
            contingencyRate: args.contingencyRate,
            permit: args.permit,
            shares: shares)
        : estimate(value,
            taxRate: args.taxRate,
            contingencyRate: args.contingencyRate,
            permit: args.permit,
            shares: shares);
  }

  void update(void Function(PlannerState s) f) {
    f(this);
    _save();
    notifyListeners();
  }

  void applyPreset(Preset p) => update((s) {
        s.mode = Mode.estimate;
        s.amount = p.construction;
        s.permit = p.permit;
      });

  void resetShares() => update((s) {
        for (final i in lineItems) {
          s.shares[i.key] = i.share * 100;
        }
      });

  void _save() {
    final p = _prefs;
    if (p == null) return;
    p.setInt('mode', mode.index);
    p.setDouble('amount', amount);
    p.setDouble('tax', taxPercent);
    p.setDouble('cont', contingencyPercent);
    p.setDouble('permit', permit);
    shares.forEach((k, v) => p.setDouble('share_$k', v));
  }
}
