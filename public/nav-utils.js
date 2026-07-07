// Shared navigation and badge utilities — included on all pages

// ── NAV LANGUAGE ─────────────────────────────────────────────────────────────

const _NAV_I18N = {
  en: {
    nav_main:        'Main',
    nav_dashboard:   'Dashboard',
    nav_tools:       'Tools',
    nav_calendar:    'Retention Calendar',
    nav_bonuses:     'Bonuses',
    nav_tournament:  'Tournaments',
    nav_setup_guide: 'Setup Guide',
    nav_loyalty:     'Loyalty Program',
    nav_generator:   'Generator',
    nav_soon:        'Soon',
    nav_analytics:   'Analytics',
    nav_reports:     'Reports',
    nav_settings:    'Settings',
    nav_back:        '← Back to home',
    nav_logout:      'Logout',
    nav_signin:      'Sign in',
    nav_admin:       'Admin',
    nav_rc_new:      '+ New Campaign',
    nav_rc_ai:       '🤖 AI-Assisted',
    nav_rc_templates:'📄 Templates',
    nav_rc_month:    'Month',
    nav_rc_week:     'Week',
    nav_rc_agenda:   'Agenda',
    nav_rc_today:    'Today',
    fc_toggle:       'Forecast',
    fc_title:        'Period Forecast',
    fc_gross:        'Gross Revenue',
    fc_overlap:      'Cannibalization',
    fc_net:          'Net Revenue',
    fc_profit:       'Net Profit',
    fc_coverage:     'Coverage',
    fc_pairs_title:  'Top overlaps',
    fc_no_econ:      'no economics data',
    fc_range:        'Date range',
    fc_chart_title:  'Net revenue by day',
    fc_click_hint:   'click a bar for the daily breakdown',
    fc_day_active:   'Active that day',
    fc_day_none:     'No activity this day',
    fc_overlap_help: 'Revenue lost because overlapping activities compete for the same players — the combined lift is lower than the sum of each on its own.',
  },
  ru: {
    nav_main:        'Главное',
    nav_dashboard:   'Дашборд',
    nav_tools:       'Инструменты',
    nav_calendar:    'Календарь',
    nav_bonuses:     'Бонусы',
    nav_tournament:  'Турниры',
    nav_setup_guide: 'Гайд настройки',
    nav_loyalty:     'Лояльность',
    nav_generator:   'Генератор',
    nav_soon:        'Скоро',
    nav_analytics:   'Аналитика',
    nav_reports:     'Отчёты',
    nav_settings:    'Настройки',
    nav_back:        '← На главную',
    nav_logout:      'Выйти',
    nav_signin:      'Войти',
    nav_admin:       'Админка',
    nav_rc_new:      '+ Новая кампания',
    nav_rc_ai:       '🤖 AI-генерация',
    nav_rc_templates:'📄 Шаблоны',
    nav_rc_month:    'Месяц',
    nav_rc_week:     'Неделя',
    nav_rc_agenda:   'Список',
    nav_rc_today:    'Сегодня',
    fc_toggle:       'Прогноз',
    fc_title:        'Прогноз периода',
    fc_gross:        'Брутто',
    fc_overlap:      'Наложение',
    fc_net:          'Нетто',
    fc_profit:       'Прибыль',
    fc_coverage:     'Покрытие',
    fc_pairs_title:  'Топ наложений',
    fc_no_econ:      'нет данных экономики',
    fc_range:        'Диапазон дат',
    fc_chart_title:  'Нетто-доход по дням',
    fc_click_hint:   'клик по столбцу — детализация дня',
    fc_day_active:   'Активны в этот день',
    fc_day_none:     'Нет активности в этот день',
    fc_overlap_help: 'Потеря дохода из-за того, что пересекающиеся активности конкурируют за одних игроков — совокупный прирост ниже, чем сумма каждой по отдельности.',
  },
};

window._NAV_I18N = _NAV_I18N;

function applyNavLang(lang) {
  // Primary: set data-lang on <html> — CSS handles all [data-tr-en]/[data-tr-ru] visibility
  document.documentElement.setAttribute('data-lang', lang);
  // Fallback: text-swap for any remaining legacy [data-i18n] elements
  var dict = _NAV_I18N[lang] || _NAV_I18N.en;
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
}

