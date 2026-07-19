// ── DATA ──────────────────────────────────────────────────────────────────────
const SCENARIOS = [
  { catKey:'launch',  icon:'🚀', items:['first_launch'] },
  { catKey:'react',   icon:'🔄', items:['inactive_3','inactive_7','inactive_30','churn_risk','return_win','return_loss'] },
  { catKey:'dep',     icon:'💰', items:['first_dep','second_dep','big_dep'] },
  { catKey:'vip',     icon:'👑', items:['vip_retention','vip_reactivation'] },
  { catKey:'sport',   icon:'⚽', items:['sport_event'] },
  { catKey:'tourn',   icon:'🏆', items:['tournament'] },
  { catKey:'other',   icon:'📌', items:['cashback','custom'] },
];

function getProgSteps() {
  return [t('prog_1'),t('prog_2'),t('prog_3'),t('prog_4'),t('prog_5')];
}
const GEO_LBL   = {eu:'🇪🇺 EU / UK',de:'🇩🇪 Germany',fr:'🇫🇷 France',es:'🇪🇸 Spain',it:'🇮🇹 Italy',nl:'🇳🇱 Netherlands',dk:'🇩🇰 Denmark',uk:'🇬🇧 UK',ru:'🌐 Russia',kz:'🇰🇿 Kazakhstan',br:'🇧🇷 Brazil',mx:'🇲🇽 Mexico',co:'🇨🇴 Colombia',ar:'🇦🇷 Argentina',pe:'🇵🇪 Peru',cl:'🇨🇱 Chile',mn:'🇲🇳 Mongolia',us:'🇺🇸 USA'};
const SEG_LBL   = {new:'Новые',mid:'Средние',vip:'VIP'};
const GEO_CURRENCY = {de:'EUR',fr:'EUR',es:'EUR',it:'EUR',nl:'EUR',dk:'DKK',uk:'GBP',ru:'RUB',kz:'KZT',br:'USD',mx:'USD',co:'USD',ar:'USD',pe:'USD',cl:'USD',mn:'MNT',us:'USD'};

// Returns undefined for unknown geo — callers decide the fallback
function getSitecurByGeo(geo) {
  const cur = GEO_CURRENCY[geo];
  if (!cur && geo) console.warn('[getSitecurByGeo] unknown geo:', geo);
  return cur;
}

// ── Geo list + currency toggle (identical model to the Configurator) ──────────
// Single source is geo-data.js. Backend computes in geo.cur (LatAm = USD); the
// currency toggle only changes the DISPLAY currency (region-local default / USD),
// converting the API response for rendering — the backend is never re-scaled.
function genCurMode() { return draft.params._curMode || 'local'; }
function genGeo() { return window.GeoData.of(draft.params.geo || 'de'); }
function genDispFactor() { return window.GeoData.curFactor(genGeo(), genCurMode()); }
function genDispCur() { return window.GeoData.dispCur(genGeo(), genCurMode()); }

// Populate #p-geo with region-grouped country options from geo-data.js.
function genFillGeoSelect() {
  const sel = document.getElementById('p-geo');
  if (!sel || !window.GeoData) return;
  if (!draft.params.geo) draft.params.geo = 'de';
  const lang = (typeof currentLang !== 'undefined' && currentLang === 'ru') ? 'ru' : 'en';
  sel.innerHTML = window.GeoData.groups(lang).map(gr =>
    `<optgroup label="${gr.label}">` +
    gr.items.map(g => `<option value="${g.val}"${g.val === draft.params.geo ? ' selected' : ''}>${g.lbl}</option>`).join('') +
    `</optgroup>`
  ).join('');
  genRenderCurToggle();
}

// Currency toggle chips (hidden when the geo has no local≠USD choice).
function genRenderCurToggle() {
  const box = document.getElementById('p-cur-toggle');
  if (!box) return;
  const geo = genGeo();
  if (!geo || geo.local === 'USD') { box.innerHTML = ''; return; }
  const mode = genCurMode();
  const lbl = (typeof currentLang !== 'undefined' && currentLang === 'ru') ? 'Валюта отображения' : 'Display currency';
  box.innerHTML =
    `<div style="font-size:11px;color:var(--muted);margin-bottom:4px">${lbl}</div>` +
    `<div class="chip-group" style="gap:6px">` +
    `<div class="chip${mode==='local'?' active':''}" onclick="genSetCurMode('local')">${geo.local}</div>` +
    `<div class="chip${mode==='usd'?' active':''}" onclick="genSetCurMode('usd')">USD</div></div>`;
}

// Direct country selection (grouped select) — sets geo + backend sitecur + lang + lic.
function genPickGeo(geo) {
  draft.params.geo = geo;
  draft.params._curMode = 'local';
  draft.params.sitecur = getSitecurByGeo(geo) ?? 'USD';
  // Invalidate any prior result — it was generated for the old geo/currency, so
  // converting it by the new geo's factor would be wrong (goStep(3) regenerates).
  draft._apiResult = null;
  const lang = GEO_LANG[geo] || 'en';
  const langSel = document.getElementById('p-lang');
  if (langSel) langSel.value = lang;
  draft.params.lang = lang;
  draft.params.lic = 'auto';
  document.querySelectorAll('.chip[data-g="lic"]').forEach(c => c.classList.toggle('active', c.dataset.v === 'auto'));
  genRenderCurToggle();
}

function genSetCurMode(mode) {
  draft.params._curMode = mode;
  genRenderCurToggle();
  // Re-render the result view (if already generated) in the new display currency.
  if (draft._apiResult && !draft._apiResult.error && document.getElementById('econCard')) {
    renderMechanicResults(draft._apiResult);
  }
}

// Convert a /api/campaign/generate response to the display currency (pure).
// Scales sitecur money fields; leaves USD benchmarks (arpu/cac/ltv3/mBudget) and
// ratios untouched. factor === 1 → returns the input unchanged.
function genConvertData(raw, factor, toCur) {
  if (!raw || factor === 1) return raw;
  const d = JSON.parse(JSON.stringify(raw));
  const num = v => (typeof v === 'number' ? Math.round(v * factor) : v);
  // "1700 USD" | "∞" → "9350 BRL" (scale + relabel; passes non-amounts through).
  const moneyStr = s => {
    if (typeof s !== 'string') return s;
    const m = s.match(/^([\d.,]+)\s*([A-Za-z]+)?$/);
    if (!m) return s;
    return `${Math.round(parseFloat(m[1].replace(/,/g, '')) * factor).toLocaleString('en')} ${toCur}`;
  };
  const convMech = m => {
    if (!m || typeof m !== 'object') return;
    for (const k of ['maxB', 'minD', 'amt']) if (typeof m[k] === 'number') m[k] = num(m[k]);
    // Cashback amounts are "N CUR" strings (not numbers) — convert + relabel too.
    for (const k of ['minLoss', 'maxAmt']) if (typeof m[k] === 'string') m[k] = moneyStr(m[k]);
    if (Array.isArray(m.tiers)) m.tiers.forEach(t => { t.from = moneyStr(t.from); t.to = moneyStr(t.to); });
    if (typeof m.cur === 'string') m.cur = toCur;
  };
  if (typeof d.cur === 'string') d.cur = toCur;
  convMech(d.mechanic);
  for (const map of ['allMechanics', 'selectedMechanics']) {
    if (d[map] && typeof d[map] === 'object') Object.values(d[map]).forEach(convMech);
  }
  const e = d.econ;
  if (e && typeof e === 'object') {
    for (const k of ['bonusSize', 'maxRisk', 'stressTest']) if (typeof e[k] === 'number') e[k] = num(e[k]);
    for (const s of ['sP10', 'sP50', 'sP90']) {
      const sc = e[s]; if (!sc) continue;
      if (typeof sc.cost === 'number') sc.cost = num(sc.cost);
      if (typeof sc.payout === 'number') sc.payout = +(sc.payout * factor).toFixed(2);
      if (typeof sc.turnover === 'number') sc.turnover = num(sc.turnover);
    }
    if (e.chain && typeof e.chain === 'object') {
      if (typeof e.chain.chainCost === 'number') e.chain.chainCost = num(e.chain.chainCost);
      if (typeof e.chain.chainMaxRisk === 'number') e.chain.chainMaxRisk = num(e.chain.chainMaxRisk);
      if (Array.isArray(e.chain.steps)) e.chain.steps.forEach(st => {
        if (typeof st.bonusSize === 'number') st.bonusSize = +(st.bonusSize * factor).toFixed(2);
        if (typeof st.cost === 'number') st.cost = num(st.cost);
      });
    }
    // arpu / cac / ltv3 / mBudget / totLTV stay USD; costRatio/roi3 are ratios.
  }
  return d;
}

// The current API result converted to the display currency (for all render sites).
function genDispData() { return genConvertData(draft._apiResult, genDispFactor(), genDispCur()); }

// ── STATE ─────────────────────────────────────────────────────────────────────
let draft = { scenario: null, params: { vertical:'casino', segment:'mid', games:'slots', tone:'friendly', agg:'low', risk:'mid', lic:'auto' } };

// ── VIEWS ─────────────────────────────────────────────────────────────────────
function showView(name) {
  if (typeof closeMenu === 'function') closeMenu();
  currentView = name;
  ['dashboard','campaigns','offer-gen','configurator','wizard','campaign-detail'].forEach(v => {
    const el = document.getElementById('view-'+v);
    if (!el) return;
    if (v === name) el.style.display = v === 'campaign-detail' ? 'flex' : '';
    else el.style.display = 'none';
  });
  updateTopbar(name);
  document.getElementById('tb-right').innerHTML = (name === 'dashboard' || name === 'configurator') ? '' :
    `<button class="btn btn-primary btn-sm" onclick="confirmNewCampaign()">${t('btn_new_camp')}</button>`;
  document.querySelectorAll('.nav-item:not(.off)').forEach(el => {
    const onclick = el.getAttribute('onclick') || '';
    const href    = el.getAttribute('href') || '';
    el.classList.toggle('active',
      (name==='dashboard'    && onclick.includes("'dashboard'")) ||
      (name==='campaigns'    && onclick.includes("'campaigns'")) ||
      (name==='offer-gen'    && href.includes('view=offer-gen')) ||
      (name==='wizard'       && href.includes('view=wizard')) ||
      (name==='detail'       && onclick.includes("'campaigns'")) ||
      href.includes('/generator.html')
    );
  });
  if (name === 'campaigns' || name === 'offer-gen') renderCampaignViews();
  updateCampaignBadge();
}

function updateCampaignBadge() {
  updateBadge('camp-nav-badge', 'be_campaigns');
  updateBadge('nav-tourn-badge', 'savedTournaments');
}

// ── WIZARD ────────────────────────────────────────────────────────────────────
function startWizard() {
  draft = { scenario:null, _step:1, params:{vertical:'casino',segment:'mid',games:'slots',tone:'friendly',agg:'low',risk:'mid',lic:'auto', bonusTypes:['reload']} };
  renderScenarios();
  goStep(1);
  showView('wizard');
}

function startWizardWith(id) {
  startWizard();
  setTimeout(() => {
    const el = document.querySelector(`.sc-item[data-id="${id}"]`);
    if (el) el.click();
  }, 50);
}

function goStep(n) {
  draft._step = n;
  updateProg(n);
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step-'+n).classList.add('active');
  if (n === 2) {
    // Region-grouped country select from geo-data.js (identical to Configurator).
    genFillGeoSelect();
    updateRiskHint(draft.params.risk || 'mid');
  }
  if (n === 3) {
    // Every geo option is a country (grouped select) — take it directly.
    const geoSel = document.getElementById('p-geo').value;
    draft.params.geo = geoSel;
    draft.params.sitecur = getSitecurByGeo(geoSel) ?? 'USD';
    draft.params.budget  = parseFloat(document.getElementById('p-budget').value) || 5000;
    draft.params.players = parseInt(document.getElementById('cg-pnum').value) || 5000;
    draft.params.lang   = document.getElementById('p-lang').value;
    document.getElementById('s3-prog').style.display='';
    document.getElementById('s3-res').style.display='none';
    runProgress();
  }
  if (n === 4) {
    if (!draft.texts) {
      loadStep4();
    } else {
      document.getElementById('s4next').disabled = false;
    }
  }
  if (n === 5) { document.getElementById('s5-export').style.display=''; document.getElementById('s5-done').style.display='none'; fillSummary(); }
}

function updateProg(active) {
  for (let i=1; i<=5; i++) {
    const c = document.getElementById('wpc-'+i);
    const l = document.getElementById('wpl-'+i);
    c.className = 'wp-circle' + (i<active?' done':i===active?' active':'');
    c.textContent = i < active ? '✓' : i;
    l.className = 'wp-lbl' + (i===active?' active':'');
    if (i<5) document.getElementById('wpcon-'+i).className = 'wp-conn'+(i<active?' done':'');
  }
}

// ── STEP 1 ────────────────────────────────────────────────────────────────────
function renderScenarios() {
  const selId = draft.scenario?.id;
  document.getElementById('scGrid').innerHTML = SCENARIOS.map(cat => `
    <div class="sc-cat">
      <div class="sc-cat-hd"><span>${cat.icon}</span>${t('sc_cat_'+cat.catKey)}</div>
      <div class="sc-items">${cat.items.map(id =>
        `<button class="sc-item${id===selId?' sel':''}" data-id="${id}"
           onclick="selScenario('${id}',this)">${t('sc_'+id)}</button>`
      ).join('')}</div>
    </div>`).join('');
}

const SEGMENT_PRESETS = {
  first_launch:     'new',
  first_dep:        'new',
  vip_retention:    'vip',
  vip_reactivation: 'vip',
};

const BTYPE_PRESETS = {
  first_launch:     ['welcome','ndb','dep2','dep3','cashback'],
  inactive_3:       ['reload'],
  inactive_7:       ['reload','cashback'],
  inactive_30:      ['reload','cashback','dep2'],
  churn_risk:       ['cashback','reload'],
  return_win:       ['reload'],
  return_loss:      ['cashback'],
  first_dep:        ['welcome','ndb'],
  second_dep:       ['dep2','reload'],
  big_dep:          ['welcome','cashback'],
  vip_retention:    ['cashback'],
  vip_reactivation: ['cashback','reload'],
  sport_event:      ['reload'],
  tournament:       ['reload','cashback'],
  cashback:         ['cashback'],
  custom:           ['welcome','reload'],
};

function preselectBtypes(scenarioId) {
  const types = BTYPE_PRESETS[scenarioId] || ['reload'];
  document.querySelectorAll('#btypeGroup .chip-multi').forEach(c => {
    c.classList.toggle('active', types.includes(c.dataset.btype));
  });
  draft.params.bonusTypes = [...types];

  const seg = SEGMENT_PRESETS[scenarioId] || 'mid';
  document.querySelectorAll('[data-g="segment"]').forEach(c => {
    c.classList.toggle('active', c.dataset.v === seg);
  });
  draft.params.segment = seg;
}

function toggleBtype(el) {
  el.classList.toggle('active');
  const sel = [...document.querySelectorAll('#btypeGroup .chip-multi.active')].map(c => c.dataset.btype);
  draft.params.bonusTypes = sel; // [] when nothing selected — schema rejects null, accepts empty array
}

function selScenario(id, el) {
  document.querySelectorAll('.sc-item').forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
  const cat = SCENARIOS.find(c => c.items.includes(id));
  draft.scenario = { id, cat: t('sc_cat_'+(cat?.catKey||'')), lbl: t('sc_'+id) };
  document.getElementById('s1next').disabled = false;
  preselectBtypes(id);
}

// ── STEP 2 ────────────────────────────────────────────────────────────────────
const GEO_LANG = { de:'de', fr:'en', es:'es', it:'en', nl:'en', dk:'da', uk:'en', ru:'ru', kz:'ru', br:'es', mx:'es', co:'es', ar:'es', pe:'es', cl:'es', mn:'mn', us:'en', eu:'en' };
// (geo selection is handled by genPickGeo / genFillGeoSelect above — the old
//  EU-expander helpers syncLangToGeo/pickEuCountry were removed with the flat select.)

function pickChip(el) {
  const g = el.dataset.g;
  document.querySelectorAll(`.chip[data-g="${g}"]`).forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  draft.params[g] = el.dataset.v;
}
const RISK_HINTS = {
  ru: {
    low:  { color:'#10b981', text:'<b>Вейджер +10×</b> к базовому значению региона. Оператор лучше защищён от бонусных злоупотреблений, но бонус становится менее привлекательным — меньше игроков дойдут до выплаты.' },
    mid:  { color:'#4f6ef7', text:'<b>Вейджер без изменений</b> — рыночный стандарт региона. Оптимальный баланс между затратами оператора и привлекательностью бонуса для игрока.' },
    high: { color:'#f59e0b', text:'<b>Вейджер −8×</b> от базового значения. Более мягкие условия → выше конверсия и привлекательность бонуса, но выше вероятность выплаты → увеличиваются затраты.' },
  },
  en: {
    low:  { color:'#10b981', text:'<b>Wager +10×</b> above the regional base. Better operator protection against bonus abuse, but the bonus becomes less attractive — fewer players will complete wagering.' },
    mid:  { color:'#4f6ef7', text:'<b>Wager unchanged</b> — regional market standard. Optimal balance between operator costs and bonus attractiveness for players.' },
    high: { color:'#f59e0b', text:'<b>Wager −8×</b> below the regional base. More lenient terms → higher conversion and bonus appeal, but higher payout likelihood → increased campaign costs.' },
  },
};

function updateRiskHint(val) {
  const el = document.getElementById('riskHint');
  if (!el) return;
  const lang = currentLang === 'ru' ? 'ru' : 'en';
  const h = RISK_HINTS[lang][val];
  if (!h) { el.style.display = 'none'; return; }
  el.style.borderLeftColor = h.color;
  el.style.display = '';
  el.innerHTML = h.text;
}

function pickT3(el) {
  el.closest('.toggle3').querySelectorAll('.t3-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  draft.params[el.dataset.g] = el.dataset.v;
  if (el.dataset.g === 'risk') updateRiskHint(el.dataset.v);
}

function syncCGPlayers(src) {
  const rng = document.getElementById('cg-prange');
  const num = document.getElementById('cg-pnum');
  const dsp = document.getElementById('cg-pdsp');
  let v;
  if (src === 'range') {
    v = parseInt(rng.value) || 5000;
    num.value = v;
  } else {
    v = parseInt(num.value) || 5000;
    rng.value = Math.min(v, parseInt(rng.max));
  }
  dsp.textContent = v.toLocaleString();
  draft.params.players = v;
}

// ── STEP 3 PROGRESS + API ─────────────────────────────────────────────────────
function runProgress() {
  document.getElementById('s3-prog').style.display = '';
  document.getElementById('s3-res').style.display  = 'none';
  const PROG_STEPS = getProgSteps();
  document.getElementById('progList').innerHTML = PROG_STEPS.map((lbl,i) =>
    `<li class="pl-item" id="pl-${i+1}"><span class="pl-icon">⏳</span>${lbl}</li>`).join('');

  // fire API call immediately, parallel to animation
  draft._apiResult = null;
  draft._apiPromise = fetch('/api/campaign/generate', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ scenario: draft.scenario, params: draft.params }),
  })
  .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
  .then(data => { draft._apiResult = data; })
  .catch(err  => { draft._apiResult = { error: err?.message || err?.error || String(err) }; });

  let i = 0;
  (function tick() {
    if (i > 0) {
      const p = document.getElementById('pl-'+i);
      if (p) { p.className='pl-item done'; p.innerHTML=`<span class="pl-icon">✅</span>${PROG_STEPS[i-1]}`; }
    }
    if (i < PROG_STEPS.length) {
      const cur = document.getElementById('pl-'+(i+1));
      if (cur) { cur.className='pl-item running'; cur.innerHTML=`<div class="spinner"></div>${PROG_STEPS[i]}`; }
      i++; setTimeout(tick, 750);
    } else {
      // wait for API if it hasn't resolved yet
      Promise.resolve(draft._apiPromise).then(() => {
        setTimeout(() => {
          document.getElementById('s3-prog').style.display = 'none';
          renderMechanicResults(draft._apiResult);
          document.getElementById('s3-res').style.display = '';
        }, 350);
      });
    }
  })();
}

