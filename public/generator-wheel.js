// Wheel of Fortune tab for the unified Generator hub (generator.html).
// Fork of the tournament/loyalty generator pattern — globals prefixed `wh*`.
// Renders into #wh-content; lazily initialized by genSwitchType() in generator.js.
// Backend: /api/wheel/{generate,texts,audit}. Econ mirror: window._wheelEcon.

const WH_GEO_OPTIONS = [
  { val:'de', lbl:'🇩🇪 Germany (EUR)' }, { val:'fr', lbl:'🇫🇷 France (EUR)' },
  { val:'es', lbl:'🇪🇸 Spain (EUR)' },   { val:'it', lbl:'🇮🇹 Italy (EUR)' },
  { val:'nl', lbl:'🇳🇱 Netherlands (EUR)' }, { val:'dk', lbl:'🇩🇰 Denmark (DKK)' },
  { val:'uk', lbl:'🇬🇧 UK (GBP)' },      { val:'ru', lbl:'🇷🇺 Russia (RUB)' },
  { val:'kz', lbl:'🇰🇿 Kazakhstan (KZT)' }, { val:'mn', lbl:'🇲🇳 Mongolia (MNT)' },
  { val:'us', lbl:'🇺🇸 USA Sweeps (USD)' }, { val:'br', lbl:'🇧🇷 Brazil (USD)' },
  { val:'mx', lbl:'🇲🇽 Mexico (USD)' },  { val:'co', lbl:'🇨🇴 Colombia (USD)' },
  { val:'ar', lbl:'🇦🇷 Argentina (USD)' }, { val:'pe', lbl:'🇵🇪 Peru (USD)' },
  { val:'cl', lbl:'🇨🇱 Chile (USD)' },
];

const WH_GEO_REGION = {
  de:'eu', fr:'eu', es:'eu', it:'eu', nl:'eu', dk:'eu', uk:'eu',
  ru:'cis', kz:'cis', mn:'mn', us:'sweep',
  br:'latam', mx:'latam', co:'latam', ar:'latam', pe:'latam', cl:'latam',
};
const WH_GEO_CUR = {
  de:'EUR', fr:'EUR', es:'EUR', it:'EUR', nl:'EUR', dk:'DKK', uk:'GBP',
  ru:'RUB', kz:'KZT', mn:'MNT', us:'USD', br:'USD', mx:'USD', co:'USD', ar:'USD', pe:'USD', cl:'USD',
};
const WH_GEO_AVGDEP = { de:50, fr:45, es:40, it:45, nl:55, dk:95, uk:80, ru:5000, kz:20000, mn:100000, us:60, br:120, mx:250, co:200000, ar:20000, pe:180, cl:45000 };

const WH_REGION_LABEL = {
  eu:    { en:'Europe (EU/UK)', ru:'Европа (EU/UK)' },
  cis:   { en:'CIS',            ru:'СНГ' },
  mn:    { en:'Mongolia',       ru:'Монголия' },
  sweep: { en:'USA Sweepstakes',ru:'США Sweepstakes' },
  latam: { en:'LatAm',          ru:'Латам' },
};

// Region-grouped <optgroup> options (same grouping as the other sections),
// bucketed by WH_GEO_REGION in first-appearance order.
function whGeoOptionsHTML(selected) {
  const L = whLang() === 'ru' ? 'ru' : 'en';
  const order = [];
  const byRegion = {};
  for (const g of WH_GEO_OPTIONS) {
    const r = WH_GEO_REGION[g.val] || 'other';
    if (!byRegion[r]) { byRegion[r] = []; order.push(r); }
    byRegion[r].push(g);
  }
  return order.map(r => {
    const label = (WH_REGION_LABEL[r] || { en:r, ru:r })[L];
    const opts = byRegion[r].map(g => `<option value="${g.val}"${g.val===selected?' selected':''}>${g.lbl}</option>`).join('');
    return `<optgroup label="${label}">${opts}</optgroup>`;
  }).join('');
}

const WH_SEG_COLORS = {
  free_spins:'#60A5FA', bonus_money:'#10B981', cashback:'#F59E0B',
  multiplier:'#A78BFA', jackpot:'#EF4444', physical:'#EC4899', nothing:'#64748B',
};

