/* Retomat — Google Analytics 4 (beta).
 *
 * Self-hosted loader so we don't need an inline gtag snippet (keeps CSP strict —
 * scriptSrc stays 'self' + googletagmanager.com, no 'unsafe-inline').
 *
 * What it does:
 *   1. Loads gtag.js and initialises GA4 (page_view is automatic per page load).
 *   2. Wraps window.fetch to auto-emit funnel events for every JS fork
 *      (tool_generate / ai_action / auth / save_item) — no per-file edits.
 *   3. Exposes window.track(name, params) for explicit events (add_to_calendar…).
 *   4. Exposes window.trackPage(path, title) for SPA virtual page views.
 *
 * Tracking is enabled ONLY on the production host — localhost/staging/preview
 * are no-ops so beta stats stay clean. window.track / window.trackPage are always
 * defined (no-op when disabled) so call sites never throw.
 */
(function () {
  'use strict';

  var GA_ID = 'G-7B0GXV2F64';

  // Production hosts only. Add a custom domain here if/when one is attached.
  var ENABLED_HOSTS = ['bonus-generator.vercel.app'];
  var ENABLED = ENABLED_HOSTS.indexOf(location.hostname) !== -1;

  // dataLayer + gtag shim are always present so queued calls are safe.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Sends the single landing page_view. We drive page_views manually
  // (send_page_view:false below) so SPA sub-views and this initial one don't
  // double-count, and so a lockdown bounce can suppress it (see whenVisible).
  function sendInitialPageView() {
    try {
      gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
        page_location: location.href,
      });
    } catch (e) { /* noop */ }
  }

  // Coordinate with auth-guard.js: during the closed beta it hides the page with
  // a <style id="auth-guard-hide"> until it decides to keep the guest here or
  // window.location.replace() them to /login.html. We defer the landing page_view
  // until that overlay is removed — so a page the guest is bounced from (and never
  // sees) isn't counted. If auth-guard isn't present, fire immediately. A fallback
  // timeout guarantees a legit (authenticated) user's view is never lost even if
  // the overlay lingers.
  function whenVisible(cb) {
    if (!document.getElementById('auth-guard-hide')) { cb(); return; }
    var done = false;
    function finish() { if (done) return; done = true; cb(); }
    try {
      var obs = new MutationObserver(function () {
        if (!document.getElementById('auth-guard-hide')) { obs.disconnect(); finish(); }
      });
      obs.observe(document.head || document.documentElement, { childList: true });
      setTimeout(function () { try { obs.disconnect(); } catch (e) {} finish(); }, 4000);
    } catch (e) { finish(); }
  }

  if (ENABLED) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    gtag('js', new Date());
    // send_page_view:false → we emit every page_view ourselves (initial + SPA),
    // so nothing is double-counted and the initial one can be gated on auth-guard.
    gtag('config', GA_ID, { send_page_view: false });
    whenVisible(sendInitialPageView);
  }

  /* ---- public helpers ------------------------------------------------- */

  window.track = function (name, params) {
    if (!ENABLED) return;
    try { gtag('event', name, params || {}); } catch (e) { /* never break the app */ }
  };

  // SPA virtual page view. Two guards keep the count honest:
  //   1. dedupe — SPA showView()/switch fns are also called on re-renders
  //      (e.g. a RU/EN language toggle re-shows the same view); skip if the path
  //      is unchanged from the last tracked one.
  //   2. initial-render gate — the first showView() runs synchronously at page
  //      load (before readyState 'complete'); that landing is already counted by
  //      sendInitialPageView(), so suppress it and only track genuine post-load
  //      navigations.
  var _lastView = null;
  window.trackPage = function (path, title) {
    if (!ENABLED) return;
    if (path === _lastView) return;
    _lastView = path;
    if (document.readyState !== 'complete') return;
    try {
      gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
        page_location: location.origin + path,
      });
    } catch (e) { /* noop */ }
  };

  /* ---- fetch auto-instrumentation ------------------------------------- */
  // Maps an API path to a funnel event. Returns {name, params} or null.
  function eventForApi(path) {
    // tool_generate
    if (path === '/api/generate')            return { name: 'tool_generate', params: { tool: 'bonus' } };
    if (path === '/api/campaign/generate')   return { name: 'tool_generate', params: { tool: 'campaign' } };
    if (path === '/api/tournament/generate') return { name: 'tool_generate', params: { tool: 'tournament' } };
    if (path === '/api/loyalty/generate')    return { name: 'tool_generate', params: { tool: 'loyalty' } };
    if (path === '/api/wheel/generate')      return { name: 'tool_generate', params: { tool: 'wheel' } };

    // auth
    if (path === '/api/auth/register') return { name: 'auth', params: { action: 'register' } };
    if (path === '/api/auth/login')    return { name: 'auth', params: { action: 'login' } };

    // ai_action — /api/<tool>/<action>
    var m = path.match(/^\/api\/(campaign|tournament|loyalty|wheel)\/(texts|audit|optimize|description|missions|games)$/);
    if (m) return { name: 'ai_action', params: { tool: m[1], action: m[2] } };
    if (path === '/api/games/recommend')          return { name: 'ai_action', params: { tool: 'games', action: 'recommend' } };
    if (path === '/api/campaign/analysis')         return { name: 'ai_action', params: { tool: 'reports', action: 'analysis' } };
    if (path === '/api/campaign/analysis/explain') return { name: 'ai_action', params: { tool: 'reports', action: 'explain' } };

    // save_item — POST /api/saved/<entity> (logged-in mirror). Skip calendar-events:
    // those are counted as add_to_calendar via an explicit track() to avoid double-signal.
    var sv = path.match(/^\/api\/saved\/([a-z-]+)$/);
    if (sv && sv[1] !== 'calendar-events') return { name: 'save_item', params: { entity: sv[1] } };

    return null;
  }

  var origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var method = ((init && init.method) || (typeof input === 'object' && input && input.method) || 'GET').toUpperCase();
      var promise = origFetch.apply(this, arguments);
      if (ENABLED && method === 'POST') {
        try {
          var path = url.indexOf('http') === 0 ? new URL(url).pathname : url.split('?')[0];
          var ev = eventForApi(path);
          if (ev) {
            promise.then(function (res) {
              if (res && res.ok) window.track(ev.name, ev.params);
            }).catch(function () { /* network error — not a completed action */ });
          }
        } catch (e) { /* never interfere with the request */ }
      }
      return promise;
    };
  }
})();
