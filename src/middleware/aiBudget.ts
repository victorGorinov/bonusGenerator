import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';
import { requireFeature } from './requireFeature.js';
import { evaluateAiLimits } from '../domain/ai-budget/evaluate.js';
import { pgUsageStore, type AiUsageStore } from '../domain/ai-budget/store.js';
import {
  AI_BUDGET_USD, AI_USER_DAILY_LIMIT, AI_USER_TOTAL_LIMIT,
} from '../config/index.js';

export interface AiBudgetDeps {
  store?:      AiUsageStore;
  budget?:     number;
  dailyLimit?: number;
  totalLimit?: number;
  // Global-spend cache TTL. Spend changes slowly and the aiLimiter (15/min/IP) caps
  // burst, so a few seconds of staleness can't overshoot the cap meaningfully — it
  // saves a Neon round-trip per AI request.
  cacheTtlMs?: number;
}

// Gate an AI route on the global $ kill-switch + the caller's per-user quota. MUST
// run AFTER optionalAuth + requireFeature('ai') (so only granted, logged-in callers
// reach it → req.user is present). On a successful (2xx) response it records +1 AI
// call for the user; failed AI calls (502 etc.) don't burn quota.
export function createAiBudget(deps: AiBudgetDeps = {}) {
  const store      = deps.store      ?? pgUsageStore;
  const budget     = deps.budget     ?? AI_BUDGET_USD;
  const dailyLimit = deps.dailyLimit ?? AI_USER_DAILY_LIMIT;
  const totalLimit = deps.totalLimit ?? AI_USER_TOTAL_LIMIT;
  const ttlMs      = deps.cacheTtlMs ?? 10_000;

  let spendCache: { value: number; exp: number } | null = null;

  async function globalSpend(): Promise<number> {
    if (spendCache && spendCache.exp > Date.now()) return spendCache.value;
    const value = await store.getGlobalSpend();
    spendCache = { value, exp: Date.now() + ttlMs };
    return value;
  }

  return async function aiBudgetMw(req: Request, res: Response, next: NextFunction): Promise<void> {
    const uid = req.user?.id;
    try {
      const spend = await globalSpend();
      const usage = uid ? await store.getUserUsage(uid) : { today: 0, total: 0 };
      const verdict = evaluateAiLimits({
        globalSpend: spend, budget,
        userToday: usage.today, dailyLimit,
        userTotal: usage.total, totalLimit,
        hasUser: Boolean(uid),
      });
      if (!verdict.allowed) {
        next(new AppError(verdict.message, verdict.status, verdict.code));
        return;
      }
    } catch (err) {
      // Fail CLOSED: if we can't read the counters we can't prove the budget/quota
      // isn't already blown, so refuse rather than risk overspend.
      logger.error({ event: 'ai_budget.check_failed', uid, err }, 'AI budget check failed');
      next(new AppError('AI is temporarily unavailable', 503, 'SERVICE_UNAVAILABLE'));
      return;
    }

    // Count the call only if it actually succeeded. res.on('finish') fires after the
    // response is flushed; a thrown/errored AI generation lands as >=400 and is skipped.
    if (uid) {
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          store.bumpUser(uid).catch((err) =>
            logger.error({ event: 'ai_budget.bump_failed', uid, err }, 'AI usage bump failed'),
          );
        }
      });
    }

    next();
  };
}

// Prod singleton — shared across all AI routes so the spend cache is process-wide.
export const aiBudget = createAiBudget();

// The gate every AI endpoint applies (on top of its own tool feature): require the
// per-user `ai` grant, then the budget/quota kill-switch. One definition so the four
// tool routers can't drift. Competitor's whole router spreads it after its own
// requireFeature('competitorComparison').
export const aiGate: RequestHandler[] = [requireFeature('ai'), aiBudget];
