// ══════════════════════════════════════════════════════════════════════════
// CONFIGURATOR.JS — Unified Promo Configurator (Bonus / Tournament / Loyalty)
// ══════════════════════════════════════════════════════════════════════════

// ── CONSTANTS ──────────────────────────────────────────────────────────────

const CFG_GEO = [
  { val:'de', lbl:'🇩🇪 Germany',     region:'eu',     lic:'mga',  cur:'EUR', avgdep:50 },
  { val:'fr', lbl:'🇫🇷 France',      region:'eu',     lic:'mga',  cur:'EUR', avgdep:45 },
  { val:'es', lbl:'🇪🇸 Spain',       region:'eu',     lic:'mga',  cur:'EUR', avgdep:40 },
  { val:'it', lbl:'🇮🇹 Italy',       region:'eu',     lic:'mga',  cur:'EUR', avgdep:40 },
  { val:'nl', lbl:'🇳🇱 Netherlands', region:'eu',     lic:'mga',  cur:'EUR', avgdep:55 },
  { val:'dk', lbl:'🇩🇰 Denmark',     region:'eu',     lic:'dga',  cur:'DKK', avgdep:700 },
  { val:'uk', lbl:'🇬🇧 UK',          region:'eu',     lic:'ukgc', cur:'GBP', avgdep:45 },
  { val:'ru', lbl:'🇷🇺 Russia',      region:'cis',    lic:'none', cur:'RUB', avgdep:3000 },
  { val:'kz', lbl:'🇰🇿 Kazakhstan',  region:'cis',    lic:'none', cur:'KZT', avgdep:15000 },
  { val:'mn', lbl:'🇲🇳 Mongolia',    region:'mn',     lic:'none', cur:'MNT', avgdep:80000 },
  { val:'us', lbl:'🇺🇸 USA Sweep',   region:'sweep',  lic:'none', cur:'USD', avgdep:30 },
  { val:'mx', lbl:'🇲🇽 Mexico',      region:'latam',  lic:'none', cur:'USD', avgdep:35 },
  { val:'br', lbl:'🇧🇷 Brazil',      region:'latam',  lic:'none', cur:'USD', avgdep:30 },
];

const TOURN_TYPES = [
  { val:'slot',       icon:'🎰', name_en:'Slots',       name_ru:'Слоты',       desc_en:'Leaderboard by slot performance', desc_ru:'Лидерборд по слотам' },
  { val:'live',       icon:'🃏', name_en:'Live Casino',  name_ru:'Лайв',        desc_en:'Live table game tournament',      desc_ru:'Лайв-турнир' },
  { val:'mixed',      icon:'🎲', name_en:'Mixed',        name_ru:'Смешанный',   desc_en:'Slots + live games',              desc_ru:'Слоты + лайв' },
  { val:'prize_drop', icon:'💎', name_en:'Prize Drop',   name_ru:'Prize Drop',  desc_en:'Random prizes during play',       desc_ru:'Случайные призы' },
];

const LOYALTY_MODES = [
  { val:'tiers',    icon:'🏅', name_en:'Tiers',    name_ru:'Тиры',     desc_en:'Bronze → Diamond ladder', desc_ru:'Лестница тиров' },
  { val:'missions', icon:'🎯', name_en:'Missions',  name_ru:'Миссии',   desc_en:'Task-based rewards',      desc_ru:'Задачи с наградами' },
  { val:'hybrid',   icon:'⭐', name_en:'Hybrid',   name_ru:'Гибрид',   desc_en:'Tiers + missions',        desc_ru:'Тиры + миссии' },
];

const TIER_DEFS = [
  { name:'Bronze',   icon:'🥉', color:'#CD7F32', bg:'rgba(205,127,50,.15)' },
  { name:'Silver',   icon:'🥈', color:'#9CA3AF', bg:'rgba(156,163,175,.15)' },
  { name:'Gold',     icon:'🥇', color:'#F59E0B', bg:'rgba(245,158,11,.15)' },
  { name:'Platinum', icon:'💠', color:'#94A3B8', bg:'rgba(148,163,184,.15)' },
  { name:'Diamond',  icon:'💎', color:'#60A5FA', bg:'rgba(96,165,250,.15)' },
];

// ── STATE ──────────────────────────────────────────────────────────────────

const CS = {
  type: localStorage.getItem('cfg_type') || 'bonus',

  bonus: {
    geo: 'de',
    players: 5000,
    segment: 'mid',
    plat: 'both',
    rtp: 96,
    // which mechanics are active
    active: { welcome:true, ndb:false, dep2:true, dep3:true, reload:false, cashback:false, fs:false },
    // per-mechanic override values (filled after first Calculate)
    ov: {
      w_pct:100, w_wager:30, w_maxB:200, w_minD:10, w_maxWin:0,
      ndb_amt:10, ndb_wager:40, ndb_maxWin:0,
      d2_pct:50,  d2_wager:35, d2_maxB:100, d2_minD:10, d2_maxWin:0,
      d3_pct:25,  d3_wager:40, d3_maxB:50,  d3_minD:10, d3_maxWin:0,
      rl_pct:50,  rl_wager:35, rl_maxB:100, rl_minD:10, rl_maxWin:0,
      cb_pct:10,
      fs_count:50, fs_wager:30, fs_value:0.1, fs_maxWin:0,
    },
    // last API result
    config: null,
    costs: null,
  },

  tournament: {
    type: 'slot', geo: 'de',
    segment: 'all', totalPlayers: 5000,
    duration: 'weekly', prizePool: 5000,
    poolModel: 'fixed', distribution: 'top_n',
    entryModel: 'freeroll', scoring: 'total_wins',
    reentry: 'single', rake: 5,
    result: null,
  },

  loyalty: {
    mode: 'hybrid', region: 'eu', segment: 'mid',
    players: 5000, avgdep: 100, arpu: 50,
    numTiers: 5, topCashbackRate: 10,
    earnRateDeposit: 10, earnRateWager: 1,
    redeemRate: 100, redeemMinPoints: 1000,
    pointsExpiry: 0, missionCount: 3,
    result: null,
  },
};

// AI state per type
const CAI = {
  bonus:      { tab:'econ', audit:null, optimize:null, auditLoading:false, optimizeLoading:false },
  tournament: { tab:'econ', audit:null, optimize:null, auditLoading:false, optimizeLoading:false },
  loyalty:    { tab:'econ', audit:null, optimize:null, missions:null, auditLoading:false, optimizeLoading:false, missionsLoading:false },
};

let _recalcTimer = null;
let _generating  = false;

// ── I18N ──────────────────────────────────────────────────────────────────

function cfgLang() { return localStorage.getItem('bonusLang') || 'ru'; }
function cfgT(key) { return (CFG_I18N[cfgLang()] || CFG_I18N.en)[key] || key; }
function cfgSetLang(lang) {
  try { localStorage.setItem('bonusLang', lang); } catch(e){}
  document.querySelectorAll('.lt-btn').forEach(b => b.classList.toggle('active', b.id === 'lt-' + lang));
  applyNavLang(lang);
  cfgRender();
}

const CFG_I18N = {
  en: {
    title: 'Configurator',
    type_bonus:'🎁 Bonus', type_tourn:'🏆 Tournament', type_loyal:'⭐ Loyalty',
    // bonus
    base_params:'Base Parameters', mechanics:'Bonus Mechanics',
    geo_lbl:'Market / GEO', players_lbl:'Monthly New Players',
    segment_lbl:'Player Segment', platform_lbl:'Platform', rtp_lbl:'Avg Slot RTP',
    seg_new:'🆕 New', seg_mid:'👤 Mid', seg_vip:'👑 VIP',
    plat_both:'Desktop + Mobile', plat_mobile:'Mobile Only', plat_desk:'Desktop Only',
    mech_welcome:'Welcome Bonus', mech_ndb:'No Deposit Bonus',
    mech_chain:'Deposit Chain', mech_dep2:'2nd Deposit Bonus', mech_dep3:'3rd Deposit Bonus',
    mech_reload:'Reload Bonus', mech_cashback:'Cashback', mech_fs:'Free Spins',
    chain_hint:'Dep2 cohort: 45% of Welcome · Dep3: 25%',
    match_lbl:'Match %', wager_lbl:'Wager ×', max_bonus_lbl:'Max Bonus',
    min_dep_lbl:'Min Deposit', max_win_lbl:'Max Win', zero_means_no_cap:'0 = no cap',
    amount_lbl:'Amount', max_cash_lbl:'Max Cash',
    pct_lbl:'Rate %', count_lbl:'Spins', value_lbl:'Spin value', cb_wager_lbl:'Wager ×',
    calculate:'⚡ Calculate', recalculate:'↻ Recalculate',
    // econ
    econ_cost_p50:'P50 Cost', econ_cost_ratio:'Cost / Deposits', econ_max_risk:'Max Risk (P90)',
    econ_arpu:'ARPU', econ_ltv3:'3-mo LTV', econ_roi:'Campaign ROI',
    of_deposits:'of deposits', per_player:'per player', per_mo:'/mo',
    scenarios_title:'Cost Scenarios',
    s_p10:'🟢 Best case', s_p50:'⚪ Expected', s_p90:'🔴 Worst case',
    s_cost:'Total Cost', s_per:'Per Player', s_conv:'Conversion',
    chain_title:'Deposit Chain Economics',
    chain_welcome:'1st Deposit', chain_dep2:'2nd Deposit', chain_dep3:'3rd Deposit',
    chain_cohort:'cohort', chain_total:'Chain Total',
    chain_ratio_lbl:'chain load',
    verdict_cheap:'💸 Weak offer (ratio < 10%) — low player EV, conversion will suffer.',
    verdict_ok:'✅ Good range (10–20%) — balanced attractiveness and economics.',
    verdict_warn:'⚠️ High load (20–35%) — risk of loss on activation spikes.',
    verdict_high:'🔴 Loss-making (>35%) — costs exceed acceptable threshold.',
    // tournament
    tourn_type:'Tournament Type', tourn_params:'Parameters',
    tourn_geo:'Market / GEO', tourn_segment:'Target Segment',
    tourn_players:'Total Casino Players', tourn_duration:'Duration',
    tourn_prize:'Prize Pool', tourn_pool_model:'Pool Model',
    tourn_scoring:'Scoring Method', tourn_entry:'Entry Model',
    tourn_distribution:'Prize Distribution', tourn_reentry:'Re-entry', tourn_rake:'Rake %',
    econ_eligible:'Eligible Players', econ_participation:'Expected Participants',
    econ_ggr_lift:'GGR Lift', econ_roi_tourn:'Tournament ROI',
    econ_engagement:'Engagement ×', econ_cost_active:'Cost / Active',
    dur_flash:'Flash (< 1h)', dur_daily:'Daily', dur_weekly:'Weekly',
    dur_monthly:'Monthly', dur_multi:'Multi-Round',
    pool_fixed:'Fixed', pool_dynamic:'Dynamic', pool_hybrid:'Hybrid',
    entry_freeroll:'Freeroll', entry_buyin:'Buy-in', entry_ticket:'Ticket',
    scoring_wins:'Total Wins', scoring_mult:'Highest Multiplier',
    scoring_spins:'Most Spins', scoring_mission:'Mission-Based',
    dist_top_n:'Top N', dist_linear:'Linear Decay', dist_flat:'Flat Tier', dist_drop:'Prize Drop',
    reentry_single:'Single Entry', reentry_rebuy:'Rebuy', reentry_unlimited:'Unlimited',
    seg_all:'All Players', seg_depositors:'Depositors', seg_dormant:'Dormant',
    // loyalty
    loyal_audience:'Model & Audience', loyal_design:'Program Design',
    loyal_mode:'Loyalty Model', loyal_region:'Region', loyal_segment:'Segment',
    loyal_players:'Monthly Players', loyal_avgdep:'Avg Deposit', loyal_arpu:'ARPU (USD/mo)',
    loyal_tiers:'Number of Tiers', loyal_cashback:'Top-tier Cashback %',
    loyal_earn_dep:'Points per $1 Deposited', loyal_earn_wag:'Points per $1 Wagered',
    loyal_redeem:'Points per $1 Redeemed', loyal_min_redeem:'Min Points to Redeem',
    loyal_expiry:'Points Expiry', expiry_never:'Never',
    loyal_missions:'Number of Missions',
    econ_retention:'Retention Lift', econ_liability:'Points Liability',
    econ_breakeven:'Break-even', econ_cost_ggr:'Cost / GGR',
    loyal_monthly_cost:'Monthly Cost', tier_table_title:'Tiers',
    tier_name:'Tier', tier_pts:'Min Points', tier_cb:'Cashback', tier_fs:'FS/mo', tier_mult:'Bonus Mult.',
    // AI tabs
    tab_econ:'📊 Economics', tab_audit:'🔍 Audit',
    tab_optimize:'⚡ Optimize', tab_missions:'🎯 Missions',
    run_audit:'🔍 Run Compliance Audit', run_optimize:'⚡ Get Optimization Recs',
    run_missions:'✨ Generate Mission Descriptions',
    rerun:'↺ Re-run', ai_loading:'Analyzing…',
    recommendations:'Recommendations',
    // actions
    save_btn:'💾 Save', calendar_btn:'📅 Add to Calendar',
    saved_toast:'Configuration saved ✓', calendar_toast:'Added to Retention Calendar ✓',
    // regions
    reg_eu:'Europe (EU/UK)', reg_cis:'CIS', reg_mn:'Mongolia',
    reg_latam:'LatAm', reg_sweep:'USA Sweep', reg_crypto:'Crypto / Global',
  },
  ru: {
    title: 'Конфигуратор',
    type_bonus:'🎁 Бонусы', type_tourn:'🏆 Турниры', type_loyal:'⭐ Лояльность',
    base_params:'Базовые параметры', mechanics:'Механики бонусов',
    geo_lbl:'Рынок / GEO', players_lbl:'Новых игроков / месяц',
    segment_lbl:'Сегмент игроков', platform_lbl:'Платформа', rtp_lbl:'Средний RTP слотов',
    seg_new:'🆕 Новые', seg_mid:'👤 Средние', seg_vip:'👑 VIP',
    plat_both:'Desktop + Mobile', plat_mobile:'Только Mobile', plat_desk:'Только Desktop',
    mech_welcome:'Welcome Bonus', mech_ndb:'No Deposit Bonus',
    mech_chain:'Цепочка депозитов', mech_dep2:'2-й депозит', mech_dep3:'3-й депозит',
    mech_reload:'Reload Bonus', mech_cashback:'Кешбэк', mech_fs:'Free Spins',
    chain_hint:'Dep2 когорта: 45% от Welcome · Dep3: 25%',
    match_lbl:'Match %', wager_lbl:'Вейджер ×', max_bonus_lbl:'Макс. бонус',
    min_dep_lbl:'Мин. депозит', max_win_lbl:'Макс. выигрыш', zero_means_no_cap:'0 = без лимита',
    amount_lbl:'Сумма', max_cash_lbl:'Макс. выплата',
    pct_lbl:'Процент %', count_lbl:'Спинов', value_lbl:'Цена спина', cb_wager_lbl:'Вейджер ×',
    calculate:'⚡ Рассчитать', recalculate:'↻ Пересчитать',
    econ_cost_p50:'P50 Стоимость', econ_cost_ratio:'Стоимость / Депозиты', econ_max_risk:'Макс. риск (P90)',
    econ_arpu:'ARPU', econ_ltv3:'LTV 3 мес', econ_roi:'ROI кампании',
    of_deposits:'от депозитов', per_player:'на игрока', per_mo:'/мес',
    scenarios_title:'Сценарии стоимости',
    s_p10:'🟢 Лучший', s_p50:'⚪ Базовый', s_p90:'🔴 Худший',
    s_cost:'Итоговая стоимость', s_per:'На игрока', s_conv:'Конверсия',
    chain_title:'Экономика цепочки депозитов',
    chain_welcome:'1-й депозит', chain_dep2:'2-й депозит', chain_dep3:'3-й депозит',
    chain_cohort:'когорта', chain_total:'Итого по цепочке',
    chain_ratio_lbl:'нагрузка цепочки',
    verdict_cheap:'💸 Слабый оффер (ratio < 10%) — низкий EV для игрока, конверсия упадёт.',
    verdict_ok:'✅ Рабочий диапазон (10–20%) — баланс привлекательности и экономики.',
    verdict_warn:'⚠️ Высокая нагрузка (20–35%) — риск убытка при всплеске активаций.',
    verdict_high:'🔴 Кампания убыточна (>35%) — затраты превышают допустимый порог.',
    tourn_type:'Тип турнира', tourn_params:'Параметры',
    tourn_geo:'Рынок / GEO', tourn_segment:'Сегмент',
    tourn_players:'Всего игроков в казино', tourn_duration:'Длительность',
    tourn_prize:'Призовой фонд', tourn_pool_model:'Модель пула',
    tourn_scoring:'Система очков', tourn_entry:'Тип входа',
    tourn_distribution:'Распределение призов', tourn_reentry:'Переход', tourn_rake:'Рейк %',
    econ_eligible:'Допустимые игроки', econ_participation:'Ожид. участники',
    econ_ggr_lift:'Рост GGR', econ_roi_tourn:'ROI турнира',
    econ_engagement:'Вовлечённость ×', econ_cost_active:'Стоим. / активный',
    dur_flash:'Flash (< 1ч)', dur_daily:'День', dur_weekly:'Неделя',
    dur_monthly:'Месяц', dur_multi:'Мультираунд',
    pool_fixed:'Фиксированный', pool_dynamic:'Динамический', pool_hybrid:'Гибридный',
    entry_freeroll:'Freeroll', entry_buyin:'Buy-in', entry_ticket:'Тикет',
    scoring_wins:'Суммарные выигрыши', scoring_mult:'Максимальный множитель',
    scoring_spins:'Больше спинов', scoring_mission:'Миссии',
    dist_top_n:'Топ N', dist_linear:'Линейное убывание', dist_flat:'Фиксированные', dist_drop:'Prize Drop',
    reentry_single:'Один вход', reentry_rebuy:'Rebuy', reentry_unlimited:'Без ограничений',
    seg_all:'Все игроки', seg_depositors:'Депозиторы', seg_dormant:'Спящие',
    loyal_audience:'Модель и аудитория', loyal_design:'Дизайн программы',
    loyal_mode:'Модель лояльности', loyal_region:'Регион', loyal_segment:'Сегмент',
    loyal_players:'Игроков / месяц', loyal_avgdep:'Средний депозит', loyal_arpu:'ARPU (USD/мес)',
    loyal_tiers:'Количество тиров', loyal_cashback:'Кешбэк на топ-тире %',
    loyal_earn_dep:'Очков за $1 депозита', loyal_earn_wag:'Очков за $1 вейджера',
    loyal_redeem:'Очков за $1 вывода', loyal_min_redeem:'Мин. очков для вывода',
    loyal_expiry:'Срок действия очков', expiry_never:'Бессрочно',
    loyal_missions:'Количество миссий',
    econ_retention:'Удержание', econ_liability:'Обязательства',
    econ_breakeven:'Окупаемость', econ_cost_ggr:'Стоимость / GGR',
    loyal_monthly_cost:'Затраты / мес', tier_table_title:'Тиры',
    tier_name:'Тир', tier_pts:'Мин. очков', tier_cb:'Кешбэк', tier_fs:'FS/мес', tier_mult:'Множитель',
    tab_econ:'📊 Экономика', tab_audit:'🔍 Аудит',
    tab_optimize:'⚡ Оптимизация', tab_missions:'🎯 Миссии',
    run_audit:'🔍 Запустить аудит', run_optimize:'⚡ Рекомендации',
    run_missions:'✨ Описать миссии',
    rerun:'↺ Повторить', ai_loading:'Анализирую…',
    recommendations:'Рекомендации',
    save_btn:'💾 Сохранить', calendar_btn:'📅 В календарь',
    saved_toast:'Конфигурация сохранена ✓', calendar_toast:'Добавлено в Retention Calendar ✓',
    reg_eu:'Европа (EU/UK)', reg_cis:'СНГ', reg_mn:'Монголия',
    reg_latam:'LatAm', reg_sweep:'США Sweep', reg_crypto:'Крипто / Global',
  }
};

