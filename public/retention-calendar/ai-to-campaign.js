/**
 * Maps AI generator responses → Campaign entity.
 * Dates from generators are initial defaults only — editable freely on calendar.
 */

function isoDate(d) { return d instanceof Date ? d.toISOString().slice(0, 10) : String(d); }

function nextMonday() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + ((day === 0 ? 1 : 8 - day)));
  return isoDate(d);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

const DURATION_DAYS = { flash: 1, daily: 1, weekly: 7, monthly: 30, multi_round: 10 };

const MECHANIC_TO_TYPE = {
  reload:      'reload',
  cashback:    'cashback',
  freespins:   'freespins',
  free_spins:  'freespins',
  vip:         'vip',
  reactivation:'reactivation',
  tournament:  'tournament',
  sportsbook:  'sportsbook',
};

/**
 * Map /api/campaign/generate response → Campaign draft.
 * @param {Object} aiResult   - full API response
 * @param {Object} params     - request params sent to /api/campaign/generate
 * @returns {import('./types.js').Campaign}
 */
export function campaignFromAI(aiResult, params) {
  const mechanic   = aiResult.mechanic || aiResult.mechanicType || '';
  const type       = MECHANIC_TO_TYPE[mechanic.toLowerCase()] || 'custom';
  const startDate  = nextMonday();
  const endDate    = addDays(startDate, 6);

  return {
    title:      `${mechanic || 'Campaign'} · ${(params.geo || '').toUpperCase()} / ${params.segment || 'all'}`,
    type,
    segment:    params.segment   || 'all',
    geo:        params.geo       || '',
    startDate,
    endDate,
    status:     'draft',
    brands:     ['default'],
    mechanic,
    rewards:    extractRewards(aiResult),
    econ:       aiResult.econ || null,
    sourceType: 'campaign_generator',
  };
}

/**
 * Map /api/tournament/generate response → Campaign draft.
 * @param {Object} result    - { spec, econ, params, cur, region }
 * @returns {import('./types.js').Campaign}
 */
export function tournamentFromAI(result) {
  const { spec, params, econ } = result;
  const duration   = params?.duration || 'weekly';
  const days       = DURATION_DAYS[duration] || 7;
  const startDate  = nextMonday();
  const endDate    = addDays(startDate, days - 1);

  return {
    title:      `${spec?.type || 'Tournament'} Tournament · ${(params?.geo || '').toUpperCase()}`,
    type:       'tournament',
    segment:    params?.segment  || 'all',
    geo:        params?.geo      || '',
    startDate,
    endDate,
    status:     'draft',
    brands:     ['default'],
    mechanic:   spec?.scoring    || '',
    rewards:    { prizePool: spec?.prizePool, currency: result.cur },
    econ:       econ || null,
    sourceType: 'tournament_generator',
  };
}

function extractRewards(aiResult) {
  const econ = aiResult.econ || {};
  return {
    bonusPct:    econ.bpct         || null,
    fsCount:     econ.fsSpec?.count|| null,
    cashbackPct: econ.cashback?.pct|| null,
  };
}