// ── STEP 3 RENDER ─────────────────────────────────────────────────────────────
function _toggleEconExpert() {
  const wrap = document.getElementById('econ-wrap');
  if (!wrap) return;
  const isExpert = wrap.dataset.expert === '1';
  wrap.dataset.expert = isExpert ? '0' : '1';
  localStorage.setItem('cg_expert_mode', isExpert ? '0' : '1');
  const btn = document.getElementById('econ-expert-toggle');
  if (btn) btn.textContent = isExpert ? t('econ_show_analysis') : t('econ_collapse');
}

function renderEconScenarios(econ, _unused, _unused2, cur, lang, fullData) {
  const isRu = lang === 'ru';
  const fmt  = v => cur + ' ' + Math.round(v).toLocaleString();
  const pct  = v => (v * 100).toFixed(1) + '%';

  const seg2        = draft?.params?.segment || 'mid';
  const storedMode  = localStorage.getItem('cg_expert_mode');
  const expertMode  = storedMode !== null ? storedMode === '1' : seg2 === 'vip';
  const toggleLbl  = expertMode ? t('econ_collapse') : t('econ_show_analysis');

  const pl      = econ.pl;
  const p10cost = econ.sP10.cost;
  const p50cost = econ.sP50.cost;
  const p90cost = econ.sP90.cost;
  // base = pl * avgdep; derive from p50cost and pre-computed costRatio to avoid needing dep
  const base    = econ.costRatio > 0 ? p50cost / econ.costRatio : p50cost;
  const p10r    = p10cost / base;
  const p50r    = econ.costRatio;
  const p90r    = p90cost / base;

  const scale = v => Math.min(v * 200, 100);
  const p10w  = scale(p10r);
  const p50w  = scale(p50r - p10r);
  const p90w  = scale(p90r - p50r);

  // conv values from calcScenario: P10=0.10, P50=0.20, P90=0.40
  const conv10 = econ.sP10.conv ?? 0.10;
  const conv50 = econ.sP50.conv ?? 0.20;
  const conv90 = econ.sP90.conv ?? 0.40;
  // Cost per player who actually received and completed the bonus
  const cpp10 = pl * conv10 > 0 ? p10cost / (pl * conv10) : 0;
  const cpp50 = pl * conv50 > 0 ? p50cost / (pl * conv50) : 0;
  const cpp90 = pl * conv90 > 0 ? p90cost / (pl * conv90) : 0;

  const L = isRu
    ? { p10:'Лучший сценарий', p50:'Ожидаемый', p90:'Худший сценарий',
        badge:'Базовый', perPlayer:'Стоимость на бонус', conv:'Отыграют вейджер',
        ratio:'Нагрузка на депозиты', ratioHint:'% от депозитного оборота',
        total:'суммарные затраты на кампанию', range:'Диапазон нагрузки на депозиты',
        legend:'Нагрузка на депозиты — какую долю депозитного оборота составят затраты на бонусы. До 20% — норма, 20–40% — повышенный риск, выше 40% — пересмотрите параметры.',
        n10:'Мало игроков дойдёт до конца вейджера — бонус почти не выплачивается',
        n50:'Реалистичная медиана — используйте для планирования бюджета',
        n90:'Кампания выстреливает — установите здесь потолок бюджета',
        tip_cpp:'Средние затраты на одного игрока, который дошёл до конца вейджера и получил выплату. Считается: суммарные затраты ÷ (игроки × конверсия).',
        tip_ratio:'Отношение затрат на бонусы к общему депозитному обороту. Норма: до 20%. 20–40% — повышенный риск. Выше 40% — пересмотрите вейджер или % бонуса.',
        tip_conv:'Доля игроков, которые выполнят вейджерное требование до конца и получат выплату по бонусу. Остальные теряют бонус досрочно.' }
    : { p10:'Best case', p50:'Expected', p90:'Worst case',
        badge:'Base scenario', perPlayer:'Cost per bonus', conv:'Will complete wager',
        ratio:'Deposit load', ratioHint:'% of total deposit turnover',
        total:'total campaign cost', range:'Deposit load range',
        legend:'Deposit load = bonus costs ÷ deposit turnover. Under 20% is healthy; 20–40% is elevated risk; above 40% — reconsider bonus terms.',
        n10:'Few players will complete wagering — bonus rarely pays out',
        n50:'Realistic median — use this for budget planning',
        n90:'Campaign over-performs — set budget ceiling here',
        tip_cpp:'Average cost per player who completed wagering and received a payout. Calculated as: total cost ÷ (players × conversion rate).',
        tip_ratio:'Bonus costs as a share of total deposit turnover. Healthy: under 20%. Elevated risk: 20–40%. Above 40% — reconsider wager multiplier or bonus %.',
        tip_conv:'Share of players expected to complete the wagering requirement and receive a bonus payout. The rest forfeit the bonus before finishing.' };

  const card = (cls, icon, label, cost, ratio, conv, cpp, note, badge) => `
    <div class="econ-scenario-card ${cls}">
      ${badge ? `<div class="econ-scenario-badge">${L.badge}</div>` : ''}
      <div class="econ-scenario-header">
        <span class="econ-scenario-icon">${icon}</span>
        <div>
          <span class="econ-scenario-label">${label}</span>
          <div style="font-size:.65rem;color:var(--muted);margin-top:1px">${isRu?'конверсия':'conv.'} ${Math.round(conv * 100)}%</div>
        </div>
      </div>
      <div class="econ-scenario-cost">${fmt(cost)}</div>
      <div class="econ-scenario-sub">${L.total}</div>
      <div class="econ-scenario-rows">
        <div class="econ-row econ-expert-only">
          <span class="tip" data-tip="${L.tip_cpp}">${L.perPlayer}</span>
          <span>${fmt(cpp)}</span>
        </div>
        <div class="econ-row econ-expert-only">
          <span class="tip" data-tip="${L.tip_ratio}">${L.ratio}</span>
          <span>${pct(ratio)}</span>
        </div>
        <div class="econ-row">
          <span class="tip" data-tip="${L.tip_conv}">${L.conv}</span>
          <span>${Math.round(conv * 100)}%</span>
        </div>
      </div>
      <div class="econ-scenario-note econ-expert-only">${note}</div>
    </div>`;

  return `
    <div id="econ-wrap" data-expert="${expertMode?'1':'0'}">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div class="econ-basic-only" style="font-size:.79rem;color:var(--muted)">
        ${isRu?'Ожидаемые затраты':'Expected cost'}: <strong style="color:var(--text)">${fmt(p50cost)}</strong>
        · ${isRu?'Конверсия':'Conv'}: <strong style="color:var(--text)">${Math.round(conv50*100)}%</strong>
        · <span style="color:${p50cost < econ.pl*(econ.arpu||65)*0.2?'#10b981':'#f59e0b'}">${p50cost < econ.pl*(econ.arpu||65)*0.2 ? '✓ ROI positive':'⚠ Review budget'}</span>
      </div>
      <div class="econ-expert-only"></div>
      <button id="econ-expert-toggle" onclick="_toggleEconExpert()"
        style="font-size:.73rem;color:var(--accent);background:none;border:none;cursor:pointer;padding:2px 6px;border-radius:5px;white-space:nowrap;margin-left:auto">
        ${toggleLbl}
      </button>
    </div>
    <div class="econ-expert-only" style="font-size:11px;color:#8892a4;line-height:1.6;margin-bottom:12px;padding:10px 12px;background:rgba(255,255,255,.03);border-radius:8px;border:1px solid rgba(255,255,255,.06)">
      💡 ${L.legend}
    </div>
    <div class="econ-scenarios-grid">
      ${card('econ-p10', '↘', L.p10, p10cost, p10r, conv10, cpp10, L.n10, false)}
      ${card('econ-p50', '→', L.p50, p50cost, p50r, conv50, cpp50, L.n50, true)}
      ${card('econ-p90', '↗', L.p90, p90cost, p90r, conv90, cpp90, L.n90, false)}
    </div>
    <div class="econ-range-wrap econ-expert-only">
      <div class="econ-range-label">${L.range}</div>
      <div class="econ-range-track">
        <div class="rp10" style="width:${p10w}%"></div>
        <div class="rp50" style="left:${p10w}%; width:${p50w}%"></div>
        <div class="rp90" style="left:${scale(p50r)}%; width:${p90w}%"></div>
      </div>
      <div class="econ-range-markers">
        <span>0%</span>
        <span class="mp10">${isRu ? 'Лучший' : 'Best'} ${pct(p10r)}</span>
        <span class="mp50">${isRu ? 'Ожидаемый' : 'Expected'} ${pct(p50r)}</span>
        <span class="mp90">${isRu ? 'Худший' : 'Worst'} ${pct(p90r)}</span>
        <span>50%</span>
      </div>
    </div>
    ${(()=>{
      try {
        // ── V2 MULTI-FACTOR RETENTION LIFT MODEL ──────────────────────────
        const fd  = fullData || {};
        const sel = fd.selectedMechanics || {};
        const W   = fd.mechanic || sel.welcome || {};
        const N   = sel.ndb      || {};
        const RL  = sel.reload   || {};
        const D2  = sel.dep2     || {};
        const FS  = fd.fsSpec   || null;
        const CB  = sel.cashback || {};
        const seg = draft?.params?.segment || 'mid';

        const SEG_LIFT = { new:0.25, mid:0.18, vip:0.12 };
        const base = SEG_LIFT[seg] || 0.10;

        // F1: Wager achievability — ratio of breakeven to actual wager
        const wagerX   = econ.wagerX || 30;
        const beW      = econ.breakeven_wager || wagerX;
        const wagScore = Math.min(2.0, Math.max(0.3, beW / Math.max(wagerX, 1)));
        const wagF     = Math.min(1.35, Math.max(0.65, 0.7 + 0.3 * wagScore));

        // F2: Bonus generosity — match %, neutral at 50%
        const matchPct = W.pct || (fd.econ ? 100 : 100);
        const genF     = Math.min(1.15, Math.max(0.85, 0.85 + 0.30 * Math.min(matchPct / 100, 1.0)));

        // F3: Mechanics breadth
        const hasNDB = (N.amt > 0) || (N.fs > 0);
        const hasRL  = (RL.pct || 0) > 0;
        const hasD2  = (D2.pct || 0) > 0;
        const hasFS  = FS && (FS.count || 0) > 20;
        const hasCB  = (CB.pct >= 5) || CB.model === 'tier';
        const mechF  = 1.0
          + (hasNDB ? 0.06 : 0)
          + (hasRL  ? 0.08 : 0)
          + (hasD2  ? 0.04 : 0)
          + (hasFS  ? 0.04 : 0)
          + (hasCB  ? 0.07 : 0);

        // F4: RTP quality
        const rtp  = econ.mixedRTP || 0.96;
        const rtpF = Math.min(1.06, Math.max(0.94, 0.94 + 0.12 * ((rtp - 0.85) / 0.14)));

        // F5: Platform
        const platKey = draft?.params?.plat || 'both';
        const platF   = { mobile:1.05, desk:0.97, both:1.0 }[platKey] || 1.0;

        const lift    = Math.min(0.40, base * wagF * genF * mechF * rtpF * platF);
        const activePl  = (draft?.params?.players && draft.params.players >= 100) ? draft.params.players : (econ.pl || pl);
        const isStale   = activePl !== (econ.pl || pl);
        const incrPl    = Math.round(activePl * lift);
        const incrRev   = Math.round(incrPl * (econ.ltv3 || 0));
        const campCost3 = Math.round(3 * (econ.acqCostRatio ?? econ.costRatio ?? 0) * activePl * econ.arpu);
        const netIncr   = incrRev - campCost3;

        const fmtU    = v => '$' + Math.abs(Math.round(v)).toLocaleString();
        const fmtF    = f => '×' + f.toFixed(2);
        const fClr    = f => f > 1.015 ? '#10b981' : f < 0.985 ? '#EF4444' : '#8892a4';
        const netCol  = netIncr > 0 ? '#10b981' : '#EF4444';
        const segLbl  = { new: isRu?'Новые':'New', mid: isRu?'Средние':'Mid', vip:'VIP' }[seg] || seg;

        const mechParts = [
          hasNDB && 'NDB', hasRL && 'Reload',
          hasD2  && (isRu ? '2й деп' : '2nd dep'),
          hasFS  && 'FS>20',
          hasCB  && (isRu ? 'Кэшбэк' : 'Cashback'),
        ].filter(Boolean);
        const mechNote = mechParts.length ? '+' + mechParts.join(' +') : (isRu ? 'только Welcome' : 'Welcome only');
        const wagNote  = wagF > 1.01
          ? `be ${beW}× > w ${wagerX}× ▲`
          : `be ${beW}× ≤ w ${wagerX}× ▼`;
        const rtpNote  = `${(rtp*100).toFixed(0)}% ${rtp >= 0.96 ? '▲' : rtp <= 0.92 ? '▼' : ''}`;

        // Labels
        const L2 = isRu ? {
          title:'📈 Прогноз Incremental Revenue',
          base:'Базовый лифт', fw:'F1 Вейджер', fg:'F2 Щедрость',
          fm:'F3 Механики', fr:'F4 RTP', fp:'F5 Платформа',
          total:'Итоговый лифт', players:'Доп. игроков (3 мес)',
          rev:'Доп. выручка (3 мес)', revTip:'Incremental_players × LTV 3 мес.',
          cost:'Затраты на бонусы: Welcome+NDB (3 мес)', net:'Чистый прирост',
          netTip:'Доп. выручка − затраты за 3 мес.',
          disc:'Оценка на основе бенчмарков. Реальные результаты зависят от продукта, CRM и аудитории.',
        } : {
          title:'📈 Incremental Revenue Forecast',
          base:'Base lift', fw:'F1 Wager', fg:'F2 Generosity',
          fm:'F3 Mechanics', fr:'F4 RTP', fp:'F5 Platform',
          total:'Total lift', players:'Addl. players (3 mo)',
          rev:'Addl. revenue (3 mo)', revTip:'Incremental_players × LTV 3 mo.',
          cost:'Bonus cost: Welcome+NDB (3 mo)', net:'Net incremental',
          netTip:'Addl. revenue − campaign cost over 3 months.',
          disc:'Estimate based on industry benchmarks. Actual results depend on product quality, CRM and audience.',
        };

        const fRow = (lbl, val, valCol, note) => `
          <div style="display:flex;align-items:baseline;gap:4px;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:10.5px">
            <span style="color:#8892a4;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lbl}</span>
            <span style="font-family:monospace;font-weight:700;color:${valCol};white-space:nowrap">${val}</span>
            <span style="color:#8892a4;font-size:9px;white-space:nowrap;min-width:80px;text-align:right">${note||''}</span>
          </div>`;
        const mRow = (lbl, val, valCol, tip) => `
          <div class="mech-row" style="border-bottom:1px solid rgba(255,255,255,.05)">
            <span class="mr-l">${tip?`<span class="tip" data-tip="${tip}">${lbl}</span>`:lbl}</span>
            <span class="mr-v" style="color:${valCol||'var(--text)'}">${val}</span>
          </div>`;

        return `
          <div style="margin-top:14px;padding:12px;background:rgba(16,185,129,0.05);border-radius:10px;border:1px solid rgba(16,185,129,0.18)">
            <div style="font-size:11px;font-weight:700;color:#10b981;margin-bottom:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              ${L2.title}
              <span style="padding:1px 7px;border-radius:4px;font-size:9px;background:rgba(79,110,247,.18);color:#a0b0ff;font-weight:700">${segLbl}</span>
              ${isStale ? `<span id="incr-stale" style="font-size:.7rem;padding:1px 7px;border-radius:99px;background:rgba(245,158,11,.15);color:#f59e0b">↻ ${isRu?'обновите прогноз':'regenerate for updated forecast'}</span>` : ''}
            </div>
            <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:6px 8px;margin-bottom:8px">
              ${fRow(L2.base + ` (${(base*100).toFixed(0)}%)`, '', '#a0b0ff', '')}
              ${fRow(L2.fw, fmtF(wagF), fClr(wagF), wagNote)}
              ${fRow(L2.fg, fmtF(genF), fClr(genF), matchPct+'% match')}
              ${fRow(L2.fm, fmtF(mechF), fClr(mechF), mechNote)}
              ${fRow(L2.fr, fmtF(rtpF), fClr(rtpF), rtpNote)}
              ${platKey !== 'both' ? fRow(L2.fp, fmtF(platF), fClr(platF), platKey) : ''}
              <div style="border-top:1px solid rgba(255,255,255,.1);margin-top:3px;padding-top:5px;display:flex;justify-content:space-between;align-items:baseline">
                <span style="font-size:11px;color:#8892a4;font-weight:600">${L2.total}</span>
                <span style="font-size:14px;font-weight:800;color:#10b981">${(lift*100).toFixed(1)}%</span>
              </div>
            </div>
            ${mRow(L2.players, '+'+incrPl.toLocaleString(), '#10b981', null)}
            ${mRow(L2.rev, fmtU(incrRev)+' ~USD', '#10b981', L2.revTip)}
            ${mRow(L2.cost, fmtU(campCost3)+' ~USD', '#8892a4', null)}
            <div class="mech-row" style="border-bottom:none;margin-top:4px;border-top:1px solid rgba(255,255,255,.1);padding-top:6px">
              <span class="mr-l" style="font-weight:700">${L2.net}</span>
              <span class="mr-v" style="color:${netCol};font-weight:700;font-size:13px">${netIncr>=0?'+':'−'}${fmtU(netIncr)} ~USD</span>
            </div>
            <div style="font-size:9.5px;color:#8892a4;margin-top:6px;font-style:italic">* ${L2.disc}</div>
            <div style="margin-top:8px">
              <button onclick="(function(b){var d=document.getElementById('model-assumptions-cg');if(!d)return;var open=d.style.display!=='none';d.style.display=open?'none':'';b.textContent=open?'ℹ '+(${JSON.stringify(isRu?'Допущения модели ▾':'Model assumptions ▾')}): 'ℹ '+(${JSON.stringify(isRu?'Скрыть ▴':'Collapse ▴')});}).call(this)"
                style="font-size:9px;color:#8892a4;background:none;border:none;cursor:pointer;padding:0;font-family:inherit">
                ℹ ${isRu?'Допущения модели ▾':'Model assumptions ▾'}
              </button>
              <div id="model-assumptions-cg" style="display:none;margin-top:6px;font-size:9px;color:#8892a4;background:rgba(255,255,255,.03);border-radius:6px;padding:7px 9px;line-height:1.7">
                ${isRu?'База: Новые 25% · Средние 18% · VIP 12%':'Base lift: New 25% · Mid 18% · VIP 12%'}<br>
                ${isRu?'Потолок лифта: max 40%':'Lift cap: max 40%'}<br>
                ${isRu?'F1 Вейджер: score>1 когда beW<wagerX':'F1 Wager: score>1 when beW<wagerX'}<br>
                ${isRu?'F2 Щедрость: нейтрально при 50% match':'F2 Generosity: neutral at 50% match'}<br>
                ${isRu?'F3 Механики: +6% NDB, +8% Reload, +7% Cashback':'F3 Mechanics: +6% NDB, +8% Reload, +7% Cashback'}<br>
                ${isRu?'F4 RTP: диапазон 85%–99%':'F4 RTP: range 85%–99%'}<br>
                ${isRu?'F5 Платформа: Mobile +5%, Desktop −3%':'F5 Platform: Mobile +5%, Desktop −3%'}<br>
                ${isRu?'ARPU бенчмарк:':'ARPU benchmark:'} ${econ.arpu} USD/mo
              </div>
            </div>
            ${netIncr < 0 ? (() => {
              window._lastCGIncrData = {
                geo: draft?.params?.geo || 'de',
                segment: seg,
                lift: { wagFactor: wagF, wagerX, beW, genFactor: genF, matchPct,
                        mechFactor: mechF, hasNDB, hasReload: hasRL, hasDep2: hasD2,
                        hasFS, hasCB, rtpFactor: rtpF, rtp, platFactor: platF,
                        plat: platKey, base, lift },
                economics: { net: netIncr, campCost3, incrRev, incrPl, pl: activePl },
                isRu,
              };
              return `<div id="cg_incr_ai_btn_wrap" style="margin-top:10px">
                <button onclick="_cgRunOptimize(this)"
                  style="width:100%;padding:7px 12px;background:rgba(99,102,241,.18);border:1px solid rgba(99,102,241,.45);
                         border-radius:8px;color:#a5b4fc;font-size:12px;cursor:pointer;font-weight:600;transition:background .2s"
                  onmouseover="this.style.background='rgba(99,102,241,.32)'" onmouseout="this.style.background='rgba(99,102,241,.18)'">
                  ${isRu ? '🤖 Рекомендации AI' : '🤖 AI Recommendations'}
                </button>
              </div>
              <div id="cg_incr_ai_result"></div>`;
            })() : ''}
          </div>`;
      } catch(e) { return ''; }
    })()}
    ${(()=>{
      try {
        const ch = econ.chain;
        if (!ch || !ch.chainCost) return '';
        // Only show the deposit funnel when the chain is actually selected
        // (both dep2 and dep3 in the campaign), and only its selected steps.
        const sel = econ.selectedTypes || (fullData && fullData.requestedTypes) || [];
        if (!(sel.includes('dep2') && sel.includes('dep3'))) return '';
        const stepLbls = { welcome: t('chain_step_welcome'), dep2: t('chain_step_dep2'), dep3: t('chain_step_dep3') };
        const rClr = ch.chainCostRatio < 0.10 ? '#10b981' : ch.chainCostRatio < 0.25 ? '#10b981' : ch.chainCostRatio < 0.40 ? '#f59e0b' : '#ef4444';
        const stepRows = (ch.steps || []).filter(s => s.cost > 0 && (s.key === 'welcome' || sel.includes(s.key))).map(s => `
          <div style="display:flex;align-items:baseline;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:11px">
            <span style="color:#8892a4;flex:1">${stepLbls[s.key] || s.key}</span>
            <span style="color:#8892a4;margin:0 8px;font-size:10px">×${Math.round(s.cohort*100)}% ${t('chain_cohort')}</span>
            <span style="font-family:monospace;font-weight:700;color:var(--text)">${fmt(s.cost)}</span>
          </div>`).join('');
        return `
          <div style="margin-top:12px;padding:10px 12px;background:rgba(160,176,255,.04);border-radius:9px;border:1px solid rgba(160,176,255,.14)">
            <div style="font-size:11px;font-weight:700;color:#a0b0ff;margin-bottom:8px">⛓ ${t('chain_title')}</div>
            ${stepRows}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.08)">
              <span style="font-size:11px;font-weight:700;color:var(--text)">${t('chain_total')}</span>
              <span style="font-family:monospace;font-weight:800;color:var(--text)">${fmt(ch.chainCost)}</span>
              <span style="font-size:11px;font-weight:700;color:${rClr};margin-left:10px">${(ch.chainCostRatio*100).toFixed(1)}% ${t('chain_ratio_lbl')}</span>
            </div>
          </div>`;
      } catch(e) { return ''; }
    })()}
    </div>`;
}

