const GEO_OPTIONS = [
  { val:'de', lbl:'🇩🇪 Germany (EUR)' },
  { val:'fr', lbl:'🇫🇷 France (EUR)' },
  { val:'es', lbl:'🇪🇸 Spain (EUR)' },
  { val:'it', lbl:'🇮🇹 Italy (EUR)' },
  { val:'nl', lbl:'🇳🇱 Netherlands (EUR)' },
  { val:'dk', lbl:'🇩🇰 Denmark (DKK)' },
  { val:'uk', lbl:'🇬🇧 UK (GBP)' },
  { val:'ru', lbl:'🇷🇺 Russia (RUB)' },
  { val:'kz', lbl:'🇰🇿 Kazakhstan (KZT)' },
  { val:'mn', lbl:'🇲🇳 Mongolia (MNT)' },
  { val:'us', lbl:'🇺🇸 USA Sweepstakes' },
  { val:'br', lbl:'🇧🇷 Brazil (USD)' },
  { val:'mx', lbl:'🇲🇽 Mexico (USD)' },
  { val:'co', lbl:'🇨🇴 Colombia (USD)' },
  { val:'ar', lbl:'🇦🇷 Argentina (USD)' },
  { val:'pe', lbl:'🇵🇪 Peru (USD)' },
  { val:'cl', lbl:'🇨🇱 Chile (USD)' },
];

const TOURNAMENT_TYPES = [
  { val:'slot',       icon:'🎰', name:'Slots',      desc:'Leaderboard based on slot performance' },
  { val:'live',       icon:'🃏', name:'Live Casino',desc:'Live table game tournament' },
  { val:'mixed',      icon:'🎲', name:'Mixed',      desc:'Slots + live games combined' },
  { val:'prize_drop', icon:'💎', name:'Prize Drop', desc:'Random prizes during gameplay' },
];

const ENTRY_MODELS = [
  { val:'freeroll', lbl:'Freeroll' },
  { val:'buyin',    lbl:'Buy-in' },
  { val:'ticket',   lbl:'Ticket' },
];

const SCORING = [
  { val:'total_wins',         lbl:'Total Wins' },
  { val:'highest_multiplier', lbl:'Highest Multiplier' },
  { val:'most_spins',         lbl:'Most Spins' },
  { val:'mission_based',      lbl:'Mission-Based' },
];

const DURATIONS = [
  { val:'flash',       lbl:'Flash (< 1h)' },
  { val:'daily',       lbl:'Daily' },
  { val:'weekly',      lbl:'Weekly' },
  { val:'monthly',     lbl:'Monthly' },
  { val:'multi_round', lbl:'Multi-Round' },
];

const POOL_MODELS = [
  { val:'fixed',   lbl:'Fixed', desc:'Guaranteed pool, operator bears risk' },
  { val:'dynamic', lbl:'Dynamic', desc:'Pool grows from player rake/fees' },
  { val:'hybrid',  lbl:'Hybrid', desc:'Guaranteed base + rake contribution' },
];

const DISTRIBUTIONS = [
  { val:'top_n',        lbl:'Top N' },
  { val:'linear_decay', lbl:'Linear Decay' },
  { val:'flat_tier',    lbl:'Flat Tier' },
  { val:'prize_drop',   lbl:'Prize Drop' },
];

const REENTRY = [
  { val:'single',    lbl:'Single Entry' },
  { val:'rebuy',     lbl:'Rebuy Allowed' },
  { val:'unlimited', lbl:'Unlimited' },
];

const SEGMENTS = [
  { val:'all',        lbl:'All Players' },
  { val:'depositors', lbl:'Depositors' },
  { val:'new',        lbl:'New Players' },
  { val:'vip',        lbl:'VIP' },
  { val:'dormant',    lbl:'Dormant' },
];

let _tgCurrentView = 'list';

function setTournLang(lang) {
  try { localStorage.setItem('bonusLang', lang); } catch(e) {}
  document.querySelectorAll('.lt-btn').forEach(b => b.classList.toggle('active', b.id === 'lt-' + lang));
  applyNavLang(lang);
  if (_tgCurrentView === 'list') showView('list');
  else if (_tgCurrentView === 'detail') showView('detail', detailId);
  else if (_tgCurrentView === 'setup') showView('setup');
  else if (hasActiveGenerator && step > 0) renderStep();
}

// ── TRANSLATION DICTIONARY ───────────────────────────────────────────────────
const TG = {
  en: {
    wiz_type:'Type', wiz_params:'Parameters', wiz_economics:'Economics', wiz_texts:'Texts & Audit',
    step_of: (n) => `Step ${n} of 4`,
    topbar_list:'Tournaments', topbar_setup:'Setup Guide', topbar_gen:'Tournament Generator',
    s1_badge:'Step 1 / 4', s1_title:'Select Tournament Type', s1_sub:'Choose the game type for your tournament', s1_next:'Configure Parameters →',
    s2_badge:'Step 2 / 4', s2_title:'Tournament Parameters', s2_sub:'Configure geo, mechanics, and prize pool',
    geo_title:'Geography & Audience', geo_market:'Market / GEO', geo_currency:'Currency', geo_segment:'Segment',
    geo_total:'Total Active Players in Casino', geo_allplayers:'All players', geo_eligible:'Eligible', geo_pct_base:'% of base',
    entry_title:'Entry & Scoring', entry_model:'Entry Model', scoring_lbl:'Scoring Method', reentry_lbl:'Re-entry',
    prize_title:'Prize Pool & Duration', duration_lbl:'Duration', prize_lbl:'Prize Pool Amount',
    your_pool:'Your pool', recommended:'Recommended',
    pool_model:'Pool Model', rake_lbl:'Rake % (player contributions)', distribution:'Prize Distribution',
    lang_title:'Language & Tone', lang_lbl:'Language', tone_lbl:'Tone',
    btn_back:'← Back', btn_generate:'Generate Tournament Spec →',
    s3_badge:'Step 3 / 4', s3_title:'Tournament Spec & Economics', s3_sub:'Prize distribution and projected ROI',
    summary_title:'Tournament Summary',
    field_type:'Type:', field_dur:'Duration:', field_entry:'Entry:', field_scoring:'Scoring:',
    field_pool:'Pool model:', field_reentry:'Re-entry:', field_prize:'Prize pool:', field_dist:'Distribution:', field_roi:'ROI:',
    breakeven_hint: (n) => `Break-even: ${n} participants at 30% GGR lift`,
    prize_dist: (cur, pool) => `Prize Distribution (${cur} ${pool} pool)`,
    econ_title:'Economic Scenarios',
    low_lbl: (p) => `Low (${p} participation)`,
    exp_lbl: (p) => `Expected (${p} participation)`,
    high_lbl: (p) => `High (${p} participation)`,
    players_ggr: (pl, lift) => `${pl} players · GGR: +${lift}`,
    cost_active: (cpp) => `Cost/active: ${cpp}`,
    total_val:'Total value (expected)', ggr_plus_ret:'GGR lift + post-tournament retention',
    engagement_lbl:'Engagement', vs_normal:'vs normal play',
    retention_val:'Retention value', uplift:'next-month uplift',
    full_roi:'Full ROI', on_prize:'on prize pool',
    eligible_note: (el, seg, pct, total, arpu, eng) => `Based on ${el} eligible ${seg} players (${pct}% of ${total} total casino players) · ARPU ${arpu} USD/mo · engagement ×${eng} vs normal play`,
    guide_ready:'Setup Guide ready', guide_view_sub:'View the detailed setup guide for this tournament', view_guide:'View Guide →',
    btn_reconfig:'← Reconfigure', btn_save:'💾 Save', btn_calendar:'📅 Add to Calendar',
    btn_pdf:'⬇ PDF', btn_ai_texts:'Generate AI Texts →',
    s4_badge:'Step 4 / 4', s4_title:'AI Texts & Compliance', s4_sub:'Generate CRM copy, an offer description and a compliance audit for your tournament',
    btn_gen_texts:'🤖 Generate CRM Texts', btn_regen_texts:'↺ Regenerate Texts',
    btn_gen_desc:'📄 Generate Description', btn_regen_desc:'↺ Regenerate Description',
    desc_note:'Tournament terms are computed from the configuration — exact, not AI-written. AI writes the description copy only.',
    desc_hint:'For the tournament / promo page', desc_how:'How it works', desc_tc:'Terms & Conditions', desc_copy:'Copy',
    btn_audit_lbl:'🔍 Compliance Audit', btn_reaudit:'↺ Re-run Audit',
    btn_back_spec:'← Back to Spec', btn_start_over:'Start Over',
    crm_copy:'CRM Copy', audit_title:'Compliance Audit', recommendations:'Recommendations',
    list_title:'Tournaments', list_lib_title:'Your Tournament Library',
    list_empty:'No tournaments saved yet',
    list_empty_sub:'Generate a tournament and click "Save" to build your library.',
    list_create:'Create a Tournament →',
    list_saved: (n) => `${n} saved`,
    list_hdr_name:'Name', list_hdr_prize:'Prize pool', list_hdr_roi:'ROI', list_hdr_date:'Date',
    list_new:'+ New Tournament',
    det_back:'← Tournaments', det_saved: (d) => `Saved ${d}`,
    det_not_found:'Tournament not found.',
    det_setup_guide:'📋 Setup Guide →', det_ai_texts:'✦ AI Texts', det_delete:'🗑 Delete',
    toast_saved:'Tournament saved to your library', toast_deleted:'Tournament deleted',
    confirm_delete:'Delete this tournament from your library?',
    type_names: { slot:'Slots', live:'Live Casino', mixed:'Mixed', prize_drop:'Prize Drop' },
    type_descs: { slot:'Leaderboard based on slot performance', live:'Live table game tournament', mixed:'Slots + live games combined', prize_drop:'Random prizes during gameplay' },
    entry_labels: { freeroll:'Freeroll', buyin:'Buy-in', ticket:'Ticket' },
    scoring_labels: { total_wins:'Total Wins', highest_multiplier:'Highest Multiplier', most_spins:'Most Spins', mission_based:'Mission-Based' },
    duration_labels: { flash:'Flash (< 1h)', daily:'Daily', weekly:'Weekly', monthly:'Monthly', multi_round:'Multi-Round' },
    pool_labels: { fixed:'Fixed', dynamic:'Dynamic', hybrid:'Hybrid' },
    pool_descs: { fixed:'Guaranteed pool, operator bears risk', dynamic:'Pool grows from player rake/fees', hybrid:'Guaranteed base + rake contribution' },
    dist_labels: { top_n:'Top N', linear_decay:'Linear Decay', flat_tier:'Flat Tier', prize_drop:'Prize Drop' },
    reentry_labels: { single:'Single Entry', rebuy:'Rebuy Allowed', unlimited:'Unlimited' },
    seg_labels: { all:'All Players', depositors:'Depositors', new:'New Players', vip:'VIP', dormant:'Dormant' },
    param_labels: { duration:'Duration', poolModel:'Prize Pool Model', segment:'Target Segment', prizePool:'Prize Pool', distribution:'Prize Distribution', entryModel:'Entry Model', scoring:'Scoring Method', reentry:'Re-entry', totalPlayers:'Total Players', rake:'Rake %', geo:'Market', currency:'Currency', lang:'Language', tone:'Tone' },
    spec_copy_title:'Technical Specification', spec_copy_sub:'Ready to paste into admin setup task or ticket', spec_copy_btn:'Copy', spec_copy_done:'Copied!',
  },
  ru: {
    wiz_type:'Тип', wiz_params:'Параметры', wiz_economics:'Экономика', wiz_texts:'Тексты и аудит',
    step_of: (n) => `Шаг ${n} из 4`,
    topbar_list:'Турниры', topbar_setup:'Гайд по настройке', topbar_gen:'Генератор турниров',
    s1_badge:'Шаг 1 / 4', s1_title:'Выбор типа турнира', s1_sub:'Выберите тип игр для вашего турнира', s1_next:'Настроить параметры →',
    s2_badge:'Шаг 2 / 4', s2_title:'Параметры турнира', s2_sub:'Гео, механика и призовой фонд',
    geo_title:'География и аудитория', geo_market:'Рынок / GEO', geo_currency:'Валюта', geo_segment:'Сегмент',
    geo_total:'Всего активных игроков в казино', geo_allplayers:'Все игроки', geo_eligible:'Подходящие', geo_pct_base:'% от базы',
    entry_title:'Вход и скоринг', entry_model:'Модель входа', scoring_lbl:'Метод скоринга', reentry_lbl:'Повторный вход',
    prize_title:'Призовой фонд и длительность', duration_lbl:'Длительность', prize_lbl:'Размер призового фонда',
    your_pool:'Ваш фонд', recommended:'Рекомендовано',
    pool_model:'Модель фонда', rake_lbl:'Рейк % (взносы игроков)', distribution:'Распределение призов',
    lang_title:'Язык и тон', lang_lbl:'Язык', tone_lbl:'Тон',
    btn_back:'← Назад', btn_generate:'Сгенерировать спецификацию →',
    s3_badge:'Шаг 3 / 4', s3_title:'Спецификация и экономика', s3_sub:'Распределение призов и прогнозный ROI',
    summary_title:'Сводка по турниру',
    field_type:'Тип:', field_dur:'Длительность:', field_entry:'Вход:', field_scoring:'Скоринг:',
    field_pool:'Модель фонда:', field_reentry:'Повторный вход:', field_prize:'Призовой фонд:', field_dist:'Распределение:', field_roi:'ROI:',
    breakeven_hint: (n) => `Безубыток: ${n} участников при GGR-лифте 30%`,
    prize_dist: (cur, pool) => `Распределение призов (фонд ${cur} ${pool})`,
    econ_title:'Экономические сценарии',
    low_lbl: (p) => `Низкий (${p} участие)`,
    exp_lbl: (p) => `Ожидаемый (${p} участие)`,
    high_lbl: (p) => `Высокий (${p} участие)`,
    players_ggr: (pl, lift) => `${pl} игр. · GGR: +${lift}`,
    cost_active: (cpp) => `Стоимость/акт.: ${cpp}`,
    total_val:'Суммарная ценность (ожидаемая)', ggr_plus_ret:'GGR-лифт + удержание после турнира',
    engagement_lbl:'Вовлечённость', vs_normal:'vs обычная игра',
    retention_val:'Ценность удержания', uplift:'прирост след. месяца',
    full_roi:'Полный ROI', on_prize:'на призовой фонд',
    eligible_note: (el, seg, pct, total, arpu, eng) => `Расчёт: ${el} подходящих игроков (${seg}), ${pct}% из ${total} всего · ARPU ${arpu} USD/мес · ×${eng} vs обычная игра`,
    guide_ready:'Гайд по настройке готов', guide_view_sub:'Просмотр подробного гайда для этого турнира', view_guide:'Открыть гайд →',
    btn_reconfig:'← Переконфигурировать', btn_save:'💾 Сохранить', btn_calendar:'📅 Добавить в календарь',
    btn_pdf:'⬇ PDF', btn_ai_texts:'Сгенерировать AI тексты →',
    s4_badge:'Шаг 4 / 4', s4_title:'AI тексты и compliance', s4_sub:'Генерация CRM-копии, описания оффера и аудит соответствия требованиям',
    btn_gen_texts:'🤖 Сгенерировать CRM тексты', btn_regen_texts:'↺ Перегенерировать тексты',
    btn_gen_desc:'📄 Сгенерировать описание', btn_regen_desc:'↺ Пересоздать описание',
    desc_note:'Условия турнира рассчитаны из конфигурации — точные, без AI. AI пишет только текст описания.',
    desc_hint:'Для страницы турнира / промо-страницы', desc_how:'Как это работает', desc_tc:'Правила и условия (T&C)', desc_copy:'Копировать',
    btn_audit_lbl:'🔍 Аудит соответствия', btn_reaudit:'↺ Повторный аудит',
    btn_back_spec:'← К спецификации', btn_start_over:'Начать заново',
    crm_copy:'CRM копия', audit_title:'Аудит соответствия', recommendations:'Рекомендации',
    list_title:'Турниры', list_lib_title:'Библиотека турниров',
    list_empty:'Турниров пока нет',
    list_empty_sub:'Создайте турнир и нажмите «Сохранить», чтобы наполнить библиотеку.',
    list_create:'Создать турнир →',
    list_saved: (n) => `${n} сохранено`,
    list_hdr_name:'Название', list_hdr_prize:'Призовой фонд', list_hdr_roi:'ROI', list_hdr_date:'Дата',
    list_new:'+ Новый турнир',
    det_back:'← Турниры', det_saved: (d) => `Сохранено ${d}`,
    det_not_found:'Турнир не найден.',
    det_setup_guide:'📋 Гайд по настройке →', det_ai_texts:'✦ AI тексты', det_delete:'🗑 Удалить',
    toast_saved:'Турнир сохранён в библиотеке', toast_deleted:'Турнир удалён',
    confirm_delete:'Удалить этот турнир из библиотеки?',
    type_names: { slot:'Слоты', live:'Живое казино', mixed:'Смешанный', prize_drop:'Рандомные призы' },
    type_descs: { slot:'Рейтинг по результатам в слотах', live:'Турнир на живых столах', mixed:'Слоты + живые игры', prize_drop:'Случайные призы в процессе игры' },
    entry_labels: { freeroll:'Фриролл', buyin:'Байин', ticket:'Тикет' },
    scoring_labels: { total_wins:'Всего побед', highest_multiplier:'Макс. множитель', most_spins:'Макс. спинов', mission_based:'Миссии' },
    duration_labels: { flash:'Флэш (< 1ч)', daily:'Дневной', weekly:'Недельный', monthly:'Месячный', multi_round:'Мульти-раунд' },
    pool_labels: { fixed:'Фиксированный', dynamic:'Динамический', hybrid:'Гибридный' },
    pool_descs: { fixed:'Гарантированный фонд, оператор несёт риск', dynamic:'Фонд растёт за счёт рейка игроков', hybrid:'Гарантированная база + рейк' },
    dist_labels: { top_n:'Топ-N', linear_decay:'Линейный спад', flat_tier:'Плоские тиры', prize_drop:'Рандомный приз' },
    reentry_labels: { single:'Одиночный', rebuy:'Ребай разрешён', unlimited:'Неограниченно' },
    seg_labels: { all:'Все игроки', depositors:'Депозиторы', new:'Новые', vip:'VIP', dormant:'Дормантные' },
    param_labels: { duration:'Длительность', poolModel:'Модель призового фонда', segment:'Целевой сегмент', prizePool:'Призовой фонд', distribution:'Распределение призов', entryModel:'Модель входа', scoring:'Метод скоринга', reentry:'Повторный вход', totalPlayers:'Кол-во игроков', rake:'Рейк %', geo:'Рынок', currency:'Валюта', lang:'Язык', tone:'Тон' },
    spec_copy_title:'Техническое задание', spec_copy_sub:'Готово для вставки в ТХ или тикет на настройку', spec_copy_btn:'Копировать', spec_copy_done:'Скопировано!',
  },
};

