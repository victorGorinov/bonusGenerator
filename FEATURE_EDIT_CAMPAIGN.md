# Feature: Edit Saved Campaign + Audit
> Spec for Claude Code. Read CLAUDE.md and AI_CAMPAIGN_GENERATOR_PLAN.md first.

## What to build

Three connected sub-features in `public/configurator.html`:

1. **Edit mode** — open a saved campaign, change any parameter in the left-panel form
2. **Recalculate** — re-run `generate()` with new params, show updated P10/P50/P90 economics
3. **Audit panel** — diff of changed params + before/after economics + verdict + save/reset actions

---

## Files to modify

| File | What changes |
|---|---|
| `public/configurator.html` | All UI + logic (inline `<script>` block) |
| `public/app.js` | Read only — do not modify |
| `public/styles.css` | Read only — do not modify |

---

## Current state of configurator.html

The file already exists at `public/configurator.html`. It has:
- Full form UI (region cards, sliders, chips)
- `saveCampaignToStorage(name)` — saves to localStorage key `bonusCampaigns`
- `openCampaignInConfigurator(campaign)` — pre-fills form and calls `generate()`
- Saved campaigns drawer (slide-in panel)
- `_showCampaignBanner()` from `app.js` — fixed top banner

The inline `<script>` block starts at the bottom of the file (after `<script src="app.js"></script>`).

**What is NOT yet implemented** (needs to be built):
- Edit mode state (`window._editMode`)
- Edit mode banner (yellow bar showing campaign name + Reset/Exit buttons)
- Economics snapshot stored in saved campaign
- Audit panel rendered after re-generation
- `updateSavedCampaign()` — save edited params back to existing record
- `resetToOriginal()` — re-apply original params

---

## Data model changes

### Current saved campaign object (in localStorage `bonusCampaigns` array):
```javascript
{
  id: 'abc123',
  name: 'Weekend Reload DE',
  createdAt: '2025-05-16T...',
  params: {
    region, players, avgdep, sitecur, depcur, lic, plat, rtp, lang
  },
  mechanics: {
    type, pct, maxB, wager, cur
  }
}
```

### Extended campaign object (add `economics` field):
```javascript
{
  // ... existing fields ...
  economics: {
    costRatio: 0.22,          // from cfg.econ.costRatio
    verdict: 'ok',            // 'cheap' | 'ok' | 'warn' | 'high'
    p10Cost: 4200,            // cfg.econ.sP10.cost * cfg.econ.pl (total)
    p50Cost: 9800,            // cfg.econ.sP50.cost * cfg.econ.pl
    p90Cost: 18500,           // cfg.econ.sP90.cost * cfg.econ.pl
    p50Conv: 0.68,            // cfg.econ.sP50.conv
    arpu: 50,                 // cfg.econ.arpu
    ltv3: 156,                // cfg.econ.ltv3
    roi: 3.2,                 // cfg.econ.roi
    wagerX: 35,               // cfg.econ.wagerX
    breakeven: 26,            // cfg.econ.breakeven_wager
    cur: 'EUR',               // currency for display
  },
  updatedAt: null             // set when campaign is updated
}
```

**Where to read these values** (from `window._lastCfg` after `generate()`):
```javascript
const cfg = window._lastCfg;
const E   = cfg.econ;
const pl  = cfg.pl;    // players count
```

**Verdict thresholds** (match existing app.js logic):
```javascript
function _ratioVerdict(ratio) {
  if (ratio < 0.10) return 'cheap';
  if (ratio < 0.25) return 'ok';
  if (ratio < 0.40) return 'warn';
  return 'high';
}
```

---

## Edit mode state

Add to inline script:
```javascript
window._editMode = {
  active: false,
  campaignId: null,
  originalCampaign: null,   // full campaign object as opened
};
```

---

## Functions to implement

### 1. `_captureEconomics()`
Reads economics from `window._lastCfg` and returns the `economics` object for storage.

