// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const REGIONS = [
  { val: 'eu',     lbl: '🇪🇺 Europe (EU/UK)' },
  { val: 'cis',    lbl: '🇷🇺 CIS (RU/KZ)' },
  { val: 'mn',     lbl: '🇲🇳 Mongolia' },
  { val: 'latam',  lbl: '🌎 LatAm (MX/BR)' },
  { val: 'sweep',  lbl: '🇺🇸 USA Sweepstakes' },
  { val: 'crypto', lbl: '🌐 Crypto / Global' },
];

const SEGMENTS = [
  { val: 'new', lbl: 'New',   desc: 'First-time depositors' },
  { val: 'mid', lbl: 'Mid',   desc: 'Regular active players' },
  { val: 'vip', lbl: 'VIP',   desc: 'High-value players' },
];

const MODES = [
  { val: 'tiers',    icon: '🏅', name: 'Tiers',    desc: 'Bronze → Diamond ladder' },
  { val: 'missions', icon: '🎯', name: 'Missions',  desc: 'Task-based rewards' },
  { val: 'hybrid',   icon: '⭐', name: 'Hybrid',    desc: 'Tiers + missions combined' },
];

const TIER_DEFS = [
  { name: 'Bronze',   icon: '🥉', months: 0,  mult: 1.00, fs: 0,  color: '#CD7F32', bg: 'rgba(205,127,50,.15)' },
  { name: 'Silver',   icon: '🥈', months: 1,  mult: 1.25, fs: 5,  color: '#9CA3AF', bg: 'rgba(156,163,175,.15)' },
  { name: 'Gold',     icon: '🥇', months: 3,  mult: 1.50, fs: 15, color: '#F59E0B', bg: 'rgba(245,158,11,.15)' },
  { name: 'Platinum', icon: '💠', months: 8,  mult: 2.00, fs: 30, color: '#94A3B8', bg: 'rgba(148,163,184,.15)' },
  { name: 'Diamond',  icon: '💎', months: 20, mult: 2.50, fs: 50, color: '#60A5FA', bg: 'rgba(96,165,250,.15)' },
];

const MISSION_ICONS = {
  deposit:          '💳',
  wager:            '🎲',
  sessions:         '🎮',
  consecutive_days: '🔥',
};

const FREQ_LABEL = { one_time: 'One-time', weekly: 'Weekly', monthly: 'Monthly' };

// ── STATE ──────────────────────────────────────────────────────────────────────

let step        = 1;
let lastResult  = null;
let _view       = 'list';
let _detailId   = null;
let _menuOpen   = false;
let _aiMissions = null;  // cached narrative response for current session

const draft = {
  mode:            'hybrid',
  numTiers:        5,
  topCashbackRate: 0.10,
  earnRateDeposit: 10,
  earnRateWager:   1,
  redeemRate:      100,
  redeemMinPoints: 1000,
  pointsExpiry:    0,
  missionCount:    3,
  region:          'eu',
  segment:         'mid',
  players:         5000,
  avgdep:          100,
  arpu:            50,
};

// ── LOCALSTORAGE ───────────────────────────────────────────────────────────────

function loadPrograms() {
  try { return JSON.parse(localStorage.getItem('savedLoyaltyPrograms') || '[]'); } catch { return []; }
}
function savePrograms(list) {
  try { localStorage.setItem('savedLoyaltyPrograms', JSON.stringify(list)); } catch {}
}
function genId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── I18N ───────────────────────────────────────────────────────────────────────

function getLang() {
  return localStorage.getItem('bonusLang') || 'en';
}
function setLang(lang) {
  try { localStorage.setItem('bonusLang', lang); } catch {}
  document.querySelectorAll('.lt-btn').forEach(b => b.classList.toggle('active', b.id === 'lt-' + lang));
  applyNavLang(lang);
  render();
}

