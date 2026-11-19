"""Command line: kitchen-remodeling-cost split 60000 --permit 1500"""
import argparse
import json
import sys

from . import core


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="kitchen-remodeling-cost",
                                 description="Kitchen remodeling budget planner: line items, sales tax, reserve, permits.")
    ap.add_argument("command", choices=["split", "estimate", "preset", "presets"])
    ap.add_argument("value", nargs="?", help="amount in dollars, or preset name")
    ap.add_argument("--tax", type=float, help=f"sales tax percent (default {core.DEFAULT_TAX_RATE * 100:g})")
    ap.add_argument("--contingency", type=float, help=f"reserve percent (default {core.DEFAULT_CONTINGENCY_RATE * 100:g})")
    ap.add_argument("--permit", type=float, help="permit allowance in dollars")
    ap.add_argument("--share", action="append", default=[], metavar="KEY=PERCENT", help="override a line item share")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    if a.command == "presets":
        for name, p in core.PRESETS.items():
            print(f"{name:<15} {p['label']:<26} {core.money(p['construction'])}  permit {core.money(p['permit'])}")
        print(f"Source: {core.PRESET_SOURCE}")
        return 0
    if a.value is None:
        ap.error("value is required")
    kw = dict(tax_rate=None if a.tax is None else a.tax / 100,
              contingency_rate=None if a.contingency is None else a.contingency / 100,
              permit=a.permit,
              shares={k: float(v) for k, v in (s.split("=", 1) for s in a.share)} or None)
    try:
        if a.command == "split":
            r = core.split_budget(float(a.value), **kw)
        elif a.command == "estimate":
            r = core.estimate(float(a.value), **kw)
        else:
            r = core.estimate_preset(a.value, **kw)
    except ValueError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    print(json.dumps(r, indent=2) if a.json else core.format_table(r))
    return 0


if __name__ == "__main__":
    sys.exit(main())
