// Applies a SQL migration file against DATABASE_URL. psql isn't guaranteed to be
// installed locally/CI, so we run the file through the existing pg pool instead.
// Usage: tsx scripts/migrate.ts src/db/migrations/002_saved_items.sql
import { readFileSync } from 'fs';
import { pool } from '../src/db/client.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: tsx scripts/migrate.ts <path-to-.sql>');
  process.exit(1);
}

const sql = readFileSync(file, 'utf8');

try {
  await pool.query(sql);
  console.log(`✅ Applied migration: ${file}`);
} catch (err) {
  console.error(`❌ Migration failed: ${file}`);
  console.error(err);
  process.exit(1);
} finally {
  await pool.end();
}