const L = {
  en: {
    list_empty:   'No programs yet. Create your first loyalty program.',
    new_program:  '+ New Program',
    program_name: name => name,
    mode:         'Mode', region: 'Region', segment: 'Segment', players: 'Players',
    avgdep:       'Avg Deposit (USD)', arpu: 'ARPU (USD/mo)',
    step1_title:  'Basics', step1_sub: 'Choose the loyalty model, market, and audience',
    step2_title:  'Program Design', step2_sub: 'Configure tiers, earn rates, and missions',
    step3_title:  'Results', step3_sub: 'Economics model and tier structure',
    num_tiers:    'Number of Tiers', top_cashback: 'Top-tier Cashback Rate',
    earn_dep:     'Points per $1 Deposited', earn_wag: 'Points per $1 Wagered',
    redeem_rate:  'Points per $1 Redeemed', redeem_min: 'Min Points to Redeem',
    expiry:       'Points Expiry', expiry_never: 'Never',
    missions:     'Number of Missions',
    tier_preview: 'Live Tier Preview',
    tier_name:    'Tier', tier_pts: 'Min Points', tier_cb: 'Cashback',
    tier_fs:      'Free Spins/mo', tier_mult: 'Bonus Mult.',
    gen_btn:      'Generate Program →',
    generating:   'Generating economics model…',
    save_btn:     'Save Program', calendar_btn: '📅 Add to Calendar',
    ai_soon:      'AI Features — Coming Soon (I4)',
    cost_lbl:     'Monthly Cost', cost_ratio: 'Cost / GGR',
    lift_lbl:     'Retention Lift', roi_lbl:  '3-Month ROI',
    breakeven:    'Break-even', liability: 'Points Liability',
    missions_lbl: 'Missions', tiers_lbl: 'Tiers',
    back:         '← Back', next: 'Next →', edit: '✏ Edit',
    delete_confirm: 'Delete this program?',
    saved_toast:  'Program saved',
    calendar_toast: '📅 Added to Retention Calendar',
    calendar_dupe: (title, date) => `"${title}" is already in the calendar (${date}).\nAdd again?`,
    detail_lbl:   'Saved', list_roi: 'ROI', list_lift: 'Lift', list_cost: 'Cost/mo', list_mode: 'Mode', list_tiers: 'Tiers',
    apply_recs:          '⚡ Apply Recommendations',
    balance_profit:      '⚖️ Balance to Profit',
    target_roi:          'Target ROI',
    undo:                '↩ Undo',
    cannot_reach_target: 'Cannot reach target ROI at current parameter bounds.',
    never_breakeven:     'never',
    delta_improved:      'improved',
    delta_worsened:      'worsened',
    apply_recs_hint:     'Run Optimize first to enable this button',
    changed_params:      'Changed:',
    list_heading:        'Loyalty Programs',
    list_count:          (n) => `${n} saved`,
    list_name_hdr:       'Name',
    topbar_list:         'Programs',
    step1_topbar:        (t) => `Step 1 of 3 — ${t}`,
    step2_topbar:        (t) => `Step 2 of 3 — ${t}`,
    step3_topbar:        (t) => `Step 3 of 3 — ${t}`,
    redeem_expiry_title: 'Redeem & Expiry',
    tier_count_chip:     (n) => `${n} tiers`,
    tab_economics:       '📊 Economics',
    tab_texts:           '✍ Texts',
    tab_audit:           '🔍 Audit',
    tab_optimize:        '⚡ Optimize',
    impact_high:         '↑ High impact',
    impact_med:          '→ Medium impact',
    impact_low:          '↓ Low impact',
    opt_now:             'Now',
    opt_fetch_texts:     '✍ Generate CRM copy for this loyalty program',
    opt_fetch_audit:     '🔍 Run compliance audit',
    opt_fetch_optimize:  '⚡ Get optimization recommendations',
    opt_retry:           'Retry',
    param_topCashbackRate: 'Top-tier Cashback Rate',
    param_earnRateDeposit: 'Points per $1 Deposited',
    param_earnRateWager:   'Points per $1 Wagered',
    param_redeemRate:      'Points per $1 Redeemed',
    param_missionCount:    'Number of Missions',
    param_numTiers:        'Number of Tiers',
    param_mode:            'Program Mode',
    param_pointsExpiry:    'Points Expiry',
    econ_card_title:     '📊 Economics',
    econ_sub_mo:         '/mo',
    econ_sub_ggr:        'of GGR',
    econ_sub_ret:        'retention',
    econ_sub_3mo:        '3-month',
    econ_sub_be:         'break-even',
    econ_sub_pts:        'unredeemed pts',
    mission_target:           'Target:',
    mission_reward:           'Reward:',
    mission_tier_points:      'tier pts/mo',
    mission_accelerates:      'speeds up upgrade',
    mission_boost:            (x, d) => `+${x}× multiplier for ${d}d`,
    mission_eligible:         'Available on:',
    mission_describe_btn:     '✨ Describe Missions',
    tab_missions:             '🎯 Missions',
    mission_narrative_loading: 'Generating mission descriptions…',
    mission_narrative_error:   'Error generating descriptions. Retry?',
    mode_tiers:               'Tiers',
    mode_missions:            'Missions',
    mode_hybrid:              'Hybrid',
    pts_formula:              (avgdep, rate) => `Points = months on ladder × ${avgdep} avgdep × ${rate} pts/$1`,
    opt_fetch_missions:       '✨ Generate mission descriptions',
  },
  ru: {
    list_empty:   'Программ пока нет. Создайте первую программу лояльности.',
    new_program:  '+ Новая программа',
    program_name: name => name,
    mode:         'Режим', region: 'Регион', segment: 'Сегмент', players: 'Игроки',
    avgdep:       'Средний депозит (USD)', arpu: 'ARPU (USD/мес)',
    step1_title:  'Основные параметры', step1_sub: 'Модель, рынок и аудитория',
    step2_title:  'Дизайн программы', step2_sub: 'Тиры, начисление очков, миссии',
    step3_title:  'Результаты', step3_sub: 'Экономическая модель и структура тиров',
    num_tiers:    'Количество тиров', top_cashback: 'Кешбэк на топ-тире',
    earn_dep:     'Очков за $1 депозита', earn_wag: 'Очков за $1 вейджера',
    redeem_rate:  'Очков за $1 вывода', redeem_min: 'Мин. очков для вывода',
    expiry:       'Срок действия очков', expiry_never: 'Бессрочно',
    missions:     'Количество миссий',
    tier_preview: 'Предпросмотр тиров',
    tier_name:    'Тир', tier_pts: 'Мин. очков', tier_cb: 'Кешбэк',
    tier_fs:      'FS/мес', tier_mult: 'Множитель',
    gen_btn:      'Создать программу →',
    generating:   'Строим экономическую модель…',
    save_btn:     'Сохранить', calendar_btn: '📅 Добавить в календарь',
    ai_soon:      'AI-функции — скоро (I4)',
    cost_lbl:     'Расходы/мес', cost_ratio: 'Расходы / GGR',
    lift_lbl:     'Удержание', roi_lbl:  'ROI за 3 мес',
    breakeven:    'Окупаемость', liability: 'Обязательства',
    missions_lbl: 'Миссии', tiers_lbl: 'Тиры',
    back:         '← Назад', next: 'Далее →', edit: '✏ Изменить',
    delete_confirm: 'Удалить программу?',
    saved_toast:  'Программа сохранена',
    calendar_toast: '📅 Добавлено в Retention Calendar',
    calendar_dupe: (title, date) => `"${title}" уже добавлена в календарь (${date}).\nДобавить снова?`,
    detail_lbl:   'Сохранено', list_roi: 'ROI', list_lift: 'Удержание', list_cost: 'Расходы', list_mode: 'Режим', list_tiers: 'Тиры',
    apply_recs:          '⚡ Применить рекомендации',
    balance_profit:      '⚖️ Сбалансировать под прибыль',
    target_roi:          'Целевой ROI',
    undo:                '↩ Отменить',
    cannot_reach_target: 'Не удаётся достичь целевого ROI на текущих ограничениях.',
    never_breakeven:     'не окупается',
    delta_improved:      'улучшено',
    delta_worsened:      'ухудшено',
    apply_recs_hint:     'Сначала запустите Optimize',
    changed_params:      'Изменено:',
    list_heading:        'Программы лояльности',
    list_count:          (n) => `${n} сохранено`,
    list_name_hdr:       'Название',
    topbar_list:         'Программы',
    step1_topbar:        (ti) => `Шаг 1 из 3 — ${ti}`,
    step2_topbar:        (ti) => `Шаг 2 из 3 — ${ti}`,
    step3_topbar:        (ti) => `Шаг 3 из 3 — ${ti}`,
    redeem_expiry_title: 'Вывод и срок действия',
    tier_count_chip:     (n) => `${n} тира`,
    tab_economics:       '📊 Экономика',
    tab_texts:           '✍ Тексты',
    tab_audit:           '🔍 Аудит',
    tab_optimize:        '⚡ Оптимизация',
    impact_high:         '↑ Высокий эффект',
    impact_med:          '→ Средний эффект',
    impact_low:          '↓ Низкий эффект',
    opt_now:             'Сейчас',
    opt_fetch_texts:     '✍ Сгенерировать CRM-тексты',
    opt_fetch_audit:     '🔍 Запустить аудит соответствия',
    opt_fetch_optimize:  '⚡ Получить рекомендации',
    opt_retry:           'Повторить',
    param_topCashbackRate: 'Кешбэк на топ-тире',
    param_earnRateDeposit: 'Очков за $1 депозита',
    param_earnRateWager:   'Очков за $1 вейджера',
    param_redeemRate:      'Очков за $1 вывода',
    param_missionCount:    'Количество миссий',
    param_numTiers:        'Количество тиров',
    param_mode:            'Режим программы',
    param_pointsExpiry:    'Срок действия очков',
    econ_card_title:     '📊 Экономика',
    econ_sub_mo:         '/мес',
    econ_sub_ggr:        'от GGR',
    econ_sub_ret:        'удержание',
    econ_sub_3mo:        '3 мес.',
    econ_sub_be:         'окупаемость',
    econ_sub_pts:        'неиспользованные баллы',
    mission_target:           'Цель:',
    mission_reward:           'Награда:',
    mission_tier_points:      'баллов тира/мес',
    mission_accelerates:      'ускоряет апгрейд',
    mission_boost:            (x, d) => `+${x}× к множителю на ${d} дн.`,
    mission_eligible:         'Доступно:',
    mission_describe_btn:     '✨ Описать миссии',
    tab_missions:             '🎯 Миссии',
    mission_narrative_loading: 'Генерируем описания миссий…',
    mission_narrative_error:   'Ошибка генерации. Повторить?',
    mode_tiers:               'Тиры',
    mode_missions:            'Миссии',
    mode_hybrid:              'Гибрид',
    pts_formula:              (avgdep, rate) => `Баллы = месяцы на ступени × ${avgdep} avg × ${rate} б/$1`,
    opt_fetch_missions:       '✨ Сгенерировать описания миссий',
  },
};

function t(key, ...args) {
  const lang = getLang();
  const val = (L[lang] || L.en)[key];
  return typeof val === 'function' ? val(...args) : (val ?? key);
}

// ── UTILS ──────────────────────────────────────────────────────────────────────

function fmtUSD(n) {
  if (n === undefined || n === null) return '—';
  if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000)    return '$' + (n / 1000).toFixed(1) + 'K';
  return '$' + Math.round(n).toLocaleString();
}
function fmtPct(n, decimals = 1) {
  return (n === undefined || n === null) ? '—' : (n * 1).toFixed(decimals) + '%';
}
function fmtX(n) {
  return (n === undefined || n === null) ? '—' : '×' + (n * 1).toFixed(1);
}
function fmtMo(n) {
  if (n === undefined || n === null || !isFinite(n)) return t('never_breakeven');
  if (n >= 36) return '36+ mo';
  return n.toFixed(1) + ' mo';
}

function deltaBadge(cur, prev, opts = {}) {
  if (prev == null || prev === undefined) return '';
  const d = cur - prev;
  if (Math.abs(d) < 1e-6) return '';
  const good = opts.lowerBetter ? d < 0 : d > 0;
  const sign = d > 0 ? '+' : '';
  const cls  = good ? 'pos' : 'neg';
  const fmt  = opts.fmt ? opts.fmt(d) : d.toFixed(1);
  return `<div class="econ-delta ${cls}">${sign}${fmt}</div>`;
}
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function autoName(mode, region, segment) {
  const modeLabel = { tiers:'Tiers', missions:'Missions', hybrid:'Hybrid' };
  return `${modeLabel[mode] || mode} · ${region.toUpperCase()} / ${segment}`;
}
function showToast(msg) {
  let el = document.getElementById('ly-toast');
  if (el) el.remove();
  el = document.createElement('div');
  el.id = 'ly-toast';
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el && el.remove(), 3000);
}

// ── ACTION PANEL (Apply / Balance) ───────────────────────────────────────────

const UI_BOUNDS = {
  redeemRate:      { min: 10,   max: 1000 },
  topCashbackRate: { min: 0.01, max: 0.20 },
  missionCount:    { min: 0,    max: 6    },
  earnRateDeposit: { min: 1,    max: 50   },
};

