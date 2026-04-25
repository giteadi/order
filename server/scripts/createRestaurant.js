import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const db = new Database('./data/arthaus.db');

async function createRestaurant() {
  try {
    const name = process.argv[2] || 'ArtHaus Café';
    const subdomain = process.argv[3] || 'arthaus';
    const domain = process.argv[4] || null;

    // Check if restaurant already exists
    const existingRestaurant = db.prepare('SELECT * FROM restaurants WHERE subdomain = ?').get(subdomain);
    
    if (existingRestaurant) {
      console.log('Restaurant already exists:', subdomain);
      console.log('Restaurant ID:', existingRestaurant.id);
      return existingRestaurant.id;
    }

    // Create restaurant
    const result = db.prepare(`
      INSERT INTO restaurants (uuid, name, subdomain, domain, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(uuidv4(), name, subdomain, domain);

    console.log('✅ Restaurant created successfully');
    console.log('Name:', name);
    console.log('Subdomain:', subdomain);
    console.log('Domain:', domain || 'Not set');
    console.log('Restaurant ID:', result.lastInsertRowid);

    return result.lastInsertRowid;

  } catch (error) {
    console.error('❌ Error creating restaurant:', error.message);
  } finally {
    db.close();
  }
}

createRestaurant();
