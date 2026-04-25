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
      const { name, email, phone, password } = req.body;

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

      // Check for existing user
      if (email && User.emailExists(email)) {
        return conflict(res, 'Email already registered');
      }

      if (phone && User.phoneExists(phone)) {
        return conflict(res, 'Phone number already registered');
      }

      // Create user
      const user = await User.createUser({ email, phone, password, name });

      // Generate tokens
      const token = generateToken({ id: user.id, role: user.role });
      const refreshToken = generateRefreshToken(user.id);

      logger.info('User registered', { userId: user.id });

      return created(res, {
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
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
      const { email, phone, password } = req.body;

      logger.info('Login attempt', { email, phone, body: req.body });

      // Validate input
      if (!email && !phone) {
        return validationError(res, [{ field: 'email', message: 'Email or phone is required' }]);
      }

      // Verify credentials
      const user = await User.verifyCredentials(email, phone, password);

      if (!user) {
        logger.warn('Login failed - invalid credentials', { email, phone });
        return error(res, 'Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
      }

      logger.info('User found', { userId: user.id, role: user.role, user: user });

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