// ── i18n ────────────────────────────────────────────────────────────────────
const WH = {
  en: {
    topbar_list:'Library', topbar_setup:'New Wheel', topbar_result:'Result',
    list_title:'Wheel of Fortune', list_saved:n=>`${n} saved wheel${n===1?'':'s'}`,
    list_empty:'No wheels yet — generate one tuned to a region.',
    list_empty_sub:'Pick a market and audience — we suggest the best wheel layout for it.',
    list_create:'⚡ Generate a wheel', list_new:'⚡ New wheel',
    hdr_name:'Name', hdr_preset:'Preset', hdr_roi:'ROI', hdr_date:'Date',
    s1_badge:'Step 1 / 2', s1_title:'Wheel setup', s1_sub:'Choose a market and audience — we recommend a wheel tuned to it',
    market:'Market / GEO', segment:'Audience', preset:'Wheel type', freq:'Spin cadence', players:'Total players',
    rec_title:'Recommended for this region', regen:'↺ Regenerate',
    seg_all:'All', seg_depositors:'Depositors', seg_new:'New', seg_vip:'VIP', seg_dormant:'Dormant',
    preset_welcome:'Welcome', preset_daily:'Daily', preset_vip:'VIP',
    freq_on_deposit:'On deposit', freq_daily:'Daily', freq_weekly:'Weekly', freq_one_time:'One-time',
    prize_free_spins:'Free Spins', prize_bonus_money:'Bonus Money', prize_cashback:'Cashback',
    prize_multiplier:'Multiplier', prize_jackpot:'Jackpot', prize_physical:'Prize', prize_nothing:'No Win',
    generate:'⚡ Generate wheel', back:'← Back', gen_wait:'Generating wheel…', gen_sub:'Building segments and economics for the region',
    ev:'EV / spin', prog_cost:'Program cost', ggr:'GGR uplift', ret:'Retention value', net:'Net result', roi:'ROI',
    per_mo:'/mo', per_spin:'per spin', prob:'Chance', segments:'Segments',
    crm:'🤖 Generate CRM texts', crm_re:'↺ Regenerate texts', crm_title:'CRM copy',
    desc:'📄 Generate description', desc_re:'↺ Regenerate description',
    desc_note:'Wheel terms are computed from the configuration — exact, not AI-written. AI writes the description copy only.',
    desc_hint:'For the wheel / promo page', desc_how:'How it works', desc_tc:'Terms & Conditions', desc_copy:'› Copy',
    audit:'🔍 Compliance audit', audit_re:'↺ Re-run audit', audit_title:'Compliance review',
    save:'💾 Save', add_cal:'📅 Add to Calendar', saved_ok:'Saved ✓', cal_ok:'Added to Calendar ✓',
    recommendations:'Recommendations', writing:'AI is writing wheel copy…', auditing:'AI compliance officer is reviewing…',
    optimize:'🎯 Optimize economics', optimize_re:'↺ Re-run optimization', optimize_title:'Economics optimization', optimizing:'AI is analyzing the economics…',
    apply_recs:'⚡ Apply recommendations', balance:'⚖️ Balance to Profit', undo:'↩ Undo', target_roi:'Target ROI', apply_hint:'Run optimization first',
    bal_already:(roi,t)=>`Already profitable: ROI ${roi}% ≥ target ${t}%`,
    bal_ok:(roi)=>`Balanced ✓ ROI ${roi}%`,
    bal_fail:'Target not reached — best config applied',
    applied_ok:'Recommendations applied ✓', mods_loading:'Modules still loading, try again',
  },
  ru: {
    topbar_list:'Библиотека', topbar_setup:'Новое колесо', topbar_result:'Результат',
    list_title:'Колесо Фортуны', list_saved:n=>`${n} сохранённых колёс`,
    list_empty:'Пока нет колёс — сгенерируйте под регион.',
    list_empty_sub:'Выберите рынок и аудиторию — предложим оптимальную раскладку колеса.',
    list_create:'⚡ Сгенерировать колесо', list_new:'⚡ Новое колесо',
    hdr_name:'Название', hdr_preset:'Пресет', hdr_roi:'ROI', hdr_date:'Дата',
    s1_badge:'Шаг 1 / 2', s1_title:'Настройка колеса', s1_sub:'Выберите рынок и аудиторию — рекомендуем колесо под них',
    market:'Рынок / GEO', segment:'Аудитория', preset:'Тип колеса', freq:'Частота спинов', players:'Всего игроков',
    rec_title:'Рекомендация под регион', regen:'↺ Пересобрать',
    seg_all:'Все', seg_depositors:'Депозиторы', seg_new:'Новые', seg_vip:'VIP', seg_dormant:'Спящие',
    preset_welcome:'Welcome', preset_daily:'Ежедневное', preset_vip:'VIP',
    freq_on_deposit:'За депозит', freq_daily:'Ежедневно', freq_weekly:'Еженедельно', freq_one_time:'Разово',
    prize_free_spins:'Фриспины', prize_bonus_money:'Бонус деньги', prize_cashback:'Кэшбек',
    prize_multiplier:'Множитель', prize_jackpot:'Джекпот', prize_physical:'Приз', prize_nothing:'Пусто',
    generate:'⚡ Сгенерировать колесо', back:'← Назад', gen_wait:'Генерируем колесо…', gen_sub:'Собираем сегменты и экономику под регион',
    ev:'EV / спин', prog_cost:'Стоимость программы', ggr:'Прирост GGR', ret:'Ретеншн-ценность', net:'Чистый результат', roi:'ROI',
    per_mo:'/мес', per_spin:'за спин', prob:'Шанс', segments:'Сегменты',
    crm:'🤖 Сгенерировать CRM-тексты', crm_re:'↺ Обновить тексты', crm_title:'CRM-тексты',
    desc:'📄 Сгенерировать описание', desc_re:'↺ Пересоздать описание',
    desc_note:'Условия колеса рассчитаны из конфигурации — точные, без AI. AI пишет только текст описания.',
    desc_hint:'Для страницы колеса / промо-страницы', desc_how:'Как это работает', desc_tc:'Правила и условия (T&C)', desc_copy:'› Копировать',
    audit:'🔍 Комплаенс-аудит', audit_re:'↺ Повторить аудит', audit_title:'Комплаенс-ревью',
    save:'💾 Сохранить', add_cal:'📅 В календарь', saved_ok:'Сохранено ✓', cal_ok:'Добавлено в календарь ✓',
    recommendations:'Рекомендации', writing:'AI пишет тексты для колеса…', auditing:'AI-комплаенс проверяет…',
    optimize:'🎯 Оптимизация экономики', optimize_re:'↺ Обновить оптимизацию', optimize_title:'Оптимизация экономики', optimizing:'AI анализирует экономику…',
    apply_recs:'⚡ Применить рекомендации', balance:'⚖️ Сбалансировать под прибыль', undo:'↩ Отменить', target_roi:'Целевой ROI', apply_hint:'Сначала запустите оптимизацию',
    bal_already:(roi,t)=>`Уже прибыльно: ROI ${roi}% ≥ цели ${t}%`,
    bal_ok:(roi)=>`Сбалансировано ✓ ROI ${roi}%`,
    bal_fail:'Цель не достигнута — применён лучший конфиг',
    applied_ok:'Рекомендации применены ✓', mods_loading:'Модули ещё загружаются, попробуйте снова',
  },
};
function whLang() { return localStorage.getItem('bonusLang') || 'en'; }
function wh(key, ...args) {
  const v = (WH[whLang()] || WH.en)[key];
  return typeof v === 'function' ? v(...args) : (v ?? key);
}

// ── State ───────────────────────────────────────────────────────────────────
let _whView   = 'list';
let whDetailId = null;
let whStep    = 0;
let whDraft   = null;
let whLastResult = null;
let whLastTexts  = null;
let whLastDesc   = null;
let whLastAudit  = null;
let whActiveTab  = 'push';
let whLastOpt     = null;   // full /api/wheel/optimize response
let whLastOptRecs = [];     // recommendations array
let whUndoStack   = null;   // snapshot before last apply/balance
let whPrevEcon    = null;   // econ before last apply (for delta badges)

// "Под регион": recommend a preset + cadence for a geo/segment, with a rationale.
function whRegionRecommend(geo, segment) {
  const isRu = whLang() === 'ru';
  if (segment === 'vip')
    return { preset:'vip', frequency:'weekly', note: isRu ? 'VIP-аудитория: щедрое колесо раз в неделю усиливает удержание.' : 'VIP audience: a generous weekly wheel strengthens retention.' };
  if (segment === 'dormant')
    return { preset:'daily', frequency:'daily', note: isRu ? 'Реактивация: ежедневное колесо возвращает спящих игроков.' : 'Reactivation: a daily wheel brings dormant players back.' };
  if (geo === 'br')
    return { preset:'daily', frequency:'daily', note: isRu ? '🇧🇷 Бразилия: приветственные бонусы запрещены (Закон 14.790) — используем ежедневное колесо, не welcome.' : '🇧🇷 Brazil: welcome bonuses are prohibited (Law 14.790) — use a daily wheel, not a welcome one.' };
  return { preset:'welcome', frequency:'on_deposit', note: isRu ? 'Привлечение: welcome-колесо за первый депозит максимизирует конверсию.' : 'Acquisition: a first-deposit welcome wheel maximizes conversion.' };
}

// ── Topbar / lifecycle ──────────────────────────────────────────────────────
function whSetTopbar(sub) {
  if (typeof GEN_TYPE !== 'undefined' && GEN_TYPE !== 'wheel') return;
  const t = document.getElementById('tb-title'), s = document.getElementById('tb-sub'), sep = document.getElementById('tb-sep');
  if (t) t.textContent = whLang() === 'ru' ? 'Генератор колеса' : 'Wheel Generator';
  if (s) s.textContent = sub || '';
  if (sep) sep.style.display = sub ? '' : 'none';
}

function whInit() {
  updateAllBadges();
  whSetLang(whLang());
  window.addEventListener('retomat:synced', function() {
    if (typeof GEN_TYPE !== 'undefined' && GEN_TYPE === 'wheel') { updateAllBadges(); if (_whView === 'list') whShowView('list'); }
  });
}

