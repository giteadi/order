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
   * Get full menu hierarchy
   */
  static getMenu(req, res) {
    try {
      const menu = Product.getFullMenu();
      return success(res, menu);
    } catch (err) {
      logger.error('Get menu failed', { error: err.message });
      return error(res, 'Failed to load menu');
    }
  }

  /**
   * Get categories list
   */
  static getCategories(req, res) {
    try {
      const categories = Category.findAll({
        where: { is_active: 1 },
        orderBy: 'sort_order',
        select: 'id, name, icon',
      });
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
      const subcategories = Subcategory.getByCategory(categoryId);
      
      return success(res, subcategories.map(sc => ({
        ...sc,
        productCount: Product.count({ subcategory_id: sc.id, is_available: 1 }),
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

      const result = Product.getBySubcategory(subcategoryId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
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
      const product = Product.getDetails(id);

      if (!product) {
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

      const products = Product.search(q.trim(), { limit: parseInt(limit, 10) });
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
      
      // Parse JSON fields
      if (data.allergens) data.allergens = JSON.stringify(data.allergens);
      if (data.customizationOptions) data.customization_options = JSON.stringify(data.customizationOptions);

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

      const existing = Product.findById(id);
      if (!existing) {
        return notFound(res, 'Product');
      }

      // Parse JSON fields
      if (data.allergens) data.allergens = JSON.stringify(data.allergens);
      if (data.customizationOptions) data.customization_options = JSON.stringify(data.customizationOptions);

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
      logger.info('[ProductController] Delete request received', { productId: id, user: req.user?.id, tenant: req.tenant });

      // Use transaction to handle foreign key constraints
      transaction((db) => {
        // Check if product exists using transaction db
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

      const existing = Product.findById(id);
      if (!existing) {
        return notFound(res, 'Product');
      }

      Product.update(id, { is_available: isAvailable ? 1 : 0 });

      return success(res, { id, isAvailable }, 'Availability updated');

    } catch (err) {
      logger.error('Toggle availability failed', { error: err.message });
      return error(res, 'Failed to update availability');
    }
  }
}
