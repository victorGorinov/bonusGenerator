import { asyncHandler }               from '../middleware/asyncHandler.js';
import { AIProviderError }             from '../errors/AIProviderError.js';
import { generateCampaign, generateCampaignTexts, generateCampaignDescription, auditCampaign, optimizeCampaign } from '../use-cases/GenerateCampaign.js';
import type { AIProvider }             from '../ai/interface.js';
import type { CampaignGenerateInput }  from '../validation/campaign.schema.js';
import type { TextsInput }             from '../validation/texts.schema.js';
import type { DescriptionInput }       from '../validation/description.schema.js';
import type { AuditInput }             from '../validation/audit.schema.js';
import type { OptimizeInput }          from '../validation/optimize.schema.js';

interface Deps { ai: AIProvider }

export function createCampaignController({ ai }: Deps) {
  return {
    generate: asyncHandler<Record<string, never>, unknown, CampaignGenerateInput>(
      async (req, res) => {
        res.json(generateCampaign(req.body));
      },
    ),

    texts: asyncHandler<Record<string, never>, unknown, TextsInput>(
      async (req, res) => {
        try {
          res.json(await generateCampaignTexts(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),

    description: asyncHandler<Record<string, never>, unknown, DescriptionInput>(
      async (req, res) => {
        try {
          res.json(await generateCampaignDescription(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),

    audit: asyncHandler<Record<string, never>, unknown, AuditInput>(
      async (req, res) => {
        try {
          res.json(await auditCampaign(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),

    optimize: asyncHandler<Record<string, never>, unknown, OptimizeInput>(
      async (req, res) => {
        try {
          res.json(await optimizeCampaign(req.body, ai));
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),
  };
}
