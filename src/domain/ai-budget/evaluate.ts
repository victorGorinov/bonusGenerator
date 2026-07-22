// Pure decision logic for the AI guardrails. No I/O — the middleware feeds it the
// current counters and acts on the verdict. Kept separate so it's trivially unit-testable.

export interface AiLimitInput {
  globalSpend: number;   // cumulative USD spent on AI so far
  budget:      number;   // AI_BUDGET_USD hard cap
  userToday:   number;   // this user's AI calls today (0 for a guest — never reaches here)
  dailyLimit:  number;   // AI_USER_DAILY_LIMIT
  userTotal:   number;   // this user's AI calls across the beta
  totalLimit:  number;   // AI_USER_TOTAL_LIMIT
  hasUser:     boolean;  // whether a per-user quota applies (false → global check only)
}

export type AiLimitVerdict =
  | { allowed: true }
  | { allowed: false; status: number; code: string; message: string };

const ALLOWED: AiLimitVerdict = { allowed: true };

// Precedence when blocking: global budget first (protects the whole beta), then the
// per-user daily quota, then the per-user total quota. A call exactly AT a limit is
// blocked (spent >= budget, calls >= limit) — the counters reflect already-consumed usage.
export function evaluateAiLimits(input: AiLimitInput): AiLimitVerdict {
  const { globalSpend, budget, userToday, dailyLimit, userTotal, totalLimit, hasUser } = input;

  if (globalSpend >= budget) {
    return {
      allowed: false,
      status: 503,
      code: 'AI_BUDGET_EXCEEDED',
      message: 'AI is temporarily unavailable — the beta AI budget has been reached.',
    };
  }

  if (hasUser) {
    if (userToday >= dailyLimit) {
      return {
        allowed: false,
        status: 429,
        code: 'AI_QUOTA_DAILY',
        message: `Daily AI limit reached (${dailyLimit}/day). Try again tomorrow.`,
      };
    }
    if (userTotal >= totalLimit) {
      return {
        allowed: false,
        status: 429,
        code: 'AI_QUOTA_TOTAL',
        message: `You've used your full beta AI allowance (${totalLimit} generations).`,
      };
    }
  }

  return ALLOWED;
}