function whSetLang(lang) {
  try { localStorage.setItem('bonusLang', lang); } catch(e) {}
  document.querySelectorAll('.lt-btn').forEach(b => b.classList.toggle('active', b.id === 'lt-' + lang));
  if (typeof applyNavLang === 'function') applyNavLang(lang);
  whShowView(_whView, whDetailId);
}

function whShowView(view, id) {
  const c = document.getElementById('wh-content');
  if (!c) return;
  // Scroll to top only on an actual view transition — re-rendering the same view
  // in place (e.g. after Optimize / Apply / Balance) must keep the scroll position.
  const viewChanged = _whView !== view;
  _whView = view;
  if (view === 'list') {
    whSetTopbar(wh('topbar_list'));
    c.innerHTML = renderWhList();
  } else if (view === 'setup') {
    whSetTopbar(wh('topbar_setup'));
    c.innerHTML = renderWhSetup();
  } else if (view === 'result') {
    whSetTopbar(wh('topbar_result'));
    c.innerHTML = renderWhResult();
  }
  if (typeof updateAllBadges === 'function') updateAllBadges();
  if (viewChanged) window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Storage ─────────────────────────────────────────────────────────────────
function whLoad()  { try { return JSON.parse(localStorage.getItem('savedWheels') || '[]'); } catch { return []; } }
function whStore(l){ localStorage.setItem('savedWheels', JSON.stringify(l)); }
function whGenId() { return 'wh_' + Math.random().toString(36).slice(2, 10); }

// ── List view ───────────────────────────────────────────────────────────────
function renderWhList() {
  const list = whLoad();
  if (!list.length) {
    return `
<div class="step-header">
  <div class="step-badge">🎡 ${wh('list_title')}</div>
  <div class="step-title">${wh('list_title')}</div>
  <div class="step-sub">${wh('list_empty')}</div>
</div>
<div class="card" style="text-align:center;padding:40px 20px">
  <div style="font-size:2.5rem;margin-bottom:14px">🎡</div>
  <div style="color:var(--muted);font-size:.88rem;margin-bottom:20px">${wh('list_empty_sub')}</div>
  <button class="btn btn-primary" onclick="whStartWizard()">${wh('list_create')}</button>
</div>`;
  }
  return `
<div style="margin-bottom:16px">
  <div style="font-size:1.1rem;font-weight:700;color:var(--text)">${wh('list_title')}</div>
  <div style="font-size:.8rem;color:var(--muted);margin-top:2px">${wh('list_saved', list.length)}</div>
</div>
<div class="ctable">
  <div class="ct-hd"><span>${wh('hdr_name')}</span><span>${wh('hdr_preset')}</span><span>${wh('hdr_roi')}</span><span>${wh('hdr_date')}</span><span></span></div>
  ${list.map(whRowHTML).join('')}
</div>
<div style="margin-top:16px;text-align:center"><button class="btn btn-primary" onclick="whStartWizard()">${wh('list_new')}</button></div>`;
}

function whRowHTML(w) {
  const roi = w.result?.econ?.roi ?? 0;
  const date = new Date(w.createdAt || Date.now()).toLocaleDateString();
  return `<div class="ct-row">
    <span style="font-weight:600">${w.name || 'Wheel'}</span>
    <span>${wh('preset_' + (w.params?.preset || 'welcome'))}</span>
    <span style="color:${roi >= 100 ? '#10b981' : '#ef4444'}">${Math.round(roi)}%</span>
    <span style="color:var(--muted)">${date}</span>
    <span><button class="btn btn-ghost btn-sm" onclick="whDelete('${w.id}')">✕</button></span>
  </div>`;
}
function whDelete(id) { whStore(whLoad().filter(w => w.id !== id)); if (typeof updateAllBadges === 'function') updateAllBadges(); whShowView('list'); }

// ── Setup wizard ────────────────────────────────────────────────────────────
function whStartWizard() {
  const geo = 'de', segment = 'new';
  const rec = whRegionRecommend(geo, segment);
  whDraft = { geo, segment, players: 5000, preset: rec.preset, frequency: rec.frequency };
  whStep = 1;
  whShowView('setup');
}

function whChip(group, val, cur, label) {
  return `<div class="chip${cur===val?' on':''}" onclick="whSetField('${group}','${val}')">${label}</div>`;
}

function renderWhSetup() {
  const d = whDraft;
  const rec = whRegionRecommend(d.geo, d.segment);
  const segs = [['all','seg_all'],['depositors','seg_depositors'],['new','seg_new'],['vip','seg_vip'],['dormant','seg_dormant']];
  const presets = [['welcome','preset_welcome'],['daily','preset_daily'],['vip','preset_vip']];
  const freqs = [['on_deposit','freq_on_deposit'],['daily','freq_daily'],['weekly','freq_weekly'],['one_time','freq_one_time']];
  return `
<div class="step-header">
  <div class="step-badge">🎡 ${wh('s1_badge')}</div>
  <div class="step-title">${wh('s1_title')}</div>
  <div class="step-sub">${wh('s1_sub')}</div>
</div>
<div class="card">
  <div class="form-row">
    <label class="form-label">${wh('market')}</label>
    <select class="form-input" onchange="whSetField('geo',this.value)">
      ${whGeoOptionsHTML(d.geo)}
    </select>
  </div>
  <div class="form-row">
    <label class="form-label">${wh('segment')}</label>
    <div class="chips">${segs.map(([v,k])=>whChip('segment',v,d.segment,wh(k))).join('')}</div>
  </div>
  <div class="card" style="background:rgba(79,110,247,.08);border-color:rgba(79,110,247,.3);margin:4px 0 16px">
    <div style="font-size:.72rem;font-weight:700;color:#a0b0ff;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">✨ ${wh('rec_title')}</div>
    <div style="font-size:.84rem;color:var(--text);line-height:1.5">${rec.note}</div>
  </div>
  <div class="form-row">
    <label class="form-label">${wh('preset')}</label>
    <div class="chips">${presets.map(([v,k])=>whChip('preset',v,d.preset,wh(k))).join('')}</div>
  </div>
  <div class="form-row">
    <label class="form-label">${wh('freq')}</label>
    <div class="chips" style="flex-wrap:wrap">${freqs.map(([v,k])=>whChip('frequency',v,d.frequency,wh(k))).join('')}</div>
  </div>
  <div class="form-row">
    <label class="form-label">${wh('players')}</label>
    <input class="form-input" type="number" min="100" step="100" value="${d.players}" onchange="whDraft.players=+this.value||5000">
  </div>
</div>
<div style="display:flex;justify-content:space-between;gap:10px">
  <button class="btn btn-outline" onclick="whShowView('list')">${wh('back')}</button>
  <button class="btn btn-primary" onclick="whGenerate()">${wh('generate')}</button>
</div>`;
}

// Changing geo/segment re-applies the region recommendation (auto-tune preset+cadence).
function whSetField(field, val) {
  whDraft[field] = val;
  if (field === 'geo' || field === 'segment') {
    const rec = whRegionRecommend(whDraft.geo, whDraft.segment);
    whDraft.preset = rec.preset;
    whDraft.frequency = rec.frequency;
  }
  whShowView('setup');
}

// ── Generation ──────────────────────────────────────────────────────────────
async function whGenerate() {
  const c = document.getElementById('wh-content');
  const d = whDraft;
  c.innerHTML = `<div class="prog-wrap"><div class="prog-title">${wh('gen_wait')}</div><div class="prog-sub">${wh('gen_sub')}</div><div class="loader" style="margin-top:20px"><div class="spinner"></div></div></div>`;
  try {
    const resp = await fetch('/api/wheel/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ params: {
        geo: d.geo, segment: d.segment, preset: d.preset, frequency: d.frequency,
        players: d.players, avgDeposit: WH_GEO_AVGDEP[d.geo], lang: whLang(), tone:'professional',
      }}),
    });
    if (!resp.ok) { const e = await resp.json().catch(()=>({})); throw new Error(e.message || resp.statusText); }
    whLastResult = await resp.json();
    whLastTexts = null; whLastDesc = null; whLastAudit = null; whActiveTab = 'push';
    whLastOpt = null; whLastOptRecs = []; whUndoStack = null; whPrevEcon = null;
    whShowView('result');
  } catch(e) {
    c.innerHTML = `<div class="alert alert-warn" style="max-width:480px;margin:40px auto">Error: ${e.message}
      <button class="btn btn-outline btn-sm" style="margin-top:10px;display:block" onclick="whShowView('setup')">${wh('back')}</button></div>`;
  }
}

