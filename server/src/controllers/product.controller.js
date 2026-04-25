import { Product, Category, Subcategory } from '../models/product.model.js';
import { success, created, error, notFound } from '../utils/response.js';
import { HTTP_STATUS } from '../config/index.js';
import { Logger } from '../utils/logger.js';

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
      const { subcategoryId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = Product.getBySubcategory(subcategoryId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });

      return success(res, result.data, null, {
        pagination: result.pagination,
      });

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

      const existing = Product.findById(id);
      if (!existing) {
        return notFound(res, 'Product');
      }

      Product.delete(id);

      logger.info('Product deleted', { productId: id });

      return success(res, null, 'Product deleted successfully');

    } catch (err) {
      logger.error('Delete product failed', { error: err.message });
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
