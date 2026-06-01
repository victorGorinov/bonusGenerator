import { GEO_CFG }                                    from '../domain/campaign/scenarios.js';
import { calcTournamentEconomics, deriveLocalFxRate } from '../domain/tournament/calcEconomics.js';

export function generateTournament({ type, params }: { type: string; params: Record<string, unknown> }): Record<string, unknown> {
  const geo      = GEO_CFG[String(params['geo'] || 'de')] || GEO_CFG['de'];
  const resolvedLic = (params['lic'] && params['lic'] !== 'auto')
    ? String(params['lic']) : geo.lic;

  // Default prize pool: $300 USD equivalent in local currency (avoids absurd ROI for KZT/MNT)
  const geoCode = String(params['geo'] || 'de');
  const fxRate  = deriveLocalFxRate(geo.sitecur, geoCode);
  const prizePool = params['prizePool'] != null && params['prizePool'] !== ''
    ? Number(params['prizePool'])
    : Math.round(300 * fxRate);
  const poolModel = String(params['poolModel'] || 'fixed');
  const rake      = Number(params['rake']      || 0);
  const duration  = String(params['duration']  || 'weekly');
  const segment   = String(params['segment']   || 'all');
  const econ    = calcTournamentEconomics({
    region:      geo.region,
    segment,
    duration,
    prizePool,
    poolModel,
    rake,
    sitecur:     geo.sitecur,
    geo:         geoCode,
    totalPlayers: Number(params['totalPlayers'] || 5000),
  });

  const PRIZE_SCHEMAS: Record<string, { places: number[]; pct: number[] }> = {
    top_n:        { places: [1, 2, 3, 4, 5], pct: [30, 20, 15, 10, 5] },
    linear_decay: { places: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], pct: [25, 18, 13, 10, 8, 6, 5, 4, 3, 2] },
    flat_tier:    { places: [1, 2, 3, 4, 5], pct: [20, 20, 15, 15, 10] },
    prize_drop:   { places: [1, 2, 3], pct: [33, 33, 34] },
  };

  const dist    = String(params['distribution'] || 'top_n');
  const schema  = PRIZE_SCHEMAS[dist] || PRIZE_SCHEMAS['top_n'];
  const prizes  = schema.places.map((place, i) => ({
    place,
    pct:    schema.pct[i],
    amount: Math.round(econ.prizePoolCost * schema.pct[i] / 100),
    cur:    geo.sitecur,
  }));

  const spec = {
    type,
    prizePool: econ.prizePoolCost,
    cur:       geo.sitecur,
    prizes,
    entryModel:   String(params['entryModel']   || 'freeroll'),
    scoring:      String(params['scoring']       || 'total_wins'),
    duration,
    poolModel,
    rake:         rake || undefined,
    distribution: dist,
    reentry:      String(params['reentry']       || 'single'),
  };

  return {
    spec,
    econ,
    params: { ...params, lic: resolvedLic },
    cur:    geo.sitecur,
    region: geo.region,
    lic:    resolvedLic,
  };
}
