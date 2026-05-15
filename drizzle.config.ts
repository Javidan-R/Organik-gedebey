import dotenv from 'dotenv'
import type { Config } from 'drizzle-kit'

dotenv.config()

export default {
schema: './src/lib/db/schema.ts',
  out: './src/generated/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
