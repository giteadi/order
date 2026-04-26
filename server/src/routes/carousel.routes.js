import { Router } from 'express';
import { CarouselController } from '../controllers/carousel.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// ✅ Public route - no auth required (for main page carousel)
router.get('/', asyncHandler(CarouselController.getCarouselImages));

// ✅ Admin routes - require authentication & authorization
router.get('/admin/all', 
  authenticate, 
  authorize('admin', 'super_admin'), 
  asyncHandler(CarouselController.getCarouselImages)
);

router.post('/', 
  authenticate, 
  authorize('admin', 'super_admin'), 
  asyncHandler(CarouselController.createCarouselImage)
);

router.get('/:id', 
  authenticate, 
  authorize('admin', 'super_admin'), 
  asyncHandler(CarouselController.getCarouselImage)
);

router.patch('/:id', 
  authenticate, 
  authorize('admin', 'super_admin'), 
  asyncHandler(CarouselController.updateCarouselImage)
);

router.delete('/:id', 
  authenticate, 
  authorize('admin', 'super_admin'), 
  asyncHandler(CarouselController.deleteCarouselImage)
);

router.post('/reorder', 
  authenticate, 
  authorize('admin', 'super_admin'), 
  asyncHandler(CarouselController.reorderCarouselImages)
);

export default router;
