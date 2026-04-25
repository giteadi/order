import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const db = new Database('./data/arthaus.db');

async function createAdmin() {
  try {
    const email = process.argv[2] || 'admin@arthaus.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Admin User';
    const role = process.argv[5] || 'admin';
    const restaurantId = process.argv[6] || null; // null for super_admin

    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (existingUser) {
      console.log('User already exists:', email);
      console.log('Updating role to:', role);
      
      // Update role and restaurant_id
      db.prepare('UPDATE users SET role = ?, restaurant_id = ? WHERE email = ?').run(role, restaurantId, email);
      console.log('✅ Role updated successfully');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    const result = db.prepare(`
      INSERT INTO users (uuid, email, password_hash, name, role, restaurant_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(uuidv4(), email, passwordHash, name, role, restaurantId);

    console.log('✅ Admin user created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', role);
    console.log('Restaurant ID:', restaurantId || 'Super Admin (no restaurant)');
    console.log('User ID:', result.lastInsertRowid);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    db.close();
  }
}

createAdmin();
