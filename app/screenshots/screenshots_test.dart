// Renders real app screens to PNG for the store listings.
// Run from app/: flutter test screenshots/screenshots_test.dart  (writes ../store-graphics/raw/*.png)
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kitchen_remodeling_planner/main.dart';
import 'package:kitchen_remodeling_planner/state.dart';

Future<void> _font(String family, List<String> files) async {
  final l = FontLoader(family);
  for (final f in files) {
    l.addFont(Future.value(ByteData.sublistView(File(f).readAsBytesSync())));
  }
  await l.load();
}

const _root = Key('root');

void main() {
  final out = Directory('../store-graphics/raw')..createSync(recursive: true);
  final flutterRoot = Platform.environment['FLUTTER_ROOT'] ??
      '${Platform.environment['HOME']}/sdk/flutter';
  final fonts = '$flutterRoot/bin/cache/artifacts/material_fonts';

  setUpAll(() async {
    await _font('Roboto', [
      '$fonts/Roboto-Regular.ttf',
      '$fonts/Roboto-Medium.ttf',
      '$fonts/Roboto-Bold.ttf',
    ]);
    await _font('MaterialIcons', ['$fonts/MaterialIcons-Regular.otf']);
  });

  Future<void> shoot(WidgetTester tester, String name) async {
    await tester.pumpAndSettle();
    final rb = tester.renderObject<RenderRepaintBoundary>(find.byKey(_root));
    final bytes = await tester.runAsync(() async {
      final img = await rb.toImage(pixelRatio: tester.view.devicePixelRatio);
      return img.toByteData(format: ui.ImageByteFormat.png);
    });
    File('${out.path}/$name.png').writeAsBytesSync(bytes!.buffer.asUint8List());
  }

  for (final size in [const Size(1080, 1920), const Size(800, 1280)]) {
    final tag = '${size.width.toInt()}x${size.height.toInt()}';
    testWidgets('screens $tag', (tester) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = size.width == 1080 ? 2.625 : 2.0;
      addTearDown(tester.view.reset);
      final st = PlannerState(null);
      await tester.pumpWidget(
          RepaintBoundary(key: _root, child: KitchenApp(state: st)));
      await shoot(tester, '1-planner-$tag');

      await tester.drag(find.byType(ListView).first, const Offset(0, -520));
      await shoot(tester, '2-line-items-$tag');

      await tester.tap(find.byIcon(Icons.kitchen_outlined));
      await shoot(tester, '3-presets-$tag');

      await tester.tap(find.byIcon(Icons.tune_outlined));
      await shoot(tester, '4-shares-$tag');

      await tester.tap(find.byKey(const Key('aboutButton')));
      await shoot(tester, '5-about-$tag');
    });
  }
}
