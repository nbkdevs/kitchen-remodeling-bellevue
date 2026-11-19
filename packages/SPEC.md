# Kitchen Remodeling Cost Planner: shared spec

Every package (npm, PyPI, crates.io, pub.dev, NuGet, RubyGems, Packagist, Docker, HF Space, Flutter app)
implements the same maths so results match to the cent.

## Data

Line items and default shares of the construction budget (HomeGuide kitchen remodel cost breakdown,
as cited on the Kitchen Remodeling Bellevue cost page):

| key | label | share |
|---|---|---|
| cabinets | Cabinets and shelving | 25% |
| labor | Installation and labor | 15% |
| appliances | Appliances | 15% |
| countertops | Countertops and backsplash | 10% |
| flooring | Flooring | 7% |
| lighting | Lighting | 5% |
| painting | Painting and drywall | 5% |
| design | Designer | 5% |
| sink | Sink and faucet | 5% |
| doors_windows | Doors and windows | 4% |
| plumbing | Plumbing | 3% |
| misc | Miscellaneous | 1% |

Presets (Cost vs Value 2025, Pacific region averages, 200 sq ft kitchen) with an editable permit allowance:

| key | label | construction | permit allowance |
|---|---|---|---|
| minor-midrange | Minor remodel, midrange | 29,728 | 500 |
| major-midrange | Major remodel, midrange | 86,480 | 2,500 |
| major-upscale | Major remodel, upscale | 171,950 | 4,000 |

Defaults: sales tax 10.3% (Bellevue combined rate, WA DOR, Oct to Dec 2026; Washington taxes the full
contract price, labor included), contingency reserve 10%, permit allowance 0 unless given or set by a preset.

## Arithmetic (integer cents)

`round(x) = floor(x + 0.5)`.

**estimate(construction, tax, contingency, permit)**
- C = round(construction * 100)
- K = round(C * contingency)
- T = round((C + K) * tax)
- P = round(permit * 100)
- total = C + K + T + P

**split(total, tax, contingency, permit)** (budget is all-in)
- A = round(total * 100) - P; error if A <= 0
- C = round(A / ((1 + contingency) * (1 + tax)))
- K = round(C * contingency); T = round((C + K) * tax)
- K += A - C - K - T  (the reserve absorbs rounding cents so the total matches exactly)

**Line items**: shares are normalised to sum to 1. raw_i = C * share_i; base_i = floor(raw_i);
the leftover cents go one each to the items with the largest fractional part (ties: table order).

Errors: negative or non-finite numbers, tax or contingency outside 0..1 (0..100%), unknown preset,
all-zero shares.
