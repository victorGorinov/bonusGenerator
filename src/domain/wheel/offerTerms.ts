// Deterministic offer-terms builder for a WHEEL OF FORTUNE — turns the wheel spec
// into an exact, human-readable terms list for the customer-facing description page.
// Numbers/prizes come straight from the configured wheel (never from the AI).

import type { OfferTerm } from '../campaign/offerTerms.js';

type UiLang = 'en' | 'ru';

const LBL: Record<string, Record<UiLang, string>> = {
  wheel:       { en: 'Wheel',        ru: 'Колесо' },
  cadence:     { en: 'Spin cadence', ru: 'Частота вращений' },
  prizes:      { en: 'Prizes',       ru: 'Призы' },
  segments:    { en: 'Segments',     ru: 'Секторов' },
  wager:       { en: 'Wagering',     ru: 'Отыгрыш' },
  eligibility: { en: 'Eligibility',  ru: 'Кто участвует' },
};

const PRESET_V: Record<string, Record<UiLang, string>> = {
  welcome: { en: 'Welcome wheel', ru: 'Приветственное колесо' },
  daily:   { en: 'Daily wheel',   ru: 'Ежедневное колесо' },
  vip:     { en: 'VIP wheel',     ru: 'VIP-колесо' },
};
const FREQ_V: Record<string, Record<UiLang, string>> = {
  on_deposit: { en: 'On each deposit', ru: 'При каждом депозите' },
  daily:      { en: 'Daily',           ru: 'Ежедневно' },
  weekly:     { en: 'Weekly',          ru: 'Еженедельно' },
  one_time:   { en: 'One-time',        ru: 'Разово' },
};
const PRIZE_V: Record<string, Record<UiLang, string>> = {
  bonus_money: { en: 'Bonus money',       ru: 'Бонусные деньги' },
  free_spins:  { en: 'Free spins',        ru: 'Фриспины' },
  cashback:    { en: 'Cashback',          ru: 'Кэшбэк' },
  multiplier:  { en: 'Deposit multiplier', ru: 'Множитель депозита' },
  jackpot:     { en: 'Jackpot',           ru: 'Джекпот' },
  physical:    { en: 'Physical prize',    ru: 'Физический приз' },
};
const SEGMENT_V: Record<string, Record<UiLang, string>> = {
  all:        { en: 'All players',     ru: 'Все игроки' },
  new:        { en: 'New players',     ru: 'Новые игроки' },
  vip:        { en: 'VIP players',     ru: 'VIP-игроки' },
  dormant:    { en: 'Dormant players', ru: 'Спящие игроки' },
  depositors: { en: 'Depositors',      ru: 'Игроки с депозитом' },
};

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export function buildWheelTerms(
  params: Record<string, unknown> | undefined,
  spec: Record<string, unknown> | undefined,
  uiLang: string | undefined,
): OfferTerm[] {
  const L: UiLang = uiLang === 'ru' ? 'ru' : 'en';
  const l = (k: string) => LBL[k]?.[L] ?? k;
  const p = params ?? {};
  const s = spec ?? {};
  const terms: OfferTerm[] = [];

  const preset = PRESET_V[String(s['preset'] ?? p['preset'] ?? 'welcome')];
  if (preset) terms.push({ label: l('wheel'), value: preset[L] });

  const freq = FREQ_V[String(s['frequency'] ?? p['frequency'] ?? 'daily')];
  if (freq) terms.push({ label: l('cadence'), value: freq[L] });

  const segments = Array.isArray(s['segments']) ? s['segments'] as Array<Record<string, unknown>>
                 : Array.isArray(p['segments']) ? p['segments'] as Array<Record<string, unknown>> : [];
  if (segments.length) {
    terms.push({ label: l('segments'), value: String(segments.length) });
    const prizeTypes = [...new Set(
      segments
        .map(seg => String(seg['prizeType']))
        .filter(pt => pt && pt !== 'nothing'),
    )];
    const prizeNames = prizeTypes.map(pt => PRIZE_V[pt]?.[L] ?? pt);
    if (prizeNames.length) terms.push({ label: l('prizes'), value: prizeNames.join(', ') });
  }

  const wager = num(p['wager']);
  if (wager != null && wager > 0) terms.push({ label: l('wager'), value: `×${wager}` });

  const seg = SEGMENT_V[String(p['segment'] ?? 'depositors')];
  if (seg) terms.push({ label: l('eligibility'), value: seg[L] });

  return terms;
}
