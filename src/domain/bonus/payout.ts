export function _erf(x: number): number {
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

export function _phi(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

export function _Phi(z: number): number {
  return 0.5 * (1 + _erf(z / Math.SQRT2));
}

// Post-wagering balance parameters, in units of one average bet.
//
// `scale` converts a site-currency amount into those units (see domain/shared/fx.ts).
// It matters because mu grows linearly with B while sigma grows as √B: passing a raw
// site-currency amount makes the payout RATIO depend on the currency's denomination.
// Normalising first makes the model scale-invariant, which is what lets RUB/KZT/MNT
// produce the same ratio as EUR/USD instead of underflowing to zero.
function _params(B: number, W: number, adjWCR: number, adjRTP: number, scale: number) {
  const s  = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const b  = B / s;
  const be = adjWCR / (1 - adjRTP);
  return { s, mu: b * (1 - W / be), sigma: Math.sqrt(W * b / adjWCR) };
}

/**
 * Expected payout of a bonus: E[max(X, 0)] where X is the post-wagering balance.
 * Returns a site-currency amount. `scale` = units of that currency per 1 USD.
 */
export function truncNormalPayout(B: number, W: number, adjWCR: number, adjRTP: number, scale = 1): number {
  if (B <= 0 || W <= 0) return 0;
  const { s, mu, sigma } = _params(B, W, adjWCR, adjRTP, scale);
  if (!(sigma > 0)) return 0;
  const z = mu / sigma;
  // Clamped to B: with no max-win term the normal model has unbounded upside, so a bonus
  // that is very small relative to one bet can produce E[X⁺] > B. That is outside the
  // range the model is calibrated for — treat the full bonus as the ceiling.
  return Math.min(B, Math.max(0, mu * _Phi(z) + sigma * _phi(z)) * s);
}

/**
 * Expected payout under a max-win cap: E[min(max(X, 0), C)].
 *
 * Closed form — no approximation:
 *   E[min(X⁺, C)] = E[X⁺] − E[(X − C)⁺]
 * with both terms being the same truncated-normal expectation evaluated at 0 and at C.
 *
 * This is what a real "max win" term does: it truncates the upper tail. The previous
 * implementation clamped the ALREADY-AVERAGED payout (`min(E[X⁺], C)`), so any cap set
 * above the mean — i.e. every realistic one, since caps are quoted as a multiple of the
 * bonus while the mean is a fraction of it — had no effect at all.
 */
export function truncNormalPayoutCapped(
  B: number, W: number, adjWCR: number, adjRTP: number, maxWin: number, scale = 1,
): number {
  if (B <= 0 || W <= 0) return 0;
  if (!(maxWin > 0)) return truncNormalPayout(B, W, adjWCR, adjRTP, scale);
  const { s, mu, sigma } = _params(B, W, adjWCR, adjRTP, scale);
  if (!(sigma > 0)) return 0;

  const c  = maxWin / s;                 // cap in the same normalised units
  const e0 = mu * _Phi(mu / sigma) + sigma * _phi(mu / sigma);
  const zc = (mu - c) / sigma;
  const ec = (mu - c) * _Phi(zc) + sigma * _phi(zc);
  return Math.min(B, Math.max(0, Math.min(e0 - ec, c)) * s);
}
