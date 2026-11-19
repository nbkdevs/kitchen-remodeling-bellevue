import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app_info.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  Future<void> _open(String url) =>
      launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('About')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: CircleAvatar(
              radius: 40,
              backgroundColor: cs.primaryContainer,
              child: Icon(Icons.kitchen, size: 44, color: cs.onPrimaryContainer),
            ),
          ),
          const SizedBox(height: 12),
          Center(child: Text(AppInfo.name, style: t.headlineSmall, textAlign: TextAlign.center)),
          Center(child: Text('Version ${AppInfo.version}', style: t.bodySmall)),
          const SizedBox(height: 16),
          Text(
            'Plan a kitchen remodel budget that holds. Split your budget across 12 line items, '
            'add sales tax, a contingency reserve and a permit allowance, or start from a Cost vs Value '
            'preset. Everything is calculated on your phone; nothing is sent anywhere.',
            style: t.bodyLarge,
          ),
          const SizedBox(height: 20),
          Text('Kitchen remodel cost guides and written, line-item bids:', style: t.titleSmall),
          TextButton(
            key: const Key('siteLink'),
            style: TextButton.styleFrom(alignment: Alignment.centerLeft),
            onPressed: () => _open(AppInfo.siteUrl),
            child: const Text(
              AppInfo.siteAnchor,
              style: TextStyle(decoration: TextDecoration.underline, fontSize: 16),
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('Privacy policy'),
            onTap: () => _open(AppInfo.privacyUrl),
          ),
          ListTile(
            leading: const Icon(Icons.code),
            title: const Text('Source code (MIT)'),
            subtitle: const Text(AppInfo.sourceUrl),
            onTap: () => _open(AppInfo.sourceUrl),
          ),
          const SizedBox(height: 8),
          Text(
            'Figures are planning estimates, not a quote. Sources: HomeGuide kitchen remodel cost '
            'breakdown; Cost vs Value 2025 (Pacific region); WA Department of Revenue rate table.',
            style: t.bodySmall,
          ),
        ],
      ),
    );
  }
}
