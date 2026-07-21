// Deterministic offer-terms builder for a TOURNAMENT — turns the tournament spec
// into an exact, human-readable terms list for the customer-facing description page.
// Numbers come straight from the configured tournament (never from the AI).

import { GEO_CFG } from '../campaign/scenarios.js';
import type { OfferTerm } from '../campaign/offerTerms.js';

type UiLang = 'en' | 'ru';

const LBL: Record<string, Record<UiLang, string>> = {
  format:       { en: 'Format',            ru: 'Формат' },
  prizePool:    { en: 'Prize pool',        ru: 'Призовой фонд' },
  duration:     { en: 'Duration',          ru: 'Длительность' },
  entry:        { en: 'Entry',             ru: 'Вход' },
  reentry:      { en: 'Re-entry',          ru: 'Повторный вход' },
  scoring:      { en: 'Scoring',           ru: 'Подсчёт очков' },
  distribution: { en: 'Prize distribution', ru: 'Распределение призов' },
  eligibility:  { en: 'Eligibility',       ru: 'Кто участвует' },
};

const TYPE_V: Record<string, Record<UiLang, string>> = {
  slot:       { en: 'Slots tournament',      ru: 'Турнир по слотам' },
  live:       { en: 'Live casino tournament', ru: 'Турнир в лайв-казино' },
  mixed:      { en: 'Mixed tournament',      ru: 'Смешанный турнир' },
  prize_drop: { en: 'Prize drop',            ru: 'Prize Drop' },
};
const DURATION_V: Record<string, Record<UiLang, string>> = {
  flash:       { en: 'Flash (hours)',   ru: 'Флеш (часы)' },
  daily:       { en: 'Daily',           ru: 'Ежедневный' },
  weekly:      { en: 'Weekly',          ru: 'Еженедельный' },
  monthly:     { en: 'Monthly',         ru: 'Ежемесячный' },
  multi_round: { en: 'Multi-round',     ru: 'Многораундовый' },
};
const ENTRY_V: Record<string, Record<UiLang, string>> = {
  freeroll: { en: 'Free entry (freeroll)', ru: 'Бесплатный вход (freeroll)' },
  buyin:    { en: 'Buy-in',                 ru: 'Бай-ин' },
  ticket:   { en: 'Ticket entry',          ru: 'Вход по билету' },
};
const REENTRY_V: Record<string, Record<UiLang, string>> = {
  single:    { en: 'Single entry',      ru: 'Один вход' },
  rebuy:     { en: 'Rebuy allowed',     ru: 'Ребай разрешён' },
  unlimited: { en: 'Unlimited re-entry', ru: 'Неограниченный повторный вход' },
};
const SCORING_V: Record<string, Record<UiLang, string>> = {
  total_wins:         { en: 'Total wins',        ru: 'Сумма выигрышей' },
  highest_multiplier: { en: 'Highest multiplier', ru: 'Максимальный множитель' },
  most_spins:         { en: 'Most spins',        ru: 'Больше всего спинов' },
  mission_based:      { en: 'Mission-based',     ru: 'По миссиям' },
};
const DIST_V: Record<string, Record<UiLang, string>> = {
  top_n:        { en: 'Top-N winners',   ru: 'Топ-N победителей' },
  linear_decay: { en: 'Linear ladder',   ru: 'Линейная лестница' },
  flat_tier:    { en: 'Flat tiers',      ru: 'Равные тиры' },
  prize_drop:   { en: 'Random prize drop', ru: 'Случайный prize drop' },
};
const SEGMENT_V: Record<string, Record<UiLang, string>> = {
  all:        { en: 'All players',      ru: 'Все игроки' },
  new:        { en: 'New players',      ru: 'Новые игроки' },
  vip:        { en: 'VIP players',      ru: 'VIP-игроки' },
  dormant:    { en: 'Dormant players',  ru: 'Спящие игроки' },
  depositors: { en: 'Depositors',       ru: 'Игроки с депозитом' },
};

function pick(map: Record<string, Record<UiLang, string>>, key: string, L: UiLang): string | null {
  const row = map[key];
  return row ? row[L] : null;
}

export function buildTournamentTerms(
  type: string | undefined,
  params: Record<string, unknown> | undefined,
  spec: Record<string, unknown> | undefined,
  uiLang: string | undefined,
): OfferTerm[] {
  const L: UiLang = uiLang === 'ru' ? 'ru' : 'en';
  const l = (k: string) => LBL[k]?.[L] ?? k;
  const p = params ?? {};
  const s = spec ?? {};
  const terms: OfferTerm[] = [];

  const fmt = pick(TYPE_V, String(type ?? 'slot'), L);
  if (fmt) terms.push({ label: l('format'), value: fmt });

  const prizePool = Number(s['prizePool'] ?? p['prizePool'] ?? 0);
  if (prizePool > 0) {
    const geo = GEO_CFG[String(p['geo'] ?? 'de')] ?? GEO_CFG['de'];
    const cur = p['currency'] ? String(p['currency']) : geo.sitecur;
    terms.push({ label: l('prizePool'), value: `${cur} ${prizePool.toLocaleString('en-US')}` });
  }

  const dur = pick(DURATION_V, String(p['duration'] ?? 'weekly'), L);
  if (dur) terms.push({ label: l('duration'), value: dur });

  const entry = pick(ENTRY_V, String(p['entryModel'] ?? 'freeroll'), L);
  if (entry) terms.push({ label: l('entry'), value: entry });

  const reentry = pick(REENTRY_V, String(p['reentry'] ?? 'single'), L);
  if (reentry) terms.push({ label: l('reentry'), value: reentry });

  const scoring = pick(SCORING_V, String(p['scoring'] ?? 'total_wins'), L);
  if (scoring) terms.push({ label: l('scoring'), value: scoring });

  const dist = pick(DIST_V, String(p['distribution'] ?? 'top_n'), L);
  if (dist) terms.push({ label: l('distribution'), value: dist });

  const seg = pick(SEGMENT_V, String(p['segment'] ?? 'all'), L);
  if (seg) terms.push({ label: l('eligibility'), value: seg });

  return terms;
}
