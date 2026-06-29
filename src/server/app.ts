import express                from 'express';
import helmet                from 'helmet';
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
app.get('/generator.html', (_req, res) => res.redirect(301, '/campaign-generator.html'));
app.get('/privacy',        (_req, res) => res.sendFile(path.join(__dirname, '../../public/privacy.html')));
app.get('/terms',          (_req, res) => res.sendFile(path.join(__dirname, '../../public/terms.html')));
app.use(express.static(path.join(__dirname, '../../public')));

app.use('/api',            generateRoutes);
app.use('/api/campaign',   campaignRoutes);
app.use('/api/tournament', tournamentRoutes);
app.use('/api/loyalty',   loyaltyRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api',            signupRoutes);
app.use('/api',            healthRoutes);

app.use(errorMiddleware);

export default app;