function tg(key, ...args) {
  const lang = localStorage.getItem('bonusLang') || 'en';
  const dict = TG[lang] || TG.en;
  const val  = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : (TG.en[key] ?? key);
  return typeof val === 'function' ? val(...args) : val;
}

let step            = 1;
let detailId        = null;
let hasActiveGenerator = false;

const draft = {
  type: 'slot',
  params: {
    geo:          'de',
    currency:     'EUR',
    lic:          'auto',
    segment:      'all',
    totalPlayers: 5000,
    entryModel:   'freeroll',
    scoring:      'total_wins',
    duration:     'weekly',
    prizePool:    1000,
    poolModel:    'fixed',
    rake:         10,
    distribution: 'top_n',
    reentry:      'single',
    lang:         'en',
    tone:         'professional',
  },
};
let lastResult   = null;
let lastTexts    = null;
let lastAudit    = null;
let lastDesc     = null;
let lastOptimize = null;
let activeTab    = 'push';
let activeAudit  = false;

// ── BALANCE / UNDO STATE ─────────────────────────────────────────────────────
let _tgUndoStack    = null;  // { params, econ } — 1-step undo
let _tgPrevEcon     = null;  // econ before last apply (for delta rendering)
let _tgLastOptRecs  = [];    // last optimize recommendations

// ── LOCALSTORAGE HELPERS ─────────────────────────────────────────────────────
function loadTournaments() {
  try { return JSON.parse(localStorage.getItem('savedTournaments') || '[]'); } catch { return []; }
}
function saveTournaments(list) {
  localStorage.setItem('savedTournaments', JSON.stringify(list));
}
function genId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function autoName(type, params) {
  const typeLabel = { slot:'Slots', live:'Live Casino', mixed:'Mixed', prize_drop:'Prize Drop' };
  const geo = (params.geo || '').toUpperCase();
  const lic = (params.lic || 'none').toUpperCase();
  return `${typeLabel[type] || type} · ${geo}/${lic}`;
}

// ── GAME RECOMMENDATIONS STATE ───────────────────────────────────────────────

let _gamesData    = null;  // { geo, segment, type, scoring, result }
let _gamesLoading = false;

function _gamesParamsKey() {
  const p = draft.params;
  return `${p.geo}|${p.segment}|${draft.type}|${p.scoring}`;
}

async function fetchGamesIfNeeded() {
  if (_gamesLoading) return;
  const p = draft.params;
  const key = _gamesParamsKey();
  if (_gamesData && _gamesData._key === key) return;   // cache hit

  _gamesLoading = true;
  const el = document.getElementById('games-recommend-block');
  if (el) el.innerHTML = renderGamesLoadingHTML();

  try {
    const res = await fetch('/api/tournament/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geo: p.geo, segment: p.segment, type: draft.type, scoring: p.scoring, uiLang: localStorage.getItem('bonusLang') || 'en' }),
    });
    if (!res.ok) throw new Error('fetch failed');
    _gamesData = { _key: key, result: await res.json() };
  } catch(e) {
    _gamesData = { _key: key, result: null };
  }
  _gamesLoading = false;
  const block = document.getElementById('games-recommend-block');
  if (block) block.innerHTML = renderGamesBlockHTML();
}

const VOL_COLOR = { low: '#10b981', mid: '#f59e0b', high: '#ef4444' };
const MECH_LABEL = { slot: 'Slot', crash: 'Crash', live: 'Live', table: 'Table' };

function renderGamesLoadingHTML() {
  return `<div class="loader" style="justify-content:center;padding:18px 0">
    <div class="spinner"></div>
    <span>Loading recommendations…</span>
  </div>`;
}

// Games are generated on demand (button), not auto-fetched on step entry.
function renderGamesStartHTML() {
  const isRu = (localStorage.getItem('bonusLang') || 'en') === 'ru';
  return `<div style="padding:6px 0">
    <button class="btn btn-outline btn-sm" onclick="fetchGamesIfNeeded()">🎮 ${isRu ? 'Подобрать игры' : 'Recommend games'}</button>
    <div style="font-size:.72rem;color:var(--muted);margin-top:6px">${isRu ? 'AI подберёт игры под сегмент, регион и механику турнира' : 'AI picks games for this segment, region & tournament mechanics'}</div>
  </div>`;
}

function renderGamesBlockHTML() {
  const lang = localStorage.getItem('bonusLang') || 'en';
  const isRu = lang === 'ru';

  const labels = {
    title:    isRu ? 'Рекомендуемые игры' : 'Recommended Games',
    sub:      isRu ? 'Подходят для данного сегмента, региона и механики турнира' : 'Best fit for this segment, region & tournament mechanics',
    primary:  isRu ? 'Основной пул' : 'Primary Pool',
    alt:      isRu ? 'Альтернативы' : 'Alternatives',
    noGames:  isRu ? 'Нет подходящих игр для выбранных параметров' : 'No matching games for selected parameters',
    aiNote:   isRu ? 'AI-предложение — проверьте соответствие вашему каталогу' : 'AI draft — verify against your actual game catalog',
    rtp:      'RTP',
    vol:      isRu ? 'Волатильность' : 'Vol',
  };

  if (!_gamesData || !_gamesData.result) {
    return `<div class="alert alert-warn">${isRu ? 'Не удалось загрузить рекомендации' : 'Could not load recommendations'}</div>`;
  }

  const { primary, alternatives, rationale } = _gamesData.result;

  if (!primary || primary.length === 0) {
    return `<div style="color:var(--muted);font-size:.82rem;padding:12px 0">${labels.noGames}</div>`;
  }

  function gameCard(g, showWhy) {
    const volColor = VOL_COLOR[g.volatility] || 'var(--muted)';
    const mechLbl  = MECH_LABEL[g.mechanic] || g.mechanic;
    const why = showWhy && g.why ? `<div style="font-size:.72rem;color:var(--muted);margin-top:5px;line-height:1.4">💡 ${g.why}</div>` : '';
    return `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px">
        <div style="font-size:.82rem;font-weight:600;color:var(--text)">${g.name}</div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <span style="font-size:.65rem;font-weight:700;padding:1px 6px;border-radius:4px;background:rgba(79,110,247,.15);color:#a0b0ff">${mechLbl}</span>
          <span style="font-size:.65rem;font-weight:700;padding:1px 6px;border-radius:4px;background:${volColor}20;color:${volColor}">${g.volatility}</span>
        </div>
      </div>
      <div style="font-size:.73rem;color:var(--muted)">${g.provider} · ${labels.rtp} ${g.rtp}%</div>
      ${why}
    </div>`;
  }

  const hasAI = rationale || primary.some(g => g.why);
  const disclaimer = hasAI
    ? `<div style="background:rgba(79,110,247,.08);border:1px solid rgba(79,110,247,.2);border-radius:7px;padding:7px 11px;font-size:.73rem;color:#a0b0ff;margin-bottom:10px">ℹ️ ${labels.aiNote}</div>`
    : '';

  const rationaleHtml = rationale
    ? `<div style="font-size:.78rem;color:var(--muted);line-height:1.55;margin-bottom:10px">${rationale}</div>`
    : '';

  const altHtml = alternatives && alternatives.length > 0
    ? `<details style="margin-top:10px">
        <summary style="font-size:.75rem;font-weight:600;color:var(--muted);cursor:pointer;user-select:none">${labels.alt} (${alternatives.length})</summary>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px">
          ${alternatives.map(g => gameCard(g, false)).join('')}
        </div>
      </details>`
    : '';

  return `
    ${disclaimer}
    ${rationaleHtml}
    <div style="font-size:.75rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:7px">${labels.primary} (${primary.length})</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
      ${primary.map(g => gameCard(g, true)).join('')}
    </div>
    ${altHtml}`;
}

// Render games block from already-fetched data (for Detail and Setup Guide views)
function gamesSectionFromData(gamesResult) {
  if (!gamesResult) return '';
  const lang = localStorage.getItem('bonusLang') || 'en';
  const isRu = lang === 'ru';
  const title = isRu ? 'Рекомендуемые игры' : 'Recommended Games';
  const sub   = isRu ? 'Подобраны под сегмент, регион и механику турнира' : 'Selected for this segment, region & tournament mechanics';
  const prev = _gamesData;
  _gamesData = { _key: '__static__', result: gamesResult };
  const html = renderGamesBlockHTML();
  _gamesData = prev;
  return `<div class="card" style="margin-bottom:16px">
    <div class="card-title" style="margin-bottom:4px">${title}</div>
    <div style="font-size:.75rem;color:var(--muted);margin-bottom:12px">${sub}</div>
    ${html}
  </div>`;
}

