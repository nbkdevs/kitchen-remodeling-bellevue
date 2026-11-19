<?php

declare(strict_types=1);

namespace BellevueKitchenPros\KitchenRemodelingCost;

use InvalidArgumentException;

/**
 * Kitchen remodeling cost planner: split a kitchen remodel budget by line item and add
 * sales tax, a contingency reserve and a permit allowance. All maths in integer cents.
 *
 * More kitchen remodel planning: https://wakitchenremodelingbellevue.com/
 */
final class Planner
{
    public const DEFAULT_TAX_RATE = 0.103;
    public const DEFAULT_CONTINGENCY_RATE = 0.10;
    public const PRESET_SOURCE = 'Cost vs Value 2025, Pacific region averages (200 sq ft kitchen)';
    public const SHARE_SOURCE = 'HomeGuide kitchen remodel cost breakdown';

    /** @var list<array{0:string,1:string,2:float}> */
    public const LINE_ITEMS = [
        ['cabinets', 'Cabinets and shelving', 0.25],
        ['labor', 'Installation and labor', 0.15],
        ['appliances', 'Appliances', 0.15],
        ['countertops', 'Countertops and backsplash', 0.10],
        ['flooring', 'Flooring', 0.07],
        ['lighting', 'Lighting', 0.05],
        ['painting', 'Painting and drywall', 0.05],
        ['design', 'Designer', 0.05],
        ['sink', 'Sink and faucet', 0.05],
        ['doors_windows', 'Doors and windows', 0.04],
        ['plumbing', 'Plumbing', 0.03],
        ['misc', 'Miscellaneous', 0.01],
    ];

    /** @var array<string, array{label:string,construction:float,permit:float}> */
    public const PRESETS = [
        'minor-midrange' => ['label' => 'Minor remodel, midrange', 'construction' => 29728.0, 'permit' => 500.0],
        'major-midrange' => ['label' => 'Major remodel, midrange', 'construction' => 86480.0, 'permit' => 2500.0],
        'major-upscale' => ['label' => 'Major remodel, upscale', 'construction' => 171950.0, 'permit' => 4000.0],
    ];

    private static function r(float $x): int
    {
        return (int) floor($x + 0.5);
    }

    private static function num(string $name, float|int $v, ?float $max = null): float
    {
        $v = (float) $v;
        if (!is_finite($v) || $v < 0) {
            throw new InvalidArgumentException("$name must be a finite number >= 0");
        }
        if ($max !== null && $v > $max) {
            throw new InvalidArgumentException("$name must be <= $max");
        }
        return $v;
    }

    /**
     * Defaults merged with overrides (key => weight), normalised to sum to 1.
     *
     * @param array<string, float|int> $overrides
     * @return list<array{key:string,label:string,share:float}>
     */
    public static function normaliseShares(array $overrides = []): array
    {
        $items = [];
        foreach (self::LINE_ITEMS as [$k, $l, $s]) {
            $items[$k] = ['key' => $k, 'label' => $l, 'share' => $s];
        }
        foreach ($overrides as $k => $v) {
            if (!isset($items[$k])) {
                throw new InvalidArgumentException("unknown line item: $k");
            }
            $items[$k]['share'] = self::num("share $k", $v);
        }
        $sum = 0.0;
        foreach ($items as $i) {
            $sum += $i['share'];
        }
        if ($sum <= 0) {
            throw new InvalidArgumentException('shares must not all be zero');
        }
        $out = [];
        foreach ($items as $i) {
            $i['share'] = $i['share'] / $sum;
            $out[] = $i;
        }
        return $out;
    }

    /** @param list<array{key:string,label:string,share:float}> $items */
    private static function allocate(int $cents, array $items): array
    {
        $base = [];
        $frac = [];
        foreach ($items as $idx => $it) {
            $raw = $cents * $it['share'];
            $b = floor($raw);
            $base[$idx] = (int) $b;
            $frac[] = [$idx, $raw - $b];
        }
        $left = $cents - array_sum($base);
        usort($frac, fn ($a, $b) => ($b[1] <=> $a[1]) ?: ($a[0] <=> $b[0]));
        for ($j = 0; $left > 0; $j++, $left--) {
            $base[$frac[$j % count($frac)][0]]++;
        }
        $lines = [];
        foreach ($items as $idx => $it) {
            $lines[] = ['key' => $it['key'], 'label' => $it['label'], 'share' => $it['share'], 'amount' => $base[$idx] / 100];
        }
        return $lines;
    }

    private static function result(string $mode, int $c, int $k, int $t, int $p, float $tax, float $cont, array $items): array
    {
        return [
            'mode' => $mode,
            'lines' => self::allocate($c, $items),
            'construction' => $c / 100,
            'contingency' => $k / 100,
            'tax' => $t / 100,
            'permit' => $p / 100,
            'total' => ($c + $k + $t + $p) / 100,
            'tax_rate' => $tax,
            'contingency_rate' => $cont,
        ];
    }

