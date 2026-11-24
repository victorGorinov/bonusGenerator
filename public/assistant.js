// AI Assistant chat panel (Phase 1) — a docked drawer in the Campaign Generator.
// Translates the operator's free text into campaign params via /api/assistant/interpret,
// clarifies missing critical fields with structured controls (no 2nd AI call), previews
// the resulting draft (economics + abuse + regulatory notes via existing engines), and
// on Apply pre-fills the wizard's step 2. It writes NO economics itself — numbers come
// from /api/campaign/generate. Spec: tasks/ai-assistant-chat-spec.md.
//
// Loaded as a classic script AFTER campaign-generator.js, so it shares that script's
// globals (draft, currentLang, t, selScenario, goStep, showView, startWizard,
// syncLangToGeo, updateRiskHint, syncCGPlayers, buildGeoSelect).

(function () {
  const RU = () => (typeof currentLang !== 'undefined' ? currentLang : 'en') === 'ru';

  const I = {
    en: {
      launch: 'AI assistant', title: 'AI assistant', sub: 'Campaign generator',
      ph: 'Describe the campaign or the result you want…', send: 'Send',
      thinking: 'Reading your request…', generating: 'Building the draft…',
      q_geo: 'Which market?', q_segment: 'Which player segment?', q_players: 'Roughly how many players?',
      seg_new: 'New', seg_mid: 'Mid', seg_vip: 'VIP',
      draft: 'Campaign draft', apply: 'Apply to generator', restart: 'New request',
      p50: 'P50 cost', roi: 'Platform ROI', risk: 'Max risk P90',
      abuse: 'Farm risk', inferred: 'Filled with defaults:',
      lvl_low: 'low', lvl_elevated: 'elevated', lvl_high: 'high', lvl_critical: 'critical',
      err: 'Something went wrong. Try rephrasing.', scen: 'Scenario',
      mechs: 'Mechanics', none: 'none',
    },
    ru: {
      launch: 'AI-ассистент', title: 'AI-ассистент', sub: 'Campaign generator',
      ph: 'Опиши кампанию или желаемый результат…', send: 'Отправить',
      thinking: 'Разбираю запрос…', generating: 'Собираю черновик…',
      q_geo: 'Какой рынок?', q_segment: 'Какой сегмент игроков?', q_players: 'Сколько примерно игроков?',
      seg_new: 'Новые', seg_mid: 'Средние', seg_vip: 'VIP',
      draft: 'Черновик кампании', apply: 'Применить в генератор', restart: 'Новый запрос',
      p50: 'Стоимость P50', roi: 'ROI платформы', risk: 'Макс. риск P90',
      abuse: 'Риск фарма', inferred: 'Заполнено дефолтами:',
      lvl_low: 'низкий', lvl_elevated: 'повышенный', lvl_high: 'высокий', lvl_critical: 'критический',
      err: 'Что-то пошло не так. Попробуй переформулировать.', scen: 'Сценарий',
      mechs: 'Механики', none: 'нет',
    },
  };
  const L = () => I[RU() ? 'ru' : 'en'];

  let interp = null;          // last refined interpretation
  const CRITICAL = ['geo', 'segment', 'players'];

  // ── DOM ──────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('as-styles')) return;
    const s = document.createElement('style');
    s.id = 'as-styles';
    s.textContent = `
      .as-launch{position:fixed;right:16px;top:50%;transform:translateY(-50%);z-index:900;display:inline-flex;align-items:center;justify-content:center;
        width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;background:#4f6ef7;color:#fff;
        font-size:1.35rem;box-shadow:0 6px 18px rgba(79,110,247,.45)}
      .as-launch:hover{background:#405de0}
      .as-drawer{position:fixed;top:0;right:0;height:100%;width:420px;max-width:100vw;z-index:901;display:flex;
        flex-direction:column;background:var(--bg,#0f1420);border-left:1px solid var(--border,#232b3a);
        transform:translateX(100%);transition:transform .22s ease;box-shadow:-12px 0 40px rgba(0,0,0,.35)}
      .as-drawer.open{transform:translateX(0)}
      .as-hd{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border,#232b3a)}
      .as-hd .as-ico{font-size:1.1rem}
      .as-hd .as-t{font-size:.95rem;font-weight:600;color:var(--text,#e8ecf4)}
      .as-hd .as-s{font-size:.72rem;color:var(--muted,#8892a4)}
      .as-x{margin-left:auto;background:none;border:none;color:var(--muted,#8892a4);font-size:1.1rem;cursor:pointer}
      .as-body{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px}
      .as-msg{max-width:88%;padding:9px 12px;border-radius:12px;font-size:.84rem;line-height:1.5}
      .as-msg.user{align-self:flex-end;background:rgba(79,110,247,.16);color:#9db3ff}
      .as-msg.bot{align-self:flex-start;background:var(--bg2,#161c28);border:1px solid var(--border,#232b3a);color:var(--text,#e8ecf4)}
      .as-chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
      .as-chip{padding:6px 13px;border-radius:100px;font-size:.8rem;cursor:pointer;border:1px solid var(--border,#232b3a);
        background:var(--bg2,#161c28);color:var(--muted,#8892a4)}
      .as-chip:hover,.as-chip.active{border-color:#4f6ef7;color:#9db3ff}
      .as-num,.as-sel{background:var(--bg2,#161c28);border:1px solid var(--border,#232b3a);color:var(--text,#e8ecf4);
        border-radius:8px;padding:6px 10px;font-size:.8rem}
      .as-card{border:1px solid var(--border,#232b3a);border-radius:12px;padding:12px 14px;background:var(--bg2,#161c28)}
      .as-card .as-ct{font-size:.85rem;font-weight:600;color:var(--text,#e8ecf4);margin-bottom:8px;display:flex;align-items:center;gap:6px}
      .as-mech{font-size:.84rem;color:var(--text,#e8ecf4);line-height:1.5;margin-bottom:10px}
      .as-mech .as-scn{font-size:.72rem;color:var(--muted,#8892a4);margin-top:2px}
      .as-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
      .as-metric{background:var(--bg,#0f1420);border-radius:8px;padding:8px 10px}
      .as-metric .ml{font-size:.68rem;color:var(--muted,#8892a4)}
      .as-metric .mv{font-size:1.05rem;font-weight:600;color:var(--text,#e8ecf4)}
      .as-pill{display:inline-flex;align-items:center;gap:5px;font-size:.72rem;padding:4px 9px;border-radius:100px;margin:0 6px 8px 0}
      .as-reg{display:flex;gap:8px;background:rgba(245,158,11,.12);color:#f59e0b;border-radius:8px;padding:9px 11px;
        font-size:.75rem;line-height:1.45;margin-bottom:10px}
      .as-inf{font-size:.72rem;color:var(--muted,#8892a4);line-height:1.45;margin-bottom:12px}
      .as-acts{display:flex;flex-wrap:wrap;gap:8px}
      .as-btn{padding:8px 14px;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;border:1px solid var(--border,#232b3a);
        background:var(--bg,#0f1420);color:var(--text,#e8ecf4)}
      .as-btn.primary{border-color:#4f6ef7;color:#9db3ff}
      .as-foot{padding:12px 16px;border-top:1px solid var(--border,#232b3a);display:flex;gap:8px;align-items:flex-end}
      .as-ta{flex:1;resize:none;background:var(--bg2,#161c28);border:1px solid var(--border,#232b3a);color:var(--text,#e8ecf4);
        border-radius:10px;padding:9px 11px;font-size:.84rem;font-family:inherit;max-height:110px}
      .as-go{background:#4f6ef7;border:none;color:#fff;border-radius:10px;padding:9px 13px;font-size:.84rem;cursor:pointer}
      .as-muted{color:var(--muted,#8892a4);font-size:.8rem}
    `;
    document.head.appendChild(s);
  }

  function build() {
    injectStyles();
    if (document.getElementById('as-launch')) return;

    const btn = document.createElement('button');
    btn.id = 'as-launch'; btn.className = 'as-launch';
    btn.innerHTML = '<span>✨</span>';
    btn.title = L().launch; btn.setAttribute('aria-label', L().launch);
    btn.addEventListener('click', open);
    document.body.appendChild(btn);

    const d = document.createElement('div');
    d.id = 'as-drawer'; d.className = 'as-drawer';
    d.innerHTML = `
      <div class="as-hd">
        <span class="as-ico">✨</span>
        <div><div class="as-t" id="as-title">${L().title}</div><div class="as-s" id="as-sub">${L().sub}</div></div>
        <button class="as-x" id="as-close" aria-label="Close">✕</button>
      </div>
      <div class="as-body" id="as-body"></div>
      <div class="as-foot">
        <textarea class="as-ta" id="as-input" rows="1" placeholder="${L().ph}"></textarea>
        <button class="as-go" id="as-send" aria-label="${L().send}">➤</button>
      </div>`;
    document.body.appendChild(d);

    d.querySelector('#as-close').addEventListener('click', close);
    d.querySelector('#as-send').addEventListener('click', onSend);
    const ta = d.querySelector('#as-input');
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
    });
    // Event delegation for dynamically rendered controls in the body.
    d.querySelector('#as-body').addEventListener('click', onBodyClick);
  }

  function open()  { build(); document.getElementById('as-drawer').classList.add('open'); if (!interp && !document.getElementById('as-body').children.length) greet(); }
  function close() { const d = document.getElementById('as-drawer'); if (d) d.classList.remove('open'); }

  const body = () => document.getElementById('as-body');
  function addMsg(text, who) {
    const el = document.createElement('div');
    el.className = 'as-msg ' + (who || 'bot');
    el.textContent = text;
    body().appendChild(el);
    el.scrollIntoView({ block: 'end' });
    return el;
  }
  function addNode(node) { body().appendChild(node); node.scrollIntoView({ block: 'end' }); return node; }

  function greet() {
    addMsg(RU()
      ? 'Опиши кампанию словами — например «реактивация dormant в Бразилии, подешевле» — я соберу черновик с параметрами и экономикой.'
      : 'Describe a campaign in words — e.g. “reactivate dormant players in Brazil, keep it cheap” — and I’ll build a draft with parameters and economics.', 'bot');
  }

  // ── SEND → interpret ───────────────────────────────────────────────────────
  async function onSend() {
    const ta = document.getElementById('as-input');
    const text = (ta.value || '').trim();
    if (!text) return;
    if (window.FeatureGate && !(await window.FeatureGate.ensure('ai'))) return;
    ta.value = '';
    addMsg(text, 'user');
    const pending = addMsg(L().thinking, 'bot');
    try {
      const res = await fetch('/api/assistant/interpret', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ prompt: text, uiLang: RU() ? 'ru' : 'en' }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      interp = await res.json();
      pending.remove();
      handleInterpret();
    } catch (err) {
      pending.textContent = L().err;
    }
  }

  function firstMissing() {
    if (!interp) return null;
    return CRITICAL.find((k) => (interp.missing || []).includes(k)) || (interp.missing || [])[0] || null;
  }

  function handleInterpret() {
    const miss = firstMissing();
    if (miss) { askFor(miss); return; }
    runPreview();
  }

  // ── CLARIFY (structured controls, no 2nd AI call) ───────────────────────────
  function askFor(key) {
    const wrap = document.createElement('div');
    wrap.className = 'as-msg bot';
    const label = key === 'geo' ? L().q_geo : key === 'segment' ? L().q_segment : key === 'players' ? L().q_players : key;
    wrap.innerHTML = `<div style="margin-bottom:8px">${label}</div>`;

    if (key === 'segment') {
      const row = document.createElement('div'); row.className = 'as-chips';
      [['new', L().seg_new], ['mid', L().seg_mid], ['vip', L().seg_vip]].forEach(([v, lbl]) => {
        const c = document.createElement('button'); c.className = 'as-chip'; c.textContent = lbl;
        c.dataset.asAnswer = 'segment'; c.dataset.asValue = v; row.appendChild(c);
      });
      wrap.appendChild(row);
    } else if (key === 'players') {
      const row = document.createElement('div'); row.className = 'as-chips';
      ['1000', '5000', '20000'].forEach((v) => {
        const c = document.createElement('button'); c.className = 'as-chip'; c.textContent = Number(v).toLocaleString();
        c.dataset.asAnswer = 'players'; c.dataset.asValue = v; row.appendChild(c);
      });
      const inp = document.createElement('input'); inp.type = 'number'; inp.className = 'as-num'; inp.min = '100'; inp.max = '200000';
      inp.placeholder = '5000'; inp.style.width = '90px'; inp.dataset.asNum = 'players';
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') answer('players', inp.value); });
      row.appendChild(inp);
      wrap.appendChild(row);
    } else if (key === 'geo') {
      const sel = document.createElement('select'); sel.className = 'as-sel'; sel.dataset.asSelect = 'geo';
      try { if (typeof buildGeoSelect === 'function') buildGeoSelect(); } catch (e) { /* noop */ }
      const src = document.getElementById('p-geo');
      sel.innerHTML = (src && src.innerHTML) ? ('<option value="">—</option>' + src.innerHTML) : '<option value="">—</option>';
      sel.addEventListener('change', () => { if (sel.value) answer('geo', sel.value); });
      wrap.appendChild(sel);
    }
    addNode(wrap);
  }

  function onBodyClick(e) {
    const chip = e.target.closest('[data-as-answer]');
    if (chip) {
      answer(chip.dataset.asAnswer, chip.dataset.asValue);
      return;
    }
    const act = e.target.closest('[data-as-act]');
    if (act) {
      if (act.dataset.asAct === 'apply') apply();
      else if (act.dataset.asAct === 'restart') restart();
    }
  }

  function answer(key, value) {
    if (!interp) return;
    interp.params = interp.params || {};
    if (key === 'players') {
      const n = parseInt(String(value).replace(/[^\d]/g, ''), 10);
      if (!Number.isFinite(n)) return;
      interp.params.players = Math.min(200000, Math.max(100, n));
    } else {
      interp.params[key] = value;
    }
    interp.missing = (interp.missing || []).filter((k) => k !== key);
    const lbl = key === 'players' ? Number(interp.params.players).toLocaleString() : value;
    addMsg(String(lbl), 'user');
    handleInterpret();
  }

  // ── PREVIEW (economics + abuse + regulatory, via existing engines) ──────────
  async function runPreview() {
    const p = interp.params || {};
    const pending = addMsg(L().generating, 'bot');
    try {
      const res = await fetch('/api/campaign/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ scenario: interp.scenario || undefined, params: p }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      pending.remove();
      renderPreview(data);
    } catch (err) {
      pending.textContent = L().err;
    }
  }

  function fmtMoney(n, cur) {
    if (n == null || !isFinite(n)) return '—';
    return Math.round(n).toLocaleString() + (cur ? ' ' + cur : '');
  }

  function renderPreview(data) {
    const p = interp.params || {};
    const E = data.econ || {};
    const cur = data.cur || '';
    const mechTypes = Object.keys(data.selectedMechanics || {});
    const mechLine = mechTypes.length ? mechTypes.join(' · ') : (data.mechanicType || L().none);

    let abuseHtml = '';
    try {
      if (window.RetomatBonusAbuse && data.econ) {
        const sm = data.selectedMechanics || {};
        const a = window.RetomatBonusAbuse.assessBonusAbuse(
          { r: data.r, econ: data.econ, welcome: sm.welcome, ndb: sm.ndb, cashback: sm.cashback, contrib: data.contrib },
          { activeTypes: data.requestedTypes || [data.mechanicType] },
        );
        const col = { low: '#16a34a', elevated: '#d97706', high: '#ea580c', critical: '#dc2626' }[a.level] || '#64748b';
        const bg  = { low: 'rgba(22,163,74,.14)', elevated: 'rgba(217,119,6,.14)', high: 'rgba(234,88,18,.14)', critical: 'rgba(220,38,38,.14)' }[a.level] || 'rgba(100,116,139,.14)';
        abuseHtml = `<span class="as-pill" style="color:${col};background:${bg}">🛡️ ${L().abuse} ${a.score} · ${L()['lvl_' + a.level] || a.level}</span>`;
      }
    } catch (e) { /* abuse is best-effort */ }

    const notes = (interp.notes || []).map((n) =>
      `<div class="as-reg"><span>⚠️</span><span>${escapeHtml(n)}</span></div>`).join('');
    const inferred = (interp.inferred || []).length
      ? `<div class="as-inf">🪄 ${L().inferred} ${interp.inferred.map(escapeHtml).join(', ')}</div>` : '';
    const scn = interp.scenario ? `<div class="as-scn">${L().scen}: ${escapeHtml(interp.scenario.lbl || interp.scenario.id)}${p.segment ? ' · ' + escapeHtml(p.segment) : ''}${p.agg ? ' · ' + escapeHtml(p.agg) : ''}</div>` : '';

    const card = document.createElement('div');
    card.className = 'as-card';
    card.innerHTML = `
      <div class="as-ct">📄 ${L().draft}</div>
      <div class="as-mech">${escapeHtml(mechLine)}${scn}</div>
      <div class="as-grid">
        <div class="as-metric"><div class="ml">${L().p50}</div><div class="mv">${fmtMoney(E.sP50 ? E.sP50.cost : E.cost, cur)}</div></div>
        <div class="as-metric"><div class="ml">${L().roi}</div><div class="mv">${E.roi3 != null ? Math.round(E.roi3) + '%' : '—'}</div></div>
        <div class="as-metric"><div class="ml">${L().risk}</div><div class="mv">${fmtMoney(E.maxRisk, cur)}</div></div>
      </div>
      ${abuseHtml ? `<div>${abuseHtml}</div>` : ''}
      ${notes}
      ${inferred}
      <div class="as-acts">
        <button class="as-btn primary" data-as-act="apply">➜ ${L().apply}</button>
        <button class="as-btn" data-as-act="restart">↻ ${L().restart}</button>
      </div>`;
    addNode(card);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ── APPLY → pre-fill the wizard step 2 ──────────────────────────────────────
  function apply() {
    if (!interp || typeof startWizard !== 'function') return;
    const p = interp.params || {};
    // Hub (generator.html): make sure the Bonus tab is active before driving its wizard.
    if (typeof genSwitchType === 'function') { try { genSwitchType('bonus'); } catch (e) { /* noop */ } }
    startWizard();                         // reset to a clean wizard (step 1, defaults)

    // Seed chips/btypes through the scenario path when the id is valid.
    if (interp.scenario && interp.scenario.id) {
      const el = document.querySelector(`.sc-item[data-id="${interp.scenario.id}"]`);
      if (el && typeof selScenario === 'function') selScenario(interp.scenario.id, el);
    }

    showView('wizard');
    goStep(2);
    paintStep2(p);
    close();
  }

  function setChips(group, value) {
    document.querySelectorAll(`.chip[data-g="${group}"]`).forEach((c) =>
      c.classList.toggle('active', c.dataset.v === value));
  }
  function setT3(group, value) {
    document.querySelectorAll(`.t3-btn[data-g="${group}"]`).forEach((b) =>
      b.classList.toggle('active', b.dataset.v === value));
  }

  function paintStep2(p) {
    if (p.geo) {
      const g = document.getElementById('p-geo');
      if (g) {
        g.value = p.geo;
        if (typeof syncLangToGeo === 'function') syncLangToGeo(p.geo);        // campaign-generator.js
        else if (typeof genPickGeo === 'function') genPickGeo(p.geo);         // hub generator.js
      }
    }
    if (p.lang) { const l = document.getElementById('p-lang'); if (l) l.value = p.lang; draft.params.lang = p.lang; }
    if (p.budget) { const b = document.getElementById('p-budget'); if (b) b.value = parseFloat(p.budget) || b.value; }
    if (p.players) {
      const n = document.getElementById('cg-pnum');
      if (n) { n.value = p.players; if (typeof syncCGPlayers === 'function') syncCGPlayers('num'); }
    }
    if (p.segment) { setChips('segment', p.segment); draft.params.segment = p.segment; }
    if (p.vertical) { setChips('vertical', p.vertical); draft.params.vertical = p.vertical; }
    if (p.games) { setChips('games', p.games); draft.params.games = p.games; }
    if (p.agg) { setT3('agg', p.agg); draft.params.agg = p.agg; }
    if (p.risk) { setT3('risk', p.risk); draft.params.risk = p.risk; if (typeof updateRiskHint === 'function') updateRiskHint(p.risk); }
    if (Array.isArray(p.bonusTypes) && p.bonusTypes.length) {
      document.querySelectorAll('#btypeGroup .chip-multi').forEach((c) =>
        c.classList.toggle('active', p.bonusTypes.includes(c.dataset.btype)));
      draft.params.bonusTypes = [...p.bonusTypes];
    }
    if (p.lic) draft.params.lic = p.lic;
  }

  function restart() { interp = null; body().innerHTML = ''; greet(); document.getElementById('as-input').focus(); }

  // Re-label on language switch (campaign-generator's setUILang doesn't know about us).
  function relabel() {
    const b = document.getElementById('as-launch'); if (b) { b.title = L().launch; b.setAttribute('aria-label', L().launch); }
    const ti = document.getElementById('as-title'); if (ti) ti.textContent = L().title;
    const su = document.getElementById('as-sub'); if (su) su.textContent = L().sub;
    const ta = document.getElementById('as-input'); if (ta) ta.placeholder = L().ph;
  }
  window.addEventListener('storage', (e) => { if (e.key === 'bonusLang') relabel(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();

  window.CampaignAssistant = { open, close, restart };
})();
