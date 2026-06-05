/**
 * Normalizes a heterogeneous Campaign record into a uniform NormalizedActivity.
 * Revenue/cost fields depend on sourceType; campaigns without econ get hasEcon=false.
 *
 * Keep in sync with public/forecast.js
 */

export type CampaignType =
  | 'reload' | 'cashback' | 'freespins' | 'tournament'
  | 'vip' | 'reactivation' | 'sportsbook' | 'custom';

export interface NormalizedActivity {
  id: string;
  title: string;
  type: CampaignType;
  segment: string;
  startDate: string;
  endDate: string;
  incrementalRevenue: number;
  cost: number;
  eligiblePlayers: number;
  hasEcon: boolean;
}

// Mirrors SEGMENT_RATIO in tournament-econ.js / calcEconomics.ts
const SEGMENT_RATIO: Record<string, number> = {
  all: 1.00, new: 0.20, vip: 0.10, dormant: 0.40, depositors: 0.60,
};

function daysBetween(start: string, end: string): number {
  const ms = Date.parse(end) - Date.parse(start);
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
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

export function normalizeCampaign(campaign: Campaign): NormalizedActivity | null {
  const id        = campaign.id        ?? 'unknown';
  const title     = campaign.title     ?? '';
  const type      = (campaign.type     ?? 'custom') as CampaignType;
  const segment   = campaign.segment   ?? 'all';
  const startDate = campaign.startDate ?? '';
  const endDate   = campaign.endDate   ?? startDate;

  if (!startDate) return null;

  const econ       = campaign.econ ?? null;
  const sourceType = campaign.sourceType ?? 'manual';
  const days       = daysBetween(startDate, endDate);

  if (!econ) {
    return { id, title, type, segment, startDate, endDate,
             incrementalRevenue: 0, cost: 0, eligiblePlayers: 0, hasEcon: false };
  }

  let revenue = 0;
  let cost    = 0;
  let eligible = 0;

  if (sourceType === 'tournament_generator') {
    // econ = calcTournamentEconomics() output (local currency, full duration)
    revenue  = Number(econ.ggrLiftMid)    || 0;
    cost     = Number(econ.prizePoolCost) || 0;
    eligible = Number(econ.eligible)      || 0;

  } else if (sourceType === 'campaign_generator') {
    // econ = buildConfig() econ object (USD benchmarks, monthly)
    const mBudget = Number(econ.mBudget) || 0;
    const roi3    = Number(econ.roi3)    || 0;     // ROI percentage (e.g. 45 → 45%)
    const monthlyRev = mBudget * (roi3 / 100);
    revenue  = Math.round(monthlyRev * days / 30);
    cost     = Math.round(mBudget   * days / 30);
    const pl = Number(econ.pl) || 0;
    // pl is already the targeted player count from buildConfig
    eligible = Math.round(pl * (SEGMENT_RATIO[segment] ?? 1.0));

  } else if (sourceType === 'loyalty_generator') {
    // econ = calcLoyaltyEconomics() output (USD, monthly cadence)
    const additionalRevenue3m = Number(econ.additionalRevenue3m) || 0;
    const monthlyCostUSD      = Number(econ.monthlyCostUSD)      || 0;
    const monthlyRev = additionalRevenue3m / 3;
    revenue  = Math.round(monthlyRev    * days / 30);
    cost     = Math.round(monthlyCostUSD * days / 30);
    eligible = 0; // players count not stored in econ snapshot

  } else {
    // manual / ai / template with an econ blob — no standardised schema
    return { id, title, type, segment, startDate, endDate,
             incrementalRevenue: 0, cost: 0, eligiblePlayers: 0, hasEcon: false };
  }

  // Guard: if all fields are zero treat as no-econ (avoid fake zeros from empty objects)
  const hasEcon = revenue !== 0 || cost !== 0 || eligible !== 0;

  return {
    id, title, type, segment, startDate, endDate,
    incrementalRevenue: revenue,
    cost,
    eligiblePlayers: eligible,
    hasEcon,
  };
}
