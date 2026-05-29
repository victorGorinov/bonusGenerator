# TOURNAMENT_SAVE_FEATURE.md

Tournament save / list / detail feature spec. Updated: 2026-05-29.

---

## Overview

Operators can save generated tournaments to localStorage, browse a library of saved tournaments, view full details of any saved tournament, and navigate directly to its Setup Guide. The feature lives entirely in `public/tournament-generator.html` — no backend changes required.

---

## Data model

localStorage key: `savedTournaments` (JSON array, same pattern as `savedCampaigns`).

```typescript
interface SavedTournament {
  id:        string;          // crypto.randomUUID() or Date.now().toString()
  name:      string;          // auto-generated: "{type} · {geo}/{lic}" e.g. "Slots · EU/MGA"
  type:      string;          // draft.type: 'slot' | 'live' | 'mixed' | 'prize_drop'
  params:    object;          // draft.params snapshot at save time
  spec:      object;          // lastResult.spec
  econ:      object;          // lastResult.econ
  cur:       string;          // lastResult.cur
  lic:       string;          // lastResult.lic
  region:    string;          // lastResult.region
  createdAt: string;          // ISO timestamp
}
```

Helper functions (add near top of `<script>`):

```javascript
function loadTournaments() {
  try { return JSON.parse(localStorage.getItem('savedTournaments') || '[]'); } catch { return []; }
}
function saveTournaments(list) {
  localStorage.setItem('savedTournaments', JSON.stringify(list));
}
function genId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function autoName(type, params) {
  const typeLabel = { slot:'Slots', live:'Live Casino', mixed:'Mixed', prize_drop:'Prize Drop' };
  const geo = (params.geo || '').toUpperCase();
  const lic = (params.lic || 'none').toUpperCase();
  return `${typeLabel[type] || type} · ${geo}/${lic}`;
}
```

---

## Views

The existing `renderStep()` / `goStep()` pattern is extended with two new views:
`'list'` and `'detail'`. A module-level variable tracks the selected detail record:

```javascript
let detailId = null;   // id of tournament currently shown in detail view
```

`showView(view, id?)` — new top-level dispatcher (replaces direct `goStep` calls from the sidebar):

```javascript
function showView(view, id) {
  const c = document.getElementById('content');
  const tb = document.getElementById('topbar-step');
  if (view === 'list') {
    tb.textContent = 'Tournaments';
    setSidebarActive('nav-tournament');
    c.innerHTML = renderList();
  } else if (view === 'detail') {
    detailId = id;
    const t = loadTournaments().find(t => t.id === id);
    tb.textContent = t ? t.name : 'Tournament';
    setSidebarActive('nav-tournament');
    c.innerHTML = renderDetail(id);
  } else if (view === 'setup') {
    tb.textContent = 'Setup Guide';
    setSidebarActive('nav-setup-guide');
    c.innerHTML = renderSetupGuide();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

Sidebar "🏆 Tournaments" link changes from `href` to `onclick="showView('list')"`.  
Sidebar "📋 Setup Guide" button keeps `onclick="showSetupGuide()"` (which internally calls `showView('setup')`).

---

## Save button (Step 3)

Add to `renderStep3()` return string — replace the existing "Setup Guide ready" callout:

```html
<div style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);
            border-radius:10px;padding:14px 16px;margin-bottom:16px;
            display:flex;align-items:center;gap:14px">
  <span style="font-size:1.4rem;flex-shrink:0">📋</span>
  <div style="flex:1;min-width:0">
    <div style="font-size:.85rem;font-weight:600;color:#c4b5fd;margin-bottom:2px">Setup Guide ready</div>
    <div style="font-size:.77rem;color:var(--muted)">Save this tournament to access it later from your library</div>
  </div>
  <div style="display:flex;gap:8px;flex-shrink:0">
    <button id="btn-save-tournament" class="btn btn-outline btn-sm"
            style="border-color:rgba(79,110,247,.4);color:#a0b0ff"
            onclick="saveTournament()">
      💾 Save
    </button>
    <button class="btn btn-outline btn-sm"
            style="border-color:rgba(124,58,237,.4);color:#c4b5fd"
            onclick="showSetupGuide()">
      View Guide →
    </button>
  </div>
