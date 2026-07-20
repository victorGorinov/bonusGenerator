// Shared, framework-agnostic Competitor Analysis module.
//   * PARAM_DEFS  — comparison-table rows per promo type (mirror of
//     src/ai/prompts/competitor-params.ts keys, plus a player-attractiveness
//     direction used to colour each cell).
//   * pure logic  — parseNum / classifyCell / buildRows (unit-tested).
//   * renderers   — renderComparisonTable / renderVerdict (HTML strings).
// Consumed in the browser via window.CompetitorAnalysis (configurator.js and the
// generator hub are classic scripts); also ESM-exported for the unit test.
//
// dir: 'higher' = a bigger value is more attractive to the player (own > comp → own wins);
//      'lower'  = a smaller value is more attractive (own < comp → own wins);
//      'strategic' = a trade-off, not strictly better/worse (always a neutral pill).

export const PARAM_DEFS = {
  bonus: [
    { key: 'matchPct',     en: 'Match %',      ru: 'Match %',           dir: 'higher' },
    { key: 'maxBonus',     en: 'Max bonus',    ru: 'Макс. бонус',       dir: 'higher' },
    { key: 'wager',        en: 'Wager',        ru: 'Вейджер',           dir: 'lower'  },
    { key: 'minDeposit',   en: 'Min deposit',  ru: 'Мин. депозит',      dir: 'lower'  },
    { key: 'maxWin',       en: 'Max win',      ru: 'Макс. выигрыш',     dir: 'higher' },
    { key: 'validityDays', en: 'Validity',     ru: 'Срок действия',     dir: 'higher' },
  ],
  tournament: [
    { key: 'prizePool',    en: 'Prize pool',   ru: 'Призовой фонд',     dir: 'higher'    },
    { key: 'distribution', en: 'Distribution', ru: 'Распределение',     dir: 'strategic' },
    { key: 'segmentReach', en: 'Segment reach',ru: 'Охват сегмента',    dir: 'strategic' },
    { key: 'frequency',    en: 'Frequency',    ru: 'Частота',           dir: 'strategic' },
    { key: 'entry',        en: 'Entry',        ru: 'Вход',              dir: 'lower'     },
  ],
  loyalty: [
    { key: 'tiers',        en: 'Tiers',        ru: 'Тиров',             dir: 'higher'    },
    { key: 'topCashback',  en: 'Top cashback', ru: 'Топ-кэшбэк',        dir: 'higher'    },
    { key: 'earnRate',     en: 'Earn rate',    ru: 'Earn rate',         dir: 'strategic' },
    { key: 'redeemRate',   en: 'Redeem rate',  ru: 'Redeem (курс)',     dir: 'lower'     },
    { key: 'pointsExpiry', en: 'Points expiry',ru: 'Срок очков',        dir: 'higher'    },
  ],
  wheel: [
    { key: 'occasion',     en: 'Occasion',     ru: 'Повод',             dir: 'strategic' },
    { key: 'segments',     en: 'Segments',     ru: 'Сегментов',         dir: 'higher'    },
    { key: 'topPrize',     en: 'Top prize',    ru: 'Топ-приз',          dir: 'higher'    },
    { key: 'spinCost',     en: 'Spin cost',    ru: 'Получение спина',   dir: 'strategic' },
    { key: 'emptySlots',   en: 'Empty slots',  ru: '«Пустых» секторов', dir: 'lower'     },
    { key: 'winWager',     en: 'Win wager',    ru: 'Вейджер выигрыша',  dir: 'lower'     },
  ],
};

const UNLIMITED = ['no limit', 'no cap', 'unlimited', 'без лимита', 'нет лимита'];
const NEVER     = ['never', 'no expiry', 'бессрочно', 'без срока'];
const FREE      = ['free', 'freeroll', 'бесплатно', 'free daily', 'бесплатный'];