// ── HELPERS ────────────────────────────────────────────────────────────────

function fmtN(n, dec=0) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString(cfgLang() === 'ru' ? 'ru' : 'en', { maximumFractionDigits: dec });
}

function fmtCur(val, cur) {
  if (val == null || isNaN(val)) return '—';
  const n = Math.round(val);
  if (cur === 'USD' || cur === 'USDT') return '$' + n.toLocaleString('en');
  if (cur === 'EUR') return '€' + n.toLocaleString('en');
  if (cur === 'GBP') return '£' + n.toLocaleString('en');
  if (cur === 'MNT') return n.toLocaleString('ru') + '₮';
  if (cur === 'RUB') return n.toLocaleString('ru') + ' ₽';
  if (cur === 'KZT') return n.toLocaleString('ru') + ' ₸';
  if (cur === 'DKK') return n.toLocaleString('en') + ' kr';
  return n.toLocaleString('en') + ' ' + (cur || '');
}

function fmtPct(v) {
  if (v == null || isNaN(v)) return '—';
  return (v * 100).toFixed(1) + '%';
}

function cfgGeo(val) { return CFG_GEO.find(g => g.val === val) || CFG_GEO[0]; }

// ── GLOSSARY ──────────────────────────────────────────────────────────────

const GLOSSARY = [
  // General
  { name:'RTP',               tag:'general', en:'Return to Player — percentage of wagered money returned to players over time. A 96% RTP means for every $100 wagered, $96 is returned on average.',                                                            ru:'Return to Player — процент ставок, возвращаемых игрокам. RTP 96% означает, что на каждые $100 ставок в среднем возвращается $96.' },
  { name:'GGR',               tag:'general', en:'Gross Gaming Revenue — total player losses (deposits minus withdrawals). The operator\'s revenue before costs.',                                                                                              ru:'Gross Gaming Revenue — валовой доход оператора: депозиты минус выплаты игрокам.' },
  { name:'ARPU',              tag:'general', en:'Average Revenue Per User — average monthly GGR per active player for a given region.',                                                                                                                       ru:'Average Revenue Per User — средний ежемесячный доход на одного активного игрока в регионе.' },
  { name:'CAC',               tag:'general', en:'Customer Acquisition Cost — average spend to acquire one depositing player (including marketing, bonuses, and ops).',                                                                                        ru:'Customer Acquisition Cost — средние затраты на привлечение одного платящего игрока.' },
  { name:'LTV',               tag:'general', en:'Lifetime Value — projected total revenue from one player over a given period (here: 3 months). LTV3 = ARPU × 3.',                                                                                          ru:'Lifetime Value — прогнозируемый доход от одного игрока за период. LTV3 = ARPU × 3 месяца.' },
  { name:'Segment',           tag:'general', en:'Player segment: New (first-time depositors), Mid (regular players), VIP (high-value, high-frequency players). Affects benchmark ARPU, CAC, conversion, and lift calculations.',                             ru:'Сегмент игрока: New (первый депозит), Mid (регулярные), VIP (высокодоходные). Влияет на ARPU, CAC и расчёт lift.' },
  // Bonus
  { name:'Match %',           tag:'bonus',   en:'Percentage of the player\'s deposit matched as bonus. 100% match = player deposits $100 and receives $100 bonus.',                                                                                          ru:'Процент совпадения депозита с бонусом. Match 100% — игрок вносит $100 и получает $100 бонуса.' },
  { name:'Wagering / Wager',  tag:'bonus',   en:'Playthrough requirement. 30× wager means the player must bet 30 times the bonus amount before withdrawing winnings. Lower = more generous.',                                                                 ru:'Отыгрыш. Wager 30x — игрок должен поставить сумму, в 30 раз превышающую бонус, прежде чем вывести выигрыш.' },
  { name:'Max Bonus',         tag:'bonus',   en:'Maximum bonus amount regardless of deposit size. Caps the bonus at a set value even if match % × deposit would be higher.',                                                                                 ru:'Максимальная сумма бонуса вне зависимости от депозита. Ограничивает бонус, даже если match% × депозит больше.' },
  { name:'Min Deposit',       tag:'bonus',   en:'Minimum deposit required to trigger the bonus. Deposits below this threshold receive no bonus.',                                                                                                            ru:'Минимальный депозит для активации бонуса. Депозиты ниже этого порога бонуса не получают.' },
  { name:'Max Win',           tag:'bonus',   en:'Maximum amount a player can win from a bonus. Any winnings above this are forfeited. Common in free spins and high-match bonuses.',                                                                          ru:'Максимальная сумма выигрыша с бонуса. Всё, что сверх этого, не выплачивается. Часто применяется к фриспинам.' },
  { name:'NDB',               tag:'bonus',   en:'No Deposit Bonus — a small bonus given without requiring a deposit. High conversion tool but costly; typically 40% of eligible players claim it.',                                                           ru:'No Deposit Bonus — небольшой бонус без депозита. Высокая конверсия, но затратно; типично 40% игроков берут.' },
  { name:'Cashback',          tag:'bonus',   en:'Percentage of net losses returned to the player. Calculated on GGR: if a player loses $100 and cashback is 10%, they receive $10 back.',                                                                    ru:'Процент чистых проигрышей, возвращаемый игроку. Cashback 10% от GGR: потерял $100 — вернули $10.' },
  { name:'Free Spins (FS)',   tag:'bonus',   en:'Bonus spins on selected slots. Each spin has a fixed value (typically $0.10). Wagering usually applies to winnings.',                                                                                       ru:'Бонусные спины на слотах. Стандартная стоимость одного спина — $0.10. На выигрыш обычно применяется отыгрыш.' },
  { name:'Cost P50',          tag:'bonus',   en:'Median expected bonus cost (50th percentile). Half of campaigns will cost less, half more. The most likely outcome.',                                                                                       ru:'Медиана ожидаемых затрат на бонус (50-й перцентиль). Наиболее вероятный исход.' },
  { name:'Cost P10 / P90',    tag:'bonus',   en:'Optimistic (P10) and pessimistic (P90) cost scenarios. P10 = only 10% of campaigns are cheaper; P90 = only 10% cost more.',                                                                               ru:'Оптимистичный (P10) и пессимистичный (P90) сценарии затрат. P90 — хуже только в 10% случаев.' },
  { name:'Max Risk',          tag:'bonus',   en:'Maximum possible liability if all bonuses are claimed and converted at worst-case wager completion. Upper bound for budgeting.',                                                                             ru:'Максимальная возможная нагрузка на бюджет при наихудшем сценарии отыгрыша. Верхняя граница для планирования.' },
  { name:'Cost Ratio',        tag:'bonus',   en:'Bonus cost as % of GGR. E.g. 15% means for every $1 of gross revenue, $0.15 is spent on bonuses. Industry benchmark: 10–25%.',                                                                           ru:'Затраты на бонус в % от GGR. 15% = на каждый $1 дохода тратится $0.15 на бонусы. Бенчмарк: 10–25%.' },
  { name:'Retention Lift',    tag:'bonus',   en:'Incremental revenue increase from running the bonus campaign, expressed as % of baseline revenue. Modeled via V2 five-factor formula.',                                                                     ru:'Прирост выручки от кампании сверх базового уровня в %. Рассчитывается по пятифакторной модели V2.' },
  { name:'Net Result',        tag:'bonus',   en:'Incremental revenue from retention lift minus campaign bonus cost. Positive = campaign generates more than it costs.',                                                                                       ru:'Прирост выручки от lift минус стоимость бонусной кампании. Положительный = кампания прибыльна.' },
  { name:'Campaign ROI',      tag:'bonus',   en:'(Incremental LTV − Campaign Budget) / Campaign Budget. Compares the 3-month player value uplift to what was spent acquiring those players via the bonus.',                                                  ru:'(Прирост LTV − Бюджет кампании) / Бюджет кампании. Сравнивает 3-месячный прирост ценности игроков с затратами.' },
  { name:'Deposit Chain',     tag:'bonus',   en:'Sequence of deposit bonuses: Welcome → 2nd Deposit → 3rd Deposit. Each step retains a fraction of the previous cohort (dep2: 45%, dep3: 25% of welcome cohort).',                                         ru:'Цепочка бонусов на депозиты: Welcome → 2-й депозит → 3-й депозит. Каждый шаг удерживает долю предыдущей когорты.' },
  // Tournament
  { name:'Prize Pool',        tag:'tourn',   en:'Total prize money distributed among tournament winners. In Fixed model = operator\'s direct cost. In Dynamic model, rake reduces the net payout.',                                                          ru:'Общий призовой фонд турнира. В модели Fixed — прямые затраты оператора. В Dynamic — рейк снижает выплату.' },
  { name:'Eligible Players',  tag:'tourn',   en:'Players qualified to enter the tournament based on segment filter. Calculated as: Total Players × Segment Ratio (e.g., VIP = 10%, Dormant = 40%).',                                                       ru:'Игроки, допущенные к турниру по сегменту. Рассчитывается: Всего игроков × Сегментный коэффициент.' },
  { name:'GGR Lift (Tourn.)', tag:'tourn',   en:'Incremental Gross Gaming Revenue generated during the tournament period above baseline. Participants play more actively due to competitive engagement.',                                                      ru:'Прирост GGR в период турнира сверх базового уровня. Участники играют активнее из-за соревновательной механики.' },
  { name:'Engagement Mult.',  tag:'tourn',   en:'How much more active participants are vs. their baseline daily play. Weekly tournaments show 1.8× (80% more daily GGR). Used to calculate GGR Lift.',                                                      ru:'Насколько активнее участники по сравнению с обычными днями. Еженедельный турнир — 1.8× (на 80% больше GGR).' },
  { name:'Retention Value',   tag:'tourn',   en:'Post-tournament incremental monthly GGR from players who increased their activity after participating. Dormant segment shows highest lift (20%).',                                                           ru:'Прирост ежемесячного GGR после турнира от игроков, повысивших активность. Самый высокий у дормантов (20%).' },
  { name:'Break-even Players',tag:'tourn',   en:'Minimum number of participants needed so that incremental GGR alone covers the prize pool cost (without counting retention value).',                                                                         ru:'Минимальное число участников, при котором прирост GGR покрывает призовой фонд (без учёта ретеншн-ценности).' },
  { name:'Rake',              tag:'tourn',   en:'In Dynamic/Hybrid pool models: percentage of buy-ins or wagers kept by the operator. Reduces the effective prize pool cost.',                                                                               ru:'В динамических моделях пула: процент buy-in/ставок, остающихся у оператора. Снижает эффективную стоимость пула.' },
  // Loyalty
  { name:'Earn Rate',         tag:'loyal',   en:'Points awarded per $1 of activity. Earn Rate (Deposit) = points per $1 deposited; Earn Rate (Wager) = points per $1 wagered. Higher = more generous program.',                                             ru:'Начисление очков за активность. Earn Rate Deposit = очки за $1 депозита; Earn Rate Wager = за $1 ставки.' },
  { name:'Redeem Rate',       tag:'loyal',   en:'Points required to receive $1 in reward value. 100 = 100 points → $1. Higher redeem rate = less valuable points.',                                                                                         ru:'Количество очков за $1 вознаграждения. 100 = 100 очков → $1. Чем выше — тем менее ценны очки.' },
  { name:'Min Redeem',        tag:'loyal',   en:'Minimum point balance required before a player can redeem. Prevents micro-redemptions and reduces program cost.',                                                                                           ru:'Минимальный баланс очков для погашения. Предотвращает микро-погашения и снижает стоимость программы.' },
  { name:'Breakage',          tag:'loyal',   en:'Points that are earned but never redeemed (expire or player churns). Industry average: ~60%. Breakage reduces the real cost of loyalty programs significantly.',                                            ru:'Очки, которые начислены, но не погашены (истекают или игрок уходит). В среднем ~60%. Снижает реальную стоимость программы.' },
  { name:'Point Liability',   tag:'loyal',   en:'Estimated USD value of unredeemed points outstanding. Represents potential future cost if all players redeemed. Typically 60% of earned points (breakage buffer).',                                        ru:'Расчётная стоимость непогашенных очков. Потенциальные будущие затраты, если все игроки погасят очки.' },
  { name:'Tier',              tag:'loyal',   en:'Loyalty level (Bronze → Diamond). Higher tiers offer better cashback rates, more free spins, and bonus multipliers. Players advance by earning enough points.',                                             ru:'Уровень лояльности (Bronze → Diamond). Более высокие тиры дают лучший кэшбэк, больше фриспинов и множителей.' },
  { name:'Mission',           tag:'loyal',   en:'Time-limited task rewarding players for completing specific actions (deposit X times, wager $Y, log in N days in a row). Drives targeted behaviour.',                                                       ru:'Задание на ограниченный срок, вознаграждающее за конкретные действия (депозиты, ставки, серии входов).' },
  { name:'Cost / GGR (Loyal)',tag:'loyal',   en:'Total monthly loyalty program cost as % of gross revenue. Healthy range: 10–20%. Above 25% means the program is eating into margins.',                                                                     ru:'Ежемесячные затраты программы лояльности в % от GGR. Норма: 10–20%. Выше 25% — программа съедает маржу.' },
];

