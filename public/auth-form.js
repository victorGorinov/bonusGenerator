// Shared login/register form wiring — i18n bootstrap + submit/fetch/error
// handling. Both pages differ only in endpoint, fields, and error mapping.

const I18N_BASE = {
  en: { err_generic: 'Something went wrong. Try again.' },
  ru: { err_generic: 'Что-то пошло не так. Попробуйте снова.' },
};

export function initAuthForm({ formId, endpoint, fields, i18n, errorMap, redirectTo }) {
  const lang = (localStorage.getItem('bonusLang') === 'ru') ? 'ru' : 'en';
  const dict = { ...I18N_BASE[lang], ...(i18n[lang] || {}) };
  const t = (key) => dict[key] || key;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });

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
