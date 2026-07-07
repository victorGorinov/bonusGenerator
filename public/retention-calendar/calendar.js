import { Calendar }     from '@fullcalendar/core';
import dayGridPlugin    from '@fullcalendar/daygrid';
import timeGridPlugin   from '@fullcalendar/timegrid';
import listPlugin       from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { TYPE_COLORS }  from './types.js';
import { applyFilters } from './filters.js';
import { detectConflicts } from './conflicts.js';
import { getState, subscribe, upsertCampaign } from './store.js';

let cal = null;

/**
 * @param {Function} onEventClick  called with campaign id
 * @param {Function} onDateClick   called with ISO date string (YYYY-MM-DD)
 */
export function initCalendar(el, onEventClick, onDateClick) {
  cal = new Calendar(el, {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: window.innerWidth < 640 ? 'listMonth' : 'dayGridMonth',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  '',
    },
    buttonText: {
      prev:  '‹',
      next:  '›',
      today: (function() { try { return localStorage.getItem('bonusLang') === 'ru' ? 'Сегодня' : 'Today'; } catch(e) { return 'Today'; } })(),
    },
    height:      '100%',
    editable:    true,
    eventResizableFromStart: true,
    eventDrop:   handleDrop,
    eventResize: handleResize,
    eventClick:  (info) => onEventClick(info.event.id),
    dateClick:   (info) => onDateClick && onDateClick(info.dateStr),
    events:      [],
    eventDidMount: (info) => {
      const { extendedProps } = info.event;
      if (extendedProps.conflict) {
        info.el.title = 'Potential overlap detected';
        info.el.style.outline = '2px solid #EF4444';
      }
    },
  });
  cal.render();

  // Re-render events whenever store changes
  subscribe(() => syncEvents());
  syncEvents();

  return cal;
}

function syncEvents() {
  if (!cal) return;
  const { campaigns, filters } = getState();
  const visible    = applyFilters(campaigns, filters);
  const conflicted = detectConflicts(visible);

  cal.removeAllEvents();
  for (const c of visible) {
    // A record with a missing/invalid startDate can't be placed — skip it rather
    // than let it throw and abort the whole render (which bricks the calendar:
    // stats stay "Loading…", view toggle never wires up). Guards against legacy
    // or partially-saved campaigns in localStorage.
    if (!isValidDate(c.startDate)) continue;
    const color = TYPE_COLORS[c.type] || TYPE_COLORS.custom;
    try {
      cal.addEvent({
        id:        c.id,
        title:     c.title,
        start:     c.startDate,
        // FullCalendar end date is exclusive, add 1 day for all-day events.
        // addDay returns undefined for a bad endDate → FullCalendar treats it as
        // a single-day event instead of crashing.
        end:       addDay(c.endDate),
        color,
        textColor: '#fff',
        extendedProps: {
          type:     c.type,
          segment:  c.segment,
          geo:      c.geo,
          status:   c.status,
          conflict: conflicted.has(c.id),
        },
      });
    } catch (e) {
      // One malformed record must never take down the calendar.
      console.warn('Skipped calendar event with bad data:', c && c.id, e);
    }
  }
}

function isValidDate(dateStr) {
  return !!dateStr && !Number.isNaN(new Date(dateStr).getTime());
}

function addDay(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return undefined; // invalid/missing → omit end (single-day)
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function handleDrop(info) {
  const state = getState();
  const c = state.campaigns.find(x => x.id === info.event.id);
  if (!c) return;
  const newStart = info.event.startStr.slice(0, 10);
  const duration = daysBetween(c.startDate, c.endDate);
  const newEnd   = addDays(newStart, duration);
  await upsertCampaign({ ...c, startDate: newStart, endDate: newEnd });
}

async function handleResize(info) {
  const state = getState();
  const c = state.campaigns.find(x => x.id === info.event.id);
  if (!c) return;
  const newStart = info.event.startStr.slice(0, 10);
  // FullCalendar end is exclusive — subtract 1 day
  const endExcl  = info.event.endStr ? info.event.endStr.slice(0, 10) : newStart;
  const newEnd   = subtractDay(endExcl);
  await upsertCampaign({ ...c, startDate: newStart, endDate: newEnd });
}

function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a);
  return Number.isNaN(ms) ? 0 : Math.round(ms / 86400000); // bad/missing date → 0-day span
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime()) || Number.isNaN(n)) return dateStr; // don't produce an Invalid Date
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function subtractDay(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function setCalendarView(view) {
  if (cal) cal.changeView(view);
}

export function refetchCalendar() {
  syncEvents();
}

/** Returns the ISO date strings for the current calendar view's active window. */
export function getCalendarPeriod() {
  if (!cal) return null;
  const view = cal.view;
  return {
    start: view.activeStart.toISOString().slice(0, 10),
    end:   new Date(view.activeEnd.getTime() - 86_400_000).toISOString().slice(0, 10),
  };
}
