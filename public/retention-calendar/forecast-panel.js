/**
 * Forecast panel for Retention Calendar.
 * Computes period forecast with cannibalization and renders the results panel.
 */

import { aggregateForecast, normalizeCampaign } from '../forecast.js';
import { getState }          from './store.js';
import { getCalendarPeriod } from './calendar.js';

// ── i18n helper ───────────────────────────────────────────────────────────────

function _t(key) {
  try {
    const lang = localStorage.getItem('bonusLang') || 'en';
    return window._NAV_I18N?.[lang]?.[key] ?? window._NAV_I18N?.en?.[key] ?? key;
  } catch { return key; }
}

// ── State ─────────────────────────────────────────────────────────────────────

let _visible   = false;
let _customStart = '';
let _customEnd   = '';
let _selectedDay = '';

// ── Public API ────────────────────────────────────────────────────────────────

export function initForecastPanel() {
  const existing = document.getElementById('fc-panel');
  if (existing) return;

  const panel = document.createElement('div');
  panel.id = 'fc-panel';
  panel.style.cssText = [
    'display:none',
    'position:absolute',
    'bottom:0',
    'left:0',
    'right:0',
    'z-index:30',
    'background:rgba(15,20,32,.96)',
    'backdrop-filter:blur(4px)',
    '-webkit-backdrop-filter:blur(4px)',
    'border-top:1px solid var(--border)',
    'border-radius:12px 12px 0 0',
    'box-shadow:0 -4px 24px rgba(0,0,0,.45)',
    'padding:14px 24px',
    'font-size:.82rem',
    'overflow-y:auto',
    'max-height:44vh',
  ].join(';');

  // Append to .main so position:absolute works within the relative container
  const main = document.querySelector('.main');
  if (main) main.appendChild(panel);
}

export function toggleForecastPanel() {
  _visible = !_visible;
  const panel = document.getElementById('fc-panel');
  const btn   = document.getElementById('fc-toggle-btn');
  if (!panel) return;
  panel.style.display = _visible ? 'block' : 'none';
  if (btn) btn.classList.toggle('active', _visible);
  if (_visible) refreshForecast();
}

export function refreshForecast() {
  if (!_visible) return;
  const panel = document.getElementById('fc-panel');
  if (!panel) return;
  panel.innerHTML = _renderPanel();
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function _getPeriod() {
  if (_customStart && _customEnd && _customStart <= _customEnd) {
    return { start: _customStart, end: _customEnd };
  }
  const cal = getCalendarPeriod();
  if (cal) return cal;
  const today = new Date().toISOString().slice(0, 10);
  const mo    = today.slice(0, 7);
  return { start: `${mo}-01`, end: today };
}

function _fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(Math.round(n));
}

function _fmtSigned(n) {
  if (!n) return '0';
  return (n > 0 ? '+' : '') + _fmt(n);
}

// Loss is always non-negative; show a bare '0' when zero, else a minus sign.
function _fmtLoss(n) {
  if (!n) return '0';
  return '−' + _fmt(n);
}

