import { buildConfig }                              from '../domain/bonus/buildConfig.js';
import { GEO_CFG }                                 from '../domain/campaign/scenarios.js';
import { campaignExplanation, campaignAlternatives } from '../domain/campaign/explanation.js';

interface ScenarioRef { id?: string; lbl?: string; cat?: string }
interface CampaignParams {
  geo?: string;
  segment?: string;
  agg?: string;
  games?: string;
  risk?: string;
  bonusTypes?: string[];
  lang?: string;
  tone?: string;
  lic?: string;
  players?: number;
}

export function generateCampaign({ scenario, params }: { scenario?: ScenarioRef | null; params?: CampaignParams | null }): Record<string, unknown> {
  if (!params || typeof params !== 'object') throw new Error('params required');

  const geoCfg  = GEO_CFG[String(params.geo || 'de')] || GEO_CFG['de'];
  const resolvedLic = (params.lic && params.lic !== 'auto') ? params.lic : geoCfg.lic;
  // Use geo-specific avgdep when defined (e.g. RUB, KZT, MNT, DKK).
  // Fall back to EUR-calibrated defaults for EUR/GBP/USD geos.
  const BASE_AVGDEP: Record<string, number> = { new: 40, mid: 100, vip: 500 };
  const segAvgdep = geoCfg.avgdep ?? BASE_AVGDEP;
  const seg = params.segment ?? 'mid';
  const avgdep  = segAvgdep[seg as keyof typeof segAvgdep] ?? BASE_AVGDEP[seg] ?? 100;
  const aggPlayers = ({ low: 1000, mid: 5000, high: 10000 } as Record<string, number>)[params.agg ?? ''] ?? 5000;
  const players = (params.players && params.players >= 100) ? params.players : aggPlayers;
  const rtp     = ({ slots: 96, table: 98, live: 99 } as Record<string, number>)[params.games ?? ''] ?? 96;

  const RISK_ADJ: Record<string, number> = { low: 10, mid: 0, high: -8 };
  const riskAdj  = RISK_ADJ[params.risk ?? ''] ?? 0;

  const cfg = buildConfig({ ...geoCfg, lic: resolvedLic, players, avgdep, plat: 'both', rtp, riskAdj });

  const id = String(scenario?.id || 'inactive_7');
  let scenarioType: string;
  if (['first_dep', 'first_launch'].includes(id))                                       scenarioType = 'welcome';
  else if (id === 'second_dep')                                                          scenarioType = 'dep2';
  else if (['cashback', 'return_loss', 'vip_retention', 'vip_reactivation'].includes(id)) scenarioType = 'cashback';
  else                                                                                   scenarioType = 'reload';

  const allMechanics: Record<string, unknown> = {
    welcome:  cfg['welcome'],
    ndb:      cfg['ndb'],
    reload:   cfg['reload'],
    dep2:     cfg['dep2'],
    dep3:     cfg['dep3'],
    cashback: cfg['cashback'],
  };

  const validTypes = new Set(Object.keys(allMechanics));
  const requestedTypes = Array.isArray(params.bonusTypes) && params.bonusTypes.length > 0
    ? params.bonusTypes.filter(t => validTypes.has(t) && allMechanics[t])
    : [scenarioType];
  const finalTypes = requestedTypes.length ? requestedTypes : [scenarioType];

  // Reload is a retention mechanic — strip it from acquisition scenarios
  const isFirstLaunch = ['first_dep', 'first_launch'].includes(id);
  const effectiveTypes = isFirstLaunch
    ? (finalTypes.filter(t => t !== 'reload').length ? finalTypes.filter(t => t !== 'reload') : finalTypes)
    : finalTypes;

  const primaryType = effectiveTypes[0];

  const selectedMechanics: Record<string, unknown> = {};
  effectiveTypes.forEach(t => { if (allMechanics[t]) selectedMechanics[t] = allMechanics[t]; });

  const uiLang: 'ru' | 'en' = params.lang === 'ru' ? 'ru' : 'en';

  return {
    mechanic:          selectedMechanics[primaryType],
    mechanicType:      primaryType,
    requestedTypes:    effectiveTypes,
    selectedMechanics,
    allMechanics,
    explanation:       campaignExplanation(id, primaryType, cfg, effectiveTypes, uiLang),
    explanationRu:     campaignExplanation(id, primaryType, cfg, effectiveTypes, 'ru'),
    explanationEn:     campaignExplanation(id, primaryType, cfg, effectiveTypes, 'en'),
    alternatives:      campaignAlternatives(cfg, effectiveTypes, uiLang),
    alternativesRu:    campaignAlternatives(cfg, effectiveTypes, 'ru'),
    alternativesEn:    campaignAlternatives(cfg, effectiveTypes, 'en'),
    econ:              cfg['econ'],
    wager:             cfg['wager'],
    fsSpec:            cfg['fsSpec'],
    contrib:           cfg['contrib'],
    reg:               cfg['reg'],
    cur:               cfg['cur'],
    r:                 cfg['r'],
  };
}
