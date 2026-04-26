import { getDB } from '../database/connection.js';
import { success, error } from '../utils/response.js';
import { HTTP_STATUS } from '../config/index.js';
import { Logger } from '../utils/logger.js';
import { generateUUID } from '../utils/helpers.js';

const logger = Logger.getInstance();

/**
 * Image optimization utilities
 * Compress base64 images and generate thumbnails
 */
class ImageOptimizer {
  /**
   * Compress base64 image by reducing quality
   */
  static compressBase64(base64String, quality = 0.7) {
    try {
      // Extract the base64 data (remove data:image/xxx;base64, prefix)
      const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) return base64String;

      const mimeType = matches[1];
      const base64Data = matches[2];

      // For now, return original - in production use sharp or similar
      // This is a placeholder for proper image compression
      return base64String;
    } catch (err) {
      logger.warn('Image compression failed', { error: err.message });
      return base64String;
    }
  }

  /**
   * Generate thumbnail from base64 image
   */
  static generateThumbnail(base64String, maxWidth = 300) {
    try {
      // Extract the base64 data
      const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) return null;

      const mimeType = matches[1];
      const base64Data = matches[2];

      // For now, return original - in production use sharp to resize
      // This is a placeholder for proper thumbnail generation
      return base64String;
    } catch (err) {
      logger.warn('Thumbnail generation failed', { error: err.message });
      return null;
    }
  }
}

/**
 * Carousel Images Controller
 * Handles CRUD operations for carousel images
 */
