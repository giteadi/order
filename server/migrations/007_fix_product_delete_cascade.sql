-- Migration: Add ON DELETE CASCADE to product_id foreign keys
-- This fixes the 500 error when deleting products that have order history

-- Fix order_items table: Change ON DELETE behavior for product_id
-- We use CASCADE for cart_items but for order_items we want to preserve history,
-- so we'll use SET NULL instead to keep order records but remove product reference

-- Since SQLite doesn't support ALTER TABLE for foreign keys, we need to recreate tables

-- Step 1: Fix cart_items table (can safely cascade delete)
CREATE TABLE IF NOT EXISTS cart_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_id INTEGER,
  table_id INTEGER,
  product_id INTEGER,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  customizations TEXT,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

INSERT INTO cart_items_new SELECT * FROM cart_items;
DROP TABLE cart_items;
ALTER TABLE cart_items_new RENAME TO cart_items;

CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- Step 2: Fix order_items table (preserve history, set product_id to NULL on delete)
CREATE TABLE IF NOT EXISTS order_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  product_price REAL NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  customizations TEXT,
  subtotal REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

INSERT INTO order_items_new SELECT * FROM order_items;
DROP TABLE order_items;
ALTER TABLE order_items_new RENAME TO order_items;

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
