// src/lib/__tests__/calc.test.ts
import { finalPrice, calculateDeliveryFee, ageInDays } from '../calc'

describe('Calc Functions', () => {
  describe('finalPrice', () => {
    it('should calculate final price with percentage discount', () => {
      const product = {
        basePrice: '100',
        discountType: 'PERCENTAGE',
        discountValue: '20',
      }
      expect(finalPrice(product)).toBe('80.00')
    })

    it('should calculate final price with fixed discount', () => {
      const product = {
        basePrice: '100',
        discountType: 'FIXED',
        discountValue: '15',
      }
      expect(finalPrice(product)).toBe('85.00')
    })

    it('should return base price when no discount', () => {
      const product = {
        basePrice: '100',
        discountType: null,
        discountValue: null,
      }
      expect(finalPrice(product)).toBe('100.00')
    })

    it('should handle discount start/end dates', () => {
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const activeDiscount = {
        basePrice: '100',
        discountType: 'PERCENTAGE',
        discountValue: '20',
        discountStart: yesterday.toISOString(),
        discountEnd: tomorrow.toISOString(),
      }

      const inactiveDiscount = {
        basePrice: '100',
        discountType: 'PERCENTAGE',
        discountValue: '20',
        discountStart: tomorrow.toISOString(),
        discountEnd: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      }

      expect(finalPrice(activeDiscount)).toBe('80.00')
      expect(finalPrice(inactiveDiscount)).toBe('100.00')
    })
  })

  describe('calculateDeliveryFee', () => {
    it('should return 0 for orders above threshold', () => {
      const cartTotal = 50
      expect(calculateDeliveryFee(cartTotal)).toBe(0)
    })

    it('should return delivery fee for orders below threshold', () => {
      const cartTotal = 20
      expect(calculateDeliveryFee(cartTotal)).toBeGreaterThan(0)
    })

    it('should handle edge case at threshold', () => {
      const cartTotal = 30
      expect(calculateDeliveryFee(cartTotal)).toBe(0)
    })
  })

  describe('ageInDays', () => {
    it('should calculate age in days correctly', () => {
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      expect(ageInDays(oneDayAgo.toISOString())).toBe(1)
    })

    it('should return 0 for future dates', () => {
      const now = new Date()
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      expect(ageInDays(future.toISOString())).toBe(0)
    })

    it('should handle null/undefined', () => {
      expect(ageInDays(null as any)).toBe(0)
      expect(ageInDays(undefined as any)).toBe(0)
    })
  })
})