// ── SVG wheel ───────────────────────────────────────────────────────────────
function whSVG(segments) {
  const total = segments.reduce((s,g)=>s+Math.max(0,g.weight),0) || 1;
  const cx=120, cy=120, r=110;
  let ang = -Math.PI/2;
  const parts = segments.map(seg => {
    const frac = Math.max(0,seg.weight)/total;
    const a2 = ang + frac*2*Math.PI;
    const x1=cx+r*Math.cos(ang), y1=cy+r*Math.sin(ang), x2=cx+r*Math.cos(a2), y2=cy+r*Math.sin(a2);
    const large = frac>0.5?1:0, mid=(ang+a2)/2;
    const lx=cx+r*0.62*Math.cos(mid), ly=cy+r*0.62*Math.sin(mid);
    const color = WH_SEG_COLORS[seg.prizeType] || '#64748B';
    const pct = Math.round(frac*100);
    const path = `<path d="M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${color}" stroke="#0b1020" stroke-width="1.5" opacity="0.9"/>`;
    const label = pct>=6 ? `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="#fff" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="middle">${pct}%</text>` : '';
    ang = a2;
    return path + label;
  }).join('');
  return `<svg viewBox="0 0 240 240" width="220" height="220" style="max-width:100%;display:block;margin:0 auto">${parts}
    <circle cx="${cx}" cy="${cy}" r="26" fill="#0b1020" stroke="#a0b0ff" stroke-width="2"/>
    <text x="${cx}" y="${cy}" font-size="22" text-anchor="middle" dominant-baseline="middle">🎡</text>
    <polygon points="${cx-9},4 ${cx+9},4 ${cx},26" fill="#a0b0ff"/></svg>`;
}

function whFmt(n, cur) { return (cur ? cur + ' ' : '') + Math.round(+n||0).toLocaleString('en-US'); }

// ── COMPETITOR ANALYSIS (wheel twin) — via window.CompetitorAnalysis.wire ───────
function whCompOwnParams() {
  const ru = localStorage.getItem('bonusLang') === 'ru';
  const d = whDraft || {};
  const segs = (whLastResult && whLastResult.spec && whLastResult.spec.segments) || [];
  const total = segs.reduce((a, s) => a + Math.max(0, s.weight), 0) || 1;
  const nothing = segs.filter((s) => s.prizeType === 'nothing').reduce((a, s) => a + Math.max(0, s.weight), 0);
  const occ  = { welcome: 'Welcome', daily: ru ? 'Ежедневное' : 'Daily', vip: 'VIP' };
  const spin = { on_deposit: ru ? 'По депозиту' : 'On deposit', on_login: ru ? 'По входу' : 'On login', daily: ru ? 'Ежедневно' : 'Daily', weekly: ru ? 'Еженедельно' : 'Weekly' };
  return {
    occasion:   occ[d.preset] || d.preset || '',
    segments:   segs.length ? String(segs.length) : '',
    topPrize:   '',   // prize types are heterogeneous (cash / FS / multiplier / %) — no single comparable "top prize"
    spinCost:   spin[d.frequency] || d.frequency || '',
    emptySlots: segs.length ? Math.round(nothing / total * 100) + '%' : '',
    winWager:   '',   // the wheel-winnings wager isn't carried in the generated spec
  };
}
let _whCompW = null;
function _whCompInst() {
  if (!_whCompW && window.CompetitorAnalysis) {
    _whCompW = window.CompetitorAnalysis.wire({
      promoType: 'wheel', fnPrefix: 'whComp', areaId: 'wh-comp-area', nameInputId: 'wh-comp-name',
      lang: () => (localStorage.getItem('bonusLang') === 'ru' ? 'ru' : 'en'),
      region: () => ((whDraft && whDraft.geo) || 'de'),
      ownLabel: () => (localStorage.getItem('bonusLang') === 'ru' ? 'Колесо фортуны' : 'Wheel of Fortune'),
      ownParams: whCompOwnParams,
      onToast: (typeof whToast === 'function' ? whToast : undefined),
    });
  }
  return _whCompW;
}
function _whCompHtml() { const i = _whCompInst(); return i ? i.html() : ''; }
window.whCompSearchAI  = () => { const i = _whCompInst(); return i ? i.searchAI() : undefined; };
window.whCompAddManual = () => { const i = _whCompInst(); return i ? i.addManual() : undefined; };
window.whCompSetParam  = (idx, k, v) => { const i = _whCompInst(); return i ? i.setParam(idx, k, v) : undefined; };
window.whCompRemove    = (idx) => { const i = _whCompInst(); return i ? i.remove(idx) : undefined; };
window.whCompRun       = () => { const i = _whCompInst(); return i ? i.run() : undefined; };
window.whCompSave      = () => { const i = _whCompInst(); return i ? i.save() : undefined; };

