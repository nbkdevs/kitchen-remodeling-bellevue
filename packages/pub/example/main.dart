import 'package:kitchen_remodeling_cost/kitchen_remodeling_cost.dart';

void main() {
  // An all-in budget of $60,000 with a $1,500 permit allowance.
  final split = splitBudget(60000, permit: 1500);
  print(formatTable(split));

  // A Cost vs Value preset with Bellevue's default 10.3% sales tax.
  final major = estimatePreset('major-midrange');
  print('Major midrange all-in: ${money(major.total)}');
}
