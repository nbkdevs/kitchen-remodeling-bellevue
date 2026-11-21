//! Kitchen remodeling cost planner.
//!
//! Split a kitchen remodel budget by line item, then add sales tax, a contingency reserve and a
//! permit allowance. All arithmetic is done in integer cents so totals match to the cent.
//!
//! ```
//! use kitchen_remodeling_cost::{estimate, Options};
//! let r = estimate(60000.0, &Options { permit: 1500.0, ..Options::default() }).unwrap();
//! assert_eq!(r.total, 74298.0);
//! ```
//!
//! More kitchen remodel planning: [Kitchen Remodeling Bellevue](https://wakitchenremodelingbellevue.com/)

use std::fmt;

/// A default line item: key, label, share of the construction budget.
pub const LINE_ITEMS: [(&str, &str, f64); 12] = [
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
];

/// A Cost vs Value preset (Pacific region averages).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Preset {
    pub key: &'static str,
    pub label: &'static str,
    pub construction: f64,
    pub permit: f64,
}

pub const PRESETS: [Preset; 3] = [
    Preset { key: "minor-midrange", label: "Minor remodel, midrange", construction: 29728.0, permit: 500.0 },
    Preset { key: "major-midrange", label: "Major remodel, midrange", construction: 86480.0, permit: 2500.0 },
    Preset { key: "major-upscale", label: "Major remodel, upscale", construction: 171950.0, permit: 4000.0 },
];

pub const DEFAULT_TAX_RATE: f64 = 0.103;
pub const DEFAULT_CONTINGENCY_RATE: f64 = 0.10;
pub const PRESET_SOURCE: &str = "Cost vs Value 2025, Pacific region averages (200 sq ft kitchen)";
pub const SHARE_SOURCE: &str = "HomeGuide kitchen remodel cost breakdown";

/// Errors for invalid input.
#[derive(Debug, Clone, PartialEq)]
pub struct Error(pub String);
impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { f.write_str(&self.0) }
}
impl std::error::Error for Error {}

