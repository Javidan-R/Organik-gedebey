// // src/lib/auth/index.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { verifyAdminToken, COOKIE_ADMIN, type AdminRole } from './jwt';
// import { AuthError } from './server';

// export { AuthError } from './server';

// /**
//  * Admin autentifikasiyası - cookie-dən token oxuyur və doğrulayır
//  */
// export async function requireAuth(
//   request: NextRequest,
//   allowedRoles: AdminRole[] = ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']
// ) {
//   // ✅ DÜZƏLİŞ: Cookie-ni düzgün oxu
//   const token = request.cookies.get(COOKIE_ADMIN)?.value;
  
//   if (!token) {
//     throw new AuthError('Giriş tələb olunur', 401);
//   }

//   const payload = await verifyAdminToken(token);
  
//   if (!payload) {
//     throw new AuthError('Yanlış və ya vaxtı keçmiş token', 401);
//   }

//   // Role yoxlaması
//   if (!allowedRoles.includes(payload.role)) {
//     throw new AuthError('Bu əməliyyat üçün icazəniz yoxdur', 403);
//   }

//   return {
//     id: payload.sub,
//     email: payload.email,
//     name: payload.name,
//     role: payload.role,
//   };
// }

// /**
//  * Admin autentifikasiyası - optional (token varsa yoxlayır, yoxdursa null qaytarır)
//  */
// export async function optionalAuth(request: NextRequest) {
//   try {
//     return await requireAuth(request);
//   } catch {
//     return null;
//   }
// }

// /**
//  * API route-ları üçün auth middleware
//  */
// export function withAuth(
//   handler: (request: NextRequest, user: any) => Promise<NextResponse>,
//   allowedRoles?: AdminRole[]
// ) {
//   return async (request: NextRequest) => {
//     try {
//       const user = await requireAuth(request, allowedRoles);
//       return await handler(request, user);
//     } catch (error) {
//       if (error instanceof AuthError) {
//         return NextResponse.json(
//           { error: error.message },
//           { status: error.status }
//         );
//       }
//       console.error('Auth middleware error:', error);
//       return NextResponse.json(
//         { error: 'Server xətası' },
//         { status: 500 }
//       );
//     }
//   };
// }
// src/lib/auth/index.ts
import { NextRequest } from 'next/server';
import { verifyAdminToken, verifyCustomerToken, COOKIE_ADMIN, COOKIE_CUSTOMER, type AdminRole } from './jwt';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ─── Admin Auth ──────────────────────────────────────────────────────────────
export async function requireAuth(
  request: NextRequest,
  allowedRoles: AdminRole[] = ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']
) {
  const token = request.cookies.get(COOKIE_ADMIN)?.value;
  if (!token) throw new AuthError('Giriş tələb olunur', 401);

  const payload = await verifyAdminToken(token);
  if (!payload) throw new AuthError('Yanlış və ya vaxtı keçmiş token', 401);
  if (!allowedRoles.includes(payload.role)) throw new AuthError('Bu əməliyyat üçün icazəniz yoxdur', 403);

  return { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
}

// ─── Optional Auth (for guest checkout) ─────────────────────────────────────
export async function optionalAuth(request: NextRequest): Promise<{ userId: string | null }> {
  // First try admin token (for admin users placing orders on behalf of customers)
  const adminToken = request.cookies.get(COOKIE_ADMIN)?.value;
  if (adminToken) {
    const payload = await verifyAdminToken(adminToken);
    if (payload) {
      return { userId: payload.sub };
    }
  }

  // Then try customer token
  const customerToken = request.cookies.get(COOKIE_CUSTOMER)?.value;
  if (customerToken) {
    const payload = await verifyCustomerToken(customerToken);
    if (payload) {
      return { userId: payload.sub };
    }
  }

  // Guest checkout - no userId
  return { userId: null };
}