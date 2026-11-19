# kitchen-remodeling-cost: Kitchen Remodeling Cost Planner

Plan a kitchen remodel budget that holds. This package splits a budget across 12 line items
(cabinets, labor, appliances, countertops, flooring, lighting and more), then adds sales tax, a
contingency reserve and a permit allowance. It works both ways:

- **Split**: you know your all-in number. Tax, reserve and permits come out first, the rest is split by line item.
- **Estimate**: you know the construction cost (or pick a preset). Reserve, tax and permits are added on top.

All maths runs in integer cents, so every line adds up exactly to the total. No dependencies, no network.

## Install

```sh
pip install kitchen-remodeling-cost
```

## Library

```python
from kitchen_remodeling_cost import split_budget, estimate_preset, format_table

r = split_budget(60000, permit=1500)          # all-in budget
print(r["lines"][0])  # {'key': 'cabinets', 'label': 'Cabinets and shelving', 'share': 0.25, 'amount': 12053.9}
print(format_table(r))

major = estimate_preset("major-midrange", tax_rate=0.101)
print(major["total"])
```

## Command line

```sh
kitchen-remodeling-cost split 60000 --permit 1500        # split an all-in budget
kitchen-remodeling-cost estimate 50000 --tax 10.1        # add reserve, tax and permits to a construction cost
kitchen-remodeling-cost preset major-upscale             # price a Cost vs Value preset
kitchen-remodeling-cost presets                          # list presets
kitchen-remodeling-cost split 80000 --share cabinets=30  # override a line item share
```

Output of the first command:

```
Line item                   Share      Amount
---------------------------------------------
Cabinets and shelving       25.0%  $12,053.90
Installation and labor      15.0%   $7,232.34
Appliances                  15.0%   $7,232.34
Countertops and backsplash  10.0%   $4,821.56
Flooring                     7.0%   $3,375.09
Lighting                     5.0%   $2,410.78
Painting and drywall         5.0%   $2,410.78
Designer                     5.0%   $2,410.78
Sink and faucet              5.0%   $2,410.78
Doors and windows            4.0%   $1,928.63
Plumbing                     3.0%   $1,446.47
Miscellaneous                1.0%     $482.16
---------------------------------------------
Construction subtotal              $48,215.61
Contingency reserve (10%)           $4,821.56
Sales tax (10.3%)                   $5,462.83
Permit allowance                    $1,500.00
---------------------------------------------
Total                              $60,000.00
```

## Defaults and sources

| Line item | Share |
|---|---|
| Cabinets and shelving | 25% |
| Installation and labor | 15% |
| Appliances | 15% |
| Countertops and backsplash | 10% |
| Flooring | 7% |
| Lighting, Painting and drywall, Designer, Sink and faucet | 5% each |
| Doors and windows | 4% |
| Plumbing | 3% |
| Miscellaneous | 1% |

- Shares: HomeGuide's kitchen remodel cost breakdown. Override any of them; the set is normalised to 100%.
- Presets: Cost vs Value 2025, Pacific region averages for a 200 sq ft kitchen.
  `minor-midrange` $29,728 (permit allowance $500), `major-midrange` $86,480 ($2,500), `major-upscale` $171,950 ($4,000).
- Sales tax default: 10.3%, the Bellevue, WA combined rate for October to December 2026 (WA Department of Revenue).
  Washington charges sales tax on the full contract price, labor included. Pass your own rate for other addresses.
- Contingency reserve default: 10%. Permit allowance is a planning number, not a fee quote.

## Links

- Kitchen remodel cost guides and line-item bids: [Kitchen Remodeling Bellevue](https://wakitchenremodelingbellevue.com/)
- Source and issues: https://github.com/nbkdevs/kitchen-remodeling-bellevue

## License

MIT © Bellevue Kitchen Pros
