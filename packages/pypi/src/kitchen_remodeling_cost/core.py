"""Kitchen remodeling cost planner core. All arithmetic in integer cents."""
from __future__ import annotations

import math
from typing import Dict, List, Mapping, Optional

LINE_ITEMS = (
    ("cabinets", "Cabinets and shelving", 0.25),
    ("labor", "Installation and labor", 0.15),
    ("appliances", "Appliances", 0.15),
    ("countertops", "Countertops and backsplash", 0.10),
    ("flooring", "Flooring", 0.07),
    ("lighting", "Lighting", 0.05),
    ("painting", "Painting and drywall", 0.05),
    ("design", "Designer", 0.05),
    ("sink", "Sink and faucet", 0.05),
    ("doors_windows", "Doors and windows", 0.04),
    ("plumbing", "Plumbing", 0.03),
    ("misc", "Miscellaneous", 0.01),
)

PRESETS = {
    "minor-midrange": {"label": "Minor remodel, midrange", "construction": 29728, "permit": 500},
    "major-midrange": {"label": "Major remodel, midrange", "construction": 86480, "permit": 2500},
    "major-upscale": {"label": "Major remodel, upscale", "construction": 171950, "permit": 4000},
}

DEFAULT_TAX_RATE = 0.103
DEFAULT_CONTINGENCY_RATE = 0.10
PRESET_SOURCE = "Cost vs Value 2025, Pacific region averages (200 sq ft kitchen)"
SHARE_SOURCE = "HomeGuide kitchen remodel cost breakdown"


def _round(x: float) -> int:
    return int(math.floor(x + 0.5))


def _num(name: str, v, maximum: Optional[float] = None) -> float:
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or v < 0:
        raise ValueError(f"{name} must be a finite number >= 0")
    if maximum is not None and v > maximum:
        raise ValueError(f"{name} must be <= {maximum}")
    return float(v)


def normalise_shares(overrides: Optional[Mapping[str, float]] = None) -> List[dict]:
    """Merge share overrides into the defaults and normalise them to sum to 1."""
    items = [{"key": k, "label": l, "share": s} for k, l, s in LINE_ITEMS]
    for k, v in (overrides or {}).items():
        match = [i for i in items if i["key"] == k]
        if not match:
            raise ValueError(f"unknown line item: {k}")
        match[0]["share"] = _num(f"share {k}", v)
    total = 0.0
    for i in items:
        total += i["share"]
    if total <= 0:
        raise ValueError("shares must not all be zero")
    for i in items:
        i["share"] = i["share"] / total
    return items


def _allocate(cents: int, items: List[dict]) -> List[dict]:
    rows = []
    for idx, it in enumerate(items):
        raw = cents * it["share"]
        base = math.floor(raw)
        rows.append({"idx": idx, "key": it["key"], "label": it["label"], "share": it["share"],
                     "cents": int(base), "frac": raw - base})
    left = cents - sum(r["cents"] for r in rows)
    order = sorted(rows, key=lambda r: (-r["frac"], r["idx"]))
    i = 0
    while left > 0:
        order[i % len(order)]["cents"] += 1
        i += 1
        left -= 1
    return [{"key": r["key"], "label": r["label"], "share": r["share"], "amount": r["cents"] / 100}
            for r in rows]


def _opts(tax_rate, contingency_rate, permit, shares):
    return (
        _num("tax_rate", DEFAULT_TAX_RATE if tax_rate is None else tax_rate, 1),
        _num("contingency_rate", DEFAULT_CONTINGENCY_RATE if contingency_rate is None else contingency_rate, 1),
        _num("permit", 0 if permit is None else permit),
        normalise_shares(shares),
    )


def _result(mode, c, k, t, p, tax, cont, items) -> Dict:
    return {
        "mode": mode,
        "lines": _allocate(c, items),
        "construction": c / 100,
        "contingency": k / 100,
        "tax": t / 100,
        "permit": p / 100,
        "total": (c + k + t + p) / 100,
        "tax_rate": tax,
        "contingency_rate": cont,
    }


def estimate(construction: float, tax_rate: Optional[float] = None, contingency_rate: Optional[float] = None,
             permit: Optional[float] = None, shares: Optional[Mapping[str, float]] = None) -> Dict:
    """Forward estimate from a construction (pre-tax) cost."""
    tax, cont, perm, items = _opts(tax_rate, contingency_rate, permit, shares)
    c = _round(_num("construction", construction) * 100)
    k = _round(c * cont)
    t = _round((c + k) * tax)
    return _result("estimate", c, k, t, _round(perm * 100), tax, cont, items)


def split_budget(total: float, tax_rate: Optional[float] = None, contingency_rate: Optional[float] = None,
                 permit: Optional[float] = None, shares: Optional[Mapping[str, float]] = None) -> Dict:
    """Split an all-in budget (tax, reserve and permits included) into line items."""
    tax, cont, perm, items = _opts(tax_rate, contingency_rate, permit, shares)
    p = _round(perm * 100)
    a = _round(_num("total", total) * 100) - p
    if a <= 0:
        raise ValueError("total must be larger than the permit allowance")
    c = _round(a / ((1 + cont) * (1 + tax)))
    k = _round(c * cont)
    t = _round((c + k) * tax)
    k += a - c - k - t
    return _result("split", c, k, t, p, tax, cont, items)


def estimate_preset(name: str, tax_rate: Optional[float] = None, contingency_rate: Optional[float] = None,
                    permit: Optional[float] = None, shares: Optional[Mapping[str, float]] = None) -> Dict:
    """Estimate a Cost vs Value preset; ``permit`` overrides the preset allowance."""
    if name not in PRESETS:
        raise ValueError(f"unknown preset: {name} (use {', '.join(PRESETS)})")
    p = PRESETS[name]
    r = estimate(p["construction"], tax_rate, contingency_rate, p["permit"] if permit is None else permit, shares)
    return {"preset": name, "label": p["label"], **r}


def money(v: float) -> str:
    return f"${v:,.2f}"


def _pct(rate: float) -> str:
    s = f"{rate * 100:.2f}".rstrip("0").rstrip(".")
    return s


def format_table(r: Dict) -> str:
    """Plain-text itemised table."""
    rows = [[l["label"], f"{l['share'] * 100:.1f}%", money(l["amount"])] for l in r["lines"]]
    rows.append(["Construction subtotal", "", money(r["construction"])])
    rows.append([f"Contingency reserve ({_pct(r['contingency_rate'])}%)", "", money(r["contingency"])])
    rows.append([f"Sales tax ({_pct(r['tax_rate'])}%)", "", money(r["tax"])])
    rows.append(["Permit allowance", "", money(r["permit"])])
    rows.append(["Total", "", money(r["total"])])
    head = ["Line item", "Share", "Amount"]
    w = [max(len(head[c]), *(len(x[c]) for x in rows)) for c in range(3)]
    line = lambda x: f"{x[0].ljust(w[0])}  {x[1].rjust(w[1])}  {x[2].rjust(w[2])}"
    sep = "-" * (sum(w) + 4)
    body = [line(x) for x in rows]
    body.insert(len(r["lines"]), sep)
    body.insert(len(body) - 1, sep)
    return "\n".join([line(head), sep, *body])
