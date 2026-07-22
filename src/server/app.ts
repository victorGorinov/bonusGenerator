import express                from 'express';
import helmet                from 'helmet';
import cookieParser          from 'cookie-parser';
import _pinoHttp             from 'pino-http';
import { type RequestHandler } from 'express';
import path                  from 'path';
import { fileURLToPath }     from 'url';
import generateRoutes        from '../routes/generate.routes.js';
import campaignRoutes        from '../routes/campaign.routes.js';
import tournamentRoutes      from '../routes/tournament.routes.js';
import loyaltyRoutes         from '../routes/loyalty.routes.js';
import wheelRoutes           from '../routes/wheel.routes.js';
import competitorRoutes      from '../routes/competitor.routes.js';
import signupRoutes          from '../routes/signup.routes.js';
import healthRoutes          from '../routes/health.routes.js';
import reportRoutes          from '../routes/report.routes.js';
import gamesRoutes           from '../routes/games.routes.js';
import authRoutes            from '../routes/auth.routes.js';
import adminRoutes           from '../routes/admin.routes.js';
import featuresRoutes        from '../routes/features.routes.js';
import savedItemsRoutes      from '../routes/savedItems.routes.js';
import { optionalAuth }      from '../middleware/optionalAuth.js';
import { requireAuth }       from '../middleware/requireAuth.js';
import { errorMiddleware }   from '../middleware/errors.js';
import { requestId }        from '../middleware/requestId.js';
import { logger }            from '../utils/logger.js';
import { ENV }               from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// Vercel's edge is a single reverse-proxy hop that sets X-Forwarded-For/-Host.
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// on every rate-limited request in production (Express's default req.ip
// ignores X-Forwarded-For unless trust proxy is set, which rate-limit's
// validation treats as a misconfiguration once it sees the header at all).
app.set('trust proxy', 1);

app.use(requestId);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // All JS is now in external files — 'unsafe-inline' no longer needed for scriptSrc.
      // scriptSrcAttr kept for onclick="..." handlers; remove when converted to addEventListener.
      scriptSrc:     ["'self'", 'https://www.googletagmanager.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:      ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:       ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:        ["'self'", 'data:', 'blob:', 'https://www.googletagmanager.com', 'https://*.google-analytics.com'],
      connectSrc:    ["'self'", 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com'],
      objectSrc:     ["'none'"],
      baseUri:       ["'self'"],
    },
  },
}));

// pino-http ships CJS types incompatible with Node16 ESM; cast result to RequestHandler
const httpLogger = (_pinoHttp as unknown as (opts: unknown) => RequestHandler)({
  logger,
  autoLogging: { ignore: (req: { url?: string }) => req.url === '/api/health' },
});
app.use(httpLogger);

if (ENV.NODE_ENV === 'staging') {
  app.use((_req, res, next) => {
    res.setHeader('X-Environment', 'staging');
    // Equivalent to <meta name="robots" content="noindex"> — prevents search engine indexing
    res.setHeader('X-Robots-Tag', 'noindex');
    next();
  });
}

// 256kb (was 64kb): a single saved record (/api/saved) can carry a full campaign
// with all generated AI channel texts + audit + RU/EN explanations + econ, which
// can exceed 64kb. All inputs are still Zod-validated and the heavy routes are
// rate-limited, so the larger cap doesn't widen the abuse surface meaningfully.
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.get('/privacy',        (_req, res) => res.sendFile(path.join(__dirname, '../../public/privacy.html')));
app.get('/terms',          (_req, res) => res.sendFile(path.join(__dirname, '../../public/terms.html')));
app.use(express.static(path.join(__dirname, '../../public')));

// Public: auth (login/register need to work unauthenticated), health check (uptime
// monitors), and the marketing early-access signup form (landing-page CTA, not app data).
app.use('/api/auth',       authRoutes);
app.use('/api',            healthRoutes);
app.use('/api',            signupRoutes);
// Effective feature map for the caller (guest or logged-in) — drives frontend gating.
app.use('/api',            featuresRoutes);

// Generation/AI tool auth. Normally optionalAuth — guests reach the tools and
// req.user is attached when a valid session cookie is present (never rejects).
// During the closed beta (BETA_LOCKDOWN=true) this becomes requireAuth, so every
// tool route rejects anonymous callers with a clean 401 and the whole system is
// gated behind login/registration. One reversible switch, no per-route edits.
const toolAuth = ENV.BETA_LOCKDOWN ? requireAuth : optionalAuth;
app.use('/api',            toolAuth, generateRoutes);
app.use('/api/campaign',   toolAuth, campaignRoutes);
app.use('/api/tournament', toolAuth, tournamentRoutes);
app.use('/api/loyalty',    toolAuth, loyaltyRoutes);
app.use('/api/wheel',      toolAuth, wheelRoutes);
app.use('/api/competitor', toolAuth, competitorRoutes);
app.use('/api/reports',    toolAuth, reportRoutes);
app.use('/api/games',      toolAuth, gamesRoutes);

// Server-side persistence (Phase 2) — hard-gated: requireAuth + requireWorkspace
// live inside the router. Guests never reach here; they keep localStorage-only saves.
app.use('/api/saved',      savedItemsRoutes);

// Admin — hard-gated: requireAdmin (role from DB) lives inside the router.
app.use('/api/admin',      adminRoutes);

app.use(errorMiddleware);

export default app;
