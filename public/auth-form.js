// Shared login/register form wiring — i18n bootstrap + submit/fetch/error
// handling. Both pages differ only in endpoint, fields, and error mapping.

const I18N_BASE = {
  en: { err_generic: 'Something went wrong. Try again.', close: 'Close' },
  ru: { err_generic: 'Что-то пошло не так. Попробуйте снова.', close: 'Закрыть' },
};

// Where the "×" should return to: the page the auth window was opened from.
// Captured once and kept in sessionStorage so navigating login↔register (whose
// referrer is the other auth page) doesn't overwrite the real origin.
function resolveReturnUrl() {
  const AUTH_PATHS = ['/login.html', '/register.html'];
  try {
    const ref = document.referrer;
    if (ref) {
      const u = new URL(ref);
      if (u.origin === window.location.origin && !AUTH_PATHS.includes(u.pathname)) {
        const url = u.pathname + u.search + u.hash;
        sessionStorage.setItem('auth_return', url);
        return url;
      }
    }
    const stored = sessionStorage.getItem('auth_return');
    if (stored) return stored;
  } catch { /* sessionStorage/URL unavailable — fall through */ }
  return '/';
}

export function initAuthForm({ formId, endpoint, fields, i18n, errorMap, redirectTo }) {
  const lang = (localStorage.getItem('bonusLang') === 'ru') ? 'ru' : 'en';
  const dict = { ...I18N_BASE[lang], ...(i18n[lang] || {}) };
  const t = (key) => dict[key] || key;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });

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
      window.location.href = redirectTo;
    } catch {
      errEl.textContent = t('err_generic');
    } finally {
      btn.disabled = false;
    }
  });
}
