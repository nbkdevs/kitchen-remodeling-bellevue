# Kitchen Remodeling Cost Planner

Plan a kitchen remodel budget that holds. Split a budget across 12 line items (cabinets, labor,
appliances, countertops, flooring, lighting and more), then add sales tax, a contingency reserve
and a permit allowance, or start from a Cost vs Value preset. The same integer-cent maths ships as
an Android app, a browser calculator, a Docker API, an agent skill and libraries for seven languages.

Built for homeowners planning a remodel with [Kitchen Remodeling Bellevue](https://wakitchenremodelingbellevue.com/),
where every bid shows sales tax and permit fees as their own lines.

```text
$ npx kitchen-remodeling-cost split 60000 --permit 1500
Line item                   Share      Amount
---------------------------------------------
Cabinets and shelving       25.0%  $12,053.90
Installation and labor      15.0%   $7,232.34
Appliances                  15.0%   $7,232.34
Countertops and backsplash  10.0%   $4,821.56
...
Construction subtotal              $48,215.61
Contingency reserve (10%)           $4,821.56
Sales tax (10.3%)                   $5,462.83
Permit allowance                    $1,500.00
---------------------------------------------
Total                              $60,000.00
```

## What is in this repo

| Path | What |
|---|---|
| `app/` | Flutter (Material 3) Android app "Kitchen Remodeling Cost Planner": planner, presets, line item shares, About. No permissions beyond Flutter's defaults. |
| `packages/npm` | `kitchen-remodeling-cost` (JavaScript library + CLI, TypeScript types) |
| `packages/pypi` | `kitchen-remodeling-cost` (Python library + CLI) |
| `packages/crates` | `kitchen-remodeling-cost` (Rust library + CLI) |
| `packages/pub` | `kitchen_remodeling_cost` (Dart library + CLI; the app uses it) |
| `packages/nuget` | `BellevueKitchenPros.KitchenRemodelingCost` (.NET 8 library, decimal results) |
| `packages/rubygems` | `kitchen-remodeling-cost` (Ruby gem + CLI) |
| `packages/packagist` + `composer.json` | `bellevuekitchenpros/kitchen-remodeling-cost` (PHP 8.1+) |
| `packages/docker` | `iamnazzal/kitchen-remodeling-cost` (JSON API + calculator page) |
| `packages/hf-space` | Hugging Face static Space "Kitchen Remodeling Budget Calculator" |
| `skills/kitchen-remodeling-budget` | ClawHub agent skill (instruction-only) |
| `extensions/` | "Cabinet & Countertop Measure" for Firefox and Edge: countertop area with cutouts, backsplash tile count, cabinet run planner. Zero permissions, offline. |
| `themes/` | "Walnut Morning" Chrome theme |
| `packages/vscode` | "Kitchen Remodeling Cost Planner" VS Code extension: planner panel and a command that inserts the breakdown as a Markdown table |
| `packages/SPEC.md` | The shared arithmetic every package implements (tests pin the same reference values) |

## Where the numbers come from

- Line item shares: HomeGuide kitchen remodel cost breakdown (cabinets 25%, labor 15%, appliances 15%, countertops 10%, flooring 7%, lighting, painting, design and sink 5% each, doors and windows 4%, plumbing 3%, misc 1%).
- Presets: Cost vs Value 2025, Pacific region averages for a 200 sq ft kitchen: minor midrange $29,728, major midrange $86,480, major upscale $171,950.
- Sales tax: 10.3% default, the Bellevue, WA combined rate for October to December 2026 (WA Department of Revenue). Washington taxes the full contract price, labor included.
- Contingency reserve 10% and permit allowances are planning defaults; change them.

## Links

- Kitchen remodel cost guides and line-item bids: [Kitchen Remodeling Bellevue](https://wakitchenremodelingbellevue.com/)
- Privacy: [PRIVACY.md](PRIVACY.md)

## Elsewhere

Published copies of this project:

- GitHub release (APK, AAB, extension and theme zips): https://github.com/nbkdevs/kitchen-remodeling-bellevue/releases/tag/v1.0.0
- npm: https://www.npmjs.com/package/kitchen-remodeling-cost
- PyPI: https://pypi.org/project/kitchen-remodeling-cost/
- crates.io: https://crates.io/crates/kitchen-remodeling-cost (docs: https://docs.rs/kitchen-remodeling-cost)
- pub.dev: https://pub.dev/packages/kitchen_remodeling_cost
- NuGet: https://www.nuget.org/packages/BellevueKitchenPros.KitchenRemodelingCost/
- RubyGems: https://rubygems.org/gems/kitchen-remodeling-cost
- Docker Hub: https://hub.docker.com/r/iamnazzal/kitchen-remodeling-cost
- Hugging Face Space: https://huggingface.co/spaces/iamnazzal/kitchen-remodeling-cost-planner
- ClawHub skill: https://clawhub.ai/nbkdevs/kitchen-remodeling-budget
- Package indexes: https://socket.dev/npm/package/kitchen-remodeling-cost, https://libraries.io/npm/kitchen-remodeling-cost, https://pypistats.org/packages/kitchen-remodeling-cost, https://npm.io/package/kitchen-remodeling-cost
- Packagist: https://packagist.org/packages/bellevuekitchenpros/kitchen-remodeling-cost
- GitLab mirror: https://gitlab.com/nbkdevs/kitchen-remodeling-bellevue
- Amazon Appstore (Android app): https://www.amazon.com/dp/B0HS7KX643 (also on amazon.co.uk, .de, .fr, .it, .es, .co.jp, .ca, .com.br, .com.mx and .com.au under the same ASIN)
- Microsoft Edge Add-ons (Cabinet & Countertop Measure): https://microsoftedge.microsoft.com/addons/detail/cdjemmdfkndnbojdgbhahjdeajkkjafd
- Chrome Web Store (Walnut Morning theme): https://chromewebstore.google.com/detail/nifcpapdpboinfodebbnijhidoepbkfm
- Product Hunt: https://www.producthunt.com/products/kitchen-remodeling-cost-planner

## License

MIT © Bellevue Kitchen Pros
