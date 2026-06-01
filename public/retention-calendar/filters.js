import { getState, setFilters } from './store.js';

/**
 * @param {import('./types.js').Campaign[]} campaigns
 * @param {{ types: string[], segments: string[], geos: string[], statuses: string[] }} filters
 * @returns {import('./types.js').Campaign[]}
 */
export function applyFilters(campaigns, filters) {
  return campaigns.filter(c => {
    if (filters.types.length    && !filters.types.includes(c.type))         return false;
    if (filters.segments.length && !filters.segments.includes(c.segment))   return false;
    if (filters.geos.length     && !filters.geos.includes(c.geo))           return false;
    if (filters.statuses.length && !filters.statuses.includes(c.status))    return false;
    return true;
  });
}

/** Toggle a value in a multi-select filter array */
export function toggleFilter(key, value) {
  const current = getState().filters[key] || [];
  const next    = current.includes(value)
    ? current.filter(v => v !== value)
    : [...current, value];
  setFilters({ [key]: next });
}

export function clearFilters() {
  setFilters({ types: [], segments: [], geos: [], statuses: [] });
}