// Parse a display value ("€1,000", "35x", "12.5%", "14 days", "no limit") into a
// comparable number, honouring the param direction for the special tokens.
// Returns null when the value isn't numerically comparable (→ neutral cell).
export function parseNum(val, dir) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  const s = String(val).trim().toLowerCase();
  if (s === '' || s === 'н/д' || s === 'n/a' || s === '—') return null;
  if (UNLIMITED.some((t) => s.includes(t))) return dir === 'higher' ? Infinity : null;
  if (NEVER.some((t) => s.includes(t)))     return dir === 'higher' ? Infinity : null;
  if (FREE.some((t) => s.includes(t)))      return dir === 'lower'  ? 0 : null;
  // No leading minus: domain values are never negative, and "top-10" must parse
  // as 10, not -10 (the hyphen is a separator, not a sign).
  const m = s.match(/\d[\d.,]*/);
  if (!m) return null;
  let num = m[0];
  // A comma is a thousands separator only when it groups digits in threes
  // (1,000 / 12,500,000); otherwise it's a decimal comma (1,5 → 1.5). If a dot
  // is also present the dot is the decimal, so commas are thousands.
  if (num.includes(',') && !num.includes('.')) {
    num = /^\d{1,3}(,\d{3})+$/.test(num) ? num.replace(/,/g, '') : num.replace(',', '.');
  } else {
    num = num.replace(/,/g, '');
  }
  const n = parseFloat(num);
  return Number.isNaN(n) ? null : n;
}

// 'win' = own more attractive, 'lose' = competitor more attractive, 'par' = equal,
// 'strategic' = trade-off param, 'na' = not comparable.
export function classifyCell(dir, ownVal, compVal) {
  if (dir === 'strategic') return 'strategic';
  const a = parseNum(ownVal, dir);
  const b = parseNum(compVal, dir);
  if (a === null || b === null) return 'na';
  if (a === b) return 'par';
  const ownBetter = dir === 'higher' ? a > b : a < b;
  return ownBetter ? 'win' : 'lose';
}

// Build render-ready rows: one per param, each with the own value + a cell per
// competitor carrying its classification and a source flag.
export function buildRows(promoType, lang, ownParams, competitors) {
  const defs = PARAM_DEFS[promoType] || [];
  return defs.map((d) => {
    const own = fmt(ownParams?.[d.key]);
    const cells = (competitors || []).map((c) => {
      const raw = c.params?.[d.key];
      return {
        name: c.name,
        val:  fmt(raw),
        cls:  classifyCell(d.dir, ownParams?.[d.key], raw),
        source: c.source,
        confidence: c.confidence,
      };
    });
    return { key: d.key, dir: d.dir, label: lang === 'ru' ? d.ru : d.en, own, cells };
  });
}

function fmt(v) {
  if (v === null || v === undefined || v === '') return 'н/д';
  return String(v);
}

// ── i18n ──────────────────────────────────────────────────────────────────────
const I18N = {
  en: {
    param: 'Parameter', you: 'Retomat (you)', gen: '⚙️ generated', aiSrc: '🔍 AI search', manSrc: '✍️ manual',
    win: '▲ stronger', lose: '▼ competitor', par: '= on par', strategic: '≈ strategy', na: '—',
    legWin: 'Retomat more attractive', legPar: 'on par / strategic choice', legLose: 'competitor more attractive',
    verdict: 'AI verdict', strengths: '▲ Strengths', weaknesses: '▼ Weaknesses', recs: 'Recommendations to strengthen',
    benchmark: 'Benchmark', current: 'now', suggested: 'suggest',
    // control chrome — used by the hub twins so they don't each re-declare these
    ownLabel: 'Your offer', compLabel: 'Competitors (up to 3)', namePh: 'Casino name',
    findAi: '🔍 Find via AI', addManual: '✍️ Manual', run: '⚡ Run AI analysis',
    analyzing: 'Analysing competitiveness…', searching: 'Searching the web…',
    badgeAi: 'AI', badgeAiUnconf: 'AI · unconfirmed', badgeManual: 'manual', srcLink: 'source ↗',
    max: 'Up to 3 competitors', addHint: 'Add at least one competitor.', nameReq: 'Enter a casino name',
    notfound: 'No reliable source found — marked unconfirmed', rerun: '↺ Re-run', save: '💾 Save',
    saved: 'Comparison saved ✓', needGen: 'Generate the promo first.',
    transparency: '⚙️ generated · 🔍 AI-found (with source) · ✍️ manual. The AI never invents numbers — unfound values are marked "н/д" and excluded from the verdict.',
  },
  ru: {
    param: 'Параметр', you: 'Retomat (вы)', gen: '⚙️ сгенерировано', aiSrc: '🔍 AI-поиск', manSrc: '✍️ вручную',
    win: '▲ сильнее', lose: '▼ конкурент', par: '= на уровне', strategic: '≈ стратегия', na: '—',
    legWin: 'Retomat выгоднее', legPar: 'на уровне / стратегия', legLose: 'конкурент выгоднее',
    verdict: 'Вердикт AI', strengths: '▲ Сильные стороны', weaknesses: '▼ Слабые стороны', recs: 'Рекомендации по усилению',
    benchmark: 'Бенчмарк', current: 'сейчас', suggested: 'предложение',
    ownLabel: 'Ваше предложение', compLabel: 'Конкуренты (до 3)', namePh: 'Название казино',
    findAi: '🔍 Найти через AI', addManual: '✍️ Вручную', run: '⚡ Запустить AI-анализ',
    analyzing: 'Анализ конкурентности…', searching: 'Идёт поиск в интернете…',
    badgeAi: 'AI', badgeAiUnconf: 'AI · не подтв.', badgeManual: 'вручную', srcLink: 'источник ↗',
    max: 'Максимум 3 конкурента', addHint: 'Добавьте хотя бы одного конкурента.', nameReq: 'Введите название казино',
    notfound: 'Достоверный источник не найден — помечено как не подтверждено', rerun: '↺ Пересчитать', save: '💾 Сохранить',
    saved: 'Сравнение сохранено ✓', needGen: 'Сначала сгенерируйте промо.',
    transparency: '⚙️ сгенерировано · 🔍 найдено AI (с источником) · ✍️ вручную. AI не выдумывает цифры — значения без источника помечаются «н/д» и не идут в вердикт.',
  },
};
function T(lang) { return I18N[lang === 'ru' ? 'ru' : 'en']; }

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function pill(cls, t) {
  if (cls === 'na') return '';
  const label = t[cls] || '';
  return `<span class="ca-pill ca-${cls}">${label}</span>`;
}

