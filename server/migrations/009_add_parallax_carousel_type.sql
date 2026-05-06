-- Migration: Add 'parallax' to carousel_type constraint and fix existing images
-- This migration updates the carousel_images table to support 'parallax' type

-- SQLite doesn't support ALTER TABLE for CHECK constraints directly
-- So we need to recreate the table with the new constraint

-- Step 1: Create a temporary table with the new schema
CREATE TABLE carousel_images_temp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  restaurant_id INTEGER NOT NULL,
  carousel_type TEXT DEFAULT 'highlights' CHECK(carousel_type IN ('hero', 'highlights', 'collection', 'parallax')),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_base64 TEXT NOT NULL,
  image_thumbnail TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Step 2: Copy data from old table to new table
INSERT INTO carousel_images_temp 
SELECT * FROM carousel_images;

-- Step 3: Drop the old table
DROP TABLE carousel_images;

-- Step 4: Rename the temp table to original name
ALTER TABLE carousel_images_temp RENAME TO carousel_images;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_carousel_restaurant ON carousel_images(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_carousel_type ON carousel_images(carousel_type);
CREATE INDEX IF NOT EXISTS idx_carousel_order ON carousel_images(display_order);

-- Step 6: Update any images that have NULL thumbnail to use image_base64
UPDATE carousel_images 
SET image_thumbnail = image_base64 
WHERE image_thumbnail IS NULL AND image_base64 IS NOT NULL;
