import { BaseModel } from './base.model.js';
import { generateUUID, generateShortCode, calculateOrderTotals } from '../utils/helpers.js';
import { ORDER_STATUS, TABLES } from '../config/index.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * Order Model - Handles order lifecycle
 */
export class OrderModel extends BaseModel {
  constructor() {
    super('orders');
  }

  /**
   * Create new order with items (transaction)
   */
  createOrder({ userId, tableId, tableNumber, items, specialInstructions, sessionId, restaurantId, paymentMethod = 'counter' }) {
    return this.transaction((db) => {
      const orderUUID = generateUUID();
      
      // Calculate totals
      const productIds = items.map(i => i.productId);
      const placeholders = productIds.map(() => '?').join(',');
      const productsSql = `SELECT id, price, name FROM products WHERE id IN (${placeholders})`;
      const products = db.prepare(productsSql).all(...productIds);
      
      const productMap = new Map(products.map(p => [p.id, p]));
      
      const enrichedItems = items.map(item => {
        const product = productMap.get(item.productId);
        return {
          ...item,
          productName: product?.name || 'Unknown',
          productPrice: product?.price || 0,
          subtotal: product?.price * item.quantity || 0,
        };
      });

      const totals = calculateOrderTotals(enrichedItems);

      // Create order with restaurant_id and payment_method
      const orderSql = `
        INSERT INTO orders (uuid, user_id, table_id, table_number, session_id, restaurant_id,
                           subtotal, tax_amount, total_amount, special_instructions,
                           status, order_type, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const orderResult = db.prepare(orderSql).run(
        orderUUID,
        userId || null,
        tableId || null,
        tableNumber || null,
        sessionId || null,
        restaurantId || null,
        totals.subtotal,
        totals.taxAmount,
        totals.total,
        specialInstructions || null,
        ORDER_STATUS.PENDING,
        tableId ? 'dine_in' : 'takeaway',
        paymentMethod
      );

      const orderId = orderResult.lastInsertRowid;

      // Mark table as occupied for dine-in orders
      if (tableId && sessionId) {
        db.prepare(`
          UPDATE restaurant_tables
          SET status = 'occupied', current_session_id = ?
          WHERE id = ?
        `).run(sessionId, tableId);
      }

      // Create order items
      const itemSql = `
        INSERT INTO order_items (order_id, product_id, product_name, product_price, 
                                quantity, customizations, subtotal, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const itemStmt = db.prepare(itemSql);

      for (const item of enrichedItems) {
        itemStmt.run(
          orderId,
          item.productId,
          item.productName,
          item.productPrice,
          item.quantity,
          JSON.stringify(item.customizations || []),
          item.subtotal,
          ORDER_STATUS.PENDING
        );
      }

      // Clear cart if session exists
      if (sessionId) {
        db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(sessionId);
      }

      logger.info('Order created', { orderId, orderUUID, tableNumber, total: totals.total });

      return {
        id: orderId,
        uuid: orderUUID,
        ...totals,
        itemCount: items.length,
      };
    });
  }

  /**
   * Get order with items
   */
  getOrderWithItems(orderId) {
    const order = this.queryOne(`
      SELECT o.*, u.name as user_name, u.phone as user_phone
      FROM ${this.table} o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) return null;

    const items = this.query(`
      SELECT oi.*, p.emoji_icon, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `, [orderId]);

    return {
      ...order,
      items: items.map(item => ({
        ...item,
        customizations: JSON.parse(item.customizations || '[]'),
      })),
    };
  }

  /**
   * Get order by UUID
   */
  getByUUID(uuid) {
    const order = this.findOne({ uuid }, 'id');
    return order ? this.getOrderWithItems(order.id) : null;
  }

  /**
   * Update order status
   */
  updateStatus(orderId, status, additionalData = {}) {
    const validStatuses = Object.values(ORDER_STATUS);
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    const data = { status, ...additionalData };
    
    if (status === ORDER_STATUS.SERVED) {
      data.completed_at = new Date().toISOString();
    }

    return this.update(orderId, data);
  }

  /**
   * Update item status
   */
  updateItemStatus(itemId, status) {
    const sql = 'UPDATE order_items SET status = ? WHERE id = ?';
    return this.run(sql, [status, itemId]);
  }

  /**
   * List orders with filters
   */
  listOrders({ 
    userId = null, 
    restaurantId = null, 
    tableId = null, 
    status = null, 
    page = 1, 
    limit = 20,
    dateFrom = null,
    dateTo = null,
  }) {
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT o.id, o.uuid, o.table_number, o.status, o.order_type,
             o.subtotal, o.total_amount, o.created_at, o.special_instructions,
             COUNT(oi.id) as item_count
      FROM ${this.table} o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (userId !== null && userId !== undefined) {
      sql += ` AND o.user_id = ?`;
      params.push(userId);
    }

    if (restaurantId) {
      sql += ` AND o.restaurant_id = ?`;
      params.push(restaurantId);
    }

    if (tableId) {
      sql += ` AND o.table_id = ?`;
      params.push(tableId);
    }

    if (status) {
      sql += ` AND o.status = ?`;
      params.push(status);
    }

    if (dateFrom) {
      sql += ` AND DATE(o.created_at) >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      sql += ` AND DATE(o.created_at) <= ?`;
      params.push(dateTo);
    }

    sql += ` GROUP BY o.id`;

    // Count - remove GROUP BY and use only base params (without pagination)
    const countSql = sql.replace(/SELECT.*FROM/i, 'SELECT COUNT(DISTINCT o.id) as count FROM').replace(/GROUP BY.*$/i, '');
    const countParams = [...params]; // ✅ FIX: Use all params before pagination
    const total = this.queryOne(countSql, countParams).count || 0;

    // Add ordering and pagination
    sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const data = this.query(sql, params);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get active orders for table
   */
  getTableActiveOrders(tableId) {
    return this.findAll({
      where: { 
        table_id: tableId,
        status: ['pending', 'confirmed', 'preparing', 'ready']
      },
      orderBy: 'created_at DESC',
    });
  }

  /**
   * Get order statistics
   */
  getStats({ dateFrom, dateTo, groupBy = 'day' }) {
    const format = groupBy === 'hour' ? '%Y-%m-%d %H:00' : 
                   groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
    
    const sql = `
      SELECT 
        strftime('${format}', created_at) as period,
        COUNT(*) as order_count,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
      FROM ${this.table}
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period
    `;
    
    return this.query(sql, [dateFrom, dateTo]);
  }
}

// Cart Model
export class CartModel extends BaseModel {
  constructor() {
    super('cart_items');
  }

  /**
   * Get cart by session or user
   */
  getCart(sessionId, userId = null) {
    let sql = `
      SELECT ci.*, p.name, p.price, p.emoji_icon, p.image_url, p.is_available
      FROM ${this.table} ci
      JOIN products p ON p.id = ci.product_id
      WHERE 
    `;
    const params = [];

    if (userId) {
      sql += ` ci.user_id = ? OR ci.session_id = ?`;
      params.push(userId, sessionId);
    } else {
      sql += ` ci.session_id = ?`;
      params.push(sessionId);
    }

    sql += ` ORDER BY ci.added_at DESC`;
    
    const items = this.query(sql, params);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      items: items.map(item => ({
        ...item,
        customizations: JSON.parse(item.customizations || '[]'),
      })),
      total,
      itemCount: items.length,
    };
  }

  /**
   * Add item to cart
   */
  addItem({ sessionId, userId, tableId, productId, quantity, customizations }) {
    // Check if item exists
    const existing = this.findOne({
      session_id: sessionId,
      product_id: productId,
    });

    if (existing) {
      // Update quantity
      return this.update(existing.id, {
        quantity: existing.quantity + quantity,
        customizations: JSON.stringify(customizations || []),
      });
    }

    // Create new
    return this.create({
      session_id: sessionId,
      user_id: userId || null,
      table_id: tableId || null,
      product_id: productId,
      quantity,
      customizations: JSON.stringify(customizations || []),
    });
  }

  /**
   * Update cart item quantity
   */
  updateQuantity(cartItemId, quantity) {
    if (quantity <= 0) {
      return this.delete(cartItemId);
    }
    return this.update(cartItemId, { quantity });
  }

  /**
   * Clear cart
   */
  clearCart(sessionId, userId = null) {
    if (userId) {
      return this.deleteWhere({ user_id: userId });
    }
    return this.deleteWhere({ session_id: sessionId });
  }
}

// Export singletons
export const Order = new OrderModel();
export const Cart = new CartModel();