function mechRows(mech, type, data) {
  const cur = data.cur;
  const wager = data.wager;
  const rows = [];
  if (!mech) return `<div style="color:var(--muted);font-size:.82rem">${t('mr_na')}</div>`;

  if (type === 'cashback') {
    rows.push([t('mr_type'), 'Cashback']);
    if (mech.model === 'tier') {
      rows.push([t('mr_model'), t('mr_tiered'), 'acc']);
      rows.push([t('mr_period'), t('mr_monthly')]);
      rows.push([t('mr_maxamt'), mech.maxAmt || '—']);
      rows.push([t('mr_wager'), t('det_no_wager'), 'gn']);
    } else {
      rows.push([t('mr_pct_back'), (mech.pct || 10) + '%', 'acc']);
      rows.push([t('mr_period'), t('mr_weekly')]);
      rows.push([t('mr_minloss'), mech.minLoss || '—']);
      rows.push([t('mr_maxamt'), mech.maxAmt || '—']);
      rows.push([t('mr_wager'), t('det_no_wager'), 'gn']);
    }
  } else if (mech.type === 'packages') {
    rows.push([t('mr_type'), 'Sweepstakes Packages', 'acc']);
    rows.push([t('mr_pkgs'), (mech.pkgs || []).map(p => p.price).join(' / ') || '—']);
  } else {
    const lbl = { welcome:t('mt_welcome'), dep2:t('mt_dep2'), dep3:t('mt_dep3'), reload:t('mt_reload') }[type] || 'Match Bonus';
    rows.push([t('mr_type'), lbl, 'acc']);
    rows.push(['Match %', (mech.pct || 100) + '%']);
    rows.push([t('mr_maxb'), (mech.maxB || '—') + ' ' + (mech.cur || cur)]);
    rows.push([t('mr_mind'), (mech.minD || '—') + ' ' + (mech.cur || cur)]);
    const w = mech.wager != null ? mech.wager : (wager?.wW || wager?.wR || '—');
    rows.push([t('mr_wager'), w + '×']);
    if (mech.fs) rows.push([t('mr_fs'), mech.fs + ' FS']);
    rows.push([t('mr_days'), (mech.days || 30) + t('mr_days_sfx')]);
    if (mech.code) rows.push([t('mr_promo'), mech.code]);
  }
  return rows.map(([l, v, cls]) =>
    `<div class="mech-row">
      <span class="mr-l">${l}</span>
      <span class="mr-v" style="${cls==='acc'?'color:var(--accent)':cls==='gn'?'color:var(--success)':''}">${v}</span>
    </div>`
  ).join('');
}

function renderMechanicResults(data) {
  if (!data || data.error) {
    document.getElementById('mechCard').innerHTML =
      `<div class="rc-title">${t('rc_mech')}</div>
       <div style="color:#EF4444;font-size:.83rem;padding:8px 0">⚠️ ${currentLang==='en'?'Error':'Ошибка'}: ${data?.error || t('ec_nosrv')}</div>`;
    return;
  }

  draft.mechanics      = data.mechanic;
  draft.mechanicType   = data.mechanicType;
  draft.explanation    = data.explanation;
  draft.explanationRu  = data.explanationRu;
  draft.explanationEn  = data.explanationEn;
  draft.alternatives   = data.alternatives;
  draft.econ           = data.econ;

  // draft.* above keep the raw (backend-currency) values for AI payloads; from
  // here on render in the display currency (factor === 1 → unchanged).
  data = genConvertData(data, genDispFactor(), genDispCur());

  // Mechanic card — tabs if multiple types selected
  const types = data.requestedTypes || [data.mechanicType];
  const TAB_LBL = {
    welcome:  '💰 ' + t('mt_welcome'),
    ndb:      '🎁 ' + t('mt_ndb'),
    reload:   '🔄 ' + t('mt_reload'),
    dep2:     '💰 ' + t('mt_dep2'),
    dep3:     '🎁 ' + t('mt_dep3'),
    cashback: '💳 Cashback',
  };
  if (types.length > 1) {
    const tabs = types.map((tp, i) =>
      `<button class="mech-tab${i===0?' active':''}" onclick="switchMechTab('${tp}',this)">${TAB_LBL[tp]||tp}</button>`
    ).join('');
    document.getElementById('mechCard').innerHTML =
      `<div class="rc-title">${t('rc_mechs')} · ${types.length}</div>
       <div class="mech-tabs">${tabs}</div>
       <div id="mechTabContent">${mechRows(data.mechanic, data.mechanicType, data)}</div>`;
  } else {
    document.getElementById('mechCard').innerHTML =
      `<div class="rc-title">${t('rc_mech')}</div>
       ${mechRows(data.mechanic, data.mechanicType, data)}`;
  }

  // Why card
  const _whyBullets = (currentLang === 'en' ? data.explanationEn : data.explanationRu) || data.explanation || [];
  document.getElementById('whyCard').innerHTML =
    `<div class="rc-title">${t('rc_why')}</div>
     <ul class="ai-bullets">
       ${_whyBullets.map(b => `<li class="ai-bullet">${b}</li>`).join('')}
     </ul>`;

  // Alternatives card
  renderAltCard(localizedAlts(data), data);

  // Econ card
  // Repair econ costs if server returned 0 for high-denomination currencies (RUB/KZT/MNT).
  // truncNormalPayout breaks for large B (z ~ √B → -∞). Fall back to bonusSize × wagerEff,
  // identical to the server-side fix in buildConfig.ts calcScenario.
  const _rawE = data.econ;
  const E = (() => {
    if (!_rawE || _rawE.sP10?.cost > 0) return _rawE;
    const { bonusSize, wagerX, breakeven_wager, pl } = _rawE || {};
    if (!bonusSize || !pl) return _rawE;
    const eff = (wagerX > 0)
      ? Math.min(1, breakeven_wager / Math.max(breakeven_wager, wagerX))
      : 1;
    const payout = bonusSize * eff;
    return {
      ..._rawE,
      sP10: { ...(_rawE.sP10||{}), cost: Math.round(payout * 0.10 * pl), conv: _rawE.sP10?.conv ?? 0.10 },
      sP50: { ...(_rawE.sP50||{}), cost: Math.round(payout * 0.20 * pl), conv: _rawE.sP50?.conv ?? 0.20 },
      sP90: { ...(_rawE.sP90||{}), cost: Math.round(payout * 0.40 * pl), conv: _rawE.sP90?.conv ?? 0.40 },
    };
  })();
  const cur = data.cur;
  try {
    if (!E?.sP10?.cost) {
      // sP10.cost is 0: happens for sweep (wagerX=0) or degenerate configs.
      // Show cost ratio summary only.
      const fmtK = n => n >= 1000 ? Math.round(n/1000)+'k' : String(Math.round(n));
      const vCol = { verdict_cheap:'#10b981', verdict_ok:'#10b981', verdict_warn:'#F59E0B', verdict_high:'#EF4444' };
      const col  = vCol[E?.verdictKey] || 'var(--muted)';
      document.getElementById('econCard').innerHTML =
        `<div class="rc-title">${t('rc_econ')}</div>
         <div class="mech-row"><span class="mr-l">${t('ec_cost')}</span><span class="mr-v">~${fmtK(E?.sP50?.cost||0)} ${cur}</span></div>
         <div class="mech-row" style="border-bottom:none"><span class="mr-l">Cost ratio</span><span class="mr-v" style="color:${col}">${((E?.costRatio||0)*100).toFixed(1)}%</span></div>`;
    } else {
      document.getElementById('econCard').innerHTML =
        `<div class="rc-title">${t('rc_econ')}</div>
         ${renderEconScenarios(E, data.pl ?? E.pl, data.dep, cur, currentLang, data)}`;
    }
  } catch(ex) {
    document.getElementById('econCard').innerHTML =
      `<div class="rc-title">${t('rc_econ')}</div>
       <div style="color:#EF4444;font-size:.82rem;padding:8px 0">⚠️ Econ render error: ${ex?.message || ex}</div>`;
  }
}

function localizedAlts(data) {
  return (currentLang === 'en' ? data.alternativesEn : data.alternativesRu) || data.alternatives || [];
}

function renderAltCard(alts, data) {
  document.getElementById('altCard').innerHTML =
    `<div class="rc-title">${t('rc_alts')}</div>
     <div class="alt-chips">
       ${(alts || []).map(a =>
         `<div class="alt-chip" onclick="switchMechanic('${a.type}')">
            <div class="alt-chip-name">${a.icon} ${a.name}</div>
            <div class="alt-chip-desc">${a.desc}</div>
          </div>`
       ).join('')}
     </div>`;
}