// ── BADGES ───────────────────────────────────────────────────────────────────

function updateBadge(elementId, storageKey) {
  try {
    const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = items.length;
    el.style.display = items.length > 0 ? 'inline' : 'none';
  } catch(e) {}
}

function updateAllBadges() {
  updateBadge('nav-offer-gen-badge',  'be_campaigns');
  updateBadge('nav-tourn-gen-badge',  'savedTournaments');
  updateBadge('nav-loyalty-badge',    'savedLoyaltyPrograms');
  updateBadge('nav-reports-badge',    'savedReports');
}

// ── NAV SUBGROUP TOGGLE ───────────────────────────────────────────────────────
// .nav-sub items are hidden via CSS (display:none in each page's <style>).
// .nav-chevron is a static <span> in the HTML inside the parent nav-item.
// This function wires up click handlers and restores expanded state.

(function initNavSubgroups() {
  const LS_KEY  = 'nav-sub-tourn-expanded';
  const expanded = localStorage.getItem(LS_KEY) === '1'; // default: collapsed

  document.querySelectorAll('.nav-chevron').forEach(chev => {
    // Find the adjacent .nav-sub (next sibling of the parent nav-item)
    const parent = chev.closest('.nav-item');
    if (!parent) return;
    const sub = parent.nextElementSibling;
    if (!sub || !sub.classList.contains('nav-sub')) return;

    // Restore expanded state
    chev.textContent = expanded ? '▾' : '▸';
    if (expanded) sub.style.display = 'flex';

    chev.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const isVisible = getComputedStyle(sub).display !== 'none';
      sub.style.display = isVisible ? 'none' : 'flex';
      chev.textContent  = isVisible ? '▸' : '▾';
      localStorage.setItem(LS_KEY, isVisible ? '0' : '1');
    });
  });
})();

// ── SYNC ON LOAD ──────────────────────────────────────────────────────────────
// Runs synchronously as the first script in <body> — before first paint.
// Sets lang toggle active state and badge counts so they never flash.
(function() {
  try {
    var lang = localStorage.getItem('bonusLang') || 'en';
    document.querySelectorAll('.lt-btn').forEach(function(b) {
      b.classList.toggle('active', b.id === 'lt-' + lang);
    });
    updateAllBadges();
  } catch(e) {}
})();

// ── ACCOUNT SYNC + HEADER ─────────────────────────────────────────────────────
// For a logged-in user: hydrate the localStorage caches from the server ONCE per
// browser session (not per page load — that would burn the /api/saved rate limit
// and risk overwriting an in-flight write), then fire 'retomat:synced' so each
// page re-renders. Also renders the user chip (name + Logout) / a "Sign in" link
// into the topbar. Guests are a no-op and keep working localStorage-only.
// No guest→server migration: accounts start empty (product decision); the first
// authed load overwrites any leftover guest localStorage with the server copy.
// Requires repo-http.js.

// [entity, localStorageKey] — must match src/use-cases/SavedItems.ts ENTITIES.
var _RTM_COLLECTIONS = [
  ['configs',            'cfgSaved'],
  ['campaigns',          'be_campaigns'],
  ['tournaments',        'savedTournaments'],
  ['loyalty-programs',   'savedLoyaltyPrograms'],
  ['calendar-events',    'rc_campaigns'],
  ['calendar-templates', 'rc_templates'],
];

var _RTM_HYDRATED_KEY = 'rtm_hydrated_v1'; // sessionStorage — one hydrate per session

function _rtmHydrateAll() {
  // Independent GETs — run them in parallel, not 6 serial round-trips.
  return Promise.all(_RTM_COLLECTIONS.map(function (c) {
    return window.RetomatRepo.hydrate(c[0], c[1]);
  }));
}

