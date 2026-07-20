import { truncNormalPayout } from '../bonus/payout.js';
import {
  WHEEL_PRESETS, isWheelPresetKey,
  type WheelPresetKey, type WheelPrizeType, type WheelFrequency,
} from './presets.js';

// A materialized wheel segment: prizeValue is a concrete number in SITE currency
// (for bonus_money/jackpot/physical), a spin count (free_spins), a fraction
// (cashback), or a bare multiplier (multiplier). See segmentCost() for how each
// converts to a real casino cost.
export interface WheelSegment {
  labelKey:   string;
  prizeType:  WheelPrizeType;
  weight:     number;      // relative weight (normalised at read time)
  prizeValue: number;
}

export interface WheelCostContext {
  avgDeposit: number;   // site currency
  betValue:   number;   // site currency — nominal value of one free spin
  wager:      number;   // wagering multiplier applied to bonus_money / multiplier prizes
  wcr:        number;   // wager contribution ratio (slots ≈ 1.0)
  rtp:        number;   // 0–1
}

/**
 * Real casino cost of a single segment prize, in site currency.
 * bonus_money / multiplier flow through the same Truncated-Normal payout model
 * used by the bonus engine (payout.ts) so wheel EV is consistent with bonus cost.
 */
export function segmentCost(seg: WheelSegment, ctx: WheelCostContext): number {
  switch (seg.prizeType) {
    case 'bonus_money':
      return truncNormalPayout(seg.prizeValue, ctx.wager, ctx.wcr, ctx.rtp);
    case 'multiplier': {
      // Deposit multiplier → extra bonus money of (mult − 1) × avgDeposit, wagered.
      const extra = Math.max(0, (seg.prizeValue - 1)) * ctx.avgDeposit;
      return truncNormalPayout(extra, ctx.wager, ctx.wcr, ctx.rtp);
    }
    case 'free_spins':
      // Expected payout handed to the player ≈ spins × bet × RTP.
      return seg.prizeValue * ctx.betValue * ctx.rtp;
    case 'cashback':
      // Fraction of an average lost deposit returned as cash.
      return seg.prizeValue * ctx.avgDeposit;
    case 'jackpot':
    case 'physical':
      // Already a nominal currency amount (materialised as mult × avgDeposit).
      return seg.prizeValue;
    case 'nothing':
      return 0;
    default:
      return 0;
  }
}

// Expected value of one spin, in site currency: Σ (weightᵢ / Σweight) × costᵢ.
export function wheelExpectedValue(segments: WheelSegment[], ctx: WheelCostContext): number {
  const totalWeight = segments.reduce((s, seg) => s + Math.max(0, seg.weight), 0);
  if (totalWeight <= 0) return 0;
  return segments.reduce((sum, seg) => sum + (Math.max(0, seg.weight) / totalWeight) * segmentCost(seg, ctx), 0);
}

// Most expensive single segment cost — used for max-risk (a top-prize hit).
export function wheelTopPrizeCost(segments: WheelSegment[], ctx: WheelCostContext): number {
  return segments.reduce((mx, seg) => Math.max(mx, segmentCost(seg, ctx)), 0);
}

function materializeSegments(presetKey: WheelPresetKey, avgDeposit: number): WheelSegment[] {
  return WHEEL_PRESETS[presetKey].segments.map((s) => {
    let prizeValue: number;
    switch (s.prizeType) {
      case 'bonus_money':
      case 'jackpot':
      case 'physical':
        prizeValue = Math.round(s.mult * avgDeposit);
        break;
      case 'free_spins':
        prizeValue = Math.round(s.mult);   // spin count
        break;
      case 'cashback':
        prizeValue = s.mult;               // fraction 0–1
        break;
      case 'multiplier':
        prizeValue = s.mult;               // bare multiplier
        break;
      default:
        prizeValue = 0;
    }
    return { labelKey: s.labelKey, prizeType: s.prizeType, weight: s.weight, prizeValue };
  });
}

export interface BuildWheelParams {
  preset:      string;
  avgDeposit:  number;               // site currency
  frequency?:  WheelFrequency;
  segments?:   WheelSegment[];       // user-tweaked override; falls back to preset materialization
}

export interface WheelSpec {
  preset:     WheelPresetKey;
  frequency:  WheelFrequency;
  segments:   WheelSegment[];
}

export function buildWheel(params: BuildWheelParams): WheelSpec {
  const presetKey: WheelPresetKey = isWheelPresetKey(params.preset) ? params.preset : 'welcome';
  const preset    = WHEEL_PRESETS[presetKey];
  const frequency = params.frequency ?? preset.defaultFrequency;
  const segments  = params.segments && params.segments.length > 0
    ? params.segments
    : materializeSegments(presetKey, params.avgDeposit);
  return { preset: presetKey, frequency, segments };
}
