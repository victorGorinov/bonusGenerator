/* ═══════════════════════════════════════════════════════════════════════════
   reports.js — Reports SPA logic: hub, wizard, preview, PDF export
   ═══════════════════════════════════════════════════════════════════════════ */

// ── i18n ─────────────────────────────────────────────────────────────────────

const RI18N = {
  en: {
    // Hub
    hub_title:       'Reports',
    hub_desc:        'Generate C-level reports for campaigns, comparisons, and period plans.',
    hub_empty_title: 'No reports yet',
    hub_empty_desc:  'Create your first report to present campaign plans to stakeholders.',
    hub_new:         '+ New Report',
    hub_filter_all:  'All',
    hub_filter_single: 'Single',
    hub_filter_comparison: 'Comparison',
    hub_filter_period: 'Period',
    hub_count:       '{0} reports',
    hub_delete_confirm: 'Delete this report?',

    // Wizard step labels
    wiz_s1:     'Type',
    wiz_s2:     'Activities',
    wiz_s3:     'Options',
    wiz_next:   'Next',
    wiz_back:   'Back',
    wiz_generate: 'Generate Report',

    // Step 1 — Type
    s1_title:   'Report Type',
    s1_sub:     'Choose the type of report you want to create.',
    type_single:       'Single Campaign',
    type_single_desc:  'Deep dive into one activity — economics, structure, risks.',
    type_comparison:       'Comparison',
    type_comparison_desc:  'Side-by-side comparison of 2–5 activities.',
    type_period:       'Period Plan',
    type_period_desc:  'Calendar period overview with forecast & cannibalization.',

    // Step 2 — Activities
    s2_title:         'Select Activities',
    s2_sub_single:    'Choose one activity for detailed analysis.',
    s2_sub_comparison:'Choose 2–5 activities to compare.',
    s2_sub_period:    'Choose activities for the period plan.',
    s2_empty:         'No saved activities found. Create campaigns in generators first.',
    s2_selected:      '{0} selected',
    s2_period_range:  'Report Period',
    s2_date_start:    'Start',
    s2_date_end:      'End',
    tab_all:          'All',
    tab_bonus:        'Bonus',
    tab_tournament:   'Tournament',
    tab_loyalty:      'Loyalty',

    // Step 3 — Options
    s3_title:      'Report Options',
    s3_sub:        'Configure your report before generating.',
    s3_report_title: 'Report Title',
    s3_title_placeholder: 'e.g. Q3 VIP Reactivation Plan',
    s3_ai_summary: 'AI Executive Summary',
    s3_ai_desc:    'AI-generated 3-6 sentence summary for C-level audience.',
    s3_structure:  'Structure Details',
    s3_struct_desc:'Include bonus/tournament/loyalty configuration details.',
    s3_audit:      'Audit Results',
    s3_audit_desc: 'Include compliance audit checks (if available).',

    // Preview
    prv_back_list:  '← Back to reports',
    prv_pdf:        'Export PDF',
    prv_print:      'Print',
    prv_delete:     'Delete',
    prv_ai_label:   'AI Executive Summary',
    prv_ai_error:   'AI summary unavailable — try regenerating the report',
    prv_params:     'Input Parameters',
    prv_econ:       'Economics',
    prv_structure:  'Structure',
    prv_audit:      'Audit',
    prv_forecast:   'Forecast',
    prv_activities: 'Activities',
    prv_pairs:      'Cannibalization Pairs',
    prv_coverage:   'Coverage',
    prv_created:    'Created',
    prv_scenarios:  'Scenarios',
    prv_metrics:    'Key Metrics',

    // Generating
    gen_title:     'Generating Report',
    gen_sub:       'This may take a few seconds...',
    gen_snapshot:  'Taking data snapshot',
    gen_forecast:  'Computing forecast',
    gen_ai:        'Generating AI summary',
    gen_saving:    'Saving report',

    // Misc
    toast_deleted: 'Report deleted',
    toast_saved:   'Report saved',
    no_data:       '—',

    // Param labels
    p_geo: 'GEO', p_segment: 'Segment', p_players: 'Players', p_avgdep: 'Avg. Deposit',
    p_rtp: 'RTP', p_plat: 'Platform', p_lic: 'License', p_type: 'Type',
    p_duration: 'Duration', p_prizePool: 'Prize Pool', p_mode: 'Mode',
    p_arpu: 'ARPU', p_numTiers: 'Tiers', p_topCashback: 'Top Cashback',
    p_totalPlayers: 'Total Players', p_sitecur: 'Currency',

    // Econ labels — decision-focused
    e_sec_costs: 'Campaign Costs', e_sec_forecast: 'Revenue & Profit Forecast',
    e_campaign_cost: 'Campaign Cost (P50)', e_max_risk: 'Maximum Risk (P90)',
    e_cost_ratio: 'Cost / Deposits',
    e_rev_1m: 'Revenue (1 mo)', e_rev_3m: 'Revenue (3 mo)',
    e_profit_1m: 'Profit (1 mo)', e_profit_3m: 'Profit (3 mo)',
    e_roi: 'ROI (3 mo)',
    e_prize_pool: 'Prize Pool Cost', e_ggr_lift: 'GGR Lift (expected)',
    e_net_margin: 'Net Margin', e_total_value: 'Total Value', e_retention_val: 'Retention Value',
    e_monthly_cost: 'Monthly Cost', e_cost_3m: 'Cost (3 mo)',
    e_add_rev_3m: 'Additional Revenue (3 mo)', e_retention_lift: 'Retention Lift',
    e_breakeven: 'Break-even', e_per_month: '/mo',

    // Forecast
    f_gross: 'Gross', f_overlap: 'Cannibalization', f_net: 'Net', f_profit: 'Net Profit',
    f_withEcon: 'with econ', f_of: 'of',

    // Structure labels
    str_bonus_type: 'Bonus Type', str_match_bonus: 'Match Bonus', str_match_pct: 'Match %',
    str_max_bonus: 'Max Bonus', str_min_deposit: 'Min Deposit', str_wager: 'Wagering',
    str_currency: 'Currency', str_freespins: 'Free Spins', str_ndb: 'No Deposit Bonus',
    str_reload: 'Reload', str_cashback: 'Cashback',
    str_tourn_type: 'Tournament Type', str_scoring: 'Scoring', str_prizes: 'Prizes', str_places: 'places',
    str_tiers: 'Tiers', str_levels: 'levels', str_missions: 'Missions', str_mode: 'Mode',
    str_earn_rate: 'Earn Rate', str_redeem_rate: 'Redeem Rate',
  },
  ru: {
    hub_title:       'Отчёты',
    hub_desc:        'Генерируйте C-level отчёты по кампаниям, сравнениям и планам периода.',
    hub_empty_title: 'Отчётов пока нет',
    hub_empty_desc:  'Создайте первый отчёт для презентации планов кампаний.',
    hub_new:         '+ Новый отчёт',
    hub_filter_all:  'Все',
    hub_filter_single: 'Одиночный',
    hub_filter_comparison: 'Сравнение',
    hub_filter_period: 'Период',
    hub_count:       '{0} отчётов',
    hub_delete_confirm: 'Удалить этот отчёт?',

    wiz_s1:     'Тип',
    wiz_s2:     'Активности',
    wiz_s3:     'Настройки',
    wiz_next:   'Далее',
    wiz_back:   'Назад',
    wiz_generate: 'Сгенерировать отчёт',

    s1_title:   'Тип отчёта',
    s1_sub:     'Выберите тип отчёта.',
    type_single:       'Одна кампания',
    type_single_desc:  'Детальный анализ одной активности — экономика, структура, риски.',
    type_comparison:       'Сравнение',
    type_comparison_desc:  'Сравнение 2–5 активностей бок о бок.',
    type_period:       'План периода',
    type_period_desc:  'Обзор периода с прогнозом и каннибализацией.',

    s2_title:         'Выберите активности',
    s2_sub_single:    'Выберите одну активность для анализа.',
    s2_sub_comparison:'Выберите 2–5 активностей для сравнения.',
    s2_sub_period:    'Выберите активности для плана периода.',
    s2_empty:         'Нет сохранённых активностей. Сначала создайте кампании в генераторах.',
    s2_selected:      '{0} выбрано',
    s2_period_range:  'Период отчёта',
    s2_date_start:    'Начало',
    s2_date_end:      'Конец',
    tab_all:          'Все',
    tab_bonus:        'Бонус',
    tab_tournament:   'Турнир',
    tab_loyalty:      'Лояльность',

    s3_title:      'Настройки отчёта',
    s3_sub:        'Настройте параметры перед генерацией.',
    s3_report_title: 'Название отчёта',
    s3_title_placeholder: 'напр. План VIP-реактивации Q3',
    s3_ai_summary: 'AI Executive Summary',
    s3_ai_desc:    'AI-сгенерированное резюме (3-6 предложений) для руководства.',
    s3_structure:  'Детали структуры',
    s3_struct_desc:'Включить конфигурацию бонуса/турнира/лояльности.',
    s3_audit:      'Результаты аудита',
    s3_audit_desc: 'Включить проверки комплаенса (если есть).',

    prv_back_list:  '← Назад к отчётам',
    prv_pdf:        'Экспорт PDF',
    prv_print:      'Печать',
    prv_delete:     'Удалить',
    prv_ai_label:   'AI Executive Summary',
    prv_ai_error:   'AI-сводка недоступна — попробуйте перегенерировать отчёт',
    prv_params:     'Входные параметры',
    prv_econ:       'Экономика',
    prv_structure:  'Структура',
    prv_audit:      'Аудит',
    prv_forecast:   'Прогноз',
    prv_activities: 'Активности',
    prv_pairs:      'Пары каннибализации',
    prv_coverage:   'Покрытие',
    prv_created:    'Создан',
    prv_scenarios:  'Сценарии',
    prv_metrics:    'Ключевые метрики',

    gen_title:     'Генерация отчёта',
    gen_sub:       'Это может занять несколько секунд...',
    gen_snapshot:  'Снимок данных',
    gen_forecast:  'Расчёт прогноза',
    gen_ai:        'Генерация AI-резюме',
    gen_saving:    'Сохранение отчёта',

    toast_deleted: 'Отчёт удалён',
    toast_saved:   'Отчёт сохранён',
    no_data:       '—',

    p_geo: 'ГЕО', p_segment: 'Сегмент', p_players: 'Игроки', p_avgdep: 'Ср. депозит',
    p_rtp: 'RTP', p_plat: 'Платформа', p_lic: 'Лицензия', p_type: 'Тип',
    p_duration: 'Длительность', p_prizePool: 'Призовой фонд', p_mode: 'Режим',
    p_arpu: 'ARPU', p_numTiers: 'Уровней', p_topCashback: 'Макс. кешбэк',
    p_totalPlayers: 'Всего игроков', p_sitecur: 'Валюта',

    e_sec_costs: 'Затраты на кампанию', e_sec_forecast: 'Прогноз выручки и прибыли',
    e_campaign_cost: 'Стоимость кампании (P50)', e_max_risk: 'Максимальный риск (P90)',
    e_cost_ratio: 'Стоимость / Депозиты',
    e_rev_1m: 'Выручка (1 мес)', e_rev_3m: 'Выручка (3 мес)',
    e_profit_1m: 'Прибыль (1 мес)', e_profit_3m: 'Прибыль (3 мес)',
    e_roi: 'ROI (3 мес)',
    e_prize_pool: 'Стоимость призового фонда', e_ggr_lift: 'GGR Lift (ожидаемый)',
    e_net_margin: 'Чистая маржа', e_total_value: 'Общая ценность', e_retention_val: 'Ценность ретенции',
    e_monthly_cost: 'Ежемесячные затраты', e_cost_3m: 'Затраты (3 мес)',
    e_add_rev_3m: 'Доп. выручка (3 мес)', e_retention_lift: 'Рост ретенции',
    e_breakeven: 'Окупаемость', e_per_month: '/мес',

    f_gross: 'Брутто', f_overlap: 'Каннибализация', f_net: 'Нетто', f_profit: 'Нетто прибыль',
    f_withEcon: 'с экономикой', f_of: 'из',

    str_bonus_type: 'Тип бонуса', str_match_bonus: 'Матч-бонус', str_match_pct: 'Матч %',
    str_max_bonus: 'Макс. бонус', str_min_deposit: 'Мин. депозит', str_wager: 'Вейджер',
    str_currency: 'Валюта', str_freespins: 'Фриспины', str_ndb: 'Бонус без депозита',
    str_reload: 'Релоад', str_cashback: 'Кешбэк',
    str_tourn_type: 'Тип турнира', str_scoring: 'Скоринг', str_prizes: 'Призы', str_places: 'мест',
    str_tiers: 'Уровни', str_levels: 'уровней', str_missions: 'Миссии', str_mode: 'Режим',
    str_earn_rate: 'Ставка начисления', str_redeem_rate: 'Ставка обмена',
  },
};

