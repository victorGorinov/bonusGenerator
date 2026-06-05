/**
 * Client-side port of src/domain/forecast/
 * Keep in sync with the server implementation.
 *
 * Exports: normalizeCampaign, aggregateForecast, MECHANIC_AFFINITY
 */

// ── SEGMENT_RATIO (mirrors tournament-econ.js) ────────────────────────────────

const SEGMENT_RATIO = {
  all: 1.00, new: 0.20, vip: 0.10, dormant: 0.40, depositors: 0.60,
};

// ── normalizeCampaign ─────────────────────────────────────────────────────────

function _daysBetween(start, end) {
  const ms = Date.parse(end) - Date.parse(start);
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export function normalizeCampaign(campaign) {
  const id        = campaign.id        ?? 'unknown';
  const title     = campaign.title     ?? '';
  const type      = campaign.type      ?? 'custom';
  const segment   = campaign.segment   ?? 'all';
  const startDate = campaign.startDate ?? '';
  const endDate   = campaign.endDate   ?? startDate;

  if (!startDate) return null;

  const econ       = campaign.econ ?? null;
  const sourceType = campaign.sourceType ?? 'manual';
  const days       = _daysBetween(startDate, endDate);

  if (!econ) {
    return { id, title, type, segment, startDate, endDate,
             incrementalRevenue: 0, cost: 0, eligiblePlayers: 0, hasEcon: false };
  }

  let revenue = 0;
  let cost    = 0;
  let eligible = 0;

  if (sourceType === 'tournament_generator') {
    revenue  = Number(econ.ggrLiftMid)    || 0;
    cost     = Number(econ.prizePoolCost) || 0;
    eligible = Number(econ.eligible)      || 0;

  } else if (sourceType === 'campaign_generator') {
    const mBudget    = Number(econ.mBudget) || 0;
    const roi3       = Number(econ.roi3)    || 0;
    const monthlyRev = mBudget * (roi3 / 100);
    revenue  = Math.round(monthlyRev * days / 30);
    cost     = Math.round(mBudget   * days / 30);
    const pl = Number(econ.pl) || 0;
    eligible = Math.round(pl * (SEGMENT_RATIO[segment] ?? 1.0));

  } else if (sourceType === 'loyalty_generator') {
    const additionalRevenue3m = Number(econ.additionalRevenue3m) || 0;
    const monthlyCostUSD      = Number(econ.monthlyCostUSD)      || 0;
    const monthlyRev = additionalRevenue3m / 3;
    revenue  = Math.round(monthlyRev     * days / 30);
    cost     = Math.round(monthlyCostUSD * days / 30);
    eligible = 0;

  } else {
    return { id, title, type, segment, startDate, endDate,
             incrementalRevenue: 0, cost: 0, eligiblePlayers: 0, hasEcon: false };
  }

  const hasEcon = revenue !== 0 || cost !== 0 || eligible !== 0;

  return {
    id, title, type, segment, startDate, endDate,
    incrementalRevenue: revenue,
    cost,
    eligiblePlayers: eligible,
    hasEcon,
  };
}

// ── MECHANIC_AFFINITY ─────────────────────────────────────────────────────────

export const MECHANIC_AFFINITY = {
  reload:       { reload:0.9, tournament:0.7, cashback:0.5, freespins:0.5, vip:0.4, reactivation:0.3, sportsbook:0.4, custom:0.3 },
  tournament:   { reload:0.7, tournament:0.9, cashback:0.4, freespins:0.5, vip:0.5, reactivation:0.3, sportsbook:0.5, custom:0.3 },
  cashback:     { reload:0.5, tournament:0.4, cashback:0.9, freespins:0.4, vip:0.4, reactivation:0.3, sportsbook:0.3, custom:0.3 },
  freespins:    { reload:0.5, tournament:0.5, cashback:0.4, freespins:0.9, vip:0.3, reactivation:0.4, sportsbook:0.2, custom:0.3 },
  vip:          { reload:0.4, tournament:0.5, cashback:0.4, freespins:0.3, vip:0.9, reactivation:0.2, sportsbook:0.3, custom:0.3 },
  reactivation: { reload:0.3, tournament:0.3, cashback:0.3, freespins:0.4, vip:0.2, reactivation:0.9, sportsbook:0.2, custom:0.3 },
  sportsbook:   { reload:0.4, tournament:0.5, cashback:0.3, freespins:0.2, vip:0.3, reactivation:0.2, sportsbook:0.9, custom:0.3 },
  custom:       { reload:0.3, tournament:0.3, cashback:0.3, freespins:0.3, vip:0.3, reactivation:0.3, sportsbook:0.3, custom:0.5 },
};

// ── audienceOverlap ───────────────────────────────────────────────────────────

export function audienceOverlap(a, b) {
  const sa = a.segment;
  const sb = b.segment;
  if (sa === sb) return 1.0;
  if (sa === 'all') return SEGMENT_RATIO[sb] ?? 0;
  if (sb === 'all') return SEGMENT_RATIO[sa] ?? 0;
  return 0;
}

// ── overlapDaysFactor ─────────────────────────────────────────────────────────

export function overlapDaysFactor(a, b) {
  const overlapStart = a.startDate > b.startDate ? a.startDate : b.startDate;
  const overlapEnd   = a.endDate   < b.endDate   ? a.endDate   : b.endDate;
  if (overlapStart > overlapEnd) return 0;

  const overlapMs   = Date.parse(overlapEnd)  - Date.parse(overlapStart)  + 86_400_000;
  const aDurationMs = Date.parse(a.endDate)   - Date.parse(a.startDate)   + 86_400_000;
  const bDurationMs = Date.parse(b.endDate)   - Date.parse(b.startDate)   + 86_400_000;
  const minDuration = Math.min(aDurationMs, bDurationMs);

  return Math.min(1, overlapMs / minDuration);
}

// ── pairCannibalization ───────────────────────────────────────────────────────

function _pairCannibalization(a, b) {
  if (!a.hasEcon || !b.hasEcon) {
    return { aId: a.id, bId: b.id, aTitle: a.title, bTitle: b.title,
             loss: 0, audienceOverlap: 0, affinity: 0, reason: '' };
  }

  const overlap    = audienceOverlap(a, b);
  const daysFactor = overlapDaysFactor(a, b);

  if (overlap === 0 || daysFactor === 0) {
    return { aId: a.id, bId: b.id, aTitle: a.title, bTitle: b.title,
             loss: 0, audienceOverlap: overlap, affinity: 0, reason: '' };
  }

  const aType      = a.type ?? 'custom';
  const bType      = b.type ?? 'custom';
  const affinityRow = MECHANIC_AFFINITY[aType] ?? MECHANIC_AFFINITY.custom;
  const affinity   = affinityRow[bType]         ?? 0.3;

  const minRev = Math.min(a.incrementalRevenue, b.incrementalRevenue);
  const loss   = Math.round(minRev * overlap * affinity * daysFactor);

  const overlapStart = a.startDate > b.startDate ? a.startDate : b.startDate;
  const overlapEnd   = a.endDate   < b.endDate   ? a.endDate   : b.endDate;
  const overlapDays  = Math.round((Date.parse(overlapEnd) - Date.parse(overlapStart)) / 86_400_000) + 1;
  const seg = a.segment === b.segment ? a.segment : `${a.segment}+${b.segment}`;
  const reason = `${aType} × ${bType} on ${seg}, ${overlapDays} shared day${overlapDays !== 1 ? 's' : ''}`;

  return { aId: a.id, bId: b.id, aTitle: a.title, bTitle: b.title,
           loss, audienceOverlap: overlap, affinity, reason };
}

// ── aggregateForecast ─────────────────────────────────────────────────────────

function _addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function _datesInPeriod(start, end) {
  const dates = [];
  let cur = start;
  while (cur <= end) {
    dates.push(cur);
    cur = _addDays(cur, 1);
  }
  return dates;
}

export function aggregateForecast(campaigns, periodStart, periodEnd) {
  // 1. Normalize and filter
  const all = [];
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

  // 2. Gross
  const gross     = all.reduce((s, a) => s + (a.hasEcon ? a.incrementalRevenue : 0), 0);
  const grossCost = all.reduce((s, a) => s + (a.hasEcon ? a.cost : 0), 0);

  // 3. Pairs
  const pairs = [];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i];
      const b = all[j];
      if (a.startDate > b.endDate || b.startDate > a.endDate) continue;
      pairs.push(_pairCannibalization(a, b));
    }
  }
  const pairsWithLoss = pairs.filter(p => p.loss > 0).sort((a, b) => b.loss - a.loss);
  const overlapLoss   = pairs.reduce((s, p) => s + p.loss, 0);

  // 4. Net
  const net       = Math.max(0, gross - overlapLoss);
  const netProfit = net - grossCost;

  // 5. byDay
  const periodDates = _datesInPeriod(periodStart, periodEnd);
  const dayMap = new Map();
  for (const date of periodDates) {
    dayMap.set(date, { date, grossRevenue: 0, overlapLoss: 0, netRevenue: 0, activityIds: [] });
  }

  for (const a of all) {
    if (!a.hasEcon || a.incrementalRevenue === 0) continue;
    const dur = Math.max(1, Math.round((Date.parse(a.endDate) - Date.parse(a.startDate)) / 86_400_000) + 1);
    const dailyRev = a.incrementalRevenue / dur;
    for (const date of periodDates) {
      if (date >= a.startDate && date <= a.endDate) {
        const d = dayMap.get(date);
        d.grossRevenue += dailyRev;
        d.activityIds.push(a.id);
      }
    }
  }

  for (const pair of pairs) {
    if (pair.loss === 0) continue;
    const a = all.find(x => x.id === pair.aId);
    const b = all.find(x => x.id === pair.bId);
    if (!a || !b) continue;
    const overlapStart  = a.startDate > b.startDate ? a.startDate : b.startDate;
    const overlapEnd    = a.endDate   < b.endDate   ? a.endDate   : b.endDate;
    const inPeriodStart = overlapStart > periodStart ? overlapStart : periodStart;
    const inPeriodEnd   = overlapEnd   < periodEnd   ? overlapEnd   : periodEnd;
    if (inPeriodStart > inPeriodEnd) continue;
    const overlapDates = _datesInPeriod(inPeriodStart, inPeriodEnd);
    const dailyLoss = pair.loss / overlapDates.length;
    for (const date of overlapDates) {
      const d = dayMap.get(date);
      if (d) d.overlapLoss += dailyLoss;
    }
  }

  const byDay = periodDates.map(date => {
    const d  = dayMap.get(date);
    const gr = Math.round(d.grossRevenue);
    const ol = Math.round(d.overlapLoss);
    const nr = Math.max(0, gr - ol);
    return { date, grossRevenue: gr, overlapLoss: ol, netRevenue: nr,
             activityIds: [...new Set(d.activityIds)] };
  });

  return {
    periodStart, periodEnd,
    gross, grossCost, overlapLoss, net, netProfit,
    byDay, pairs: pairsWithLoss, coverage,
  };
}

// ── Global export for non-module scripts ──────────────────────────────────────

if (typeof window !== 'undefined') {
  window._forecast = { normalizeCampaign, aggregateForecast, MECHANIC_AFFINITY };
}
