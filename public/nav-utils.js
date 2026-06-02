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
    nav_soon:        'Soon',
    nav_analytics:   'Analytics',
    nav_settings:    'Settings',
    nav_back:        '← Back to home',
    nav_rc_new:      '+ New Campaign',
    nav_rc_ai:       '🤖 AI-Assisted',
    nav_rc_templates:'📄 Templates',
    nav_rc_month:    'Month',
    nav_rc_week:     'Week',
    nav_rc_agenda:   'Agenda',
    nav_rc_today:    'Today',
  },
  ru: {
    nav_main:        'Главное',
    nav_dashboard:   'Дашборд',
    nav_tools:       'Инструменты',
    nav_calendar:    'Retention Calendar',
    nav_bonuses:     'Бонусы',
    nav_tournament:  'Турниры',
    nav_setup_guide: 'Гайд настройки',
    nav_loyalty:     'Лояльность',
    nav_soon:        'Скоро',
    nav_analytics:   'Аналитика',
    nav_settings:    'Настройки',
    nav_back:        '← На главную',
    nav_rc_new:      '+ Новая кампания',
    nav_rc_ai:       '🤖 AI-генерация',
    nav_rc_templates:'📄 Шаблоны',
    nav_rc_month:    'Месяц',
    nav_rc_week:     'Неделя',
    nav_rc_agenda:   'Список',
    nav_rc_today:    'Сегодня',
  },
};

function applyNavLang(lang) {
  const dict = _NAV_I18N[lang] || _NAV_I18N.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
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
