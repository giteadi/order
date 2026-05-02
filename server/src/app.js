import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

import { CONFIG } from './config/index.js';
import { dbManager, getDB } from './database/connection.js';
import { initializeDatabase } from './database/init.js';
import { Logger } from './utils/logger.js';
import { 
  errorHandler, 
  notFoundHandler, 
  timeoutHandler,
  asyncHandler 
} from './middleware/errorHandler.js';
import { tenantMiddleware, filterByTenant } from './middleware/tenant.js';
import routes from './routes/index.js';
import { expireSubscriptions, getSubscriptionStats } from './cron/expireSubscriptions.js';

const logger = Logger.getInstance();
const app = express();

/**
 * Security Middleware
 */
app.use(helmet({
  contentSecurityPolicy: CONFIG.IS_PROD,
  crossOriginEmbedderPolicy: CONFIG.IS_PROD,
}));

app.use(cors(CONFIG.CORS));

// Rate limiting
const limiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(CONFIG.RATE_LIMIT.WINDOW_MS / 1000),
    });
  },
});
app.use(limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

/**
 * Body Parsing
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

/**
 * Request Timeout
 */
app.use(timeoutHandler);

/**
 * Request Logging
 */
app.use(logger.requestLogger.bind(logger));

/**
 * Multi-tenant Middleware
 * Identifies restaurant from subdomain
 */
app.use(tenantMiddleware);

/**
 * API Routes
 */
app.use('/api/v1', routes);

/**
 * 404 Handler
 */
app.use(notFoundHandler);

/**
 * Global Error Handler
 */
app.use(errorHandler);

/**
 * Server Startup
 */
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Test database connection
    dbManager.connect();
    app.locals.db = getDB();
    
    // Schedule cron job to expire subscriptions daily at midnight
    cron.schedule('0 0 * * *', () => {
      logger.info('Running subscription expiry cron job');
      try {
        const expiredCount = expireSubscriptions();
        const stats = getSubscriptionStats();
        logger.info('Subscription stats', stats);
      } catch (error) {
        logger.error('Cron job failed', { error: error.message });
      }
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Run once on startup to catch any expired subscriptions
    logger.info('Running initial subscription expiry check');
    try {
      expireSubscriptions();
    } catch (error) {
      logger.error('Initial expiry check failed', { error: error.message });
    }
    
    // Start server
    app.listen(CONFIG.PORT, () => {
      logger.info(`Server started`, {
        port: CONFIG.PORT,
        env: CONFIG.NODE_ENV,
        apiVersion: CONFIG.API_VERSION,
      });
      console.log(`🚀 Server running on http://localhost:${CONFIG.PORT}`);
      console.log(`📊 API docs: http://localhost:${CONFIG.PORT}/api/v1/health`);
      console.log(`⏰ Subscription expiry cron scheduled: Daily at midnight (IST)`);
    });

  } catch (error) {
    logger.error('Server startup failed', { error: error.message });
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

/**
 * Graceful Shutdown
 */
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  dbManager.close();
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// Start server
startServer();

export default app;