function gamesSection() {
  const lang = localStorage.getItem('bonusLang') || 'en';
  const isRu = lang === 'ru';
  const title = isRu ? 'Рекомендуемые игры' : 'Recommended Games';
  const sub   = isRu ? 'Подходят для этого сегмента и механики' : 'Best fit for this segment & mechanics';
  const inner = _gamesData && _gamesData._key === _gamesParamsKey()
    ? renderGamesBlockHTML()
    : renderGamesStartHTML();
  return `<div class="card" style="margin-bottom:16px">
    <div class="card-title" style="margin-bottom:4px">${title}</div>
    <div style="font-size:.75rem;color:var(--muted);margin-bottom:12px">${sub}</div>
    <div id="games-recommend-block">${inner}</div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────

function wizProgressHTML(current) {
  const WIZ_STEP_LABELS = [tg('wiz_type'), tg('wiz_params'), tg('wiz_economics'), tg('wiz_texts')];
  return `<div class="wiz-progress">
    ${WIZ_STEP_LABELS.map((lbl, i) => {
      const n = i + 1;
      const done   = n < current;
      const active = n === current;
      const conn   = i < WIZ_STEP_LABELS.length - 1
        ? `<div class="wp-conn${done ? ' done' : ''}"></div>` : '';
      return `<div class="wp-step">
        <div class="wp-circle${done ? ' done' : active ? ' active' : ''}">${done ? '✓' : n}</div>
        <div class="wp-lbl${active ? ' active' : ''}">${lbl}</div>
      </div>${conn}`;
    }).join('')}
  </div>`;
}

function goStep(n) {
  step = n;
  hasActiveGenerator = true;
  _tgCurrentView = 'generator';
  document.getElementById('topbar-step').textContent = tg('step_of', n);
  setSidebarActive('nav-tournament');
  renderStep();
}

function renderStep() {
  const c = document.getElementById('content');
  if      (step === 1) c.innerHTML = renderStep1();
  else if (step === 2) c.innerHTML = renderStep2();
  else if (step === 3) c.innerHTML = renderStep3();
  else if (step === 4) c.innerHTML = renderStep4();
  // Games are generated on demand (button in gamesSection) — no auto-fetch on step 3.
}

function setSidebarActive(id) {
  document.querySelectorAll('.sb-nav .nav-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function showSetupGuide() { showView('setup'); }

function showView(view, id) {
  const c  = document.getElementById('content');
  const tb = document.getElementById('topbar-step');
  _tgCurrentView = view;
  if (view === 'list') {
    tb.textContent = tg('topbar_list');
    const fromTournGen = new URLSearchParams(location.search).get('view') === 'list';
    setSidebarActive(fromTournGen ? 'nav-tourn-gen' : 'nav-tournament');
    c.innerHTML = renderList();
  } else if (view === 'detail') {
    detailId = id;
    const t = loadTournaments().find(t => t.id === id);
    tb.textContent = t ? t.name : tg('topbar_list');
    setSidebarActive('nav-tourn-gen');
    c.innerHTML = renderDetail(id);
  } else if (view === 'setup' || view === 'generator') {
    if (view === 'setup') {
      tb.textContent = tg('topbar_setup');
      setSidebarActive('nav-setup-guide');
      c.innerHTML = renderSetupGuide();
    } else {
      if (!draft.type) draft.type = 'slot';
      if (!draft.params) draft.params = { segment: 'all', totalPlayers: 5000, currency: 'EUR' };
      if (!draft.params.currency) draft.params.currency = GEO_TO_CUR_UI[draft.params.geo || 'de'] || 'EUR';
      if (step === 0) step = 1;
      tb.textContent = tg('topbar_gen');
      setSidebarActive('nav-tourn-gen');
      renderStep();
    }
  }
  updateNavBadge();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── PLAYER ELIGIBILITY HELPERS ───────────────────────────────────────────────
const SEGMENT_RATIO_UI = {
  all: 1.00, new: 0.20, vip: 0.10, dormant: 0.40, depositors: 0.60,
};

// ── PRIZE POOL RECOMMENDATION ─────────────────────────────────────────────────
const GEO_TO_REGION_UI = {
  de:'eu', fr:'eu', es:'eu', it:'eu', nl:'eu', dk:'eu', uk:'eu',
  ru:'cis', kz:'cis', mn:'mn', us:'sweep', mx:'latam', br:'latam',
};
const GEO_TO_CUR_UI = {
  de:'EUR', fr:'EUR', es:'EUR', it:'EUR', nl:'EUR', dk:'DKK', uk:'GBP',
  ru:'RUB', kz:'KZT', mn:'MNT', us:'USD', mx:'USD', br:'USD',
};
const CURRENCIES = [...new Set(GEO_OPTIONS.map(g => {
  const m = g.lbl.match(/\(([A-Z]+)\)/);
  return m ? m[1] : (GEO_TO_CUR_UI[g.val] || 'USD');
}))];
// local units per 1 USD — mirrors deriveLocalFxRate() backend logic
const GEO_FX_RATE_UI = {
  de:0.92, fr:0.92, es:0.92, it:0.92, nl:0.92, dk:7.37, uk:0.79,
  ru:90.9,  kz:500,  mn:3448, us:1.00, mx:1.00, br:1.00,
};
// Derived from GEO_TO_CUR_UI + GEO_FX_RATE_UI — first geo that uses each currency wins
const CUR_FX_RATE_UI = Object.fromEntries(
  Object.entries(GEO_TO_CUR_UI).reduce((acc, [geo, cur]) => {
    if (!acc.some(([c]) => c === cur)) acc.push([cur, GEO_FX_RATE_UI[geo] || 1]);
    return acc;
  }, [])
);
const ARPU_USD_BY_REGION_UI  = { eu:65, cis:22, mn:12, sweep:30, latam:18 };
const ENGAGEMENT_LIFT_UI     = { flash:1.40, daily:1.50, weekly:1.80, monthly:2.20, multi_round:2.00 };
const PARTICIPATION_MID_UI   = { flash:0.06, daily:0.08, weekly:0.11, monthly:0.14, multi_round:0.10 };
const DURATION_DAYS_UI       = { flash:0.03, daily:1,    weekly:7,    monthly:30,   multi_round:10   };

function roundToNice(n) {
  if (n <= 0) return 100;
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / mag) * mag;
}

function calcSuggestedPrize(params) {
  const geo        = params.geo || 'de';
  const region     = GEO_TO_REGION_UI[geo] || 'eu';
  const fx         = params.currency ? (CUR_FX_RATE_UI[params.currency] || 1) : (GEO_FX_RATE_UI[geo] || 1);
  const arpuLocal  = (ARPU_USD_BY_REGION_UI[region] || 65) * fx;
  const eligible   = Math.round((params.totalPlayers || 5000) * (SEGMENT_RATIO_UI[params.segment] ?? 1));
  const duration   = params.duration || 'weekly';
  const partMid    = PARTICIPATION_MID_UI[duration] || 0.11;
  const participants = Math.round(eligible * partMid);
  const engMul     = ENGAGEMENT_LIFT_UI[duration] || 1.8;
  const days       = DURATION_DAYS_UI[duration] || 7;
  const ggrLiftMid = participants * (arpuLocal / 30) * (engMul - 1) * days;
  // 60% of ggrLiftMid → ROI ≈ 80–100%, within all regional benchmarks
  return { prize: roundToNice(Math.round(ggrLiftMid * 0.60)), ggrLift: Math.round(ggrLiftMid) };
}

function getSegRatio(seg) {
  return SEGMENT_RATIO_UI[seg] ?? 1.0;
}

function deriveLocalFxRateForUI(geo) {
  return GEO_FX_RATE_UI[geo] || 1;
}

function updateEligibleHint() {
  const tp       = draft.params.totalPlayers || 5000;
  const seg      = draft.params.segment || 'all';
  const ratio    = getSegRatio(seg);
  const eligible = Math.round(tp * ratio);
  const pct      = Math.round(ratio * 100);
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setW   = (id, val) => { const el = document.getElementById(id); if (el) el.style.width = val; };
  setTxt('funnel-total',    tp.toLocaleString());
  setTxt('funnel-eligible', eligible.toLocaleString());
  setTxt('funnel-pct',      pct + '% of base');
  setW('funnel-bar-eligible', pct + '%');
  // legacy fallback
  setTxt('tp-eligible', eligible.toLocaleString());
}

function updatePrizeHint() {
  const p = draft.params;
  const { prize: suggested, ggrLift } = calcSuggestedPrize(p);
  const cur   = p.currency || GEO_TO_CUR_UI[p.geo] || 'EUR';
  const isRu  = (localStorage.getItem('bonusLang') || 'en') === 'ru';
  const hint  = document.getElementById('prize-hint');
  if (hint) {
    hint.innerHTML = isRu
      ? `Рекомендовано: <strong>${suggested.toLocaleString()} ${cur}</strong> — 60% от ожидаемого GGR-лифта (${ggrLift.toLocaleString()} ${cur}), ROI ≈ 80–120%`
      : `Recommended: <strong>${suggested.toLocaleString()} ${cur}</strong> — 60% of projected GGR lift (${ggrLift.toLocaleString()} ${cur}), ROI ≈ 80–120%`;
  }
  if (p._prizeAutoSet !== false) {
    p.prizePool = suggested;
    const input = document.getElementById('f-pp');
    if (input) input.value = suggested;
  }
}

// ── STEP 1: Tournament type ──────────────────────────────────────────────────
function renderStep1() {
  const typeNames = tg('type_names');
  const typeDescs = tg('type_descs');
  return `
${wizProgressHTML(1)}
<div class="step-header">
  <div class="step-badge">${tg('s1_badge')}</div>
  <div class="step-title">${tg('s1_title')}</div>
  <div class="step-sub">${tg('s1_sub')}</div>
</div>
<div class="chips" style="gap:12px;margin-bottom:28px">
  ${TOURNAMENT_TYPES.map(t => `
    <div class="chip type-card${draft.type===t.val?' on':''}" onclick="draft.type='${t.val}';renderStep()">
      <span class="tc-icon">${t.icon}</span>
      <span class="tc-name">${typeNames[t.val] || t.name}</span>
      <span class="tc-desc">${typeDescs[t.val] || t.desc}</span>
    </div>`).join('')}
</div>
<div class="nav-footer">
  <span></span>
  <button class="btn btn-primary btn-lg" onclick="goStep(2)">${tg('s1_next')}</button>
</div>`;
}

// ── STEP 2: Parameters ───────────────────────────────────────────────────────
function renderStep2() {
  const p = draft.params;
  const isRu = (localStorage.getItem('bonusLang') || 'en') === 'ru';

  const { prize: suggestedPrize, ggrLift: suggestedGgrLift } = calcSuggestedPrize(p);
  if (p._prizeAutoSet !== false) {
    p.prizePool = suggestedPrize;
    p._prizeAutoSet = true;
  }
  const cur = p.currency || GEO_TO_CUR_UI[p.geo] || 'EUR';
  const suggestedFmt   = suggestedPrize.toLocaleString();
  const ggrLiftFmt     = suggestedGgrLift.toLocaleString();
  const prizeHintLabel = isRu
    ? `Рекомендовано: <strong>${suggestedFmt} ${cur}</strong> — 60% от ожидаемого GGR-лифта (${ggrLiftFmt} ${cur}), ROI ≈ 80–120%`
    : `Recommended: <strong>${suggestedFmt} ${cur}</strong> — 60% of projected GGR lift (${ggrLiftFmt} ${cur}), ROI ≈ 80–120%`;

  const totalPlayers = p.totalPlayers || 5000;
  const segRatio     = getSegRatio(p.segment);
  const eligible     = Math.round(totalPlayers * segRatio);
  const eligiblePct  = Math.round(segRatio * 100);
  const recUSD       = Math.round(suggestedPrize / (deriveLocalFxRateForUI(p.geo) || 1));
  const prizeBarPct  = recUSD > 0 ? Math.min(100, Math.round((p.prizePool / (recUSD * (deriveLocalFxRateForUI(p.geo) || 1))) * 100)) : 0;
  const prizeBarColor = prizeBarPct >= 80 && prizeBarPct <= 130 ? 'var(--success)' : prizeBarPct < 50 ? '#ef4444' : 'var(--warn)';

  const segLabels    = tg('seg_labels');
  const entryLabels  = tg('entry_labels');
  const scoringLbls  = tg('scoring_labels');
  const reentryLbls  = tg('reentry_labels');
  const durLabels    = tg('duration_labels');
  const poolLabels   = tg('pool_labels');
  const poolDescs    = tg('pool_descs');
  const distLabels   = tg('dist_labels');

  return `
${wizProgressHTML(2)}
<div class="step-header">
  <div class="step-badge">${tg('s2_badge')}</div>
  <div class="step-title">${tg('s2_title')}</div>
  <div class="step-sub">${tg('s2_sub')}</div>
</div>

<div class="card">
  <div class="card-title">${tg('geo_title')}</div>
  <div class="form-row">
    <label class="form-label">${tg('geo_market')}</label>
    <select class="form-input" id="f-geo" onchange="draft.params.geo=this.value;draft.params.currency=GEO_TO_CUR_UI[this.value]||'EUR';draft.params._prizeAutoSet=true;renderStep()">
      ${GEO_OPTIONS.map(g => `<option value="${g.val}"${p.geo===g.val?' selected':''}>${g.lbl}</option>`).join('')}
    </select>
  </div>
  <div class="form-row">
    <label class="form-label">${tg('geo_currency')}</label>
    <select class="form-input" id="f-currency" onchange="draft.params.currency=this.value;draft.params._prizeAutoSet=true;renderStep()" style="max-width:160px">
      ${CURRENCIES.map(c => `<option value="${c}"${(p.currency||'EUR')===c?' selected':''}>${c}</option>`).join('')}
    </select>
  </div>
  <div class="form-row">
    <label class="form-label">${tg('geo_segment')}</label>
    <div class="chips">
      ${SEGMENTS.map(s => `<div class="chip${p.segment===s.val?' on':''}" onclick="draft.params.segment='${s.val}';draft.params.totalPlayers=draft.params.totalPlayers||5000;renderStep();updateEligibleHint()">${segLabels[s.val] || s.lbl}</div>`).join('')}
    </div>
  </div>
  <div class="form-row">
    <label class="form-label">${tg('geo_total')}</label>
    <div style="display:flex;align-items:center;gap:12px">
      <input type="range" min="100" max="100000" step="100" id="f-tp"
             value="${p.totalPlayers||5000}"
             oninput="draft.params.totalPlayers=+this.value;document.getElementById('tp-out').textContent=Number(+this.value).toLocaleString();updateEligibleHint();updatePrizeHint()"
             style="flex:1;accent-color:var(--accent)">
      <span id="tp-out" style="min-width:64px;font-weight:600;text-align:right">${(p.totalPlayers||5000).toLocaleString()}</span>
    </div>
  </div>
  <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:12px 14px">
    <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--muted);margin-bottom:8px">
      <span>${tg('geo_allplayers')}</span><strong style="color:var(--text)" id="funnel-total">${totalPlayers.toLocaleString()}</strong>
    </div>
    <div class="funnel-bar"><div class="funnel-fill" style="width:100%;background:var(--border)"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--muted);margin-top:8px;margin-bottom:4px">
      <span>${tg('geo_eligible')} <span style="opacity:.6">(${segLabels[p.segment||'all'] || p.segment || 'all'})</span></span>
      <strong style="color:var(--accent)" id="funnel-eligible">${eligible.toLocaleString()}</strong>
    </div>
    <div class="funnel-bar"><div class="funnel-fill" id="funnel-bar-eligible" style="width:${eligiblePct}%;background:var(--accent)"></div></div>
    <div style="font-size:.7rem;color:var(--muted);margin-top:6px;text-align:right" id="funnel-pct">${eligiblePct}${tg('geo_pct_base')}</div>
  </div>
</div>

<div class="card">
  <div class="card-title">${tg('entry_title')}</div>
  <div class="form-row">
    <label class="form-label">${tg('entry_model')}</label>
    <div class="chips">
      ${ENTRY_MODELS.map(e => `<div class="chip${p.entryModel===e.val?' on':''}" onclick="draft.params.entryModel='${e.val}';renderStep()">${entryLabels[e.val] || e.lbl}</div>`).join('')}
    </div>
  </div>
  <div class="form-row">
    <label class="form-label">${tg('scoring_lbl')}</label>
    <div class="chips">
      ${SCORING.map(s => `<div class="chip${p.scoring===s.val?' on':''}" onclick="draft.params.scoring='${s.val}';renderStep()">${scoringLbls[s.val] || s.lbl}</div>`).join('')}
    </div>
  </div>
  <div class="form-row">
    <label class="form-label">${tg('reentry_lbl')}</label>
    <div class="chips">
      ${REENTRY.map(r => `<div class="chip${p.reentry===r.val?' on':''}" onclick="draft.params.reentry='${r.val}';renderStep()">${reentryLbls[r.val] || r.lbl}</div>`).join('')}
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title">${tg('prize_title')}</div>
  <div class="form-row">
    <label class="form-label">${tg('duration_lbl')}</label>
    <div class="chips">
      ${DURATIONS.map(d => `<div class="chip${p.duration===d.val?' on':''}" onclick="draft.params.duration='${d.val}';renderStep()">${durLabels[d.val] || d.lbl}</div>`).join('')}
    </div>
  </div>
  <div class="form-row">
    <label class="form-label">${tg('prize_lbl')}</label>
    <input class="form-input" type="number" min="100" id="f-pp" value="${p.prizePool}"
           onchange="draft.params._prizeAutoSet=false;draft.params.prizePool=Math.max(100,+this.value);renderStep()">
    <div style="margin-top:8px">
      <div style="display:flex;justify-content:space-between;font-size:.73rem;color:var(--muted);margin-bottom:4px">
        <span>${tg('your_pool')}</span>
        <span>${tg('recommended')}: <strong style="color:var(--accent)">${prizeHintLabel.replace(/.*<strong>([^<]+)<\/strong>.*/, '$1')}</strong></span>
      </div>
      <div class="funnel-bar" style="height:6px">
        <div class="funnel-fill" style="width:${prizeBarPct}%;background:${prizeBarColor}"></div>
      </div>
      <div style="font-size:.7rem;color:var(--muted);margin-top:4px" id="prize-hint">${prizeHintLabel}</div>
    </div>
  </div>
  <div class="form-row">
    <label class="form-label">${tg('pool_model')}</label>
    <div class="chips">
      ${POOL_MODELS.map(m => `<div class="chip${p.poolModel===m.val?' on':''}" onclick="draft.params.poolModel='${m.val}';renderStep()" title="${poolDescs[m.val] || m.desc}">${poolLabels[m.val] || m.lbl}</div>`).join('')}
    </div>
  </div>
  ${p.poolModel==='dynamic'?`
  <div class="form-row">
    <label class="form-label">${tg('rake_lbl')}</label>
    <input class="form-input" type="number" min="0" max="40" value="${p.rake||10}" onchange="draft.params.rake=+this.value" style="max-width:120px">
  </div>`:''}
  <div class="form-row">
    <label class="form-label">${tg('distribution')}</label>
    <div class="chips">
      ${DISTRIBUTIONS.map(d => `<div class="chip${p.distribution===d.val?' on':''}" onclick="draft.params.distribution='${d.val}';renderStep()">${distLabels[d.val] || d.lbl}</div>`).join('')}
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title">${tg('lang_title')}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div class="form-row" style="margin:0">
      <label class="form-label">${tg('lang_lbl')}</label>
      <select class="form-input" onchange="draft.params.lang=this.value">
        <option value="en"${p.lang==='en'?' selected':''}>English</option>
        <option value="ru"${p.lang==='ru'?' selected':''}>Russian</option>
        <option value="de"${p.lang==='de'?' selected':''}>German</option>
        <option value="da"${p.lang==='da'?' selected':''}>Danish</option>
        <option value="es"${p.lang==='es'?' selected':''}>Spanish</option>
        <option value="mn"${p.lang==='mn'?' selected':''}>Mongolian</option>
      </select>
    </div>
    <div class="form-row" style="margin:0">
      <label class="form-label">${tg('tone_lbl')}</label>
      <select class="form-input" onchange="draft.params.tone=this.value">
        <option value="professional"${p.tone==='professional'?' selected':''}>Professional</option>
        <option value="casual"${p.tone==='casual'?' selected':''}>Casual</option>
        <option value="hype"${p.tone==='hype'?' selected':''}>Hype / FOMO</option>
      </select>
    </div>
  </div>
</div>

<div class="nav-footer">
  <button class="btn btn-outline" onclick="goStep(1)">${tg('btn_back')}</button>
  <button class="btn btn-primary btn-lg" id="btn-generate" onclick="runGenerate()">${tg('btn_generate')}</button>
