// Loyalty abuse / anti-fraud risk assessment — deterministic, no AI.
//
// Anchor: the loyalty programme has a clean EV loop. "Redeemable value per $1 wagered"
// = earnRateWager / redeemRate. If that meets or exceeds the house edge, the programme
// itself is EV-positive per unit of turnover → deposit → wager → redeem → withdraw is a
// farmable loop, exactly analogous to a bonus sitting below its breakeven wager.
// A direct deposit rebate (earnRateDeposit / redeemRate) is the same idea without wagering.
//
// Thresholds are researched defaults (documented inline). house edge assumed 3% — typical
// mixed-iGaming GGR/turnover; the loyalty config carries no per-game RTP so we assume it.
// Browser mirror: public/loyalty-abuse.js (window.RetomatLoyaltyAbuse), parity-tested.

import { RiskVector, RiskAssessment, scoreVectors } from '../shared/RiskVector.js';

export const ASSUMED_HOUSE_EDGE = 0.03; // 3% GGR/turnover — conservative iGaming average

export interface LoyaltyAbuseInput {
  earnRedeem: {
    earnRateDeposit: number; // points per $1 deposited
    earnRateWager: number;   // points per $1 wagered
    redeemRate: number;      // points per $1 of redemption value
    redeemMinPoints: number;
    pointsExpiry: number;    // days, 0 = never
  };
  tiers?: Array<{ cashbackRate?: number; minPoints?: number }> | null;
  missions?: Array<{ rewardType: string; frequency: string; rewardValue: number }> | null;
  hasMissions?: boolean;
  avgdep?: number;
}

export function assessLoyaltyAbuse(cfg: LoyaltyAbuseInput): RiskAssessment {
  const vectors: RiskVector[] = [];
  const er = cfg.earnRedeem;
  const redeemRate = er.redeemRate > 0 ? er.redeemRate : 1;

  // ── 1. EV-positive turnover loop (the star vector) ──────────────────────────
  // Redeemable $ per $1 wagered vs house edge.
  const wagerValuePerDollar = er.earnRateWager / redeemRate;
  const pctW = +(wagerValuePerDollar * 100).toFixed(2);
  const edgePct = +(ASSUMED_HOUSE_EDGE * 100).toFixed(1);
  const ratioW = wagerValuePerDollar / ASSUMED_HOUSE_EDGE;
  if (ratioW >= 1.0) {
    vectors.push({ key: 'ev_positive_loop', severity: 'critical', current: pctW, threshold: edgePct, mitigationKey: 'abuse_mit_loy_ev' });
  } else if (ratioW >= 0.6) {
    vectors.push({ key: 'ev_positive_loop', severity: 'warn', current: pctW, threshold: edgePct, mitigationKey: 'abuse_mit_loy_ev' });
  }

  // ── 2. High direct deposit rebate (EV without even wagering) ────────────────
  // Points on *deposit* are cashable with minimal play. ~10% is normal loyalty practice;
  // 15%+ is generous enough to farm, 25%+ is a direct EV rebate.
  const depositValuePerDollar = er.earnRateDeposit / redeemRate;
  const pctD = +(depositValuePerDollar * 100).toFixed(2);
  if (depositValuePerDollar >= 0.25) {
    vectors.push({ key: 'deposit_rebate_high', severity: 'high', current: pctD, threshold: 15, mitigationKey: 'abuse_mit_loy_deposit' });
  } else if (depositValuePerDollar >= 0.15) {
    vectors.push({ key: 'deposit_rebate_high', severity: 'warn', current: pctD, threshold: 15, mitigationKey: 'abuse_mit_loy_deposit' });
  }

  // ── 3. Redemption reachable in one deposit cycle with no wagering ───────────
  const avgdep = cfg.avgdep || 0;
  if (avgdep > 0 && er.redeemMinPoints > 0) {
    const pointsPerCycle = avgdep * er.earnRateDeposit;
    if (pointsPerCycle >= er.redeemMinPoints) {
      // observed = points earned per deposit cycle; threshold = the redemption floor it clears.
      vectors.push({ key: 'redeem_no_wager', severity: 'warn', current: Math.round(pointsPerCycle), threshold: er.redeemMinPoints, mitigationKey: 'abuse_mit_loy_redeem' });
    }
  }

  // ── 4. Tier gaming / cashback hedge at the top tier ─────────────────────────
  if (Array.isArray(cfg.tiers) && cfg.tiers.length) {
    const topCb = cfg.tiers.reduce((m, t) => Math.max(m, Number(t.cashbackRate) || 0), 0);
    const pctCb = +(topCb * 100).toFixed(1);
    if (topCb >= 0.20) {
      vectors.push({ key: 'tier_gaming', severity: 'high', current: pctCb, threshold: 15, mitigationKey: 'abuse_mit_loy_tier' });
    } else if (topCb >= 0.15) {
      vectors.push({ key: 'tier_gaming', severity: 'warn', current: pctCb, threshold: 15, mitigationKey: 'abuse_mit_loy_tier' });
    }
  }

  // ── 5. Repeatable cash-bonus missions (low-risk extraction) ─────────────────
  if (cfg.hasMissions && Array.isArray(cfg.missions)) {
    const repeatableCash = cfg.missions.filter(
      (m) => m.rewardType === 'cash_bonus' && m.frequency !== 'one_time',
    ).length;
    if (repeatableCash > 0) {
      vectors.push({ key: 'mission_exploit', severity: 'warn', current: repeatableCash, threshold: 0, mitigationKey: 'abuse_mit_loy_mission' });
    }
  }

  // ── 6. Points never expire → hoarding/liability dump — standing note ────────
  if (er.pointsExpiry === 0) {
    vectors.push({ key: 'points_no_expiry', severity: 'info', mitigationKey: 'abuse_mit_loy_expiry' });
  }

  return scoreVectors(vectors);
}
