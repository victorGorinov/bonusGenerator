import { asyncHandler }            from '../middleware/asyncHandler.js';
import { AIProviderError }         from '../errors/AIProviderError.js';
import { buildReportSummaryPrompt } from '../ai/prompts/report-summary.prompt.js';
import type { AIProvider }         from '../ai/interface.js';
import type { ReportSummaryInput } from '../validation/report.schema.js';

interface Deps { ai: AIProvider }

export function createReportController({ ai }: Deps) {
  return {
    summary: asyncHandler<Record<string, never>, unknown, ReportSummaryInput>(
      async (req, res) => {
        try {
          const prompt  = buildReportSummaryPrompt(req.body);
          const raw     = await ai.generate(prompt, { maxTokens: 600 });
          const summary = raw.trim();
          res.json({ summary });
        } catch (err) {
          throw err instanceof AIProviderError ? err
            : new AIProviderError(err instanceof Error ? err.message : String(err));
        }
      },
    ),
  };
}
