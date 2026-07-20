// ══════════════════════════════════════════════════════════════════════════
// CONFIGURATOR.JS — Unified Promo Configurator (Bonus / Tournament / Loyalty)
// ══════════════════════════════════════════════════════════════════════════

// ── CONSTANTS ──────────────────────────────────────────────────────────────

// Geo list — single source is public/geo-data.js (loaded before this file).
// `cur` here is the BACKEND currency (sent as sitecur); LatAm is USD, with the
// local display currency in `local`/`localRate`. See geo-data.js for the model.
const CFG_GEO = (window.GEO_DATA || []);

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
    curMode: 'local',   // 'local' (region currency, default) | 'usd'
    players: 5000,
    segment: 'mid',
    plat: 'both',
    rtp: 96,
    // which mechanics are active
    active: { welcome:true, ndb:false, dep2:true, dep3:true, reload:false, cashback:false, fs:false },
    // per-mechanic override values (filled after first Calculate)
    ov: {
      w_pct:100, w_wager:30, w_maxB:200, w_minD:10, w_maxWin:0,
      w_hitrate:1.0, w_days:30, w_bet_factor:1.0,
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
    type: 'slot', geo: 'de', curMode: 'local',
    segment: 'all', totalPlayers: 5000,
    duration: 'weekly', prizePool: 5000,
    poolModel: 'fixed', distribution: 'top_n',
    entryModel: 'freeroll', scoring: 'total_wins',
    reentry: 'single', rake: 5,
    result: null,
  },

  loyalty: {
    mode: 'hybrid', geo: 'de', region: 'eu', curMode: 'local', segment: 'mid',
    players: 5000, avgdep: 100, arpu: 50,
    numTiers: 5, topCashbackRate: 10,
    earnRateDeposit: 10, earnRateWager: 1,
    redeemRate: 100, redeemMinPoints: 1000,
    pointsExpiry: 0, missionCount: 3,
    result: null,
  },

  wheel: {
    preset: 'welcome', geo: 'de', curMode: 'local',
    segment: 'depositors', players: 5000, avgDeposit: 100,
    frequency: 'on_deposit', rtp: 96, wager: 30,
    segments: null,     // materialized lazily from preset; holds user tweaks
    _segKey: null,      // tracks preset+avgDeposit to know when to re-materialize
    result: null,
  },
};

// AI state per type
const CAI = {
  bonus:      { tab:'econ', audit:null, optimize:null, games:null, auditLoading:false, optimizeLoading:false, gamesLoading:false },
  tournament: { tab:'econ', audit:null, optimize:null, games:null, auditLoading:false, optimizeLoading:false, gamesLoading:false },
  loyalty:    { tab:'econ', audit:null, optimize:null, missions:null, games:null, auditLoading:false, optimizeLoading:false, missionsLoading:false, gamesLoading:false },
  wheel:      { tab:'econ', audit:null, optimize:null, games:null, auditLoading:false, optimizeLoading:false, gamesLoading:false },
};

// Connected game providers — shared across promo types (operator-level setting,
// not per-campaign). Empty array = no filter (recommend from all providers).
const ALL_PROVIDERS = [
  'Pragmatic Play', "Play'n GO", 'NetEnt', 'Playtech', 'Evolution', 'Hacksaw Gaming',
  'Nolimit City', 'PG Soft', 'Big Time Gaming', 'Playson', 'Thunderkick', 'ReelPlay',
  'Reel Kingdom', 'IGT', 'Scientific Games', 'Spribe', 'SmartSoft Gaming', 'Stake Originals',
  'BGaming',
];
let cfgConnectedProviders = [];
try { cfgConnectedProviders = JSON.parse(localStorage.getItem('cfg_providers') || '[]'); } catch(e) { cfgConnectedProviders = []; }

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
    type_bonus:'🎁 Bonus', type_tourn:'🏆 Tournament', type_loyal:'⭐ Loyalty', type_wheel:'🎡 Wheel',
    // wheel
    wheel_setup:'Wheel Setup', wheel_visual:'Wheel & Segments', wheel_preset:'Preset',
    preset_welcome:'Welcome', preset_daily:'Daily', preset_vip:'VIP',
    wheel_geo:'Market / GEO', wheel_segment:'Audience', wheel_freq:'Spin Cadence',
    wheel_players:'Total Players', wheel_avgdep:'Avg Deposit', wheel_wager:'Bonus Wager',
    freq_on_deposit:'On Deposit', freq_daily:'Daily', freq_weekly:'Weekly', freq_one_time:'One-time',
    prize_free_spins:'Free Spins', prize_bonus_money:'Bonus Money', prize_cashback:'Cashback',
    prize_multiplier:'Multiplier', prize_jackpot:'Jackpot', prize_physical:'Prize', prize_nothing:'No Win',
    wheel_seg_prize:'Prize', wheel_seg_value:'Value', wheel_seg_weight:'Weight', wheel_seg_prob:'Chance',
    wheel_ev:'EV / Spin', wheel_prog_cost:'Program Cost', wheel_ggr_uplift:'GGR Uplift',
    wheel_ret_value:'Retention Value', wheel_net:'Net Result', wheel_roi:'ROI',
    wheel_per_spin:'per spin', wheel_total_value:'value / cost',
    wheel_scenarios:'Participation Scenarios', wheel_cost_ratio:'Cost / GGR',
    wheel_cost_active:'Cost / Player', wheel_max_risk:'Max Risk', wheel_breakeven:'Break-even',
    wheel_top_prize:'incl. 1 top prize', wheel_ai_hint:'Calculate to unlock AI audit & optimization.',
    // bonus
    base_params:'Base Parameters', mechanics:'Bonus Mechanics',
    geo_lbl:'Market / GEO', currency_lbl:'Display Currency', players_lbl:'Monthly New Players',
    segment_lbl:'Player Segment', platform_lbl:'Platform', rtp_lbl:'Avg Slot RTP',
    seg_new:'🆕 New', seg_mid:'👤 Mid', seg_vip:'👑 VIP',
    plat_both:'Desktop + Mobile', plat_mobile:'Mobile Only', plat_desk:'Desktop Only',
    mech_welcome:'Welcome (1st Deposit)', mech_ndb:'No Deposit Bonus',
    mech_chain:'Deposit Chain', mech_dep2:'2nd Deposit Bonus', mech_dep3:'3rd Deposit Bonus',
    mech_reload:'Reload Bonus', mech_cashback:'Cashback', mech_fs:'Free Spins',
    chain_hint:'Dep2 cohort: 45% of Welcome · Dep3: 25%',
    match_lbl:'Match', wager_lbl:'Wager', max_bonus_lbl:'Max Bonus',
    min_dep_lbl:'Min Deposit', max_win_lbl:'Max Win', zero_means_no_cap:'0 = no cap',
    amount_lbl:'Amount', max_cash_lbl:'Max Cash',
    // A1 benchmark bands
    bench_rec:'Rec.', bench_cap:'Cap',
    bench_state_on:'on target', bench_state_below:'below range', bench_state_above:'above range', bench_state_over_cap:'exceeds cap',
    bench_why_w_wager:'Welcome wager balances player appeal against abuse protection. Welcome is an acquisition tool (low margin), so a high wager hurts conversion. Market practice: {rec}×. Above {max}× players see the bonus as poor value.',
    bench_why_rl_wager:'Reload targets loyal players — softer terms than welcome, usually ~5× lower. Margin lives here, but don\'t over-raise the wager: the goal is retention, not one-off profit.',
    bench_why_ndb_wager:'NDB is a no-deposit bonus (free money), so the wager is higher and a max-win cap is typical. But players widely ignore NDB above 35× — the market trend is downward. Rec.: {rec}×.',
    bench_why_w_pct:'Match %: 100% is the universal standard (the casino doubles the deposit). Above 100% is deliberate marketing spend, not a default: it needs a higher wager and raises cost. Practice range: 100–200%.',
    bench_why_rl_pct:'Reload match is usually lower than welcome (25–75%), with an amount cap. Common practice — 50%.',
    // A2 roles + guardrail
    role_acq:'Acquisition · low-margin', role_ret:'Retention · margin',
    role_acq_tip:'Welcome and NDB are the lowest-margin part of bonus economics but critical for marketing and new-player conversion. Don\'t chase margin here — profit comes from reload, cashback, and the deposit chain.',
    role_ret_tip:'Reload, cashback, and 2nd/3rd deposits drive retention of already-acquired players. The main margin sits here — but soft terms matter more than one-off profit.',
    guardrail_wager:'⚠ Welcome wager {value}× is above market practice ({rec}×). A high wager on the first bonus reduces new-player conversion — welcome should attract, not earn. Consider {min}–{max}×.',
    // A4 regulatory notes
    reg_warn_br_welcome:'🚫 Regulatory ban: in regulated Brazil ("Bets" regime, Law 14.790/2023, Art. 29) welcome bonuses are prohibited in any form, including free spins. The mechanic is kept for offshore/grey scenarios — for licensed BR, remove it manually.',
    reg_warn_br_soft:'⚠ Check local restrictions: Brazil\'s rules on bonuses for existing players are ambiguous — verify before launch.',
    reg_note_ukgc:'⚖ UKGC cap: wager on all bonuses ≤ 10× (effective 19 Jan 2026).',
    reg_note_dga:'⚖ Denmark (DGA) cap: wager ≤ 10× and bonus amount ≤ DKK 1000 for any bonus.',
    reg_note_coljuegos:'ℹ Colombia (Coljuegos, Res. 20250022644): total bonuses capped at 1.6% of GGR/month — plan budget, not wager.',
    pct_lbl:'Rate', count_lbl:'Spins', value_lbl:'Spin value', cb_wager_lbl:'Wager ×',
    calculate:'⚡ Calculate', recalculate:'↻ Recalculate',
    // econ
    econ_cost_p50:'P50 Cost', econ_cost_ratio:'Cost / Deposits', econ_max_risk:'Max Risk (P90)',
    econ_arpu:'ARPU', econ_ltv3:'3-mo LTV', econ_roi:'Campaign ROI', roi_platform_sub:'incr. revenue / bonus budget',
    geo_bench_lbl:'Geo Benchmark', geo_bench_sub:'LTV3 / CAC · platform baseline',
    of_deposits:'of deposits', per_player:'per player', arpu_sub:'/mo · USD benchmark', ltv3_sub:'per player · 3 mo · USD', per_mo:'/mo',
    hitrate_lbl:'Hit Rate', days_lbl:'Days to Wager', bet_factor_lbl:'Bet Limit',
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
    tab_optimize:'⚡ Optimize', tab_missions:'🎯 Missions', tab_games:'🎮 Games',
    run_audit:'🔍 Run Compliance Audit', run_optimize:'⚡ Get Optimization Recs',
    run_missions:'✨ Generate Mission Descriptions',
    run_games:'🎮 Get Game Recommendations',
    rerun:'↺ Re-run', ai_loading:'Analyzing…',
    recommendations:'Recommendations',
    games_providers_label:'Connected providers (leave empty = all)',
    games_popular:'🔥 Popular', games_live:'🃏 Live Casino', games_fast:'🚀 Crash / Fast',
    games_volatility:'💥 High Volatility', games_mobile:'📱 Mobile-friendly',
    games_empty:'No games match this filter — try fewer providers.',
    // Competitor analysis
    tab_competitors:'⚔️ Competitors',
    comp_own_label:'Your offer', comp_competitors_label:'Competitors (up to 3)',
    comp_name_ph:'Casino name', comp_find_ai:'🔍 Find via AI', comp_add_manual:'✍️ Add manually',
    comp_run:'⚡ Run AI analysis', comp_run_hint:'Compares your offer against the competitors',
    comp_analyzing:'Analysing competitiveness…', comp_searching:'Searching the web…',
    comp_ai:'AI', comp_ai_unconf:'AI · unconfirmed', comp_manual:'manual', comp_source:'source ↗',
    comp_max:'Up to 3 competitors', comp_none:'No competitors added yet.',
    comp_add_hint:'Add at least one competitor to run the analysis.',
    comp_name_req:'Enter a casino name first', comp_notfound:'No reliable public source found — marked unconfirmed',
    comp_own_bonus:'Welcome bonus', comp_own_tournament:'Tournament', comp_own_loyalty:'Loyalty program', comp_own_wheel:'Wheel of Fortune',
    comp_transparency:'⚙️ generated · 🔍 AI-found (with source) · ✍️ manual. The AI never invents numbers — values it cannot confirm are marked "н/д" and excluded from the verdict.',
    // actions
    save_btn:'💾 Save', calendar_btn:'📅 Add to Calendar',
    saved_toast:'Configuration saved ✓', calendar_toast:'Added to Retention Calendar ✓',
    // regions
    reg_eu:'Europe (EU/UK)', reg_cis:'CIS', reg_mn:'Mongolia',
    reg_latam:'LatAm', reg_sweep:'USA Sweep', reg_crypto:'Crypto / Global',
  },
  ru: {
    title: 'Конфигуратор',
    type_bonus:'🎁 Бонусы', type_tourn:'🏆 Турниры', type_loyal:'⭐ Лояльность', type_wheel:'🎡 Колесо',
    // wheel
    wheel_setup:'Настройка колеса', wheel_visual:'Колесо и сегменты', wheel_preset:'Пресет',
    preset_welcome:'Welcome', preset_daily:'Ежедневное', preset_vip:'VIP',
    wheel_geo:'Рынок / GEO', wheel_segment:'Аудитория', wheel_freq:'Частота спинов',
    wheel_players:'Всего игроков', wheel_avgdep:'Средний депозит', wheel_wager:'Вейджер бонуса',
    freq_on_deposit:'За депозит', freq_daily:'Ежедневно', freq_weekly:'Еженедельно', freq_one_time:'Разово',
    prize_free_spins:'Фриспины', prize_bonus_money:'Бонус деньги', prize_cashback:'Кэшбек',
    prize_multiplier:'Множитель', prize_jackpot:'Джекпот', prize_physical:'Приз', prize_nothing:'Пусто',
    wheel_seg_prize:'Приз', wheel_seg_value:'Значение', wheel_seg_weight:'Вес', wheel_seg_prob:'Шанс',
    wheel_ev:'EV / спин', wheel_prog_cost:'Стоимость программы', wheel_ggr_uplift:'Прирост GGR',
    wheel_ret_value:'Ретеншн-ценность', wheel_net:'Чистый результат', wheel_roi:'ROI',
    wheel_per_spin:'за спин', wheel_total_value:'ценность / стоимость',
    wheel_scenarios:'Сценарии участия', wheel_cost_ratio:'Стоим. / GGR',
    wheel_cost_active:'Стоим. / игрока', wheel_max_risk:'Макс. риск', wheel_breakeven:'Окупаемость',
    wheel_top_prize:'вкл. 1 топ-приз', wheel_ai_hint:'Рассчитайте, чтобы открыть AI-аудит и оптимизацию.',
    base_params:'Базовые параметры', mechanics:'Механики бонусов',
    geo_lbl:'Рынок / GEO', currency_lbl:'Валюта отображения', players_lbl:'Новых игроков / месяц',
    segment_lbl:'Сегмент игроков', platform_lbl:'Платформа', rtp_lbl:'Средний RTP слотов',
    seg_new:'🆕 Новые', seg_mid:'👤 Средние', seg_vip:'👑 VIP',
    plat_both:'Desktop + Mobile', plat_mobile:'Только Mobile', plat_desk:'Только Desktop',
    mech_welcome:'Welcome (1-й депозит)', mech_ndb:'No Deposit Bonus',
    mech_chain:'Цепочка депозитов', mech_dep2:'2-й депозит', mech_dep3:'3-й депозит',
    mech_reload:'Reload Bonus', mech_cashback:'Кешбэк', mech_fs:'Free Spins',
    chain_hint:'Dep2 когорта: 45% от Welcome · Dep3: 25%',
    match_lbl:'Матч', wager_lbl:'Вейджер', max_bonus_lbl:'Макс. бонус',
    min_dep_lbl:'Мин. депозит', max_win_lbl:'Макс. выигрыш', zero_means_no_cap:'0 = без лимита',
    // A1 benchmark bands
    bench_rec:'Рекоменд.', bench_cap:'Лимит',
    bench_state_on:'в норме', bench_state_below:'ниже нормы', bench_state_above:'выше нормы', bench_state_over_cap:'превышает лимит',
    bench_why_w_wager:'Вейджер велкама — баланс между привлекательностью для игрока и защитой от абуза. Велкам работает на привлечение (низкая маржа), поэтому высокий вейджер бьёт по конверсии. Рыночная практика: {rec}×. Выше {max}× игроки воспринимают бонус как невыгодный.',
    bench_why_rl_wager:'Релоуд нацелен на лояльную аудиторию — условия мягче велкама, обычно на ~5× ниже. Здесь живёт маржа, но не задирайте вейджер: цель — удержание, а не разовый заработок.',
    bench_why_ndb_wager:'NDB — бездепозитный бонус (free money), поэтому вейджер выше и обычно есть кэп на макс-выигрыш. Но игроки массово игнорируют NDB с вейджером выше 35× — тренд рынка вниз. Рекоменд.: {rec}×.',
    bench_why_w_pct:'Процент матча: 100% — универсальный стандарт (казино удваивает депозит). Выше 100% — осознанные маркетинговые траты, а не дефолт: требует более высокого вейджера и повышает стоимость. Диапазон практики: 100–200%.',
    bench_why_rl_pct:'Матч релоуда обычно ниже велкама (25–75%), с кэпом суммы. Частая практика — 50%.',
    // A2 roles + guardrail
    role_acq:'Привлечение · low-margin', role_ret:'Удержание · маржа',
    role_acq_tip:'Велкам и NDB — самая низкомаржинальная часть экономики бонусов, но критичны для маркетинга и конверсии новых игроков. Не гонитесь за маржой здесь — прибыль приходит из релоуда, кэшбэка и депозитной цепочки.',
    role_ret_tip:'Релоуд, кэшбэк и 2-й/3-й депозиты работают на удержание уже привлечённых игроков. Здесь основная маржа — но мягкие условия важнее разового заработка.',
    guardrail_wager:'⚠ Вейджер велкама {value}× выше рыночной практики ({rec}×). Высокий вейджер на первом бонусе снижает конверсию новых игроков — велкам должен привлекать, а не зарабатывать. Рассмотрите {min}–{max}×.',
    // A4 regulatory notes
    reg_warn_br_welcome:'🚫 Регуляторный запрет: в регулируемой Бразилии (режим «Bets», Law 14.790/2023, ст. 29) велкам-бонусы запрещены в любой форме, включая фриспины. Механика оставлена для оффшорных/грей-сценариев — для лицензированного BR удалите её вручную.',
    reg_warn_br_soft:'⚠ Проверьте локальные ограничения: правила Бразилии по бонусам действующим игрокам неоднозначны — уточните перед запуском.',
    reg_note_ukgc:'⚖ Лимит UKGC: вейджер на все бонусы ≤ 10× (действует с 19.01.2026).',
    reg_note_dga:'⚖ Лимит Дании (DGA): вейджер ≤ 10× и сумма бонуса ≤ DKK 1000 на любой бонус.',
    reg_note_coljuegos:'ℹ Колумбия (Coljuegos, Res. 20250022644): суммарные бонусы ограничены 1.6% GGR/мес — планируйте бюджет, а не вейджер.',
    amount_lbl:'Сумма', max_cash_lbl:'Макс. выплата',
    pct_lbl:'Процент', count_lbl:'Спинов', value_lbl:'Цена спина', cb_wager_lbl:'Вейджер ×',
    calculate:'⚡ Рассчитать', recalculate:'↻ Пересчитать',
    econ_cost_p50:'P50 Стоимость', econ_cost_ratio:'Стоимость / Депозиты', econ_max_risk:'Макс. риск (P90)',
    econ_arpu:'ARPU', econ_ltv3:'LTV 3 мес', econ_roi:'ROI кампании', roi_platform_sub:'инкрем. выручка / бонусный бюджет',
    geo_bench_lbl:'Гео-бенчмарк', geo_bench_sub:'LTV3 / CAC · база платформы',
    of_deposits:'от депозитов', per_player:'на игрока', arpu_sub:'/мес · USD бенчмарк', ltv3_sub:'на игрока · 3 мес · USD', per_mo:'/мес',
    hitrate_lbl:'Hit Rate', days_lbl:'Дней на вейджер', bet_factor_lbl:'Лимит ставки',
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
    tab_optimize:'⚡ Оптимизация', tab_missions:'🎯 Миссии', tab_games:'🎮 Игры',
    run_audit:'🔍 Запустить аудит', run_optimize:'⚡ Рекомендации',
    run_missions:'✨ Описать миссии',
    run_games:'🎮 Подобрать игры',
    rerun:'↺ Повторить', ai_loading:'Анализирую…',
    recommendations:'Рекомендации',
    games_providers_label:'Подключённые провайдеры (пусто = все)',
    games_popular:'🔥 Популярные', games_live:'🃏 Лайв-казино', games_fast:'🚀 Crash / Быстрые',
    games_volatility:'💥 Высокая волатильность', games_mobile:'📱 Мобильные',
    games_empty:'Нет игр под этот фильтр — попробуйте выбрать меньше провайдеров.',
    // Анализ конкурентов
    tab_competitors:'⚔️ Конкуренты',
    comp_own_label:'Ваше предложение', comp_competitors_label:'Конкуренты (до 3)',
    comp_name_ph:'Название казино', comp_find_ai:'🔍 Найти через AI', comp_add_manual:'✍️ Ввести вручную',
    comp_run:'⚡ Запустить AI-анализ', comp_run_hint:'Сравнит ваше предложение с конкурентами',
    comp_analyzing:'Анализ конкурентности…', comp_searching:'Идёт поиск в интернете…',
    comp_ai:'AI', comp_ai_unconf:'AI · не подтв.', comp_manual:'вручную', comp_source:'источник ↗',
    comp_max:'Максимум 3 конкурента', comp_none:'Конкуренты пока не добавлены.',
    comp_add_hint:'Добавьте хотя бы одного конкурента для анализа.',
    comp_name_req:'Сначала введите название казино', comp_notfound:'Достоверный публичный источник не найден — помечено как не подтверждено',
    comp_own_bonus:'Welcome-бонус', comp_own_tournament:'Турнир', comp_own_loyalty:'Программа лояльности', comp_own_wheel:'Колесо фортуны',
    comp_transparency:'⚙️ сгенерировано · 🔍 найдено AI (с источником) · ✍️ вручную. AI не выдумывает цифры — значения без источника помечаются «н/д» и не идут в вердикт.',
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
  if (cur === 'BRL') return 'R$' + n.toLocaleString('en');
  if (cur === 'MXN') return 'MX$' + n.toLocaleString('en');
  if (cur === 'PEN') return 'S/' + n.toLocaleString('en');
  if (cur === 'COP') return n.toLocaleString('en') + ' COP';
  if (cur === 'ARS') return 'AR$' + n.toLocaleString('en');
  if (cur === 'CLP') return n.toLocaleString('en') + ' CLP';
  return n.toLocaleString('en') + ' ' + (cur || '');
}

