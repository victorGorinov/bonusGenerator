import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60_000, max: 30,
  standardHeaders: true, legacyHeaders: false,
});

// Persistence CRUD (/api/saved): cheap non-AI DB ops. A logged-in page load can
// fan out to several GETs (per-collection hydrate) and a burst of saves/deletes,
// so 30/min is too tight — allow a much higher ceiling than the AI/generate tiers.
export const savedLimiter = rateLimit({
  windowMs: 60_000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' },
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60_000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests, try again later' },
});

export const campaignLimiter = rateLimit({
  windowMs: 60_000, max: 20,
  standardHeaders: true, legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: 60_000, max: 15,
  standardHeaders: true, legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60_000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many login attempts, try again later' },
});
