/**
 * Environment Variable Configuration & Validation
 * 
 * This module provides type-safe environment variable access with validation
 * and fallback values. Validation is lazy and only happens when needed.
 */

import { z } from 'zod';

// ============================================
// SCHEMA DEFINITIONS
// ============================================

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url('Invalid DATABASE_URL format'),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL').default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  
  // AWS S3 (Optional)
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Stripe (Optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // Twilio (Optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),
  
  // Pusher (Optional)
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional(),
  
  // Upstash Redis (Optional)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Sentry (Optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // App Configuration
  NEXT_PUBLIC_URL: z.string().url('Invalid NEXT_PUBLIC_URL').default('http://localhost:3000'),
  NEXT_PUBLIC_REALTIME_USE_WS: z.string()
    .transform(val => val === 'true')
    .default(false),
  NEXT_PUBLIC_SSE_URL: z.string().default('/api/sse'),
  NEXT_PUBLIC_WS_URL: z.string().optional(),
  
  // Seed Configuration
  SEED_ADMIN_EMAIL: z.string().email('Invalid SEED_ADMIN_EMAIL').default('admin@organikgedebey.az'),
  SEED_ADMIN_PASSWORD: z.string().min(8, 'SEED_ADMIN_PASSWORD must be at least 8 characters').default('change-me-in-production'),
  SEED_ADMIN_FIRST_NAME: z.string().default('Admin'),
  SEED_ADMIN_LAST_NAME: z.string().default('Manager'),
  SEED_ADMIN_PHONE: z.string().default('+994501234567'),
  SEED_ADMIN_ROLE: z.enum(['CUSTOMER', 'COURIER', 'WAREHOUSE_STAFF', 'MANAGER', 'ADMIN', 'SUPERADMIN']).default('ADMIN'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Env = z.infer<typeof envSchema>;

// ============================================
// VALIDATION & EXPORT
// ============================================

let validatedEnv: Env | null = null;

/**
 * Validate and parse environment variables
 * This should be called at application startup
 */
export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(
        `Environment variable validation failed:\n${missingVars}\n\n` +
        `Please check your .env.local file and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

/**
 * Get validated environment variables
 * Validates lazily if not already validated
 */
export function getEnv(): Env {
  if (!validatedEnv) {
    return validateEnv();
  }
  return validatedEnv;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Get public environment variables (safe to expose to client)
 */
export function getPublicEnv() {
  const env = getEnv();
  return {
    NEXT_PUBLIC_URL: env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_PUSHER_KEY: env.NEXT_PUBLIC_PUSHER_KEY,
    NEXT_PUBLIC_PUSHER_CLUSTER: env.NEXT_PUBLIC_PUSHER_CLUSTER,
    NEXT_PUBLIC_SENTRY_DSN: env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_REALTIME_USE_WS: env.NEXT_PUBLIC_REALTIME_USE_WS,
    NEXT_PUBLIC_SSE_URL: env.NEXT_PUBLIC_SSE_URL,
    NEXT_PUBLIC_WS_URL: env.NEXT_PUBLIC_WS_URL,
  };
}