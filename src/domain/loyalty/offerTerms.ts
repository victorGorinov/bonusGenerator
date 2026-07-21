// Deterministic offer-terms builder for a LOYALTY program — turns the program
// config into an exact, human-readable terms list for the customer-facing page.
// Numbers come straight from the configured program (never from the AI).
// Loyalty is currency-agnostic on the backend (points + USD), so no geo re-scale.

import type { OfferTerm } from '../campaign/offerTerms.js';

type UiLang = 'en' | 'ru';

const LBL: Record<string, Record<UiLang, string>> = {
  type:      { en: 'Program type',   ru: 'Тип программы' },
  tiers:     { en: 'Tiers',          ru: 'Уровни' },
  cashback:  { en: 'Top-tier cashback', ru: 'Кэшбэк топ-уровня' },
  earnDep:   { en: 'Earn (deposit)', ru: 'Начисление (депозит)' },
  earnWag:   { en: 'Earn (wager)',   ru: 'Начисление (ставки)' },
  redeem:    { en: 'Redeem',         ru: 'Обмен баллов' },
  minRedeem: { en: 'Min redemption', ru: 'Мин. для обмена' },
  expiry:    { en: 'Points expiry',  ru: 'Срок действия баллов' },
  missions:  { en: 'Missions',       ru: 'Миссии' },
};

const MODE_V: Record<string, Record<UiLang, string>> = {
  tiers:    { en: 'Tier ladder (VIP)',      ru: 'Уровневая лестница (VIP)' },
  missions: { en: 'Mission-based rewards',  ru: 'Награды за миссии' },
  hybrid:   { en: 'Tiers + missions',       ru: 'Уровни + миссии' },
};

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export function buildLoyaltyTerms(
  config: Record<string, unknown> | undefined,
  uiLang: string | undefined,
): OfferTerm[] {
  const L: UiLang = uiLang === 'ru' ? 'ru' : 'en';
  const l = (k: string) => LBL[k]?.[L] ?? k;
  const terms: OfferTerm[] = [];
  if (!config) return terms;

  const mode = String(config['mode'] ?? 'hybrid');
  terms.push({ label: l('type'), value: (MODE_V[mode] ?? MODE_V['hybrid'])[L] });

  const tiers = (config['tiers'] as Array<Record<string, unknown>> | undefined) ?? [];
  if (tiers.length) {
    const first = String(tiers[0]?.['label'] ?? tiers[0]?.['name'] ?? '');
    const last  = String(tiers[tiers.length - 1]?.['label'] ?? tiers[tiers.length - 1]?.['name'] ?? '');
    const suffix = L === 'ru' ? `${tiers.length} ур.` : `${tiers.length} tiers`;
    terms.push({ label: l('tiers'), value: first && last ? `${first} → ${last} (${suffix})` : suffix });

    const topCb = num(tiers[tiers.length - 1]?.['cashbackRate']);
    if (topCb != null && topCb > 0) terms.push({ label: l('cashback'), value: `${(topCb * 100).toFixed(0)}%` });
  }

  const er = (config['earnRedeem'] as Record<string, unknown> | undefined) ?? {};
  const earnDep = num(er['earnRateDeposit']);
  if (earnDep != null) terms.push({ label: l('earnDep'), value: L === 'ru' ? `${earnDep} балл. за $1` : `${earnDep} pts / $1` });
  const earnWag = num(er['earnRateWager']);
  if (earnWag != null && earnWag > 0) terms.push({ label: l('earnWag'), value: L === 'ru' ? `${earnWag} балл. за $1` : `${earnWag} pts / $1` });
  const redeem = num(er['redeemRate']);
  if (redeem != null) terms.push({ label: l('redeem'), value: L === 'ru' ? `${redeem} балл. = $1` : `${redeem} pts = $1` });
  const minRedeem = num(er['redeemMinPoints']);
  if (minRedeem != null && minRedeem > 0) terms.push({ label: l('minRedeem'), value: L === 'ru' ? `${minRedeem} балл.` : `${minRedeem} pts` });
  const expiry = num(er['pointsExpiry']);
  if (expiry != null) {
    terms.push({
      label: l('expiry'),
      value: expiry > 0
        ? (L === 'ru' ? `${expiry} мес.` : `${expiry} months`)
        : (L === 'ru' ? 'Без срока' : 'No expiry'),
    });
  }

  const missions = (config['missions'] as unknown[] | undefined) ?? [];
  if (missions.length) terms.push({ label: l('missions'), value: String(missions.length) });

  return terms;
}