</div>`;
}

// ── TECH SPEC BUILDER ────────────────────────────────────────────────────────
function buildTechSpec() {
  if (!lastResult) return '';
  const r    = lastResult;
  const spec = r.spec;
  const cur  = r.cur || 'EUR';
  const p    = draft.params;
  const isRu = (localStorage.getItem('bonusLang') || 'en') === 'ru';

  const geoLabel    = GEO_OPTIONS.find(g => g.val === p.geo)?.lbl?.replace(/^.+?\s/, '') || p.geo;
  const fmt         = n => cur + ' ' + Math.round(n).toLocaleString();
  const typeNames   = tg('type_names');
  const entryLbls   = tg('entry_labels');
  const scoringLbls = tg('scoring_labels');
  const durLbls     = tg('duration_labels');
  const poolLbls    = tg('pool_labels');
  const distLbls    = tg('dist_labels');
  const reentryLbls = tg('reentry_labels');
  const segLbls     = tg('seg_labels');

  const prizeLines = (spec.prizes || []).map(pr =>
    isRu
      ? `  ${pr.place} место: ${fmt(pr.amount)} (${pr.pct}%)`
      : `  Place ${pr.place}: ${fmt(pr.amount)} (${pr.pct}%)`
  );

  const hasGames = _gamesData && _gamesData._key === _gamesParamsKey() && _gamesData.result?.primary?.length > 0;
  const gamesLines = hasGames
    ? ['', isRu ? 'РЕКОМЕНДУЕМЫЕ ИГРЫ' : 'RECOMMENDED GAMES', isRu ? '------------------' : '-----------------', ..._gamesData.result.primary.map(g => `  ${g.name} · ${g.provider} · RTP ${g.rtp}% · ${g.volatility}`)]
    : [];

  const lines = isRu ? [
    'ТЕХНИЧЕСКОЕ ЗАДАНИЕ: НАСТРОЙКА ТУРНИРА',
    '=======================================',
    '',
    'ТИП И РЫНОК',
    '-----------',
    `Тип игр:       ${typeNames[spec.type] || spec.type}`,
    `Рынок:         ${geoLabel}`,
    `Лицензия:      ${r.lic || '—'}`,
    `Валюта:        ${cur}`,
    '',
    'АУДИТОРИЯ',
    '---------',
    `Сегмент:       ${segLbls[p.segment] || p.segment}`,
    `Всего игроков: ${(p.totalPlayers || 5000).toLocaleString()}`,
    `Подходящих:    ${(r.econ?.eligible || 0).toLocaleString()}`,
    '',
    'МЕХАНИКА',
    '--------',
    `Длительность:  ${durLbls[spec.duration] || spec.duration}`,
    `Вход:          ${entryLbls[spec.entryModel] || spec.entryModel}`,
    `Скоринг:       ${scoringLbls[spec.scoring] || spec.scoring}`,
    `Ре-энтри:      ${reentryLbls[spec.reentry] || spec.reentry}`,
    '',
    'ПРИЗОВОЙ ФОНД',
    '-------------',
    `Общий фонд:    ${fmt(spec.prizePool)}`,
    `Модель:        ${poolLbls[spec.poolModel] || spec.poolModel}`,
    ...(spec.rake ? [`Рейк:          ${spec.rake}%`] : []),
    `Распределение: ${distLbls[spec.distribution] || spec.distribution}`,
    '',
    'МЕСТО → ПРИЗ',
    '------------',
    ...prizeLines,
    ...gamesLines,
  ] : [
    'TECHNICAL REQUIREMENTS: TOURNAMENT SETUP',
    '=========================================',
    '',
    'TYPE & MARKET',
    '-------------',
    `Game type:     ${typeNames[spec.type] || spec.type}`,
    `Market:        ${geoLabel}`,
    `License:       ${r.lic || '—'}`,
    `Currency:      ${cur}`,
    '',
    'AUDIENCE',
    '--------',
    `Segment:       ${segLbls[p.segment] || p.segment}`,
    `Total players: ${(p.totalPlayers || 5000).toLocaleString()}`,
    `Eligible:      ${(r.econ?.eligible || 0).toLocaleString()}`,
    '',
    'MECHANICS',
    '---------',
    `Duration:      ${durLbls[spec.duration] || spec.duration}`,
    `Entry model:   ${entryLbls[spec.entryModel] || spec.entryModel}`,
    `Scoring:       ${scoringLbls[spec.scoring] || spec.scoring}`,
    `Re-entry:      ${reentryLbls[spec.reentry] || spec.reentry}`,
    '',
    'PRIZE POOL',
    '----------',
    `Total pool:    ${fmt(spec.prizePool)}`,
    `Pool model:    ${poolLbls[spec.poolModel] || spec.poolModel}`,
    ...(spec.rake ? [`Rake:          ${spec.rake}%`] : []),
    `Distribution:  ${distLbls[spec.distribution] || spec.distribution}`,
    '',
    'PRIZE BREAKDOWN',
    '---------------',
    ...prizeLines,
    ...gamesLines,
  ];

  return lines.join('\n');
}

function copyTechSpec() {
  const text = buildTechSpec();
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copy-spec');
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = tg('spec_copy_done');
    btn.style.color = 'var(--success)';
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 2000);
  });
}

// ── STEP 3: Economics & Spec ─────────────────────────────────────────────────
function renderStep3() {
  if (!lastResult) { goStep(2); return ''; }
  const r    = lastResult;
  const e    = r.econ;
  const spec = r.spec;
  const cur  = r.cur || 'EUR';
  const roi  = typeof e.roi === 'number' ? e.roi : Number(e.roi) || 0;

  function fmtCur(n) {
    // Thin records (e.g. calendar-synced tournaments with no econ) leave scenario
    // fields undefined — coerce to 0 so we render "0", not "NaN".
    return cur + ' ' + Math.abs(Math.round(Number(n) || 0)).toLocaleString();
  }

  const dur = draft.params.duration || 'weekly';
  const pctMap = { flash:{lo:'3%',mi:'7%',hi:'12%'}, daily:{lo:'5%',mi:'10%',hi:'18%'},
    weekly:{lo:'8%',mi:'15%',hi:'25%'}, monthly:{lo:'10%',mi:'18%',hi:'30%'},
    multi_round:{lo:'6%',mi:'12%',hi:'20%'} };
  const pct = pctMap[dur] || pctMap['weekly'];
  const scenarios = [
    { label:tg('low_lbl', pct.lo),  lift:e.ggrLiftLow,  net:e.netMarginLow,  pl:e.participantsLow,  cpp:e.costPerActiveLow  },
    { label:tg('exp_lbl', pct.mi),  lift:e.ggrLiftMid,  net:e.netMarginMid,  pl:e.participantsMid,  cpp:e.costPerActiveMid  },
    { label:tg('high_lbl', pct.hi), lift:e.ggrLiftHigh, net:e.netMarginHigh, pl:e.participantsHigh, cpp:e.costPerActiveHigh },
  ];

  const prizeRows = (spec.prizes||[]).map((pr,i) => {
    const pct = pr.pct;
    return `<div class="prize-row">
      <span class="prize-place">${pr.place === 1 ? '🥇' : pr.place === 2 ? '🥈' : pr.place === 3 ? '🥉' : '#' + pr.place}</span>
      <div class="prize-bar-wrap"><div class="prize-bar" style="width:${Math.min(pct*3,100)}%"></div></div>
      <span class="prize-pct">${pct}%</span>
      <span class="prize-amt">${cur} ${pr.amount.toLocaleString()}</span>
    </div>`;
  }).join('');

  const prev = _tgPrevEcon;
  const econCards = scenarios.map((s, idx) => {
    const netClass = s.net >= 0 ? 'pos' : 'neg';
    const prevNets = prev ? [prev.netMarginLow, prev.netMarginMid, prev.netMarginHigh] : [];
    const prevCpps = prev ? [prev.costPerActiveLow, prev.costPerActiveMid, prev.costPerActiveHigh] : [];
    const netDelta = prevNets[idx] !== undefined ? _tgDeltaBadge(s.net, prevNets[idx], { fmt: d => (d>=0?'+':'') + fmtCur(d) }) : '';
    const cppDelta = prevCpps[idx] !== undefined ? _tgDeltaBadge(s.cpp, prevCpps[idx], { lowerBetter: true, fmt: d => (d>=0?'+':'') + fmtCur(d) }) : '';
    const flashStyle = prev && s.net >= 0 && prevNets[idx] < 0 ? ' style="animation:tgCardFlash .6s ease"' : '';
    return `<div class="econ-card"${flashStyle}>
      <div class="econ-label">${s.label}</div>
      <div class="econ-val ${netClass}">${s.net>=0?'+':''}${fmtCur(s.net)}${netDelta}</div>
      <div class="econ-sub">${tg('players_ggr', s.pl, fmtCur(s.lift))}</div>
      <div class="econ-sub">${tg('cost_active', fmtCur(s.cpp))}${cppDelta}</div>
    </div>`;
  }).join('');

  const engMul  = e.engagementMultiplier || 2.5;
  const retVal  = e.retentionValue || 0;
  const totVal  = e.totalValueMid  || e.netMarginMid || 0;
  const totClass = totVal >= 0 ? 'pos' : 'neg';

  // ROI delta badge
  const roiDelta = prev ? _tgDeltaBadge(roi, prev.roi ?? 0, {}) : '';

  return `
${wizProgressHTML(3)}
<div class="step-header">
  <div class="step-badge">${tg('s3_badge')}</div>
  <div class="step-title">${tg('s3_title')}</div>
  <div class="step-sub">${tg('s3_sub')}</div>
</div>

<div class="card">
  <div class="card-title">${tg('summary_title')}</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:.82rem">
    <div><span style="color:var(--muted)">${tg('field_type')}</span> ${spec.type}</div>
    <div><span style="color:var(--muted)">${tg('field_dur')}</span> ${spec.duration}</div>
    <div><span style="color:var(--muted)">${tg('field_entry')}</span> ${spec.entryModel}</div>
    <div><span style="color:var(--muted)">${tg('field_scoring')}</span> ${spec.scoring}</div>
    <div><span style="color:var(--muted)">${tg('field_pool')}</span> ${spec.poolModel}</div>
    <div><span style="color:var(--muted)">${tg('field_reentry')}</span> ${spec.reentry}</div>
    <div><span style="color:var(--muted)">${tg('field_prize')}</span> <strong>${fmtCur(spec.prizePool)}</strong></div>
    <div><span style="color:var(--muted)">${tg('field_dist')}</span> ${spec.distribution}</div>
    <div><span style="color:var(--muted)">${tg('field_roi')}</span> <strong style="color:${roi>=0?'var(--success)':'#ef4444'}">${roi}%${roiDelta}</strong></div>
  </div>
  ${e.breakEvenParticipants > 0 ? `<div style="margin-top:10px;font-size:.78rem;color:var(--muted)">${tg('breakeven_hint', e.breakEvenParticipants)}</div>` : ''}
</div>

<div class="card">
  <div class="card-title">${tg('prize_dist', cur, spec.prizePool.toLocaleString())}</div>
  ${prizeRows}
</div>

<details class="card" style="padding:0">
  <summary style="padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;list-style:none;user-select:none">
    <span style="font-size:.85rem;font-weight:600;color:var(--text);flex:1">${tg('spec_copy_title')}</span>
    <span style="font-size:.75rem;color:var(--muted)">${tg('spec_copy_sub')}</span>
    <button id="btn-copy-spec" class="btn btn-outline btn-sm" style="flex-shrink:0"
            onclick="event.preventDefault();copyTechSpec()">${tg('spec_copy_btn')}</button>
  </summary>
  <div style="padding:0 16px 16px">
    <textarea readonly onclick="this.select()"
      style="width:100%;box-sizing:border-box;background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:monospace;font-size:.72rem;line-height:1.6;padding:12px 14px;resize:vertical;min-height:260px;outline:none">${buildTechSpec()}</textarea>
  </div>
</details>

<div class="card">
  <div class="card-title">${tg('econ_title')}</div>
  ${tgActionPanelHTML(e)}
  <div class="econ-grid">${econCards}</div>
  <div style="margin-top:14px;padding:12px 14px;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.2);border-radius:8px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
    <div style="flex:1;min-width:160px">
      <div style="font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">${tg('total_val')}</div>
      <div style="font-size:1.1rem;font-weight:700;color:${totClass==='pos'?'var(--success)':'#ef4444'}">${totVal>=0?'+':''}${fmtCur(totVal)}</div>
      <div style="font-size:.72rem;color:var(--muted);margin-top:2px">${tg('ggr_plus_ret')}</div>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <div style="text-align:center">
        <div style="font-size:.68rem;color:var(--muted);margin-bottom:2px">${tg('engagement_lbl')}</div>
        <div style="font-size:.88rem;font-weight:600;color:#a0b0ff">×${engMul.toFixed(1)}</div>
        <div style="font-size:.65rem;color:var(--muted)">${tg('vs_normal')}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:.68rem;color:var(--muted);margin-bottom:2px">${tg('retention_val')}</div>
        <div style="font-size:.88rem;font-weight:600;color:var(--success)">+${fmtCur(retVal)}</div>
        <div style="font-size:.65rem;color:var(--muted)">${tg('uplift')}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:.68rem;color:var(--muted);margin-bottom:2px">${tg('full_roi')}</div>
        <div style="font-size:.88rem;font-weight:600;color:${roi>=0?'var(--success)':'#ef4444'}">${roi>=0?'+':''}${roi}%</div>
        <div style="font-size:.65rem;color:var(--muted)">${tg('on_prize')}</div>
      </div>
    </div>
  </div>
  <div style="font-size:.7rem;color:var(--muted);margin-top:10px">
    ${tg('eligible_note', e.eligible, draft.params.segment, Math.round(e.segmentRatio*100), (draft.params.totalPlayers||5000).toLocaleString(), e.arpu, engMul.toFixed(1))}
  </div>
  <div style="margin-top:14px;display:flex;gap:10px;align-items:center">
    <button class="btn btn-outline btn-sm" onclick="runOptimize()" id="btn-optimize">
      ${(localStorage.getItem('bonusLang')||'en')==='ru' ? '🤖 AI-ревью прогноза' : '🤖 AI Review'}
    </button>
  </div>
</div>

<div id="optimize-area">${lastOptimize ? renderOptimizeHTML(lastOptimize, (roi<0||e.netMarginMid<0)?'optimize':'review') : ''}</div>

${gamesSection()}

<div style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);border-radius:10px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:14px">
  <span style="font-size:1.4rem;flex-shrink:0">📋</span>
  <div style="flex:1;min-width:0">
    <div style="font-size:.85rem;font-weight:600;color:#c4b5fd;margin-bottom:2px">${tg('guide_ready')}</div>
    <div style="font-size:.77rem;color:var(--muted)">${tg('guide_view_sub')}</div>
  </div>
  <div style="display:flex;gap:8px;flex-shrink:0">
    <button class="btn btn-outline btn-sm"
            style="border-color:rgba(124,58,237,.4);color:#c4b5fd"
            onclick="showSetupGuide()">
      ${tg('view_guide')}
    </button>
  </div>
</div>

<div class="nav-footer">
  <div style="display:flex;gap:9px;align-items:center">
    <button class="btn btn-outline" onclick="goStep(2)">${tg('btn_reconfig')}</button>
    <button id="btn-save-tournament" class="btn btn-outline"
            style="border-color:rgba(79,110,247,.4);color:#a0b0ff"
            onclick="saveTournament()">
      ${tg('btn_save')}
    </button>
  </div>
  <div style="display:flex;gap:9px">
    <button class="btn btn-outline btn-sm" onclick="exportTournamentPDF()">${tg('btn_pdf')}</button>
    <button class="btn btn-primary btn-lg" onclick="goStep(4)">${tg('btn_ai_texts')}</button>
  </div>
</div>`;
}

// ── STEP 4: AI Texts & Audit ─────────────────────────────────────────────────
function renderStep4() {
  const hasTexts = !!lastTexts;
  const hasAudit = !!lastAudit;
  const hasDesc  = !!lastDesc;

  return `
${wizProgressHTML(4)}
<div class="step-header">
  <div class="step-badge">${tg('s4_badge')}</div>
  <div class="step-title">${tg('s4_title')}</div>
  <div class="step-sub">${tg('s4_sub')}</div>
</div>

<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
  <button class="btn btn-primary" onclick="runTexts()" id="btn-texts">${hasTexts ? tg('btn_regen_texts') : tg('btn_gen_texts')}</button>
  <button class="btn btn-outline" onclick="runDescription()" id="btn-desc">${hasDesc ? tg('btn_regen_desc') : tg('btn_gen_desc')}</button>
  <button class="btn btn-outline" onclick="runAudit()" id="btn-audit">${hasAudit ? tg('btn_reaudit') : tg('btn_audit_lbl')}</button>
