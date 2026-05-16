import { getAIClient }    from '../client.js';
import { AIProviderError } from '../../errors/AIProviderError.js';

export async function generate(prompt, opts = {}) {
  const client     = getAIClient();
  const maxRetries = opts.retries ?? 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const msg = await client.messages.create({
        model:      opts.model     ?? 'claude-haiku-4-5-20251001',
        max_tokens: opts.maxTokens ?? 1200,
        messages:   [{ role: 'user', content: prompt }],
      });
      return msg.content[0].text;
    } catch (e) {
      if (attempt === maxRetries) throw new AIProviderError(e.message);
      await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }
}
