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
  const players = ({ low: 1000, mid: 5000, high: 10000 } as Record<string, number>)[params.agg ?? ''] ?? 5000;
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
  const finalTypes  = requestedTypes.length ? requestedTypes : [scenarioType];
  const primaryType = finalTypes[0];

  const selectedMechanics: Record<string, unknown> = {};
  finalTypes.forEach(t => { if (allMechanics[t]) selectedMechanics[t] = allMechanics[t]; });

  return {
    mechanic:          selectedMechanics[primaryType],
    mechanicType:      primaryType,
    requestedTypes:    finalTypes,
    selectedMechanics,
    allMechanics,
    explanation:       campaignExplanation(id, primaryType, cfg, finalTypes, 'ru'),
    explanationRu:     campaignExplanation(id, primaryType, cfg, finalTypes, 'ru'),
    explanationEn:     campaignExplanation(id, primaryType, cfg, finalTypes, 'en'),
    alternatives:      campaignAlternatives(cfg, finalTypes, 'ru'),
    alternativesRu:    campaignAlternatives(cfg, finalTypes, 'ru'),
    alternativesEn:    campaignAlternatives(cfg, finalTypes, 'en'),
    econ:              cfg['econ'],
    wager:             cfg['wager'],
    fsSpec:            cfg['fsSpec'],
    contrib:           cfg['contrib'],
    reg:               cfg['reg'],
    cur:               cfg['cur'],
    r:                 cfg['r'],
  };
}
