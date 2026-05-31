const GEO_OPTIONS = [
  { val:'de', lbl:'🇩🇪 Germany (EUR)' },
  { val:'fr', lbl:'🇫🇷 France (EUR)' },
  { val:'es', lbl:'🇪🇸 Spain (EUR)' },
  { val:'it', lbl:'🇮🇹 Italy (EUR)' },
  { val:'nl', lbl:'🇳🇱 Netherlands (EUR)' },
  { val:'dk', lbl:'🇩🇰 Denmark (DKK)' },
  { val:'uk', lbl:'🇬🇧 UK (GBP)' },
  { val:'ru', lbl:'🇷🇺 Russia (RUB)' },
  { val:'kz', lbl:'🇰🇿 Kazakhstan (KZT)' },
  { val:'mn', lbl:'🇲🇳 Mongolia (MNT)' },
  { val:'us', lbl:'🇺🇸 USA Sweepstakes' },
  { val:'mx', lbl:'🇲🇽 Mexico (USD)' },
  { val:'br', lbl:'🇧🇷 Brazil (USD)' },
];

const TOURNAMENT_TYPES = [
  { val:'slot',       icon:'🎰', name:'Slots',      desc:'Leaderboard based on slot performance' },
  { val:'live',       icon:'🃏', name:'Live Casino',desc:'Live table game tournament' },
  { val:'mixed',      icon:'🎲', name:'Mixed',      desc:'Slots + live games combined' },
  { val:'prize_drop', icon:'💎', name:'Prize Drop', desc:'Random prizes during gameplay' },
];

const ENTRY_MODELS = [
  { val:'freeroll', lbl:'Freeroll' },
  { val:'buyin',    lbl:'Buy-in' },
  { val:'ticket',   lbl:'Ticket' },
];

const SCORING = [
  { val:'total_wins',         lbl:'Total Wins' },
  { val:'highest_multiplier', lbl:'Highest Multiplier' },
  { val:'most_spins',         lbl:'Most Spins' },
  { val:'mission_based',      lbl:'Mission-Based' },
];

const DURATIONS = [
  { val:'flash',       lbl:'Flash (< 1h)' },
  { val:'daily',       lbl:'Daily' },
  { val:'weekly',      lbl:'Weekly' },
  { val:'monthly',     lbl:'Monthly' },
  { val:'multi_round', lbl:'Multi-Round' },
];

const POOL_MODELS = [
  { val:'fixed',   lbl:'Fixed', desc:'Guaranteed pool, operator bears risk' },
  { val:'dynamic', lbl:'Dynamic', desc:'Pool grows from player rake/fees' },
  { val:'hybrid',  lbl:'Hybrid', desc:'Guaranteed base + rake contribution' },
];

const DISTRIBUTIONS = [
  { val:'top_n',        lbl:'Top N' },
  { val:'linear_decay', lbl:'Linear Decay' },
  { val:'flat_tier',    lbl:'Flat Tier' },
  { val:'prize_drop',   lbl:'Prize Drop' },
];

const REENTRY = [
  { val:'single',    lbl:'Single Entry' },
  { val:'rebuy',     lbl:'Rebuy Allowed' },
  { val:'unlimited', lbl:'Unlimited' },
];

const SEGMENTS = [
  { val:'all',        lbl:'All Players' },
  { val:'depositors', lbl:'Depositors' },
  { val:'new',        lbl:'New Players' },
  { val:'vip',        lbl:'VIP' },
  { val:'dormant',    lbl:'Dormant' },
];

let step            = 1;
let detailId        = null;
let hasActiveGenerator = false;
const draft = {
  type: 'slot',
  params: {
    geo:          'de',
    lic:          'auto',
    segment:      'all',
    totalPlayers: 5000,
    entryModel:   'freeroll',
    scoring:      'total_wins',
    duration:     'weekly',
    prizePool:    1000,
    poolModel:    'fixed',
    rake:         10,
    distribution: 'top_n',
    reentry:      'single',
    lang:         'en',
    tone:         'professional',
  },
};
let lastResult  = null;
let lastTexts   = null;
let lastAudit   = null;
let activeTab   = 'push';
let activeAudit = false;

// ── LOCALSTORAGE HELPERS ─────────────────────────────────────────────────────
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

function goStep(n) {
  step = n;
  hasActiveGenerator = true;
  document.getElementById('topbar-step').textContent = `Step ${n} of 4`;
  setSidebarActive('nav-tournament');
  renderStep();
}

function renderStep() {
  const c = document.getElementById('content');
  if      (step === 1) c.innerHTML = renderStep1();
  else if (step === 2) c.innerHTML = renderStep2();
  else if (step === 3) c.innerHTML = renderStep3();
  else if (step === 4) c.innerHTML = renderStep4();
}

