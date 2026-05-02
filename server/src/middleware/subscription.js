import { getDB } from '../database/connection.js';
import { HTTP_STATUS } from '../config/index.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * Subscription Middleware - Checks if user has active subscription
 * Blocks access if subscription is expired or inactive
 * Implements soft lock (3-day grace period)
 */
export function checkSubscription(req, res, next) {
  try {
    const userId = req.user.id;
    const db = getDB();

    // Check for active subscription
    const subscription = db.prepare(`
      SELECT us.*, sp.name as plan_name, sp.price, sp.duration_months, sp.features
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ?
      AND us.status = 'active'
      AND us.end_date > datetime('now')
      ORDER BY us.end_date DESC
      LIMIT 1
    `).get(userId);

    if (subscription) {
      // Active subscription found
      req.subscription = subscription;
      return next();
    }

    // Check if user is in grace period (soft lock)
    const gracePeriod = db.prepare(`
      SELECT us.*,
             julianday(datetime('now')) - julianday(us.end_date) as days_expired,
             sp.name as plan_name, sp.price
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ?
      AND us.status = 'expired'
      AND julianday(datetime('now')) - julianday(us.end_date) <= 3
      ORDER BY us.end_date DESC
      LIMIT 1
    `).get(userId);

    if (gracePeriod) {
      logger.warn('Subscription in grace period', {
        userId,
        daysExpired: gracePeriod.days_expired,
        path: req.path
      });

      // Grace period - allow access but warn
      req.subscription = gracePeriod;
      req.isGracePeriod = true;
      return next();
    }

    // No active subscription and not in grace period - hard block
    logger.warn('Subscription check failed - no active subscription', {
      userId,
      path: req.path
    });

    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Subscription expired. Please renew your plan to continue.',
      code: 'SUBSCRIPTION_EXPIRED',
      requiresRenewal: true,
      isHardBlock: true
    });

  } catch (error) {
    logger.error('Subscription check error', {
      error: error.message,
      userId: req.user?.id
    });

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Server error while checking subscription',
      code: 'SUBSCRIPTION_CHECK_ERROR'
    });
  }
}

/**
 * Optional subscription check - doesn't block, just attaches subscription info
 * Useful for features that work differently based on subscription status
 */
export function optionalSubscription(req, res, next) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next();
    }

    const db = getDB();
    const subscription = db.prepare(`
      SELECT us.*, sp.name as plan_name, sp.price, sp.duration_months, sp.features
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ? 
      AND us.status = 'active'
      AND us.end_date > datetime('now')
      ORDER BY us.end_date DESC
      LIMIT 1
    `).get(userId);

    req.subscription = subscription || null;
    next();

  } catch (error) {
    logger.error('Optional subscription check error', { error: error.message });
    req.subscription = null;
    next();
  }
}

/**
 * Role-based subscription bypass
 * Super admins can bypass subscription check
 */
export function checkSubscriptionWithBypass(req, res, next) {
  // Super admins bypass subscription check
  if (req.user?.role === 'super_admin') {
    return next();
  }

  return checkSubscription(req, res, next);
}
