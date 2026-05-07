import { Router } from 'express';
import {
  getPackages,
  getActivePackages,
  createPackage,
  updatePackage,
  deletePackage,
} from '../controllers/package.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Public route - get active packages for customers
router.get('/public', tenantMiddleware, getActivePackages);

// Admin routes - require authentication
router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'staff', 'manager']));

router.get('/', getPackages);
router.post('/', createPackage);
router.patch('/:id', updatePackage);
router.delete('/:id', deletePackage);

export default router;
