import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import adminRoutes from './admin.routes.js';
import settingsRoutes from './settings.routes.js';
import carouselRoutes from './carousel.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import razorpayRoutes from './razorpay.routes.js';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/menu', productRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/settings', settingsRoutes);
router.use('/carousel', carouselRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/razorpay', razorpayRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
