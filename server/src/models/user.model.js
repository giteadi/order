import bcrypt from 'bcryptjs';
import { BaseModel } from './base.model.js';
import { generateUUID } from '../utils/helpers.js';
import { CONFIG } from '../config/index.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * User Model - Handles all user-related database operations
 */
export class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  /**
   * Create new user with hashed password
   */
  async createUser({ email, phone, password, name, role = 'customer' }) {
    const uuid = generateUUID();
    const passwordHash = await bcrypt.hash(password, CONFIG.BCRYPT_ROUNDS);

    const data = {
      uuid,
      email: email || null,
      phone: phone || null,
      password_hash: passwordHash,
      name,
      role,
      is_active: 1,
    };

    const result = this.create(data);
    
    logger.info('User created', { userId: result.id, email, phone });
    
    return this.findById(result.id, 'id, uuid, email, phone, name, role, created_at');
  }

  /**
   * Verify user credentials
   */
  async verifyCredentials(email, phone, password) {
    const where = email ? { email } : { phone };
    const user = this.findOne(where);

    if (!user || !user.is_active) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (isValid) {
      // Update last login
      this.update(user.id, { last_login_at: new Date().toISOString() });
      return user;
    }

    return null;
  }

  /**
   * Find user by email or phone
   */
  findByEmailOrPhone(email, phone) {
    if (email) {
      return this.findOne({ email });
    }
    if (phone) {
      return this.findOne({ phone });
    }
    return null;
  }

  /**
   * Check if email exists
   */
  emailExists(email) {
    return this.exists({ email });
  }

  /**
   * Check if phone exists
   */
  phoneExists(phone) {
    return this.exists({ phone });
  }

  /**
   * Update password
   */
  async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, CONFIG.BCRYPT_ROUNDS);
    return this.update(userId, { password_hash: passwordHash });
  }

  /**
   * Get user profile (excluding sensitive data)
   */
  getProfile(userId) {
    return this.findById(
      userId,
      'id, uuid, email, phone, name, role, avatar_url, created_at, last_login_at'
    );
  }

  /**
   * List users with pagination
   */
  listUsers({ page = 1, limit = 20, role = null, search = null }) {
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT id, uuid, email, phone, name, role, is_active, created_at, last_login_at
      FROM ${this.table}
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }

    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countSql = sql.replace(/SELECT.*FROM/i, 'SELECT COUNT(*) as count FROM');
    const total = this.queryOne(countSql, params).count;

    // Add ordering and pagination
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const data = this.query(sql, params);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

// Export singleton instance
export const User = new UserModel();
