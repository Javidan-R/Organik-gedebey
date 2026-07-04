/**
 * Type guard utilities for runtime type checking
 * These help ensure type safety when dealing with data from external sources
 */

/**
 * Check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}
 
/**
 * Check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if a value is an object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Check if a value is a function
 */
export function isFunction<T extends (...args: unknown[]) => unknown>(
  value: unknown
): value is T {
  return typeof value === 'function';
}

/**
 * Check if a value is null or undefined
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if a value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if a value is a valid email
 */
export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Check if a value is a valid URL
 */
export function isUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an object has a specific property
 */
export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  prop: K
): obj is Record<K, unknown> {
  return isObject(obj) && prop in obj;
}

/**
 * Type guard for API response with data
 */
export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: {
    message: string;
    code?: string;
  };
}

export function isApiResponse<T>(
  response: ApiResponse<T> | ApiError
): response is ApiResponse<T> {
  return 'data' in response && !('error' in response);
}

export function isApiError(response: ApiResponse<unknown> | ApiError): response is ApiError {
  return 'error' in response;
}

/**
 * Type guard for product data
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

export function isProduct(value: unknown): value is Product {
  if (!isObject(value)) return false;
  return (
    isString(value.id) &&
    isString(value.name) &&
    isNumber(value.price) &&
    isString(value.category) &&
    isNumber(value.stock)
  );
}

/**
 * Type guard for user data
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export function isUser(value: unknown): value is User {
  if (!isObject(value)) return false;
  return (
    isString(value.id) &&
    isEmail(value.email) &&
    isString(value.name) &&
    (value.role === 'admin' || value.role === 'user')
  );
}

/**
 * Type guard for order data
 */
export interface Order {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export function isOrder(value: unknown): value is Order {
  if (!isObject(value)) return false;
  if (!isString(value.id) || !isString(value.userId) || !isNumber(value.total)) {
    return false;
  }
  if (!isArray(value.items)) return false;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  return validStatuses.includes(value.status as string);
}

/**
 * Assert function that throws if condition is false
 */
export function assert(condition: unknown, message: string = 'Assertion failed'): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Assert that a value is of a specific type
 */
export function assertType<T>(value: unknown, typeGuard: (value: unknown) => value is T, message?: string): T {
  assert(typeGuard(value), message || `Value is not of expected type`);
  return value;
}

/**
 * Safe type narrowing with fallback
 */
export function narrowType<T>(
  value: unknown,
  typeGuard: (value: unknown) => value is T,
  fallback: T
): T {
  return typeGuard(value) ? value : fallback;
}
