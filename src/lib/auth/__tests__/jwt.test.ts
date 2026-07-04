// src/lib/auth/__tests__/jwt.test.ts
import { signAdminToken, signCustomerToken, verifyAdminToken, verifyCustomerToken } from '../jwt'

describe('JWT Functions', () => {
  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret-for-jest-tests-32chars'
  })

  describe('signAdminToken', () => {
    it('should sign admin token successfully', async () => {
      const payload = {
        sub: 'user-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN' as const,
      }
      const token = await signAdminToken(payload)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should include correct payload in token', async () => {
      const payload = {
        sub: 'user-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN' as const,
      }
      const token = await signAdminToken(payload)
      const verified = await verifyAdminToken(token)
      expect(verified).not.toBeNull()
      expect(verified?.sub).toBe(payload.sub)
      expect(verified?.email).toBe(payload.email)
      expect(verified?.role).toBe(payload.role)
      expect(verified?.type).toBe('admin')
    })
  })

  describe('signCustomerToken', () => {
    it('should sign customer token successfully', async () => {
      const payload = {
        sub: 'user-456',
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'CUSTOMER' as const,
      }
      const token = await signCustomerToken(payload)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should include correct payload in token', async () => {
      const payload = {
        sub: 'user-456',
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'CUSTOMER' as const,
      }
      const token = await signCustomerToken(payload)
      const verified = await verifyCustomerToken(token)
      expect(verified).not.toBeNull()
      expect(verified?.sub).toBe(payload.sub)
      expect(verified?.email).toBe(payload.email)
      expect(verified?.role).toBe(payload.role)
      expect(verified?.type).toBe('customer')
    })
  })

  describe('verifyAdminToken', () => {
    it('should verify valid admin token', async () => {
      const payload = {
        sub: 'user-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN' as const,
      }
      const token = await signAdminToken(payload)
      const verified = await verifyAdminToken(token)
      expect(verified).not.toBeNull()
      expect(verified?.type).toBe('admin')
    })

    it('should return null for invalid token', async () => {
      const verified = await verifyAdminToken('invalid-token')
      expect(verified).toBeNull()
    })

    it('should return null for customer token', async () => {
      const payload = {
        sub: 'user-456',
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'CUSTOMER' as const,
      }
      const token = await signCustomerToken(payload)
      const verified = await verifyAdminToken(token)
      expect(verified).toBeNull()
    })
  })

  describe('verifyCustomerToken', () => {
    it('should verify valid customer token', async () => {
      const payload = {
        sub: 'user-456',
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'CUSTOMER' as const,
      }
      const token = await signCustomerToken(payload)
      const verified = await verifyCustomerToken(token)
      expect(verified).not.toBeNull()
      expect(verified?.type).toBe('customer')
    })

    it('should return null for invalid token', async () => {
      const verified = await verifyCustomerToken('invalid-token')
      expect(verified).toBeNull()
    })

    it('should return null for admin token', async () => {
      const payload = {
        sub: 'user-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN' as const,
      }
      const token = await signAdminToken(payload)
      const verified = await verifyCustomerToken(token)
      expect(verified).toBeNull()
    })
  })
})
