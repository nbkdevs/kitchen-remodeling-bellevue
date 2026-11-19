import 'dart:convert';
import 'dart:io';

import 'package:kitchen_remodeling_cost/kitchen_remodeling_cost.dart';

const _help = '''kitchen_remodeling_cost: kitchen remodeling budget planner

Usage:
  kitchen_remodeling_cost split <total>      split an all-in budget by line item
  kitchen_remodeling_cost estimate <amount>  add reserve, tax and permits
  kitchen_remodeling_cost preset <name>      minor-midrange | major-midrange | major-upscale
  kitchen_remodeling_cost presets            list presets

Options: --tax <percent> (10.3)  --contingency <percent> (10)  --permit <dollars>
         --share key=percent  --json
''';

void main(List<String> args) {
  final pos = <String>[];
  double tax = defaultTaxRate, cont = defaultContingencyRate;
  double? permit;
  var json = false;
  final shares = <String, double>{};
  try {
    for (var i = 0; i < args.length; i++) {
      final a = args[i];
      String val() => i + 1 < args.length
          ? args[++i]
          : throw ArgumentError('$a needs a value');
      switch (a) {
        case '-h' || '--help':
          stdout.write(_help);
          return;
        case '--json':
          json = true;
        case '--tax':
          tax = double.parse(val()) / 100;
        case '--contingency':
          cont = double.parse(val()) / 100;
        case '--permit':
          permit = double.parse(val());
        case '--share':
          final kv = val().split('=');
          shares[kv[0]] = double.parse(kv[1]);
        default:
          pos.add(a);
      }
    }
    final cmd = pos.isEmpty ? '' : pos[0];
    final val = pos.length > 1 ? pos[1] : '';
    final s = shares.isEmpty ? null : shares;
    Breakdown r;
    switch (cmd) {
      case 'presets':
        for (final p in presets) {
          stdout.writeln('${p.key.padRight(15)} ${p.label.padRight(26)} '
              '${money(p.construction)}  permit ${money(p.permit)}');
        }
        stdout.writeln('Source: $presetSource');
        return;
      case 'split':
        r = splitBudget(double.parse(val),
            taxRate: tax, contingencyRate: cont, permit: permit ?? 0, shares: s);
      case 'estimate':
        r = estimate(double.parse(val),
            taxRate: tax, contingencyRate: cont, permit: permit ?? 0, shares: s);
      case 'preset':
        r = estimatePreset(val,
            taxRate: tax, contingencyRate: cont, permit: permit, shares: s);
      default:
        stdout.write(_help);
        return;
    }
    stdout.writeln(json
        ? const JsonEncoder.withIndent('  ').convert(r.toJson())
        : formatTable(r));
  } on Object catch (e) {
    stderr.writeln('error: $e');
    exitCode = 1;
  }
}
