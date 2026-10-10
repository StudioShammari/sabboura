import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8,
  connectionTimeoutMillis: 4000,
});
pool.on('error', (e) => console.error('[db] pool error', e.message));
export const db = drizzle(pool, { schema });
export * from './schema';