// ── Result view ─────────────────────────────────────────────────────────────
function renderWhResult() {
  const d = whLastResult;
  if (!d) return renderWhList();
  const econ = d.econ || {};
  const cur = d.cur || WH_GEO_CUR[whDraft.geo] || 'EUR';
  const segs = d.spec?.segments || [];
  const net = econ.netResultMid || 0;

  const p = whPrevEcon;
  const card = (label, val, sub, cls, delta) => `<div class="econ-card"><div class="ec-label">${label}${delta||''}</div><div class="ec-val ${cls||''}">${val}</div><div class="ec-sub">${sub||''}</div></div>`;

  const legend = segs.map(s => {
    const color = WH_SEG_COLORS[s.prizeType] || '#64748B';
    const v = s.prizeType==='cashback' ? Math.round(s.prizeValue*100)+'%'
      : s.prizeType==='free_spins' ? s.prizeValue+' FS'
      : s.prizeType==='multiplier' ? s.prizeValue+'×'
      : s.prizeType==='nothing' ? '—'
      : whFmt(s.prizeValue, cur);
    const pct = Math.round(Math.max(0,s.weight)/(segs.reduce((a,x)=>a+Math.max(0,x.weight),0)||1)*100);
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px">
      <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:7px;vertical-align:middle"></span>${wh('prize_'+s.prizeType)}</span>
      <span style="color:var(--muted)">${v} · ${pct}%</span></div>`;
  }).join('');

  return `
<div class="step-header" style="display:flex;justify-content:space-between;align-items:flex-start">
  <div>
    <div class="step-badge">🎡 ${wh('preset_'+(whDraft.preset))} · ${whDraft.geo.toUpperCase()}</div>
    <div class="step-title">${wh('list_title')}</div>
  </div>
  <div style="display:flex;gap:8px">
    <button class="btn btn-outline btn-sm" onclick="whShowView('setup')">${wh('regen')}</button>
    <button class="btn btn-outline btn-sm" onclick="whSave()">${wh('save')}</button>
    <button class="btn btn-primary btn-sm" onclick="whAddToCalendar()">${wh('add_cal')}</button>
  </div>
</div>

<div class="card-grid" style="grid-template-columns:220px 1fr;gap:16px;margin-bottom:16px">
  <div class="card">${whSVG(segs)}</div>
  <div class="card">
    <div class="card-title">${wh('segments')}</div>
    ${legend}
  </div>
</div>

${whActionPanelHTML(econ)}

<div class="econ-grid" style="margin-bottom:16px">
  ${card(wh('ev'), whFmt(econ.evPerSpin, cur), wh('per_spin'), '', _whDelta(econ.evPerSpin, p&&p.evPerSpin, true, '', 2))}
  ${card(wh('prog_cost'), whFmt(econ.programCostMid, cur), wh('per_mo'), '', _whDelta(econ.programCostMid, p&&p.programCostMid, true))}
  ${card(wh('ggr'), whFmt(econ.ggrUpliftMid, cur), wh('per_mo'), 'pos', _whDelta(econ.ggrUpliftMid, p&&p.ggrUpliftMid, false))}
  ${card(wh('ret'), whFmt(econ.retentionValue, cur), wh('per_mo'), 'pos', _whDelta(econ.retentionValue, p&&p.retentionValue, false))}
  ${card(wh('net'), whFmt(net, cur), wh('per_mo'), net>=0?'pos':'neg', _whDelta(net, p&&p.netResultMid, false))}
  ${card(wh('roi'), Math.round(econ.roi||0)+'%', 'value / cost', (econ.roi||0)>=100?'pos':'neg', _whDelta(econ.roi, p&&p.roi, false, '%'))}
</div>

<div class="card" style="margin-bottom:16px">
  <button class="btn btn-primary" id="wh-btn-texts" onclick="whRunTexts()">${wh('crm')}</button>
  <div id="wh-texts-area" style="margin-top:14px">${whLastTexts ? whRenderTextsHTML(whLastTexts) : ''}</div>
</div>

<div class="card" style="margin-bottom:16px">
  <button class="btn btn-outline" id="wh-btn-desc" onclick="whRunDescription()">${wh('desc')}</button>
  <div id="wh-desc-area" style="margin-top:14px">${whLastDesc ? whRenderWheelDescHTML(whLastDesc) : ''}</div>
</div>

<div class="card" style="margin-bottom:16px">
  <button class="btn btn-outline" id="wh-btn-opt" onclick="whRunOptimize()">${whLastOpt ? wh('optimize_re') : wh('optimize')}</button>
  <div id="wh-opt-area" style="margin-top:14px">${whLastOpt ? whRenderOptHTML(whLastOpt) : ''}</div>
</div>

<div class="card">
  <button class="btn btn-outline" id="wh-btn-audit" onclick="whRunAudit()">${wh('audit')}</button>
  <div id="wh-audit-area" style="margin-top:14px">${whLastAudit ? whRenderAuditHTML(whLastAudit) : ''}</div>
</div>

<div class="card" style="margin-top:16px">
  <div class="card-title">${localStorage.getItem('bonusLang')==='ru' ? '⚔️ Анализ конкурентов' : '⚔️ Competitor analysis'}</div>
  <div id="wh-comp-area">${_whCompHtml()}</div>
</div>`;
}

// ── AI: CRM texts ───────────────────────────────────────────────────────────
async function whRunTexts() {
  const btn = document.getElementById('wh-btn-texts'), area = document.getElementById('wh-texts-area');
  if (!btn || !area || !whLastResult) return;
  btn.disabled = true; btn.textContent = '⏳ …';
  area.innerHTML = `<div class="loader"><div class="spinner"></div> ${wh('writing')}</div>`;
  try {
    const resp = await fetch('/api/wheel/texts', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ params: whLastResult.params, spec: whLastResult.spec }),
    });
    if (!resp.ok) { const e = await resp.json().catch(()=>({})); throw new Error(e.message || resp.statusText); }
    whLastTexts = await resp.json();
    whActiveTab = 'push';
    area.innerHTML = whRenderTextsHTML(whLastTexts);
    btn.textContent = wh('crm_re');
  } catch(e) {
    area.innerHTML = `<div class="alert alert-warn">${e.message}</div>`;
    btn.textContent = wh('crm');
  }
  btn.disabled = false;
}

function whRenderTextsHTML(texts) {
  const channels = ['push','email','sms','telegram','popup'];
  const tabs = channels.map(ch => `<button class="tab${whActiveTab===ch?' active':''}" onclick="whActiveTab='${ch}';document.getElementById('wh-texts-area').innerHTML=whRenderTextsHTML(whLastTexts)">${ch.charAt(0).toUpperCase()+ch.slice(1)}</button>`).join('');
  const variants = texts[whActiveTab] || [];
  let body;
  if (whActiveTab === 'email') {
    body = variants.map((v,i)=>`<div class="text-variant"><div class="text-variant-label">Variant ${i+1}</div>
      <div style="font-weight:600;font-size:.82rem;margin-bottom:4px">${v.subject||''}</div>
      <div class="text-variant-body">${v.body||''}</div></div>`).join('');
  } else if (whActiveTab === 'popup') {
    body = variants.map((v,i)=>`<div class="text-variant"><div class="text-variant-label">Variant ${i+1}</div>
      <div style="font-weight:700;font-size:.95rem;margin-bottom:3px">${v.headline||''}</div>
      <div style="color:var(--muted);font-size:.82rem;margin-bottom:6px">${v.subtext||''}</div>
      <div style="display:inline-block;background:var(--accent);color:#fff;padding:4px 12px;border-radius:6px;font-size:.78rem;font-weight:700">${v.cta||''}</div></div>`).join('');
  } else {
    body = variants.map((v,i)=>`<div class="text-variant"><div class="text-variant-label">Variant ${i+1}</div>
      <div class="text-variant-body">${typeof v==='string'?v:JSON.stringify(v)}</div></div>`).join('');
  }
  return `<div class="card-title">${wh('crm_title')}</div><div class="tab-row">${tabs}</div>${body}`;
}

// ── AI: offer description ───────────────────────────────────────────────────
function whCopyDesc(btn) {
  if (!whLastDesc) return;
  window.OfferDesc.copyText(window.OfferDesc.plainText(whLastDesc, wh('desc_tc')), btn);
}
async function whRunDescription() {
  const btn = document.getElementById('wh-btn-desc'), area = document.getElementById('wh-desc-area');
  if (!btn || !area || !whLastResult) return;
  btn.disabled = true; btn.textContent = '⏳ …';
  area.innerHTML = `<div class="loader"><div class="spinner"></div> ${wh('writing')}</div>`;
  try {
    const resp = await fetch('/api/wheel/description', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ params: whLastResult.params, spec: whLastResult.spec, uiLang: whLang() }),
    });
    if (!resp.ok) { const e = await resp.json().catch(()=>({})); throw new Error(e.message || resp.statusText); }
    whLastDesc = await resp.json();
    area.innerHTML = whRenderWheelDescHTML(whLastDesc);
    btn.textContent = wh('desc_re');
  } catch(e) {
    area.innerHTML = `<div class="alert alert-warn">${e.message}</div>`;
    btn.textContent = wh('desc');
  }
  btn.disabled = false;
}
function whRenderWheelDescHTML(d) {
  return window.OfferDesc.render(d, { note: wh('desc_note'), hint: wh('desc_hint'), how: wh('desc_how'), tc: wh('desc_tc'), copy: wh('desc_copy'), copyFn: 'whCopyDesc' });
}

// ── AI: compliance audit ────────────────────────────────────────────────────
async function whRunAudit() {
  const btn = document.getElementById('wh-btn-audit'), area = document.getElementById('wh-audit-area');
  if (!btn || !area || !whLastResult) return;
  btn.disabled = true; btn.textContent = '⏳ …';
  area.innerHTML = `<div class="loader"><div class="spinner"></div> ${wh('auditing')}</div>`;
  try {
    const resp = await fetch('/api/wheel/audit', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ params: whLastResult.params, spec: whLastResult.spec, uiLang: whLang() }),
    });
    if (!resp.ok) { const e = await resp.json().catch(()=>({})); throw new Error(e.message || resp.statusText); }
    whLastAudit = await resp.json();
    area.innerHTML = whRenderAuditHTML(whLastAudit);
    btn.textContent = wh('audit_re');
  } catch(e) {
    area.innerHTML = `<div class="alert alert-warn">${e.message}</div>`;
    btn.textContent = wh('audit');
  }
  btn.disabled = false;
}

function whRenderAuditHTML(audit) {
  const checks = audit.checks || [], recs = audit.recommendations || [];
  return `<div class="card-title">${wh('audit_title')}</div>
    ${checks.map(c=>`<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="flex-shrink:0;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:${c.status==='ok'?'rgba(16,185,129,.2)':'rgba(245,158,11,.2)'};color:${c.status==='ok'?'#10b981':'#f59e0b'}">${c.status==='ok'?'✓':'!'}</div>
      <div><div style="font-weight:600;font-size:.83rem">${c.label}</div>
      <div style="color:var(--muted);font-size:.78rem">${c.note}</div>
      ${c.rule?`<div style="color:var(--muted);font-size:.72rem;font-style:italic;margin-top:2px">${c.rule}</div>`:''}</div>
    </div>`).join('')}
    ${recs.length?`<div style="margin-top:12px;font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">${wh('recommendations')}</div>
      ${recs.map(r=>`<div style="padding:8px 10px;background:var(--bg3);border-radius:8px;margin-bottom:6px"><div style="font-size:.82rem">${r.text}</div><div style="font-size:.72rem;color:#a0b0ff;margin-top:3px">↑ ${r.impact||''}</div></div>`).join('')}`:''}`;
}

// ── Save / Calendar ─────────────────────────────────────────────────────────
function whSave() {
  if (!whLastResult) return;
  const id = whGenId();
  const rec = { id, name: `Wheel · ${wh('preset_'+whDraft.preset)} · ${whDraft.geo.toUpperCase()}`,
    createdAt: new Date().toISOString(), params: whLastResult.params, result: whLastResult };
  const list = whLoad(); list.unshift(rec); whStore(list.slice(0, 50));
  window.RetomatRepo?.mirror('configs', id, { ...rec, type:'wheel' });
  if (typeof updateAllBadges === 'function') updateAllBadges();
  whToast(wh('saved_ok'));
}

function whAddToCalendar() {
  if (!whLastResult) return;
  try {
    const now = new Date(), monday = new Date(now);
    monday.setDate(now.getDate() + (now.getDay() === 0 ? 1 : 8 - now.getDay()));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    const entry = {
      id: whGenId(), title: `🎡 ${wh('preset_'+whDraft.preset)} · ${whDraft.geo.toUpperCase()}`,
      type: 'bonus', segment: whDraft.segment, geo: whDraft.geo, status: 'draft',
      sourceType: 'wheel_generator',
      startDate: monday.toISOString().slice(0,10), endDate: sunday.toISOString().slice(0,10),
      econ: whLastResult.econ || {}, params: whLastResult.params || {}, cur: whLastResult.cur,
      createdAt: new Date().toISOString(),
    };
    const camps = JSON.parse(localStorage.getItem('rc_campaigns') || '[]');
    camps.push(entry); localStorage.setItem('rc_campaigns', JSON.stringify(camps));
    window.RetomatRepo?.mirror('calendar-events', entry.id, entry);
    whToast(wh('cal_ok'));
  } catch(e) {}
}

// ── ECONOMICS OPTIMIZATION (AI recommendations + deterministic balancer) ──────
const WH_TARGET_ROI_KEY = 'wh_target_roi';
const WH_FREQ_DOWNGRADE = { daily:'weekly', weekly:'on_deposit', on_deposit:'one_time' };
const WH_FREQS = ['on_deposit','daily','weekly','one_time'];
const WH_SEGS  = ['all','depositors','new','vip','dormant'];

function _getWhTargetRoi() { try { return parseFloat(localStorage.getItem(WH_TARGET_ROI_KEY) || '120'); } catch { return 120; } }

// Escape AI-provided text before interpolating into innerHTML (optimize recs are LLM output).
function _whEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  ));
}

// opts: { lowerBetter, suffix, decimals } — decimals>0 for small-magnitude metrics (EV/spin).
function _whDelta(cur, prev, lowerBetter, suffix, decimals) {
  if (prev === undefined || prev === null || cur === undefined || cur === null) return '';
  const diff = cur - prev;
  const eps  = decimals ? Math.pow(10, -decimals) / 2 : 0.5;
  if (Math.abs(diff) < eps) return '';
  const improved = lowerBetter ? diff < 0 : diff > 0;
  const color = improved ? '#10b981' : '#ef4444';
  const sign  = diff > 0 ? '+' : '';
  const num   = decimals ? diff.toFixed(decimals) : Math.round(diff).toLocaleString('en-US');
  return `<span style="font-size:.62rem;font-weight:700;padding:1px 5px;border-radius:4px;background:${color}22;color:${color};margin-left:6px">${sign}${num}${suffix||''}</span>`;
}

// Build the cost context the way the server/econ module does (defaults when not set in the hub).
function _whCtx() {
  const d = whLastResult, dr = whDraft;
  const fx = window._wheelEcon.deriveLocalFxRate(d.cur, dr.geo);
  const rtp = d.params.rtp != null && d.params.rtp !== '' ? Number(d.params.rtp) : 0.96;
  const betValue = d.params.betValue != null && d.params.betValue !== ''
    ? Number(d.params.betValue) : Math.max(0.1, Math.round(0.2 * fx * 100) / 100);
  return { avgDeposit: Number(d.params.avgDeposit), betValue,
    wager: d.params.wager != null && d.params.wager !== '' ? Number(d.params.wager) : 30, wcr: 1.0, rtp };
}

// Local econ recompute — mirrors the server exactly (parity-tested module).
function _whRecalcLocal(segments, frequency) {
  const d = whLastResult, dr = whDraft;
  return window._wheelEcon.calcWheelEconomics({
    region: d.region, segment: dr.segment, players: dr.players,
    avgDeposit: Number(d.params.avgDeposit), segments, frequency,
    sitecur: d.cur, geo: dr.geo,
    rtp:   d.params.rtp   != null && d.params.rtp   !== '' ? Number(d.params.rtp)   : undefined,
    wager: d.params.wager != null && d.params.wager !== '' ? Number(d.params.wager) : undefined,
  });
}

function _whSnapshot() {
  return {
    spec:      JSON.parse(JSON.stringify(whLastResult.spec)),
    frequency: whDraft.frequency,
    segment:   whDraft.segment,
    econ:      { ...whLastResult.econ },
    params:    { ...whLastResult.params },
  };
}

// Lever: shift weight from the most expensive segment to the cheapest (lowers EV). Returns true if it moved.
function _whShiftStep(segs, ctx) {
  const totalW = segs.reduce((a, s) => a + Math.max(0, s.weight), 0) || 1;
  const ranked = segs.map((s, i) => ({ i, c: window._wheelEcon.segmentCost(s, ctx) }));
  const rich  = ranked.slice().sort((a, b) => b.c - a.c)[0];
  const cheap = ranked.slice().sort((a, b) => a.c - b.c)[0];
  if (!rich || !cheap || rich.i === cheap.i) return false;
  if (segs[rich.i].weight <= 2) return false;
  if (Math.max(0, segs[cheap.i].weight) / totalW >= 0.65) return false;
  const step = Math.max(1, Math.round(totalW * 0.04));
  // Conserve total weight: move exactly what the rich segment gives up (it can't drop below 1).
  const moved = Math.min(step, segs[rich.i].weight - 1);
  if (moved <= 0) return false;
  segs[rich.i].weight  = segs[rich.i].weight - moved;
  segs[cheap.i].weight = Math.max(0, segs[cheap.i].weight) + moved;
  return true;
}

// Lever: trim a rich segment's prize value by 15% (floors keep it a real prize). Returns true if it trimmed.
// `jackpotFloor` keeps the jackpot/physical (the headline prizes) from being trimmed below the biggest
// cash bonus on the wheel. Without it the balancer — which always targets the COSTLIEST segment — guts
// the jackpot into absurdity: a jackpot is paid at face value while bonus_money is discounted by wagering
// (truncNormalPayout), so the jackpot is almost always the "richest" segment and gets hammered until it
// drops below a normal bonus. The floor makes it stop at the top bonus and move on to other levers.
function _whTrimPrize(seg, jackpotFloor) {
  switch (seg.prizeType) {
    case 'free_spins': { const n = Math.floor(seg.prizeValue * 0.85); if (n < seg.prizeValue && n >= 1) { seg.prizeValue = n; return true; } return false; }
    case 'cashback':   { const v = Math.round(seg.prizeValue * 0.85 * 1000) / 1000; if (v < seg.prizeValue && v >= 0.01) { seg.prizeValue = v; return true; } return false; }
    case 'multiplier': { const v = Math.round((1 + (seg.prizeValue - 1) * 0.85) * 100) / 100; if (v < seg.prizeValue && v > 1) { seg.prizeValue = v; return true; } return false; }
    case 'bonus_money': { const v = Math.round(seg.prizeValue * 0.85); if (v < seg.prizeValue && v >= 1) { seg.prizeValue = v; return true; } return false; }
    case 'jackpot':
    case 'physical': {
      const floor = Math.max(1, jackpotFloor || 0);
      if (seg.prizeValue <= floor) return false;                       // already at the floor — trim something else
      const v = Math.max(floor, Math.round(seg.prizeValue * 0.85));    // never below the top cash bonus
      if (v < seg.prizeValue) { seg.prizeValue = v; return true; }
      return false;
    }
    default: return false;
  }
}
// The jackpot/physical prize must stay NOTICEABLY above the biggest cash bonus — not merely ≥ it —
// so it still reads as the headline prize after balancing (default presets ship it at ~5× the top bonus).
const WH_JACKPOT_MIN_MULT = 2;
function _whTrimStep(segs, ctx) {
  // Floor for jackpot/physical = WH_JACKPOT_MIN_MULT × the biggest cash bonus currently on the wheel
  // (recomputed each step, since bonus_money may itself have been trimmed) → the jackpot can never fall
  // to or below a normal bonus, and always stays clearly larger.
  const maxBonus = segs.reduce((mx, s) => s.prizeType === 'bonus_money' ? Math.max(mx, s.prizeValue) : mx, 0);
  const jackpotFloor = maxBonus * WH_JACKPOT_MIN_MULT;
  const ranked = segs.map((s, i) => ({ i, c: window._wheelEcon.segmentCost(s, ctx) }))
    .filter(x => x.c > 0.001).sort((a, b) => b.c - a.c);
  for (const x of ranked) { if (_whTrimPrize(segs[x.i], jackpotFloor)) return true; }
  return false;
}

// Deterministic "Balance to Profit": lower EV (weights → prize values) then, if needed, downgrade cadence.
function whBalanceToProfit(targetRoi) {
  if (!whLastResult || !window._wheelEcon || !window._wheelEcon.deriveLocalFxRate) { whToast(wh('mods_loading')); return; }
  const cur0 = whLastResult.econ ? (whLastResult.econ.roi ?? 0) : 0;
  if (cur0 >= targetRoi) { whToast(wh('bal_already')(Math.round(cur0), targetRoi)); return; }

  const ctx  = _whCtx();
  const segs = whLastResult.spec.segments.map(s => ({ ...s }));
  let freq   = whDraft.frequency;
  const before = _whSnapshot();
  const roiOf = () => _whRecalcLocal(segs, freq).roi;

  let guard = 0;
  while (roiOf() < targetRoi && guard++ < 300) {
    if (_whShiftStep(segs, ctx)) continue;   // lever A — shift weight to cheap segment
    if (_whTrimStep(segs, ctx))  continue;   // lever B — trim rich prizes
    if (WH_FREQ_DOWNGRADE[freq]) { freq = WH_FREQ_DOWNGRADE[freq]; continue; }  // lever C — downgrade cadence
    break;
  }
  const reached = roiOf() >= targetRoi;
  _whApplyWorking(segs, freq, whDraft.segment, before, reached, targetRoi, 'balanced');
}

// Apply the machine-applicable subset of AI recommendations (frequency/segment enums + weight/prize nudges).
function applyWhAiRecs(recs) {
  if (!whLastResult || !recs || !recs.length) return;
  if (!window._wheelEcon || !window._wheelEcon.deriveLocalFxRate) { whToast(wh('mods_loading')); return; }
  const before = _whSnapshot();
  const ctx  = _whCtx();
  const segs = whLastResult.spec.segments.map(s => ({ ...s }));
  let freq = whDraft.frequency, seg = whDraft.segment;
  // Match enum values as whole tokens, not bare substrings — otherwise 'all'
  // matches inside common words like "small"/"overall" and mis-sets the audience.
  const matchEnum = (list, target, fb) => {
    const tokens = new Set(String(target).toLowerCase().split(/[^a-z_]+/).filter(Boolean));
    return list.find(x => tokens.has(x)) || fb;
  };
  for (const r of recs) {
    const param = String(r.param || '').toLowerCase();
    if (param.includes('frequency') || param.includes('cadence')) freq = matchEnum(WH_FREQS, r.target, freq);
    else if (param.includes('segment') || param.includes('audience')) seg = matchEnum(WH_SEGS, r.target, seg);
    else if (param.includes('weight')) { for (let k = 0; k < 3; k++) if (!_whShiftStep(segs, ctx)) break; }
    else if (param.includes('prize') || param.includes('value')) { for (let k = 0; k < 2; k++) if (!_whTrimStep(segs, ctx)) break; }
    // rtp / wager are not editable in the hub wizard — skipped
  }
  _whApplyWorking(segs, freq, seg, before, true, _getWhTargetRoi(), 'applied');
}

// Persist a working config: push undo, re-fetch canonical econ from the server, re-render with deltas.
async function _whApplyWorking(segs, freq, seg, before, reached, targetRoi, mode) {
  whUndoStack = before;
  whPrevEcon  = before.econ;
  whDraft.frequency = freq;
  whDraft.segment   = seg;
  try {
    const d = whLastResult;
    const resp = await fetch('/api/wheel/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: { ...d.params, segment: seg, frequency: freq, segments: segs } }),
    });
    if (resp.ok) whLastResult = await resp.json();
    else { const e = await resp.json().catch(() => ({})); throw new Error(e.message || resp.statusText); }
  } catch (err) {
    // Fall back to the local recompute so the UI still reflects the change.
    whLastResult = { ...whLastResult, econ: _whRecalcLocal(segs, freq),
      spec: { ...whLastResult.spec, segments: segs, frequency: freq } };
  }
  whLastOpt = null; whLastOptRecs = [];   // recommendations are stale after a change
  whShowView('result');
  const roiNow = Math.round(whLastResult.econ ? (whLastResult.econ.roi ?? 0) : 0);
  if (mode === 'balanced') whToast(reached ? wh('bal_ok')(roiNow) : wh('bal_fail'));
  else whToast(wh('applied_ok'));
}

function undoWhApply() {
  if (!whUndoStack) return;
  const u = whUndoStack;
  whDraft.frequency = u.frequency;
  whDraft.segment   = u.segment;
  whLastResult = { ...whLastResult, spec: u.spec, econ: u.econ, params: u.params };
  whPrevEcon = null; whUndoStack = null; whLastOpt = null; whLastOptRecs = [];
  whShowView('result');
}

function whActionPanelHTML(econ) {
  const roi    = econ ? (econ.roi ?? 0) : 0;
  const target = _getWhTargetRoi();
  const hasRecs = whLastOptRecs.length > 0;
  const hasUndo = !!whUndoStack;
  const need    = roi < target;
  const applyBtn = `<button class="btn btn-outline btn-sm" style="white-space:nowrap" ${hasRecs ? '' : 'disabled title="' + wh('apply_hint') + '"'} onclick="applyWhAiRecs(whLastOptRecs||[])">${wh('apply_recs')}</button>`;
  const balBtn = `<button class="btn btn-sm" style="white-space:nowrap;${need ? 'background:linear-gradient(135deg,#4f6ef7,#7c3aed);color:#fff;box-shadow:0 2px 10px rgba(79,110,247,.3)' : 'background:transparent;border:1px solid var(--border);color:var(--text)'}" onclick="whBalanceToProfit(_getWhTargetRoi())">${wh('balance')}</button>`;
  const undoBtn = hasUndo ? `<button class="btn btn-ghost btn-sm" onclick="undoWhApply()">${wh('undo')}</button>` : '';
  return `<div style="background:rgba(79,110,247,.06);border:1px solid rgba(79,110,247,.2);border-radius:10px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
    <div style="display:flex;align-items:center;gap:7px;flex-shrink:0">
      <label style="font-size:.72rem;font-weight:600;color:var(--muted);white-space:nowrap">${wh('target_roi')}:</label>
      <input type="range" min="60" max="250" step="5" value="${target}" style="width:90px;accent-color:#4f6ef7"
        oninput="this.nextElementSibling.textContent=this.value+'%';localStorage.setItem('${WH_TARGET_ROI_KEY}',this.value)"
      ><span style="font-size:.82rem;font-weight:700;color:var(--text);min-width:40px">${target}%</span>
    </div>
    <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">${balBtn}${applyBtn}${undoBtn}</div>
  </div>`;
}

async function whRunOptimize() {
  const btn = document.getElementById('wh-btn-opt'), area = document.getElementById('wh-opt-area');
  if (!btn || !area || !whLastResult) return;
  btn.disabled = true; btn.textContent = '⏳ …';
  area.innerHTML = `<div class="loader"><div class="spinner"></div> ${wh('optimizing')}</div>`;
  try {
    const resp = await fetch('/api/wheel/optimize', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: whLastResult.params, econ: whLastResult.econ, uiLang: whLang() }),
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.message || resp.statusText); }
    whLastOpt = await resp.json();
    whLastOptRecs = whLastOpt.recommendations || [];
    whShowView('result');   // re-render so the "Apply recommendations" button enables + recs show
  } catch (e) {
    area.innerHTML = `<div class="alert alert-warn">${e.message}</div>`;
    btn.textContent = wh('optimize'); btn.disabled = false;
  }
}

function whRenderOptHTML(opt) {
  const recs = (opt && opt.recommendations) || [];
  const impactColor = { high:'#ef4444', med:'#f59e0b', low:'#10b981' };
  return `<div class="card-title">${wh('optimize_title')}</div>
    ${recs.map(r => `<div style="padding:10px 12px;background:var(--bg3);border-radius:8px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">
        <span style="font-weight:700;font-size:.82rem">${_whEsc(r.param)}</span>
        <span style="font-size:.66rem;font-weight:700;padding:2px 8px;border-radius:6px;background:${(impactColor[r.impact]||'#64748b')}22;color:${impactColor[r.impact]||'#64748b'}">${_whEsc(r.impact)}</span>
      </div>
      <div style="font-size:.8rem;margin-bottom:4px"><span style="color:var(--muted)">${_whEsc(r.current)}</span> <span style="color:#a0b0ff">→ ${_whEsc(r.target)}</span></div>
      <div style="font-size:.76rem;color:var(--muted)">${_whEsc(r.reason)}</div>
    </div>`).join('')}`;
}

function whToggleGlossary() { if (typeof toggleGlossary === 'function') toggleGlossary(); }

function whToast(msg) {
  let t = document.getElementById('wh-toast');
  if (!t) { t = document.createElement('div'); t.id = 'wh-toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:10px 20px;border-radius:8px;font-size:.85rem;font-weight:600;z-index:300;box-shadow:0 4px 20px rgba(0,0,0,.3)';
    document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; }, 1800);
}
