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
  if (n === undefined || n === null) return '—';
  if (n >= 36) return '36+ mo';
  return n.toFixed(1) + ' mo';
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
    return `<div class="mission-row">
      <div class="mission-name">${icon} ${esc(m.name)}</div>
      <div class="mission-meta">
        <span class="mission-tag">${esc(freq)}</span>
        <span>Target: ${m.target} ${m.objective.replace('_', ' ')}</span>
        <span>Reward: <strong>${reward}</strong></span>
      </div>
    </div>`;
  }).join('');
}

function econGridHTML(econ) {
  const roi3m = econ.roi3m;
  const roiClass = roi3m >= 1.5 ? 'pos' : roi3m >= 0.8 ? 'neu' : 'neg';
  const liftClass = econ.retentionLiftPct >= 15 ? 'pos' : econ.retentionLiftPct >= 8 ? 'neu' : 'neg';
  const costClass = econ.costRatioPct <= 10 ? 'pos' : econ.costRatioPct <= 20 ? 'neu' : 'neg';

  return `<div class="econ-grid">
    <div class="econ-card">
      <div class="econ-label">${t('cost_lbl')}</div>
      <div class="econ-val ${costClass}">${fmtUSD(econ.monthlyCostUSD)}</div>
      <div class="econ-sub">/mo</div>
    </div>
    <div class="econ-card">
      <div class="econ-label">${t('cost_ratio')}</div>
      <div class="econ-val ${costClass}">${fmtPct(econ.costRatioPct)}</div>
      <div class="econ-sub">of GGR</div>
    </div>
    <div class="econ-card">
      <div class="econ-label">${t('lift_lbl')}</div>
      <div class="econ-val ${liftClass}">${fmtPct(econ.retentionLiftPct)}</div>
      <div class="econ-sub">retention</div>
    </div>
    <div class="econ-card">
      <div class="econ-label">${t('roi_lbl')}</div>
      <div class="econ-val ${roiClass}">${fmtX(econ.roi3m)}</div>
      <div class="econ-sub">3-month</div>
    </div>
    <div class="econ-card">
      <div class="econ-label">${t('breakeven')}</div>
      <div class="econ-val neu">${fmtMo(econ.breakEvenMonths)}</div>
      <div class="econ-sub">break-even</div>
    </div>
    <div class="econ-card">
      <div class="econ-label">${t('liability')}</div>
      <div class="econ-val neu">${fmtUSD(econ.totalLiabilityUSD)}</div>
      <div class="econ-sub">unredeemed pts</div>
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
  document.getElementById('topbar-step').textContent = 'Programs';
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
      const modeLabel = { tiers:'Tiers', missions:'Missions', hybrid:'Hybrid' };
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
      <div style="font-size:1.1rem;font-weight:700;color:var(--text)">Loyalty Programs</div>
      <div style="font-size:.8rem;color:var(--muted);margin-top:2px">${programs.length} saved</div>
    </div>
    <div class="ctable">
      <div class="ct-hd">
        <div>Name</div>
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

function renderStep1() {
  document.getElementById('topbar-step').textContent = 'Step 1 of 3 — ' + t('step1_title');

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
  <div class="step-header">
    <div class="step-badge">Step 1 / 3</div>
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
  document.getElementById('topbar-step').textContent = 'Step 2 of 3 — ' + t('step2_title');

  const tierChips = [3, 4, 5].map(n => `
    <div class="chip ${draft.numTiers === n ? 'on' : ''}" onclick="setDraft('numTiers',${n});renderStep2()">${n} tiers</div>
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
  <div class="step-header">
    <div class="step-badge">Step 2 / 3</div>
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
        <div class="card-title">Redeem & Expiry</div>
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
        Points = months on ladder × ${draft.avgdep} avgdep × ${draft.earnRateDeposit} pts/$1
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
  _aiTab = 'econ'; _aiTexts = null; _aiAudit = null; _aiOpt = null;
  document.getElementById('topbar-step').textContent = 'Step 3 of 3 — ' + t('step3_title');
  document.getElementById('content').innerHTML = `
    <div class="step-header">
      <div class="step-badge">Step 3 / 3</div>
      <div class="step-title">${t('step3_title')}</div>
    </div>
    <div class="loader"><div class="spinner"></div><span>${t('generating')}</span></div>`;

  try {
    const res = await fetch('/api/loyalty/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(draft),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'API error ' + res.status);
    }
    lastResult = await res.json();
    renderStep3(lastResult);
  } catch (e) {
    document.getElementById('content').innerHTML = `
      <div class="alert alert-warn">Error: ${esc(e.message)}</div>
      <button class="btn btn-outline" onclick="goStep(2)">${t('back')}</button>`;
  }
}

// AI state for step 3 tabs
let _aiTab    = 'econ';  // 'econ' | 'texts' | 'audit' | 'optimize'
let _aiTexts  = null;
let _aiAudit  = null;
let _aiOpt    = null;

