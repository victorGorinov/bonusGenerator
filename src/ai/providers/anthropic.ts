import { getAIClient }    from '../client.js';
import { AIProviderError } from '../../errors/AIProviderError.js';
import { logger }          from '../../utils/logger.js';

interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  retries?: number;
}

export async function generate(prompt: string, opts: GenerateOptions = {}): Promise<string> {
  const client     = getAIClient();
  const maxRetries = opts.retries ?? 2;
  const model      = opts.model     ?? 'claude-haiku-4-5-20251001';
  const max_tokens = opts.maxTokens ?? 1200;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const t0 = Date.now();
    try {
      const msg = await client.messages.create({
        model, max_tokens,
        messages: [{ role: 'user', content: prompt }],
      });
      logger.info({ event: 'ai.request', model, latency_ms: Date.now() - t0, tokens: msg.usage?.output_tokens });
      const block = msg.content[0];
      if (block.type !== 'text') throw new AIProviderError('Unexpected AI response type');
      return block.text;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.warn({ event: 'ai.failure', model, attempt, error: msg });
      if (attempt === maxRetries) throw new AIProviderError(msg);
      await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw new AIProviderError('AI generation failed after retries');
}
