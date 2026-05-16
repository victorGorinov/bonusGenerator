import 'dotenv/config';
import app from './src/server/app.js';

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Bonus System API running at http://localhost:${port}`);
});
