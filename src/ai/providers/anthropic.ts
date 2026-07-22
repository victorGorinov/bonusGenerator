import Anthropic, { APIError, RateLimitError, InternalServerError } from '@anthropic-ai/sdk';
import { getAIClient }     from '../client.js';
import { AIProviderError } from '../../errors/AIProviderError.js';
import { logger }          from '../../utils/logger.js';
import { AI_MODEL, AI_BUDGET_ALERT_USD, AI_BUDGET_USD } from '../../config/index.js';
import { pgUsageStore }     from '../../domain/ai-budget/store.js';
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

// Per-1M token rates by model family (input, output). Web search additionally
// bills a per-search fee (~$10 / 1,000 searches) surfaced via usage.server_tool_use.
function tokenRates(model: string): { input: number; output: number } {
  if (model.includes('sonnet')) return { input: 3.00, output: 15.00 };
  if (model.includes('opus'))   return { input: 5.00, output: 25.00 };
  return { input: 1.00, output: 5.00 }; // haiku 4.5 default
}

function estimateCostUsd(model: string, inputTokens: number, outputTokens: number, searchReqs: number): number {
  const r = tokenRates(model);
  return (inputTokens / 1_000_000) * r.input
       + (outputTokens / 1_000_000) * r.output
       + searchReqs * 0.01; // $10 per 1,000 web searches
}

const WEB_SEARCH_MAX_ROUNDS = 5; // cap pause_turn continuations so a runaway loop can't hang the request

export class AnthropicProvider implements AIProvider {
  async generate(prompt: string, opts: AIGenerateOpts = {}): Promise<string> {
    const client     = getAIClient();
    const maxRetries = opts.retries   ?? 2;
    const max_tokens = opts.maxTokens ?? 1200;
    const model      = opts.model     ?? AI_MODEL;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const t0 = Date.now();
      try {
        return opts.webSearch
          ? await this.runWithWebSearch(client, model, max_tokens, prompt, opts.webSearch.maxUses ?? 5, t0)
          : await this.runPlain(client, model, max_tokens, prompt, t0);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.warn({ event: 'ai.failure', model, attempt, error: errMsg });
        if (attempt === maxRetries || !isRetryable(err)) {
          throw err instanceof AIProviderError ? err : new AIProviderError(errMsg);
        }
        await new Promise(r => setTimeout(r, retryDelay(attempt)));
      }
    }
    throw new AIProviderError('AI generation failed after retries');
  }

  private async runPlain(
    client: Anthropic, model: string, max_tokens: number, prompt: string, t0: number,
  ): Promise<string> {
    const msg = await client.messages.create({
      model, max_tokens,
      messages: [{ role: 'user', content: prompt }],
    });
    this.logCost(model, msg, t0);
    const block = msg.content[0];
    if (!block || block.type !== 'text') throw new AIProviderError('Unexpected AI response type');
    return block.text;
  }

  // Server-side web search: the model may run several searches and emit
  // web_search_tool_result blocks; when it hits the internal tool-loop cap the
  // response comes back with stop_reason 'pause_turn' and must be re-sent to
  // resume. We accumulate the conversation and return the concatenated final
  // text once the turn ends.
  private async runWithWebSearch(
    client: Anthropic, model: string, max_tokens: number, prompt: string, maxUses: number, t0: number,
  ): Promise<string> {
    const tools: Anthropic.Messages.ToolUnion[] = [
      { type: 'web_search_20260209', name: 'web_search', max_uses: maxUses },
    ];
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];

    for (let round = 0; round < WEB_SEARCH_MAX_ROUNDS; round++) {
      const msg = await client.messages.create({ model, max_tokens, messages, tools });
      this.logCost(model, msg, t0);

      if (msg.stop_reason === 'pause_turn') {
        // Echo the assistant turn back verbatim to resume the paused search loop.
        messages.push({ role: 'assistant', content: msg.content as unknown as Anthropic.ContentBlockParam[] });
        continue;
      }

      const text = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      if (!text) throw new AIProviderError('Web-search response contained no text');
      return text;
    }
    throw new AIProviderError('Web search did not complete within the round limit');
  }

  private logCost(model: string, msg: Anthropic.Message, t0: number): void {
    const inTok      = msg.usage?.input_tokens  ?? 0;
    const outTok     = msg.usage?.output_tokens ?? 0;
    const searchReqs = msg.usage?.server_tool_use?.web_search_requests ?? 0;
    const cost       = estimateCostUsd(model, inTok, outTok, searchReqs);
    logger.info({
      event:        'ai.request',
      model,
      latency_ms:   Date.now() - t0,
      in_tokens:    inTok,
      out_tokens:   outTok,
      web_searches: searchReqs,
      cost_usd:     cost,
    });
    // Single funnel where the real per-call cost is known — accrue it to the global
    // AI spend that drives the kill-switch. Fire-and-forget: a recording failure must
    // never fail an already-successful generation (it only under-counts the budget).
    // Called once per message.create, so web-search rounds each accrue correctly.
    pgUsageStore.recordGlobalSpend(cost, AI_BUDGET_ALERT_USD)
      .then(({ total, crossedAlert }) => {
        if (crossedAlert) {
          logger.warn(
            { event: 'ai_budget.alert', total_usd: total, alert_usd: AI_BUDGET_ALERT_USD, budget_usd: AI_BUDGET_USD },
            `AI spend crossed the $${AI_BUDGET_ALERT_USD} alert threshold (cap $${AI_BUDGET_USD})`,
          );
        }
      })
      .catch((err) => logger.error({ event: 'ai_budget.record_failed', err }, 'AI spend recording failed'));
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
