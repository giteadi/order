import winston from 'winston';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { CONFIG } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Singleton Logger Service
 * Structured logging with file and console transports
 */
class LoggerService {
  constructor() {
    this.logger = null;
    this.initialize();
  }

  static getInstance() {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  initialize() {
    // Ensure logs directory exists
    const logDir = dirname(CONFIG.LOG.FILE);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    const formats = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const transports = [
      // File transport for all logs
      new winston.transports.File({
        filename: CONFIG.LOG.FILE,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: formats,
      }),
      // Separate file for errors
      new winston.transports.File({
        filename: join(dirname(CONFIG.LOG.FILE), 'error.log'),
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5,
        format: formats,
      }),
    ];

    // Console transport for development
    if (CONFIG.LOG.CONSOLE) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ level, message, timestamp, ...metadata }) => {
              let msg = `${timestamp} [${level}]: ${message}`;
              if (Object.keys(metadata).length > 0) {
                msg += ` ${JSON.stringify(metadata)}`;
              }
              return msg;
            })
          ),
        })
      );
    }

    this.logger = winston.createLogger({
      level: CONFIG.LOG.LEVEL,
      defaultMeta: { service: 'arthaus-api' },
      transports,
      exitOnError: false,
    });
  }

  // Logging methods
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  // Request logging middleware
  requestLogger(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    });

    next();
  }
}

export const Logger = LoggerService;
