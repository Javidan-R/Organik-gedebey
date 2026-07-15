// src/lib/auth-helpers.ts

import { requireAuth as originalRequireAuth, AuthError } from '@/lib/auth';
import { NextRequest } from 'next/server';

/**
 * requireAuth funksiyasını sarmalayır və rolları normalize edir.
 * Hər rol üçün böyük, kiçik və orijinal variantları əlavə edir.
 */
export async function requireAuth(request: NextRequest, allowedRoles: string[]) {
  // Rolları normalize et: hər rolün özü, kiçik hərf, böyük hərf variantlarını əlavə et
  const normalizedRoles = allowedRoles.flatMap(role => [
    role,
    role.toLowerCase(),
    role.toUpperCase(),
  ]);
  // Təkrarları sil
  const uniqueRoles = [...new Set(normalizedRoles)];

  // Orijinal requireAuth-ı çağır
  return originalRequireAuth(request, uniqueRoles);
}

// Orijinal AuthError-i yenidən ixrac et
export { AuthError };