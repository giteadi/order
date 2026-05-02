import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { checkSubscriptionWithBypass } from '../middleware/subscription.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// ✅ Public route - Get basic restaurant info (logo, name) - NO AUTH
router.get('/public', asyncHandler(SettingsController.getSettings));

// All other settings routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

// Check subscription (super_admin bypasses this check)
router.use(checkSubscriptionWithBypass);

// Get restaurant settings
router.get('/', asyncHandler(SettingsController.getSettings));

// Update restaurant settings
router.put('/', asyncHandler(SettingsController.updateSettings));

export default router;
