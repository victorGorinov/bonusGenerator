// Beta lockdown page guard.
//
// Loaded FIRST in <head> of every app/tool page (classic script, not a module,
// so it runs during parse before the page's own scripts). When the closed beta
// is active (BETA_LOCKDOWN=true on the server), an anonymous visitor who lands
// on a tool page directly by URL is redirected to /login.html?from=<here>. When
// the flag is off it's a near no-op — guests keep full access.
//
// The API is gated independently (requireAuth on the tool routes), so this guard
// is only the UX layer that keeps guests from staring at a page whose every
// request 401s. It is NOT the security boundary.
(function () {
  // Fast path: BETA_LOCKDOWN is a per-DEPLOYMENT constant, so once a tab has seen
  // it OFF, every later tool page in that tab can render instantly — no hide, no
  // /api/features round-trip. We only ever cache the OFF verdict (never auth
  // state, and never the ON verdict), so a guest can't cache their way past the
  // gate: under lockdown this branch is never taken and the probe always runs.
  try {
    if (sessionStorage.getItem('ag_unlocked') === '1') return;
  } catch (e) { /* sessionStorage unavailable — fall through to the full check */ }

  var doc = document.documentElement;

  // Hide the page until the auth check resolves, so a guest never sees a flash of
  // the tool before being bounced. Revealed again on any outcome that keeps them
  // here (flag off, authenticated, the check failing, or the safety timeout).
  var HIDE_ID = 'auth-guard-hide';
  var style = document.createElement('style');
  style.id = HIDE_ID;
  style.textContent = 'html{visibility:hidden!important}';
  (document.head || doc).appendChild(style);

  var done = false, timer, ctrl;

  function settle() {
    done = true;
    clearTimeout(timer);
    if (ctrl) { try { ctrl.abort(); } catch (e) { /* older browsers */ } }
  }

  function reveal() {
    if (done) return;
    settle();
    var el = document.getElementById(HIDE_ID);
    if (el) el.parentNode.removeChild(el);
  }

  function bounce() {
    if (done) return;
    settle();
    var here = window.location.pathname + window.location.search + window.location.hash;
    window.location.replace('/login.html?from=' + encodeURIComponent(here));
  }

  // Fail-open safety net: never leave the page hidden if the probe hangs (stalled
  // socket, slow cold start, a network that neither responds nor errors). Without
  // this a hung fetch would keep visibility:hidden forever → permanently blank page.
  timer = setTimeout(reveal, 4000);

  ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;

  fetch('/api/features', { credentials: 'include', signal: ctrl ? ctrl.signal : undefined })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      // Fail open: if the probe fails or the shape is unexpected, show the page.
      // The API's own requireAuth still protects the actual data on lockdown.
      if (data && data.betaLockdown && !data.authenticated) {
        bounce();
        return; // keep hidden — navigating away
      }
      // Remember an OFF flag for the rest of this tab session so subsequent tool
      // pages skip the hide+probe entirely. Only cached when lockdown is off.
      if (data && !data.betaLockdown) {
        try { sessionStorage.setItem('ag_unlocked', '1'); } catch (e) { /* ignore */ }
      }
      reveal();
    })
    .catch(function () { reveal(); });
})();