function srcTag(source, confidence, t) {
  if (source === 'ai_search') return confidence === 'unconfirmed' ? `${t.aiSrc} ⚠` : t.aiSrc;
  return t.manSrc;
}

// ── renderers ─────────────────────────────────────────────────────────────────
export function renderComparisonTable(promoType, lang, ownLabel, ownParams, competitors) {
  const t = T(lang);
  const rows = buildRows(promoType, lang, ownParams, competitors);
  const heads = (competitors || []).map((c) =>
    `<th><span class="ca-co">${esc(c.name)}</span><span class="ca-src">${srcTag(c.source, c.confidence, t)}</span></th>`
  ).join('');
  const body = rows.map((r) => {
    const own = `<td class="ca-own">${esc(r.own)}</td>`;
    const cells = r.cells.map((c) =>
      `<td><span class="ca-cell">${esc(c.val)} ${pill(c.cls, t)}</span></td>`
    ).join('');
    return `<tr><th>${esc(r.label)}</th>${own}${cells}</tr>`;
  }).join('');
  return `
    <div class="ca-table-scroll">
      <table class="ca-table">
        <thead><tr>
          <th>${t.param}</th>
          <th class="ca-own"><span class="ca-co">${esc(ownLabel || t.you)}</span><span class="ca-src">${t.gen}</span></th>
          ${heads}
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <div class="ca-legend">
      <span><i class="ca-dot ca-win"></i> ${t.legWin}</span>
      <span><i class="ca-dot ca-par"></i> ${t.legPar}</span>
      <span><i class="ca-dot ca-lose"></i> ${t.legLose}</span>
    </div>`;
}

export function renderVerdict(lang, result) {
  const t = T(lang);
  if (!result) return '';
  const list = (arr, kind) => (arr || []).map((x) =>
    `<li><span class="ca-mk">${kind === 'str' ? '+' : '–'}</span>${esc(x)}</li>`
  ).join('');
  const recs = (result.recommendations || []).map((r) => `
    <div class="ca-rec">
      <div class="ca-rec-head">
        <span class="ca-rec-name">${esc(r.param)}</span>
        <span class="ca-change"><span class="ca-from">${esc(r.current)}</span> → <span class="ca-to">${esc(r.suggested)}</span></span>
        <span class="ca-impact ca-imp-${esc(r.impact)}">${esc(r.impact)}</span>
      </div>
      <p class="ca-why">${esc(r.reason)} <span class="ca-bm">${t.benchmark}: ${esc(r.competitorBenchmark)}</span></p>
    </div>`).join('');
  return `
    <div class="ca-vsum">${esc(result.verdict)}</div>
    <div class="ca-verdict-grid">
      <div class="ca-vcard ca-str"><h4>${t.strengths}</h4><ul>${list(result.strengths, 'str')}</ul></div>
      <div class="ca-vcard ca-weak"><h4>${t.weaknesses}</h4><ul>${list(result.weaknesses, 'weak')}</ul></div>
    </div>
    <div class="ca-recs-title">${t.recs}</div>
    <div class="ca-recs">${recs}</div>`;
}

