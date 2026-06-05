// ══════════════════════════════════════════════════════════════════════
// RTP SYNC (not in app.js — specific to this page's slider)
// ══════════════════════════════════════════════════════════════════════
function syncRtp(v) {
  v = parseFloat(v) || 96;
  v = Math.min(99, Math.max(85, v));
  const rng = document.getElementById('rtprange');
  const num = document.getElementById('rtpnum');
  const dsp = document.getElementById('rtpdsp');
  if (rng) rng.value = v;
  if (num) num.value = v;
  if (dsp) dsp.textContent = v.toFixed(1) + '%';
  S.rtp = v;
}

// ══════════════════════════════════════════════════════════════════════
// ADD i18n KEYS for this page
// ══════════════════════════════════════════════════════════════════════
(function patchLang() {
  const extra = {
    ru: {
      apply_recs: '⚡ Применить рекомендации',
      balance_profit: '⚖️ Сбалансировать',
      target_margin: 'Запас',
      undo: '↩ Отменить',
      cannot_balance_regulatory: 'Невозможно выйти в плюс в рамках лицензионных лимитов — снизьте охват или сегмент',
      balance_done: 'Сбалансировано ✓',
      balance_delta_title: 'Результат балансировки',
      camps_btn: 'Кампании',
      camps_drawer_title: 'Сохранённые кампании',
      camps_empty_t: 'Нет сохранённых кампаний',
      camps_empty_s: 'Сгенерируйте конфиг и нажмите «Сохранить кампанию»',
      camp_open: 'Открыть в конфигураторе',
      camp_reopen: 'Переоткрыть',
      save_modal_title: '💾 Сохранить кампанию',
      save_modal_sub: 'Дайте название — потом сможете открыть с теми же параметрами из любой сессии.',
      save_modal_ph: 'Например: EU Reload May 2025',
      save_modal_cancel: 'Отмена',
      save_modal_ok: 'Сохранить',
      btn_save_camp: '💾 Сохранить кампанию',
      camp_saved_toast: 'Кампания сохранена ✓',
      edit_bar_label: 'Редактирование:',
      edit_bar_reset: '↺ Сбросить параметры',
      edit_bar_exit: '✕ Выйти',
      btn_update_camp: '💾 Обновить кампанию',
      btn_updated: '✓ Обновлено',
      audit_saved: 'Кампания обновлена ✓',
      chain_title: 'Цепочка депозитов',
      chain_step_welcome: '1-й депозит',
      chain_step_dep2: '2-й депозит',
      chain_step_dep3: '3-й депозит',
      chain_cohort: 'доля когорты',
      chain_total: 'Итого по цепочке',
      chain_ratio_lbl: 'нагрузка',
    },
    en: {
      apply_recs: '⚡ Apply Recommendations',
      balance_profit: '⚖️ Balance to Profit',
      target_margin: 'Margin',
      undo: '↩ Undo',
      cannot_balance_regulatory: 'Cannot reach breakeven within regulatory limits — reduce audience or segment',
      balance_done: 'Balanced ✓',
      balance_delta_title: 'Balance result',
      camps_btn: 'Campaigns',
      camps_drawer_title: 'Saved Campaigns',
      camps_empty_t: 'No saved campaigns',
      camps_empty_s: 'Generate a config and click "Save Campaign"',
      camp_open: 'Open in Configurator',
      camp_reopen: 'Reopen',
      save_modal_title: '💾 Save Campaign',
      save_modal_sub: 'Give it a name — you can reopen it with the same parameters any time.',
      save_modal_ph: 'e.g. EU Reload May 2025',
      save_modal_cancel: 'Cancel',
      save_modal_ok: 'Save',
      btn_save_camp: '💾 Save Campaign',
      camp_saved_toast: 'Campaign saved ✓',
      edit_bar_label: 'Editing:',
      edit_bar_reset: '↺ Reset parameters',
      edit_bar_exit: '✕ Exit',
      btn_update_camp: '💾 Update Campaign',
      btn_updated: '✓ Updated',
      audit_saved: 'Campaign updated ✓',
      chain_title: 'Deposit chain',
      chain_step_welcome: '1st deposit',
      chain_step_dep2: '2nd deposit',
      chain_step_dep3: '3rd deposit',
      chain_cohort: 'cohort share',
      chain_total: 'Chain total',
      chain_ratio_lbl: 'load',
    },
    mn: {
      camps_btn: 'Кампани',
      camps_drawer_title: 'Хадгалагдсан кампани',
      camps_empty_t: 'Хадгалагдсан кампани байхгүй',
      camps_empty_s: 'Тохиргоо үүсгэж «Хадгалах» дарна уу',
      camp_open: 'Тохируулагч дотор нээх',
      camp_reopen: 'Дахин нээх',
      save_modal_title: '💾 Кампани хадгалах',
      save_modal_sub: 'Нэр өгнө үү — ижил параметртэйгээр хүссэн үедээ нээж болно.',
      save_modal_ph: 'Жишээ: EU Reload May 2025',
      save_modal_cancel: 'Цуцлах',
      save_modal_ok: 'Хадгалах',
      btn_save_camp: '💾 Кампани хадгалах',
      camp_saved_toast: 'Кампани хадгалагдлаа ✓',
      edit_bar_label: 'Засах:',
      edit_bar_reset: '↺ Параметр шинэчлэх',
      edit_bar_exit: '✕ Гарах',
      btn_update_camp: '💾 Кампани шинэчлэх',
      btn_updated: '✓ Шинэчлэгдлээ',
      audit_saved: 'Кампани шинэчлэгдлээ ✓',
    },
    es: {
      camps_btn: 'Campañas',
      camps_drawer_title: 'Campañas guardadas',
      camps_empty_t: 'No hay campañas guardadas',
      camps_empty_s: 'Genera una config y haz clic en «Guardar campaña»',
      camp_open: 'Abrir en configurador',
      camp_reopen: 'Reabrir',
      save_modal_title: '💾 Guardar campaña',
      save_modal_sub: 'Dale un nombre — podrás reabrirla con los mismos parámetros en cualquier momento.',
      save_modal_ph: 'Ej.: EU Reload Mayo 2025',
      save_modal_cancel: 'Cancelar',
      save_modal_ok: 'Guardar',
      btn_save_camp: '💾 Guardar campaña',
      camp_saved_toast: 'Campaña guardada ✓',
      edit_bar_label: 'Editando:',
      edit_bar_reset: '↺ Restablecer parámetros',
      edit_bar_exit: '✕ Salir',
      btn_update_camp: '💾 Actualizar campaña',
      btn_updated: '✓ Actualizado',
      audit_saved: 'Campaña actualizada ✓',
    },
  };
  ['ru','en','mn','es'].forEach(lang => {
    if (typeof LANG !== 'undefined' && LANG[lang]) {
      Object.assign(LANG[lang], extra[lang]);
    }
  });
})();

