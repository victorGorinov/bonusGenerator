// Shared navigation and badge utilities — included on all pages

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
  updateBadge('camp-nav-badge',  'be_campaigns');
  updateBadge('nav-tourn-badge', 'savedTournaments');
}

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
