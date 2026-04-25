import { getDB } from '../database/connection.js';
import { Logger } from '../utils/logger.js';
import { success, error } from '../utils/response.js';
import { HTTP_STATUS } from '../config/index.js';

const logger = Logger.getInstance();

/**
 * Settings Controller
 * Handles restaurant settings management
 */
export class SettingsController {
  /**
   * Get restaurant settings
   */
  static async getSettings(req, res) {
    try {
      const db = getDB();
      const { restaurantId } = req.tenant || {};

      // Fetch restaurant settings from restaurants table
      let query = `
        SELECT 
          id,
          name,
          description,
          address,
          phone,
          email,
          website,
          logo_url,
          opening_hours,
          tax_rate,
          currency,
          currency_symbol,
          payment_methods,
          features
        FROM restaurants
      `;
      let params = [];

      if (restaurantId) {
        query += ' WHERE id = ?';
        params.push(restaurantId);
      }

      const restaurant = db.prepare(query).get(...params);

      if (!restaurant) {
        // Return default settings if no restaurant found
        const defaultSettings = {
          name: 'ArtHaus Café',
          description: '',
          address: '',
          phone: '',
          email: '',
          website: '',
          logo_url: '',
          opening_hours: {
            monday: { open: '09:00', close: '22:00', closed: false },
            tuesday: { open: '09:00', close: '22:00', closed: false },
            wednesday: { open: '09:00', close: '22:00', closed: false },
            thursday: { open: '09:00', close: '22:00', closed: false },
            friday: { open: '09:00', close: '23:00', closed: false },
            saturday: { open: '09:00', close: '23:00', closed: false },
            sunday: { open: '09:00', close: '21:00', closed: false },
          },
          tax_rate: 5,
          currency: 'INR',
          currency_symbol: '₹',
          payment_methods: {
            cash: true,
            card: true,
            upi: true,
            wallet: false,
          },
          features: {
            table_reservation: true,
            online_ordering: true,
            delivery: false,
            takeaway: true,
          },
        };
        return success(res, defaultSettings, 'Default settings retrieved');
      }

      // Parse JSON fields if stored as strings
      const settings = {
        ...restaurant,
        opening_hours: typeof restaurant.opening_hours === 'string' 
          ? JSON.parse(restaurant.opening_hours) 
          : restaurant.opening_hours,
        payment_methods: typeof restaurant.payment_methods === 'string'
          ? JSON.parse(restaurant.payment_methods)
          : restaurant.payment_methods,
        features: typeof restaurant.features === 'string'
          ? JSON.parse(restaurant.features)
          : restaurant.features,
      };

      return success(res, settings, 'Settings retrieved');
    } catch (err) {
      logger.error('Get settings error', { error: err.message });
      return error(res, 'Failed to get settings', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Update restaurant settings
   */
  static async updateSettings(req, res) {
    try {
      const db = getDB();
      const { restaurantId } = req.tenant || {};
      const {
        name,
        description,
        address,
        phone,
        email,
        website,
        logo_url,
        opening_hours,
        tax_rate,
        currency,
        currency_symbol,
        payment_methods,
        features,
      } = req.body;

      if (!restaurantId) {
        return error(res, 'Restaurant ID required', HTTP_STATUS.BAD_REQUEST);
      }

      // Convert objects to JSON for storage
      const openingHoursJson = JSON.stringify(opening_hours);
      const paymentMethodsJson = JSON.stringify(payment_methods);
      const featuresJson = JSON.stringify(features);

      // Update restaurant settings
      db.prepare(`
        UPDATE restaurants
        SET name = ?,
            description = ?,
            address = ?,
            phone = ?,
            email = ?,
            website = ?,
            logo_url = ?,
            opening_hours = ?,
            tax_rate = ?,
            currency = ?,
            currency_symbol = ?,
            payment_methods = ?,
            features = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        name,
        description,
        address,
        phone,
        email,
        website,
        logo_url,
        openingHoursJson,
        tax_rate,
        currency,
        currency_symbol,
        paymentMethodsJson,
        featuresJson,
        new Date().toISOString(),
        restaurantId
      );

      logger.info('Settings updated', { restaurantId });
      return success(res, { restaurantId }, 'Settings updated successfully');
    } catch (err) {
      logger.error('Update settings error', { error: err.message });
      return error(res, 'Failed to update settings', HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}