// ══════════════════════════════════════════════════════════════════════
// SAVED CAMPAIGNS — localStorage CRUD
// ══════════════════════════════════════════════════════════════════════
const CAMPS_KEY = 'bonusCampaigns';

// ══════════════════════════════════════════════════════════════════════
// EDIT MODE STATE
// ══════════════════════════════════════════════════════════════════════
window._editMode = { active: false, campaignId: null, originalCampaign: null };

// ══════════════════════════════════════════════════════════════════════
// ECONOMICS HELPERS
// ══════════════════════════════════════════════════════════════════════
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

function _verdictBadge(verdict) {
  const map = {
    cheap: { label:'Слабый',     color:'#8892a4', style:'background:rgba(148,163,184,.12);color:#8892a4' },
    ok:    { label:'OK ✓',       color:'#10b981', style:'background:rgba(16,185,129,.12);color:#10b981' },
    warn:  { label:'Риск ⚠',    color:'#f59e0b', style:'background:rgba(245,158,11,.12);color:#f59e0b' },
    high:  { label:'Высокий ✕', color:'#ef4444', style:'background:rgba(239,68,68,.12);color:#ef4444' },
  };
  return map[verdict] || map.ok;
}

function _captureEconomics() {
  const cfg = window._lastCfg;
  if (!cfg || !cfg.econ) return null;
  const E  = cfg.econ;
  const pl = cfg.pl || S.players;
  // Use live recalc costs if available (reflects override edits)
  const rc = cfg._recalcCosts;
  const ratio = rc ? (cfg._recalcRatio || E.costRatio || 0) : (E.costRatio || 0);
  // wagerX: prefer live override input value if present
  const ovWager = parseFloat(document.getElementById('ov_w_wager')?.value);
  const wagerX  = (!isNaN(ovWager) && ovWager > 0) ? ovWager : (E.wagerX || 0);
  return {
    costRatio: ratio,
    verdict:   _ratioVerdict(ratio),
    p10Cost:   rc ? rc.w_p10 : Math.round((E.sP10?.cost || 0) * pl),
    p50Cost:   rc ? rc.w_p50 : Math.round((E.sP50?.cost || 0) * pl),
    p90Cost:   rc ? rc.w_p90 : Math.round((E.sP90?.cost || 0) * pl),
    p50Conv:   E.sP50?.conv  || 0,
    arpu:      E.arpu        || S.avgdep,
    ltv3:      E.ltv3        || 0,
    roi:       E.roi         || 0,
    wagerX,
    breakeven: E.breakeven_wager || 0,
    cur:       cfg.cur       || S.sitecur,
  };
}

// ══════════════════════════════════════════════════════════════════════
// INTERCEPT /api/recalc — keep _lastCfg in sync with override edits
// ══════════════════════════════════════════════════════════════════════
(function patchFetchForRecalc() {
  const _origFetch = window.fetch;
  window.fetch = async function(url, opts) {
    const res = await _origFetch.apply(this, arguments);
    if (typeof url === 'string' && url.includes('/api/recalc')) {
      res.clone().json().then(data => {
        if (window._lastCfg) {
          window._lastCfg._recalcCosts = data.costs;
          window._lastCfg._recalcRatio = data.ratio;
        }
        if (window._editMode?.active) {
          // Slight delay so DOM updates from recalcEcon finish first
          setTimeout(() => renderAuditPanel(), 120);
        }
      }).catch(() => {});
    }
    return res;
  };
})();

// All override input IDs that can be saved/restored per campaign
const _OV_IDS = [
  'ov_w_wager','ov_w_maxB','ov_w_mind','ov_w_fs','ov_w_pct','ov_w_days',
  'ov_rl_wager','ov_rl_maxB','ov_rl_fs','ov_rl_pct',
  'ov_d2_wager','ov_d2_maxB','ov_d2_fs','ov_d2_pct',
  'ov_d3_wager','ov_d3_maxB','ov_d3_fs','ov_d3_pct',
  'ov_ndb_wager','ov_ndb_fs','ov_ndb_amt',
  'ov_fs_wager','ov_fs_count',
];

function _captureOverrides() {
  const out = {};
  _OV_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value !== '') out[id] = el.value;
  });
  return Object.keys(out).length ? out : null;
}

function _applyOverrides(overrides) {
  if (!overrides) return;
  Object.entries(overrides).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
  if (typeof recalcEcon === 'function') recalcEcon();
}

function _loadCampsStore() {
  try { return JSON.parse(localStorage.getItem(CAMPS_KEY) || '[]'); }
  catch(e) { return []; }
}
function _saveCampsStore(arr) {
  try { localStorage.setItem(CAMPS_KEY, JSON.stringify(arr)); } catch(e) {}
}

function saveCampaignToStorage(name) {
  if (!S.region || !window._lastCfg) return false;
  const cfg = window._lastCfg;
  const campaign = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.trim() || 'Campaign',
    createdAt: new Date().toISOString(),
    // form state
    params: {
      region:   S.region,
      players:  S.players,
      avgdep:   S.avgdep,
      sitecur:  S.sitecur,
      depcur:   S.depcur,
      lic:      S.lic,
      plat:     S.plat,
      rtp:      S.rtp,
      segment:  S.segment || 'mid',
      lang:     typeof L !== 'undefined' ? L : 'ru',
    },
    // key mechanics from generated config
    mechanics: cfg.welcome ? {
      type:   cfg.welcome.type,
      pct:    cfg.welcome.pct,
      maxB:   cfg.welcome.maxB,
      wager:  cfg.wager ? cfg.wager.wW : null,
      cur:    cfg.welcome.cur || S.sitecur,
    } : null,
    economics: _captureEconomics(),
    overrides: _captureOverrides(),
    updatedAt: null,
  };

  const arr = _loadCampsStore();
  arr.unshift(campaign);              // newest first
  _saveCampsStore(arr);
  _updateCampsCount();
  return campaign.id;
}

function deleteSavedCampaign(id) {
  const arr = _loadCampsStore().filter(c => c.id !== id);
  _saveCampsStore(arr);
  _updateCampsCount();
  renderCampaignsDrawer();
}