```javascript
function _captureEconomics() {
  const cfg = window._lastCfg;
  if (!cfg || !cfg.econ) return null;
  const E = cfg.econ;
  const pl = cfg.pl || S.players;
  return {
    costRatio:  E.costRatio   || 0,
    verdict:    _ratioVerdict(E.costRatio || 0),
    p10Cost:    Math.round((E.sP10?.cost || 0) * pl),
    p50Cost:    Math.round((E.sP50?.cost || 0) * pl),
    p90Cost:    Math.round((E.sP90?.cost || 0) * pl),
    p50Conv:    E.sP50?.conv  || 0,
    arpu:       E.arpu        || S.avgdep,
    ltv3:       E.ltv3        || 0,
    roi:        E.roi         || 0,
    wagerX:     E.wagerX      || 0,
    breakeven:  E.breakeven_wager || 0,
    cur:        cfg.cur       || S.sitecur,
  };
}
```

### 2. Update `saveCampaignToStorage(name)`
Add `economics: _captureEconomics()` and `updatedAt: null` to the saved object.

### 3. `_setEditMode(campaign)`
Activates edit mode for an existing campaign.

```javascript
function _setEditMode(campaign) {
  window._editMode = {
    active: true,
    campaignId: campaign.id,
    originalCampaign: JSON.parse(JSON.stringify(campaign)), // deep copy
  };
  // Show edit mode banner
  document.getElementById('edit-bar-name').textContent = campaign.name;
  document.getElementById('edit-mode-bar').style.display = 'flex';
  // Switch save button to "Update" mode (handled in _injectSaveButton)
}
```

### 4. `_clearEditMode()`
Hides edit mode banner, clears state, removes audit panel.

```javascript
function _clearEditMode() {
  window._editMode = { active: false, campaignId: null, originalCampaign: null };
  document.getElementById('edit-mode-bar').style.display = 'none';
  const panel = document.getElementById('audit-panel');
  if (panel) panel.remove();
}
```

### 5. `exitEditMode()`
Called by ✕ button. Clears edit mode but keeps current generated output.

### 6. `resetToOriginal()`
Re-applies original campaign params and re-generates.

```javascript
function resetToOriginal() {
  const orig = window._editMode?.originalCampaign;
  if (!orig) return;
  // Remove audit panel before re-gen
  const panel = document.getElementById('audit-panel');
  if (panel) panel.remove();
  // Re-apply original params (reuse openCampaignInConfigurator logic)
  _applyParamsFromCampaign(orig);
  // Re-generate
  setTimeout(() => generate(), 80);
}
```

### 7. `_applyParamsFromCampaign(campaign)`
Extracted helper — applies all params to form. Refactor `openCampaignInConfigurator` to use this.

```javascript
function _applyParamsFromCampaign(campaign) {
  const p = campaign.params;
  if (p.region) pickRegion(p.region);
  if (p.avgdep  != null) { document.getElementById('avgdep').value = p.avgdep;  S.avgdep  = p.avgdep; }
  if (p.sitecur) { document.getElementById('sitecur').value = p.sitecur; S.sitecur = p.sitecur; }
  if (p.depcur)  { document.getElementById('depcur').value  = p.depcur;  S.depcur  = p.depcur; }
  if (p.players != null) {
    const rng = document.getElementById('prange');
    const num = document.getElementById('pnum');
    const dsp = document.getElementById('pdsp');
    if (rng) rng.value = Math.min(p.players, parseInt(rng.max || 50000));
    if (num) num.value = p.players;
    if (dsp) dsp.textContent = Number(p.players).toLocaleString('ru');
    S.players = p.players;
  }
  if (p.lic)  setChip('lic',  p.lic);
  if (p.plat) setChip('plat', p.plat);
  if (p.rtp  != null) syncRtp(p.rtp);
  if (p.lang && typeof setLang === 'function') setLang(p.lang);
}
```

### 8. Update `openCampaignInConfigurator(campaign)`
After applying params, call `_setEditMode(campaign)` instead of `_showCampaignBanner()`.

```javascript
function openCampaignInConfigurator(campaign) {
  _applyParamsFromCampaign(campaign);
  closeCampaignsDrawer();
  _setEditMode(campaign);
  setTimeout(() => {
    generate().then(() => {
      if (campaign.mechanics?.wager) {
        const ovw = document.getElementById('ov_w_wager');
        if (ovw) { ovw.value = campaign.mechanics.wager; recalcEcon(); }
      }
      if (window.innerWidth <= 768) {
        document.querySelector('.right')?.scrollIntoView({ behavior:'smooth', block:'start' });
      }
    });
  }, 80);
}
```

