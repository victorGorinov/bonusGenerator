import { loadAll, upsertCampaign, removeCampaign, getState, subscribe, setView } from './retention-calendar/store.js';
import { initCalendar, setCalendarView } from './retention-calendar/calendar.js';
import { applyFilters, toggleFilter, clearFilters } from './retention-calendar/filters.js';
import { saveAsTemplate, createFromTemplate, duplicateCampaign, getTemplates } from './retention-calendar/templates.js';
import { exportCSV, exportJSON } from './retention-calendar/export.js';
import { repo } from './retention-calendar/repository.js';
import { CAMPAIGN_TYPES, CAMPAIGN_STATUSES, SEGMENTS, TYPE_COLORS } from './retention-calendar/types.js';
import { getT } from './retention-calendar/i18n.js';
import { campaignFromAI, tournamentFromAI } from './retention-calendar/ai-to-campaign.js';
import { initForecastPanel, refreshForecast, toggleForecastPanel } from './retention-calendar/forecast-panel.js';

// ── State ────────────────────────────────────────────────────────────────────

let editingId    = null;   // currently open campaign in modal
let modalMode    = 'view'; // 'view'|'edit'|'new'|'template'|'ai'

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadAll();
  initCalendar(document.getElementById('calendar'), openCampaignModal, openDatePickerPopup);
  initForecastPanel();
  renderFilters();
  renderStats();
  subscribe(() => { renderStats(); renderFilters(); refreshForecast(); });
  setupSidebarNav();

  // Accept campaigns added from other generators via localStorage event
  window.addEventListener('storage', (e) => {
    if (e.key === 'rc_pending_campaign') {
      const raw = e.newValue;
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        localStorage.removeItem('rc_pending_campaign');
        openNewCampaignModal(data);
      } catch {}
    }
  });

  // Also handle same-tab postMessage from generators
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'rc_add_campaign') {
      openNewCampaignModal(e.data.campaign);
    }
  });
});

// ── View toggle (Month / Week / Agenda in topbar) ─────────────────────────────

function setupSidebarNav() {
  document.querySelectorAll('#view-toggle .vt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fcView = btn.dataset.fcView;
      setCalendarView(fcView);
      document.querySelectorAll('#view-toggle .vt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Slight delay so FullCalendar has updated its view before we read activeStart/activeEnd
      setTimeout(refreshForecast, 50);
    });
  });
}

window._rcToggleForecast = () => toggleForecastPanel();

// ── Date-click popup ──────────────────────────────────────────────────────────

function openDatePickerPopup(dateStr) {
  const t   = getT();
  const fmt = new Date(dateStr + 'T00:00:00').toLocaleDateString(
    undefined, { weekday: 'short', day: 'numeric', month: 'short' }
  );
  showModal(`
    <div class="modal-header">
      <div style="font-size:1rem;font-weight:700">${fmt}</div>
      <div style="font-size:.8rem;color:var(--muted);margin-top:2px">
        ${t.newCampaign.replace('+ ', '')} — выберите тип
      </div>
    </div>
    <div class="modal-body" style="gap:10px">
      <button class="rc-create-card" onclick="window._rcNewCampaignOnDate('${dateStr}')">
        <span style="font-size:1.5rem">🚀</span>
        <div>
          <div style="font-weight:700;margin-bottom:2px">Bonus Campaign</div>
          <div style="font-size:.78rem;color:var(--muted)">Reload, cashback, free spins, VIP, reactivation…</div>
        </div>
      </button>
      <button class="rc-create-card" onclick="window._rcNewTournamentOnDate('${dateStr}')">
        <span style="font-size:1.5rem">🏆</span>
        <div>
          <div style="font-weight:700;margin-bottom:2px">Tournament</div>
          <div style="font-size:.78rem;color:var(--muted)">Slots, live casino, prize drops, multi-round…</div>
        </div>
      </button>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline btn-sm" onclick="window._rcCloseModal()">${t.cancel}</button>
    </div>
  `);
}

window._rcNewCampaignOnDate = (dateStr) => {
  closeModal();
  const endDate = addDaysStr(dateStr, 6);
  openNewCampaignModal({ startDate: dateStr, endDate, sourceType: 'manual' });
};

window._rcNewTournamentOnDate = (dateStr) => {
  closeModal();
  // Pre-fill startDate via query param so TG can read it on load
  window.location.href = `/tournament-generator.html?view=generator&rcDate=${dateStr}`;
};

// ── Stats bar ─────────────────────────────────────────────────────────────────

function renderStats() {
  const { campaigns } = getState();
  const active    = campaigns.filter(c => c.status === 'active').length;
  const scheduled = campaigns.filter(c => c.status === 'scheduled').length;
  const el = document.getElementById('stats-bar');
  if (!el) return;
  el.textContent = `${campaigns.length} campaigns · ${active} active · ${scheduled} scheduled`;
}