function _updateCampsCount() {
  const arr = _loadCampsStore();
  const badge = document.getElementById('camps-count');
  if (!badge) return;
  if (arr.length > 0) {
    badge.textContent = arr.length;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// ══════════════════════════════════════════════════════════════════════
// OPEN SAVED CAMPAIGN IN CONFIGURATOR
// (same page — just re-apply params and enter edit mode)
// ══════════════════════════════════════════════════════════════════════

function _applyParamsFromCampaign(campaign) {
  const p = campaign.params;
  if (p.region) pickRegion(p.region);
  if (p.avgdep  != null) { const el = document.getElementById('avgdep');  if(el){el.value=p.avgdep;  S.avgdep=p.avgdep;} }
  if (p.sitecur)         { const el = document.getElementById('sitecur'); if(el){el.value=p.sitecur; S.sitecur=p.sitecur;} }
  if (p.depcur)          { const el = document.getElementById('depcur');  if(el){el.value=p.depcur;  S.depcur=p.depcur;} }
  if (p.players != null) {
    const rng = document.getElementById('prange');
    const num = document.getElementById('pnum');
    const dsp = document.getElementById('pdsp');
    if (rng) rng.value = Math.min(p.players, parseInt(rng.max||50000));
    if (num) num.value = p.players;
    if (dsp) dsp.textContent = Number(p.players).toLocaleString('ru');
    S.players = p.players;
  }
  if (p.lic)     setChip('lic',     p.lic);
  if (p.plat)    setChip('plat',    p.plat);
  if (p.segment) setChip('segment', p.segment);
  if (p.rtp  != null) syncRtp(p.rtp);
  if (p.lang && typeof setLang === 'function') setLang(p.lang);
}

function _setEditMode(campaign) {
  window._editMode = {
    active: true,
    campaignId: campaign.id,
    originalCampaign: JSON.parse(JSON.stringify(campaign)),
  };
  const nameEl = document.getElementById('edit-bar-name');
  if (nameEl) nameEl.textContent = campaign.name;
  document.getElementById('edit-mode-bar').style.display = 'flex';
}

function _clearEditMode() {
  window._editMode = { active: false, campaignId: null, originalCampaign: null };
  document.getElementById('edit-mode-bar').style.display = 'none';
  const panel = document.getElementById('audit-panel');
  if (panel) panel.remove();
}

function exitEditMode() {
  _clearEditMode();
}

function resetToOriginal() {
  const orig = window._editMode?.originalCampaign;
  if (!orig) return;
  const panel = document.getElementById('audit-panel');
  if (panel) panel.remove();
  if (window._lastCfg) { delete window._lastCfg._recalcCosts; delete window._lastCfg._recalcRatio; }
  _applyParamsFromCampaign(orig);
  setTimeout(() => {
    generate().then(() => {
      if (orig.overrides && Object.keys(orig.overrides).length) {
        _applyOverrides(orig.overrides);
      }
    });
  }, 80);
}

function openCampaignInConfigurator(campaign) {
  _applyParamsFromCampaign(campaign);
  closeCampaignsDrawer();
  _setEditMode(campaign);

  setTimeout(() => {
    generate().then(() => {
      // Restore saved overrides (wager, maxB, minDep, FS per bonus)
      if (campaign.overrides && Object.keys(campaign.overrides).length) {
        _applyOverrides(campaign.overrides);
      } else if (campaign.mechanics?.wager) {
        // Fallback: apply wager override from mechanics if no full overrides snapshot
        const ovw = document.getElementById('ov_w_wager');
        if (ovw) { ovw.value = campaign.mechanics.wager; recalcEcon(); }
      }
      if (window.innerWidth <= 768) {
        document.querySelector('.right')?.scrollIntoView({ behavior:'smooth', block:'start' });
      }
    });
  }, 80);
}

// ══════════════════════════════════════════════════════════════════════
// DRAWER UI
// ══════════════════════════════════════════════════════════════════════
function openCampaignsDrawer() {
  renderCampaignsDrawer();
  document.getElementById('campsOverlay').classList.add('open');
  document.getElementById('campsDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCampaignsDrawer() {
  document.getElementById('campsOverlay').classList.remove('open');
  document.getElementById('campsDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCampaignsDrawer() {
  const arr = _loadCampsStore();
  const body = document.getElementById('campsBody');
  if (!body) return;

  if (arr.length === 0) {
    body.innerHTML = `
      <div class="camps-empty">
        <div class="camps-empty-ico">📭</div>
        <div class="camps-empty-t" data-i18n="camps_empty_t">Нет сохранённых кампаний</div>
        <div class="camps-empty-s" data-i18n="camps_empty_s">Сгенерируйте конфиг и нажмите «Сохранить кампанию»</div>
      </div>`;
    if (typeof relabel === 'function') relabel();
    return;
  }

  const regionLabel = {
    cis:'СНГ', eu:'EU/UK', crypto:'Crypto', sweep:'USA Sweep', mn:'Монголия', latam:'LatAm'
  };

  body.innerHTML = arr.map(c => {
    const date = new Date(c.createdAt).toLocaleDateString('ru', { day:'2-digit', month:'short', year:'numeric' });
    const mechStr = c.mechanics
      ? `${c.mechanics.pct}% / ${c.mechanics.maxB?.toLocaleString?.() ?? c.mechanics.maxB} ${c.mechanics.cur}`
      : '';
    const wagerStr = c.mechanics?.wager ? `x${c.mechanics.wager}` : '';
    return `
      <div class="camp-card" id="cc-${c.id}">
        <div class="camp-card-top">
          <div class="camp-card-name">${_esc(c.name)}</div>
          <button class="camp-card-del" onclick="deleteSavedCampaign('${c.id}')" title="Удалить">✕</button>
        </div>
        <div class="camp-card-meta">
          <span class="camp-badge camp-badge-region">${regionLabel[c.params.region] || c.params.region}</span>
          ${c.params.lic && c.params.lic !== 'none' ? `<span class="camp-badge camp-badge-lic">${c.params.lic.toUpperCase()}</span>` : ''}
          ${mechStr ? `<span class="camp-badge camp-badge-dep">${mechStr}</span>` : ''}
          ${wagerStr ? `<span class="camp-badge" style="background:rgba(124,58,237,.12);color:#a78bfa">${wagerStr}</span>` : ''}
        </div>
        <div class="camp-card-date">${date} · avg dep: ${c.params.avgdep} ${c.params.depcur} · ${c.params.players?.toLocaleString?.() ?? c.params.players} players</div>
        <div class="camp-card-actions">
          <button class="camp-btn camp-btn-open" onclick="openCampaignInConfigurator(${JSON.stringify(c).replace(/"/g,'&quot;')})" data-i18n="camp_open">Открыть в конфигураторе</button>
        </div>
      </div>`;
  }).join('');

  if (typeof relabel === 'function') relabel();
}

// ══════════════════════════════════════════════════════════════════════
// SAVE MODAL
// ══════════════════════════════════════════════════════════════════════
function openSaveModal() {
  if (!S.region || !window._lastCfg) return;
  // Suggest name from region + date
  const regionLabel = { cis:'CIS', eu:'EU', crypto:'Crypto', sweep:'Sweep', mn:'MN', latam:'LatAm' };
  const mo = new Date().toLocaleString('en', { month:'short', year:'numeric' });
  const suggested = `${regionLabel[S.region] || S.region} Bonus ${mo}`;
  document.getElementById('campNameInput').value = suggested;
  document.getElementById('saveModal').classList.add('open');
  setTimeout(() => {
    const inp = document.getElementById('campNameInput');
    if (inp) { inp.focus(); inp.select(); }
  }, 60);
}
function closeSaveModal() {
  document.getElementById('saveModal').classList.remove('open');
}
function confirmSaveCampaign() {
  const name = document.getElementById('campNameInput').value.trim();
  if (!name) return;
  saveCampaignToStorage(name);
  closeSaveModal();
  // Update save button
  const btn = document.getElementById('btn-save-camp');
  if (btn) {
    btn.classList.add('saved');
    btn.textContent = typeof t === 'function' ? t('camp_saved_toast') : 'Saved ✓';
    setTimeout(() => {
      btn.classList.remove('saved');
      btn.textContent = typeof t === 'function' ? t('btn_save_camp') : '💾 Save Campaign';
    }, 2500);
  }
  // Show toast
  _showToast(typeof t === 'function' ? t('camp_saved_toast') : 'Campaign saved ✓');
}

// ══════════════════════════════════════════════════════════════════════
// PATCH generate() to inject Save button into output header
// ══════════════════════════════════════════════════════════════════════
(function patchGenerate() {
  const _orig = window.generate;
  window.generate = async function() {
    // Clear stale recalc data before fresh generation
    if (window._lastCfg) {
      delete window._lastCfg._recalcCosts;
      delete window._lastCfg._recalcRatio;
    }
    await _orig.apply(this, arguments);
    _injectSaveButton();
    _injectBalancePanel();
    if (window._editMode?.active) {
      // If campaign has saved overrides, apply them then audit will render via recalc intercept
      const orig = window._editMode.originalCampaign;
      if (orig?.overrides && Object.keys(orig.overrides).length) {
        setTimeout(() => _applyOverrides(orig.overrides), 200);
      } else {
        setTimeout(() => renderAuditPanel(), 350);
      }
    }
  };
})();

function _injectSaveButton() {
  const oh = document.querySelector('#out .oh');
  if (!oh) return;
  // Always re-inject so label/handler updates when edit mode changes
  const existing = document.getElementById('btn-save-camp');
  if (existing) existing.remove();

  const actionsDiv = oh.querySelector('div:last-child');
  if (!actionsDiv) return;

  const btn = document.createElement('button');
  btn.id = 'btn-save-camp';
  btn.className = 'btn-save-camp';

  if (window._editMode?.active) {
    btn.style.cssText = 'background:rgba(245,158,11,.15);color:#f59e0b;border-color:rgba(245,158,11,.4)';
    btn.textContent = typeof t === 'function' ? t('btn_update_camp') : '💾 Update Campaign';
    btn.onclick = updateSavedCampaign;
  } else {
    btn.textContent = typeof t === 'function' ? t('btn_save_camp') : '💾 Save Campaign';
    btn.onclick = openSaveModal;
  }

  actionsDiv.insertBefore(btn, actionsDiv.firstChild);
}

// ══════════════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════════════
function _showToast(msg, type) {
  const existing = document.getElementById('cfg-toast');
  if (existing) existing.remove();
  const bg = type === 'warn' ? '#f59e0b' : type === 'err' ? '#ef4444' : '#10b981';
  const toast = document.createElement('div');
  toast.id = 'cfg-toast';
  toast.textContent = msg;
  Object.assign(toast.style, {
    position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%) translateY(0)',
    background: bg, color:'#fff', padding:'10px 22px', borderRadius:'10px',
    fontSize:'13px', fontWeight:'700', zIndex:'999', boxShadow:'0 4px 20px rgba(0,0,0,.4)',
    transition:'opacity .3s', fontFamily:'Inter,sans-serif', maxWidth:'420px', textAlign:'center',
  });
  document.body.appendChild(toast);
  const delay = type === 'warn' ? 4000 : 2200;
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 320); }, delay);
}

