import pg from 'pg';
import { DATABASE_URL } from '../config/index.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: DATABASE_URL,
  // Neon issues publicly-trusted certs, so the default (rejectUnauthorized: true)
  // validates fine — disabling it would accept a MITM's self-signed cert.
  ssl: DATABASE_URL.includes('sslmode=require') ? true : undefined,
});

// pg.Pool is an EventEmitter; an idle client erroring with no 'error' listener
// (e.g. a network blip after the connection was already established) crashes
// the process. Log and let the pool recover instead.
pool.on('error', (err) => {
  logger.error({ event: 'db.pool.error', err }, 'Unexpected error on idle Postgres client');
});