async function _cgRunOptimize(btn) {
  const resultEl = document.getElementById('cg_incr_ai_result');
  const d = window._lastCGIncrData;
  if (!resultEl || !d) return;
  const isRu = d.isRu;
  btn.disabled = true;
  btn.textContent = isRu ? 'AI анализирует параметры…' : 'AI is analysing parameters…';
  resultEl.innerHTML = '';
  try {
    const resp = await fetch('/api/campaign/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geo: d.geo, segment: d.segment, lift: d.lift, economics: d.economics, uiLang: isRu ? 'ru' : 'en' }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    const impactClr = { high: '#10b981', med: '#f59e0b', low: '#8892a4' };
    const impactLbl = isRu
      ? { high: 'Высокий', med: 'Средний', low: 'Низкий' }
      : { high: 'High',    med: 'Medium',  low: 'Low'    };
    const factorLbl = isRu
      ? { F1:'Вейджер', F2:'Матч-бонус', F3:'Механики', F4:'RTP игр', F5:'Платформа' }
      : { F1:'Wagering', F2:'Match Bonus', F3:'Mechanics', F4:'Game RTP', F5:'Platform' };
    const paramLbl = isRu
      ? { wager:'Размер вейджера', matchPct:'Процент матча', addNDB:'Добавить НДБ',
          addReload:'Добавить Reload', addCashback:'Добавить кэшбэк',
          addDep2:'Бонус 2-го депозита', addFS:'Добавить фриспины',
          rtp:'RTP слотов', plat:'Устройство' }
      : { wager:'Wager multiplier', matchPct:'Match %', addNDB:'Add No-Dep Bonus',
          addReload:'Add Reload', addCashback:'Add Cashback',
          addDep2:'2nd Deposit Bonus', addFS:'Add Free Spins',
          rtp:'Slots RTP', plat:'Platform' };
    const cards = (data.recommendations || []).map(rec => `
      <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:8px;padding:8px 10px;margin-top:6px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:11px;font-weight:700;color:#a5b4fc">${factorLbl[rec.factor]||rec.factor} · ${paramLbl[rec.param]||rec.param}</span>
          <span style="font-size:10px;font-weight:600;color:${impactClr[rec.impact]||'#8892a4'}">${impactLbl[rec.impact]||rec.impact}</span>
        </div>
        <div style="font-size:11px;color:#8892a4;margin-bottom:3px">${rec.current} → <strong style="color:var(--text)">${rec.target}</strong></div>
        <div style="font-size:11px;color:var(--text)">${rec.reason}</div>
      </div>`).join('');
    window._lastCGIncrData._recs = data.recommendations;
    resultEl.innerHTML = `
      <div style="font-size:11px;font-weight:700;color:#a5b4fc;margin-top:10px;margin-bottom:2px">${isRu?'Рекомендации по оптимизации':'Optimisation Recommendations'}</div>
      ${cards}
      <button onclick="_cgApplyRecs(window._lastCGIncrData?._recs)"
        style="width:100%;margin-top:8px;padding:7px 12px;background:rgba(16,185,129,.18);
               border:1px solid rgba(16,185,129,.45);border-radius:8px;color:#6ee7b7;
               font-size:12px;cursor:pointer;font-weight:600;transition:background .2s"
        onmouseover="this.style.background='rgba(16,185,129,.32)'" onmouseout="this.style.background='rgba(16,185,129,.18)'">
        ⚡ ${isRu ? 'Применить и пересчитать' : 'Apply & Recalculate'}
      </button>`;
    btn.textContent = isRu ? '🤖 Рекомендации AI' : '🤖 AI Recommendations';
    btn.disabled = false;
  } catch(e) {
    resultEl.innerHTML = `<div style="color:#EF4444;font-size:11px;margin-top:6px">${isRu?'Не удалось получить рекомендации. Попробуйте ещё раз.':'Could not get recommendations. Please try again.'}</div>`;
    btn.textContent = isRu ? '🤖 Рекомендации AI' : '🤖 AI Recommendations';
    btn.disabled = false;
  }
}

async function _cgApplyRecs(recs) {
  if (!recs || !recs.length) return;
  const d = window._lastCGIncrData;
  const isRu = d?.isRu;

  // Map recommendations → draft.params updates
  const manualParams = [];
  const newTypes = [...(draft.params.bonusTypes && draft.params.bonusTypes.length ? draft.params.bonusTypes : ['reload'])];

  for (const rec of recs) {
    const p = rec.param;
    if      (p === 'addNDB')      { if (!newTypes.includes('ndb'))      newTypes.push('ndb'); }
    else if (p === 'addReload')   { if (!newTypes.includes('reload'))   newTypes.push('reload'); }
    else if (p === 'addCashback') { if (!newTypes.includes('cashback')) newTypes.push('cashback'); }
    else if (p === 'addDep2')     { if (!newTypes.includes('dep2'))     newTypes.push('dep2'); }
    else if (p === 'addFS')       { if (!newTypes.includes('welcome'))  newTypes.push('welcome'); }
    else if (p === 'rtp') {
      const rtpVal = parseFloat(rec.target);
      if (!isNaN(rtpVal)) {
        draft.params.games = rtpVal >= 99 ? 'live' : rtpVal >= 97 ? 'table' : 'slots';
      }
    }
    else if (p === 'plat') { draft.params.plat = rec.target; }
    else if (p === 'wager' || p === 'matchPct') { manualParams.push(rec.param); }
  }

  draft.params.bonusTypes = [...new Set(newTypes)];

  // Silently sync step 2 chips to match updated params
  document.querySelectorAll('#btypeGroup .chip-multi').forEach(c =>
    c.classList.toggle('active', draft.params.bonusTypes.includes(c.dataset.btype)));
  document.querySelectorAll('[data-g="games"]').forEach(c =>
    c.classList.toggle('active', c.dataset.v === draft.params.games));

  // Show loading in mechCard — it's immediately visible and gets replaced by renderMechanicResults on success.
  // Do NOT touch resultEl/econCard here: renderMechanicResults will re-render the full step 3 output.
  const mechCard = document.getElementById('mechCard');
  if (mechCard) {
    mechCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:12px 0;color:var(--muted);font-size:.85rem">
        <div class="spinner"></div>
        ${isRu ? 'Пересчёт кампании…' : 'Recalculating campaign…'}
      </div>
      ${manualParams.length ? `<div style="font-size:11px;color:#f59e0b;margin-top:4px">
        ⚠️ ${isRu ? 'Wager и matchPct — настройте вручную на шаге 2' : 'Wager & matchPct — adjust manually in Step 2'}
      </div>` : ''}`;
  }

  try {
    const resp = await fetch('/api/campaign/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: draft.scenario, params: draft.params }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || resp.statusText);
    }
    const data = await resp.json();
    draft._apiResult = data;
    // Full Step 3 re-render: mechCard + whyCard + altCard + econCard (incl. incremental revenue).
    // If netIncr ≥ 0 after recalc the optimize button won't be re-rendered.
    renderMechanicResults(data);
  } catch (e) {
    if (mechCard) {
      mechCard.innerHTML = `
        <div style="color:#EF4444;font-size:.83rem;padding:8px 0">
          ⚠️ ${isRu ? 'Ошибка пересчёта. Попробуйте ещё раз.' : 'Recalculation failed. Please try again.'}
        </div>`;
    }
  }
}

function switchMechTab(type, el) {
  document.querySelectorAll('.mech-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  if (!draft._apiResult) return;
  const data = genDispData(); // display-currency copy for rendering
  const mech = data.selectedMechanics?.[type] || data.allMechanics?.[type];
  const tc = document.getElementById('mechTabContent');
  if (tc) tc.innerHTML = mechRows(mech, type, data);
}

function switchMechanic(type) {
  if (!draft._apiResult?.allMechanics) return;
  // Keep the raw mechanic for AI payloads; render from the display-currency copy.
  draft.mechanics    = draft._apiResult.allMechanics[type];
  draft.mechanicType = type;
  if (!draft.mechanics) return;

  const data = genDispData();
  const mech = data.allMechanics[type];

  document.getElementById('mechCard').innerHTML =
    `<div class="rc-title">${t('rc_mech')}</div>
     ${mechRows(mech, type, data)}`;

  renderAltCard(localizedAlts(data).filter(a => a.type !== type), data);
}

// ── STEP 4 ────────────────────────────────────────────────────────────────────
function switchS4(panel, el) {
  document.querySelectorAll('#s4tabs .ch-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('s4-texts').classList.toggle('active', panel==='texts');
  document.getElementById('s4-audit').classList.toggle('active', panel==='audit');
}
let _activeCh = 'push';
function switchCh(ch, el) {
  _activeCh = ch;
  document.querySelectorAll('#chTabs .ch-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['push','email','sms','telegram','popup'].forEach(c => {
    document.getElementById('ch-'+c).classList.toggle('active', c===ch);
  });
  const btn = document.getElementById('copy-all-btn');
  if (btn) btn.dataset.ch = ch;
}
function copyAllChannel() {
  const ch = _activeCh;
  if (!draft.texts || !draft.texts[ch]) return;
  const variants = draft.texts[ch];
  const text = variants.map((v, i) => {
    const prefix = `--- Variant ${i+1} ---`;
    const body = typeof v !== 'object' ? String(v)
      : v.subject  ? `Subject: ${v.subject}\n\n${v.body}`
      : v.headline ? `${v.headline}\n${v.subtext}\n${v.cta}`
      : JSON.stringify(v, null, 2);
    return `${prefix}\n${body}`;
  }).join('\n\n');
  navigator.clipboard.writeText(text).then(() => showToast(currentLang === 'ru' ? 'Скопировано в буфер' : 'Copied to clipboard'));
}
function copyText(btn) {
  const text = btn.closest('.var-card').querySelector('.var-text').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Скопировано';
    btn.style.borderColor = 'var(--success)';
    setTimeout(() => { btn.textContent = orig; btn.style.borderColor = ''; }, 1600);
  });
}

// ── STEP 4 LOAD ───────────────────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function buildS4Payload() {
  return {
    scenario: draft.scenario,
    params: draft.params,
    mechanic: draft.mechanics,
    mechanicType: draft.mechanicType,
    requestedTypes: draft._apiResult?.requestedTypes,
    selectedMechanics: draft._apiResult?.selectedMechanics,
    econ: draft.econ,
    cur: draft._apiResult?.cur,
    uiLang: currentLang,
  };
}

function loadStep4() {
  document.getElementById('s4t-loading').style.display = 'flex';
  document.getElementById('s4t-content').style.display = 'none';
  document.getElementById('s4t-error').style.display = 'none';
  document.getElementById('s4a-loading').style.display = 'flex';
  document.getElementById('s4a-content').innerHTML = '';
  document.getElementById('s4a-error').style.display = 'none';
  document.getElementById('s4next').disabled = true;

  const payload = buildS4Payload();

  const textsP = fetch('/api/campaign/texts', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload),
  })
  .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
  .then(data => { draft.texts = data; renderTexts(data); })
  .catch(err => {
    document.getElementById('s4t-loading').style.display = 'none';
    const el = document.getElementById('s4t-error');
    el.textContent = '⚠️ Ошибка генерации текстов: ' + (err?.message || err?.error || String(err));
    el.style.display = '';
  });

  const auditP = fetch('/api/campaign/audit', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload),
  })
  .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
  .then(data => { data._uiLang = currentLang; draft.audit = data; renderAudit(data); })
  .catch(err => {
    document.getElementById('s4a-loading').style.display = 'none';
    const el = document.getElementById('s4a-error');
    el.textContent = '⚠️ Ошибка аудита: ' + (err?.message || err?.error || String(err));
    el.style.display = '';
  });

  Promise.allSettled([textsP, auditP]).then(() => {
    document.getElementById('s4next').disabled = false;
  });
}

function varCardsHTML(ch, variants, limit) {
  return variants.slice(0, limit).map((v, i) => {
    let body = '';
    if (ch === 'email') {
      const subj = typeof v === 'object' ? (v.subject || '') : '';
      const b    = typeof v === 'object' ? (v.body || '') : String(v);
      body = `<div style="font-size:.72rem;color:var(--muted);margin-bottom:5px">${t('s4_email_subject_lbl')}: <strong style="color:var(--text)">${esc(subj)}</strong></div>
              <div class="var-text">${esc(b)}</div>`;
    } else if (ch === 'popup') {
      const hl  = typeof v === 'object' ? (v.headline || '') : String(v);
      const sub = typeof v === 'object' ? (v.subtext || '') : '';
      const cta = typeof v === 'object' ? (v.cta || '') : '';
      body = `<div class="var-text"><strong>${esc(hl)}</strong>${sub ? '\n'+esc(sub) : ''}${cta ? '\n\n🔘 '+esc(cta) : ''}</div>`;
    } else {
      const txt  = typeof v === 'object' ? JSON.stringify(v) : String(v);
      const lim  = ch === 'sms' ? 160 : ch === 'push' ? 100 : null;
      const meta = lim ? `${txt.length}/${lim} ${t('s4_chars')}` : '';
      body = `${meta ? `<div style="font-size:.7rem;color:var(--muted);margin-bottom:4px">${meta}</div>` : ''}
              <div class="var-text">${esc(txt)}</div>`;
    }
    return `<div class="var-card">
      <div class="var-hd">
        <span class="var-lbl">${t('s4_variant')} ${i+1}</span>
        <span class="var-meta">${ch==='sms'?`≤160 ${t('s4_chars')}`:ch==='push'?`≤100 ${t('s4_chars')}`:''}</span>
      </div>
      ${body}
      <div class="var-acts">
        <button class="btn btn-outline btn-sm" onclick="copyText(this)">${t('s4_copy_btn')}</button>
      </div>
    </div>`;
  }).join('');
}

function renderChannelTexts(ch, variants, limit) {
  const el = document.getElementById('ch-'+ch);
  if (!el) return;
  el.innerHTML = `<div class="var-cards">${varCardsHTML(ch, variants, limit)}</div>
    <div style="margin-top:12px">
      <button class="btn btn-outline btn-sm" onclick="generateMore('${ch}',this)">${t('s4_more_variants')}</button>
    </div>`;
}

function renderTexts(data) {
  document.getElementById('s4t-loading').style.display = 'none';
  document.getElementById('s4t-content').style.display = '';
  renderChannelTexts('push',     data.push     || [], 3);
  renderChannelTexts('email',    data.email    || [], 2);
  renderChannelTexts('sms',      data.sms      || [], 3);
  renderChannelTexts('telegram', data.telegram || [], 3);
  renderChannelTexts('popup',    data.popup    || [], 2);
}

function generateMore(channel, btn) {
  btn.disabled = true;
  btn.textContent = t('s4_generating');
  fetch('/api/campaign/texts', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(buildS4Payload()),
  })
  .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
  .then(data => {
    const newVariants = data[channel] || [];
    const el = document.getElementById('ch-'+channel);
    const cards = el.querySelector('.var-cards');
    const base = cards.querySelectorAll('.var-card').length;
    newVariants.forEach((v, i) => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = varCardsHTML(channel, [v], 1)
        .replace(t('s4_variant')+' 1', t('s4_variant')+' '+(base+i+1));
      cards.appendChild(wrapper.firstElementChild);
    });
    btn.disabled = false;
    btn.textContent = t('s4_more_variants');
  })
  .catch(() => { btn.disabled = false; btn.textContent = t('s4_more_variants'); });
}

function renderAudit(data) {
  document.getElementById('s4a-loading').style.display = 'none';
  document.getElementById('s4a-content').innerHTML = auditHTML(data);
}

// ── STEP 5 ────────────────────────────────────────────────────────────────────
function fillSummary() {
  document.getElementById('sum-sc').textContent  = draft.scenario?.lbl || '—';
  document.getElementById('sum-geo').textContent = GEO_LBL[draft.params.geo] || '—';
  document.getElementById('sum-seg').textContent = SEG_LBL[draft.params.segment] || '—';
  const b = draft.params.budget;
  document.getElementById('sum-bud').textContent = b ? '€' + Number(b).toLocaleString() : '—';

  if (draft.mechanicType && draft.mechanics) {
    const mech = draft.mechanics;
    const cur  = draft._apiResult?.cur || '';
    const lbl  = { welcome:t('mt_welcome'), ndb:t('mt_ndb'), dep2:t('mt_dep2'), dep3:t('mt_dep3'), cashback:t('mt_cashback'), reload:t('mt_reload') }[draft.mechanicType] || draft.mechanicType;
    const pct  = mech.pct ? ` ${mech.pct}%` : (mech.model === 'tier' ? ' Tiered' : '');
    const sEl = document.getElementById('sum-mech');  if (sEl) sEl.textContent = lbl + pct;
    const mEl = document.getElementById('sum-maxb');
    if (mEl) mEl.textContent = mech.maxB ? `${mech.maxB} ${mech.cur||cur}` : (mech.maxAmt || '—');
    const wEl = document.getElementById('sum-wager');
    if (wEl) {
      const w = mech.wager != null ? mech.wager : (draft._apiResult?.wager?.wW || '—');
      wEl.textContent = draft.mechanicType === 'cashback' ? t('det_no_wager') : w + '×';
    }
  }
}
function doExport(type) {
  if (type==='json') {
    const blob = new Blob([JSON.stringify(draft,null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='campaign.json'; a.click();
  } else if (type==='copy') {
    navigator.clipboard.writeText(JSON.stringify(draft,null,2)).then(() => {
      const btn = event.target.closest('.exp-btn');
      btn.style.borderColor='var(--success)';
      setTimeout(()=>btn.style.borderColor='',1500);
    });
  } else if (type==='email') {
    window.location.href=`mailto:?subject=Campaign: ${draft.scenario?.lbl||'New'}&body=${encodeURIComponent(JSON.stringify(draft,null,2))}`;
  } else if (type==='api') {
    alert('curl -X POST /api/campaign/generate \\\n  -H "Content-Type: application/json" \\\n  -d \''+JSON.stringify({scenario:draft.scenario,params:draft.params})+'\'');
  } else if (type==='adminconfig') {
    const cfg = generateAdminConfig();
    if (!cfg) { alert('Сначала пройдите Шаг 3 — генерацию механики'); return; }
    document.getElementById('admin-cfg-pre').textContent = cfg;
    const panel = document.getElementById('admin-cfg-panel');
    panel.style.display = '';
    panel.scrollIntoView({ behavior:'smooth', block:'start' });
    const btn = event.target.closest('.exp-btn');
    btn.style.borderColor = 'var(--success)';
    setTimeout(() => btn.style.borderColor = '', 1500);
  } else {
    alert('Будет доступно в Phase 4');
  }
}

function generateAdminConfig() {
  const data = draft._apiResult;
  if (!data) return null;

  const cur  = data.cur  || 'USD';
  const all  = data.allMechanics  || {};
  const w    = data.wager  || {};
  const fs   = data.fsSpec || {};
  const e    = data.econ   || {};
  const reg  = data.reg    || {};
  const cont = data.contrib || {};

  const LINE = '═'.repeat(54);
  const line = '─'.repeat(54);
  const now  = new Date().toISOString().slice(0,10);

  const GEO_NAME = {eu:'EU / UK',de:'Germany',fr:'France',es:'Spain',it:'Italy',nl:'Netherlands',dk:'Denmark',uk:'United Kingdom',ru:'Russia',kz:'Kazakhstan',br:'Brazil',mx:'Mexico',co:'Colombia',ar:'Argentina',pe:'Peru',cl:'Chile',mn:'Mongolia',us:'USA (Sweep)'};
  const SEG_NAME = {new:'New players',mid:'Regular players',vip:'VIP'};
  const LBL = {welcome:'1ST_DEPOSIT',ndb:'WELCOME_NODEP',reload:'RELOAD',dep2:'2ND_DEPOSIT',dep3:'3RD_DEPOSIT',cashback:'CASHBACK'};
  const VERDICT = {verdict_cheap:'WEAK (raise match % or lower wager)',verdict_ok:'OPTIMAL',verdict_warn:'HIGH LOAD — review wager/maxB',verdict_high:'LOSS-MAKING — urgent fix required'};

  const fmtMech = (type, mech) => {
    if (!mech) return '  (not available for this region)\n';
    if (type === 'cashback') {
      if (mech.model === 'tier') {
        const tiers = (mech.tiers || []).map(t =>
          `  ${(t.level||'').padEnd(10)} ${String(t.from||0).padEnd(8)} – ${String(t.to||'∞').padEnd(8)} → ${t.pct}%`
        ).join('\n');
        return `  model         = tier\n  period        = monthly\n  wagering      = none\n${tiers ? '  tiers:\n'+tiers+'\n' : ''}`;
      }
      return `  model         = flat\n  pct           = ${mech.pct||10}%\n  min_loss      = ${mech.minLoss||'—'} ${cur}\n  max_amount    = ${mech.maxAmt||'—'} ${cur}\n  period        = weekly\n  wagering      = none\n`;
    }
    if (mech.type === 'packages') {
      const pkgs = (mech.pkgs||[]).map(p => `  ${p.price} USD → ${p.sc} SC`).join('\n');
      return `  type          = sweepstakes_packages\n${pkgs}\n`;
    }
    return [
      `  type          = match_deposit`,
      `  match_pct     = ${mech.pct||100}%`,
      `  max_bonus     = ${mech.maxB||'—'} ${mech.cur||cur}`,
      `  min_deposit   = ${mech.minD||'—'} ${mech.cur||cur}`,
      mech.fs   ? `  freespins     = ${mech.fs} FS` : null,
      `  wager         = ×${mech.wager != null ? mech.wager : (w.wW||'—')}`,
      `  validity_days = ${mech.days||30}`,
      mech.code ? `  promo_code    = ${mech.code}` : null,
    ].filter(Boolean).join('\n') + '\n';
  };

  const bonusSections = Object.entries(LBL)
    .filter(([t]) => all[t])
    .map(([t, key]) => `[${key}]\n${fmtMech(t, all[t])}`)
    .join('\n');

  const wagerSection = [
    w.wW    != null ? `  welcome_wager = ×${w.wW}` : null,
    w.wNDB  != null ? `  ndb_wager     = ×${w.wNDB}` : null,
    w.wR    != null ? `  reload_wager  = ×${w.wR}` : null,
    w.wFS   != null ? `  fs_wager      = ×${w.wFS}` : null,
    w.basis          ? `  basis         = ${w.basis}` : null,
    w.maxBet         ? `  max_bet       = ${w.maxBet} ${cur}` : null,
    w.eligible       ? `  eligible      = ${w.eligible}` : null,
    w.days  != null  ? `  validity_days = ${w.days}` : null,
    w.lockType       ? `  lock_type     = ${w.lockType}` : null,
  ].filter(Boolean).join('\n');

  const fsSection = fs.spinValue
    ? [
        `  spin_value    = ${fs.spinValue} ${cur}`,
        fs.maxWin    ? `  max_win       = ${fs.maxWin} ${cur}` : null,
        fs.games     ? `  eligible      = ${fs.games}` : null,
        fs.delivery  ? `  delivery      = ${fs.delivery}` : null,
        fs.wager != null ? `  wager         = ×${fs.wager}` : null,
      ].filter(Boolean).join('\n')
    : '  (free spins not configured)';

  const contribRows = Object.entries(cont).length
    ? Object.entries(cont).map(([game, pct]) => `  ${game.padEnd(16)} → ${pct}%`).join('\n')
    : '  slots → 100%\n  live_casino → 0%\n  table_games → 0%';

  const regItems = Array.isArray(reg)
    ? reg.map(r => `  • ${r}`).join('\n')
    : (typeof reg === 'object' && Object.keys(reg).length
        ? Object.values(reg).map(r => `  • ${r}`).join('\n')
        : '  (standard license requirements apply)');

  const econSection = [
    `  arpu          = $${e.arpu||'—'}`,
    `  cac           = $${e.cac||'—'}`,
    `  ltv_3mo       = $${e.ltv3||'—'}`,
    `  roi_3mo       = ${e.roi3||'—'}%`,
    `  cost_ratio    = ${((e.costRatio||0)*100).toFixed(1)}%`,
    `  p10_cost      = ${e.sP10?.cost||'—'} ${cur}`,
    `  p50_cost      = ${e.sP50?.cost||'—'} ${cur}`,
    `  p90_cost      = ${e.sP90?.cost||'—'} ${cur}`,
    `  verdict       = ${VERDICT[e.verdictKey]||e.verdictKey||'—'}`,
  ].join('\n');

  return `${LINE}
 RETOMAT — ADMIN PANEL CONFIG
 Campaign : ${draft.scenario?.lbl || '—'}
 Geo      : ${GEO_NAME[draft.params?.geo] || draft.params?.geo || '—'}
 Segment  : ${SEG_NAME[draft.params?.segment] || '—'}
 Currency : ${cur}
 Region   : ${data.r || '—'}
 Generated: ${now}
${LINE}

${bonusSections}
[WAGERING_CONDITIONS]
${wagerSection}

[FREESPINS_SPEC]
${fsSection}

[GAME_CONTRIBUTIONS]
${contribRows}

[ECONOMICS_P50]
${econSection}

[REGULATORY]
${regItems}
${LINE}`;
}

function copyAdminCfg() {
  const text = document.getElementById('admin-cfg-pre').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    const orig = btn.textContent;
    btn.textContent = '✓ Скопировано';
    btn.style.borderColor = 'var(--success)';
    setTimeout(() => { btn.textContent = orig; btn.style.borderColor = ''; }, 1600);
  });
}

function saveAdminCfg() {
  const text = document.getElementById('admin-cfg-pre').textContent;
  const blob = new Blob([text], { type:'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `admin-config-${draft.scenario?.id||'campaign'}-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
}
function addCampaignToCalendar(opts = {}) {
  const silent = !!opts.silent; // silent = called from Save: no confirm, no toast, skip dupes
  const mechanic    = draft.mechanicType || draft.scenario?.cat || 'custom';
  const MECH_TO_TYPE = { reload:'reload', cashback:'cashback', freespins:'freespins', free_spins:'freespins', vip:'vip', reactivation:'reactivation', welcome:'reload', ndb:'freespins', dep2:'reload', dep3:'reload' };
  const type        = MECH_TO_TYPE[mechanic?.toLowerCase()] || 'custom';
  const today       = new Date();
  const monday      = new Date(today); monday.setDate(today.getDate() + ((today.getDay() === 0 ? 1 : 8 - today.getDay())));
  const addD        = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10); };
  const campaign = {
    title:      draft.scenario?.lbl || mechanic || 'Campaign',
    type,
    segment:    draft.params?.segment || 'all',
    geo:        draft.params?.geo || '',
    startDate:  monday.toISOString().slice(0, 10),
    endDate:    addD(monday, 6),
    status:     'draft',
    brands:     ['default'],
    mechanic:   String(mechanic || ''),
    econ:       draft.econ || null,
    sourceType: 'campaign_generator',
    savedId:    opts.savedId || null,
  };
  const isRu = currentLang === 'ru';
  try {
    const camps   = JSON.parse(localStorage.getItem('rc_campaigns') || '[]');
    const dupe    = camps.find(c =>
      c.sourceType === 'campaign_generator' &&
      c.geo      === campaign.geo &&
      c.segment  === campaign.segment &&
      c.type     === campaign.type
    );
    if (dupe) {
      if (silent) return false; // already scheduled — don't create a duplicate event
      const added = new Date(dupe.createdAt).toLocaleDateString();
      const msg   = isRu
        ? `Эта кампания уже добавлена в календарь (${dupe.title}, добавлена ${added}).\nДобавить ещё раз?`
        : `This campaign is already in the calendar (${dupe.title}, added ${added}).\nAdd again?`;
      if (!confirm(msg)) return false;
    }
    const now = new Date().toISOString();
    const rec = { ...campaign, id: 'cg_' + Date.now(), createdAt: now, updatedAt: now };
    camps.push(rec);
    localStorage.setItem('rc_campaigns', JSON.stringify(camps));
    window.RetomatRepo?.mirror('calendar-events', rec.id, rec);
  } catch { return false; }
  if (silent) return true;
  const msg  = isRu ? '📅 Кампания добавлена в Retention Calendar' : '📅 Campaign added to Retention Calendar';
  const link = '<a href="/retention-calendar.html" style="color:var(--gold);font-weight:600">Open Calendar →</a>';
  showToast(`${msg} · ${link}`);
  return true;
}