// ══════════════════════════════════════════════════════════════════════
// UPDATE SAVED CAMPAIGN (edit mode save)
// ══════════════════════════════════════════════════════════════════════
function updateSavedCampaign() {
  if (!window._editMode?.active || !window._lastCfg) return;
  const id  = window._editMode.campaignId;
  const arr = _loadCampsStore();
  const idx = arr.findIndex(c => c.id === id);
  if (idx === -1) return;

  const cfg = window._lastCfg;
  arr[idx] = {
    ...arr[idx],
    updatedAt: new Date().toISOString(),
    params: {
      region:   S.region,
      players:  S.players,
      avgdep:   S.avgdep,
      sitecur:  S.sitecur,
      depcur:   S.depcur,
      lic:      S.lic,
      plat:     S.plat,
      rtp:      S.rtp,
      segment:  S.segment || 'mid',
      lang:     typeof L !== 'undefined' ? L : 'ru',
    },
    mechanics: cfg.welcome ? {
      type:  cfg.welcome.type,
      pct:   cfg.welcome.pct,
      maxB:  cfg.welcome.maxB,
      wager: cfg.wager ? cfg.wager.wW : null,
      cur:   cfg.welcome.cur || S.sitecur,
    } : arr[idx].mechanics,
    economics: _captureEconomics(),
    overrides: _captureOverrides(),
  };

  _saveCampsStore(arr);
  _updateCampsCount();

  // Update originalCampaign so Reset now resets to this saved state
  window._editMode.originalCampaign = JSON.parse(JSON.stringify(arr[idx]));

  const btn = document.getElementById('btn-save-camp');
  if (btn) {
    btn.textContent = typeof t === 'function' ? t('btn_updated') : '✓ Updated';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = typeof t === 'function' ? t('btn_update_camp') : '💾 Update Campaign'; btn.disabled = false; }, 2000);
  }
  _showToast(typeof t === 'function' ? t('audit_saved') : 'Campaign updated ✓');

  const panel = document.getElementById('audit-panel');
  if (panel) panel.remove();
}

