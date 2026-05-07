import Package from '../models/package.model.js';
import { logger } from '../utils/logger.js';

// Get all packages for a restaurant
export const getPackages = async (req, res) => {
  try {
    const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const db = req.app.locals.db;
    const packageModel = new Package(db);
    const packages = packageModel.getAllByRestaurant(restaurantId);

    return res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    logger.error('Error getting packages', { error: error.message });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
    });
  }
};

// Get active packages for customers (public)
export const getActivePackages = async (req, res) => {
  try {
    const restaurantId = req.tenant?.restaurantId || req.query.restaurant_id;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const db = req.app.locals.db;
    const packageModel = new Package(db);
    const packages = packageModel.getActivePackages(restaurantId);

    return res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    logger.error('Error getting active packages', { error: error.message });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
    });
  }
};

// Create new package
export const createPackage = async (req, res) => {
  try {
    const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const {
      name,
      description,
      price,
      original_price,
      items,
      image_url,
      valid_from,
      valid_until,
      code,
    } = req.body;

    if (!name || !price || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and at least one item are required',
      });
    }

    const db = req.app.locals.db;
    const packageModel = new Package(db);

    const newPackage = packageModel.create({
      name,
      description,
      price,
      original_price,
      items,
      image_url,
      restaurant_id: restaurantId,
      valid_from,
      valid_until,
      code,
    });

    logger.info('Package created', {
      packageId: newPackage.id,
      restaurantId,
      name,
    });

    return res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: newPackage,
    });
  } catch (error) {
    logger.error('Error creating package', { error: error.message });

    return res.status(500).json({
      success: false,
      message: 'Failed to create package',
    });
  }
};

// Update package
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id;

    const db = req.app.locals.db;
    const packageModel = new Package(db);

    // Check if package exists and belongs to this restaurant
    const existingPackage = packageModel.getById(id);
    if (!existingPackage || existingPackage.restaurant_id !== restaurantId) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    const updatedPackage = packageModel.update(id, req.body);

    logger.info('Package updated', {
      packageId: id,
      restaurantId,
    });

    return res.json({
      success: true,
      message: 'Package updated successfully',
      data: updatedPackage,
    });
  } catch (error) {
    logger.error('Error updating package', { error: error.message });

    return res.status(500).json({
      success: false,
      message: 'Failed to update package',
    });
  }
};

// Delete package
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.tenant?.restaurantId || req.user?.restaurant_id;

    const db = req.app.locals.db;
    const packageModel = new Package(db);

    // Check if package exists and belongs to this restaurant
    const existingPackage = packageModel.getById(id);
    if (!existingPackage || existingPackage.restaurant_id !== restaurantId) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    const deleted = packageModel.delete(id);

    if (deleted) {
      logger.info('Package deleted', {
        packageId: id,
        restaurantId,
      });

      return res.json({
        success: true,
        message: 'Package deleted successfully',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete package',
      });
    }
  } catch (error) {
    logger.error('Error deleting package', { error: error.message });

    return res.status(500).json({
      success: false,
      message: 'Failed to delete package',
    });
  }
};
