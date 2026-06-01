import { repo } from './repository.js';

/**
 * Minimal observable store — no external libs.
 * State shape:
 *   campaigns: Campaign[]
 *   templates: CampaignTemplate[]
 *   filters:   { types: string[], segments: string[], geos: string[], statuses: string[] }
 *   view:      'month'|'week'|'list'
 *   loading:   boolean
 */

let state = {
  campaigns: [],
  templates: [],
  filters:   { types: [], segments: [], geos: [], statuses: [] },
  view:      'month',
  loading:   false,
};

const listeners = new Set();

export function getState() { return state; }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() { listeners.forEach(fn => fn(state)); }

function setState(patch) {
  state = { ...state, ...patch };
  notify();
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function loadAll() {
  setState({ loading: true });
  const [campaigns, templates] = await Promise.all([repo.listCampaigns(), repo.listTemplates()]);
  setState({ campaigns, templates, loading: false });
}

/** @param {import('./types.js').Campaign} data */
export async function upsertCampaign(data) {
  const saved = await repo.saveCampaign(data);
  const campaigns = state.campaigns.filter(c => c.id !== saved.id);
  campaigns.push(saved);
  setState({ campaigns });
  return saved;
}

/** @param {string} id */
export async function removeCampaign(id) {
  await repo.deleteCampaign(id);
  setState({ campaigns: state.campaigns.filter(c => c.id !== id) });
}

/** @param {import('./types.js').CampaignTemplate} data */
export async function upsertTemplate(data) {
  const saved = await repo.saveTemplate(data);
  const templates = state.templates.filter(t => t.id !== saved.id);
  templates.push(saved);
  setState({ templates });
  return saved;
}

/** @param {string} id */
export async function removeTemplate(id) {
  await repo.deleteTemplate(id);
  setState({ templates: state.templates.filter(t => t.id !== id) });
}

export function setFilters(filters) {
  setState({ filters: { ...state.filters, ...filters } });
}

export function setView(view) {
  setState({ view });
}
