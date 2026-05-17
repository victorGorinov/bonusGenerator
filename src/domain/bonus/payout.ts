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

export function truncNormalPayout(B: number, W: number, adjWCR: number, adjRTP: number): number {
  if (B <= 0 || W <= 0) return 0;
  const be    = adjWCR / (1 - adjRTP);
  const mu    = B * (1 - W / be);
  const sigma = Math.sqrt(W * B / adjWCR);
  const z     = mu / sigma;
  return Math.max(0, mu * _Phi(z) + sigma * _phi(z));
}
