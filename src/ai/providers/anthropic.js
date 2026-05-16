import { getAIClient }    from '../client.js';
import { AIProviderError } from '../../errors/AIProviderError.js';
import { logger }          from '../../utils/logger.js';

export async function generate(prompt, opts = {}) {
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
      return msg.content[0].text;
    } catch (e) {
      logger.warn({ event: 'ai.failure', model, attempt, error: e.message });
      if (attempt === maxRetries) throw new AIProviderError(e.message);
      await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }
}
