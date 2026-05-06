import { Product, Category, Subcategory } from '../models/product.model.js';
import { success, created, error, notFound, paginated } from '../utils/response.js';
import { HTTP_STATUS } from '../config/index.js';
import { Logger } from '../utils/logger.js';
import { transaction } from '../database/connection.js';

const logger = Logger.getInstance();

/**
 * Product Controller - Menu management
 */
export class ProductController {
  /**
   * Resolve restaurantId from tenant middleware or query param
   */
  static _getRestaurantId(req) {
    let restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null
    if (!restaurantId && req.query.restaurant) {
      const db = Product.db
      const r = db.prepare('SELECT id FROM restaurants WHERE subdomain = ?').get(req.query.restaurant)
      if (r) restaurantId = r.id
    }
    return restaurantId
  }

  /**
   * Get full menu hierarchy
   */
  static getMenu(req, res) {
    try {
      const restaurantId = ProductController._getRestaurantId(req)
      const menu = Product.getFullMenu(restaurantId)
      return success(res, menu)
    } catch (err) {
      logger.error('Get menu failed', { error: err.message })
      return error(res, 'Failed to load menu')
    }
  }

  /**
   * Get categories list
   */
  static getCategories(req, res) {
    try {
      const restaurantId = ProductController._getRestaurantId(req)
      const categories = Category.getAll({ restaurantId, isActive: true })
      return success(res, categories);
    } catch (err) {
      logger.error('Get categories failed', { error: err.message });
      return error(res, 'Failed to load categories');
    }
  }

  /**
   * Get subcategories by category
   */
  static getSubcategories(req, res) {
    try {
      const { categoryId } = req.params;
      const restaurantId = ProductController._getRestaurantId(req)
      const subcategories = Subcategory.getByCategory(categoryId, { restaurantId });

      const db = Product.db;
      const countStmt = db.prepare(`
        SELECT COUNT(*) as count FROM products
        WHERE subcategory_id = ? AND is_available = 1
        AND (restaurant_id = ? OR restaurant_id IS NULL)
      `);

      return success(res, subcategories.map(sc => ({
        ...sc,
        productCount: countStmt.get(sc.id, restaurantId).count,
      })));
    } catch (err) {
      logger.error('Get subcategories failed', { error: err.message });
      return error(res, 'Failed to load subcategories');
    }
  }

