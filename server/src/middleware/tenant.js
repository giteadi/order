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

    console.log('[tenantMiddleware] Request received:', { host, path: req.path, method: req.method });

    // Extract subdomain from host
    // Examples: arthaus.localhost:4002, cafe1.example.com
    const parts = host.split('.');
    const subdomain = parts.length > 2 ? parts[0] : null;

    console.log('[tenantMiddleware] Parsed subdomain:', { subdomain, parts });

    // Check for IP address access
    const isIP = /^\d+\.\d+\.\d+\.\d+/.test(host);
    
    // For IP access or missing subdomain, try to get restaurant from query params or headers
    let effectiveSubdomain = subdomain;
    if ((isIP || !subdomain) && !req.path.startsWith('/admin/super')) {
      // Check query param: ?restaurant=adarsh
      effectiveSubdomain = req.query.restaurant || req.headers['x-restaurant-subdomain'] || null;
      console.log('[tenantMiddleware] IP/no-subdomain access, checking for restaurant context:', { 
        isIP, 
        subdomain, 
        queryRestaurant: req.query.restaurant,
        headerRestaurant: req.headers['x-restaurant-subdomain'],
        effectiveSubdomain 
      });
    }
    
    // Skip tenant check only for super admin routes or if no context available
    if (req.path.startsWith('/admin/super')) {
      console.log('[tenantMiddleware] Super admin route, skipping tenant check:', { path: req.path });
      req.tenant = { restaurantId: null, isSuperAdmin: true };
      return next();
    }
    
    // If still no subdomain context, skip tenant identification but don't set isSuperAdmin
    if (!effectiveSubdomain) {
      console.log('[tenantMiddleware] No restaurant context found:', { isIP, subdomain, path: req.path });
      req.tenant = { restaurantId: null, isSuperAdmin: false, subdomain: null };
      return next();
    }
    
    // Use the effective subdomain for lookup
    const lookupSubdomain = effectiveSubdomain;

    // Look up restaurant by effective subdomain
    console.log('[tenantMiddleware] Looking up restaurant for subdomain:', lookupSubdomain);
    const restaurant = db.prepare('SELECT id, uuid, name, subdomain FROM restaurants WHERE subdomain = ? AND is_active = 1').get(lookupSubdomain);

    if (!restaurant) {
      logger.warn('Restaurant not found for subdomain', { subdomain: lookupSubdomain, host });
      console.error('[tenantMiddleware] Restaurant not found:', { subdomain: lookupSubdomain, host });
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
        message: 'The requested restaurant does not exist or is not active'
      });
    }

    console.log('[tenantMiddleware] Restaurant found:', { id: restaurant.id, name: restaurant.name, subdomain: restaurant.subdomain });

    // Add restaurant info to request
    req.tenant = {
      restaurantId: restaurant.id,
      restaurantUuid: restaurant.uuid,
      restaurantName: restaurant.name,
      subdomain: restaurant.subdomain,
      isSuperAdmin: false
    };

    logger.debug('Tenant identified', { 
      subdomain: lookupSubdomain, 
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
