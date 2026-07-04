import { logger } from '@/lib/logger'

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} tapılmadı`)
    this.name = 'NotFoundError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Authorization failed') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export function handleDatabaseError(error: unknown, context: string): never {
  logger.error(`[Database Error] ${context}`, { error })
  
  if (error instanceof Error) {
    if (error.message.includes('connection')) {
      throw new DatabaseError('Database connection failed', error)
    }
    if (error.message.includes('timeout')) {
      throw new DatabaseError('Database operation timed out', error)
    }
    if (error.message.includes('duplicate')) {
      throw new ValidationError('Duplicate entry detected', error)
    }
    if (error.message.includes('foreign key')) {
      throw new ValidationError('Invalid reference to related data', error)
    }
  }
  
  throw new DatabaseError('An unexpected database error occurred', error)
}

export function handleApiError(error: unknown): { error: string; status: number; details?: unknown } {
  if (error instanceof DatabaseError) {
    return { error: error.message, status: 500, details: error.originalError }
  }
  if (error instanceof ValidationError) {
    return { error: error.message, status: 400, details: error.details }
  }
  if (error instanceof NotFoundError) {
    return { error: error.message, status: 404 }
  }
  if (error instanceof AuthenticationError) {
    return { error: error.message, status: 401 }
  }
  if (error instanceof AuthorizationError) {
    return { error: error.message, status: 403 }
  }
  
  logger.error('[Unhandled API Error]', { error })
  return { error: 'Server xətası baş verdi', status: 500 }
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    handleDatabaseError(error, context)
  }
}
