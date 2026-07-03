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
import signupRoutes          from '../routes/signup.routes.js';
import healthRoutes          from '../routes/health.routes.js';
import reportRoutes          from '../routes/report.routes.js';
import authRoutes            from '../routes/auth.routes.js';
import { optionalAuth }      from '../middleware/optionalAuth.js';
import { errorMiddleware }   from '../middleware/errors.js';
import { requestId }        from '../middleware/requestId.js';
import { logger }            from '../utils/logger.js';
import { ENV }               from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.use(requestId);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // All JS is now in external files — 'unsafe-inline' no longer needed for scriptSrc.
      // scriptSrcAttr kept for onclick="..." handlers; remove when converted to addEventListener.
      scriptSrc:     ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:      ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:       ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:        ["'self'", 'data:', 'blob:'],
      connectSrc:    ["'self'"],
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

app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());
app.get('/generator.html', (_req, res) => res.redirect(301, '/campaign-generator.html'));
app.get('/privacy',        (_req, res) => res.sendFile(path.join(__dirname, '../../public/privacy.html')));
app.get('/terms',          (_req, res) => res.sendFile(path.join(__dirname, '../../public/terms.html')));
app.use(express.static(path.join(__dirname, '../../public')));

// Public: auth (login/register need to work unauthenticated), health check (uptime
// monitors), and the marketing early-access signup form (landing-page CTA, not app data).
app.use('/api/auth',       authRoutes);
app.use('/api',            healthRoutes);
app.use('/api',            signupRoutes);

// Generation/AI tools are open to guests — saving still only writes to the browser's
// localStorage today (no server-side persistence until Phase 2/3), so gating these
// behind login has no functional effect yet. optionalAuth attaches req.user when a
// valid session cookie is present, but never rejects an anonymous request.
app.use('/api',            optionalAuth, generateRoutes);
app.use('/api/campaign',   optionalAuth, campaignRoutes);
app.use('/api/tournament', optionalAuth, tournamentRoutes);
app.use('/api/loyalty',    optionalAuth, loyaltyRoutes);
app.use('/api/reports',    optionalAuth, reportRoutes);

app.use(errorMiddleware);

export default app;
