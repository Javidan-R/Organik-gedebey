// src/lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/lib/db/schema'   
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

// Remove any unsupported parameters that might confuse the driver
const cleanUrl = connectionString.replace(/&channel_binding=require/gi, '');

const client = postgres(cleanUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
  ssl: cleanUrl.includes('sslmode=require') ? 'require' : 'prefer',
});

export const db = drizzle(client, { schema });