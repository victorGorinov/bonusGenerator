import express        from 'express';
import path           from 'path';
import { fileURLToPath } from 'url';
import generateRoutes from '../routes/generate.routes.js';
import campaignRoutes from '../routes/campaign.routes.js';
import signupRoutes   from '../routes/signup.routes.js';
import healthRoutes   from '../routes/health.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '64kb' }));
app.get('/generator.html', (_req, res) => res.redirect(301, '/campaign-generator.html'));
app.use(express.static(path.join(__dirname, '../../public')));

app.use('/api',          generateRoutes);
app.use('/api/campaign', campaignRoutes);
app.use('/api',          signupRoutes);
app.use('/api',          healthRoutes);

export default app;