function addDetailToCalendar() {
  const c = getCampaigns().find(x => x.id === _detailId);
  if (!c) return;
  const mechanic = c.mechanicType || c.scenario?.cat || 'custom';
  const MECH_TO_TYPE = { reload:'reload', cashback:'cashback', freespins:'freespins', free_spins:'freespins', vip:'vip', reactivation:'reactivation', welcome:'reload', ndb:'freespins', dep2:'reload', dep3:'reload' };
  const type   = MECH_TO_TYPE[mechanic?.toLowerCase()] || 'custom';
  const today  = new Date();
  const monday = new Date(today); monday.setDate(today.getDate() + ((today.getDay() === 0 ? 1 : 8 - today.getDay())));
  const addD   = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10); };
  const entry  = {
    title:      c.name || c.scenario?.lbl || mechanic || 'Campaign',
    type,
    segment:    c.params?.segment || 'all',
    geo:        c.params?.geo || '',
    startDate:  monday.toISOString().slice(0, 10),
    endDate:    addD(monday, 6),
    status:     'draft',
    brands:     ['default'],
    mechanic:   String(mechanic || ''),
    econ:       c.econ || null,
    sourceType: 'campaign_generator',
    sourceId:   c.id,
  };
  const isRu = currentLang === 'ru';
  try {
    const camps = JSON.parse(localStorage.getItem('rc_campaigns') || '[]');
    const dupe  = camps.find(x => x.sourceId === c.id);
    if (dupe) {
      const added = new Date(dupe.createdAt).toLocaleDateString();
      const msg   = isRu
        ? `Эта кампания уже добавлена в календарь (добавлена ${added}).\nДобавить ещё раз?`
        : `This campaign is already in the calendar (added ${added}).\nAdd again?`;
      if (!confirm(msg)) return;
    }
    const now = new Date().toISOString();
    const rec = { ...entry, id: 'cg_' + Date.now(), createdAt: now, updatedAt: now };
    camps.push(rec);
    localStorage.setItem('rc_campaigns', JSON.stringify(camps));
    window.RetomatRepo?.mirror('calendar-events', rec.id, rec);
  } catch {}
  const msg  = isRu ? '📅 Кампания добавлена в Retention Calendar' : '📅 Campaign added to Retention Calendar';
  const link = '<a href="/retention-calendar.html" style="color:var(--gold);font-weight:600">' + (isRu ? 'Открыть →' : 'Open →') + '</a>';
  showToast(`${msg} · ${link}`);
}

function showToast(html) {
  let t = document.getElementById('rc-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'rc-toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#f8fafc;padding:10px 20px;border-radius:10px;font-size:.85rem;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1);max-width:90vw;text-align:center';
    document.body.appendChild(t);
  }
  t.innerHTML = html;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 5000);
}

function finishCampaign() {
  saveCampaign();
  renderCampaignViews();
  document.getElementById('s5-export').style.display='none';
  document.getElementById('s5-done').style.display='';
  const _campName = draft.scenario?.lbl || (currentLang==='ru' ? 'Кампания' : 'Campaign');
  document.getElementById('done-sub').textContent = currentLang==='ru'
    ? `«${_campName}» успешно сохранена. Найдите её в разделе «Бонусные акции».`
    : `«${_campName}» saved successfully. Find it in Bonus Offers.`;
  updateProg(6);
}

// ── CAMPAIGN DETAIL ───────────────────────────────────────────────────────────
let _detailId = null;

const CH_LABELS = {push:'📲 Push',email:'📧 Email',sms:'📱 SMS',telegram:'✈️ Telegram',popup:'💬 Popup'};
const TONE_LBL  = {ru:{friendly:'Дружелюбный',formal:'Официальный',aggressive:'Агрессивный'},
                   en:{friendly:'Friendly',formal:'Formal',aggressive:'Aggressive'}};
const LANG_DISP = {ru:'RU',en:'🇬🇧 EN',mn:'🇲🇳 MN',es:'🇪🇸 ES'};

function openDetail(id) {
  closeMenu();
  _detailId = id;
  const c = getCampaigns().find(x => x.id === id);
  if (!c) return;
  // Calendar-created bonuses are thin (no generator config) — open in the calendar.
  if (c.sourceType === 'calendar') { window.location.href = '/retention-calendar.html'; return; }
  document.getElementById('det-name').textContent = c.name || '—';
  document.getElementById('det-badge').innerHTML  = statusBadge(c.status);
  const sel = document.getElementById('det-status');
  if (sel) sel.value = c.status || 'draft';
  document.querySelectorAll('.dtab').forEach((b,i) => b.classList.toggle('active', i===0));
  showView('campaign-detail');
  updateTopbar('campaign-detail');
  document.getElementById('tb-title').textContent = c.name || '—';
  document.getElementById('tb-sub').textContent   = c.type  || 'Campaign';
  document.getElementById('tb-right').innerHTML   =
    `<button class="btn btn-primary btn-sm" onclick="startWizard()">${t('btn_new_camp')}</button>`;
  document.querySelectorAll('.nav-item:not(.off)').forEach(el => {
    el.classList.toggle('active', (el.getAttribute('onclick')||'').includes("'campaigns'"));
  });
  renderDetailTab('overview', c);
}

function closeDetail() {
  _detailId = null;
  showView('campaigns');
}

function switchDTab(tab, btn) {
  document.querySelectorAll('.dtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const c = getCampaigns().find(x => x.id === _detailId);
  if (c) renderDetailTab(tab, c);
}

function renderDetailTab(tab, c) {
  const body = document.getElementById('det-body');
  if (!body) { console.error('det-body not found'); return; }
  try {
    if      (tab === 'overview') body.innerHTML = renderDetailOverview(c);
    else if (tab === 'mechanic') body.innerHTML = renderDetailMechanic(c);
    else if (tab === 'texts')  { renderDetailTexts(c, body); }
    else if (tab === 'audit')  { renderDetailAudit(c, body); }
    else if (tab === 'export')     body.innerHTML = renderDetailExport(c);
    else if (tab === 'analytics')  body.innerHTML = renderDetailAnalytics(c);
  } catch (e) {
    console.error('Error rendering tab ' + tab, e);
    body.innerHTML = `<p style="color:#ef4444">Error: ${e.message}</p>`;
  }
}

function renderDetailOverview(c) {
  const p   = c.params || {};
  const tone = (TONE_LBL[currentLang] || TONE_LBL.ru)[p.tone] || p.tone || '—';
  const cards = [
    [t('det_ov_scenario'), c.scenario?.lbl || '—'],
    [t('det_ov_geo'),      GEO_LBL[p.geo]  || p.geo  || '—'],
    [t('det_ov_segment'),  SEG_LBL[p.segment] || '—'],
    [t('det_ov_budget'),   p.budget ? '€' + Number(p.budget).toLocaleString() : '—'],
    [t('det_ov_tone'),     tone],
    [t('det_ov_lang'),     LANG_DISP[p.lang] || p.lang || '—'],
    [t('det_ov_status'),   t('badge_'+(c.status||'draft'))],
    [t('det_ov_created'),  c.date ? fmtDate(c.date) : '—'],
  ];
  return `<div class="ov-grid">${cards.map(([l,v]) =>
    `<div class="ov-card"><div class="ov-lbl">${l}</div><div class="ov-val">${esc(String(v))}</div></div>`
  ).join('')}</div>`;
}

function renderDetailMechanic(c) {
  const m = c.mechanic;
  if (!m) return `<p style="color:var(--muted);font-size:.87rem">${t('det_no_data')}</p>`;
  const typeLabel = mechTypeLbl(c.mechanicType);
  const specRows = [
    [t('det_mech_type'),  typeLabel],
    [t('det_mech_pct'),   m.pct  ? m.pct+'%' : '—'],
    [t('det_mech_maxb'),  m.maxB ? `${m.maxB} ${m.cur||''}`.trim() : (m.maxAmt||'—')],
    [t('det_mech_wager'), c.mechanicType==='cashback' ? t('det_no_wager') : (m.wager!=null ? m.wager+'×' : '—')],
    [t('det_mech_fs'),    m.fs   ? m.fs+' FS' : '—'],
    [t('det_mech_valid'), m.validDays||m.days ? (m.validDays||m.days)+(currentLang==='en'?' d':' дн.') : '—'],
  ].filter(([,v]) => v && v !== '—');

  const specHTML = `<div class="res-card" style="margin-bottom:16px">
    <div class="rc-title" style="margin-bottom:12px">${t('rc_mech')}: <strong>${esc(typeLabel)}</strong></div>
    <table style="width:100%;border-collapse:collapse;font-size:.84rem">
      ${specRows.map(([l,v]) =>
        `<tr><td style="color:var(--muted);padding:5px 0;width:45%;vertical-align:top">${l}</td>
             <td style="font-weight:600">${esc(String(v))}</td></tr>`
      ).join('')}
    </table>
  </div>`;

  const expl = (currentLang === 'en' ? c.explanationEn : c.explanationRu) || c.explanation || m?.explanation;
  const explHTML = expl ? `<div class="res-card" style="margin-bottom:16px">
    <div class="rc-title" style="margin-bottom:10px">${t('rc_why')}</div>
    <ul class="ai-bullets" style="margin:0;padding-left:18px">
      ${(Array.isArray(expl) ? expl : [expl]).map(b => `<li class="ai-bullet" style="font-size:.84rem">${b}</li>`).join('')}
    </ul>
  </div>` : '';

  const alts = c.alternatives;
  const altsHTML = alts?.length ? `<div class="res-card" style="margin-bottom:16px">
    <div class="rc-title" style="margin-bottom:10px">${t('rc_alts')}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      ${alts.map(a => `<span class="badge" style="background:rgba(79,110,247,.1);color:var(--accent);font-size:.78rem;padding:4px 10px">${esc(a)}</span>`).join('')}
    </div>
  </div>` : '';

  let econHTML = '';
  if (c.econ) {
    const e = c.econ;
    const econCards = [
      ['ARPU', e.arpu ? '€'+e.arpu : null],
      ['LTV',  e.ltv  ? '€'+e.ltv  : null],
      ['CAC',  e.cac  ? '€'+e.cac  : null],
      ['ROI',  e.roi  ? e.roi+'%'  : null],
    ].filter(([,v]) => v);
    if (econCards.length) {
      econHTML = `<div class="res-card">
        <div class="rc-title" style="margin-bottom:12px">${t('rc_econ')}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px">
          ${econCards.map(([l,v]) =>
            `<div class="ov-card" style="padding:10px 12px"><div class="ov-lbl">${l}</div><div class="ov-val">${v}</div></div>`
          ).join('')}
        </div>
      </div>`;
    }
  }
  return specHTML + explHTML + altsHTML + econHTML;
}

function renderDetailTexts(c, body) {
  if (!c.texts) {
    body.innerHTML = `<p style="color:var(--muted);font-size:.87rem">${t('det_no_texts')}</p>`;
    return;
  }
  const channels = ['push','email','sms','telegram','popup'];
  const avail = channels.filter(ch => c.texts[ch]?.length);
  if (!avail.length) {
    body.innerHTML = `<p style="color:var(--muted);font-size:.87rem">${t('det_no_texts')}</p>`;
    return;
  }
  const tabsHTML = avail.map((ch, i) =>
    `<button class="ch-tab${i===0?' active':''}" onclick="switchChTab('${ch}',this)">${CH_LABELS[ch]||ch}</button>`
  ).join('');
  body.innerHTML = `<div class="ch-tabs">${tabsHTML}</div><div id="det-ch-body"></div>`;
  renderDetChannel(c.texts, avail[0]);
}

function switchChTab(ch, btn) {
  document.querySelectorAll('.ch-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const c = getCampaigns().find(x => x.id === _detailId);
  if (c?.texts) renderDetChannel(c.texts, ch);
}

function renderDetChannel(texts, ch) {
  const el = document.getElementById('det-ch-body');
  if (!el) return;
  const variants = texts[ch] || [];
  const limit = (ch==='email'||ch==='popup') ? 2 : 3;
  el.innerHTML = `<div class="var-cards">${varCardsHTML(ch, variants, limit)}</div>`;
}

function auditHTML(audit) {
  const ICO = {ok:'✅',warn:'⚠️',fail:'❌'};
  const checks = (audit.checks||[]).map(ch =>
    `<div class="audit-item"><span class="audit-ico">${ICO[ch.status]||'•'}</span>
     <div>
       <div class="audit-lbl">${esc(ch.label)}</div>
       ${ch.rule ? `<div style="font-size:.7rem;color:var(--accent);opacity:.7;margin-bottom:2px">${esc(ch.rule)}</div>` : ''}
       <div class="audit-note">${esc(ch.note||'')}</div>
     </div></div>`
  ).join('') || `<div style="color:var(--muted);font-size:.82rem">${t('det_no_data')}</div>`;
  const recs = (audit.recommendations||[]).map(r =>
    `<div class="rec-item"><div class="rec-text">${esc(r.text)}</div>
     ${r.impact?`<span class="badge" style="background:rgba(79,110,247,.1);color:var(--accent)">${esc(r.impact)}</span>`:''}</div>`
  ).join('') || `<div style="color:var(--muted);font-size:.82rem">${t('det_no_data')}</div>`;
  const ts = new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const tsLine = `<div style="font-size:.68rem;color:var(--muted);margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">Audited: ${ts}</div>`;
  return `<div class="audit-grid">
    <div class="audit-card"><div class="rc-title" style="margin-bottom:10px">${t('rc_audit')}</div>${checks}${tsLine}</div>
    <div class="audit-card"><div class="rc-title" style="margin-bottom:10px">${t('rc_recs')}</div>${recs}</div>
  </div>`;
}

function renderDetailAudit(c, body) {
  const needsRefetch = !c.audit || !c.audit._uiLang || c.audit._uiLang !== currentLang;
  if (needsRefetch && c.mechanic) {
    body.innerHTML = `<div style="display:flex;align-items:center;gap:12px;padding:32px 0;color:var(--muted)"><div class="spinner"></div><span>${t('s3_gen_sub')}</span></div>`;
    fetch('/api/campaign/audit', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ scenario:c.scenario, mechanic:c.mechanic, mechanicType:c.mechanicType, params:c.params, uiLang:currentLang }),
    })
    .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
    .then(data => {
      data._uiLang = currentLang;
      putCampaigns(getCampaigns().map(x => x.id === c.id ? {...x, audit:data} : x));
      body.innerHTML = auditHTML(data);
    })
    .catch(() => { body.innerHTML = `<p style="color:#EF4444;font-size:.84rem">⚠️ ${t('det_no_audit')}</p>`; });
    return;
  }
  body.innerHTML = c.audit ? auditHTML(c.audit) : `<p style="color:var(--muted);font-size:.87rem">${t('det_no_audit')}</p>`;
}

function saveActuals() {
  const c = getCampaigns().find(x => x.id === _detailId);
  if (!c) return;
  const cost        = parseFloat(document.getElementById('act-cost')?.value) || 0;
  const activations = parseInt(document.getElementById('act-activations')?.value) || 0;
  const conversions = parseInt(document.getElementById('act-conversions')?.value) || 0;
  const revenue3m   = parseFloat(document.getElementById('act-revenue')?.value) || 0;
  const actuals = { cost, activations, conversions, revenue3m, savedAt: new Date().toISOString() };
  putCampaigns(getCampaigns().map(x => x.id === _detailId ? { ...x, actuals } : x));
  renderDetailTab('analytics', getCampaigns().find(x => x.id === _detailId));
}

function renderDetailAnalytics(c) {
  const isRu = currentLang === 'ru';
  const fs   = c.forecastSnapshot;
  const curFromGeo = getSitecurByGeo(fs?.geo || c.params?.geo);
  const cur = fs?.sitecur || curFromGeo || c.econ?.cur || c.params?.sitecur || 'EUR';
  const fmt  = v => cur + ' ' + Math.abs(Math.round(v)).toLocaleString();
  const fmtU = v => '$' + Math.abs(Math.round(v)).toLocaleString();
  const pct  = v => (v * 100).toFixed(1) + '%';
  const sign = v => (v >= 0 ? '+' : '−');
  const colV = v => v >= 0 ? 'var(--success)' : '#ef4444';

  if (!fs) return `<div style="color:var(--muted);font-size:.87rem;padding:24px 0">
    ${isRu ? 'Прогнозный снапшот недоступен — сохраните кампанию после генерации.' : 'Forecast snapshot not available — save the campaign after generating.'}
  </div>`;

  // Compute comparison if actuals exist
  let compHTML = '';
  if (c.actuals) {
    const a = c.actuals;
    const forecastCost = fs.sP50?.cost || 0;
    const forecastConv = fs.sP50?.conv || 0;
    const forecastRev  = Math.round(fs.pl * forecastConv * (fs.ltv3 || 0));
    const actualConv   = a.activations > 0 ? a.conversions / a.activations : 0;
    const costVar      = forecastCost > 0 ? ((a.cost - forecastCost) / forecastCost) * 100 : 0;
    const revVar       = forecastRev > 0 ? ((a.revenue3m - forecastRev) / forecastRev) * 100 : 0;
    const accuracy     = Math.abs(costVar) < 15 ? {label: isRu?'Точный прогноз':'Accurate', col:'var(--success)'}
                       : Math.abs(costVar) < 30 ? {label: isRu?'Умеренное расхождение':'Moderate', col:'var(--warn)'}
                       : {label: isRu?'Большое расхождение':'Off target', col:'#ef4444'};

    const row = (label, fore, act, varV) => `
      <tr>
        <td style="padding:7px 10px;color:var(--muted);font-size:.78rem">${label}</td>
        <td style="padding:7px 10px;text-align:right;font-size:.78rem">${fore}</td>
        <td style="padding:7px 10px;text-align:right;font-size:.78rem;font-weight:600">${act}</td>
        <td style="padding:7px 10px;text-align:right;font-size:.78rem;color:${colV(varV)}">${sign(varV)}${Math.abs(varV).toFixed(1)}%</td>
      </tr>`;

    compHTML = `
      <div style="margin-bottom:12px;padding:8px 12px;background:rgba(79,110,247,.08);border-radius:8px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:.82rem;font-weight:600">${isRu?'Точность прогноза':'Forecast accuracy'}</span>
        <span style="font-size:.8rem;font-weight:700;color:${accuracy.col}">${accuracy.label}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead><tr style="border-bottom:1px solid var(--border)">
          <th style="padding:6px 10px;text-align:left;font-size:.7rem;color:var(--muted);font-weight:600;text-transform:uppercase">${isRu?'Метрика':'Metric'}</th>
          <th style="padding:6px 10px;text-align:right;font-size:.7rem;color:var(--muted);font-weight:600;text-transform:uppercase">${isRu?'Прогноз':'Forecast'}</th>
          <th style="padding:6px 10px;text-align:right;font-size:.7rem;color:var(--muted);font-weight:600;text-transform:uppercase">${isRu?'Факт':'Actual'}</th>
          <th style="padding:6px 10px;text-align:right;font-size:.7rem;color:var(--muted);font-weight:600;text-transform:uppercase">Δ%</th>
        </tr></thead>
        <tbody>
          ${row(isRu?'Затраты на кампанию':'Campaign cost', fmt(forecastCost), fmt(a.cost), costVar)}
          ${row(isRu?'Конверсия (отыгрыш)':'Wager conversion', pct(forecastConv), pct(actualConv), (actualConv - forecastConv)*100)}
          ${row(isRu?'Incremental revenue (3мес)':'Incremental revenue (3mo)', fmtU(forecastRev), fmtU(a.revenue3m), revVar)}
        </tbody>
      </table>`;
  }

  // Input form for actuals
  const saved = c.actuals || {};
  const inputStyle = 'width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:7px 10px;border-radius:7px;font-size:.82rem;font-family:inherit;outline:none';
  const inputForm = `
    <div style="font-size:.82rem;font-weight:600;color:var(--text);margin-bottom:10px">${isRu?'Введите фактические данные':'Enter actual results'}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div>
        <label style="font-size:.72rem;color:var(--muted);display:block;margin-bottom:4px">${isRu?'Фактические затраты':'Actual cost'} (${cur})</label>
        <input id="act-cost" type="number" value="${saved.cost||''}" style="${inputStyle}" placeholder="0">
      </div>
      <div>
        <label style="font-size:.72rem;color:var(--muted);display:block;margin-bottom:4px">${isRu?'Получили бонус (игроков)':'Activations (players)'}</label>
        <input id="act-activations" type="number" value="${saved.activations||''}" style="${inputStyle}" placeholder="0">
      </div>
      <div>
        <label style="font-size:.72rem;color:var(--muted);display:block;margin-bottom:4px">${isRu?'Выполнили вейджер':'Completions (wager done)'}</label>
        <input id="act-conversions" type="number" value="${saved.conversions||''}" style="${inputStyle}" placeholder="0">
      </div>
      <div>
        <label style="font-size:.72rem;color:var(--muted);display:block;margin-bottom:4px">${isRu?'Incremental revenue 3мес (USD)':'Incremental revenue 3mo (USD)'}</label>
        <input id="act-revenue" type="number" value="${saved.revenue3m||''}" style="${inputStyle}" placeholder="0">
      </div>
    </div>
    <button onclick="saveActuals()" class="btn btn-primary btn-sm">${isRu?'Сохранить и сравнить':'Save & Compare'}</button>
    ${c.actuals ? `<span style="font-size:.72rem;color:var(--muted);margin-left:10px">${isRu?'Обновлено':'Updated'}: ${new Date(c.actuals.savedAt).toLocaleDateString()}</span>` : ''}`;

  // Forecast summary
  const forecastSummary = fs.sP50 ? `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
      ${[
        [isRu?'Прогноз (P10)':'Forecast (P10)', fmt(fs.sP10?.cost||0), Math.round((fs.sP10?.conv||0)*100)+'%'],
        [isRu?'Прогноз (P50)':'Forecast (P50)', fmt(fs.sP50?.cost||0), Math.round((fs.sP50?.conv||0)*100)+'%'],
        [isRu?'Прогноз (P90)':'Forecast (P90)', fmt(fs.sP90?.cost||0), Math.round((fs.sP90?.conv||0)*100)+'%'],
      ].map(([l,cost,conv]) => `
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px">
          <div style="font-size:.7rem;color:var(--muted);margin-bottom:4px">${l}</div>
          <div style="font-size:.95rem;font-weight:700">${cost}</div>
          <div style="font-size:.7rem;color:var(--muted)">conv. ${conv}</div>
        </div>`).join('')}
    </div>` : '';

  return `
    <div style="padding:4px 0">
      <div style="font-size:.88rem;font-weight:700;margin-bottom:12px">${isRu?'📊 Прогноз vs Факт':'📊 Forecast vs Actual'}</div>
      ${forecastSummary}
      ${compHTML}
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px 16px">
        ${inputForm}
      </div>
    </div>`;
}

