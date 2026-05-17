import express                from 'express';
import helmet                from 'helmet';
import _pinoHttp             from 'pino-http';
import { type RequestHandler } from 'express';
import path                  from 'path';
import { fileURLToPath }     from 'url';
import generateRoutes        from '../routes/generate.routes.js';
import campaignRoutes        from '../routes/campaign.routes.js';
import signupRoutes          from '../routes/signup.routes.js';
import healthRoutes          from '../routes/health.routes.js';
import { errorMiddleware }   from '../middleware/errors.js';
import { logger }            from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // inline scripts and onclick handlers exist in HTML files; remove once migrated to external files
      scriptSrc:     ["'self'", "'unsafe-inline'"],
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
app.use(express.json({ limit: '64kb' }));
app.get('/generator.html', (_req, res) => res.redirect(301, '/campaign-generator.html'));
app.get('/privacy',        (_req, res) => res.sendFile(path.join(__dirname, '../../public/privacy.html')));
app.get('/terms',          (_req, res) => res.sendFile(path.join(__dirname, '../../public/terms.html')));
app.use(express.static(path.join(__dirname, '../../public')));

app.use('/api',          generateRoutes);
app.use('/api/campaign', campaignRoutes);
app.use('/api',          signupRoutes);
app.use('/api',          healthRoutes);

app.use(errorMiddleware);

export default app;
