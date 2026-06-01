import { describe, it, expect } from 'vitest';
import { tournamentBenchmarks } from '../../src/domain/tournament/benchmarks.js';
import { ARPU_BY_REGION } from '../../src/domain/tournament/calcEconomics.js';

describe('tournamentBenchmarks', () => {

  it('returns all required fields', () => {
    const b = tournamentBenchmarks({ region: 'eu', segment: 'all', duration: 'weekly' });
    expect(b).toHaveProperty('arpuUsd');
    expect(b).toHaveProperty('participation');
    expect(b).toHaveProperty('engagement');
    expect(b).toHaveProperty('retentionLift');
    expect(b).toHaveProperty('roi');
    expect(b).toHaveProperty('costPerActive');
  });

  it('arpuUsd.mid matches ARPU_BY_REGION for each region', () => {
    for (const region of ['eu', 'cis', 'mn', 'sweep', 'crypto', 'latam']) {
      const b = tournamentBenchmarks({ region, segment: 'all', duration: 'weekly' });
      expect(b.arpuUsd.mid).toBe(ARPU_BY_REGION[region]);
    }
  });

  it('arpuUsd.lo < mid < hi', () => {
    const b = tournamentBenchmarks({ region: 'eu', segment: 'all', duration: 'weekly' });
    expect(b.arpuUsd.lo).toBeLessThan(b.arpuUsd.mid);
    expect(b.arpuUsd.mid).toBeLessThan(b.arpuUsd.hi);
  });

  it('participation rates are consistent with duration', () => {
    const flash   = tournamentBenchmarks({ region: 'eu', segment: 'all', duration: 'flash' });
    const monthly = tournamentBenchmarks({ region: 'eu', segment: 'all', duration: 'monthly' });
    // monthly achieves higher participation than flash
    expect(monthly.participation.mid).toBeGreaterThan(flash.participation.mid);
  });

  it('engagement multiplier increases with duration length', () => {
    const daily  = tournamentBenchmarks({ region: 'eu', segment: 'all', duration: 'daily' });
    const weekly = tournamentBenchmarks({ region: 'eu', segment: 'all', duration: 'weekly' });
    expect(weekly.engagement).toBeGreaterThan(daily.engagement);
  });

  it('retentionLift is highest for dormant segment', () => {
    const dormant    = tournamentBenchmarks({ region: 'eu', segment: 'dormant',    duration: 'weekly' });
    const vip        = tournamentBenchmarks({ region: 'eu', segment: 'vip',        duration: 'weekly' });
    const depositors = tournamentBenchmarks({ region: 'eu', segment: 'depositors', duration: 'weekly' });
    expect(dormant.retentionLift).toBeGreaterThan(vip.retentionLift);
    expect(dormant.retentionLift).toBeGreaterThan(depositors.retentionLift);
  });

  it('roi range is sensible (lo < hi, both are realistic %s)', () => {
    for (const region of ['eu', 'cis', 'mn', 'latam']) {
      const b = tournamentBenchmarks({ region, segment: 'all', duration: 'weekly' });
      expect(b.roi.lo).toBeLessThan(b.roi.hi);
      expect(b.roi.lo).toBeGreaterThan(-100);  // not total loss territory
      expect(b.roi.hi).toBeLessThan(1000);     // not absurdly high
    }
  });

  it('costPerActive has lo < hi, sensible USD range', () => {
    const b = tournamentBenchmarks({ region: 'eu', segment: 'all', duration: 'weekly' });
    expect(b.costPerActive.lo).toBeLessThan(b.costPerActive.hi);
    expect(b.costPerActive.lo).toBeGreaterThan(0);
  });

  it('falls back to eu defaults for unknown region', () => {
    const b = tournamentBenchmarks({ region: 'unknown', segment: 'all', duration: 'weekly' });
    const eu = tournamentBenchmarks({ region: 'eu', segment: 'all', duration: 'weekly' });
    // ARPU_BY_REGION fallback = eu
    expect(b.arpuUsd.mid).toBe(eu.arpuUsd.mid);
    expect(b.roi.lo).toBe(eu.roi.lo);
  });

  it('falls back to weekly participation for unknown duration', () => {
    const b       = tournamentBenchmarks({ region: 'eu', segment: 'all', duration: 'unknown' });
    const weekly  = tournamentBenchmarks({ region: 'eu', segment: 'all', duration: 'weekly' });
    expect(b.participation.mid).toBe(weekly.participation.mid);
  });

});
