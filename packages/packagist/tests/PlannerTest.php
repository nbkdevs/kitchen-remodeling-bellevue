<?php

declare(strict_types=1);

namespace BellevueKitchenPros\KitchenRemodelingCost\Tests;

use BellevueKitchenPros\KitchenRemodelingCost\Planner;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class PlannerTest extends TestCase
{
    private static function cents(array $r): int
    {
        return (int) array_sum(array_map(fn ($l) => (int) round($l['amount'] * 100), $r['lines']));
    }

    public function testEstimate(): void
    {
        $r = Planner::estimate(60000, permit: 1500);
        $this->assertEqualsWithDelta([60000, 6000, 6798, 74298], [$r['construction'], $r['contingency'], $r['tax'], $r['total']], 1e-9);
        $this->assertEqualsWithDelta(15000, $r['lines'][0]['amount'], 1e-9);
        $this->assertSame(6000000, self::cents($r));
    }

    public function testSplitReference(): void
    {
        $r = Planner::splitBudget(100000, permit: 2500);
        $this->assertSame([80359.35, 8035.94, 9104.71], [$r['construction'], $r['contingency'], $r['tax']]);
        $this->assertSame(20089.84, $r['lines'][0]['amount']);
    }

    public function testSplitExact(): void
    {
        foreach ([10000, 33333.33, 60000, 98765.43, 250000] as $t) {
            $r = Planner::splitBudget($t, permit: 1000);
            $this->assertSame((int) round($t * 100), (int) round($r['total'] * 100));
            $this->assertSame((int) round($r['construction'] * 100), self::cents($r));
        }
    }

    public function testTies(): void
    {
        $r = Planner::splitBudget(33333.33);
        $this->assertSame([27473.28, 2747.33, 3112.72], [$r['construction'], $r['contingency'], $r['tax']]);
        $this->assertSame(1373.67, $r['lines'][6]['amount']);
        $this->assertSame(1373.66, $r['lines'][7]['amount']);
    }

    public function testPresetsAndShares(): void
    {
        $r = Planner::estimatePreset('major-midrange');
        $this->assertSame([2500.0, 9798.18, 107426.18], [(float) $r['permit'], $r['tax'], $r['total']]);
        $s = Planner::estimate(1000, 0, 0, 0, ['cabinets' => 50]);
        $this->assertGreaterThan(0.5, $s['lines'][0]['share']);
        $this->assertSame(100000, self::cents($s));
    }

    /** @return iterable<array{callable}> */
    public static function bad(): iterable
    {
        yield [fn () => Planner::estimatePreset('nope')];
        yield [fn () => Planner::estimate(-1)];
        yield [fn () => Planner::estimate(1, 2)];
        yield [fn () => Planner::splitBudget(100, permit: 200)];
        yield [fn () => Planner::estimate(1, shares: ['garage' => 1])];
    }

    /** @dataProvider bad */
    #[\PHPUnit\Framework\Attributes\DataProvider('bad')]
    public function testErrors(callable $f): void
    {
        $this->expectException(InvalidArgumentException::class);
        $f();
    }

    public function testTable(): void
    {
        $t = Planner::formatTable(Planner::estimate(60000, permit: 1500));
        $this->assertStringContainsString('Cabinets and shelving       25.0%  $15,000.00', $t);
        $this->assertStringContainsString('$74,298.00', $t);
        $this->assertSame('$1,234,567.89', Planner::money(1234567.891));
    }
}
