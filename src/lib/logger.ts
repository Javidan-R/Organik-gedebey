/**
 * Comprehensive Logging System
 * 
 * Production-ready logging with structured logs, log levels,
 * and integration with monitoring services.
 */
 
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  stack?: string;
}

class Logger {
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogsInMemory = 100;

  constructor() {
    // Use process.env directly to avoid circular dependency
    this.minLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    // Add stack trace for errors
    if (level >= LogLevel.ERROR && context?.error instanceof Error) {
      entry.stack = context.error.stack;
    }

    // Keep in memory for debugging
    this.logs.push(entry);
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift();
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.timestamp}] [${levelName}]`;
    
    const logData = {
      ...entry.context,
      message: entry.message,
      timestamp: entry.timestamp,
      level: levelName,
    };

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.context || '');
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(entry);
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Integrate with Sentry, Datadog, or other monitoring service
    // This is a placeholder for production monitoring integration
    if (typeof window !== 'undefined') {
      // Client-side: send to monitoring endpoint
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        keepalive: true,
      }).catch(() => {
        // Silently fail to avoid infinite loops
      });
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.formatMessage(LogLevel.DEBUG, message, context);
    this.output(entry);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.formatMessage(LogLevel.INFO, message, context);
    this.output(entry);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.formatMessage(LogLevel.WARN, message, context);
    this.output(entry);
  }

  error(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.formatMessage(LogLevel.ERROR, message, context);
    this.output(entry);
  }

  fatal(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    const entry = this.formatMessage(LogLevel.FATAL, message, context);
    this.output(entry);
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear in-memory logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports
export const debug = (message: string, context?: LogContext) => logger.debug(message, context);
export const info = (message: string, context?: LogContext) => logger.info(message, context);
export const warn = (message: string, context?: LogContext) => logger.warn(message, context);
export const error = (message: string, context?: LogContext) => logger.error(message, context);
export const fatal = (message: string, context?: LogContext) => logger.fatal(message, context);