### 9. Update `_injectSaveButton()`
In edit mode: show "Update Campaign" button (calls `updateSavedCampaign`) instead of "Save Campaign".

```javascript
function _injectSaveButton() {
  const oh = document.querySelector('#out .oh');
  if (!oh) return;
  const existing = document.getElementById('btn-save-camp');
  if (existing) existing.remove(); // always re-inject to update label

  const actionsDiv = oh.querySelector('div:last-child');
  if (!actionsDiv) return;

  const btn = document.createElement('button');
  btn.id = 'btn-save-camp';

  if (window._editMode?.active) {
    btn.className = 'btn-save-camp';
    btn.style.cssText = 'background:rgba(245,158,11,.15);color:#f59e0b;border-color:rgba(245,158,11,.4)';
    btn.textContent = '💾 Обновить кампанию';
    btn.onclick = updateSavedCampaign;
  } else {
    btn.className = 'btn-save-camp';
    btn.textContent = typeof t === 'function' ? t('btn_save_camp') : '💾 Save Campaign';
    btn.onclick = openSaveModal;
  }

  actionsDiv.insertBefore(btn, actionsDiv.firstChild);
}
```

### 10. Update `patchGenerate()`
After generate in edit mode, call `renderAuditPanel()`.

```javascript
(function patchGenerate() {
  const _orig = window.generate;
  window.generate = async function() {
    await _orig.apply(this, arguments);
    _injectSaveButton();
    if (window._editMode?.active) {
      // Small delay so recalcEcon finishes updating DOM
      setTimeout(() => renderAuditPanel(), 350);
    }
  };
})();
```

### 11. `updateSavedCampaign()`
Overwrites the campaign record in localStorage with current params + new economics.

```javascript
function updateSavedCampaign() {
  if (!window._editMode?.active || !window._lastCfg) return;
  const id = window._editMode.campaignId;
  const arr = _loadCampsStore();
  const idx = arr.findIndex(c => c.id === id);
  if (idx === -1) return;

  const cfg = window._lastCfg;
  arr[idx] = {
    ...arr[idx],
    updatedAt: new Date().toISOString(),
    params: {
      region:  S.region,
      players: S.players,
      avgdep:  S.avgdep,
      sitecur: S.sitecur,
      depcur:  S.depcur,
      lic:     S.lic,
      plat:    S.plat,
      rtp:     S.rtp,
      lang:    typeof L !== 'undefined' ? L : 'ru',
    },
    mechanics: cfg.welcome ? {
      type:  cfg.welcome.type,
      pct:   cfg.welcome.pct,
      maxB:  cfg.welcome.maxB,
      wager: cfg.wager ? cfg.wager.wW : null,
      cur:   cfg.welcome.cur || S.sitecur,
    } : arr[idx].mechanics,
    economics: _captureEconomics(),
  };

  _saveCampsStore(arr);
  _updateCampsCount();

  // Update edit mode's originalCampaign to new state (so Reset now resets to this)
  window._editMode.originalCampaign = JSON.parse(JSON.stringify(arr[idx]));

  // Visual feedback
  const btn = document.getElementById('btn-save-camp');
  if (btn) {
    btn.textContent = '✓ Обновлено';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = '💾 Обновить кампанию'; btn.disabled = false; }, 2000);
  }
  _showToast('Кампания обновлена ✓');

  // Remove audit panel — changes are now saved
  const panel = document.getElementById('audit-panel');
  if (panel) panel.remove();
}
```

### 12. `renderAuditPanel()`
The main audit function — compares original campaign vs. current generation.

