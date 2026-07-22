// Shared login/register form wiring — i18n bootstrap + submit/fetch/error
// handling. Both pages differ only in endpoint, fields, and error mapping.

const I18N_BASE = {
  en: { err_generic: 'Something went wrong. Try again.', close: 'Close' },
  ru: { err_generic: 'Что-то пошло не так. Попробуйте снова.', close: 'Закрыть' },
};

const AUTH_PATHS = ['/login.html', '/register.html'];
const isSafe = (path) =>
  typeof path === 'string' &&
  path.startsWith('/') && !path.startsWith('//') &&  // same-origin path, not a protocol-relative URL
  !AUTH_PATHS.includes(path.split('?')[0].split('#')[0]);

// The explicit `?from=` on THIS page's URL, if safe — nothing else. Used for the
// post-auth redirect, which must reflect only the current, deliberate intent
// (guard bounce / a "Sign in" click), never a stale value left in sessionStorage
// by an earlier, abandoned auth attempt in the same tab.
function readFromParam() {
  try {
    const from = new URLSearchParams(window.location.search).get('from');
    return isSafe(from) ? from : null;
  } catch { return null; }
}

// Where the "×" should return to: the page the auth window was opened from.
// The server sends `Referrer-Policy: no-referrer`, so document.referrer is
// always empty — the origin is passed explicitly as a `?from=` query param by
// the entry points (nav "Sign in", feature-gate, admin). Kept in sessionStorage
// so navigating login↔register (which drops `from`) doesn't lose the origin.
function resolveReturnUrl() {
  try {
    const from = new URLSearchParams(window.location.search).get('from');
    if (isSafe(from)) {
      sessionStorage.setItem('auth_return', from);
      return from;
    }
    const stored = sessionStorage.getItem('auth_return');
    if (isSafe(stored)) return stored;
  } catch { /* sessionStorage/URLSearchParams unavailable — fall through */ }
  return '/';
}

export function initAuthForm({ formId, endpoint, fields, i18n, errorMap, redirectTo }) {
  const lang = (localStorage.getItem('bonusLang') === 'ru') ? 'ru' : 'en';
  const dict = { ...I18N_BASE[lang], ...(i18n[lang] || {}) };
  const t = (key) => dict[key] || key;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });

  // The deliberate return target for this auth attempt — from the URL only.
  const from = readFromParam();

  // Carry it across the login↔register switch links, since those anchors drop the
  // query string. This keeps the post-auth redirect (which trusts only the URL,
  // not sessionStorage) pointing at the right page after a form switch.
  if (from) {
    document.querySelectorAll('a[href="/login.html"], a[href="/register.html"]').forEach((a) => {
      a.setAttribute('href', a.getAttribute('href') + '?from=' + encodeURIComponent(from));
    });
  }

  const closeEl = document.getElementById('auth-close');
  if (closeEl) {
    closeEl.setAttribute('href', resolveReturnUrl());
    closeEl.setAttribute('title', t(closeEl.getAttribute('data-i18n-title') || 'close'));
  }

  const form = document.getElementById(formId);
  const errEl = document.getElementById('auth-err');
  const btn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    btn.disabled = true;
    const body = {};
    for (const field of fields) {
      const value = document.getElementById(`f-${field}`).value;
      // Don't trim the password — leading/trailing spaces can be intentional.
      body[field] = field === 'password' ? value : value.trim();
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const key = errorMap?.[data.code];
        errEl.textContent = key ? t(key) : t('err_generic');
        return;
      }
      // Return to the page the user came from (the tool they clicked on the
      // landing / were bounced from by auth-guard) via the fresh `?from=` on this
      // URL, else the page's configured default. Deliberately does NOT fall back
      // to sessionStorage, so an abandoned earlier attempt can't misroute this one.
      window.location.href = from || redirectTo;
    } catch {
      errEl.textContent = t('err_generic');
    } finally {
      btn.disabled = false;
    }
  });
}