function fmtPct(v) {
  if (v == null || isNaN(v)) return '—';
  return (v * 100).toFixed(1) + '%';
}

function cfgGeo(val) { return CFG_GEO.find(g => g.val === val) || CFG_GEO[0]; }

// ── Currency toggle (display layer) ─────────────────────────────────────────
// Backend always computes in geo.cur (LatAm = USD). The toggle only changes the
// display currency: region-local (default) or USD. All conversion is done via
// window.GeoData helpers on the API responses; the backend is never re-scaled.
function curModeOf(type) { return (CS[type] && CS[type].curMode) || 'local'; }
// Synthetic geo for Loyalty's crypto/global option (no country, USD, no toggle).
const CRYPTO_GEO = { val:'crypto', cur:'USD', local:'USD', rate:1, localRate:1, region:'crypto', lbl:'🌐 Crypto / Global' };
function geoOfType(type) {
  const g = type === 'loyalty' ? (CS.loyalty.geo || 'de') : CS[type].geo;
  if (g === 'crypto') return CRYPTO_GEO;
  return cfgGeo(g);
}

// Money-valued keys of the flat tournament/loyalty econ objects — the single
// source of what gets currency-converted (via GeoData.scaleFields). Everything
// not listed (participants, ratios, %, break-even counts) stays as-is.
const TOURN_ECON_MONEY = [
  'ggrLiftLow','ggrLiftMid','ggrLiftHigh','netMarginLow','netMarginMid','netMarginHigh',
  'costPerActiveLow','costPerActiveMid','costPerActiveHigh','prizePoolCost','retentionValue','totalValueMid',
];
const LOYALTY_ECON_MONEY = [
  'monthlyCostUSD','tierRewardCostUSD','missionCostUSD','additionalRevenue3m','totalLiabilityUSD',
];

// Small note shown above AI Audit/Optimize output: the AI reasons over the raw
// backend config, so its amounts are in the backend currency, not the display one.
function aiCurNote(type) {
  const backendCur = type === 'loyalty' ? 'USD' : geoOfType(type).cur;
  if (dispCurCode(type) === backendCur) return '';
  const isRu = cfgLang() === 'ru';
  return `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">💱 ${isRu ? 'Суммы в AI-рекомендациях указаны в' : 'AI recommendation amounts are in'} ${backendCur}</div>`;
}
// Backend base currency per tool: Bonus/Tournament compute in geo.cur (EU→EUR,
// LatAm→USD); Loyalty is currency-agnostic and always computes in USD.
function dispBaseRate(type) { return type === 'loyalty' ? 1 : geoOfType(type).rate; }
function dispFactor(type) { return window.GeoData.dispRate(geoOfType(type), curModeOf(type)) / dispBaseRate(type); }
function dispCurCode(type) { return window.GeoData.dispCur(geoOfType(type), curModeOf(type)); }

// Whether a currency choice exists for this geo (hide the toggle when it doesn't).
function hasCurChoice(geo) { return geo && geo.local !== 'USD'; }

function renderCurToggle(type) {
  const geo = geoOfType(type);
  if (!hasCurChoice(geo)) return '';
  const mode = curModeOf(type);
  return `
    <div class="form-row">
      <label class="form-label">${cfgT('currency_lbl')}</label>
      <div class="chips">
        <div class="chip${mode==='local'?' on':''}" onclick="setCurMode('${type}','local')">${geo.local}</div>
        <div class="chip${mode==='usd'?' on':''}" onclick="setCurMode('${type}','usd')">USD</div>
      </div>
    </div>`;
}

function setCurMode(type, mode) {
  if (!CS[type]) return;
  CS[type].curMode = mode;
  cfgRender();
}

// <optgroup>-grouped geo <option>s (grouped by region) for a <select>.
function cfgGeoOptions(selectedVal) {
  const groups = window.GeoData.groups(cfgLang());
  return groups.map(gr =>
    `<optgroup label="${gr.label}">` +
    gr.items.map(g => `<option value="${g.val}"${g.val===selectedVal?' selected':''}>${g.lbl}</option>`).join('') +
    `</optgroup>`
  ).join('');
}

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
    CS.type === 'tournament' ? cfgT('type_tourn') :
    CS.type === 'wheel' ? cfgT('type_wheel') : cfgT('type_loyal');
  const content = document.getElementById('content');
  content.innerHTML = renderTypeSwitch() + renderMainContent();
  bindEvents();
}

function renderTypeSwitch() {
  const types = ['bonus','tournament','loyalty','wheel'];
  const keys  = ['type_bonus','type_tourn','type_loyal','type_wheel'];
  return `<div class="type-switch">${types.map((tp,i) =>
    `<button class="type-btn${CS.type===tp?' active':''}" onclick="cfgSwitchType('${tp}')">${cfgT(keys[i])}</button>`
  ).join('')}</div>`;
}

