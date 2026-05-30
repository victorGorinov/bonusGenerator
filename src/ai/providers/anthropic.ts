import { APIError, RateLimitError, InternalServerError } from '@anthropic-ai/sdk';
import { getAIClient }        from '../client.js';
import { AIProviderError }    from '../../errors/AIProviderError.js';
import { logger }             from '../../utils/logger.js';
import { AI_MODEL }           from '../../config/index.js';

interface GenerateOptions {
  maxTokens?: number;
  retries?:   number;
}

function retryDelay(attempt: number): number {
  const base = 300;
  const cap  = 10_000;
  const exp  = Math.min(cap, base * Math.pow(2, attempt));
  return Math.round(Math.random() * exp); // full jitter: [0, exp]
}

function isRetryable(err: unknown): boolean {
  if (err instanceof RateLimitError)     return true;
  if (err instanceof InternalServerError) return true;
  if (err instanceof APIError && [502, 503, 529].includes(err.status)) return true;
  if (err instanceof Error && 'code' in err) {
    return ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(
      (err as NodeJS.ErrnoException).code ?? '',
    );
  }
  return false;
}

export async function generate(prompt: string, opts: GenerateOptions = {}): Promise<string> {
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
      logger.info({
        event:      'ai.request',
        model:      AI_MODEL,
        latency_ms: Date.now() - t0,
        in_tokens:  msg.usage?.input_tokens,
        out_tokens: msg.usage?.output_tokens,
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
