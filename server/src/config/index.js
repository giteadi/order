import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../../.env') });

const ENV = process.env.NODE_ENV || 'development';
const IS_DEV = ENV === 'development';
const IS_TEST = ENV === 'test';
const IS_PROD = ENV === 'production';

export const CONFIG = Object.freeze({
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: ENV,
  IS_DEV,
  IS_TEST,
  IS_PROD,
  API_VERSION: process.env.API_VERSION || 'v1',
  
  // Database - SQL2 (better-sqlite3)
  DB: {
    PATH: process.env.DB_PATH || './data/arthaus.db',
    BUSY_TIMEOUT: parseInt(process.env.DB_BUSY_TIMEOUT, 10) || 5000,
    WAL_MODE: true,
    CACHE_SIZE: -64000, // 64MB cache
    FOREIGN_KEYS: true,
  },
  
  // Security
  JWT: {
    SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    ALGORITHM: 'HS256',
  },
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  
  // CORS
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    CREDENTIALS: true,
    METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  
  // Logging
  LOG: {
    LEVEL: process.env.LOG_LEVEL || (IS_DEV ? 'debug' : 'info'),
    FILE: process.env.LOG_FILE || './logs/app.log',
    CONSOLE: IS_DEV,
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1,
  },
});

// Table names enum
export const TABLES = Object.freeze({
  USERS: 'users',
  CATEGORIES: 'categories',
  SUBCATEGORIES: 'subcategories',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  CART_ITEMS: 'cart_items',
  TABLES: 'restaurant_tables',
  GROUP_ORDERS: 'group_orders',
  GROUP_ORDER_ITEMS: 'group_order_items',
  CAROUSEL_IMAGES: 'carousel_images',
});

// Order status enum
export const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  CANCELLED: 'cancelled',
  PAID: 'paid',
});

// HTTP Status codes
export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
});