function renderDetailExport(c) {
  const isEN = currentLang === 'en';
  const items = [
    ['📄','JSON', isEN?'Full campaign config':'Полный конфиг кампании','json','↓'],
    ['📊','CSV',  isEN?'For CRM import':'Для импорта в CRM','csv','↓'],
    ['📋',isEN?'Copy JSON':'Копировать JSON', isEN?'To clipboard':'В буфер обмена','copy','›'],
    ['📧','Email', isEN?'Send to CRM team':'Отправить команде CRM','email','→'],
    ['🔗','API / curl', isEN?'REST integration':'Интеграция через REST API','api','{ }'],
  ];
  return `<div class="det-exp-grid">${items.map(([ico,name,desc,type]) =>
    `<button class="exp-btn" onclick="detExport('${type}','${c.id}')">
      <span class="exp-btn-ico">${ico}</span>
      <div><div class="exp-btn-name">${name}</div><div class="exp-btn-desc">${desc}</div></div>
    </button>`
  ).join('')}</div>`;
}

function detExport(type, id) {
  const c = getCampaigns().find(x => x.id === id);
  if (!c) return;
  const slug = (c.name||id).replace(/\s+/g,'-').toLowerCase();
  if (type === 'json') {
    const blob = new Blob([JSON.stringify(c,null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`campaign-${slug}.json`; a.click();
  } else if (type === 'csv') {
    const p = c.params||{};
    const rows = [
      ['Field','Value'],
      ['Name', c.name||''],['Scenario', c.scenario?.lbl||''],
      ['Geo', GEO_LBL[p.geo]||p.geo||''],['Segment', p.segment||''],
      ['Budget', p.budget||''],['Status', c.status||''],['Date', c.date||''],
    ];
    const csv = rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`campaign-${slug}.csv`; a.click();
  } else if (type === 'copy') {
    navigator.clipboard.writeText(JSON.stringify(c,null,2));
    const btn = event.target.closest('.exp-btn');
    if (btn) { btn.style.borderColor='var(--success)'; setTimeout(()=>btn.style.borderColor='',1500); }
  } else if (type === 'email') {
    window.location.href=`mailto:?subject=Campaign: ${c.name||'Campaign'}&body=${encodeURIComponent(JSON.stringify(c,null,2))}`;
  } else if (type === 'api') {
    const curl = `curl -X POST https://your-api.com/campaigns \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({id:c.id,scenario:c.scenario?.id,params:c.params},null,2)}'`;
    navigator.clipboard.writeText(curl);
    const btn = event.target.closest('.exp-btn');
    if (btn) { btn.style.borderColor='var(--success)'; setTimeout(()=>btn.style.borderColor='',1500); }
  }
}

function duplicateCampaign() {
  const c = getCampaigns().find(x => x.id === _detailId);
  if (!c) return;
  const copy = {...c, id:'c'+Date.now(), name:c.name+' (copy)', status:'draft', date:new Date().toISOString()};
  const camps = getCampaigns();
  camps.unshift(copy);
  putCampaigns(camps);
  renderCampaignViews();
  openDetail(copy.id);
}

function editCampaign() {
  const c = getCampaigns().find(x => x.id === _detailId);
  if (!c) return;
  draft = {
    _editId: c.id,
    _step: 1,
    scenario:    c.scenario    || null,
    params:      {...(c.params||{})},
    mechanics:   c.mechanic    || null,
    mechanicType:c.mechanicType|| null,
    econ:        c.econ        || null,
    texts:       c.texts       || null,
    audit:       c.audit       || null,
    explanation: c.explanation || null,
    alternatives:c.alternatives|| null,
  };
  renderScenarios();
  goStep(1);
  showView('wizard');
}

function detailSetStatus(status) {
  if (!_detailId) return;
  putCampaigns(getCampaigns().map(c => c.id === _detailId ? {...c, status} : c));
  renderCampaignViews();
  const c = getCampaigns().find(x => x.id === _detailId);
  if (c) document.getElementById('det-badge').innerHTML = statusBadge(c.status);
}

// ── EXIT MODAL ────────────────────────────────────────────────────────────────
function confirmExit() {
  document.getElementById('exit-modal').style.display = 'flex';
}
function closeExitModal() {
  document.getElementById('exit-modal').style.display = 'none';
}
function doExit() {
  window.location.href = '/';
}

// ── NEW CAMPAIGN MODAL ────────────────────────────────────────────────────────
function confirmNewCampaign() {
  const wizardEl = document.getElementById('view-wizard');
  const inWizard = wizardEl && wizardEl.style.display !== 'none';
  const hasProgress = inWizard && (draft._step > 1 || draft.scenario !== null);
  if (hasProgress) {
    document.getElementById('new-camp-modal').style.display = 'flex';
  } else {
    startWizard();
  }
}
function closeNewCampModal() {
  document.getElementById('new-camp-modal').style.display = 'none';
}

// ── I18N ──────────────────────────────────────────────────────────────────────
const I18N = {
  ru: {
    wb_back:'← На главную',
    exit_title:'Выйти из приложения?',
    exit_body:'Несохранённые данные текущей сессии будут потеряны.',
    exit_stay:'Остаться', exit_confirm:'Выйти',
    dash_title:'Добро пожаловать! 👋', dash_sub:'Создайте CRM-кампанию за 5 шагов с помощью AI',
    dash_create:'⚡ Создать кампанию', dash_quickstart:'Быстрый старт',
    dash_recent:'Последние активности', dash_all:'Все →',
    tbl_name:'Название', tbl_type:'Тип', tbl_status:'Статус', tbl_date:'Дата',
    camps_title:'Бонусные акции', camps_sub:'Все созданные акции',
    s1_title:'Выберите сценарий кампании',
    s1_sub:'Сценарий определяет тип аудитории и логику бонусного предложения',
    s2_title:'Параметры кампании', s2_sub:'Настройте аудиторию, бюджет и тон коммуникации',
    s2_geo:'Гео / Страна', s2_eu_pick:'Выберите страну', s2_eu_required:'Пожалуйста, выберите страну EU / UK', s2_vertical:'Вертикаль', s2_segment:'Сегмент игроков',
    s2_games:'Предпочтительные игры', s2_budget:'Бюджет кампании (€)', s2_lang:'Язык коммуникации',
    s2_players:'Игроков / месяц',
    s2_tone:'Тон коммуникации', s2_agg:'Агрессивность предложения', s2_risk:'Риск-уровень',
    s2_bmix:'Бонусный микс', s2_bmix_hint:'— выберите один или несколько типов',
    s2_lic:'Лицензия / Юрисдикция', chip_lic_auto:'Авто (по гео)', chip_lic_none:'Офшор / Нет',
    chip_seg_new:'🆕 Новые', chip_seg_mid:'👤 Средние',
    chip_games_slots:'🎰 Слоты', chip_games_table:'🃏 Настольные',
    chip_tone_friendly:'😊 Дружелюбный', chip_tone_pro:'🤝 Профессиональный', chip_tone_agg:'⚡ Агрессивный',
    t3_agg_low:'Низкая', t3_agg_mid:'Средняя', t3_agg_high:'Высокая',
    t3_risk_low:'🟢 Низкий', t3_risk_mid:'🟡 Средний', t3_risk_high:'🔴 Высокий',
    chip_btype_welcome:'💰 Welcome (1-й депозит)', chip_btype_dep2:'💰 2-й депозит', chip_btype_dep3:'🎁 3-й депозит',
    s4_title:'Тексты и аудит кампании',
    s4_sub:'AI генерирует тексты для каждого канала и проводит аудит рисков',
    s4_tab_texts:'📝 Тексты', s4_tab_audit:'🔍 Аудит',
    s4_loading_texts:'AI генерирует тексты для всех 5 каналов...',
    s4_loading_audit:'AI проводит аудит кампании...',
    ai_draft_note:'✦ AI-черновик — проверьте перед отправкой. Убедитесь, что регуляторные строки соответствуют T&C вашей платформы.',
    copy_all:'Скопировать все',
    btn_export_pdf:'⬇ PDF',
    econ_show_analysis:'Показать полный анализ ▾',
    econ_collapse:'Свернуть ▴',
    chain_title:'Цепочка депозитов',
    chain_step_welcome:'1-й депозит',
    chain_step_dep2:'2-й депозит',
    chain_step_dep3:'3-й депозит',
    chain_cohort:'доля когорты',
    chain_total:'Итого по цепочке',
    chain_ratio_lbl:'Нагрузка цепочки',
    s4_variant:'Вариант', s4_copy_btn:'› Копировать',
    s4_more_variants:'+ Ещё варианты', s4_generating:'⏳ Генерирую...',
    s4_email_subject_lbl:'Тема', s4_chars:'симв.',
    s5_title:'Экспорт кампании', s5_sub:'Скачайте или скопируйте конфигурацию в нужном формате',
    s5_exp_json_desc:'Полная конфигурация для разработчиков',
    s5_exp_csv_desc:'Для импорта в CRM-систему',
    s5_exp_copy_name:'Копировать в буфер', s5_exp_copy_desc:'Все параметры и тексты одним блоком',
    s5_exp_email_name:'Email в CRM', s5_exp_email_desc:'Отправить спецификацию команде',
    s5_exp_api_desc:'Интеграция через REST API',
    s5_exp_admin_desc:'Полный конфиг бонусной программы для разработчика',
    s5_sum_title:'📋 Сводка кампании',
    s5_sum_scenario:'Сценарий', s5_sum_geo:'Гео', s5_sum_segment:'Сегмент',
    s5_sum_mech:'Механика', s5_sum_maxb:'Макс. бонус', s5_sum_wager:'Вейджер',
    s5_sum_budget:'Бюджет', s5_sum_channels:'Каналы',
    s5_admin_copy:'› Копировать', s5_admin_save:'↓ Сохранить .txt',
    s5_done_title:'Кампания создана!',
    s5_done_sub:'Акция успешно сохранена. Найдите её в разделе «Бонусные акции».',
    wpl_1:'Сценарий', wpl_2:'Параметры', wpl_3:'Генерация', wpl_4:'Тексты', wpl_5:'Экспорт',
    badge_draft:'Черновик', badge_active:'Активна', badge_done:'Завершена',
    camp_empty:'Нет активностей. Создайте кампанию, турнир или программу лояльности!',
    // Wizard navigation
    btn_cancel:'← Отмена', btn_back:'← Назад', btn_next:'Далее →',
    btn_generate:'Сгенерировать ⚡',
    btn_to_texts:'Тексты и аудит →', btn_to_export:'Экспорт →',
    btn_create_camp:'✓ Создать кампанию', btn_go_camp:'Перейти к кампании →',
    btn_create_more:'+ Создать ещё', btn_new_camp:'+ Новая кампания',
    step_ctr:'Шаг {n} из 5',
    // Sidebar
    nav_main:'Главное', nav_dashboard:'Дашборд', nav_campaigns:'Бонусные акции',
    nav_tools:'Инструменты', nav_configurator:'Конфигуратор', nav_campaign_gen:'Генератор акций', nav_tournament:'Турниры', nav_tournament_gen:'Tournament Gen', nav_setup_guide:'Setup Guide',
    nav_scenarios:'Сценарии', nav_calendar:'Retention Calendar', nav_bonuses:'Бонусы', nav_loyalty:'Лояльность', nav_ai:'AI Ассистент',
    nav_soon:'Скоро', nav_analytics:'Аналитика', nav_settings:'Настройки',
    // Topbar view titles
    view_dashboard:'Дашборд', view_campaigns:'Бонусные акции', 'view_offer-gen':'Бонусы',
    view_configurator:'Конфигуратор', view_wizard:'Новая кампания',
    // Quick start cards
    qc_launch_n:'Первый запуск казино',
    qc_launch_d:'Полный бонусный пакет: Welcome (1-й депозит) + No Deposit + 2-й/3-й депозит + Cashback — все механики для старта',
    qc_react_n:'Реактивация', qc_react_d:'Вернуть неактивных 7+ дней',
    qc_reload_n:'Reload кампания', qc_reload_d:'Бонус на повторный депозит',
    qc_cashback_n:'Cashback', qc_cashback_d:'Возврат % от проигрышей',
    qc_vip_n:'VIP удержание', qc_vip_d:'Персональные офферы для VIP',
    qc_sport_n:'Спортивное событие', qc_sport_d:'Фрибет или бонус к матчу',
    qc_tourn_n:'Турнир / Ивент', qc_tourn_d:'Механика слот-турнира',
    qc_loyalty_n:'Программа лояльности', qc_loyalty_d:'Тиры, миссии и кешбэк для удержания игроков',
    // Step 3
    s3_gen_title:'AI генерирует кампанию...', s3_gen_sub:'Анализируем сценарий и подбираем оптимальную механику',
    s3_title:'Механика подобрана ✓', s3_sub:'Параметры рассчитаны по региональной модели Retomat для вашего сценария',
    prog_1:'Анализ сценария', prog_2:'Подбор механики бонуса', prog_3:'Генерация условий',
    prog_4:'Создание текстов', prog_5:'Проверка на риски',
    rc_mech:'Рекомендованная механика', rc_mechs:'Механики кампании',
    rc_why:'Почему эта механика', rc_alts:'Альтернативы', rc_econ:'Экономика кампании',
    rc_audit:'Чек-лист проверки', rc_recs:'Рекомендации',
    // mechRows labels
    mr_na:'Механика недоступна для данного региона',
    mr_type:'Тип', mr_model:'Модель', mr_tiered:'Тиерный (Bronze → Platinum)',
    mr_period:'Период', mr_monthly:'Ежемесячно', mr_weekly:'Еженедельно',
    mr_maxamt:'Макс. сумма', mr_pct_back:'% Возврата', mr_minloss:'Мин. потерь',
    mr_pkgs:'Пакеты', mr_maxb:'Макс. бонус', mr_mind:'Мин. депозит',
    mr_wager:'Вейджер', mr_fs:'Фриспины', mr_days:'Срок', mr_days_sfx:' дней', mr_promo:'Промокод',
    // mechanic type labels
    mt_welcome:'Welcome (1-й депозит)', mt_ndb:'No Deposit', mt_reload:'Reload', mt_dep2:'2-й депозит', mt_dep3:'3-й депозит', mt_cashback:'Cashback',
    // verdict & econ
    vrd_cheap:'Экономичный ✓', vrd_ok:'Оптимальный ✓', vrd_warn:'Внимание ⚠', vrd_high:'Высокий риск ✗',
    ec_cost:'Расходы кампании', ec_arpu:'ARPU / мес.', ec_ltv:'LTV 3 мес.', ec_roi:'ROI 3 мес.', ec_verdict:'Вердикт', ec_nosrv:'нет ответа от сервера',
    // Scenario categories
    sc_cat_launch:'Запуск', sc_cat_react:'Реактивация', sc_cat_dep:'Депозиты',
    sc_cat_vip:'VIP', sc_cat_sport:'Спорт', sc_cat_tourn:'Турниры', sc_cat_other:'Другое',
    // Scenario items
    sc_first_launch:'Первый запуск казино',
    sc_inactive_3:'Неактивен 3 дня', sc_inactive_7:'Неактивен 7 дней', sc_inactive_30:'Неактивен 30+ дней',
    sc_churn_risk:'Риск оттока', sc_return_win:'Вернуть после выигрыша', sc_return_loss:'Вернуть после проигрыша',
    sc_first_dep:'Первый депозит', sc_second_dep:'Второй депозит', sc_big_dep:'Крупный депозит',
    sc_vip_retention:'VIP удержание', sc_vip_reactivation:'VIP реактивация',
    sc_sport_event:'Спортивное событие', sc_tournament:'Турнир / Ивент',
    sc_cashback:'Cashback кампания', sc_custom:'Кастомный сценарий',
    // Detail view
    det_back:'← Акции', det_dup:'⎘ Дублировать', det_edit:'✏ Редактировать', det_cal:'📅 Открыть в календаре',
    det_tab_ov:'Обзор', det_tab_mech:'Механика', det_tab_texts:'Тексты', det_tab_audit:'Аудит', det_tab_export:'Экспорт', det_tab_analytics:'📊 Факт',
    det_ov_scenario:'Сценарий', det_ov_geo:'Регион', det_ov_segment:'Сегмент',
    det_ov_budget:'Бюджет', det_ov_tone:'Тон', det_ov_lang:'Язык текстов',
    det_ov_status:'Статус', det_ov_created:'Создана',
    det_mech_type:'Тип механики', det_mech_pct:'Бонус %', det_mech_maxb:'Макс. бонус',
    det_mech_wager:'Вейджер', det_mech_fs:'Фриспины', det_mech_valid:'Срок действия',
    det_no_wager:'Без вейджера',
    det_no_data:'Нет данных',
    det_no_texts:'Тексты не сохранены. Пересоздайте кампанию через мастер для генерации текстов.',
    det_no_audit:'Аудит не сохранён. Пересоздайте кампанию через мастер для запуска аудита.',
    nc_title:'Начать новую кампанию?',
    nc_body:'Прогресс текущей кампании будет потерян без сохранения.',
    nc_stay:'Продолжить редактирование',
    nc_confirm:'Начать новую',
  },
  en: {
    wb_back:'← Home',
    exit_title:'Exit the app?',
    exit_body:'Any unsaved data from the current session will be lost.',
    exit_stay:'Stay', exit_confirm:'Exit',
    dash_title:'Welcome! 👋', dash_sub:'Create a CRM campaign in 5 steps with AI',
    dash_create:'⚡ Create Campaign', dash_quickstart:'Quick Start',
    dash_recent:'Recent Activity', dash_all:'All →',
    tbl_name:'Name', tbl_type:'Type', tbl_status:'Status', tbl_date:'Date',
    camps_title:'Bonus Offers', camps_sub:'All created offers',
    s1_title:'Select Campaign Scenario',
    s1_sub:'The scenario defines the audience type and bonus offer logic',
    s2_title:'Campaign Parameters', s2_sub:'Configure audience, budget and communication tone',
    s2_geo:'Geo / Country', s2_eu_pick:'Select country', s2_eu_required:'Please select an EU / UK country', s2_vertical:'Vertical', s2_segment:'Player Segment',
    s2_games:'Preferred Games', s2_budget:'Campaign Budget (€)', s2_lang:'Communication Language',
    s2_players:'Players / month',
    s2_tone:'Communication Tone', s2_agg:'Offer Aggressiveness', s2_risk:'Risk Level',
    s2_bmix:'Bonus Mix', s2_bmix_hint:'— select one or more types',
    s2_lic:'License / Jurisdiction', chip_lic_auto:'Auto (by geo)', chip_lic_none:'Offshore / None',
    chip_seg_new:'🆕 New', chip_seg_mid:'👤 Regular',
    chip_games_slots:'🎰 Slots', chip_games_table:'🃏 Table',
    chip_tone_friendly:'😊 Friendly', chip_tone_pro:'🤝 Professional', chip_tone_agg:'⚡ Aggressive',
    t3_agg_low:'Low', t3_agg_mid:'Medium', t3_agg_high:'High',
    t3_risk_low:'🟢 Low', t3_risk_mid:'🟡 Medium', t3_risk_high:'🔴 High',
    chip_btype_welcome:'💰 Welcome (1st Deposit)', chip_btype_dep2:'💰 2nd Deposit', chip_btype_dep3:'🎁 3rd Deposit',
    s4_title:'Texts & Campaign Audit',
    s4_sub:'AI generates texts for each channel and audits risks',
    s4_tab_texts:'📝 Texts', s4_tab_audit:'🔍 Audit',
    s4_loading_texts:'AI is generating texts for all 5 channels...',
    s4_loading_audit:'AI is auditing the campaign...',
    ai_draft_note:'AI draft — review before sending. Verify regulatory strings match your platform\'s T&Cs.',
    copy_all:'Copy all',
    btn_export_pdf:'⬇ PDF',
    econ_show_analysis:'Show full analysis ▾',
    econ_collapse:'Collapse ▴',
    chain_title:'Deposit chain',
    chain_step_welcome:'1st deposit',
    chain_step_dep2:'2nd deposit',
    chain_step_dep3:'3rd deposit',
    chain_cohort:'cohort share',
    chain_total:'Chain total',
    chain_ratio_lbl:'Chain load',
    s4_variant:'Variant', s4_copy_btn:'› Copy',
    s4_more_variants:'+ More variants', s4_generating:'⏳ Generating...',
    s4_email_subject_lbl:'Subject', s4_chars:'chars',
    s5_title:'Export Campaign', s5_sub:'Download or copy the configuration in your preferred format',
    s5_exp_json_desc:'Full configuration for developers',
    s5_exp_csv_desc:'For import into your CRM',
    s5_exp_copy_name:'Copy to clipboard', s5_exp_copy_desc:'All parameters and texts in one block',
    s5_exp_email_name:'Email to CRM', s5_exp_email_desc:'Send spec to the team',
    s5_exp_api_desc:'REST API integration',
    s5_exp_admin_desc:'Full bonus config for developers',
    s5_sum_title:'📋 Campaign Summary',
    s5_sum_scenario:'Scenario', s5_sum_geo:'Geo', s5_sum_segment:'Segment',
    s5_sum_mech:'Mechanic', s5_sum_maxb:'Max Bonus', s5_sum_wager:'Wager',
    s5_sum_budget:'Budget', s5_sum_channels:'Channels',
    s5_admin_copy:'› Copy', s5_admin_save:'↓ Save .txt',
    s5_done_title:'Campaign Created!',
    s5_done_sub:'Offer saved successfully. Find it in Bonus Offers.',
    wpl_1:'Scenario', wpl_2:'Parameters', wpl_3:'Generate', wpl_4:'Texts', wpl_5:'Export',
    badge_draft:'Draft', badge_active:'Active', badge_done:'Done',
    camp_empty:'No activities yet. Create a campaign, tournament or loyalty program!',
    // Wizard navigation
    btn_cancel:'← Cancel', btn_back:'← Back', btn_next:'Next →',
    btn_generate:'Generate ⚡',
    btn_to_texts:'Texts & Audit →', btn_to_export:'Export →',
    btn_create_camp:'✓ Create Campaign', btn_go_camp:'Go to Campaign →',
    btn_create_more:'+ Create Another', btn_new_camp:'+ New Campaign',
    step_ctr:'Step {n} of 5',
    // Sidebar
    nav_main:'Main', nav_dashboard:'Dashboard', nav_campaigns:'Bonus Offers',
    nav_tools:'Tools', nav_configurator:'Configurator', nav_campaign_gen:'Offer Gen', nav_tournament:'Tournaments', nav_tournament_gen:'Tournament Gen', nav_setup_guide:'Setup Guide',
    nav_scenarios:'Scenarios', nav_calendar:'Retention Calendar', nav_bonuses:'Bonuses', nav_loyalty:'Loyalty Program', nav_ai:'AI Assistant',
    nav_soon:'Soon', nav_analytics:'Analytics', nav_settings:'Settings',
    // Topbar view titles
    view_dashboard:'Dashboard', view_campaigns:'Bonus Offers', 'view_offer-gen':'Bonuses',
    view_configurator:'Configurator', view_wizard:'New Campaign',
    // Quick start cards
    qc_launch_n:'Casino First Launch',
    qc_launch_d:'Full bonus package: Welcome (1st Deposit) + No Deposit + 2nd/3rd Deposit + Cashback — all mechanics for launch',
    qc_react_n:'Reactivation', qc_react_d:'Re-engage players inactive 7+ days',
    qc_reload_n:'Reload Campaign', qc_reload_d:'Bonus on repeat deposit',
    qc_cashback_n:'Cashback', qc_cashback_d:'Return % of losses',
    qc_vip_n:'VIP Retention', qc_vip_d:'Personal offers for VIP players',
    qc_sport_n:'Sport Event', qc_sport_d:'Freebet or match bonus',
    qc_tourn_n:'Tournament / Event', qc_tourn_d:'Slot tournament mechanic',
    qc_loyalty_n:'Loyalty Program', qc_loyalty_d:'Tiers, missions and cashback to retain players',
    // Step 3
    s3_gen_title:'AI is generating campaign...', s3_gen_sub:'Analysing scenario and selecting optimal mechanics',
    s3_title:'Mechanic Selected ✓', s3_sub:'Parameters calculated using the regional Retomat model for your scenario',
    prog_1:'Analysing scenario', prog_2:'Selecting bonus mechanic', prog_3:'Generating conditions',
    prog_4:'Creating texts', prog_5:'Checking for risks',
    rc_mech:'Recommended Mechanic', rc_mechs:'Campaign Mechanics',
    rc_why:'Why This Mechanic', rc_alts:'Alternatives', rc_econ:'Campaign Economics',
    rc_audit:'Compliance Checklist', rc_recs:'Recommendations',
    // mechRows labels
    mr_na:'Mechanic not available for this region',
    mr_type:'Type', mr_model:'Model', mr_tiered:'Tiered (Bronze → Platinum)',
    mr_period:'Period', mr_monthly:'Monthly', mr_weekly:'Weekly',
    mr_maxamt:'Max Amount', mr_pct_back:'% Return', mr_minloss:'Min Loss',
    mr_pkgs:'Packages', mr_maxb:'Max Bonus', mr_mind:'Min Deposit',
    mr_wager:'Wager', mr_fs:'Free Spins', mr_days:'Validity', mr_days_sfx:' days', mr_promo:'Promo Code',
    // mechanic type labels
    mt_welcome:'Welcome (1st Deposit)', mt_ndb:'No Deposit', mt_reload:'Reload', mt_dep2:'2nd Deposit', mt_dep3:'3rd Deposit', mt_cashback:'Cashback',
    // verdict & econ
    vrd_cheap:'Economical ✓', vrd_ok:'Optimal ✓', vrd_warn:'Attention ⚠', vrd_high:'High Risk ✗',
    ec_cost:'Campaign Cost', ec_arpu:'ARPU / mo.', ec_ltv:'LTV 3 mo.', ec_roi:'ROI 3 mo.', ec_verdict:'Verdict', ec_nosrv:'no response from server',
    // Scenario categories
    sc_cat_launch:'Launch', sc_cat_react:'Reactivation', sc_cat_dep:'Deposits',
    sc_cat_vip:'VIP', sc_cat_sport:'Sport', sc_cat_tourn:'Tournaments', sc_cat_other:'Other',
    // Scenario items
    sc_first_launch:'Casino First Launch',
    sc_inactive_3:'Inactive 3 days', sc_inactive_7:'Inactive 7 days', sc_inactive_30:'Inactive 30+ days',
    sc_churn_risk:'Churn Risk', sc_return_win:'Return after win', sc_return_loss:'Return after loss',
    sc_first_dep:'First Deposit', sc_second_dep:'Second Deposit', sc_big_dep:'Large Deposit',
    sc_vip_retention:'VIP Retention', sc_vip_reactivation:'VIP Reactivation',
    sc_sport_event:'Sport Event', sc_tournament:'Tournament / Event',
    sc_cashback:'Cashback Campaign', sc_custom:'Custom Scenario',
    // Detail view
    det_back:'← Offers', det_dup:'⎘ Duplicate', det_edit:'✏ Edit', det_cal:'📅 Open in Calendar',
    det_tab_ov:'Overview', det_tab_mech:'Mechanics', det_tab_texts:'Texts', det_tab_audit:'Audit', det_tab_export:'Export', det_tab_analytics:'📊 Actuals',
    det_ov_scenario:'Scenario', det_ov_geo:'Region', det_ov_segment:'Segment',
    det_ov_budget:'Budget', det_ov_tone:'Tone', det_ov_lang:'Text Language',
    det_ov_status:'Status', det_ov_created:'Created',
    det_mech_type:'Mechanic Type', det_mech_pct:'Bonus %', det_mech_maxb:'Max Bonus',
    det_mech_wager:'Wager', det_mech_fs:'Free Spins', det_mech_valid:'Validity',
    det_no_wager:'No Wager',
    det_no_data:'No data',
    det_no_texts:'Texts not saved. Recreate the campaign via wizard to generate texts.',
    det_no_audit:'Audit not saved. Recreate the campaign via wizard to run the audit.',
    nc_title:'Start a new campaign?',
    nc_body:'Progress of the current campaign will be lost without saving.',
    nc_stay:'Continue editing',
    nc_confirm:'Start new',
  },
};

let currentLang = localStorage.getItem('bonusLang') || 'en';
let currentView  = 'dashboard';

function t(key) { return (I18N[currentLang] || I18N.ru)[key] || key; }

function updateTopbar(name) {
  const subMap = { wizard:'AI Campaign Generator' };
  document.getElementById('tb-title').textContent = t('view_'+name) || name;
  const sub = subMap[name] || '';
  const subEl = document.getElementById('tb-sub');
  const sepEl = document.getElementById('tb-sep');
  if (subEl) subEl.textContent = sub;
  if (sepEl) sepEl.style.display = sub ? '' : 'none';
}

function setUILang(lang) {
  currentLang = lang;
  try { localStorage.setItem('bonusLang', lang); } catch(e) {}
  document.documentElement.setAttribute('data-lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t(el.dataset.i18n);
    if (v && v !== el.dataset.i18n) el.textContent = v;
  });
  for (let i = 1; i <= 5; i++) {
    const lbl = document.getElementById('wpl-'+i);
    if (lbl) lbl.textContent = t('wpl_'+i);
  }
  document.querySelectorAll('.lt-btn').forEach(b => b.classList.toggle('active', b.id === 'lt-'+lang));
  document.querySelectorAll('.step-ctr[data-step]').forEach(el => {
    el.textContent = t('step_ctr').replace('{n}', el.dataset.step);
  });
  updateTopbar(currentView);
  // Re-render risk hint + re-fill the geo select (JS-built optgroup/toggle labels
  // aren't [data-i18n], so they must be rebuilt for the new language) on step 2.
  if (draft._step === 2) { updateRiskHint(draft.params.risk || 'mid'); genFillGeoSelect(); }
  if (!['dashboard','configurator'].includes(currentView)) {
    const tbr = document.getElementById('tb-right');
    if (tbr && tbr.innerHTML) tbr.innerHTML = `<button class="btn btn-primary btn-sm" onclick="startWizard()">${t('btn_new_camp')}</button>`;
  }
  renderScenarios();
  renderCampaignViews();
  // Re-render dynamic content that uses t() at call time
  if (draft._apiResult && document.getElementById('s3-res')?.style.display !== 'none') {
    renderMechanicResults(draft._apiResult);
  }
  if (_detailId) {
    const activeTab = document.querySelector('.dtab.active');
    const tabName = activeTab?.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
    if (tabName) {
      const c = getCampaigns().find(x => x.id === _detailId);
      if (c) renderDetailTab(tabName, c);
    }
  }
}

// ── CAMPAIGN STORAGE ──────────────────────────────────────────────────────────
const CAMPS_KEY = 'be_campaigns';

function getCampaigns() {
  try { return JSON.parse(localStorage.getItem(CAMPS_KEY) || '[]'); } catch { return []; }
}
function putCampaigns(arr) {
  localStorage.setItem(CAMPS_KEY, JSON.stringify(arr));
  updateCampaignBadge();
}

function saveCampaign() {
  const camps = getCampaigns();
  const id = 'c' + Date.now();
  const rec = {
    id,
    name: draft.scenario?.lbl || 'Campaign',
    type: draft.scenario?.cat || '—',
    status: 'draft',
    date: new Date().toISOString(),
    scenario: draft.scenario,
    params: draft.params,
    mechanic: draft.mechanics,
    mechanicType: draft.mechanicType,
    econ: draft.econ,
    forecastSnapshot: draft.econ ? {
      sP10: draft.econ.sP10, sP50: draft.econ.sP50, sP90: draft.econ.sP90,
      costRatio: draft.econ.costRatio, pl: draft.econ.pl, arpu: draft.econ.arpu,
      ltv3: draft.econ.ltv3, wagerX: draft.econ.wagerX,
      sitecur: draft.params?.sitecur || getSitecurByGeo(draft.params?.geo) || 'EUR', geo: draft.params?.geo || '',
      capturedAt: new Date().toISOString(),
    } : null,
    texts: draft.texts || null,
    audit: draft.audit || null,
    explanation:   draft.explanation   || null,
    explanationRu: draft.explanationRu || null,
    explanationEn: draft.explanationEn || null,
    alternatives:  draft.alternatives  || null,
  };
  camps.unshift(rec);
  putCampaigns(camps);
  window.RetomatRepo?.mirror('campaigns', rec.id, rec);
  // Merged action: saving also schedules the campaign in the Retention Calendar
  // (silent — no confirm/toast; dupes by geo/segment/type are skipped).
  try { addCampaignToCalendar({ silent: true, savedId: id }); } catch {}
  renderCampaignViews();
  return id;
}

function deleteCampaign(id) {
  putCampaigns(getCampaigns().filter(c => c.id !== id));
  window.RetomatRepo?.unmirror('campaigns', id);
  renderCampaignViews();
  closeMenu();
}

function setCampaignStatus(id, status) {
  const next = getCampaigns().map(c => c.id === id ? {...c, status} : c);
  putCampaigns(next);
  const rec = next.find(c => c.id === id);
  if (rec) window.RetomatRepo?.mirror('campaigns', id, rec);
  renderCampaignViews();
  closeMenu();
}

// ── CAMPAIGN RENDERING ────────────────────────────────────────────────────────
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(currentLang === 'en' ? 'en-GB' : 'ru-RU', {day:'numeric',month:'short'});
  } catch { return '—'; }
}

