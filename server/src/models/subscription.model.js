import { BaseModel } from './base.model.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * Subscription Model - Handles subscription plans and user subscriptions
 */
export class SubscriptionModel extends BaseModel {
  constructor() {
    super('subscription_plans');
  }

  /**
   * Get all active plans (unique by name and price)
   */
  getActivePlans() {
    try {
      const sql = `
        SELECT id, name, price, duration_months, features
        FROM subscription_plans
        WHERE is_active = 1
        GROUP BY name, price
        HAVING id = MIN(id)
        ORDER BY duration_months ASC
      `;
      const result = this.query(sql);
      // Ensure always return array
      return Array.isArray(result) ? result : [];
    } catch (error) {
      logger.error('getActivePlans error', { error: error.message });
      return [];
    }
  }

  /**
   * Get plan by ID
   */
  getPlanById(planId) {
    const sql = `
      SELECT id, name, price, duration_months, features
      FROM subscription_plans
      WHERE id = ? AND is_active = 1
    `;
    return this.queryOne(sql, [planId]);
  }

  /**
   * Create user subscription
   */
  createSubscription({ userId, planId, transactionId, paymentProof }) {
    const plan = this.getPlanById(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration_months);

    const sql = `
      INSERT INTO user_subscriptions 
      (user_id, plan_id, start_date, end_date, status, transaction_id, payment_proof)
      VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `;

    const result = this.run(sql, [
      userId,
      planId,
      startDate.toISOString(),
      endDate.toISOString(),
      transactionId,
      paymentProof
    ]);

    return this.getById(result.lastInsertRowid);
  }

  /**
   * Get user's active subscription
   */
  getUserActiveSubscription(userId) {
    const sql = `
      SELECT us.*, sp.name as plan_name, sp.price, sp.duration_months, sp.features
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ? 
      AND us.status = 'active'
      AND us.end_date > datetime('now')
      ORDER BY us.end_date DESC
      LIMIT 1
    `;
    return this.queryOne(sql, [userId]);
  }

  /**
   * Get user's subscription history
   */
  getUserSubscriptions(userId) {
    const sql = `
      SELECT us.*, sp.name as plan_name, sp.price, sp.duration_months
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ?
      ORDER BY us.created_at DESC
    `;
    return this.query(sql, [userId]);
  }

  /**
   * Verify payment (admin action)
   */
  verifyPayment(subscriptionId, verifiedBy) {
    const sql = `
      UPDATE user_subscriptions
      SET status = 'active',
          payment_verified = 1,
          verified_by = ?,
          verified_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `;
    this.execute(sql, [verifiedBy, subscriptionId]);
    return this.getById(subscriptionId);
  }

  /**
   * Get pending payments for admin
   */
  getPendingPayments() {
    const sql = `
      SELECT us.*, u.name as user_name, u.email as user_email, sp.name as plan_name, sp.price
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.status = 'pending'
      ORDER BY us.created_at DESC
    `;
    return this.query(sql);
  }

  /**
   * Check if user has active subscription
   */
  hasActiveSubscription(userId) {
    const sub = this.getUserActiveSubscription(userId);
    return !!sub;
  }

  /**
   * Get revenue stats for dashboard
   */
  getRevenueStats() {
    const sql = `
      SELECT 
        COUNT(CASE WHEN status = 'active' AND end_date > datetime('now') THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'active' AND end_date > datetime('now') THEN 1 END) * 
          (SELECT AVG(price) FROM subscription_plans) as estimated_mrr,
        SUM(CASE WHEN us.status = 'active' AND us.end_date > datetime('now') THEN sp.price ELSE 0 END) as actual_mrr,
        COUNT(CASE WHEN us.status = 'expired' THEN 1 END) as expired_count
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
    `;
    return this.queryOne(sql);
  }

  /**
   * Get subscriptions expiring soon (for renewal reminders)
   */
  getExpiringSoon(days = 7) {
    const sql = `
      SELECT us.*, u.name as user_name, u.email as user_email, 
             sp.name as plan_name, sp.price,
             julianday(us.end_date) - julianday(datetime('now')) as days_remaining
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.status = 'active'
      AND us.end_date > datetime('now')
      AND us.end_date <= datetime('now', '+' || ? || ' days')
      ORDER BY us.end_date ASC
    `;
    return this.query(sql, days);
  }

  /**
   * Check if user is in grace period (soft lock)
   */
  isInGracePeriod(userId) {
    const sql = `
      SELECT us.*,
             julianday(datetime('now')) - julianday(us.end_date) as days_expired
      FROM user_subscriptions us
      WHERE us.user_id = ? 
      AND us.status = 'expired'
      AND julianday(datetime('now')) - julianday(us.end_date) <= 3
      ORDER BY us.end_date DESC
      LIMIT 1
    `;
    return this.queryOne(sql, [userId]);
  }

  /**
   * Validate transaction ID format (fraud prevention)
   */
  validateTransactionId(transactionId, userId) {
    // Expected format: SUB_{userId}_{timestamp}
    const pattern = /^SUB_(\d+)_(\d+)$/;
    const match = transactionId.match(pattern);
    
    if (!match) {
      return { valid: false, reason: 'Invalid transaction ID format' };
    }

    const transactionUserId = parseInt(match[1]);
    const timestamp = parseInt(match[2]);

    // Check if user ID matches
    if (transactionUserId !== userId) {
      return { valid: false, reason: 'User ID mismatch in transaction ID' };
    }

    // Check if timestamp is reasonable (not too old, not in future)
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (now - timestamp > maxAge) {
      return { valid: false, reason: 'Transaction ID too old' };
    }
    if (timestamp > now) {
      return { valid: false, reason: 'Transaction ID in future' };
    }

    return { valid: true };
  }
}

export const Subscription = new SubscriptionModel();