function setSidebarActive(id) {
  document.querySelectorAll('.sb-nav .nav-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function showSetupGuide() { showView('setup'); }

function showView(view, id) {
  const c  = document.getElementById('content');
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
  updateNavBadge();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── PLAYER ELIGIBILITY HELPERS ───────────────────────────────────────────────
const SEGMENT_RATIO_UI = {
  all: 1.00, new: 0.20, vip: 0.10, dormant: 0.40, depositors: 0.60,
};

function getSegRatio(seg) {
  return SEGMENT_RATIO_UI[seg] ?? 1.0;
}

function updateEligibleHint() {
  const el = document.getElementById('tp-eligible');
  if (!el) return;
  const tp  = draft.params.totalPlayers || 5000;
  const seg = draft.params.segment || 'all';
  el.textContent = Math.round(tp * getSegRatio(seg)).toLocaleString();
}

// ── STEP 1: Tournament type ──────────────────────────────────────────────────
function renderStep1() {
  return `
<div class="step-header">
  <div class="step-badge">Step 1</div>
  <div class="step-title">Select Tournament Type</div>
  <div class="step-sub">Choose the game type for your tournament</div>
</div>
<div class="chips" style="gap:12px;margin-bottom:28px">
  ${TOURNAMENT_TYPES.map(t => `
    <div class="chip type-card${draft.type===t.val?' on':''}" onclick="draft.type='${t.val}';renderStep()">
      <span class="tc-icon">${t.icon}</span>
      <span class="tc-name">${t.name}</span>
      <span class="tc-desc">${t.desc}</span>
    </div>`).join('')}
</div>
<div class="nav-footer">
  <span></span>
  <button class="btn btn-primary btn-lg" onclick="goStep(2)">Configure Parameters →</button>
</div>`;
}

// ── STEP 2: Parameters ───────────────────────────────────────────────────────
function renderStep2() {
  const p = draft.params;
  return `
<div class="step-header">
  <div class="step-badge">Step 2</div>
  <div class="step-title">Tournament Parameters</div>
  <div class="step-sub">Configure geo, mechanics, and prize pool</div>
</div>

<div class="card">
  <div class="card-title">Geography & Audience</div>
  <div class="form-row">
    <label class="form-label">Market / GEO</label>
    <select class="form-input" id="f-geo" onchange="draft.params.geo=this.value">
      ${GEO_OPTIONS.map(g => `<option value="${g.val}"${p.geo===g.val?' selected':''}>${g.lbl}</option>`).join('')}
    </select>
  </div>
  <div class="form-row">
    <label class="form-label">Segment</label>
    <div class="chips">
      ${SEGMENTS.map(s => `<div class="chip${p.segment===s.val?' on':''}" onclick="draft.params.segment='${s.val}';draft.params.totalPlayers=draft.params.totalPlayers||5000;renderStep();updateEligibleHint()">${s.lbl}</div>`).join('')}
    </div>
  </div>
  <div class="form-row">
    <label class="form-label">Total Active Players in Casino</label>
    <div style="display:flex;align-items:center;gap:12px">
      <input type="range" min="100" max="100000" step="100" id="f-tp"
             value="${p.totalPlayers||5000}"
             oninput="draft.params.totalPlayers=+this.value;document.getElementById('tp-out').textContent=Number(+this.value).toLocaleString();updateEligibleHint()"
             style="flex:1">
      <span id="tp-out" style="min-width:64px;font-weight:600;text-align:right">${(p.totalPlayers||5000).toLocaleString()}</span>
    </div>
    <div style="font-size:.73rem;color:var(--muted);margin-top:5px">
      Eligible for this segment: <strong id="tp-eligible">${Math.round((p.totalPlayers||5000)*getSegRatio(p.segment)).toLocaleString()}</strong> players
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title">Entry & Scoring</div>
  <div class="form-row">
    <label class="form-label">Entry Model</label>
    <div class="chips">
      ${ENTRY_MODELS.map(e => `<div class="chip${p.entryModel===e.val?' on':''}" onclick="draft.params.entryModel='${e.val}';renderStep()">${e.lbl}</div>`).join('')}
    </div>
  </div>
  <div class="form-row">
    <label class="form-label">Scoring Method</label>
    <div class="chips">
      ${SCORING.map(s => `<div class="chip${p.scoring===s.val?' on':''}" onclick="draft.params.scoring='${s.val}';renderStep()">${s.lbl}</div>`).join('')}
    </div>
  </div>
  <div class="form-row">
    <label class="form-label">Re-entry</label>
    <div class="chips">
      ${REENTRY.map(r => `<div class="chip${p.reentry===r.val?' on':''}" onclick="draft.params.reentry='${r.val}';renderStep()">${r.lbl}</div>`).join('')}
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title">Prize Pool & Duration</div>
  <div class="form-row">
    <label class="form-label">Duration</label>
    <div class="chips">
      ${DURATIONS.map(d => `<div class="chip${p.duration===d.val?' on':''}" onclick="draft.params.duration='${d.val}';renderStep()">${d.lbl}</div>`).join('')}
    </div>
  </div>
  <div class="form-row">
    <label class="form-label">Prize Pool Amount</label>
    <input class="form-input" type="number" min="100" id="f-pp" value="${p.prizePool}" onchange="draft.params.prizePool=Math.max(100,+this.value)">
  </div>
  <div class="form-row">
    <label class="form-label">Pool Model</label>
    <div class="chips">
      ${POOL_MODELS.map(m => `<div class="chip${p.poolModel===m.val?' on':''}" onclick="draft.params.poolModel='${m.val}';renderStep()" title="${m.desc}">${m.lbl}</div>`).join('')}
    </div>
  </div>
  ${p.poolModel==='dynamic'?`
  <div class="form-row">
    <label class="form-label">Rake % (player contributions)</label>
    <input class="form-input" type="number" min="0" max="40" value="${p.rake||10}" onchange="draft.params.rake=+this.value" style="max-width:120px">
  </div>`:''}
  <div class="form-row">
    <label class="form-label">Prize Distribution</label>
    <div class="chips">
      ${DISTRIBUTIONS.map(d => `<div class="chip${p.distribution===d.val?' on':''}" onclick="draft.params.distribution='${d.val}';renderStep()">${d.lbl}</div>`).join('')}
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title">Language & Tone</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div class="form-row" style="margin:0">
      <label class="form-label">Language</label>
      <select class="form-input" onchange="draft.params.lang=this.value">
        <option value="en"${p.lang==='en'?' selected':''}>English</option>
        <option value="ru"${p.lang==='ru'?' selected':''}>Russian</option>
        <option value="de"${p.lang==='de'?' selected':''}>German</option>
        <option value="da"${p.lang==='da'?' selected':''}>Danish</option>
        <option value="es"${p.lang==='es'?' selected':''}>Spanish</option>
        <option value="mn"${p.lang==='mn'?' selected':''}>Mongolian</option>
      </select>
    </div>
    <div class="form-row" style="margin:0">
      <label class="form-label">Tone</label>
      <select class="form-input" onchange="draft.params.tone=this.value">
        <option value="professional"${p.tone==='professional'?' selected':''}>Professional</option>
        <option value="casual"${p.tone==='casual'?' selected':''}>Casual</option>
        <option value="hype"${p.tone==='hype'?' selected':''}>Hype / FOMO</option>
      </select>
    </div>
  </div>
</div>

<div class="nav-footer">
  <button class="btn btn-outline" onclick="goStep(1)">← Back</button>
  <button class="btn btn-primary btn-lg" id="btn-generate" onclick="runGenerate()">Generate Tournament Spec →</button>
</div>`;
}

// ── STEP 3: Economics & Spec ─────────────────────────────────────────────────
function renderStep3() {
  if (!lastResult) { goStep(2); return ''; }
  const r    = lastResult;
  const e    = r.econ;
  const spec = r.spec;
  const cur  = r.cur || 'EUR';
  const roi  = typeof e.roi === 'number' ? e.roi : Number(e.roi) || 0;

  function fmtCur(n) {
    return cur + ' ' + Math.abs(Math.round(n)).toLocaleString();
  }

  const dur = draft.params.duration || 'weekly';
  const pctMap = { flash:{lo:'3%',mi:'7%',hi:'12%'}, daily:{lo:'5%',mi:'10%',hi:'18%'},
    weekly:{lo:'8%',mi:'15%',hi:'25%'}, monthly:{lo:'10%',mi:'18%',hi:'30%'},
    multi_round:{lo:'6%',mi:'12%',hi:'20%'} };
  const pct = pctMap[dur] || pctMap['weekly'];
  const scenarios = [
    { label:`Low (${pct.lo} participation)`,      lift:e.ggrLiftLow,  net:e.netMarginLow,  pl:e.participantsLow,  cpp:e.costPerActiveLow  },
    { label:`Expected (${pct.mi} participation)`, lift:e.ggrLiftMid,  net:e.netMarginMid,  pl:e.participantsMid,  cpp:e.costPerActiveMid  },
    { label:`High (${pct.hi} participation)`,     lift:e.ggrLiftHigh, net:e.netMarginHigh, pl:e.participantsHigh, cpp:e.costPerActiveHigh },
  ];

  const prizeRows = (spec.prizes||[]).map((pr,i) => {
    const pct = pr.pct;
    return `<div class="prize-row">
      <span class="prize-place">${pr.place === 1 ? '🥇' : pr.place === 2 ? '🥈' : pr.place === 3 ? '🥉' : '#' + pr.place}</span>
      <div class="prize-bar-wrap"><div class="prize-bar" style="width:${Math.min(pct*3,100)}%"></div></div>
      <span class="prize-pct">${pct}%</span>
      <span class="prize-amt">${cur} ${pr.amount.toLocaleString()}</span>
    </div>`;
  }).join('');

  const econCards = scenarios.map(s => {
    const netClass = s.net >= 0 ? 'pos' : 'neg';
    return `<div class="econ-card">
      <div class="econ-label">${s.label}</div>
      <div class="econ-val ${netClass}">${s.net>=0?'+':''}${fmtCur(s.net)}</div>
      <div class="econ-sub">${s.pl} players · GGR: +${fmtCur(s.lift)}</div>
      <div class="econ-sub">Cost/active: ${fmtCur(s.cpp)}</div>
    </div>`;
  }).join('');

  const engMul  = e.engagementMultiplier || 2.5;
  const retVal  = e.retentionValue || 0;
  const totVal  = e.totalValueMid  || e.netMarginMid || 0;
  const totClass = totVal >= 0 ? 'pos' : 'neg';

  return `
<div class="step-header">
  <div class="step-badge">Step 3</div>
  <div class="step-title">Tournament Spec & Economics</div>
  <div class="step-sub">Prize distribution and projected ROI</div>
</div>

<div class="card">
  <div class="card-title">Tournament Summary</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:.82rem">
    <div><span style="color:var(--muted)">Type:</span> ${spec.type}</div>
    <div><span style="color:var(--muted)">Duration:</span> ${spec.duration}</div>
    <div><span style="color:var(--muted)">Entry:</span> ${spec.entryModel}</div>
    <div><span style="color:var(--muted)">Scoring:</span> ${spec.scoring}</div>
    <div><span style="color:var(--muted)">Pool model:</span> ${spec.poolModel}</div>
    <div><span style="color:var(--muted)">Re-entry:</span> ${spec.reentry}</div>
    <div><span style="color:var(--muted)">Prize pool:</span> <strong>${fmtCur(spec.prizePool)}</strong></div>
    <div><span style="color:var(--muted)">Distribution:</span> ${spec.distribution}</div>
    <div><span style="color:var(--muted)">ROI:</span> <strong style="color:${roi>=0?'var(--success)':'#ef4444'}">${roi}%</strong></div>
  </div>
  ${e.breakEvenParticipants > 0 ? `<div style="margin-top:10px;font-size:.78rem;color:var(--muted)">Break-even: <strong style="color:var(--text)">${e.breakEvenParticipants} participants</strong> at 30% GGR lift</div>` : ''}
</div>

<div class="card">
  <div class="card-title">Prize Distribution (${cur} ${spec.prizePool.toLocaleString()} pool)</div>
  ${prizeRows}
</div>

<div class="card">
  <div class="card-title">Economic Scenarios</div>
  <div class="econ-grid">${econCards}</div>
  <div style="margin-top:14px;padding:12px 14px;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.2);border-radius:8px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
    <div style="flex:1;min-width:160px">
      <div style="font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Total value (expected)</div>
      <div style="font-size:1.1rem;font-weight:700;color:${totClass==='pos'?'var(--success)':'#ef4444'}">${totVal>=0?'+':''}${fmtCur(totVal)}</div>
      <div style="font-size:.72rem;color:var(--muted);margin-top:2px">GGR lift + post-tournament retention</div>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <div style="text-align:center">
        <div style="font-size:.68rem;color:var(--muted);margin-bottom:2px">Engagement</div>
        <div style="font-size:.88rem;font-weight:600;color:#a0b0ff">×${engMul.toFixed(1)}</div>
        <div style="font-size:.65rem;color:var(--muted)">vs normal play</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:.68rem;color:var(--muted);margin-bottom:2px">Retention value</div>
        <div style="font-size:.88rem;font-weight:600;color:var(--success)">+${fmtCur(retVal)}</div>
        <div style="font-size:.65rem;color:var(--muted)">next-month uplift</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:.68rem;color:var(--muted);margin-bottom:2px">Full ROI</div>
        <div style="font-size:.88rem;font-weight:600;color:${roi>=0?'var(--success)':'#ef4444'}">${roi>=0?'+':''}${roi}%</div>
        <div style="font-size:.65rem;color:var(--muted)">on prize pool</div>
      </div>
    </div>
  </div>
  <div style="font-size:.7rem;color:var(--muted);margin-top:10px">
    Based on ${e.eligible} eligible ${draft.params.segment} players (${Math.round(e.segmentRatio*100)}% of ${(draft.params.totalPlayers||5000).toLocaleString()} total casino players) · ARPU ${e.arpu} USD/mo · engagement ×${engMul.toFixed(1)} vs normal play
  </div>
</div>

<div style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);border-radius:10px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:14px">
  <span style="font-size:1.4rem;flex-shrink:0">📋</span>
  <div style="flex:1;min-width:0">
    <div style="font-size:.85rem;font-weight:600;color:#c4b5fd;margin-bottom:2px">Setup Guide ready</div>
    <div style="font-size:.77rem;color:var(--muted)">View the detailed setup guide for this tournament</div>
  </div>
  <div style="display:flex;gap:8px;flex-shrink:0">
    <button class="btn btn-outline btn-sm"
            style="border-color:rgba(124,58,237,.4);color:#c4b5fd"
            onclick="showSetupGuide()">
      View Guide →
    </button>
  </div>
</div>

<div class="nav-footer">
  <div style="display:flex;gap:9px;align-items:center">
    <button class="btn btn-outline" onclick="goStep(2)">← Reconfigure</button>
    <button id="btn-save-tournament" class="btn btn-outline"
            style="border-color:rgba(79,110,247,.4);color:#a0b0ff"
            onclick="saveTournament()">
      💾 Save
    </button>
  </div>
  <div style="display:flex;gap:9px">
    <button class="btn btn-outline btn-sm" onclick="exportTournamentPDF()">⬇ PDF</button>
    <button class="btn btn-primary btn-lg" onclick="goStep(4)">Generate AI Texts →</button>
  </div>
</div>`;
}

// ── STEP 4: AI Texts & Audit ─────────────────────────────────────────────────
function renderStep4() {
  const hasTexts = !!lastTexts;
  const hasAudit = !!lastAudit;

  return `
<div class="step-header">
  <div class="step-badge">Step 4</div>
  <div class="step-title">AI Texts & Compliance</div>
  <div class="step-sub">Generate CRM copy and compliance audit for your tournament</div>
</div>

<div style="display:flex;gap:10px;margin-bottom:20px">
  <button class="btn btn-primary" onclick="runTexts()" id="btn-texts">${hasTexts ? '↺ Regenerate Texts' : '🤖 Generate CRM Texts'}</button>
  <button class="btn btn-outline" onclick="runAudit()" id="btn-audit">${hasAudit ? '↺ Re-run Audit' : '🔍 Compliance Audit'}</button>
</div>

<div id="texts-area">${hasTexts ? renderTextsHTML(lastTexts) : ''}</div>
<div id="audit-area">${hasAudit ? renderAuditHTML(lastAudit) : ''}</div>

<div class="nav-footer">
  <button class="btn btn-outline" onclick="goStep(3)">← Back to Spec</button>
  <button class="btn btn-ghost" onclick="goStep(1)">Start Over</button>
</div>`;
}

function renderTextsHTML(texts) {
  const channels = ['push','email','sms','telegram','popup'];
  const tabs = channels.map(ch => `<button class="tab${activeTab===ch?' active':''}" onclick="activeTab='${ch}';document.getElementById('texts-area').innerHTML=renderTextsHTML(lastTexts)">${ch.charAt(0).toUpperCase()+ch.slice(1)}</button>`).join('');

  let body = '';
  const variants = texts[activeTab] || [];
  if (activeTab === 'email') {
    body = variants.map((v,i) => `
      <div class="text-variant">
        <div class="text-variant-label">Variant ${i+1}</div>
        <div style="font-weight:600;font-size:.82rem;margin-bottom:4px">${v.subject||''}</div>
        <div class="text-variant-body">${v.body||''}</div>
        <button class="copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify((v.subject||'')+'\n\n'+(v.body||''))})">⎘ Copy</button>
      </div>`).join('');
  } else if (activeTab === 'popup') {
    body = variants.map((v,i) => `
      <div class="text-variant">
        <div class="text-variant-label">Variant ${i+1}</div>
        <div style="font-weight:700;font-size:.95rem;margin-bottom:3px">${v.headline||''}</div>
        <div style="color:var(--muted);font-size:.82rem;margin-bottom:6px">${v.subtext||''}</div>
        <div style="display:inline-block;background:var(--accent);color:#fff;padding:4px 12px;border-radius:6px;font-size:.78rem;font-weight:700">${v.cta||''}</div>
        <button class="copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify((v.headline||'')+'\n'+(v.subtext||'')+'\nCTA: '+(v.cta||''))})">⎘ Copy</button>
      </div>`).join('');
  } else {
    body = variants.map((v,i) => `
      <div class="text-variant">
        <div class="text-variant-label">Variant ${i+1}</div>
        <div class="text-variant-body">${typeof v === 'string' ? v : JSON.stringify(v)}</div>
        <button class="copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(typeof v === 'string' ? v : '')})">⎘ Copy</button>
      </div>`).join('');
  }

  return `<div class="card" style="margin-bottom:16px">
    <div class="card-title">CRM Copy</div>
    <div class="tab-row">${tabs}</div>
    ${body}
  </div>`;
}

function renderAuditHTML(audit) {
  const checks = (audit.checks||[]).map(c => `
    <div class="audit-check">
      <div class="audit-status ${c.status}">${c.status==='ok'?'✓':'!'}</div>
      <div><div class="audit-label">${c.label}</div><div class="audit-note">${c.note}</div></div>
    </div>`).join('');
  const recs = (audit.recommendations||[]).map(r => `
    <div class="rec-card">
      <div class="rec-text">${r.text}</div>
      <div class="rec-impact">→ ${r.impact}</div>
    </div>`).join('');

  return `<div class="card">
    <div class="card-title">Compliance Audit</div>
    ${checks}
    ${recs ? `<div style="margin-top:14px;font-size:.8rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Recommendations</div>${recs}` : ''}
  </div>`;
}

// ── PDF EXPORT ────────────────────────────────────────────────────────────────
function exportTournamentPDF() {
  if (!lastResult) return;
  const r    = lastResult;
  const spec = r.spec || {};
  const e    = r.econ || {};
  const cur  = r.cur || '';
  const ts   = new Date().toLocaleString('en-GB', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const fmt  = v => cur + ' ' + Math.round(v).toLocaleString();

  const prizeRows = (spec.prizes || []).map(p =>
    `<tr><td>${p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : p.place === 3 ? '🥉' : '#'+p.place}</td><td>${p.pct}%</td><td>${fmt(p.amount)}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${spec.type} Tournament — ${cur} ${(spec.prizePool||0).toLocaleString()}</title>
    <style>body{font-family:Arial,sans-serif;margin:28px;color:#111;font-size:13px}
    h1{font-size:18px}h3{font-size:13px;color:#555;margin:16px 0 6px}
    table{border-collapse:collapse;width:100%;font-size:11px;margin-bottom:12px}
    td,th{border:1px solid #ddd;padding:5px 8px}th{background:#f0f0f0}
    .footer{margin-top:30px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#888}</style>
    </head><body>
    <h1>${(spec.type||'').charAt(0).toUpperCase()+(spec.type||'').slice(1)} Tournament</h1>
    <div style="color:#666;font-size:12px">${cur} ${(spec.prizePool||0).toLocaleString()} prize pool · ${spec.duration} · ${ts}</div>

    <h3>Summary</h3>
    <table><tr><th>Parameter</th><th>Value</th></tr>
      <tr><td>Entry model</td><td>${spec.entryModel}</td></tr>
      <tr><td>Scoring</td><td>${spec.scoring}</td></tr>
      <tr><td>Pool model</td><td>${spec.poolModel}</td></tr>
      <tr><td>Distribution</td><td>${spec.distribution}</td></tr>
      <tr><td>Re-entry</td><td>${spec.reentry}</td></tr>
      <tr><td>ROI (expected)</td><td>${e.roi >= 0 ? '+' : ''}${e.roi}%</td></tr>
    </table>

    <h3>Prize Table</h3>
    <table><tr><th>Place</th><th>%</th><th>Amount</th></tr>${prizeRows}</table>

    <h3>Economics</h3>
    <table><tr><th>Metric</th><th>Low (5%)</th><th>Expected (10%)</th><th>High (15%)</th></tr>
      <tr><td>Participants</td><td>${e.participantsLow}</td><td>${e.participantsMid}</td><td>${e.participantsHigh}</td></tr>
      <tr><td>GGR lift</td><td>${fmt(e.ggrLiftLow||0)}</td><td>${fmt(e.ggrLiftMid||0)}</td><td>${fmt(e.ggrLiftHigh||0)}</td></tr>
      <tr><td>Net margin</td><td>${fmt(e.netMarginLow||0)}</td><td>${fmt(e.netMarginMid||0)}</td><td>${fmt(e.netMarginHigh||0)}</td></tr>
    </table>

    <div class="footer">Generated by Retomat · ${ts} · retomat.io</div>
    </body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) { alert('Allow popups to export PDF'); URL.revokeObjectURL(url); return; }
  setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 400);
}

// ── API calls ────────────────────────────────────────────────────────────────
async function runGenerate() {
  const btn = document.getElementById('btn-generate');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating…'; }

  try {
    const resp = await fetch('/api/tournament/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: draft.type, params: draft.params }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: resp.statusText }));
      throw new Error(err.message || resp.statusText);
    }
    lastResult = await resp.json();
    lastTexts  = null;
    lastAudit  = null;
    goStep(3);
  } catch (e) {
    alert('Error: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Tournament Spec →'; }
  }
}

async function runTexts() {
  const btn = document.getElementById('btn-texts');
  const area = document.getElementById('texts-area');
  if (!btn || !area) return;
  btn.disabled = true;
  btn.textContent = '⏳ Generating texts…';
  area.innerHTML = '<div class="loader"><div class="spinner"></div> AI is writing tournament copy…</div>';

  try {
    const resp = await fetch('/api/tournament/texts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: draft.type, params: draft.params, spec: lastResult?.spec || {} }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: resp.statusText }));
      throw new Error(err.message || resp.statusText);
    }
    lastTexts = await resp.json();
    activeTab = 'push';
    area.innerHTML = renderTextsHTML(lastTexts);
    btn.textContent = '↺ Regenerate Texts';
  } catch (e) {
    area.innerHTML = `<div class="alert alert-warn">Could not generate texts: ${e.message}</div>`;
    btn.textContent = '🤖 Generate CRM Texts';
  }
  btn.disabled = false;
}

async function runAudit() {
  const btn  = document.getElementById('btn-audit');
  const area = document.getElementById('audit-area');
  if (!btn || !area) return;
  btn.disabled = true;
  btn.textContent = '⏳ Auditing…';
  area.innerHTML = '<div class="loader"><div class="spinner"></div> AI compliance officer is reviewing…</div>';

  try {
    const resp = await fetch('/api/tournament/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: draft.type, params: draft.params, spec: lastResult?.spec || {}, uiLang: draft.params.lang }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: resp.statusText }));
      throw new Error(err.message || resp.statusText);
    }
    lastAudit = await resp.json();
    area.innerHTML = renderAuditHTML(lastAudit);
    btn.textContent = '↺ Re-run Audit';
  } catch (e) {
    area.innerHTML = `<div class="alert alert-warn">Could not run audit: ${e.message}</div>`;
    btn.textContent = '🔍 Compliance Audit';
  }
  btn.disabled = false;
}

// ── SETUP GUIDE ──────────────────────────────────────────────────────────────
function buildTimeline(duration) {
  const timelines = {
    flash: [
      {when:'T−2h',    action:'Announce via push notification',       channel:'Push'},
      {when:'T−30m',   action:'Final reminder push',                  channel:'Push'},
      {when:'T=0',     action:'Tournament opens',                     channel:'System'},
      {when:'T+45m',   action:'Mid-tournament leaderboard update',    channel:'Email'},
      {when:'T+1h',    action:'Tournament closes, scores freeze',     channel:'System'},
      {when:'T+2h',    action:'Winner announcement + prize payouts',  channel:'Push + Email'},
    ],
    daily: [
      {when:'T−1d',    action:'Announcement push + email',            channel:'Push + Email'},
      {when:'T−4h',    action:'Reminder to active players',           channel:'Push'},
      {when:'T=0',     action:'Tournament opens',                     channel:'System'},
      {when:'T+12h',   action:'Mid-tournament leaderboard update',    channel:'Email'},
      {when:'T+24h',   action:'Tournament closes',                    channel:'System'},
      {when:'T+25h',   action:'Winner announcement + prize payouts',  channel:'Push + Email'},
    ],
    weekly: [
      {when:'T−7d',    action:'Announce tournament',                  channel:'Email + Push'},
      {when:'T−3d',    action:'CRM campaign to target segment',       channel:'Email + SMS'},
      {when:'T−1d',    action:'Final reminder',                       channel:'Push'},
      {when:'T=0',     action:'Tournament opens',                     channel:'System'},
      {when:'T+4d',    action:'Mid-point leaderboard update',         channel:'Email'},
      {when:'T+7d',    action:'Tournament closes',                    channel:'System'},
      {when:'T+8d',    action:'Winner announcement + prize payouts',  channel:'Push + Email'},
    ],
    monthly: [
      {when:'T−14d',   action:'Announce + teaser campaign',           channel:'Email'},
      {when:'T−7d',    action:'CRM push to target segment',           channel:'Push + Email'},
      {when:'T−3d',    action:'Pre-launch reminder',                  channel:'SMS + Push'},
      {when:'T=0',     action:'Tournament opens',                     channel:'System'},
      {when:'T+7d',    action:'Week 1 leaderboard update',            channel:'Email'},
      {when:'T+14d',   action:'Mid-point leaderboard',                channel:'Push + Email'},
      {when:'T+30d',   action:'Tournament closes',                    channel:'System'},
      {when:'T+33d',   action:'Winner announcement + prize payouts',  channel:'Push + Email + Popup'},
    ],
    multi_round: [
      {when:'T−7d',    action:'Announce multi-round structure',       channel:'Email + Push'},
      {when:'T−3d',    action:'CRM campaign',                         channel:'Email'},
      {when:'T=0',     action:'Round 1 opens',                        channel:'System'},
      {when:'R1 end',  action:'Qualify top players → Round 2',        channel:'Push + Email'},
      {when:'Final',   action:'Grand final round opens',              channel:'Push'},
      {when:'Final+1d',action:'Grand winner announcement + payouts',  channel:'Push + Email + Popup'},
    ],
  };
  return timelines[duration] || timelines['weekly'];
}

function buildChecklist(spec, params, result) {
  const lic  = result.lic  || 'none';
  const cur  = result.cur  || 'EUR';
  const items = [];
  // Basics
  items.push({text:'Create tournament in backoffice / CMS platform', tag:'Required'});
  items.push({text:'Set tournament name and promotional copy'});
  items.push({text:'Configure start date and end date / time'});
  items.push({text:`Set minimum bet size (house rules, e.g. ${cur} 0.20)`});
  // Entry model
  if (params.entry === 'buyin') {
    items.push({text:'Configure buy-in amount and ticket issuance flow', tag:'Buy-in'});
    items.push({text:'Set refund policy for cancelled tournaments'});
  } else if (params.entry === 'ticket') {
    items.push({text:'Set up ticket distribution via CRM / promotion engine', tag:'Ticket'});
  }
  // Eligible games
  const gameLabel = spec.type === 'slot' ? 'slots' : spec.type === 'live' ? 'live tables' : 'slots + live games';
  items.push({text:`Define eligible game list (${gameLabel})`});
  items.push({text:`Set segment filter: ${params.segment || 'all'} players only`});
  // Scoring
  const scoringMap = {
    total_wins:         'Enable total wins counter in leaderboard engine',
    highest_multiplier: 'Configure per-spin / per-hand multiplier tracking',
    most_spins:         'Enable spin count aggregation for leaderboard',
    mission_based:      'Define mission objectives and progress tracking rules',
  };
  items.push({text: scoringMap[params.scoring] || 'Configure scoring algorithm', tag:'Leaderboard'});
  items.push({text:'Set leaderboard refresh interval (recommended: 5 min)'});
  items.push({text:'Define tiebreaker rule (e.g. first to reach score wins tie)'});
  // Prize pool
  if (params.poolModel === 'dynamic' || params.poolModel === 'hybrid') {
    items.push({text:`Configure rake collection: ${params.rake || 5}% → prize pool`, tag:'Pool'});
  }
  items.push({text:'Fund prize pool account / escrow before launch'});
  items.push({text:`Configure ${spec.distribution} prize distribution schema`});
  items.push({text:'Set payout processing schedule (recommended: within 24h of end)'});
  items.push({text:'Set prize validity period for winners (recommended: 30 days)'});
  // Reentry
  if (params.reentry === 'yes') {
    items.push({text:'Configure re-entry limit and cooldown interval', tag:'Re-entry'});
  }
  // License compliance
  if (lic === 'ukgc') {
    items.push({text:'Confirm no countdown timer is visible to players', tag:'UKGC'});
    items.push({text:'Gamstop self-exclusion check active for tournament opt-in', tag:'UKGC'});
    items.push({text:'Add BeGambleAware link to tournament landing page', tag:'UKGC'});
  } else if (lic === 'dga') {
    items.push({text:'Verify prize cap ≤ 1,000 DKK per player per tournament', tag:'DGA'});
    items.push({text:'ROFUS self-exclusion check on opt-in flow', tag:'DGA'});
    items.push({text:'T&Cs displayed at same font size as promotional headline', tag:'DGA'});
    items.push({text:'Add Stopspillet.dk link to tournament page', tag:'DGA'});
  } else if (lic === 'mga') {
    items.push({text:'Add Terms & Conditions URL to tournament page', tag:'MGA'});
    items.push({text:'Display maximum prize amount prominently in promo copy', tag:'MGA'});
  }
  // QA / Notifications
  items.push({text:'Schedule CRM notifications per launch timeline below'});
  items.push({text:'Prepare winner announcement message (push + email)'});
  items.push({text:'QA: test opt-in flow and leaderboard display before go-live'});
  return items;
}

function renderSetupGuide() {
  if (!lastResult) {
    return `
<div class="step-header">
  <div class="step-badge">📋 Setup Guide</div>
  <div class="step-title">Tournament Setup Guide</div>
  <div class="step-sub">Generate a tournament first to see its setup guide</div>
</div>
<div class="card" style="text-align:center;padding:40px 20px">
  <div style="font-size:2.5rem;margin-bottom:14px">🏆</div>
  <div style="color:var(--muted);font-size:.88rem;margin-bottom:20px">No tournament has been generated yet.</div>
  <button class="btn btn-primary" onclick="goStep(1)">Create a Tournament →</button>
</div>`;
  }

  const r    = lastResult;
  const spec = r.spec;
  const p    = draft.params;
  const cur  = r.cur || 'EUR';
  const lic  = r.lic || 'none';

  const checklist = buildChecklist(spec, p, r);
  const timeline  = buildTimeline(p.duration || 'weekly');

  const prizeRows = (spec.prizes || []).map(pr => `
    <div class="prize-row">
      <span class="prize-place">${pr.place===1?'🥇':pr.place===2?'🥈':pr.place===3?'🥉':'#'+pr.place}</span>
      <div class="prize-bar-wrap"><div class="prize-bar" style="width:${Math.min(pr.pct*3,100)}%"></div></div>
      <span class="prize-pct">${pr.pct}%</span>
      <span class="prize-amt">${cur} ${pr.amount.toLocaleString()}</span>
    </div>`).join('');

  const checklistHtml = checklist.map(item => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <input type="checkbox" style="margin-top:2px;flex-shrink:0;accent-color:var(--accent)">
      <span style="font-size:.82rem;flex:1">${item.text}</span>
      ${item.tag ? `<span style="font-size:.68rem;padding:1px 7px;border-radius:6px;background:rgba(79,110,247,.15);color:#a0b0ff;white-space:nowrap">${item.tag}</span>` : ''}
    </div>`).join('');

  const timelineHtml = timeline.map(ev => `
    <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:.73rem;font-weight:700;color:var(--accent);width:60px;flex-shrink:0">${ev.when}</span>
      <span style="font-size:.82rem;flex:1">${ev.action}</span>
      <span style="font-size:.73rem;color:var(--muted)">${ev.channel}</span>
    </div>`).join('');

  const licBadge = lic !== 'none' ? `<span style="font-size:.72rem;padding:1px 8px;border-radius:6px;background:rgba(245,158,11,.15);color:var(--warn);margin-left:6px">${lic.toUpperCase()}</span>` : '';

  return `
<div class="step-header">
  <div class="step-badge">📋 Setup Guide</div>
  <div class="step-title">${spec.type.charAt(0).toUpperCase()+spec.type.slice(1)} Tournament${licBadge}</div>
  <div class="step-sub">${cur} ${spec.prizePool.toLocaleString()} prize pool · ${spec.distribution} · ${p.duration || 'weekly'} duration</div>
</div>

<div class="card">
  <div class="card-title">Prize Table</div>
  ${prizeRows}
  <div style="margin-top:10px;font-size:.75rem;color:var(--muted)">Total pool: ${cur} ${spec.prizePool.toLocaleString()} · ${(spec.prizes||[]).length} prize places</div>
</div>

<div class="card">
  <div class="card-title">Setup Checklist <span style="font-size:.72rem;color:var(--muted);font-weight:400">(${checklist.length} items)</span></div>
  ${checklistHtml}
  <div style="margin-top:10px;font-size:.75rem;color:var(--muted)">Check off items as you configure in your backoffice</div>
</div>

<div class="card">
  <div class="card-title">Launch Timeline</div>
  ${timelineHtml}
</div>

<div class="card" style="background:rgba(124,58,237,.06);border-color:rgba(124,58,237,.25)">
  <div class="card-title" style="color:#c4b5fd">🤖 AI Brief</div>
  <div style="font-size:.82rem;color:var(--muted);margin-bottom:14px">Get an AI-generated strategic analysis: key strengths, risks, operator notes, and A/B test ideas for this tournament.</div>
  <button class="btn btn-outline btn-sm" style="border-color:rgba(124,58,237,.4);color:#c4b5fd;cursor:not-allowed;opacity:.6" disabled>
    🤖 Generate AI Brief &nbsp;·&nbsp; Solo+ plan
  </button>
</div>

<div class="nav-footer">
  <button class="btn btn-outline" onclick="goStep(3)">← Back to Economics</button>
  <div style="display:flex;gap:9px">
    <button class="btn btn-outline btn-sm" onclick="exportTournamentPDF()">⬇ PDF</button>
    <button class="btn btn-primary" onclick="goStep(4)">Generate AI Texts →</button>
  </div>
</div>`;
}

// ── SAVE / DELETE ────────────────────────────────────────────────────────────
function saveTournament() {
  if (!lastResult) return;
  const list = loadTournaments();
  const existing = list.find(t =>
    t.type === draft.type &&
    JSON.stringify(t.params) === JSON.stringify(draft.params)
  );
  if (existing) { showToast('Already saved'); return; }
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
  if (btn) { btn.textContent = '✓ Saved'; btn.disabled = true; btn.style.opacity = '.5'; }
  showToast('Tournament saved to your library');
  updateNavBadge();
}

function deleteTournament(id) {
  if (!confirm('Delete this tournament from your library?')) return;
  saveTournaments(loadTournaments().filter(t => t.id !== id));
  updateNavBadge();
  showToast('Tournament deleted');
  showView('list');
}

function updateNavBadge() {
  const n  = loadTournaments().length;
  const el = document.getElementById('nav-tourn-badge');
  if (!el) return;
  el.textContent = n;
  el.style.display = n > 0 ? 'inline' : 'none';
}

function showToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#161c2d;border:1px solid rgba(16,185,129,.35);border-radius:8px;padding:9px 16px;font-size:.83rem;color:#10b981;opacity:0;transition:opacity .25s,transform .25s;z-index:999;pointer-events:none;display:flex;align-items:center;gap:8px';
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

// ── LIST VIEW ────────────────────────────────────────────────────────────────
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
  <div style="color:var(--muted);font-size:.88rem;margin-bottom:20px">Generate a tournament and click "Save" to build your library.</div>
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
  <div style="width:38px;height:38px;border-radius:9px;background:rgba(79,110,247,.15);border:1px solid rgba(79,110,247,.25);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${typeIcon[t.type] || '🏆'}</div>
  <div style="flex:1;min-width:0">
    <div style="font-size:.88rem;font-weight:600;color:var(--text);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span style="font-size:.78rem;color:var(--muted)">${pool}</span>
      <span style="font-size:.73rem;padding:1px 7px;border-radius:99px;background:rgba(16,185,129,.12);color:${roiColor(roi)}">${roiStr} ROI</span>
      <span style="font-size:.73rem;padding:1px 7px;border-radius:99px;background:rgba(79,110,247,.12);color:#a0b0ff">${seg}</span>
      <span style="font-size:.73rem;color:var(--muted);margin-left:auto">${date}</span>
    </div>
  </div>
  <div style="display:flex;gap:7px;flex-shrink:0">
    <button class="btn btn-outline btn-sm" data-id="${t.id}" onclick="showView('detail', this.dataset.id)">Details</button>
    <button class="btn btn-outline btn-sm" style="border-color:rgba(124,58,237,.4);color:#c4b5fd" data-id="${t.id}" onclick="loadAndShowGuide(this.dataset.id)">📋 Guide</button>
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

// ── DETAIL VIEW ──────────────────────────────────────────────────────────────
function renderDetail(id) {
  const t = loadTournaments().find(t => t.id === id);
  if (!t) return `<div class="card">Tournament not found. <button class="btn btn-ghost" onclick="showView('list')">← Back</button></div>`;

  const e      = t.econ || {};
  const spec   = t.spec || {};
  const cur    = t.cur || '';
  const roi     = typeof e.roi === 'number' ? e.roi : Number(e.roi) || 0;
  const roiPos  = roi >= 0;
  const roiStr  = (roi >= 0 ? '+' : '') + roi + '%';

  const prizeRows = (spec.prizes || []).map(pr => `
    <div class="prize-row">
      <span class="prize-place">${pr.place===1?'🥇':pr.place===2?'🥈':pr.place===3?'🥉':'#'+pr.place}</span>
      <div class="prize-bar-wrap"><div class="prize-bar" style="width:${Math.min(pr.pct*3,100)}%"></div></div>
      <span class="prize-pct">${pr.pct}%</span>
      <span class="prize-amt">${cur} ${pr.amount.toLocaleString()}</span>
    </div>`).join('');

  const totVal   = e.totalValueMid  ?? e.netMarginMid ?? 0;
  const retVal   = e.retentionValue ?? 0;
  const engMulD  = e.engagementMultiplier ?? 2.5;
  const totPos   = totVal >= 0;
  const econRows = [
    { label:'Expected participants',  val: (e.participantsMid || 0).toLocaleString() },
    { label:'GGR lift (expected)',    val: cur + ' ' + Math.round(e.ggrLiftMid || 0).toLocaleString() },
    { label:'Retention value',        val: '+' + cur + ' ' + Math.round(retVal).toLocaleString(), pos: true },
    { label:'Total value (expected)', val: (totVal >= 0 ? '+' : '') + cur + ' ' + Math.round(Math.abs(totVal)).toLocaleString(), pos: totPos },
    { label:'ROI (on prize pool)',    val: roiStr, pos: roiPos },
    { label:'Break-even players',     val: (e.breakEvenParticipants || '—').toLocaleString() },
    { label:'Cost per active',        val: cur + ' ' + Math.round(e.costPerActiveMid || 0).toLocaleString() },
    { label:'Engagement multiplier',  val: '×' + engMulD.toFixed(1) + ' vs normal play' },
  ].map(r => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:.8rem;color:var(--muted)">${r.label}</span>
      <span style="font-size:.83rem;font-weight:600;color:${r.pos===false?'#ef4444':r.pos?'var(--success)':'var(--text)'}">${r.val}</span>
    </div>`).join('');

  const date = new Date(t.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

  return `
<div style="margin-bottom:18px">
  <button class="btn btn-ghost btn-sm" onclick="showView('list')" style="padding:0;margin-bottom:10px">← Tournaments</button>
  <div style="display:flex;align-items:flex-start;gap:14px">
    <div style="width:46px;height:46px;border-radius:10px;background:rgba(79,110,247,.15);border:1px solid rgba(79,110,247,.3);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">
      ${{ slot:'🎰', live:'🃏', mixed:'🎲', prize_drop:'💎' }[t.type] || '🏆'}
    </div>
    <div>
      <div style="font-size:1.15rem;font-weight:700;color:var(--text);margin-bottom:4px">${t.name}</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">
        <span style="font-size:.75rem;padding:2px 8px;border-radius:99px;background:rgba(79,110,247,.15);color:#a0b0ff">${t.lic?.toUpperCase() || 'NONE'}</span>
        <span style="font-size:.75rem;padding:2px 8px;border-radius:99px;background:rgba(79,110,247,.12);color:#a0b0ff">${t.params?.segment || 'mid'}</span>
        <span style="font-size:.75rem;padding:2px 8px;border-radius:99px;background:rgba(79,110,247,.12);color:#a0b0ff">${t.params?.duration || ''}</span>
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
  <button class="btn btn-outline" style="flex:1;border-color:rgba(124,58,237,.4);color:#c4b5fd" onclick="loadAndShowGuide('${t.id}')">📋 Setup Guide</button>
  <button class="btn btn-outline" style="flex:1;border-color:rgba(79,110,247,.4);color:#a0b0ff" onclick="loadAndRegenTexts('${t.id}')">✦ AI Texts</button>
  <button class="btn btn-outline btn-sm" style="color:var(--muted);border-color:var(--border)" onclick="deleteTournament('${t.id}')">🗑 Delete</button>
</div>`;
}

// ── LOAD HELPERS ─────────────────────────────────────────────────────────────
function loadAndShowGuide(id) {
  const t = loadTournaments().find(t => t.id === id);
  if (!t) return;
  lastResult   = { spec: t.spec, econ: t.econ, cur: t.cur, lic: t.lic, region: t.region };
  draft.type   = t.type;
  draft.params = { ...t.params };
  showView('setup');
}

function loadAndRegenTexts(id) {
  const t = loadTournaments().find(t => t.id === id);
  if (!t) return;
  lastResult   = { spec: t.spec, econ: t.econ, cur: t.cur, lic: t.lic, region: t.region };
  lastTexts    = null;
  lastAudit    = null;
  draft.type   = t.type;
  draft.params = { ...t.params };
  goStep(4);
}

// Init
updateNavBadge();
const initialHash = window.location.hash;
if (initialHash === '#setup') {
  showView('setup');
} else if (initialHash === '#list') {
  showView('list');
} else {
  // Show saved tournaments list if available, otherwise show generator
  const saved = loadTournaments();
  if (saved.length > 0) {
    showView('list');
  } else {
    renderStep();
  }
}

window.addEventListener('pageshow', function() {
  updateNavBadge();
  // Restore view state when returning to page from another tab
  const hash = window.location.hash;
  if (hash === '#setup') {
    showView('setup');
  } else if (hash === '#list') {
    showView('list');
  } else if (hasActiveGenerator && step > 0) {
    // Resume generator if currently in progress
    renderStep();
  } else {
    const saved = loadTournaments();
    if (saved.length > 0) {
      showView('list');
    } else {
      renderStep();
    }
  }
});
