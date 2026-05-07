// Package/Combo Model for special offers
export class Package {
  constructor(db) {
    this.db = db;
  }

  // Create new package
  create(data) {
    const {
      name,
      description,
      price,
      original_price,
      items,
      image_url,
      restaurant_id,
      is_active = true,
      valid_from,
      valid_until,
      code,
    } = data;

    const stmt = this.db.prepare(`
      INSERT INTO packages (
        name, description, price, original_price, items,
        image_url, restaurant_id, is_active, valid_from, valid_until, code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      description,
      price,
      original_price,
      JSON.stringify(items),
      image_url,
      restaurant_id,
      is_active ? 1 : 0,
      valid_from || new Date().toISOString(),
      valid_until,
      code
    );

    return { id: result.lastInsertRowid, ...data };
  }

  // Get all packages for a restaurant
  getAllByRestaurant(restaurantId, includeInactive = false) {
    let query = `
      SELECT id, name, description, price, original_price, items,
             image_url, is_active, valid_from, valid_until, code,
             created_at
      FROM packages
      WHERE restaurant_id = ?
    `;

    if (!includeInactive) {
      query += ` AND is_active = 1`;
    }

    query += ` ORDER BY created_at DESC`;

    const packages = this.db.prepare(query).all(restaurantId);

    return packages.map(pkg => ({
      ...pkg,
      items: JSON.parse(pkg.items || '[]'),
      discount: pkg.original_price
        ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
        : 0,
    }));
  }

  // Get package by ID
  getById(id) {
    const pkg = this.db.prepare(`
      SELECT * FROM packages WHERE id = ?
    `).get(id);

    if (pkg) {
      pkg.items = JSON.parse(pkg.items || '[]');
    }

    return pkg;
  }

  // Update package
  update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.price !== undefined) {
      fields.push('price = ?');
      values.push(data.price);
    }
    if (data.original_price !== undefined) {
      fields.push('original_price = ?');
      values.push(data.original_price);
    }
    if (data.items !== undefined) {
      fields.push('items = ?');
      values.push(JSON.stringify(data.items));
    }
    if (data.image_url !== undefined) {
      fields.push('image_url = ?');
      values.push(data.image_url);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }
    if (data.valid_from !== undefined) {
      fields.push('valid_from = ?');
      values.push(data.valid_from);
    }
    if (data.valid_until !== undefined) {
      fields.push('valid_until = ?');
      values.push(data.valid_until);
    }
    if (data.code !== undefined) {
      fields.push('code = ?');
      values.push(data.code);
    }

    if (fields.length === 0) return null;

    const query = `UPDATE packages SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    values.push(id);

    const result = this.db.prepare(query).run(...values);

    return result.changes > 0 ? this.getById(id) : null;
  }

  // Delete package (soft delete by setting is_active = 0)
  delete(id) {
    const result = this.db.prepare(`
      UPDATE packages
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    return result.changes > 0;
  }

  // Get active valid packages (for customers)
  getActivePackages(restaurantId) {
    const now = new Date().toISOString();

    const packages = this.db.prepare(`
      SELECT id, name, description, price, original_price, items,
             image_url, code, valid_until
      FROM packages
      WHERE restaurant_id = ?
        AND is_active = 1
        AND (valid_until IS NULL OR valid_until > ?)
      ORDER BY price ASC
    `).all(restaurantId, now);

    return packages.map(pkg => ({
      ...pkg,
      items: JSON.parse(pkg.items || '[]'),
      discount: pkg.original_price
        ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
        : 0,
    }));
  }
}

export default Package;
