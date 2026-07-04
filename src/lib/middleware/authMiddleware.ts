import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, verifyCustomerToken, COOKIE_ADMIN, COOKIE_CUSTOMER } from '@/lib/auth/jwt'
import { AuthenticationError, AuthorizationError } from './errorHandler'

export type UserRole = 'ADMIN' | 'SUPERADMIN' | 'MANAGER' | 'WAREHOUSE_STAFF' | 'CUSTOMER' | 'COURIER'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  type: 'admin' | 'customer'
}

export async function authenticateRequest(request: NextRequest): Promise<AuthUser> {
  const adminToken = request.cookies.get(COOKIE_ADMIN)?.value
  const customerToken = request.cookies.get(COOKIE_CUSTOMER)?.value

  if (adminToken) {
    try {
      const payload = await verifyAdminToken(adminToken)
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        type: 'admin',
      }
    } catch (error) {
      throw new AuthenticationError('Invalid admin token')
    }
  }

  if (customerToken) {
    try {
      const payload = await verifyCustomerToken(customerToken)
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        type: 'customer',
      }
    } catch (error) {
      throw new AuthenticationError('Invalid customer token')
    }
  }

  throw new AuthenticationError('Authentication required')
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<AuthUser> {
  try {
    const user = await authenticateRequest(request)

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        throw new AuthorizationError('Insufficient permissions')
      }
    }

    return user
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      throw error
    }
    throw new AuthenticationError('Authentication failed')
  }
}

export function createAuthErrorResponse(error: AuthenticationError | AuthorizationError): NextResponse {
  const status = error instanceof AuthenticationError ? 401 : 403
  return NextResponse.json({ error: error.message }, { status })
}

export function withAuth<T>(
  handler: (request: NextRequest, user: AuthUser, ...args: any[]) => Promise<T>,
  allowedRoles?: UserRole[]
) {
  return async (request: NextRequest, ...args: any[]): Promise<T> => {
    try {
      const user = await requireAuth(request, allowedRoles)
      return await handler(request, user, ...args)
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        throw error
      }
      throw new AuthenticationError('Authentication failed')
    }
  }
}
