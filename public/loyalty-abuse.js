// Client mirror of src/domain/loyalty/abuseRisk.ts — MUST stay in parity.
// Parity test: tests/domain/loyalty.abuse.parity.test.js.
// Browser: window.RetomatLoyaltyAbuse (configurator.js is a classic script); also ESM-exported.

import { scoreVectors } from './risk-vector.js';

export const ASSUMED_HOUSE_EDGE = 0.03;

export function assessLoyaltyAbuse(cfg) {
  const vectors = [];
  const er = cfg.earnRedeem;
  const redeemRate = er.redeemRate > 0 ? er.redeemRate : 1;

  const wagerValuePerDollar = er.earnRateWager / redeemRate;
  const pctW = +(wagerValuePerDollar * 100).toFixed(2);
  const edgePct = +(ASSUMED_HOUSE_EDGE * 100).toFixed(1);
  const ratioW = wagerValuePerDollar / ASSUMED_HOUSE_EDGE;
  if (ratioW >= 1.0) {
    vectors.push({ key: 'ev_positive_loop', severity: 'critical', current: pctW, threshold: edgePct, mitigationKey: 'abuse_mit_loy_ev' });
  } else if (ratioW >= 0.6) {
    vectors.push({ key: 'ev_positive_loop', severity: 'warn', current: pctW, threshold: edgePct, mitigationKey: 'abuse_mit_loy_ev' });
  }

  const depositValuePerDollar = er.earnRateDeposit / redeemRate;
  const pctD = +(depositValuePerDollar * 100).toFixed(2);
  if (depositValuePerDollar >= 0.25) {
    vectors.push({ key: 'deposit_rebate_high', severity: 'high', current: pctD, threshold: 15, mitigationKey: 'abuse_mit_loy_deposit' });
  } else if (depositValuePerDollar >= 0.15) {
    vectors.push({ key: 'deposit_rebate_high', severity: 'warn', current: pctD, threshold: 15, mitigationKey: 'abuse_mit_loy_deposit' });
  }

  const avgdep = cfg.avgdep || 0;
  if (avgdep > 0 && er.redeemMinPoints > 0) {
    const pointsPerCycle = avgdep * er.earnRateDeposit;
    if (pointsPerCycle >= er.redeemMinPoints) {
      vectors.push({ key: 'redeem_no_wager', severity: 'warn', current: Math.round(pointsPerCycle), threshold: er.redeemMinPoints, mitigationKey: 'abuse_mit_loy_redeem' });
    }
  }

  if (Array.isArray(cfg.tiers) && cfg.tiers.length) {
    const topCb = cfg.tiers.reduce((m, t) => Math.max(m, Number(t.cashbackRate) || 0), 0);
    const pctCb = +(topCb * 100).toFixed(1);
    if (topCb >= 0.20) {
      vectors.push({ key: 'tier_gaming', severity: 'high', current: pctCb, threshold: 15, mitigationKey: 'abuse_mit_loy_tier' });
    } else if (topCb >= 0.15) {
      vectors.push({ key: 'tier_gaming', severity: 'warn', current: pctCb, threshold: 15, mitigationKey: 'abuse_mit_loy_tier' });
    }
  }

  if (cfg.hasMissions && Array.isArray(cfg.missions)) {
    const repeatableCash = cfg.missions.filter(
      (m) => m.rewardType === 'cash_bonus' && m.frequency !== 'one_time',
    ).length;
    if (repeatableCash > 0) {
      vectors.push({ key: 'mission_exploit', severity: 'warn', current: repeatableCash, threshold: 0, mitigationKey: 'abuse_mit_loy_mission' });
    }
  }

  if (er.pointsExpiry === 0) {
    vectors.push({ key: 'points_no_expiry', severity: 'info', mitigationKey: 'abuse_mit_loy_expiry' });
  }

  return scoreVectors(vectors);
}

if (typeof window !== 'undefined') {
  window.RetomatLoyaltyAbuse = { assessLoyaltyAbuse, ASSUMED_HOUSE_EDGE };
}