</div>

<div id="texts-area">${hasTexts ? renderTextsHTML(lastTexts) : ''}</div>
<div id="desc-area">${hasDesc ? renderTournDescHTML(lastDesc) : ''}</div>
<div id="audit-area">${hasAudit ? renderAuditHTML(lastAudit) : ''}</div>

<div class="nav-footer">
  <button class="btn btn-outline" onclick="goStep(3)">${tg('btn_back_spec')}</button>
  <button class="btn btn-ghost" onclick="goStep(1)">${tg('btn_start_over')}</button>
</div>`;
}

function renderTextsHTML(texts) {
  const channels = ['push','email','sms','telegram','popup'];
  const tabs = channels.map(ch => `<button class="tab${activeTab===ch?' active':''}" onclick="activeTab='${ch}';document.getElementById('texts-area').innerHTML=renderTextsHTML(lastTexts)">${ch.charAt(0).toUpperCase()+ch.slice(1)}</button>`).join('');

  let body = '';
  const variants = texts[activeTab] || [];
  if (activeTab === 'email') {
    body = variants.map((v,i) => `
      <div class="text-variant">
        <div class="text-variant-label">Variant ${i+1}</div>
        <div style="font-weight:600;font-size:.82rem;margin-bottom:4px">${v.subject||''}</div>
        <div class="text-variant-body">${v.body||''}</div>
        <button class="copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify((v.subject||'')+'\n\n'+(v.body||''))})">› Copy</button>
      </div>`).join('');
  } else if (activeTab === 'popup') {
    body = variants.map((v,i) => `
      <div class="text-variant">
        <div class="text-variant-label">Variant ${i+1}</div>
        <div style="font-weight:700;font-size:.95rem;margin-bottom:3px">${v.headline||''}</div>
        <div style="color:var(--muted);font-size:.82rem;margin-bottom:6px">${v.subtext||''}</div>
        <div style="display:inline-block;background:var(--accent);color:#fff;padding:4px 12px;border-radius:6px;font-size:.78rem;font-weight:700">${v.cta||''}</div>
        <button class="copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify((v.headline||'')+'\n'+(v.subtext||'')+'\nCTA: '+(v.cta||''))})">› Copy</button>
      </div>`).join('');
  } else {
    body = variants.map((v,i) => `
      <div class="text-variant">
        <div class="text-variant-label">Variant ${i+1}</div>
        <div class="text-variant-body">${typeof v === 'string' ? v : JSON.stringify(v)}</div>
        <button class="copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(typeof v === 'string' ? v : '')})">› Copy</button>
      </div>`).join('');
  }

  return `<div class="card" style="margin-bottom:16px">
    <div class="card-title">${tg('crm_copy')}</div>
    <div class="tab-row">${tabs}</div>
    ${body}
  </div>`;
}

function renderAuditHTML(audit) {
  const checks = (audit.checks||[]).map(c => `
    <div class="audit-check">
      <div class="audit-status ${c.status}">${c.status==='ok'?'✓':'!'}</div>
      <div><div class="audit-label">${c.label}</div><div class="audit-note">${c.note}</div></div>
    </div>`).join('');
  const recs = (audit.recommendations||[]).map(r => `
    <div class="rec-card">
      <div class="rec-text">${r.text}</div>
      <div class="rec-impact">→ ${r.impact}</div>
    </div>`).join('');

  return `<div class="card">
    <div class="card-title">${tg('audit_title')}</div>
    ${checks}
    ${recs ? `<div style="margin-top:14px;font-size:.8rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">${tg('recommendations')}</div>${recs}` : ''}
  </div>`;
}

// ── PDF EXPORT ────────────────────────────────────────────────────────────────
function exportTournamentPDF() {
  if (!lastResult) return;
  const r    = lastResult;
  const spec = r.spec || {};
  const e    = r.econ || {};
  const cur  = r.cur || '';
  const ts   = new Date().toLocaleString('en-GB', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const fmt  = v => cur + ' ' + Math.round(v).toLocaleString();

  const prizeRows = (spec.prizes || []).map(p =>
    `<tr><td>${p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : p.place === 3 ? '🥉' : '#'+p.place}</td><td>${p.pct}%</td><td>${fmt(p.amount)}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${spec.type} Tournament — ${cur} ${(spec.prizePool||0).toLocaleString()}</title>
    <style>body{font-family:Arial,sans-serif;margin:28px;color:#111;font-size:13px}
    h1{font-size:18px}h3{font-size:13px;color:#555;margin:16px 0 6px}
    table{border-collapse:collapse;width:100%;font-size:11px;margin-bottom:12px}
    td,th{border:1px solid #ddd;padding:5px 8px}th{background:#f0f0f0}
    .footer{margin-top:30px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#888}</style>
    </head><body>
    <h1>${(spec.type||'').charAt(0).toUpperCase()+(spec.type||'').slice(1)} Tournament</h1>
    <div style="color:#666;font-size:12px">${cur} ${(spec.prizePool||0).toLocaleString()} prize pool · ${spec.duration} · ${ts}</div>

    <h3>Summary</h3>
    <table><tr><th>Parameter</th><th>Value</th></tr>
      <tr><td>Entry model</td><td>${spec.entryModel}</td></tr>
      <tr><td>Scoring</td><td>${spec.scoring}</td></tr>
      <tr><td>Pool model</td><td>${spec.poolModel}</td></tr>
      <tr><td>Distribution</td><td>${spec.distribution}</td></tr>
      <tr><td>Re-entry</td><td>${spec.reentry}</td></tr>
      <tr><td>ROI (expected)</td><td>${e.roi >= 0 ? '+' : ''}${e.roi}%</td></tr>
    </table>

    <h3>Prize Table</h3>
    <table><tr><th>Place</th><th>%</th><th>Amount</th></tr>${prizeRows}</table>

    <h3>Economics</h3>
    <table><tr><th>Metric</th><th>Low (5%)</th><th>Expected (10%)</th><th>High (15%)</th></tr>
      <tr><td>Participants</td><td>${e.participantsLow}</td><td>${e.participantsMid}</td><td>${e.participantsHigh}</td></tr>
      <tr><td>GGR lift</td><td>${fmt(e.ggrLiftLow||0)}</td><td>${fmt(e.ggrLiftMid||0)}</td><td>${fmt(e.ggrLiftHigh||0)}</td></tr>
      <tr><td>Net margin</td><td>${fmt(e.netMarginLow||0)}</td><td>${fmt(e.netMarginMid||0)}</td><td>${fmt(e.netMarginHigh||0)}</td></tr>
    </table>

    <div class="footer">Generated by Retomat · ${ts} · retomat.io</div>
    </body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) { alert('Allow popups to export PDF'); URL.revokeObjectURL(url); return; }
  setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 400);
}

// ── API calls ────────────────────────────────────────────────────────────────
const TOURN_GEN_STEPS = [
  'Analysing tournament type',
  'Calculating prize pool',
  'Building prize distribution',
  'Running economics model',
  'Preparing tournament spec',
];

function runGenerate() {
  const lang = localStorage.getItem('bonusLang') || 'en';
  const isRu = lang === 'ru';
  const steps = isRu ? [
    'Анализ типа турнира',
    'Расчёт призового фонда',
    'Распределение призов',
    'Экономическая модель',
    'Подготовка спецификации',
  ] : TOURN_GEN_STEPS;

  step = 0; hasActiveGenerator = true;
  document.getElementById('topbar-step').textContent = isRu ? 'Генерация…' : 'Generating…';

  const c = document.getElementById('content');
  c.innerHTML = `
    <div class="prog-wrap">
      <div class="prog-title">${isRu ? 'AI генерирует турнир…' : 'AI is generating tournament…'}</div>
      <div class="prog-sub">${isRu ? 'Анализируем параметры и рассчитываем экономику' : 'Analysing parameters and calculating economics'}</div>
      <ul class="prog-list" id="tg-prog-list">
        ${steps.map((s, i) => `<li class="pl-item" id="tg-pl-${i}"><span class="pl-icon">⏳</span>${s}</li>`).join('')}
      </ul>
    </div>`;

  // Fire API call immediately, in parallel with animation
  const apiPromise = fetch('/api/tournament/generate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ type: draft.type, params: draft.params }),
  })
  .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.message || r.statusText))))
  .then(data => { lastResult = data; lastTexts = null; lastAudit = null; lastDesc = null; lastOptimize = null; _tgUndoStack = null; _tgPrevEcon = null; _tgLastOptRecs = []; })
  .catch(err => { lastResult = { _error: err.message }; });

  let i = 0;
  (function tick() {
    if (i > 0) {
      const prev = document.getElementById('tg-pl-' + (i - 1));
      if (prev) { prev.className = 'pl-item done'; prev.innerHTML = `<span class="pl-icon">✅</span>${steps[i - 1]}`; }
    }
    if (i < steps.length) {
      const cur = document.getElementById('tg-pl-' + i);
      if (cur) { cur.className = 'pl-item running'; cur.innerHTML = `<div class="spinner"></div>${steps[i]}`; }
      i++;
      setTimeout(tick, 700);
    } else {
      // Animation done — wait for API if still pending, then proceed
      Promise.resolve(apiPromise).then(() => {
        setTimeout(() => {
          if (lastResult?._error) {
            c.innerHTML = `<div class="alert alert-warn" style="max-width:480px;margin:40px auto">
              Error: ${lastResult._error}
              <button class="btn btn-outline btn-sm" style="margin-top:10px;display:block" onclick="goStep(2)">← Back</button>
            </div>`;
          } else {
            goStep(3);
          }
        }, 300);
      });
    }
  })();
}

async function runTexts() {
  const btn = document.getElementById('btn-texts');
  const area = document.getElementById('texts-area');
  if (!btn || !area) return;
  btn.disabled = true;
  btn.textContent = '⏳ Generating texts…';
  area.innerHTML = '<div class="loader"><div class="spinner"></div> AI is writing tournament copy…</div>';

  try {
    const resp = await fetch('/api/tournament/texts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: draft.type, params: draft.params, spec: lastResult?.spec || {} }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: resp.statusText }));
      throw new Error(err.message || resp.statusText);
    }
    lastTexts = await resp.json();
    activeTab = 'push';
    area.innerHTML = renderTextsHTML(lastTexts);
    btn.textContent = '↺ Regenerate Texts';
  } catch (e) {
    area.innerHTML = `<div class="alert alert-warn">Could not generate texts: ${e.message}</div>`;
    btn.textContent = '🤖 Generate CRM Texts';
  }
  btn.disabled = false;
}

async function runAudit() {
  const btn  = document.getElementById('btn-audit');
  const area = document.getElementById('audit-area');
  if (!btn || !area) return;
  btn.disabled = true;
  btn.textContent = '⏳ Auditing…';
  area.innerHTML = '<div class="loader"><div class="spinner"></div> AI compliance officer is reviewing…</div>';

  try {
    const resp = await fetch('/api/tournament/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: draft.type, params: draft.params, spec: lastResult?.spec || {}, uiLang: draft.params.lang }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: resp.statusText }));
      throw new Error(err.message || resp.statusText);
    }
    lastAudit = await resp.json();
    area.innerHTML = renderAuditHTML(lastAudit);
    btn.textContent = '↺ Re-run Audit';
  } catch (e) {
    area.innerHTML = `<div class="alert alert-warn">Could not run audit: ${e.message}</div>`;
    btn.textContent = '🔍 Compliance Audit';
  }
  btn.disabled = false;
}

// ── OFFER DESCRIPTION ────────────────────────────────────────────────────────
async function runDescription() {
  const btn  = document.getElementById('btn-desc');
  const area = document.getElementById('desc-area');
  if (!btn || !area) return;
  btn.disabled = true;
  btn.textContent = '⏳ …';
  area.innerHTML = '<div class="loader"><div class="spinner"></div> AI is writing the tournament description…</div>';

  try {
    const resp = await fetch('/api/tournament/description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: draft.type, params: draft.params, spec: lastResult?.spec || {}, uiLang: draft.params.lang }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: resp.statusText }));
      throw new Error(err.message || resp.statusText);
    }
    lastDesc = await resp.json();
    area.innerHTML = renderTournDescHTML(lastDesc);
    btn.textContent = tg('btn_regen_desc');
  } catch (e) {
    area.innerHTML = `<div class="alert alert-warn">Could not generate description: ${e.message}</div>`;
    btn.textContent = tg('btn_gen_desc');
  }
  btn.disabled = false;
}

function _tdLabels() {
  return { note: tg('desc_note'), hint: tg('desc_hint'), how: tg('desc_how'), tc: tg('desc_tc'), copy: tg('desc_copy'), copyFn: 'copyTournDesc' };
}
function renderTournDescHTML(d) { return window.OfferDesc.render(d, _tdLabels()); }
function copyTournDesc(btn) {
  if (!lastDesc) return;
  window.OfferDesc.copyText(window.OfferDesc.plainText(lastDesc, tg('desc_tc')), btn);
}

// ── AI OPTIMIZE / REVIEW ─────────────────────────────────────────────────────
async function runOptimize() {
  const btn  = document.getElementById('btn-optimize');
  const area = document.getElementById('optimize-area');
  if (!btn || !area || !lastResult) return;

  const lang  = localStorage.getItem('bonusLang') || 'en';
  const isRu  = lang === 'ru';
  const e     = lastResult.econ;
  const mode  = (e.netMarginMid < 0 || e.roi < 0) ? 'optimize' : 'review';

  btn.disabled = true;
  btn.textContent = isRu ? '⏳ Анализирую…' : '⏳ Analysing…';
  area.innerHTML = `<div class="loader"><div class="spinner"></div> ${isRu?'AI анализирует прогноз…':'AI is reviewing the forecast…'}</div>`;

  try {
    const resp = await fetch('/api/tournament/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:   draft.type,
        params: draft.params,
        econ: {
          arpu:                  e.arpu,
          eligible:              e.eligible,
          durationDays:          e.durationDays,
          engagementMultiplier:  e.engagementMultiplier,
          participantsMid:       e.participantsMid,
          ggrLiftMid:            e.ggrLiftMid,
          retentionValue:        e.retentionValue,
          prizePoolCost:         e.prizePoolCost,
          netMarginMid:          e.netMarginMid,
          totalValueMid:         e.totalValueMid,
          roi:                   e.roi,
          breakEvenParticipants: e.breakEvenParticipants,
          costPerActiveMid:      e.costPerActiveMid,
        },
        mode,
        uiLang: lang,
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: resp.statusText }));
      throw new Error(err?.message || resp.statusText);
    }
    lastOptimize = await resp.json();
    _tgLastOptRecs = lastOptimize.recommendations || [];
    area.innerHTML = renderOptimizeHTML(lastOptimize, mode);
    btn.textContent = isRu ? '↺ Обновить ревью' : '↺ Re-run Review';
    // Refresh action panel to enable Apply button
    const ap = document.getElementById('tg-action-panel');
    if (ap && lastResult) ap.outerHTML = tgActionPanelHTML(lastResult.econ);
  } catch (e) {
    area.innerHTML = `<div class="alert alert-warn">${isRu?'Ошибка AI-ревью':'AI review failed'}: ${e?.message||String(e)}</div>`;
    btn.textContent = isRu ? '🤖 AI-ревью прогноза' : '🤖 AI Review';
  }
  btn.disabled = false;
}

// ── BALANCE TO PROFIT: helpers ────────────────────────────────────────────────

const TG_TARGET_ROI_KEY = 'tg_target_roi';

function _getTgTargetRoi() {
  try { return parseFloat(localStorage.getItem(TG_TARGET_ROI_KEY) || '100'); } catch { return 100; }
}

function _recalcTournLocal(p) {
  if (window._tournamentEcon) return window._tournamentEcon.recalcTournamentEconLocal(p).econ;
  return null;
}

const TG_UI_BOUNDS = {
  prizePool: { min: 10, max: 10_000_000 },
  rake:      { min: 0,  max: 30 },
};

