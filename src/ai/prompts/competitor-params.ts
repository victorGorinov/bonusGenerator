import type { PromoType } from '../../validation/competitor.schema.js';

// The comparison-table rows per promo type: a stable param key + a human label
// (English — the model reads these to know what to look for and how to key its
// output). Both /search and /compare prompts read from this single source so
// the keys line up between "found by AI" and "normalised for comparison".
export interface ParamDef { key: string; label: string; hint: string }

export const COMPARE_PARAMS: Record<PromoType, ParamDef[]> = {
  bonus: [
    { key: 'matchPct',     label: 'Match %',        hint: 'deposit match percentage of the welcome/main bonus' },
    { key: 'maxBonus',     label: 'Max bonus',      hint: 'maximum bonus amount, with currency' },
    { key: 'wager',        label: 'Wager',          hint: 'wagering requirement multiplier, e.g. 35x' },
    { key: 'minDeposit',   label: 'Min deposit',    hint: 'minimum qualifying deposit, with currency' },
    { key: 'maxWin',       label: 'Max win',        hint: 'max win / cash-out cap from the bonus, or "no limit"' },
    { key: 'validityDays', label: 'Validity',       hint: 'days to wager/use the bonus' },
  ],
  tournament: [
    { key: 'prizePool',    label: 'Prize pool',     hint: 'total guaranteed prize pool, with currency' },
    { key: 'distribution', label: 'Distribution',   hint: 'payout spread, e.g. top-10 / top-20 / top-heavy / random' },
    { key: 'segmentReach', label: 'Segment reach',  hint: 'who can join, e.g. all players / depositors / VIP' },
    { key: 'frequency',    label: 'Frequency',      hint: 'cadence, e.g. daily / weekly / monthly' },
    { key: 'entry',        label: 'Entry',          hint: 'entry model, e.g. free / by deposit / buy-in amount' },
  ],
  loyalty: [
    { key: 'tiers',        label: 'Tiers',          hint: 'number of loyalty tiers' },
    { key: 'topCashback',  label: 'Top cashback',   hint: 'cashback % at the top tier' },
    { key: 'earnRate',     label: 'Earn rate',      hint: 'points earned per currency wagered/deposited, e.g. 1 / €1' },
    { key: 'redeemRate',   label: 'Redeem rate',    hint: 'points-to-cash conversion, e.g. 100 = €1' },
    { key: 'pointsExpiry', label: 'Points expiry',  hint: 'how long points stay valid, or "never"' },
  ],
  wheel: [
    { key: 'occasion',     label: 'Occasion',       hint: 'wheel type, e.g. welcome / daily / VIP' },
    { key: 'segments',     label: 'Segments',       hint: 'number of wheel segments' },
    { key: 'topPrize',     label: 'Top prize',      hint: 'best prize on the wheel, with currency' },
    { key: 'spinCost',     label: 'Spin cost',      hint: 'how a spin is earned, e.g. free daily / deposit ≥ €X / loyalty points' },
    { key: 'emptySlots',   label: 'Empty slots',    hint: 'share of "no win" segments, e.g. 12.5% or 0' },
    { key: 'winWager',     label: 'Win wager',      hint: 'wagering requirement on wheel winnings, e.g. 20x' },
  ],
};
