import crypto from 'crypto';
import { Order, Cart } from '../models/order.model.js';
import { success, created, error, notFound, badRequest } from '../utils/response.js';
import { HTTP_STATUS, ORDER_STATUS } from '../config/index.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * Order Controller - Order management
 */
export class OrderController {
  /**
   * Create new order
   */
  static async create(req, res) {
    try {
      const { tableId: bodyTableId, items, specialInstructions, restaurant, sessionId: bodySessionId, paymentMethod = 'counter' } = req.body;
      let sessionId = req.headers['x-session-id'] || req.sessionID || bodySessionId;


      if (!items || items.length === 0) {
        return badRequest(res, 'Order must contain at least one item');
      }

      // Get restaurant_id - priority: tenant middleware > request body > user's default
      // Tenant middleware identifies restaurant from subdomain, which is most reliable
      let restaurantId = null;
      
      // First: try tenant middleware (from subdomain in URL/host header)
      if (req.tenant?.restaurantId) {
        restaurantId = req.tenant?.restaurantId;
      }
      
      // Second: try to get from subdomain in request body (fallback)
      if (!restaurantId && restaurant) {
        const restaurantRecord = Order.db.prepare(
          'SELECT id FROM restaurants WHERE subdomain = ?'
        ).get(restaurant);
        if (restaurantRecord) {
          restaurantId = restaurantRecord.id;
        }
      }

      // Final fallback: use user's default restaurant_id
      if (!restaurantId) {
        restaurantId = req.user?.restaurant_id;
      }

      // Log if restaurant_id is still null (this is a critical error)
      if (!restaurantId) {
        logger.error('Order creation failed - No restaurant_id found', {
          userId: req.user?.id,
          tenant: req.tenant,
          userRestaurantId: req.user?.restaurant_id,
          bodyRestaurant: restaurant
        });
        return badRequest(res, 'Restaurant context not found. Please select a restaurant.');
      }

      logger.info('Creating order', {
        userId: req.user?.id,
        tableNumber: req.body.tableNumber,
        restaurant,
        restaurantId,
        itemsCount: items.length
      });

      // Resolve tableId from tableNumber if not provided
      let tableId = bodyTableId;
      let tableNumber = req.body.tableNumber;

      if (typeof tableNumber === 'string') {
        const match = tableNumber.match(/\d+/);
        if (match) {
          tableNumber = match[0];
        }
      }

      if (typeof tableNumber === 'number') {
        tableNumber = String(tableNumber);
      }

      if (!tableId && tableNumber && restaurantId) {
        const tableRecordByNumber = Order.db.prepare(
          'SELECT id, table_number FROM restaurant_tables WHERE restaurant_id = ? AND table_number = ?'
        ).get(restaurantId, tableNumber);

        if (tableRecordByNumber) {
          tableId = tableRecordByNumber.id;
          tableNumber = String(tableRecordByNumber.table_number);
        } else {
          const tableRecordById = Order.db.prepare(
            'SELECT id, table_number FROM restaurant_tables WHERE restaurant_id = ? AND id = ?'
          ).get(restaurantId, tableNumber);

          if (tableRecordById) {
            tableId = tableRecordById.id;
            tableNumber = String(tableRecordById.table_number);
          }
        }
      }

      // Ensure sessionId exists for table orders so occupied table joins work
      if (!sessionId && (tableId || tableNumber)) {
        sessionId = crypto.randomUUID();
      }

      const result = Order.createOrder({
        userId: req.user?.id,
        tableId,
        tableNumber,
        items,
        specialInstructions,
        sessionId,
        restaurantId,
        paymentMethod,
      });

      const order = Order.getOrderWithItems(result.id);

      // If payment method is 'razorpay', create Razorpay order
      if (paymentMethod === 'razorpay') {
        try {
          const Razorpay = require('razorpay');
          const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_DUMMYKEYID123456';
          const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_key_replace_in_production';
          const razorpay = new Razorpay({
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret,
          });

          const razorpayOrder = await razorpay.orders.create({
            amount: order.total_amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `order_${order.uuid}`,
            notes: {
              orderId: String(order.id),
              orderUUID: order.uuid,
            },
          });

          logger.info('Razorpay order created for order payment', {
            orderId: order.id,
            razorpayOrderId: razorpayOrder.id,
          });

          return created(res, {
            order,
            razorpayOrder: {
              id: razorpayOrder.id,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
              key_id: razorpayKeyId,
            },
          }, 'Order placed successfully. Please complete payment.');
        } catch (razorpayError) {
          logger.error('Razorpay order creation failed', {
            error: razorpayError.message,
            orderId: order.id,
          });
          // Fallback: return order without Razorpay details
          return created(res, order, 'Order placed successfully');
        }
      }

      logger.info('Order created successfully', { orderId: result.id, uuid: order.uuid });

      return created(res, order, 'Order placed successfully');

    } catch (err) {
      logger.error('Create order failed', { error: err.message, stack: err.stack });
      return error(res, 'Failed to place order');
    }
  }