let _lang = localStorage.getItem('bonusLang') || 'en';

function rt(key) {
  const args = Array.prototype.slice.call(arguments, 1);
  let s = RI18N[_lang]?.[key] ?? RI18N.en[key] ?? key;
  args.forEach(function(a, i) { s = s.replace('{' + i + '}', a); });
  return s;
}

function setReportLang(lang) {
  _lang = lang;
  localStorage.setItem('bonusLang', lang);
  document.documentElement.setAttribute('data-lang', lang);
  document.getElementById('lt-en').classList.toggle('active', lang === 'en');
  document.getElementById('lt-ru').classList.toggle('active', lang === 'ru');
  if (typeof applyNavLang === 'function') applyNavLang(lang);
  render();
}

// ── State ────────────────────────────────────────────────────────────────────

const RS = {
  view:    'list',       // 'list' | 'wizard' | 'preview' | 'generating'
  reports: [],
  filter:  'all',

  wizard: {
    step:        1,
    type:        null,
    selected:    [],
    options:     { includeAiSummary: true, includeStructure: true, includeAudit: false },
    title:       '',
    periodStart: '',
    periodEnd:   '',
    actFilter:   'all',
  },

  current: null,
};

const REPORTS_KEY = 'savedReports';

function loadReports() {
  try { return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]'); } catch { return []; }
}
function persistReports() {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(RS.reports));
  updateReportsBadge();
}
function updateReportsBadge() {
  const el = document.getElementById('nav-reports-badge');
  if (!el) return;
  const n = RS.reports.length;
  if (n > 0) { el.textContent = n; el.style.display = ''; }
  else { el.style.display = 'none'; }
}

// ── Data collection — normalize all sources into ActivitySnapshot ────────────

function collectAllActivities() {
  const all = [];
  const seen = new Set();

  function add(snap) {
    if (!snap || seen.has(snap.sourceId)) return;
    seen.add(snap.sourceId);
    all.push(snap);
  }

  // 1. Retention Calendar
  try {
    const rc = JSON.parse(localStorage.getItem('rc_campaigns') || '[]');
    rc.forEach(function(c) { add(normalizeRC(c)); });
  } catch(e) { /* ignore */ }

  // 2. Saved bonuses (Campaign Generator)
  try {
    const camps = JSON.parse(localStorage.getItem('be_campaigns') || '[]');
    camps.forEach(function(c) { add(normalizeBE(c)); });
  } catch(e) { /* ignore */ }

  // 3. Saved tournaments
  try {
    const tourns = JSON.parse(localStorage.getItem('savedTournaments') || '[]');
    tourns.forEach(function(c) { add(normalizeTournament(c)); });
  } catch(e) { /* ignore */ }

  // 4. Saved loyalty programs
  try {
    const loyals = JSON.parse(localStorage.getItem('savedLoyaltyPrograms') || '[]');
    loyals.forEach(function(c) { add(normalizeLoyalty(c)); });
  } catch(e) { /* ignore */ }

  return all;
}

function normalizeBE(c) {
  return {
    sourceId:    c.id || 'be_' + (c.date || Date.now()),
    sourceType:  'campaign_generator',
    sourceStore: 'be_campaigns',
    title:       c.name || c.scenario?.lbl || 'Campaign',
    promoType:   'bonus',
    geo:         c.params?.geo || c.scenario?.geo || '',
    segment:     c.params?.segment || c.scenario?.seg || '',
    startDate:   c.startDate || '',
    endDate:     c.endDate || '',
    params:      c.params || {},
    econ:        c.econ || null,
    cur:         c.forecastSnapshot?.sitecur || c.params?.sitecur || 'USD',
    structure:   c.mechanic || c.config || null,
    audit:       c.audit || null,
    _raw:        c,
  };
}

