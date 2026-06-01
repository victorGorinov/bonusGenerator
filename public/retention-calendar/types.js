/**
 * @typedef {'reload'|'cashback'|'freespins'|'tournament'|'vip'|'reactivation'|'sportsbook'|'custom'} CampaignType
 * @typedef {'draft'|'scheduled'|'active'|'completed'|'cancelled'} CampaignStatus
 *
 * @typedef {Object} Campaign
 * @property {string} id
 * @property {string} title
 * @property {CampaignType} type
 * @property {string} segment        - 'all'|'new'|'vip'|'dormant'|'depositors'
 * @property {string} geo
 * @property {string} startDate      - ISO date YYYY-MM-DD
 * @property {string} endDate        - ISO date YYYY-MM-DD (inclusive)
 * @property {CampaignStatus} status
 * @property {string[]} brands       - single-brand MVP: always ['default']
 * @property {string} [mechanic]
 * @property {Object} [rewards]      - { prizePool?, bonusPct?, fsCount?, cashbackPct? }
 * @property {string} [notes]
 * @property {string[]} [tags]
 * @property {Object} [econ]         - economics snapshot from generator
 * @property {string} [sourceType]   - 'manual'|'campaign_generator'|'tournament_generator'|'ai'
 * @property {string} [sourceId]
 * @property {string} createdAt      - ISO datetime
 * @property {string} updatedAt      - ISO datetime
 */

/**
 * @typedef {Object} CampaignTemplate
 * @property {string} id
 * @property {string} name
 * @property {CampaignType} type
 * @property {string} segment
 * @property {string} geo
 * @property {string} [mechanic]
 * @property {Object} [rewards]
 * @property {string} [notes]
 * @property {string[]} [tags]
 * @property {string} createdAt
 */

/** Color map by campaign type */
export const TYPE_COLORS = {
  tournament:   '#3B82F6',
  reload:       '#06B6D4',
  cashback:     '#10B981',
  freespins:    '#F97316',
  vip:          '#F59E0B',
  reactivation: '#7C3AED',
  sportsbook:   '#EA580C',
  custom:       '#6B7280',
};

export const CAMPAIGN_TYPES = [
  { val: 'reload',       lbl: 'Reload Bonus' },
  { val: 'cashback',     lbl: 'Cashback' },
  { val: 'freespins',    lbl: 'Free Spins' },
  { val: 'tournament',   lbl: 'Tournament' },
  { val: 'vip',          lbl: 'VIP' },
  { val: 'reactivation', lbl: 'Reactivation' },
  { val: 'sportsbook',   lbl: 'Sportsbook' },
  { val: 'custom',       lbl: 'Custom' },
];

export const CAMPAIGN_STATUSES = [
  { val: 'draft',     lbl: 'Draft' },
  { val: 'scheduled', lbl: 'Scheduled' },
  { val: 'active',    lbl: 'Active' },
  { val: 'completed', lbl: 'Completed' },
  { val: 'cancelled', lbl: 'Cancelled' },
];

export const SEGMENTS = [
  { val: 'all',        lbl: 'All Players' },
  { val: 'new',        lbl: 'New Players' },
  { val: 'vip',        lbl: 'VIP' },
  { val: 'dormant',    lbl: 'Dormant' },
  { val: 'depositors', lbl: 'Depositors' },
];