/// Calculation options.
#[derive(Debug, Clone, PartialEq)]
pub struct Options {
    pub tax_rate: f64,
    pub contingency_rate: f64,
    pub permit: f64,
    /// Share overrides as (key, weight); merged into the defaults and normalised.
    pub shares: Vec<(String, f64)>,
}
impl Default for Options {
    fn default() -> Self {
        Options { tax_rate: DEFAULT_TAX_RATE, contingency_rate: DEFAULT_CONTINGENCY_RATE, permit: 0.0, shares: vec![] }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Line { pub key: String, pub label: String, pub share: f64, pub amount: f64 }

#[derive(Debug, Clone, PartialEq)]
pub struct Breakdown {
    pub mode: &'static str,
    pub lines: Vec<Line>,
    pub construction: f64,
    pub contingency: f64,
    pub tax: f64,
    pub permit: f64,
    pub total: f64,
    pub tax_rate: f64,
    pub contingency_rate: f64,
}

fn round(x: f64) -> i64 { (x + 0.5).floor() as i64 }

fn num(name: &str, v: f64, max: Option<f64>) -> Result<f64, Error> {
    if !v.is_finite() || v < 0.0 { return Err(Error(format!("{name} must be a finite number >= 0"))); }
    if let Some(m) = max { if v > m { return Err(Error(format!("{name} must be <= {m}"))); } }
    Ok(v)
}

/// Defaults merged with overrides, normalised to sum to 1.
pub fn normalise_shares(overrides: &[(String, f64)]) -> Result<Vec<(String, String, f64)>, Error> {
    let mut items: Vec<(String, String, f64)> =
        LINE_ITEMS.iter().map(|(k, l, s)| (k.to_string(), l.to_string(), *s)).collect();
    for (k, v) in overrides {
        let it = items.iter_mut().find(|i| &i.0 == k).ok_or_else(|| Error(format!("unknown line item: {k}")))?;
        it.2 = num(&format!("share {k}"), *v, None)?;
    }
    let mut sum = 0.0;
    for i in &items { sum += i.2; }
    if sum <= 0.0 { return Err(Error("shares must not all be zero".into())); }
    for i in items.iter_mut() { i.2 /= sum; }
    Ok(items)
}

fn allocate(cents: i64, items: &[(String, String, f64)]) -> Vec<Line> {
    let mut base: Vec<i64> = Vec::with_capacity(items.len());
    let mut frac: Vec<(usize, f64)> = Vec::with_capacity(items.len());
    for (i, it) in items.iter().enumerate() {
        let raw = cents as f64 * it.2;
        let b = raw.floor();
        base.push(b as i64);
        frac.push((i, raw - b));
    }
    let mut left = cents - base.iter().sum::<i64>();
    frac.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap().then(a.0.cmp(&b.0)));
    let mut j = 0;
    while left > 0 { base[frac[j % frac.len()].0] += 1; j += 1; left -= 1; }
    items.iter().zip(base).map(|(it, c)| Line { key: it.0.clone(), label: it.1.clone(), share: it.2, amount: c as f64 / 100.0 }).collect()
}

struct Checked { tax: f64, cont: f64, permit: f64, items: Vec<(String, String, f64)> }

fn check(o: &Options) -> Result<Checked, Error> {
    Ok(Checked {
        tax: num("tax_rate", o.tax_rate, Some(1.0))?,
        cont: num("contingency_rate", o.contingency_rate, Some(1.0))?,
        permit: num("permit", o.permit, None)?,
        items: normalise_shares(&o.shares)?,
    })
}

fn result(mode: &'static str, c: i64, k: i64, t: i64, p: i64, o: &Checked) -> Breakdown {
    Breakdown {
        mode, lines: allocate(c, &o.items),
        construction: c as f64 / 100.0, contingency: k as f64 / 100.0, tax: t as f64 / 100.0,
        permit: p as f64 / 100.0, total: (c + k + t + p) as f64 / 100.0,
        tax_rate: o.tax, contingency_rate: o.cont,
    }
}

/// Forward estimate from a construction (pre-tax) cost.
pub fn estimate(construction: f64, opts: &Options) -> Result<Breakdown, Error> {
    let o = check(opts)?;
    let c = round(num("construction", construction, None)? * 100.0);
    let k = round(c as f64 * o.cont);
    let t = round((c + k) as f64 * o.tax);
    Ok(result("estimate", c, k, t, round(o.permit * 100.0), &o))
}

/// Split an all-in budget (tax, reserve and permits included) into line items.
pub fn split_budget(total: f64, opts: &Options) -> Result<Breakdown, Error> {
    let o = check(opts)?;
    let p = round(o.permit * 100.0);
    let a = round(num("total", total, None)? * 100.0) - p;
    if a <= 0 { return Err(Error("total must be larger than the permit allowance".into())); }
    let c = round(a as f64 / ((1.0 + o.cont) * (1.0 + o.tax)));
    let mut k = round(c as f64 * o.cont);
    let t = round((c + k) as f64 * o.tax);
    k += a - c - k - t;
    Ok(result("split", c, k, t, p, &o))
}

/// Look up a preset by key.
pub fn preset(name: &str) -> Result<Preset, Error> {
    PRESETS.iter().copied().find(|p| p.key == name).ok_or_else(|| {
        Error(format!("unknown preset: {name} (use minor-midrange, major-midrange, major-upscale)"))
    })
}

/// Estimate a preset. `permit` = `None` keeps the preset allowance.
pub fn estimate_preset(name: &str, opts: &Options, permit: Option<f64>) -> Result<Breakdown, Error> {
    let p = preset(name)?;
    let mut o = opts.clone();
    o.permit = permit.unwrap_or(p.permit);
    estimate(p.construction, &o)
}

/// `$12,345.67`
pub fn money(v: f64) -> String {
    let c = round(v * 100.0);
    let (d, r) = (c / 100, c % 100);
    let s = d.to_string();
    let mut out = String::new();
    for (i, ch) in s.chars().enumerate() {
        if i > 0 && (s.len() - i) % 3 == 0 { out.push(','); }
        out.push(ch);
    }
    format!("${out}.{r:02}")
}

fn pct(rate: f64) -> String {
    let s = format!("{:.2}", rate * 100.0);
    s.trim_end_matches('0').trim_end_matches('.').to_string()
}

/// Plain-text itemised table.
pub fn format_table(r: &Breakdown) -> String {
    let mut rows: Vec<[String; 3]> = r.lines.iter()
        .map(|l| [l.label.clone(), format!("{:.1}%", l.share * 100.0), money(l.amount)]).collect();
    rows.push(["Construction subtotal".into(), String::new(), money(r.construction)]);
    rows.push([format!("Contingency reserve ({}%)", pct(r.contingency_rate)), String::new(), money(r.contingency)]);
    rows.push([format!("Sales tax ({}%)", pct(r.tax_rate)), String::new(), money(r.tax)]);
    rows.push(["Permit allowance".into(), String::new(), money(r.permit)]);
    rows.push(["Total".into(), String::new(), money(r.total)]);
    let head = ["Line item".to_string(), "Share".to_string(), "Amount".to_string()];
    let w: Vec<usize> = (0..3).map(|c| rows.iter().map(|x| x[c].len()).chain([head[c].len()]).max().unwrap()).collect();
    let line = |x: &[String; 3]| format!("{:<w0$}  {:>w1$}  {:>w2$}", x[0], x[1], x[2], w0 = w[0], w1 = w[1], w2 = w[2]);
    let sep = "-".repeat(w[0] + w[1] + w[2] + 4);
    let mut body: Vec<String> = rows.iter().map(line).collect();
    body.insert(r.lines.len(), sep.clone());
    let n = body.len() - 1;
    body.insert(n, sep.clone());
    let mut out = vec![line(&head), sep];
    out.extend(body);
    out.join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;
    fn d() -> Options { Options::default() }
    fn sum(r: &Breakdown) -> i64 { r.lines.iter().map(|l| round(l.amount * 100.0)).sum() }

    #[test]
    fn estimate_reference() {
        let r = estimate(60000.0, &Options { permit: 1500.0, ..d() }).unwrap();
        assert_eq!((r.construction, r.contingency, r.tax, r.total), (60000.0, 6000.0, 6798.0, 74298.0));
        assert_eq!(r.lines[0].amount, 15000.0);
        assert_eq!(sum(&r), 6_000_000);
    }

    #[test]
    fn split_reference() {
        let r = split_budget(100000.0, &Options { permit: 2500.0, ..d() }).unwrap();
        assert_eq!((r.construction, r.contingency, r.tax), (80359.35, 8035.94, 9104.71));
        assert_eq!(r.lines[0].amount, 20089.84);
    }

    #[test]
    fn split_exact() {
        for t in [10000.0, 33333.33, 60000.0, 98765.43, 250000.0] {
            let r = split_budget(t, &Options { permit: 1000.0, ..d() }).unwrap();
            assert_eq!(round(r.total * 100.0), round(t * 100.0));
            assert_eq!(sum(&r), round(r.construction * 100.0));
        }
    }

    #[test]
    fn ties() {
        let r = split_budget(33333.33, &d()).unwrap();
        assert_eq!((r.construction, r.contingency, r.tax), (27473.28, 2747.33, 3112.72));
        assert_eq!(r.lines[6].amount, 1373.67);
        assert_eq!(r.lines[7].amount, 1373.66);
    }

    #[test]
    fn presets_and_errors() {
        let r = estimate_preset("major-midrange", &d(), None).unwrap();
        assert_eq!((r.permit, r.tax, r.total), (2500.0, 9798.18, 107426.18));
        assert!(estimate_preset("nope", &d(), None).is_err());
        assert!(estimate(-1.0, &d()).is_err());
        assert!(estimate(1.0, &Options { tax_rate: 2.0, ..d() }).is_err());
        assert!(split_budget(100.0, &Options { permit: 200.0, ..d() }).is_err());
        assert!(estimate(1.0, &Options { shares: vec![("garage".into(), 1.0)], ..d() }).is_err());
        let r = estimate(1000.0, &Options { tax_rate: 0.0, contingency_rate: 0.0, shares: vec![("cabinets".into(), 50.0)], ..d() }).unwrap();
        assert!(r.lines[0].share > 0.5);
        assert_eq!(sum(&r), 100_000);
    }

    #[test]
    fn table() {
        let t = format_table(&estimate(60000.0, &Options { permit: 1500.0, ..d() }).unwrap());
        assert!(t.contains("Cabinets and shelving       25.0%  $15,000.00"));
        assert!(t.contains("$74,298.00"));
        assert_eq!(money(1234567.891), "$1,234,567.89");
    }
}
