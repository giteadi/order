import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/user.model.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import { success, error } from '../utils/response.js';
import { HTTP_STATUS } from '../config/index.js';
import { Logger } from '../utils/logger.js';
import { generateUUID } from '../utils/helpers.js';

const logger = Logger.getInstance();

// Google OAuth Client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com'
);

/**
 * Social Authentication Controller
 * Handles Google and Facebook OAuth
 */
export class SocialAuthController {
  /**
   * Google Login/Register
   * Verify Google ID token and login or create user
   */
  static async googleAuth(req, res) {
    try {
      const { idToken, restaurant } = req.body;

      logger.info('Google auth attempt', { 
        hasToken: !!idToken,
        clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
        restaurant
      });

      if (!idToken) {
        return error(res, 'Google ID token required', HTTP_STATUS.BAD_REQUEST);
      }

      // Verify Google token
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, name, picture, sub: googleId } = payload;

      logger.info('Google token verified', { email, googleId });

      if (!email) {
        return error(res, 'Email not provided by Google', HTTP_STATUS.BAD_REQUEST);
      }

      // Convert Google picture to base64
      let avatarBase64 = null;
      if (picture) {
        try {
          const imageResponse = await fetch(picture);
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString('base64');
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          avatarBase64 = `data:${contentType};base64,${base64}`;
        } catch (err) {
          logger.warn('Failed to fetch Google avatar', { error: err.message });
        }
      }

      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        // Existing user - update Google ID and avatar if not set
        const updateData = { google_id: googleId };
        if (avatarBase64 && !user.avatar_base64) {
          updateData.avatar_base64 = avatarBase64;
        }
        if (picture && !user.avatar_url) {
          updateData.avatar_url = picture;
        }
        User.update(user.id, updateData);
        logger.info('Google login successful', { userId: user.id, email });
      } else {
        // Create new user
        const bcrypt = await import('bcryptjs');
        const randomPassword = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const passwordHash = await bcrypt.default.hash(randomPassword, 12);

        // Get restaurant from request or default to first active restaurant
        const { getDB } = await import('../database/connection.js');
        const db = getDB();
        const defaultRestaurant = db.prepare('SELECT id FROM restaurants WHERE is_active = 1 LIMIT 1').get();
        let restaurantId = defaultRestaurant?.id || 1;
        
        if (restaurant) {
          // Try to find restaurant by subdomain
          const restaurantRecord = db.prepare('SELECT id FROM restaurants WHERE subdomain = ? LIMIT 1').get(restaurant);
          if (restaurantRecord) {
            restaurantId = restaurantRecord.id;
          }
        }

        const result = User.create({
          uuid: generateUUID(),
          email,
          name: name || email.split('@')[0],
          password_hash: passwordHash,
          google_id: googleId,
          avatar_url: picture,
          avatar_base64: avatarBase64,
          restaurant_id: restaurantId,
          is_active: 1,
        });

        user = User.findById(result.id, 'id, uuid, email, name, role, avatar_url, avatar_base64, created_at');
        logger.info('New user created via Google', { userId: user.id, email, restaurantId });
      }

      // Generate tokens
      const token = generateToken({ id: user.id, role: user.role });
      const refreshToken = generateRefreshToken(user.id);

      return success(res, {
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatar_url,
          avatarBase64: user.avatar_base64,
        },
        token,
        refreshToken,
        isNewUser: !user.last_login_at,
      }, 'Google login successful');

    } catch (err) {
      logger.error('Google auth failed', { error: err.message });
      return error(res, 'Google authentication failed', HTTP_STATUS.UNAUTHORIZED);
    }
  }

  /**
   * Facebook Login/Register
   * Verify Facebook access token
   */
  static async facebookAuth(req, res) {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return error(res, 'Facebook access token required', HTTP_STATUS.BAD_REQUEST);
      }

      // Verify Facebook token
      const fbResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
      );

      if (!fbResponse.ok) {
        return error(res, 'Invalid Facebook token', HTTP_STATUS.UNAUTHORIZED);
      }

      const fbData = await fbResponse.json();
      const { email, name, id: facebookId, picture } = fbData;

      if (!email) {
        return error(res, 'Email not provided by Facebook', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        // Existing user
        logger.info('Facebook login successful', { userId: user.id, email });
      } else {
        // Create new user
        const bcrypt = await import('bcryptjs');
        const randomPassword = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const passwordHash = await bcrypt.default.hash(randomPassword, 12);

        const result = User.create({
          email,
          name: name || email.split('@')[0],
          password_hash: passwordHash,
          facebook_id: facebookId,
          avatar_url: picture?.data?.url,
          is_active: 1,
        });

        user = User.findById(result.id, 'id, uuid, email, name, role, avatar_url, created_at');
        logger.info('New user created via Facebook', { userId: user.id, email });
      }

      // Generate tokens
      const token = generateToken({ id: user.id, role: user.role });
      const refreshToken = generateRefreshToken(user.id);

      return success(res, {
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatar_url,
        },
        token,
        refreshToken,
        isNewUser: !user.last_login_at,
      }, 'Facebook login successful');

    } catch (err) {
      logger.error('Facebook auth failed', { error: err.message });
      return error(res, 'Facebook authentication failed', HTTP_STATUS.UNAUTHORIZED);
    }
  }
}
