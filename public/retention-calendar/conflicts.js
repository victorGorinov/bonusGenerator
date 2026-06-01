/**
 * Deterministic conflict detection — no AI required.
 * Two campaigns conflict when they:
 *   1. Have the same `type`
 *   2. Have the same `segment`
 *   3. Have overlapping date ranges
 *
 * @param {import('./types.js').Campaign[]} campaigns
 * @returns {Set<string>} set of campaign IDs involved in at least one conflict
 */
export function detectConflicts(campaigns) {
  const conflicted = new Set();
  for (let i = 0; i < campaigns.length; i++) {
    for (let j = i + 1; j < campaigns.length; j++) {
      const a = campaigns[i];
      const b = campaigns[j];
      if (a.type !== b.type || a.segment !== b.segment) continue;
      if (datesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) {
        conflicted.add(a.id);
        conflicted.add(b.id);
      }
    }
  }
  return conflicted;
}

/**
 * @param {string} aStart @param {string} aEnd
 * @param {string} bStart @param {string} bEnd
 * @returns {boolean}
 */
export function datesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}