function parseTgRecTarget(param, target) {
  const s = String(target);
  // Enum params
  if (param === 'poolModel') {
    const m = /fixed|dynamic|hybrid/.exec(s);
    return m ? m[0] : draft.params.poolModel;
  }
  if (param === 'duration') {
    const m = /flash|daily|weekly|monthly|multi_round/.exec(s);
    return m ? m[0] : draft.params.duration;
  }
  if (param === 'segment') {
    const m = /all|new|vip|dormant|depositors/.exec(s);
    return m ? m[0] : draft.params.segment;
  }
  // Numeric params — extract first number only
  const match = s.match(/\d+\.?\d*/);
  const num   = match ? parseFloat(match[0]) : NaN;
  if (isNaN(num)) return draft.params[param];
  const b = TG_UI_BOUNDS[param];
  return b ? Math.max(b.min, Math.min(b.max, num)) : num;
}

function applyTgAiRecs(recs) {
  if (!lastResult) return;
  const beforeParams = { ...draft.params };
  const beforeEcon   = { ...lastResult.econ };

  for (const rec of recs) {
    if (rec.param && rec.target !== undefined && draft.params[rec.param] !== undefined) {
      const val = parseTgRecTarget(rec.param, rec.target);
      draft.params[rec.param] = val;
    }
  }
  draft.params._prizeAutoSet = false;
  finishTgApply(beforeParams, beforeEcon);
}

async function balanceTgToProfit(targetRoi) {
  const lang = localStorage.getItem('bonusLang') || 'en';
  const isRu = lang === 'ru';

  if (!lastResult) {
    showToast(isRu ? 'Сначала сгенерируйте турнир' : 'Generate a tournament first');
    return;
  }
  if (!window._tournamentEcon || !window._balanceSolver) {
    showToast(isRu ? 'Модули ещё загружаются, попробуйте ещё раз' : 'Modules still loading, try again');
    return;
  }

  // If already at target, nothing to do
  const currentRoi = lastResult.econ ? (lastResult.econ.roi ?? 0) : 0;
  if (currentRoi >= targetRoi) {
    showToast(isRu
      ? `Турнир уже прибылен: ROI ${Math.round(currentRoi)}% ≥ цели ${targetRoi}%`
      : `Already profitable: ROI ${Math.round(currentRoi)}% ≥ target ${targetRoi}%`);
    return;
  }

  try {
    const suggestedFloor = Math.round(calcSuggestedPrize(draft.params).prize * 0.3);
    const prizeFloor = Math.max(10, suggestedFloor);

    const beforeParams = { ...draft.params };
    const beforeEcon   = { ...lastResult.econ };

    const LEVERS = [
      // Switch fixed→hybrid first: -40% prizePoolCost in one step (hybrid always cheaper than dynamic at rake<40%)
      { p:'poolModel', mode:'enum', enum:['fixed','hybrid'] },
      // Then reduce prize iteratively
      { p:'prizePool', mode:'mul',  f:0.9, bounds:{ min: prizeFloor, max: 10_000_000 } },
      // Increase rake (reduces cost only for dynamic model; no-op for fixed/hybrid)
      { p:'rake',      mode:'add',  f:2,   bounds:{ min: 0, max: 30 } },
    ];

    const { draft: solvedParams, reached } = window._balanceSolver.solveToTarget({
      draft:    { ...draft.params },
      levers:   LEVERS,
      recalc:   p => window._tournamentEcon.recalcTournamentEconLocal(p).econ,
      metricOf: e => e.roi,
      target:   targetRoi,
    });

    Object.assign(draft.params, solvedParams);
    draft.params._prizeAutoSet = false;

    if (!reached) {
      const msg = isRu
        ? `Не удалось достичь ROI ${targetRoi}% — упёрлись в минимальный приз (${prizeFloor.toLocaleString()} ${lastResult.cur || ''}). Применены лучшие параметры.`
        : `Could not reach ROI ${targetRoi}% — hit prize floor (${prizeFloor.toLocaleString()} ${lastResult.cur || ''}). Best parameters applied.`;
      showToast(msg);
    }

    await finishTgApply(beforeParams, beforeEcon);
  } catch (err) {
    console.error('[balanceTgToProfit]', err);
    showToast(isRu ? 'Ошибка при балансировке — см. консоль' : 'Balance error — see console');
  }
}

async function finishTgApply(beforeParams, beforeEcon) {
  // Save undo state
  _tgUndoStack = { params: beforeParams, econ: beforeEcon };
  _tgPrevEcon  = beforeEcon;

  // Re-fetch canonical econ from server
  try {
    const resp = await fetch('/api/tournament/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type: draft.type, params: draft.params }),
    });
    if (resp.ok) {
      const data = await resp.json();
      lastResult = data;
      lastOptimize = null;
      _tgLastOptRecs = [];
    }
  } catch (_) { /* use local econ as fallback */ }

  renderStep();
}

function undoTgApply() {
  if (!_tgUndoStack) return;
  draft.params = { ..._tgUndoStack.params };
  lastResult   = lastResult ? { ...lastResult, econ: _tgUndoStack.econ } : null;
  _tgPrevEcon  = null;
  _tgUndoStack = null;
  _tgLastOptRecs = [];
  lastOptimize = null;
  renderStep();
}

function _tgDeltaBadge(cur, prev, opts) {
  if (prev === undefined || prev === null) return '';
  const diff = cur - prev;
  if (Math.abs(diff) < 0.5) return '';
  const lowerBetter = opts && opts.lowerBetter;
  const improved = lowerBetter ? diff < 0 : diff > 0;
  const color = improved ? '#10b981' : '#ef4444';
  const sign  = diff > 0 ? '+' : '';
  const fmt   = opts && opts.fmt ? opts.fmt(diff) : (sign + Math.round(diff));
  return `<span style="font-size:.65rem;font-weight:700;padding:1px 5px;border-radius:4px;background:${color}22;color:${color};margin-left:5px">${fmt}</span>`;
}

function tgActionPanelHTML(econ) {
  const lang = localStorage.getItem('bonusLang') || 'en';
  const isRu = lang === 'ru';
  const roi   = econ ? (econ.roi ?? 0) : 0;
  const targetRoi = _getTgTargetRoi();
  const hasRecs   = _tgLastOptRecs.length > 0;
  const hasUndo   = !!_tgUndoStack;
  const needBalance = roi < targetRoi;

  const labels = {
    applyRecs:    isRu ? '⚡ Применить рекомендации' : '⚡ Apply Recommendations',
    balance:      isRu ? '⚖️ Сбалансировать под прибыль' : '⚖️ Balance to Profit',
    undo:         isRu ? '↩ Отменить' : '↩ Undo',
    targetRoi:    isRu ? 'Целевой ROI' : 'Target ROI',
    applyHint:    isRu ? 'Сначала запустите AI-ревью' : 'Run AI Review first',
  };

  const applyBtn = `<button class="btn btn-outline btn-sm"
    style="white-space:nowrap"
    ${hasRecs ? '' : 'disabled title="' + labels.applyHint + '"'}
    onclick="applyTgAiRecs(window._tgLastOptRecs||[])">${labels.applyRecs}</button>`;

  const balanceBtn = `<button class="btn btn-sm"
    style="white-space:nowrap;${needBalance ? 'background:linear-gradient(135deg,#4f6ef7,#7c3aed);color:#fff;box-shadow:0 2px 10px rgba(79,110,247,.3)' : 'background:transparent;border:1px solid var(--border);color:var(--text)'}"
    onclick="balanceTgToProfit(window._getTgTargetRoi())">${labels.balance}</button>`;

  const undoBtn = hasUndo
    ? `<button class="btn btn-ghost btn-sm" onclick="undoTgApply()">${labels.undo}</button>`
    : '';

  return `<div id="tg-action-panel" style="background:rgba(79,110,247,.06);border:1px solid rgba(79,110,247,.2);border-radius:10px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
  <div style="display:flex;align-items:center;gap:7px;flex-shrink:0">
    <label style="font-size:.72rem;font-weight:600;color:var(--muted);white-space:nowrap">${labels.targetRoi}:</label>
    <input type="range" min="50" max="200" step="5" value="${targetRoi}"
      style="width:90px;accent-color:var(--accent)"
      oninput="this.nextElementSibling.textContent=this.value+'%';localStorage.setItem('${TG_TARGET_ROI_KEY}',this.value)"
    ><span style="font-size:.82rem;font-weight:700;color:var(--text);min-width:38px">${targetRoi}%</span>
  </div>
  <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
    ${applyBtn}
    ${balanceBtn}
    ${undoBtn}
  </div>
</div>`;
}

// Expose globals for onclick handlers
window._getTgTargetRoi   = _getTgTargetRoi;
window._tgLastOptRecs    = _tgLastOptRecs;
window._balanceSolver    = window._balanceSolver || null; // loaded from balance-solver.js
window._tournamentEcon   = window._tournamentEcon || null; // loaded from tournament-econ.js

