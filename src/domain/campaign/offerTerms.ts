// Deterministic offer-terms builder — turns a bonus mechanic config into an
// exact, human-readable terms list for the customer-facing offer description page.
//
// The numbers here come straight from the configured mechanic (never from the AI),
// so the terms block on the description page is guaranteed accurate and consistent
// with the Configurator / economics model. The AI writes prose around these terms;
// it does not invent or alter them.

export interface OfferTerm { label: string; value: string }

type UiLang = 'en' | 'ru';

const LBL: Record<string, Record<UiLang, string>> = {
  type:      { en: 'Bonus type',   ru: 'Тип бонуса' },
  match:     { en: 'Match',        ru: 'Процент бонуса' },
  maxBonus:  { en: 'Max bonus',    ru: 'Макс. бонус' },
  minDep:    { en: 'Min deposit',  ru: 'Мин. депозит' },
  wager:     { en: 'Wagering',     ru: 'Отыгрыш' },
  noWager:   { en: 'No wagering',  ru: 'Без отыгрыша' },
  freeSpins: { en: 'Free spins',   ru: 'Фриспины' },
  validity:  { en: 'Validity',     ru: 'Срок действия' },
  promoCode: { en: 'Promo code',   ru: 'Промокод' },
  cashback:  { en: 'Cashback',     ru: 'Кэшбэк' },
  period:    { en: 'Period',       ru: 'Период' },
  minLoss:   { en: 'Min loss',     ru: 'Мин. проигрыш' },
  maxAmount: { en: 'Max amount',   ru: 'Макс. сумма' },
  noDeposit: { en: 'No deposit required', ru: 'Без депозита' },
};

const TYPE_NAME: Record<string, Record<UiLang, string>> = {
  welcome:  { en: 'Welcome bonus',      ru: 'Приветственный бонус' },
  dep2:     { en: '2nd deposit bonus',  ru: 'Бонус на 2-й депозит' },
  dep3:     { en: '3rd deposit bonus',  ru: 'Бонус на 3-й депозит' },
  reload:   { en: 'Reload bonus',       ru: 'Релоад-бонус' },
  ndb:      { en: 'No-deposit bonus',   ru: 'Бездепозитный бонус' },
  cashback: { en: 'Cashback',           ru: 'Кэшбэк' },
  match:    { en: 'Match bonus',        ru: 'Депозитный бонус' },
};

const WORD: Record<string, Record<UiLang, string>> = {
  weekly:  { en: 'Weekly',       ru: 'Еженедельно' },
  monthly: { en: 'Monthly',      ru: 'Ежемесячно' },
  ofLoss:  { en: 'of net losses', ru: 'от чистого проигрыша' },
  days:    { en: 'days',         ru: 'дней' },
  fs:      { en: 'free spins',   ru: 'фриспинов' },
};

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/**
 * Build the exact terms list for an offer, from its mechanic config.
 * @param mechanic     the bonus config object (from buildConfig / draft.mechanics)
 * @param mechanicType welcome | dep2 | dep3 | reload | ndb | cashback | ...
 * @param uiLang       label language ('en' | 'ru')
 */
export function buildOfferTerms(
  mechanic: Record<string, unknown> | null | undefined,
  mechanicType: string | undefined,
  uiLang: string | undefined,
): OfferTerm[] {
  const L: UiLang = uiLang === 'ru' ? 'ru' : 'en';
  const l = (k: string) => LBL[k]?.[L] ?? k;
  const w = (k: string) => WORD[k]?.[L] ?? k;
  const terms: OfferTerm[] = [];
  if (!mechanic) return terms;

  const m   = mechanic;
  const cur = String(m['cur'] ?? '').trim();
  const withCur = (v: number) => cur ? `${v} ${cur}` : String(v);
  const type = mechanicType || (m['type'] as string) || 'match';

  // Type row
  terms.push({ label: l('type'), value: (TYPE_NAME[type] ?? TYPE_NAME['match'])[L] });

  if (type === 'cashback') {
    const pct = num(m['pct']);
    if (pct != null) terms.push({ label: l('cashback'), value: `${pct}% ${w('ofLoss')}` });
    const period = m['model'] === 'tier' ? w('monthly') : w('weekly');
    terms.push({ label: l('period'), value: period });
    const minLoss = num(m['minLoss']);
    if (minLoss != null) terms.push({ label: l('minLoss'), value: withCur(minLoss) });
    const maxAmt = num(m['maxAmt']);
    if (maxAmt != null) terms.push({ label: l('maxAmount'), value: withCur(maxAmt) });
    terms.push({ label: l('wager'), value: l('noWager') });
    return terms;
  }

  if (type === 'ndb') {
    const fs  = num(m['fs']);
    const amt = num(m['amt']);
    if (fs != null)       terms.push({ label: l('freeSpins'), value: `${fs} ${w('fs')}` });
    else if (amt != null) terms.push({ label: l('maxBonus'),  value: withCur(amt) });
    terms.push({ label: l('minDep'), value: l('noDeposit') });
    const wager = num(m['wager']);
    if (wager != null) terms.push({ label: l('wager'), value: `×${wager}` });
    const days = num(m['days']);
    if (days != null) terms.push({ label: l('validity'), value: `${days} ${w('days')}` });
    if (m['code']) terms.push({ label: l('promoCode'), value: String(m['code']) });
    return terms;
  }

  // Match bonuses: welcome / dep2 / dep3 / reload / generic
  const pct = num(m['pct']);
  if (pct != null) terms.push({ label: l('match'), value: `${pct}%` });
  const maxB = num(m['maxB']);
  if (maxB != null) terms.push({ label: l('maxBonus'), value: withCur(maxB) });
  const minD = num(m['minD']);
  if (minD != null) terms.push({ label: l('minDep'), value: withCur(minD) });
  const wager = num(m['wager']);
  if (wager != null) terms.push({ label: l('wager'), value: `×${wager}` });
  const fs = num(m['fs']);
  if (fs != null) terms.push({ label: l('freeSpins'), value: `${fs} ${w('fs')}` });
  const days = num(m['days']);
  terms.push({ label: l('validity'), value: `${days ?? 30} ${w('days')}` });
  if (m['code']) terms.push({ label: l('promoCode'), value: String(m['code']) });
  return terms;
}
