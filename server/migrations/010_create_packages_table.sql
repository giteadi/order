-- Create packages/combos table for special offers
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  original_price REAL,
  items TEXT NOT NULL, -- JSON array of {product_id, quantity, name}
  image_url TEXT,
  restaurant_id INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1,
  valid_from TEXT,
  valid_until TEXT,
  code TEXT, -- Optional promo code
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_packages_restaurant ON packages(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);
