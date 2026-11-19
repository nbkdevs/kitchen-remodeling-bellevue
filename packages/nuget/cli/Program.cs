using System.Globalization;
using BellevueKitchenPros.KitchenRemodelingCost;

var pos = new List<string>();
double tax = Planner.DefaultTaxRate, cont = Planner.DefaultContingencyRate;
double? permit = null;
var shares = new Dictionary<string, double>();
double D(string s) => double.Parse(s, CultureInfo.InvariantCulture);
try
{
    for (int i = 0; i < args.Length; i++)
    {
        string Val() => i + 1 < args.Length ? args[++i] : throw new ArgumentException($"{args[i]} needs a value");
        switch (args[i])
        {
            case "--tax": tax = D(Val()) / 100; break;
            case "--contingency": cont = D(Val()) / 100; break;
            case "--permit": permit = D(Val()); break;
            case "--share": var kv = Val().Split('='); shares[kv[0]] = D(kv[1]); break;
            default: pos.Add(args[i]); break;
        }
    }
    var o = new PlannerOptions { TaxRate = tax, ContingencyRate = cont, Permit = permit ?? 0, Shares = shares.Count > 0 ? shares : null };
    var cmd = pos.ElementAtOrDefault(0) ?? "";
    var val = pos.ElementAtOrDefault(1) ?? "";
    Breakdown r;
    switch (cmd)
    {
        case "presets":
            foreach (var p in Planner.Presets)
                Console.WriteLine($"{p.Key,-15} {p.Label,-26} {Planner.Money((decimal)p.Construction)}  permit {Planner.Money((decimal)p.Permit)}");
            Console.WriteLine($"Source: {Planner.PresetSource}");
            return 0;
        case "split": r = Planner.SplitBudget(D(val), o); break;
        case "estimate": r = Planner.Estimate(D(val), o); break;
        case "preset": r = Planner.EstimatePreset(val, o, permit); break;
        default:
            Console.WriteLine("Usage: kitchen-remodeling-cost split|estimate <amount> | preset <name> | presets [--tax %] [--contingency %] [--permit $] [--share key=%]");
            return 0;
    }
    Console.WriteLine(Planner.FormatTable(r));
    return 0;
}
catch (Exception e) when (e is ArgumentException or FormatException)
{
    Console.Error.WriteLine($"error: {e.Message}");
    return 1;
}
