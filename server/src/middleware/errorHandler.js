import { CONFIG, HTTP_STATUS } from '../config/index.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * Custom Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_ERROR, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper - eliminates try-catch boilerplate
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global Error Handler Middleware
 */
export function errorHandler(err, req, res, _next) {
  const timestamp = new Date().toISOString();
  
  // Default error values
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';
  let errors = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    errors = err.errors || [err.message];
  }
  
  else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid or expired token';
    code = 'UNAUTHORIZED';
  }
  
  else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token has expired';
    code = 'TOKEN_EXPIRED';
  }
  
  else if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Resource already exists';
    code = 'DUPLICATE_ERROR';
  }
  
  else if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Referenced resource does not exist';
    code = 'FOREIGN_KEY_ERROR';
  }
  
  else if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    statusCode = HTTP_STATUS.UNPROCESSABLE;
    message = 'Required field missing';
    code = 'REQUIRED_FIELD_ERROR';
  }
  
  else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'File upload error';
    code = 'FILE_UPLOAD_ERROR';
  }
  
  else if (err.type === 'entity.parse.failed') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid JSON payload';
    code = 'INVALID_JSON';
  }

  // Log error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel](message, {
    code,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    stack: CONFIG.IS_DEV ? err.stack : undefined,
    userId: req.user?.id,
  });

  // Send response
  const response = {
    success: false,
    message,
    code,
    timestamp,
    ...(errors && { errors }),
    ...(CONFIG.IS_DEV && {
      stack: err.stack,
      details: err.message,
    }),
  };

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found Handler
 */
export function notFoundHandler(req, res) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Request timeout handler
 */
export function timeoutHandler(req, res, next) {
  req.setTimeout(30000, () => {
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Request timeout',
      code: 'REQUEST_TIMEOUT',
      timestamp: new Date().toISOString(),
    });
  });
  next();
}
