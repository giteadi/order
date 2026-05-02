import QRCode from 'qrcode';
import { Subscription } from '../models/subscription.model.js';
import { success, created, error, notFound, badRequest } from '../utils/response.js';
import { HTTP_STATUS } from '../config/index.js';
import { Logger } from '../utils/logger.js';
import { getDB } from '../database/connection.js';

const logger = Logger.getInstance();

/**
 * Subscription Controller - Handles subscription and payment logic
 */
export class SubscriptionController {
  /**
   * Get all available plans
   */
  static getPlans(req, res) {
    try {
      const plans = Subscription.getActivePlans();
      
      // Parse features JSON
      const plansWithFeatures = plans.map(plan => ({
        ...plan,
        features: JSON.parse(plan.features || '[]')
      }));

      return success(res, plansWithFeatures);
    } catch (err) {
      logger.error('Get plans failed', { error: err.message });
      return error(res, 'Failed to fetch plans');
    }
  }

  /**
   * Get user's current subscription status
   */
  static getMySubscription(req, res) {
    try {
      const userId = req.user.id;
      const subscription = Subscription.getUserActiveSubscription(userId);
      
      if (subscription) {
        subscription.features = JSON.parse(subscription.features || '[]');
      }

      return success(res, subscription || null);
    } catch (err) {
      logger.error('Get subscription failed', { error: err.message });
      return error(res, 'Failed to fetch subscription');
    }
  }

  /**
   * Initiate subscription (generate QR)
   */
  static initiateSubscription(req, res) {
    try {
      const { planId } = req.body;
      const userId = req.user.id;

      if (!planId) {
        return badRequest(res, 'Plan ID is required');
      }

      // Check if user already has active subscription
      const existingSub = Subscription.getUserActiveSubscription(userId);
      if (existingSub) {
        return badRequest(res, 'You already have an active subscription');
      }

      // Get plan details
      const plan = Subscription.getPlanById(planId);
      if (!plan) {
        return notFound(res, 'Plan not found');
      }

      // Generate unique transaction ID
      const transactionId = `SUB_${userId}_${Date.now()}`;

      // Generate UPI QR
      const upiId = '9516696009@ybl';
      const upiName = 'SARS Services';
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${plan.price}&cu=INR&tn=${encodeURIComponent(transactionId)}`;

      QRCode.toDataURL(upiLink, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (err, qrDataUrl) => {
        if (err) {
          logger.error('QR generation failed', { error: err.message });
          return error(res, 'Failed to generate QR code');
        }

        return success(res, {
          plan: {
            ...plan,
            features: JSON.parse(plan.features || '[]')
          },
          qrCode: qrDataUrl,
          upiLink,
          transactionId,
          amount: plan.price
        });
      });

    } catch (err) {
      logger.error('Initiate subscription failed', { error: err.message });
      return error(res, 'Failed to initiate subscription');
    }
  }

  /**
   * Submit payment proof with fraud prevention
   */
  static submitPayment(req, res) {
    try {
      const { planId, transactionId, paymentProof } = req.body;
      const userId = req.user.id;

      if (!planId || !transactionId || !paymentProof) {
        return badRequest(res, 'Plan ID, transaction ID, and payment proof are required');
      }

      // Validate transaction ID format (fraud prevention)
      const validation = Subscription.validateTransactionId(transactionId, userId);
      if (!validation.valid) {
        logger.warn('Invalid transaction ID submitted', { 
          userId, 
          transactionId, 
          reason: validation.reason 
        });
        return badRequest(res, `Invalid transaction ID: ${validation.reason}`);
      }

      // Check for duplicate transaction ID
      const db = getDB();
      const existing = db.prepare(
        'SELECT id FROM user_subscriptions WHERE transaction_id = ?'
      ).get(transactionId);
      if (existing) {
        logger.warn('Duplicate transaction ID submitted', { userId, transactionId });
        return badRequest(res, 'This transaction ID has already been used');
      }

      // Create subscription record
      const subscription = Subscription.createSubscription({
        userId,
        planId,
        transactionId,
        paymentProof
      });

      logger.info('Payment proof submitted', {
        userId,
        subscriptionId: subscription.id,
        transactionId
      });

      return created(res, subscription, 'Payment proof submitted. Wait for verification.');
    } catch (err) {
      logger.error('Submit payment failed', { error: err.message });
      return error(res, 'Failed to submit payment');
    }
  }

  /**
   * Get pending payments (admin only)
   */
  static getPendingPayments(req, res) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return error(res, 'Unauthorized', HTTP_STATUS.FORBIDDEN);
      }

      const payments = Subscription.getPendingPayments();
      return success(res, payments);
    } catch (err) {
      logger.error('Get pending payments failed', { error: err.message });
      return error(res, 'Failed to fetch pending payments');
    }
  }

  /**
   * Verify payment (admin only) with fraud prevention
   */
  static verifyPayment(req, res) {
    try {
      const { subscriptionId } = req.params;
      const adminId = req.user.id;

      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return error(res, 'Unauthorized', HTTP_STATUS.FORBIDDEN);
      }

      const subscription = Subscription.verifyPayment(subscriptionId, adminId);
      
      if (!subscription) {
        return notFound(res, 'Subscription not found');
      }

      // Log verification for audit trail
      logger.info('Payment verified', {
        subscriptionId,
        adminId,
        transactionId: subscription.transaction_id,
        amount: subscription.price
      });

      return success(res, subscription, 'Payment verified successfully');
    } catch (err) {
      logger.error('Verify payment failed', { error: err.message });
      return error(res, 'Failed to verify payment');
    }
  }

  /**
   * Get revenue stats (admin only)
   */
  static getRevenueStats(req, res) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return error(res, 'Unauthorized', HTTP_STATUS.FORBIDDEN);
      }

      const stats = Subscription.getRevenueStats();
      return success(res, stats);
    } catch (err) {
      logger.error('Get revenue stats failed', { error: err.message });
      return error(res, 'Failed to fetch revenue stats');
    }
  }

  /**
   * Get expiring soon subscriptions (admin only)
   */
  static getExpiringSoon(req, res) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return error(res, 'Unauthorized', HTTP_STATUS.FORBIDDEN);
      }

      const { days = 7 } = req.query;
      const subscriptions = Subscription.getExpiringSoon(parseInt(days));
      return success(res, subscriptions);
    } catch (err) {
      logger.error('Get expiring soon failed', { error: err.message });
      return error(res, 'Failed to fetch expiring subscriptions');
    }
  }

  /**
   * Get user's subscription history
   */
  static getMyHistory(req, res) {
    try {
      const userId = req.user.id;
      const subscriptions = Subscription.getUserSubscriptions(userId);
      return success(res, subscriptions);
    } catch (err) {
      logger.error('Get subscription history failed', { error: err.message });
      return error(res, 'Failed to fetch subscription history');
    }
  }
}
