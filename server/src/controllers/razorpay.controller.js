import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getDB } from '../database/connection.js';
import { success, error, badRequest } from '../utils/response.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_DUMMYKEYID123456';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_key_replace_in_production';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay order
 * POST /api/v1/razorpay/create-order
 * Body: { planId }
 * Auth: required
 */
export async function createRazorpayOrder(req, res) {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    if (!planId) {
      return badRequest(res, 'Plan ID is required');
    }

    // Get plan from DB
    const db = getDB();
    const plan = db.prepare(
      'SELECT id, name, price, duration_months FROM subscription_plans WHERE id = ? AND is_active = 1'
    ).get(planId);

    if (!plan) {
      return badRequest(res, 'Plan not found');
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: plan.price * 100,   // paise
      currency: 'INR',
      receipt: `sub_${userId}_${Date.now()}`,
      notes: {
        userId: String(userId),
        planId: String(planId),
        planName: plan.name,
      },
    });

    logger.info('Razorpay order created', { orderId: order.id, userId, planId });

    return success(res, {
      orderId: order.id,
      amount: plan.price,
      currency: 'INR',
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        duration_months: plan.duration_months,
      },
    });

  } catch (err) {
    logger.error('Create Razorpay order failed', { error: err.message });
    return error(res, 'Failed to create payment order');
  }
}

/**
 * Verify Razorpay payment & activate subscription
 * POST /api/v1/razorpay/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId }
 * Auth: required
 */
export async function verifyRazorpayPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;

    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return badRequest(res, 'Missing payment verification fields');
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      logger.warn('Razorpay signature mismatch', { userId, razorpay_order_id });
      return error(res, 'Payment verification failed - invalid signature', 400);
    }

    // Get plan
    const db = getDB();
    const plan = db.prepare(
      'SELECT id, price, duration_months FROM subscription_plans WHERE id = ? AND is_active = 1'
    ).get(planId);

    if (!plan) {
      return badRequest(res, 'Plan not found');
    }

    // Check for duplicate payment
    const existing = db.prepare(
      'SELECT id FROM user_subscriptions WHERE transaction_id = ?'
    ).get(razorpay_payment_id);

    if (existing) {
      return badRequest(res, 'Payment already processed');
    }

    // Calculate subscription dates
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration_months);

    // Create active subscription immediately
    const result = db.prepare(`
      INSERT INTO user_subscriptions 
        (user_id, plan_id, start_date, end_date, status, payment_verified, 
         transaction_id, payment_proof, razorpay_signature, verified_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', 1, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      userId,
      plan.id,
      startDate,
      endDate.toISOString(),
      razorpay_payment_id,   // transaction_id = Razorpay payment ID
      razorpay_order_id,     // payment_proof  = Razorpay order ID
      razorpay_signature,    // razorpay_signature = signature for audit
    );

    logger.info('Subscription activated via Razorpay', {
      userId,
      subscriptionId: result.lastInsertRowid,
      paymentId: razorpay_payment_id,
      planId,
    });

    return success(res, {
      subscriptionId: result.lastInsertRowid,
      status: 'active',
      paymentId: razorpay_payment_id,
      message: 'Subscription activated successfully',
    });

  } catch (err) {
    logger.error('Verify Razorpay payment failed', { error: err.message });
    return error(res, 'Payment verification failed');
  }
}
