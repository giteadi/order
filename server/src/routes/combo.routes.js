import { Router } from 'express';
import { ComboController } from '../controllers/combo.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { checkSubscriptionWithBypass } from '../middleware/subscription.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Public — customer menu
router.get('/', asyncHandler(ComboController.getAll));

// Admin only
router.get('/admin-all', authenticate, authorize('admin', 'super_admin'), checkSubscriptionWithBypass, asyncHandler(ComboController.getAllAdmin));
router.post('/', authenticate, authorize('admin', 'super_admin'), checkSubscriptionWithBypass, asyncHandler(ComboController.create));
router.patch('/:id', authenticate, authorize('admin', 'super_admin'), checkSubscriptionWithBypass, asyncHandler(ComboController.update));
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), checkSubscriptionWithBypass, asyncHandler(ComboController.delete));

export default router;