</div>
```

`saveTournament()` function:

```javascript
function saveTournament() {
  if (!lastResult) return;
  const list = loadTournaments();
  const existing = list.find(t =>
    t.type === draft.type &&
    JSON.stringify(t.params) === JSON.stringify(draft.params)
  );
  if (existing) {
    showToast('Already saved');
    return;
  }
  const entry = {
    id:        genId(),
    name:      autoName(draft.type, draft.params),
    type:      draft.type,
    params:    { ...draft.params },
    spec:      lastResult.spec,
    econ:      lastResult.econ,
    cur:       lastResult.cur,
    lic:       lastResult.lic,
    region:    lastResult.region,
    createdAt: new Date().toISOString(),
  };
  list.unshift(entry);
  saveTournaments(list);

  const btn = document.getElementById('btn-save-tournament');
  if (btn) {
    btn.textContent = '✓ Saved';
    btn.disabled = true;
    btn.style.opacity = '.5';
  }
  showToast('Tournament saved to your library');
  updateNavBadge();
}
```

Toast helper (append near bottom of `<script>`, before `// Init`):

```javascript
function showToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = `
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);
      background:#161c2d;border:1px solid rgba(16,185,129,.35);border-radius:8px;
      padding:9px 16px;font-size:.83rem;color:#10b981;opacity:0;
      transition:opacity .25s,transform .25s;z-index:999;pointer-events:none;
      display:flex;align-items:center;gap:8px`;
    document.body.appendChild(el);
  }
  el.textContent = '✓  ' + msg;
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2600);
}
```

---

## Nav badge

Sidebar "🏆 Tournaments" item shows a count badge when there are saved tournaments:

```html
<!-- in sidebar -->
<button class="nav-item" id="nav-tournament" onclick="showView('list')">
  <span class="nav-icon">🏆</span> Tournaments
  <span class="nav-badge" id="nav-tourn-badge" style="display:none"></span>
</button>
```

```javascript
function updateNavBadge() {
  const n = loadTournaments().length;
  const el = document.getElementById('nav-tourn-badge');
  if (!el) return;
  el.textContent = n;
  el.style.display = n > 0 ? 'inline' : 'none';
}
```

Call `updateNavBadge()` at init (inside `// Init` block) and after every save/delete.

---

## List view — `renderList()`

```javascript
function renderList() {
  const list = loadTournaments();
  const typeIcon = { slot:'🎰', live:'🃏', mixed:'🎲', prize_drop:'💎' };
  const roiColor = roi => roi >= 10 ? 'var(--success)' : roi >= 0 ? 'var(--warn)' : '#ef4444';

  if (list.length === 0) {
    return `
<div class="step-header">
  <div class="step-badge">🏆 Tournaments</div>
  <div class="step-title">Your Tournament Library</div>
  <div class="step-sub">No tournaments saved yet</div>
</div>
<div class="card" style="text-align:center;padding:40px 20px">
  <div style="font-size:2.5rem;margin-bottom:14px">🏆</div>
  <div style="color:var(--muted);font-size:.88rem;margin-bottom:20px">
    Generate a tournament and click "Save" to build your library.
  </div>
  <button class="btn btn-primary" onclick="goStep(1)">Create a Tournament →</button>
</div>`;
  }

  const cards = list.map(t => {
    const roi    = t.econ?.roi ?? 0;
    const roiStr = (roi >= 0 ? '+' : '') + roi + '%';
    const cur    = t.cur || '';
    const pool   = cur + ' ' + (t.spec?.prizePool || 0).toLocaleString();
    const date   = new Date(t.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
    const seg    = t.params?.segment || 'mid';

    return `
<div class="card" style="display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:10px">
  <div style="width:38px;height:38px;border-radius:9px;background:rgba(79,110,247,.15);
              border:1px solid rgba(79,110,247,.25);display:flex;align-items:center;
              justify-content:center;font-size:18px;flex-shrink:0">
    ${typeIcon[t.type] || '🏆'}
  </div>
  <div style="flex:1;min-width:0">
    <div style="font-size:.88rem;font-weight:600;color:var(--text);margin-bottom:3px;
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span style="font-size:.78rem;color:var(--muted)">${pool}</span>
      <span style="font-size:.73rem;padding:1px 7px;border-radius:99px;
                   background:rgba(16,185,129,.12);color:${roiColor(roi)}">${roiStr} ROI</span>
      <span style="font-size:.73rem;padding:1px 7px;border-radius:99px;
                   background:rgba(79,110,247,.12);color:#a0b0ff">${seg}</span>
      <span style="font-size:.73rem;color:var(--muted);margin-left:auto">${date}</span>
    </div>
  </div>
  <div style="display:flex;gap:7px;flex-shrink:0">
    <button class="btn btn-outline btn-sm" onclick="showView('detail','${t.id}')">Details</button>
    <button class="btn btn-outline btn-sm"
            style="border-color:rgba(124,58,237,.4);color:#c4b5fd"
            onclick="loadAndShowGuide('${t.id}')">📋 Guide</button>
  </div>
