import { Injectable, LoggerService } from '@nestjs/common';
import { MyConfiguration } from '../MyConfiguration';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface StructuredLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  correlationId?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly isDevelopment = MyConfiguration.NODE_ENV() === 'development';

  log(message: string, context?: LogContext): void {
    this.writeLog('info', message, context);
  }

  error(message: string, stack?: string, context?: LogContext): void {
    this.writeLog('error', message, { ...context, stack });
  }

  warn(message: string, context?: LogContext): void {
    this.writeLog('warn', message, context);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.writeLog('debug', message, context);
    }
  }

  verbose(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.writeLog('debug', message, context);
    }
  }

  private writeLog(level: StructuredLog['level'], message: string, context?: LogContext & { stack?: string }): void {
    const structuredLog: StructuredLog = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: context?.correlationId,
      userId: context?.userId,
      action: context?.action,
      metadata: context?.metadata,
      stack: context?.stack,
    };

    if (this.isDevelopment) {
      // Pretty print for development
      const logMethod = console[level] || console.log;
      const prefix = `[${structuredLog.timestamp}] [${level.toUpperCase()}]`;
      const correlationPart = structuredLog.correlationId ? ` [${structuredLog.correlationId}]` : '';
      const userPart = structuredLog.userId ? ` [User: ${structuredLog.userId}]` : '';
      const actionPart = structuredLog.action ? ` [${structuredLog.action}]` : '';
      
      logMethod(`${prefix}${correlationPart}${userPart}${actionPart} ${message}`);
      
      if (structuredLog.metadata) {
        console.log('Metadata:', JSON.stringify(structuredLog.metadata, null, 2));
      }
      
      if (structuredLog.stack) {
        console.error('Stack:', structuredLog.stack);
      }
    } else {
      // Structured JSON for production
      console.log(JSON.stringify(structuredLog));
    }
  }

  // Helper methods for common logging patterns
  logUserAction(userId: string, action: string, message: string, metadata?: Record<string, any>, correlationId?: string): void {
    this.log(message, { userId, action, metadata, correlationId });
  }

  logError(error: Error, context?: LogContext): void {
    this.error(error.message, error.stack, context);
  }

  logPerformance(action: string, duration: number, context?: LogContext): void {
    this.log(`Performance: ${action} completed in ${duration}ms`, {
      ...context,
      action,
      metadata: { ...context?.metadata, duration },
    });
  }

  logDatabaseQuery(query: string, duration: number, context?: LogContext): void {
    if (this.isDevelopment) {
      this.debug(`Database Query: ${query} (${duration}ms)`, {
        ...context,
        action: 'database_query',
        metadata: { ...context?.metadata, query, duration },
      });
    } else {
      this.log('Database query executed', {
        ...context,
        action: 'database_query',
        metadata: { ...context?.metadata, duration },
      });
    }
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: LogContext): void {
    const message = `Security Event: ${event}`;
    const logContext = {
      ...context,
      action: 'security_event',
      metadata: { ...context?.metadata, severity },
    };

    if (severity === 'high') {
      this.error(message, undefined, logContext);
    } else if (severity === 'medium') {
      this.warn(message, logContext);
    } else {
      this.log(message, logContext);
    }
  }
}
