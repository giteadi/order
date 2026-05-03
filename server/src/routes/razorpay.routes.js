import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/razorpay.controller.js';

const router = Router();

// Both routes require authentication
router.use(authenticate);

// Create Razorpay order (get orderId for frontend)
router.post('/create-order', asyncHandler(createRazorpayOrder));

// Verify payment signature & activate subscription
router.post('/verify', asyncHandler(verifyRazorpayPayment));

export default router;