  /**
   * Get order details
   */
  static getOrder(req, res) {
    try {
      const { uuid } = req.params;
      const order = Order.getByUUID(uuid);

      if (!order) {
        return notFound(res, 'Order');
      }

      // Check ownership (user can see own orders, staff can see all orders in their restaurant)
      if (req.user.role === 'customer' && order.user_id !== req.user.id) {
        return error(res, 'Not authorized', HTTP_STATUS.FORBIDDEN);
      }

      // For staff/admin, verify order belongs to their restaurant
      const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null;
      const userRole = req.user?.role;
      if (userRole !== 'customer' && userRole !== 'super_admin' && restaurantId && order.restaurant_id !== restaurantId) {
        return error(res, 'Not authorized - Order belongs to another restaurant', HTTP_STATUS.FORBIDDEN);
      }

      return success(res, order);

    } catch (err) {
      logger.error('Get order failed', { error: err.message });
      return error(res, 'Failed to load order');
    }
  }

  /**
   * List user's orders
   */
  static getMyOrders(req, res) {
    try {
      // Security guard - ensure user is authenticated
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - user authentication required"
        });
      }

      const { page = 1, limit = 20, status, restaurant } = req.query;

      // req.user uses snake_case (restaurant_id) as set by auth middleware
      logger.info('GetMyOrders - Security Check', {
        userId: req.user.id,
        restaurant_id: req.user?.restaurant_id,
        userRole: req.user?.role,
        restaurantFilter: restaurant || 'none'
      });

      // Resolve restaurant_id from subdomain query param if provided
      let restaurantId = null;
      if (restaurant) {
        const restaurantRecord = Order.db.prepare(
          'SELECT id FROM restaurants WHERE subdomain = ?'
        ).get(restaurant);
        if (restaurantRecord) {
          restaurantId = restaurantRecord.id;
        }
      }

      const result = Order.listOrders({
        userId: req.user.id,      // always filter by logged-in user — never show other users' orders
        restaurantId,             // filter by restaurant subdomain if provided
        status,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });


      // Fetch order items for each order
      const ordersWithItems = result.data.map(order => {
        const items = Order.db.prepare(`
          SELECT oi.id, oi.product_id, oi.product_name, oi.product_price, 
                 oi.quantity, oi.customizations, oi.subtotal,
                 p.emoji_icon, p.image_url
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `).all(order.id);
        
        return {
          ...order,
          items
        };
      });

      return success(res, {
        orders: ordersWithItems,
        pagination: result.pagination
      });

    } catch (err) {
      logger.error('Get my orders failed', { error: err.message });
      return error(res, 'Failed to load orders');
    }
  }

  /**
   * List all orders (Staff/Admin)
   */
  static listOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        tableId,
        dateFrom,
        dateTo,
      } = req.query;

      const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null;

      const result = Order.listOrders({
        status,
        tableId: tableId ? parseInt(tableId, 10) : null,
        dateFrom,
        dateTo,
        restaurantId,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });

      return success(res, result.data, null, { pagination: result.pagination });

    } catch (err) {
      logger.error('List orders failed', { error: err.message });
      return error(res, 'Failed to load orders');
    }
  }

  /**
   * Update order status (Staff/Admin)
   */
  static updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, estimatedReadyAt } = req.body;
      const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null;
      const userRole = req.user?.role;

      const order = Order.findById(id, 'id, status, restaurant_id');
      if (!order) {
        return notFound(res, 'Order');
      }

      // Verify order belongs to admin's restaurant (super_admin bypasses)
      if (userRole !== 'super_admin' && restaurantId && order.restaurant_id !== restaurantId) {
        return error(res, 'Unauthorized - Order belongs to another restaurant', HTTP_STATUS.FORBIDDEN);
      }

      const updateData = { status };
      if (estimatedReadyAt) updateData.estimated_ready_at = estimatedReadyAt;

      Order.updateStatus(id, status, updateData);

      logger.info('Order status updated', { orderId: id, status, by: req.user.id });

      return success(res, { id, status }, 'Order status updated');

    } catch (err) {
      logger.error('Update status failed', { error: err.message });
      return error(res, 'Failed to update status');
    }
  }

  /**
   * Update item status (Kitchen/Staff)
   */
  static updateItemStatus(req, res) {
    try {
      const { itemId } = req.params;
      const { status } = req.body;
      const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null;
      const userRole = req.user?.role;

      // Verify item belongs to an order in admin's restaurant
      if (userRole !== 'super_admin' && restaurantId) {
        const db = Order.db;
        const itemOrder = db.prepare(`
          SELECT o.restaurant_id FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.id = ?
        `).get(itemId);
        if (!itemOrder) {
          return notFound(res, 'Order item');
        }
        if (itemOrder.restaurant_id !== restaurantId) {
          return error(res, 'Unauthorized - Item belongs to another restaurant', HTTP_STATUS.FORBIDDEN);
        }
      }

      Order.updateItemStatus(itemId, status);

      return success(res, { itemId, status }, 'Item status updated');

    } catch (err) {
      logger.error('Update item status failed', { error: err.message });
      return error(res, 'Failed to update item status');
    }
  }

  /**
   * Cancel order
   */
  static cancel(req, res) {
    try {
      const { id } = req.params;
      const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null;
      const userRole = req.user?.role;

      const order = Order.findById(id, 'id, status, user_id, restaurant_id');
      if (!order) {
        return notFound(res, 'Order');
      }

      // Check ownership
      if (req.user.role === 'customer' && order.user_id !== req.user.id) {
        return error(res, 'Not authorized', HTTP_STATUS.FORBIDDEN);
      }

      // For admins/staff, verify order belongs to their restaurant
      if (userRole !== 'customer' && userRole !== 'super_admin' && restaurantId && order.restaurant_id !== restaurantId) {
        return error(res, 'Unauthorized - Order belongs to another restaurant', HTTP_STATUS.FORBIDDEN);
      }

      // Only allow cancellation of pending/confirmed orders
      if (!['pending', 'confirmed'].includes(order.status)) {
        return badRequest(res, 'Cannot cancel order at this stage');
      }

      Order.updateStatus(id, ORDER_STATUS.CANCELLED, {
        cancelled_at: new Date().toISOString(),
        cancelled_by: req.user.id,
      });

      logger.info('Order cancelled', { orderId: id, by: req.user.id });

      return success(res, null, 'Order cancelled successfully');

    } catch (err) {
      logger.error('Cancel order failed', { error: err.message });
      return error(res, 'Failed to cancel order');
    }
  }

  /**
   * Get order statistics
   */
  static getStats(req, res) {
    try {
      const { dateFrom, dateTo, groupBy = 'day' } = req.query;
      const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null;

      const stats = Order.getStats({
        dateFrom: dateFrom || new Date().toISOString().split('T')[0],
        dateTo: dateTo || new Date().toISOString().split('T')[0],
        groupBy,
        restaurantId,
      });

      return success(res, stats);

    } catch (err) {
      logger.error('Get stats failed', { error: err.message });
      return error(res, 'Failed to load statistics');
    }
  }
}

