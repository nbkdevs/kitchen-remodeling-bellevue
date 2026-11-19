using BellevueKitchenPros.KitchenRemodelingCost;
using Xunit;

public class PlannerTests
{
    static decimal Sum(Breakdown r) => r.Lines.Sum(l => l.Amount);

    [Fact]
    public void EstimateReference()
    {
        var r = Planner.Estimate(60000, new PlannerOptions { Permit = 1500 });
        Assert.Equal((60000m, 6000m, 6798m, 74298m), (r.Construction, r.Contingency, r.Tax, r.Total));
        Assert.Equal(15000m, r.Lines[0].Amount);
        Assert.Equal(60000m, Sum(r));
    }

    [Fact]
    public void SplitReference()
    {
        var r = Planner.SplitBudget(100000, new PlannerOptions { Permit = 2500 });
        Assert.Equal((80359.35m, 8035.94m, 9104.71m), (r.Construction, r.Contingency, r.Tax));
        Assert.Equal(20089.84m, r.Lines[0].Amount);
    }

    [Theory]
    [InlineData(10000)] [InlineData(33333.33)] [InlineData(60000)] [InlineData(98765.43)] [InlineData(250000)]
    public void SplitMatchesTotal(double t)
    {
        var r = Planner.SplitBudget(t, new PlannerOptions { Permit = 1000 });
        Assert.Equal((decimal)Math.Round(t, 2), r.Total);
        Assert.Equal(r.Construction, Sum(r));
    }

    [Fact]
    public void Ties()
    {
        var r = Planner.SplitBudget(33333.33);
        Assert.Equal((27473.28m, 2747.33m, 3112.72m), (r.Construction, r.Contingency, r.Tax));
        Assert.Equal(1373.67m, r.Lines[6].Amount);
        Assert.Equal(1373.66m, r.Lines[7].Amount);
    }

    [Fact]
    public void PresetsAndErrors()
    {
        var r = Planner.EstimatePreset("major-midrange");
        Assert.Equal((2500m, 9798.18m, 107426.18m), (r.Permit, r.Tax, r.Total));
        Assert.Throws<ArgumentException>(() => Planner.EstimatePreset("nope"));
        Assert.Throws<ArgumentOutOfRangeException>(() => Planner.Estimate(-1));
        Assert.Throws<ArgumentOutOfRangeException>(() => Planner.Estimate(1, new PlannerOptions { TaxRate = 2 }));
        Assert.Throws<ArgumentException>(() => Planner.SplitBudget(100, new PlannerOptions { Permit = 200 }));
        Assert.Throws<ArgumentException>(() => Planner.Estimate(1, new PlannerOptions { Shares = new Dictionary<string, double> { ["garage"] = 1 } }));
        var s = Planner.Estimate(1000, new PlannerOptions { TaxRate = 0, ContingencyRate = 0, Shares = new Dictionary<string, double> { ["cabinets"] = 50 } });
        Assert.True(s.Lines[0].Share > 0.5);
        Assert.Equal(1000m, Sum(s));
    }

    [Fact]
    public void Table()
    {
        var t = Planner.FormatTable(Planner.Estimate(60000, new PlannerOptions { Permit = 1500 }));
        Assert.Contains("Cabinets and shelving       25.0%  $15,000.00", t);
        Assert.Contains("$74,298.00", t);
    }
}
