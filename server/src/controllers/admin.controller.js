import { getDB } from '../database/connection.js';
import { Logger } from '../utils/logger.js';
import { success, error } from '../utils/response.js';
import { HTTP_STATUS } from '../config/index.js';

const logger = Logger.getInstance();

/**
 * Admin Controller
 * Handles all admin dashboard operations
 */
export class AdminController {
  /**
   * Get dashboard stats
   */
  static async getStats(req, res) {
    try {
      const db = getDB();
      const tenantId = req.tenant?.restaurantId;
      const userId = req.user?.restaurantId;
      const restaurantId = tenantId || userId;
      const userRole = req.user?.role;

      // Get counts
      const stats = {
        totalUsers: 0,
        totalCustomers: 0,
        totalOrders: 0,
        todayOrders: 0,
        activeOrders: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        occupiedTables: 0,
        totalTables: 0,
        menuItems: 0,
      };

      // Total staff/customers (filtered by restaurant for cafe admins)
      if (userRole !== 'super_admin') {
        // Cafe admin: count staff (admin + staff roles)
        let staffQuery = 'SELECT COUNT(*) as count FROM users WHERE role IN (?, ?)';
        let staffParams = ['admin', 'staff'];
        if (restaurantId) {
          staffQuery += ' AND restaurant_id = ?';
          staffParams.push(restaurantId);
        } else {
          staffQuery += ' AND restaurant_id IS NULL';
        }
        const staffResult = db.prepare(staffQuery).get(...staffParams);
        stats.totalStaff = staffResult.count;
        stats.totalCustomers = 0; // Cafe admin doesn't see customers here
      } else {
        // Super admin: count all customers
        let userQuery = 'SELECT COUNT(*) as count FROM users WHERE role = ?';
        let userParams = ['customer'];
        const usersResult = db.prepare(userQuery).get(...userParams);
        stats.totalCustomers = usersResult.count;
        stats.totalStaff = 0;
      }

      // Total orders
      let orderQuery = 'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders';
      let orderParams = [];
      if (restaurantId) {
        orderQuery += ' WHERE restaurant_id = ?';
        orderParams.push(restaurantId);
      }
      const ordersResult = db.prepare(orderQuery).get(...orderParams);
      stats.totalOrders = ordersResult.count;
      stats.totalRevenue = ordersResult.revenue;

      // Today's orders
      const today = new Date().toISOString().split('T')[0];
      let todayQuery = `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE DATE(created_at) = ?`;
      let todayParams = [today];
      if (restaurantId) {
        todayQuery += ' AND restaurant_id = ?';
        todayParams.push(restaurantId);
      }
      const todayResult = db.prepare(todayQuery).get(...todayParams);
      stats.todayOrders = todayResult.count;
      stats.todayRevenue = todayResult.revenue;

      // Active orders (pending, confirmed, preparing, ready)
      let activeQuery = `SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'confirmed', 'preparing', 'ready')`;
      let activeParams = [];
      if (restaurantId) {
        activeQuery += ' AND restaurant_id = ?';
        activeParams.push(restaurantId);
      }
      const activeResult = db.prepare(activeQuery).get(...activeParams);
      stats.activeOrders = activeResult.count;

      // Tables
      let tableQuery = 'SELECT COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as occupied FROM restaurant_tables';
      let tableParams = ['occupied'];
      if (restaurantId) {
        tableQuery += ' WHERE restaurant_id = ?';
        tableParams.push(restaurantId);
      }
      const tableResult = db.prepare(tableQuery).get(...tableParams);
      stats.totalTables = tableResult.total || 0;
      stats.occupiedTables = tableResult.occupied || 0;

      // Menu items
      const menuResult = db.prepare('SELECT COUNT(*) as count FROM products').get();
      stats.menuItems = menuResult.count;

      return success(res, stats, 'Dashboard stats retrieved');
    } catch (err) {
      logger.error('Get stats error', { error: err.message });
      return error(res, 'Failed to get stats', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get all orders with user details
   */
  static async getAllOrders(req, res) {
    try {
      const db = getDB();
      const tenantId = req.tenant?.restaurantId;
      const userId = req.user?.restaurantId;
      const restaurantId = tenantId || userId;
      const { status, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT 
          o.id, o.uuid, o.status, o.order_type, o.payment_status,
          o.total_amount, o.table_number, o.special_instructions,
          o.created_at, o.updated_at,
          u.id as user_id, u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE 1=1
      `;
      let params = [];

      if (restaurantId) {
        query += ' AND o.restaurant_id = ?';
        params.push(restaurantId);
      }

      if (status) {
        query += ' AND o.status = ?';
        params.push(status);
      }

      query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const orders = db.prepare(query).all(...params);

      // Get order items for each order
      for (const order of orders) {
        const items = db.prepare(`
          SELECT oi.*, p.name as product_name, p.image_url
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `).all(order.id);
        order.items = items;
      }

      return success(res, orders, 'Orders retrieved');
    } catch (err) {
      logger.error('Get orders error', { error: err.message });
      return error(res, 'Failed to get orders', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get today's orders
   */
  static async getTodayOrders(req, res) {
    try {
      const db = getDB();
      const tenantId = req.tenant?.restaurantId;
      const userId = req.user?.restaurantId;
      const restaurantId = tenantId || userId;
      const today = new Date().toISOString().split('T')[0];

      let query = `
        SELECT 
          o.id, o.uuid, o.status, o.order_type, o.payment_status,
          o.total_amount, o.table_number, o.special_instructions,
          o.created_at,
          u.name as user_name, u.email as user_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE DATE(o.created_at) = ?
      `;
      let params = [today];

      if (restaurantId) {
        query += ' AND o.restaurant_id = ?';
        params.push(restaurantId);
      }

      query += ' ORDER BY o.created_at DESC';

      const orders = db.prepare(query).all(...params);

      // Get order items for each order
      for (const order of orders) {
        const items = db.prepare(`
          SELECT oi.*, p.name as product_name, p.emoji_icon
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `).all(order.id);
        order.items = items;
      }

      return success(res, orders, "Today's orders retrieved");
    } catch (err) {
      logger.error("Get today's orders error", { error: err.message });
      return error(res, "Failed to fetch today's orders");
    }
  }

  /**
   * Get active orders (pending, confirmed, preparing, ready)
   */
  static async getActiveOrders(req, res) {
    try {
      const db = getDB();
      const tenantId = req.tenant?.restaurantId;
      const userId = req.user?.restaurantId;
      const restaurantId = tenantId || userId;

      const today = new Date().toISOString().split('T')[0];
      
      let query = `
        SELECT 
          o.id, o.uuid, o.restaurant_id, o.status, o.order_type, o.payment_status,
          o.total_amount, o.table_number, o.special_instructions,
          o.estimated_ready_at, o.created_at,
          u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.status IN ('pending', 'confirmed', 'preparing', 'ready')
          AND DATE(o.created_at) = ?
      `;
      let params = [today];

      if (restaurantId) {
        query += ' AND o.restaurant_id = ?';
        params.push(restaurantId);
      }

      query += ` ORDER BY
        CASE o.status
          WHEN 'pending' THEN 1
          WHEN 'confirmed' THEN 2
          WHEN 'preparing' THEN 2
          WHEN 'ready' THEN 3
        END,
        o.created_at ASC`;

      const orders = db.prepare(query).all(...params);
      
      // Get order items for each order
      for (const order of orders) {
        const items = db.prepare(`
          SELECT oi.*, p.name as product_name, p.emoji_icon
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `).all(order.id);
        order.items = items;
      }
      
      return success(res, orders, 'Active orders retrieved');
    } catch (err) {
      logger.error('Get active orders error', { error: err.message });
      return error(res, 'Failed to fetch active orders');
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;
      const { status, estimatedReadyAt } = req.body;

      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return error(res, 'Invalid status', HTTP_STATUS.BAD_REQUEST);
      }

      const updateData = { status, updated_at: new Date().toISOString() };
      if (estimatedReadyAt) updateData.estimated_ready_at = estimatedReadyAt;
      if (status === 'completed') updateData.completed_at = new Date().toISOString();

      db.prepare(`
        UPDATE orders 
        SET status = ?, estimated_ready_at = ?, completed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(status, updateData.estimated_ready_at || null, updateData.completed_at || null, updateData.updated_at, id);

      logger.info('Order status updated', { orderId: id, status, by: req.user?.id });
      return success(res, { id, status }, 'Order status updated');
    } catch (err) {
      logger.error('Update order status error', { error: err.message });
      return error(res, 'Failed to update order', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(req, res) {
    try {
      const db = getDB();
      const tenantId = req.tenant?.restaurantId;
      const userId = req.user?.restaurantId;
      const restaurantId = tenantId || userId;
      const userRole = req.user?.role;
      const { role, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT id, uuid, email, phone, name, role, avatar_url, 
               is_active, last_login_at, created_at
        FROM users
        WHERE 1=1
      `;
      let params = [];

      // Cafe admin filters (super admin sees all)
      if (userRole !== 'super_admin') {
        // Cafe admin: only see staff (admin + staff roles), exclude customers and super_admin
        query += ' AND role IN (?, ?)';
        params.push('admin', 'staff');
        
        // Also filter by restaurant
        if (restaurantId) {
          query += ' AND restaurant_id = ?';
          params.push(restaurantId);
        } else {
          query += ' AND restaurant_id IS NULL';
        }
      }
      // Super admin sees all users including other super admins

      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const users = db.prepare(query).all(...params);
      return success(res, users, 'Users retrieved');
    } catch (err) {
      logger.error('Get users error', { error: err.message });
      return error(res, 'Failed to get users', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get customers only
   */
  static async getCustomers(req, res) {
    try {
      const db = getDB();
      const tenantId = req.tenant?.restaurantId;
      const userId = req.user?.restaurantId;
      const restaurantId = tenantId || userId;
      const userRole = req.user?.role;

      let query = `
        SELECT id, uuid, email, phone, name, avatar_url, 
               is_active, last_login_at, created_at
        FROM users
        WHERE role = 'customer'
      `;
      let params = [];

      // Cafe admin: filter by restaurant only
      if (restaurantId && userRole !== 'super_admin') {
        query += ' AND restaurant_id = ?';
        params.push(restaurantId);
      } else if (!restaurantId && userRole !== 'super_admin') {
        query += ' AND restaurant_id IS NULL';
      }
      // Super admin sees all customers

      query += ' ORDER BY created_at DESC';

      const customers = db.prepare(query).all(...params);
      return success(res, customers, 'Customers retrieved');
    } catch (err) {
      logger.error('Get customers error', { error: err.message });
      return error(res, 'Failed to get customers', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get staff members
   */
  static async getStaff(req, res) {
    try {
      const db = getDB();
      const tenantId = req.tenant?.restaurantId;
      const userId = req.user?.restaurantId;
      const restaurantId = tenantId || userId;
      const userRole = req.user?.role;

      let query = `
        SELECT id, uuid, email, phone, name, role, avatar_url, 
               is_active, last_login_at, created_at
        FROM users
        WHERE role IN ('staff', 'admin')
      `;
      let params = [];

      // Cafe admin: filter by restaurant only (super_admin already excluded by WHERE clause)
      if (restaurantId && userRole !== 'super_admin') {
        query += ' AND restaurant_id = ?';
        params.push(restaurantId);
      } else if (!restaurantId && userRole !== 'super_admin') {
        query += ' AND restaurant_id IS NULL';
      }
      // Super admin sees all staff (excluding super_admin)

      query += ' ORDER BY role, created_at DESC';

      const staff = db.prepare(query).all(...params);
      return success(res, staff, 'Staff retrieved');
    } catch (err) {
      logger.error('Get staff error', { error: err.message });
      return error(res, 'Failed to get staff', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;
      const { role } = req.body;

      const validRoles = ['customer', 'staff', 'admin', 'super_admin'];
      if (!validRoles.includes(role)) {
        return error(res, 'Invalid role', HTTP_STATUS.BAD_REQUEST);
      }

      db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
        .run(role, new Date().toISOString(), id);

      logger.info('User role updated', { userId: id, role, by: req.user?.id });
      return success(res, { id, role }, 'User role updated');
    } catch (err) {
      logger.error('Update user role error', { error: err.message });
      return error(res, 'Failed to update user', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Update user status (active/inactive)
   */
  static async updateUserStatus(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;
      const { isActive } = req.body;

      db.prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?')
        .run(isActive ? 1 : 0, new Date().toISOString(), id);

      logger.info('User status updated', { userId: id, isActive, by: req.user?.id });
      return success(res, { id, isActive }, 'User status updated');
    } catch (err) {
      logger.error('Update user status error', { error: err.message });
      return error(res, 'Failed to update user', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get all tables
   */
  static async getAllTables(req, res) {
    try {
      const db = getDB();
      const tenantId = req.tenant?.restaurantId;
      const userId = req.user?.restaurantId;
      const restaurantId = tenantId || userId;

      let query = `
        SELECT t.*, 
               o.id as current_order_id, o.status as order_status,
               u.name as current_user_name
        FROM restaurant_tables t
        LEFT JOIN orders o ON t.current_session_id = o.session_id AND o.status NOT IN ('completed', 'cancelled')
        LEFT JOIN users u ON o.user_id = u.id
        WHERE 1=1
      `;
      let params = [];

      if (restaurantId) {
        query += ' AND t.restaurant_id = ?';
        params.push(restaurantId);
      }

      query += ' ORDER BY t.table_number';

      const tables = db.prepare(query).all(...params);
      return success(res, tables, 'Tables retrieved');
    } catch (err) {
      logger.error('Get tables error', { error: err.message });
      return error(res, 'Failed to get tables', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get occupied tables with current orders
   */
  static async getOccupiedTables(req, res) {
    try {
      const db = getDB();
      const tenantId = req.tenant?.restaurantId;
      const userId = req.user?.restaurantId;
      const restaurantId = tenantId || userId;

      let query = `
        SELECT t.*, 
               o.id as order_id, o.uuid as order_uuid, o.total_amount, o.status as order_status,
               u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM restaurant_tables t
        LEFT JOIN orders o ON t.current_session_id = o.session_id AND o.status NOT IN ('completed', 'cancelled')
        LEFT JOIN users u ON o.user_id = u.id
        WHERE t.status = 'occupied'
      `;
      let params = [];

      if (restaurantId) {
        query += ' AND t.restaurant_id = ?';
        params.push(restaurantId);
      }

      query += ' ORDER BY t.table_number';

      const tables = db.prepare(query).all(...params);
      return success(res, tables, 'Occupied tables retrieved');
    } catch (err) {
      logger.error('Get occupied tables error', { error: err.message });
      return error(res, 'Failed to get tables', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Create new table
   */
  static async createTable(req, res) {
    try {
      const db = getDB();
      const { tableNumber, capacity, location, restaurantId: bodyRestaurantId } = req.body;
      const tenantRestaurantId = req.tenant?.restaurantId;
      const userRestaurantId = req.user?.restaurantId;
      const restaurantId = tenantRestaurantId || bodyRestaurantId || userRestaurantId;

      // Get restaurant subdomain for QR code
      let restaurantSubdomain = 'default';
      if (restaurantId) {
        const restaurant = db.prepare('SELECT subdomain FROM restaurants WHERE id = ?').get(restaurantId);
        if (restaurant) {
          restaurantSubdomain = restaurant.subdomain;
        }
      }

      // Generate QR code with restaurant info
      const { generateTableQRCode } = await import('../utils/helpers.js');
      const qrCode = generateTableQRCode(tableNumber, restaurantSubdomain);

      const result = db.prepare(`
        INSERT INTO restaurant_tables (table_number, qr_code, capacity, location, restaurant_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(tableNumber, qrCode, capacity || 4, location || '', restaurantId);

      logger.info('Table created', { tableId: result.lastInsertRowid, tableNumber });
      return success(res, { id: result.lastInsertRowid, tableNumber, qrCode }, 'Table created');
    } catch (err) {
      logger.error('Create table error', { error: err.message });
      return error(res, 'Failed to create table', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Update table status
   */
  static async updateTableStatus(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['available', 'occupied', 'reserved', 'cleaning'];
      if (!validStatuses.includes(status)) {
        return error(res, 'Invalid status', HTTP_STATUS.BAD_REQUEST);
      }

      db.prepare('UPDATE restaurant_tables SET status = ? WHERE id = ?')
        .run(status, id);

      logger.info('Table status updated', { tableId: id, status });
      return success(res, { id, status }, 'Table status updated');
    } catch (err) {
      logger.error('Update table status error', { error: err.message });
      return error(res, 'Failed to update table', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Update table details (capacity, location, status)
   */
  static async updateTable(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;
      const { capacity, location, status } = req.body;

      const validStatuses = ['available', 'occupied', 'reserved', 'cleaning'];
      if (status && !validStatuses.includes(status)) {
        return error(res, 'Invalid status', HTTP_STATUS.BAD_REQUEST);
      }

      let updates = [];
      let params = [];

      if (capacity !== undefined) {
        updates.push('capacity = ?');
        params.push(capacity);
      }
      if (location !== undefined) {
        updates.push('location = ?');
        params.push(location);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }

      if (updates.length === 0) {
        return error(res, 'No fields to update', HTTP_STATUS.BAD_REQUEST);
      }

      params.push(id);

      db.prepare(`UPDATE restaurant_tables SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params);

      logger.info('Table updated', { tableId: id, updates });
      return success(res, { id }, 'Table updated successfully');
    } catch (err) {
      logger.error('Update table error', { error: err.message });
      return error(res, 'Failed to update table', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Delete table
   */
  static async deleteTable(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      // Check if table has active orders
      const table = db.prepare('SELECT status FROM restaurant_tables WHERE id = ?').get(id);
      if (!table) {
        return error(res, 'Table not found', HTTP_STATUS.NOT_FOUND);
      }

      if (table.status === 'occupied') {
        return error(res, 'Cannot delete occupied table', HTTP_STATUS.BAD_REQUEST);
      }

      db.prepare('DELETE FROM restaurant_tables WHERE id = ?').run(id);

      logger.info('Table deleted', { tableId: id });
      return success(res, { id }, 'Table deleted successfully');
    } catch (err) {
      logger.error('Delete table error', { error: err.message });
      return error(res, 'Failed to delete table', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get menu stats
   */
  static async getMenuStats(req, res) {
    try {
      const db = getDB();

      const stats = {
        totalProducts: 0,
        totalCategories: 0,
        totalSubcategories: 0,
        mostOrderedItems: [],
      };

      // Count products
      const productsResult = db.prepare('SELECT COUNT(*) as count FROM products').get();
      stats.totalProducts = productsResult.count;

      // Count categories
      const categoriesResult = db.prepare('SELECT COUNT(*) as count FROM categories').get();
      stats.totalCategories = categoriesResult.count;

      // Count subcategories
      const subcategoriesResult = db.prepare('SELECT COUNT(*) as count FROM subcategories').get();
      stats.totalSubcategories = subcategoriesResult.count;

      // Most ordered items
      const mostOrdered = db.prepare(`
        SELECT p.id, p.name, p.image_url, SUM(oi.quantity) as total_ordered
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY p.id
        ORDER BY total_ordered DESC
        LIMIT 5
      `).all();
      stats.mostOrderedItems = mostOrdered;

      return success(res, stats, 'Menu stats retrieved');
    } catch (err) {
      logger.error('Get menu stats error', { error: err.message });
      return error(res, 'Failed to get menu stats', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get all restaurants (super admin only)
   */
  static async getAllRestaurants(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      // Get all restaurants with basic stats
      const restaurants = db.prepare(`
        SELECT 
          r.id, r.uuid, r.name, r.subdomain, r.domain, r.logo_url, 
          r.is_active, r.created_at, r.updated_at,
          r.address, r.phone, r.email
        FROM restaurants r
        ORDER BY r.created_at DESC
      `).all();

      // Get stats for each restaurant
      const today = new Date().toISOString().split('T')[0];
      const restaurantsWithStats = restaurants.map(restaurant => {
        // Count users linked to this restaurant
        const userCounts = db.prepare(`
          SELECT 
            COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
            COUNT(CASE WHEN role IN ('admin', 'staff') THEN 1 END) as staff
          FROM users 
          WHERE restaurant_id = ?
        `).get(restaurant.id);

        // Count orders and revenue
        const orderStats = db.prepare(`
          SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END) as today_orders,
            COALESCE(SUM(CASE WHEN DATE(created_at) = ? THEN total_amount ELSE 0 END), 0) as today_revenue
          FROM orders 
          WHERE restaurant_id = ?
        `).get(today, today, restaurant.id);

        // Count active orders
        const activeOrders = db.prepare(`
          SELECT COUNT(*) as count 
          FROM orders 
          WHERE restaurant_id = ? AND status IN ('pending', 'preparing', 'ready')
        `).get(restaurant.id);

        // Count tables
        const tableStats = db.prepare(`
          SELECT 
            COUNT(*) as total_tables,
            SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_tables
          FROM restaurant_tables 
          WHERE restaurant_id = ?
        `).get(restaurant.id);

        return {
          ...restaurant,
          stats: {
            customers: userCounts.customers || 0,
            staff: userCounts.staff || 0,
            totalOrders: orderStats.total_orders || 0,
            totalRevenue: orderStats.total_revenue || 0,
            todayOrders: orderStats.today_orders || 0,
            todayRevenue: orderStats.today_revenue || 0,
            activeOrders: activeOrders.count || 0,
            totalTables: tableStats.total_tables || 0,
            occupiedTables: tableStats.occupied_tables || 0,
          }
        };
      });

      return success(res, restaurantsWithStats, 'Restaurants retrieved');
    } catch (err) {
      logger.error('Get all restaurants error', { error: err.message });
      return error(res, 'Failed to get restaurants', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get all restaurants PUBLIC (no auth required - for QR scanning)
   */
  static async getAllRestaurantsPublic(req, res) {
    try {
      const db = getDB();

      // Get only active restaurants with basic info
      const restaurants = db.prepare(`
        SELECT 
          r.id, r.uuid, r.name, r.subdomain, r.domain, r.logo_url
        FROM restaurants r
        WHERE r.is_active = 1
        ORDER BY r.name ASC
      `).all();

      return success(res, restaurants, 'Restaurants retrieved');
    } catch (err) {
      logger.error('Get all restaurants public error', { error: err.message });
      return error(res, 'Failed to get restaurants', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Create new restaurant (super admin only)
   */
  static async createRestaurant(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;

      console.log('🔍 CREATE RESTAURANT - req.body:', JSON.stringify(req.body, null, 2));

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      const { 
        name, 
        subdomain, 
        domain, 
        description, 
        address, 
        phone, 
        email, 
        website,
        logo_url,
        admin_name,
        admin_email,
        admin_phone,
        admin_password
      } = req.body;

      if (!name || !subdomain) {
        return error(res, 'Name and subdomain are required', HTTP_STATUS.BAD_REQUEST);
      }

      if (!admin_name || !admin_password) {
        return error(res, 'Admin name and password are required', HTTP_STATUS.BAD_REQUEST);
      }

      if (!admin_email && !admin_phone) {
        return error(res, 'Admin email or phone is required', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if subdomain already exists
      const existing = db.prepare('SELECT id FROM restaurants WHERE subdomain = ?').get(subdomain);
      if (existing) {
        return error(res, 'Subdomain already exists', HTTP_STATUS.BAD_REQUEST);
      }

      const uuid = `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const themeConfig = JSON.stringify({
        primaryColor: '#f97316',
        secondaryColor: '#1f2937',
        accentColor: '#3b82f6'
      });
      const settings = JSON.stringify({
        currency: 'INR',
        currency_symbol: '₹',
        tax_rate: 5
      });

      // Create restaurant
      const result = db.prepare(`
        INSERT INTO restaurants (
          uuid, name, subdomain, domain, description, address, 
          phone, email, website, logo_url, theme_config, settings, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(
        uuid, name, subdomain, domain || null, description || null, 
        address || null, phone || null, email || null, website || null, 
        logo_url || null, themeConfig, settings
      );

      const restaurantId = result.lastInsertRowid;

      // Create admin user for this restaurant
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.default.hash(admin_password, 10);
      const userUuid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const adminResult = db.prepare(`
        INSERT INTO users (
          uuid, restaurant_id, email, phone, password_hash, name, role, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, 'admin', 1)
      `).run(
        userUuid,
        restaurantId,
        admin_email || null,
        admin_phone || null,
        passwordHash,
        admin_name
      );

      logger.info('Restaurant and admin created', { 
        restaurantId, 
        adminId: adminResult.lastInsertRowid,
        name, 
        subdomain,
        by: req.user?.id 
      });

      return success(res, { 
        id: restaurantId, 
        uuid, 
        name, 
        subdomain,
        admin: {
          id: adminResult.lastInsertRowid,
          name: admin_name,
          email: admin_email,
          phone: admin_phone
        }
      }, 'Restaurant and admin created successfully');
    } catch (err) {
      logger.error('Create restaurant error', { error: err.message });
      return error(res, 'Failed to create restaurant', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get super admin dashboard stats (cross-restaurant analytics)
   */
  static async getSuperAdminStats(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      const today = new Date().toISOString().split('T')[0];

      // Overall stats across all restaurants
      const stats = {
        totalRestaurants: 0,
        activeRestaurants: 0,
        totalCustomers: 0,
        totalStaff: 0,
        totalOrders: 0,
        totalRevenue: 0,
        todayOrders: 0,
        todayRevenue: 0,
        activeOrders: 0,
        totalTables: 0,
        occupiedTables: 0,
      };

      // Count restaurants
      const restaurantCounts = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
        FROM restaurants
      `).get();
      stats.totalRestaurants = restaurantCounts.total || 0;
      stats.activeRestaurants = restaurantCounts.active || 0;

      // Count users by role
      const userCounts = db.prepare(`
        SELECT 
          COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
          COUNT(CASE WHEN role IN ('admin', 'staff') THEN 1 END) as staff,
          COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins
        FROM users
      `).get();
      stats.totalCustomers = userCounts.customers || 0;
      stats.totalStaff = userCounts.staff || 0;
      stats.totalSuperAdmins = userCounts.super_admins || 0;

      // Order stats
      const orderStats = db.prepare(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END) as today_orders,
          COALESCE(SUM(CASE WHEN DATE(created_at) = ? THEN total_amount ELSE 0 END), 0) as today_revenue,
          COUNT(CASE WHEN status IN ('pending', 'confirmed', 'preparing', 'ready') THEN 1 END) as active_orders
        FROM orders
      `).get(today, today);
      stats.totalOrders = orderStats.total_orders || 0;
      stats.totalRevenue = orderStats.total_revenue || 0;
      stats.todayOrders = orderStats.today_orders || 0;
      stats.todayRevenue = orderStats.today_revenue || 0;
      stats.activeOrders = orderStats.active_orders || 0;

      // Table stats
      const tableStats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied
        FROM restaurant_tables
      `).get();
      stats.totalTables = tableStats.total || 0;
      stats.occupiedTables = tableStats.occupied || 0;

      // Recent activity (last 7 days orders per restaurant)
      // Handle orders without restaurant_id by using LEFT JOIN and filtering NULL
      const last7Days = db.prepare(`
        SELECT 
          r.name as restaurant_name,
          r.id as restaurant_id,
          DATE(o.created_at) as date,
          COUNT(*) as order_count,
          COALESCE(SUM(o.total_amount), 0) as revenue
        FROM orders o
        LEFT JOIN restaurants r ON o.restaurant_id = r.id
        WHERE o.created_at >= datetime('now', '-7 days')
          AND o.restaurant_id IS NOT NULL
        GROUP BY r.id, DATE(o.created_at)
        ORDER BY r.name, date DESC
      `).all();

      // Top performing restaurants
      const topRestaurants = db.prepare(`
        SELECT 
          r.id, r.name, r.logo_url,
          COUNT(o.id) as order_count,
          COALESCE(SUM(o.total_amount), 0) as total_revenue
        FROM restaurants r
        LEFT JOIN orders o ON r.id = o.restaurant_id AND o.restaurant_id IS NOT NULL
        WHERE r.is_active = 1
        GROUP BY r.id
        ORDER BY total_revenue DESC
        LIMIT 5
      `).all();

      return success(res, {
        ...stats,
        recentActivity: last7Days,
        topRestaurants
      }, 'Super admin stats retrieved');
    } catch (err) {
      logger.error('Get super admin stats error', { error: err.message });
      return error(res, 'Failed to get stats', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get users by restaurant (super admin only)
   */
  static async getUsersByRestaurant(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;
      const { restaurantId } = req.params;
      const { role } = req.query;

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      let query = `
        SELECT 
          u.id, u.uuid, u.email, u.phone, u.name, u.role, u.avatar_url,
          u.is_active, u.last_login_at, u.created_at,
          r.name as restaurant_name
        FROM users u
        LEFT JOIN restaurants r ON u.restaurant_id = r.id
        WHERE u.restaurant_id = ?
      `;
      let params = [restaurantId];

      if (role) {
        query += ' AND u.role = ?';
        params.push(role);
      }

      query += ' ORDER BY u.role, u.created_at DESC';

      const users = db.prepare(query).all(...params);
      return success(res, users, 'Users retrieved');
    } catch (err) {
      logger.error('Get users by restaurant error', { error: err.message });
      return error(res, 'Failed to get users', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get all customers across all restaurants (super admin only)
   */
  static async getAllCustomers(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      const customers = db.prepare(`
        SELECT
          u.id, u.uuid, u.email, u.phone, u.name, u.avatar_url,
          u.is_active, u.created_at,
          r.name as restaurant_name, u.restaurant_id
        FROM users u
        LEFT JOIN restaurants r ON u.restaurant_id = r.id
        WHERE u.role = 'customer'
        ORDER BY u.created_at DESC
      `).all();

      return success(res, customers, 'All customers retrieved');
    } catch (err) {
      logger.error('Get all customers error', { error: err.message });
      return error(res, 'Failed to get customers', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get all staff across all restaurants (super admin only)
   */
  static async getAllStaff(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      const staff = db.prepare(`
        SELECT
          u.id, u.uuid, u.email, u.phone, u.name, u.role, u.avatar_url,
          u.is_active, u.created_at,
          r.name as restaurant_name
        FROM users u
        LEFT JOIN restaurants r ON u.restaurant_id = r.id
        WHERE u.role IN ('admin', 'staff', 'super_admin')
        ORDER BY u.role, u.created_at DESC
      `).all();

      return success(res, staff, 'All staff retrieved');
    } catch (err) {
      logger.error('Get all staff error', { error: err.message });
      return error(res, 'Failed to get staff', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get all orders across all restaurants (super admin only)
   */
  static async getAllOrdersSuperAdmin(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;
      const { status } = req.query;

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      let query = `
        SELECT
          o.id, o.uuid, o.status, o.total_amount, o.order_type,
          o.created_at, o.payment_status,
          r.name as restaurant_name,
          u.name as customer_name, u.email as customer_email
        FROM orders o
        LEFT JOIN restaurants r ON o.restaurant_id = r.id
        LEFT JOIN users u ON o.user_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND o.status = ?';
        params.push(status);
      }

      query += ' ORDER BY o.created_at DESC LIMIT 100';

      const orders = db.prepare(query).all(...params);
      return success(res, orders, 'All orders retrieved');
    } catch (err) {
      logger.error('Get all orders error', { error: err.message });
      return error(res, 'Failed to get orders', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get all tables across all restaurants (super admin only)
   */
  static async getAllTablesSuperAdmin(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      const tables = db.prepare(`
        SELECT
          t.id, t.table_number, t.status, t.capacity, t.location,
          t.current_session_id,
          r.name as restaurant_name
        FROM restaurant_tables t
        LEFT JOIN restaurants r ON t.restaurant_id = r.id
        ORDER BY r.name, t.table_number
      `).all();

      return success(res, tables, 'All tables retrieved');
    } catch (err) {
      logger.error('Get all tables error', { error: err.message });
      return error(res, 'Failed to get tables', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get all subscriptions with user and plan details (super admin only)
   */
  static async getAllSubscriptions(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;
      const { status, limit = 50, offset = 0 } = req.query;

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      let query = `
        SELECT 
          us.id, us.user_id, us.plan_id, us.start_date, us.end_date,
          us.status, us.payment_verified, us.transaction_id, us.payment_proof,
          us.verified_by, us.verified_at, us.created_at, us.updated_at,
          us.is_manually_blocked, us.block_reason, us.blocked_at, us.blocked_by,
          u.name as user_name, u.email as user_email, u.phone as user_phone,
          u.role as user_role,
          sp.name as plan_name, sp.price as plan_price, sp.duration_months,
          r.name as restaurant_name,
          verifier.name as verified_by_name,
          blocker.name as blocked_by_name
        FROM user_subscriptions us
        JOIN users u ON us.user_id = u.id
        JOIN subscription_plans sp ON us.plan_id = sp.id
        LEFT JOIN restaurants r ON u.restaurant_id = r.id
        LEFT JOIN users verifier ON us.verified_by = verifier.id
        LEFT JOIN users blocker ON us.blocked_by = blocker.id
        WHERE 1=1
      `;
      let params = [];

      if (status) {
        query += ' AND us.status = ?';
        params.push(status);
      }

      query += ' ORDER BY us.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const subscriptions = db.prepare(query).all(...params);

      // Parse features for each plan
      const subscriptionsWithFeatures = subscriptions.map(sub => ({
        ...sub,
        features: sub.features ? JSON.parse(sub.features) : []
      }));

      return success(res, subscriptionsWithFeatures, 'Subscriptions retrieved');
    } catch (err) {
      logger.error('Get all subscriptions error', { error: err.message });
      return error(res, 'Failed to get subscriptions', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get subscription revenue stats (super admin only)
   */
  static async getSubscriptionRevenueStats(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      const today = new Date().toISOString().split('T')[0];

      const stats = {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        pendingSubscriptions: 0,
        expiredSubscriptions: 0,
        blockedSubscriptions: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        todayRevenue: 0,
        planBreakdown: []
      };

      // Count by status
      const statusCounts = db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
          COUNT(CASE WHEN is_manually_blocked = 1 THEN 1 END) as blocked
        FROM user_subscriptions
      `).get();

      stats.totalSubscriptions = statusCounts.total || 0;
      stats.activeSubscriptions = statusCounts.active || 0;
      stats.pendingSubscriptions = statusCounts.pending || 0;
      stats.expiredSubscriptions = statusCounts.expired || 0;
      stats.blockedSubscriptions = statusCounts.blocked || 0;

      // Revenue stats
      const revenueStats = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'active' THEN sp.price ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN status = 'active' AND DATE(us.created_at) >= DATE('now', 'start of month') THEN sp.price ELSE 0 END), 0) as monthly_revenue,
          COALESCE(SUM(CASE WHEN DATE(us.created_at) = ? AND status = 'active' THEN sp.price ELSE 0 END), 0) as today_revenue
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
      `).get(today);

      stats.totalRevenue = revenueStats.total_revenue || 0;
      stats.monthlyRevenue = revenueStats.monthly_revenue || 0;
      stats.todayRevenue = revenueStats.today_revenue || 0;

      // Plan breakdown (get unique plans only - filter out duplicates by name/price)
      const planBreakdown = db.prepare(`
        SELECT 
          sp.name,
          sp.price,
          COUNT(us.id) as count,
          COUNT(CASE WHEN us.status = 'active' THEN 1 END) as active_count,
          SUM(CASE WHEN us.status = 'active' THEN sp.price ELSE 0 END) as revenue
        FROM (
          SELECT id, name, price, is_active 
          FROM subscription_plans 
          GROUP BY name, price
          HAVING id = MIN(id)
        ) sp
        LEFT JOIN user_subscriptions us ON sp.id = us.plan_id
        WHERE sp.is_active = 1
        GROUP BY sp.id
        ORDER BY sp.price ASC
      `).all();

      stats.planBreakdown = planBreakdown;

      return success(res, stats, 'Subscription revenue stats retrieved');
    } catch (err) {
      logger.error('Get subscription revenue stats error', { error: err.message });
      return error(res, 'Failed to get subscription stats', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Manually block/unblock subscription (super admin only)
   */
  static async updateSubscriptionBlockStatus(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;
      const { subscriptionId } = req.params;
      const { isBlocked, reason } = req.body;
      const adminId = req.user?.id;

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      const subscription = db.prepare('SELECT * FROM user_subscriptions WHERE id = ?').get(subscriptionId);
      if (!subscription) {
        return error(res, 'Subscription not found', HTTP_STATUS.NOT_FOUND);
      }

      if (isBlocked) {
        // Block subscription
        db.prepare(`
          UPDATE user_subscriptions 
          SET is_manually_blocked = 1, 
              block_reason = ?, 
              blocked_at = datetime('now'),
              blocked_by = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(reason || 'Manually blocked by admin', adminId, subscriptionId);

        logger.info('Subscription manually blocked', { 
          subscriptionId, 
          adminId, 
          reason,
          userId: subscription.user_id 
        });

        return success(res, { 
          id: subscriptionId, 
          isBlocked: true,
          reason,
          blockedAt: new Date().toISOString()
        }, 'Subscription blocked successfully');
      } else {
        // Unblock subscription
        db.prepare(`
          UPDATE user_subscriptions 
          SET is_manually_blocked = 0, 
              block_reason = NULL, 
              blocked_at = NULL,
              blocked_by = NULL,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(subscriptionId);

        logger.info('Subscription manually unblocked', { 
          subscriptionId, 
          adminId,
          userId: subscription.user_id 
        });

        return success(res, { 
          id: subscriptionId, 
          isBlocked: false,
          unblockedAt: new Date().toISOString()
        }, 'Subscription unblocked successfully');
      }
    } catch (err) {
      logger.error('Update subscription block status error', { error: err.message });
      return error(res, 'Failed to update subscription', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get expiring subscriptions (super admin only)
   */
  static async getExpiringSubscriptions(req, res) {
    try {
      const db = getDB();
      const userRole = req.user?.role;
      const { days = 7 } = req.query;

      if (userRole !== 'super_admin') {
        return error(res, 'Unauthorized - Super admin only', HTTP_STATUS.FORBIDDEN);
      }

      const subscriptions = db.prepare(`
        SELECT 
          us.id, us.user_id, us.end_date, us.status,
          u.name as user_name, u.email as user_email, u.phone as user_phone,
          sp.name as plan_name, sp.price as plan_price,
          r.name as restaurant_name,
          julianday(us.end_date) - julianday(datetime('now')) as days_remaining
        FROM user_subscriptions us
        JOIN users u ON us.user_id = u.id
        JOIN subscription_plans sp ON us.plan_id = sp.id
        LEFT JOIN restaurants r ON u.restaurant_id = r.id
        WHERE us.status = 'active'
        AND us.end_date <= datetime('now', '+' || ? || ' days')
        AND us.end_date > datetime('now')
        AND (us.is_manually_blocked IS NULL OR us.is_manually_blocked = 0)
        ORDER BY us.end_date ASC
      `).all(days);

      return success(res, subscriptions, 'Expiring subscriptions retrieved');
    } catch (err) {
      logger.error('Get expiring subscriptions error', { error: err.message });
      return error(res, 'Failed to get expiring subscriptions', HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}
