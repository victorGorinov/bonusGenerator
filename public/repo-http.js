/**
 * RetomatRepo — thin client for the Phase 2 server-side persistence API
 * (/api/saved/:entity). Loaded as a classic script; exposes window.RetomatRepo.
 *
 * Model: the browser keeps its existing localStorage collections as the working
 * cache (all the generators read them synchronously). For a logged-in user we
 * additionally MIRROR every write to Postgres, keyed by the record's own client
 * id, and HYDRATE localStorage from the server on page load. Guests are a no-op
 * everywhere here and keep working exactly as before (localStorage only).
 *
 * Same-origin fetch already sends the httpOnly `_bt` cookie by default; we set
 * credentials:'include' explicitly for clarity.
 *
 * Entities (must match src/use-cases/SavedItems.ts ENTITIES):
 *   configs | campaigns | tournaments | loyalty-programs |
 *   calendar-events | calendar-templates
 */
(function () {
  const API = '/api/saved';
  let _meP = null;

  /**
   * @returns {Promise<{id,name,email}|null>} cached — ONE /api/auth/me probe per
   * page load, shared by isAuthed() and the header user chip (no double request).
   */
  function me() {
    if (!_meP) {
      _meP = fetch('/api/auth/me', { credentials: 'include' })
        .then((r) => (r.ok ? r.json().then((j) => j.user || null) : null))
        .catch(() => null);
    }
    return _meP;
  }

  /** @returns {Promise<boolean>} derived from the same cached probe as me(). */
  function isAuthed() {
    return me().then((u) => !!u);
  }

  /** GET server list → array of { id, data, createdAt, updatedAt }. Throws on !ok. */
  async function pull(entity) {
    const r = await fetch(`${API}/${entity}`, { credentials: 'include' });
    if (!r.ok) throw new Error(`pull ${entity} failed: ${r.status}`);
    const j = await r.json();
    return j.items || [];
  }

  /** Upsert one record for a logged-in user; no-op + swallow for guests/errors. */
  async function mirror(entity, id, data) {
    try {
      if (!(await isAuthed())) return;
      await fetch(`${API}/${entity}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(id), data }),
      });
    } catch (_e) { /* offline / server error — localStorage still has it */ }
  }

  /** Delete one record for a logged-in user; no-op + swallow for guests/errors. */
  async function unmirror(entity, id) {
    try {
      if (!(await isAuthed())) return;
      await fetch(`${API}/${entity}/${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (_e) { /* ignore */ }
  }

  /**
   * If logged in, replace a localStorage collection with the server's copy.
   * Records are stored whole in `data`, so we just unwrap them. Returns true if
   * hydration happened (caller should re-render), false for guests/errors.
   */
  async function hydrate(entity, lsKey) {
    try {
      if (!(await isAuthed())) return false;
      const items = await pull(entity);
      localStorage.setItem(lsKey, JSON.stringify(items.map((it) => it.data)));
      return true;
    } catch (_e) { return false; }
  }

  window.RetomatRepo = { API, me, isAuthed, pull, mirror, unmirror, hydrate };
})();
