// Bonus abuse / anti-fraud risk assessment — deterministic, no AI.
//
// Anchor: the casino's edge is `breakeven_wager = mixedWCR / (1 - mixedRTP)`. When the
// offered wager (`wagerX`) sits at or below breakeven, the bonus is EV-positive for the
// player → bonus hunters clear it and withdraw. Everything else (game-contribution
// clearing, cheap-farm min deposit, unbounded max win, NDB multi-accounting) layers on
// structural checks over the same config the Configurator already produces.
//
// Thresholds are researched defaults (documented inline); tune here + in the mirror.
// Browser mirror: public/bonus-abuse.js (window.RetomatBonusAbuse), parity-tested.

import { RiskVector, RiskAssessment, scoreVectors } from '../shared/RiskVector.js';

/** Minimal slice of the buildConfig output this engine reads. */
export interface BonusAbuseInput {
  r?: string; // region code ('sweep' has no cashable-wager abuse model)
  econ: {
    breakeven_wager: number;
    wagerX: number;
    bonusSize: number;
    over_breakeven?: boolean;
  };
  welcome?: Record<string, unknown> | null;
  ndb?: Record<string, unknown> | null;
  cashback?: Record<string, unknown> | null;
  contrib?: Array<{ game: string; pct: number }> | null;
}

export interface BonusAbuseOpts {
  /** Which mechanics are actually offered — gates NDB/cashback vectors. */
  activeTypes?: string[];
}

// Game classes whose high RTP + low variance make them cheap wager-clearing vehicles.
const LOW_VARIANCE_KEYWORDS = ['live', 'table', 'roulette', 'blackjack', 'baccarat', 'poker'];

function isActive(opts: BonusAbuseOpts | undefined, key: string, present: boolean): boolean {
  if (opts?.activeTypes) return opts.activeTypes.includes(key);
  return present; // no explicit list → infer from presence
}

