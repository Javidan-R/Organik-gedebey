// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// Tək bağlantı (migrasiya üçün ayrıca client-ə ehtiyac yoxdur)
const queryClient = postgres(process.env.DATABASE_URL)
export const db = drizzle(queryClient, { schema })

// Helper type
export type DB = typeof db