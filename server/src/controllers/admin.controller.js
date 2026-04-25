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
      const { restaurantId } = req.tenant || {};

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

      // Total users (filtered by restaurant if applicable)
      let userQuery = 'SELECT COUNT(*) as count FROM users WHERE role = ?';
      let userParams = ['customer'];
      if (restaurantId) {
        userQuery += ' AND (restaurant_id = ? OR restaurant_id IS NULL)';
        userParams.push(restaurantId);
      }
      const usersResult = db.prepare(userQuery).get(...userParams);
      stats.totalCustomers = usersResult.count;

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

      // Active orders (pending, preparing, ready)
      let activeQuery = `SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'preparing', 'ready')`;
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
      const { restaurantId } = req.tenant || {};
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
      const { restaurantId } = req.tenant || {};
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
      return success(res, orders, "Today's orders retrieved");
    } catch (err) {
      logger.error('Get today orders error', { error: err.message });
      return error(res, 'Failed to get orders', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get active orders (pending, preparing, ready)
   */
  static async getActiveOrders(req, res) {
    try {
      const db = getDB();
      const { restaurantId } = req.tenant || {};

      let query = `
        SELECT 
          o.id, o.uuid, o.status, o.order_type, o.payment_status,
          o.total_amount, o.table_number, o.special_instructions,
          o.estimated_ready_at, o.created_at,
          u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.status IN ('pending', 'preparing', 'ready')
      `;
      let params = [];

      if (restaurantId) {
        query += ' AND o.restaurant_id = ?';
        params.push(restaurantId);
      }

      query += ` ORDER BY
        CASE o.status
          WHEN 'pending' THEN 1
          WHEN 'preparing' THEN 2
          WHEN 'ready' THEN 3
        END,
        o.created_at ASC`;

      const orders = db.prepare(query).all(...params);
      return success(res, orders, 'Active orders retrieved');
    } catch (err) {
      logger.error('Get active orders error', { error: err.message });
      return error(res, 'Failed to get orders', HTTP_STATUS.INTERNAL_ERROR);
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
      const { restaurantId } = req.tenant || {};
      const { role, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT id, uuid, email, phone, name, role, avatar_url, 
               is_active, last_login_at, created_at
        FROM users
        WHERE 1=1
      `;
      let params = [];

      if (restaurantId) {
        query += ' AND (restaurant_id = ? OR restaurant_id IS NULL)';
        params.push(restaurantId);
      }

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
      const { restaurantId } = req.tenant || {};

      let query = `
        SELECT id, uuid, email, phone, name, avatar_url, 
               is_active, last_login_at, created_at
        FROM users
        WHERE role = 'customer'
      `;
      let params = [];

      if (restaurantId) {
        query += ' AND (restaurant_id = ? OR restaurant_id IS NULL)';
        params.push(restaurantId);
      }

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
      const { restaurantId } = req.tenant || {};

      let query = `
        SELECT id, uuid, email, phone, name, role, avatar_url, 
               is_active, last_login_at, created_at
        FROM users
        WHERE role IN ('staff', 'admin')
      `;
      let params = [];

      if (restaurantId) {
        query += ' AND (restaurant_id = ? OR restaurant_id IS NULL)';
        params.push(restaurantId);
      }

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
      const { restaurantId } = req.tenant || {};

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
      const { restaurantId } = req.tenant || {};

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
      const { tableNumber, capacity, location } = req.body;
      const { restaurantId } = req.tenant || {};

      const qrCode = `TABLE_${tableNumber}_${Date.now()}`;

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
}
