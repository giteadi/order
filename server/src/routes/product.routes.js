import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
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
  validators.createProduct,
  asyncHandler(ProductController.create)
);

router.patch('/:id', 
  authenticate, 
  authorize('admin', 'staff'), 
  asyncHandler(ProductController.update)
);

router.delete('/:id', 
  authenticate, 
  authorize('admin'), 
  asyncHandler(ProductController.delete)
);

router.patch('/:id/availability', 
  authenticate, 
  authorize('admin', 'staff'), 
  asyncHandler(ProductController.toggleAvailability)
);

export default router;
