import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { validators } from '../middleware/validator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Public routes
router.post('/register', validators.register, asyncHandler(AuthController.register));
router.post('/login', validators.login, asyncHandler(AuthController.login));
router.post('/forgot-password', validators.forgotPassword, asyncHandler(AuthController.forgotPassword));
router.post('/reset-password', asyncHandler(AuthController.resetPassword));
router.post('/refresh-token', asyncHandler(AuthController.refreshToken));

// Protected routes
router.get('/profile', authenticate, asyncHandler(AuthController.getProfile));
router.patch('/profile', authenticate, asyncHandler(AuthController.updateProfile));
router.post('/change-password', authenticate, asyncHandler(AuthController.changePassword));
router.post('/logout', authenticate, asyncHandler(AuthController.logout));

export default router;