function _renderPanel() {
  const { campaigns } = getState();
  const period = _getPeriod();
  const f = aggregateForecast(campaigns, period.start, period.end);

  const isProfit = f.netProfit >= 0;
  const profitColor = isProfit ? 'var(--success)' : '#ef4444';

  // mini-bar chart (byDay — net in accent, overlap loss stacked in red).
  // Height is relative to max GROSS so net + overlap = full bar; every day in the
  // period renders a full-width column so the span is visible even on zero days.
  const BAR_H = 28;
  const maxGross = Math.max(...f.byDay.map(d => d.grossRevenue), 1);
  const barCaption = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap">
      <span style="font-size:.68rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">${_t('fc_chart_title')}</span>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:.66rem;color:var(--muted)">
        <span style="width:8px;height:8px;border-radius:2px;background:var(--accent);opacity:.7"></span>${_t('fc_net')}</span>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:.66rem;color:var(--muted)">
        <span style="width:8px;height:8px;border-radius:2px;background:#ef4444;opacity:.8"></span>${_t('fc_overlap')}</span>
      <span style="font-size:.64rem;color:var(--muted);opacity:.7;margin-left:auto;font-style:italic">${_t('fc_click_hint')}</span>
    </div>`;
  const barHtml = f.byDay.length > 0 ? barCaption + `
    <div style="display:flex;align-items:flex-end;gap:1px;height:38px;margin-bottom:10px;border-bottom:1px solid var(--border);padding-bottom:6px">
      ${f.byDay.map(d => {
        const totalH   = Math.round((d.grossRevenue / maxGross) * BAR_H);
        const overlapH = d.overlapLoss > 0 ? Math.max(1, Math.round((d.overlapLoss / maxGross) * BAR_H)) : 0;
        const netH     = Math.max(0, totalH - overlapH);
        const title    = `${d.date}: ${_t('fc_net')} ${_fmt(d.netRevenue)}` +
                         (d.overlapLoss > 0 ? ` · ${_t('fc_overlap')} −${_fmt(d.overlapLoss)}` : '');
        const selected = d.date === _selectedDay;
        const empty    = totalH === 0;
        // Empty days get a faint 2px baseline so the whole period axis stays visible.
        const fillHtml = empty
          ? `<div style="height:2px;background:var(--border);opacity:.6"></div>`
          : `${overlapH ? `<div style="height:${overlapH}px;background:#ef4444;opacity:${selected ? 1 : 0.8};border-radius:1px 1px 0 0"></div>` : ''}
             <div style="height:${netH}px;background:var(--accent);opacity:${selected ? 1 : 0.7};${overlapH ? '' : 'border-radius:1px 1px 0 0'}"></div>`;
        return `<div title="${title}" onclick="window._fcSelectDay('${d.date}')"
          style="flex:1;min-width:2px;height:${BAR_H + 4}px;display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer;border-radius:2px;${selected ? 'background:rgba(255,255,255,.10);outline:1px solid var(--accent)' : ''}">
          ${fillHtml}
        </div>`;
      }).join('')}
    </div>${_renderDayDetail(f, period)}` : '';

  // Pairs list
  const pairsHtml = f.pairs.length === 0 ? '' : `
    <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px">
      <div style="font-size:.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">
        ${_t('fc_pairs_title')}
      </div>
      ${f.pairs.slice(0, 5).map(p => `
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:.76rem">
          <span style="color:var(--muted);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                title="${p.reason}">${_esc(p.aTitle)} × ${_esc(p.bTitle)}</span>
          <span style="color:#ef4444;flex-shrink:0;font-weight:600">−${_fmt(p.loss)}</span>
        </div>`).join('')}
    </div>`;

  const coverageText = f.coverage.withoutEcon > 0
    ? ` · <span style="color:var(--muted)">${f.coverage.withoutEcon} ${_t('fc_no_econ')}</span>`
    : '';

  const today = new Date().toISOString().slice(0, 10);
  const mo = today.slice(0, 7);
  const defaultStart = _customStart || `${mo}-01`;
  const defaultEnd   = _customEnd   || period.end;

  return `
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
      <div style="font-size:.78rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">
        ${_t('fc_title')} · ${period.start} → ${period.end}
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-left:auto;flex-wrap:wrap">
        <span style="font-size:.7rem;color:var(--muted)">${_t('fc_range')}:</span>
        <input type="date" id="fc-start" value="${defaultStart}"
          style="background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:2px 6px;border-radius:5px;font-size:.72rem;font-family:inherit"
          onchange="window._fcRangeChange()">
        <span style="color:var(--muted);font-size:.7rem">→</span>
        <input type="date" id="fc-end" value="${defaultEnd}"
          style="background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:2px 6px;border-radius:5px;font-size:.72rem;font-family:inherit"
          onchange="window._fcRangeChange()">
        <button onclick="window._fcResetRange()"
          style="background:none;border:1px solid var(--border);color:var(--muted);padding:2px 7px;border-radius:5px;font-size:.7rem;cursor:pointer;font-family:inherit">
          ↺
        </button>
      </div>
    </div>

    ${barHtml}

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-bottom:10px">
      ${_card(_t('fc_gross'),    _fmt(f.gross),     '#e8eaf0')}
      ${_card(_t('fc_overlap') + _info(_t('fc_overlap_help')), _fmtLoss(f.overlapLoss), '#ef4444')}
      ${_card(_t('fc_net'),      _fmt(f.net),       'var(--success)')}
      ${_card(_t('fc_profit'),   _fmtSigned(f.netProfit), profitColor)}
    </div>

    <div style="font-size:.73rem;color:var(--muted)">
      ${_t('fc_coverage')}: ${f.coverage.withEcon} / ${f.coverage.total}${coverageText}
    </div>

    ${pairsHtml}
  `;
}

function _dayInRange(date, start, end) {
  return date >= start && date <= end;
}

function _inclDays(start, end) {
  return Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1);
}

// Small help glyph that shows the explanation in an alert on click.
function _info(text) {
  return `<span data-info="${_esc(text)}" onclick="window._fcShowInfo(event, this)" style="display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border:1px solid var(--muted);border-radius:50%;font-size:.6rem;color:var(--muted);cursor:pointer;margin-left:4px;line-height:1">i</span>`;
}

function _renderDayDetail(f, period) {
  if (!_selectedDay) return '';
  const day = f.byDay.find(d => d.date === _selectedDay);
  if (!day) return '';

  // Normalize current campaigns to resolve per-activity daily revenue + pair overlaps.
  const { campaigns } = getState();
  const acts = campaigns.map(normalizeCampaign).filter(Boolean)
    .filter(a => a.startDate <= period.end && a.endDate >= period.start);
  const byId = new Map(acts.map(a => [a.id, a]));

  const activeIds = new Set(day.activityIds);
  const activeRows = [...activeIds].map(id => {
    const a = byId.get(id);
    if (!a) return null;
    const dur = Math.max(1, Math.round((Date.parse(a.endDate) - Date.parse(a.startDate)) / 86_400_000) + 1);
    return { title: a.title, type: a.type, daily: Math.round(a.incrementalRevenue / dur) };
  }).filter(Boolean).sort((x, y) => y.daily - x.daily);

  // Pairs whose shared overlap window covers the selected day, with that day's share of the loss.
  const dayPairs = f.pairs.map(p => {
    const a = byId.get(p.aId), b = byId.get(p.bId);
    if (!a || !b) return null;
    const oStart = a.startDate > b.startDate ? a.startDate : b.startDate;
    const oEnd   = a.endDate   < b.endDate   ? a.endDate   : b.endDate;
    const cStart = oStart > period.start ? oStart : period.start;
    const cEnd   = oEnd   < period.end   ? oEnd   : period.end;
    if (!_dayInRange(_selectedDay, cStart, cEnd)) return null;
    const dailyLoss = Math.round(p.loss / _inclDays(cStart, cEnd));
    return { ...p, dailyLoss };
  }).filter(Boolean);

  const activeHtml = activeRows.length === 0
    ? `<div style="font-size:.74rem;color:var(--muted)">${_t('fc_day_none')}</div>`
    : activeRows.map(r => `
        <div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;font-size:.76rem">
          <span style="color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(r.title)}</span>
          <span style="color:var(--success);flex-shrink:0">${_fmt(r.daily)}</span>
        </div>`).join('');

  const pairsHtml = dayPairs.length === 0 ? '' : `
    <div style="margin-top:8px">
      <div style="display:flex;align-items:center;font-size:.66rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${_t('fc_overlap')}${_info(_t('fc_overlap_help'))}</div>
      ${dayPairs.map(p => `
        <div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;font-size:.74rem">
          <span style="color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${_esc(p.reason)}">${_esc(p.aTitle)} × ${_esc(p.bTitle)}</span>
          <span style="color:#ef4444;flex-shrink:0;font-weight:600">${_fmtLoss(p.dailyLoss)}</span>
        </div>`).join('')}
    </div>`;

  return `
    <div style="background:var(--bg3);border:1px solid var(--accent);border-radius:8px;padding:10px 12px;margin-bottom:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:.8rem;font-weight:700;color:var(--text)">${day.date}</span>
        <button onclick="window._fcSelectDay('')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.9rem;line-height:1">×</button>
      </div>
      <div style="display:flex;gap:14px;margin-bottom:8px;font-size:.78rem">
        <span>${_t('fc_gross')}: <b>${_fmt(day.grossRevenue)}</b></span>
        <span style="color:#ef4444;display:inline-flex;align-items:center">${_t('fc_overlap')}: <b style="margin-left:3px">${_fmtLoss(day.overlapLoss)}</b>${_info(_t('fc_overlap_help'))}</span>
        <span style="color:var(--success)">${_t('fc_net')}: <b>${_fmt(day.netRevenue)}</b></span>
      </div>
      <div style="font-size:.66rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${_t('fc_day_active')}</div>
      ${activeHtml}
      ${pairsHtml}
    </div>`;
}

function _card(label, value, color) {
  return `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:8px 12px">
      <div style="font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">${label}</div>
      <div style="font-size:1.15rem;font-weight:700;color:${color}">${value}</div>
    </div>`;
}

function _esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Global handlers for inline onclick in rendered HTML ───────────────────────

window._fcRangeChange = () => {
  _customStart = document.getElementById('fc-start')?.value || '';
  _customEnd   = document.getElementById('fc-end')?.value   || '';
  if (_customStart && _customEnd && _customStart <= _customEnd) {
    refreshForecast();
  }
};

window._fcResetRange = () => {
  _customStart = '';
  _customEnd   = '';
  _selectedDay = '';
  refreshForecast();
};

window._fcSelectDay = (date) => {
  _selectedDay = (date && date === _selectedDay) ? '' : (date || '');
  refreshForecast();
};

window._fcShowInfo = (ev, el) => {
  if (ev) ev.stopPropagation();        // don't toggle the day selection underneath
  alert(el?.getAttribute('data-info') || '');
};
