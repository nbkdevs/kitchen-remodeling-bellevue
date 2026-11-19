# frozen_string_literal: true

require_relative "kitchen_remodeling_cost/version"

# Kitchen remodeling cost planner: split a kitchen remodel budget by line item and add
# sales tax, a contingency reserve and a permit allowance. All maths in integer cents.
# More kitchen remodel planning: https://wakitchenremodelingbellevue.com/
module KitchenRemodelingCost
  class Error < ArgumentError; end

  LINE_ITEMS = [
    ["cabinets", "Cabinets and shelving", 0.25],
    ["labor", "Installation and labor", 0.15],
    ["appliances", "Appliances", 0.15],
    ["countertops", "Countertops and backsplash", 0.10],
    ["flooring", "Flooring", 0.07],
    ["lighting", "Lighting", 0.05],
    ["painting", "Painting and drywall", 0.05],
    ["design", "Designer", 0.05],
    ["sink", "Sink and faucet", 0.05],
    ["doors_windows", "Doors and windows", 0.04],
    ["plumbing", "Plumbing", 0.03],
    ["misc", "Miscellaneous", 0.01]
  ].map(&:freeze).freeze

  PRESETS = {
    "minor-midrange" => { label: "Minor remodel, midrange", construction: 29_728, permit: 500 },
    "major-midrange" => { label: "Major remodel, midrange", construction: 86_480, permit: 2500 },
    "major-upscale" => { label: "Major remodel, upscale", construction: 171_950, permit: 4000 }
  }.freeze

  DEFAULT_TAX_RATE = 0.103
  DEFAULT_CONTINGENCY_RATE = 0.10
  PRESET_SOURCE = "Cost vs Value 2025, Pacific region averages (200 sq ft kitchen)"
  SHARE_SOURCE = "HomeGuide kitchen remodel cost breakdown"

  module_function

  def rnd(x)
    (x + 0.5).floor
  end

  def num(name, v, max = nil)
    raise Error, "#{name} must be a finite number >= 0" unless v.is_a?(Numeric) && v.to_f.finite? && v >= 0
    raise Error, "#{name} must be <= #{max}" if max && v > max

    v.to_f
  end

  # Defaults merged with overrides ({key => weight}), normalised to sum to 1.
  def normalise_shares(overrides = nil)
    items = LINE_ITEMS.map { |k, l, s| { key: k, label: l, share: s } }
    (overrides || {}).each do |k, v|
      it = items.find { |i| i[:key] == k.to_s } or raise Error, "unknown line item: #{k}"
      it[:share] = num("share #{k}", v)
    end
    sum = 0.0
    items.each { |i| sum += i[:share] }
    raise Error, "shares must not all be zero" unless sum.positive?

    items.each { |i| i[:share] /= sum }
  end

  def allocate(cents, items)
    rows = items.each_with_index.map do |it, idx|
      raw = cents * it[:share]
      base = raw.floor
      it.merge(idx: idx, cents: base, frac: raw - base)
    end
    left = cents - rows.sum { |r| r[:cents] }
    order = rows.sort_by { |r| [-r[:frac], r[:idx]] }
    j = 0
    while left.positive?
      order[j % order.size][:cents] += 1
      j += 1
      left -= 1
    end
    rows.map { |r| { key: r[:key], label: r[:label], share: r[:share], amount: r[:cents] / 100.0 } }
  end

  def opts(tax_rate, contingency_rate, permit, shares)
    [num("tax_rate", tax_rate, 1), num("contingency_rate", contingency_rate, 1), num("permit", permit),
     normalise_shares(shares)]
  end

  def result(mode, c, k, t, p, tax, cont, items)
    { mode: mode, lines: allocate(c, items), construction: c / 100.0, contingency: k / 100.0,
      tax: t / 100.0, permit: p / 100.0, total: (c + k + t + p) / 100.0,
      tax_rate: tax, contingency_rate: cont }
  end

  # Forward estimate from a construction (pre-tax) cost.
  def estimate(construction, tax_rate: DEFAULT_TAX_RATE, contingency_rate: DEFAULT_CONTINGENCY_RATE,
               permit: 0, shares: nil)
    tax, cont, perm, items = opts(tax_rate, contingency_rate, permit, shares)
    c = rnd(num("construction", construction) * 100)
    k = rnd(c * cont)
    t = rnd((c + k) * tax)
    result("estimate", c, k, t, rnd(perm * 100), tax, cont, items)
  end

  # Split an all-in budget (tax, reserve and permits included) into line items.
  def split_budget(total, tax_rate: DEFAULT_TAX_RATE, contingency_rate: DEFAULT_CONTINGENCY_RATE,
                   permit: 0, shares: nil)
    tax, cont, perm, items = opts(tax_rate, contingency_rate, permit, shares)
    p = rnd(perm * 100)
    a = rnd(num("total", total) * 100) - p
    raise Error, "total must be larger than the permit allowance" unless a.positive?

    c = rnd(a / ((1 + cont) * (1 + tax)))
    k = rnd(c * cont)
    t = rnd((c + k) * tax)
    k += a - c - k - t
    result("split", c, k, t, p, tax, cont, items)
  end

  # Estimate a Cost vs Value preset; permit: overrides the preset allowance.
  def estimate_preset(name, tax_rate: DEFAULT_TAX_RATE, contingency_rate: DEFAULT_CONTINGENCY_RATE,
                      permit: nil, shares: nil)
    p = PRESETS[name.to_s] or raise Error, "unknown preset: #{name} (use #{PRESETS.keys.join(", ")})"
    r = estimate(p[:construction], tax_rate: tax_rate, contingency_rate: contingency_rate,
                                   permit: permit || p[:permit], shares: shares)
    { preset: name.to_s, label: p[:label] }.merge(r)
  end

  def money(v)
    c = rnd(v * 100)
    d = (c / 100).to_s.reverse.scan(/\d{1,3}/).join(",").reverse
    format("$%<d>s.%<r>02d", d: d, r: c % 100)
  end

  def pct(rate)
    format("%.2f", rate * 100).sub(/0+\z/, "").sub(/\.\z/, "")
  end

  # Plain-text itemised table.
  def format_table(r)
    rows = r[:lines].map { |l| [l[:label], format("%.1f%%", l[:share] * 100), money(l[:amount])] }
    rows << ["Construction subtotal", "", money(r[:construction])]
    rows << ["Contingency reserve (#{pct(r[:contingency_rate])}%)", "", money(r[:contingency])]
    rows << ["Sales tax (#{pct(r[:tax_rate])}%)", "", money(r[:tax])]
    rows << ["Permit allowance", "", money(r[:permit])]
    rows << ["Total", "", money(r[:total])]
    head = ["Line item", "Share", "Amount"]
    w = (0..2).map { |c| ([head[c].size] + rows.map { |x| x[c].size }).max }
    line = ->(x) { "#{x[0].ljust(w[0])}  #{x[1].rjust(w[1])}  #{x[2].rjust(w[2])}" }
    sep = "-" * (w.sum + 4)
    body = rows.map(&line)
    body.insert(r[:lines].size, sep)
    body.insert(body.size - 1, sep)
    [line.call(head), sep, *body].join("\n")
  end
end