</div>`;
  }).join('');

  return `
<div class="step-header">
  <div class="step-badge">🏆 Tournaments</div>
  <div class="step-title">Your Tournament Library</div>
  <div class="step-sub">${list.length} saved tournament${list.length !== 1 ? 's' : ''}</div>
</div>
${cards}
<div style="margin-top:16px;text-align:center">
  <button class="btn btn-primary" onclick="goStep(1)">+ Create New Tournament</button>
</div>`;
}
```

---

## Detail view — `renderDetail(id)`

```javascript
function renderDetail(id) {
  const t = loadTournaments().find(t => t.id === id);
  if (!t) return `<div class="card">Tournament not found. <button class="btn btn-ghost" onclick="showView('list')">← Back</button></div>`;

  const e      = t.econ || {};
  const spec   = t.spec || {};
  const cur    = t.cur || '';
  const roiPos = (e.roi ?? 0) >= 0;

  const prizeRows = (spec.prizes || []).map(pr => `
    <div class="prize-row">
      <span class="prize-place">${pr.place===1?'🥇':pr.place===2?'🥈':pr.place===3?'🥉':'#'+pr.place}</span>
      <div class="prize-bar-wrap"><div class="prize-bar" style="width:${Math.min(pr.pct*3,100)}%"></div></div>
      <span class="prize-pct">${pr.pct}%</span>
      <span class="prize-amt">${cur} ${pr.amount.toLocaleString()}</span>
    </div>`).join('');

  const econRows = [
    { label:'Expected participants', val: (e.participantsMid || 0).toLocaleString() },
    { label:'GGR lift (expected)',   val: cur + ' ' + Math.round(e.ggrLiftMid || 0).toLocaleString() },
    { label:'Net margin (expected)', val: (e.netMarginMid >= 0 ? '+' : '') + cur + ' ' + Math.round(Math.abs(e.netMarginMid || 0)).toLocaleString(), pos: roiPos },
    { label:'ROI',                   val: (e.roi >= 0 ? '+' : '') + e.roi + '%', pos: roiPos },
    { label:'Break-even players',    val: (e.breakEvenParticipants || '—').toLocaleString() },
    { label:'Cost per active',       val: cur + ' ' + Math.round(e.costPerActiveMid || 0).toLocaleString() },
  ].map(r => `
    <div style="display:flex;justify-content:space-between;align-items:center;
                padding:7px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:.8rem;color:var(--muted)">${r.label}</span>
      <span style="font-size:.83rem;font-weight:600;color:${r.pos===false?'#ef4444':r.pos?'var(--success)':'var(--text)'}">${r.val}</span>
    </div>`).join('');

  const date = new Date(t.createdAt).toLocaleDateString('en-GB',
    { day:'numeric', month:'short', year:'numeric' });

  return `
<div style="margin-bottom:18px">
  <button class="btn btn-ghost btn-sm" onclick="showView('list')" style="padding:0;margin-bottom:10px">
    ← Tournaments
  </button>
  <div style="display:flex;align-items:flex-start;gap:14px">
    <div style="width:46px;height:46px;border-radius:10px;background:rgba(79,110,247,.15);
                border:1px solid rgba(79,110,247,.3);display:flex;align-items:center;
                justify-content:center;font-size:22px;flex-shrink:0">
      ${{ slot:'🎰', live:'🃏', mixed:'🎲', prize_drop:'💎' }[t.type] || '🏆'}
    </div>
    <div>
      <div style="font-size:1.15rem;font-weight:700;color:var(--text);margin-bottom:4px">${t.name}</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">
        <span style="font-size:.75rem;padding:2px 8px;border-radius:99px;
                     background:rgba(79,110,247,.15);color:#a0b0ff">${t.lic?.toUpperCase() || 'NONE'}</span>
        <span style="font-size:.75rem;padding:2px 8px;border-radius:99px;
                     background:rgba(79,110,247,.12);color:#a0b0ff">${t.params?.segment || 'mid'}</span>
        <span style="font-size:.75rem;padding:2px 8px;border-radius:99px;
                     background:rgba(79,110,247,.12);color:#a0b0ff">${t.params?.duration || ''}</span>
        <span style="font-size:.75rem;color:var(--muted)">Saved ${date}</span>
      </div>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title">Economics</div>
  ${econRows}
</div>

