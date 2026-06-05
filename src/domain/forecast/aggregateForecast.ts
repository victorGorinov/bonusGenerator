/**
 * Aggregates normalized activities into a period forecast with cannibalization.
 *
 * Keep in sync with public/forecast.js
 */

import { normalizeCampaign, type NormalizedActivity } from './normalizeCampaign.js';
import { pairCannibalization, type ForecastPair } from './cannibalization.js';

export interface ForecastDay {
  date: string;
  grossRevenue: number;
  overlapLoss: number;
  netRevenue: number;
  activityIds: string[];
}

export interface Forecast {
  periodStart: string;
  periodEnd: string;
  gross: number;
  grossCost: number;
  overlapLoss: number;
  net: number;
  netProfit: number;
  byDay: ForecastDay[];
  pairs: ForecastPair[];
  coverage: { total: number; withEcon: number; withoutEcon: number };
}

interface Campaign {
  id?: string;
  title?: string;
  type?: string;
  segment?: string;
  startDate?: string;
  endDate?: string;
  econ?: Record<string, unknown> | null;
  sourceType?: string;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return isoDate(d);
}

function datesInPeriod(start: string, end: string): string[] {
  const dates: string[] = [];
  let cur = start;
  while (cur <= end) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }
  return dates;
}

function activityDuration(a: NormalizedActivity): number {
  return Math.max(1, Math.round((Date.parse(a.endDate) - Date.parse(a.startDate)) / 86_400_000) + 1);
}

export function aggregateForecast(
  campaigns: Campaign[],
  periodStart: string,
  periodEnd: string,
): Forecast {
  // 1. Normalize and filter to activities overlapping [periodStart, periodEnd]
  const all: NormalizedActivity[] = [];
  for (const c of campaigns) {
    const a = normalizeCampaign(c);
    if (!a) continue;
    if (a.startDate > periodEnd || a.endDate < periodStart) continue;
    all.push(a);
  }

  const coverage = {
    total:       all.length,
    withEcon:    all.filter(a => a.hasEcon).length,
    withoutEcon: all.filter(a => !a.hasEcon).length,
  };

  // 2. Sum gross revenue and cost (only hasEcon activities)
  const gross     = all.reduce((s, a) => s + (a.hasEcon ? a.incrementalRevenue : 0), 0);
  const grossCost = all.reduce((s, a) => s + (a.hasEcon ? a.cost : 0), 0);

  // 3. Compute pair cannibalization for all pairs with overlapping dates
  const pairs: ForecastPair[] = [];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i];
      const b = all[j];
      // Quick date overlap check
      if (a.startDate > b.endDate || b.startDate > a.endDate) continue;
      const pair = pairCannibalization(a, b);
      pairs.push(pair);
    }
  }
  const pairsWithLoss = pairs.filter(p => p.loss > 0).sort((a, b) => b.loss - a.loss);
  const overlapLoss   = pairs.reduce((s, p) => s + p.loss, 0);

  // 4. Net figures
  const net       = Math.max(0, gross - overlapLoss);
  const netProfit = net - grossCost;

  // 5. byDay: distribute each activity's revenue uniformly across its active days in period
  //    Distribute pair loss proportionally across overlapping days within period
  const periodDates = datesInPeriod(periodStart, periodEnd);
  const dayMap = new Map<string, ForecastDay>();
  for (const date of periodDates) {
    dayMap.set(date, { date, grossRevenue: 0, overlapLoss: 0, netRevenue: 0, activityIds: [] });
  }

  // Distribute revenue
  for (const a of all) {
    if (!a.hasEcon || a.incrementalRevenue === 0) continue;
    const dur = activityDuration(a);
    const dailyRev = a.incrementalRevenue / dur;
    for (const date of periodDates) {
      if (date >= a.startDate && date <= a.endDate) {
        const d = dayMap.get(date);
        if (d) { d.grossRevenue += dailyRev; d.activityIds.push(a.id); }
      }
    }
  }

  // Distribute pair loss across their overlap days in period
  for (const pair of pairs) {
    if (pair.loss === 0) continue;
    const a = all.find(x => x.id === pair.aId);
    const b = all.find(x => x.id === pair.bId);
    if (!a || !b) continue;
    const overlapStart = a.startDate > b.startDate ? a.startDate : b.startDate;
    const overlapEnd   = a.endDate   < b.endDate   ? a.endDate   : b.endDate;
    const inPeriodStart = overlapStart > periodStart ? overlapStart : periodStart;
    const inPeriodEnd   = overlapEnd   < periodEnd   ? overlapEnd   : periodEnd;
    if (inPeriodStart > inPeriodEnd) continue;
    const overlapDates = datesInPeriod(inPeriodStart, inPeriodEnd);
    const dailyLoss = pair.loss / overlapDates.length;
    for (const date of overlapDates) {
      const d = dayMap.get(date);
      if (d) d.overlapLoss += dailyLoss;
    }
  }

  // Round and compute net per day
  const byDay: ForecastDay[] = periodDates.map(date => {
    const d = dayMap.get(date) ?? { grossRevenue: 0, overlapLoss: 0, activityIds: [] as string[] };
    const gr  = Math.round(d.grossRevenue);
    const ol  = Math.round(d.overlapLoss);
    const nr  = Math.max(0, gr - ol);
    return { date, grossRevenue: gr, overlapLoss: ol, netRevenue: nr, activityIds: [...new Set(d.activityIds)] };
  });

  return {
    periodStart, periodEnd,
    gross, grossCost, overlapLoss, net, netProfit,
    byDay, pairs: pairsWithLoss, coverage,
  };
}
