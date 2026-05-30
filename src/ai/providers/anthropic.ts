import { APIError, RateLimitError, InternalServerError } from '@anthropic-ai/sdk';
import { getAIClient }     from '../client.js';
import { AIProviderError } from '../../errors/AIProviderError.js';
import { logger }          from '../../utils/logger.js';
import { AI_MODEL }        from '../../config/index.js';
import type { AIProvider, AIGenerateOpts } from '../interface.js';

function retryDelay(attempt: number): number {
  const base = 300;
  const cap  = 10_000;
  const exp  = Math.min(cap, base * Math.pow(2, attempt));
  return Math.round(Math.random() * exp); // full jitter: [0, exp]
}

function isRetryable(err: unknown): boolean {
  if (err instanceof RateLimitError)      return true;
  if (err instanceof InternalServerError) return true;
  if (err instanceof APIError && [502, 503, 529].includes(err.status)) return true;
  if (err instanceof Error && 'code' in err) {
    return ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(
      (err as NodeJS.ErrnoException).code ?? '',
    );
  }
  return false;
}

function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  // Haiku pricing: $0.80/M input, $4.00/M output
  return (inputTokens / 1_000_000) * 0.80 + (outputTokens / 1_000_000) * 4.00;
}

export class AnthropicProvider implements AIProvider {
  async generate(prompt: string, opts: AIGenerateOpts = {}): Promise<string> {
    const client     = getAIClient();
    const maxRetries = opts.retries   ?? 2;
    const max_tokens = opts.maxTokens ?? 1200;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const t0 = Date.now();
      try {
        const msg = await client.messages.create({
          model: AI_MODEL, max_tokens,
          messages: [{ role: 'user', content: prompt }],
        });
        const inTok  = msg.usage?.input_tokens  ?? 0;
        const outTok = msg.usage?.output_tokens ?? 0;
        logger.info({
          event:      'ai.request',
          model:      AI_MODEL,
          latency_ms: Date.now() - t0,
          in_tokens:  inTok,
          out_tokens: outTok,
          cost_usd:   estimateCostUsd(inTok, outTok),
        });
        const block = msg.content[0];
        if (block.type !== 'text') throw new AIProviderError('Unexpected AI response type');
        return block.text;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.warn({ event: 'ai.failure', model: AI_MODEL, attempt, error: errMsg });
        if (attempt === maxRetries || !isRetryable(err)) {
          throw err instanceof AIProviderError ? err : new AIProviderError(errMsg);
        }
        await new Promise(r => setTimeout(r, retryDelay(attempt)));
      }
    }
    throw new AIProviderError('AI generation failed after retries');
  }
}

// Backward-compat functional export used by existing callers
export const generate = (prompt: string, opts?: AIGenerateOpts): Promise<string> =>
  getProvider().generate(prompt, opts);

// Lazy singleton — avoids importing registry here (would be circular)
let _prov: AnthropicProvider | null = null;
function getProvider(): AnthropicProvider {
  _prov ??= new AnthropicProvider();
  return _prov;
}
