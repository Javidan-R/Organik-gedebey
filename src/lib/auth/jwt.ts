// src/lib/auth/jwt.ts
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[jwt] NEXTAUTH_SECRET env var is required in production');
    }
    return new TextEncoder().encode('dev-only-fallback-secret-change-in-prod-32c');
  }
  return new TextEncoder().encode(secret);
}

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

export async function verifyToken(token: string): Promise<AdminTokenPayload | CustomerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    return payload as AdminTokenPayload | CustomerTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  const payload = await verifyToken(token);
  if (!payload || payload.type !== 'admin') return null;
  return payload as AdminTokenPayload;
}

export async function verifyCustomerToken(token: string): Promise<CustomerTokenPayload | null> {
  const payload = await verifyToken(token);
  if (!payload || payload.type !== 'customer') return null;
  return payload as CustomerTokenPayload;
}

export const COOKIE_ADMIN = 'og_admin_jwt';
export const COOKIE_CUSTOMER = 'og_session';