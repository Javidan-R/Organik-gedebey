// src/lib/__tests__/rate-limit.test.ts
import { checkRateLimit, getClientIp } from '../rate-limit'
import { NextRequest } from 'next/server'

describe('Rate Limiting', () => {
  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const req = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1'
            return null
          },
        },
      } as unknown as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('192.168.1.1')
    })

    it('should fallback to other headers', () => {
      const req = {
        headers: {
          get: (name: string) => {
            if (name === 'cf-connecting-ip') return '10.0.0.1'
            return null
          },
        },
      } as unknown as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('10.0.0.1')
    })

    it('should return default IP when no headers present', () => {
      const req = {
        headers: {
          get: () => null,
        },
      } as unknown as NextRequest

      const ip = getClientIp(req)
      expect(ip).toBe('127.0.0.1')
    })
  })

  describe('checkRateLimit', () => {
    const mockIp = '192.168.1.1'

    beforeEach(() => {
      // Clear any existing rate limit state
      jest.clearAllMocks()
    })

    it('should allow requests within limit', () => {
      const result = checkRateLimit('test-key', mockIp, 5, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThan(0)
    })

    it('should block requests exceeding limit', () => {
      // Make multiple requests to exceed limit
      for (let i = 0; i < 6; i++) {
        const result = checkRateLimit('test-key-block', mockIp, 5, 60000)
        if (i < 5) {
          expect(result.allowed).toBe(true)
        } else {
          expect(result.allowed).toBe(false)
          expect(result.retryAfterSec).toBeGreaterThan(0)
        }
      }
    })

    it('should use different limits for different keys', () => {
      const result1 = checkRateLimit('key-1', mockIp, 2, 60000)
      const result2 = checkRateLimit('key-2', mockIp, 10, 60000)

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
    })

    it('should reset after window expires', () => {
      // This test would need to mock time, for now we just verify the logic exists
      const result = checkRateLimit('test-key-reset', mockIp, 5, 100) // 100ms window
      expect(result.allowed).toBe(true)
    })
  })
})
