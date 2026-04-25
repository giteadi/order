import { BaseModel } from './base.model.js';

/**
 * Product Model - Menu items management
 */
export class ProductModel extends BaseModel {
  constructor() {
    super('products');
  }

  /**
   * Get full menu hierarchy with categories and products
   */
  getFullMenu() {
    const sql = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        sc.id as subcategory_id,
        sc.name as subcategory_name,
        sc.icon as subcategory_icon,
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.emoji_icon,
        p.is_vegetarian,
        p.is_spicy,
        p.is_available,
        p.calories,
        p.allergens,
        p.customization_options,
        p.preparation_time
      FROM categories c
      LEFT JOIN subcategories sc ON sc.category_id = c.id
      LEFT JOIN products p ON p.subcategory_id = sc.id AND p.is_available = 1
      WHERE c.is_active = 1 AND sc.is_active = 1
      ORDER BY c.sort_order, sc.sort_order, p.sort_order
    `;

    const rows = this.query(sql);
    
    // Transform to nested structure
    const menu = {};
    
    for (const row of rows) {
      if (!menu[row.category_id]) {
        menu[row.category_id] = {
          id: row.category_id,
          name: row.category_name,
          icon: row.category_icon,
          subcategories: {},
        };
      }
      
      if (row.subcategory_id && !menu[row.category_id].subcategories[row.subcategory_id]) {
        menu[row.category_id].subcategories[row.subcategory_id] = {
          id: row.subcategory_id,
          name: row.subcategory_name,
          icon: row.subcategory_icon,
          products: [],
        };
      }
      
      if (row.id && row.subcategory_id) {
        menu[row.category_id].subcategories[row.subcategory_id].products.push({
          id: row.id,
          name: row.name,
          description: row.description,
          price: row.price,
          imageUrl: row.image_url,
          emojiIcon: row.emoji_icon,
          isVegetarian: !!row.is_vegetarian,
          isSpicy: !!row.is_spicy,
          calories: row.calories,
          allergens: JSON.parse(row.allergens || '[]'),
          customizationOptions: JSON.parse(row.customization_options || '[]'),
          preparationTime: row.preparation_time,
        });
      }
    }

    return Object.values(menu).map(cat => ({
      ...cat,
      subcategories: Object.values(cat.subcategories),
    }));
  }

  /**
   * Get products by subcategory with pagination
   */
  getBySubcategory(subcategoryId, { page = 1, limit = 20, availableOnly = true }) {
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT id, name, description, price, image_url, emoji_icon,
             is_vegetarian, is_spicy, is_available, calories, 
             allergens, customization_options, preparation_time
      FROM ${this.table}
      WHERE subcategory_id = ?
    `;
    const params = [subcategoryId];

    if (availableOnly) {
      sql += ` AND is_available = 1`;
    }

    // Get total
    const countSql = `SELECT COUNT(*) as count FROM (${sql})`;
    const total = this.queryOne(countSql, params).count;

    // Add pagination
    sql += ` ORDER BY sort_order, name LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const data = this.query(sql, params);

    return {
      data: data.map(this.formatProduct),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search products
   */
  search(query, { limit = 20, availableOnly = true } = {}) {
    let sql = `
      SELECT p.*, sc.name as subcategory_name, c.name as category_name
      FROM ${this.table} p
      JOIN subcategories sc ON sc.id = p.subcategory_id
      JOIN categories c ON c.id = sc.category_id
      WHERE (p.name LIKE ? OR p.description LIKE ?)
    `;
    const params = [`%${query}%`, `%${query}%`];

    if (availableOnly) {
      sql += ` AND p.is_available = 1`;
    }

    sql += ` ORDER BY p.is_available DESC, p.sort_order LIMIT ?`;
    params.push(limit);

    return this.query(sql, params).map(this.formatProduct);
  }

  /**
   * Get product details
   */
  getDetails(productId) {
    const sql = `
      SELECT p.*, sc.name as subcategory_name, c.name as category_name
      FROM ${this.table} p
      JOIN subcategories sc ON sc.id = p.subcategory_id
      JOIN categories c ON c.id = sc.category_id
      WHERE p.id = ?
    `;
    
    const row = this.queryOne(sql, [productId]);
    return row ? this.formatProduct(row) : null;
  }

  /**
   * Format product for API response
   */
  formatProduct(row) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      imageUrl: row.image_url,
      emojiIcon: row.emoji_icon,
      isVegetarian: !!row.is_vegetarian,
      isSpicy: !!row.is_spicy,
      isAvailable: !!row.is_available,
      calories: row.calories,
      allergens: JSON.parse(row.allergens || '[]'),
      customizationOptions: JSON.parse(row.customization_options || '[]'),
      preparationTime: row.preparation_time,
      category: row.category_name,
      subcategory: row.subcategory_name,
    };
  }

  /**
   * Update availability (bulk)
   */
  updateAvailability(productIds, isAvailable) {
    const placeholders = productIds.map(() => '?').join(',');
    const sql = `
      UPDATE ${this.table} 
      SET is_available = ? 
      WHERE id IN (${placeholders})
    `;
    return this.run(sql, [isAvailable ? 1 : 0, ...productIds]);
  }
}

// Categories Model
export class CategoryModel extends BaseModel {
  constructor() {
    super('categories');
  }
}

// Subcategories Model
export class SubcategoryModel extends BaseModel {
  constructor() {
    super('subcategories');
  }

  getByCategory(categoryId) {
    return this.findAll({
      where: { category_id: categoryId, is_active: 1 },
      orderBy: 'sort_order',
    });
  }
}

// Export singletons
export const Product = new ProductModel();
export const Category = new CategoryModel();
export const Subcategory = new SubcategoryModel();