// ══════════════════════════════════════════════════════════════════════
// AUDIT PANEL — render diff + before/after econ + verdicts
// ══════════════════════════════════════════════════════════════════════
function renderAuditPanel() {
  const orig = window._editMode?.originalCampaign;
  const cfg  = window._lastCfg;
  if (!orig || !cfg) return;

  const existing = document.getElementById('audit-panel');
  if (existing) existing.remove();

  const origP = orig.params;
  const origE = orig.economics || null;
  const newE  = _captureEconomics();
  const cur   = newE?.cur || S.sitecur;

  const paramDiffs = _buildParamDiff(origP, newE, origE);
  const verdicts   = _buildVerdictItems(origP, origE, newE);
  const vBadge     = _verdictBadge(newE?.verdict);

  const panel = document.createElement('div');
  panel.id = 'audit-panel';

  panel.innerHTML = `
    <div class="audit-head">
      <span class="audit-head-ico">📊</span>
      <span class="audit-head-title">Аудит изменений: ${_esc(orig.name)}</span>
      <span class="audit-head-badge" style="${vBadge.style}">${vBadge.label}</span>
    </div>

    <div class="audit-section">
      <div class="audit-section-title">Изменённые параметры</div>
      ${paramDiffs.length > 0
        ? paramDiffs.map(d => `
          <div class="audit-diff-row">
            <span class="audit-diff-key">${d.label}</span>
            <span class="audit-diff-val">
              <span class="audit-before">${d.before}</span>
              <span class="audit-arrow">→</span>
              <span class="audit-after">${d.after}</span>
              <span class="audit-delta ${d.deltaClass}">${d.delta}</span>
            </span>
          </div>`).join('')
        : '<div style="font-size:12px;color:#8892a4;padding:4px 0">Параметры не изменились — пересчёт с теми же значениями</div>'
      }
    </div>

    <div class="audit-section">
      <div class="audit-section-title">Пересчёт экономики</div>
      <div class="audit-econ-grid">
        ${_econCard('P10', origE?.p10Cost, newE?.p10Cost, cur, false)}
        ${_econCard('P50', origE?.p50Cost, newE?.p50Cost, cur, false)}
        ${_econCard('P90', origE?.p90Cost, newE?.p90Cost, cur, false)}
      </div>
      ${_ratioRow(origE, newE)}
      ${_chainSection(cfg)}
    </div>

    <div class="audit-section">
      <div class="audit-section-title">Прогнозы (новые)</div>
      <div class="audit-econ-grid">
        ${_forecastCard('P10 · консерв.', newE?.p10Cost, cur)}
        ${_forecastCard('P50 · базовый',  newE?.p50Cost, cur)}
        ${_forecastCard('P90 · оптимист.',newE?.p90Cost, cur)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px">
        ${_metricCard('ARPU',      _fmtCur(newE?.arpu, cur),             origE ? _fmtCur(origE.arpu, origE.cur) : null)}
        ${_metricCard('ROI',       newE?.roi      ? newE.roi.toFixed(1)+'×'      : '—', origE?.roi      ? origE.roi.toFixed(1)+'×'      : null)}
        ${_metricCard('Breakeven', newE?.breakeven ? newE.breakeven+'×'           : '—', origE?.breakeven ? origE.breakeven+'×'           : null)}
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
      <button class="audit-action-btn audit-btn-save"  onclick="updateSavedCampaign()">💾 Сохранить изменения</button>
      <button class="audit-action-btn audit-btn-reset" onclick="resetToOriginal()">↺ Сбросить до оригинала</button>
    </div>
  `;

  document.getElementById('out').appendChild(panel);
}