/**
 * Cart Controller
 */
export class CartController {
  /**
   * Get cart
   */
  static getCart(req, res) {
    try {
      const sessionId = req.headers['x-session-id'] || req.sessionID;
      const cart = Cart.getCart(sessionId, req.user?.id);

      return success(res, cart);

    } catch (err) {
      logger.error('Get cart failed', { error: err.message });
      return error(res, 'Failed to load cart');
    }
  }

  /**
   * Add to cart
   */
  static addItem(req, res) {
    try {
      const { productId, quantity, customizations } = req.body;
      const sessionId = req.headers['x-session-id'] || req.sessionID;

      const result = Cart.addItem({
        sessionId,
        userId: req.user?.id,
        productId,
        quantity,
        customizations,
      });

      const cart = Cart.getCart(sessionId, req.user?.id);
      return success(res, cart, 'Item added to cart');

    } catch (err) {
      logger.error('Add to cart failed', { error: err.message });
      return error(res, 'Failed to add item');
    }
  }

  /**
   * Update cart item
   */
  static updateItem(req, res) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;

      Cart.updateQuantity(itemId, quantity);

      const sessionId = req.headers['x-session-id'] || req.sessionID;
      const cart = Cart.getCart(sessionId, req.user?.id);

      return success(res, cart, 'Cart updated');

    } catch (err) {
      logger.error('Update cart failed', { error: err.message });
      return error(res, 'Failed to update cart');
    }
  }

  /**
   * Remove from cart
   */
  static removeItem(req, res) {
    try {
      const { itemId } = req.params;

      Cart.delete(itemId);

      const sessionId = req.headers['x-session-id'] || req.sessionID;
      const cart = Cart.getCart(sessionId, req.user?.id);

      return success(res, cart, 'Item removed');

    } catch (err) {
      logger.error('Remove from cart failed', { error: err.message });
      return error(res, 'Failed to remove item');
    }
  }

  /**
   * Clear cart
   */
  static clear(req, res) {
    try {
      const sessionId = req.headers['x-session-id'] || req.sessionID;

      Cart.clearCart(sessionId, req.user?.id);

      return success(res, { items: [], total: 0 }, 'Cart cleared');

    } catch (err) {
      logger.error('Clear cart failed', { error: err.message });
      return error(res, 'Failed to clear cart');
    }
  }
}