export function assessBonusAbuse(cfg: BonusAbuseInput, opts?: BonusAbuseOpts): RiskAssessment {
  const vectors: RiskVector[] = [];
  const e = cfg.econ;
  const be = e.breakeven_wager;
  const wx = e.wagerX;
  const isSweep = cfg.r === 'sweep';
  const welcomeActive = isActive(opts, 'welcome', !!cfg.welcome);
  const ndbActive = isActive(opts, 'ndb', !!cfg.ndb);
  const cashbackActive = isActive(opts, 'cashback', !!cfg.cashback);

  // ── 1. EV-positive bonus (the star vector) ──────────────────────────────────
  // Skip sweeps: their sweeps-coin model isn't a cashable-wager EV loop.
  let evTriggered = false;
  if (!isSweep && be > 0 && e.bonusSize > 0) {
    if (wx <= 0) {
      // No wagering requirement on a cashable bonus = free money.
      vectors.push({ key: 'ev_positive', severity: 'critical', current: 0, threshold: be, mitigationKey: 'abuse_mit_ev' });
      evTriggered = true;
    } else {
      const ratio = wx / be;
      if (ratio < 0.85) {
        vectors.push({ key: 'ev_positive', severity: 'critical', current: wx, threshold: be, mitigationKey: 'abuse_mit_ev' });
        evTriggered = true;
      } else if (ratio < 1.0) {
        vectors.push({ key: 'ev_positive', severity: 'high', current: wx, threshold: be, mitigationKey: 'abuse_mit_ev' });
        evTriggered = true;
      } else if (ratio < 1.15) {
        // Thin edge — small model error or a low-margin game mix flips it positive.
        vectors.push({ key: 'ev_thin_margin', severity: 'warn', current: wx, threshold: +be.toFixed(1), mitigationKey: 'abuse_mit_ev' });
      }
    }
  }

  // ── 2. Low-variance game contribution → cheap wager clearing ────────────────
  if (Array.isArray(cfg.contrib)) {
    let worst = 0;
    for (const c of cfg.contrib) {
      const name = String(c.game || '').toLowerCase();
      if (name.includes('slot')) continue; // slots are the intended clearing vehicle
      if (LOW_VARIANCE_KEYWORDS.some((k) => name.includes(k)) && c.pct > worst) worst = c.pct;
    }
    if (worst >= 50) {
      vectors.push({ key: 'low_contrib_clearing', severity: 'high', current: worst, threshold: 20, mitigationKey: 'abuse_mit_contrib' });
    } else if (worst >= 20) {
      vectors.push({ key: 'low_contrib_clearing', severity: 'warn', current: worst, threshold: 20, mitigationKey: 'abuse_mit_contrib' });
    }
  }

  // ── 3. Over-generous match combined with an easy wager ──────────────────────
  if (welcomeActive && cfg.welcome) {
    const pct = Number(cfg.welcome['pct']) || 0;
    if (pct >= 200 && !isSweep && be > 0 && wx > 0 && wx < be) {
      vectors.push({ key: 'over_generous', severity: 'warn', current: pct, threshold: 200, mitigationKey: 'abuse_mit_generous' });
    }

    // ── 4. Cheap farm: bonus large relative to the min deposit that unlocks it ─
    const minD = Number(cfg.welcome['minD']) || 0;
    if (minD > 0 && e.bonusSize > 0) {
      const ratio = e.bonusSize / minD;
      if (ratio >= 20) {
        vectors.push({ key: 'cheap_farm_mind', severity: 'warn', current: +ratio.toFixed(1), threshold: 20, mitigationKey: 'abuse_mit_mind' });
      }
    }

    // ── 5. No max-win (max cashout) cap on the deposit bonus ──────────────────
    // The config models no bonus-winnings ceiling → exposure is unbounded.
    const hasMaxWin = cfg.welcome['maxW'] != null || cfg.welcome['maxW_x'] != null;
    if (!hasMaxWin && !isSweep) {
      vectors.push({ key: 'no_maxwin', severity: evTriggered ? 'warn' : 'info', current: '—', threshold: 'set cap', mitigationKey: 'abuse_mit_maxwin' });
    }
  }

  // ── 6. NDB with an unbounded / missing max-win multiplier ───────────────────
  if (ndbActive && cfg.ndb) {
    const maxWx = cfg.ndb['maxW_x'];
    const type = String(cfg.ndb['type'] || '');
    if (type !== 'daily') {
      if (maxWx == null) {
        vectors.push({ key: 'ndb_unbounded', severity: 'warn', current: '—', threshold: 10, mitigationKey: 'abuse_mit_ndb' });
      } else if (Number(maxWx) > 10) {
        vectors.push({ key: 'ndb_unbounded', severity: 'warn', current: Number(maxWx), threshold: 10, mitigationKey: 'abuse_mit_ndb' });
      }
      // maxW_x present and ≤ 10 → safeguard in place, no flag.

      // NDB is inherently a multi-accounting magnet; confirm the KYC/1-per-account gate.
      const trigger = String(cfg.ndb['trigger'] || '');
      if (trigger !== 'v_reg_verify') {
        vectors.push({ key: 'ndb_no_kyc', severity: 'high', current: trigger || '—', threshold: 'v_reg_verify', mitigationKey: 'abuse_mit_ndb_kyc' });
      }
    }
  }

  // ── 7. Cashback without velocity limits (hedge abuse) — standing note ────────
  if (cashbackActive && cfg.cashback) {
    vectors.push({ key: 'cashback_hedge', severity: 'info', mitigationKey: 'abuse_mit_cashback' });
  }

  // ── 8. No max-bet-during-wagering is modeled anywhere — universal reminder ───
  if (!isSweep && wx > 0) {
    vectors.push({ key: 'no_maxbet', severity: 'info', mitigationKey: 'abuse_mit_maxbet' });
  }

  return scoreVectors(vectors);
}