// ── Full panel + wiring (used by the Generator hub twins) ──────────────────────
// renderPanel builds the whole competitor panel as an HTML string; onclick
// handlers are namespaced by fnPrefix so several hosts can coexist on one page.
function renderCard(promoType, lang, comp, i, fnPrefix) {
  const t = T(lang);
  const defs = PARAM_DEFS[promoType] || [];
  const ai = comp.source === 'ai_search';
  const badge = ai ? (comp.confidence === 'unconfirmed' ? t.badgeAiUnconf : t.badgeAi) : t.badgeManual;
  const fields = defs.map((d) => {
    const label = lang === 'ru' ? d.ru : d.en;
    const val = (comp.params && comp.params[d.key]) || '';
    if (ai) return `<div class="ca-f"><span class="ca-fl">${label}</span><span class="ca-fv">${esc(val || 'н/д')}</span></div>`;
    return `<div class="ca-f"><span class="ca-fl">${label}</span><input class="ca-fi" value="${esc(val)}" oninput="${fnPrefix}SetParam(${i},'${d.key}',this.value)"></div>`;
  }).join('');
  const src = ai && comp.sourceUrl ? `<a href="${esc(comp.sourceUrl)}" target="_blank" rel="noopener" class="ca-srclink">${t.srcLink}</a>` : '';
  return `<div class="ca-card"><div class="ca-card-head"><span class="ca-card-name">${ai ? '🔍' : '✍️'} ${esc(comp.name)}</span><span class="ca-badge">${badge}</span>${src}<a class="ca-x" onclick="${fnPrefix}Remove(${i})">✕</a></div><div class="ca-fields">${fields}</div></div>`;
}

export function renderPanel(o) {
  const t = T(o.lang);
  if (o.needGen) return `<div class="ca-hint" style="padding:16px 0">${esc(t.needGen)}</div>`;
  const defs = PARAM_DEFS[o.promoType] || [];
  const ownChips = defs.map((d) => `<span class="ca-own-chip"><b>${o.lang === 'ru' ? d.ru : d.en}:</b> ${esc((o.ownParams && o.ownParams[d.key]) || '—')}</span>`).join('');
  const cards = (o.list || []).map((c, i) => renderCard(o.promoType, o.lang, c, i, o.fnPrefix)).join('');
  const addRow = (o.list && o.list.length >= 3) ? '' : `<div class="ca-add">
    <input id="${o.nameInputId}" placeholder="${esc(t.namePh)}">
    <button class="ca-prim" onclick="${o.fnPrefix}SearchAI()">${t.findAi}</button>
    <button onclick="${o.fnPrefix}AddManual()">${t.addManual}</button>
  </div>`;
  let result = '';
  if (o.loading) result = `<div class="ca-hint" style="padding:16px 0">${esc(t.analyzing)}</div>`;
  else if (o.result && o.result.error) result = `<div style="color:#EF4444;padding:12px 0">${esc(o.result.error)}</div>`;
  else if (o.result) result = `<div class="ca-run-again"><button onclick="${o.fnPrefix}Run()">${t.rerun}</button><button onclick="${o.fnPrefix}Save()">${t.save}</button></div>`
    + renderComparisonTable(o.promoType, o.lang, o.ownLabel, o.ownParams, o.list) + renderVerdict(o.lang, o.result);
  else if (o.list && o.list.length) result = `<div class="ca-run"><button class="ca-prim" onclick="${o.fnPrefix}Run()">${t.run}</button></div>`;
  else result = `<div class="ca-hint">${esc(t.addHint)}</div>`;
  return `<div class="ca-panel">
    <div class="ca-sec-label">${esc(t.ownLabel)}</div><div class="ca-own-chips">${ownChips}</div>
    <div class="ca-sec-label">${esc(t.compLabel)}</div>${cards}
    ${o.searching ? `<div class="ca-hint" style="padding:12px 0">${esc(t.searching)}</div>` : addRow}
    ${result}
    <div class="ca-note">${esc(t.transparency)}</div>
  </div>`;
}

