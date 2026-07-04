// src/lib/validations/__tests__/passwordSchema.test.ts
import { passwordSchema } from '../passwordSchema'
import { z } from 'zod'

describe('Password Schema Validation', () => {
  it('should accept valid password', () => {
    const result = passwordSchema.safeParse('SecurePass123!')
    expect(result.success).toBe(true)
  })

  it('should reject password shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('Short1!')
    expect(result.success).toBe(false)
  })

  it('should reject password without uppercase letter', () => {
    const result = passwordSchema.safeParse('lowercase123!')
    expect(result.success).toBe(false)
  })

  it('should reject password without lowercase letter', () => {
    const result = passwordSchema.safeParse('UPPERCASE123!')
    expect(result.success).toBe(false)
  })

  it('should reject password without number', () => {
    const result = passwordSchema.safeParse('NoNumbers!')
    expect(result.success).toBe(false)
  })

  it('should reject password without special character', () => {
    const result = passwordSchema.safeParse('NoSpecial123')
    expect(result.success).toBe(false)
  })

  it('should reject password longer than 128 characters', () => {
    const longPassword = 'A' + 'a1!'.repeat(43) // 129 characters
    const result = passwordSchema.safeParse(longPassword)
    expect(result.success).toBe(false)
  })

  it('should accept password with all requirements', () => {
    const result = passwordSchema.safeParse('ValidPass123!@#')
    expect(result.success).toBe(true)
  })
})
