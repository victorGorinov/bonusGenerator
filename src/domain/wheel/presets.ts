// Wheel-of-Fortune segment presets — the FIXED starting layouts a user tweaks.
//
// First iteration exposes three ready-made wheels (welcome / daily / VIP). The
// user can edit each segment's weight and prize value, but cannot add/remove
// segments yet — a full segment editor is on the roadmap (see CLAUDE.md).
//
// A preset segment carries a relative `weight` (probabilities are normalised at
// build time, so tweaks never need to re-sum to 100) and a `mult` whose meaning
// depends on `prizeType` — see materializeSegments() in buildWheel.ts:
//   bonus_money / jackpot / physical → mult × avgDeposit  (currency amount)
//   free_spins                        → mult              (spin count)
//   cashback                          → mult              (fraction 0–1)
//   multiplier                        → mult              (deposit multiplier, e.g. 2)
//   nothing                           → 0

export type WheelPrizeType =
  | 'bonus_money'
  | 'free_spins'
  | 'cashback'
  | 'multiplier'
  | 'jackpot'
  | 'physical'
  | 'nothing';

export interface PresetSegment {
  prizeType: WheelPrizeType;
  weight:    number;   // relative weight
  mult:      number;   // interpreted per prizeType (see header)
  labelKey:  string;   // i18n key hint for the frontend (falls back to a generated label)
}

export interface WheelPreset {
  label:            string;
  defaultFrequency: WheelFrequency;
  segments:         PresetSegment[];
}

export type WheelFrequency = 'on_deposit' | 'daily' | 'weekly' | 'one_time';

export const WHEEL_PRESET_KEYS = ['welcome', 'daily', 'vip'] as const;
export type WheelPresetKey = (typeof WHEEL_PRESET_KEYS)[number];

export const WHEEL_PRESETS: Record<WheelPresetKey, WheelPreset> = {
  // Welcome wheel — first-deposit reward, generous, "everyone wins" (no empty).
  welcome: {
    label:            'Welcome Wheel',
    defaultFrequency: 'on_deposit',
    segments: [
      { prizeType: 'free_spins',  weight: 30, mult: 20,  labelKey: 'fs_20' },
      { prizeType: 'free_spins',  weight: 20, mult: 50,  labelKey: 'fs_50' },
      { prizeType: 'bonus_money', weight: 25, mult: 0.5, labelKey: 'bm_half' },
      { prizeType: 'bonus_money', weight: 15, mult: 1.0, labelKey: 'bm_one' },
      { prizeType: 'cashback',    weight: 8,  mult: 0.10, labelKey: 'cb_10' },
      { prizeType: 'jackpot',     weight: 2,  mult: 5.0, labelKey: 'jp_5x' },
    ],
  },

  // Daily wheel — retention loop, modest EV, includes an empty segment.
  daily: {
    label:            'Daily Wheel',
    defaultFrequency: 'daily',
    segments: [
      { prizeType: 'nothing',     weight: 25, mult: 0,    labelKey: 'none' },
      { prizeType: 'free_spins',  weight: 30, mult: 10,   labelKey: 'fs_10' },
      { prizeType: 'free_spins',  weight: 15, mult: 25,   labelKey: 'fs_25' },
      { prizeType: 'cashback',    weight: 15, mult: 0.05, labelKey: 'cb_5' },
      { prizeType: 'bonus_money', weight: 12, mult: 0.2,  labelKey: 'bm_fifth' },
      { prizeType: 'bonus_money', weight: 3,  mult: 0.5,  labelKey: 'bm_half' },
    ],
  },

  // VIP wheel — high-value rewards for retained depositors.
  vip: {
    label:            'VIP Wheel',
    defaultFrequency: 'weekly',
    segments: [
      { prizeType: 'free_spins',  weight: 25, mult: 50,   labelKey: 'fs_50' },
      { prizeType: 'bonus_money', weight: 25, mult: 1.0,  labelKey: 'bm_one' },
      { prizeType: 'bonus_money', weight: 20, mult: 2.0,  labelKey: 'bm_two' },
      { prizeType: 'cashback',    weight: 15, mult: 0.15, labelKey: 'cb_15' },
      { prizeType: 'multiplier',  weight: 10, mult: 2.0,  labelKey: 'mult_2' },
      { prizeType: 'jackpot',     weight: 5,  mult: 10.0, labelKey: 'jp_10x' },
    ],
  },
};

export function isWheelPresetKey(x: unknown): x is WheelPresetKey {
  return typeof x === 'string' && (WHEEL_PRESET_KEYS as readonly string[]).includes(x);
}