function renderMainContent() {
  if (CS.type === 'bonus')      return renderBonusSection();
  if (CS.type === 'tournament') return renderTournamentSection();
  if (CS.type === 'loyalty')    return renderLoyaltySection();
  if (CS.type === 'wheel')      return renderWheelSection();
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
  const geoOpts = cfgGeoOptions(B.geo);
  return `
    <div class="card">
      <div class="card-title">${cfgT('base_params')}</div>
      <div class="form-row">
        <label class="form-label">${cfgT('geo_lbl')}</label>
        <select class="form-input" onchange="bonusSetGeo(this.value)">${geoOpts}</select>
      </div>
      ${renderCurToggle('bonus')}
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
      ${cfgLicenseBanner()}
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
    params = `${cfgRegBanner('welcome')}<div class="mech-params-grid">
      ${mpInpBench('w_pct',   cfgT('match_lbl'),        ov.w_pct,        '%', 1,200, 'w_pct')}
      ${mpInpBench('w_wager', cfgT('wager_lbl'),        ov.w_wager,      '×', 1,100, 'w_wager')}
      ${mpInp('w_maxB',       cfgT('max_bonus_lbl'),    ov.w_maxB,       '',  1,100000)}
      ${mpInp('w_minD',       cfgT('min_dep_lbl'),      ov.w_minD,       '',  0,100000)}
      ${mpInpHint('w_maxWin', cfgT('max_win_lbl'),      ov.w_maxWin,     '', 0, 100000, noCapHint)}
      ${mpInp('w_hitrate',    cfgT('hitrate_lbl'),      ov.w_hitrate,    '', 0.01,1.0, '0.05')}
      ${mpInp('w_days',       cfgT('days_lbl'),         ov.w_days,       'd', 1,365)}
      ${mpInp('w_bet_factor', cfgT('bet_factor_lbl'),   ov.w_bet_factor, '×', 0.1,1.0, '0.05')}
    </div><div id="guardrail-w_wager">${cfgGuardrailInner(ov.w_wager)}</div>`;
  } else if (key === 'ndb') {
    params = `${cfgRegBanner('ndb')}<div class="mech-params-grid">
      ${mpInp('ndb_amt',        cfgT('amount_lbl'),   ov.ndb_amt,    '',  1,10000)}
      ${mpInpBench('ndb_wager', cfgT('wager_lbl'),    ov.ndb_wager,  '×', 1,100, 'ndb_wager')}
      ${mpInpHint('ndb_maxWin', cfgT('max_win_lbl'), ov.ndb_maxWin, '', 0, 100000, noCapHint)}
    </div>`;
  } else if (key === 'reload') {
    params = `${cfgRegBanner('reload')}<div class="mech-params-grid">
      ${mpInpBench('rl_pct',   cfgT('match_lbl'),    ov.rl_pct,    '%', 1,200, 'rl_pct')}
      ${mpInpBench('rl_wager', cfgT('wager_lbl'),    ov.rl_wager,  '×', 1,100, 'rl_wager')}
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
        ${cfgRoleBadge(key)}
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
            ${cfgRoleBadge('dep2')}
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
            ${cfgRoleBadge('dep3')}
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

// Money-valued override ids — displayed/edited in the chosen display currency
// while stored internally in the backend currency (geo.cur).
const MONEY_OV = new Set([
  'w_maxB','w_minD','w_maxWin','ndb_amt','ndb_maxWin',
  'd2_maxB','d2_minD','d2_maxWin','d3_maxB','d3_minD','d3_maxWin',
  'rl_maxB','rl_minD','rl_maxWin','fs_value','fs_maxWin',
]);
// Convert a stored (backend-currency) override value to the display currency.
function ovToDisp(id, val) {
  if (!MONEY_OV.has(id)) return val;
  const f = dispFactor('bonus');
  return id === 'fs_value' ? +(val * f).toFixed(2) : Math.round(val * f);
}
// Append the display currency code to a money override's unit hint.
function ovUnit(id, unit) {
  if (!MONEY_OV.has(id)) return unit;
  return dispCurCode('bonus');
}

function mpInp(id, label, val, unit, min, max, step=null) {
  const s = step !== null ? step : (id === 'fs_value' ? '0.01' : '1');
  const u = ovUnit(id, unit);
  return `<div class="mp-row">
    <div class="mp-lbl">${label}${u ? ` <span class="mp-unit">${u}</span>` : ''}</div>
    <input class="mp-inp" id="mp-${id}" type="number" value="${ovToDisp(id, val)}" min="${min}" max="${max}" step="${s}"
           onchange="bonusOvChange('${id}',this.value)">
  </div>`;
}

// Like mpInp but with an extra hint line below the input
function mpInpHint(id, label, val, unit, min, max, hintHtml) {
  const u = ovUnit(id, unit);
  return `<div class="mp-row">
    <div class="mp-lbl">${label}${u ? ` <span class="mp-unit">${u}</span>` : ''}</div>
    <input class="mp-inp" id="mp-${id}" type="number" value="${ovToDisp(id, val)}" min="${min}" max="${max}" step="1"
           onchange="bonusOvChange('${id}',this.value)">
    <div style="margin-top:2px;line-height:1.2">${hintHtml}</div>
  </div>`;
}

// ── A1/A2/A4: benchmark bands, role badges, regulatory notes ────────────────

// Resolve the caller's region + license from the selected bonus geo.
function cfgBonusRL() {
  const g = cfgGeo(CS.bonus.geo);
  return { region: g.region || 'eu', license: g.lic || 'none' };
}

function _escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Fill {rec}/{min}/{max}/{value} placeholders in an i18n template.
function cfgBenchFill(tpl, bench, value) {
  return String(tpl)
    .replace(/\{rec\}/g,   bench ? bench.band.rec : '')
    .replace(/\{min\}/g,   bench ? bench.band.min : '')
    .replace(/\{max\}/g,   bench ? bench.band.max : '')
    .replace(/\{value\}/g, value != null ? value : '');
}

// Inner HTML of the benchmark line (range + coloured chip + why-tooltip) for a value.
// `id` is the ov field id — used to skip the chip for currency-denominated params, whose value
// is shown in local currency but whose band is USD (classifying either basis would mislead).
function cfgBenchInner(benchParam, value, id) {
  const RB = window.RetomatBenchmarks;
  if (!RB) return '';
  const { region, license } = cfgBonusRL();
  const bench = RB.getBenchmark(benchParam, region, license);
  if (!bench) return '';
  const v = parseFloat(value);
  const money = id && typeof MONEY_OV !== 'undefined' && MONEY_OV.has(id);
  const state = (money || isNaN(v)) ? null : RB.classifyValue(v, bench);
  const unitSym = bench.unit === 'x' ? '×' : bench.unit === '%' ? '%' : '';
  const isCap = !!bench.cap;
  const rangeLbl = isCap ? cfgT('bench_cap') : cfgT('bench_rec');
  const rangeTxt = isCap
    ? `${rangeLbl}: ≤${bench.cap.max}${unitSym}`
    : `${rangeLbl}: ${bench.band.min}–${bench.band.max}${unitSym}`;
  const chip = state
    ? `<span class="mp-bench-chip mp-bench-${state}">${cfgT('bench_state_' + state)}</span>`
    : '';
  const why = _escAttr(cfgBenchFill(cfgT(bench.whyKey), bench, value));
  return `<span class="mp-bench-range">${rangeTxt}</span>${chip}<span class="mp-bench-why" title="${why}">ⓘ</span>`;
}

// Like mpInp, but with a live benchmark line below the input.
function mpInpBench(id, label, val, unit, min, max, benchParam) {
  const u = ovUnit(id, unit);
  return `<div class="mp-row">
    <div class="mp-lbl">${label}${u ? ` <span class="mp-unit">${u}</span>` : ''}</div>
    <input class="mp-inp" id="mp-${id}" type="number" value="${ovToDisp(id, val)}" min="${min}" max="${max}" step="1"
           oninput="cfgBenchUpdate('${id}','${benchParam}',this.value)" onchange="bonusOvChange('${id}',this.value)">
    <div class="mp-bench" id="mp-bench-${id}">${cfgBenchInner(benchParam, val, id)}</div>
  </div>`;
}

// Live-update the benchmark line (and the welcome guardrail) as the user types.
function cfgBenchUpdate(id, benchParam, value) {
  const el = document.getElementById('mp-bench-' + id);
  if (el) el.innerHTML = cfgBenchInner(benchParam, value, id);
  if (id === 'w_wager') cfgRefreshGuardrail(value);
}

// Welcome-wager guardrail banner: shown when the value exceeds the recommended max.
function cfgGuardrailInner(value) {
  const RB = window.RetomatBenchmarks;
  if (!RB) return '';
  const { region, license } = cfgBonusRL();
  const bench = RB.getBenchmark('w_wager', region, license);
  if (!bench) return '';
  const v = parseFloat(value);
  const state = isNaN(v) ? null : RB.classifyValue(v, bench);
  if (state !== 'above' && state !== 'over_cap') return '';
  return `<div class="mech-guardrail">${cfgBenchFill(cfgT('guardrail_wager'), bench, v)}</div>`;
}
function cfgRefreshGuardrail(value) {
  const el = document.getElementById('guardrail-w_wager');
  if (el) el.innerHTML = cfgGuardrailInner(value);
}

// Role badge for a mechanic (Acquisition/low-margin vs Retention/margin).
const MECH_ROLE = { welcome:'acq', ndb:'acq', reload:'ret', cashback:'ret', dep2:'ret', dep3:'ret' };
function cfgRoleBadge(key) {
  const role = MECH_ROLE[key];
  if (!role) return '';
  const lbl = role === 'acq' ? cfgT('role_acq') : cfgT('role_ret');
  const tip = _escAttr(role === 'acq' ? cfgT('role_acq_tip') : cfgT('role_ret_tip'));
  return `<span class="mech-role mech-role-${role}" title="${tip}">${lbl}</span>`;
}

// Per-mechanic regulatory banner — ONLY the mechanic-specific BR notes (welcome = hard
// prohibition, ndb/reload = soft). License-wide caps (UK/DK/CO) are rendered once by
// cfgLicenseBanner instead of repeating on every mechanic card.
function cfgRegBanner(mechanic) {
  const RB = window.RetomatBenchmarks;
  if (!RB) return '';
  const { license } = cfgBonusRL();
  if (license !== 'bets_br') return '';
  const key = RB.regulatoryNote(license, mechanic);
  if (!key) return '';
  const hard = key === 'reg_warn_br_welcome';
  return `<div class="mech-reg${hard ? ' mech-reg-hard' : ''}">${cfgT(key)}</div>`;
}

// License-wide regulatory note (UK/DK/CO), shown once above the mechanics list.
function cfgLicenseBanner() {
  const RB = window.RetomatBenchmarks;
  if (!RB) return '';
  const { license } = cfgBonusRL();
  if (license === 'bets_br') return ''; // BR notes are mechanic-specific (see cfgRegBanner)
  const key = RB.regulatoryNote(license, 'welcome');
  if (!key) return '';
  return `<div class="mech-reg">${cfgT(key)}</div>`;
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
  CS.bonus.curMode = 'local'; // default to the new region's currency
  const geo = cfgGeo(val);
  // Update ov defaults based on new currency scale (ov is stored in geo.cur — the
  // BACKEND currency; display conversion happens at the render/recalc boundary).
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
  let v = parseFloat(val) || 0;
  // Money fields are entered in the display currency → store in backend currency.
  if (MONEY_OV.has(key)) v = v / dispFactor('bonus');
  CS.bonus.ov[key] = v;
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

function updateBonusCostDisplay(rawData, rawCfg) {
  // Display-currency layer (factor === 1 → passthrough).
  const _f  = dispFactor('bonus');
  const data = window.GeoData.convertCosts(rawData, _f);
  const cfg  = window.GeoData.convertConfigCurrency(rawCfg, _f, dispCurCode('bonus'));
  const cur = cfg.cur || 'USD';
  const costs = data.costs;
  const upd = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = fmtCur(v, cur); };
  upd('bc-p50',  costs.w_p50);
  upd('bc-total',costs.total);
  upd('bc-risk', data.maxRisk);  // maxRisk is top-level in recalcCosts response, not inside data.costs
  const ratioEl = document.getElementById('bc-ratio');
  if (ratioEl) {
    ratioEl.textContent = fmtPct(data.ratio);
    const v = ratioVerdict(data.ratio);
    ratioEl.style.color = v==='ok'?'#10b981':v==='warn'?'#f59e0b':v==='high'?'#ef4444':'#8892a4';
  }
  // Обновить LTV per-player (geo benchmark, not scaled by pl)
  const E = cfg.econ || {};
  const ltv3El = document.getElementById('bc-ltv3');
  if (ltv3El) ltv3El.textContent = fmtCur(E.ltv3||0, 'USD');
  // Campaign ROI: recompute via lift model after recalc (costs ratio changed)
  const roiEl = document.getElementById('bc-roi');
  if (roiEl) {
    const _lv2 = computeBonusLift(CS.bonus);
    const _eco2 = _lv2?.economics || {};
    const cRoi = _eco2.campCost3 > 0
      ? Math.round((_eco2.incrRev - _eco2.campCost3) / _eco2.campCost3 * 100) : null;
    roiEl.textContent = cRoi != null ? (cRoi >= 0 ? '+' : '') + cRoi + '%' : '—';
    roiEl.style.color = cRoi != null && cRoi >= 0 ? 'var(--success)' : '#ef4444';
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
  // Display-currency layer: convert the raw (backend-currency) config + costs for
  // rendering only. factor === 1 (non-LatAm local mode) returns the input as-is.
  const _f    = dispFactor('bonus');
  const cfg   = window.GeoData.convertConfigCurrency(B.config, _f, dispCurCode('bonus'));
  const costs = window.GeoData.convertCosts(B.costs, _f);
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

  // Compute campaign ROI for the top card
  const _lv = computeBonusLift(B);
  const _eco = _lv?.economics || {};
  const _campRoi = _eco.campCost3 > 0
    ? Math.round((_eco.incrRev - _eco.campCost3) / _eco.campCost3 * 100) : null;
  const _roiVal  = _campRoi != null ? (_campRoi >= 0 ? '+' : '') + _campRoi + '%' : '—';
  const _roiClr  = _campRoi != null && _campRoi >= 0 ? 'pos' : 'neg';
  const _geoBench = (E.roi3||E.roi||0).toFixed(0) + '%';

  // Tooltip formulas for each card
  const _tipP50   = `Expected median bonus payout · all ${pl} players · 1 month`;
  const _tipRatio = `Total bonus cost ÷ total deposit volume · lower = more efficient`;
  const _tipRisk  = `Pessimistic (P90) scenario — worst 10% of outcomes`;
  const _tipArpu  = `Average Revenue Per User / month · USD geo benchmark (${B.geo||'eu'})`;
  const _tipLtv3  = `Per-player lifetime value over 3 months = ARPU × 3 · USD geo benchmark`;
  const _tipRoi   = `(Incremental revenue − bonus budget) ÷ bonus budget · V2 lift model`;

  let econCards = `
    <div class="econ-grid">
      ${econCard('bc-p50',   cfgT('econ_cost_p50'),   fmtCur(p50cost,cur),  cfgT('per_mo'),       '', true, _tipP50)}
      ${econCard('bc-ratio', cfgT('econ_cost_ratio'),  fmtPct(ratio),        cfgT('of_deposits'),  colorRatio(ratio), true, _tipRatio)}
      ${econCard('bc-risk',  cfgT('econ_max_risk'),    fmtCur(maxRisk,cur),  cfgT('per_mo'),       '', true, _tipRisk)}
      ${econCard('bc-arpu',  cfgT('econ_arpu'),        fmtCur(E.arpu||0,'USD'), cfgT('arpu_sub'),   'pos', false, _tipArpu)}
      ${econCard('bc-ltv3',  cfgT('econ_ltv3'),        fmtCur(E.ltv3||0,'USD'), cfgT('ltv3_sub'),   'pos', false, _tipLtv3)}
      ${econCard('bc-roi',   cfgT('econ_roi'),         _roiVal, cfgT('roi_platform_sub'), _roiClr, false, _tipRoi)}
    </div>
    <div style="font-size:10px;color:var(--muted);text-align:right;margin-top:-4px;margin-bottom:8px">
      ${cfgT('geo_bench_lbl')} LTV/CAC: <span style="color:#a0b0ff;font-weight:600">${_geoBench}</span>
      <span style="opacity:.6">(${B.geo||'eu'})</span>
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
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;align-items:baseline;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:14px">
        <span style="color:#8892a4">${stepLbls[s.key] || s.key}</span>
        <span style="color:#8892a4;font-size:13px;text-align:center">×${Math.round(s.cohort*100)}% ${cfgT('chain_cohort')}</span>
        <span style="font-family:monospace;font-weight:700;color:var(--text);text-align:right">${fmtCur(s.cost, cur)}</span>
      </div>
    `).join('');
    chainStrip = `
      <div style="margin-bottom:14px;padding:12px 14px;background:rgba(160,176,255,.04);border-radius:9px;border:1px solid rgba(160,176,255,.14)">
        <div style="font-size:13px;font-weight:700;color:#a0b0ff;margin-bottom:8px">⛓ ${cfgT('chain_title')}</div>
        ${stepRows}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08)">
          <span style="font-size:14px;font-weight:700;color:var(--text)">${cfgT('chain_total')}</span>
          <span style="font-size:13px;font-weight:700;color:${rClr};text-align:center">${(chainRatio*100).toFixed(1)}% ${cfgT('chain_ratio_lbl')}</span>
          <span style="font-family:monospace;font-weight:800;color:var(--text);text-align:right;font-size:15px">${fmtCur(chainCfg.chainCost, cur)}</span>
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
      ${['econ','audit','optimize','games','competitors'].map(tab => `
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

function econCard(id, label, val, sub, valClass='', recalc=false, tip='') {
  return `<div class="econ-card"${recalc?' data-recalc':''}>
    <div class="econ-label">${label}</div>
    <div class="econ-val${valClass?' '+valClass:''}" id="${id}"${tip?' data-tooltip="'+tip+'"':''}>${val}</div>
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

  // F1: nonlinear penalty when wager exceeds breakeven (overpriced wager looks player-friendly
  // on paper but isn't — Math.pow(ratio,1.5) makes the penalty steeper than a linear clamp)
  const wagerRatio = beW / wagerX;
  const wagerPenalty = wagerRatio < 1 ? Math.pow(wagerRatio, 1.5) : clamp(wagerRatio, 1.0, 2.0);
  const F1 = clamp(0.7 + 0.3 * clamp(wagerPenalty, 0.3, 2.0), 0.65, 1.35);
  // F2: weights match% against wager size — a high match% behind a high wager delivers
  // little effective value to the player, so it shouldn't score as generous
  const effectiveValue = (matchPct / 100) / Math.max(wagerX / 10, 1);
  const F2 = clamp(0.85 + 0.30 * Math.min(effectiveValue, 1.0), 0.85, 1.15);
  const F3 = 1
    + (B.active.ndb      ? 0.06 : 0)
    + (B.active.reload   ? 0.08 : 0)
    + (B.active.dep2     ? 0.04 : 0)
    + (B.active.fs       ? 0.04 : 0)
    + (B.active.cashback ? 0.07 : 0);
  const F4 = clamp(0.94 + 0.12 * ((rtp - 0.85) / 0.14), 0.94, 1.06);
  const F5 = plat === 'mobile' ? 1.05 : plat === 'desk' ? 0.97 : 1.0;

  // F6: wagering completion factor (hit rate × days factor × bet limit)
  // Reduces effective lift when players can't realistically complete wagering
  const hitrate   = clamp(parseFloat(B.ov?.w_hitrate)    || 1.0, 0.01, 1.0);
  const days      = Math.max(1, parseFloat(B.ov?.w_days)  || 30);
  const betFactor = clamp(parseFloat(B.ov?.w_bet_factor)  || 1.0, 0.1,  1.0);
  const avgDaysNeeded = Math.max(7, Math.ceil(wagerX * 0.75)); // ~2/3× deposit/day pace
  const daysFactor = Math.min(1, days / avgDaysNeeded);
  const F6 = clamp(hitrate * daysFactor * betFactor, 0.05, 1.0);

  const lift = Math.min(0.40, base * F1 * F2 * F3 * F4 * F5 * F6);

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
      rtpFactor:F4, rtp, platFactor:F5, plat,
      convFactor:F6, hitrate, days, avgDaysNeeded, betFactor, daysFactor,
      base, lift },
    economics: { net, campCost3, incrRev, incrPl, pl },
  };
}

// First-principles per-player and per-campaign breakdown of bonus economics,
// independent of the Incremental Revenue v2 lift model (sitecur values, not USD)
function computeBonusBreakdown({ bonusSize, wagerX, rtp, pl, conv }) {
  const he             = 1 - rtp;
  const ggrPerWager     = bonusSize * wagerX * he;
  const payoutPerPlayer = Math.max(0, bonusSize - ggrPerWager);
  const netPerPlayer    = ggrPerWager - bonusSize;
  const activePlayers   = Math.round(pl * conv);
  const totalGgr        = ggrPerWager * activePlayers;
  const totalPaid       = bonusSize * activePlayers;
  const netCampaign     = netPerPlayer * activePlayers;
  return { ggrPerWager, payoutPerPlayer, netPerPlayer, activePlayers, totalGgr, totalPaid, netCampaign };
}

// "РАЗБИВКА ЭКОНОМИКИ" — first-principles per-player / per-campaign breakdown,
// shown alongside (not instead of) the Incremental Revenue v2 model. Sitecur, not USD.
function renderBonusBreakdownTable(B, v, cur, isRu) {
  const cfg = B.config;
  const E   = cfg.econ || {};
  // bonusSize is in backend currency; computeBonusBreakdown is linear in it, so
  // scaling by the display factor converts every derived money value (cur passed in).
  const bonusSize = (E.bonusSize || 0) * dispFactor('bonus');
  const wagerX    = v.wagerX;
  const rtp       = v.rtp;
  const pl        = E.pl || B.players || 1;

  // Apply convFactor (from F6 override fields) to all conv scenarios
  const convF = v?.convFactor || 1.0;
  const scenarios = [
    { key:'best',  dot:'dot-best',  lbl:isRu?'Оптимист.':'Optimistic', conv:0.10 * convF },
    { key:'base',  dot:'dot-base',  lbl:isRu?'Базовый':'Expected',     conv:0.20 * convF },
    { key:'worst', dot:'dot-worst', lbl:isRu?'Пессимист.':'Pessimistic', conv:0.40 * convF },
  ].map(s => ({ ...s, bd: computeBonusBreakdown({ bonusSize, wagerX, rtp, pl, conv: s.conv }) }));
  const base = scenarios[1].bd; // per-player metrics are conv-independent — any scenario works

  const rowPP = (lbl, val, bold, color) =>
    `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:12px">
      <span style="color:#8892a4">${lbl}</span>
      <span style="${bold?'font-weight:700;':''}${color?'color:'+color+';':''}font-family:monospace">${val}</span>
    </div>`;
  const netPPClr = base.netPerPlayer >= 0 ? '#10b981' : '#ef4444';

  const tdR = (val, bold, color) =>
    `<td style="text-align:right;padding:7px 6px;border-bottom:1px solid rgba(255,255,255,.04);${bold?'font-weight:700;':''}${color?'color:'+color+';':''}">${val}</td>`;

  const L = isRu ? {
    title:'Что происходит с деньгами бонуса', sub:'расчёт по базовым формулам',
    perPlayer:'На одного игрока', perCamp:'На всю кампанию · 3 месяца',
    bonusSizeR:'Размер бонуса', wageredR:'Обязательный оборот (бонус × вейджер)', ggrR:'Доход казино с отыгрыша',
    payoutR:'Выплата игроку при отыгрыше', netPPR:'Прибыль казино на 1 игрока', ltv3TotalR:'Доход со всех игроков за 3 месяца',
    scenHdr:'Сценарий', activeHdr:'Сыграли бонус', ggrHdr:'Доход казино', paidHdr:'Выплачено игрокам', netHdr:'Прибыль казино',
  } : {
    title:'What Happens to Bonus Money', sub:'calculated from first principles',
    perPlayer:'Per Player', perCamp:'Per Campaign · 3 months',
    bonusSizeR:'Bonus Size', wageredR:'Total Wager Required (bonus × multiplier)', ggrR:'Casino Income from Wagering',
    payoutR:'Player Payout on Completion', netPPR:'Casino Profit per Player', ltv3TotalR:'Total Player Revenue (3 months)',
    scenHdr:'Scenario', activeHdr:'Completed Wagering', ggrHdr:'Casino Income', paidHdr:'Paid to Players', netHdr:'Casino Profit',
  };

  return `
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">${L.title}</div>
      <div style="font-size:10px;color:#666;margin-bottom:8px">${L.sub}</div>

      <div style="font-size:11px;font-weight:600;color:var(--text2);margin-bottom:4px">${L.perPlayer}</div>
      ${rowPP(L.bonusSizeR, fmtCur(bonusSize, cur), false, null)}
      ${rowPP(L.wageredR,   fmtCur(bonusSize*wagerX, cur), false, null)}
      ${rowPP(L.ggrR,       fmtCur(base.ggrPerWager, cur), false, null)}
      ${rowPP(L.payoutR,    fmtCur(base.payoutPerPlayer, cur), false, null)}
      ${rowPP(L.netPPR,     (base.netPerPlayer>=0?'+':'')+fmtCur(Math.abs(base.netPerPlayer), cur), true, netPPClr)}
      ${rowPP(L.ltv3TotalR, fmtCur((E.ltv3||0)*pl*dispFactor('bonus'), cur), false, 'var(--success)')}

      <div style="font-size:11px;font-weight:600;color:var(--text2);margin:12px 0 4px">${L.perCamp}</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">
        <colgroup><col style="width:28%"><col style="width:24%"><col style="width:24%"><col style="width:24%"></colgroup>
        <thead>
          <tr style="color:var(--text2)">
            <th style="text-align:left;padding:6px;border-bottom:1px solid var(--border);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">${L.scenHdr}</th>
            <th style="text-align:right;padding:6px;border-bottom:1px solid var(--border);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">${L.ggrHdr}</th>
            <th style="text-align:right;padding:6px;border-bottom:1px solid var(--border);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">${L.paidHdr}</th>
            <th style="text-align:right;padding:6px;border-bottom:1px solid var(--border);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">${L.netHdr}</th>
          </tr>
        </thead>
        <tbody>
          ${scenarios.map(s => {
            const netClr = s.bd.netCampaign >= 0 ? '#10b981' : '#ef4444';
            const rowBg  = s.key === 'base' ? 'background:rgba(160,176,255,.04);' : '';
            return `<tr style="${rowBg}">
              <td style="padding:7px 6px;border-bottom:1px solid rgba(255,255,255,.04);${s.key==='base'?'font-weight:600':''}"><span class="scenario-dot ${s.dot}"></span>${s.lbl} (${(s.conv*100).toFixed(0)}%)</td>
              ${tdR(fmtCur(s.bd.totalGgr, cur), s.key==='base', s.key==='base'?'#a0b0ff':null)}
              ${tdR(fmtCur(s.bd.totalPaid, cur), false, null)}
              ${tdR((s.bd.netCampaign>=0?'+':'')+fmtCur(Math.abs(s.bd.netCampaign), cur), true, netClr)}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
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
    // Display-currency layer: convert the raw config + costs for rendering only.
    const _f     = dispFactor('bonus');
    const dcfg   = window.GeoData.convertConfigCurrency(cfg, _f, dispCurCode('bonus'));
    const cur    = dcfg.cur || 'USD';

    // ── Currency conversion table (sitecur → USD) for net result fix ───────
    // P1 bug: P10/P90 cost adjustments were in sitecur, net was in USD
    const SITECUR_TO_USD = { USD:1, USDT:1, SC:1, EUR:1/0.92, GBP:1/0.79,
      DKK:1/7.37, RUB:1/90.9, KZT:1/500, MNT:1/3448, BTC:1/0.000015, ETH:1/0.00042,
      BRL:1/5.5, MXN:1/18.5, COP:1/4100, ARS:1/1050, PEN:1/3.75, CLP:1/950 };
    const fxToUsd = SITECUR_TO_USD[cur] ?? 1;

    // ── P10/P50/P90 cost scenarios ──────────────────────────────────────────
    const E      = dcfg.econ || {};
    const costs  = window.GeoData.convertCosts(B.costs, _f);
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
    // Cost per converting player (in sitecur)
    const cpp10  = conv10 * pl > 0 ? p10c / (conv10 * pl) : 0;
    const cpp50  = conv50 * pl > 0 ? p50c / (conv50 * pl) : 0;
    const cpp90  = conv90 * pl > 0 ? p90c / (conv90 * pl) : 0;
    // Net (USD) — cost adjustments converted from sitecur via fxToUsd
    const net10  = eco.net * (conv10 / (conv50 || 1)) - (p10c - p50c) * 3 * fxToUsd;
    const net90  = eco.net * (conv90 / (conv50 || 1)) - (p90c - p50c) * 3 * fxToUsd;

    const netClr  = eco.net >= 0 ? '#10b981' : '#ef4444';

    // Factor formula for lift row tooltip
    const ff = f => f.toFixed(3);
    const formulaTip = `${ff(v.base)} × ${ff(v.wagFactor)} × ${ff(v.genFactor)} × ${ff(v.mechFactor)} × ${ff(v.rtpFactor)} × ${ff(v.platFactor)} × ${ff(v.convFactor)} = ${(v.lift*100).toFixed(1)}%`;

    const L = isRu ? {
      p50card:'Ожидаемый бюджет', p50sub:'базовый сценарий · 3 месяца',
      ltvlbl:'LTV 3 мес', ltvsub:'доход с одного игрока за 3 месяца',
      roilbl:'ROI платформы', roisub:'средний ROI по гео — ориентир',
      netlbl:'Чистый результат', netsub:'за 3 мес · базовый сценарий',
      scenHdr:'Сценарий', costHdr:'Бюджет кампании (3 мес)', cppHdr:'Стоимость на игрока',
      convHdr:'% отыгравших бонус',
      convTip:'Доля игроков, которые выполнят условие вейджера и получат выплату. Чем выше — тем дороже кампания.',
      loadLbl:'Нагрузка на депозиты',
      loadTip:'Затраты на бонус в % от суммы депозитов игроков',
      best:'Лучший', baseSc:'Базовый', worst:'Худший',
      factHdr:'Как считается прирост удержания',
      factTip:'Модель показывает, насколько бонус помогает удерживать игроков. Стартовое значение — исторический показатель для сегмента, каждый фактор (F1–F6) корректирует его.',
      baseRow:'Исторический прирост сегмента', liftRow:'Итоговый прирост',
      f6lbl:'F6 Завершаемость', f6Tip:'Доля игроков, которые реально дойдут до конца отыгрыша — с учётом срока действия, частоты ставок и лимитов',
      assumHdr:'Как работает модель', assumToggle:'Показать / скрыть',
      ltvTip:'Lifetime Value — сколько денег приносит один игрок за период',
      roiTip:'Return on Investment — сколько зарабатываем на каждый рубль бонусного бюджета',
      rtpTip:'Return to Player — какой процент ставок возвращается игрокам в среднем',
      wagerTip:'Wagering Requirement — сколько раз нужно «прокрутить» бонус, чтобы вывести выигрыш',
    } : {
      p50card:'Expected Budget', p50sub:'base scenario · 3 months',
      ltvlbl:'LTV 3 mo', ltvsub:'revenue per player over 3 months',
      roilbl:'Platform ROI', roisub:'avg ROI for this geo — benchmark',
      netlbl:'Net Result', netsub:'3 mo · base scenario',
      scenHdr:'Scenario', costHdr:'Campaign Budget (3 mo)', cppHdr:'Cost per Player',
      convHdr:'% Who Complete Wagering',
      convTip:'Share of players who finish wagering and receive a payout. Higher = more expensive campaign.',
      loadLbl:'Deposit Load',
      loadTip:'Bonus cost as % of total player deposits',
      best:'Best case', baseSc:'Expected', worst:'Worst case',
      factHdr:'How Retention Lift Is Calculated',
      factTip:'The model shows how much the bonus helps retain players. The starting value is the historical lift for the segment; each factor (F1–F6) adjusts it based on campaign parameters.',
      baseRow:'Historical Lift for Segment', liftRow:'Total Retention Lift',
      f6lbl:'F6 Completion Rate', f6Tip:'Share of players who realistically finish wagering — accounting for expiry, bet frequency, and bet size limits',
      assumHdr:'How the Model Works', assumToggle:'Show / hide',
      ltvTip:'Lifetime Value — projected revenue from one player over the period',
      roiTip:'Return on Investment — how much we earn per unit of bonus budget',
      rtpTip:'Return to Player — theoretical % of bets returned to players on average',
      wagerTip:'Wagering Requirement — how many times the bonus must be wagered before withdrawal',
    };

    const tdR = (v, bold, color) =>
      `<td style="text-align:right;padding:8px;border-bottom:1px solid rgba(255,255,255,.04);${bold?'font-weight:700;':''}${color?'color:'+color+';':''}">${v}</td>`;

    const factorRow = (lbl, score, detail) =>
      `<tr style="border-bottom:1px solid rgba(255,255,255,.04)">
        <td style="padding:4px 0 4px 0;color:#8892a4;font-size:12px;white-space:nowrap">${lbl}</td>
        <td style="padding:4px 12px;color:#a0b0ff;font-family:monospace;font-size:11px;text-align:center;white-space:nowrap">${detail}</td>
        <td style="padding:4px 0;font-weight:700;color:var(--text);text-align:right;white-space:nowrap;font-size:12px">×${score.toFixed(3)}</td>
      </tr>`;

    return `
      <div>
        <!-- 4 summary cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
          <div class="econ-card-sm">
            <div class="econ-label">${L.p50card}</div>
            <div class="econ-val">${fmtCur(p50c*3, cur)}</div>
            <div class="card-subtitle">${L.p50sub}</div>
          </div>
          <div class="econ-card-sm">
            <div class="econ-label"><span data-tooltip="${L.ltvTip}">LTV</span> ${isRu?'3 мес':'3 mo'}</div>
            <div class="econ-val pos">${fmtCur(E.ltv3||0, 'USD')}</div>
            <div class="card-subtitle">${L.ltvsub}</div>
          </div>
          <div class="econ-card-sm">
            <div class="econ-label">${L.roilbl}</div>
            <div class="econ-val pos">${(E.roi3||E.roi||0).toFixed(0)}%</div>
            <div class="card-subtitle">${L.roisub}</div>
          </div>
          <div class="econ-card-sm" style="border-color:${netClr}">
            <div class="econ-label">${L.netlbl}</div>
            <div class="econ-val" style="color:${netClr}">${(eco.net>=0?'+':'')}${fmtCur(Math.abs(eco.net * _f), cur)}</div>
            <div class="card-subtitle">${L.netsub}</div>
          </div>
        </div>

        ${renderBonusBreakdownTable(B, v, cur, isRu)}

        <!-- Scenarios table -->
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${isRu?'Сценарии затрат':'Cost Scenarios'}</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;margin-bottom:14px">
          <colgroup><col style="width:28%"><col style="width:24%"><col style="width:24%"><col style="width:24%"></colgroup>
          <thead>
            <tr style="color:var(--text2)">
              <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">${L.scenHdr}</th>
              <th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">${L.costHdr}</th>
              <th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">${L.cppHdr}</th>
              <th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em"><span data-tooltip="${L.convTip}">${L.convHdr}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,.04)"><span class="scenario-dot dot-best"></span>${L.best}</td>
              ${tdR(fmtCur(p10c*3, cur), false, null)}
              ${tdR(fmtCur(cpp10, cur), false, 'var(--text2)')}
              ${tdR(Math.round(conv10*100)+'%', false, null)}
            </tr>
            <tr style="background:rgba(160,176,255,.04)">
              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,.04);font-weight:600"><span class="scenario-dot dot-base"></span>${L.baseSc}</td>
              ${tdR(fmtCur(p50c*3, cur), true, '#a0b0ff')}
              ${tdR(fmtCur(cpp50, cur), false, 'var(--text2)')}
              ${tdR(Math.round(conv50*100)+'%', true, null)}
            </tr>
            <tr>
              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,.06)"><span class="scenario-dot dot-worst"></span>${L.worst}</td>
              ${tdR(fmtCur(p90c*3, cur), false, null)}
              ${tdR(fmtCur(cpp90, cur), false, 'var(--text2)')}
              ${tdR(Math.round(conv90*100)+'%', false, null)}
            </tr>
            <tr>
              <td colspan="4" style="padding:6px 8px;font-size:11px;color:var(--text2)">
                <span data-tooltip="${L.loadTip}">${L.loadLbl}</span>:
                ${(r10*100).toFixed(1)}% → ${(r50*100).toFixed(1)}% → ${(r90*100).toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Retention factors -->
        <div style="margin-bottom:6px;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">
          <span data-tooltip="${L.factTip}">${L.factHdr} ℹ</span>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tbody>
            <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
              <td style="padding:4px 0;color:#8892a4;font-size:12px;white-space:nowrap">${L.baseRow} (${B.segment||'mid'})</td>
              <td style="padding:4px 12px;color:#a0b0ff;font-family:monospace;font-size:11px;text-align:center;white-space:nowrap">${B.segment||'mid'}</td>
              <td style="padding:4px 0;font-weight:700;color:var(--text);text-align:right;white-space:nowrap;font-size:12px">×${v.base.toFixed(3)}</td>
            </tr>
            ${factorRow(`F1 <span data-tooltip="${L.wagerTip}">${isRu?'Вейджер':'Wager'}</span>`, v.wagFactor, `${v.wagerX}× / be=${v.beW}×`)}
            ${factorRow('F2 '+(isRu?'Матч-бонус':'Generosity'), v.genFactor, `${v.matchPct}%`)}
            ${factorRow('F3 '+(isRu?'Механики':'Mechanics'), v.mechFactor,
              [v.hasNDB&&'NDB',v.hasReload&&'RL',v.hasDep2&&'D2',v.hasFS&&'FS',v.hasCB&&'CB'].filter(Boolean).join('+') || '—')}
            ${factorRow(`F4 <span data-tooltip="${L.rtpTip}">RTP</span>`, v.rtpFactor, `${(v.rtp*100).toFixed(0)}%`)}
            ${factorRow('F5 '+(isRu?'Платформа':'Platform'), v.platFactor, v.plat)}
            ${factorRow(`<span data-tooltip="${L.f6Tip}">${L.f6lbl}</span>`, v.convFactor,
              `${(v.hitrate*100).toFixed(0)}%·${v.days}d·${v.betFactor.toFixed(2)}`)}
            <tr style="border-top:1px solid rgba(255,255,255,.08)">
              <td style="padding:6px 0;font-size:13px;font-weight:700;color:var(--text)">${L.liftRow}</td>
              <td></td>
              <td style="padding:6px 0;font-size:13px;font-weight:700;color:#a0b0ff;text-align:right" data-tooltip="${formulaTip}">= ${(v.lift*100).toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>

        <!-- R5-A: expandable model assumptions block -->
        <div style="margin-top:10px">
          <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'"
            style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--muted);padding:0;text-align:left">
            ℹ ${L.assumHdr} ▾
          </button>
          <div style="display:none;margin-top:6px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:6px;padding:10px;font-size:11px;color:#8892a4;line-height:1.7">
            <div><b style="color:var(--text2)">${isRu?'Базовые ставки прироста':'Base lift rates'}:</b>
              New 25% · Mid 18% · VIP 12% · ${isRu?'макс. 40%':'cap 40%'}</div>
            <div><b style="color:var(--text2)">F1 (${isRu?'Вейджер':'Wager'}):</b>
              ${isRu?'Нелинейный штраф при вейджере > breakeven (pow 1.5). Breakeven ≈':'Nonlinear penalty when wager > breakeven (pow 1.5). Breakeven ≈'} ${v.beW}×</div>
            <div><b style="color:var(--text2)">F2 (${isRu?'Щедрость':'Generosity'}):</b>
              ${isRu?'effectiveValue = match% / max(wager/10, 1). Нейтрально при':'effectiveValue = match% / max(wager/10, 1). Neutral at'} 50%/10×</div>
            <div><b style="color:var(--text2)">F3 (${isRu?'Механики':'Mechanics'}):</b>
              +6% NDB · +8% Reload · +7% Cashback · +4% Dep2 · +4% FS</div>
            <div><b style="color:var(--text2)">F4 (RTP):</b>
              ${isRu?'Диапазон':'Range'} 85–99%, ${isRu?'центр 92%':'centred 92%'}</div>
            <div><b style="color:var(--text2)">F5 (${isRu?'Платформа':'Platform'}):</b>
              Mobile +5% · Desktop −3% · Both 0%</div>
            <div><b style="color:var(--text2)">F6 (${isRu?'Завершение':'Completion'}):</b>
              hit_rate × min(1, days/${v.avgDaysNeeded}d${isRu?' расч.':' est.'}) × bet_factor</div>
            <div><b style="color:var(--text2)">ARPU:</b>
              ${isRu?'Гео-бенчмарк (EU: $65, CIS: $22, MN: $12). Источник buildConfig':'Geo benchmark (EU: $65, CIS: $22, MN: $12). Source: buildConfig'}</div>
          </div>
        </div>
      </div>`;
  }

  if (ai.tab === 'audit') {
    if (ai.auditLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.audit)        return aiCurNote('bonus') + renderAuditContent(ai.audit);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runBonusAudit()">${cfgT('run_audit')}</button>
    </div>`;
  }

  if (ai.tab === 'optimize') {
    if (ai.optimizeLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.optimize)        return aiCurNote('bonus') + renderOptimizeContent(ai.optimize);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runBonusOptimize()">${cfgT('run_optimize')}</button>
    </div>`;
  }
  if (ai.tab === 'games') return renderGamesTabContent('bonus');
  if (ai.tab === 'competitors') return renderCompetitorTabContent('bonus');
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
// GAMES TAB — shared across Bonus / Tournament / Loyalty
// ══════════════════════════════════════════════════════════════════════════

function _gamesParamsFor(type) {
  if (type === 'bonus')      return { geo: CS.bonus.geo,      segment: CS.bonus.segment };
  if (type === 'tournament') return { geo: CS.tournament.geo, segment: CS.tournament.segment };
  if (type === 'loyalty')    return { geo: CS.loyalty.geo || CS.loyalty.region, segment: CS.loyalty.segment };
  if (type === 'wheel')      return { geo: CS.wheel.geo,      segment: CS.wheel.segment };
  return { geo: 'de', segment: 'mid' };
}

function _aiContentElId(type) {
  if (type === 'bonus')      return 'bonus-ai-content';
  if (type === 'tournament') return 'tourn-ai-content';
  if (type === 'wheel')      return 'wheel-ai-content';
  return 'loyalty-ai-content';
}

function _renderAiContentFor(type) {
  if (type === 'bonus')      return renderBonusAiContent(CS.bonus);
  if (type === 'tournament') return renderTournAiContent(CS.tournament);
  if (type === 'wheel')      return renderWheelAiContent(CS.wheel);
  return renderLoyaltyAiContent(CS.loyalty);
}

function cfgToggleProvider(name, type) {
  const idx = cfgConnectedProviders.indexOf(name);
  if (idx >= 0) cfgConnectedProviders.splice(idx, 1);
  else cfgConnectedProviders.push(name);
  try { localStorage.setItem('cfg_providers', JSON.stringify(cfgConnectedProviders)); } catch(e){}
  CAI[type].games = null; // stale — force refetch
  runGamesRecommend(type);
}

function renderProviderChecklist(type) {
  const checks = ALL_PROVIDERS.map(p => {
    const checked = cfgConnectedProviders.includes(p);
    const safe = p.replace(/'/g, "\\'");
    return `<label style="display:inline-flex;align-items:center;gap:4px;font-size:11px;margin:2px 6px 2px 0;padding:3px 8px;border-radius:12px;border:1px solid var(--border);background:${checked?'rgba(160,176,255,.12)':'transparent'};cursor:pointer">
      <input type="checkbox" style="margin:0" ${checked?'checked':''} onchange="cfgToggleProvider('${safe}','${type}')"> ${p}
    </label>`;
  }).join('');
  return `<div style="margin-bottom:12px">
    <div style="font-size:11px;color:var(--text2);margin-bottom:6px">${cfgT('games_providers_label')}</div>
    <div style="display:flex;flex-wrap:wrap">${checks}</div>
  </div>`;
}

function renderGameChip(g) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:8px;border:1px solid var(--border);margin-bottom:5px;font-size:12px">
    <span>${g.name}</span>
    <span style="color:var(--text2);font-size:11px">${g.provider}</span>
  </div>`;
}

function renderGameSection(title, games) {
  if (!games || games.length === 0) return '';
  return `<div style="margin-bottom:14px">
    <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">${title}</div>
    ${games.map(renderGameChip).join('')}
  </div>`;
}

function renderGamesResult(data) {
  if (data.error) return `<div class="ph" style="min-height:80px;color:#ef4444">${data.error}</div>`;
  const s = data.sections || {};
  const totalGames = Object.values(s).reduce((n, arr) => n + (arr ? arr.length : 0), 0);
  if (totalGames === 0) return `<div class="ph" style="min-height:80px">${cfgT('games_empty')}</div>`;
  return `
    ${renderGameSection(cfgT('games_popular'), s.popular)}
    ${renderGameSection(cfgT('games_live'), s.live)}
    ${renderGameSection(cfgT('games_fast'), s.fast)}
    ${renderGameSection(cfgT('games_volatility'), s.highVolatility)}
    ${renderGameSection(cfgT('games_mobile'), s.mobileFriendly)}
  `;
}

function renderGamesTabContent(type) {
  const ai = CAI[type];
  const checklist = renderProviderChecklist(type);
  if (ai.gamesLoading) return checklist + loadingHtml(cfgT('ai_loading'));
  if (ai.games) {
    return checklist + renderGamesResult(ai.games) +
      `<button class="btn btn-sm btn-outline" onclick="runGamesRecommend('${type}')">${cfgT('rerun')}</button>`;
  }
  return checklist + `<div class="ph" style="min-height:120px">
    <button class="btn btn-primary" onclick="runGamesRecommend('${type}')">${cfgT('run_games')}</button>
  </div>`;
}

async function runGamesRecommend(type) {
  CAI[type].gamesLoading = true;
  const elId = _aiContentElId(type);
  const el = document.getElementById(elId);
  if (el) el.innerHTML = _renderAiContentFor(type);
  const { geo, segment } = _gamesParamsFor(type);
  try {
    const res = await fetch('/api/games/recommend', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ geo, segment, providers: cfgConnectedProviders, uiLang: cfgLang() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    CAI[type].games = await res.json();
  } catch(e) {
    CAI[type].games = { error: e.message };
  } finally {
    CAI[type].gamesLoading = false;
    const el2 = document.getElementById(elId);
    if (el2) el2.innerHTML = _renderAiContentFor(type);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// COMPETITOR ANALYSIS (shared across all promo types) — uses window.CompetitorAnalysis
// ══════════════════════════════════════════════════════════════════════════

// Delegates to the shared module's escaper (loaded before any competitor render)
// so the escape map lives in exactly one place.
function _compEsc(s) {
  return window.CompetitorAnalysis
    ? window.CompetitorAnalysis.esc(s)
    : String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
// Lazy-init: CAI[type] is rebuilt on regenerate (like `games`), dropping `comp`.
// Recreating on demand keeps the competitor tab crash-safe after a re-Calculate.
function _compState(type) {
  if (!CAI[type].comp) CAI[type].comp = { list: [], result: null, loading: false, searching: false };
  return CAI[type].comp;
}
function _reRenderComp(type) {
  const el = document.getElementById(_aiContentElId(type));
  if (el) el.innerHTML = _renderAiContentFor(type);
}
function _compRegionFor(type) {
  if (type === 'loyalty') return CS.loyalty.region || CS.loyalty.geo || 'eu';
  return CS[type].geo || 'de';
}
function _compOwnLabel(type) { return cfgT('comp_own_' + type); }

// Map internal codes → human labels for the categorical params.
function _compLabel(kind, code) {
  const ru = cfgLang() === 'ru';
  const M = {
    dist:  { top_n:'Top-N', flat: ru?'Равномерно':'Flat', top_heavy:'Top-heavy', tiered: ru?'По тирам':'Tiered' },
    seg:   { all: ru?'Все':'All', new: ru?'Новые':'New', mid: ru?'Актив':'Mid', vip:'VIP', dormant: ru?'Спящие':'Dormant', depositors: ru?'Депозиторы':'Depositors' },
    freq:  { flash:'Flash', daily:'Daily', weekly:'Weekly', monthly:'Monthly', multi_round: ru?'Мульти-раунд':'Multi-round', on_deposit: ru?'По депозиту':'On deposit', on_login: ru?'По входу':'On login' },
    entry: { freeroll: ru?'Бесплатно':'Free', buyin:'Buy-in', by_deposit: ru?'По депозиту':'By deposit' },
    preset:{ welcome:'Welcome', daily:'Daily', vip:'VIP' },
  };
  return (M[kind] && M[kind][code]) || code || '';
}

// Own-offer snapshot, keyed by CompetitorAnalysis PARAM_DEFS for the promo type.
function _compOwnParamsFor(type) {
  const ru = cfgLang() === 'ru';
  if (type === 'bonus') {
    const o = CS.bonus.ov, cur = cfgGeo(CS.bonus.geo).cur;
    return {
      matchPct: o.w_pct + '%',
      maxBonus: fmtCur(o.w_maxB, cur),
      wager: o.w_wager + '×',
      minDeposit: fmtCur(o.w_minD, cur),
      maxWin: o.w_maxWin > 0 ? fmtCur(o.w_maxWin, cur) : (ru ? 'нет лимита' : 'no limit'),
      validityDays: o.w_days + (ru ? ' дн.' : ' d'),
    };
  }
  if (type === 'tournament') {
    const t = CS.tournament, cur = cfgGeo(t.geo).cur;
    return {
      prizePool: fmtCur(t.prizePool, cur),
      distribution: _compLabel('dist', t.distribution),
      segmentReach: _compLabel('seg', t.segment),
      frequency: _compLabel('freq', t.duration),
      entry: _compLabel('entry', t.entryModel),
    };
  }
  if (type === 'loyalty') {
    const l = CS.loyalty;
    return {
      tiers: String(l.numTiers),
      topCashback: l.topCashbackRate + '%',
      earnRate: l.earnRateDeposit + (ru ? ' очк.' : ' pt'),
      redeemRate: l.redeemRate + ' = 1',
      pointsExpiry: l.pointsExpiry > 0 ? l.pointsExpiry + (ru ? ' дн.' : ' d') : (ru ? 'бессрочно' : 'never'),
    };
  }
  const w = CS.wheel; // wheel
  const segCount = Array.isArray(w.segments) ? w.segments.length : '';
  return {
    occasion: _compLabel('preset', w.preset),
    segments: String(segCount),
    topPrize: '',   // best-effort: user can fill for a manual competitor comparison
    spinCost: _compLabel('freq', w.frequency),
    emptySlots: '',
    winWager: w.wager + '×',
  };
}

function _renderCompCard(type, comp, i, defs, lang) {
  const ai = comp.source === 'ai_search';
  const badge = ai ? (comp.confidence === 'unconfirmed' ? cfgT('comp_ai_unconf') : cfgT('comp_ai')) : cfgT('comp_manual');
  const fields = defs.map(d => {
    const label = lang === 'ru' ? d.ru : d.en;
    const val = comp.params?.[d.key] ?? '';
    if (ai) return `<div class="ca-f"><span class="ca-fl">${label}</span><span class="ca-fv">${_compEsc(val || 'н/д')}</span></div>`;
    return `<div class="ca-f"><span class="ca-fl">${label}</span><input class="inp ca-fi" value="${_compEsc(val)}" oninput="compSetParam('${type}',${i},'${d.key}',this.value)"></div>`;
  }).join('');
  const src = ai && comp.sourceUrl ? `<a href="${_compEsc(comp.sourceUrl)}" target="_blank" rel="noopener" class="ca-srclink">${cfgT('comp_source')}</a>` : '';
  return `<div class="ca-card">
    <div class="ca-card-head">
      <span class="ca-card-name">${ai ? '🔍' : '✍️'} ${_compEsc(comp.name)}</span>
      <span class="ca-badge">${badge}</span>${src}
      <a class="ca-x" onclick="compRemove('${type}',${i})" title="✕">✕</a>
    </div>
    <div class="ca-fields">${fields}</div>
  </div>`;
}

function renderCompetitorTabContent(type) {
  const CAmod = window.CompetitorAnalysis;
  if (!CAmod) return `<div class="ph" style="min-height:80px">…</div>`;
  const c = _compState(type);
  const lang = cfgLang();
  const defs = CAmod.PARAM_DEFS[type] || [];
  const own = _compOwnParamsFor(type);
  const ownChips = defs.map(d => `<span class="ca-own-chip"><b>${lang === 'ru' ? d.ru : d.en}:</b> ${_compEsc(own[d.key] || '—')}</span>`).join('');
  const cards = c.list.map((comp, i) => _renderCompCard(type, comp, i, defs, lang)).join('');
  const addRow = c.list.length >= 3 ? '' : `<div class="ca-add">
    <input id="ca-name-${type}" class="inp" placeholder="${cfgT('comp_name_ph')}">
    <button class="btn btn-sm btn-primary" onclick="compSearchAI('${type}')">${cfgT('comp_find_ai')}</button>
    <button class="btn btn-sm btn-outline" onclick="compAddManual('${type}')">${cfgT('comp_add_manual')}</button>
  </div>`;

  let result = '';
  if (c.loading) {
    result = loadingHtml(cfgT('comp_analyzing'));
  } else if (c.result && c.result.error) {
    result = `<div class="ph" style="min-height:60px;color:#ef4444">${_compEsc(c.result.error)}</div>`;
  } else if (c.result) {
    result = `<div class="ca-run-again">
        <button class="btn btn-sm btn-outline" onclick="compRunAnalysis('${type}')">${cfgT('rerun')}</button>
        <button class="btn btn-sm btn-outline" onclick="compSaveComparison('${type}')">${cfgT('save_btn')}</button>
      </div>`
      + CAmod.renderComparisonTable(type, lang, _compOwnLabel(type), own, c.list)
      + CAmod.renderVerdict(lang, c.result);
  } else if (c.list.length) {
    result = `<div class="ca-run"><button class="btn btn-primary" onclick="compRunAnalysis('${type}')">${cfgT('comp_run')}</button>
      <span class="ca-run-hint">${cfgT('comp_run_hint')}</span></div>`;
  } else {
    result = `<div class="ca-hint">${cfgT('comp_add_hint')}</div>`;
  }

  return `
    <div class="ca-panel">
      <div class="ca-sec-label">${cfgT('comp_own_label')}</div>
      <div class="ca-own-chips">${ownChips}</div>
      <div class="ca-sec-label">${cfgT('comp_competitors_label')}</div>
      ${cards}
      ${c.searching ? loadingHtml(cfgT('comp_searching')) : addRow}
      ${result}
      <div class="ca-note">${cfgT('comp_transparency')}</div>
    </div>`;
}

function compSetParam(type, i, key, val) {
  const comp = _compState(type).list[i];
  if (comp) comp.params[key] = val;
}

function compAddManual(type) {
  const c = _compState(type);
  if (c.list.length >= 3) { showToast(cfgT('comp_max')); return; }
  const nameEl = document.getElementById('ca-name-' + type);
  const name = (nameEl && nameEl.value.trim()) || (cfgLang() === 'ru' ? 'Конкурент' : 'Competitor');
  c.list.push({ name, source: 'manual', params: {} });
  c.result = null;
  _reRenderComp(type);
}

function compRemove(type, i) {
  const c = _compState(type);
  c.list.splice(i, 1);
  c.result = null;
  _reRenderComp(type);
}

async function compSearchAI(type) {
  if (window.FeatureGate && !(await window.FeatureGate.ensure('competitorComparison'))) return;
  const c = _compState(type);
  if (c.list.length >= 3) { showToast(cfgT('comp_max')); return; }
  const nameEl = document.getElementById('ca-name-' + type);
  const name = (nameEl && nameEl.value.trim()) || '';
  if (!name) { showToast(cfgT('comp_name_req')); return; }
  c.searching = true; _reRenderComp(type);
  try {
    const res = await fetch('/api/competitor/search', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ casinoName: name, region: _compRegionFor(type), promoType: type, uiLang: cfgLang() }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || ('HTTP ' + res.status)); }
    const found = await res.json();
    c.list.push({ name: found.name, source: 'ai_search', confidence: found.confidence, sourceUrl: found.sourceUrl, params: found.params || {} });
    c.result = null;
    if (!found.found) showToast(cfgT('comp_notfound'));
  } catch (e) {
    showToast(e.message);
  } finally {
    c.searching = false; _reRenderComp(type);
  }
}

async function compRunAnalysis(type) {
  if (window.FeatureGate && !(await window.FeatureGate.ensure('competitorComparison'))) return;
  const c = _compState(type);
  if (!c.list.length) return;
  c.loading = true; _reRenderComp(type);
  try {
    const body = {
      region: _compRegionFor(type), promoType: type,
      ownOffer: { label: _compOwnLabel(type), params: _compOwnParamsFor(type) },
      competitors: c.list.map(x => ({ name: x.name, source: x.source, confidence: x.confidence, sourceUrl: x.sourceUrl, params: x.params })),
      uiLang: cfgLang(),
    };
    const res = await fetch('/api/competitor/compare', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || ('HTTP ' + res.status)); }
    c.result = await res.json();
  } catch (e) {
    c.result = { error: e.message };
  } finally {
    c.loading = false; _reRenderComp(type);
  }
}

function compSaveComparison(type) {
  const c = _compState(type);
  if (!c.result || c.result.error) return;
  const id = genId();
  const rec = {
    id, type: 'competitor-comparison', promoType: type,
    createdAt: new Date().toISOString(), region: _compRegionFor(type),
    ownOffer: { label: _compOwnLabel(type), params: _compOwnParamsFor(type) },
    competitors: c.list, result: c.result,
  };
  try {
    const arr = JSON.parse(localStorage.getItem('cfgSavedComparisons') || '[]');
    arr.push(rec);
    localStorage.setItem('cfgSavedComparisons', JSON.stringify(arr));
  } catch (e) {}
  if (window.RetomatRepo) window.RetomatRepo.mirror('competitor-comparisons', id, rec);
  showToast(cfgT('saved_toast'));
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

function tournSetGeo(v) {
  CS.tournament.geo = v;
  CS.tournament.curMode = 'local';
  cfgRender();
}

function renderTournAudienceCard(T) {
  const geoOpts = cfgGeoOptions(T.geo);
  const segments = [
    {val:'all',lbl:'seg_all'},{val:'depositors',lbl:'seg_depositors'},
    {val:'new',lbl:'seg_new'},{val:'vip',lbl:'seg_vip'},{val:'dormant',lbl:'seg_dormant'},
  ];
  return `
    <div class="card">
      <div class="card-title">${cfgT('tourn_params')} — ${cfgT('tourn_geo').split('/')[0]}</div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_geo')}</label>
        <select class="form-input" onchange="tournSetGeo(this.value)">${geoOpts}</select>
      </div>
      ${renderCurToggle('tournament')}
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
  const _tf = dispFactor('tournament');
  return `
    <div class="card">
      <div class="card-title">${cfgT('tourn_params')} — ${cfgT('tourn_prize').split(' ')[0]}</div>
      <div class="form-row">
        <label class="form-label">${cfgT('tourn_prize')} (${dispCurCode('tournament')})</label>
        <input class="form-input" type="number" value="${Math.round(T.prizePool * _tf)}" min="100" step="100"
               onchange="CS.tournament.prizePool=(+this.value||1000)/dispFactor('tournament')">
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
  const ai   = CAI.tournament;
  // Display-currency layer (factor === 1 → passthrough). Backend econ is in d.cur.
  const _tf  = dispFactor('tournament');
  const cur  = dispCurCode('tournament');

  const eligible   = econ.eligible              || 0;
  const expPart    = econ.participantsMid        || 0;
  const ggrLift    = (econ.ggrLiftMid            || 0);
  const roi        = econ.roi                    || 0;
  const engagement = econ.engagementMultiplier   || 1.5;
  const cpp        = (econ.costPerActiveMid      || 0) * _tf;

  const econCards = `
    <div class="econ-grid">
      ${econCard('', cfgT('econ_eligible'),    fmtN(eligible),          cfgT('seg_'+T.segment)||T.segment, '')}
      ${econCard('', cfgT('econ_participation'),fmtN(expPart),           cfgT('per_mo'), '')}
      ${econCard('', cfgT('econ_ggr_lift'),    typeof ggrLift==='number'&&ggrLift<2 ? fmtPct(ggrLift) : '+'+fmtN(ggrLift*_tf,0), '', ggrLift>0?'pos':'')}
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
          Prize Distribution (${cur} ${fmtN(T.prizePool * _tf)} pool)
        </div>
        ${prizes.slice(0,10).map((p,i) => {
          const pct = T.prizePool > 0 ? (p.amount / T.prizePool) * 100 : 0;
          return `<div class="prize-row">
            <span class="prize-place">#${i+1}</span>
            <div class="prize-bar-wrap"><div class="prize-bar" style="width:${Math.min(100,pct)}%"></div></div>
            <span class="prize-amt">${fmtCur(p.amount * _tf, cur)}</span>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  const tabs = `
    <div class="tab-row">
      ${['econ','audit','optimize','games','competitors'].map(tab=>`
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
  const isRu = cfgLang() === 'ru';
  // Display-currency layer (factor === 1 → passthrough). scaleFields converts
  // every money key of the econ object once; counts/ratios are left untouched.
  const _tf  = dispFactor('tournament');
  const cur  = dispCurCode('tournament');
  const econ = window.GeoData.scaleFields(d.econ || {}, _tf, TOURN_ECON_MONEY);

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
    if (ai.audit)        return aiCurNote('tournament') + renderAuditContent(ai.audit);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runTournAudit()">${cfgT('run_audit')}</button>
    </div>`;
  }
  if (ai.tab === 'optimize') {
    if (ai.optimizeLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.optimize)        return aiCurNote('tournament') + renderTournOptimizeContent(ai.optimize);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runTournOptimize()">${cfgT('run_optimize')}</button>
    </div>`;
  }
  if (ai.tab === 'games') return renderGamesTabContent('tournament');
  if (ai.tab === 'competitors') return renderCompetitorTabContent('tournament');
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

function loyalSetGeo(v) {
  CS.loyalty.geo = v;
  // 'crypto' is a region-only option (no country) — Loyalty is region-agnostic,
  // so it's just a label; keep it out of cfgGeo (which would fall back to de/eu).
  CS.loyalty.region = v === 'crypto' ? 'crypto' : cfgGeo(v).region;
  CS.loyalty.curMode = 'local';
  cfgRender();
}

function renderLoyaltyAudienceCard(LY) {
  const isRu = cfgLang() === 'ru';
  const geoOpts = cfgGeoOptions(LY.geo || 'de') +
    `<optgroup label="${isRu ? 'Глобально' : 'Global'}">` +
    `<option value="crypto"${LY.geo === 'crypto' ? ' selected' : ''}>🌐 Crypto / Global</option></optgroup>`;
  const _lf = dispFactor('loyalty');
  const _lc = dispCurCode('loyalty');
  return `
    <div class="card">
      <div class="card-title">${cfgT('loyal_audience')}</div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_region')}</label>
        <select class="form-input" onchange="loyalSetGeo(this.value)">${geoOpts}</select>
      </div>
      ${renderCurToggle('loyalty')}
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
        <label class="form-label">${cfgT('loyal_avgdep')} (${_lc})</label>
        <input class="form-input" type="number" value="${Math.round(LY.avgdep * _lf)}" min="1" step="1"
               onchange="CS.loyalty.avgdep=(+this.value||100)/dispFactor('loyalty')">
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('loyal_arpu')} (${_lc})</label>
        <input class="form-input" type="number" value="${Math.round(LY.arpu * _lf)}" min="1" step="1"
               onchange="CS.loyalty.arpu=(+this.value||50)/dispFactor('loyalty')">
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
  // Guests can't use Loyalty (backend requireFeature('loyalty')) — clear prompt, not a 403.
  if (window.FeatureGate && !(await window.FeatureGate.ensure('loyalty'))) return;
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
  const ai   = CAI.loyalty;
  const _lf  = dispFactor('loyalty');
  const _lc  = dispCurCode('loyalty');
  const econ = window.GeoData.scaleFields(d.econ || {}, _lf, LOYALTY_ECON_MONEY);

  const costMo    = econ.monthlyCostUSD    || 0;
  const costGgr   = (econ.costRatioPct    || 0) / 100;
  const retention = (econ.retentionLiftPct || 0) / 100;
  const roi3      = econ.roi3m             || 0;
  const breakeven = econ.breakEvenMonths;
  const liability = econ.totalLiabilityUSD || 0;

  const econCards = `
    <div class="econ-grid">
      ${econCard('', cfgT('loyal_monthly_cost'), fmtCur(costMo, _lc), cfgT('per_mo'), '')}
      ${econCard('', cfgT('econ_cost_ggr'),  fmtPct(costGgr),  'of GGR',          costGgr<0.15?'pos':costGgr<0.25?'neu':'neg')}
      ${econCard('', cfgT('econ_retention'), fmtPct(retention),'lift',             'pos')}
      ${econCard('', cfgT('econ_ltv3'),      fmtPct(roi3),     '3-month',         roi3>0?'pos':'neg')}
      ${econCard('', cfgT('econ_breakeven'), breakeven != null ? fmtN(breakeven,1)+' mo' : '—', 'months', '')}
      ${econCard('', cfgT('econ_liability'), fmtCur(liability, _lc), 'unredeemed pts', '')}
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
      ${['econ','audit','optimize', ...(hasMissions?['missions']:[]), 'games','competitors'].map(tab=>`
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
  const isRu = cfgLang() === 'ru';
  // Display-currency layer: Loyalty econ is USD; scaleFields converts money keys
  // once (factor === 1 in USD mode; for non-LatAm local mode = native rate).
  const _lf  = dispFactor('loyalty');
  const _lc  = dispCurCode('loyalty');
  const M    = v => fmtCur(v, _lc);
  const econ = window.GeoData.scaleFields(d.econ || {}, _lf, LOYALTY_ECON_MONEY);

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
          ${lyScRow(isRu?'Затраты/мес':'Monthly cost', M(sCost), null)}
          ${lyScRow(isRu?'Нагрузка / GGR':'Cost / GGR', sRatio.toFixed(1)+'%', null)}
          ${lyScRow('ROI 3' + (isRu?'мес':'mo'), fmtPct(sRoi), sRoi>0?'#10b981':'#ef4444')}
          <div style="border-top:1px solid rgba(255,255,255,.07);margin-top:5px;padding-top:5px">
            ${lyScRow(isRu?'Чистый результат':'Net result (3mo)', (sNet>=0?'+':'')+M(Math.abs(sNet)), scColor(sNet))}
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
        ${econCard('', L.moCost,   M(monthly),                 isRu?'всего программа':'total program',   '')}
        ${econCard('', L.costGgr,  costRatio.toFixed(1)+'%',   isRu?'от выручки':'of gross revenue',     costRatio<15?'pos':costRatio<25?'neu':'neg')}
        ${econCard('', L.retLift,  retention.toFixed(1)+'%',   '+activity',   'pos')}
        ${econCard('', L.roi,      fmtPct(roi3),               '3-month',     roi3>0?'pos':'neg')}
        ${econCard('', L.addRev,   M(rev3m),                   '3-month',     'pos')}
        ${econCard('', L.be,       breakeven != null ? fmtN(breakeven,1)+' mo' : '—', isRu?'мес':'months', '')}
      </div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${L.breakdown}</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
        <tbody>
          <tr style="border-bottom:1px solid rgba(255,255,255,.05)">
            <td style="padding:7px 8px">${L.ptRedeem}</td>
            <td style="text-align:right;padding:7px 8px">${M(redeemCost)}</td>
            <td style="text-align:right;padding:7px 8px;color:var(--text2)">${monthly>0?(redeemCost/monthly*100).toFixed(0)+'%':''}</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,.05)">
            <td style="padding:7px 8px">${L.tierRew}</td>
            <td style="text-align:right;padding:7px 8px">${M(tierCost)}</td>
            <td style="text-align:right;padding:7px 8px;color:var(--text2)">${monthly>0?(tierCost/monthly*100).toFixed(0)+'%':''}</td>
          </tr>
          <tr>
            <td style="padding:7px 8px">${L.misRew}</td>
            <td style="text-align:right;padding:7px 8px">${M(missionCost)}</td>
            <td style="text-align:right;padding:7px 8px;color:var(--text2)">${monthly>0?(missionCost/monthly*100).toFixed(0)+'%':''}</td>
          </tr>
        </tbody>
      </table>
      <div style="font-size:11px;color:var(--text2);margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${L.pts}</div>
      <div class="econ-grid">
        ${econCard('', L.earned,   fmtN(ptsEarned,0)+' pts',   isRu?'в месяц':'per month',  '')}
        ${econCard('', L.redeemed, fmtN(ptsRedeemed,0)+' pts', isRu?'в месяц':'per month',  '')}
        ${econCard('', L.liab,     M(liability),                isRu?'непогашено':'unredeemed', '')}
      </div>
    </div>
  `;
}

function renderLoyaltyAiContent(LY) {
  const ai = CAI.loyalty;
  if (ai.tab === 'econ') return renderLoyaltyEconContent(LY);
  if (ai.tab === 'audit') {
    if (ai.auditLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.audit)        return aiCurNote('loyalty') + renderAuditContent(ai.audit);
    return `<div class="ph" style="min-height:120px">
      <button class="btn btn-primary" onclick="runLoyaltyAudit()">${cfgT('run_audit')}</button>
    </div>`;
  }
  if (ai.tab === 'optimize') {
    if (ai.optimizeLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.optimize)        return aiCurNote('loyalty') + renderOptimizeContent(ai.optimize);
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
  if (ai.tab === 'games') return renderGamesTabContent('loyalty');
  if (ai.tab === 'competitors') return renderCompetitorTabContent('loyalty');
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
// WHEEL OF FORTUNE SECTION
// ══════════════════════════════════════════════════════════════════════════

const WHEEL_SEG_COLORS = {
  free_spins:'#60A5FA', bonus_money:'#10B981', cashback:'#F59E0B',
  multiplier:'#A78BFA', jackpot:'#EF4444', physical:'#EC4899', nothing:'#64748B',
};
// Money-valued keys of the flat wheel econ object (for GeoData.scaleFields).
const WHEEL_ECON_MONEY = [
  'arpu','evPerSpin','topPrizeCost','programCostLow','programCostMid','programCostHigh',
  'ggrUpliftMid','retentionValue','totalValueMid','netResultMid','costPerActiveMid','maxRisk',
];

// Materialize preset segments lazily; re-materialize when preset or avgDeposit
// changes (a fresh layout), but keep per-segment tweaks otherwise.
function wheelEnsureSegments(W) {
  if (!window._wheelEcon) return W.segments || [];
  const key = W.preset + ':' + W.avgDeposit;
  if (!W.segments || W._segKey !== key) {
    W.segments = window._wheelEcon.materializeSegments(W.preset, W.avgDeposit);
    W._segKey  = key;
  }
  return W.segments;
}

// Client-side econ (mirror of the backend) — instant preview + live tweak recalc.
function wheelComputeEcon(W) {
  if (!window._wheelEcon) return null;
  const geo = cfgGeo(W.geo);
  return window._wheelEcon.calcWheelEconomics({
    region:     geo.region, segment: W.segment, players: W.players,
    avgDeposit: W.avgDeposit, segments: W.segments, frequency: W.frequency,
    sitecur:    geo.cur, geo: W.geo, rtp: W.rtp / 100, wager: W.wager,
  });
}

function wheelSegLabel(seg, cur, factor) {
  const v = seg.prizeValue;
  switch (seg.prizeType) {
    case 'free_spins':  return v + ' FS';
    case 'bonus_money': return fmtCur(v * factor, cur);
    case 'cashback':    return Math.round(v * 100) + '%';
    case 'multiplier':  return v + '×';
    case 'jackpot':     return '🎰 ' + fmtCur(v * factor, cur);
    case 'physical':    return '🎁 ' + fmtCur(v * factor, cur);
    case 'nothing':     return '—';
    default:            return '';
  }
}

function renderWheelSVG(segments) {
  const total = segments.reduce((s, g) => s + Math.max(0, g.weight), 0) || 1;
  const cx = 120, cy = 120, r = 110;
  let ang = -Math.PI / 2;
  const parts = segments.map(seg => {
    const frac = Math.max(0, seg.weight) / total;
    const a2   = ang + frac * 2 * Math.PI;
    const x1 = cx + r * Math.cos(ang), y1 = cy + r * Math.sin(ang);
    const x2 = cx + r * Math.cos(a2),  y2 = cy + r * Math.sin(a2);
    const large = frac > 0.5 ? 1 : 0;
    const mid = (ang + a2) / 2;
    const lx = cx + r * 0.62 * Math.cos(mid), ly = cy + r * 0.62 * Math.sin(mid);
    const color = WHEEL_SEG_COLORS[seg.prizeType] || '#64748B';
    const path = `<path d="M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${color}" stroke="#0b1020" stroke-width="1.5" opacity="0.9"/>`;
    const pct = Math.round(frac * 100);
    const label = pct >= 6
      ? `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="#fff" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="middle">${pct}%</text>`
      : '';
    ang = a2;
    return path + label;
  }).join('');
  return `<svg viewBox="0 0 240 240" width="240" height="240" style="max-width:100%;display:block;margin:0 auto">
    ${parts}
    <circle cx="${cx}" cy="${cy}" r="26" fill="#0b1020" stroke="#a0b0ff" stroke-width="2"/>
    <text x="${cx}" y="${cy}" font-size="22" text-anchor="middle" dominant-baseline="middle">🎡</text>
    <polygon points="${cx - 9},4 ${cx + 9},4 ${cx},26" fill="#a0b0ff"/>
  </svg>`;
}

function renderWheelSection() {
  const W = CS.wheel;
  wheelEnsureSegments(W);
  return `
    <div class="card-grid" style="margin-bottom:16px">
      ${renderWheelSetupCard(W)}
      ${renderWheelVisualCard(W)}
    </div>
    <div style="text-align:center;margin-bottom:28px">
      <button class="btn btn-primary btn-lg" onclick="onGenerateWheel()" id="btn-calculate">
        ${cfgT(W.result ? 'recalculate' : 'calculate')}
      </button>
    </div>
    <div id="wheel-results">${renderWheelResults(W)}</div>
  `;
}

function renderWheelSetupCard(W) {
  const geoOpts = cfgGeoOptions(W.geo);
  const _wf = dispFactor('wheel');
  const cur = dispCurCode('wheel');
  const presets   = [['welcome','preset_welcome'],['daily','preset_daily'],['vip','preset_vip']];
  const segments  = [['depositors','seg_depositors'],['all','seg_all'],['new','seg_new'],['vip','seg_vip'],['dormant','seg_dormant']];
  const freqs     = [['on_deposit','freq_on_deposit'],['daily','freq_daily'],['weekly','freq_weekly'],['one_time','freq_one_time']];
  return `
    <div class="card">
      <div class="card-title">${cfgT('wheel_setup')}</div>
      <div class="form-row">
        <label class="form-label">${cfgT('wheel_preset')}</label>
        <div class="chips">
          ${presets.map(([v,k])=>`<div class="chip${W.preset===v?' on':''}" onclick="wheelSetPreset('${v}')">${cfgT(k)}</div>`).join('')}
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('wheel_geo')}</label>
        <select class="form-input" onchange="wheelSetGeo(this.value)">${geoOpts}</select>
      </div>
      ${renderCurToggle('wheel')}
      <div class="form-row">
        <label class="form-label">${cfgT('wheel_segment')}</label>
        <div class="chips">
          ${segments.map(([v,k])=>`<div class="chip${W.segment===v?' on':''}" onclick="wheelSet('segment','${v}')">${cfgT(k)}</div>`).join('')}
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('wheel_freq')}</label>
        <div class="chips" style="flex-wrap:wrap">
          ${freqs.map(([v,k])=>`<div class="chip${W.frequency===v?' on':''}" onclick="wheelSet('frequency','${v}')">${cfgT(k)}</div>`).join('')}
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('wheel_players')}</label>
        <input class="form-input" type="number" value="${W.players}" min="100" step="100"
               onchange="wheelSetNum('players', this.value, 5000)">
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('wheel_avgdep')} (${cur})</label>
        <input class="form-input" type="number" value="${Math.round(W.avgDeposit * _wf)}" min="1" step="10"
               onchange="wheelSetAvgDep(this.value)">
      </div>
      <div class="form-row">
        <label class="form-label">${cfgT('wheel_wager')} — <span style="font-weight:700;color:var(--text)">${W.wager}×</span></label>
        <input type="range" min="0" max="60" step="5" value="${W.wager}"
               onchange="wheelSetNum('wager', this.value, 30)">
      </div>
    </div>
  `;
}

function renderWheelVisualCard(W) {
  const segs = W.segments || [];
  // Prize values are edited in the backend (site) currency directly — no display
  // conversion here, so crypto/high-divisor currencies don't round money to 0.
  const cur = geoOfType('wheel').cur;
  const total = segs.reduce((s,g)=>s+Math.max(0,g.weight),0) || 1;
  const inpStyle = 'width:100%;padding:4px 7px;font-size:12px;height:auto';
  const rows = segs.map((seg,i) => {
    const color = WHEEL_SEG_COLORS[seg.prizeType] || '#64748B';
    const pct = Math.round(Math.max(0,seg.weight)/total*100);
    const isMoney = seg.prizeType==='bonus_money'||seg.prizeType==='jackpot'||seg.prizeType==='physical';
    const unit = isMoney ? cur
      : seg.prizeType==='cashback'   ? '%'
      : seg.prizeType==='free_spins' ? 'FS'
      : seg.prizeType==='multiplier' ? '×' : '';
    let valCell;
    if (seg.prizeType==='nothing') {
      valCell = `<span style="color:var(--text2)">—</span>`;
    } else if (seg.prizeType==='cashback') {
      valCell = `<input class="form-input" style="${inpStyle}" type="number" min="0" max="100" step="1"
        value="${Math.round(seg.prizeValue*100)}" onchange="wheelSetSegVal(${i}, this.value, 'cashback')">`;
    } else {
      const step = isMoney ? '10' : seg.prizeType==='multiplier' ? '0.5' : '5';
      valCell = `<input class="form-input" style="${inpStyle}" type="number" min="0" step="${step}"
        value="${seg.prizeValue}" onchange="wheelSetSegVal(${i}, this.value)">`;
    }
    return `<tr>
      <td style="padding:5px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:6px;vertical-align:middle"></span>${cfgT('prize_'+seg.prizeType)}</td>
      <td style="padding:5px 6px"><div style="display:flex;align-items:center;gap:5px">${valCell}<span style="color:var(--text2);font-size:11px;flex-shrink:0;min-width:22px">${unit}</span></div></td>
      <td style="padding:5px 6px"><input class="form-input" style="${inpStyle}" type="number" min="0" step="1"
        value="${seg.weight}" onchange="wheelSetSegWeight(${i}, this.value)"></td>
      <td style="padding:5px 6px;text-align:right;color:var(--text2);font-size:12px">${pct}%</td>
    </tr>`;
  }).join('');
  return `
    <div class="card">
      <div class="card-title">${cfgT('wheel_visual')}</div>
      <div id="wheel-visual">${renderWheelSVG(segs)}</div>
      <table style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:12px;margin-top:12px">
        <colgroup><col style="width:38%"><col style="width:29%"><col style="width:19%"><col style="width:14%"></colgroup>
        <thead><tr style="color:var(--text2)">
          <th style="text-align:left;padding:4px 6px;font-weight:600;font-size:11px">${cfgT('wheel_seg_prize')}</th>
          <th style="text-align:left;padding:4px 6px;font-weight:600;font-size:11px">${cfgT('wheel_seg_value')}</th>
          <th style="text-align:left;padding:4px 6px;font-weight:600;font-size:11px">${cfgT('wheel_seg_weight')}</th>
          <th style="text-align:right;padding:4px 6px;font-weight:600;font-size:11px">${cfgT('wheel_seg_prob')}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ── Wheel state setters ─────────────────────────────────────────────────────
function wheelSetPreset(v) {
  CS.wheel.preset = v;
  CS.wheel.segments = null;  // force re-materialize from the new preset
  CS.wheel._segKey  = null;
  CS.wheel.frequency = (window._wheelEcon?.WHEEL_PRESETS[v]?.defaultFrequency) || CS.wheel.frequency;
  cfgRender();
}
function wheelSetGeo(v) {
  CS.wheel.geo = v;
  CS.wheel.curMode = 'local';
  cfgRender();
}
function wheelSet(key, val) {
  CS.wheel[key] = val;
  wheelSyncLocal();
  cfgRender();
}
function wheelSetNum(key, val, def) {
  CS.wheel[key] = +val || def;
  wheelSyncLocal();
  cfgRender();
}
function wheelSetAvgDep(val) {
  // Input is in display currency → store in backend (site) currency.
  CS.wheel.avgDeposit = Math.max(1, Math.round((+val || 100) / dispFactor('wheel')));
  CS.wheel.segments = null;  // rich-prize amounts are derived from avgDeposit
  CS.wheel._segKey  = null;
  cfgRender();
}
function wheelSetSegWeight(i, val) {
  const W = CS.wheel;
  if (!W.segments || !W.segments[i]) return;
  W.segments[i].weight = Math.max(0, +val || 0);
  wheelSyncLocal();
  cfgRender();
}
function wheelSetSegVal(i, val, kind) {
  const W = CS.wheel;
  if (!W.segments || !W.segments[i]) return;
  let v = Math.max(0, +val || 0);
  if (kind === 'cashback') v = Math.min(1, v / 100);   // percent → fraction
  W.segments[i].prizeValue = v;
  wheelSyncLocal();
  cfgRender();
}

// Recompute econ locally after a tweak so results react instantly (no API call).
function wheelSyncLocal() {
  const W = CS.wheel;
  if (!W.result) return;
  const econ = wheelComputeEcon(W);
  if (econ) {
    W.result.econ = econ;
    if (W.result.spec) W.result.spec.segments = W.segments;
  }
}

async function onGenerateWheel() {
  if (_generating) return;
  _generating = true;
  const btn = document.getElementById('btn-calculate');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  const W = CS.wheel;
  wheelEnsureSegments(W);
  const geo = cfgGeo(W.geo);
  const body = {
    params: {
      geo: W.geo, segment: W.segment, preset: W.preset, frequency: W.frequency,
      players: W.players, avgDeposit: W.avgDeposit,
      segments: W.segments, rtp: W.rtp / 100, wager: W.wager,
      lang: cfgLang(), tone: 'professional',
    }
  };
  try {
    const res = await fetch('/api/wheel/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    W.result = await res.json();
    // Keep the editable segments in sync with what the server materialized.
    if (W.result.spec?.segments) { W.segments = W.result.spec.segments; }
    CAI.wheel = { tab:'econ', audit:null, optimize:null, games:null, auditLoading:false, optimizeLoading:false, gamesLoading:false };
    cfgRender();
  } catch(e) {
    showToast('Error: ' + e.message, '#ef4444');
  } finally {
    _generating = false;
    const b = document.getElementById('btn-calculate');
    if (b) { b.disabled = false; b.textContent = cfgT(CS.wheel.result ? 'recalculate' : 'calculate'); }
  }
}

function renderWheelResults(W) {
  // Econ preview is always available (client mirror); AI tabs appear after Generate.
  const econRaw = W.result?.econ || wheelComputeEcon(W);
  if (!econRaw) return `<div class="ph" style="min-height:80px">${cfgT('ai_loading')}</div>`;
  const _wf  = dispFactor('wheel');
  const cur  = dispCurCode('wheel');
  const econ = window.GeoData.scaleFields(econRaw, _wf, WHEEL_ECON_MONEY);

  const net = econ.netResultMid || 0;
  const econCards = `
    <div class="econ-grid">
      ${econCard('', cfgT('wheel_ev'),        fmtCur(econ.evPerSpin||0, cur),      cfgT('wheel_per_spin'), '')}
      ${econCard('', cfgT('wheel_prog_cost'), fmtCur(econ.programCostMid||0, cur), cfgT('per_mo'), '')}
      ${econCard('', cfgT('wheel_ggr_uplift'),fmtCur(econ.ggrUpliftMid||0, cur),   cfgT('per_mo'), 'pos')}
      ${econCard('', cfgT('wheel_ret_value'), fmtCur(econ.retentionValue||0, cur), cfgT('per_mo'), 'pos')}
      ${econCard('', cfgT('wheel_net'),       fmtCur(net, cur),                    cfgT('per_mo'), net>=0?'pos':'neg')}
      ${econCard('', cfgT('wheel_roi'),       (econ.roi||0).toFixed(0)+'%',        cfgT('wheel_total_value'), (econ.roi||0)>=100?'pos':'neg')}
    </div>
  `;

  const hasResult = !!W.result;
  const tabsCard = hasResult ? `
    <div class="card">
      <div class="card-title" style="margin-bottom:10px">${cfgT('tab_audit')} & ${cfgT('tab_optimize')}</div>
      <div class="tab-row">
        ${['econ','audit','optimize','games','competitors'].map(tab=>`
          <button class="tab${CAI.wheel.tab===tab?' active':''}" onclick="wheelSetTab('${tab}')">${cfgT('tab_'+tab)}</button>
        `).join('')}
      </div>
      <div id="wheel-ai-content">${renderWheelAiContent(W)}</div>
    </div>
  ` : `<div class="card"><div class="ph" style="min-height:60px">${cfgT('wheel_ai_hint')}</div></div>`;

  return `
    <div class="results-hdr">
      <div class="results-title">${cfgT('tab_econ')}</div>
      <div class="results-actions">
        <button class="btn btn-sm btn-outline" onclick="cfgSaveWheel()">${cfgT('save_btn')}</button>
      </div>
    </div>
    ${econCards}
    ${renderWheelScenarioTable(econ, cur)}
    ${tabsCard}
  `;
}

function renderWheelScenarioTable(econ, cur) {
  const isRu = cfgLang() === 'ru';
  const th = s => `<th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border);font-weight:600;font-size:11px">${s}</th>`;
  const td = (v, bold, color) => `<td style="text-align:right;padding:8px;border-bottom:1px solid rgba(255,255,255,.04);${bold?'font-weight:700;':''}${color?'color:'+color+';':''}">${v}</td>`;
  const L = isRu
    ? { low:'🔴 Низкий', mid:'⚪ Ожидаемый', high:'🟢 Высокий', part:'Участники', cost:'Стоимость программы' }
    : { low:'🔴 Low', mid:'⚪ Expected', high:'🟢 High', part:'Participants', cost:'Program Cost' };
  return `
    <div class="card" style="margin:12px 0">
      <div class="card-title" style="margin-bottom:8px">${cfgT('wheel_scenarios')}</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="color:var(--text2)">
          <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);font-size:11px"></th>
          ${th(L.low)} ${th(L.mid)} ${th(L.high)}
        </tr></thead>
        <tbody>
          <tr>
            <td style="padding:8px;color:var(--text2);font-size:11px;border-bottom:1px solid rgba(255,255,255,.04)">${L.part}</td>
            ${td(fmtN(econ.participantsLow||0), false, null)} ${td(fmtN(econ.participantsMid||0), true, '#a0b0ff')} ${td(fmtN(econ.participantsHigh||0), false, null)}
          </tr>
          <tr>
            <td style="padding:8px;color:var(--text2);font-size:11px">${L.cost}</td>
            ${td(fmtCur(econ.programCostLow||0, cur), false, null)} ${td(fmtCur(econ.programCostMid||0, cur), true, '#a0b0ff')} ${td(fmtCur(econ.programCostHigh||0, cur), false, null)}
          </tr>
        </tbody>
      </table>
      <div class="econ-grid" style="margin-top:10px">
        ${econCard('', cfgT('wheel_cost_ratio'),  (econ.costRatio||0).toFixed(1)+'%',  cfgT('of_deposits'), '')}
        ${econCard('', cfgT('wheel_cost_active'),  fmtCur(econ.costPerActiveMid||0, cur), cfgT('per_player'), '')}
        ${econCard('', cfgT('wheel_max_risk'),     fmtCur(econ.maxRisk||0, cur),        cfgT('wheel_top_prize'), 'neg')}
        ${econCard('', cfgT('wheel_breakeven'),    fmtN(econ.breakEvenParticipants||0), isRu?'участн.':'players', '')}
      </div>
    </div>
  `;
}

function wheelSetTab(tab) {
  CAI.wheel.tab = tab;
  const el = document.getElementById('wheel-ai-content');
  if (el) el.innerHTML = renderWheelAiContent(CS.wheel);
  document.querySelectorAll('.tab-row .tab').forEach(t =>
    t.classList.toggle('active', t.getAttribute('onclick').includes(`'${tab}'`))
  );
}

function renderWheelAiContent(W) {
  const ai = CAI.wheel;
  if (ai.tab === 'econ') {
    const isRu = cfgLang() === 'ru';
    return `<div style="padding:12px 0;color:var(--text2);font-size:12px">${isRu
      ? 'Экономика колеса показана в карточках выше. Вкладки Audit и Optimize дают AI-оценку рисков и рекомендации.'
      : 'Wheel economics are shown in the cards above. The Audit and Optimize tabs give an AI risk review and recommendations.'}</div>`;
  }
  if (ai.tab === 'audit') {
    if (ai.auditLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.audit)        return aiCurNote('wheel') + renderAuditContent(ai.audit);
    return `<div class="ph" style="min-height:120px"><button class="btn btn-primary" onclick="runWheelAudit()">${cfgT('run_audit')}</button></div>`;
  }
  if (ai.tab === 'optimize') {
    if (ai.optimizeLoading) return loadingHtml(cfgT('ai_loading'));
    if (ai.optimize)        return aiCurNote('wheel') + renderOptimizeContent(ai.optimize);
    return `<div class="ph" style="min-height:120px"><button class="btn btn-primary" onclick="runWheelOptimize()">${cfgT('run_optimize')}</button></div>`;
  }
  if (ai.tab === 'games') return renderGamesTabContent('wheel');
  if (ai.tab === 'competitors') return renderCompetitorTabContent('wheel');
  return '';
}

async function runWheelAudit() {
  const W = CS.wheel;
  if (!W.result) return;
  CAI.wheel.auditLoading = true;
  document.getElementById('wheel-ai-content').innerHTML = loadingHtml(cfgT('ai_loading'));
  try {
    const res = await fetch('/api/wheel/audit', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ spec: W.result.spec, params: W.result.params, uiLang: cfgLang() }),
    });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message||`HTTP ${res.status}`); }
    CAI.wheel.audit = await res.json();
  } catch(e) { CAI.wheel.audit = { error: e.message }; }
  finally {
    CAI.wheel.auditLoading = false;
    document.getElementById('wheel-ai-content').innerHTML = renderWheelAiContent(W);
  }
}

async function runWheelOptimize() {
  const W = CS.wheel;
  if (!W.result) return;
  CAI.wheel.optimizeLoading = true;
  document.getElementById('wheel-ai-content').innerHTML = loadingHtml(cfgT('ai_loading'));
  try {
    const e = W.result.econ || {};
    const econPayload = {
      evPerSpin:e.evPerSpin, participantsMid:e.participantsMid, spinsPerParticipant:e.spinsPerParticipant,
      programCostMid:e.programCostMid, ggrUpliftMid:e.ggrUpliftMid, retentionValue:e.retentionValue,
      totalValueMid:e.totalValueMid, netResultMid:e.netResultMid, roi:e.roi, costRatio:e.costRatio,
      costPerActiveMid:e.costPerActiveMid, maxRisk:e.maxRisk, breakEvenParticipants:e.breakEvenParticipants,
    };
    const res = await fetch('/api/wheel/optimize', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ params: W.result.params, econ: econPayload, uiLang: cfgLang() }),
    });
    if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message||`HTTP ${res.status}`); }
    CAI.wheel.optimize = await res.json();
  } catch(e) { CAI.wheel.optimize = { error: e.message }; }
  finally {
    CAI.wheel.optimizeLoading = false;
    document.getElementById('wheel-ai-content').innerHTML = renderWheelAiContent(W);
  }
}