```javascript
function renderAuditPanel() {
  const orig = window._editMode?.originalCampaign;
  const cfg  = window._lastCfg;
  if (!orig || !cfg) return;

  // Remove existing panel
  const existing = document.getElementById('audit-panel');
  if (existing) existing.remove();

  const origP = orig.params;
  const origE = orig.economics || null;
  const newE  = _captureEconomics();
  const cur   = newE?.cur || S.sitecur;

  // ── Build param diff ──────────────────────────────────────────────
  const paramDiffs = _buildParamDiff(origP, newE, origE);

  // ── Build verdict items ───────────────────────────────────────────
  const verdicts = _buildVerdictItems(origP, origE, newE);

  // ── Render ───────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'audit-panel';

  const verdictBadge = _verdictBadge(newE?.verdict);

  panel.innerHTML = `
    <div class="audit-head">
      <span class="audit-head-ico">📊</span>
      <span class="audit-head-title">Аудит изменений: ${_esc(orig.name)}</span>
      <span class="audit-head-badge" style="${verdictBadge.style}">${verdictBadge.label}</span>
    </div>

    ${paramDiffs.length > 0 ? `
    <div class="audit-section">
      <div class="audit-section-title">Изменённые параметры</div>
      ${paramDiffs.map(d => `
        <div class="audit-diff-row">
          <span class="audit-diff-key">${d.label}</span>
          <span class="audit-diff-val">
            <span class="audit-before">${d.before}</span>
            <span class="audit-arrow">→</span>
            <span class="audit-after">${d.after}</span>
            <span class="audit-delta ${d.deltaClass}">${d.delta}</span>
          </span>
        </div>`).join('')}
    </div>` : `
    <div class="audit-section">
      <div class="audit-section-title">Изменённые параметры</div>
      <div style="font-size:12px;color:#8892a4;padding:4px 0">Параметры не изменились — пересчёт с теми же значениями</div>
    </div>`}

    <div class="audit-section">
      <div class="audit-section-title">Пересчёт экономики</div>
      <div class="audit-econ-grid">
        ${_econCard('P10', origE?.p10Cost, newE?.p10Cost, cur, false)}
        ${_econCard('P50', origE?.p50Cost, newE?.p50Cost, cur, false)}
        ${_econCard('P90', origE?.p90Cost, newE?.p90Cost, cur, false)}
      </div>
      ${_ratioRow(origE, newE)}
    </div>

    <div class="audit-section">
      <div class="audit-section-title">Прогнозы (новые)</div>
      <div class="audit-econ-grid">
        ${_forecastCard('P10 · консерв.', newE?.p10Cost, cur)}
        ${_forecastCard('P50 · базовый', newE?.p50Cost, cur)}
        ${_forecastCard('P90 · оптимист.', newE?.p90Cost, cur)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px">
        ${_metricCard('ARPU', _fmtCur(newE?.arpu, cur), origE ? _fmtCur(origE.arpu, origE.cur) : null)}
        ${_metricCard('ROI', newE?.roi ? newE.roi.toFixed(1)+'×' : '—', origE?.roi ? origE.roi.toFixed(1)+'×' : null)}
        ${_metricCard('Breakeven', newE?.breakeven ? newE.breakeven+'×' : '—', origE?.breakeven ? origE.breakeven+'×' : null)}
      </div>
    </div>

    ${verdicts.length > 0 ? `
    <div class="audit-section">
      <div class="audit-section-title">Рекомендации</div>
      <div class="audit-verdict">
        ${verdicts.map(v => `
          <div class="audit-verdict-item ${v.type}">
            <span class="audit-verdict-ico">${v.icon}</span>
            <span>${v.text}</span>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <div class="audit-actions">
      <button class="audit-action-btn audit-btn-save" onclick="updateSavedCampaign()">
        💾 Сохранить изменения
      </button>
      <button class="audit-action-btn audit-btn-reset" onclick="resetToOriginal()">
        ↺ Сбросить до оригинала
      </button>
    </div>
  `;

  document.getElementById('out').appendChild(panel);
}
```

### 13. Helper functions for audit panel

```javascript
// ── Param diff ────────────────────────────────────────────────────────
function _buildParamDiff(origP, newE, origE) {
  const diffs = [];
  const curr = {
    region: S.region, players: S.players, avgdep: S.avgdep,
    lic: S.lic, plat: S.plat, rtp: S.rtp,
  };
  const regionLabel = { cis:'СНГ', eu:'EU/UK', crypto:'Crypto', sweep:'USA Sweep', mn:'Монголия', latam:'LatAm' };
  const platLabel   = { both:'Desktop+Mobile', mobile:'Mobile Only', desk:'Desktop Only' };

  // Helpers
  const pctDelta = (a, b) => a && b ? (((b-a)/a)*100).toFixed(0)+'%' : null;
  const numDiff  = (key, label, fmt, higherIsBad) => {
    const a = origP[key], b = curr[key];
    if (a == null || b == null || a == b) return;
    const d = pctDelta(a, b);
    const up = b > a;
    diffs.push({
      label,
      before: fmt(a), after: fmt(b),
      delta: (up ? '↑' : '↓') + Math.abs(d),
      deltaClass: up ? (higherIsBad ? 'delta-up' : 'delta-up-good') : (higherIsBad ? 'delta-down' : 'delta-down-bad'),
    });
  };

  if (origP.region !== curr.region)
    diffs.push({ label:'Регион', before: regionLabel[origP.region]||origP.region, after: regionLabel[curr.region]||curr.region, delta:'changed', deltaClass:'delta-neutral' });
  if (origP.lic !== curr.lic && curr.lic && origP.lic)
    diffs.push({ label:'Лицензия', before: (origP.lic||'—').toUpperCase(), after: (curr.lic||'—').toUpperCase(), delta:'changed', deltaClass:'delta-neutral' });
  if (origP.plat !== curr.plat)
    diffs.push({ label:'Платформа', before: platLabel[origP.plat]||origP.plat, after: platLabel[curr.plat]||curr.plat, delta:'changed', deltaClass:'delta-neutral' });

  numDiff('players', 'Игроков/мес',  v => Number(v).toLocaleString('ru'), true);
  numDiff('avgdep',  'Avg Deposit',   v => v + ' ' + (S.depcur||''), true);
  numDiff('rtp',     'RTP',           v => v + '%', false);

  // Wager (from econ)
  if (origE?.wagerX != null && newE?.wagerX != null && origE.wagerX !== newE.wagerX) {
    const a = origE.wagerX, b = newE.wagerX;
    const d = pctDelta(a, b);
    diffs.push({
      label:'Вейджер',
      before: a+'×', after: b+'×',
      delta: (b>a?'↑':'↓') + Math.abs(d),
      deltaClass: b > a ? 'delta-up' : 'delta-down', // lower wager = good
    });
  }
  return diffs;
}

// ── Verdict items ─────────────────────────────────────────────────────
function _buildVerdictItems(origP, origE, newE) {
  const items = [];
  if (!newE) return items;

  const origRatio = origE?.costRatio || 0;
  const newRatio  = newE.costRatio   || 0;
  const origV = origE ? _ratioVerdict(origRatio) : null;
  const newV  = _ratioVerdict(newRatio);

  // Cost ratio change
  if (origE && Math.abs(newRatio - origRatio) > 0.01) {
    const diff = ((newRatio - origRatio) * 100).toFixed(1);
    const up = newRatio > origRatio;
    const verdictChanged = origV !== newV;
    if (up) {
      if (verdictChanged && (newV === 'warn' || newV === 'high')) {
        items.push({ type:'warn', icon:'⚠️', text: `Cost Ratio вырос с ${(origRatio*100).toFixed(0)}% до ${(newRatio*100).toFixed(0)}% — перешёл в зону риска. Рассмотрите снижение maxB или увеличение вейджера.` });
      } else {
        items.push({ type:'info', icon:'ℹ️', text: `Cost Ratio вырос на ${diff}pp (${(origRatio*100).toFixed(0)}% → ${(newRatio*100).toFixed(0)}%). Ещё в допустимом диапазоне.` });
      }
    } else {
      items.push({ type:'ok', icon:'✓', text: `Cost Ratio снизился с ${(origRatio*100).toFixed(0)}% до ${(newRatio*100).toFixed(0)}% — бюджет улучшился.` });
    }
  }

  // Wager change
  if (origE?.wagerX && newE.wagerX && origE.wagerX !== newE.wagerX) {
    if (newE.wagerX < origE.wagerX) {
      items.push({ type:'ok', icon:'✓', text: `Вейджер снижен (${origE.wagerX}× → ${newE.wagerX}×) — оффер стал привлекательнее для игрока, конверсия вырастет.` });
    } else {
      const overBe = newE.breakeven && newE.wagerX > newE.breakeven;
      items.push({ type: overBe ? 'warn' : 'info', icon: overBe ? '⚠️' : 'ℹ️',
        text: `Вейджер вырос (${origE.wagerX}× → ${newE.wagerX}×).${overBe ? ' Превышает breakeven — EV для игрока отрицательный.' : ' Проверьте конверсию на фокус-группе.'}` });
    }
  }

  // Breakeven check
  if (newE.breakeven && newE.wagerX > newE.breakeven) {
    items.push({ type:'warn', icon:'⚠️', text: `Вейджер ${newE.wagerX}× превышает breakeven ${newE.breakeven}×. Игроки с низким балансом не смогут отыграть бонус — риск жалоб.` });
  }

  // Players scale
  if (origP.players && S.players > origP.players * 1.5) {
    const ratio = (S.players / origP.players).toFixed(1);
    items.push({ type:'info', icon:'ℹ️', text: `Количество игроков выросло в ${ratio}×. Бюджет кампании масштабируется пропорционально — проверьте P90 сценарий.` });
  }

  // Avgdep change
  if (origP.avgdep && Math.abs(S.avgdep - origP.avgdep) / origP.avgdep > 0.3) {
    items.push({ type:'info', icon:'ℹ️', text: `Средний депозит изменился с ${origP.avgdep} на ${S.avgdep} ${S.depcur} — сегмент игроков другой. Убедитесь, что механика бонуса подходит новому сегменту.` });
  }

  if (items.length === 0) {
    items.push({ type:'ok', icon:'✓', text: 'Параметры пересчитаны. Значимых рисков не обнаружено.' });
  }
  return items;
}

// ── Card helpers ──────────────────────────────────────────────────────
function _econCard(label, before, after, cur, higherIsBetter) {
  const hasOrig = before != null;
  const improved = hasOrig && (higherIsBetter ? after > before : after < before);
  const worsened = hasOrig && (higherIsBetter ? after < before : after > before);
  const cls = !hasOrig ? 'econ-neutral' : improved ? 'econ-improved' : worsened ? 'econ-worsened' : 'econ-neutral';
  return `<div class="audit-econ-card">
    <div class="audit-econ-label">${label}</div>
    ${hasOrig ? `<div class="audit-econ-before">${_fmtCur(before, cur)}</div>` : ''}
    <div class="audit-econ-after ${cls}">${_fmtCur(after, cur)}</div>
  </div>`;
}

function _forecastCard(label, val, cur) {
  return `<div class="audit-econ-card">
    <div class="audit-econ-label">${label}</div>
    <div class="audit-econ-after econ-neutral">${_fmtCur(val, cur)}</div>
  </div>`;
}

function _metricCard(label, newVal, origVal) {
  return `<div class="audit-econ-card">
    <div class="audit-econ-label">${label}</div>
    ${origVal ? `<div class="audit-econ-before">${origVal}</div>` : ''}
    <div class="audit-econ-after econ-neutral">${newVal || '—'}</div>
  </div>`;
}

function _ratioRow(origE, newE) {
  const oR = origE?.costRatio || 0;
  const nR = newE?.costRatio  || 0;
  const oV = origE ? _verdictBadge(_ratioVerdict(oR)) : null;
  const nV = _verdictBadge(_ratioVerdict(nR));
  const maxRatio = 0.45;
  return `<div class="audit-ratio-row">
    <div style="font-size:11px;color:#8892a4;min-width:80px">Cost Ratio</div>
    <div class="audit-ratio-track">
      ${oV ? `<div class="audit-ratio-fill-orig" style="width:${Math.min(oR/maxRatio*100,100).toFixed(1)}%"></div>` : ''}
      <div class="audit-ratio-fill-new" style="width:${Math.min(nR/maxRatio*100,100).toFixed(1)}%;background:${nV.color}"></div>
    </div>
    <div style="display:flex;gap:6px;align-items:center;font-size:12px;font-weight:700">
      ${oV ? `<span style="color:#8892a4;text-decoration:line-through;font-weight:400;font-size:11px">${(oR*100).toFixed(0)}%</span><span style="color:#8892a4">→</span>` : ''}
      <span style="color:${nV.color}">${(nR*100).toFixed(0)}% <span style="font-size:10px;font-weight:400">${nV.label}</span></span>
    </div>
  </div>`;
}

function _verdictBadge(verdict) {
  const map = {
    cheap: { label:'Слабый', color:'#8892a4', style:'background:rgba(148,163,184,.12);color:#8892a4' },
    ok:    { label:'OK ✓',   color:'#10b981', style:'background:rgba(16,185,129,.12);color:#10b981' },
    warn:  { label:'Риск ⚠', color:'#f59e0b', style:'background:rgba(245,158,11,.12);color:#f59e0b' },
    high:  { label:'Высокий ✕', color:'#ef4444', style:'background:rgba(239,68,68,.12);color:#ef4444' },
  };
  return map[verdict] || map.ok;
}

function _ratioVerdict(ratio) {
  if (ratio < 0.10) return 'cheap';
  if (ratio < 0.25) return 'ok';
  if (ratio < 0.40) return 'warn';
  return 'high';
}

function _fmtCur(val, cur) {
  if (val == null || isNaN(val)) return '—';
  const n = Math.round(val);
  if (cur === 'USD' || cur === 'USDT') return '$' + n.toLocaleString('en');
  if (cur === 'EUR') return '€' + n.toLocaleString('en');
  if (cur === 'GBP') return '£' + n.toLocaleString('en');
  if (cur === 'MNT') return n.toLocaleString('ru') + '₮';
  if (cur === 'RUB') return n.toLocaleString('ru') + ' ₽';
  return n.toLocaleString('en') + ' ' + (cur || '');
}
```

---

## i18n keys to add

Add to all 4 language objects in the `patchLang()` IIFE:

```javascript
// RU
edit_bar_label:  'Редактирование:',
edit_bar_reset:  '↺ Сбросить параметры',
edit_bar_exit:   '✕ Выйти',
btn_update_camp: '💾 Обновить кампанию',
audit_saved:     'Кампания обновлена ✓',

// EN
edit_bar_label:  'Editing:',
edit_bar_reset:  '↺ Reset parameters',
edit_bar_exit:   '✕ Exit',
btn_update_camp: '💾 Update Campaign',
audit_saved:     'Campaign updated ✓',

// MN + ES — translate accordingly
```

---

## HTML changes needed

### 1. Add edit mode banner (after `<nav>` / before `.wrap`):

Already partially added in previous session — check if `id="edit-mode-bar"` div exists. If not:

```html
<div id="edit-mode-bar" style="display:none">
  <div class="edit-bar-left">
    <span class="edit-bar-icon">✏️</span>
    <span class="edit-bar-label">Редактирование:</span>
    <span class="edit-bar-name" id="edit-bar-name">—</span>
  </div>
  <div class="edit-bar-right">
    <button class="edit-bar-btn edit-bar-reset" onclick="resetToOriginal()">↺ Сбросить параметры</button>
    <button class="edit-bar-btn edit-bar-exit"  onclick="exitEditMode()">✕ Выйти</button>
  </div>
</div>
```

### 2. Audit panel is injected dynamically into `#out` — no static HTML needed.

---

## Implementation order

1. Add `_editMode` state object
2. Add all helper functions (`_captureEconomics`, `_ratioVerdict`, `_fmtCur`, `_verdictBadge`)
3. Add `_applyParamsFromCampaign()`, refactor `openCampaignInConfigurator()` to use it
4. Add `_setEditMode()`, `_clearEditMode()`, `exitEditMode()`, `resetToOriginal()`
5. Update `saveCampaignToStorage()` to save economics
6. Update `_injectSaveButton()` for edit mode
7. Update `patchGenerate()` to call audit
8. Add `updateSavedCampaign()`
9. Add all audit rendering helpers
10. Add `renderAuditPanel()`
11. Add i18n keys

---

## Testing checklist

- [ ] Save a campaign → `economics` field present in localStorage
- [ ] Open campaign → edit mode banner shows campaign name
- [ ] Change avgdep → click generate → audit panel appears with diff row
- [ ] Audit shows P10/P50/P90 before/after (only "after" if no prior economics)
- [ ] "Сохранить изменения" → localStorage updated, audit panel removed, toast shown
- [ ] "Сбросить до оригинала" → form resets, re-generates, original economics shown
- [ ] "✕ Выйти" → edit bar hidden, output stays, audit panel removed
- [ ] No changes from original → "Параметры не изменились" message in diff section
- [ ] Saved campaign opened again → shows updated params
