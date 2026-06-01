/**
 * refreshCatalog.ts — updates slotRank + rtp in catalog.json from Slotcatalog.com.
 *
 * Usage: tsx scripts/refreshCatalog.ts
 *
 * Phase 1: stub — prints a reminder and exits cleanly.
 * Phase 2: implement per-geo fetch from Slotcatalog.com rankings page,
 *           parse SlotRank/RTP, merge with hand-curated tag data,
 *           write updated catalog.json (preserving mechanic/volatility/segments/minBetTier).
 *
 * Notes:
 *   - This is a build-time script, NOT called from the request path.
 *   - Respect robots.txt / ToS; cache responses; add delay between requests.
 *   - Preserve all hand-curated fields (mechanic, volatility, segments, minBetTier).
 *     Only overwrite: slotRank, rtp, regions (availability).
 */

const SUPPORTED_GEOS = ['de','fr','es','it','nl','dk','uk','ru','kz','us','mn','mx','br'];

console.log('refreshCatalog — Phase 1 stub');
console.log('');
console.log('Supported geos:', SUPPORTED_GEOS.join(', '));
console.log('');
console.log('TODO (Phase 2):');
console.log('  1. Fetch https://slotcatalog.com/en/slots?country=<geo> for each geo');
console.log('  2. Parse: game name, provider, RTP, SlotRank position');
console.log('  3. Merge with existing catalog.json (preserve hand-curated tags)');
console.log('  4. Write src/config/games/catalog.json (stable key order)');
console.log('');
console.log('Day-1 snapshot is already in src/config/games/catalog.json.');
console.log('Run this script after implementing Phase 2 to keep rankings fresh.');
