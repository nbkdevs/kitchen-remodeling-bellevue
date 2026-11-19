import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kitchen_remodeling_planner/main.dart';
import 'package:kitchen_remodeling_planner/state.dart';

void main() {
  testWidgets('planner splits the default budget', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.625;
    addTearDown(tester.view.reset);
    final st = PlannerState(null);
    await tester.pumpWidget(KitchenApp(state: st));
    expect(find.text('\$60,000.00'), findsWidgets);
    expect(find.text('Cabinets and shelving'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('amount')), '100000');
    await tester.enterText(find.byKey(const Key('permit')), '2500');
    await tester.pump();
    expect(find.text('\$100,000.00'), findsWidgets);
    expect(find.text('\$20,089.84'), findsWidgets);
  });

  testWidgets('preset opens in estimate mode', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.625;
    addTearDown(tester.view.reset);
    final st = PlannerState(null);
    await tester.pumpWidget(KitchenApp(state: st));
    await tester.tap(find.byIcon(Icons.kitchen_outlined));
    await tester.pumpAndSettle();
    expect(find.text('\$107,426.18'), findsOneWidget);
    await tester.tap(find.text('Major remodel, midrange'));
    await tester.pumpAndSettle();
    expect(st.mode, Mode.estimate);
    expect(st.amount, 86480);
  });

  testWidgets('about links the site', (tester) async {
    await tester.pumpWidget(KitchenApp(state: PlannerState(null)));
    await tester.tap(find.byKey(const Key('aboutButton')));
    await tester.pumpAndSettle();
    expect(find.text('Kitchen Remodeling Bellevue'), findsOneWidget);
  });
}
