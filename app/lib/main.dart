import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app_info.dart';
import 'screens/about.dart';
import 'screens/planner.dart';
import 'screens/presets.dart';
import 'screens/shares.dart';
import 'state.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SharedPreferences? prefs;
  try {
    prefs = await SharedPreferences.getInstance();
  } catch (_) {
    prefs = null;
  }
  runApp(KitchenApp(state: PlannerState(prefs)));
}

const seed = Color(0xFF8A5A36);

class KitchenApp extends StatelessWidget {
  const KitchenApp({super.key, required this.state});
  final PlannerState state;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppInfo.name,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: seed),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme:
            ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.dark),
        useMaterial3: true,
      ),
      home: HomeShell(state: state),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.state});
  final PlannerState state;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final titles = ['Kitchen Remodel Budget', 'Cost vs Value presets', 'Line item shares'];
    return ListenableBuilder(
      listenable: widget.state,
      builder: (context, _) => Scaffold(
        appBar: AppBar(
          title: Text(titles[_tab]),
          actions: [
            IconButton(
              key: const Key('aboutButton'),
              tooltip: 'About',
              icon: const Icon(Icons.info_outline),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AboutScreen()),
              ),
            ),
          ],
        ),
        body: IndexedStack(
          index: _tab,
          children: [
            PlannerScreen(state: widget.state),
            PresetsScreen(
              state: widget.state,
              onPick: () => setState(() => _tab = 0),
            ),
            SharesScreen(state: widget.state),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _tab,
          onDestinationSelected: (i) => setState(() => _tab = i),
          destinations: const [
            NavigationDestination(
                icon: Icon(Icons.calculate_outlined),
                selectedIcon: Icon(Icons.calculate),
                label: 'Planner'),
            NavigationDestination(
                icon: Icon(Icons.kitchen_outlined),
                selectedIcon: Icon(Icons.kitchen),
                label: 'Presets'),
            NavigationDestination(
                icon: Icon(Icons.tune_outlined),
                selectedIcon: Icon(Icons.tune),
                label: 'Shares'),
          ],
        ),
      ),
    );
  }
}
