/**
 * Centralized Validation Utilities
 * All validation functions to prevent code duplication
 */

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Basic email validation
 */
export function basicEmailValidate(email: string): boolean {
  if (email.length > 255) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
  return emailRegex.test(email.toLowerCase());
}

/**
 * Strict email validation
 */
export function strictEmailValidate(email: string): boolean {
  if (!basicEmailValidate(email)) return false;
  const strictRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return strictRegex.test(email);
}

// ============================================================================
// PHONE VALIDATION
// ============================================================================

/**
 * Basic phone validation (9-digit Azerbaijani numbers)
 */
export function basicPhoneValidate(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[()\s-]/g, '');
  return /^\d{9}$/.test(cleaned) && 
    ['50', '51', '55', '70', '77', '99', '40', '10'].some(prefix => cleaned.startsWith(prefix));
}

/**
 * Format and validate phone
 */
export function formatAndValidatePhone(phone: string): { valid: boolean; formatted: string } {
  const cleaned = phone.replace(/\D/g, '');
  const valid = basicPhoneValidate(cleaned);
  
  if (valid && cleaned.length === 9) {
    return {
      valid: true,
      formatted: `+994 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`,
    };
  }
  
  return { valid: false, formatted: phone };
}

// ============================================================================
// NUMBER VALIDATION
// ============================================================================

/**
 * Validate positive number
 */
export function isPositiveNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Validate non-negative number
 */
export function isNonNegativeNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Validate integer
 */
export function isInteger(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && Number.isInteger(value);
}

/**
 * Validate number in range
 */
export function isNumberInRange(value: any, min: number, max: number): boolean {
  return isNonNegativeNumber(value) && value >= min && value <= max;
}

// ============================================================================
// STRING VALIDATION
// ============================================================================

/**
 * Validate non-empty string
 */
export function isNonEmptyString(value: any): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate string length
 */
export function isStringLengthInRange(value: any, min: number, max: number): boolean {
  return isNonEmptyString(value) && value.length >= min && value.length <= max;
}

/**
 * Validate URL
 */
export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// DATE VALIDATION
// ============================================================================

/**
 * Validate date string
 */
export function isValidDateString(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Check if date is in the past
 */
export function isPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date.getTime() < now.getTime();
}

/**
 * Check if date is in the future
 */
export function isFutureDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date.getTime() > now.getTime();
}

/**
 * Check if date is expired
 */
export function isExpired(dateString: string | Date): boolean {
  const targetDate = new Date(dateString);
  const now = new Date();
  return targetDate.getTime() < now.getTime() - 1000; 
}

// ============================================================================
// OBJECT VALIDATION
// ============================================================================

/**
 * Validate required fields in object
 */
export function validateRequiredFields(obj: Record<string, any>, requiredFields: string[]): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Check if object has duplicate IDs
 */
export function hasDuplicateIds(arr: Array<{ id: string }>): boolean {
  const ids = arr.map(item => item.id);
  return new Set(ids).size !== ids.length;
}

// ============================================================================
// FINANCE VALIDATION
// ============================================================================

/**
 * Validate price
 */
export function isValidPrice(value: any): boolean {
  return isNonNegativeNumber(value) && value <= 1000000; // Reasonable max price
}

/**
 * Validate discount value
 */
export function isValidDiscountValue(value: any, type: 'percentage' | 'fixed'): boolean {
  if (!isNonNegativeNumber(value)) return false;
  
  if (type === 'percentage') {
    return value <= 100;
  }
  
  return value <= 10000; // Reasonable max fixed discount
}

/**
 * Validate stock quantity
 */
export function isValidStock(value: any): boolean {
  return isNonNegativeNumber(value) && isInteger(value) && value <= 10000;
}