    /**
     * Forward estimate from a construction (pre-tax) cost.
     *
     * @param array<string, float|int> $shares
     */
    public static function estimate(
        float $construction,
        float $taxRate = self::DEFAULT_TAX_RATE,
        float $contingencyRate = self::DEFAULT_CONTINGENCY_RATE,
        float $permit = 0,
        array $shares = []
    ): array {
        $tax = self::num('taxRate', $taxRate, 1);
        $cont = self::num('contingencyRate', $contingencyRate, 1);
        $items = self::normaliseShares($shares);
        $c = self::r(self::num('construction', $construction) * 100);
        $k = self::r($c * $cont);
        $t = self::r(($c + $k) * $tax);
        return self::result('estimate', $c, $k, $t, self::r(self::num('permit', $permit) * 100), $tax, $cont, $items);
    }

    /**
     * Split an all-in budget (tax, reserve and permits included) into line items.
     *
     * @param array<string, float|int> $shares
     */
    public static function splitBudget(
        float $total,
        float $taxRate = self::DEFAULT_TAX_RATE,
        float $contingencyRate = self::DEFAULT_CONTINGENCY_RATE,
        float $permit = 0,
        array $shares = []
    ): array {
        $tax = self::num('taxRate', $taxRate, 1);
        $cont = self::num('contingencyRate', $contingencyRate, 1);
        $items = self::normaliseShares($shares);
        $p = self::r(self::num('permit', $permit) * 100);
        $a = self::r(self::num('total', $total) * 100) - $p;
        if ($a <= 0) {
            throw new InvalidArgumentException('total must be larger than the permit allowance');
        }
        $c = self::r($a / ((1 + $cont) * (1 + $tax)));
        $k = self::r($c * $cont);
        $t = self::r(($c + $k) * $tax);
        $k += $a - $c - $k - $t;
        return self::result('split', $c, $k, $t, $p, $tax, $cont, $items);
    }

    /**
     * Estimate a Cost vs Value preset; $permit overrides the preset allowance.
     *
     * @param array<string, float|int> $shares
     */
    public static function estimatePreset(
        string $name,
        float $taxRate = self::DEFAULT_TAX_RATE,
        float $contingencyRate = self::DEFAULT_CONTINGENCY_RATE,
        ?float $permit = null,
        array $shares = []
    ): array {
        if (!isset(self::PRESETS[$name])) {
            throw new InvalidArgumentException("unknown preset: $name (use " . implode(', ', array_keys(self::PRESETS)) . ')');
        }
        $p = self::PRESETS[$name];
        $r = self::estimate($p['construction'], $taxRate, $contingencyRate, $permit ?? $p['permit'], $shares);
        return ['preset' => $name, 'label' => $p['label']] + $r;
    }

    public static function money(float $v): string
    {
        return '$' . number_format(self::r($v * 100) / 100, 2, '.', ',');
    }

    private static function pct(float $rate): string
    {
        return rtrim(rtrim(number_format($rate * 100, 2, '.', ''), '0'), '.');
    }

    /** Plain-text itemised table. */
    public static function formatTable(array $r): string
    {
        $rows = [];
        foreach ($r['lines'] as $l) {
            $rows[] = [$l['label'], number_format($l['share'] * 100, 1) . '%', self::money($l['amount'])];
        }
        $rows[] = ['Construction subtotal', '', self::money($r['construction'])];
        $rows[] = ['Contingency reserve (' . self::pct($r['contingency_rate']) . '%)', '', self::money($r['contingency'])];
        $rows[] = ['Sales tax (' . self::pct($r['tax_rate']) . '%)', '', self::money($r['tax'])];
        $rows[] = ['Permit allowance', '', self::money($r['permit'])];
        $rows[] = ['Total', '', self::money($r['total'])];
        $head = ['Line item', 'Share', 'Amount'];
        $w = [];
        for ($c = 0; $c < 3; $c++) {
            $w[$c] = max(strlen($head[$c]), ...array_map(fn ($x) => strlen($x[$c]), $rows));
        }
        $line = fn ($x) => str_pad($x[0], $w[0]) . '  ' . str_pad($x[1], $w[1], ' ', STR_PAD_LEFT) . '  ' . str_pad($x[2], $w[2], ' ', STR_PAD_LEFT);
        $sep = str_repeat('-', array_sum($w) + 4);
        $body = array_map($line, $rows);
        array_splice($body, count($r['lines']), 0, [$sep]);
        array_splice($body, count($body) - 1, 0, [$sep]);
        return implode("\n", array_merge([$line($head), $sep], $body));
    }
}
