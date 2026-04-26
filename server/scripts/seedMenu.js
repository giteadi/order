import Database from 'better-sqlite3';
import { Logger } from '../src/utils/logger.js';

const logger = Logger.getInstance();

const seedMenu = () => {
  try {
    // Direct database connection
    const db = new Database('./server/data/arthaus.db');

    logger.info('Starting menu seed...');

    // 1. Create Categories
    const categories = [
      { id: 1, name: 'Coffee/Beverage Menu', icon: '☕' },
      { id: 2, name: 'Food Menu', icon: '🍽️' }
    ];

    for (const cat of categories) {
      db.prepare(`
        INSERT OR IGNORE INTO categories (id, name, icon, sort_order, is_active)
        VALUES (?, ?, ?, ?, 1)
      `).run(cat.id, cat.name, cat.icon, cat.id);
    }

    logger.info('Categories created');

    // 2. Create Subcategories
    const subcategories = [
      { id: 1, category_id: 1, name: 'Espresso Classics', icon: '☕' },
      { id: 2, category_id: 1, name: 'Artisan Espresso', icon: '☕' },
      { id: 3, category_id: 1, name: 'Iced Classics', icon: '🧊' },
      { id: 4, category_id: 2, name: 'Breakfast', icon: '🍳' },
      { id: 5, category_id: 2, name: 'Sandwiches', icon: '🥪' },
      { id: 6, category_id: 2, name: 'Pasta', icon: '🍝' },
    ];

    for (const subcat of subcategories) {
      db.prepare(`
        INSERT OR IGNORE INTO subcategories (id, category_id, name, icon, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(subcat.id, subcat.category_id, subcat.name, subcat.icon, subcat.id);
    }

    logger.info('Subcategories created');

    // 3. Create Products
    const products = [
      // Espresso Classics
      { id: 1, subcategory_id: 1, name: 'Espresso', price: 120, emoji_icon: '☕', description: 'Pure, bold, intense' },
      { id: 2, subcategory_id: 1, name: 'Americano', price: 140, emoji_icon: '☕', description: 'Smooth and strong' },
      { id: 3, subcategory_id: 1, name: 'Cappuccino', price: 160, emoji_icon: '☕', description: 'Creamy perfection' },
      { id: 4, subcategory_id: 1, name: 'Latte', price: 170, emoji_icon: '☕', description: 'Silky smooth' },
      { id: 5, subcategory_id: 1, name: 'Flat White', price: 180, emoji_icon: '☕', description: 'Velvety microfoam' },
      
      // Artisan Espresso
      { id: 6, subcategory_id: 2, name: 'Caramel Macchiato', price: 200, emoji_icon: '☕', description: 'Sweet caramel layers' },
      { id: 7, subcategory_id: 2, name: 'Mocha', price: 190, emoji_icon: '🍫', description: 'Chocolate espresso blend' },
      { id: 8, subcategory_id: 2, name: 'Vanilla Latte', price: 185, emoji_icon: '☕', description: 'Smooth vanilla notes' },
      
      // Iced Classics
      { id: 9, subcategory_id: 3, name: 'Iced Americano', price: 150, emoji_icon: '🧊', description: 'Refreshingly cold' },
      { id: 10, subcategory_id: 3, name: 'Iced Latte', price: 180, emoji_icon: '🧊', description: 'Chilled perfection' },
      { id: 11, subcategory_id: 3, name: 'Cold Brew', price: 190, emoji_icon: '🧊', description: 'Smooth cold extraction' },
      
      // Breakfast
      { id: 12, subcategory_id: 4, name: 'Pancakes', price: 180, emoji_icon: '🥞', description: 'Fluffy stack with syrup' },
      { id: 13, subcategory_id: 4, name: 'French Toast', price: 190, emoji_icon: '🍞', description: 'Golden and crispy' },
      { id: 14, subcategory_id: 4, name: 'Omelette', price: 160, emoji_icon: '🍳', description: 'Fluffy eggs your way' },
      
      // Sandwiches
      { id: 15, subcategory_id: 5, name: 'Club Sandwich', price: 220, emoji_icon: '🥪', description: 'Triple decker delight' },
      { id: 16, subcategory_id: 5, name: 'Grilled Cheese', price: 180, emoji_icon: '🧀', description: 'Melted perfection' },
      { id: 17, subcategory_id: 5, name: 'Veggie Sandwich', price: 190, emoji_icon: '🥗', description: 'Fresh and healthy' },
      
      // Pasta
      { id: 18, subcategory_id: 6, name: 'Pasta Alfredo', price: 280, emoji_icon: '🍝', description: 'Creamy white sauce' },
      { id: 19, subcategory_id: 6, name: 'Pasta Arrabiata', price: 260, emoji_icon: '🍝', description: 'Spicy tomato sauce' },
      { id: 20, subcategory_id: 6, name: 'Pesto Pasta', price: 290, emoji_icon: '🍝', description: 'Fresh basil pesto' },
    ];

    for (const product of products) {
      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, subcategory_id, name, price, emoji_icon, description,
          is_vegetarian, is_available, sort_order
        )
        VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?)
      `).run(
        product.id,
        product.subcategory_id,
        product.name,
        product.price,
        product.emoji_icon,
        product.description,
        product.id
      );
    }

    logger.info(`Products created: ${products.length} items`);

    // Verify
    const count = db.prepare('SELECT COUNT(*) as count FROM products').get();
    logger.info(`Total products in database: ${count.count}`);

    console.log('✅ Menu seed completed successfully!');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Subcategories: ${subcategories.length}`);
    console.log(`   - Products: ${products.length}`);

  } catch (error) {
    logger.error('Menu seed failed', { error: error.message });
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

// Run seed
seedMenu();
process.exit(0);
