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

    // Check for active subscription (not manually blocked)
    const subscription = db.prepare(`
      SELECT us.*, sp.name as plan_name, sp.price, sp.duration_months, sp.features
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ?
      AND us.status = 'active'
      AND us.end_date > datetime('now')
      AND (us.is_manually_blocked IS NULL OR us.is_manually_blocked = 0)
      ORDER BY us.end_date DESC
      LIMIT 1
    `).get(userId);

    if (subscription) {
      // Active subscription found
      req.subscription = subscription;
      return next();
    }

    // Check if subscription is manually blocked by admin
    const blockedSubscription = db.prepare(`
      SELECT us.*, sp.name as plan_name, sp.price, sp.duration_months, sp.features,
             us.block_reason, us.blocked_at, us.blocked_by
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ?
      AND us.status = 'active'
      AND us.end_date > datetime('now')
      AND us.is_manually_blocked = 1
      ORDER BY us.end_date DESC
      LIMIT 1
    `).get(userId);

    if (blockedSubscription) {
      logger.warn('Subscription manually blocked by admin', {
        userId,
        blockReason: blockedSubscription.block_reason,
        blockedAt: blockedSubscription.blocked_at,
        path: req.path
      });

      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Your subscription has been suspended by admin. Please contact support.',
        code: 'SUBSCRIPTION_BLOCKED',
        blockReason: blockedSubscription.block_reason,
        blockedAt: blockedSubscription.blocked_at,
        isHardBlock: true,
        requiresContactSupport: true
      });
    }

    // No active subscription - immediate hard block (no grace period)
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
