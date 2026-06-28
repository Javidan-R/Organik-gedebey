// src/lib/sentry.ts
// Sentry configuration for error monitoring and performance tracking

import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Sample rate for performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Sample rate for session replay
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    
    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // beforeSend filter to filter out sensitive data
    beforeSend(event, hint) {
      // Filter out errors from development if needed
      if (process.env.NODE_ENV === 'development') {
        console.error('[Sentry]', event, hint)
        // Don't send to Sentry in development
        return null
      }
      
      // Filter out specific error types if needed
      if (event.exception) {
        const error = hint.originalException
        if (error instanceof Error) {
          // Filter out client-side navigation errors
          if (error.message.includes('Loading chunk')) {
            return null
          }
        }
      }
      
      return event
    },
    
    // Filter out sensitive data from request headers
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
        const data = breadcrumb.data as any
        if (data) {
          delete data.url
          delete data.headers
        }
      }
      return breadcrumb
    },
    
    // Set user context when available
    setUser(user: { id?: string; email?: string; role?: string } | null) {
      if (user) {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          role: user.role,
        })
      } else {
        Sentry.setUser(null)
      }
    },
  })
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  })
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, {
    level,
  })
}

export function setTag(key: string, value: string) {
  Sentry.setTag(key, value)
}

export function setContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context)
}