<div class="card">
  <div class="card-title">Prize Distribution (${cur} ${(spec.prizePool||0).toLocaleString()} pool)</div>
  ${prizeRows}
</div>

<div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap">
  <button class="btn btn-outline" style="flex:1;border-color:rgba(124,58,237,.4);color:#c4b5fd"
          onclick="loadAndShowGuide('${t.id}')">
    📋 Setup Guide
  </button>
  <button class="btn btn-outline" style="flex:1;border-color:rgba(79,110,247,.4);color:#a0b0ff"
          onclick="loadAndRegenTexts('${t.id}')">
    ✦ AI Texts
  </button>
  <button class="btn btn-outline btn-sm" style="color:var(--muted);border-color:var(--border)"
          onclick="deleteTournament('${t.id}')">
    🗑 Delete
  </button>
</div>`;
}
```

---

## Helper functions

### `loadAndShowGuide(id)` — load saved tournament into live state, then show guide

```javascript
function loadAndShowGuide(id) {
  const t = loadTournaments().find(t => t.id === id);
  if (!t) return;
  // Restore global state so renderSetupGuide() has data
  lastResult = { spec: t.spec, econ: t.econ, cur: t.cur, lic: t.lic, region: t.region };
  draft.type   = t.type;
  draft.params = { ...t.params };
  showView('setup');
}
```

### `loadAndRegenTexts(id)` — load saved tournament and jump to Step 4

```javascript
function loadAndRegenTexts(id) {
  const t = loadTournaments().find(t => t.id === id);
  if (!t) return;
  lastResult = { spec: t.spec, econ: t.econ, cur: t.cur, lic: t.lic, region: t.region };
  lastTexts  = null;
  lastAudit  = null;
  draft.type   = t.type;
  draft.params = { ...t.params };
  goStep(4);
}
```

### `deleteTournament(id)`

```javascript
function deleteTournament(id) {
  if (!confirm('Delete this tournament from your library?')) return;
  const list = loadTournaments().filter(t => t.id !== id);
  saveTournaments(list);
  updateNavBadge();
  showToast('Tournament deleted');
  showView('list');
}
```

---

## Init block changes

```javascript
// Init
updateNavBadge();    // ← add this line
renderStep();
```

---

## Sidebar change

Change "🏆 Tournaments" from `<a href>` to `<button onclick>` so it triggers `showView('list')`:

```html
<!-- before -->
<a href="/tournament-generator.html" class="nav-item active" id="nav-tournament">
  <span class="nav-icon">🏆</span> Tournaments
</a>

<!-- after -->
<button class="nav-item" id="nav-tournament" onclick="showView('list')">
  <span class="nav-icon">🏆</span> Tournaments
  <span class="nav-badge" id="nav-tourn-badge" style="display:none"></span>
</button>
```

The `active` class is no longer hardcoded — it is set dynamically by `setSidebarActive()`.

---

## Files changed

| File | Change |
|---|---|
| `public/tournament-generator.html` | All changes — localStorage helpers, save button in Step 3, `renderList()`, `renderDetail()`, `loadAndShowGuide()`, `loadAndRegenTexts()`, `deleteTournament()`, `showToast()`, `updateNavBadge()`, sidebar button change, `showView()` dispatcher, init update |

No backend changes. No new files.

---

## Implementation order

1. Add `loadTournaments`, `saveTournaments`, `genId`, `autoName` helpers
2. Add `showView()` dispatcher; update `goStep()` to call `setSidebarActive('nav-tournament')`  
   *(already sets nav-tournament active — just ensure it doesn't conflict with nav-setup-guide)*
3. Replace sidebar `<a>` with `<button onclick="showView('list')">` + badge span
4. Add `saveTournament()` + save button in `renderStep3()` return
5. Add `showToast()` and `updateNavBadge()`
6. Add `renderList()` and `renderDetail(id)`
7. Add `loadAndShowGuide()`, `loadAndRegenTexts()`, `deleteTournament()`
8. Update `// Init` block

---

## Edge cases

- **Save already-saved tournament**: compare by `type + JSON.stringify(params)` — show toast "Already saved", no duplicate.
- **Empty library**: `renderList()` shows empty-state CTA → goStep(1).
- **Detail for missing id**: show error card with "← Back" link.
- **Setup Guide from list with no `lastResult`**: `loadAndShowGuide()` restores `lastResult` from saved data before calling `showView('setup')` — always safe.
- **Regenerate texts from detail**: restores state then calls `goStep(4)` which triggers the Step 4 UI; user can click "Generate Texts" button normally.
