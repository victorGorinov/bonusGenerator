import 'dotenv/config';
import app from './src/server/app.js';

// Vercel invokes the exported handler directly; locally we start the listener
if (process.env.VERCEL !== '1') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Bonus System API running at http://localhost:${port}`);
  });
}

export default app;
