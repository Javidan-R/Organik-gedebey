// src/lib/db/index.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { logger } from "../logger";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const isProduction = process.env.NODE_ENV === "production";
const isNeon = process.env.DATABASE_URL?.includes("neon.tech") ?? false;

const connectionOptions: postgres.Options<Record<string, postgres.PostgresType>> = {
  // Neon free tier 10 bağlantı limiti var
  max: isProduction ? (isNeon ? 10 : 20) : 5,
  idle_timeout: isProduction ? 30 : 20,
  connect_timeout: 15, // 10 → 15
  max_lifetime: isProduction ? 60 * 60 : 30 * 60,
  prepare: true,
  // Neon üçün əlavə
  ...(isNeon && {
    ssl: { rejectUnauthorized: false }, // Neon SSL
    keepalive: 30,
  }),
  connection: {
    application_name: "organik-market",
  },
};

declare global {
  var __postgres__: postgres.Sql | undefined;
  var __drizzle__: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const client =
  global.__postgres__ ??
  postgres(process.env.DATABASE_URL, connectionOptions);

if (!isProduction) {
  global.__postgres__ = client;
}

export const db =
  global.__drizzle__ ??
  drizzle(client, {
    schema,
    logger: false,
  });

if (!isProduction) {
  global.__drizzle__ = db;
}

logger.info("Database initialized", {
  env: process.env.NODE_ENV,
  neon: isNeon,
  maxConnections: connectionOptions.max,
});

export type DB = typeof db;

export async function closeDb() {
  try {
    await client.end();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Failed to close database", { error });
  }
}

async function healthCheck() {
  try {
    await client`SELECT 1`;
  } catch (error) {
    logger.error("Database health check failed", { error });
  }
}

if (isProduction) {
  setInterval(healthCheck, 60_000);
}

process.once("SIGINT", async () => {
  await closeDb();
  process.exit(0);
});

process.once("SIGTERM", async () => {
  await closeDb();
  process.exit(0);
});

process.once("beforeExit", async () => {
  await closeDb();
});

export default db;