const GLOSSARY_GROUPS = [
  { key:'general', en:'General', ru:'Общее' },
  { key:'bonus',   en:'Bonus',   ru:'Бонусы' },
  { key:'tourn',   en:'Tournament', ru:'Турниры' },
  { key:'loyal',   en:'Loyalty', ru:'Лояльность' },
];

function glossaryOpen() {
  const lang = cfgLang();
  document.getElementById('gloss-title').textContent = lang === 'ru' ? 'Глоссарий' : 'Glossary';
  const inp = document.getElementById('gloss-search');
  inp.placeholder = lang === 'ru' ? 'Поиск…' : 'Search terms…';
  inp.value = '';
  glossaryRender('');
  document.getElementById('gloss-overlay').classList.add('open');
  document.getElementById('gloss-panel').classList.add('open');
  setTimeout(() => inp.focus(), 250);
  document.addEventListener('keydown', glossaryEsc);
}

function glossaryClose() {
  document.getElementById('gloss-overlay').classList.remove('open');
  document.getElementById('gloss-panel').classList.remove('open');
  document.removeEventListener('keydown', glossaryEsc);
}

function glossaryEsc(e) { if (e.key === 'Escape') glossaryClose(); }

function glossaryRender(query) {
  const lang = cfgLang();
  const q = query.trim().toLowerCase();
  const body = document.getElementById('gloss-body');
  let html = '';
  for (const grp of GLOSSARY_GROUPS) {
    const terms = GLOSSARY.filter(t => t.tag === grp.key && (
      !q || t.name.toLowerCase().includes(q) || t[lang].toLowerCase().includes(q)
    ));
    if (!terms.length) continue;
    html += `<div class="gloss-group">
      <div class="gloss-group-lbl">${grp[lang]}</div>
      ${terms.map(t => `
        <div class="gloss-term">
          <div class="gloss-term-name">${t.name}</div>
          <div class="gloss-term-def">${t[lang]}</div>
        </div>
      `).join('')}
    </div>`;
  }
  if (!html) html = `<div style="padding:40px 20px;text-align:center;color:var(--muted);font-size:.85rem">${lang==='ru'?'Ничего не найдено':'No terms found'}</div>`;
  body.innerHTML = html;
}

function glossaryFilter(val) { glossaryRender(val); }

// ── TOAST ──────────────────────────────────────────────────────────────────

function showToast(msg, color='#10b981') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.background = color;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function genId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function ratioVerdict(r) {
  if (r < 0.10) return 'cheap';
  if (r < 0.25) return 'ok';
  if (r < 0.40) return 'warn';
  return 'high';
}

// ── MAIN RENDER ────────────────────────────────────────────────────────────

function cfgRender() {
  const lang = cfgLang();
  document.querySelectorAll('.lt-btn').forEach(b => b.classList.toggle('active', b.id === 'lt-' + lang));
  applyNavLang(lang);
  document.getElementById('topbar-title').textContent = cfgT('title');
  document.getElementById('topbar-sub').textContent =
    CS.type === 'bonus' ? cfgT('type_bonus') :
    CS.type === 'tournament' ? cfgT('type_tourn') : cfgT('type_loyal');
  const content = document.getElementById('content');
  content.innerHTML = renderTypeSwitch() + renderMainContent();
  bindEvents();
}

function renderTypeSwitch() {
  const types = ['bonus','tournament','loyalty'];
  const keys  = ['type_bonus','type_tourn','type_loyal'];
  return `<div class="type-switch">${types.map((tp,i) =>
    `<button class="type-btn${CS.type===tp?' active':''}" onclick="cfgSwitchType('${tp}')">${cfgT(keys[i])}</button>`
  ).join('')}</div>`;
}

function renderMainContent() {
  if (CS.type === 'bonus')      return renderBonusSection();
  if (CS.type === 'tournament') return renderTournamentSection();
  if (CS.type === 'loyalty')    return renderLoyaltySection();
  return '';
}

function cfgSwitchType(tp) {
  CS.type = tp;
  try { localStorage.setItem('cfg_type', tp); } catch(e){}
  cfgRender();
}

