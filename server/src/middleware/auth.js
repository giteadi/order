import jwt from 'jsonwebtoken';
import { CONFIG, HTTP_STATUS } from '../config/index.js';
import { getDB } from '../database/connection.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * Extract token from request headers
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie as fallback
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  
  return null;
}

/**
 * JWT Authentication Middleware
 * Verifies token and attaches user to request
 */
export function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Access token required',
        code: 'NO_TOKEN',
      });
    }

    const decoded = jwt.verify(token, CONFIG.JWT.SECRET);
    
    // Verify user exists in database (optional but recommended)
    const db = getDB();
    const user = db.prepare('SELECT id, uuid, email, name, role, is_active FROM users WHERE id = ?').get(decoded.id);
    
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }
    
    if (!user.is_active) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    req.user = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', { error: error.message, ip: req.ip });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }
    
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
}

/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        role: req.user.role,
        required: allowedRoles,
        path: req.path,
      });
      
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
}

/**
 * Optional authentication - attaches user if token valid, doesn't reject if missing
 */
export function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, CONFIG.JWT.SECRET);
    
    const db = getDB();
    const user = db.prepare('SELECT id, uuid, email, name, role FROM users WHERE id = ? AND is_active = 1').get(decoded.id);
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch {
    // Silently ignore auth errors for optional auth
    next();
  }
}

/**
 * Generate JWT token
 */
export function generateToken(payload, expiresIn = CONFIG.JWT.EXPIRES_IN) {
  return jwt.sign(payload, CONFIG.JWT.SECRET, {
    expiresIn,
    algorithm: CONFIG.JWT.ALGORITHM,
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId) {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    CONFIG.JWT.SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, CONFIG.JWT.SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw error;
  }
}