function cfgSaveWheel() {
  const W = CS.wheel;
  if (!W.result) return;
  const geo = cfgGeo(W.geo);
  const id  = genId();
  const entry = {
    id, type:'wheel', name:`Wheel · ${cfgT('preset_'+W.preset)} · ${geo.lbl} · ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    params: { ...W, result: undefined }, result: W.result,
  };
  saveCfgEntry(entry);
  showToast(cfgT('saved_toast'));
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
  // Silent add to Retention Calendar (merged Save + Add to Calendar)
  addToRCCalendar({
    type:'bonus', title:`Bonus · ${geo.lbl}`,
    sourceType:'bonus_configurator', savedId: id,
    econ: B.config.econ || {},
    params: { geo: B.geo, players: B.players, segment: B.segment },
    cur: geo.cur,
  }, { silent: true });
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
  // Silent add to Retention Calendar (merged Save + Add to Calendar)
  addToRCCalendar({
    type:'tournament', title:`Tournament · ${geo.lbl}`,
    sourceType:'tournament_configurator', savedId: id,
    econ: T.result.econ || {},
    params: T.result.params || {},
    cur: geo.cur,
  }, { silent: true });
  showToast(cfgT('saved_toast'));
  // Also save to savedTournaments for badge count
  try {
    const tourRec = { id, name: entry.name, createdAt: entry.createdAt, ...T.result };
    const arr = JSON.parse(localStorage.getItem('savedTournaments') || '[]');
    arr.push(tourRec);
    localStorage.setItem('savedTournaments', JSON.stringify(arr));
    // Mirror to the server too, else the tournament page's hydrate (which
    // overwrites savedTournaments from the server) would drop this entry.
    window.RetomatRepo?.mirror('tournaments', id, tourRec);
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
  // Also save to savedLoyaltyPrograms so it shows in the loyalty library and
  // feeds Reports/Forecast (mirror to server too, else hydrate would drop it).
  try {
    const loyRec = { id, name: entry.name, createdAt: entry.createdAt,
      params: { region: LY.region, segment: LY.segment }, result: LY.result };
    const arr = JSON.parse(localStorage.getItem('savedLoyaltyPrograms') || '[]');
    arr.push(loyRec);
    localStorage.setItem('savedLoyaltyPrograms', JSON.stringify(arr));
    window.RetomatRepo?.mirror('loyalty-programs', id, loyRec);
    if (typeof updateAllBadges === 'function') updateAllBadges();
  } catch(e){}
  // Silent add to Retention Calendar (merged Save + Add to Calendar)
  addToRCCalendar({
    type:'vip', title:`Loyalty · ${LY.mode}`,
    sourceType:'loyalty_configurator', savedId: id,
    econ: LY.result.econ || {},
    params: { mode: LY.mode, region: LY.region },
    cur: 'USD',
  }, { silent: true });
  showToast(cfgT('saved_toast'));
}

function saveCfgEntry(entry) {
  try {
    const arr = JSON.parse(localStorage.getItem('cfgSaved') || '[]');
    arr.unshift(entry);
    localStorage.setItem('cfgSaved', JSON.stringify(arr.slice(0,50)));
    window.RetomatRepo?.mirror('configs', entry.id, entry);
  } catch(e){}
}

function addToRCCalendar(data, opts = {}) {
  const silent = !!(opts && opts.silent); // silent = called from Save: no toast
  try {
    // Schedule on the upcoming Mon–Sun week — same logic as the generators.
    // IMPORTANT: the calendar reads startDate/endDate (NOT start/end); the old
    // start/end names left the event dateless, so it never rendered.
    const now    = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() + (now.getDay() === 0 ? 1 : 8 - now.getDay()));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    const startDate = monday.toISOString().slice(0, 10);
    const endDate   = sunday.toISOString().slice(0, 10);
    const p = data.params || {};
    const seg = p.segment || 'all';
    const geo = p.geo || p.region || data.geo || '';
    const camps = JSON.parse(localStorage.getItem('rc_campaigns') || '[]');
    // Dedup: a silent Save shouldn't pile up identical calendar events for the
    // same promo (same sourceType + geo + segment + type).
    const dupe = camps.find(c =>
      c.sourceType === data.sourceType &&
      (c.geo || '') === geo &&
      (c.segment || 'all') === seg &&
      c.type === data.type
    );
    if (dupe && silent) return true;
    const entry = {
      id: genId(),
      savedId: data.savedId || null,
      title: data.title,
      type: data.type,
      segment: seg,
      geo,
      status: 'draft',
      sourceType: data.sourceType,
      startDate,
      endDate,
      econ: data.econ,
      params: data.params,
      cur: data.cur,
      createdAt: new Date().toISOString(),
    };
    camps.push(entry);
    localStorage.setItem('rc_campaigns', JSON.stringify(camps));
    window.RetomatRepo?.mirror('calendar-events', entry.id, entry);
    if (!silent) showToast(cfgT('calendar_toast'));
    return true;
  } catch(e){ return false; }
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
  // This classic script runs during parsing — BEFORE the deferred ESM helpers
  // (bonus-benchmarks.js sets window.RetomatBenchmarks). Deferred modules execute before
  // DOMContentLoaded, so re-render once then so the benchmark bands populate (empty on the
  // first pass if the module wasn't ready). Harmless: init state is idempotent.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => cfgRender(), { once: true });
  }
})();