// ── Filters UI ────────────────────────────────────────────────────────────────

function renderFilters() {
  const t = getT();
  const { filters, campaigns } = getState();

  const geos = [...new Set(campaigns.map(c => c.geo).filter(Boolean))].sort();
  const el   = document.getElementById('filters-bar');
  if (!el) return;

  el.innerHTML = `
    <button class="rc-filter-btn${!filters.types.length && !filters.segments.length && !filters.geos.length && !filters.statuses.length ? ' active' : ''}"
            onclick="window._rcClearFilters()">${t.filters}: All</button>
    ${CAMPAIGN_TYPES.map(t2 => `
      <button class="rc-filter-btn type-chip${filters.types.includes(t2.val) ? ' active' : ''}"
              style="--chip-color:${TYPE_COLORS[t2.val]}"
              onclick="window._rcToggleFilter('types','${t2.val}')">${t2.lbl}</button>
    `).join('')}
    <span class="rc-filter-sep">|</span>
    ${SEGMENTS.map(s => `
      <button class="rc-filter-btn${filters.segments.includes(s.val) ? ' active' : ''}"
              onclick="window._rcToggleFilter('segments','${s.val}')">${s.lbl}</button>
    `).join('')}
    ${geos.length ? `<span class="rc-filter-sep">|</span>` + geos.map(g => `
      <button class="rc-filter-btn${filters.geos.includes(g) ? ' active' : ''}"
              onclick="window._rcToggleFilter('geos','${g}')">${g.toUpperCase()}</button>
    `).join('') : ''}
  `;
}

window._rcToggleFilter = (key, val) => { toggleFilter(key, val); };
window._rcClearFilters = () => { clearFilters(); };

// ── Campaign modal ────────────────────────────────────────────────────────────

function openCampaignModal(id) {
  const { campaigns } = getState();
  const campaign = campaigns.find(c => c.id === id);
  if (!campaign) return;
  editingId  = id;
  modalMode  = 'view';
  showModal(renderCampaignView(campaign));
}

function openNewCampaignModal(prefill = {}) {
  editingId = null;
  modalMode = 'new';
  showModal(renderCampaignForm({ status: 'draft', brands: ['default'], ...prefill }));
}

function showModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const box     = document.getElementById('modal-box');
  box.innerHTML = html;
  overlay.style.display = 'flex';
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  editingId = null;
}

window._rcCloseModal    = closeModal;
window._rcOpenNew       = () => openNewCampaignModal();
window._rcOpenAI        = () => openAIModal();

function renderCampaignView(c) {
  const t     = getT();
  const color = TYPE_COLORS[c.type] || '#6B7280';
  return `
    <div class="modal-header" style="border-left:4px solid ${color}">
      <div style="font-size:1.1rem;font-weight:700">${esc(c.title)}</div>
      <div style="font-size:.8rem;color:var(--muted);margin-top:2px">
        ${c.type} · ${c.segment} · ${c.geo || '—'} · ${c.startDate} → ${c.endDate}
      </div>
      <span class="rc-status-badge status-${c.status}">${c.status}</span>
    </div>
    <div class="modal-body">
      ${c.mechanic ? `<div class="rc-field"><span class="rc-lbl">${t.fieldMechanic}:</span> ${esc(c.mechanic)}</div>` : ''}
      ${c.notes    ? `<div class="rc-field"><span class="rc-lbl">${t.fieldNotes}:</span> ${esc(c.notes)}</div>` : ''}
      ${c.tags?.length ? `<div class="rc-field"><span class="rc-lbl">Tags:</span> ${c.tags.map(g => `<span class="rc-tag">${esc(g)}</span>`).join(' ')}</div>` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary btn-sm" onclick="window._rcStartEdit('${c.id}')">${t.editCampaign}</button>
      <button class="btn btn-outline btn-sm" onclick="window._rcDuplicate('${c.id}')">${t.duplicate}</button>
      <button class="btn btn-outline btn-sm" onclick="window._rcSaveTemplate('${c.id}')">${t.saveTemplate}</button>
      <button class="btn btn-outline btn-sm" style="color:#EF4444;border-color:#EF4444" onclick="window._rcDelete('${c.id}')">${t.deleteCampaign}</button>
      <button class="btn btn-outline btn-sm" onclick="window._rcCloseModal()">${t.cancel}</button>
    </div>`;
}