function bindEvents() {
  // bind range sliders
  document.querySelectorAll('[data-range-sync]').forEach(el => {
    const targetId = el.dataset.rangeSync;
    el.addEventListener('input', () => {
      const target = document.getElementById(targetId);
      if (target) target.textContent = el.value + (el.dataset.unit || '');
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// BONUS SECTION
// ══════════════════════════════════════════════════════════════════════════

function renderBonusSection() {
  const B = CS.bonus;
  const geo = cfgGeo(B.geo);
  return `
    <div class="card-grid" style="margin-bottom:16px">
      ${renderBonusBaseCard(B, geo)}
      ${renderBonusMechanicsCard(B, geo)}
    </div>
    <div style="text-align:center;margin-bottom:28px">
      <button class="btn btn-primary btn-lg" onclick="onGenerateBonus()" id="btn-calculate">
        ${cfgT(B.config ? 'recalculate' : 'calculate')}
      </button>
    </div>
    <div id="bonus-results">${B.config ? renderBonusResults(B) : ''}</div>
  `;
}

function renderBonusBaseCard(B, geo) {
  const geoOpts = CFG_GEO.map(g => `<option value="${g.val}"${g.val===B.geo?' selected':''}>${g.lbl}</option>`).join('');
  return `
    <div class="card">
      <div class="card-title">${cfgT('base_params')}</div>
      <div class="form-row">
        <label class="form-label">${cfgT('geo_lbl')}</label>
        <select class="form-input" onchange="bonusSetGeo(this.value)">${geoOpts}</select>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('players_lbl')}</label>
        <input class="form-input" type="number" value="${B.players}" min="100" max="200000" step="100"
               onchange="CS.bonus.players=+this.value||5000; scheduleBonusRecalc();">
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('segment_lbl')}</label>
        <div class="chips">
          ${['new','mid','vip'].map(s => `<div class="chip${B.segment===s?' on':''}" data-grp="bonus-seg" data-val="${s}" onclick="bonusSetSeg('${s}')">${cfgT('seg_'+s)}</div>`).join('')}
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('platform_lbl')}</label>
        <div class="chips">
          ${['both','mobile','desk'].map(p => `<div class="chip${B.plat===p?' on':''}" data-grp="bonus-plat" data-val="${p}" onclick="bonusSetPlat('${p}')">${cfgT('plat_'+p)}</div>`).join('')}
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('rtp_lbl')} — <span id="rtp-disp" style="color:var(--text);font-weight:700">${B.rtp}%</span></label>
        <div class="range-wrap">
          <input type="range" min="85" max="99" step="0.5" value="${B.rtp}"
                 oninput="CS.bonus.rtp=+this.value;document.getElementById('rtp-disp').textContent=this.value+'%'">
          <span class="range-val" style="width:40px">${B.rtp}%</span>
        </div>
      </div>
    </div>
  `;
}

function renderBonusMechanicsCard(B) {
  return `
    <div class="card" style="overflow:visible">
      <div class="card-title">${cfgT('mechanics')}</div>
      <div class="mech-list">
        ${renderMechRow('welcome', B)}
        ${renderMechRow('ndb',     B)}
        ${renderChainGroup(B)}
        ${renderMechRow('reload',  B)}
        ${renderMechRow('cashback',B)}
        ${renderMechRow('fs',      B)}
      </div>
    </div>
  `;
}

function renderMechRow(key, B) {
  const isOn = B.active[key];
  const ov   = B.ov;
  let params = '';

  const noCapHint = `<span class="mp-unit">${cfgT('zero_means_no_cap')}</span>`;

  if (key === 'welcome') {
    params = `<div class="mech-params-grid">
      ${mpInp('w_pct',    cfgT('match_lbl'),     ov.w_pct,    '%', 1,200)}
      ${mpInp('w_wager',  cfgT('wager_lbl'),      ov.w_wager,  '×', 1,100)}
      ${mpInp('w_maxB',   cfgT('max_bonus_lbl'),  ov.w_maxB,   '',  1,100000)}
      ${mpInp('w_minD',   cfgT('min_dep_lbl'),    ov.w_minD,   '',  0,100000)}
      ${mpInpHint('w_maxWin', cfgT('max_win_lbl'), ov.w_maxWin, '', 0, 100000, noCapHint)}
    </div>`;
  } else if (key === 'ndb') {
    params = `<div class="mech-params-grid">
      ${mpInp('ndb_amt',    cfgT('amount_lbl'),   ov.ndb_amt,    '',  1,10000)}
      ${mpInp('ndb_wager',  cfgT('wager_lbl'),    ov.ndb_wager,  '×', 1,100)}
      ${mpInpHint('ndb_maxWin', cfgT('max_win_lbl'), ov.ndb_maxWin, '', 0, 100000, noCapHint)}
    </div>`;
  } else if (key === 'reload') {
    params = `<div class="mech-params-grid">
      ${mpInp('rl_pct',    cfgT('match_lbl'),    ov.rl_pct,    '%', 1,200)}
      ${mpInp('rl_wager',  cfgT('wager_lbl'),    ov.rl_wager,  '×', 1,100)}
      ${mpInp('rl_maxB',   cfgT('max_bonus_lbl'),ov.rl_maxB,   '',  1,100000)}
      ${mpInp('rl_minD',   cfgT('min_dep_lbl'),  ov.rl_minD,   '',  0,100000)}
      ${mpInpHint('rl_maxWin', cfgT('max_win_lbl'), ov.rl_maxWin, '', 0, 100000, noCapHint)}
    </div>`;
  } else if (key === 'cashback') {
    params = `<div class="mech-params-grid-2">
      ${mpInp('cb_pct', cfgT('pct_lbl'), ov.cb_pct, '%', 1,50)}
      <div class="mp-row"><div class="mp-lbl">${cfgT('cb_wager_lbl')}</div><span style="font-size:.75rem;color:var(--muted);padding-top:8px">No wager</span></div>
    </div>`;
  } else if (key === 'fs') {
    params = `<div class="mech-params-grid">
      ${mpInp('fs_count',  cfgT('count_lbl'),  ov.fs_count,  '',  1,500)}
      ${mpInp('fs_value',  cfgT('value_lbl'),  ov.fs_value,  '',  0.01,10)}
      ${mpInp('fs_wager',  cfgT('wager_lbl'),  ov.fs_wager,  '×', 1,100)}
      ${mpInpHint('fs_maxWin', cfgT('max_win_lbl'), ov.fs_maxWin, '', 0, 100000, noCapHint)}
    </div>`;
  }

  return `
    <div class="mech-row${isOn?' active':''}" id="mech-${key}">
      <div class="mech-header" onclick="toggleMech('${key}')">
        <div class="mech-toggle">✓</div>
        <div class="mech-name">${cfgT('mech_'+key)}</div>
        ${isOn ? `<div class="mech-badge">${cfgT('tab_econ').replace('📊 ','')}</div>` : ''}
      </div>
      <div class="mech-params">${params}</div>
    </div>
  `;
}

function renderChainGroup(B) {
  const dep2On = B.active.dep2;
  const dep3On = B.active.dep3;
  const ov = B.ov;
  return `
    <div class="chain-group" id="chain-group">
      <div class="chain-header">
        <span class="chain-header-icon">🔗</span>
        <span class="chain-header-title">${cfgT('mech_chain')}</span>
        <span class="chain-header-hint">${cfgT('chain_hint')}</span>
      </div>
      <div class="chain-steps">
        <div class="mech-row${dep2On?' active':''}" id="mech-dep2" style="background:transparent">
          <div class="mech-header" onclick="toggleMech('dep2')">
            <div class="mech-toggle">✓</div>
            <div class="mech-name" style="font-size:.8rem">${cfgT('mech_dep2')}</div>
            <span style="font-size:.68rem;color:var(--muted)">×0.45</span>
          </div>
          <div class="mech-params">
            <div class="mech-params-grid">
              ${mpInp('d2_pct',   cfgT('match_lbl'),    ov.d2_pct,   '%', 1,200)}
              ${mpInp('d2_wager', cfgT('wager_lbl'),    ov.d2_wager, '×', 1,100)}
              ${mpInp('d2_maxB',  cfgT('max_bonus_lbl'),ov.d2_maxB,  '',  1,100000)}
              ${mpInp('d2_minD',  cfgT('min_dep_lbl'),  ov.d2_minD,  '',  0,100000)}
              ${mpInpHint('d2_maxWin', cfgT('max_win_lbl'), ov.d2_maxWin, '', 0, 100000, `<span class="mp-unit">${cfgT('zero_means_no_cap')}</span>`)}
            </div>
          </div>
        </div>
        <div class="mech-row${dep3On?' active':''}" id="mech-dep3" style="background:transparent">
          <div class="mech-header" onclick="toggleMech('dep3')">
            <div class="mech-toggle">✓</div>
            <div class="mech-name" style="font-size:.8rem">${cfgT('mech_dep3')}</div>
            <span style="font-size:.68rem;color:var(--muted)">×0.25</span>
          </div>
          <div class="mech-params">
            <div class="mech-params-grid">
              ${mpInp('d3_pct',   cfgT('match_lbl'),    ov.d3_pct,   '%', 1,200)}
              ${mpInp('d3_wager', cfgT('wager_lbl'),    ov.d3_wager, '×', 1,100)}
              ${mpInp('d3_maxB',  cfgT('max_bonus_lbl'),ov.d3_maxB,  '',  1,100000)}
              ${mpInp('d3_minD',  cfgT('min_dep_lbl'),  ov.d3_minD,  '',  0,100000)}
              ${mpInpHint('d3_maxWin', cfgT('max_win_lbl'), ov.d3_maxWin, '', 0, 100000, `<span class="mp-unit">${cfgT('zero_means_no_cap')}</span>`)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function mpInp(id, label, val, unit, min, max) {
  return `<div class="mp-row">
    <div class="mp-lbl">${label}${unit ? ` <span class="mp-unit">${unit}</span>` : ''}</div>
    <input class="mp-inp" id="mp-${id}" type="number" value="${val}" min="${min}" max="${max}" step="${id==='fs_value'?'0.01':'1'}"
           onchange="bonusOvChange('${id}',this.value)">
  </div>`;
}

// Like mpInp but with an extra hint line below the input
function mpInpHint(id, label, val, unit, min, max, hintHtml) {
  return `<div class="mp-row">
    <div class="mp-lbl">${label}${unit ? ` <span class="mp-unit">${unit}</span>` : ''}</div>
    <input class="mp-inp" id="mp-${id}" type="number" value="${val}" min="${min}" max="${max}" step="1"
           onchange="bonusOvChange('${id}',this.value)">
    <div style="margin-top:2px;line-height:1.2">${hintHtml}</div>
  </div>`;
}

function toggleMech(key) {
  CS.bonus.active[key] = !CS.bonus.active[key];
  const row = document.getElementById('mech-' + key);
  if (!row) return;
  row.classList.toggle('active', CS.bonus.active[key]);
  const badge = row.querySelector('.mech-badge');
  if (CS.bonus.active[key] && !badge) {
    const name = row.querySelector('.mech-name');
    const b = document.createElement('div');
    b.className = 'mech-badge';
    b.textContent = cfgT('tab_econ').replace('📊 ','');
    name.after(b);
  } else if (!CS.bonus.active[key] && badge) badge.remove();
  scheduleBonusRecalc();
}

function bonusSetGeo(val) {
  CS.bonus.geo = val;
  const geo = cfgGeo(val);
  // Update ov defaults based on new currency scale
  const scaleFactor = geo.avgdep / 50;
  CS.bonus.ov.w_maxB  = Math.round(200  * scaleFactor);
  CS.bonus.ov.ndb_amt = Math.round(10   * scaleFactor);
  CS.bonus.ov.d2_maxB = Math.round(100  * scaleFactor);
  CS.bonus.ov.d3_maxB = Math.round(50   * scaleFactor);
  CS.bonus.ov.rl_maxB = Math.round(100  * scaleFactor);
  CS.bonus.config = null; // invalidate cached result
  cfgRender();
}

function bonusSetSeg(v) {
  CS.bonus.segment = v;
  document.querySelectorAll('#content [data-grp="bonus-seg"]').forEach(c =>
    c.classList.toggle('on', c.dataset.val === v)
  );
}
function bonusSetPlat(v) {
  CS.bonus.plat = v;
  document.querySelectorAll('#content [data-grp="bonus-plat"]').forEach(c =>
    c.classList.toggle('on', c.dataset.val === v)
  );
}

function bonusOvChange(key, val) {
  CS.bonus.ov[key] = parseFloat(val) || 0;
  scheduleBonusRecalc();
}

function scheduleBonusRecalc() {
  if (!CS.bonus.config) return;
  clearTimeout(_recalcTimer);
  _recalcTimer = setTimeout(() => runBonusRecalc(), 600);
}

function deriveMechanicType(active) {
  const { welcome, ndb, dep2, dep3, reload, cashback, fs } = active;
  if (welcome && (dep2 || dep3)) return 'deposit_chain';
  if (welcome) return 'welcome_match';
  if (ndb)     return 'no_deposit';
  if (reload)  return 'reload';
  if (cashback)return 'cashback';
  if (fs)      return 'free_spins';
  return 'welcome_match';
}

async function onGenerateBonus() {
  if (_generating) return;
  _generating = true;
  const btn = document.getElementById('btn-calculate');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  const B   = CS.bonus;
  const geo = cfgGeo(B.geo);
  const body = {
    region:   geo.region,
    lic:      geo.lic,
    sitecur:  geo.cur,
    depcur:   geo.cur,
    players:  B.players,
    avgdep:   geo.avgdep,
    plat:     B.plat,
    rtp:      B.rtp,
    riskAdj:  B.segment === 'vip' ? 1.2 : B.segment === 'new' ? 0.8 : 1.0,
    segment:  B.segment,
  };

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    B.config = data.cfg;
    // B.ov никогда не перезаписывается из API — поля ввода всегда отражают
    // то, что будет использовано в расчёте, независимо от гео-дефолтов.
    CAI.bonus = { tab: CAI.bonus.tab || 'econ', audit:null, optimize:null, auditLoading:false, optimizeLoading:false };
    cfgRender();
    // Сразу считаем стоимость с текущими B.ov
    runBonusRecalc();
  } catch(e) {
    showToast('Error: ' + e.message, '#ef4444');
  } finally {
    _generating = false;
    const b = document.getElementById('btn-calculate');
    if (b) { b.disabled = false; b.textContent = cfgT(CS.bonus.config ? 'recalculate' : 'calculate'); }
  }
}

async function runBonusRecalc() {
  const B = CS.bonus;
  if (!B.config) return;
  const cfg = B.config;
  if (cfg.r === 'sweep') return;
  const ov = B.ov;
  const overrides = {
    w_pct:    ov.w_pct,    w_wager:  ov.w_wager,  w_maxB:   ov.w_maxB,
    w_minD:   ov.w_minD,   w_maxWin: ov.w_maxWin,
    ndb_wager:ov.ndb_wager, ndb_amt: ov.ndb_amt,  ndb_maxWin:ov.ndb_maxWin,
    rl_pct:   ov.rl_pct,   rl_wager: ov.rl_wager, rl_maxB:  ov.rl_maxB,  rl_fs:0,
    rl_minD:  ov.rl_minD,  rl_maxWin:ov.rl_maxWin,
    d2_pct:   ov.d2_pct,   d2_wager: ov.d2_wager, d2_maxB:  ov.d2_maxB,  d2_fs:0,
    d2_minD:  ov.d2_minD,  d2_maxWin:ov.d2_maxWin,
    d3_pct:   ov.d3_pct,   d3_wager: ov.d3_wager, d3_maxB:  ov.d3_maxB,  d3_fs:0,
    d3_minD:  ov.d3_minD,  d3_maxWin:ov.d3_maxWin,
    fs_wager: ov.fs_wager, fs_count: ov.fs_count, fs_maxWin:ov.fs_maxWin,
  };
  try {
    const cfgForRecalc = { ...cfg, pl: B.players };
    const res = await fetch('/api/recalc', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ cfg: cfgForRecalc, overrides }),
    });
    if (!res.ok) { console.error('recalc HTTP', res.status); return; }
    const data = await res.json();
    B.costs = data;
    updateBonusCostDisplay(data, cfg);
  } catch(e) { console.error('recalc error:', e); }
}

function updateBonusCostDisplay(data, cfg) {
  const cur = cfg.cur || 'USD';
  const costs = data.costs;
  const upd = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = fmtCur(v, cur); };
  upd('bc-p50',  costs.w_p50);
  upd('bc-total',costs.total);
  upd('bc-risk', costs.maxRisk);
  const ratioEl = document.getElementById('bc-ratio');
  if (ratioEl) {
    ratioEl.textContent = fmtPct(data.ratio);
    const v = ratioVerdict(data.ratio);
    ratioEl.style.color = v==='ok'?'#10b981':v==='warn'?'#f59e0b':v==='high'?'#ef4444':'#8892a4';
  }
  // Обновить LTV (зависит от cfg.pl, который мог измениться)
  const E = cfg.econ || {};
  const pl = cfg.pl || 0;
  const ltv3El = document.getElementById('bc-ltv3');
  if (ltv3El) ltv3El.textContent = fmtCur((E.ltv3||0) * pl, 'USD');
  // Campaign ROI: масштабируем CAC через отношение текущего costRatio к базовому
  // campCac = geo_cac × (liveRatio / baseRatio); campRoi = (totLTV − 3×pl×campCac) / (3×pl×campCac)
  const roiEl = document.getElementById('bc-roi');
  if (roiEl && E.cac && E.costRatio && data.ratio != null) {
    const campCac    = E.cac * (data.ratio / E.costRatio);
    const campBudget = 3 * pl * campCac;
    const totLTV     = (E.totLTV != null) ? E.totLTV : pl * (E.ltv3||0);
    const campRoi    = campBudget > 0 ? Math.round((totLTV - campBudget) / campBudget * 100) : 0;
    roiEl.textContent = campRoi.toFixed(0) + '%';
    roiEl.style.color = campRoi >= 0 ? 'var(--success)' : '#ef4444';
  }
  // Обновить вкладку Economics (Net Result зависит от costs.ratio)
  const aiEl = document.getElementById('bonus-ai-content');
  if (aiEl && CAI.bonus.tab === 'econ') aiEl.innerHTML = renderBonusAiContent(CS.bonus);
  // flash updated cards
  document.querySelectorAll('.econ-card[data-recalc]').forEach(c => {
    c.classList.remove('flash-good');
    requestAnimationFrame(() => c.classList.add('flash-good'));
  });
}

function renderBonusResults(B) {
  const cfg   = B.config;
  const costs = B.costs;
  const E     = cfg.econ || {};
  const cur   = cfg.cur || 'USD';
  const pl    = cfg.pl  || B.players;
  const ai    = CAI.bonus;

  const p50cost  = costs ? costs.costs.w_p50 : (E.sP50?.cost||0);
  const p10cost  = costs ? costs.costs.w_p10 : (E.sP10?.cost||0);
  const p90cost  = costs ? costs.costs.w_p90 : (E.sP90?.cost||0);
  const ratio    = costs ? costs.ratio        : (E.costRatio||0);
  const maxRisk  = costs ? costs.maxRisk      : (E.maxRisk||0);
  const verdict  = ratioVerdict(ratio);

  // Chain is active only when both dep2 AND dep3 are toggled on (matches generator behaviour)
  const chainOn = B.active.dep2 && B.active.dep3;
  const chainCfg = cfg.econ?.chain;

  let econCards = `
    <div class="econ-grid">
      ${econCard('bc-p50',   cfgT('econ_cost_p50'),   fmtCur(p50cost,cur),  cfgT('per_mo'),  '', true)}
      ${econCard('bc-ratio', cfgT('econ_cost_ratio'),  fmtPct(ratio),        cfgT('of_deposits'), colorRatio(ratio), true)}
      ${econCard('bc-risk',  cfgT('econ_max_risk'),    fmtCur(maxRisk,cur),  cfgT('per_mo'),  '', true)}
      ${econCard('bc-arpu',  cfgT('econ_arpu'),        fmtCur(E.arpu||0,'USD'), cfgT('per_player'), 'pos')}
      ${econCard('bc-ltv3',  cfgT('econ_ltv3'),        fmtCur((E.ltv3||0)*pl,'USD'), '3 months', 'pos')}
      ${econCard('bc-roi',   cfgT('econ_roi'),         ((E.roi3||E.roi||0)).toFixed(0) + '%', '', 'pos')}
    </div>
  `;

  let chainStrip = '';
  if (chainOn && chainCfg && chainCfg.chainCost > 0) {
    const chainRatio = chainCfg.chainCostRatio || 0;
    const rClr = chainRatio < 0.10 ? '#10b981' : chainRatio < 0.25 ? '#10b981' : chainRatio < 0.40 ? '#f59e0b' : '#ef4444';
    const stepLbls = {
      welcome: cfgT('chain_welcome'),
      dep2:    cfgT('chain_dep2'),
      dep3:    cfgT('chain_dep3'),
    };
    const visibleSteps = (chainCfg.steps || [])
      .filter(s => s.cost > 0 && (s.key === 'welcome' || B.active[s.key]));
    const stepRows = visibleSteps.map(s => `
      <div style="display:flex;align-items:baseline;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:12px">
        <span style="color:#8892a4;flex:1">${stepLbls[s.key] || s.key}</span>
        <span style="color:#8892a4;margin:0 10px;font-size:11px">×${Math.round(s.cohort*100)}% ${cfgT('chain_cohort')}</span>
        <span style="font-family:monospace;font-weight:700;color:var(--text)">${fmtCur(s.cost, cur)}</span>
      </div>
    `).join('');
    chainStrip = `
      <div style="margin-bottom:14px;padding:12px 14px;background:rgba(160,176,255,.04);border-radius:9px;border:1px solid rgba(160,176,255,.14)">
        <div style="font-size:11px;font-weight:700;color:#a0b0ff;margin-bottom:8px">⛓ ${cfgT('chain_title')}</div>
        ${stepRows}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.08)">
          <span style="font-size:12px;font-weight:700;color:var(--text)">${cfgT('chain_total')}</span>
          <span style="font-family:monospace;font-weight:800;color:var(--text)">${fmtCur(chainCfg.chainCost, cur)}</span>
          <span style="font-size:11px;font-weight:700;color:${rClr};margin-left:10px">${(chainRatio*100).toFixed(1)}% ${cfgT('chain_ratio_lbl')}</span>
        </div>
      </div>
    `;
  }

  const scenarioTable = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-title" style="margin-bottom:10px">${cfgT('scenarios_title')}</div>
      <table class="scenario-table">
        <thead><tr>
          <th></th>
          <th>${cfgT('s_cost')}</th>
          <th>${cfgT('s_per')}</th>
          <th>${cfgT('s_conv')}</th>
        </tr></thead>
        <tbody>
          ${scenRow(cfgT('s_p10'), p10cost, p10cost/pl, E.sP10?.conv||0, cur)}
          ${scenRow(cfgT('s_p50'), p50cost, p50cost/pl, E.sP50?.conv||0, cur, true)}
          ${scenRow(cfgT('s_p90'), p90cost, p90cost/pl, E.sP90?.conv||0, cur)}
        </tbody>
      </table>
    </div>
  `;

  const verdictHtml = `<div class="verdict-row ${verdict}">${cfgT('verdict_'+verdict)}</div>`;

  const tabs = `
    <div class="tab-row">
      ${['econ','audit','optimize'].map(tab => `
        <button class="tab${ai.tab===tab?' active':''}" onclick="bonusSetTab('${tab}')">${cfgT('tab_'+tab)}</button>
      `).join('')}
    </div>
    <div id="bonus-ai-content">${renderBonusAiContent(B)}</div>
  `;

  return `
    <div class="results-hdr">
      <div class="results-title">${cfgT('tab_econ')}</div>
      <div class="results-actions">
        <button class="btn btn-sm btn-outline" onclick="cfgSaveBonusConfig()">${cfgT('save_btn')}</button>
        <button class="btn btn-sm btn-outline" onclick="cfgBonusToCalendar()">${cfgT('calendar_btn')}</button>
      </div>
    </div>
    ${verdictHtml}
    ${econCards}
    ${chainStrip}
    ${scenarioTable}
    <div class="card">
      <div class="card-title" style="margin-bottom:10px">${cfgT('tab_audit')} & ${cfgT('tab_optimize')}</div>
      ${tabs}
    </div>
  `;
}

function scenRow(lbl, total, per, conv, cur, bold=false) {
  const s = bold ? 'font-weight:700;color:var(--text)' : '';
  return `<tr style="${s}">
    <td>${lbl}</td>
    <td class="s-val">${fmtCur(total,cur)}</td>
    <td class="s-val">${fmtCur(per,cur)}</td>
    <td class="s-val">${(conv*100).toFixed(0)}%</td>
  </tr>`;
}

function colorRatio(r) {
  if (r < 0.10) return '';
  if (r < 0.25) return 'pos';
  if (r < 0.40) return 'neu';
  return 'neg';
}

function econCard(id, label, val, sub, valClass='', recalc=false) {
  return `<div class="econ-card"${recalc?' data-recalc':''}>
    <div class="econ-label">${label}</div>
    <div class="econ-val${valClass?' '+valClass:''}" id="${id}">${val}</div>
    <div class="econ-sub">${sub}</div>
  </div>`;
}

function bonusSetTab(tab) {
  CAI.bonus.tab = tab;
  const el = document.getElementById('bonus-ai-content');
  if (el) el.innerHTML = renderBonusAiContent(CS.bonus);
  document.querySelectorAll('.tab-row .tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('onclick').includes(`'${tab}'`));
  });
}

// ── V2 incremental-revenue lift model (mirrors app.js _calcRetentionV2) ──────
function computeBonusLift(B) {
  const cfg = B.config;
  if (!cfg) return null;
  const E    = cfg.econ || {};
  const costs = B.costs;
  const seg  = B.segment || 'mid';
  const SEG_LIFT = { new: 0.25, mid: 0.18, vip: 0.12 };
  const base = SEG_LIFT[seg] ?? 0.18;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const wagerX  = parseFloat(B.ov?.w_wager) || E.wagerX  || 30;
  const beW     = E.breakeven_wager || 15;
  const matchPct = parseFloat(B.ov?.w_pct) || 100;
  const rtp     = (B.rtp || 96) / 100;
  const plat    = B.plat || 'both';

  const F1 = clamp(0.7 + 0.3 * clamp(beW / wagerX, 0.3, 2.0), 0.65, 1.35);
  const F2 = clamp(0.85 + 0.30 * Math.min(matchPct / 100, 1.0), 0.85, 1.15);
  const F3 = 1
    + (B.active.ndb      ? 0.06 : 0)
    + (B.active.reload   ? 0.08 : 0)
    + (B.active.dep2     ? 0.04 : 0)
    + (B.active.fs       ? 0.04 : 0)
    + (B.active.cashback ? 0.07 : 0);
  const F4 = clamp(0.94 + 0.12 * ((rtp - 0.85) / 0.14), 0.94, 1.06);
  const F5 = plat === 'mobile' ? 1.05 : plat === 'desk' ? 0.97 : 1.0;
  const lift = Math.min(0.40, base * F1 * F2 * F3 * F4 * F5);

  const pl        = E.pl || B.players || 5000;
  const ltv3      = E.ltv3  || 0;
  const arpu      = E.arpu  || 0;
  const costRatio = (costs ? costs.ratio : E.costRatio) || 0;
  const incrPl    = Math.round(pl * lift);
  const incrRev   = Math.round(incrPl * ltv3);
  const campCost3 = Math.round(3 * costRatio * pl * arpu);
  const net       = incrRev - campCost3;

  return {
    lift: { wagFactor:F1, wagerX, beW, genFactor:F2, matchPct, mechFactor:F3,
      hasNDB:!!B.active.ndb, hasReload:!!B.active.reload, hasDep2:!!B.active.dep2,
      hasFS:!!B.active.fs, hasCB:!!B.active.cashback,
      rtpFactor:F4, rtp, platFactor:F5, plat, base, lift },
    economics: { net, campCost3, incrRev, incrPl, pl },
  };
}

function renderBonusAiContent(B) {
  const ai  = CAI.bonus;
  const cfg = B.config;
  if (!cfg) return '';
  const isRu = cfgLang() === 'ru';

  if (ai.tab === 'econ') {
    const lv = computeBonusLift(B);
    if (!lv) return '';
    const { lift: v, economics: eco } = lv;
    const fmtN = n => Math.abs(n) >= 1e6
      ? (n/1e6).toFixed(1)+'M'
      : Math.abs(n) >= 1e3 ? (n/1e3).toFixed(0)+'k' : String(Math.round(n));
    const cur = cfg.cur || 'USD';
    const netClr = eco.net >= 0 ? '#10b981' : '#ef4444';

    // ── P10/P50/P90 cost scenarios ──────────────────────────────────────────
    const E      = cfg.econ || {};
    const costs  = B.costs;
    const pl     = cfg.pl || B.players || 1;
    const p10c   = costs ? costs.costs.w_p10 : (E.sP10?.cost || 0);
    const p50c   = costs ? costs.costs.w_p50 : (E.sP50?.cost || 0);
    const p90c   = costs ? costs.costs.w_p90 : (E.sP90?.cost || 0);
    const conv10 = E.sP10?.conv ?? 0.10;
    const conv50 = E.sP50?.conv ?? 0.20;
    const conv90 = E.sP90?.conv ?? 0.40;
    const base   = (costs ? costs.ratio : (E.costRatio||0)) > 0
                   ? p50c / (costs ? costs.ratio : (E.costRatio||0)) : p50c;
    const r10    = base > 0 ? p10c / base : 0;
    const r50    = base > 0 ? p50c / base : 0;
    const r90    = base > 0 ? p90c / base : 0;
    // net = incr_revenue - cost for each scenario (scale revenue by conv ratio)
    const net10  = eco.net * (conv10 / (conv50 || 1)) - (p10c - p50c) * 3;
    const net90  = eco.net * (conv90 / (conv50 || 1)) - (p90c - p50c) * 3;

    const scenRow = (lbl, val, valColor) =>
      `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:3px 0;font-size:11px">
        <span style="color:var(--text2)">${lbl}</span>
        <span style="font-weight:600;${valColor?'color:'+valColor+';':''}">${val}</span>
      </div>`;
    const scenCol = (lbl, badge, cost, ratio, conv, net, isMid) => `
      <div style="flex:1;background:${isMid?'rgba(160,176,255,.07)':'rgba(255,255,255,.02)'};border-radius:8px;border:1px solid ${isMid?'rgba(160,176,255,.25)':'var(--border)'};padding:10px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${isMid?'#a0b0ff':'var(--text2)'}">${badge}</div>
        <div style="font-size:11px;color:var(--text);font-weight:600;margin:2px 0 8px">${lbl}</div>
        <div style="border-top:1px solid rgba(255,255,255,.07);padding-top:7px">
          ${scenRow(isRu?'Затраты (3мес)':'Cost (3mo)', fmtCur(cost*3, cur), null)}
          ${scenRow(isRu?'Нагрузка / деп.':'Deposit load', (ratio*100).toFixed(1)+'%', null)}
          ${scenRow(isRu?'Отыграют вейджер':'Wager convert', Math.round(conv*100)+'%', null)}
          <div style="border-top:1px solid rgba(255,255,255,.07);margin-top:5px;padding-top:5px">
            ${scenRow(isRu?'Чистый результат':'Net result (3mo)', (net>=0?'+':'')+fmtCur(Math.abs(net),'USD'), net>=0?'#10b981':'#ef4444')}
          </div>
        </div>
      </div>`;

    const factorRow = (lbl, score, detail) =>
      `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:12px">
        <span style="color:#8892a4">${lbl}</span>
        <span style="color:#a0b0ff;font-family:monospace;font-size:11px;margin:0 8px">${detail}</span>
        <span style="font-weight:700;color:var(--text)">×${score.toFixed(3)}</span>
      </div>`;

    return `
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${isRu?'Сценарии затрат':'Cost Scenarios'}</div>
        <div style="display:flex;gap:7px;margin-bottom:14px">
          ${scenCol(isRu?'Лучший сценарий':'Best case',  isRu?'🟢 Оптимист.':'🟢 Optimistic', p10c, r10, conv10, net10, false)}
          ${scenCol(isRu?'Базовый':'Expected',          isRu?'⚪ Базовый':'⚪ Base',        p50c, r50, conv50, eco.net, true)}
          ${scenCol(isRu?'Худший сценарий':'Worst case', isRu?'🔴 Пессимист.':'🔴 Pessimistic', p90c, r90, conv90, net90, false)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div class="econ-card-sm"><div class="econ-label">${isRu?'Доп. игроков':'Incr. Players'}</div><div class="econ-val">${fmtN(eco.incrPl)}</div></div>
          <div class="econ-card-sm"><div class="econ-label">${isRu?'Доп. выручка (3мес)':'Incr. Revenue (3mo)'}</div><div class="econ-val">$${fmtN(eco.incrRev)}</div></div>
        </div>
        <div style="margin-bottom:8px;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">${isRu?'Факторы удержания (V2)':'Retention Factors (V2)'}</div>
        ${factorRow('F1 '+  (isRu?'Вейджер':'Wager'),       v.wagFactor, `${v.wagerX}× / be=${v.beW}×`)}
        ${factorRow('F2 '+  (isRu?'Матч-бонус':'Generosity'),v.genFactor, `${v.matchPct}%`)}
        ${factorRow('F3 '+  (isRu?'Механики':'Mechanics'),   v.mechFactor,
          [v.hasNDB&&'NDB',v.hasReload&&'RL',v.hasDep2&&'D2',v.hasFS&&'FS',v.hasCB&&'CB'].filter(Boolean).join('+') || '—')}
        ${factorRow('F4 RTP', v.rtpFactor, `${(v.rtp*100).toFixed(0)}%`)}
        ${factorRow('F5 '+  (isRu?'Платформа':'Platform'),   v.platFactor, v.plat)}
        <div style="display:flex;justify-content:space-between;padding:6px 0;margin-top:4px;font-size:13px;font-weight:700">
          <span style="color:var(--text)">${isRu?'Прирост удержания':'Retention Lift'}</span>
          <span style="color:#a0b0ff">${(v.lift*100).toFixed(1)}%</span>
        </div>
      </div>`;
  }

  if (ai.tab === 'audit') {
    if (ai.auditLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.audit)        return renderAuditContent(ai.audit);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runBonusAudit()">${cfgT('run_audit')}</button>
    </div>`;
  }

  if (ai.tab === 'optimize') {
    if (ai.optimizeLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.optimize)        return renderOptimizeContent(ai.optimize);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runBonusOptimize()">${cfgT('run_optimize')}</button>
    </div>`;
  }
  return '';
}

async function runBonusAudit() {
  const B = CS.bonus;
  if (!B.config) return;
  CAI.bonus.auditLoading = true;
  document.getElementById('bonus-ai-content').innerHTML = loadingHtml(cfgT('ai_loading'));
  const geo = cfgGeo(B.geo);
  const ratio = B.costs ? B.costs.ratio : (B.config.econ?.costRatio || 0);
  try {
    const res = await fetch('/api/campaign/audit', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        mechanic: B.config,
        mechanicType: deriveMechanicType(B.active),
        params: {
          geo:     B.geo,
          segment: B.segment,
          lic:     geo.lic,
          lang:    cfgLang(),
          risk:    ratio < 0.10 ? 'low' : ratio < 0.25 ? 'mid' : 'high',
        },
        uiLang: cfgLang(),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    CAI.bonus.audit = await res.json();
  } catch(e) {
    CAI.bonus.audit = { error: e.message };
  } finally {
    CAI.bonus.auditLoading = false;
    document.getElementById('bonus-ai-content').innerHTML = renderBonusAiContent(B);
  }
}

async function runBonusOptimize() {
  const B = CS.bonus;
  if (!B.config) return;
  CAI.bonus.optimizeLoading = true;
  document.getElementById('bonus-ai-content').innerHTML = loadingHtml(cfgT('ai_loading'));
  const lv = computeBonusLift(B);
  if (!lv) { CAI.bonus.optimizeLoading = false; return; }
  try {
    const res = await fetch('/api/campaign/optimize', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        geo:       B.geo,
        segment:   B.segment || 'mid',
        lift:      lv.lift,
        economics: lv.economics,
        uiLang:    cfgLang(),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    CAI.bonus.optimize = await res.json();
  } catch(e) {
    CAI.bonus.optimize = { error: e.message };
  } finally {
    CAI.bonus.optimizeLoading = false;
    document.getElementById('bonus-ai-content').innerHTML = renderBonusAiContent(B);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// TOURNAMENT SECTION
// ══════════════════════════════════════════════════════════════════════════

function renderTournamentSection() {
  const T = CS.tournament;
  return `
    ${renderTournTypeCard(T)}
    <div class="card-grid" style="margin-bottom:16px">
      ${renderTournAudienceCard(T)}
      ${renderTournSetupCard(T)}
    </div>
    <div style="text-align:center;margin-bottom:28px">
      <button class="btn btn-primary btn-lg" onclick="onGenerateTournament()" id="btn-calculate">
        ${cfgT(T.result ? 'recalculate' : 'calculate')}
      </button>
    </div>
    <div id="tourn-results">${T.result ? renderTournamentResults(T) : ''}</div>
  `;
}

function renderTournTypeCard(T) {
  const lang = cfgLang();
  return `
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">${cfgT('tourn_type')}</div>
      <div class="chips">
        ${TOURN_TYPES.map(tp => `
          <div class="chip type-card${T.type===tp.val?' on':''}" data-grp="tourn-type" data-val="${tp.val}" onclick="tournSetType('${tp.val}')">
            <span class="tc-icon">${tp.icon}</span>
            <span class="tc-name">${tp['name_'+lang]||tp.name_en}</span>
            <span class="tc-desc">${tp['desc_'+lang]||tp.desc_en}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderTournAudienceCard(T) {
  const geoOpts = CFG_GEO.map(g=>`<option value="${g.val}"${g.val===T.geo?' selected':''}>${g.lbl}</option>`).join('');
  const segments = [
    {val:'all',lbl:'seg_all'},{val:'depositors',lbl:'seg_depositors'},
    {val:'new',lbl:'seg_new'},{val:'vip',lbl:'seg_vip'},{val:'dormant',lbl:'seg_dormant'},
  ];
  return `
    <div class="card">
      <div class="card-title">${cfgT('tourn_params')} — ${cfgT('tourn_geo').split('/')[0]}</div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_geo')}</label>
        <select class="form-input" onchange="CS.tournament.geo=this.value">${geoOpts}</select>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_players')}</label>
        <input class="form-input" type="number" value="${T.totalPlayers}" min="100" step="100"
               onchange="CS.tournament.totalPlayers=+this.value||5000">
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_segment')}</label>
        <div class="chips">
          ${segments.map(s=>`<div class="chip${T.segment===s.val?' on':''}" data-grp="tourn-seg" data-val="${s.val}" onclick="tournSetSeg('${s.val}')">${cfgT(s.lbl)}</div>`).join('')}
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_duration')}</label>
        <div class="chips" style="flex-wrap:wrap">
          ${['flash','daily','weekly','monthly','multi_round'].map(d=>`
            <div class="chip${T.duration===d?' on':''}" data-grp="tourn-duration" data-val="${d}" onclick="tournSet('duration','${d}')">${cfgT('dur_'+d.replace('_round',''))}</div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderTournSetupCard(T) {
  const dur = T.duration;
  const lang = cfgLang();
  const geo = cfgGeo(T.geo);
  return `
    <div class="card">
      <div class="card-title">${cfgT('tourn_params')} — ${cfgT('tourn_prize').split(' ')[0]}</div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_prize')} (${geo.cur})</label>
        <input class="form-input" type="number" value="${T.prizePool}" min="100" step="100"
               onchange="CS.tournament.prizePool=+this.value||1000">
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_pool_model')}</label>
        <div class="chips">
          ${['fixed','dynamic','hybrid'].map(p=>`<div class="chip${T.poolModel===p?' on':''}" data-grp="tourn-pool" data-val="${p}" onclick="tournSet('poolModel','${p}')">${cfgT('pool_'+p)}</div>`).join('')}
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_entry')}</label>
        <div class="chips">
          ${['freeroll','buyin','ticket'].map(e=>`<div class="chip${T.entryModel===e?' on':''}" data-grp="tourn-entry" data-val="${e}" onclick="tournSet('entryModel','${e}')">${cfgT('entry_'+e)}</div>`).join('')}
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_scoring')}</label>
        <div class="chips" style="flex-wrap:wrap">
          ${[['total_wins','wins'],['highest_multiplier','mult'],['most_spins','spins'],['mission_based','mission']].map(([val,k])=>`
            <div class="chip${T.scoring===val?' on':''}" data-grp="tourn-scoring" data-val="${val}" onclick="tournSet('scoring','${val}')">${cfgT('scoring_'+k)}</div>
          `).join('')}
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_distribution')}</label>
        <div class="chips" style="flex-wrap:wrap">
          ${[['top_n','top_n'],['linear_decay','linear'],['flat_tier','flat'],['prize_drop','drop']].map(([val,k])=>`
            <div class="chip${T.distribution===val?' on':''}" data-grp="tourn-dist" data-val="${val}" onclick="tournSet('distribution','${val}')">${cfgT('dist_'+k)}</div>
          `).join('')}
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_reentry')}</label>
        <div class="chips">
          ${['single','rebuy','unlimited'].map(r=>`<div class="chip${T.reentry===r?' on':''}" data-grp="tourn-reentry" data-val="${r}" onclick="tournSet('reentry','${r}')">${cfgT('reentry_'+r)}</div>`).join('')}
        </div>
      </div>
      ${T.poolModel !== 'fixed' ? `<div class="form-row">
        <label class="form-label">${cfgT('tourn_rake')} — <span id="rake-disp" style="font-weight:700;color:var(--text)">${T.rake}%</span></label>
        <input type="range" min="1" max="20" step="1" value="${T.rake}"
               oninput="CS.tournament.rake=+this.value;document.getElementById('rake-disp').textContent=this.value+'%'">
      </div>` : ''}
    </div>
  `;
}

function tournSetType(val) {
  CS.tournament.type = val;
  document.querySelectorAll('#content [data-grp="tourn-type"]').forEach(c =>
    c.classList.toggle('on', c.dataset.val === val)
  );
}
function tournSetSeg(val) {
  CS.tournament.segment = val;
  document.querySelectorAll('#content [data-grp="tourn-seg"]').forEach(c =>
    c.classList.toggle('on', c.dataset.val === val)
  );
}
function tournSet(key, val) {
  CS.tournament[key] = val;
  const grpMap = { duration:'tourn-duration', poolModel:'tourn-pool', entryModel:'tourn-entry',
                   scoring:'tourn-scoring', distribution:'tourn-dist', reentry:'tourn-reentry' };
  const grp = grpMap[key];
  if (grp) {
    document.querySelectorAll(`#content [data-grp="${grp}"]`).forEach(c =>
      c.classList.toggle('on', c.dataset.val === val)
    );
  }
}

async function onGenerateTournament() {
  if (_generating) return;
  _generating = true;
  const btn = document.getElementById('btn-calculate');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  const T   = CS.tournament;
  const geo = cfgGeo(T.geo);
  const body = {
    type: T.type,
    params: {
      geo: T.geo, region: geo.region,
      segment: T.segment,
      totalPlayers: T.totalPlayers,
      duration: T.duration,
      prizePool: T.prizePool,
      poolModel: T.poolModel,
      distribution: T.distribution,
      entryModel: T.entryModel,
      scoring: T.scoring,
      reentry: T.reentry,
      rake: T.rake,
      lang: cfgLang(),
      tone: 'professional',
    }
  };

  try {
    const res = await fetch('/api/tournament/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    T.result = data;
    CAI.tournament = { tab:'econ', audit:null, optimize:null, auditLoading:false, optimizeLoading:false };
    cfgRender();
  } catch(e) {
    showToast('Error: ' + e.message, '#ef4444');
  } finally {
    _generating = false;
    const b = document.getElementById('btn-calculate');
    if (b) { b.disabled = false; b.textContent = cfgT(CS.tournament.result ? 'recalculate' : 'calculate'); }
  }
}

function renderTournamentResults(T) {
  const d   = T.result;
  const econ = d.econ || {};
  const geo  = cfgGeo(T.geo);
  const cur  = d.cur || geo.cur;
  const ai   = CAI.tournament;

  const eligible   = econ.eligible              || 0;
  const expPart    = econ.participantsMid        || 0;
  const ggrLift    = econ.ggrLiftMid             || 0;
  const roi        = econ.roi                    || 0;
  const engagement = econ.engagementMultiplier   || 1.5;
  const cpp        = econ.costPerActiveMid       || 0;

  const econCards = `
    <div class="econ-grid">
      ${econCard('', cfgT('econ_eligible'),    fmtN(eligible),          cfgT('seg_'+T.segment)||T.segment, '')}
      ${econCard('', cfgT('econ_participation'),fmtN(expPart),           cfgT('per_mo'), '')}
      ${econCard('', cfgT('econ_ggr_lift'),    typeof ggrLift==='number'&&ggrLift<2 ? fmtPct(ggrLift) : '+'+fmtN(ggrLift,0), '', ggrLift>0?'pos':'')}
      ${econCard('', cfgT('econ_roi_tourn'),   (roi||0).toFixed(0)+'%', cfgT('of_deposits'), roi>0?'pos':'neg')}
      ${econCard('', cfgT('econ_engagement'),  fmtN(engagement,2)+'×',  'vs normal play',    'pos')}
      ${econCard('', cfgT('econ_cost_active'), fmtCur(cpp, cur),        cfgT('per_player'),  '')}
    </div>
  `;

  // Prize table
  let prizeHtml = '';
  const prizes = d.spec?.prizes || [];
  if (prizes.length) {
    prizeHtml = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-title" style="margin-bottom:10px">
          Prize Distribution (${cur} ${fmtN(T.prizePool)} pool)
        </div>
        ${prizes.slice(0,10).map((p,i) => {
          const pct = T.prizePool > 0 ? (p.amount / T.prizePool) * 100 : 0;
          return `<div class="prize-row">
            <span class="prize-place">#${i+1}</span>
            <div class="prize-bar-wrap"><div class="prize-bar" style="width:${Math.min(100,pct)}%"></div></div>
            <span class="prize-amt">${fmtCur(p.amount, cur)}</span>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  const tabs = `
    <div class="tab-row">
      ${['econ','audit','optimize'].map(tab=>`
        <button class="tab${ai.tab===tab?' active':''}" onclick="tournSetTab('${tab}')">${cfgT('tab_'+tab)}</button>
      `).join('')}
    </div>
    <div id="tourn-ai-content">${renderTournAiContent(T)}</div>
  `;

  return `
    <div class="results-hdr">
      <div class="results-title">${cfgT('tab_econ')}</div>
      <div class="results-actions">
        <button class="btn btn-sm btn-outline" onclick="cfgSaveTournament()">${cfgT('save_btn')}</button>
        <button class="btn btn-sm btn-outline" onclick="cfgTournToCalendar()">${cfgT('calendar_btn')}</button>
      </div>
    </div>
    ${econCards}
    ${prizeHtml}
    <div class="card">
      <div class="card-title" style="margin-bottom:10px">${cfgT('tab_audit')} & ${cfgT('tab_optimize')}</div>
      ${tabs}
    </div>
  `;
}

function tournSetTab(tab) {
  CAI.tournament.tab = tab;
  const el = document.getElementById('tourn-ai-content');
  if (el) el.innerHTML = renderTournAiContent(CS.tournament);
  document.querySelectorAll('.tab-row .tab').forEach(t =>
    t.classList.toggle('active', t.getAttribute('onclick').includes(`'${tab}'`))
  );
}

function renderTournEconContent(T) {
  const d    = T.result;
  const econ = d.econ || {};
  const cur  = d.cur || cfgGeo(T.geo).cur;
  const isRu = cfgLang() === 'ru';

  const pLow  = econ.participantsLow  || 0;
  const pMid  = econ.participantsMid  || 0;
  const pHigh = econ.participantsHigh || 0;
  const gLow  = econ.ggrLiftLow       || 0;
  const gMid  = econ.ggrLiftMid       || 0;
  const gHigh = econ.ggrLiftHigh      || 0;
  const nLow  = econ.netMarginLow     || 0;
  const nMid  = econ.netMarginMid     || 0;
  const nHigh = econ.netMarginHigh    || 0;
  const cpLow  = econ.costPerActiveLow  || (pLow  > 0 ? (econ.prizePoolCost||0) / pLow  : 0);
  const cpMid  = econ.costPerActiveMid  || (pMid  > 0 ? (econ.prizePoolCost||0) / pMid  : 0);
  const cpHigh = econ.costPerActiveHigh || (pHigh > 0 ? (econ.prizePoolCost||0) / pHigh : 0);

  const scColor = n => n > 0 ? '#10b981' : n < 0 ? '#ef4444' : 'var(--text2)';

  const L = isRu
    ? { p10:'🔴 Мало участников', p50:'⚪ Ожидаемый', p90:'🟢 Высокий охват',
        part:'Участников', ggr:'Прирост GGR', net:'Чистая маржа', cpp:'Стоим./участника',
        poolCost:'Стоимость пула', retVal:'Ретеншн-ценность', totVal:'Итого ценность (база)', bePlay:'Break-even участников', roi:'ROI' }
    : { p10:'🔴 Low turnout', p50:'⚪ Expected', p90:'🟢 High turnout',
        part:'Participants', ggr:'GGR Lift', net:'Net Margin', cpp:'Cost / Participant',
        poolCost:'Prize Pool Cost', retVal:'Retention Value', totVal:'Total Value (base)', bePlay:'Break-even Players', roi:'ROI' };

  const th = s => `<th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border);font-weight:600;font-size:11px">${s}</th>`;
  const td = (v, bold, color) => `<td style="text-align:right;padding:8px;border-bottom:1px solid rgba(255,255,255,.04);${bold?'font-weight:700;':''};${color?'color:'+color+';':''}">${v}</td>`;

  return `
    <div style="padding:12px 0">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${isRu?'Сценарии':'Scenarios'}</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
        <thead>
          <tr style="color:var(--text2);background:rgba(255,255,255,.02)">
            <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);font-size:11px"></th>
            ${th(L.p10)} ${th(L.p50)} ${th(L.p90)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:8px;color:var(--text2);font-size:11px;border-bottom:1px solid rgba(255,255,255,.04)">${L.part}</td>
            ${td(fmtN(pLow), false, null)} ${td(fmtN(pMid), true, '#a0b0ff')} ${td(fmtN(pHigh), false, null)}
          </tr>
          <tr>
            <td style="padding:8px;color:var(--text2);font-size:11px;border-bottom:1px solid rgba(255,255,255,.04)">${L.ggr}</td>
            ${td(fmtCur(gLow,cur), false, null)} ${td(fmtCur(gMid,cur), true, '#a0b0ff')} ${td(fmtCur(gHigh,cur), false, null)}
          </tr>
          <tr>
            <td style="padding:8px;color:var(--text2);font-size:11px;border-bottom:1px solid rgba(255,255,255,.04)">${L.cpp}</td>
            ${td(fmtCur(cpLow,cur), false, 'var(--text2)')} ${td(fmtCur(cpMid,cur), false, 'var(--text2)')} ${td(fmtCur(cpHigh,cur), false, 'var(--text2)')}
          </tr>
          <tr>
            <td style="padding:8px;color:var(--text2);font-size:11px">${L.net}</td>
            ${td(fmtCur(nLow,cur), true, scColor(nLow))} ${td(fmtCur(nMid,cur), true, scColor(nMid))} ${td(fmtCur(nHigh,cur), true, scColor(nHigh))}
          </tr>
        </tbody>
      </table>
      <div class="econ-grid" style="margin-top:4px">
        ${econCard('', L.poolCost,  fmtCur(econ.prizePoolCost||0, cur),    '',              '')}
        ${econCard('', L.retVal,    fmtCur(econ.retentionValue||0, cur),   '+30-day GGR',   'pos')}
        ${econCard('', L.totVal,    fmtCur(econ.totalValueMid||0, cur),    '',              (econ.totalValueMid||0)>0?'pos':'neg')}
        ${econCard('', L.bePlay,    fmtN(econ.breakEvenParticipants||0),   isRu?'участн.':'players', '')}
        ${econCard('', L.roi,       (econ.roi||0).toFixed(0)+'%',          'P50',           (econ.roi||0)>=100?'pos':'neg')}
      </div>
    </div>
  `;
}

function renderTournAiContent(T) {
  const ai = CAI.tournament;
  if (ai.tab === 'econ') return renderTournEconContent(T);
  if (ai.tab === 'audit') {
    if (ai.auditLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.audit)        return renderAuditContent(ai.audit);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runTournAudit()">${cfgT('run_audit')}</button>
    </div>`;
  }
  if (ai.tab === 'optimize') {
    if (ai.optimizeLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.optimize)        return renderTournOptimizeContent(ai.optimize);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runTournOptimize()">${cfgT('run_optimize')}</button>
    </div>`;
  }
  return '';
}

async function runTournAudit() {
  const T = CS.tournament;
  if (!T.result) return;
  CAI.tournament.auditLoading = true;
  document.getElementById('tourn-ai-content').innerHTML = loadingHtml(cfgT('ai_loading'));
  try {
    const res = await fetch('/api/tournament/audit', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ type: T.type, spec: T.result.spec, params: T.result.params }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    CAI.tournament.audit = await res.json();
  } catch(e) { CAI.tournament.audit = { error: e.message }; }
  finally {
    CAI.tournament.auditLoading = false;
    document.getElementById('tourn-ai-content').innerHTML = renderTournAiContent(T);
  }
}

async function runTournOptimize() {
  const T = CS.tournament;
  if (!T.result) return;
  CAI.tournament.optimizeLoading = true;
  document.getElementById('tourn-ai-content').innerHTML = loadingHtml(cfgT('ai_loading'));
  try {
    const res = await fetch('/api/tournament/optimize', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ type: T.type, params: T.result.params, econ: T.result.econ, mode:'optimize' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    CAI.tournament.optimize = await res.json();
  } catch(e) { CAI.tournament.optimize = { error: e.message }; }
  finally {
    CAI.tournament.optimizeLoading = false;
    document.getElementById('tourn-ai-content').innerHTML = renderTournAiContent(T);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// LOYALTY SECTION
// ══════════════════════════════════════════════════════════════════════════

function renderLoyaltySection() {
  const LY = CS.loyalty;
  const lang = cfgLang();
  return `
    ${renderLoyaltyModeCard(LY, lang)}
    <div class="card-grid" style="margin-bottom:16px">
      ${renderLoyaltyAudienceCard(LY)}
      ${renderLoyaltyDesignCard(LY)}
    </div>
    <div style="text-align:center;margin-bottom:28px">
      <button class="btn btn-primary btn-lg" onclick="onGenerateLoyalty()" id="btn-calculate">
        ${cfgT(LY.result ? 'recalculate' : 'calculate')}
      </button>
    </div>
    <div id="loyalty-results">${LY.result ? renderLoyaltyResults(LY) : ''}</div>
  `;
}

function renderLoyaltyModeCard(LY, lang) {
  return `
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">${cfgT('loyal_mode')}</div>
      <div class="chips">
        ${LOYALTY_MODES.map(m=>`
          <div class="chip type-card${LY.mode===m.val?' on':''}" data-grp="loyal-mode" data-val="${m.val}" onclick="loyalSetMode('${m.val}')">
            <span class="tc-icon">${m.icon}</span>
            <span class="tc-name">${m['name_'+lang]||m.name_en}</span>
            <span class="tc-desc">${m['desc_'+lang]||m.desc_en}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderLoyaltyAudienceCard(LY) {
  const regOpts = ['eu','cis','mn','latam','sweep','crypto'].map(r=>
    `<option value="${r}"${r===LY.region?' selected':''}>${cfgT('reg_'+r)}</option>`
  ).join('');
  return `
    <div class="card">
      <div class="card-title">${cfgT('loyal_audience')}</div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_region')}</label>
        <select class="form-input" onchange="CS.loyalty.region=this.value">${regOpts}</select>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_segment')}</label>
        <div class="chips">
          ${['new','mid','vip'].map(s=>`<div class="chip${LY.segment===s?' on':''}" data-grp="loyal-seg" data-val="${s}" onclick="loyalSetSeg('${s}')">${cfgT('seg_'+s)}</div>`).join('')}
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_players')}</label>
        <input class="form-input" type="number" value="${LY.players}" min="100" step="100"
               onchange="CS.loyalty.players=+this.value||5000">
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_avgdep')} (USD)</label>
        <input class="form-input" type="number" value="${LY.avgdep}" min="1" step="1"
               onchange="CS.loyalty.avgdep=+this.value||100">
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_arpu')}</label>
        <input class="form-input" type="number" value="${LY.arpu}" min="1" step="1"
               onchange="CS.loyalty.arpu=+this.value||50">
      </div>
    </div>
  `;
}

function renderLoyaltyDesignCard(LY) {
  const tierOpts = [3,4,5].map(n=>`<option value="${n}"${n===LY.numTiers?' selected':''}>${n}</option>`).join('');
  return `
    <div class="card">
      <div class="card-title">${cfgT('loyal_design')}</div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_tiers')}</label>
        <select class="form-input" onchange="CS.loyalty.numTiers=+this.value">${tierOpts}</select>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_cashback')} — <span id="ly-cb-disp" style="font-weight:700;color:var(--text)">${LY.topCashbackRate}%</span></label>
        <input type="range" min="1" max="30" step="0.5" value="${LY.topCashbackRate}"
               oninput="CS.loyalty.topCashbackRate=+this.value;document.getElementById('ly-cb-disp').textContent=this.value+'%'">
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_earn_dep')}</label>
        <input class="form-input" type="number" value="${LY.earnRateDeposit}" min="1" step="1"
               onchange="CS.loyalty.earnRateDeposit=+this.value||10">
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_earn_wag')}</label>
        <input class="form-input" type="number" value="${LY.earnRateWager}" min="0.1" step="0.1"
               onchange="CS.loyalty.earnRateWager=+this.value||1">
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_redeem')}</label>
        <input class="form-input" type="number" value="${LY.redeemRate}" min="1" step="1"
               onchange="CS.loyalty.redeemRate=+this.value||100">
      </div>
      ${LY.mode !== 'tiers' ? `<div class="form-row">
        <label class="form-label">${cfgT('loyal_missions')}</label>
        <input class="form-input" type="number" value="${LY.missionCount}" min="1" max="10" step="1"
               onchange="CS.loyalty.missionCount=+this.value||3">
      </div>` : ''}
    </div>
  `;
}

function loyalSetMode(val) {
  CS.loyalty.mode = val;
  document.querySelectorAll('#content [data-grp="loyal-mode"]').forEach(c =>
    c.classList.toggle('on', c.dataset.val === val)
  );
}
function loyalSetSeg(val) {
  CS.loyalty.segment = val;
  document.querySelectorAll('#content [data-grp="loyal-seg"]').forEach(c =>
    c.classList.toggle('on', c.dataset.val === val)
  );
}

async function onGenerateLoyalty() {
  if (_generating) return;
  _generating = true;
  const btn = document.getElementById('btn-calculate');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  const LY = CS.loyalty;
  const body = {
    mode: LY.mode, region: LY.region, segment: LY.segment,
    players: LY.players, avgdep: LY.avgdep, arpu: LY.arpu,
    numTiers: LY.numTiers, topCashbackRate: LY.topCashbackRate / 100,
    earnRateDeposit: LY.earnRateDeposit,
    earnRateWager: LY.earnRateWager,
    redeemRate: LY.redeemRate,
    redeemMinPoints: LY.redeemMinPoints,
    pointsExpiry: LY.pointsExpiry,
    missionCount: LY.missionCount,
  };

  try {
    const res = await fetch('/api/loyalty/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    LY.result = data;
    CAI.loyalty = { tab:'econ', audit:null, optimize:null, missions:null, auditLoading:false, optimizeLoading:false, missionsLoading:false };
    cfgRender();
  } catch(e) {
    showToast('Error: ' + e.message, '#ef4444');
  } finally {
    _generating = false;
    const b = document.getElementById('btn-calculate');
    if (b) { b.disabled = false; b.textContent = cfgT(CS.loyalty.result ? 'recalculate' : 'calculate'); }
  }
}

function renderLoyaltyResults(LY) {
  const d   = LY.result;
  const econ = d.econ || {};
  const ai   = CAI.loyalty;

  const costMo    = econ.monthlyCostUSD    || 0;
  const costGgr   = (econ.costRatioPct    || 0) / 100;
  const retention = (econ.retentionLiftPct || 0) / 100;
  const roi3      = econ.roi3m             || 0;
  const breakeven = econ.breakEvenMonths;
  const liability = econ.totalLiabilityUSD || 0;

  const econCards = `
    <div class="econ-grid">
      ${econCard('', cfgT('loyal_monthly_cost'), '$'+fmtN(costMo), cfgT('per_mo'), '')}
      ${econCard('', cfgT('econ_cost_ggr'),  fmtPct(costGgr),  'of GGR',          costGgr<0.15?'pos':costGgr<0.25?'neu':'neg')}
      ${econCard('', cfgT('econ_retention'), fmtPct(retention),'lift',             'pos')}
      ${econCard('', cfgT('econ_ltv3'),      fmtPct(roi3),     '3-month',         roi3>0?'pos':'neg')}
      ${econCard('', cfgT('econ_breakeven'), breakeven != null ? fmtN(breakeven,1)+' mo' : '—', 'months', '')}
      ${econCard('', cfgT('econ_liability'), '$'+fmtN(liability), 'unredeemed pts', '')}
    </div>
  `;

  // Tier table
  const tiers = (d.config && d.config.tiers) || d.tiers || [];
  let tierHtml = '';
  if (tiers.length) {
    tierHtml = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-title" style="margin-bottom:10px">${cfgT('tier_table_title')}</div>
        <table class="tier-table">
          <thead><tr>
            <th>${cfgT('tier_name')}</th>
            <th>${cfgT('tier_pts')}</th>
            <th>${cfgT('tier_cb')}</th>
            <th>${cfgT('tier_fs')}</th>
            <th>${cfgT('tier_mult')}</th>
          </tr></thead>
          <tbody>
            ${tiers.map((tier,i) => {
              const def = TIER_DEFS[i] || TIER_DEFS[TIER_DEFS.length-1];
              return `<tr>
                <td><span class="tier-badge" style="background:${def.bg};color:${def.color}">${def.icon} ${tier.label||tier.name||def.name}</span></td>
                <td>${fmtN(tier.minPoints||0)}</td>
                <td>${tier.cashbackRate ? fmtPct(tier.cashbackRate) : '—'}</td>
                <td>${tier.freeSpinsMonthly != null ? fmtN(tier.freeSpinsMonthly) : '—'}</td>
                <td>${tier.bonusMultiplier ? tier.bonusMultiplier+'×' : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Missions
  const missions = (d.config && d.config.missions) || d.missions || [];
  let missionHtml = '';
  if (missions.length) {
    missionHtml = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-title" style="margin-bottom:10px">${cfgT('tab_missions')}</div>
        ${missions.map(m => `
          <div class="mission-row">
            <div class="mission-name">${m.name || m.objective}</div>
            <div class="mission-meta">
              <span class="mission-tag">${m.objective || ''}</span>
              <span>${m.frequency || ''}</span>
              <span>${m.rewardType}: ${m.rewardValue}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  const hasMissions = LY.mode !== 'tiers';
  const tabs = `
    <div class="tab-row">
      ${['econ','audit','optimize', ...(hasMissions?['missions']:[])].map(tab=>`
        <button class="tab${ai.tab===tab?' active':''}" onclick="loyalSetTab('${tab}')">${cfgT('tab_'+tab)}</button>
      `).join('')}
    </div>
    <div id="loyalty-ai-content">${renderLoyaltyAiContent(LY)}</div>
  `;

  return `
    <div class="results-hdr">
      <div class="results-title">${cfgT('tab_econ')}</div>
      <div class="results-actions">
        <button class="btn btn-sm btn-outline" onclick="cfgSaveLoyalty()">${cfgT('save_btn')}</button>
        <button class="btn btn-sm btn-outline" onclick="cfgLoyaltyToCalendar()">${cfgT('calendar_btn')}</button>
      </div>
    </div>
    ${econCards}
    ${tierHtml}
    ${missionHtml}
    <div class="card">
      <div class="card-title" style="margin-bottom:10px">AI Analysis</div>
      ${tabs}
    </div>
  `;
}

function loyalSetTab(tab) {
  CAI.loyalty.tab = tab;
  const el = document.getElementById('loyalty-ai-content');
  if (el) el.innerHTML = renderLoyaltyAiContent(CS.loyalty);
  document.querySelectorAll('.tab-row .tab').forEach(t =>
    t.classList.toggle('active', t.getAttribute('onclick').includes(`'${tab}'`))
  );
}

function renderLoyaltyEconContent(LY) {
  const d    = LY.result;
  const econ = d.econ || {};
  const isRu = cfgLang() === 'ru';

  const monthly     = econ.monthlyCostUSD     || 0;
  const tierCost    = econ.tierRewardCostUSD   || 0;
  const missionCost = econ.missionCostUSD      || 0;
  const redeemCost  = monthly - tierCost - missionCost;
  const costRatio   = econ.costRatioPct        || 0;
  const retention   = econ.retentionLiftPct    || 0;
  const roi3        = econ.roi3m               || 0;
  const rev3m       = econ.additionalRevenue3m || 0;
  const breakeven   = econ.breakEvenMonths;
  const liability   = econ.totalLiabilityUSD   || 0;
  const ptsEarned   = econ.avgEarnedPointsPerPlayer || 0;
  const ptsRedeemed = econ.avgRedeemedPointsPerPlayer || 0;

  // ── Synthetic P10/P50/P90 scenarios ──────────────────────────────────────
  // P10 (conservative / high-breakage): player engagement is lower — fewer
  //   points redeemed (×0.70 cost), lower retention effect (×0.80 revenue)
  // P90 (optimistic / low-breakage): high engagement — more redemptions
  //   (×1.30 cost), stronger retention (×1.20 revenue)
  const SCENARIOS = [
    { badge: isRu?'🟢 Низкий отток':'🟢 Low churn',    lbl: isRu?'Игроки мало погашают':'Players redeem less',  costMult:0.70, revMult:0.80, isMid:false },
    { badge: isRu?'⚪ Базовый':'⚪ Base case',          lbl: isRu?'По модели (40% погашений)':'Model rate (40% redemption)', costMult:1.00, revMult:1.00, isMid:true  },
    { badge: isRu?'🔴 Высокий отток':'🔴 High churn',  lbl: isRu?'Игроки активно погашают':'Players redeem heavily', costMult:1.30, revMult:1.20, isMid:false },
  ];

  const scColor = n => n > 0 ? '#10b981' : n < 0 ? '#ef4444' : 'var(--text2)';
  const lyScRow = (lbl, val, valColor) =>
    `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:3px 0;font-size:11px">
      <span style="color:var(--text2)">${lbl}</span>
      <span style="font-weight:600;${valColor?'color:'+valColor+';':''}">${val}</span>
    </div>`;
  const scenCols = SCENARIOS.map(s => {
    const sCost  = monthly * s.costMult;
    const sRev3  = rev3m   * s.revMult;
    const sRatio = costRatio * s.costMult;
    const sRoi   = sCost > 0 ? (sRev3 / (sCost * 3)) : 0;
    const sNet   = sRev3 - sCost * 3;
    return `
      <div style="flex:1;background:${s.isMid?'rgba(160,176,255,.07)':'rgba(255,255,255,.02)'};border-radius:8px;border:1px solid ${s.isMid?'rgba(160,176,255,.25)':'var(--border)'};padding:10px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${s.isMid?'#a0b0ff':'var(--text2)'}">${s.badge}</div>
        <div style="font-size:11px;color:var(--text);font-weight:600;margin:2px 0 8px">${s.lbl}</div>
        <div style="border-top:1px solid rgba(255,255,255,.07);padding-top:7px">
          ${lyScRow(isRu?'Затраты/мес':'Monthly cost', '$'+fmtN(sCost), null)}
          ${lyScRow(isRu?'Нагрузка / GGR':'Cost / GGR', sRatio.toFixed(1)+'%', null)}
          ${lyScRow('ROI 3' + (isRu?'мес':'mo'), fmtPct(sRoi), sRoi>0?'#10b981':'#ef4444')}
          <div style="border-top:1px solid rgba(255,255,255,.07);margin-top:5px;padding-top:5px">
            ${lyScRow(isRu?'Чистый результат':'Net result (3mo)', (sNet>=0?'+':'')+'$'+fmtN(Math.abs(sNet)), scColor(sNet))}
          </div>
        </div>
      </div>`;
  }).join('');

  const L = isRu
    ? { scenarios:'Сценарии',            breakdown:'Разбивка затрат',
        pts:'Экономика очков',           ptRedeem:'Погашение очков',
        tierRew:'Награды тиров',         misRew:'Награды миссий',
        moCost:'Ежемес. затраты',        costGgr:'Затраты / GGR',
        retLift:'Прирост ретеншн',       roi:'ROI 3 мес',
        addRev:'Доп. выручка 3мес',      be:'Окупаемость',
        earned:'Начислено / игрок',      redeemed:'Погашено / игрок', liab:'Обязательства' }
    : { scenarios:'Scenarios',           breakdown:'Cost Breakdown',
        pts:'Points Economy',            ptRedeem:'Points Redemption',
        tierRew:'Tier Rewards',          misRew:'Mission Rewards',
        moCost:'Monthly Cost',           costGgr:'Cost / GGR',
        retLift:'Retention Lift',        roi:'3-Month ROI',
        addRev:'Added Revenue 3m',       be:'Break-even',
        earned:'Earned / Player',        redeemed:'Redeemed / Player', liab:'Point Liability' };

  const costColor = costRatio < 15 ? 'var(--success)' : costRatio < 25 ? 'var(--text)' : '#ef4444';

  return `
    <div style="padding:12px 0">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${L.scenarios}</div>
      <div style="display:flex;gap:7px;margin-bottom:16px">${scenCols}</div>

      <div class="econ-grid" style="margin-bottom:16px">
        ${econCard('', L.moCost,   '$'+fmtN(monthly),          isRu?'всего программа':'total program',   '')}
        ${econCard('', L.costGgr,  costRatio.toFixed(1)+'%',   isRu?'от выручки':'of gross revenue',     costRatio<15?'pos':costRatio<25?'neu':'neg')}
        ${econCard('', L.retLift,  retention.toFixed(1)+'%',   '+activity',   'pos')}
        ${econCard('', L.roi,      fmtPct(roi3),               '3-month',     roi3>0?'pos':'neg')}
        ${econCard('', L.addRev,   '$'+fmtN(rev3m),            '3-month',     'pos')}
        ${econCard('', L.be,       breakeven != null ? fmtN(breakeven,1)+' mo' : '—', isRu?'мес':'months', '')}
      </div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${L.breakdown}</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
        <tbody>
          <tr style="border-bottom:1px solid rgba(255,255,255,.05)">
            <td style="padding:7px 8px">${L.ptRedeem}</td>
            <td style="text-align:right;padding:7px 8px">$${fmtN(redeemCost)}</td>
            <td style="text-align:right;padding:7px 8px;color:var(--text2)">${monthly>0?(redeemCost/monthly*100).toFixed(0)+'%':''}</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,.05)">
            <td style="padding:7px 8px">${L.tierRew}</td>
            <td style="text-align:right;padding:7px 8px">$${fmtN(tierCost)}</td>
            <td style="text-align:right;padding:7px 8px;color:var(--text2)">${monthly>0?(tierCost/monthly*100).toFixed(0)+'%':''}</td>
          </tr>
          <tr>
            <td style="padding:7px 8px">${L.misRew}</td>
            <td style="text-align:right;padding:7px 8px">$${fmtN(missionCost)}</td>
            <td style="text-align:right;padding:7px 8px;color:var(--text2)">${monthly>0?(missionCost/monthly*100).toFixed(0)+'%':''}</td>
          </tr>
        </tbody>
      </table>
      <div style="font-size:11px;color:var(--text2);margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${L.pts}</div>
      <div class="econ-grid">
        ${econCard('', L.earned,   fmtN(ptsEarned,0)+' pts',   isRu?'в месяц':'per month',  '')}
        ${econCard('', L.redeemed, fmtN(ptsRedeemed,0)+' pts', isRu?'в месяц':'per month',  '')}
        ${econCard('', L.liab,     '$'+fmtN(liability),         isRu?'непогашено':'unredeemed', '')}
      </div>
    </div>
  `;
}

function renderLoyaltyAiContent(LY) {
  const ai = CAI.loyalty;
  if (ai.tab === 'econ') return renderLoyaltyEconContent(LY);
  if (ai.tab === 'audit') {
    if (ai.auditLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.audit)        return renderAuditContent(ai.audit);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runLoyaltyAudit()">${cfgT('run_audit')}</button>
    </div>`;
  }
  if (ai.tab === 'optimize') {
    if (ai.optimizeLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.optimize)        return renderOptimizeContent(ai.optimize);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runLoyaltyOptimize()">${cfgT('run_optimize')}</button>
    </div>`;
  }
  if (ai.tab === 'missions') {
    if (ai.missionsLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.missions)        return renderMissionsContent(ai.missions);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runLoyaltyMissions()">${cfgT('run_missions')}</button>
    </div>`;
  }
  return '';
}

async function runLoyaltyAudit() {
  const LY = CS.loyalty;
  if (!LY.result) return;
  CAI.loyalty.auditLoading = true;
  document.getElementById('loyalty-ai-content').innerHTML = loadingHtml(cfgT('ai_loading'));
  try {
    const res = await fetch('/api/loyalty/audit', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ config: LY.result.config, uiLang: cfgLang() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    CAI.loyalty.audit = await res.json();
  } catch(e) { CAI.loyalty.audit = { error: e.message }; }
  finally {
    CAI.loyalty.auditLoading = false;
    document.getElementById('loyalty-ai-content').innerHTML = renderLoyaltyAiContent(LY);
  }
}

async function runLoyaltyOptimize() {
  const LY = CS.loyalty;
  if (!LY.result) return;
  CAI.loyalty.optimizeLoading = true;
  document.getElementById('loyalty-ai-content').innerHTML = loadingHtml(cfgT('ai_loading'));
  try {
    const res = await fetch('/api/loyalty/optimize', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ config: LY.result.config, econ: LY.result.econ, uiLang: cfgLang() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    CAI.loyalty.optimize = await res.json();
  } catch(e) { CAI.loyalty.optimize = { error: e.message }; }
  finally {
    CAI.loyalty.optimizeLoading = false;
    document.getElementById('loyalty-ai-content').innerHTML = renderLoyaltyAiContent(LY);
  }
}

async function runLoyaltyMissions() {
  const LY = CS.loyalty;
  if (!LY.result) return;
  CAI.loyalty.missionsLoading = true;
  document.getElementById('loyalty-ai-content').innerHTML = loadingHtml(cfgT('ai_loading'));
  try {
    const d = LY.result;
    const res = await fetch('/api/loyalty/missions', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ config: d.config, econ: d.econ, uiLang: cfgLang() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    CAI.loyalty.missions = await res.json();
  } catch(e) { CAI.loyalty.missions = { error: e.message }; }
  finally {
    CAI.loyalty.missionsLoading = false;
    document.getElementById('loyalty-ai-content').innerHTML = renderLoyaltyAiContent(LY);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// SHARED AI CONTENT RENDERERS
// ══════════════════════════════════════════════════════════════════════════

function renderAuditContent(data) {
  if (data.error) return `<div class="alert alert-warn">${data.error} <button class="btn btn-sm btn-ghost" onclick="CAI.${CS.type}.audit=null;cfgRender()">${cfgT('rerun')}</button></div>`;
  const checks = data.checks || [];
  const recs   = data.recommendations || [];
  return `
    <div>
      ${checks.map(c => `
        <div class="audit-check">
          <div class="audit-status ${c.status==='ok'?'ok':'warn'}">${c.status==='ok'?'✓':'!'}</div>
          <div>
            <div class="audit-label">${c.label}</div>
            <div class="audit-note">${c.note}</div>
            ${c.rule ? `<div class="audit-rule">${c.rule}</div>` : ''}
          </div>
        </div>
      `).join('')}
      ${recs.length ? `
        <div style="margin-top:14px;font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${cfgT('recommendations')}</div>
        ${recs.map(r => `
          <div class="rec-card">
            <div class="rec-text">${r.text}</div>
            <div class="rec-meta"><span class="rec-tag">${r.impact||''}</span></div>
          </div>
        `).join('')}
      ` : ''}
    </div>
  `;
}

function renderOptimizeContent(data) {
  if (data.error) return `<div class="alert alert-warn">${data.error} <button class="btn btn-sm btn-ghost" onclick="CAI.${CS.type}.optimize=null;cfgRender()">${cfgT('rerun')}</button></div>`;
  const recs = data.recommendations || [];
  return `
    <div>
      ${recs.map(r => `
        <div class="opt-rec">
          <div class="opt-rec-header">
            <span class="opt-rec-factor">${r.factor || r.param || ''}</span>
            <span class="opt-rec-arrow">
              <span class="opt-rec-from">${r.current}</span>
              <span class="opt-arrow-sym">→</span>
              <span class="opt-rec-to">${r.target}</span>
            </span>
          </div>
          <div class="opt-rec-reason">${r.reason}</div>
          ${r.impact ? `<div class="opt-rec-impact">↑ ${r.impact}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderTournOptimizeContent(data) {
  if (data.error) return `<div class="alert alert-warn">${data.error}</div>`;
  let html = '';
  if (data.realism) {
    const v = data.realism.verdict || 'ok';
    const badgeClass = v==='realistic'?'badge-pos':v==='optimistic'?'badge-neu':'badge-neg';
    html += `
      <div class="alert alert-info" style="margin-bottom:12px">
        <strong>${data.realism.summary}</strong>
        <span class="badge ${badgeClass}" style="margin-left:8px">${v}</span>
      </div>
    `;
  }
  const recs = data.recommendations || [];
  html += recs.map(r => `
    <div class="opt-rec">
      <div class="opt-rec-header">
        <span class="opt-rec-factor">${r.param || ''}</span>
        <span class="opt-rec-arrow">
          <span class="opt-rec-from">${r.current}</span>
          <span class="opt-arrow-sym">→</span>
          <span class="opt-rec-to">${r.target}</span>
        </span>
      </div>
      <div class="opt-rec-reason">${r.reason}</div>
      ${r.impact ? `<div class="opt-rec-impact">↑ ${r.impact}</div>` : ''}
    </div>
  `).join('');
  return html || '<div class="ph" style="min-height:80px"><span>No recommendations</span></div>';
}

function renderMissionsContent(data) {
  if (data.error) return `<div class="alert alert-warn">${data.error} <button class="btn btn-sm btn-ghost" onclick="runLoyaltyMissions()">${cfgT('rerun')}</button></div>`;
  const aiMissions = data.missions || [];
  // Build lookup map from static missions (id → mission)
  const staticMissions = (CS.loyalty.result?.config?.missions) || [];
  const byId = Object.fromEntries(staticMissions.map(m => [m.id, m]));
  return aiMissions.map(m => {
    const base = byId[m.id] || {};
    const name = base.name || m.id;
    return `
      <div class="mission-row">
        <div class="mission-name">${name}</div>
        <div class="mission-meta">
          ${base.objective ? `<span class="mission-tag">${base.objective}</span>` : ''}
          ${base.frequency ? `<span>${base.frequency}</span>` : ''}
          ${base.rewardType ? `<span>${base.rewardType}: ${base.rewardValue}</span>` : ''}
        </div>
        ${m.narrative ? `<div class="mission-narrative">${m.narrative}</div>` : ''}
        ${m.tierEffect ? `<div class="mission-narrative" style="color:var(--text2)">${m.tierEffect}</div>` : ''}
      </div>
    `;
  }).join('') || '<div class="ph" style="min-height:80px"><span>No missions</span></div>';
}

function loadingHtml(msg) {
  return `<div class="loader"><div class="spinner"></div><span>${msg}</span></div>`;
}

// ══════════════════════════════════════════════════════════════════════════
// SAVE / CALENDAR
// ══════════════════════════════════════════════════════════════════════════

function cfgSaveBonusConfig() {
  const B = CS.bonus;
  if (!B.config) return;
  const geo = cfgGeo(B.geo);
  const id  = genId();
  const entry = {
    id, type:'bonus', name:`Bonus · ${geo.lbl} · ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    params: { ...B, config: undefined, costs: undefined },
    config: B.config, costs: B.costs,
  };
  saveCfgEntry(entry);
  showToast(cfgT('saved_toast'));
}

function cfgSaveTournament() {
  const T = CS.tournament;
  if (!T.result) return;
  const geo = cfgGeo(T.geo);
  const id  = genId();
  const entry = {
    id, type:'tournament', name:`Tournament · ${geo.lbl} · ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    params: { ...T, result: undefined }, result: T.result,
  };
  saveCfgEntry(entry);
  showToast(cfgT('saved_toast'));
  // Also save to savedTournaments for badge count
  try {
    const arr = JSON.parse(localStorage.getItem('savedTournaments') || '[]');
    arr.push({ id, name: entry.name, createdAt: entry.createdAt, ...T.result });
    localStorage.setItem('savedTournaments', JSON.stringify(arr));
    if (typeof updateAllBadges === 'function') updateAllBadges();
  } catch(e){}
}

function cfgSaveLoyalty() {
  const LY = CS.loyalty;
  if (!LY.result) return;
  const id = genId();
  const entry = {
    id, type:'loyalty', name:`Loyalty · ${LY.mode} · ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    params: { ...LY, result: undefined }, result: LY.result,
  };
  saveCfgEntry(entry);
  showToast(cfgT('saved_toast'));
}

function saveCfgEntry(entry) {
  try {
    const arr = JSON.parse(localStorage.getItem('cfgSaved') || '[]');
    arr.unshift(entry);
    localStorage.setItem('cfgSaved', JSON.stringify(arr.slice(0,50)));
  } catch(e){}
}

function cfgBonusToCalendar() {
  const B = CS.bonus;
  if (!B.config) return;
  const geo = cfgGeo(B.geo);
  addToRCCalendar({
    type:'bonus', title:`Bonus · ${geo.lbl}`,
    sourceType:'bonus_configurator',
    econ: B.config.econ || {},
    params: { geo: B.geo, players: B.players, segment: B.segment },
    cur: geo.cur,
  });
}

function cfgTournToCalendar() {
  const T = CS.tournament;
  if (!T.result) return;
  const geo = cfgGeo(T.geo);
  addToRCCalendar({
    type:'tournament', title:`Tournament · ${geo.lbl}`,
    sourceType:'tournament_configurator',
    econ: T.result.econ || {},
    params: T.result.params || {},
    cur: geo.cur,
  });
}

function cfgLoyaltyToCalendar() {
  const LY = CS.loyalty;
  if (!LY.result) return;
  addToRCCalendar({
    type:'vip', title:`Loyalty · ${LY.mode}`,
    sourceType:'loyalty_configurator',
    econ: LY.result.econ || {},
    params: { mode: LY.mode, region: LY.region },
    cur: 'USD',
  });
}

function addToRCCalendar(data) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const camps = JSON.parse(localStorage.getItem('rc_campaigns') || '[]');
    const entry = {
      id: genId(),
      title: data.title,
      type: data.type,
      sourceType: data.sourceType,
      start: today,
      end: today,
      econ: data.econ,
      params: data.params,
      cur: data.cur,
      createdAt: new Date().toISOString(),
    };
    camps.push(entry);
    localStorage.setItem('rc_campaigns', JSON.stringify(camps));
    showToast(cfgT('calendar_toast'));
  } catch(e){}
}

// ══════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════

(function init() {
  const lang = cfgLang();
  applyNavLang(lang);
  if (typeof initNavSubgroups === 'function') initNavSubgroups();
  if (typeof updateAllBadges === 'function') updateAllBadges();
  cfgRender();
  const main = document.getElementById('main');
  if (main) main.classList.add('ready');
})();
