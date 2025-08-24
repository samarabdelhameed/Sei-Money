/**
 * Logging system for Discord Bot
 */

import winston from 'winston';

export class Logger {
  private logger: winston.Logger;

  constructor(service: string = 'discord-bot') {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // File transport for errors
        new winston.transports.File({
          filename: 'logs/discord-error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: 'logs/discord-combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });

    // Handle uncaught exceptions
    this.logger.exceptions.handle(
      new winston.transports.File({ filename: 'logs/discord-exceptions.log' })
    );

    // Handle unhandled rejections
    this.logger.rejections.handle(
      new winston.transports.File({ filename: 'logs/discord-rejections.log' })
    );
  }

  /**
   * Log info message
   */
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log error message
   */
  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  /**
   * Log command execution
   */
  logCommand(userId: number | string, command: string, args: string[], success: boolean): void {
    this.info('Discord command executed', {
      userId,
      command,
      args,
      success,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log transaction
   */
  logTransaction(userId: number | string, type: string, txHash: string, success: boolean): void {
    this.info('Discord transaction executed', {
      userId,
      type,
      txHash,
      success,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log user activity
   */
  logUserActivity(userId: number | string, action: string, details?: any): void {
    this.info('Discord user activity', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log system event
   */
  logSystemEvent(event: string, details?: any): void {
    this.info('Discord system event', {
      event,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get logger instance
   */
  getLogger(): winston.Logger {
    return this.logger;
  }
}

// Create default logger instance
export const logger = new Logger();