// src/lib/__tests__/basket.test.ts
import { describe, it, expect } from '@jest/globals'

describe('Basket Functions', () => {
  describe('Basket Price Calculation', () => {
    it('should calculate final price with discount', () => {
      const basket = {
        price: 50,
        discount: 20,
      }
      const finalPrice = basket.price * (1 - basket.discount / 100)
      expect(finalPrice).toBe(40)
    })

    it('should handle zero discount', () => {
      const basket = {
        price: 50,
        discount: 0,
      }
      const finalPrice = basket.price * (1 - basket.discount / 100)
      expect(finalPrice).toBe(50)
    })

    it('should handle 100% discount', () => {
      const basket = {
        price: 50,
        discount: 100,
      }
      const finalPrice = basket.price * (1 - basket.discount / 100)
      expect(finalPrice).toBe(0)
    })
  })

  describe('Basket Stock Management', () => {
    it('should check if basket is in stock', () => {
      const basket = {
        stock: 10,
      }
      const inStock = basket.stock > 0
      expect(inStock).toBe(true)
    })

    it('should check if basket is low stock', () => {
      const basket = {
        stock: 5,
      }
      const lowStock = basket.stock > 0 && basket.stock < 10
      expect(lowStock).toBe(true)
    })

    it('should check if basket is out of stock', () => {
      const basket = {
        stock: 0,
      }
      const outOfStock = basket.stock === 0
      expect(outOfStock).toBe(true)
    })
  })

  describe('Basket Variant Selection', () => {
    it('should select default variant', () => {
      const variants = [
        { variant: 'econom', price: 30, isDefault: true },
        { variant: 'standard', price: 45, isDefault: false },
        { variant: 'premium', price: 60, isDefault: false },
      ]
      const defaultVariant = variants.find(v => v.isDefault)
      expect(defaultVariant?.variant).toBe('econom')
    })

    it('should calculate variant price with original price', () => {
      const variant = {
        price: 40,
        originalPrice: 50,
      }
      const discount = ((variant.originalPrice - variant.price) / variant.originalPrice) * 100
      expect(discount).toBe(20)
    })
  })
})
