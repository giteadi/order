-- Migration: Make subcategory_id nullable in products table
-- This allows products without subcategories

BEGIN TRANSACTION;

-- Step 1: Create new table with nullable subcategory_id
CREATE TABLE products_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL CHECK(price > 0),
  image_url TEXT,
  emoji_icon TEXT,
  is_vegetarian INTEGER DEFAULT 0,
  is_spicy INTEGER DEFAULT 0,
  is_available INTEGER DEFAULT 1,
  preparation_time INTEGER,
  calories INTEGER,
  allergens TEXT,
  customization_options TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);

-- Step 2: Copy data from old table
INSERT INTO products_new SELECT * FROM products;

-- Step 3: Drop old table
DROP TABLE products;

-- Step 4: Rename new table
ALTER TABLE products_new RENAME TO products;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

COMMIT;

-- Verify
.schema products
