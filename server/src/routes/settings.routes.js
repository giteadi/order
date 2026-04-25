import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// All settings routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

// Get restaurant settings
router.get('/', asyncHandler(SettingsController.getSettings));

// Update restaurant settings
router.put('/', asyncHandler(SettingsController.updateSettings));

export default router;
