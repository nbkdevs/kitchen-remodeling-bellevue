# frozen_string_literal: true

require "minitest/autorun"
require_relative "../lib/kitchen_remodeling_cost"

class KitchenRemodelingCostTest < Minitest::Test
  K = KitchenRemodelingCost

  def cents(r) = r[:lines].sum { |l| (l[:amount] * 100).round }

  def test_estimate
    r = K.estimate(60_000, permit: 1500)
    assert_equal [60_000.0, 6000.0, 6798.0, 74_298.0], r.values_at(:construction, :contingency, :tax, :total)
    assert_equal 15_000.0, r[:lines][0][:amount]
    assert_equal 6_000_000, cents(r)
  end

  def test_split_reference
    r = K.split_budget(100_000, permit: 2500)
    assert_equal [80_359.35, 8035.94, 9104.71], r.values_at(:construction, :contingency, :tax)
    assert_equal 20_089.84, r[:lines][0][:amount]
  end

  def test_split_exact
    [10_000, 33_333.33, 60_000, 98_765.43, 250_000].each do |t|
      r = K.split_budget(t, permit: 1000)
      assert_equal (t * 100).round, (r[:total] * 100).round
      assert_equal (r[:construction] * 100).round, cents(r)
    end
  end

  def test_ties
    r = K.split_budget(33_333.33)
    assert_equal [27_473.28, 2747.33, 3112.72], r.values_at(:construction, :contingency, :tax)
    assert_equal 1373.67, r[:lines][6][:amount]
    assert_equal 1373.66, r[:lines][7][:amount]
  end

  def test_presets_and_errors
    r = K.estimate_preset("major-midrange")
    assert_equal [2500.0, 9798.18, 107_426.18], r.values_at(:permit, :tax, :total)
    assert_raises(K::Error) { K.estimate_preset("nope") }
    assert_raises(K::Error) { K.estimate(-1) }
    assert_raises(K::Error) { K.estimate(1, tax_rate: 2) }
    assert_raises(K::Error) { K.split_budget(100, permit: 200) }
    assert_raises(K::Error) { K.estimate(1, shares: { "garage" => 1 }) }
    s = K.estimate(1000, tax_rate: 0, contingency_rate: 0, shares: { "cabinets" => 50 })
    assert s[:lines][0][:share] > 0.5
    assert_equal 100_000, cents(s)
  end

  def test_table
    t = K.format_table(K.estimate(60_000, permit: 1500))
    assert_includes t, "Cabinets and shelving       25.0%  $15,000.00"
    assert_includes t, "$74,298.00"
    assert_equal "$1,234,567.89", K.money(1_234_567.891)
  end
end