function parseRecTarget(param, target) {
  const s = String(target);
  // Extract the first number in the string (stops at first non-digit/dot after leading digits)
  const match = s.match(/\d+\.?\d*/);
  const num = match ? parseFloat(match[0]) : NaN;

  let val;
  switch (param) {
    case 'topCashbackRate': val = num > 1 ? num / 100 : num; break;
    case 'mode':            return /hybrid|tiers|missions/.exec(s)?.[0] ?? draft.mode;
    case 'numTiers':        return Math.max(3, Math.min(5, Math.round(num)));
    case 'missionCount':    return Math.max(0, Math.min(6, Math.round(isNaN(num) ? 0 : num)));
    default:                val = num;
  }

  // Clamp to UI_BOUNDS so the value always passes Zod validation
  if (isNaN(val)) return draft[param];
  const b = UI_BOUNDS[param];
  return b ? Math.max(b.min, Math.min(b.max, val)) : val;
}

function _getTargetRoi() {
  const el = document.getElementById('lg-target-roi');
  if (el) return +el.value;
  try { return +(localStorage.getItem('lg_target_roi') || '1.20'); } catch { return 1.20; }
}
window._getTargetRoi = _getTargetRoi;

function _recalcLocal(d) {
  if (window._loyaltyEcon) return window._loyaltyEcon.recalcEconLocal(d);
  return null;
}

function applyAiRecs(recs) {
  const beforeDraft = { ...draft };
  const beforeEcon  = _lastData?.econ || null;
  for (const r of (recs || [])) {
    if (r.param in draft) draft[r.param] = parseRecTarget(r.param, r.target);
  }
  finishApply(beforeDraft, beforeEcon);
}

function balanceToProfit(targetRoi) {
  const beforeDraft = { ...draft };
  const beforeEcon  = _lastData?.econ || null;

  const LEVERS = [
    { p: 'redeemRate',      mode: 'mul', f: 1.25 },
    { p: 'topCashbackRate', mode: 'mul', f: 0.85 },
    { p: 'missionCount',    mode: 'add', f: -1   },
    { p: 'earnRateDeposit', mode: 'mul', f: 0.90 },
  ];

  const local = _recalcLocal(draft);
  if (!local) { showToast('Client econ not loaded'); return; }

  let econ  = local.econ;
  let guard = 0;
  while (econ.roi3m < targetRoi && guard++ < 60) {
    let moved = false;
    for (const L of LEVERS) {
      const b = UI_BOUNDS[L.p]; if (!b) continue;
      const cur     = draft[L.p];
      const next    = L.mode === 'mul' ? cur * L.f : cur + L.f;
      const clamped = Math.max(b.min, Math.min(b.max, next));
      const val     = L.p === 'missionCount' ? Math.round(clamped) : clamped;
      if (Math.abs(val - cur) > 1e-9) { draft[L.p] = val; moved = true; break; }
    }
    if (!moved) break;
    econ = (_recalcLocal(draft) || {}).econ || econ;
  }

  if (econ.roi3m < targetRoi) showToast(t('cannot_reach_target'));
  finishApply(beforeDraft, beforeEcon);
}

async function finishApply(beforeDraft, beforeEcon) {
  _undoStack = { draft: beforeDraft, econ: beforeEcon };
  _prevEcon  = beforeEcon;

  const body = document.getElementById('ai-tab-body');
  if (body) body.innerHTML = `<div class="loader"><div class="spinner"></div><span>Recalculating…</span></div>`;

  try {
    const res = await fetch('/api/loyalty/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(draft),
    });
    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    _lastData  = data;
    lastResult = data;

    if (!lastResult) return;
    const tiers    = data.config.tiers || [];
    const missions = data.config.missions || [];
    const missionSection = missions.length > 0
      ? `<div class="card"><div class="card-title">🎯 ${t('missions_lbl')} (${missions.length})</div>${missionListHTML(missions)}</div>` : '';

    _aiTab = 'econ';
    document.querySelectorAll('.tab-row .tab').forEach(b => {
      b.classList.toggle('active', b.textContent.toLowerCase().includes('econ'));
    });
    if (body) {
      body.innerHTML = renderAiTabBody(data, tiers, missions, missionSection);
      // Flash cards that improved
      setTimeout(() => {
        document.querySelectorAll('.econ-card').forEach(card => {
          const delta = card.querySelector('.econ-delta');
          if (delta && delta.classList.contains('pos')) card.classList.add('flash-good');
        });
      }, 50);
    }

    _showChangedParams(beforeDraft, draft);
  } catch(e) {
    if (body) body.innerHTML = `<div class="alert alert-warn">Error: ${esc(e.message)}</div>`;
  }
}

function _showChangedParams(before, after) {
  const changes = [];
  for (const key of Object.keys(UI_BOUNDS).concat(['numTiers', 'mode'])) {
    if (!(key in before) || !(key in after)) continue;
    const bv = before[key], av = after[key];
    if (Math.abs(bv - av) < 1e-9 || bv === av) continue;
    const label = getParamLabel(key);
    const fmtV  = key === 'topCashbackRate'
      ? v => Math.round(v * 100) + '%'
      : v => typeof v === 'number' ? +v.toFixed(2) : v;
    changes.push(`<strong>${esc(label)}</strong>: ${fmtV(bv)} → ${fmtV(av)}`);
  }
  const existing = document.getElementById('ly-changed-params');
  if (existing) existing.remove();
  if (!changes.length) return;
  const el = document.createElement('div');
  el.id        = 'ly-changed-params';
  el.className = 'changed-params';
  el.innerHTML = `${t('changed_params')} ${changes.join(' · ')}`;
  const grid = document.querySelector('.econ-grid');
  if (grid) grid.insertAdjacentElement('afterend', el);
}

function undoApply() {
  if (!_undoStack) return;
  Object.assign(draft, _undoStack.draft);
  _lastData  = _undoStack.econ ? { ...(lastResult || {}), econ: _undoStack.econ } : lastResult;
  lastResult = _lastData;
  _prevEcon  = null;
  _undoStack = null;
  const el = document.getElementById('ly-changed-params');
  if (el) el.remove();
  switchAiTab('econ');
}

function actionPanelHTML(econ) {
  const targetRoi = _getTargetRoi();
  const needBalance = econ && econ.roi3m < targetRoi;
  const hasOpt = !!_aiOpt;

  return `<div class="action-panel">
    <div class="roi-slider-wrap">
      <span class="roi-slider-label">${t('target_roi')}:</span>
      <input type="range" id="lg-target-roi" min="1.0" max="3.0" step="0.05"
        value="${targetRoi}"
        oninput="document.getElementById('lg-roi-val').textContent=parseFloat(this.value).toFixed(2)+'×';try{localStorage.setItem('lg_target_roi',this.value)}catch{}">
      <span class="roi-slider-val" id="lg-roi-val">${parseFloat(targetRoi).toFixed(2)}×</span>
    </div>
    <button class="btn btn-sm btn-outline" ${hasOpt ? '' : 'disabled title="' + t('apply_recs_hint') + '"'}
      onclick="applyAiRecs(window._lastOptRecs)">
      ${t('apply_recs')}
    </button>
    <button class="btn btn-sm ${needBalance ? 'btn-primary' : 'btn-outline'}"
      onclick="balanceToProfit(_getTargetRoi())">
      ${t('balance_profit')}
    </button>
    ${_undoStack ? `<button class="btn btn-sm btn-ghost" onclick="undoApply()">${t('undo')}</button>` : ''}
  </div>`;
}

// ── CLIENT-SIDE TIER CALC ─────────────────────────────────────────────────────

function calcTiersPreview(params) {
  const { numTiers, avgdep, earnRateDeposit, topCashbackRate } = params;
  const defs = TIER_DEFS.slice(0, numTiers);
  const monthlyBase = avgdep * earnRateDeposit;
  const n = numTiers;
  return defs.map((def, i) => ({
    ...def,
    minPoints:   Math.round(def.months * monthlyBase),
    cashback:    n > 1 ? (i / (n - 1)) * topCashbackRate : topCashbackRate,
  }));
}

// ── RENDER HELPERS ─────────────────────────────────────────────────────────────

