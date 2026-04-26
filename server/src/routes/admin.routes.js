import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

// Dashboard stats
router.get('/stats', asyncHandler(AdminController.getStats));

// Orders management
router.get('/orders', asyncHandler(AdminController.getAllOrders));
router.get('/orders/today', asyncHandler(AdminController.getTodayOrders));
router.get('/orders/active', asyncHandler(AdminController.getActiveOrders));
router.patch('/orders/:id/status', asyncHandler(AdminController.updateOrderStatus));

// Users management
router.get('/users', asyncHandler(AdminController.getAllUsers));
router.get('/users/customers', asyncHandler(AdminController.getCustomers));
router.get('/users/staff', asyncHandler(AdminController.getStaff));
router.patch('/users/:id/role', asyncHandler(AdminController.updateUserRole));
router.patch('/users/:id/status', asyncHandler(AdminController.updateUserStatus));

// Tables management
router.get('/tables', asyncHandler(AdminController.getAllTables));
router.get('/tables/occupied', asyncHandler(AdminController.getOccupiedTables));
router.post('/tables', asyncHandler(AdminController.createTable));
router.patch('/tables/:id', asyncHandler(AdminController.updateTable));
router.patch('/tables/:id/status', asyncHandler(AdminController.updateTableStatus));
router.delete('/tables/:id', asyncHandler(AdminController.deleteTable));

// Menu management
router.get('/menu/stats', asyncHandler(AdminController.getMenuStats));

// Super admin only routes
router.get('/restaurants', asyncHandler(AdminController.getAllRestaurants));
router.post('/restaurants', asyncHandler(AdminController.createRestaurant));
router.get('/restaurants/:restaurantId/users', asyncHandler(AdminController.getUsersByRestaurant));
router.get('/super-admin/stats', asyncHandler(AdminController.getSuperAdminStats));

// Super admin data endpoints (all restaurants)
router.get('/super-admin/customers', asyncHandler(AdminController.getAllCustomers));
router.get('/super-admin/staff', asyncHandler(AdminController.getAllStaff));
router.get('/super-admin/orders', asyncHandler(AdminController.getAllOrdersSuperAdmin));
router.get('/super-admin/tables', asyncHandler(AdminController.getAllTablesSuperAdmin));

export default router;
