// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// Connection pool
const connectionString = process.env.DATABASE_URL

// For migrations
export const migrationClient = postgres(connectionString, { max: 1 })

// For queries
const queryClient = postgres(connectionString)
export const db = drizzle(queryClient, { schema })

// Helper type
export type DB = typeof db