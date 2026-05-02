import { User } from '../models/user.model.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import { success, created, error, conflict, validationError } from '../utils/response.js';
import { isValidEmail, isValidPhone } from '../utils/helpers.js';
import { HTTP_STATUS } from '../config/index.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * Auth Controller - Handles authentication logic
 */
export class AuthController {
  /**
   * Register new user
   */
  static async register(req, res) {
    try {
      const { name, email, phone, password, restaurant } = req.body;

      // Validate at least one contact method
      if (!email && !phone) {
        return validationError(res, [{ field: 'email', message: 'Email or phone is required' }]);
      }

      // Validate formats
      if (email && !isValidEmail(email)) {
        return validationError(res, [{ field: 'email', message: 'Invalid email format' }]);
      }

      if (phone && !isValidPhone(phone)) {
        return validationError(res, [{ field: 'phone', message: 'Invalid phone number' }]);
      }

      // Get restaurant_id from subdomain or request
      let restaurantId = null;
      if (restaurant) {
        const restaurantRecord = User.db.prepare('SELECT id FROM restaurants WHERE subdomain = ?').get(restaurant);
        if (restaurantRecord) {
          restaurantId = restaurantRecord.id;
        }
      }

      // Check for existing user in THIS restaurant
      if (email && restaurantId) {
        const existingUser = User.db.prepare(
          'SELECT id FROM users WHERE email = ? AND restaurant_id = ?'
        ).get(email, restaurantId);
        
        if (existingUser) {
          return conflict(res, 'Email already registered for this restaurant');
        }
      }

      if (phone && restaurantId) {
        const existingUser = User.db.prepare(
          'SELECT id FROM users WHERE phone = ? AND restaurant_id = ?'
        ).get(phone, restaurantId);
        
        if (existingUser) {
          return conflict(res, 'Phone number already registered for this restaurant');
        }
      }

      // Create user with restaurant_id
      const user = await User.createUser({ 
        email, 
        phone, 
        password, 
        name,
        restaurantId 
      });

      // Generate tokens
      const token = generateToken({ id: user.id, role: user.role });
      const refreshToken = generateRefreshToken(user.id);

      logger.info('User registered', { userId: user.id, restaurant: restaurant || 'none' });

      return created(res, {
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurant_id,
        },
        token,
        refreshToken,
      }, 'Account created successfully');

    } catch (err) {
      logger.error('Registration failed', { error: err.message });
      return error(res, 'Registration failed', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { email, phone, password, restaurant } = req.body;

      logger.info('Login attempt', { email, phone, restaurant, body: req.body });

      // Validate input
      if (!email && !phone) {
        return validationError(res, [{ field: 'email', message: 'Email or phone is required' }]);
      }

      // Get restaurant_id if provided
      let restaurantId = null;
      if (restaurant) {
        const restaurantRecord = User.db.prepare('SELECT id FROM restaurants WHERE subdomain = ?').get(restaurant);
        if (restaurantRecord) {
          restaurantId = restaurantRecord.id;
        }
      }

      // Verify credentials with restaurant context
      const user = await User.verifyCredentials(email, phone, password, restaurantId);

      if (!user) {
        logger.warn('Login failed - invalid credentials', { email, phone, restaurant });
        return error(res, 'Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
      }

      logger.info('User found', { userId: user.id, role: user.role, restaurantId: user.restaurant_id });

      // Check subscription for restaurant owners (admin, manager, staff)
      const needsSubscription = ['admin', 'manager', 'staff'].includes(user.role);
      
      if (needsSubscription) {
        const db = User.db;
        const subscription = db.prepare(`
          SELECT us.*, sp.name as plan_name
          FROM user_subscriptions us
          JOIN subscription_plans sp ON us.plan_id = sp.id
          WHERE us.user_id = ?
          AND us.status = 'active'
          AND us.end_date > datetime('now')
          AND (us.is_manually_blocked IS NULL OR us.is_manually_blocked = 0)
          ORDER BY us.end_date DESC
          LIMIT 1
        `).get(user.id);

        if (!subscription) {
          // Check if manually blocked
          const blockedSub = db.prepare(`
            SELECT us.*, sp.name as plan_name, us.block_reason
            FROM user_subscriptions us
            JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = ?
            AND us.is_manually_blocked = 1
            ORDER BY us.end_date DESC
            LIMIT 1
          `).get(user.id);

          if (blockedSub) {
            logger.warn('Login blocked - subscription suspended', { userId: user.id });
            return error(res, 'Your subscription has been suspended. Please contact support.', HTTP_STATUS.FORBIDDEN);
          }

          // Check if expired
          const expiredSub = db.prepare(`
            SELECT us.*, sp.name as plan_name
            FROM user_subscriptions us
            JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = ?
            AND us.status = 'expired'
            ORDER BY us.end_date DESC
            LIMIT 1
          `).get(user.id);

          if (expiredSub) {
            logger.warn('Login blocked - subscription expired', { userId: user.id });
            return error(res, 'SUBSCRIPTION_EXPIRED', HTTP_STATUS.FORBIDDEN, {
              code: 'SUBSCRIPTION_EXPIRED',
              requiresRenewal: true,
              message: 'Your subscription has expired. Please renew to continue.'
            });
          }

          // No subscription at all
          logger.warn('Login blocked - no subscription', { userId: user.id });
          return error(res, 'SUBSCRIPTION_REQUIRED', HTTP_STATUS.FORBIDDEN, {
            code: 'SUBSCRIPTION_REQUIRED',
            requiresPurchase: true,
            message: 'Subscription required. Please purchase a plan to continue.'
          });
        }
      }

      // Generate tokens
      const token = generateToken({ id: user.id, role: user.role });
      const refreshToken = generateRefreshToken(user.id);

      logger.info('User logged in', { userId: user.id, role: user.role });

      const responseData = {
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurant_id,
        },
        token,
        refreshToken,
      };

      logger.info('Sending response', { data: responseData });

      return success(res, responseData, 'Login successful');

    } catch (err) {
      logger.error('Login failed', { error: err.message });
      return error(res, 'Login failed', HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Get current user profile
   */
  static getProfile(req, res) {
    try {
      const user = User.getProfile(req.user.id);
      
      if (!user) {
        return error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      return success(res, user);

    } catch (err) {
      logger.error('Get profile failed', { error: err.message });
      return error(res, 'Failed to get profile');
    }
  }

  /**
   * Update profile
   */
  static async updateProfile(req, res) {
    try {
      const { name, avatarUrl } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (avatarUrl) updateData.avatar_url = avatarUrl;

      if (Object.keys(updateData).length === 0) {
        return validationError(res, [{ message: 'No fields to update' }]);
      }

      User.update(req.user.id, updateData);

      const user = User.getProfile(req.user.id);
      return success(res, user, 'Profile updated successfully');

    } catch (err) {
      logger.error('Update profile failed', { error: err.message });
      return error(res, 'Failed to update profile');
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const user = User.findById(req.user.id, 'password_hash');
      const bcrypt = await import('bcryptjs');
      
      const isValid = await bcrypt.default.compare(currentPassword, user.password_hash);
      
      if (!isValid) {
        return error(res, 'Current password is incorrect', HTTP_STATUS.UNAUTHORIZED);
      }

      await User.updatePassword(req.user.id, newPassword);

      return success(res, null, 'Password changed successfully');

    } catch (err) {
      logger.error('Change password failed', { error: err.message });
      return error(res, 'Failed to change password');
    }
  }

  /**
   * Forgot password - send reset link
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = User.findOne({ email });

      if (!user) {
        // Don't reveal if email exists
        return success(res, null, 'If email exists, reset instructions sent');
      }

      // Generate reset token (would send email in production)
      const resetToken = generateToken({ id: user.id, purpose: 'reset' }, '1h');

      logger.info('Password reset requested', { userId: user.id });

      return success(res, { 
        resetToken, // In production, this would be sent via email
        expiresIn: '1h' 
      }, 'Password reset instructions sent');

    } catch (err) {
      logger.error('Forgot password failed', { error: err.message });
      return error(res, 'Failed to process request');
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Verify token
      const jwt = await import('jsonwebtoken');
      const { CONFIG } = await import('../config/index.js');
      
      const decoded = jwt.default.verify(token, CONFIG.JWT.SECRET);
      
      if (decoded.purpose !== 'reset') {
        return error(res, 'Invalid reset token', HTTP_STATUS.BAD_REQUEST);
      }

      await User.updatePassword(decoded.id, newPassword);

      logger.info('Password reset successful', { userId: decoded.id });

      return success(res, null, 'Password reset successful');

    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return error(res, 'Reset token expired', HTTP_STATUS.BAD_REQUEST);
      }
      logger.error('Reset password failed', { error: err.message });
      return error(res, 'Invalid reset token', HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      const { verifyRefreshToken, generateToken } = await import('../middleware/auth.js');
      const decoded = verifyRefreshToken(refreshToken);

      const user = User.findById(decoded.id, 'id, role');
      
      if (!user) {
        return error(res, 'Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
      }

      const newToken = generateToken({ id: user.id, role: user.role });

      return success(res, { token: newToken }, 'Token refreshed');

    } catch (err) {
      return error(res, 'Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }
  }

  /**
   * Logout (client-side token removal)
   */
  static logout(req, res) {
    // In stateless JWT, logout is handled client-side
    // Optional: Add to token blacklist if using Redis
    return success(res, null, 'Logged out successfully');
  }
}
