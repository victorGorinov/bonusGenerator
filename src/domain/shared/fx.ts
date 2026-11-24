// Currency scale — units of a site currency per 1 USD.
//
// Two distinct consumers, one table:
//
//  1. Tournament / wheel economics convert a USD-denominated ARPU benchmark into the
//     site currency (`deriveLocalFxRate`, which prefers a GEO_CFG-derived rate when one
//     exists and falls back to this table).
//
//  2. The bonus payout model (`domain/bonus/payout.ts`) uses it as a NUMERICAL SCALE.
//     `truncNormalPayout` models the post-wagering balance as Normal(mu, sigma) with
//     mu ∝ B and sigma ∝ √B — which is only dimensionally consistent if B is expressed
//     in units of one average bet. Feeding a raw site-currency amount instead made the
//     result depend on the currency's denomination: the same economic bonus returned a
//     17.4% payout ratio in EUR, 20.2% in GBP and ~0% in RUB/KZT/MNT (z fell to −20…−39
//     and Φ(z) underflowed). Normalising B by this rate makes the ratio identical in
//     every currency — the model now behaves as if one bet ≈ $1.
//
// These are FINANCIAL rates, deliberately separate from the DISPLAY rates in
// `public/geo-data.js` (which exist to render local-currency amounts and drift on a
// different schedule). Keep the browser mirrors in `public/bonus-cost.js` and
// `public/bonus-selected-econ.js` in sync with this table — parity tests assert it.
export const USD_TO_LOCAL: Record<string, number> = {
  USD:  1.00,
  USDT: 1.00,
  SC:   1.00,
  EUR:  0.92,
  GBP:  0.79,
  DKK:  7.37,
  RUB:  90.9,
  KZT:  500,
  MNT:  3448,
  // LatAm local currencies (per geo-data.js RATES — keep in sync).
  BRL:  5.5,
  MXN:  18.5,
  COP:  4100,
  ARS:  1050,
  PEN:  3.75,
  CLP:  950,
  // MENA / GCC display currencies. The backend never computes in these (sitecur is USD),
  // they are here so a caller that explicitly passes one still gets a sane rate.
  IQD:  1310,
  LYD:  4.85,
  SYP:  13000,
  AED:  3.6725,
  BTC:  0.000015,
  ETH:  0.00042,
};

/**
 * Units of `cur` per 1 USD. Unknown currencies fall back to 1 (treated as USD-scale),
 * which is the safe default: it leaves the payout model in the regime it was calibrated in.
 */
export function currencyScale(cur: string | undefined | null): number {
  const rate = USD_TO_LOCAL[String(cur ?? '').toUpperCase()];
  return Number.isFinite(rate) && (rate as number) > 0 ? (rate as number) : 1;
}
