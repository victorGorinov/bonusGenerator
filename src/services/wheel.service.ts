import { GEO_CFG }                                     from '../domain/campaign/scenarios.js';
import { deriveLocalFxRate }                            from '../domain/tournament/calcEconomics.js';
import { buildWheel, type WheelSegment }                from '../domain/wheel/buildWheel.js';
import { calcWheelEconomics }                           from '../domain/wheel/calcEconomics.js';
import type { WheelFrequency }                          from '../domain/wheel/presets.js';

export function generateWheel({ params }: { params: Record<string, unknown> }): Record<string, unknown> {
  const geoCode = String(params['geo'] || 'de');
  const geo     = GEO_CFG[geoCode] || GEO_CFG['de'];
  const resolvedLic = (params['lic'] && params['lic'] !== 'auto') ? String(params['lic']) : geo.lic;

  const sitecur = params['currency'] ? String(params['currency']) : geo.sitecur;
  const fxRate  = sitecur === geo.sitecur ? deriveLocalFxRate(sitecur, geoCode) : deriveLocalFxRate(sitecur);

  const segment = String(params['segment'] || 'depositors');
  const players = Number(params['players'] || 5000);
  // Default average deposit: $100 USD equivalent in selected currency.
  const avgDeposit = params['avgDeposit'] != null && params['avgDeposit'] !== ''
    ? Number(params['avgDeposit'])
    : Math.round(100 * fxRate);

  const preset    = String(params['preset'] || 'welcome');
  const frequency = params['frequency'] ? String(params['frequency']) as WheelFrequency : undefined;

  // User-tweaked segments arrive as an array of { prizeType, weight, prizeValue };
  // otherwise buildWheel materialises the preset defaults.
  const userSegments = Array.isArray(params['segments'])
    ? (params['segments'] as WheelSegment[])
    : undefined;

  const spec = buildWheel({ preset, avgDeposit, frequency, segments: userSegments });

  const econ = calcWheelEconomics({
    region:     geo.region,
    segment,
    players,
    avgDeposit,
    segments:   spec.segments,
    frequency:  spec.frequency,
    sitecur,
    geo:        geoCode,
    rtp:        params['rtp']   != null ? Number(params['rtp'])   : undefined,
    wager:      params['wager'] != null ? Number(params['wager']) : undefined,
  });

  return {
    spec,
    econ,
    params: { ...params, avgDeposit, lic: resolvedLic },
    cur:    sitecur,
    region: geo.region,
    lic:    resolvedLic,
  };
}