function renderStep3(data) {
  document.getElementById('topbar-step').textContent = 'Step 3 of 3 — ' + t('step3_title');
  const { config, econ } = data;
  const tiers    = config.tiers || [];
  const missions = config.missions || [];

  const missionSection = missions.length > 0 ? `
    <div class="card">
      <div class="card-title">🎯 ${t('missions_lbl')} (${missions.length})</div>
      ${missionListHTML(missions)}
    </div>` : '';

  document.getElementById('content').innerHTML = `
  <div class="step-header">
    <div class="step-badge">Step 3 / 3</div>
    <div class="step-title">${t('step3_title')}</div>
    <div class="step-sub">${t('step3_sub')}</div>
  </div>

  <div class="tab-row" style="margin-bottom:16px">
    <button class="tab ${_aiTab==='econ'     ?'active':''}" onclick="switchAiTab('econ')">📊 Economics</button>
    <button class="tab ${_aiTab==='texts'    ?'active':''}" onclick="switchAiTab('texts')">✍ Texts</button>
    <button class="tab ${_aiTab==='audit'    ?'active':''}" onclick="switchAiTab('audit')">🔍 Audit</button>
    <button class="tab ${_aiTab==='optimize' ?'active':''}" onclick="switchAiTab('optimize')">⚡ Optimize</button>
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
        <div class="card-title">📊 Economics</div>
        ${econGridHTML(econ)}
      </div>
      <div class="card">
        <div class="card-title">🏅 ${t('tiers_lbl')}</div>
        ${tierTableHTML(tiers)}
      </div>
      ${missionSection}`;
  }
  if (_aiTab === 'texts') {
    if (!_aiTexts) return renderAiFetchPrompt('texts', '✍ Generate CRM copy for this loyalty program');
    return renderTextsHTML(_aiTexts);
  }
  if (_aiTab === 'audit') {
    if (!_aiAudit) return renderAiFetchPrompt('audit', '🔍 Run compliance audit');
    return renderAuditHTML(_aiAudit);
  }
  if (_aiTab === 'optimize') {
    if (!_aiOpt) return renderAiFetchPrompt('optimize', '⚡ Get optimization recommendations');
    return renderOptimizeHTML(_aiOpt);
  }
  return '';
}

function renderAiFetchPrompt(tabKey, label) {
  return `<div class="card" style="text-align:center;padding:32px 20px">
    <div style="font-size:1.8rem;margin-bottom:10px">${tabKey === 'texts' ? '✍' : tabKey === 'audit' ? '🔍' : '⚡'}</div>
    <div style="font-size:.9rem;font-weight:600;margin-bottom:16px">${esc(label)}</div>
    <button class="btn btn-primary" onclick="fetchAI('${tabKey}')">${esc(label)} →</button>
  </div>`;
}

function switchAiTab(tab) {
  _aiTab = tab;
  if (!lastResult) return;
  const tiers    = lastResult.config.tiers || [];
  const missions = lastResult.config.missions || [];
  const missionSection = missions.length > 0
    ? `<div class="card"><div class="card-title">🎯 ${t('missions_lbl')} (${missions.length})</div>${missionListHTML(missions)}</div>` : '';
  // Update tabs active state
  document.querySelectorAll('.tab-row .tab').forEach(b => {
    b.classList.toggle('active', b.textContent.toLowerCase().includes(tab === 'econ' ? 'econ' : tab));
  });
  const body = document.getElementById('ai-tab-body');
  if (body) body.innerHTML = renderAiTabBody(lastResult, tiers, missions, missionSection);
}

async function fetchAI(tabKey) {
  const body = document.getElementById('ai-tab-body');
  if (body) body.innerHTML = `<div class="loader"><div class="spinner"></div><span>Generating with AI…</span></div>`;

  try {
    let url, payload;
    if (tabKey === 'texts') {
      url     = '/api/loyalty/texts';
      payload = { config: lastResult.config, econ: lastResult.econ };
    } else if (tabKey === 'audit') {
      url     = '/api/loyalty/audit';
      payload = { config: lastResult.config };
    } else {
      url     = '/api/loyalty/optimize';
      payload = { config: lastResult.config, econ: lastResult.econ };
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
    if (tabKey === 'optimize') _aiOpt   = data;

    switchAiTab(tabKey);
  } catch(e) {
    if (body) body.innerHTML = `<div class="alert alert-warn">Error: ${esc(e.message)}
      <button class="btn btn-sm btn-outline" style="margin-left:10px" onclick="fetchAI('${tabKey}')">Retry</button></div>`;
  }
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

const PARAM_LABELS = {
  topCashbackRate:  'Top-tier Cashback Rate',
  earnRateDeposit:  'Points per $1 Deposited',
  earnRateWager:    'Points per $1 Wagered',
  redeemRate:       'Points per $1 Redeemed',
  missionCount:     'Number of Missions',
  numTiers:         'Number of Tiers',
  mode:             'Program Mode',
  pointsExpiry:     'Points Expiry',
};

function renderOptimizeHTML(opt) {
  const impactColor = { high: '#10b981', med: '#f59e0b', low: '#8892a4' };
  const impactLabel = { high: '↑ High impact', med: '→ Medium impact', low: '↓ Low impact' };
  const recs = (opt.recommendations || []).map(r => {
    const ic    = impactColor[r.impact] || 'var(--muted)';
    const label = PARAM_LABELS[r.param] || r.param;
    return `<div class="card" style="border-color:${ic}22;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px">
        <div style="font-weight:700;font-size:.88rem">${esc(label)}</div>
        <span class="badge" style="background:${ic}20;color:${ic};white-space:nowrap">${esc(impactLabel[r.impact] || r.impact)}</span>
      </div>
      <div style="display:flex;gap:10px;font-size:.8rem;margin-bottom:8px">
        <div style="color:var(--muted)">Now: <strong style="color:var(--text)">${esc(r.current)}</strong></div>
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

  updateAllBadges();

  const params = new URLSearchParams(location.search);
  if (params.get('view') === 'setup') {
    step = 1;
    showView('setup');
  } else {
    showView('list');
  }
})();