function renderOptimizeHTML(data, mode) {
  const lang = localStorage.getItem('bonusLang') || 'en';
  const isRu = lang === 'ru';

  const VERDICT_LABEL = {
    realistic:   isRu ? 'Реалистично'   : 'Realistic',
    optimistic:  isRu ? 'Оптимистично'  : 'Optimistic',
    pessimistic: isRu ? 'Пессимистично' : 'Pessimistic',
  };
  const VERDICT_COLOR = { realistic: '#22c55e', optimistic: '#f59e0b', pessimistic: '#60a5fa' };
  const VERDICT_BG    = { realistic: 'rgba(34,197,94,.1)', optimistic: 'rgba(245,158,11,.1)', pessimistic: 'rgba(96,165,250,.1)' };

  const METRIC_LABEL = {
    participation:  isRu ? 'Participation rate'    : 'Participation rate',
    engagement:     isRu ? 'Вовлечённость'         : 'Engagement',
    roi:            isRu ? 'ROI'                   : 'ROI',
    cost_per_active:isRu ? 'Cost/активный игрок'   : 'Cost per active',
    retention:      isRu ? 'Retention lift'        : 'Retention lift',
    arpu:           isRu ? 'ARPU'                  : 'ARPU',
  };

  const IMPACT_COLOR = { high: '#ef4444', med: '#f59e0b', low: '#60a5fa' };
  const IMPACT_LABEL = { high: isRu ? 'Высокий' : 'High', med: isRu ? 'Средний' : 'Med', low: isRu ? 'Низкий' : 'Low' };

  const r = data.realism;
  const vc = VERDICT_COLOR[r.verdict] || '#a0b0ff';
  const vb = VERDICT_BG[r.verdict]    || 'rgba(160,176,255,.1)';

  const modeTitle = isRu
    ? (mode === 'optimize' ? 'Как улучшить отрицательный результат' : 'Как усилить результат')
    : (mode === 'optimize' ? 'How to improve the negative result' : 'How to strengthen the result');

  const checksHTML = (r.checks || []).map(c => {
    const cc = VERDICT_COLOR[c.verdict] || '#a0b0ff';
    const cb = VERDICT_BG[c.verdict]    || 'rgba(160,176,255,.1)';
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">
      <div style="min-width:130px;font-size:.78rem;color:var(--muted);padding-top:2px">${METRIC_LABEL[c.metric] || c.metric}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px">
          <span style="font-size:.8rem;font-weight:600;color:var(--text)">${c.forecast}</span>
          <span style="font-size:.72rem;color:var(--muted)">vs ${c.benchmark}</span>
          <span style="font-size:.7rem;padding:1px 7px;border-radius:10px;background:${cb};color:${cc};font-weight:600">${VERDICT_LABEL[c.verdict]||c.verdict}</span>
        </div>
        <div style="font-size:.74rem;color:var(--muted)">${c.note}</div>
      </div>
    </div>`;
  }).join('');

  const paramLabels = tg('param_labels');
  const recsHTML = (data.recommendations || []).map(rec => {
    const ic = IMPACT_COLOR[rec.impact] || '#a0b0ff';
    const il = IMPACT_LABEL[rec.impact] || rec.impact;
    const paramName = (paramLabels && paramLabels[rec.param]) || rec.param;
    return `<div style="padding:10px 12px;border:1px solid rgba(255,255,255,.07);border-radius:8px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
        <span style="font-size:.78rem;font-weight:600;color:#c4b5fd">${paramName}</span>
        <span style="font-size:.78rem;color:var(--muted)">${rec.current} → <strong style="color:var(--text)">${rec.target}</strong></span>
        <span style="margin-left:auto;font-size:.7rem;padding:1px 8px;border-radius:10px;background:${ic}22;color:${ic};font-weight:600">${il}</span>
      </div>
      <div style="font-size:.78rem;color:var(--muted)">${rec.reason}</div>
    </div>`;
  }).join('');

  return `<div style="background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.2);border-radius:10px;padding:16px;margin-bottom:16px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
    <div style="font-size:.9rem;font-weight:700;color:#c4b5fd">${isRu?'AI-ревью прогноза':'AI Forecast Review'}</div>
    <div style="font-size:.75rem;padding:2px 10px;border-radius:12px;background:${vb};color:${vc};font-weight:600;border:1px solid ${vc}44">${VERDICT_LABEL[r.verdict]||r.verdict}</div>
  </div>

  <div style="font-size:.82rem;color:var(--text);margin-bottom:14px;line-height:1.5">${r.summary}</div>

  <div style="font-size:.76rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">${isRu?'Реалистичность прогноза по показателям':'Forecast realism by metric'}</div>
  <div style="margin-bottom:16px">${checksHTML}</div>

  <div style="font-size:.76rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">${modeTitle}</div>
  ${recsHTML}
</div>`;
}

// ── SETUP GUIDE ──────────────────────────────────────────────────────────────
function buildTimeline(duration) {
  const timelines = {
    flash: [
      {when:'T−2h',    action:'Announce via push notification',       channel:'Push'},
      {when:'T−30m',   action:'Final reminder push',                  channel:'Push'},
      {when:'T=0',     action:'Tournament opens',                     channel:'System'},
      {when:'T+45m',   action:'Mid-tournament leaderboard update',    channel:'Email'},
      {when:'T+1h',    action:'Tournament closes, scores freeze',     channel:'System'},
      {when:'T+2h',    action:'Winner announcement + prize payouts',  channel:'Push + Email'},
    ],
    daily: [
      {when:'T−1d',    action:'Announcement push + email',            channel:'Push + Email'},
      {when:'T−4h',    action:'Reminder to active players',           channel:'Push'},
      {when:'T=0',     action:'Tournament opens',                     channel:'System'},
      {when:'T+12h',   action:'Mid-tournament leaderboard update',    channel:'Email'},
      {when:'T+24h',   action:'Tournament closes',                    channel:'System'},
      {when:'T+25h',   action:'Winner announcement + prize payouts',  channel:'Push + Email'},
    ],
    weekly: [
      {when:'T−7d',    action:'Announce tournament',                  channel:'Email + Push'},
      {when:'T−3d',    action:'CRM campaign to target segment',       channel:'Email + SMS'},
      {when:'T−1d',    action:'Final reminder',                       channel:'Push'},
      {when:'T=0',     action:'Tournament opens',                     channel:'System'},
      {when:'T+4d',    action:'Mid-point leaderboard update',         channel:'Email'},
      {when:'T+7d',    action:'Tournament closes',                    channel:'System'},
      {when:'T+8d',    action:'Winner announcement + prize payouts',  channel:'Push + Email'},
    ],
    monthly: [
      {when:'T−14d',   action:'Announce + teaser campaign',           channel:'Email'},
      {when:'T−7d',    action:'CRM push to target segment',           channel:'Push + Email'},
      {when:'T−3d',    action:'Pre-launch reminder',                  channel:'SMS + Push'},
      {when:'T=0',     action:'Tournament opens',                     channel:'System'},
      {when:'T+7d',    action:'Week 1 leaderboard update',            channel:'Email'},
      {when:'T+14d',   action:'Mid-point leaderboard',                channel:'Push + Email'},
      {when:'T+30d',   action:'Tournament closes',                    channel:'System'},
      {when:'T+33d',   action:'Winner announcement + prize payouts',  channel:'Push + Email + Popup'},
    ],
    multi_round: [
      {when:'T−7d',    action:'Announce multi-round structure',       channel:'Email + Push'},
      {when:'T−3d',    action:'CRM campaign',                         channel:'Email'},
      {when:'T=0',     action:'Round 1 opens',                        channel:'System'},
      {when:'R1 end',  action:'Qualify top players → Round 2',        channel:'Push + Email'},
      {when:'Final',   action:'Grand final round opens',              channel:'Push'},
      {when:'Final+1d',action:'Grand winner announcement + payouts',  channel:'Push + Email + Popup'},
    ],
  };
  return timelines[duration] || timelines['weekly'];
}

function buildChecklist(spec, params, result) {
  const lic  = result.lic  || 'none';
  const cur  = result.cur  || 'EUR';
  const items = [];
  // Basics
  items.push({text:'Create tournament in backoffice / CMS platform', tag:'Required'});
  items.push({text:'Set tournament name and promotional copy'});
  items.push({text:'Configure start date and end date / time'});
  items.push({text:`Set minimum bet size (house rules, e.g. ${cur} 0.20)`});
  // Entry model
  if (params.entry === 'buyin') {
    items.push({text:'Configure buy-in amount and ticket issuance flow', tag:'Buy-in'});
    items.push({text:'Set refund policy for cancelled tournaments'});
  } else if (params.entry === 'ticket') {
    items.push({text:'Set up ticket distribution via CRM / promotion engine', tag:'Ticket'});
  }
  // Eligible games
  const gameLabel = spec.type === 'slot' ? 'slots' : spec.type === 'live' ? 'live tables' : 'slots + live games';
  items.push({text:`Define eligible game list (${gameLabel})`});
  items.push({text:`Set segment filter: ${params.segment || 'all'} players only`});
  // Scoring
  const scoringMap = {
    total_wins:         'Enable total wins counter in leaderboard engine',
    highest_multiplier: 'Configure per-spin / per-hand multiplier tracking',
    most_spins:         'Enable spin count aggregation for leaderboard',
    mission_based:      'Define mission objectives and progress tracking rules',
  };
  items.push({text: scoringMap[params.scoring] || 'Configure scoring algorithm', tag:'Leaderboard'});
  items.push({text:'Set leaderboard refresh interval (recommended: 5 min)'});
  items.push({text:'Define tiebreaker rule (e.g. first to reach score wins tie)'});
  // Prize pool
  if (params.poolModel === 'dynamic' || params.poolModel === 'hybrid') {
    items.push({text:`Configure rake collection: ${params.rake || 5}% → prize pool`, tag:'Pool'});
  }
  items.push({text:'Fund prize pool account / escrow before launch'});
  items.push({text:`Configure ${spec.distribution} prize distribution schema`});
  items.push({text:'Set payout processing schedule (recommended: within 24h of end)'});
  items.push({text:'Set prize validity period for winners (recommended: 30 days)'});
  // Reentry
  if (params.reentry === 'yes') {
    items.push({text:'Configure re-entry limit and cooldown interval', tag:'Re-entry'});
  }
  // License compliance
  if (lic === 'ukgc') {
    items.push({text:'Confirm no countdown timer is visible to players', tag:'UKGC'});
    items.push({text:'Gamstop self-exclusion check active for tournament opt-in', tag:'UKGC'});
    items.push({text:'Add BeGambleAware link to tournament landing page', tag:'UKGC'});
  } else if (lic === 'dga') {
    items.push({text:'Verify prize cap ≤ 1,000 DKK per player per tournament', tag:'DGA'});
    items.push({text:'ROFUS self-exclusion check on opt-in flow', tag:'DGA'});
    items.push({text:'T&Cs displayed at same font size as promotional headline', tag:'DGA'});
    items.push({text:'Add Stopspillet.dk link to tournament page', tag:'DGA'});
  } else if (lic === 'mga') {
    items.push({text:'Add Terms & Conditions URL to tournament page', tag:'MGA'});
    items.push({text:'Display maximum prize amount prominently in promo copy', tag:'MGA'});
  }
  // QA / Notifications
  items.push({text:'Schedule CRM notifications per launch timeline below'});
  items.push({text:'Prepare winner announcement message (push + email)'});
  items.push({text:'QA: test opt-in flow and leaderboard display before go-live'});
  return items;
}

function renderSetupGuide() {
  if (!lastResult) {
    return `
<div class="step-header">
  <div class="step-badge">📋 Setup Guide</div>
  <div class="step-title">Tournament Setup Guide</div>
  <div class="step-sub">Generate a tournament first to see its setup guide</div>
</div>
<div class="card" style="text-align:center;padding:40px 20px">
  <div style="font-size:2.5rem;margin-bottom:14px">🏆</div>
  <div style="color:var(--muted);font-size:.88rem;margin-bottom:20px">No tournament has been generated yet.</div>
  <button class="btn btn-primary" onclick="goStep(1)">Create a Tournament →</button>
</div>`;
  }

  const r    = lastResult;
  const spec = r.spec;
  const p    = draft.params;
  const cur  = r.cur || 'EUR';
  const lic  = r.lic || 'none';

  const checklist = buildChecklist(spec, p, r);
  const timeline  = buildTimeline(p.duration || 'weekly');

  const prizeRows = (spec.prizes || []).map(pr => `
    <div class="prize-row">
      <span class="prize-place">${pr.place===1?'🥇':pr.place===2?'🥈':pr.place===3?'🥉':'#'+pr.place}</span>
      <div class="prize-bar-wrap"><div class="prize-bar" style="width:${Math.min(pr.pct*3,100)}%"></div></div>
      <span class="prize-pct">${pr.pct}%</span>
      <span class="prize-amt">${cur} ${pr.amount.toLocaleString()}</span>
    </div>`).join('');

  const checklistHtml = checklist.map(item => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <input type="checkbox" style="margin-top:2px;flex-shrink:0;accent-color:var(--accent)">
      <span style="font-size:.82rem;flex:1">${item.text}</span>
      ${item.tag ? `<span style="font-size:.68rem;padding:1px 7px;border-radius:6px;background:rgba(79,110,247,.15);color:#a0b0ff;white-space:nowrap">${item.tag}</span>` : ''}
    </div>`).join('');

  const timelineHtml = timeline.map(ev => `
    <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:.73rem;font-weight:700;color:var(--accent);width:60px;flex-shrink:0">${ev.when}</span>
      <span style="font-size:.82rem;flex:1">${ev.action}</span>
      <span style="font-size:.73rem;color:var(--muted)">${ev.channel}</span>
    </div>`).join('');

  const licBadge = lic !== 'none' ? `<span style="font-size:.72rem;padding:1px 8px;border-radius:6px;background:rgba(245,158,11,.15);color:var(--warn);margin-left:6px">${lic.toUpperCase()}</span>` : '';

  // compact prize summary for guide header (no repeated full table)
  const top3 = (spec.prizes || []).slice(0, 3).map(pr =>
    `${pr.place===1?'🥇':pr.place===2?'🥈':'🥉'} ${cur} ${pr.amount.toLocaleString()}`
  ).join(' · ');

  return `
<div class="step-header">
  <div class="step-badge">📋 Operator Setup Guide</div>
  <div class="step-title">${spec.type.charAt(0).toUpperCase()+spec.type.slice(1)} Tournament${licBadge}</div>
  <div class="step-sub">What you need to configure before going live</div>
</div>

<div style="background:rgba(79,110,247,.07);border:1px solid rgba(79,110,247,.2);border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
  <span style="font-size:.75rem;color:var(--muted)">Prize pool:</span>
  <span style="font-size:.85rem;font-weight:600;color:var(--text)">${cur} ${spec.prizePool.toLocaleString()}</span>
  <span style="font-size:.75rem;color:var(--muted);margin-left:4px">${top3}</span>
  <span style="font-size:.72rem;color:var(--muted);margin-left:auto">${(spec.prizes||[]).length} places · ${spec.distribution}</span>
</div>

<details class="card" style="padding:0">
  <summary style="padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;list-style:none;user-select:none">
    <span style="font-size:.85rem;font-weight:600;color:var(--text);flex:1">${tg('spec_copy_title')}</span>
    <span style="font-size:.75rem;color:var(--muted)">${tg('spec_copy_sub')}</span>
    <button id="btn-copy-spec-guide" class="btn btn-outline btn-sm" style="flex-shrink:0"
            onclick="event.preventDefault();(()=>{const text=buildTechSpec();navigator.clipboard.writeText(text).then(()=>{const b=document.getElementById('btn-copy-spec-guide');const o=b.textContent;b.textContent=tg('spec_copy_done');b.style.color='var(--success)';setTimeout(()=>{b.textContent=o;b.style.color='';},2000);});})()">
      ${tg('spec_copy_btn')}
    </button>
  </summary>
  <div style="padding:0 16px 16px">
    <textarea readonly onclick="this.select()"
      style="width:100%;box-sizing:border-box;background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:monospace;font-size:.72rem;line-height:1.6;padding:12px 14px;resize:vertical;min-height:260px;outline:none">${buildTechSpec()}</textarea>
  </div>
</details>

<div class="card">
  <div class="card-title">Setup Checklist <span style="font-size:.72rem;color:var(--muted);font-weight:400">(${checklist.length} items)</span></div>
  ${checklistHtml}
  <div style="margin-top:10px;font-size:.75rem;color:var(--muted)">Check off items as you configure in your backoffice</div>
</div>

<div class="card">
  <div class="card-title">Launch Timeline</div>
  ${timelineHtml}
</div>

${_gamesData && _gamesData._key === _gamesParamsKey() ? gamesSectionFromData(_gamesData.result) : ''}

<div class="card" style="background:rgba(124,58,237,.06);border-color:rgba(124,58,237,.25)">
  <div class="card-title" style="color:#c4b5fd">🤖 AI Brief</div>
  <div style="font-size:.82rem;color:var(--muted);margin-bottom:14px">Get an AI-generated strategic analysis: key strengths, risks, operator notes, and A/B test ideas for this tournament.</div>
  <button class="btn btn-outline btn-sm" style="border-color:rgba(124,58,237,.4);color:#c4b5fd;cursor:not-allowed;opacity:.6" disabled>
    🤖 Generate AI Brief &nbsp;·&nbsp; Solo+ plan
  </button>
</div>

<div class="nav-footer">
  <button class="btn btn-outline" onclick="goStep(3)">← Back to Economics</button>
  <div style="display:flex;gap:9px">
    <button class="btn btn-outline btn-sm" onclick="exportTournamentPDF()">⬇ PDF</button>
    <button class="btn btn-primary" onclick="goStep(4)">Generate AI Texts →</button>
  </div>
</div>`;
}

// ── ADD TO RETENTION CALENDAR ─────────────────────────────────────────────────
function addTournamentToCalendar(opts = {}) {
  const silent = !!opts.silent; // silent = called from Save: no confirm, no toast, skip dupes
  if (!lastResult) return false;
  const { spec, econ, params, cur } = lastResult;
  const DURATION_DAYS = { flash:1, daily:1, weekly:7, monthly:30, multi_round:10 };
  const days    = DURATION_DAYS[params?.duration] || 7;
  const today   = new Date();
  const monday  = new Date(today); monday.setDate(today.getDate() + ((today.getDay() === 0 ? 1 : 8 - today.getDay())));
  const addD    = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10); };
  const startDate = monday.toISOString().slice(0, 10);
  const campaign = {
    title:      `${(draft.type||'slot').charAt(0).toUpperCase() + (draft.type||'slot').slice(1)} Tournament · ${(params?.geo||'').toUpperCase()}`,
    type:       'tournament',
    segment:    params?.segment  || 'all',
    geo:        params?.geo      || '',
    startDate,
    endDate:    addD(monday, days - 1),
    status:     'draft',
    brands:     ['default'],
    mechanic:   spec?.scoring || '',
    rewards:    { prizePool: spec?.prizePool, currency: cur },
    econ:       econ || null,
    sourceType: 'tournament_generator',
    savedId:    opts.savedId || null,
  };
  const isRu = (localStorage.getItem('bonusLang') || 'en') === 'ru';
  try {
    const camps = JSON.parse(localStorage.getItem('rc_campaigns') || '[]');
    const dupe  = camps.find(c =>
      c.sourceType === 'tournament_generator' &&
      c.geo     === campaign.geo &&
      c.segment === campaign.segment &&
      c.mechanic === campaign.mechanic
    );
    if (dupe) {
      if (silent) return false; // already scheduled — don't create a duplicate event
      const added = new Date(dupe.createdAt).toLocaleDateString();
      const msg   = isRu
        ? `Этот турнир уже добавлен в календарь (${dupe.title}, добавлен ${added}).\nДобавить ещё раз?`
        : `This tournament is already in the calendar (${dupe.title}, added ${added}).\nAdd again?`;
      if (!confirm(msg)) return false;
    }
    const now = new Date().toISOString();
    const rec = { ...campaign, id: 'tg_' + Date.now(), createdAt: now, updatedAt: now };
    camps.push(rec);
    localStorage.setItem('rc_campaigns', JSON.stringify(camps));
    window.RetomatRepo?.mirror('calendar-events', rec.id, rec);
  } catch { return false; }
  if (silent) return true;
  const msg   = isRu ? '📅 Турнир добавлен в Retention Calendar' : '📅 Tournament added to Retention Calendar';
  let toast   = document.getElementById('tg-rc-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tg-rc-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#f8fafc;padding:10px 20px;border-radius:10px;font-size:.85rem;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1)';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `${msg} · <a href="/retention-calendar.html" style="color:var(--gold);font-weight:600">Open →</a>`;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 5000);
  return true;
}

// ── SAVE / DELETE ────────────────────────────────────────────────────────────
function saveTournament() {
  if (!lastResult) return;
  const list = loadTournaments();
  const existing = list.find(t =>
    t.type === draft.type &&
    JSON.stringify(t.params) === JSON.stringify(draft.params)
  );
  if (existing) { showToast('Already saved'); return; }
  const entry = {
    id:        genId(),
    name:      autoName(draft.type, draft.params),
    type:      draft.type,
    params:    { ...draft.params },
    spec:      lastResult.spec,
    econ:      lastResult.econ,
    cur:       lastResult.cur,
    lic:       lastResult.lic,
    region:    lastResult.region,
    games:     (_gamesData && _gamesData._key === _gamesParamsKey()) ? _gamesData.result : null,
    createdAt: new Date().toISOString(),
  };
  list.unshift(entry);
  saveTournaments(list);
  window.RetomatRepo?.mirror('tournaments', entry.id, entry);
  try { addTournamentToCalendar({ silent: true, savedId: entry.id }); } catch {}
  const btn = document.getElementById('btn-save-tournament');
  if (btn) { btn.textContent = '✓ Saved'; btn.disabled = true; btn.style.opacity = '.5'; }
  showToast(tg('toast_saved'));
  updateNavBadge();
}

function deleteTournament(id) {
  if (!confirm(tg('confirm_delete'))) return;
  saveTournaments(loadTournaments().filter(t => t.id !== id));
  window.RetomatRepo?.unmirror('tournaments', id);
  updateNavBadge();
  showToast(tg('toast_deleted'));
  showView('list');
}

function updateNavBadge() { updateAllBadges(); }

function showToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#161c2d;border:1px solid rgba(16,185,129,.35);border-radius:8px;padding:9px 16px;font-size:.83rem;color:#10b981;opacity:0;transition:opacity .25s,transform .25s;z-index:999;pointer-events:none;display:flex;align-items:center;gap:8px';
    document.body.appendChild(el);
  }
  el.textContent = '✓  ' + msg;
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2600);
}

// ── LIST VIEW ────────────────────────────────────────────────────────────────
const TYPE_LABEL = { slot:'Slots', live:'Live Casino', mixed:'Mixed', prize_drop:'Prize Drop' };
const TYPE_ICON  = { slot:'🎰', live:'🃏', mixed:'🎲', prize_drop:'💎' };

function roiBadge(roi) {
  if (roi >= 10)  return `<span class="badge badge-pos">+${roi}% ROI</span>`;
  if (roi >= 0)   return `<span class="badge badge-neu">+${roi}% ROI</span>`;
  return `<span class="badge badge-neg">${roi}% ROI</span>`;
}