// wire() bundles the state machine + fetch/FeatureGate/save logic for one host
// (a Generator twin). cfg supplies the host-specific bits as functions:
//   { promoType, fnPrefix, areaId, nameInputId, lang(), region(), ownLabel(),
//     ownParams(), needGen?(), onToast? }.
// Returns { html, render, searchAI, addManual, setParam, remove, run, save }.
export function wire(cfg) {
  const state = { list: [], result: null, loading: false, searching: false };
  const toast = cfg.onToast || (() => {});
  const gate = async () => !window.FeatureGate || (await window.FeatureGate.ensure('competitorComparison'));
  const html = () => renderPanel({
    promoType: cfg.promoType, lang: cfg.lang(), ownLabel: cfg.ownLabel(), ownParams: cfg.ownParams(),
    list: state.list, result: state.result, loading: state.loading, searching: state.searching,
    fnPrefix: cfg.fnPrefix, nameInputId: cfg.nameInputId, needGen: cfg.needGen ? cfg.needGen() : false,
  });
  const render = () => { const el = document.getElementById(cfg.areaId); if (el) el.innerHTML = html(); };
  return {
    html, render,
    setParam(i, key, val) { if (state.list[i]) state.list[i].params[key] = val; },
    addManual() {
      if (state.list.length >= 3) { toast(strings(cfg.lang()).max); return; }
      const inp = document.getElementById(cfg.nameInputId);
      const name = (inp && inp.value.trim()) || (cfg.lang() === 'ru' ? 'Конкурент' : 'Competitor');
      state.list.push({ name, source: 'manual', params: {} }); state.result = null; render();
    },
    remove(i) { state.list.splice(i, 1); state.result = null; render(); },
    async searchAI() {
      if (!(await gate())) return;
      if (state.list.length >= 3) { toast(strings(cfg.lang()).max); return; }
      const inp = document.getElementById(cfg.nameInputId);
      const name = (inp && inp.value.trim()) || '';
      if (!name) { toast(strings(cfg.lang()).nameReq); return; }
      state.searching = true; render();
      try {
        const res = await fetch('/api/competitor/search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ casinoName: name, region: cfg.region(), promoType: cfg.promoType, uiLang: cfg.lang() }),
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || ('HTTP ' + res.status)); }
        const f = await res.json();
        state.list.push({ name: f.name, source: 'ai_search', confidence: f.confidence, sourceUrl: f.sourceUrl, params: f.params || {} });
        state.result = null;
        if (!f.found) toast(strings(cfg.lang()).notfound);
      } catch (e) { toast(e.message); }
      finally { state.searching = false; render(); }
    },
    async run() {
      if (!(await gate())) return;
      if (!state.list.length) return;
      state.loading = true; render();
      try {
        const body = {
          region: cfg.region(), promoType: cfg.promoType,
          ownOffer: { label: cfg.ownLabel(), params: cfg.ownParams() },
          competitors: state.list.map((x) => ({ name: x.name, source: x.source, confidence: x.confidence, sourceUrl: x.sourceUrl, params: x.params })),
          uiLang: cfg.lang(),
        };
        const res = await fetch('/api/competitor/compare', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || ('HTTP ' + res.status)); }
        state.result = await res.json();
      } catch (e) { state.result = { error: e.message }; }
      finally { state.loading = false; render(); }
    },
    save() {
      if (!state.result || state.result.error) return;
      const id = 'comp_' + Date.now().toString(36) + Math.round(Math.random() * 1e6).toString(36);
      const rec = {
        id, type: 'competitor-comparison', promoType: cfg.promoType,
        createdAt: new Date().toISOString(), region: cfg.region(),
        ownOffer: { label: cfg.ownLabel(), params: cfg.ownParams() }, competitors: state.list, result: state.result,
      };
      try {
        const arr = JSON.parse(localStorage.getItem('cfgSavedComparisons') || '[]');
        arr.push(rec); localStorage.setItem('cfgSavedComparisons', JSON.stringify(arr));
      } catch (e) {}
      if (window.RetomatRepo) window.RetomatRepo.mirror('competitor-comparisons', id, rec);
      toast(strings(cfg.lang()).saved);
    },
  };
}

export function strings(lang) { return T(lang); }

if (typeof window !== 'undefined') {
  window.CompetitorAnalysis = {
    PARAM_DEFS, parseNum, classifyCell, buildRows, renderComparisonTable, renderVerdict, esc,
    renderPanel, wire, strings,
  };
}