function tierTableHTML(tiers) {
  const rows = [...tiers].reverse().map(tier => {
    // API uses cashbackRate/freeSpinsMonthly/bonusMultiplier; preview uses cashback/fs/mult
    const cashback = tier.cashbackRate ?? tier.cashback ?? 0;
    const fs       = tier.freeSpinsMonthly ?? tier.fs ?? 0;
    const mult     = tier.bonusMultiplier  ?? tier.mult ?? 1;
    const def      = TIER_DEFS.find(d => d.name.toLowerCase() === (tier.name || '').toLowerCase()) || TIER_DEFS[0];
    return `<tr>
      <td>
        <span class="tier-badge" style="background:${def.bg};color:${def.color}">
          ${def.icon} ${tier.label || tier.name}
        </span>
      </td>
      <td style="font-weight:600">${(tier.minPoints ?? 0).toLocaleString()}</td>
      <td>${fmtPct(cashback * 100, 1)}</td>
      <td>${fs > 0 ? fs : '—'}</td>
      <td>×${mult.toFixed(2)}</td>
    </tr>`;
  }).join('');

  return `<table class="tier-table">
    <thead><tr>
      <th>${t('tier_name')}</th>
      <th>${t('tier_pts')}</th>
      <th>${t('tier_cb')}</th>
      <th>${t('tier_fs')}</th>
      <th>${t('tier_mult')}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function missionLinkHTML(link) {
  if (!link) return '';
  const tierLabels = link.eligibleTiers.map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(', ');
  const boostFmt   = link.multiplierBoost.toFixed(2).replace(/\.?0+$/, '');
  const accelBadge = link.acceleratesUpgrade
    ? `<span class="mission-tag" style="color:#10b981">⬆ ${esc(t('mission_accelerates'))}</span>`
    : '';
  return `<div class="mission-link-block">
    <div class="mission-link-row">
      <span class="mission-tag">⬆ ${link.monthlyTierPoints} ${esc(t('mission_tier_points'))}</span>
      ${accelBadge}
    </div>
    <div class="mission-link-row">
      <span class="mission-tag" style="color:#a0b0ff">⚡ ${esc(t('mission_boost', boostFmt, link.boostDurationDays))}</span>
    </div>
    <div class="mission-link-row" style="font-size:.72rem;color:var(--muted)">
      📊 ${esc(t('mission_eligible'))} ${esc(tierLabels)}
    </div>
    ${m_narrativeHTML(link)}
  </div>`;
}

function m_narrativeHTML(_link) { return ''; }  // placeholder; Phase 2 replaces this

function missionListHTML(missions) {
  if (!missions || missions.length === 0) return '';
  return missions.map(m => {
    const icon = MISSION_ICONS[m.objective] || '🎯';
    const freq = FREQ_LABEL[m.frequency] || m.frequency;
    const reward = m.rewardType === 'cash_bonus'
      ? '$' + m.rewardValue
      : m.rewardType === 'free_spins'
        ? m.rewardValue + ' FS'
        : m.rewardValue + ' pts';
    const linkBlock = missionLinkHTML(m.link);
    const narrative = m.narrative
      ? `<div class="mission-narrative">💬 ${esc(m.narrative)}</div>`
      : '';
    return `<div class="mission-row${linkBlock ? ' has-link' : ''}">
      <div class="mission-name">${icon} ${esc(m.name)}</div>
      <div class="mission-meta">
        <span class="mission-tag">${esc(freq)}</span>
        <span>${t('mission_target')} ${m.target} ${m.objective.replace('_', ' ')}</span>
        <span>${t('mission_reward')} <strong>${reward}</strong></span>
      </div>
      ${linkBlock}
      ${narrative}
    </div>`;
  }).join('');
}

function previewMissionLinks(params) {
  if (!window._loyaltyMissionsLink || params.mode !== 'hybrid' || params.missionCount === 0) return;
  // Build a minimal tiers array for preview (mirrors buildConfig tier logic)
  const monthlyBase = params.avgdep * params.earnRateDeposit;
  const tierDefs = [
    { name: 'bronze', thresholdMonths: 0 },
    { name: 'silver', thresholdMonths: 1 },
    { name: 'gold',   thresholdMonths: 3 },
    { name: 'platinum', thresholdMonths: 8 },
    { name: 'diamond', thresholdMonths: 20 },
  ].slice(0, params.numTiers);
  const tiers = tierDefs.map(d => ({ name: d.name, minPoints: Math.round(d.thresholdMonths * monthlyBase) }));
  return window._loyaltyMissionsLink.linkMissionsToTiers([], tiers, params);
}

function econGridHTML(econ, prevEcon) {
  const p = prevEcon || null;
  const roi3m = econ.roi3m;
  const roiClass  = roi3m >= 1.5 ? 'pos' : roi3m >= 0.8 ? 'neu' : 'neg';
  const liftClass = econ.retentionLiftPct >= 15 ? 'pos' : econ.retentionLiftPct >= 8 ? 'neu' : 'neg';
  const costClass = econ.costRatioPct <= 10 ? 'pos' : econ.costRatioPct <= 20 ? 'neu' : 'neg';
  const beClass   = (econ.breakEvenMonths === null || !isFinite(econ.breakEvenMonths)) ? 'neg' : 'neu';

  return `<div class="econ-grid">
    <div class="econ-card">
      <div class="econ-label">${t('cost_lbl')}</div>
      <div class="econ-val ${costClass}">${fmtUSD(econ.monthlyCostUSD)}</div>
      <div class="econ-sub">${t('econ_sub_mo')}</div>
      ${deltaBadge(econ.monthlyCostUSD, p?.monthlyCostUSD, { lowerBetter: true, fmt: d => (d > 0 ? '+' : '') + fmtUSD(Math.abs(d)).replace('$', '') })}
    </div>
    <div class="econ-card">
      <div class="econ-label">${t('cost_ratio')}</div>
      <div class="econ-val ${costClass}">${fmtPct(econ.costRatioPct)}</div>
      <div class="econ-sub">${t('econ_sub_ggr')}</div>
      ${deltaBadge(econ.costRatioPct, p?.costRatioPct, { lowerBetter: true, fmt: d => (d > 0 ? '+' : '') + d.toFixed(1) + '%' })}
    </div>
    <div class="econ-card">
      <div class="econ-label">${t('lift_lbl')}</div>
      <div class="econ-val ${liftClass}">${fmtPct(econ.retentionLiftPct)}</div>
      <div class="econ-sub">${t('econ_sub_ret')}</div>
      ${deltaBadge(econ.retentionLiftPct, p?.retentionLiftPct, { lowerBetter: false, fmt: d => (d > 0 ? '+' : '') + d.toFixed(1) + '%' })}
    </div>
    <div class="econ-card">
      <div class="econ-label">${t('roi_lbl')}</div>
      <div class="econ-val ${roiClass}">${fmtX(econ.roi3m)}</div>
      <div class="econ-sub">${t('econ_sub_3mo')}</div>
      ${deltaBadge(econ.roi3m, p?.roi3m, { lowerBetter: false, fmt: d => (d > 0 ? '+' : '') + d.toFixed(2) + '×' })}
    </div>
    <div class="econ-card">
      <div class="econ-label">${t('breakeven')}</div>
      <div class="econ-val ${beClass}">${fmtMo(econ.breakEvenMonths)}</div>
      <div class="econ-sub">${t('econ_sub_be')}</div>
    </div>
    <div class="econ-card">
      <div class="econ-label">${t('liability')}</div>
      <div class="econ-val neu">${fmtUSD(econ.totalLiabilityUSD)}</div>
      <div class="econ-sub">${t('econ_sub_pts')}</div>
      ${deltaBadge(econ.totalLiabilityUSD, p?.totalLiabilityUSD, { lowerBetter: true, fmt: d => (d > 0 ? '+' : '') + fmtUSD(Math.abs(d)).replace('$', '') })}
    </div>
  </div>`;
}

// ── VIEWS ──────────────────────────────────────────────────────────────────────

function showView(name, id) {
  _view     = name;
  _detailId = id || null;
  closeMenu();
  render();
}

function render() {
  const el = document.getElementById('content');
  if (!el) return;
  if (_view === 'list')   { renderListView(); return; }
  if (_view === 'setup')  { renderSetupView(); return; }
  if (_view === 'detail') { renderDetailView(_detailId); return; }
}

// ── LIST VIEW ─────────────────────────────────────────────────────────────────

function renderListView() {
  document.getElementById('topbar-step').textContent = t('topbar_list');
  const programs = loadPrograms();
  const isRu = getLang() === 'ru';

  let body;
  if (programs.length === 0) {
    body = `<div class="ctable"><div class="tbl-empty">
      <div style="font-size:2rem;margin-bottom:12px">⭐</div>
      <div>${t('list_empty')}</div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="showView('setup')">${t('new_program')}</button>
    </div></div>`;
  } else {
    const rows = programs.map(p => {
      const econ     = p.result?.econ;
      const cfg      = p.result?.config;
      const roi      = econ ? fmtX(econ.roi3m) : '—';
      const lift     = econ ? fmtPct(econ.retentionLiftPct) : '—';
      const cost     = econ ? fmtUSD(econ.monthlyCostUSD) : '—';
      const modeLabel = { tiers: t('mode_tiers'), missions: t('mode_missions'), hybrid: t('mode_hybrid') };
      const mode     = modeLabel[cfg?.mode] || '—';
      const tiers    = cfg?.tiers?.length ?? '—';
      const date     = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '';
      return `<div class="ct-row" onclick="showView('detail','${esc(p.id)}')" oncontextmenu="openMenu(event,'${esc(p.id)}');return false">
        <div>
          <div class="ct-name">${esc(p.name)}</div>
          <div class="ct-meta">${date}</div>
        </div>
        <div class="ct-cell">${esc(mode)}</div>
        <div class="ct-cell">${esc(String(tiers))}</div>
        <div class="ct-cell">${esc(lift)}</div>
        <div class="ct-cell">${esc(roi)}</div>
        <div class="ct-cell">
          <button class="btn btn-ghost btn-sm" style="padding:3px 6px" onclick="openMenu(event,'${esc(p.id)}');event.stopPropagation()">⋯</button>
        </div>
      </div>`;
    }).join('');

    body = `
    <div style="margin-bottom:16px">
      <div style="font-size:1.1rem;font-weight:700;color:var(--text)">${t('list_heading')}</div>
      <div style="font-size:.8rem;color:var(--muted);margin-top:2px">${t('list_count', programs.length)}</div>
    </div>
    <div class="ctable">
      <div class="ct-hd">
        <div>${t('list_name_hdr')}</div>
        <div>${t('list_mode')}</div>
        <div>${t('list_tiers')}</div>
        <div>${t('list_lift')}</div>
        <div>${t('list_roi')}</div>
        <div></div>
      </div>
      ${rows}
    </div>
    <div style="margin-top:16px;text-align:center">
      <button class="btn btn-primary" onclick="step=1;showView('setup')">${t('new_program')}</button>
    </div>`;
  }

  document.getElementById('content').innerHTML = body;
}

// ── SETUP STEPS ───────────────────────────────────────────────────────────────

function renderSetupView() {
  if (step === 1) renderStep1();
  else if (step === 2) renderStep2();
  else renderStep3();
}

function goStep(n) {
  step = n;
  if (step === 3) {
    generateProgram();
    return;
  }
  render();
}

function wizProgressHTML(current) {
  const labels = [t('step1_title'), t('step2_title'), t('step3_title')];
  return `<div class="wiz-progress">
    ${labels.map((lbl, i) => {
      const n      = i + 1;
      const done   = n < current;
      const active = n === current;
      const conn   = i < labels.length - 1
        ? `<div class="wp-conn${done ? ' done' : ''}"></div>` : '';
      return `<div class="wp-step">
        <div class="wp-circle${done ? ' done' : active ? ' active' : ''}">${done ? '✓' : n}</div>
        <div class="wp-lbl${active ? ' active' : ''}">${lbl}</div>
      </div>${conn}`;
    }).join('')}
  </div>`;
}

function renderStep1() {
  document.getElementById('topbar-step').textContent = t('step1_topbar', t('step1_title'));

  const modeCards = MODES.map(m => `
    <div class="chip type-card ${draft.mode === m.val ? 'on' : ''}" onclick="setDraft('mode','${m.val}');renderStep1()">
      <span class="tc-icon">${m.icon}</span>
      <span class="tc-name">${m.name}</span>
      <span class="tc-desc">${m.desc}</span>
    </div>`).join('');

  const regionOpts = REGIONS.map(r =>
    `<option value="${r.val}" ${draft.region === r.val ? 'selected' : ''}>${r.lbl}</option>`
  ).join('');

  const segChips = SEGMENTS.map(s => `
    <div class="chip ${draft.segment === s.val ? 'on' : ''}" onclick="setDraft('segment','${s.val}');renderStep1()">
      ${s.lbl}
    </div>`).join('');

  document.getElementById('content').innerHTML = `
  ${wizProgressHTML(1)}
  <div class="step-header">
    <div class="step-title">${t('step1_title')}</div>
    <div class="step-sub">${t('step1_sub')}</div>
  </div>

  <div class="card">
    <div class="card-title">${t('mode')}</div>
    <div class="chips">${modeCards}</div>
  </div>

  <div class="card">
    <div class="form-row">
      <label class="form-label">${t('region')}</label>
      <select class="form-input" onchange="setDraft('region',this.value)">${regionOpts}</select>
    </div>
    <div class="form-row" style="margin-bottom:0">
      <label class="form-label">${t('segment')}</label>
      <div class="chips">${segChips}</div>
    </div>
  </div>

  <div class="card">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
      <div class="form-row" style="margin-bottom:0">
        <label class="form-label">${t('players')}</label>
        <input class="form-input" type="number" min="100" max="500000" value="${draft.players}"
          oninput="setDraft('players',+this.value)">
      </div>
      <div class="form-row" style="margin-bottom:0">
        <label class="form-label">${t('avgdep')}</label>
        <input class="form-input" type="number" min="1" max="10000" value="${draft.avgdep}"
          oninput="setDraft('avgdep',+this.value)">
      </div>
      <div class="form-row" style="margin-bottom:0">
        <label class="form-label">${t('arpu')}</label>
        <input class="form-input" type="number" min="1" max="10000" value="${draft.arpu}"
          oninput="setDraft('arpu',+this.value)">
      </div>
    </div>
  </div>

  <div class="nav-footer">
    <button class="btn btn-ghost" onclick="showView('list')">${t('back')}</button>
    <button class="btn btn-primary" onclick="goStep(2)">${t('next')}</button>
  </div>`;
}

function renderStep2() {
  document.getElementById('topbar-step').textContent = t('step2_topbar', t('step2_title'));

  const tierChips = [3, 4, 5].map(n => `
    <div class="chip ${draft.numTiers === n ? 'on' : ''}" onclick="setDraft('numTiers',${n});renderStep2()">${t('tier_count_chip', n)}</div>
  `).join('');

  const cbPct = Math.round(draft.topCashbackRate * 100);

  const expiryOpts = [
    [0, t('expiry_never')], [3, '3 mo'], [6, '6 mo'], [12, '12 mo'], [18, '18 mo'], [24, '24 mo'],
  ].map(([v, l]) =>
    `<option value="${v}" ${draft.pointsExpiry === v ? 'selected' : ''}>${l}</option>`
  ).join('');

  const preview = calcTiersPreview(draft);

  const missionRow = draft.mode !== 'tiers' ? `
    <div class="form-row">
      <label class="form-label">${t('missions')} <span style="color:var(--accent)">(${draft.missionCount})</span></label>
      <div class="range-wrap">
        <input type="range" min="0" max="6" value="${draft.missionCount}"
          oninput="setDraft('missionCount',+this.value);document.getElementById('mc-val').textContent=this.value">
        <span class="range-val" id="mc-val">${draft.missionCount}</span>
      </div>
    </div>` : '';

  document.getElementById('content').innerHTML = `
  ${wizProgressHTML(2)}
  <div class="step-header">
    <div class="step-title">${t('step2_title')}</div>
    <div class="step-sub">${t('step2_sub')}</div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">
    <div>
      <div class="card">
        <div class="card-title">${t('tiers_lbl')}</div>
        <div class="form-row">
          <label class="form-label">${t('num_tiers')}</label>
          <div class="chips">${tierChips}</div>
        </div>
        <div class="form-row">
          <label class="form-label">${t('top_cashback')} <span style="color:var(--accent)">${cbPct}%</span></label>
          <div class="range-wrap">
            <input type="range" min="0" max="30" value="${cbPct}"
              oninput="setDraft('topCashbackRate',this.value/100);document.getElementById('cb-val').textContent=this.value+'%';updateTierPreview()">
            <span class="range-val" id="cb-val">${cbPct}%</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-row" style="margin-bottom:0">
            <label class="form-label">${t('earn_dep')}</label>
            <input class="form-input" type="number" min="1" max="50" value="${draft.earnRateDeposit}"
              oninput="setDraft('earnRateDeposit',+this.value);updateTierPreview()">
          </div>
          <div class="form-row" style="margin-bottom:0">
            <label class="form-label">${t('earn_wag')}</label>
            <input class="form-input" type="number" min="0" max="10" step="0.1" value="${draft.earnRateWager}"
              oninput="setDraft('earnRateWager',+this.value)">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${t('redeem_expiry_title')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-row" style="margin-bottom:0">
            <label class="form-label">${t('redeem_rate')}</label>
            <input class="form-input" type="number" min="10" max="1000" value="${draft.redeemRate}"
              oninput="setDraft('redeemRate',+this.value)">
          </div>
          <div class="form-row" style="margin-bottom:0">
            <label class="form-label">${t('redeem_min')}</label>
            <input class="form-input" type="number" min="0" max="10000" step="100" value="${draft.redeemMinPoints}"
              oninput="setDraft('redeemMinPoints',+this.value)">
          </div>
        </div>
        <div class="form-row" style="margin-top:10px;margin-bottom:0">
          <label class="form-label">${t('expiry')}</label>
          <select class="form-input" onchange="setDraft('pointsExpiry',+this.value)">${expiryOpts}</select>
        </div>
      </div>

      ${draft.mode !== 'tiers' ? `<div class="card">
        <div class="card-title">${t('missions_lbl')}</div>
        ${missionRow}
      </div>` : ''}
    </div>

    <div class="card" style="position:sticky;top:70px">
      <div class="card-title">🔍 ${t('tier_preview')}</div>
      <div id="tier-preview">${tierTableHTML(preview)}</div>
      <div style="margin-top:12px;font-size:.73rem;color:var(--muted)">
        ${t('pts_formula', draft.avgdep, draft.earnRateDeposit)}
      </div>
    </div>
  </div>

  <div class="nav-footer">
    <button class="btn btn-ghost" onclick="goStep(1)">${t('back')}</button>
    <button class="btn btn-primary" onclick="goStep(3)">${t('gen_btn')}</button>
  </div>`;
}

function updateTierPreview() {
  const el = document.getElementById('tier-preview');
  if (!el) return;
  el.innerHTML = tierTableHTML(calcTiersPreview(draft));
}

async function generateProgram() {
  _aiTab = 'econ'; _aiTexts = null; _aiAudit = null; _aiOpt = null; _aiMissions = null;
  const isRu = getLang() === 'ru';

  const steps = isRu
    ? ['Проверяем параметры программы', 'Строим структуру тиров', 'Рассчитываем экономику', 'Связываем миссии с тирами', 'Финализируем модель']
    : ['Validating program parameters', 'Building tier structure', 'Calculating economics', 'Linking missions to tiers', 'Finalising model'];

  document.getElementById('topbar-step').textContent = isRu ? 'Генерация…' : 'Generating…';

  const c = document.getElementById('content');
  c.innerHTML = `
    <div class="prog-wrap">
      <div class="prog-title">${isRu ? 'Строим программу лояльности…' : 'Building loyalty program…'}</div>
      <div class="prog-sub">${isRu ? 'Анализируем параметры и рассчитываем экономику' : 'Analysing parameters and calculating economics'}</div>
      <ul class="prog-list" id="ly-prog-list">
        ${steps.map((s, i) => `<li class="pl-item" id="ly-pl-${i}"><span class="pl-icon">⏳</span>${s}</li>`).join('')}
      </ul>
    </div>`;

  // Fire API immediately, in parallel with animation
  const apiPromise = fetch('/api/loyalty/generate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(draft),
  })
  .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.message || r.statusText))))
  .then(data => { lastResult = data; _lastData = data; _prevEcon = null; _undoStack = null; })
  .catch(err => { lastResult = { _error: err.message }; });

  let i = 0;
  (function tick() {
    if (i > 0) {
      const prev = document.getElementById('ly-pl-' + (i - 1));
      if (prev) { prev.className = 'pl-item done'; prev.innerHTML = `<span class="pl-icon">✅</span>${steps[i - 1]}`; }
    }
    if (i < steps.length) {
      const cur = document.getElementById('ly-pl-' + i);
      if (cur) { cur.className = 'pl-item running'; cur.innerHTML = `<div class="spinner"></div>${steps[i]}`; }
      i++;
      setTimeout(tick, 600);
    } else {
      Promise.resolve(apiPromise).then(() => {
        setTimeout(() => {
          if (lastResult?._error) {
            c.innerHTML = `<div class="alert alert-warn" style="max-width:480px;margin:40px auto">
              Error: ${esc(lastResult._error)}
              <button class="btn btn-outline" style="margin-top:10px;display:block" onclick="goStep(2)">${t('back')}</button>
            </div>`;
          } else {
            renderStep3(lastResult);
          }
        }, 300);
      });
    }
  })();
}

// AI state for step 3 tabs
let _aiTab    = 'econ';  // 'econ' | 'texts' | 'audit' | 'optimize'
let _aiTexts  = null;
let _aiAudit  = null;
let _aiOpt    = null;

// Action panel state
let _lastData    = null;  // { config, econ } from last /api/loyalty/generate response
let _undoStack   = null;  // { draft, econ } snapshot for Undo (1 step)
let _prevEcon    = null;  // econ before last apply — shown as delta

function renderStep3(data) {
  document.getElementById('topbar-step').textContent = t('step3_topbar', t('step3_title'));
  const { config, econ } = data;
  const tiers    = config.tiers || [];
  const missions = config.missions || [];

  const missionSection = missions.length > 0 ? `
    <div class="card">
      <div class="card-title">🎯 ${t('missions_lbl')} (${missions.length})</div>
      ${missionListHTML(missions)}
    </div>` : '';

  document.getElementById('content').innerHTML = `
  ${wizProgressHTML(3)}
  <div class="step-header">
    <div class="step-title">${t('step3_title')}</div>
    <div class="step-sub">${t('step3_sub')}</div>
  </div>

  <div class="tab-row" style="margin-bottom:16px">
    <button class="tab ${_aiTab==='econ'     ?'active':''}" data-tab="econ"     onclick="switchAiTab('econ')">${t('tab_economics')}</button>
    <button class="tab ${_aiTab==='texts'    ?'active':''}" data-tab="texts"    onclick="switchAiTab('texts')">${t('tab_texts')}</button>
    <button class="tab ${_aiTab==='audit'    ?'active':''}" data-tab="audit"    onclick="switchAiTab('audit')">${t('tab_audit')}</button>
    <button class="tab ${_aiTab==='optimize' ?'active':''}" data-tab="optimize" onclick="switchAiTab('optimize')">${t('tab_optimize')}</button>
    ${(data.config.missions || []).length > 0 ? `<button class="tab ${_aiTab==='missions'?'active':''}" data-tab="missions" onclick="switchAiTab('missions')">${t('tab_missions')}</button>` : ''}
  </div>

  <div id="ai-tab-body">
    ${renderAiTabBody(data, tiers, missions, missionSection)}
  </div>

  <div class="nav-footer">
    <button class="btn btn-ghost" onclick="goStep(2)">${t('back')}</button>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline" onclick="saveCurrentProgram()">${t('save_btn')}</button>
      <button class="btn btn-gold" onclick="addLoyaltyToCalendar()">${t('calendar_btn')}</button>
    </div>
  </div>`;
}

function renderAiTabBody(data, tiers, missions, missionSection) {
  const { config, econ } = data;
  if (_aiTab === 'econ') {
    return `
      <div class="card">
        <div class="card-title">${t('econ_card_title')}</div>
        ${actionPanelHTML(econ)}
        ${econGridHTML(econ, _prevEcon)}
      </div>
      <div class="card">
        <div class="card-title">🏅 ${t('tiers_lbl')}</div>
        ${tierTableHTML(tiers)}
      </div>
      ${missionSection}`;
  }
  if (_aiTab === 'texts') {
    if (!_aiTexts) return renderAiFetchPrompt('texts', t('opt_fetch_texts'));
    return renderTextsHTML(_aiTexts);
  }
  if (_aiTab === 'audit') {
    if (!_aiAudit) return renderAiFetchPrompt('audit', t('opt_fetch_audit'));
    return renderAuditHTML(_aiAudit);
  }
  if (_aiTab === 'optimize') {
    if (!_aiOpt) return renderAiFetchPrompt('optimize', t('opt_fetch_optimize'));
    return renderOptimizeHTML(_aiOpt);
  }
  if (_aiTab === 'missions') {
    if (!_aiMissions) return renderAiFetchPrompt('missions', t('opt_fetch_missions'));
    return renderMissionsNarrativeHTML(missions);
  }
  return '';
}

function renderAiFetchPrompt(tabKey, label) {
  const iconMap = { texts: '✍', audit: '🔍', optimize: '⚡', missions: '✨' };
  const icon = iconMap[tabKey] || '⚡';
  return `<div class="card" style="text-align:center;padding:32px 20px">
    <div style="font-size:1.8rem;margin-bottom:10px">${icon}</div>
    <div style="font-size:.9rem;font-weight:600;margin-bottom:16px">${esc(label)}</div>
    <button class="btn btn-primary" onclick="fetchAI('${tabKey}')">${esc(label)} →</button>
  </div>`;
}

function renderMissionsNarrativeHTML(missions) {
  if (!missions || missions.length === 0) return '<div class="card"><p style="color:var(--muted)">No missions in this program.</p></div>';
  return missions.map(m => {
    const icon = MISSION_ICONS[m.objective] || '🎯';
    const narrative = m.narrative ? `<div class="mission-narrative">💬 ${esc(m.narrative)}</div>` : '';
    const tierEffect = m.tierEffect ? `<div style="font-size:.72rem;color:#a0b0ff;margin-top:4px">⚡ ${esc(m.tierEffect)}</div>` : '';
    return `<div class="card" style="margin-bottom:10px">
      <div style="font-weight:700;margin-bottom:6px">${icon} ${esc(m.name)}</div>
      ${narrative}
      ${tierEffect}
    </div>`;
  }).join('');
}

function switchAiTab(tab) {
  _aiTab = tab;
  if (!lastResult) return;
  const tiers    = lastResult.config.tiers || [];
  const missions = lastResult.config.missions || [];
  const missionSection = missions.length > 0
    ? `<div class="card"><div class="card-title">🎯 ${t('missions_lbl')} (${missions.length})</div>${missionListHTML(missions)}</div>` : '';
  // Update tabs active state by data-tab attribute (locale-independent)
  document.querySelectorAll('.tab-row .tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  const body = document.getElementById('ai-tab-body');
  if (body) body.innerHTML = renderAiTabBody(lastResult, tiers, missions, missionSection);
}

async function fetchAI(tabKey, detailId) {
  const body = document.getElementById('ai-tab-body');
  if (body) body.innerHTML = `<div class="loader"><div class="spinner"></div><span>Generating with AI…</span></div>`;

  const source = detailId ? loadPrograms().find(p => p.id === detailId)?.result : lastResult;
  if (!source) return;

  try {
    let url, payload;
    if (tabKey === 'texts') {
      url     = '/api/loyalty/texts';
      payload = { config: source.config, econ: source.econ };
    } else if (tabKey === 'audit') {
      url     = '/api/loyalty/audit';
      payload = { config: source.config };
    } else if (tabKey === 'missions') {
      url     = '/api/loyalty/missions';
      payload = { config: source.config, econ: source.econ, uiLang: getLang() };
    } else {
      url     = '/api/loyalty/optimize';
      payload = { config: source.config, econ: source.econ };
    }

    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('AI error ' + res.status);
    const data = await res.json();

    if (tabKey === 'texts')    _aiTexts = data;
    if (tabKey === 'audit')    _aiAudit = data;
    if (tabKey === 'optimize') { _aiOpt = data; window._lastOptRecs = data.recommendations || []; }
    if (tabKey === 'missions') {
      _aiMissions = data;
      mergeMissionNarratives(data.missions, detailId);
    }

    if (detailId) {
      renderDetailMissionsTab(detailId);
    } else {
      switchAiTab(tabKey);
    }
  } catch(e) {
    const retryArg = detailId ? `'${tabKey}','${detailId}'` : `'${tabKey}'`;
    if (body) body.innerHTML = `<div class="alert alert-warn">Error: ${esc(e.message)}
      <button class="btn btn-sm btn-outline" style="margin-left:10px" onclick="fetchAI(${retryArg})">${t('opt_retry')}</button></div>`;
  }
}

function mergeMissionNarratives(narratives, detailId) {
  const byId = Object.fromEntries((narratives || []).map(n => [n.id, n]));

  if (detailId) {
    updateProgramMissions(detailId, byId);
  } else if (lastResult) {
    const missions = lastResult.config.missions || [];
    missions.forEach(m => {
      const n = byId[m.id];
      if (n) {
        m.narrative  = n.narrative;
        m.tierEffect = n.tierEffect;
      }
    });
  }
}

function updateProgramMissions(id, narrativeById) {
  const list = loadPrograms();
  const p    = list.find(x => x.id === id);
  if (!p) return;
  const missions = p.result.config.missions || [];
  missions.forEach(m => {
    const n = narrativeById[m.id];
    if (n) {
      m.narrative  = n.narrative;
      m.tierEffect = n.tierEffect;
    }
  });
  p.updatedAt = new Date().toISOString();
  savePrograms(list);
}

function renderDetailMissionsTab(id) {
  const p = loadPrograms().find(x => x.id === id);
  if (!p) return;
  const missions = p.result.config.missions || [];
  const body     = document.getElementById('ai-tab-body');
  if (body) body.innerHTML = renderMissionsNarrativeHTML(missions);
}

function renderTextsHTML(texts) {
  const channels = [
    { key: 'push',     label: '📲 Push' },
    { key: 'sms',      label: '📱 SMS' },
    { key: 'telegram', label: '✈️ Telegram' },
    { key: 'email',    label: '📧 Email' },
    { key: 'popup',    label: '💬 Popup' },
  ];
  return channels.map(ch => {
    const items = texts[ch.key] || [];
    const rows = items.map((item, i) => {
      const body  = typeof item === 'object' ? (item.body || item.subtext || '') : '';
      const title = typeof item === 'object' ? (item.subject || item.headline || '') : item;
      const sub   = body ? `<div style="font-size:.78rem;color:var(--muted);margin-top:3px">${esc(body)}</div>` : '';
      const cta   = item.cta ? `<div style="font-size:.72rem;font-weight:700;color:#a0b0ff;margin-top:4px">CTA: ${esc(item.cta)}</div>` : '';
      return `<div class="text-variant">
        <div class="text-variant-label">v${i + 1}</div>
        <div class="text-variant-body">${esc(String(title))}</div>
        ${sub}${cta}
        <button class="copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(typeof item === 'string' ? item : title + (body ? '\n' + body : ''))})">copy</button>
      </div>`;
    }).join('');
    return `<div class="card"><div class="card-title">${ch.label}</div>${rows}</div>`;
  }).join('');
}

function renderAuditHTML(audit) {
  const checks = (audit.checks || []).map(c => `
    <div class="audit-check">
      <div class="audit-status ${c.status === 'ok' ? 'ok' : 'warn'}">${c.status === 'ok' ? '✓' : '!'}</div>
      <div>
        <div class="audit-label">${esc(c.label)}</div>
        <div class="audit-note">${esc(c.note)}</div>
        ${c.rule ? `<div style="font-size:.7rem;color:#a0b0ff;margin-top:3px">📋 ${esc(c.rule)}</div>` : ''}
      </div>
    </div>`).join('');

  const recs = (audit.recommendations || []).map(r => `
    <div class="rec-card">
      <div class="rec-text">${esc(r.text)}</div>
      <div class="rec-impact">${esc(r.impact)}</div>
    </div>`).join('');

  return `<div class="card"><div class="card-title">🔍 Compliance Checks</div>${checks}</div>
    ${recs ? `<div class="card"><div class="card-title">💡 Recommendations</div>${recs}</div>` : ''}`;
}

function getParamLabel(param) {
  const key = 'param_' + param;
  const val  = t(key);
  return val !== key ? val : param;
}

function renderOptimizeHTML(opt) {
  const impactColor = { high: '#10b981', med: '#f59e0b', low: '#8892a4' };
  const impactLabel = { high: t('impact_high'), med: t('impact_med'), low: t('impact_low') };
  const recs = (opt.recommendations || []).map(r => {
    const ic    = impactColor[r.impact] || 'var(--muted)';
    const label = getParamLabel(r.param);
    return `<div class="card" style="border-color:${ic}22;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px">
        <div style="font-weight:700;font-size:.88rem">${esc(label)}</div>
        <span class="badge" style="background:${ic}20;color:${ic};white-space:nowrap">${esc(impactLabel[r.impact] || r.impact)}</span>
      </div>
      <div style="display:flex;gap:10px;font-size:.8rem;margin-bottom:8px">
        <div style="color:var(--muted)">${t('opt_now')}: <strong style="color:var(--text)">${esc(r.current)}</strong></div>
        <div style="color:var(--muted)">→ <strong style="color:${ic}">${esc(r.target)}</strong></div>
      </div>
      <div style="font-size:.79rem;color:var(--muted);line-height:1.5">${esc(r.reason)}</div>
    </div>`;
  }).join('');
  return `<div style="padding-top:4px">${recs}</div>`;
}

// ── DETAIL VIEW ───────────────────────────────────────────────────────────────

function renderDetailView(id) {
  const programs = loadPrograms();
  const p = programs.find(x => x.id === id);
  if (!p) { showView('list'); return; }

  document.getElementById('topbar-step').textContent = esc(p.name);
  const { config, econ } = p.result;
  const tiers    = (config.tiers || []);
  const missions = config.missions || [];

  const missionSection = missions.length > 0 ? `
    <div class="card">
      <div class="card-title">🎯 ${t('missions_lbl')} (${missions.length})</div>
      ${missionListHTML(missions)}
    </div>` : '';

  const missionTab = missions.length > 0
    ? `<button class="tab" data-tab="missions-detail" onclick="fetchAI('missions','${esc(id)}')" style="margin-top:8px">${t('mission_describe_btn')}</button>`
    : '';

  const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '';

  document.getElementById('content').innerHTML = `
  <div class="step-header">
    <div class="step-badge">${t('detail_lbl')} ${date}</div>
    <div class="step-title">${esc(p.name)}</div>
  </div>

  <div class="card">
    <div class="card-title">📊 Economics</div>
    ${econGridHTML(econ)}
  </div>

  <div class="card">
    <div class="card-title">🏅 ${t('tiers_lbl')}</div>
    ${tierTableHTML(tiers)}
  </div>

  ${missionSection}

  ${missionTab ? `<div id="ai-tab-body">${missionTab}</div>` : ''}

  <div class="nav-footer">
    <button class="btn btn-ghost" onclick="showView('list')">${t('back')}</button>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline" onclick="deleteProgramById('${esc(id)}')">🗑 Delete</button>
      <button class="btn btn-gold" onclick="addDetailToCalendar('${esc(id)}')">${t('calendar_btn')}</button>
    </div>
  </div>`;
}

// ── CONTEXT MENU ──────────────────────────────────────────────────────────────

let _menuId = null;
function openMenu(e, id) {
  e.stopPropagation();
  closeMenu();
  _menuId   = id;
  _menuOpen = true;
  const menu = document.createElement('div');
  menu.id = 'ly-menu';
  menu.className = 'ly-menu';
  menu.style.left = e.clientX + 'px';
  menu.style.top  = e.clientY + 'px';
  menu.innerHTML = `
    <button class="ly-menu-item" onclick="showView('detail','${esc(id)}')">📋 View</button>
    <div class="ly-menu-sep"></div>
    <button class="ly-menu-item" style="color:#ef4444" onclick="deleteProgramById('${esc(id)}')">🗑 Delete</button>`;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', closeMenu, { once: true }), 10);
}
function closeMenu() {
  const m = document.getElementById('ly-menu');
  if (m) m.remove();
  _menuOpen = false;
}

// ── SAVE / DELETE ─────────────────────────────────────────────────────────────

function setDraft(key, value) {
  draft[key] = value;
}

function saveCurrentProgram() {
  if (!lastResult) return;
  const programs = loadPrograms();
  const name = autoName(draft.mode, draft.region, draft.segment);
  const now  = new Date().toISOString();
  programs.push({ id: genId(), name, result: lastResult, params: { ...draft }, createdAt: now, updatedAt: now });
  savePrograms(programs);
  updateAllBadges();
  showToast(t('saved_toast'));
}

function deleteProgramById(id) {
  if (!confirm(t('delete_confirm'))) return;
  const programs = loadPrograms().filter(p => p.id !== id);
  savePrograms(programs);
  updateAllBadges();
  showView('list');
}

// ── ADD TO RETENTION CALENDAR ─────────────────────────────────────────────────

function _buildCalendarEntry(result, params) {
  const today   = new Date();
  const monday  = new Date(today);
  monday.setDate(today.getDate() + ((today.getDay() === 0 ? 1 : 8 - today.getDay())));
  const addD = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10); };
  const modeLabel = { tiers: 'Tiers', missions: 'Missions', hybrid: 'Hybrid' };
  return {
    title:      `Loyalty ${modeLabel[params.mode] || params.mode} · ${(params.region || '').toUpperCase()} / ${params.segment}`,
    type:       'vip',
    segment:    params.segment,
    geo:        params.region,
    startDate:  monday.toISOString().slice(0, 10),
    endDate:    addD(monday, 29),
    status:     'draft',
    brands:     ['default'],
    mechanic:   params.mode,
    rewards:    { cashbackPct: Math.round((params.topCashbackRate || 0) * 100) },
    econ:       result.econ || null,
    sourceType: 'loyalty_generator',
  };
}

function _doAddToCalendar(campaign) {
  const isRu = getLang() === 'ru';
  try {
    const camps = JSON.parse(localStorage.getItem('rc_campaigns') || '[]');
    const dupe  = camps.find(c =>
      c.sourceType === 'loyalty_generator' &&
      c.geo        === campaign.geo &&
      c.segment    === campaign.segment &&
      c.mechanic   === campaign.mechanic
    );
    if (dupe) {
      const date = new Date(dupe.createdAt).toLocaleDateString();
      if (!confirm(t('calendar_dupe', dupe.title, date))) return;
    }
    const now = new Date().toISOString();
    camps.push({ ...campaign, id: 'ly_' + Date.now(), createdAt: now, updatedAt: now });
    localStorage.setItem('rc_campaigns', JSON.stringify(camps));
    showToast(t('calendar_toast'));
  } catch {}
}

function addLoyaltyToCalendar() {
  if (!lastResult) return;
  _doAddToCalendar(_buildCalendarEntry(lastResult, draft));
}

function addDetailToCalendar(id) {
  const p = loadPrograms().find(x => x.id === id);
  if (!p) return;
  _doAddToCalendar(_buildCalendarEntry(p.result, p.params));
}

// ── INIT ───────────────────────────────────────────────────────────────────────

(function init() {
  const lang = getLang();
  document.querySelectorAll('.lt-btn').forEach(b => b.classList.toggle('active', b.id === 'lt-' + lang));
  applyNavLang(lang);

  updateAllBadges();

  const params = new URLSearchParams(location.search);
  if (params.get('view') === 'setup') {
    step = 1;
    showView('setup');
  } else {
    showView('list');
  }

  document.querySelector('.main').classList.add('ready');
})();

function toggleLoyaltyGlossary() {
  let panel = document.getElementById('loyalty-glossary-panel');
  if (panel) { panel.remove(); return; }
  panel = document.createElement('div');
  panel.id = 'loyalty-glossary-panel';
  panel.style.cssText = 'position:fixed;top:54px;right:0;width:360px;max-width:100vw;height:calc(100vh - 54px);background:#0f1420;border-left:1px solid #1e2740;z-index:200;display:flex;flex-direction:column;box-shadow:-8px 0 32px rgba(0,0,0,.5);overflow-y:auto;padding:20px';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <span style="font-size:.88rem;font-weight:700;color:#e8eaf0">Glossary</span>
      <button onclick="document.getElementById('loyalty-glossary-panel').remove()"
        style="background:rgba(255,255,255,.08);border:none;color:#8892a4;width:26px;height:26px;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">✕</button>
    </div>
    ${[
      ['Tier','Loyalty level a player reaches by accumulating enough points (e.g. Bronze → Silver → Gold)'],
      ['Points','Currency earned by players through deposits and gameplay activity'],
      ['Earn Rate','Points awarded per unit of deposit or wagering amount'],
      ['Redeem Rate','Points required to redeem 1 unit of real currency'],
      ['Cashback','Percentage of net losses returned to the player as bonus or cash'],
      ['Threshold','Minimum points required to reach or maintain a tier'],
      ['Mission','A one-time task players complete to earn bonus points (e.g. "Deposit 3 days in a row")'],
      ['Hybrid','Program combining both tier progression and missions'],
      ['LTV','Lifetime Value — projected total revenue from a player over their lifetime'],
      ['Retention Rate','Percentage of players who remain active month-over-month'],
      ['ARPU','Average Revenue Per User — average monthly revenue per active player'],
    ].map(([term, def]) => `
      <div style="padding:10px 0;border-bottom:1px solid #1e2740">
        <div style="font-size:.8rem;font-weight:700;color:#a0b0ff;margin-bottom:3px">${term}</div>
        <div style="font-size:.76rem;color:#8892a4;line-height:1.5">${def}</div>
      </div>`).join('')}
  `;
  document.body.appendChild(panel);
}
