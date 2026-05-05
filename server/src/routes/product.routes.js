import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { checkSubscriptionWithBypass } from '../middleware/subscription.js';
import { validators } from '../middleware/validator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Public routes
router.get('/categories', asyncHandler(ProductController.getCategories));
router.get('/categories/:categoryId/subcategories', asyncHandler(ProductController.getSubcategories));
router.get('/products/:subcategoryId', validators.pagination, asyncHandler(ProductController.getProducts));
router.get('/product/:id', asyncHandler(ProductController.getProduct));
router.get('/search', asyncHandler(ProductController.search));
router.get('/', asyncHandler(ProductController.getMenu));

// Admin only routes
router.post('/',
  authenticate,
  authorize('admin', 'staff'),
  checkSubscriptionWithBypass,
  validators.createProduct,
  asyncHandler(ProductController.create)
);

router.patch('/:id',
  authenticate,
  authorize('admin', 'staff'),
  checkSubscriptionWithBypass,
  asyncHandler(ProductController.update)
);

router.delete('/:id',
  (req, res, next) => {
    console.log('[ProductRoutes] DELETE /:id received:', { id: req.params.id, path: req.path, user: req.user?.id, role: req.user?.role });
    next();
  },
  authenticate,
  (req, res, next) => {
    console.log('[ProductRoutes] After authenticate:', { user: req.user?.id, role: req.user?.role });
    next();
  },
  authorize('admin'),
  (req, res, next) => {
    console.log('[ProductRoutes] After authorize admin');
    next();
  },
  checkSubscriptionWithBypass,
  (req, res, next) => {
    console.log('[ProductRoutes] After subscription check');
    next();
  },
  asyncHandler(ProductController.delete)
);

router.patch('/:id/availability',
  authenticate,
  authorize('admin', 'staff'),
  checkSubscriptionWithBypass,
  asyncHandler(ProductController.toggleAvailability)
);

export default router;
