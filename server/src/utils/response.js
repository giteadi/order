import { HTTP_STATUS } from '../config/index.js';

/**
 * Standard API Response Helpers
 * Ensures consistent response format across all endpoints
 */

/**
 * Success response
 */
export function success(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Created response
 */
export function created(res, data = null, message = 'Resource created successfully') {
  return success(res, data, message, HTTP_STATUS.CREATED);
}

/**
 * Error response
 */
export function error(res, message = 'An error occurred', statusCode = HTTP_STATUS.INTERNAL_ERROR, errors = null) {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Validation error response
 */
export function validationError(res, errors, message = 'Validation failed') {
  return error(res, message, HTTP_STATUS.UNPROCESSABLE, errors);
}

/**
 * Not found response
 */
export function notFound(res, resource = 'Resource') {
  return error(res, `${resource} not found`, HTTP_STATUS.NOT_FOUND);
}

/**
 * Unauthorized response
 */
export function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Forbidden response
 */
export function forbidden(res, message = 'Forbidden') {
  return error(res, message, HTTP_STATUS.FORBIDDEN);
}

/**
 * Conflict response
 */
export function conflict(res, message = 'Resource already exists') {
  return error(res, message, HTTP_STATUS.CONFLICT);
}

/**
 * Bad request response
 */
export function badRequest(res, message = 'Bad request', errors = null) {
  return error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
}

/**
 * Paginated response
 */
export function paginated(res, data, pagination, message = 'Success') {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
}

/**
 * No content response
 */
export function noContent(res) {
  return res.status(204).send();
}

/**
 * Rate limit response
 */
export function rateLimit(res, retryAfter) {
  return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    message: 'Too many requests, please try again later',
    retryAfter,
    timestamp: new Date().toISOString(),
  });
}
