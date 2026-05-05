import { getDB, transaction } from '../database/connection.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * Base Model Class - Abstract layer for database operations
 * Provides reusable CRUD methods with SQL2 (better-sqlite3)
 */
export class BaseModel {
  constructor(tableName) {
    this.table = tableName;
    this.db = getDB();
  }

  /**
   * Find all records with optional filtering
   */
  findAll(options = {}) {
    const {
      where = {},
      orderBy = 'id DESC',
      limit = null,
      offset = null,
      select = '*',
    } = options;

    let sql = `SELECT ${select} FROM ${this.table}`;
    const params = [];

    // Build WHERE clause
    const whereKeys = Object.keys(where);
    if (whereKeys.length > 0) {
      const conditions = whereKeys.map((key) => {
        if (where[key] === null) {
          return `${key} IS NULL`;
        }
        if (Array.isArray(where[key])) {
          const placeholders = where[key].map(() => '?').join(',');
          params.push(...where[key]);
          return `${key} IN (${placeholders})`;
        }
        params.push(where[key]);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add order
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    // Add pagination
    if (limit) {
      sql += ` LIMIT ?`;
      params.push(limit);
      if (offset) {
        sql += ` OFFSET ?`;
        params.push(offset);
      }
    }

    const stmt = this.db.prepare(sql);
    return params.length > 0 ? stmt.all(...params) : stmt.all();
  }

  /**
   * Find single record by ID
   */
  findById(id, select = '*') {
    const stmt = this.db.prepare(`SELECT ${select} FROM ${this.table} WHERE id = ?`);
    return stmt.get(id);
  }

  /**
   * Find by UUID
   */
  findByUUID(uuid, select = '*') {
    const stmt = this.db.prepare(`SELECT ${select} FROM ${this.table} WHERE uuid = ?`);
    return stmt.get(uuid);
  }

  /**
   * Find single record with conditions
   */
  findOne(where = {}, select = '*') {
    const results = this.findAll({ where, select, limit: 1 });
    return results[0] || null;
  }

  /**
   * Count records with optional filter
   */
  count(where = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.table}`;
    const params = [];

    const whereKeys = Object.keys(where);
    if (whereKeys.length > 0) {
      const conditions = whereKeys.map((key) => {
        params.push(where[key]);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params);
    return result.count;
  }

  /**
   * Check if record exists
   */
  exists(where = {}) {
    return this.count(where) > 0;
  }

  /**
   * Create new record
   */
  create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(',');

    const sql = `INSERT INTO ${this.table} (${keys.join(',')}) VALUES (${placeholders})`;
    const stmt = this.db.prepare(sql);
    
    const result = stmt.run(...values);
    
    return {
      id: result.lastInsertRowid,
      changes: result.changes,
      ...data,
    };
  }

  /**
   * Batch create records (transaction)
   */
  createMany(items) {
    return transaction((db) => {
      const results = [];
      for (const data of items) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map(() => '?').join(',');
        
        const sql = `INSERT INTO ${this.table} (${keys.join(',')}) VALUES (${placeholders})`;
        const stmt = db.prepare(sql);
        const result = stmt.run(...values);
        
        results.push({
          id: result.lastInsertRowid,
          ...data,
        });
      }
      return results;
    });
  }

  /**
   * Update record by ID
   */
  update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = keys.map((k) => `${k} = ?`).join(',');
    const sql = `UPDATE ${this.table} SET ${setClause} WHERE id = ?`;
    
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...values, id);
    
    return {
      changes: result.changes,
      id,
    };
  }

  /**
   * Update with where condition
   */
  updateWhere(where, data) {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);

    const setClause = dataKeys.map((k) => `${k} = ?`).join(',');
    const whereClause = whereKeys.map((k) => `${k} = ?`).join(' AND ');
    
    const sql = `UPDATE ${this.table} SET ${setClause} WHERE ${whereClause}`;
    
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...dataValues, ...whereValues);
    
    return { changes: result.changes };
  }

  /**
   * Delete record by ID
   */
  delete(id) {
    const stmt = this.db.prepare(`DELETE FROM ${this.table} WHERE id = ?`);
    const result = stmt.run(id);
    return { changes: result.changes };
  }

  /**
   * Delete with where condition
   */
  deleteWhere(where) {
    const keys = Object.keys(where);
    const values = Object.values(where);

    const whereClause = keys.map((k) => `${k} = ?`).join(' AND ');
    const sql = `DELETE FROM ${this.table} WHERE ${whereClause}`;
    
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...values);
    
    return { changes: result.changes };
  }

  /**
   * Raw query execution
   */
  query(sql, params = []) {
    const db = getDB();
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }

  /**
   * Raw get single row
   */
  queryOne(sql, params = []) {
    const db = getDB();
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  }

  /**
   * Raw run (insert/update/delete)
   */
  run(sql, params = []) {
    const db = getDB();
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  }

  /**
   * Execute within transaction
   */
  transaction(callback) {
    return transaction(callback);
  }
}
