import { upsertCampaign, upsertTemplate, getState } from './store.js';

const TEMPLATE_FIELDS = ['type','segment','geo','mechanic','rewards','notes','tags'];

/**
 * Save a campaign as a reusable template.
 * @param {import('./types.js').Campaign} campaign
 * @param {string} name
 * @returns {Promise<import('./types.js').CampaignTemplate>}
 */
export function saveAsTemplate(campaign, name) {
  const data = { name };
  for (const f of TEMPLATE_FIELDS) if (campaign[f] != null) data[f] = campaign[f];
  return upsertTemplate(data);
}

/**
 * Create a new campaign draft from a template.
 * @param {import('./types.js').CampaignTemplate} template
 * @param {{ startDate: string, endDate: string }} dates
 * @returns {Promise<import('./types.js').Campaign>}
 */
export function createFromTemplate(template, dates) {
  const { name, id: _id, createdAt: _c, ...rest } = template;
  return upsertCampaign({
    ...rest,
    title:      name,
    startDate:  dates.startDate,
    endDate:    dates.endDate,
    status:     'draft',
    brands:     ['default'],
    sourceType: 'manual',
  });
}

/**
 * Duplicate an existing campaign (offsets dates by 7 days).
 * @param {import('./types.js').Campaign} campaign
 * @returns {Promise<import('./types.js').Campaign>}
 */
export function duplicateCampaign(campaign) {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = campaign;
  const shift = (d) => {
    const date = new Date(d);
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  };
  return upsertCampaign({
    ...rest,
    title:     `${campaign.title} (copy)`,
    startDate: shift(campaign.startDate),
    endDate:   shift(campaign.endDate),
    status:    'draft',
  });
}

/** @returns {import('./types.js').CampaignTemplate[]} */
export function getTemplates() {
  return getState().templates;
}
