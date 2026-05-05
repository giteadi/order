import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { CONFIG } from '../config/index.js';
import { Logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = Logger.getInstance();

/**
 * Database Connection Manager (Singleton)
 * Uses better-sqlite3 for synchronous, high-performance operations
 */
class DatabaseManager {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection with optimized settings
   */
  connect() {
    if (this.isConnected && this.db) {
      return this.db;
    }

    try {
      // Ensure data directory exists
      const dbDir = dirname(CONFIG.DB.PATH);
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }

      // Initialize connection with performance optimizations
      this.db = new Database(CONFIG.DB.PATH, {
        verbose: CONFIG.IS_DEV ? (sql) => logger.debug(`SQL: ${sql}`) : null,
        fileMustExist: false,
      });

      // Apply pragmas for performance and safety
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('busy_timeout = ' + CONFIG.DB.BUSY_TIMEOUT);
      this.db.pragma('cache_size = ' + CONFIG.DB.CACHE_SIZE);
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('temp_store = MEMORY');
      this.db.pragma('mmap_size = 30000000000'); // 30GB memory map

      this.isConnected = true;
      logger.info('Database connected successfully', { path: CONFIG.DB.PATH });

      return this.db;
    } catch (error) {
      logger.error('Database connection failed', { error: error.message });
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Get database instance (singleton)
   */
  getDB() {
    if (!this.isConnected) {
      return this.connect();
    }
    return this.db;
  }

  /**
   * Execute transaction with automatic rollback on error
   * @param {Function} callback - Function receiving db instance
   * @returns {any} Transaction result
   */
  transaction(callback) {
    const db = this.getDB();
    const tx = db.transaction((...args) => callback(db, ...args));
    return tx();
  }

  /**
   * Run query with prepared statement caching
   */
  prepare(sql) {
    return this.getDB().prepare(sql);
  }

  /**
   * Close connection gracefully
   */
  close() {
    if (this.db) {
      this.db.close();
      this.isConnected = false;
      this.db = null;
      logger.info('Database connection closed');
    }
  }

  /**
   * Backup database to file
   */
  backup(destinationPath) {
    const db = this.getDB();
    db.backup(destinationPath)
      .then(() => logger.info('Database backup completed', { path: destinationPath }))
      .catch(err => logger.error('Database backup failed', { error: err.message }));
  }

  /**
   * Get database stats
   */
  getStats() {
    const db = this.getDB();
    return {
      tables: db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'").get(),
      size: db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get(),
      walSize: db.prepare("SELECT * FROM pragma_wal_checkpoint(TRUNCATE)").get(),
    };
  }
}

// Export singleton instance
export const dbManager = new DatabaseManager();

// Convenience exports
export const getDB = () => dbManager.getDB();
export const transaction = (fn) => dbManager.transaction(fn);
export const prepare = (sql) => dbManager.prepare(sql);
