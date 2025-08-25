import * as winston from 'winston';
import { Logger, LogLevel } from '../types';

/**
 * Create a Winston logger instance with proper formatting
 */
export function createLogger(level: LogLevel = 'info', logFile?: string): Logger {
  const formats = [
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ];

  // Add colorization for console output
  const consoleFormats = [
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    }),
  ];

  const transports: winston.transport[] = [
    new winston.transports.Console({
      level,
      format: winston.format.combine(...consoleFormats),
    }),
  ];

  // Add file transport if specified
  if (logFile) {
    transports.push(
      new winston.transports.File({
        filename: logFile,
        level,
        format: winston.format.combine(...formats),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );
  }

  const winstonLogger = winston.createLogger({
    level,
    format: winston.format.combine(...formats),
    transports,
    exitOnError: false,
  });

  return {
    error: (message: string, meta?: any) => winstonLogger.error(message, meta),
    warn: (message: string, meta?: any) => winstonLogger.warn(message, meta),
    info: (message: string, meta?: any) => winstonLogger.info(message, meta),
    debug: (message: string, meta?: any) => winstonLogger.debug(message, meta),
  };
}

/**
 * Default logger instance
 */
let defaultLogger: Logger | null = null;

/**
 * Get or create the default logger
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = createLogger();
  }
  return defaultLogger;
}

/**
 * Initialize logger with configuration
 */
export function initializeLogger(level: LogLevel, logFile?: string): Logger {
  defaultLogger = createLogger(level, logFile);
  return defaultLogger;
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(parent: Logger, context: Record<string, any>): Logger {
  return {
    error: (message: string, meta?: any) => parent.error(message, { ...context, ...meta }),
    warn: (message: string, meta?: any) => parent.warn(message, { ...context, ...meta }),
    info: (message: string, meta?: any) => parent.info(message, { ...context, ...meta }),
    debug: (message: string, meta?: any) => parent.debug(message, { ...context, ...meta }),
  };
}