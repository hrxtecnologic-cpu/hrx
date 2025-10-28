/**
 * Sistema de Logging Estruturado
 *
 * Fornece logging consistente e estruturado para toda a aplicação
 * Integração pronta para Sentry, LogRocket, ou outros serviços
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security';

interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Formata log para output estruturado
   */
  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;

    if (this.isDevelopment) {
      // Formato legível para desenvolvimento
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        security: '🔒',
      }[level];

      let log = `${emoji} [${level.toUpperCase()}] ${message}`;

      if (context) {
        log += `\n   Context: ${JSON.stringify(context, null, 2)}`;
      }

      if (error) {
        log += `\n   Error: ${error.message}`;
        if (error.stack) {
          log += `\n   Stack: ${error.stack}`;
        }
      }

      return log;
    }

    // Formato JSON para produção (fácil de parsear)
    return JSON.stringify({
      ...entry,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    });
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, context?: LogContext) {
    if (!this.isDevelopment) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      context,
    };

    console.log(this.formatLog(entry));
  }

  /**
   * Log de informação
   */
  info(message: string, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    };

    console.log(this.formatLog(entry));
  }

  /**
   * Log de warning
   */
  warn(message: string, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    };

    console.warn(this.formatLog(entry));

    // Enviar warnings críticos para Sentry em produção
    if (!this.isDevelopment && context?.critical) {
      this.sendToSentry(new Error(message), context, 'warning');
    }
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error,
      context,
    };

    console.error(this.formatLog(entry));

    // Enviar para Sentry em produção
    if (!this.isDevelopment) {
      this.sendToSentry(error || new Error(message), context, 'error');
    }
  }

  /**
   * Log de evento de segurança
   * SEMPRE loga, mesmo em produção
   */
  security(message: string, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'security',
      message,
      context,
    };

    console.warn(this.formatLog(entry));

    // Enviar para Sentry com tag de segurança
    if (!this.isDevelopment) {
      this.sendToSentry(new Error(message), { ...context, securityEvent: true }, 'warning');
    }
  }

  /**
   * Envia erro para Sentry com contexto estruturado
   */
  private sendToSentry(error: Error, context?: LogContext, level: 'error' | 'warning' = 'error') {
    // Importação dinâmica para evitar problemas em edge runtime
    if (typeof window !== 'undefined') {
      // Client-side
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          level,
          contexts: {
            custom: context || {},
          },
          tags: {
            userId: context?.userId,
            securityEvent: context?.securityEvent ? 'true' : 'false',
          },
        });
      });
    } else {
      // Server-side
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          level,
          contexts: {
            custom: context || {},
          },
          tags: {
            userId: context?.userId,
            securityEvent: context?.securityEvent ? 'true' : 'false',
          },
        });
      });
    }
  }
}

/**
 * Instância singleton do logger
 */
export const logger = new Logger();

/**
 * Helpers para contextos comuns
 */
export function createRequestContext(
  userId?: string,
  requestId?: string,
  ip?: string,
  userAgent?: string
): LogContext {
  return {
    userId,
    requestId,
    ip,
    userAgent,
  };
}

/**
 * Log de eventos de autenticação
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'signup' | 'unauthorized' | 'forbidden',
  userId?: string,
  details?: Record<string, any>
) {
  logger.security(`Auth event: ${event}`, {
    event,
    userId,
    ...details,
  });
}

/**
 * Log de operações com documentos
 */
export function logDocumentOperation(
  operation: 'upload' | 'view' | 'approve' | 'reject' | 'delete',
  userId: string,
  documentType: string,
  details?: Record<string, any>
) {
  logger.info(`Document ${operation}: ${documentType}`, {
    operation,
    userId,
    documentType,
    ...details,
  });
}

/**
 * Log de mudanças de dados sensíveis
 */
export function logDataChange(
  entity: string,
  entityId: string,
  changedBy: string,
  changes: Record<string, any>
) {
  logger.warn(`Data changed: ${entity} ${entityId}`, {
    entity,
    entityId,
    changedBy,
    changes,
  });
}