function mechTypeLbl(type) { return type ? (t('mt_'+type) || type) : '—'; }

function statusBadge(s) {
  const cls = {draft:'badge-draft',active:'badge-active',done:'badge-done'}[s] || 'badge-draft';
  return `<span class="badge ${cls}">${t('badge_'+s) || s}</span>`;
}

// Entity-category badge for saved-items tables — the "Тип" column shows the KIND
// of saved item (Bonus / Tournament / Loyalty), not the mechanic (which moves into
// the row subtitle). Shared by the dashboard renderers below.
function catBadge(kind) {
  const M = {
    bonus:      { en: 'Bonus',      ru: 'Бонус',      bg: 'rgba(99,102,241,.15)', c: '#818cf8' },
    tournament: { en: 'Tournament', ru: 'Турнир',     bg: 'rgba(245,158,11,.15)', c: '#f59e0b' },
    loyalty:    { en: 'Loyalty',    ru: 'Лояльность', bg: 'rgba(168,85,247,.15)', c: '#c084fc' },
  };
  const m = M[kind];
  if (!m) return '—';
  const label = (typeof currentLang !== 'undefined' && currentLang === 'ru') ? m.ru : m.en;
  return `<span style="background:${m.bg};color:${m.c};padding:2px 8px;border-radius:6px;font-size:.68rem;font-weight:700;white-space:nowrap">${label}</span>`;
}

function campaignRowHTML(c) {
  const mech = mechTypeLbl(c.mechanicType);
  const geo  = c.params?.geo ? (GEO_LBL[c.params.geo] || c.params.geo) : '';
  const lang = c.params?.lang ? c.params.lang.toUpperCase() : '';
  // mechanic (Launch/Reload/…) lives in the subtitle; Тип column shows the category.
  const meta = [mech || c.type, geo, lang].filter(Boolean).join(' · ');
  return `<div class="ct-row clickable" onclick="openDetail('${c.id}')">
    <div><div class="ct-name">${esc(c.name)}</div><div class="ct-meta">${esc(meta)}</div></div>
    <div class="ct-cell">${catBadge('bonus')}</div>
    <div>${statusBadge(c.status)}</div>
    <div class="ct-cell">${fmtDate(c.date)}</div>
    <div style="text-align:right"><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();showCampMenu('${c.id}',this)">···</button></div>
  </div>`;
}

function getTournaments() {
  try { return JSON.parse(localStorage.getItem('savedTournaments') || '[]'); } catch { return []; }
}

function getLoyaltyPrograms() {
  try { return JSON.parse(localStorage.getItem('savedLoyaltyPrograms') || '[]'); } catch { return []; }
}

function tournamentRowHTML(t) {
  const date = t.createdAt ? new Date(t.createdAt).toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';
  const TYPE_ICON = { slot:'🎰', live:'🃏', mixed:'🎲', prize_drop:'💎' };
  const TYPE_LABEL = { slot:'Slots', live:'Live Casino', mixed:'Mixed', prize_drop:'Prize Drop' };
  const icon  = TYPE_ICON[t.type]  || '🏆';
  const label = TYPE_LABEL[t.type] || t.type || 'Tournament';
  const seg   = t.params?.segment  || 'all';
  const pool  = t.spec?.prizePool  ? `${t.cur || ''}${t.spec.prizePool.toLocaleString()}` : '—';
  return `<div class="ct-row clickable" onclick="genSwitchType('tournament')">
    <div><div class="ct-name">${icon} ${esc(t.name || label)}</div><div class="ct-meta">${label} · ${seg} · ${pool}</div></div>
    <div class="ct-cell">${catBadge('tournament')}</div>
    <div><span class="status-badge status-saved" style="background:rgba(16,185,129,.15);color:#10b981;padding:2px 8px;border-radius:6px;font-size:.7rem;font-weight:700">Saved</span></div>
    <div class="ct-cell">${date}</div>
    <div></div>
  </div>`;
}

