// lib/db/migrate.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!

const migrationClient = postgres(connectionString, { max: 1 })
const db = drizzle(migrationClient)

async function main() {
  console.log("Running migrations...")
  
 await migrate(db, { migrationsFolder: './src/generated/drizzle' })

  console.log("Migrations complete!")
  process.exit(0)
}

main().catch((err) => {
  console.error("Migration failed!", err)
  process.exit(1)
})