  /**
   * Get products by subcategory
   */
  static getProducts(req, res) {
    try {
      const subcategoryId = parseInt(req.params.subcategoryId, 10);
      if (isNaN(subcategoryId)) {
        return error(res, 'Invalid subcategory ID', HTTP_STATUS.BAD_REQUEST);
      }
      const { page = 1, limit = 20 } = req.query;
      const restaurantId = ProductController._getRestaurantId(req)

      const result = Product.getBySubcategory(subcategoryId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        restaurantId,
      });

      return paginated(res, result.data, result.pagination);

    } catch (err) {
      logger.error('Get products failed', { error: err.message });
      return error(res, 'Failed to load products');
    }
  }

  /**
   * Get single product details
   */
  static getProduct(req, res) {
    try {
      const { id } = req.params;
      const restaurantId = ProductController._getRestaurantId(req)
      const product = Product.getDetails(id);

      if (!product) {
        return notFound(res, 'Product');
      }

      // If restaurant filter is active, ensure product belongs to that restaurant
      // or is a shared product (restaurant_id IS NULL)
      if (restaurantId && product.restaurantId && product.restaurantId !== restaurantId) {
        return notFound(res, 'Product');
      }

      return success(res, product);

    } catch (err) {
      logger.error('Get product failed', { error: err.message });
      return error(res, 'Failed to load product');
    }
  }

  /**
   * Search products
   */
  static search(req, res) {
    try {
      const { q, limit = 20 } = req.query;

      if (!q || q.trim().length < 2) {
        return success(res, []);
      }

      const restaurantId = ProductController._getRestaurantId(req)
      const products = Product.search(q.trim(), {
        limit: parseInt(limit, 10),
        restaurantId,
      });
      return success(res, products);

    } catch (err) {
      logger.error('Search failed', { error: err.message });
      return error(res, 'Search failed');
    }
  }

  // ============ Admin Only ============

  /**
   * Create product (Admin)
   */
  static create(req, res) {
    try {
      const data = req.body;

      // Normalize fields to match DB column names
      if (data.subcategoryId !== undefined && data.subcategory_id === undefined) {
        data.subcategory_id = data.subcategoryId;
      }

      // Remove fields that don't exist on products table
      delete data.subcategoryId;
      delete data.categoryId;
      delete data.category_id;

      // Determine and require restaurant_id
      let restaurantId = req.user?.restaurant_id || req.tenant?.restaurantId || null
      if (!restaurantId && req.query.restaurant) {
        const r = Product.db.prepare('SELECT id FROM restaurants WHERE subdomain = ?').get(req.query.restaurant)
        if (r) restaurantId = r.id
      }
      if (!restaurantId) {
        return error(res, 'Unable to determine restaurant. Product must belong to a restaurant.', HTTP_STATUS.BAD_REQUEST)
      }
      data.restaurant_id = restaurantId

      // Normalize boolean fields for SQLite (booleans are not valid bind types)
      if (data.is_available !== undefined) data.is_available = data.is_available ? 1 : 0;
      if (data.is_vegetarian !== undefined) data.is_vegetarian = data.is_vegetarian ? 1 : 0;
      if (data.is_spicy !== undefined) data.is_spicy = data.is_spicy ? 1 : 0;

      // Parse JSON fields
      if (data.allergens) data.allergens = JSON.stringify(data.allergens);
      if (data.customizationOptions) data.customization_options = JSON.stringify(data.customizationOptions);
      delete data.customizationOptions;

      // Remove undefined values (SQLite bind doesn't accept undefined)
      for (const key of Object.keys(data)) {
        if (data[key] === undefined) {
          delete data[key];
        }
      }

      logger.info('Creating product - insert keys', {
        keys: Object.keys(data),
        hasCategoryId: Object.prototype.hasOwnProperty.call(data, 'categoryId'),
        hasCategory_id: Object.prototype.hasOwnProperty.call(data, 'category_id'),
      });

      const result = Product.create(data);
      const product = Product.findById(result.id);

      logger.info('Product created', { productId: result.id, name: data.name });

      return created(res, product, 'Product created successfully');

    } catch (err) {
      logger.error('Create product failed', { error: err.message });
      return error(res, 'Failed to create product');
    }
  }

  /**
   * Update product (Admin)
   */
  static update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const restaurantId = req.user?.restaurant_id || req.tenant?.restaurantId || null;
      const userRole = req.user?.role;

      const existing = Product.findById(id);
      if (!existing) {
        return notFound(res, 'Product');
      }

      // Verify product belongs to admin's restaurant (super_admin bypasses)
      if (userRole !== 'super_admin' && restaurantId && existing.restaurant_id !== restaurantId) {
        return notFound(res, 'Product');
      }

      // Normalize fields to match DB column names
      if (data.subcategoryId !== undefined && data.subcategory_id === undefined) {
        data.subcategory_id = data.subcategoryId;
      }

      // Remove fields that don't exist on products table
      delete data.subcategoryId;
      delete data.categoryId;
      delete data.category_id;

      // Parse JSON fields
      if (data.allergens) data.allergens = JSON.stringify(data.allergens);
      if (data.customizationOptions) data.customization_options = JSON.stringify(data.customizationOptions);
      delete data.customizationOptions;

      // Remove undefined values (SQLite bind doesn't accept undefined)
      for (const key of Object.keys(data)) {
        if (data[key] === undefined) {
          delete data[key];
        }
      }

      Product.update(id, data);
      const product = Product.findById(id);

      logger.info('Product updated', { productId: id });

      return success(res, product, 'Product updated successfully');

    } catch (err) {
      logger.error('Update product failed', { error: err.message });
      return error(res, 'Failed to update product');
    }
  }

  /**
   * Delete product (Admin)
   */
  static delete(req, res) {
    try {
      const { id } = req.params;
      const restaurantId = req.user?.restaurant_id || req.tenant?.restaurantId || null;
      const userRole = req.user?.role;
      logger.info('[ProductController] Delete request received', { productId: id, user: req.user?.id, tenant: req.tenant });

      // Check ownership before transaction
      const productCheck = Product.findById(id);
      if (!productCheck) {
        return notFound(res, 'Product');
      }
      if (userRole !== 'super_admin' && restaurantId && productCheck.restaurant_id !== restaurantId) {
        return notFound(res, 'Product');
      }

      // Use transaction to handle foreign key constraints
      transaction((db) => {
        // Re-check inside transaction
        logger.info('[ProductController] Checking if product exists:', { productId: id });
        const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
        logger.info('[ProductController] Product lookup result:', { productId: id, found: !!existing });

        if (!existing) {
          throw new Error('Product not found');
        }

        // Remove from cart items
        logger.info('[ProductController] Deleting cart items for product:', { productId: id });
        const cartResult = db.prepare('DELETE FROM cart_items WHERE product_id = ?').run(id);
        logger.info('[ProductController] Cart items deleted:', { productId: id, changes: cartResult.changes });

        // Delete order_items (product_id is NOT NULL, cannot set to NULL)
        logger.info('[ProductController] Deleting order items for product:', { productId: id });
        const orderItemsResult = db.prepare('DELETE FROM order_items WHERE product_id = ?').run(id);
        logger.info('[ProductController] Order items deleted:', { productId: id, changes: orderItemsResult.changes });

        // Delete the product
        logger.info('[ProductController] Deleting product:', { productId: id });
        const productResult = db.prepare('DELETE FROM products WHERE id = ?').run(id);
        logger.info('[ProductController] Product deleted:', { productId: id, changes: productResult.changes });
      });

      logger.info('[ProductController] Product deleted successfully', { productId: id });

      return success(res, null, 'Product deleted successfully');

    } catch (err) {
      logger.error('[ProductController] Delete product failed', { error: err.message, stack: err.stack });
      if (err.message === 'Product not found') {
        return notFound(res, 'Product');
      }
      return error(res, 'Failed to delete product');
    }
  }

  /**
   * Toggle availability (Admin)
   */
  static toggleAvailability(req, res) {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;
      const restaurantId = req.user?.restaurant_id || req.tenant?.restaurantId || null;
      const userRole = req.user?.role;

      const existing = Product.findById(id);
      if (!existing) {
        return notFound(res, 'Product');
      }

      // Verify product belongs to admin's restaurant (super_admin bypasses)
      if (userRole !== 'super_admin' && restaurantId && existing.restaurant_id !== restaurantId) {
        return notFound(res, 'Product');
      }

      Product.update(id, { is_available: isAvailable ? 1 : 0 });

      return success(res, { id, isAvailable }, 'Availability updated');

    } catch (err) {
      logger.error('Toggle availability failed', { error: err.message });
      return error(res, 'Failed to update availability');
    }
  }

  // ============ Category & Subcategory Management (Admin) ============

  /**
   * Create category (Admin)
   */
  static createCategory(req, res) {
    try {
      const { name, icon, sort_order } = req.body;
      const restaurantId = req.user?.restaurant_id || req.tenant?.restaurantId || null;

      if (!name || name.trim().length === 0) {
        return error(res, 'Category name is required', HTTP_STATUS.BAD_REQUEST);
      }

      const data = {
        name: name.trim(),
        icon: icon || '',
        sort_order: sort_order || 0,
        is_active: 1,
      };

      if (restaurantId) {
        data.restaurant_id = restaurantId;
      }

      const result = Category.create(data);
      const category = Category.findById(result.id);

      return created(res, category, 'Category created successfully');
    } catch (err) {
      logger.error('Create category failed', { error: err.message });
      return error(res, 'Failed to create category');
    }
  }

  /**
   * Update category (Admin)
   */
  static updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, icon, sort_order, is_active } = req.body;
      const restaurantId = req.user?.restaurant_id || req.tenant?.restaurantId || null;
      const userRole = req.user?.role;

      const existing = Category.findById(id);
      if (!existing) {
        return notFound(res, 'Category');
      }

      // Verify category belongs to admin's restaurant (super_admin bypasses)
      if (userRole !== 'super_admin' && restaurantId && existing.restaurant_id && existing.restaurant_id !== restaurantId) {
        return notFound(res, 'Category');
      }

      const data = {};
      if (name !== undefined) data.name = name.trim();
      if (icon !== undefined) data.icon = icon;
      if (sort_order !== undefined) data.sort_order = sort_order;
      if (is_active !== undefined) data.is_active = is_active ? 1 : 0;

      Category.update(id, data);
      const category = Category.findById(id);

      return success(res, category, 'Category updated successfully');
    } catch (err) {
      logger.error('Update category failed', { error: err.message });
      return error(res, 'Failed to update category');
    }
  }

  /**
   * Delete category (Admin)
   */
  static deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const restaurantId = req.user?.restaurant_id || req.tenant?.restaurantId || null;
      const userRole = req.user?.role;

      const existing = Category.findById(id);
      if (!existing) {
        return notFound(res, 'Category');
      }

      // Verify category belongs to admin's restaurant (super_admin bypasses)
      if (userRole !== 'super_admin' && restaurantId && existing.restaurant_id && existing.restaurant_id !== restaurantId) {
        return notFound(res, 'Category');
      }

      // Soft delete - set is_active = 0
      Category.update(id, { is_active: 0 });

      return success(res, null, 'Category deleted successfully');
    } catch (err) {
      logger.error('Delete category failed', { error: err.message });
      return error(res, 'Failed to delete category');
    }
  }

  /**
   * Create subcategory (Admin)
   */
  static createSubcategory(req, res) {
    try {
      const { name, icon, sort_order, category_id } = req.body;
      const restaurantId = req.user?.restaurant_id || req.tenant?.restaurantId || null;

      if (!name || name.trim().length === 0) {
        return error(res, 'Subcategory name is required', HTTP_STATUS.BAD_REQUEST);
      }
      if (!category_id) {
        return error(res, 'Category ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      // Verify category exists and belongs to admin's restaurant
      const category = Category.findById(category_id);
      if (!category) {
        return error(res, 'Invalid category', HTTP_STATUS.BAD_REQUEST);
      }
      const userRole = req.user?.role;
      if (userRole !== 'super_admin' && restaurantId && category.restaurant_id && category.restaurant_id !== restaurantId) {
        return error(res, 'Category does not belong to your restaurant', HTTP_STATUS.FORBIDDEN);
      }

      const data = {
        name: name.trim(),
        category_id: parseInt(category_id, 10),
        icon: icon || '',
        sort_order: sort_order || 0,
        is_active: 1,
      };

      if (restaurantId) {
        data.restaurant_id = restaurantId;
      }

      const result = Subcategory.create(data);
      const subcategory = Subcategory.findById(result.id);

      return created(res, subcategory, 'Subcategory created successfully');
    } catch (err) {
      logger.error('Create subcategory failed', { error: err.message });
      return error(res, 'Failed to create subcategory');
    }
  }

  /**
   * Update subcategory (Admin)
   */
  static updateSubcategory(req, res) {
    try {
      const { id } = req.params;
      const { name, icon, sort_order, category_id, is_active } = req.body;
      const restaurantId = req.user?.restaurant_id || req.tenant?.restaurantId || null;
      const userRole = req.user?.role;

      const existing = Subcategory.findById(id);
      if (!existing) {
        return notFound(res, 'Subcategory');
      }

      // Verify subcategory belongs to admin's restaurant (super_admin bypasses)
      if (userRole !== 'super_admin' && restaurantId && existing.restaurant_id && existing.restaurant_id !== restaurantId) {
        return notFound(res, 'Subcategory');
      }

      const data = {};
      if (name !== undefined) data.name = name.trim();
      if (icon !== undefined) data.icon = icon;
      if (sort_order !== undefined) data.sort_order = sort_order;
      if (category_id !== undefined) data.category_id = parseInt(category_id, 10);
      if (is_active !== undefined) data.is_active = is_active ? 1 : 0;

      Subcategory.update(id, data);
      const subcategory = Subcategory.findById(id);

      return success(res, subcategory, 'Subcategory updated successfully');
    } catch (err) {
      logger.error('Update subcategory failed', { error: err.message });
      return error(res, 'Failed to update subcategory');
    }
  }

  /**
   * Delete subcategory (Admin)
   */
  static deleteSubcategory(req, res) {
    try {
      const { id } = req.params;
      const restaurantId = req.user?.restaurant_id || req.tenant?.restaurantId || null;
      const userRole = req.user?.role;

      const existing = Subcategory.findById(id);
      if (!existing) {
        return notFound(res, 'Subcategory');
      }

      // Verify subcategory belongs to admin's restaurant (super_admin bypasses)
      if (userRole !== 'super_admin' && restaurantId && existing.restaurant_id && existing.restaurant_id !== restaurantId) {
        return notFound(res, 'Subcategory');
      }

      // Soft delete - set is_active = 0
      Subcategory.update(id, { is_active: 0 });

      return success(res, null, 'Subcategory deleted successfully');
    } catch (err) {
      logger.error('Delete subcategory failed', { error: err.message });
      return error(res, 'Failed to delete subcategory');
    }
  }
}
