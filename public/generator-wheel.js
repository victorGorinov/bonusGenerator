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
    audit:'🔍 Compliance audit', audit_re:'↺ Re-run audit', audit_title:'Compliance review',
    save:'💾 Save', add_cal:'📅 Add to Calendar', saved_ok:'Saved ✓', cal_ok:'Added to Calendar ✓',
    recommendations:'Recommendations', writing:'AI is writing wheel copy…', auditing:'AI compliance officer is reviewing…',
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
    audit:'🔍 Комплаенс-аудит', audit_re:'↺ Повторить аудит', audit_title:'Комплаенс-ревью',
    save:'💾 Сохранить', add_cal:'📅 В календарь', saved_ok:'Сохранено ✓', cal_ok:'Добавлено в календарь ✓',
    recommendations:'Рекомендации', writing:'AI пишет тексты для колеса…', auditing:'AI-комплаенс проверяет…',
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
let whLastAudit  = null;
let whActiveTab  = 'push';

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
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
      ${WH_GEO_OPTIONS.map(g=>`<option value="${g.val}"${g.val===d.geo?' selected':''}>${g.lbl}</option>`).join('')}
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
    whLastTexts = null; whLastAudit = null; whActiveTab = 'push';
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

  const card = (label, val, sub, cls) => `<div class="econ-card"><div class="ec-label">${label}</div><div class="ec-val ${cls||''}">${val}</div><div class="ec-sub">${sub||''}</div></div>`;

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

<div class="econ-grid" style="margin-bottom:16px">
  ${card(wh('ev'), whFmt(econ.evPerSpin, cur), wh('per_spin'), '')}
  ${card(wh('prog_cost'), whFmt(econ.programCostMid, cur), wh('per_mo'), '')}
  ${card(wh('ggr'), whFmt(econ.ggrUpliftMid, cur), wh('per_mo'), 'pos')}
  ${card(wh('ret'), whFmt(econ.retentionValue, cur), wh('per_mo'), 'pos')}
  ${card(wh('net'), whFmt(net, cur), wh('per_mo'), net>=0?'pos':'neg')}
  ${card(wh('roi'), Math.round(econ.roi||0)+'%', 'value / cost', (econ.roi||0)>=100?'pos':'neg')}
</div>

<div class="card" style="margin-bottom:16px">
  <button class="btn btn-primary" id="wh-btn-texts" onclick="whRunTexts()">${wh('crm')}</button>
  <div id="wh-texts-area" style="margin-top:14px">${whLastTexts ? whRenderTextsHTML(whLastTexts) : ''}</div>
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

function whToggleGlossary() { if (typeof toggleGlossary === 'function') toggleGlossary(); }

function whToast(msg) {
  let t = document.getElementById('wh-toast');
  if (!t) { t = document.createElement('div'); t.id = 'wh-toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:10px 20px;border-radius:8px;font-size:.85rem;font-weight:600;z-index:300;box-shadow:0 4px 20px rgba(0,0,0,.3)';
    document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; }, 1800);
}