export class CarouselController {
  /**
   * Get all carousel images for a restaurant
   */
  static async getCarouselImages(req, res) {
    try {
      const db = getDB();
      let restaurantId = req.user?.restaurant_id || req.query.restaurant_id || req.tenant?.restaurantId;
      const carouselType = req.query.type || 'highlights';

      // ✅ Validate carousel type
      const allowedTypes = ['hero', 'highlights', 'collection'];
      if (!allowedTypes.includes(carouselType)) {
        return error(res, `Invalid carousel type. Allowed: ${allowedTypes.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
      }

      // Fallback for development: get first active restaurant if no ID found
      if (!restaurantId) {
        const defaultRestaurant = db.prepare('SELECT id FROM restaurants WHERE is_active = 1 LIMIT 1').get();
        if (defaultRestaurant) {
          restaurantId = defaultRestaurant.id;
        }
      }

      // Debug logging
      logger.info('Carousel fetch debug', {
        url: req.originalUrl,
        query: req.query,
        user: req.user?.restaurant_id,
        tenant: req.tenant?.restaurantId,
        resolvedRestaurantId: restaurantId,
        resolvedType: carouselType
      });

      if (!restaurantId) {
        return error(res, `Restaurant ID required. Debug: user=${req.user?.restaurant_id}, query=${req.query.restaurant_id}, tenant=${req.tenant?.restaurantId}`, HTTP_STATUS.BAD_REQUEST);
      }

      const images = db.prepare(`
        SELECT 
          id, uuid, carousel_type, title, subtitle, 
          image_base64, image_thumbnail, display_order, is_active
        FROM carousel_images
        WHERE restaurant_id = ? AND carousel_type = ? AND is_active = 1
        ORDER BY display_order ASC, created_at DESC
      `).all(restaurantId, carouselType);

      // For optimization, send thumbnails first if available
      const optimizedImages = images.map(img => ({
        ...img,
        // Use thumbnail for faster initial load
        image: img.image_thumbnail || img.image_base64,
        fullImage: img.image_base64 // Full image available on demand
      }));

      return success(res, optimizedImages, 'Carousel images retrieved');
    } catch (err) {
      logger.error('Get carousel images error', { error: err.message });
      return error(res, 'Failed to get carousel images', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get single carousel image by ID
   */
  static async getCarouselImage(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      const image = db.prepare(`
        SELECT * FROM carousel_images WHERE id = ?
      `).get(id);

      if (!image) {
        return error(res, 'Image not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check restaurant access
      if (req.user?.role !== 'super_admin' && 
          req.user?.restaurant_id !== image.restaurant_id) {
        return error(res, 'Unauthorized', HTTP_STATUS.FORBIDDEN);
      }

      return success(res, image, 'Carousel image retrieved');
    } catch (err) {
      logger.error('Get carousel image error', { error: err.message });
      return error(res, 'Failed to get carousel image', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Create new carousel image
   */
  static async createCarouselImage(req, res) {
    try {
      const db = getDB();
      const { title, subtitle, image_base64, display_order, carousel_type } = req.body;
      const restaurantId = req.user?.restaurant_id;
      const carouselType = carousel_type || 'highlights';

      // ✅ Validate carousel type
      const allowedTypes = ['hero', 'highlights', 'collection'];
      if (!allowedTypes.includes(carouselType)) {
        return error(res, `Invalid carousel type. Allowed: ${allowedTypes.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
      }

      if (!restaurantId) {
        return error(res, 'Restaurant ID required', HTTP_STATUS.BAD_REQUEST);
      }

      if (!title || !image_base64) {
        return error(res, 'Title and image are required', HTTP_STATUS.BAD_REQUEST);
      }

      // Validate base64 format
      if (!image_base64.startsWith('data:image/')) {
        return error(res, 'Invalid image format', HTTP_STATUS.BAD_REQUEST);
      }

      // Optimize image
      const compressedImage = ImageOptimizer.compressBase64(image_base64);
      const thumbnail = ImageOptimizer.generateThumbnail(image_base64);

      // Get next display order if not provided
      let order = display_order || 0;
      if (!display_order) {
        const maxOrder = db.prepare(`
          SELECT COALESCE(MAX(display_order), 0) as max_order 
          FROM carousel_images 
          WHERE restaurant_id = ? AND carousel_type = ?
        `).get(restaurantId, carouselType);
        order = (maxOrder.max_order || 0) + 1;
      }

      const result = db.prepare(`
        INSERT INTO carousel_images (uuid, restaurant_id, carousel_type, title, subtitle, image_base64, image_thumbnail, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        generateUUID(),
        restaurantId,
        carouselType,
        title,
        subtitle || '',
        compressedImage,
        thumbnail,
        order
      );

      const newImage = db.prepare(`
        SELECT * FROM carousel_images WHERE id = ?
      `).get(result.lastInsertRowid);

      logger.info('Carousel image created', { id: result.lastInsertRowid, restaurantId });
      return success(res, newImage, 'Carousel image created', HTTP_STATUS.CREATED);
    } catch (err) {
      logger.error('Create carousel image error', { error: err.message });
      return error(res, 'Failed to create carousel image', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Update carousel image
   */
  static async updateCarouselImage(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;
      const { title, subtitle, image_base64, display_order, is_active, carousel_type } = req.body;

      // Check if image exists
      const existing = db.prepare('SELECT * FROM carousel_images WHERE id = ?').get(id);
      if (!existing) {
        return error(res, 'Image not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check restaurant access
      if (req.user?.role !== 'super_admin' && 
          req.user?.restaurant_id !== existing.restaurant_id) {
        return error(res, 'Unauthorized', HTTP_STATUS.FORBIDDEN);
      }

      // Build update object
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (subtitle !== undefined) updates.subtitle = subtitle;
      if (carousel_type !== undefined) updates.carousel_type = carousel_type;
      if (display_order !== undefined) updates.display_order = display_order;
      if (is_active !== undefined) updates.is_active = is_active;

      // If new image provided, optimize it
      if (image_base64) {
        if (!image_base64.startsWith('data:image/')) {
          return error(res, 'Invalid image format', HTTP_STATUS.BAD_REQUEST);
        }
        updates.image_base64 = ImageOptimizer.compressBase64(image_base64);
        updates.image_thumbnail = ImageOptimizer.generateThumbnail(image_base64);
      }

      if (Object.keys(updates).length === 0) {
        return error(res, 'No fields to update', HTTP_STATUS.BAD_REQUEST);
      }

      // Execute update
      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(id);

      db.prepare(`
        UPDATE carousel_images 
        SET ${setClause}
        WHERE id = ?
      `).run(...values);

      const updated = db.prepare('SELECT * FROM carousel_images WHERE id = ?').get(id);
      logger.info('Carousel image updated', { id });
      return success(res, updated, 'Carousel image updated');
    } catch (err) {
      logger.error('Update carousel image error', { error: err.message });
      return error(res, 'Failed to update carousel image', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Delete carousel image
   */
  static async deleteCarouselImage(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      // Check if image exists
      const existing = db.prepare('SELECT * FROM carousel_images WHERE id = ?').get(id);
      if (!existing) {
        return error(res, 'Image not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check restaurant access
      if (req.user?.role !== 'super_admin' && 
          req.user?.restaurant_id !== existing.restaurant_id) {
        return error(res, 'Unauthorized', HTTP_STATUS.FORBIDDEN);
      }

      // Soft delete (set is_active = 0)
      db.prepare('UPDATE carousel_images SET is_active = 0 WHERE id = ?').run(id);

      logger.info('Carousel image deleted', { id });
      return success(res, null, 'Carousel image deleted');
    } catch (err) {
      logger.error('Delete carousel image error', { error: err.message });
      return error(res, 'Failed to delete carousel image', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Reorder carousel images
   */
  static async reorderCarouselImages(req, res) {
    try {
      const db = getDB();
      const { imageIds, carousel_type } = req.body; // Array of image IDs in new order
      const restaurantId = req.user?.restaurant_id;
      const carouselType = carousel_type || 'highlights';

      if (!restaurantId) {
        return error(res, 'Restaurant ID required', HTTP_STATUS.BAD_REQUEST);
      }

      if (!Array.isArray(imageIds) || imageIds.length === 0) {
        return error(res, 'Invalid image IDs array', HTTP_STATUS.BAD_REQUEST);
      }

      // Update display order for each image
      imageIds.forEach((id, index) => {
        db.prepare(`
          UPDATE carousel_images 
          SET display_order = ? 
          WHERE id = ? AND restaurant_id = ? AND carousel_type = ?
        `).run(index, id, restaurantId, carouselType);
      });

      logger.info('Carousel images reordered', { restaurantId, count: imageIds.length });
      return success(res, null, 'Carousel images reordered');
    } catch (err) {
      logger.error('Reorder carousel images error', { error: err.message });
      return error(res, 'Failed to reorder carousel images', HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}