// ── Param diff ────────────────────────────────────────────────────────
function _buildParamDiff(origP, newE, origE) {
  const diffs = [];
  const curr = { region: S.region, players: S.players, avgdep: S.avgdep, lic: S.lic, plat: S.plat, rtp: S.rtp };
  const regionLabel = { cis:'СНГ', eu:'EU/UK', crypto:'Crypto', sweep:'USA Sweep', mn:'Монголия', latam:'LatAm' };
  const platLabel   = { both:'Desktop+Mobile', mobile:'Mobile Only', desk:'Desktop Only' };

  const pctDelta = (a, b) => a && b ? (((b-a)/a)*100).toFixed(0)+'%' : null;
  const numDiff  = (key, label, fmt, higherIsBad) => {
    const a = origP[key], b = curr[key];
    if (a == null || b == null || String(a) === String(b)) return;
    const d = pctDelta(Number(a), Number(b));
    const up = Number(b) > Number(a);
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
  if (origP.plat !== curr.plat && origP.plat && curr.plat)
    diffs.push({ label:'Платформа', before: platLabel[origP.plat]||origP.plat, after: platLabel[curr.plat]||curr.plat, delta:'changed', deltaClass:'delta-neutral' });

  numDiff('players', 'Игроков/мес', v => Number(v).toLocaleString('ru'), true);
  numDiff('avgdep',  'Avg Deposit', v => v + ' ' + (S.depcur||''), true);
  numDiff('rtp',     'RTP',         v => v + '%', false);

  if (origE?.wagerX != null && newE?.wagerX != null && origE.wagerX !== newE.wagerX) {
    const a = origE.wagerX, b = newE.wagerX;
    const d = pctDelta(a, b);
    diffs.push({
      label:'Вейджер', before: a+'×', after: b+'×',
      delta: (b>a?'↑':'↓') + Math.abs(d),
      deltaClass: b > a ? 'delta-up' : 'delta-down',
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

  if (origE?.wagerX && newE.wagerX && origE.wagerX !== newE.wagerX) {
    if (newE.wagerX < origE.wagerX) {
      items.push({ type:'ok', icon:'✓', text: `Вейджер снижен (${origE.wagerX}× → ${newE.wagerX}×) — оффер стал привлекательнее, конверсия вырастет.` });
    } else {
      const overBe = newE.breakeven && newE.wagerX > newE.breakeven;
      items.push({ type: overBe ? 'warn' : 'info', icon: overBe ? '⚠️' : 'ℹ️',
        text: `Вейджер вырос (${origE.wagerX}× → ${newE.wagerX}×).${overBe ? ' Превышает breakeven — EV для игрока отрицательный.' : ' Проверьте конверсию на фокус-группе.'}` });
    }
  }

  if (newE.breakeven && newE.wagerX > newE.breakeven) {
    items.push({ type:'warn', icon:'⚠️', text: `Вейджер ${newE.wagerX}× превышает breakeven ${newE.breakeven}×. Игроки с низким балансом не смогут отыграть бонус — риск жалоб.` });
  }

  if (origP.players && S.players > origP.players * 1.5) {
    const ratio = (S.players / origP.players).toFixed(1);
    items.push({ type:'info', icon:'ℹ️', text: `Количество игроков выросло в ${ratio}×. Бюджет кампании масштабируется пропорционально — проверьте P90 сценарий.` });
  }

  if (origP.avgdep && Math.abs(S.avgdep - origP.avgdep) / origP.avgdep > 0.3) {
    items.push({ type:'info', icon:'ℹ️', text: `Средний депозит изменился с ${origP.avgdep} на ${S.avgdep} ${S.depcur} — сегмент игроков другой. Убедитесь, что механика бонуса подходит новому сегменту.` });
  }

  if (items.length === 0) {
    items.push({ type:'ok', icon:'✓', text: 'Параметры пересчитаны. Значимых рисков не обнаружено.' });
  }
  return items;
}

// ── Card / row helpers ────────────────────────────────────────────────
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

function _chainSection(cfg) {
  const ch = cfg?.econ?.chain;
  if (!ch || !ch.chainCost) return '';
  const cur = cfg.cur || '';
  const fmt = n => Math.round(n).toLocaleString('en') + ' ' + cur;
  const rClr = ch.chainCostRatio < 0.10 ? '#10b981' : ch.chainCostRatio < 0.25 ? '#10b981' : ch.chainCostRatio < 0.40 ? '#f59e0b' : '#ef4444';
  const stepLbls = { welcome: t('chain_step_welcome'), dep2: t('chain_step_dep2'), dep3: t('chain_step_dep3') };
  const stepRows = (ch.steps || []).filter(s => s.cost > 0).map(s => `
    <div style="display:flex;align-items:baseline;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:11px">
      <span style="color:#8892a4;flex:1">${stepLbls[s.key] || s.key}</span>
      <span style="color:#8892a4;margin:0 8px;font-size:10px">×${Math.round(s.cohort*100)}% ${t('chain_cohort')}</span>
      <span style="font-family:monospace;font-weight:700;color:#e2e8f0">${fmt(s.cost)}</span>
    </div>`).join('');
  return `<div style="margin-top:10px;padding:9px 11px;background:rgba(160,176,255,.04);border-radius:8px;border:1px solid rgba(160,176,255,.13)">
    <div style="font-size:10px;font-weight:700;color:#a0b0ff;margin-bottom:6px">⛓ ${t('chain_title')}</div>
    ${stepRows}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:5px;padding-top:5px;border-top:1px solid rgba(255,255,255,.08)">
      <span style="font-size:11px;font-weight:700;color:#e2e8f0">${t('chain_total')}</span>
      <span style="font-family:monospace;font-weight:800;color:#e2e8f0">${fmt(ch.chainCost)}</span>
      <span style="font-size:11px;font-weight:700;color:${rClr};margin-left:8px">${(ch.chainCostRatio*100).toFixed(1)}% ${t('chain_ratio_lbl')}</span>
    </div>
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

// ══════════════════════════════════════════════════════════════════════
// CLOSE MODAL on overlay click
// ══════════════════════════════════════════════════════════════════════
document.getElementById('saveModal').addEventListener('click', function(e) {
  if (e.target === this) closeSaveModal();
});

// ESC closes drawer and modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeSaveModal();
    closeCampaignsDrawer();
  }
});

// Init count badge on load
document.addEventListener('DOMContentLoaded', function() {
  _updateCampsCount();
  updateAllBadges();
});

// Update campaign and tournament badges across pages
function updateAllBadges() {
  try {
    const camps = JSON.parse(localStorage.getItem('be_campaigns') || '[]');
    const campBadge = document.getElementById('camp-nav-badge');
    if (campBadge) {
      campBadge.textContent = camps.length;
      campBadge.style.display = camps.length > 0 ? 'inline' : 'none';
    }
  } catch (e) {}
  try {
    const tourns = JSON.parse(localStorage.getItem('savedTournaments') || '[]');
    const tournBadge = document.getElementById('nav-tourn-badge');
    if (tournBadge) {
      tournBadge.textContent = tourns.length;
      tournBadge.style.display = tourns.length > 0 ? 'inline' : 'none';
    }
  } catch (e) {}
}

// ══════════════════════════════════════════════════════════════════════
// BALANCE / SOLVER — state + helpers
// ══════════════════════════════════════════════════════════════════════
window._lastAiRecs    = null;   // latest AI optimize recommendations
window._beforeBalance = null;   // { overrides, econ } snapshot before apply/balance

function _getTargetMargin() {
  const el = document.getElementById('cfg-margin-slider');
  return el ? parseInt(el.value, 10) / 100 : 0.10;
}

function _captureIncrEcon() {
  const cfg = window._lastCfg;
  if (!cfg || !cfg.econ) return null;
  const E     = cfg.econ;
  const ratio = cfg._recalcRatio ?? E.costRatio ?? 0;
  const ovWager = parseFloat(document.getElementById('ov_w_wager')?.value);
  const v     = (typeof _calcRetentionV2 === 'function')
    ? _calcRetentionV2(cfg, isNaN(ovWager) ? 0 : ovWager)
    : { lift: 0 };
  const incrPl   = Math.round(E.pl * v.lift);
  const incrRev  = Math.round(incrPl * (E.ltv3 || 0));
  const campCost = Math.round(3 * ratio * E.pl * E.arpu);
  const netIncr  = incrRev - campCost;
  return { netIncr, incrRev, campCost, lift: v.lift, ratio, cur: cfg.cur || (typeof S !== 'undefined' ? S.sitecur : '') };
}

function _buildSolverDraft() {
  const cfg = window._lastCfg;
  if (!cfg) return null;
  const E  = cfg.econ     || {};
  const W  = cfg.welcome  || {};
  const RL = cfg.reload   || {};
  const FS = cfg.fsSpec   || null;
  const CB = cfg.cashback || {};

  const gvEl = (id, def) => {
    const el = document.getElementById(id);
    const v  = el ? parseFloat(el.value) : NaN;
    return isNaN(v) ? def : v;
  };

  return {
    wager:       gvEl('ov_w_wager', E.wagerX || 30),
    matchPct:    gvEl('ov_w_pct',   W.pct    || 100),
    addFS:       gvEl('ov_w_fs',    W.fs     || 0) > 0 || gvEl('ov_fs_count', FS ? FS.count : 0) > 0,
    addCashback: (CB.pct >= 5) || CB.model === 'tier',
    addReload:   gvEl('ov_rl_pct',  RL.pct   || 0) > 0,
    segment:     (typeof S !== 'undefined' ? S.segment : '') || 'mid',
    plat:        (typeof S !== 'undefined' ? S.plat    : '') || 'both',
  };
}

function _applyDraftToDOM(draft) {
  function _setOv(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }
  if (draft.wager    != null)        _setOv('ov_w_wager', draft.wager);
  if (draft.matchPct != null)        _setOv('ov_w_pct',   draft.matchPct);
  if (draft.addFS    === false) { _setOv('ov_w_fs', 0); _setOv('ov_fs_count', 0); }
  if (draft.addReload === false)     _setOv('ov_rl_pct',  0);
  if (typeof recalcEcon === 'function') recalcEcon();
}

// ── parseRecTarget ────────────────────────────────────────────────────────────
// Delegates to bonus-cost.js module export (available via window._bonusCost after module load).
function parseRecTarget(param, target) {
  if (window._bonusCost && window._bonusCost.parseRecTarget) {
    return window._bonusCost.parseRecTarget(param, target);
  }
  // Fallback (module not yet loaded) — handle the most common case
  const num = parseFloat(target);
  if (param === 'wager'    && !isNaN(num)) return { 'ov_w_wager': num };
  if (param === 'matchPct' && !isNaN(num)) return { 'ov_w_pct':   num };
  return {};
}

// ── applyAiRecs ───────────────────────────────────────────────────────────────
function applyAiRecs(recs) {
  if (!recs || !recs.length || !window._lastCfg) return;
  const beforeOverrides = _captureOverrides();
  const beforeEcon      = _captureIncrEcon();
  window._beforeBalance = { overrides: beforeOverrides, econ: beforeEcon };

  recs.forEach(rec => {
    const pairs = parseRecTarget(rec.param, rec.target);
    Object.entries(pairs).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });
  });

  if (typeof recalcEcon === 'function') recalcEcon();
  setTimeout(() => finishApply(beforeOverrides, beforeEcon), 350);
}

// ── balanceToProfit ───────────────────────────────────────────────────────────
function balanceToProfit(targetMargin) {
  const cfg = window._lastCfg;
  if (!cfg) return;

  const bonusCost   = window._bonusCost;
  const solverLib   = window._balanceSolver;
  if (!bonusCost || !solverLib) {
    _showToast('Balance solver not loaded yet — please try again');
    return;
  }

  const BONUS_LEVERS = [
    { p: 'wager',       mode: 'add',  f: +5,  bounds: { min: 1,  max: 200 }, isInt: true },
    { p: 'addFS',       mode: 'enum', enum: [true, false] },
    { p: 'addCashback', mode: 'enum', enum: [true, false] },
    { p: 'addReload',   mode: 'enum', enum: [true, false] },
    { p: 'matchPct',    mode: 'add',  f: -10, bounds: { min: 0,  max: 200 }, isInt: true },
  ];

  const beforeOverrides = _captureOverrides();
  const beforeEcon      = _captureIncrEcon();
  window._beforeBalance = { overrides: beforeOverrides, econ: beforeEcon };

  const draft       = _buildSolverDraft();
  const constraints = bonusCost.buildRegConstraints(cfg);
  const recalc      = d => bonusCost.recalcBonusEconLocal(cfg, d);
  const metricOf    = e => e.netIncr;

  // Target: netIncr must exceed campCost × targetMargin
  const initialEcon = recalc(draft);
  const target      = Math.max(0, initialEcon.campCost * targetMargin);

  const btn = document.getElementById('cfg-balance-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳'; }

  setTimeout(() => {
    const { reached, draft: solvedDraft, econ: solvedEcon } = solverLib.solveToTarget({
      draft, levers: BONUS_LEVERS, recalc, metricOf, target, constraints, cfg, maxIter: 120,
    });

    if (!reached) {
      if (btn) { btn.disabled = false; btn.textContent = typeof t === 'function' ? t('balance_profit') : '⚖️ Сбалансировать'; }
      _showToast(typeof t === 'function' ? t('cannot_balance_regulatory') : 'Cannot balance within regulatory limits', 'warn');
      window._beforeBalance = null;
      return;
    }

    _applyDraftToDOM(solvedDraft);
    if (btn) { btn.disabled = false; btn.textContent = typeof t === 'function' ? t('balance_profit') : '⚖️ Сбалансировать'; }
    finishApply(beforeOverrides, beforeEcon, solvedEcon);
  }, 0);
}

// ── finishApply ───────────────────────────────────────────────────────────────
function finishApply(beforeOverrides, beforeEcon, newEconHint) {
  const cfg   = window._lastCfg;
  if (!cfg) return;

  const newEcon = newEconHint || _captureIncrEcon();

  _renderBalanceDelta(beforeEcon, newEcon);
  _showUndoButton(true);
  _showToast(typeof t === 'function' ? t('balance_done') : 'Balanced ✓');
}

// ── _undoBalance ──────────────────────────────────────────────────────────────
function _undoBalance() {
  const snap = window._beforeBalance;
  if (!snap) return;

  _applyOverrides(snap.overrides || {});
  window._beforeBalance = null;
  _showUndoButton(false);

  const delta = document.getElementById('cfg-balance-delta');
  if (delta) delta.remove();
}

// ── Balance panel DOM helpers ─────────────────────────────────────────────────

function _showUndoButton(show) {
  const btn = document.getElementById('cfg-undo-btn');
  if (btn) btn.style.display = show ? 'inline-flex' : 'none';
}

function _updateApplyRecsButton() {
  const btn = document.getElementById('cfg-apply-recs');
  if (!btn) return;
  const hasRecs = window._lastAiRecs && window._lastAiRecs.length > 0;
  btn.disabled = !hasRecs;
  btn.style.opacity = hasRecs ? '1' : '0.45';
}

function _renderBalanceDelta(before, after) {
  const existing = document.getElementById('cfg-balance-delta');
  if (existing) existing.remove();
  if (!before || !after) return;

  const cur    = after.cur || '';
  const fmtU   = n => '$' + Math.abs(n).toLocaleString('ru') + ' ~USD';
  const netOld = fmtU(before.netIncr);
  const netNew = fmtU(after.netIncr);
  const netCls = after.netIncr >= 0 ? 'econ-improved' : 'econ-worsened';

  const delta = document.createElement('div');
  delta.id = 'cfg-balance-delta';
  delta.style.cssText = 'margin-top:8px;padding:8px 10px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:8px;font-size:11px';
  delta.innerHTML = `
    <div style="font-size:10px;color:#8892a4;font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">
      ${typeof t === 'function' ? t('balance_delta_title') : 'Balance result'}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
      ${_metricCard('Net Incr.', (after.netIncr >= 0 ? '+' : '−') + fmtU(after.netIncr), (before.netIncr >= 0 ? '+' : '−') + netOld)}
      ${_metricCard('Camp. Cost', fmtU(after.campCost), fmtU(before.campCost))}
      ${_metricCard('Lift', (after.lift * 100).toFixed(1) + '%', (before.lift * 100).toFixed(1) + '%')}
    </div>`;

  const panel = document.getElementById('cfg-balance-panel');
  if (panel) panel.after(delta);
}

function _injectBalancePanel() {
  const existing = document.getElementById('cfg-balance-panel');
  if (existing) existing.remove();
  const existingDelta = document.getElementById('cfg-balance-delta');
  if (existingDelta) existingDelta.remove();

  window._lastAiRecs    = null;
  window._beforeBalance = null;

  const anchor = document.getElementById('incr_net')?.closest('.pr');
  if (!anchor) return;

  const savedMargin = localStorage.getItem('cfg_target_margin') || '10';
  const marginVal   = parseInt(savedMargin, 10);

  const panel = document.createElement('div');
  panel.id = 'cfg-balance-panel';
  panel.style.cssText = 'margin-top:10px;padding:10px 0 4px;border-top:1px solid rgba(255,255,255,.07)';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap">
      <span style="font-size:10px;color:#8892a4;white-space:nowrap">${typeof t === 'function' ? t('target_margin') : 'Запас'}:</span>
      <input type="range" id="cfg-margin-slider" min="0" max="50" step="5" value="${marginVal}"
        style="flex:1;min-width:80px;max-width:120px;accent-color:#10b981;cursor:pointer"
        oninput="document.getElementById('cfg-margin-val').textContent='+'+this.value+'%';localStorage.setItem('cfg_target_margin',this.value)">
      <span id="cfg-margin-val" style="font-size:10px;color:#10b981;font-weight:700;min-width:30px">+${marginVal}%</span>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
      <button id="cfg-apply-recs"
        onclick="applyAiRecs(window._lastAiRecs)"
        disabled
        style="padding:5px 10px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid rgba(99,102,241,.4);background:rgba(99,102,241,.12);color:#a5b4fc;opacity:0.45;transition:all .15s">
        ${typeof t === 'function' ? t('apply_recs') : '⚡ Применить рекомендации'}
      </button>
      <button id="cfg-balance-btn"
        onclick="balanceToProfit(_getTargetMargin())"
        style="padding:5px 10px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid rgba(16,185,129,.4);background:rgba(16,185,129,.12);color:#34d399;transition:all .15s">
        ${typeof t === 'function' ? t('balance_profit') : '⚖️ Сбалансировать'}
      </button>
      <button id="cfg-undo-btn"
        onclick="_undoBalance()"
        style="display:none;padding:5px 10px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid rgba(245,158,11,.35);background:rgba(245,158,11,.1);color:#fbbf24;transition:all .15s">
        ${typeof t === 'function' ? t('undo') : '↩ Отменить'}
      </button>
    </div>`;

  anchor.after(panel);
}

// ── Patch _runOptimize to store AI recs and enable Apply button ───────────────
(function patchRunOptimize() {
  const _origFetch2 = window.fetch;
  window.fetch = async function(url, opts) {
    const res = await _origFetch2.apply(this, arguments);
    if (typeof url === 'string' && url.includes('/api/campaign/optimize')) {
      res.clone().json().then(data => {
        if (data && data.recommendations && data.recommendations.length) {
          window._lastAiRecs = data.recommendations;
          _updateApplyRecsButton();
        }
      }).catch(() => {});
    }
    return res;
  };
})();

// ── GLOSSARY ──────────────────────────────────────────────────────────────────
function toggleCfgGlossary() {
  let panel = document.getElementById('cfg-glossary-panel');
  if (panel) { panel.remove(); return; }

  const isRu = (typeof L !== 'undefined' && L === 'ru') || document.documentElement.lang === 'ru';
  const terms = [
    {name:'Вейджер / Wager',      ru:'Количество оборотов бонуса до вывода средств.',                     en:'Times bonus must be turned over before withdrawal.'},
    {name:'RTP',                   ru:'Доля ставок, возвращаемых игрокам в виде выигрышей.',               en:'% of total bets returned as winnings.'},
    {name:'WCR',                   ru:'Взвешенный RTP по реальной структуре ставок.',                      en:'Weighted RTP across actual bet mix.'},
    {name:'P10',                   ru:'Оптимистичный сценарий — только 10% исходов лучше.',                en:'Optimistic scenario — only 10% of outcomes are better.'},
    {name:'P50',                   ru:'Базовый сценарий (медиана). Используйте для бюджетирования.',       en:'Base scenario (median). Use for budget planning.'},
    {name:'P90',                   ru:'Пессимистичный — только 10% исходов хуже.',                        en:'Pessimistic — only 10% of outcomes are worse.'},
    {name:'Retention lift',        ru:'Прирост доли активных игроков от бонусной программы.',              en:'% increase in active player count from the bonus program.'},
    {name:'Cost ratio',            ru:'Выплаты по бонусам ÷ депозитный оборот (безразмерная).',           en:'Bonus payouts ÷ total deposit volume (dimensionless).'},
    {name:'Breakeven wager',       ru:'Вейджер, при котором ожидаемые выплаты = размер бонуса.',           en:'Wager at which expected payout equals bonus size.'},
    {name:'ARPU',                  ru:'Средняя выручка с игрока в месяц (USD бенчмарк).',                  en:'Average Revenue Per User per month (USD benchmark).'},
    {name:'CAC',                   ru:'Стоимость привлечения одного нового игрока (USD).',                 en:'Customer Acquisition Cost per new player (USD).'},
  ].map(t => `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="font-size:.78rem;font-weight:600;color:#e8eaf0;margin-bottom:1px">${t.name}</div>
    <div style="font-size:.72rem;color:#8892a4">${isRu ? t.ru : t.en}</div>
  </div>`).join('');

  panel = document.createElement('div');
  panel.id = 'cfg-glossary-panel';
  panel.style.cssText = 'position:fixed;top:54px;right:0;width:300px;max-height:calc(100vh - 54px);background:#0f1420;border-left:1px solid #1e2740;z-index:400;display:flex;flex-direction:column;box-shadow:-4px 0 24px rgba(0,0,0,.5);overflow:hidden';
  panel.innerHTML = `
    <div style="padding:12px 16px;border-bottom:1px solid #1e2740;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
      <span style="font-size:.88rem;font-weight:700;color:#e8eaf0">${isRu ? 'Глоссарий' : 'Glossary'}</span>
      <button onclick="document.getElementById('cfg-glossary-panel').remove()"
        style="background:none;border:none;color:#8892a4;cursor:pointer;font-size:18px;line-height:1;padding:0">&times;</button>
    </div>
    <div style="flex:1;overflow-y:auto;padding:4px 16px 16px">${terms}</div>`;
  document.body.appendChild(panel);

  setTimeout(() => {
    const close = (e) => {
      const p = document.getElementById('cfg-glossary-panel');
      if (p && !p.contains(e.target)) { p.remove(); document.removeEventListener('click', close); }
    };
    document.addEventListener('click', close);
  }, 50);
}
