/**
 * Custom Error Classes and Error Handling Utilities
 * 
 * Production-ready error handling with custom error types,
 * error codes, and structured error responses.
 */

import { logger } from './logger';

// ============================================
// ERROR CODES
// ============================================
 
export enum ErrorCode {
  // General errors (1000-1999)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Database errors (2000-2999)
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  
  // Authentication errors (3000-3999)
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  
  // Business logic errors (4000-4999)
  BUSINESS_INSUFFICIENT_STOCK = 'BUSINESS_INSUFFICIENT_STOCK',
  BUSINESS_INVALID_ORDER_STATUS = 'BUSINESS_INVALID_ORDER_STATUS',
  BUSINESS_PAYMENT_FAILED = 'BUSINESS_PAYMENT_FAILED',
  
  // External service errors (5000-5999)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
}

// ============================================
// CUSTOM ERROR CLASSES
// ============================================

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, ErrorCode.NOT_FOUND, 404, true, { resource, id });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.CONFLICT, 409, true, context);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, ErrorCode.UNAUTHORIZED, 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, ErrorCode.FORBIDDEN, 403, true);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.DATABASE_ERROR, 500, true, context);
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.AUTH_INVALID_CREDENTIALS) {
    super(message, code, 401, true);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>) {
    super(message, code, 400, true, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    const msg = message || `External service ${service} error`;
    super(msg, ErrorCode.EXTERNAL_SERVICE_ERROR, 502, true, { service });
  }
}

// ============================================
// ERROR HANDLING UTILITIES
// ============================================

export function handleError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Zod validation error
  if (error instanceof Error && error.name === 'ZodError') {
    logger.error('Validation error', { error });
    return new ValidationError('Invalid input data');
  }

  // Database errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('connection') || message.includes('connect')) {
      logger.error('Database connection error', { error });
      return new AppError(
        'Database connection failed',
        ErrorCode.DATABASE_CONNECTION_ERROR,
        503,
        true
      );
    }
    
    if (message.includes('duplicate') || message.includes('unique')) {
      logger.error('Database duplicate error', { error });
      return new ConflictError('Resource already exists');
    }
    
    if (message.includes('not found')) {
      logger.error('Database not found error', { error });
      return new NotFoundError('Resource');
    }
  }

  // Generic error
  logger.error('Unhandled error', { error });
  return new AppError(
    error instanceof Error ? error.message : 'An unexpected error occurred',
    ErrorCode.INTERNAL_ERROR,
    500,
    false
  );
}

export function logError(error: AppError): void {
  const context = {
    code: error.code,
    statusCode: error.statusCode,
    isOperational: error.isOperational,
    ...error.context,
  };

  if (error.statusCode >= 500) {
    logger.error(error.message, context);
  } else if (error.statusCode >= 400) {
    logger.warn(error.message, context);
  } else {
    logger.info(error.message, context);
  }
}

export function errorToResponse(error: AppError): Response {
  logError(error);

  const body = {
    error: {
      code: error.code,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        context: error.context,
      }),
    },
  };

  return new Response(JSON.stringify(body), {
    status: error.statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ============================================
// ASYNC ERROR WRAPPER
// ============================================

export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleError(error);
    }
  };
}

// ============================================
// ERROR BOUNDARY DATA
// ============================================

export interface ErrorBoundaryData {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  reset: () => void;
}

export function getErrorBoundaryData(error: Error, errorInfo: React.ErrorInfo | null = null): ErrorBoundaryData {
  logger.error('React Error Boundary caught an error', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
  });

  return {
    error,
    errorInfo,
    reset: () => {
      logger.info('Error boundary reset triggered');
      window.location.reload();
    },
  };
}
