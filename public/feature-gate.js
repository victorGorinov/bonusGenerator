// Shared frontend feature gate. Loaded on tool pages that expose a feature which
// guests (or restricted plans) may not have. Mirrors the backend requireFeature:
// the server is the real gate (403 FEATURE_FORBIDDEN) — this just replaces the
// opaque "API error 403" dead-end with a clear "sign in to use X" prompt BEFORE
// the request is fired.
//
// Usage at a generate handler entry:
//   if (!(await window.FeatureGate.ensure('loyalty'))) return;
(function () {
  var _p = null; // cached { authenticated, role, features } promise — one probe per page

  function features() {
    if (!_p) {
      _p = fetch('/api/features', { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    }
    return _p;
  }

  var LABELS = {
    en: { loyalty: 'Loyalty Program', reports: 'Reports', calendar: 'Retention Calendar' },
    ru: { loyalty: 'Программа лояльности', reports: 'Отчёты', calendar: 'Retention Calendar' },
  };
  var TXT = {
    en: {
      title: 'Sign in required',
      body: function (f) { return 'The ' + f + ' tool needs an account. Sign in or create one to continue.'; },
      signin: 'Sign in', register: 'Create account', close: 'Close',
    },
    ru: {
      title: 'Требуется вход',
      body: function (f) { return 'Инструмент «' + f + '» доступен только с аккаунтом. Войдите или зарегистрируйтесь.'; },
      signin: 'Войти', register: 'Регистрация', close: 'Закрыть',
    },
  };
  function lang() { try { return localStorage.getItem('bonusLang') === 'ru' ? 'ru' : 'en'; } catch (e) { return 'en'; } }

  function showOverlay(feature) {
    if (document.getElementById('feature-gate-modal')) return;
    var L = lang();
    var t = TXT[L];
    var fname = (LABELS[L] && LABELS[L][feature]) || feature;
    var modal = document.createElement('div');
    modal.id = 'feature-gate-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(8,11,18,.72);backdrop-filter:blur(5px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML =
      '<div style="background:#161c2d;border:1px solid rgba(79,110,247,.3);border-radius:16px;padding:26px;max-width:420px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.6);font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif">' +
        '<div style="font-size:1.15rem;font-weight:700;color:#e8eaf0;margin-bottom:8px">🔒 ' + t.title + '</div>' +
        '<div style="font-size:.85rem;color:#9aa0ac;line-height:1.55;margin-bottom:20px">' + t.body(fname) + '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
          '<a href="/login.html" style="flex:1;text-align:center;background:linear-gradient(135deg,#4f6ef7,#7c3aed);color:#fff;text-decoration:none;padding:10px 16px;border-radius:9px;font-size:.85rem;font-weight:700">' + t.signin + '</a>' +
          '<a href="/register.html" style="flex:1;text-align:center;background:#1d222c;border:1px solid #2b313d;color:#e6e8ee;text-decoration:none;padding:10px 16px;border-radius:9px;font-size:.85rem;font-weight:600">' + t.register + '</a>' +
        '</div>' +
        '<button type="button" id="feature-gate-close" style="margin-top:14px;width:100%;background:none;border:none;color:#8a90a0;font-size:.78rem;cursor:pointer;font-family:inherit">' + t.close + '</button>' +
      '</div>';
    document.body.appendChild(modal);
    var close = function () { modal.remove(); };
    modal.querySelector('#feature-gate-close').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  }

  // Resolve to true if the caller may use the feature. On a probe failure we
  // return true (let the request proceed — the backend still enforces) rather
  // than block a legitimate user behind a transient error.
  function allowed(feature) {
    return features().then(function (data) {
      if (!data || !data.features) return true;
      return data.features[feature] !== false;
    });
  }

  // Gate an action: true if allowed; otherwise shows the sign-in prompt and false.
  function ensure(feature) {
    return allowed(feature).then(function (ok) {
      if (!ok) showOverlay(feature);
      return ok;
    });
  }

  window.FeatureGate = { features: features, allowed: allowed, ensure: ensure, showOverlay: showOverlay };
})();