function tournRowHTML(t) {
  const roi  = t.econ?.roi ?? 0;
  const cur  = t.cur || '';
  const pool = cur + ' ' + (t.spec?.prizePool || 0).toLocaleString();
  const seg  = t.params?.segment || 'all';
  const dur  = t.params?.duration || '';
  const date = new Date(t.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
  const icon = TYPE_ICON[t.type] || '🏆';
  const lbl  = TYPE_LABEL[t.type] || t.type;
  // Entity-category badge — this list holds tournaments (amber, matches dashboard).
  const catB = `<span style="background:rgba(245,158,11,.15);color:#f59e0b;padding:1px 7px;border-radius:5px;font-size:.62rem;font-weight:700;vertical-align:middle;margin-left:6px;white-space:nowrap">${localStorage.getItem('bonusLang') === 'ru' ? 'Турнир' : 'Tournament'}</span>`;
  return `<div class="ct-row" onclick="showView('detail','${t.id}')">
    <div>
      <div class="ct-name">${icon} ${t.name}${catB}</div>
      <div class="ct-meta">${lbl} · ${seg} · ${dur}</div>
    </div>
    <div class="ct-cell" style="font-size:.75rem">${pool}</div>
    <div>${roiBadge(roi)}</div>
    <div class="ct-cell">${date}</div>
    <div style="text-align:right">
      <button class="btn btn-ghost btn-sm" style="padding:4px 8px" onclick="event.stopPropagation();showTournMenu('${t.id}',this)">···</button>
    </div>
  </div>`;
}

let _openTournMenu = null;
function closeTournMenu() {
  if (_openTournMenu) { _openTournMenu.remove(); _openTournMenu = null; }
}
function showTournMenu(id, btn) {
  closeTournMenu();
  const menu = document.createElement('div');
  menu.className = 'tourn-menu';
  menu.innerHTML = `
    <button class="tourn-menu-item" onclick="showView('detail','${id}')">↗ Details</button>
    <button class="tourn-menu-item" onclick="loadAndShowGuide('${id}')">📋 Setup Guide</button>
    <button class="tourn-menu-item" onclick="loadAndRegenTexts('${id}')">✦ AI Texts</button>
    <div class="tourn-menu-sep"></div>
    <button class="tourn-menu-item" onclick="deleteTournament('${id}')" style="color:#f87171">🗑 Delete</button>`;
  document.body.appendChild(menu);
  _openTournMenu = menu;
  const r  = btn.getBoundingClientRect();
  const mh = menu.offsetHeight || 160;
  const top = (window.innerHeight - r.bottom) < (mh + 8) ? r.top - mh - 4 : r.bottom + 4;
  menu.style.top   = top + 'px';
  menu.style.right = (window.innerWidth - r.right) + 'px';
  setTimeout(() => document.addEventListener('click', closeTournMenu, { once: true }), 10);
}

function renderList() {
  const list = loadTournaments();

  if (list.length === 0) {
    return `
<div class="step-header">
  <div class="step-badge">🏆 ${tg('list_title')}</div>
  <div class="step-title">${tg('list_lib_title')}</div>
  <div class="step-sub">${tg('list_empty')}</div>
</div>
<div class="card" style="text-align:center;padding:40px 20px">
  <div style="font-size:2.5rem;margin-bottom:14px">🏆</div>
  <div style="color:var(--muted);font-size:.88rem;margin-bottom:20px">${tg('list_empty_sub')}</div>
  <button class="btn btn-primary" onclick="goStep(1)">${tg('list_create')}</button>
</div>`;
  }

  return `
<div style="margin-bottom:16px">
  <div style="font-size:1.1rem;font-weight:700;color:var(--text)">${tg('list_title')}</div>
  <div style="font-size:.8rem;color:var(--muted);margin-top:2px">${tg('list_saved', list.length)}</div>
</div>
<div class="ctable">
  <div class="ct-hd">
    <span>${tg('list_hdr_name')}</span><span>${tg('list_hdr_prize')}</span><span>${tg('list_hdr_roi')}</span><span>${tg('list_hdr_date')}</span><span></span>
  </div>
  ${list.map(tournRowHTML).join('')}
</div>
<div style="margin-top:16px;text-align:center">
  <button class="btn btn-primary" onclick="goStep(1)">${tg('list_new')}</button>
</div>`;
}

// ── DETAIL VIEW ──────────────────────────────────────────────────────────────
function renderDetail(id) {
  const t = loadTournaments().find(t => t.id === id);
  if (!t) return `<div class="card">${tg('det_not_found')} <button class="btn btn-ghost" onclick="showView('list')">${tg('det_back')}</button></div>`;

  const e    = t.econ || {};
  const spec = t.spec || {};
  const cur  = t.cur  || '';
  const roi  = typeof e.roi === 'number' ? e.roi : Number(e.roi) || 0;

  function fmtCur(n) {
    // Thin records (e.g. calendar-synced tournaments with no econ) leave scenario
    // fields undefined — coerce to 0 so we render "0", not "NaN".
    return cur + ' ' + Math.abs(Math.round(Number(n) || 0)).toLocaleString();
  }

  const dur = t.params?.duration || 'weekly';
  const pctMap = { flash:{lo:'3%',mi:'7%',hi:'12%'}, daily:{lo:'5%',mi:'10%',hi:'18%'},
    weekly:{lo:'8%',mi:'15%',hi:'25%'}, monthly:{lo:'10%',mi:'18%',hi:'30%'},
    multi_round:{lo:'6%',mi:'12%',hi:'20%'} };
  const pct = pctMap[dur] || pctMap['weekly'];

  const scenarios = [
    { label:tg('low_lbl', pct.lo),  lift:e.ggrLiftLow,  net:e.netMarginLow,  pl:e.participantsLow,  cpp:e.costPerActiveLow  },
    { label:tg('exp_lbl', pct.mi),  lift:e.ggrLiftMid,  net:e.netMarginMid,  pl:e.participantsMid,  cpp:e.costPerActiveMid  },
    { label:tg('high_lbl', pct.hi), lift:e.ggrLiftHigh, net:e.netMarginHigh, pl:e.participantsHigh, cpp:e.costPerActiveHigh },
  ];

  const econCards = scenarios.map(s => {
    const netClass = s.net >= 0 ? 'pos' : 'neg';
    return `<div class="econ-card">
      <div class="econ-label">${s.label}</div>
      <div class="econ-val ${netClass}">${s.net>=0?'+':''}${fmtCur(s.net)}</div>
      <div class="econ-sub">${tg('players_ggr', s.pl, fmtCur(s.lift))}</div>
      <div class="econ-sub">${tg('cost_active', fmtCur(s.cpp))}</div>
    </div>`;
  }).join('');

  const engMul  = e.engagementMultiplier || 2.5;
  const retVal  = e.retentionValue || 0;
  const totVal  = e.totalValueMid  || e.netMarginMid || 0;
  const totClass = totVal >= 0 ? 'pos' : 'neg';

  const prizeRows = (spec.prizes || []).map(pr => `
    <div class="prize-row">
      <span class="prize-place">${pr.place===1?'🥇':pr.place===2?'🥈':pr.place===3?'🥉':'#'+pr.place}</span>
      <div class="prize-bar-wrap"><div class="prize-bar" style="width:${Math.min(pr.pct*3,100)}%"></div></div>
      <span class="prize-pct">${pr.pct}%</span>
      <span class="prize-amt">${cur} ${pr.amount.toLocaleString()}</span>
    </div>`).join('');

  const date = new Date(t.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

  return `
<div style="margin-bottom:18px">
  <button class="btn btn-ghost btn-sm" onclick="showView('list')" style="padding:0;margin-bottom:10px;color:var(--muted);font-size:.8rem">${tg('det_back')}</button>
  <div style="display:flex;align-items:flex-start;gap:14px">
    <div style="width:46px;height:46px;border-radius:10px;background:rgba(79,110,247,.15);border:1px solid rgba(79,110,247,.3);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">
      ${{ slot:'🎰', live:'🃏', mixed:'🎲', prize_drop:'💎' }[t.type] || '🏆'}
    </div>
    <div>
      <div style="font-size:1.15rem;font-weight:700;color:var(--text);margin-bottom:4px">${t.name}</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">
        <span style="font-size:.75rem;padding:2px 8px;border-radius:99px;background:rgba(79,110,247,.15);color:#a0b0ff">${t.lic?.toUpperCase() || 'NONE'}</span>
        <span style="font-size:.75rem;padding:2px 8px;border-radius:99px;background:rgba(79,110,247,.12);color:#a0b0ff">${t.params?.segment || 'all'}</span>
        <span style="font-size:.75rem;padding:2px 8px;border-radius:99px;background:rgba(79,110,247,.12);color:#a0b0ff">${dur}</span>
        <span style="font-size:.75rem;color:var(--muted)">${tg('det_saved', date)}</span>
      </div>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title">${tg('summary_title')}</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:.82rem">
    <div><span style="color:var(--muted)">${tg('field_type')}</span> ${spec.type || t.type}</div>
    <div><span style="color:var(--muted)">${tg('field_dur')}</span> ${spec.duration || dur}</div>
    <div><span style="color:var(--muted)">${tg('field_entry')}</span> ${spec.entryModel || '—'}</div>
    <div><span style="color:var(--muted)">${tg('field_scoring')}</span> ${spec.scoring || '—'}</div>
    <div><span style="color:var(--muted)">${tg('field_pool')}</span> ${spec.poolModel || '—'}</div>
    <div><span style="color:var(--muted)">${tg('field_reentry')}</span> ${spec.reentry || '—'}</div>
    <div><span style="color:var(--muted)">${tg('field_prize')}</span> <strong>${fmtCur(spec.prizePool || 0)}</strong></div>
    <div><span style="color:var(--muted)">${tg('field_dist')}</span> ${spec.distribution || '—'}</div>
    <div><span style="color:var(--muted)">${tg('field_roi')}</span> <strong style="color:${roi>=0?'var(--success)':'#ef4444'}">${roi>=0?'+':''}${roi}%</strong></div>
  </div>
  ${e.breakEvenParticipants > 0 ? `<div style="margin-top:10px;font-size:.78rem;color:var(--muted)">${tg('breakeven_hint', e.breakEvenParticipants)}</div>` : ''}
</div>

<div class="card">
  <div class="card-title">${tg('prize_dist', cur, (spec.prizePool||0).toLocaleString())}</div>
  ${prizeRows}
</div>

<div class="card">
  <div class="card-title">${tg('econ_title')}</div>
  <div class="econ-grid">${econCards}</div>
  <div style="margin-top:14px;padding:12px 14px;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.2);border-radius:8px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
    <div style="flex:1;min-width:160px">
      <div style="font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">${tg('total_val')}</div>
      <div style="font-size:1.1rem;font-weight:700;color:${totClass==='pos'?'var(--success)':'#ef4444'}">${totVal>=0?'+':''}${fmtCur(totVal)}</div>
      <div style="font-size:.72rem;color:var(--muted);margin-top:2px">${tg('ggr_plus_ret')}</div>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <div style="text-align:center">
        <div style="font-size:.68rem;color:var(--muted);margin-bottom:2px">${tg('engagement_lbl')}</div>
        <div style="font-size:.88rem;font-weight:600;color:#a0b0ff">×${engMul.toFixed(1)}</div>
        <div style="font-size:.65rem;color:var(--muted)">${tg('vs_normal')}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:.68rem;color:var(--muted);margin-bottom:2px">${tg('retention_val')}</div>
        <div style="font-size:.88rem;font-weight:600;color:var(--success)">+${fmtCur(retVal)}</div>
        <div style="font-size:.65rem;color:var(--muted)">${tg('uplift')}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:.68rem;color:var(--muted);margin-bottom:2px">${tg('full_roi')}</div>
        <div style="font-size:.88rem;font-weight:600;color:${roi>=0?'var(--success)':'#ef4444'}">${roi>=0?'+':''}${roi}%</div>
        <div style="font-size:.65rem;color:var(--muted)">${tg('on_prize')}</div>
      </div>
    </div>
  </div>
  <div style="font-size:.7rem;color:var(--muted);margin-top:10px">
    ${tg('eligible_note', e.eligible || 0, t.params?.segment || 'all', Math.round((e.segmentRatio||1)*100), (t.params?.totalPlayers||e.totalPlayers||5000).toLocaleString(), e.arpu || 0, engMul.toFixed(1))}
  </div>
</div>

${gamesSectionFromData(t.games)}

<div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap">
  <button class="btn btn-outline" style="flex:1;border-color:rgba(124,58,237,.4);color:#c4b5fd" onclick="loadAndShowGuide('${t.id}')">${tg('det_setup_guide')}</button>
  <button class="btn btn-outline" style="flex:1;border-color:rgba(79,110,247,.4);color:#a0b0ff" onclick="loadAndRegenTexts('${t.id}')">${tg('det_ai_texts')}</button>
  <button class="btn btn-outline btn-sm" style="color:var(--muted);border-color:var(--border)" onclick="deleteTournament('${t.id}')">${tg('det_delete')}</button>
</div>`;
}

// ── LOAD HELPERS ─────────────────────────────────────────────────────────────
function loadAndShowGuide(id) {
  const t = loadTournaments().find(t => t.id === id);
  if (!t) return;
  lastResult   = { spec: t.spec, econ: t.econ, cur: t.cur, lic: t.lic, region: t.region };
  draft.type   = t.type;
  draft.params = { ...t.params };
  // Restore saved games so Setup Guide shows them without a new fetch
  if (t.games) {
    _gamesData = { _key: _gamesParamsKey(), result: t.games };
  }
  showView('setup');
}

function loadAndRegenTexts(id) {
  const t = loadTournaments().find(t => t.id === id);
  if (!t) return;
  lastResult   = { spec: t.spec, econ: t.econ, cur: t.cur, lic: t.lic, region: t.region };
  lastTexts    = null;
  lastAudit    = null;
  lastDesc     = null;
  draft.type   = t.type;
  draft.params = { ...t.params };
  goStep(4);
}

// Init
function resolveInitialTournamentView() {
  const view = getInitialView(null);
  if (view === 'list' || view === 'setup' || view === 'generator') {
    showView(view);
  } else if (hasActiveGenerator && step > 0) {
    renderStep();
  } else {
    loadTournaments().length > 0 ? showView('list') : renderStep();
  }
}

updateAllBadges();
setTournLang(localStorage.getItem('bonusLang') || 'en');
resolveInitialTournamentView();
document.querySelector('.main').classList.add('ready');

// nav-utils runs the migrate+hydrate sync for logged-in users and fires this
// event once the localStorage cache reflects the server; refresh the list then.
window.addEventListener('retomat:synced', () => {
  updateAllBadges();
  if (_tgCurrentView === 'list') showView('list');
});

window.addEventListener('pageshow', function() {
  updateAllBadges();
  resolveInitialTournamentView();
});

function toggleTournGlossary() {
  let panel = document.getElementById('tourn-glossary-panel');
  if (panel) { panel.remove(); return; }
  panel = document.createElement('div');
  panel.id = 'tourn-glossary-panel';
  panel.style.cssText = 'position:fixed;top:54px;right:0;width:360px;max-width:100vw;height:calc(100vh - 54px);background:#0f1420;border-left:1px solid #1e2740;z-index:200;display:flex;flex-direction:column;box-shadow:-8px 0 32px rgba(0,0,0,.5);overflow-y:auto;padding:20px';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <span style="font-size:.88rem;font-weight:700;color:#e8eaf0">Glossary</span>
      <button onclick="document.getElementById('tourn-glossary-panel').remove()"
        style="background:rgba(255,255,255,.08);border:none;color:#8892a4;width:26px;height:26px;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">✕</button>
    </div>
    ${[
      ['Prize Pool','Total value of rewards distributed to tournament winners'],
      ['Leaderboard','Ranking of players by score during the tournament'],
      ['Entry Model','How players join: Freeroll (free), Buy-in (paid), or Ticket (earned)'],
      ['Scoring','Metric used to rank players: total wins, highest multiplier, most spins, or missions'],
      ['Eligible Players','Players who qualify to participate based on segment filter'],
      ['Segment Ratio','Fraction of total active players in the target segment'],
      ['ARPU','Average Revenue Per User per month in USD'],
      ['Prize Drop','Random prizes awarded during gameplay, not leaderboard-based'],
      ['Multi-Round','Tournament spanning several rounds with cumulative scoring'],
      ['Rake','Percentage of player bets that contributes to a dynamic prize pool'],
    ].map(([term,def]) => `
      <div style="padding:10px 0;border-bottom:1px solid #1e2740">
        <div style="font-size:.8rem;font-weight:700;color:#a0b0ff;margin-bottom:3px">${term}</div>
        <div style="font-size:.76rem;color:#8892a4;line-height:1.5">${def}</div>
      </div>`).join('')}
  `;
  document.body.appendChild(panel);
}