async function _rtmSync() {
  if (!window.RetomatRepo) return;
  try {
    if (!(await window.RetomatRepo.isAuthed())) return;
    // Already hydrated this session? localStorage still holds that copy across
    // same-tab navigations, so skip the network work and don't re-fire the event.
    try { if (sessionStorage.getItem(_RTM_HYDRATED_KEY)) return; } catch (e) {}
    await _rtmHydrateAll();                       // server → localStorage caches
    try { sessionStorage.setItem(_RTM_HYDRATED_KEY, '1'); } catch (e) {}
    updateAllBadges();
    window.dispatchEvent(new CustomEvent('retomat:synced'));
  } catch (e) {}
}

async function _rtmLogout() {
  try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch (e) {}
  // Clear the mirrored caches + session hydrate flag so a following guest doesn't
  // see the previous account's data and the next login re-hydrates cleanly.
  try {
    _RTM_COLLECTIONS.forEach(function (c) { localStorage.removeItem(c[1]); });
    sessionStorage.removeItem(_RTM_HYDRATED_KEY);
  } catch (e) {}
  location.href = '/login.html';
}
window._rtmLogout = _rtmLogout;

async function _rtmRenderUserChip() {
  if (!window.RetomatRepo) return;
  var user = null;
  try { user = await window.RetomatRepo.me(); } catch (e) {} // shared /api/auth/me probe
  var host = document.querySelector('.topbar-right') || document.querySelector('.nav-footer');
  if (!host) return;
  var existing = document.getElementById('rtm-user-chip');
  if (existing) existing.remove();
  var lang = (function () { try { return localStorage.getItem('bonusLang') || 'en'; } catch (e) { return 'en'; } })();
  var t = _NAV_I18N[lang] || _NAV_I18N.en;
  var chip = document.createElement('span');
  chip.id = 'rtm-user-chip';
  chip.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin-right:10px;font-size:.72rem;color:var(--muted,#8892a4)';
  if (user) {
    // Admin link surfaces only for role='admin' (role comes from /api/auth/me, DB-fresh).
    var adminLink = user.role === 'admin'
      ? '<a href="/admin.html" data-i18n="nav_admin" style="color:var(--accent,#a0b0ff);font-weight:700;text-decoration:none">' + t.nav_admin + '</a>'
      : '';
    chip.innerHTML =
      adminLink +
      '<span title="' + (user.email || '') + '" style="font-weight:600;color:var(--text,#e8eaf0)">' +
      (user.name || user.email || 'Account') + '</span>' +
      '<button type="button" id="rtm-logout-btn" data-i18n="nav_logout" style="background:none;border:1px solid var(--border,#1e2740);color:inherit;' +
      'border-radius:100px;padding:2px 10px;font-size:.68rem;font-weight:700;cursor:pointer;font-family:inherit">' + t.nav_logout + '</button>';
  } else {
    chip.innerHTML = '<a href="/login.html" data-i18n="nav_signin" style="color:var(--accent,#a0b0ff);font-weight:700;text-decoration:none">' + t.nav_signin + '</a>';
  }
  host.insertBefore(chip, host.firstChild);
  var btn = document.getElementById('rtm-logout-btn');
  if (btn) btn.addEventListener('click', _rtmLogout);
}

(function () {
  function boot() { _rtmSync(); _rtmRenderUserChip(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

// ── GLOBAL WELCOME POPUP ──────────────────────────────────────────────────────
// One-time onboarding overlay shown across all feature pages. Gated by the
// 'retomat_welcome_done' localStorage key. Bilingual (EN/RU) via 'bonusLang'.

function _retomatWelcomeContent(isRu) {
  return {
    title:    isRu ? 'Добро пожаловать в Retomat' : 'Welcome to Retomat',
    subtitle: isRu
      ? 'Retention OS для iGaming — планируйте, собирайте и запускайте удержание в одном окне'
      : 'Retention OS for iGaming — plan, build and ship retention in one workspace',
    features: isRu ? [
      ['📅', 'Retention Calendar', 'План кампаний и турниров, drag-drop, детект конфликтов, шаблоны, экспорт CSV/JSON'],
      ['🎁', 'Конфигуратор бонусов', 'Welcome / NDB / Reload / D2 / D3 / Cashback по гео и лицензии, модель затрат + Balance-to-Profit'],
      ['🏆', 'Генератор турниров', 'Экономика по сегментам, рекомендация призового фонда, проверка реализма'],
      ['💎', 'Генератор лояльности', 'Программы тиров / миссий / гибрид с полной экономикой лояльности'],
      ['🤖', 'AI-тексты и аудит', 'Push · Email · SMS · Telegram · Popup + аудит соответствия (MGA / UKGC / DGA)'],
    ] : [
      ['📅', 'Retention Calendar', 'Plan campaigns & tournaments, drag-drop, conflict detection, templates, CSV/JSON export'],
      ['🎁', 'Bonus Configurator', 'Welcome / NDB / Reload / D2 / D3 / Cashback by geo & license, cost model + Balance-to-Profit'],
      ['🏆', 'Tournament Generator', 'Segment economics, prize-pool recommendation, realism check'],
      ['💎', 'Loyalty Generator', 'Tiers / missions / hybrid programs with full loyalty economics'],
      ['🤖', 'AI Texts & Compliance Audit', 'Push · Email · SMS · Telegram · Popup + license audit (MGA / UKGC / DGA)'],
    ],
    dontShow: isRu ? 'Больше не показывать' : "Don't show again",
    cta:      isRu ? 'Начать →' : 'Explore →',
  };
}

function showRetomatWelcome() {
  if (document.getElementById('retomat-welcome-modal')) return;
  var isRu = false;
  try { isRu = (localStorage.getItem('bonusLang') || 'en') === 'ru'; } catch(e) {}
  var c = _retomatWelcomeContent(isRu);

  var featuresHtml = c.features.map(function(f) {
    return '<div style="display:flex;gap:13px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.05)">' +
      '<span style="font-size:18px;min-width:24px;text-align:center">' + f[0] + '</span>' +
      '<div>' +
        '<div style="font-size:.83rem;font-weight:700;color:#e8eaf0">' + f[1] + '</div>' +
        '<div style="font-size:.78rem;color:#8892a4;line-height:1.5">' + f[2] + '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  var modal = document.createElement('div');
  modal.id = 'retomat-welcome-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(8,11,18,.75);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML =
    '<div style="background:#161c2d;border:1px solid rgba(79,110,247,.3);border-radius:16px;padding:26px 26px 22px;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.6)">' +
      '<div style="font-size:1.18rem;font-weight:700;color:#e8eaf0;margin-bottom:4px">🚀 ' + c.title + '</div>' +
      '<div style="font-size:.82rem;color:#8892a4;margin-bottom:16px">' + c.subtitle + '</div>' +
      featuresHtml +
      '<div style="margin-top:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
        '<label style="display:flex;align-items:center;gap:7px;font-size:.77rem;color:#8892a4;cursor:pointer">' +
          '<input type="checkbox" id="retomat-welcome-skip" checked style="accent-color:#4f6ef7">' +
          c.dontShow +
        '</label>' +
        '<button id="retomat-welcome-cta" style="background:linear-gradient(135deg,#4f6ef7,#7c3aed);color:#fff;border:none;padding:9px 22px;border-radius:9px;font-size:.88rem;font-weight:700;cursor:pointer">' +
          c.cta +
        '</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  var close = function() {
    var cb = document.getElementById('retomat-welcome-skip');
    if (cb && cb.checked) { try { localStorage.setItem('retomat_welcome_done', '1'); } catch(e) {} }
    modal.remove();
  };
  modal.querySelector('#retomat-welcome-cta').addEventListener('click', close);
  modal.addEventListener('click', function(e) { if (e.target === modal) close(); });
}

function maybeShowRetomatWelcome() {
  try { if (localStorage.getItem('retomat_welcome_done') === '1') return; } catch(e) {}
  if (document.body) {
    showRetomatWelcome();
  } else {
    document.addEventListener('DOMContentLoaded', showRetomatWelcome);
  }
}

maybeShowRetomatWelcome();

// ── VIEW PARAM HELPERS ───────────────────────────────────────────────────────

function getViewParam() {
  return new URLSearchParams(window.location.search).get('view') || null;
}

// Returns the view to show on load, preferring hash then query param then default
function getInitialView(defaultView) {
  const hash = window.location.hash.replace('#', '');
  if (hash) return hash;
  return getViewParam() || defaultView;
}
