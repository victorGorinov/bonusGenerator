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
  },
  ru: {
    param: 'Параметр', you: 'Retomat (вы)', gen: '⚙️ сгенерировано', aiSrc: '🔍 AI-поиск', manSrc: '✍️ вручную',
    win: '▲ сильнее', lose: '▼ конкурент', par: '= на уровне', strategic: '≈ стратегия', na: '—',
    legWin: 'Retomat выгоднее', legPar: 'на уровне / стратегия', legLose: 'конкурент выгоднее',
    verdict: 'Вердикт AI', strengths: '▲ Сильные стороны', weaknesses: '▼ Слабые стороны', recs: 'Рекомендации по усилению',
    benchmark: 'Бенчмарк', current: 'сейчас', suggested: 'предложение',
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

if (typeof window !== 'undefined') {
  window.CompetitorAnalysis = {
    PARAM_DEFS, parseNum, classifyCell, buildRows, renderComparisonTable, renderVerdict, esc,
  };
}
