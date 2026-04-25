import { dbManager, getDB } from './connection.js';
import { TABLES } from '../config/index.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getInstance();

/**
 * Database Schema Definition
 * Optimized for restaurant ordering system with proper indexing
 */
const SCHEMA = {
  // Restaurants/Cafes table for multi-tenant architecture
  restaurants: `
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      subdomain TEXT UNIQUE NOT NULL,
      domain TEXT,
      logo_url TEXT,
      theme_config TEXT, -- JSON for theme customization
      settings TEXT, -- JSON for cafe-specific settings
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_restaurants_uuid ON restaurants(uuid);
    CREATE INDEX IF NOT EXISTS idx_restaurants_subdomain ON restaurants(subdomain);
  `,

  // Users table with auth
  [TABLES.USERS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.USERS} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      restaurant_id INTEGER,
      email TEXT,
      phone TEXT,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'staff', 'admin', 'super_admin')),
      avatar_url TEXT,
      avatar_base64 TEXT,
      google_id TEXT,
      facebook_id TEXT UNIQUE,
      is_active INTEGER DEFAULT 1,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_users_uuid ON ${TABLES.USERS}(uuid);
    CREATE INDEX IF NOT EXISTS idx_users_email ON ${TABLES.USERS}(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON ${TABLES.USERS}(phone);
    CREATE INDEX IF NOT EXISTS idx_users_restaurant ON ${TABLES.USERS}(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON ${TABLES.USERS}(google_id);
    CREATE INDEX IF NOT EXISTS idx_users_facebook_id ON ${TABLES.USERS}(facebook_id);
    
    -- Unique constraint: email + restaurant_id
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_restaurant ON ${TABLES.USERS}(email, restaurant_id) WHERE email IS NOT NULL;
  `,

  // Restaurant tables for QR ordering
  [TABLES.TABLES]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.TABLES} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER UNIQUE NOT NULL,
      qr_code TEXT UNIQUE NOT NULL,
      capacity INTEGER DEFAULT 4,
      location TEXT,
      status TEXT DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'reserved', 'cleaning')),
      current_session_id TEXT,
      last_occupied_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tables_number ON ${TABLES.TABLES}(table_number);
    CREATE INDEX IF NOT EXISTS idx_tables_status ON ${TABLES.TABLES}(status);
  `,

  // Categories (Coffee Menu, Food Menu)
  [TABLES.CATEGORIES]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.CATEGORIES} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Subcategories (Espresso, Breakfast, etc.)
  [TABLES.SUBCATEGORIES]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.SUBCATEGORIES} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES ${TABLES.CATEGORIES}(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_subcat_category ON ${TABLES.SUBCATEGORIES}(category_id);
  `,

  // Products/Menu items
  [TABLES.PRODUCTS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.PRODUCTS} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subcategory_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL CHECK(price > 0),
      image_url TEXT,
      emoji_icon TEXT,
      is_vegetarian INTEGER DEFAULT 0,
      is_spicy INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      preparation_time INTEGER, -- in minutes
      calories INTEGER,
      allergens TEXT, -- JSON array
      customization_options TEXT, -- JSON
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subcategory_id) REFERENCES ${TABLES.SUBCATEGORIES}(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_products_subcategory ON ${TABLES.PRODUCTS}(subcategory_id);
    CREATE INDEX IF NOT EXISTS idx_products_available ON ${TABLES.PRODUCTS}(is_available);
    CREATE INDEX IF NOT EXISTS idx_products_price ON ${TABLES.PRODUCTS}(price);
  `,

  // Orders
  [TABLES.ORDERS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.ORDERS} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      table_id INTEGER,
      table_number INTEGER,
      session_id TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled', 'paid')),
      order_type TEXT DEFAULT 'dine_in' CHECK(order_type IN ('dine_in', 'takeaway', 'delivery')),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'partial', 'paid', 'failed', 'refunded')),
      payment_method TEXT,
      subtotal REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      special_instructions TEXT,
      estimated_ready_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES ${TABLES.USERS}(id),
      FOREIGN KEY (table_id) REFERENCES ${TABLES.TABLES}(id)
    );
    CREATE INDEX IF NOT EXISTS idx_orders_uuid ON ${TABLES.ORDERS}(uuid);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON ${TABLES.ORDERS}(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_table ON ${TABLES.ORDERS}(table_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON ${TABLES.ORDERS}(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON ${TABLES.ORDERS}(created_at);
  `,

  // Order items
  [TABLES.ORDER_ITEMS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.ORDER_ITEMS} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_price REAL NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      customizations TEXT, -- JSON
      subtotal REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES ${TABLES.ORDERS}(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES ${TABLES.PRODUCTS}(id)
    );
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON ${TABLES.ORDER_ITEMS}(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product ON ${TABLES.ORDER_ITEMS}(product_id);
  `,

  // Cart items (temporary storage)
  [TABLES.CART_ITEMS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.CART_ITEMS} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      user_id INTEGER,
      table_id INTEGER,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      customizations TEXT, -- JSON
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES ${TABLES.USERS}(id),
      FOREIGN KEY (product_id) REFERENCES ${TABLES.PRODUCTS}(id)
    );
    CREATE INDEX IF NOT EXISTS idx_cart_session ON ${TABLES.CART_ITEMS}(session_id);
    CREATE INDEX IF NOT EXISTS idx_cart_user ON ${TABLES.CART_ITEMS}(user_id);
  `,

  // Group orders
  [TABLES.GROUP_ORDERS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.GROUP_ORDERS} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      table_id INTEGER NOT NULL,
      host_user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'ordering', 'ordered', 'completed')),
      members_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (table_id) REFERENCES ${TABLES.TABLES}(id),
      FOREIGN KEY (host_user_id) REFERENCES ${TABLES.USERS}(id)
    );
    CREATE INDEX IF NOT EXISTS idx_group_code ON ${TABLES.GROUP_ORDERS}(code);
  `,

  // Group order members
  [`${TABLES.GROUP_ORDERS}_members`]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.GROUP_ORDERS}_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_order_id INTEGER NOT NULL,
      user_id INTEGER,
      session_id TEXT,
      nickname TEXT,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_order_id) REFERENCES ${TABLES.GROUP_ORDERS}(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES ${TABLES.USERS}(id)
    );
  `
};

/**
 * Triggers for automatic timestamp updates
 */
const TRIGGERS = {
  users_update: `
    CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON ${TABLES.USERS}
    BEGIN
      UPDATE ${TABLES.USERS} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `,
  products_update: `
    CREATE TRIGGER IF NOT EXISTS update_products_timestamp 
    AFTER UPDATE ON ${TABLES.PRODUCTS}
    BEGIN
      UPDATE ${TABLES.PRODUCTS} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `,
  orders_update: `
    CREATE TRIGGER IF NOT EXISTS update_orders_timestamp 
    AFTER UPDATE ON ${TABLES.ORDERS}
    BEGIN
      UPDATE ${TABLES.ORDERS} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `,
  order_items_calc: `
    CREATE TRIGGER IF NOT EXISTS calc_order_item_subtotal 
    BEFORE INSERT ON ${TABLES.ORDER_ITEMS}
    BEGIN
      SELECT CASE 
        WHEN NEW.subtotal IS NULL THEN 
          UPDATE ${TABLES.ORDER_ITEMS} SET subtotal = NEW.product_price * NEW.quantity WHERE id = NEW.id;
      END;
    END;
  `
};

/**
 * Initialize database with all tables and triggers
 */
export async function initializeDatabase() {
  try {
    const db = dbManager.connect();
    
    logger.info('Initializing database schema...');

    // Execute schema creation
    for (const [name, sql] of Object.entries(SCHEMA)) {
      try {
        db.exec(sql);
        logger.debug(`Created table: ${name}`);
      } catch (err) {
        logger.error(`Failed to create ${name}`, { error: err.message });
        throw err;
      }
    }

    // Create triggers
    for (const [name, sql] of Object.entries(TRIGGERS)) {
      try {
        db.exec(sql);
        logger.debug(`Created trigger: ${name}`);
      } catch (err) {
        logger.warn(`Trigger ${name} may already exist`, { error: err.message });
      }
    }

    // Migration: Add new columns if they don't exist
    const migrations = [
      { table: TABLES.USERS, column: 'restaurant_id', type: 'INTEGER' },
      { table: TABLES.USERS, column: 'avatar_base64', type: 'TEXT' },
      { table: TABLES.USERS, column: 'google_id', type: 'TEXT' },
      { table: TABLES.USERS, column: 'facebook_id', type: 'TEXT UNIQUE' },
      { table: 'restaurants', column: 'description', type: 'TEXT' },
      { table: 'restaurants', column: 'address', type: 'TEXT' },
      { table: 'restaurants', column: 'phone', type: 'TEXT' },
      { table: 'restaurants', column: 'email', type: 'TEXT' },
      { table: 'restaurants', column: 'website', type: 'TEXT' },
      { table: 'restaurants', column: 'opening_hours', type: 'TEXT' },
      { table: 'restaurants', column: 'tax_rate', type: 'REAL' },
      { table: 'restaurants', column: 'currency', type: 'TEXT' },
      { table: 'restaurants', column: 'currency_symbol', type: 'TEXT' },
      { table: 'restaurants', column: 'payment_methods', type: 'TEXT' },
      { table: 'restaurants', column: 'features', type: 'TEXT' },
    ];

    for (const migration of migrations) {
      try {
        const columns = db.pragma(`table_info(${migration.table})`);
        const columnExists = columns.some(col => col.name === migration.column);
        
        if (!columnExists) {
          db.exec(`ALTER TABLE ${migration.table} ADD COLUMN ${migration.column} ${migration.type}`);
          logger.info(`Added column ${migration.column} to ${migration.table}`);
        }
      } catch (err) {
        logger.warn(`Migration failed for ${migration.column}`, { error: err.message });
      }
    }

    logger.info('Database schema initialized successfully');
    return true;
  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialized successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database initialization failed:', err.message);
      process.exit(1);
    });
}

export { SCHEMA, TRIGGERS };
