// Client mirror of src/domain/bonus/abuseRisk.ts — MUST stay in parity.
// Parity test: tests/domain/bonus.abuse.parity.test.js.
// Browser: window.RetomatBonusAbuse (configurator.js is a classic script); also ESM-exported.

import { scoreVectors } from './risk-vector.js';

const LOW_VARIANCE_KEYWORDS = ['live', 'table', 'roulette', 'blackjack', 'baccarat', 'poker'];

function isActive(opts, key, present) {
  if (opts && opts.activeTypes) return opts.activeTypes.includes(key);
  return present;
}

export function assessBonusAbuse(cfg, opts) {
  const vectors = [];
  const e = cfg.econ;
  const be = e.breakeven_wager;
  const wx = e.wagerX;
  const isSweep = cfg.r === 'sweep';
  const welcomeActive = isActive(opts, 'welcome', !!cfg.welcome);
  const ndbActive = isActive(opts, 'ndb', !!cfg.ndb);
  const cashbackActive = isActive(opts, 'cashback', !!cfg.cashback);

  let evTriggered = false;
  if (!isSweep && be > 0 && e.bonusSize > 0) {
    if (wx <= 0) {
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
        vectors.push({ key: 'ev_thin_margin', severity: 'warn', current: wx, threshold: +be.toFixed(1), mitigationKey: 'abuse_mit_ev' });
      }
    }
  }

  if (Array.isArray(cfg.contrib)) {
    let worst = 0;
    for (const c of cfg.contrib) {
      const name = String(c.game || '').toLowerCase();
      if (name.includes('slot')) continue;
      if (LOW_VARIANCE_KEYWORDS.some((k) => name.includes(k)) && c.pct > worst) worst = c.pct;
    }
    if (worst >= 50) {
      vectors.push({ key: 'low_contrib_clearing', severity: 'high', current: worst, threshold: 20, mitigationKey: 'abuse_mit_contrib' });
    } else if (worst >= 20) {
      vectors.push({ key: 'low_contrib_clearing', severity: 'warn', current: worst, threshold: 20, mitigationKey: 'abuse_mit_contrib' });
    }
  }

  if (welcomeActive && cfg.welcome) {
    const pct = Number(cfg.welcome['pct']) || 0;
    if (pct >= 200 && !isSweep && be > 0 && wx > 0 && wx < be) {
      vectors.push({ key: 'over_generous', severity: 'warn', current: pct, threshold: 200, mitigationKey: 'abuse_mit_generous' });
    }

    const minD = Number(cfg.welcome['minD']) || 0;
    if (minD > 0 && e.bonusSize > 0) {
      const ratio = e.bonusSize / minD;
      if (ratio >= 20) {
        vectors.push({ key: 'cheap_farm_mind', severity: 'warn', current: +ratio.toFixed(1), threshold: 20, mitigationKey: 'abuse_mit_mind' });
      }
    }

    const hasMaxWin = cfg.welcome['maxW'] != null || cfg.welcome['maxW_x'] != null;
    if (!hasMaxWin && !isSweep) {
      vectors.push({ key: 'no_maxwin', severity: evTriggered ? 'warn' : 'info', current: '—', threshold: 'set cap', mitigationKey: 'abuse_mit_maxwin' });
    }
  }

  if (ndbActive && cfg.ndb) {
    const maxWx = cfg.ndb['maxW_x'];
    const type = String(cfg.ndb['type'] || '');
    if (type !== 'daily') {
      if (maxWx == null) {
        vectors.push({ key: 'ndb_unbounded', severity: 'warn', current: '—', threshold: 10, mitigationKey: 'abuse_mit_ndb' });
      } else if (Number(maxWx) > 10) {
        vectors.push({ key: 'ndb_unbounded', severity: 'warn', current: Number(maxWx), threshold: 10, mitigationKey: 'abuse_mit_ndb' });
      }

      const trigger = String(cfg.ndb['trigger'] || '');
      if (trigger !== 'v_reg_verify') {
        vectors.push({ key: 'ndb_no_kyc', severity: 'high', current: trigger || '—', threshold: 'v_reg_verify', mitigationKey: 'abuse_mit_ndb_kyc' });
      }
    }
  }

  if (cashbackActive && cfg.cashback) {
    vectors.push({ key: 'cashback_hedge', severity: 'info', mitigationKey: 'abuse_mit_cashback' });
  }

  if (!isSweep && wx > 0) {
    vectors.push({ key: 'no_maxbet', severity: 'info', mitigationKey: 'abuse_mit_maxbet' });
  }

  return scoreVectors(vectors);
}

if (typeof window !== 'undefined') {
  window.RetomatBonusAbuse = { assessBonusAbuse };
}
