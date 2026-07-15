// src/lib/auth/jwt.ts
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// ─── Secret ────────────────────────────────────────────────────────────────
function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[jwt] NEXTAUTH_SECRET env var is required in production');
    }
    // Development fallback – production-da istifadə etməyin!
    return new TextEncoder().encode('dev-only-fallback-secret-change-in-prod-32c');
  }
  return new TextEncoder().encode(secret);
}

// ─── Tiplər ──────────────────────────────────────────────────────────────────
export type AdminRole = 'ADMIN' | 'SUPERADMIN' | 'MANAGER' | 'WAREHOUSE_STAFF' | 'COURIER';
export type CustomerRole = 'CUSTOMER' | 'COURIER';

export type AdminTokenPayload = JWTPayload & {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
  type: 'admin';
};

export type CustomerTokenPayload = JWTPayload & {
  sub: string;
  email: string;
  name: string;
  role: CustomerRole;
  type: 'customer';
};

export type TokenPayload = AdminTokenPayload | CustomerTokenPayload;

// ─── Token imzalama ────────────────────────────────────────────────────────
export async function signAdminToken(
  payload: Omit<AdminTokenPayload, 'type' | 'iat' | 'exp'>
): Promise<string> {
  return new SignJWT({ ...payload, type: 'admin' as const })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret());
}

export async function signCustomerToken(
  payload: Omit<CustomerTokenPayload, 'type' | 'iat' | 'exp'>
): Promise<string> {
  return new SignJWT({ ...payload, type: 'customer' as const })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

// ─── Token doğrulama ──────────────────────────────────────────────────────
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });
    // `type` sahəsinin varlığını yoxlayırıq
    if (!payload.type || (payload.type !== 'admin' && payload.type !== 'customer')) {
      return null;
    }
    return payload as TokenPayload;
  } catch (error) {
    // Token vaxtı keçibsə və ya imza səhvdirsə, null qaytar
    return null;
  }
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  const payload = await verifyToken(token);
  if (!payload || payload.type !== 'admin') return null;
  // Role yoxlanışı əlavə et
  const validRoles: AdminRole[] = ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'COURIER'];
  if (!validRoles.includes(payload.role)) return null;
  return payload as AdminTokenPayload;
}

export async function verifyCustomerToken(token: string): Promise<CustomerTokenPayload | null> {
  const payload = await verifyToken(token);
  if (!payload || payload.type !== 'customer') return null;
  return payload as CustomerTokenPayload;
}

// ─── Cookie adları ────────────────────────────────────────────────────────
export const COOKIE_ADMIN = 'og_admin_jwt';
export const COOKIE_CUSTOMER = 'og_session';
export const COOKIE_LEGACY_ADMIN = 'admin_token';
export const COOKIE_LEGACY_AUTH = 'auth_token';