function normalizeTournament(c) {
  return {
    sourceId:    c.id || 'tn_' + (c.createdAt || Date.now()),
    sourceType:  'tournament_generator',
    sourceStore: 'savedTournaments',
    title:       c.name || 'Tournament',
    promoType:   'tournament',
    geo:         c.params?.geo || '',
    segment:     c.params?.segment || '',
    startDate:   c.startDate || '',
    endDate:     c.endDate || '',
    params:      c.params || {},
    econ:        c.econ || null,
    structure:   c.spec || null,
    audit:       null,
    _raw:        c,
  };
}

function normalizeLoyalty(c) {
  var cfg = c.result?.config || c.config || {};
  var econ = c.result?.econ || c.econ || null;
  return {
    sourceId:    c.id || 'ly_' + (c.createdAt || Date.now()),
    sourceType:  'loyalty_generator',
    sourceStore: 'savedLoyaltyPrograms',
    title:       c.name || 'Loyalty Program',
    promoType:   'loyalty',
    geo:         c.params?.region || cfg.region || '',
    segment:     c.params?.segment || cfg.segment || '',
    startDate:   c.startDate || '',
    endDate:     c.endDate || '',
    params:      c.params || {},
    econ:        econ,
    structure:   cfg,
    audit:       null,
    _raw:        c,
  };
}

function normalizeRC(c) {
  var pt = 'bonus';
  if (c.sourceType === 'tournament_generator' || c.type === 'tournament') pt = 'tournament';
  else if (c.sourceType === 'loyalty_generator' || c.type === 'vip') pt = 'loyalty';
  return {
    sourceId:    c.id || 'rc_' + Date.now() + Math.random(),
    sourceType:  c.sourceType || 'manual',
    sourceStore: 'rc_campaigns',
    title:       c.title || c.name || 'Campaign',
    promoType:   pt,
    geo:         c.geo || c.extendedProps?.geo || '',
    segment:     c.segment || c.extendedProps?.segment || '',
    startDate:   c.start || c.startDate || '',
    endDate:     c.end || c.endDate || '',
    params:      c.params || c.extendedProps || {},
    econ:        c.econ || c.extendedProps?.econ || null,
    structure:   c.structure || c.extendedProps?.config || null,
    audit:       null,
    _raw:        c,
  };
}

// ── Rendering ────────────────────────────────────────────────────────────────

function render() {
  var el = document.getElementById('content');
  if (!el) return;
  switch (RS.view) {
    case 'list':       el.innerHTML = renderHub(); break;
    case 'wizard':     el.innerHTML = renderWizard(); break;
    case 'preview':    el.innerHTML = renderPreview(); break;
    case 'generating': el.innerHTML = renderGenerating(); break;
  }
  updateTopbar();
}

function updateTopbar() {
  var sub = document.getElementById('topbar-step');
  if (!sub) return;
  switch (RS.view) {
    case 'list':    sub.textContent = rt('hub_title'); break;
    case 'wizard':  sub.textContent = rt('wiz_s' + RS.wizard.step); break;
    case 'preview': sub.textContent = RS.current?.title || ''; break;
    default:        sub.textContent = '';
  }
  var btn = document.getElementById('btn-new-report');
  if (btn) btn.style.display = RS.view === 'list' ? '' : 'none';
}

// ── View: Hub (list) ─────────────────────────────────────────────────────────

function renderHub() {
  var reports = RS.reports;
  if (RS.filter !== 'all') reports = reports.filter(function(r) { return r.type === RS.filter; });

  var filterHTML = '<div class="act-tabs" style="margin-bottom:16px">' +
    ['all','single','comparison','period'].map(function(f) {
      return '<button class="act-tab' + (RS.filter === f ? ' on' : '') + '" onclick="setFilter(\'' + f + '\')">' + rt('hub_filter_' + f) + '</button>';
    }).join('') + '</div>';

  if (RS.reports.length === 0) {
    return '<div class="empty-state">' +
      '<div class="empty-icon">📋</div>' +
      '<div class="empty-title">' + rt('hub_empty_title') + '</div>' +
      '<div class="empty-desc">' + rt('hub_empty_desc') + '</div>' +
      '<button class="btn btn-primary" onclick="showView(\'wizard\')">' + rt('hub_new') + '</button>' +
    '</div>';
  }

  var count = '<div style="font-size:.75rem;color:var(--muted);margin-bottom:12px">' + rt('hub_count', reports.length) + '</div>';

  var cards = reports.map(function(r) {
    var typeIcon = r.type === 'single' ? '📄' : r.type === 'comparison' ? '⚖️' : '📅';
    var tags = [];
    var types = {};
    (r.activities || []).forEach(function(a) { types[a.promoType] = true; });
    Object.keys(types).forEach(function(t) {
      tags.push('<span class="rpt-tag ' + t + '">' + t + '</span>');
    });
    var date = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '';
    var actCount = (r.activities || []).length;

    return '<div class="rpt-card" onclick="openReport(\'' + r.id + '\')">' +
      '<div class="rpt-icon ' + r.type + '">' + typeIcon + '</div>' +
      '<div class="rpt-info">' +
        '<div class="rpt-title">' + esc(r.title) + '</div>' +
        '<div class="rpt-meta">' + date + ' · ' + actCount + ' activities</div>' +
      '</div>' +
      '<div class="rpt-tags">' + tags.join('') + '</div>' +
      '<div class="rpt-actions">' +
        '<button class="rpt-act-btn" title="Delete" onclick="event.stopPropagation();deleteReport(\'' + r.id + '\')">🗑</button>' +
      '</div>' +
    '</div>';
  }).join('');

  return filterHTML + count + '<div style="display:flex;flex-direction:column;gap:8px">' + cards + '</div>';
}

// ── View: Wizard ─────────────────────────────────────────────────────────────

function renderWizard() {
  var progress = renderWizProgress();
  var body = '';
  switch (RS.wizard.step) {
    case 1: body = renderStep1(); break;
    case 2: body = renderStep2(); break;
    case 3: body = renderStep3(); break;
  }
  return progress + body;
}

function renderWizProgress() {
  var steps = [rt('wiz_s1'), rt('wiz_s2'), rt('wiz_s3')];
  var html = '<div class="wiz-progress">';
  steps.forEach(function(lbl, i) {
    var n = i + 1;
    var cls = n < RS.wizard.step ? 'done' : n === RS.wizard.step ? 'active' : '';
    var lblCls = n === RS.wizard.step ? ' active' : '';
    if (i > 0) html += '<div class="wp-conn' + (n <= RS.wizard.step ? ' done' : '') + '"></div>';
    html += '<div class="wp-step"><div class="wp-circle ' + cls + '">' +
      (cls === 'done' ? '✓' : n) + '</div><span class="wp-lbl' + lblCls + '">' + lbl + '</span></div>';
  });
  return html + '</div>';
}

// Step 1 — Type
function renderStep1() {
  var types = [
    { key: 'single',     icon: '📄', cls: 'single' },
    { key: 'comparison', icon: '⚖️', cls: 'comparison' },
    { key: 'period',     icon: '📅', cls: 'period' },
  ];
  var cards = types.map(function(t) {
    var sel = RS.wizard.type === t.key ? ' selected' : '';
    return '<div class="type-opt' + sel + '" onclick="selectType(\'' + t.key + '\')">' +
      '<div class="type-opt-icon rpt-icon ' + t.cls + '">' + t.icon + '</div>' +
      '<div class="type-opt-name">' + rt('type_' + t.key) + '</div>' +
      '<div class="type-opt-desc">' + rt('type_' + t.key + '_desc') + '</div>' +
    '</div>';
  }).join('');

  return '<div class="step-header">' +
    '<div class="step-title">' + rt('s1_title') + '</div>' +
    '<div class="step-sub">' + rt('s1_sub') + '</div>' +
  '</div>' +
  '<div class="type-pick">' + cards + '</div>' +
  '<div class="nav-footer">' +
    '<button class="btn btn-ghost" onclick="showView(\'list\')">' + rt('wiz_back') + '</button>' +
    '<button class="btn btn-primary" ' + (!RS.wizard.type ? 'disabled' : '') +
      ' onclick="wizNext()">' + rt('wiz_next') + '</button>' +
  '</div>';
}

