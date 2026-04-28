import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * Multi-tenant middleware
 * Identifies restaurant from subdomain or domain
 * Adds restaurant_id to request context
 */
export const tenantMiddleware = (req, res, next) => {
  try {
    const host = req.headers.host;
    const db = req.app.locals.db;

    // Extract subdomain from host
    // Examples: arthaus.localhost:4002, cafe1.example.com
    const parts = host.split('.');
    const subdomain = parts.length > 2 ? parts[0] : null;

    // Skip tenant check for IP addresses, super admin routes, or if no subdomain
    const isIP = /^\d+\.\d+\.\d+\.\d+/.test(host);
    if (isIP || !subdomain || req.path.startsWith('/admin/super')) {
      req.tenant = { restaurantId: null, isSuperAdmin: true };
      return next();
    }

    // Look up restaurant by subdomain
    const restaurant = db.prepare('SELECT id, uuid, name, subdomain FROM restaurants WHERE subdomain = ? AND is_active = 1').get(subdomain);

    if (!restaurant) {
      logger.warn('Restaurant not found for subdomain', { subdomain, host });
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
        message: 'The requested restaurant does not exist or is not active'
      });
    }

    // Add restaurant info to request
    req.tenant = {
      restaurantId: restaurant.id,
      restaurantUuid: restaurant.uuid,
      restaurantName: restaurant.name,
      subdomain: restaurant.subdomain,
      isSuperAdmin: false
    };

    logger.debug('Tenant identified', { 
      subdomain, 
      restaurantId: restaurant.id,
      restaurantName: restaurant.name 
    });

    next();
  } catch (error) {
    logger.error('Tenant middleware error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Filter query by restaurant_id
 * Adds WHERE clause to filter data by tenant
 */
export const filterByTenant = (req, res, next) => {
  const { restaurantId, isSuperAdmin } = req.tenant || {};

  // Super admin can see all data
  if (isSuperAdmin) {
    return next();
  }

  // If no restaurant_id, deny access
  if (!restaurantId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'Restaurant context required'
    });
  }

  // Add restaurant_id filter to query builder
  req.tenantFilter = { restaurantId };
  next();
};