function renderCampaignForm(c = {}) {
  const t = getT();
  const today = new Date().toISOString().slice(0, 10);
  const defEnd = c.endDate || addDaysStr(c.startDate || today, 6);
  return `
    <div class="modal-header"><div style="font-size:1rem;font-weight:700">${editingId ? t.editCampaign : t.newCampaign}</div></div>
    <div class="modal-body" style="display:grid;gap:10px">
      <div>
        <label class="rc-lbl">${t.fieldTitle} *</label>
        <input id="mf-title" class="form-input" value="${esc(c.title||'')}" placeholder="Campaign title">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label class="rc-lbl">${t.fieldType}</label>
          <select id="mf-type" class="form-input">
            ${CAMPAIGN_TYPES.map(o => `<option value="${o.val}"${c.type===o.val?' selected':''}>${o.lbl}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="rc-lbl">${t.fieldStatus}</label>
          <select id="mf-status" class="form-input">
            ${CAMPAIGN_STATUSES.map(o => `<option value="${o.val}"${(c.status||'draft')===o.val?' selected':''}>${o.lbl}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label class="rc-lbl">${t.fieldSegment}</label>
          <select id="mf-segment" class="form-input">
            ${SEGMENTS.map(o => `<option value="${o.val}"${(c.segment||'all')===o.val?' selected':''}>${o.lbl}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="rc-lbl">${t.fieldGeo}</label>
          <input id="mf-geo" class="form-input" value="${esc(c.geo||'')}" placeholder="de, kz, ...">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label class="rc-lbl">${t.fieldStart} *</label>
          <input id="mf-start" type="date" class="form-input" value="${c.startDate||today}">
        </div>
        <div>
          <label class="rc-lbl">${t.fieldEnd} *</label>
          <input id="mf-end" type="date" class="form-input" value="${defEnd}">
        </div>
      </div>
      <div>
        <label class="rc-lbl">${t.fieldMechanic}</label>
        <input id="mf-mechanic" class="form-input" value="${esc(c.mechanic||'')}" placeholder="e.g. 100% reload, 50 FS">
      </div>
      <div>
        <label class="rc-lbl">${t.fieldNotes}</label>
        <textarea id="mf-notes" class="form-input" rows="2" style="resize:vertical">${esc(c.notes||'')}</textarea>
      </div>
      <div>
        <label class="rc-lbl">${t.fieldTags} (comma-separated)</label>
        <input id="mf-tags" class="form-input" value="${esc((c.tags||[]).join(', '))}" placeholder="promo, q2, ...">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary btn-sm" onclick="window._rcSaveForm()">${t.saveCampaign}</button>
      <button class="btn btn-outline btn-sm" onclick="window._rcCloseModal()">${t.cancel}</button>
    </div>`;
}

window._rcStartEdit = (id) => {
  const c = getState().campaigns.find(x => x.id === id);
  if (!c) return;
  editingId = id;
  modalMode = 'edit';
  showModal(renderCampaignForm(c));
};

window._rcSaveForm = async () => {
  const title = document.getElementById('mf-title')?.value.trim();
  if (!title) { alert('Title is required'); return; }
  const start = document.getElementById('mf-start')?.value;
  const end   = document.getElementById('mf-end')?.value;
  if (!start || !end || start > end) { alert('Invalid dates'); return; }

  const data = {
    id:        editingId || undefined,
    title,
    type:      document.getElementById('mf-type')?.value,
    status:    document.getElementById('mf-status')?.value,
    segment:   document.getElementById('mf-segment')?.value,
    geo:       document.getElementById('mf-geo')?.value.trim().toLowerCase(),
    startDate: start,
    endDate:   end,
    mechanic:  document.getElementById('mf-mechanic')?.value.trim() || undefined,
    notes:     document.getElementById('mf-notes')?.value.trim() || undefined,
    tags:      document.getElementById('mf-tags')?.value.split(',').map(s => s.trim()).filter(Boolean),
    brands:    ['default'],
    sourceType: editingId ? getState().campaigns.find(c => c.id === editingId)?.sourceType : 'manual',
  };
  await upsertCampaign(data);
  closeModal();
};

window._rcDelete = async (id) => {
  const t = getT();
  if (!confirm(t.deleteConfirm)) return;
  await removeCampaign(id);
  closeModal();
};

window._rcDuplicate = async (id) => {
  const c = getState().campaigns.find(x => x.id === id);
  if (!c) return;
  await duplicateCampaign(c);
  closeModal();
};

window._rcSaveTemplate = async (id) => {
  const t = getT();
  const c = getState().campaigns.find(x => x.id === id);
  if (!c) return;
  const name = prompt(t.templateName, c.title);
  if (!name) return;
  await saveAsTemplate(c, name);
  closeModal();
};

// ── Templates panel ───────────────────────────────────────────────────────────

window._rcOpenTemplates = () => {
  const t         = getT();
  const templates = getTemplates();
  const today     = new Date().toISOString().slice(0, 10);
  const html = `
    <div class="modal-header"><div style="font-size:1rem;font-weight:700">${t.templates}</div></div>
    <div class="modal-body">
      ${!templates.length ? `<p style="color:var(--muted)">${t.noTemplates}</p>` : templates.map(tmpl => `
        <div class="rc-template-row">
          <span>${esc(tmpl.name)} <small style="color:var(--muted)">${tmpl.type} · ${tmpl.segment}</small></span>
          <button class="btn btn-outline btn-sm" onclick="window._rcUseTemplate('${tmpl.id}')">Use</button>
        </div>`).join('')}
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline btn-sm" onclick="window._rcCloseModal()">${t.cancel}</button>
    </div>`;
  showModal(html);
};

window._rcUseTemplate = async (id) => {
  const tmpl  = getTemplates().find(t => t.id === id);
  if (!tmpl) return;
  const today = new Date().toISOString().slice(0, 10);
  await createFromTemplate(tmpl, { startDate: today, endDate: addDaysStr(today, 6) });
  closeModal();
};

// ── AI-Assisted modal ─────────────────────────────────────────────────────────

function openAIModal() {
  const t = getT();
  const geoOpts = ['de','fr','es','uk','kz','ru','mn','us','mx'].map(g =>
    `<option value="${g}">${g.toUpperCase()}</option>`).join('');
  const html = `
    <div class="modal-header"><div style="font-size:1rem;font-weight:700">${t.aiAssisted}</div></div>
    <div class="modal-body" style="display:grid;gap:12px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div>
          <label class="rc-lbl">Type</label>
          <select id="ai-subtype" class="form-input">
            <option value="campaign">Campaign</option>
            <option value="tournament">Tournament</option>
          </select>
        </div>
        <div>
          <label class="rc-lbl">GEO</label>
          <select id="ai-geo" class="form-input">${geoOpts}</select>
        </div>
        <div>
          <label class="rc-lbl">Segment</label>
          <select id="ai-segment" class="form-input">
            ${SEGMENTS.map(s => `<option value="${s.val}">${s.lbl}</option>`).join('')}
          </select>
        </div>
      </div>
      <div>
        <label class="rc-lbl">${t.aiPromptLabel}</label>
        <textarea id="ai-prompt" class="form-input" rows="3" placeholder="e.g. Weekly cashback for VIP players in DE"></textarea>
      </div>
      <div id="ai-error" style="color:#EF4444;font-size:.8rem;display:none"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary btn-sm" id="ai-gen-btn" onclick="window._rcRunAI()">${t.aiGenerate}</button>
      <button class="btn btn-outline btn-sm" onclick="window._rcCloseModal()">${t.cancel}</button>
    </div>`;
  showModal(html);
}

window._rcRunAI = async () => {
  const t       = getT();
  const subtype = document.getElementById('ai-subtype')?.value;
  const geo     = document.getElementById('ai-geo')?.value;
  const segment = document.getElementById('ai-segment')?.value;
  const btn     = document.getElementById('ai-gen-btn');
  const errEl   = document.getElementById('ai-error');
  if (btn) btn.textContent = t.aiLoading;
  errEl.style.display = 'none';
  try {
    let campaign;
    if (subtype === 'tournament') {
      const res = await fetch('/api/tournament/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'slot', params: { geo, segment, duration: 'weekly', prizePool: 1000, poolModel: 'fixed', totalPlayers: 5000, entryModel: 'freeroll', scoring: 'total_wins', distribution: 'top_n', reentry: 'single' } }),
      });
      if (!res.ok) throw new Error(await res.text());
      campaign = tournamentFromAI(await res.json());
    } else {
      const scenarios = { de:'eu_mga', kz:'cis_none', ru:'cis_none', mn:'mn_none', us:'sweep_none', mx:'latam_none', fr:'eu_mga', es:'eu_mga', uk:'eu_ukgc' };
      const scenario  = scenarios[geo] || 'eu_mga';
      const res = await fetch('/api/campaign/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, segment, plat: 'both', rtp: 0.96 }),
      });
      if (!res.ok) throw new Error(await res.text());
      campaign = campaignFromAI(await res.json(), { geo, segment });
    }
    closeModal();
    openNewCampaignModal(campaign);
  } catch (e) {
    errEl.textContent = `Error: ${e?.message || String(e)}`;
    errEl.style.display = 'block';
    if (btn) btn.textContent = t.aiGenerate;
  }
};

// ── Export ────────────────────────────────────────────────────────────────────

window._rcExportCSV  = () => { const { campaigns, filters } = getState(); exportCSV(applyFilters(campaigns, filters)); };
window._rcExportJSON = () => { const { campaigns, filters } = getState(); exportJSON(applyFilters(campaigns, filters)); };

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function addDaysStr(dateStr, n) {
  const d = new Date(dateStr || new Date());
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Expose repo globally so CG/TG can push campaigns to the calendar from same tab
window.retentionRepo = repo;
window.tournamentFromAI = tournamentFromAI;
window.campaignFromAI = campaignFromAI;
