import { getDB } from '../database/connection.js';
import { success, created, error, notFound, badRequest } from '../utils/response.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

export class ComboController {

  static getAll(req, res) {
    try {
      const db = getDB();
      const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null;
      const queryRestaurant = req.query.restaurant;

      let resolvedId = restaurantId;
      if (!resolvedId && queryRestaurant) {
        const r = db.prepare('SELECT id FROM restaurants WHERE subdomain = ?').get(queryRestaurant);
        if (r) resolvedId = r.id;
      }

      if (!resolvedId) return success(res, []);

      const combos = db.prepare(`
        SELECT * FROM combos WHERE restaurant_id = ? AND is_available = 1 ORDER BY sort_order, created_at DESC
      `).all(resolvedId);

      const parsed = combos.map(c => ({
        ...c,
        items: JSON.parse(c.items || '[]'),
      }));

      return success(res, parsed);
    } catch (err) {
      logger.error('Get combos failed', { error: err.message });
      return error(res, 'Failed to get combos');
    }
  }

  // Admin: returns ALL combos including hidden ones
  static getAllAdmin(req, res) {
    try {
      const db = getDB();
      const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null;
      const queryRestaurant = req.query.restaurant;

      let resolvedId = restaurantId;
      if (!resolvedId && queryRestaurant) {
        const r = db.prepare('SELECT id FROM restaurants WHERE subdomain = ?').get(queryRestaurant);
        if (r) resolvedId = r.id;
      }

      if (!resolvedId) return success(res, []);

      const combos = db.prepare(`
        SELECT * FROM combos WHERE restaurant_id = ? ORDER BY sort_order, created_at DESC
      `).all(resolvedId);

      const parsed = combos.map(c => ({
        ...c,
        items: JSON.parse(c.items || '[]'),
        is_available: c.is_available === 1 || c.is_available === true,
      }));

      return success(res, parsed);
    } catch (err) {
      logger.error('Get all combos (admin) failed', { error: err.message });
      return error(res, 'Failed to get combos');
    }
  }

  static create(req, res) {
    try {
      const db = getDB();
      const { name, description, price, image_url, items, sort_order } = req.body;
      const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null;

      if (!name || !price) return badRequest(res, 'Name and price are required');
      if (!restaurantId) return badRequest(res, 'Restaurant context required');

      const result = db.prepare(`
        INSERT INTO combos (restaurant_id, name, description, price, image_url, items, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        restaurantId,
        name,
        description || '',
        parseFloat(price),
        image_url || null,
        JSON.stringify(items || []),
        sort_order || 0
      );

      const combo = db.prepare('SELECT * FROM combos WHERE id = ?').get(result.lastInsertRowid);
      return created(res, { ...combo, items: JSON.parse(combo.items || '[]') }, 'Combo created');
    } catch (err) {
      logger.error('Create combo failed', { error: err.message });
      return error(res, 'Failed to create combo: ' + err.message);
    }
  }

  static update(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;
      const { name, description, price, image_url, items, is_available, sort_order } = req.body;
      const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null;

      const existing = db.prepare('SELECT * FROM combos WHERE id = ? AND restaurant_id = ?').get(id, restaurantId);
      if (!existing) return notFound(res, 'Combo');

      db.prepare(`
        UPDATE combos SET name=?, description=?, price=?, image_url=?, items=?, is_available=?, sort_order=?, updated_at=datetime('now')
        WHERE id = ? AND restaurant_id = ?
      `).run(
        name ?? existing.name,
        description ?? existing.description,
        price ? parseFloat(price) : existing.price,
        image_url ?? existing.image_url,
        items ? JSON.stringify(items) : existing.items,
        is_available !== undefined ? (is_available ? 1 : 0) : existing.is_available,
        sort_order ?? existing.sort_order,
        id, restaurantId
      );

      const updated = db.prepare('SELECT * FROM combos WHERE id = ?').get(id);
      return success(res, { ...updated, items: JSON.parse(updated.items || '[]') }, 'Combo updated');
    } catch (err) {
      logger.error('Update combo failed', { error: err.message });
      return error(res, 'Failed to update combo');
    }
  }

  static delete(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;
      const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id || null;

      const existing = db.prepare('SELECT id FROM combos WHERE id = ? AND restaurant_id = ?').get(id, restaurantId);
      if (!existing) return notFound(res, 'Combo');

      db.prepare('DELETE FROM combos WHERE id = ?').run(id);
      return success(res, null, 'Combo deleted');
    } catch (err) {
      logger.error('Delete combo failed', { error: err.message });
      return error(res, 'Failed to delete combo');
    }
  }
}
