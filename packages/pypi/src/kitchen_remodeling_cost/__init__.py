"""Kitchen remodeling cost planner: split a kitchen remodel budget by line item and add
sales tax, a contingency reserve and a permit allowance.

More kitchen remodel planning: https://wakitchenremodelingbellevue.com/
"""
from .core import (DEFAULT_CONTINGENCY_RATE, DEFAULT_TAX_RATE, LINE_ITEMS, PRESET_SOURCE, PRESETS,
                   SHARE_SOURCE, estimate, estimate_preset, format_table, money, normalise_shares,
                   split_budget)

__version__ = "1.0.0"
__all__ = ["LINE_ITEMS", "PRESETS", "DEFAULT_TAX_RATE", "DEFAULT_CONTINGENCY_RATE", "PRESET_SOURCE",
           "SHARE_SOURCE", "estimate", "split_budget", "estimate_preset", "normalise_shares",
           "format_table", "money"]
