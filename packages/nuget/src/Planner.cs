using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;

namespace BellevueKitchenPros.KitchenRemodelingCost;

/// <summary>A default line item and its share of the construction budget.</summary>
public sealed record LineItem(string Key, string Label, double Share);

/// <summary>A Cost vs Value preset (Pacific region averages).</summary>
public sealed record Preset(string Key, string Label, double Construction, double Permit);

/// <summary>One computed line.</summary>
public sealed record Line(string Key, string Label, double Share, decimal Amount);

/// <summary>Full calculation result. Money values are exact to the cent.</summary>
public sealed record Breakdown(
    string Mode, IReadOnlyList<Line> Lines, decimal Construction, decimal Contingency,
    decimal Tax, decimal Permit, decimal Total, double TaxRate, double ContingencyRate);

/// <summary>Calculation options.</summary>
public sealed record PlannerOptions
{
    public double TaxRate { get; init; } = Planner.DefaultTaxRate;
    public double ContingencyRate { get; init; } = Planner.DefaultContingencyRate;
    public double Permit { get; init; }
    /// <summary>Share overrides (key to weight), merged into the defaults and normalised.</summary>
    public IReadOnlyDictionary<string, double>? Shares { get; init; }
}

/// <summary>Kitchen remodeling cost planner.</summary>
public static class Planner
{
    public const double DefaultTaxRate = 0.103;
    public const double DefaultContingencyRate = 0.10;
    public const string PresetSource = "Cost vs Value 2025, Pacific region averages (200 sq ft kitchen)";
    public const string ShareSource = "HomeGuide kitchen remodel cost breakdown";

    public static readonly IReadOnlyList<LineItem> LineItems = new[]
    {
        new LineItem("cabinets", "Cabinets and shelving", 0.25),
        new LineItem("labor", "Installation and labor", 0.15),
        new LineItem("appliances", "Appliances", 0.15),
        new LineItem("countertops", "Countertops and backsplash", 0.10),
        new LineItem("flooring", "Flooring", 0.07),
        new LineItem("lighting", "Lighting", 0.05),
        new LineItem("painting", "Painting and drywall", 0.05),
        new LineItem("design", "Designer", 0.05),
        new LineItem("sink", "Sink and faucet", 0.05),
        new LineItem("doors_windows", "Doors and windows", 0.04),
        new LineItem("plumbing", "Plumbing", 0.03),
        new LineItem("misc", "Miscellaneous", 0.01),
    };

    public static readonly IReadOnlyList<Preset> Presets = new[]
    {
        new Preset("minor-midrange", "Minor remodel, midrange", 29728, 500),
        new Preset("major-midrange", "Major remodel, midrange", 86480, 2500),
        new Preset("major-upscale", "Major remodel, upscale", 171950, 4000),
    };

    private static long R(double x) => (long)Math.Floor(x + 0.5);

    private static double Num(string name, double v, double? max = null)
    {
        if (double.IsNaN(v) || double.IsInfinity(v) || v < 0)
            throw new ArgumentOutOfRangeException(name, $"{name} must be a finite number >= 0");
        if (max is double m && v > m) throw new ArgumentOutOfRangeException(name, $"{name} must be <= {m}");
        return v;
    }

    /// <summary>Defaults merged with overrides, normalised to sum to 1.</summary>
    public static IReadOnlyList<LineItem> NormaliseShares(IReadOnlyDictionary<string, double>? overrides = null)
    {
        var shares = LineItems.ToDictionary(i => i.Key, i => i.Share);
        if (overrides != null)
            foreach (var kv in overrides)
            {
                if (!shares.ContainsKey(kv.Key)) throw new ArgumentException($"unknown line item: {kv.Key}");
                shares[kv.Key] = Num("share " + kv.Key, kv.Value);
            }
        double sum = 0;
        foreach (var i in LineItems) sum += shares[i.Key];
        if (sum <= 0) throw new ArgumentException("shares must not all be zero");
        return LineItems.Select(i => new LineItem(i.Key, i.Label, shares[i.Key] / sum)).ToList();
    }

    private static List<Line> Allocate(long cents, IReadOnlyList<LineItem> items)
    {
        var bases = new long[items.Count];
        var frac = new List<(int Idx, double Frac)>();
        for (int i = 0; i < items.Count; i++)
        {
            double raw = cents * items[i].Share;
            double b = Math.Floor(raw);
            bases[i] = (long)b;
            frac.Add((i, raw - b));
        }
        long left = cents - bases.Sum();
        var order = frac.OrderByDescending(f => f.Frac).ThenBy(f => f.Idx).ToList();
        for (int j = 0; left > 0; j++, left--) bases[order[j % order.Count].Idx] += 1;
        return items.Select((it, i) => new Line(it.Key, it.Label, it.Share, bases[i] / 100m)).ToList();
    }

