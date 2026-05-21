import { z } from 'zod';

const ScenarioShape = z.object({
  id:  z.string().max(64),
  lbl: z.string().max(200).optional(),
  cat: z.string().max(100).optional(),
}).optional();

const ParamsShape = z.object({
  geo:        z.string().length(2),
  vertical:   z.enum(['casino', 'sports']).optional(),
  segment:    z.enum(['new', 'mid', 'vip']).optional(),
  games:      z.enum(['slots', 'table', 'live']).optional(),
  budget:     z.union([z.string().max(20), z.number()]).optional(),
  lang:       z.string().min(2).max(5).optional(),
  tone:       z.enum(['friendly', 'pro', 'aggressive']).optional(),
  agg:        z.enum(['low', 'mid', 'high']).optional(),
  risk:       z.enum(['low', 'mid', 'high']).optional(),
  bonusTypes: z.array(z.string().max(20)).max(6).optional(),
  lic:        z.enum(['auto','mga','ukgc','dga','curacao','anjouan','kahnawake','gibraltar','isle_of_man','none']).optional().default('auto'),
  players:    z.number().int().min(100).max(200000).optional(),
});

export const CampaignGenerateSchema = z.object({
  scenario: ScenarioShape,
  params:   ParamsShape,
});

export type CampaignGenerateInput = z.infer<typeof CampaignGenerateSchema>;
