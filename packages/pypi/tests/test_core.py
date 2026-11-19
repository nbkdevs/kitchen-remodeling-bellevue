import pytest

import kitchen_remodeling_cost as k
from kitchen_remodeling_cost.cli import main


def cents(r):
    return round(sum(l["amount"] * 100 for l in r["lines"]))


def test_estimate():
    r = k.estimate(60000, permit=1500)
    assert (r["construction"], r["contingency"], r["tax"], r["total"]) == (60000, 6000, 6798, 74298)
    assert r["lines"][0]["amount"] == 15000
    assert cents(r) == 6000000


def test_split_reference():
    r = k.split_budget(100000, permit=2500)
    assert (r["construction"], r["contingency"], r["tax"]) == (80359.35, 8035.94, 9104.71)
    assert r["lines"][0]["amount"] == 20089.84


def test_split_exact_total():
    for t in (10000, 33333.33, 60000, 98765.43, 250000):
        r = k.split_budget(t, permit=1000)
        assert round(r["total"] * 100) == round(t * 100)
        assert cents(r) == round(r["construction"] * 100)


def test_rounding_ties():
    r = k.split_budget(33333.33)
    assert (r["construction"], r["contingency"], r["tax"]) == (27473.28, 2747.33, 3112.72)
    assert r["lines"][6]["amount"] == 1373.67
    assert r["lines"][7]["amount"] == 1373.66


def test_presets():
    r = k.estimate_preset("major-midrange")
    assert (r["permit"], r["tax"], r["total"]) == (2500, 9798.18, 107426.18)
    with pytest.raises(ValueError):
        k.estimate_preset("nope")


def test_validation_and_shares():
    with pytest.raises(ValueError):
        k.estimate(-1)
    with pytest.raises(ValueError):
        k.estimate(1, tax_rate=2)
    with pytest.raises(ValueError):
        k.split_budget(100, permit=200)
    with pytest.raises(ValueError):
        k.estimate(1, shares={"garage": 1})
    r = k.estimate(1000, tax_rate=0, contingency_rate=0, shares={"cabinets": 50})
    assert r["lines"][0]["share"] > 0.5 and cents(r) == 100000


def test_table_and_cli(capsys):
    t = k.format_table(k.estimate(60000, permit=1500))
    assert "Cabinets and shelving       25.0%  $15,000.00" in t
    assert "$74,298.00" in t
    assert main(["split", "60000", "--permit", "1500"]) == 0
    assert "$60,000.00" in capsys.readouterr().out
