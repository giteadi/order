import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/plans', SubscriptionController.getPlans);

// Protected routes
router.use(authenticate);

router.get('/subscription', SubscriptionController.getMySubscription);
router.get('/subscription/history', SubscriptionController.getMyHistory);
router.post('/subscribe', SubscriptionController.initiateSubscription);
router.post('/payments/submit', SubscriptionController.submitPayment);

// Admin only routes
router.get('/admin/payments/pending', authorize('admin', 'super_admin'), SubscriptionController.getPendingPayments);
router.post('/admin/payments/:subscriptionId/verify', authorize('admin', 'super_admin'), SubscriptionController.verifyPayment);
router.get('/admin/revenue/stats', authorize('admin', 'super_admin'), SubscriptionController.getRevenueStats);
router.get('/admin/subscriptions/expiring', authorize('admin', 'super_admin'), SubscriptionController.getExpiringSoon);

export default router;
