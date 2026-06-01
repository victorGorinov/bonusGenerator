/**
 * Persistence abstraction — async-friendly interface so the implementation
 * can be swapped to Supabase/Postgres without changing UI code.
 *
 * MVP: LocalStorage backend.
 * Keys: 'rc_campaigns', 'rc_templates'
 */

const CAMPAIGNS_KEY  = 'rc_campaigns';
const TEMPLATES_KEY  = 'rc_templates';

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

// ── Campaigns ────────────────────────────────────────────────────────────────

/** @returns {Promise<import('./types.js').Campaign[]>} */
export function listCampaigns() {
  return Promise.resolve(readCollection(CAMPAIGNS_KEY));
}

/** @param {string} id @returns {Promise<import('./types.js').Campaign|undefined>} */
export function getCampaign(id) {
  const all = readCollection(CAMPAIGNS_KEY);
  return Promise.resolve(all.find(c => c.id === id));
}

/** @param {Omit<import('./types.js').Campaign,'id'|'createdAt'|'updatedAt'>} data @returns {Promise<import('./types.js').Campaign>} */
export function saveCampaign(data) {
  const all = readCollection(CAMPAIGNS_KEY);
  const ts  = now();
  if (data.id) {
    const idx = all.findIndex(c => c.id === data.id);
    const updated = { ...data, updatedAt: ts };
    if (idx >= 0) all[idx] = updated; else all.push({ ...updated, createdAt: ts });
    writeCollection(CAMPAIGNS_KEY, all);
    return Promise.resolve(updated);
  }
  const created = { ...data, id: genId(), createdAt: ts, updatedAt: ts };
  all.push(created);
  writeCollection(CAMPAIGNS_KEY, all);
  return Promise.resolve(created);
}

/** @param {string} id @returns {Promise<void>} */
export function deleteCampaign(id) {
  const all = readCollection(CAMPAIGNS_KEY).filter(c => c.id !== id);
  writeCollection(CAMPAIGNS_KEY, all);
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
  if (data.id) {
    const idx = all.findIndex(t => t.id === data.id);
    const updated = { ...data, updatedAt: ts };
    if (idx >= 0) all[idx] = updated; else all.push({ ...updated, createdAt: ts });
    writeCollection(TEMPLATES_KEY, all);
    return Promise.resolve(updated);
  }
  const created = { ...data, id: genId(), createdAt: ts };
  all.push(created);
  writeCollection(TEMPLATES_KEY, all);
  return Promise.resolve(created);
}

/** @param {string} id @returns {Promise<void>} */
export function deleteTemplate(id) {
  const all = readCollection(TEMPLATES_KEY).filter(t => t.id !== id);
  writeCollection(TEMPLATES_KEY, all);
  return Promise.resolve();
}

export const repo = {
  listCampaigns, getCampaign, saveCampaign, deleteCampaign,
  listTemplates, saveTemplate, deleteTemplate,
};
