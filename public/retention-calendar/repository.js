/**
 * Persistence abstraction — async interface so the backend can be swapped
 * without touching UI code (store.js/calendar.js only call these functions).
 *
 * Model (Phase 3): localStorage is the working cache. For a logged-in user every
 * write is additionally MIRRORED to the Postgres API (/api/saved/calendar-*).
 * Reads stay local — nav-utils.js owns the migrate+hydrate sync for ALL data
 * collections on page load (so the guest→account migration runs before anything
 * overwrites the cache) and fires 'retomat:synced'; retention-calendar.js reloads
 * the store on that event. Keeping localStorage authoritative-as-cache means
 * reports.js (which reads rc_campaigns directly) needs no changes.
 *
 * Keys: 'rc_campaigns' → calendar-events, 'rc_templates' → calendar-templates
 */

const CAMPAIGNS_KEY    = 'rc_campaigns';
const TEMPLATES_KEY    = 'rc_templates';
const EVENTS_ENTITY    = 'calendar-events';
const TEMPLATES_ENTITY = 'calendar-templates';

function readCollection(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function writeCollection(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function now() { return new Date().toISOString(); }
function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Server mirror — no-op for guests / when RetomatRepo isn't loaded.
function mirror(entity, id, data) {
  try { window.RetomatRepo && window.RetomatRepo.mirror(entity, id, data); } catch (_e) {}
}
function unmirror(entity, id) {
  try { window.RetomatRepo && window.RetomatRepo.unmirror(entity, id); } catch (_e) {}
}

// ── Campaigns ────────────────────────────────────────────────────────────────

/** @returns {Promise<import('./types.js').Campaign[]>} */
export function listCampaigns() {
  return Promise.resolve(readCollection(CAMPAIGNS_KEY));
}

/** @param {string} id @returns {Promise<import('./types.js').Campaign|undefined>} */
export function getCampaign(id) {
  return Promise.resolve(readCollection(CAMPAIGNS_KEY).find(c => c.id === id));
}

/** @param {Omit<import('./types.js').Campaign,'id'|'createdAt'|'updatedAt'>} data @returns {Promise<import('./types.js').Campaign>} */
export function saveCampaign(data) {
  const all = readCollection(CAMPAIGNS_KEY);
  const ts  = now();
  let record;
  if (data.id) {
    const idx = all.findIndex(c => c.id === data.id);
    record = idx >= 0 ? { ...all[idx], ...data, updatedAt: ts } : { ...data, createdAt: ts, updatedAt: ts };
    if (idx >= 0) all[idx] = record; else all.push(record);
  } else {
    record = { ...data, id: genId(), createdAt: ts, updatedAt: ts };
    all.push(record);
  }
  writeCollection(CAMPAIGNS_KEY, all);
  mirror(EVENTS_ENTITY, record.id, record);
  return Promise.resolve(record);
}

/** @param {string} id @returns {Promise<void>} */
export function deleteCampaign(id) {
  writeCollection(CAMPAIGNS_KEY, readCollection(CAMPAIGNS_KEY).filter(c => c.id !== id));
  unmirror(EVENTS_ENTITY, id);
  return Promise.resolve();
}

// ── Templates ────────────────────────────────────────────────────────────────

/** @returns {Promise<import('./types.js').CampaignTemplate[]>} */
export function listTemplates() {
  return Promise.resolve(readCollection(TEMPLATES_KEY));
}

/** @param {Omit<import('./types.js').CampaignTemplate,'id'|'createdAt'>} data @returns {Promise<import('./types.js').CampaignTemplate>} */
export function saveTemplate(data) {
  const all = readCollection(TEMPLATES_KEY);
  const ts  = now();
  let record;
  if (data.id) {
    const idx = all.findIndex(t => t.id === data.id);
    record = idx >= 0 ? { ...all[idx], ...data, updatedAt: ts } : { ...data, createdAt: ts };
    if (idx >= 0) all[idx] = record; else all.push(record);
  } else {
    record = { ...data, id: genId(), createdAt: ts };
    all.push(record);
  }
  writeCollection(TEMPLATES_KEY, all);
  mirror(TEMPLATES_ENTITY, record.id, record);
  return Promise.resolve(record);
}

/** @param {string} id @returns {Promise<void>} */
export function deleteTemplate(id) {
  writeCollection(TEMPLATES_KEY, readCollection(TEMPLATES_KEY).filter(t => t.id !== id));
  unmirror(TEMPLATES_ENTITY, id);
  return Promise.resolve();
}

export const repo = {
  listCampaigns, getCampaign, saveCampaign, deleteCampaign,
  listTemplates, saveTemplate, deleteTemplate,
};