    private static Breakdown Result(string mode, long c, long k, long t, long p, double tax, double cont, IReadOnlyList<LineItem> items) =>
        new(mode, Allocate(c, items), c / 100m, k / 100m, t / 100m, p / 100m, (c + k + t + p) / 100m, tax, cont);

    /// <summary>Forward estimate from a construction (pre-tax) cost.</summary>
    public static Breakdown Estimate(double construction, PlannerOptions? options = null)
    {
        var o = options ?? new PlannerOptions();
        double tax = Num("TaxRate", o.TaxRate, 1), cont = Num("ContingencyRate", o.ContingencyRate, 1);
        var items = NormaliseShares(o.Shares);
        long c = R(Num("construction", construction) * 100);
        long k = R(c * cont);
        long t = R((c + k) * tax);
        return Result("estimate", c, k, t, R(Num("Permit", o.Permit) * 100), tax, cont, items);
    }

    /// <summary>Split an all-in budget (tax, reserve and permits included) into line items.</summary>
    public static Breakdown SplitBudget(double total, PlannerOptions? options = null)
    {
        var o = options ?? new PlannerOptions();
        double tax = Num("TaxRate", o.TaxRate, 1), cont = Num("ContingencyRate", o.ContingencyRate, 1);
        var items = NormaliseShares(o.Shares);
        long p = R(Num("Permit", o.Permit) * 100);
        long a = R(Num("total", total) * 100) - p;
        if (a <= 0) throw new ArgumentException("total must be larger than the permit allowance");
        long c = R(a / ((1 + cont) * (1 + tax)));
        long k = R(c * cont);
        long t = R((c + k) * tax);
        k += a - c - k - t;
        return Result("split", c, k, t, p, tax, cont, items);
    }

    /// <summary>Estimate a preset. <paramref name="permit"/> overrides the preset allowance.</summary>
    public static Breakdown EstimatePreset(string key, PlannerOptions? options = null, double? permit = null)
    {
        var p = Presets.FirstOrDefault(x => x.Key == key)
            ?? throw new ArgumentException($"unknown preset: {key} (use {string.Join(", ", Presets.Select(x => x.Key))})");
        var o = (options ?? new PlannerOptions()) with { Permit = permit ?? p.Permit };
        return Estimate(p.Construction, o);
    }

    /// <summary>Formats as $12,345.67.</summary>
    public static string Money(decimal v) => "$" + v.ToString("#,##0.00", CultureInfo.InvariantCulture);

    private static string Pct(double rate) => (rate * 100).ToString("0.##", CultureInfo.InvariantCulture);

    /// <summary>Plain-text itemised table.</summary>
    public static string FormatTable(Breakdown r)
    {
        var rows = r.Lines.Select(l => new[] { l.Label, (l.Share * 100).ToString("0.0", CultureInfo.InvariantCulture) + "%", Money(l.Amount) }).ToList();
        rows.Add(new[] { "Construction subtotal", "", Money(r.Construction) });
        rows.Add(new[] { $"Contingency reserve ({Pct(r.ContingencyRate)}%)", "", Money(r.Contingency) });
        rows.Add(new[] { $"Sales tax ({Pct(r.TaxRate)}%)", "", Money(r.Tax) });
        rows.Add(new[] { "Permit allowance", "", Money(r.Permit) });
        rows.Add(new[] { "Total", "", Money(r.Total) });
        var head = new[] { "Line item", "Share", "Amount" };
        var w = Enumerable.Range(0, 3).Select(c => Math.Max(head[c].Length, rows.Max(x => x[c].Length))).ToArray();
        string L(string[] x) => $"{x[0].PadRight(w[0])}  {x[1].PadLeft(w[1])}  {x[2].PadLeft(w[2])}";
        var sep = new string('-', w.Sum() + 4);
        var body = rows.Select(L).ToList();
        body.Insert(r.Lines.Count, sep);
        body.Insert(body.Count - 1, sep);
        var sb = new StringBuilder();
        sb.Append(L(head)).Append('\n').Append(sep);
        foreach (var b in body) sb.Append('\n').Append(b);
        return sb.ToString();
    }
}
