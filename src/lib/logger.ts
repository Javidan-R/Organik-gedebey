// src/lib/logger.ts

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

  constructor() {
    this.minLevel =
      process.env.NODE_ENV === 'production'
        ? LogLevel.INFO
        : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private format(level: LogLevel, message: string, context?: LogContext): string {
    const levelName = LogLevel[level];
    const timestamp = new Date().toISOString();
    let output = `[${timestamp}] [${levelName}] ${message}`;
    if (context && Object.keys(context).length > 0) {
      try {
        output += ' ' + JSON.stringify(context);
      } catch {
        output += ' [unstringifiable context]';
      }
    }
    if (context?.error instanceof Error) {
      output += '\n' + (context.error.stack || context.error.message);
    }
    return output;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.debug(this.format(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.info(this.format(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.format(LogLevel.WARN, message, context));
  }

  error(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    console.error(this.format(LogLevel.ERROR, message, context));
  }

  fatal(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    console.error(this.format(LogLevel.FATAL, message, context));
  }
}

export const logger = new Logger();