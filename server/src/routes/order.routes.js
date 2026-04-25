import { Router } from 'express';
import { OrderController, CartController } from '../controllers/order.controller.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { validators } from '../middleware/validator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Cart routes (optional auth - works with session)
router.get('/cart', optionalAuth, asyncHandler(CartController.getCart));
router.post('/cart', optionalAuth, validators.addToCart, asyncHandler(CartController.addItem));
router.patch('/cart/:itemId', optionalAuth, validators.updateCart, asyncHandler(CartController.updateItem));
router.delete('/cart/:itemId', optionalAuth, asyncHandler(CartController.removeItem));
router.delete('/cart', optionalAuth, asyncHandler(CartController.clear));

// Order routes
router.post('/', optionalAuth, validators.createOrder, asyncHandler(OrderController.create));
router.get('/my-orders', authenticate, asyncHandler(OrderController.getMyOrders));
router.get('/stats', authenticate, authorize('staff', 'admin'), asyncHandler(OrderController.getStats));
router.get('/:uuid', authenticate, asyncHandler(OrderController.getOrder));
router.patch('/:id/status', authenticate, authorize('staff', 'admin'), asyncHandler(OrderController.updateStatus));
router.patch('/items/:itemId/status', authenticate, authorize('staff', 'admin'), asyncHandler(OrderController.updateItemStatus));
router.delete('/:id', authenticate, asyncHandler(OrderController.cancel));

// Admin list all orders
router.get('/', authenticate, authorize('staff', 'admin'), asyncHandler(OrderController.listOrders));

export default router;
