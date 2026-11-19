use kitchen_remodeling_cost as k;
use std::process::ExitCode;

const HELP: &str = "kitchen-remodeling-cost: kitchen remodeling budget planner

Usage:
  kitchen-remodeling-cost split <total>      split an all-in budget by line item
  kitchen-remodeling-cost estimate <amount>  add reserve, tax and permits to a construction cost
  kitchen-remodeling-cost preset <name>      minor-midrange | major-midrange | major-upscale
  kitchen-remodeling-cost presets            list presets

Options: --tax <percent> (default 10.3)  --contingency <percent> (default 10)
         --permit <dollars>  --share key=percent (repeatable)
";

fn run(args: Vec<String>) -> Result<(), String> {
    let mut pos = vec![];
    let mut o = k::Options::default();
    let mut permit: Option<f64> = None;
    let mut it = args.into_iter();
    let parse = |s: Option<String>, f: &str| -> Result<f64, String> {
        s.ok_or(format!("{f} needs a value"))?.parse::<f64>().map_err(|e| format!("{f}: {e}"))
    };
    while let Some(a) = it.next() {
        match a.as_str() {
            "-h" | "--help" => { print!("{HELP}"); return Ok(()); }
            "--tax" => o.tax_rate = parse(it.next(), "--tax")? / 100.0,
            "--contingency" => o.contingency_rate = parse(it.next(), "--contingency")? / 100.0,
            "--permit" => permit = Some(parse(it.next(), "--permit")?),
            "--share" => {
                let v = it.next().ok_or("--share needs key=percent")?;
                let (key, p) = v.split_once('=').ok_or("--share needs key=percent")?;
                o.shares.push((key.to_string(), p.parse::<f64>().map_err(|e| e.to_string())?));
            }
            _ => pos.push(a),
        }
    }
    let cmd = pos.first().map(String::as_str).unwrap_or("");
    let val = pos.get(1).cloned();
    let amount = || -> Result<f64, String> { parse(val.clone(), "amount") };
    let r = match cmd {
        "presets" => {
            for p in k::PRESETS { println!("{:<15} {:<26} {}  permit {}", p.key, p.label, k::money(p.construction), k::money(p.permit)); }
            println!("Source: {}", k::PRESET_SOURCE);
            return Ok(());
        }
        "split" => { o.permit = permit.unwrap_or(0.0); k::split_budget(amount()?, &o) }
        "estimate" => { o.permit = permit.unwrap_or(0.0); k::estimate(amount()?, &o) }
        "preset" => k::estimate_preset(val.as_deref().unwrap_or(""), &o, permit),
        _ => { print!("{HELP}"); return Ok(()); }
    }.map_err(|e| e.to_string())?;
    println!("{}", k::format_table(&r));
    Ok(())
}

fn main() -> ExitCode {
    match run(std::env::args().skip(1).collect()) {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => { eprintln!("error: {e}"); ExitCode::FAILURE }
    }
}