// Step 2 — Activities
function renderStep2() {
  var all = collectAllActivities();
  var filtered = all;
  if (RS.wizard.actFilter !== 'all') {
    filtered = all.filter(function(a) { return a.promoType === RS.wizard.actFilter; });
  }

  var subKey = 's2_sub_' + RS.wizard.type;
  var tabs = '<div class="act-tabs">' +
    ['all','bonus','tournament','loyalty'].map(function(f) {
      return '<button class="act-tab' + (RS.wizard.actFilter === f ? ' on' : '') +
        '" onclick="setActFilter(\'' + f + '\')">' + rt('tab_' + f) + '</button>';
    }).join('') + '</div>';

  var items = '';
  if (filtered.length === 0) {
    items = '<div style="text-align:center;color:var(--muted);padding:20px">' + rt('s2_empty') + '</div>';
  } else {
    items = filtered.map(function(a) {
      var isSelected = RS.wizard.selected.some(function(s) { return s.sourceId === a.sourceId; });
      var tagCls = a.promoType;
      var detail = (a.geo || '').toUpperCase() + (a.segment ? ' · ' + a.segment : '');
      return '<div class="act-item' + (isSelected ? ' selected' : '') + '" onclick="toggleActivity(\'' + a.sourceId + '\')">' +
        '<input type="checkbox" ' + (isSelected ? 'checked' : '') + ' onclick="event.stopPropagation();toggleActivity(\'' + a.sourceId + '\')">' +
        '<div class="act-info">' +
          '<div class="act-name">' + esc(a.title) + '</div>' +
          '<div class="act-detail">' + esc(detail) + '</div>' +
        '</div>' +
        '<span class="rpt-tag ' + tagCls + '">' + a.promoType + '</span>' +
      '</div>';
    }).join('');
  }

  var selCount = '<div style="font-size:.75rem;color:var(--muted);margin-bottom:12px">' +
    rt('s2_selected', RS.wizard.selected.length) + '</div>';

  // Period date range
  var periodHTML = '';
  if (RS.wizard.type === 'period') {
    periodHTML = '<div class="card" style="margin-top:16px">' +
      '<div class="card-title">' + rt('s2_period_range') + '</div>' +
      '<div style="display:flex;gap:12px">' +
        '<div class="form-row" style="flex:1">' +
          '<label class="form-label">' + rt('s2_date_start') + '</label>' +
          '<input type="date" class="form-input" value="' + RS.wizard.periodStart + '" onchange="RS.wizard.periodStart=this.value">' +
        '</div>' +
        '<div class="form-row" style="flex:1">' +
          '<label class="form-label">' + rt('s2_date_end') + '</label>' +
          '<input type="date" class="form-input" value="' + RS.wizard.periodEnd + '" onchange="RS.wizard.periodEnd=this.value">' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  var canNext = canProceedStep2();

  return '<div class="step-header">' +
    '<div class="step-title">' + rt('s2_title') + '</div>' +
    '<div class="step-sub">' + rt(subKey) + '</div>' +
  '</div>' +
  tabs + selCount + items + periodHTML +
  '<div class="nav-footer">' +
    '<button class="btn btn-ghost" onclick="wizBack()">' + rt('wiz_back') + '</button>' +
    '<button class="btn btn-primary" ' + (!canNext ? 'disabled' : '') +
      ' onclick="wizNext()">' + rt('wiz_next') + '</button>' +
  '</div>';
}

function canProceedStep2() {
  var sel = RS.wizard.selected.length;
  if (RS.wizard.type === 'single') return sel === 1;
  if (RS.wizard.type === 'comparison') return sel >= 2 && sel <= 5;
  if (RS.wizard.type === 'period') return sel >= 1;
  return false;
}

// Step 3 — Options
function renderStep3() {
  var o = RS.wizard.options;
  var autoTitle = generateAutoTitle();
  var titleVal = RS.wizard.title || autoTitle;

  return '<div class="step-header">' +
    '<div class="step-title">' + rt('s3_title') + '</div>' +
    '<div class="step-sub">' + rt('s3_sub') + '</div>' +
  '</div>' +
  '<div class="card">' +
    '<div class="form-row">' +
      '<label class="form-label">' + rt('s3_report_title') + '</label>' +
      '<input class="form-input" id="rpt-title-input" value="' + esc(titleVal) + '" placeholder="' + rt('s3_title_placeholder') + '" oninput="RS.wizard.title=this.value">' +
    '</div>' +
    renderToggle('includeAiSummary', rt('s3_ai_summary'), rt('s3_ai_desc')) +
    renderToggle('includeStructure', rt('s3_structure'), rt('s3_struct_desc')) +
    renderToggle('includeAudit', rt('s3_audit'), rt('s3_audit_desc')) +
  '</div>' +
  '<div class="nav-footer">' +
    '<button class="btn btn-ghost" onclick="wizBack()">' + rt('wiz_back') + '</button>' +
    '<button class="btn btn-primary btn-lg" onclick="doGenerate()">' + rt('wiz_generate') + '</button>' +
  '</div>';
}

function renderToggle(key, label, desc) {
  var checked = RS.wizard.options[key] ? ' checked' : '';
  return '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-top:1px solid var(--border)">' +
    '<input type="checkbox" style="margin-top:3px;accent-color:var(--accent)"' + checked + ' onchange="RS.wizard.options[\'' + key + '\']=this.checked">' +
    '<div><div style="font-size:.85rem;font-weight:600">' + label + '</div>' +
    '<div style="font-size:.75rem;color:var(--muted);margin-top:2px">' + desc + '</div></div>' +
  '</div>';
}

function generateAutoTitle() {
  var sel = RS.wizard.selected;
  if (sel.length === 0) return '';
  if (RS.wizard.type === 'single') return sel[0].title;
  if (RS.wizard.type === 'comparison') {
    return sel.map(function(a) { return a.title; }).join(' vs ');
  }
  if (RS.wizard.type === 'period') {
    return (RS.wizard.periodStart || '?') + ' — ' + (RS.wizard.periodEnd || '?');
  }
  return '';
}

// ── View: Generating (preloader) ─────────────────────────────────────────────

function renderGenerating() {
  return '<div class="prog-wrap">' +
    '<div class="prog-title">' + rt('gen_title') + '</div>' +
    '<div class="prog-sub">' + rt('gen_sub') + '</div>' +
    '<ul class="prog-list">' +
      '<li class="pl-item" id="gen-step-snapshot"><span class="pl-icon">📸</span>' + rt('gen_snapshot') + '</li>' +
      '<li class="pl-item" id="gen-step-forecast"><span class="pl-icon">📊</span>' + rt('gen_forecast') + '</li>' +
      '<li class="pl-item" id="gen-step-ai"><span class="pl-icon">🤖</span>' + rt('gen_ai') + '</li>' +
      '<li class="pl-item" id="gen-step-save"><span class="pl-icon">💾</span>' + rt('gen_saving') + '</li>' +
    '</ul>' +
  '</div>';
}

function setGenStep(id, state) {
  var el = document.getElementById(id);
  if (!el) return;
  el.className = 'pl-item ' + state;
  if (state === 'running') {
    el.querySelector('.pl-icon').textContent = '';
    el.insertAdjacentHTML('afterbegin', '<span class="pl-icon"><span class="spinner" style="width:14px;height:14px"></span></span>');
  } else if (state === 'done') {
    var icon = el.querySelector('.pl-icon');
    if (icon) icon.textContent = '✓';
  }
}

// ── View: Preview ────────────────────────────────────────────────────────────

function renderPreview() {
  var r = RS.current;
  if (!r) return '<div class="empty-state"><div class="empty-icon">📋</div></div>';

  var typeLabel = rt('type_' + r.type);
  var date = r.createdAt ? new Date(r.createdAt).toLocaleDateString() + ' ' + new Date(r.createdAt).toLocaleTimeString() : '';

  var toolbar = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">' +
    '<button class="btn btn-ghost btn-sm" onclick="showView(\'list\')">' + rt('prv_back_list') + '</button>' +
    '<div style="flex:1"></div>' +
    '<button class="btn btn-outline btn-sm" onclick="exportPDF()">' + rt('prv_pdf') + '</button>' +
    '<button class="btn btn-outline btn-sm" onclick="window.print()">' + rt('prv_print') + '</button>' +
    '<button class="btn btn-ghost btn-sm" style="color:#ef4444" onclick="deleteReport(\'' + r.id + '\')">' + rt('prv_delete') + '</button>' +
  '</div>';

  var header = '<div class="rpt-header">' +
    '<div class="rpt-header-type">' + esc(typeLabel) + '</div>' +
    '<div class="rpt-header-title">' + esc(r.title) + '</div>' +
    '<div class="rpt-header-date">' + rt('prv_created') + ': ' + date + '</div>' +
  '</div>';

  var body = '';
  switch (r.type) {
    case 'single':     body = renderSingleReport(r); break;
    case 'comparison': body = renderComparisonReport(r); break;
    case 'period':     body = renderPeriodReport(r); break;
  }

  return toolbar + '<div id="report-content">' + header + body + '</div>';
}

// ── Single Report ────────────────────────────────────────────────────────────

function renderSingleReport(r) {
  var a = r.activities[0];
  if (!a) return '';
  var html = '';

  // AI Summary
  if (r.aiSummary) {
    html += '<div class="rpt-section">' +
      '<div class="ai-summary">' +
        '<div class="ai-summary-label">' + rt('prv_ai_label') + '</div>' +
        '<div class="ai-summary-text">' + esc(r.aiSummary) + '</div>' +
      '</div>' +
    '</div>';
  } else if (r.aiSummaryError) {
    html += '<div class="rpt-section">' +
      '<div class="ai-summary" style="color:var(--muted);font-style:italic">' + rt('prv_ai_error') + '</div>' +
    '</div>';
  }

  // Params
  html += '<div class="rpt-section">' +
    '<div class="rpt-section-title">' + rt('prv_params') + '</div>' +
    renderParamsTable([a]) +
  '</div>';

  // Economics
  if (a.econ) {
    html += '<div class="rpt-section">' +
      '<div class="rpt-section-title">' + rt('prv_econ') + '</div>' +
      renderEconGrid(a) +
    '</div>';
  }

  // Structure
  if (r.options.includeStructure && a.structure) {
    html += '<div class="rpt-section">' +
      '<div class="rpt-section-title">' + rt('prv_structure') + '</div>' +
      renderStructure(a) +
    '</div>';
  }

  // Audit
  if (r.options.includeAudit && a.audit) {
    html += '<div class="rpt-section">' +
      '<div class="rpt-section-title">' + rt('prv_audit') + '</div>' +
      renderAudit(a.audit) +
    '</div>';
  }

  return html;
}

// ── Comparison Report ────────────────────────────────────────────────────────

function renderComparisonReport(r) {
  var html = '';

  // AI Summary
  if (r.aiSummary) {
    html += '<div class="rpt-section">' +
      '<div class="ai-summary">' +
        '<div class="ai-summary-label">' + rt('prv_ai_label') + '</div>' +
        '<div class="ai-summary-text">' + esc(r.aiSummary) + '</div>' +
      '</div>' +
    '</div>';
  } else if (r.aiSummaryError) {
    html += '<div class="rpt-section">' +
      '<div class="ai-summary" style="color:var(--muted);font-style:italic">' + rt('prv_ai_error') + '</div>' +
    '</div>';
  }

  // Params comparison table
  html += '<div class="rpt-section">' +
    '<div class="rpt-section-title">' + rt('prv_params') + '</div>' +
    renderParamsTable(r.activities) +
  '</div>';

  // Metrics comparison
  html += '<div class="rpt-section">' +
    '<div class="rpt-section-title">' + rt('prv_metrics') + '</div>' +
    renderMetricsComparison(r.activities) +
  '</div>';

  // Structures side-by-side
  if (r.options.includeStructure) {
    var structs = r.activities.filter(function(a) { return a.structure; });
    if (structs.length > 0) {
      html += '<div class="rpt-section">' +
        '<div class="rpt-section-title">' + rt('prv_structure') + '</div>' +
        '<div class="struct-grid" style="grid-template-columns:repeat(' + Math.min(structs.length, 3) + ',1fr)">' +
        structs.map(function(a) {
          return '<div class="struct-card">' +
            '<div class="struct-card-title">' + esc(a.title) + '</div>' +
            '<div class="struct-card-body">' + renderStructure(a) + '</div>' +
          '</div>';
        }).join('') +
        '</div>' +
      '</div>';
    }
  }

  return html;
}

// ── Period Report ────────────────────────────────────────────────────────────

function renderPeriodReport(r) {
  var html = '';

  // AI Summary
  if (r.aiSummary) {
    html += '<div class="rpt-section">' +
      '<div class="ai-summary">' +
        '<div class="ai-summary-label">' + rt('prv_ai_label') + '</div>' +
        '<div class="ai-summary-text">' + esc(r.aiSummary) + '</div>' +
      '</div>' +
    '</div>';
  } else if (r.aiSummaryError) {
    html += '<div class="rpt-section">' +
      '<div class="ai-summary" style="color:var(--muted);font-style:italic">' + rt('prv_ai_error') + '</div>' +
    '</div>';
  }

  // Forecast summary cards
  if (r.forecast) {
    var f = r.forecast;
    html += '<div class="rpt-section">' +
      '<div class="rpt-section-title">' + rt('prv_forecast') + '</div>' +
      '<div class="forecast-cards">' +
        fcCard(rt('f_gross'), fmtUsd(f.gross), 'green') +
        fcCard(rt('f_overlap'), '−' + fmtUsd(f.overlapLoss), 'red') +
        fcCard(rt('f_net'), fmtUsd(f.net), 'green') +
        fcCard(rt('f_profit'), fmtUsd(f.netProfit), f.netProfit >= 0 ? 'green' : 'red') +
      '</div>';

    // Coverage
    if (f.coverage) {
      html += '<div style="font-size:.78rem;color:var(--muted);margin-bottom:12px">' +
        rt('prv_coverage') + ': ' + f.coverage.withEcon + ' ' + rt('f_withEcon') + ' ' +
        rt('f_of') + ' ' + f.coverage.total + '</div>';
    }

    // Pairs
    if (f.pairs && f.pairs.length > 0) {
      html += '<div style="margin-top:16px"><div style="font-size:.82rem;font-weight:600;margin-bottom:8px">' + rt('prv_pairs') + '</div>';
      f.pairs.slice(0, 5).forEach(function(p) {
        html += '<div class="pair-row">' +
          '<span style="flex:1">' + esc(p.a || p.nameA || '?') + ' × ' + esc(p.b || p.nameB || '?') + '</span>' +
          '<span class="pair-loss">−' + fmtUsd(p.loss || 0) + '</span>' +
        '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
  }

  // Activities list
  html += '<div class="rpt-section">' +
    '<div class="rpt-section-title">' + rt('prv_activities') + ' (' + r.activities.length + ')</div>' +
    renderParamsTable(r.activities) +
  '</div>';

  return html;
}

// ── Shared render helpers ────────────────────────────────────────────────────

function renderParamsTable(activities) {
  if (activities.length === 0) return '';
  var paramKeys = ['geo','segment','players','avgdep','totalPlayers','rtp','plat','lic','type','duration','prizePool','mode','numTiers','topCashback','sitecur','arpu'];
  // Filter to keys that have at least one value
  var activeKeys = paramKeys.filter(function(k) {
    return activities.some(function(a) {
      var v = a.params?.[k] ?? a[k];
      return v != null && v !== '';
    });
  });

  if (activities.length === 1) {
    var a = activities[0];
    var rows = activeKeys.map(function(k) {
      var v = a.params?.[k] ?? a[k] ?? rt('no_data');
      return '<tr><td style="color:var(--muted);font-weight:600;width:140px">' + rt('p_' + k) + '</td><td>' + esc(String(v)) + '</td></tr>';
    }).join('');
    return '<table class="cmp-table"><tbody>' + rows + '</tbody></table>';
  }

  // Multi-column
  var thead = '<tr><th></th>' + activities.map(function(a) { return '<th class="center">' + esc(a.title) + '</th>'; }).join('') + '</tr>';
  var tbody = activeKeys.map(function(k) {
    return '<tr><td style="color:var(--muted);font-weight:600">' + rt('p_' + k) + '</td>' +
      activities.map(function(a) {
        var v = a.params?.[k] ?? a[k] ?? rt('no_data');
        return '<td class="center">' + esc(String(v)) + '</td>';
      }).join('') + '</tr>';
  }).join('');
  return '<table class="cmp-table"><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>';
}

var _SITECUR_TO_USD = { USD:1, USDT:1, SC:1, EUR:1/0.92, GBP:1/0.79,
  DKK:1/7.37, RUB:1/90.9, KZT:1/500, MNT:1/3448, BTC:1/0.000015, ETH:1/0.00042 };

function renderEconGrid(a) {
  var E = a.econ;
  if (!E) return '<div style="color:var(--muted)">' + rt('no_data') + '</div>';

  var cur = a.cur || 'USD';
  var fx = _SITECUR_TO_USD[cur] || 1;

  // Helper: render a two-column row
  function row(label, val, cls) {
    var vcls = cls === 'pos' ? 'color:#4ade80' : cls === 'neg' ? 'color:#f87171' : '';
    return '<tr><td style="padding:6px 16px 6px 0;color:var(--muted);font-weight:600;white-space:nowrap">' +
      label + '</td><td style="padding:6px 0;font-size:.95rem;' + vcls + '">' + val + '</td></tr>';
  }
  function section(title) {
    return '<tr><td colspan="2" style="padding:14px 0 6px;font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--accent)">' +
      title + '</td></tr>';
  }

  var rows = '';

  if (a.promoType === 'bonus') {
    var p50cost = E.sP50?.cost;
    var maxRisk = E.maxRisk;
    var costUsd = p50cost != null ? Math.round(p50cost * fx) : null;
    var rev1m = E.pl && E.arpu ? Math.round(E.pl * E.arpu) : null;
    var rev3m = E.totLTV || (E.pl && E.ltv3 ? Math.round(E.pl * E.ltv3) : null);
    var profit1m = rev1m != null && costUsd != null ? rev1m - costUsd : null;
    var profit3m = rev3m != null && costUsd != null ? rev3m - costUsd : null;

    // Costs section
    rows += section(rt('e_sec_costs'));
    rows += row(rt('e_campaign_cost'), p50cost != null ? fmtNum(p50cost) + ' ' + cur : '—', '');
    rows += row(rt('e_max_risk'), maxRisk != null ? fmtNum(maxRisk) + ' ' + cur : '—', 'neg');
    rows += row(rt('e_cost_ratio'), E.costRatio != null ? fmtPct(E.costRatio) : '—', '');

    // Forecast section
    rows += section(rt('e_sec_forecast'));
    rows += row(rt('e_rev_1m'), rev1m != null ? '$' + fmtNum(rev1m) : '—', '');
    rows += row(rt('e_rev_3m'), rev3m != null ? '$' + fmtNum(rev3m) : '—', '');
    rows += row(rt('e_profit_1m'), profit1m != null ? '$' + fmtNum(profit1m) : '—', profit1m > 0 ? 'pos' : 'neg');
    rows += row(rt('e_profit_3m'), profit3m != null ? '$' + fmtNum(profit3m) : '—', profit3m > 0 ? 'pos' : 'neg');
    rows += row(rt('e_roi'), E.roi3 != null ? fmtNum(E.roi3) + '%' : '—', 'pos');

  } else if (a.promoType === 'tournament') {
    var tCur = cur;
    var tFx = fx;
    var tRev1m = E.ggrLiftMid;
    var tProfit1m = E.netMarginMid;
    var tRev1mUsd = tRev1m != null ? Math.round(tRev1m * tFx) : null;
    var tProfit1mUsd = tProfit1m != null ? Math.round(tProfit1m * tFx) : null;

    rows += section(rt('e_sec_costs'));
    rows += row(rt('e_prize_pool'), E.prizePoolCost != null ? fmtNum(E.prizePoolCost) + ' ' + tCur : '—', '');

    rows += section(rt('e_sec_forecast'));
    rows += row(rt('e_ggr_lift'), tRev1mUsd != null ? '$' + fmtNum(tRev1mUsd) : (tRev1m != null ? fmtNum(tRev1m) + ' ' + tCur : '—'), '');
    rows += row(rt('e_net_margin'), tProfit1mUsd != null ? '$' + fmtNum(tProfit1mUsd) : (tProfit1m != null ? fmtNum(tProfit1m) + ' ' + tCur : '—'), tProfit1m > 0 ? 'pos' : 'neg');
    rows += row(rt('e_retention_val'), E.retentionValue != null ? '$' + fmtNum(Math.round(E.retentionValue * tFx)) : '—', 'pos');
    rows += row(rt('e_total_value'), E.totalValueMid != null ? '$' + fmtNum(Math.round(E.totalValueMid * tFx)) : '—', 'pos');
    rows += row(rt('e_roi'), E.roi != null ? fmtNum(E.roi) + '%' : '—', 'pos');

  } else if (a.promoType === 'loyalty') {
    var lCost1m = E.monthlyCostUSD;
    var lCost3m = lCost1m != null ? Math.round(lCost1m * 3) : null;
    var lAddRev3m = E.additionalRevenue3m;
    var lProfit3m = lAddRev3m != null && lCost3m != null ? Math.round(lAddRev3m - lCost3m) : null;

    rows += section(rt('e_sec_costs'));
    rows += row(rt('e_monthly_cost'), lCost1m != null ? '$' + fmtNum(lCost1m) + rt('e_per_month') : '—', '');
    rows += row(rt('e_cost_3m'), lCost3m != null ? '$' + fmtNum(lCost3m) : '—', '');

    rows += section(rt('e_sec_forecast'));
    rows += row(rt('e_add_rev_3m'), lAddRev3m != null ? '$' + fmtNum(Math.round(lAddRev3m)) : '—', '');
    rows += row(rt('e_profit_3m'), lProfit3m != null ? '$' + fmtNum(lProfit3m) : '—', lProfit3m > 0 ? 'pos' : 'neg');
    rows += row(rt('e_retention_lift'), E.retentionLiftPct != null ? fmtNum(E.retentionLiftPct) + '%' : '—', 'pos');
    rows += row(rt('e_roi'), E.roi3m != null ? fmtNum((E.roi3m * 100).toFixed(0)) + '%' : '—', 'pos');
    rows += row(rt('e_breakeven'), E.breakEvenMonths != null ? E.breakEvenMonths + ' ' + rt('e_per_month').replace('/', '') : '—', '');
  }

  return '<table style="width:100%;border-collapse:collapse">' + rows + '</table>';
}

// econ field names differ per promoType (bonus/tournament/loyalty econ shapes are
// unrelated — see CLAUDE.md "Critical data model pitfalls"). Map each comparison
// metric to its per-type source field and normalize to a common unit before compare.
function getComparableMetric(a, key) {
  var E = a.econ;
  if (!E) return null;
  var cur = a.cur || 'USD';
  var fx = _SITECUR_TO_USD[cur] || 1;
  if (key === 'campaignCost') {
    if (a.promoType === 'bonus') return E.sP50?.cost != null ? Math.round(E.sP50.cost * fx) : null;
    if (a.promoType === 'tournament') return E.prizePoolCost != null ? Math.round(E.prizePoolCost * fx) : null;
    if (a.promoType === 'loyalty') return E.monthlyCostUSD != null ? Math.round(E.monthlyCostUSD * 3) : null;
    return null;
  }
  if (key === 'profit3m') {
    if (a.promoType === 'bonus') {
      var rev3 = E.totLTV || (E.pl && E.ltv3 ? Math.round(E.pl * E.ltv3) : null);
      var cost = E.sP50?.cost != null ? Math.round(E.sP50.cost * fx) : null;
      return rev3 != null && cost != null ? rev3 - cost : null;
    }
    if (a.promoType === 'tournament') return E.totalValueMid != null ? Math.round(E.totalValueMid * fx) : null;
    if (a.promoType === 'loyalty') {
      var lRev = E.additionalRevenue3m;
      var lCost = E.monthlyCostUSD != null ? Math.round(E.monthlyCostUSD * 3) : null;
      return lRev != null && lCost != null ? Math.round(lRev - lCost) : null;
    }
    return null;
  }
  if (key === 'costRatio') {
    if (a.promoType === 'bonus')   return E.costRatio != null ? E.costRatio : null;
    if (a.promoType === 'loyalty') return E.costRatioPct != null ? E.costRatioPct / 100 : null;
    return null;
  }
  if (key === 'roi') {
    if (a.promoType === 'bonus')      return E.roi3 != null ? E.roi3 : null;
    if (a.promoType === 'tournament') return E.roi  != null ? E.roi  : null;
    if (a.promoType === 'loyalty')    return E.roi3m != null ? E.roi3m * 100 : null;
  }
  return null;
}

function renderMetricsComparison(activities) {
  var defs = [
    { key: 'campaignCost', label: rt('e_campaign_cost'), lowerBetter: true,  fmt: function(v) { return '$' + fmtNum(v); } },
    { key: 'profit3m',     label: rt('e_profit_3m'),     lowerBetter: false, fmt: function(v) { return '$' + fmtNum(v); } },
    { key: 'costRatio',    label: rt('e_cost_ratio'),    lowerBetter: true,  fmt: function(v) { return fmtPct(v); } },
    { key: 'roi',          label: rt('e_roi'),           lowerBetter: false, fmt: function(v) { return fmtNum(v) + '%'; } },
  ];

  // Filter to metrics that have data
  var activeDefs = defs.filter(function(d) {
    return activities.some(function(a) { return getComparableMetric(a, d.key) != null; });
  });

  if (activeDefs.length === 0) return '<div style="color:var(--muted)">' + rt('no_data') + '</div>';

  return '<div class="metric-grid">' + activeDefs.map(function(d) {
    var vals = activities.map(function(a) { return getComparableMetric(a, d.key); });
    var nums = vals.filter(function(v) { return v != null; });
    var best = d.lowerBetter ? Math.min.apply(null, nums) : Math.max.apply(null, nums);

    var items = activities.map(function(a, i) {
      var v = vals[i];
      if (v == null) return '<div style="font-size:.78rem;color:var(--muted)">' + esc(a.title) + ': —</div>';
      var cls = v === best ? 'best' : 'neutral';
      return '<div style="font-size:.78rem;margin-top:4px"><span style="color:var(--muted)">' +
        esc(a.title) + ':</span> <span class="metric-val ' + cls + '" style="font-size:.88rem">' + d.fmt(v) + '</span></div>';
    }).join('');

    return '<div class="metric-card"><div class="metric-label">' + d.label + '</div>' + items + '</div>';
  }).join('') + '</div>';
}

function fmtCur(val, cur) {
  if (val == null) return '—';
  var symbols = { EUR:'€', USD:'$', GBP:'£', DKK:'kr ', RUB:'₽', KZT:'₸', MNT:'₮', BTC:'₿', ETH:'Ξ' };
  var sym = symbols[cur] || (cur ? cur + ' ' : '');
  return sym + fmtNum(val);
}

function renderStructure(a) {
  if (!a.structure) return '<div style="color:var(--muted)">' + rt('no_data') + '</div>';
  var s = a.structure;
  var rows = [];

  if (a.promoType === 'bonus') {
    // Nested format: { welcome:{...}, ndb:{...}, ... }
    if (s.welcome) {
      rows.push([rt('str_bonus_type'), rt('str_match_bonus')]);
      rows.push([rt('str_match_pct'), (s.welcome.match || s.welcome.bonusPercent || '?') + '%']);
      if (s.welcome.maxB) rows.push([rt('str_max_bonus'), fmtCur(s.welcome.maxB, s.welcome.cur)]);
      if (s.welcome.minD) rows.push([rt('str_min_deposit'), fmtCur(s.welcome.minD, s.welcome.cur)]);
      if (s.welcome.wager) rows.push([rt('str_wager'), s.welcome.wager + 'x']);
    }
    if (s.ndb) rows.push([rt('str_ndb'), fmtCur(s.ndb.amount || s.ndb.bonus, s.ndb.cur)]);
    if (s.reload) rows.push([rt('str_reload'), (s.reload.match || s.reload.bonusPercent || '?') + '%']);
    if (s.cashback) rows.push([rt('str_cashback'), (s.cashback.pct || s.cashback.percent || '?') + '%']);
    if (s.fsSpec) rows.push([rt('str_freespins'), (s.fsSpec.count || '?') + ' FS']);

    // Flat mechanic format: { type:'match', pct:100, maxB:1000, minD:10, cur:'EUR', fs:200 }
    if (rows.length === 0 && s.type) {
      var typeLabels = { match: rt('str_match_bonus'), ndb: rt('str_ndb'), reload: rt('str_reload'), cashback: rt('str_cashback'), freespins: rt('str_freespins') };
      rows.push([rt('str_bonus_type'), typeLabels[s.type] || s.type]);
      if (s.pct != null) rows.push([rt('str_match_pct'), s.pct + '%']);
      if (s.maxB != null) rows.push([rt('str_max_bonus'), fmtCur(s.maxB, s.cur)]);
      if (s.minD != null) rows.push([rt('str_min_deposit'), fmtCur(s.minD, s.cur)]);
      if (s.wager != null) rows.push([rt('str_wager'), s.wager + 'x']);
      if (s.cur) rows.push([rt('str_currency'), s.cur]);
      if (s.fs) rows.push([rt('str_freespins'), s.fs + ' FS']);
    }
  } else if (a.promoType === 'tournament') {
    if (s.type) rows.push([rt('str_tourn_type'), s.type]);
    if (s.scoring) rows.push([rt('str_scoring'), s.scoring]);
    if (s.prizeStructure) rows.push([rt('str_prizes'), (s.prizeStructure.length || '?') + ' ' + rt('str_places')]);
  } else if (a.promoType === 'loyalty') {
    if (s.mode) rows.push([rt('str_mode'), s.mode]);
    if (s.tiers) rows.push([rt('str_tiers'), s.tiers.length + ' ' + rt('str_levels')]);
    if (s.missions) rows.push([rt('str_missions'), s.missions.length]);
    if (s.earnRedeem) {
      if (s.earnRedeem.earnRateDeposit) rows.push([rt('str_earn_rate'), s.earnRedeem.earnRateDeposit + ' pts']);
      if (s.earnRedeem.redeemRate) rows.push([rt('str_redeem_rate'), s.earnRedeem.redeemRate]);
    }
  }

  // Final fallback
  if (rows.length === 0) {
    Object.keys(s).slice(0, 8).forEach(function(k) {
      var v = s[k];
      if (v != null && typeof v !== 'object') rows.push([k, String(v)]);
    });
  }

  return '<table style="width:100%;font-size:.8rem;border-collapse:collapse">' +
    rows.map(function(r) {
      return '<tr><td style="padding:4px 12px 4px 0;color:var(--muted);font-weight:600;white-space:nowrap;width:40%">' +
        esc(r[0]) + '</td><td style="padding:4px 0">' + esc(String(r[1])) + '</td></tr>';
    }).join('') + '</table>';
}

function renderAudit(audit) {
  if (!audit || !audit.checks) return '';
  var checks = audit.checks.map(function(c) {
    var icon = c.status === 'ok' || c.status === 'pass' ? '✓' : '⚠';
    var cls = c.status === 'ok' || c.status === 'pass' ? 'ok' : 'warn';
    return '<div class="audit-check">' +
      '<div class="audit-status ' + cls + '">' + icon + '</div>' +
      '<div><div class="audit-label">' + esc(c.label) + '</div>' +
      '<div class="audit-note">' + esc(c.note || '') + '</div>' +
      (c.rule ? '<div style="font-size:.68rem;color:var(--muted);margin-top:2px">Rule: ' + esc(c.rule) + '</div>' : '') +
      '</div></div>';
  }).join('');

  var recs = '';
  if (audit.recommendations && audit.recommendations.length > 0) {
    recs = audit.recommendations.map(function(r) {
      return '<div class="rec-card"><div class="rec-text">' + esc(r.text) + '</div>' +
        '<div class="rec-impact">' + esc(r.impact || '') + '</div></div>';
    }).join('');
  }

  return checks + recs;
}

function fcCard(label, val, cls) {
  return '<div class="fc-card"><div class="fc-label">' + label + '</div>' +
    '<div class="fc-val ' + cls + '">' + val + '</div></div>';
}

// ── Actions ──────────────────────────────────────────────────────────────────

function showView(view) {
  if (view === 'wizard') {
    RS.wizard = {
      step: 1, type: null, selected: [], title: '',
      options: { includeAiSummary: true, includeStructure: true, includeAudit: false },
      periodStart: '', periodEnd: '', actFilter: 'all',
    };
  }
  RS.view = view;
  render();
}

function setFilter(f) {
  RS.filter = f;
  render();
}

function setActFilter(f) {
  RS.wizard.actFilter = f;
  render();
}

function selectType(type) {
  RS.wizard.type = type;
  RS.wizard.selected = [];
  render();
}

function toggleActivity(sourceId) {
  var all = collectAllActivities();
  var act = all.find(function(a) { return a.sourceId === sourceId; });
  if (!act) return;

  var idx = RS.wizard.selected.findIndex(function(s) { return s.sourceId === sourceId; });

  if (RS.wizard.type === 'single') {
    RS.wizard.selected = idx >= 0 ? [] : [act];
  } else {
    if (idx >= 0) {
      RS.wizard.selected.splice(idx, 1);
    } else {
      if (RS.wizard.type === 'comparison' && RS.wizard.selected.length >= 5) return;
      RS.wizard.selected.push(act);
    }
  }
  render();
}

function wizNext() {
  if (RS.wizard.step < 3) {
    RS.wizard.step++;
    render();
  }
}

function wizBack() {
  if (RS.wizard.step > 1) {
    RS.wizard.step--;
    render();
  } else {
    showView('list');
  }
}

function openReport(id) {
  RS.current = RS.reports.find(function(r) { return r.id === id; }) || null;
  if (RS.current) {
    RS.view = 'preview';
    render();
  }
}

function deleteReport(id) {
  if (!confirm(rt('hub_delete_confirm'))) return;
  RS.reports = RS.reports.filter(function(r) { return r.id !== id; });
  persistReports();
  if (RS.current && RS.current.id === id) {
    RS.current = null;
    RS.view = 'list';
  }
  render();
  showToast(rt('toast_deleted'));
}

// ── Report generation ────────────────────────────────────────────────────────

async function doGenerate() {
  // Grab title from input
  var titleInput = document.getElementById('rpt-title-input');
  if (titleInput) RS.wizard.title = titleInput.value;
  if (!RS.wizard.title) RS.wizard.title = generateAutoTitle();

  RS.view = 'generating';
  render();

  var report = {
    id:         'rpt_' + Date.now(),
    title:      RS.wizard.title,
    type:       RS.wizard.type,
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString(),
    lang:       _lang,
    options:    Object.assign({}, RS.wizard.options),
    aiSummary:  null,
    activities: RS.wizard.selected.map(function(a) {
      var copy = Object.assign({}, a);
      delete copy._raw; // don't persist raw source data
      return copy;
    }),
    period:     null,
    forecast:   null,
  };

  // Step 1 — Snapshot
  setGenStep('gen-step-snapshot', 'running');
  await sleep(300);
  setGenStep('gen-step-snapshot', 'done');

  // Step 2 — Forecast (period only)
  setGenStep('gen-step-forecast', 'running');
  if (report.type === 'period' && RS.wizard.periodStart && RS.wizard.periodEnd) {
    report.period = { start: RS.wizard.periodStart, end: RS.wizard.periodEnd };
    try {
      // forecast.js is an ES module — loaded via <script type="module">, so it
      // publishes window._forecast instead of bare globals (see forecast.js bottom)
      if (window._forecast && typeof window._forecast.aggregateForecast === 'function') {
        var rawCampaigns = RS.wizard.selected.map(function(a) { return a._raw; }).filter(Boolean);
        report.forecast = window._forecast.aggregateForecast(rawCampaigns, report.period.start, report.period.end);
      }
    } catch(e) {
      console.warn('Forecast computation failed:', e);
    }
  }
  await sleep(200);
  setGenStep('gen-step-forecast', 'done');

  // Step 3 — AI Summary
  setGenStep('gen-step-ai', 'running');
  if (RS.wizard.options.includeAiSummary) {
    try {
      var resp = await fetch('/api/reports/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: report.type,
          activities: report.activities.map(function(a) {
            return { title: a.title, promoType: a.promoType, geo: a.geo,
                     segment: a.segment, econ: a.econ, params: a.params };
          }),
          forecast: report.forecast ? {
            gross: report.forecast.gross, overlapLoss: report.forecast.overlapLoss,
            net: report.forecast.net, netProfit: report.forecast.netProfit,
            coverage: report.forecast.coverage,
          } : undefined,
          uiLang: _lang,
        }),
      });
      var data = await resp.json();
      if (!resp.ok) throw new Error(data.message || ('HTTP ' + resp.status));
      report.aiSummary = data.summary || null;
    } catch(e) {
      console.warn('AI summary failed:', e);
      report.aiSummaryError = true;
    }
  }
  setGenStep('gen-step-ai', 'done');

  // Step 4 — Save
  setGenStep('gen-step-save', 'running');
  await sleep(200);
  RS.reports.unshift(report);
  persistReports();
  setGenStep('gen-step-save', 'done');

  await sleep(400);
  RS.current = report;
  RS.view = 'preview';
  render();
  showToast(rt('toast_saved'));
}

// ── PDF export ───────────────────────────────────────────────────────────────

async function exportPDF() {
  if (!window.html2pdf) {
    // Self-hosted (public/vendor/) — keeps CSP scriptSrc at 'self', no third-party origin trust needed
    await loadScript('/vendor/html2pdf.bundle.min.js');
  }
  var el = document.getElementById('report-content');
  if (!el) return;

  var clone = el.cloneNode(true);
  clone.style.background = '#fff';
  clone.style.color = '#111';
  clone.style.padding = '20px';

  // Most text inside #report-content is colored via var(--text)/var(--muted), which
  // resolve to near-white (--text:#e8eaf0) from the dark theme's :root. Overriding only
  // container backgrounds (below) left that text illegible (near-white on white/light bg)
  // — most visibly in .ai-summary-text, which made the AI summary look "missing" in the
  // exported PDF. Redefine the custom properties on the clone so every descendant that
  // reads var(--text)/var(--muted) picks up dark, print-safe colors instead.
  clone.style.setProperty('--text',    '#111');
  clone.style.setProperty('--muted',   '#555');
  clone.style.setProperty('--border',  '#ddd');
  clone.style.setProperty('--success', '#15803d');
  clone.style.setProperty('--warn',    '#b45309');

  // Override dark-theme container backgrounds in clone
  clone.querySelectorAll('.rpt-section,.card').forEach(function(n) {
    n.style.background = '#fff'; n.style.borderColor = '#ddd';
  });
  clone.querySelectorAll('.econ-card,.metric-card,.fc-card').forEach(function(n) {
    n.style.background = '#f5f5f5';
  });
  clone.querySelectorAll('.ai-summary').forEach(function(n) {
    n.style.background = '#f0ecff'; n.style.borderColor = '#c4b5fd';
  });
  clone.querySelectorAll('.ai-summary-label').forEach(function(n) {
    n.style.color = '#6d28d9'; // was hardcoded #c4b5fd — too pale against the light export background
  });

  var filename = slugify(RS.current?.title || 'report') + '-' + (RS.current?.createdAt || '').slice(0, 10) + '.pdf';
  var opt = {
    margin:      [20, 15, 20, 15],
    filename:    filename,
    image:       { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:   { mode: ['avoid-all', 'css', 'legacy'] },
  };

  await html2pdf().set(opt).from(clone).save();
}

function loadScript(src) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── Utilities ────────────────────────────────────────────────────────────────

function esc(s) {
  if (s == null) return '';
  var div = document.createElement('div');
  div.textContent = String(s);
  return div.innerHTML;
}

function fmtNum(v) {
  if (v == null || isNaN(v)) return '—';
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtPct(v) {
  if (v == null || isNaN(v)) return '—';
  // costRatio comes as fraction (e.g. 0.042 = 4.2%)
  if (Math.abs(v) < 1) return (v * 100).toFixed(1) + '%';
  return Number(v).toFixed(1) + '%';
}

function fmtUsd(v) {
  if (v == null || isNaN(v)) return '—';
  return '$' + Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function slugify(s) {
  return (s || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function showToast(msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 2500);
}

// ── Init ─────────────────────────────────────────────────────────────────────

(function init() {
  RS.reports = loadReports();

  // Lang
  var lang = localStorage.getItem('bonusLang') || 'en';
  _lang = lang;
  document.documentElement.setAttribute('data-lang', lang);
  document.getElementById('lt-en').classList.toggle('active', lang === 'en');
  document.getElementById('lt-ru').classList.toggle('active', lang === 'ru');
  if (typeof applyNavLang === 'function') applyNavLang(lang);
  if (typeof updateAllBadges === 'function') updateAllBadges();
  if (typeof initNavSubgroups === 'function') initNavSubgroups();

  updateReportsBadge();
  render();

  // Flash prevention
  var m = document.querySelector('.main');
  if (m) m.classList.add('ready');
})();
