import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '../config/index.js';

let _client = null;

function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return _client;
}

export async function generateText(prompt, opts = {}) {
  const client = getClient();
  const msg = await client.messages.create({
    model:      opts.model     ?? 'claude-haiku-4-5-20251001',
    max_tokens: opts.maxTokens ?? 1200,
    messages:   [{ role: 'user', content: prompt }],
  });
  return msg.content[0].text;
}
