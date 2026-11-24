/**
 * BrandContext — the shared brand layer for every input form.
 *
 * A brand stores the inputs that never change for an operator (geo, currency
 * mode, segment, platform, player base, avg deposit, ARPU, RTP, providers).
 * Picking one in any tool seeds those fields as DEFAULTS; every field stays
 * editable, and manual edits are never silently overwritten (see apply()).
 *
 * Storage model — mirrors RetomatRepo (repo-http.js):
 *   • localStorage `rtm_brands` is the working cache, read synchronously by the
 *     tools during their (innerHTML-based) renders.
 *   • Logged-in: the server (/api/brands) is the source of truth — hydrate on
 *     load, mirror every write, quota enforced server-side by plan.
 *   • Guest: localStorage only, capped at ONE brand so the prefill is demoable
 *     before signup; it migrates to the account on first authenticated load.
 *
 * Events (both bubble on window):
 *   retomat:brand-changed  — the ACTIVE brand changed (pick/clear) → re-prefill
 *   retomat:brands-changed — the LIST changed (create/edit/delete) → re-render pickers
 *
 * Loaded as a classic script (no module) before the tool scripts, like geo-data.js.
 */
(function () {
  var API        = '/api/brands';
  var LS_LIST    = 'rtm_brands';
  var LS_ACTIVE  = 'rtm_brand_active';
  var LS_MIGRATED = 'rtm_brands_migrated_v1';
  var GUEST_MAX  = 1;

  var state = {
    brands: [],
    limit:  GUEST_MAX,   // -1 === unlimited
    authed: false,
    loaded: false,
  };

  // Last set of values applied to each scope ('bonus', 'tournament', …). Used to
  // tell "the user edited this field" from "it still holds the brand's value".
  var applied = {};

  // ── storage helpers ────────────────────────────────────────────────────────
  function readLS() {
    try { var v = JSON.parse(localStorage.getItem(LS_LIST) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function writeLS(list) {
    try { localStorage.setItem(LS_LIST, JSON.stringify(list)); } catch (e) { /* quota */ }
  }
  function readActiveId() {
    try { return localStorage.getItem(LS_ACTIVE) || ''; } catch (e) { return ''; }
  }
  function writeActiveId(id) {
    try { id ? localStorage.setItem(LS_ACTIVE, id) : localStorage.removeItem(LS_ACTIVE); } catch (e) { /* ignore */ }
  }
  function emit(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) { /* ignore */ }
  }

  function isAuthed() {
    return window.RetomatRepo ? window.RetomatRepo.isAuthed() : Promise.resolve(false);
  }

  // ── public reads (synchronous — served from the cache) ─────────────────────
  function list()   { return state.brands.slice(); }
  function limit()  { return state.limit; }
  function used()   { return state.brands.length; }
  function canAdd() { return state.limit < 0 || state.brands.length < state.limit; }
  function isLocal() { return !state.authed; }

  function activeId() {
    var id = readActiveId();
    if (id && state.brands.some(function (b) { return b.id === id; })) return id;
    var def = state.brands.filter(function (b) { return b.isDefault; })[0] || state.brands[0];
    return def ? def.id : '';
  }
  function active() {
    var id = activeId();
    return state.brands.filter(function (b) { return b.id === id; })[0] || null;
  }
  /** The active brand's parameter map, or {} when nothing is selected. */
  function data() {
    var b = active();
    return (b && b.data) || {};
  }

  function setActive(id) {
    var cur = activeId();
    if (id === cur) return;
    writeActiveId(id);
    emit('retomat:brand-changed', { brand: active() });
  }

  // ── load / hydrate ─────────────────────────────────────────────────────────
  var _loadP = null;
  function load() {
    if (_loadP) return _loadP;
    state.brands = readLS();                       // synchronous first paint
    _loadP = isAuthed().then(function (authed) {
      state.authed = authed;
      if (!authed) { state.limit = GUEST_MAX; state.loaded = true; return state; }
      return migrateGuestBrands()
        .then(pull)
        .then(function () { state.loaded = true; return state; })
        .catch(function () { state.loaded = true; return state; });
    });
    return _loadP;
  }

  function pull() {
    return fetch(API, { credentials: 'include' })
      .then(function (r) { if (!r.ok) throw new Error('brands ' + r.status); return r.json(); })
      .then(function (j) {
        state.brands = j.brands || [];
        state.limit  = typeof j.limit === 'number' ? j.limit : GUEST_MAX;
        writeLS(state.brands);
        emit('retomat:brands-changed', { brands: list() });
        return state;
      });
  }

  /**
   * One-time push of a guest's browser-local brand into the account, the same
   * pattern nav-utils uses for saved items. Runs BEFORE the pull so the server
   * copy (post-migration) is what lands in the cache. A failed migration leaves
   * the flag unset so the next load retries; a duplicate name is treated as
   * already-migrated (the account already has that brand).
   */
  function migrateGuestBrands() {
    var done;
    try { done = localStorage.getItem(LS_MIGRATED) === '1'; } catch (e) { done = false; }
    if (done) return Promise.resolve();
    var local = readLS().filter(function (b) { return b && b.local; });
    if (!local.length) {
      try { localStorage.setItem(LS_MIGRATED, '1'); } catch (e) { /* ignore */ }
      return Promise.resolve();
    }
    return local.reduce(function (chain, b) {
      return chain.then(function () {
        return fetch(API, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: b.name, data: b.data || {} }),
        });
        // A 403 (quota) or 409 (name taken) is a normal outcome here, not a
        // failure to retry: the account simply can't/needn't take this brand.
      });
    }, Promise.resolve()).then(function () {
      try { localStorage.setItem(LS_MIGRATED, '1'); } catch (e) { /* ignore */ }
    });
  }

  // ── writes ─────────────────────────────────────────────────────────────────
  /**
   * Create or update a brand.
   * @param {{id?:string,name:string,data:object,isDefault?:boolean}} brand
   * @returns {Promise<{ok:boolean, brand?:object, error?:string}>} — never rejects,
   *   so callers can show a message (quota/duplicate) instead of a console trace.
   */
  function save(brand) {
    if (!state.authed) return Promise.resolve(saveLocal(brand));
    var isNew = !brand.id;
    var url   = isNew ? API : API + '/' + encodeURIComponent(brand.id);
    var body  = isNew
      ? { name: brand.name, data: brand.data || {}, isDefault: !!brand.isDefault }
      : { name: brand.name, data: brand.data || {} };
    if (!isNew && brand.isDefault) body.isDefault = true;
    return fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) return { ok: false, error: j.code || 'ERROR', message: j.message || '' };
        return pull().then(function () {
          if (isNew && j.brand) setActive(j.brand.id);
          else emit('retomat:brand-changed', { brand: active() });
          return { ok: true, brand: j.brand };
        });
      });
    }).catch(function () { return { ok: false, error: 'NETWORK' }; });
  }

  // Guest path: a single browser-local brand, flagged `local` so the migration
  // knows what to push once the user registers.
  function saveLocal(brand) {
    var list_ = readLS();
    var id = brand.id || ('local-' + Date.now());
    var idx = list_.map(function (b) { return b.id; }).indexOf(id);
    var rec = { id: id, name: brand.name, data: brand.data || {}, isDefault: true, local: true };
    if (idx >= 0) list_[idx] = rec;
    else {
      if (list_.length >= GUEST_MAX) return { ok: false, error: 'BRAND_LIMIT_REACHED' };
      list_.push(rec);
    }
    state.brands = list_;
    writeLS(list_);
    writeActiveId(id);
    emit('retomat:brands-changed', { brands: list() });
    emit('retomat:brand-changed', { brand: active() });
    return { ok: true, brand: rec };
  }

  function remove(id) {
    if (!state.authed) {
      state.brands = readLS().filter(function (b) { return b.id !== id; });
      writeLS(state.brands);
      if (readActiveId() === id) writeActiveId('');
      emit('retomat:brands-changed', { brands: list() });
      emit('retomat:brand-changed', { brand: active() });
      return Promise.resolve({ ok: true });
    }
    return fetch(API + '/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'include' })
      .then(function (r) {
        if (!r.ok) return { ok: false, error: 'ERROR' };
        if (readActiveId() === id) writeActiveId('');
        return pull().then(function () {
          emit('retomat:brand-changed', { brand: active() });
          return { ok: true };
        });
      })
      .catch(function () { return { ok: false, error: 'NETWORK' }; });
  }

  // ── prefill ────────────────────────────────────────────────────────────────
  /**
   * Seed `target` from the active brand.
   *
   * @param {string} scope  tool key ('bonus'|'tournament'|'loyalty'|'wheel'|…) —
   *   each keeps its own record of what was last applied.
   * @param {object} target the tool's state object (mutated in place)
   * @param {object} map    { targetKey: brandDataKey } — a value may also be a
   *   function(brandData) for fields the tool derives rather than copies (e.g.
   *   loyalty's `region`, which comes from the brand's country)
   * @param {{force?:boolean, confirm?:boolean}} [opts]
   *   force   — apply over manual edits (used when the user explicitly re-picks
   *             a brand and confirms)
   *   confirm — ask before overwriting fields the user changed by hand
   * @returns {{applied:string[], skipped:string[], cancelled:boolean}}
   *
   * A field is "manually edited" when its current value differs from what this
   * scope last applied. Untouched fields are always refreshed; touched ones are
   * kept unless force/confirm says otherwise. This is the same discipline the
   * Configurator uses for B.ov (user input always wins over a recomputation).
   */
  function apply(scope, target, map, opts) {
    opts = opts || {};
    var src = data();
    var prev = applied[scope] || {};
    var out = { applied: [], skipped: [], cancelled: false };
    if (!target || !map) return out;

    var valueOf = function (k) {
      var m = map[k];
      return typeof m === 'function' ? m(src) : src[m];
    };

    var touched = [];
    Object.keys(map).forEach(function (k) {
      var bv = valueOf(k);
      if (bv === undefined || bv === null || bv === '') return;
      var isTouched = prev[k] !== undefined && !same(target[k], prev[k]);
      if (isTouched && !opts.force) touched.push(k);
    });

    if (touched.length && opts.confirm) {
      var msg = (window.BrandContext.i18n && window.BrandContext.i18n.confirmOverwrite)
        || 'Some fields were edited manually. Overwrite them with the brand values?';
      // eslint-disable-next-line no-alert
      if (window.confirm(msg + ' (' + touched.length + ')')) opts.force = true;
    }

    Object.keys(map).forEach(function (k) {
      var v = valueOf(k);
      if (v === undefined || v === null || v === '') return;
      var isTouched = prev[k] !== undefined && !same(target[k], prev[k]);
      if (isTouched && !opts.force) { out.skipped.push(k); return; }
      target[k] = Array.isArray(v) ? v.slice() : v;
      out.applied.push(k);
    });

    // Remember what we just put in, so the NEXT apply can tell edits apart.
    var snap = {};
    Object.keys(map).forEach(function (k) { snap[k] = target[k]; });
    applied[scope] = snap;
    return out;
  }

  function same(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every(function (x, i) { return x === b[i]; });
    return a === b;
  }

  /** True when `scope`'s fields have drifted from the brand values last applied. */
  function isDirty(scope, target, map) {
    var prev = applied[scope];
    if (!prev || !target) return false;
    return Object.keys(map || prev).some(function (k) { return prev[k] !== undefined && !same(target[k], prev[k]); });
  }

  /** Forget a scope's snapshot (e.g. the tool reset its own state). */
  function resetScope(scope) { delete applied[scope]; }

  // ── stamping saved records ─────────────────────────────────────────────────
  // Every saved artefact (campaign, tournament, loyalty program, wheel, config,
  // calendar event) carries the brand it was created under. `brandName` is a
  // SNAPSHOT, not a join: a list row must stay readable after the brand is
  // renamed or deleted, and these records outlive brands.

  /**
   * Tag a record with the active brand. Call at CREATION only — re-stamping on
   * every update would retro-assign whatever brand happens to be active now to
   * an old record. An existing brandId is therefore never overwritten, and a
   * record created with no brand selected stays deliberately unbranded.
   * @returns the same object (mutated), so it composes into existing save code.
   */
  function stamp(record) {
    if (!record || typeof record !== 'object') return record;
    if (record.brandId) return record;
    var b = active();
    if (!b) return record;
    record.brandId = b.id;
    record.brandName = b.name;
    return record;
  }

  /** The label to show on a saved record's row ('' when unbranded). */
  function tagOf(record) {
    if (!record || !record.brandId) return '';
    var b = state.brands.filter(function (x) { return x.id === record.brandId; })[0];
    return b ? b.name : (record.brandName || '');
  }

  // ── library filter ─────────────────────────────────────────────────────────
  // Shared by every library view, so switching the filter on one page carries to
  // the others. Default is ALL: records saved before brands existed have no
  // brandId, and a brand-scoped default would make them look deleted.
  var LS_FILTER = 'rtm_brand_filter';   // '' = all · '<id>' = that brand · '-' = unbranded
  var FILTER_NONE = '-';

  function filterValue() {
    try { return localStorage.getItem(LS_FILTER) || ''; } catch (e) { return ''; }
  }
  function setFilter(v) {
    try { v ? localStorage.setItem(LS_FILTER, v) : localStorage.removeItem(LS_FILTER); } catch (e) { /* ignore */ }
    emit('retomat:brand-filter-changed', { filter: v });
  }

  /** Does one record pass the current (or given) filter? */
  function matches(record, filter) {
    var f = filter === undefined ? filterValue() : filter;
    if (!f) return true;
    if (f === FILTER_NONE) return !record || !record.brandId;
    return !!record && record.brandId === f;
  }

  /** Filter a list of saved records. Non-arrays pass through untouched. */
  function filterList(listIn, filter) {
    if (!Array.isArray(listIn)) return listIn;
    var f = filter === undefined ? filterValue() : filter;
    if (!f) return listIn;
    return listIn.filter(function (r) { return matches(r, f); });
  }

  /**
   * Chip row for a library toolbar. Inline onclick (CSP allows scriptSrcAttr) so
   * it survives the innerHTML re-renders the tools do. Renders nothing when
   * there is no brand at all — a lone "All brands" chip is noise.
   * `counts` (optional) — the unfiltered list, to show per-brand counts.
   */
  function filterBarHTML(counts) {
    if (!state.brands.length) return '';
    var t = LBL[lang()];
    var cur = filterValue();
    var n = function (f) {
      if (!Array.isArray(counts)) return '';
      var c = counts.filter(function (r) { return matches(r, f); }).length;
      return ' <span style="opacity:.6">' + c + '</span>';
    };
    var chip = function (val, label) {
      var on = cur === val;
      return '<button type="button" onclick="BrandContext.setFilter(\'' + esc(val) + '\')" ' +
        'style="padding:4px 11px;border-radius:100px;font-size:.74rem;font-weight:600;cursor:pointer;font-family:inherit;' +
        'border:1px solid ' + (on ? 'rgba(79,110,247,.6)' : 'var(--border,#1e2740)') + ';' +
        'background:' + (on ? 'rgba(79,110,247,.2)' : 'transparent') + ';' +
        'color:' + (on ? '#a0b0ff' : 'var(--muted,#8892a4)') + '">' + esc(label) + n(val) + '</button>';
    };
    var chips = [chip('', t.all)];
    state.brands.forEach(function (b) { chips.push(chip(b.id, b.name)); });
    // The unbranded bucket only matters while such records exist.
    if (!Array.isArray(counts) || counts.some(function (r) { return r && !r.brandId; })) {
      chips.push(chip(FILTER_NONE, t.unbranded));
    }
    return '<div class="brand-filter" title="' + esc(t.filterHint) + '" ' +
      'style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:12px">' +
      '<span style="font-size:.7rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted,#8892a4);margin-right:2px">' +
      esc(t.pick) + '</span>' + chips.join('') + '</div>';
  }

  /** Small inline badge for a record row; '' when the record has no brand. */
  function tagHTML(record) {
    var name = tagOf(record);
    if (!name) return '';
    return '<span class="brand-tag" style="font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:100px;' +
      'background:rgba(79,110,247,.15);color:#a0b0ff;white-space:nowrap">' + esc(name) + '</span>';
  }

  // ── selector UI ────────────────────────────────────────────────────────────
  var LBL = {
    en: {
      pick: 'Brand', none: '— no brand —', manage: 'Manage brands…',
      hint: 'Fills the form with this brand\'s defaults — every field stays editable',
      all: 'All brands', unbranded: 'No brand',
      filterHint: 'Show only records saved under this brand',
    },
    ru: {
      pick: 'Бренд', none: '— без бренда —', manage: 'Управление брендами…',
      hint: 'Подставит значения бренда по умолчанию — все поля остаются редактируемыми',
      all: 'Все бренды', unbranded: 'Без бренда',
      filterHint: 'Показывать только записи, сохранённые под этим брендом',
    },
  };
  function lang() {
    try { return (localStorage.getItem('bonusLang') === 'ru') ? 'ru' : 'en'; } catch (e) { return 'en'; }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /**
   * A <select> of the workspace's brands, for embedding in any form's markup.
   * Uses an inline onchange (CSP allows scriptSrcAttr) so it survives the
   * innerHTML re-renders the tools do — no listener re-binding needed.
   * Renders nothing when there are no brands and the user can't add one.
   */
  function selectorHTML(opts) {
    opts = opts || {};
    var t = LBL[lang()];
    if (!state.brands.length && !opts.alwaysShow) {
      return '<a href="/profile.html" class="brand-pick-empty" style="font-size:.72rem;color:var(--accent,#a0b0ff);text-decoration:none">+ ' + esc(t.pick) + '</a>';
    }
    var cur = activeId();
    var opt = ['<option value="">' + esc(t.none) + '</option>'];
    state.brands.forEach(function (b) {
      opt.push('<option value="' + esc(b.id) + '"' + (b.id === cur ? ' selected' : '') + '>' + esc(b.name) + '</option>');
    });
    return '' +
      '<span class="brand-pick" title="' + esc(t.hint) + '" style="display:inline-flex;align-items:center;gap:6px">' +
        '<span style="font-size:.7rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted,#8892a4)">' + esc(t.pick) + '</span>' +
        '<select onchange="BrandContext.pick(this.value)" style="background:var(--bg2,#0f1626);color:var(--text,#e8eaf0);border:1px solid var(--border,#1e2740);border-radius:8px;padding:4px 8px;font-size:.76rem;font-family:inherit">' +
          opt.join('') +
        '</select>' +
        '<a href="/profile.html" title="' + esc(t.manage) + '" style="color:var(--muted,#8892a4);text-decoration:none;font-size:.8rem">⚙</a>' +
      '</span>';
  }

  // Inline-attribute entry point for selectorHTML's <select>.
  function pick(id) { setActive(id); }

  window.BrandContext = {
    load: load, pull: pull,
    list: list, active: active, activeId: activeId, data: data, setActive: setActive, pick: pick,
    save: save, remove: remove,
    limit: limit, used: used, canAdd: canAdd, isLocal: isLocal,
    apply: apply, isDirty: isDirty, resetScope: resetScope,
    stamp: stamp, tagOf: tagOf, tagHTML: tagHTML,
    filterValue: filterValue, setFilter: setFilter, matches: matches,
    filterList: filterList, filterBarHTML: filterBarHTML, FILTER_NONE: FILTER_NONE,
    selectorHTML: selectorHTML,
    i18n: LBL[lang()],
  };

  // Kick the load immediately; pages await it via BrandContext.load().
  load();
})();