function loyaltyRowHTML(p) {
  const date  = p.createdAt ? new Date(p.createdAt).toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';
  const econ  = p.result?.econ;
  const cfg   = p.result?.config;
  const MODE_ICON  = { tiers:'🏅', missions:'🎯', hybrid:'⭐' };
  const MODE_LABEL = { tiers:'Tiers', missions:'Missions', hybrid:'Hybrid' };
  const mode  = cfg?.mode || 'hybrid';
  const icon  = MODE_ICON[mode] || '⭐';
  const label = MODE_LABEL[mode] || mode;
  const lift  = econ?.retentionLiftPct != null ? `${econ.retentionLiftPct.toFixed(1)}% lift` : '';
  const meta  = [label, cfg?.region?.toUpperCase(), cfg?.segment, lift].filter(Boolean).join(' · ');
  return `<div class="ct-row clickable" onclick="genSwitchType('loyalty')">
    <div><div class="ct-name">${icon} ${esc(p.name)}</div><div class="ct-meta">${esc(meta)}</div></div>
    <div class="ct-cell">${catBadge('loyalty')}</div>
    <div><span style="background:rgba(16,185,129,.15);color:#10b981;padding:2px 8px;border-radius:6px;font-size:.7rem;font-weight:700">Saved</span></div>
    <div class="ct-cell">${date}</div>
    <div></div>
  </div>`;
}

function renderCampaignViews() {
  const camps     = getCampaigns();
  const tourns    = getTournaments();
  const loyalties = getLoyaltyPrograms();

  // Dashboard: all saved items merged, sorted by date desc
  const dash = document.getElementById('dash-camp-body');
  if (dash) {
    const campItems    = camps.map(c =>    ({ ...c, _kind: 'camp',    _ts: new Date(c.date || 0).getTime() }));
    const tournItems   = tourns.map(t =>   ({ ...t, _kind: 'tourn',   _ts: new Date(t.createdAt || 0).getTime() }));
    const loyaltyItems = loyalties.map(p => ({ ...p, _kind: 'loyalty', _ts: new Date(p.createdAt || 0).getTime() }));
    const merged = [...campItems, ...tournItems, ...loyaltyItems].sort((a, b) => b._ts - a._ts);
    if (merged.length) {
      dash.innerHTML = merged.map(item =>
        item._kind === 'camp' ? campaignRowHTML(item) : item._kind === 'loyalty' ? loyaltyRowHTML(item) : tournamentRowHTML(item)
      ).join('');
    } else {
      dash.innerHTML = `
<div class="card" style="text-align:center;padding:40px 20px;margin:0;border-radius:0 0 12px 12px;border-top:none">
  <div style="font-size:2.5rem;margin-bottom:14px">📁</div>
  <div style="color:var(--muted);font-size:.88rem">${t('camp_empty')}</div>
</div>`;
    }
  }

  // Bonus Offers + Offer Gen views: campaigns only
  const emptyCard = `
<div class="card" style="text-align:center;padding:40px 20px;margin:0;border-radius:0 0 12px 12px;border-top:none">
  <div style="font-size:2.5rem;margin-bottom:14px">📁</div>
  <div style="color:var(--muted);font-size:.88rem;margin-bottom:20px">${t('camp_empty')}</div>
  <button class="btn btn-primary" onclick="startWizard()">⚡ ${t('dash_create')}</button>
</div>`;
  const campRows = camps.length ? camps.map(campaignRowHTML).join('') : emptyCard;
  const all = document.getElementById('all-camp-body');
  if (all) all.innerHTML = campRows;
  const hd = document.getElementById('all-camp-hd');
  if (hd) hd.style.display = camps.length ? '' : 'none';
  const og = document.getElementById('offer-gen-body');
  if (og) og.innerHTML = campRows;
  const ogh = document.getElementById('offer-gen-hd');
  if (ogh) ogh.style.display = camps.length ? '' : 'none';

  updateAllBadges();
}

// ── CONTEXT MENU ─────────────────────────────────────────────────────────────
let _openMenu = null;

function closeMenu() {
  if (_openMenu) { _openMenu.remove(); _openMenu = null; }
}

function showCampMenu(id, btn) {
  closeMenu();
  const menu = document.createElement('div');
  menu.className = 'camp-menu';
  menu.innerHTML = `
    <button class="camp-menu-item" onclick="openDetail('${id}')">↗ Открыть</button>
    <div class="camp-menu-sep"></div>
    <button class="camp-menu-item" onclick="setCampaignStatus('${id}','active')">▶ Активировать</button>
    <button class="camp-menu-item" onclick="setCampaignStatus('${id}','done')">✓ Завершить</button>
    <div class="camp-menu-sep"></div>
    <button class="camp-menu-item" onclick="deleteCampaign('${id}')" style="color:#EF4444">🗑 Удалить</button>`;
  document.body.appendChild(menu);
  _openMenu = menu;
  const r  = btn.getBoundingClientRect();
  const mh = menu.offsetHeight;
  const top = (window.innerHeight - r.bottom) < (mh + 8)
    ? r.top - mh - 4
    : r.bottom + 4;
  menu.style.top   = top + 'px';
  menu.style.right = (window.innerWidth - r.right) + 'px';
  setTimeout(() => document.addEventListener('click', closeMenu, {once:true}), 10);
}

// ── MOBILE SIDEBAR ────────────────────────────────────────────────────────────
function toggleSidebar() {
  const sb = document.querySelector('.sidebar');
  const ov = document.getElementById('sb-overlay');
  const open = sb.classList.toggle('sb-open');
  ov.classList.toggle('sb-open', open);
}

// ── CONFIGURATOR IFRAME ───────────────────────────────────────────────────────

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function showOnboarding() {
  const isRu = currentLang === 'ru';
  const steps = isRu ? [
    ['1 → Сценарий',    'Выберите из 8 типов кампаний'],
    ['2 → Параметры',   'Гео, сегмент, тон, риск'],
    ['3 → Экономика',   'Модель затрат + прогноз удержания'],
    ['4 → AI-тексты',   'Push · Email · SMS · TG · Popup'],
    ['5 → Аудит',       'Соответствие лицензии'],
  ] : [
    ['1 → Scenario',    'Choose from 8 campaign types'],
    ['2 → Parameters',  'Geo, segment, tone, risk'],
    ['3 → Economics',   'Cost model + retention lift'],
    ['4 → AI Texts',    'Push · Email · SMS · TG · Popup'],
    ['5 → Audit',       'Compliance per license'],
  ];
  const stepsHtml = steps.map(([lbl,desc]) =>
    `<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">
      <span style="font-size:.8rem;font-weight:700;color:#a0b0ff;min-width:130px">${lbl}</span>
      <span style="font-size:.8rem;color:var(--muted)">${desc}</span>
    </div>`
  ).join('');
  const modal = document.createElement('div');
  modal.id = 'onb-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(10,13,20,.75);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `
    <div style="background:#161c2d;border:1px solid rgba(79,110,247,.3);border-radius:16px;padding:28px 28px 24px;max-width:480px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.6)">
      <div style="font-size:1.15rem;font-weight:700;color:#e8eaf0;margin-bottom:4px">${isRu ? 'AI-генератор кампаний' : 'AI Campaign Generator'}</div>
      <div style="font-size:.83rem;color:var(--muted);margin-bottom:18px">${isRu ? 'Что вы получите за ~2 минуты:' : 'What you\'ll get in ~2 minutes:'}</div>
      ${stepsHtml}
      <div style="margin-top:20px;display:flex;align-items:center;justify-content:space-between;gap:12px">
        <label style="display:flex;align-items:center;gap:7px;font-size:.77rem;color:var(--muted);cursor:pointer">
          <input type="checkbox" id="onb-skip-cb" style="accent-color:var(--accent)">
          ${isRu ? 'Больше не показывать' : 'Don\'t show again'}
        </label>
        <button onclick="_closeOnboarding()" style="background:linear-gradient(135deg,#4f6ef7,#7c3aed);color:#fff;border:none;padding:9px 22px;border-radius:9px;font-size:.88rem;font-weight:700;cursor:pointer">
          ${isRu ? 'Начать →' : 'Start →'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}
function _closeOnboarding() {
  const cb = document.getElementById('onb-skip-cb');
  if (cb && cb.checked) localStorage.setItem('cg_onboarding_done', '1');
  const m = document.getElementById('onb-modal');
  if (m) m.remove();
}

// ── PDF EXPORT ────────────────────────────────────────────────────────────────
function exportCampaignPDF() {
  const isRu = currentLang === 'ru';
  const scen = draft.scenario?.lbl || '—';
  const geo  = GEO_LBL[draft.params?.geo] || draft.params?.geo || '—';
  const ts   = new Date().toLocaleString('en-GB', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const E    = lastResult?.econ || {};
  const cur  = lastResult?.cur || '';
  const fmt  = v => cur + ' ' + Math.round(v).toLocaleString();

  // Economics section
  const econHTML = E.sP50 ? `
    <h3>${isRu?'Экономика кампании':'Campaign Economics'}</h3>
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:12px">
      <tr style="background:#f0f0f0"><th>${isRu?'Сценарий':'Scenario'}</th><th>${isRu?'Затраты':'Cost'}</th><th>${isRu?'Конверсия':'Conv.'}</th></tr>
      <tr><td>${isRu?'Лучший (P10)':'Best case (P10)'}</td><td>${fmt(E.sP10?.cost||0)}</td><td>${Math.round((E.sP10?.conv||0)*100)}%</td></tr>
      <tr><td>${isRu?'Ожидаемый (P50)':'Expected (P50)'}</td><td>${fmt(E.sP50?.cost||0)}</td><td>${Math.round((E.sP50?.conv||0)*100)}%</td></tr>
      <tr><td>${isRu?'Худший (P90)':'Worst case (P90)'}</td><td>${fmt(E.sP90?.cost||0)}</td><td>${Math.round((E.sP90?.conv||0)*100)}%</td></tr>
    </table>` : '';

  // Texts section
  let textsHTML = '';
  if (draft.texts) {
    const channels = ['push','email','sms','telegram','popup'];
    textsHTML = `<h3>${isRu?'Тексты CRM':'CRM Texts'}</h3>`;
    channels.forEach(ch => {
      const variants = draft.texts[ch] || [];
      if (!variants.length) return;
      textsHTML += `<h4 style="margin:10px 0 4px;text-transform:uppercase;font-size:11px;color:#666">${ch}</h4>`;
      variants.forEach((v, i) => {
        const body = typeof v === 'object' ? (v.subject ? `<b>${v.subject}</b><br>${v.body}` : `${v.headline}<br>${v.subtext}<br>${v.cta}`) : v;
        textsHTML += `<div style="margin-bottom:8px;padding:6px;border:1px solid #ddd;border-radius:4px;font-size:11px"><b>V${i+1}</b><br>${body}</div>`;
      });
    });
  }

  // Audit section
  let auditHTML = '';
  if (draft.audit) {
    auditHTML = `<h3>${isRu?'Compliance Аудит':'Compliance Audit'}</h3>`;
    (draft.audit.checks || []).forEach(ch => {
      const ico = ch.status === 'ok' ? '✅' : '⚠️';
      auditHTML += `<div style="margin-bottom:6px;font-size:11px">${ico} <b>${ch.label}</b>${ch.rule?`<br><span style="color:#666;font-size:10px">${ch.rule}</span>`:''}<br>${ch.note}</div>`;
    });
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${scen} — ${geo}</title>
    <style>body{font-family:Arial,sans-serif;margin:28px;color:#111;font-size:13px}
    h1{font-size:18px;margin-bottom:4px}h2{font-size:15px;color:#333;margin-top:20px}
    h3{font-size:13px;color:#555;margin:16px 0 6px}table{font-size:11px}
    .footer{margin-top:30px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#888}</style>
    </head><body>
    <h1>${scen}</h1><div style="color:#666;font-size:12px">${geo} · ${ts}</div>
    ${econHTML}${textsHTML}${auditHTML}
    <div class="footer">Generated by Retomat · ${ts} · retomat.io</div>
    </body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) { alert(isRu?'Разрешите всплывающие окна для экспорта PDF':'Allow popups to export PDF'); URL.revokeObjectURL(url); return; }
  setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 400);
}

// ── GLOSSARY ──────────────────────────────────────────────────────────────────
const GLOSSARY_TERMS = [
  ['gl_wager',      {ru:'Вейджер — количество оборотов бонуса до вывода средств.',                         en:'Wager — times bonus must be turned over before withdrawal.'}],
  ['gl_rtp',        {ru:'RTP — доля ставок, возвращаемых игрокам в виде выигрышей.',                      en:'RTP — % of total bets returned as winnings.'}],
  ['gl_wcr',        {ru:'WCR — взвешенный RTP по реальной структуре ставок (учёт вклада каждого типа игр).', en:'WCR — weighted RTP across actual bet mix (accounts for game-type contribution).'}],
  ['gl_p50',        {ru:'P50 — базовый сценарий (медиана). Используйте для планирования бюджета.',          en:'P50 — base scenario (median expected outcome). Use for budget planning.'}],
  ['gl_p10',        {ru:'P10 — оптимистичный: только 10% исходов лучше. Мало игроков выполнят вейджер.',   en:'P10 — optimistic: only 10% of outcomes are better. Few players complete wagering.'}],
  ['gl_p90',        {ru:'P90 — пессимистичный: только 10% исходов хуже. Максимальный риск выплат.',        en:'P90 — pessimistic: only 10% of outcomes are worse. Maximum payout risk.'}],
  ['gl_lift',       {ru:'Retention lift — прирост доли активных игроков вследствие бонусной программы.',   en:'Retention lift — % increase in active player count from the bonus program.'}],
  ['gl_cost_ratio', {ru:'Cost ratio — выплаты по бонусам ÷ общий депозитный оборот (безразмерная).',       en:'Cost ratio — bonus payouts ÷ total deposit volume (dimensionless).'}],
  ['gl_breakeven',  {ru:'Breakeven wager — вейджер, при котором ожидаемые выплаты = размер бонуса.',       en:'Breakeven wager — wager at which expected payout equals bonus size.'}],
  ['gl_arpu',       {ru:'ARPU — средняя выручка с игрока в месяц (USD бенчмарк, без зависимости от валюты).', en:'ARPU — Average Revenue Per User per month (USD benchmark, currency-independent).'}],
  ['gl_cac',        {ru:'CAC — стоимость привлечения одного нового игрока (USD бенчмарк).',                en:'CAC — Customer Acquisition Cost per new player (USD benchmark).'}],
];

function toggleGlossary() {
  let panel = document.getElementById('glossary-panel');
  if (panel) { panel.remove(); return; }

  const isRu = currentLang === 'ru';
  const terms = GLOSSARY_TERMS.map(([, t]) =>
    `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">
      <div style="font-size:.8rem;font-weight:600;color:var(--text);margin-bottom:2px">${t[isRu?'ru':'en'].split(' — ')[0]}</div>
      <div style="font-size:.75rem;color:var(--muted)">${t[isRu?'ru':'en'].split(' — ').slice(1).join(' — ')}</div>
    </div>`
  ).join('');

  panel = document.createElement('div');
  panel.id = 'glossary-panel';
  panel.style.cssText = 'position:fixed;top:54px;right:0;width:320px;max-height:calc(100vh - 54px);background:#161c2d;border-left:1px solid var(--border);z-index:400;display:flex;flex-direction:column;box-shadow:-4px 0 24px rgba(0,0,0,.4);overflow:hidden';
  panel.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
      <span style="font-size:.9rem;font-weight:700;color:var(--text)">${isRu?'Глоссарий':'Glossary'}</span>
      <button onclick="document.getElementById('glossary-panel').remove()"
        style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;line-height:1;padding:0">&times;</button>
    </div>
    <div style="flex:1;overflow-y:auto;padding:4px 16px 16px">${terms}</div>`;
  document.body.appendChild(panel);

  // Close when clicking outside
  setTimeout(() => {
    const close = (e) => {
      const p = document.getElementById('glossary-panel');
      if (p && !p.contains(e.target)) { p.remove(); document.removeEventListener('click', close); }
    };
    document.addEventListener('click', close);
  }, 50);
}

// ── TYPE SWITCH (Generator hub) ─────────────────────────────────────────────
let GEN_TYPE = 'bonus';
let tgInitialized = false;
let lyInitialized = false;

function genSyncTbRight() {
  if (GEN_TYPE === 'tournament') {
    document.getElementById('tb-right').innerHTML =
      `<button class="btn btn-primary btn-sm" onclick="tgShowView('generator')">${currentLang === 'ru' ? '+ Новый турнир' : '+ New Tournament'}</button>`;
  } else if (GEN_TYPE === 'loyalty') {
    document.getElementById('tb-right').innerHTML =
      `<button class="btn btn-primary btn-sm" onclick="lyShowView('setup')">${currentLang === 'ru' ? '+ Новая программа' : '+ New Program'}</button>`;
  }
}

function genSwitchType(tp) {
  GEN_TYPE = tp;
  document.querySelectorAll('#gen-type-switch .type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === tp));
  document.getElementById('bonus-root').style.display = tp === 'bonus' ? '' : 'none';
  document.getElementById('tg-root').style.display    = tp === 'tournament' ? '' : 'none';
  document.getElementById('ly-root').style.display    = tp === 'loyalty' ? '' : 'none';

  if (tp === 'bonus') {
    showView('offer-gen');
  } else if (tp === 'tournament') {
    genSyncTbRight();
    if (!tgInitialized) { tgInitialized = true; tgInit(); }
    else { tgShowView(_tgCurrentView, tgDetailId); }
  } else if (tp === 'loyalty') {
    genSyncTbRight();
    if (!lyInitialized) { lyInitialized = true; lyInit(); }
    else { lyShowView(_view, lyDetailId); }
  }
}

function genSetLang(lang) {
  setUILang(lang);
  if (GEN_TYPE === 'tournament' && typeof tgSetTournLang === 'function') tgSetTournLang(lang);
  if (GEN_TYPE === 'loyalty' && typeof lySetLang === 'function') lySetLang(lang);
  genSyncTbRight();
}

function genToggleGlossary() {
  if (GEN_TYPE === 'tournament' && typeof tgToggleTournGlossary === 'function') { tgToggleTournGlossary(); return; }
  if (GEN_TYPE === 'loyalty' && typeof lyToggleLoyaltyGlossary === 'function') { lyToggleLoyaltyGlossary(); return; }
  toggleGlossary();
}

// ── INIT ──────────────────────────────────────────────────────────────────────
function syncInitialView() {
  const name = window.location.hash === '#campaigns' ? 'campaigns' : 'offer-gen';
  showView(name);
}

// Apply language before showing UI to avoid flash of wrong language
setUILang(currentLang);
updateAllBadges();
const _hashView = window.location.hash === '#campaigns' ? 'campaigns' : null;
showView(getViewParam() || _hashView || 'offer-gen');
renderScenarios();
renderCampaignViews();
document.querySelector('.main').classList.add('ready');

// nav-utils hydrates the localStorage caches from the server then fires this.
window.addEventListener('retomat:synced', function() {
  updateAllBadges();
  renderCampaignViews();
});
// Old page-specific onboarding replaced by the global Retomat welcome popup
// (showRetomatWelcome in nav-utils.js, gated by 'retomat_welcome_done').
// if (!localStorage.getItem('cg_onboarding_done')) showOnboarding();

window.addEventListener('pageshow', function() {
  renderCampaignViews();
  if (window.location.hash === '#campaigns') showView('campaigns');
});

window.addEventListener('hashchange', function() {
  syncInitialView();
});
