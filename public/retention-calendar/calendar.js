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
    const color = TYPE_COLORS[c.type] || TYPE_COLORS.custom;
    cal.addEvent({
      id:        c.id,
      title:     c.title,
      start:     c.startDate,
      // FullCalendar end date is exclusive, add 1 day for all-day events
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
  }
}

function addDay(dateStr) {
  const d = new Date(dateStr);
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
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function subtractDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function setCalendarView(view) {
  if (cal) cal.changeView(view);
}

export function refetchCalendar() {
  syncEvents();
}
