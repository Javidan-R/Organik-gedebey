import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { logger } from '../logger';

let queryClient: postgres.Sql | null = null;
let _dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_dbInstance) return _dbInstance;

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }

    const isProd = process.env.NODE_ENV === 'production';
    const poolConfig = {
      max: isProd ? 20 : 5,
      min: isProd ? 2 : 1,
      idle_timeout: isProd ? 30 : 20,
      connect_timeout: 10,
      max_lifetime: isProd ? 3600 : 1800,
      prepare: true,
      connection: { application_name: 'organik-gedebey' },
    };
    queryClient = postgres(process.env.DATABASE_URL, poolConfig);
    _dbInstance = drizzle(queryClient, { schema, logger: false });

    logger.info('Database connected', { max: poolConfig.max, min: poolConfig.min });
    if (isProd) setupHealthCheck();

    return _dbInstance;
  } catch (error) {
    logger.error('Database connection failed', { error });
    throw new Error('Database connection failed');
  }
}

async function setupHealthCheck() {
  setInterval(async () => {
    try {
      if (queryClient) await queryClient`SELECT 1`;
    } catch (error) {
      logger.error('DB health check failed', { error });
      if (queryClient) {
        await queryClient.end();
        queryClient = null;
        _dbInstance = null;
      }
    }
  }, 60_000);
}

export async function closeDb() {
  if (queryClient) {
    try { await queryClient.end(); } catch (e) { logger.error(e as string); }
    queryClient = null;
    _dbInstance = null;
  }
}

export const db = getDb();
export type DB = typeof db;

// Shutdown handlers
if (typeof process !== 'undefined') {
  process.on('beforeExit', closeDb);
  process.on('SIGINT', async () => { await closeDb(); process.exit(0); });
  process.on('SIGTERM', async () => { await closeDb(); process.exit(0); });
}