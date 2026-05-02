import { getDB } from '../database/connection.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * Expire Subscriptions Cron Job
 * Runs daily to update expired subscriptions from 'active' to 'expired'
 */
export function expireSubscriptions() {
  try {
    const db = getDB();

    // Update expired subscriptions
    const result = db.prepare(`
      UPDATE user_subscriptions
      SET status = 'expired',
          updated_at = datetime('now')
      WHERE end_date < datetime('now')
      AND status = 'active'
    `).run();

    if (result.changes > 0) {
      logger.info(`Expired ${result.changes} subscriptions`, {
        timestamp: new Date().toISOString()
      });
    } else {
      logger.debug('No subscriptions to expire', {
        timestamp: new Date().toISOString()
      });
    }

    return result.changes;
  } catch (error) {
    logger.error('Failed to expire subscriptions', { 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Get subscription stats for monitoring
 */
export function getSubscriptionStats() {
  try {
    const db = getDB();

    const stats = {
      active: db.prepare("SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'active'").get().count,
      expired: db.prepare("SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'expired'").get().count,
      pending: db.prepare("SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'pending'").get().count,
      total: db.prepare("SELECT COUNT(*) as count FROM user_subscriptions").get().count,
    };

    return stats;
  } catch (error) {
    logger.error('Failed to get subscription stats', { error: error.message });
    throw error;
  }
}
