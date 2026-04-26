# Quick Reference Guide

## 🚀 Quick Start

### Start Development Server
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Access URLs
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4001/api/v1

---

## 🔐 Admin Login (Quick Copy-Paste)

### Super Admin
```
Email: superadmin@arthaus.com
Password: Admin@123
URL: http://localhost:5173/login
```

### Bhedaghat Cafe Admin
```
Email: admin@arthaus.com
Password: Admin@123
URL: http://localhost:5173/login?restaurant=arthaus
```

### Hotel Adarsh Admin
```
Email: admin@adarsh.com
Password: Admin@123
URL: http://localhost:5173/login?restaurant=adarsh
```

---

## 📱 Customer Access

### Bhedaghat Cafe
```
URL: http://localhost:5173/?restaurant=arthaus
Table QR: http://localhost:5173/?restaurant=arthaus&table=1
```

### Hotel Adarsh
```
URL: http://localhost:5173/?restaurant=adarsh
Table QR: http://localhost:5173/?restaurant=adarsh&table=1
```

---

## 🗂️ Important Routes

### Customer Routes
- `/` - Home page
- `/menu` - Menu with categories
- `/login` - Login screen
- `/register` - Registration
- `/profile` - User profile
- `/order-history` - Order history

### Admin Routes
- `/admin` - Admin dashboard
- `/admin/orders` - All orders management
- `/admin/menu` - Menu management
- `/admin/users` - User management
- `/admin/tables` - Table management
- `/admin/carousel` - Carousel images
- `/admin/settings` - Restaurant settings

### Super Admin Routes
- `/super-admin` - Super admin dashboard

---

## 🗄️ Database

### Location
```
server/data/arthaus.db
```

### Quick Queries
```bash
# View all restaurants
sqlite3 server/data/arthaus.db "SELECT * FROM restaurants;"

# View all admins
sqlite3 server/data/arthaus.db "SELECT * FROM users WHERE role IN ('admin', 'super_admin');"

# View all orders
sqlite3 server/data/arthaus.db "SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;"

# View order items
sqlite3 server/data/arthaus.db "SELECT * FROM order_items WHERE order_id = 1;"
```

---

## 🎯 Order Status Flow

```
pending → confirmed → preparing → ready → served (completed)
   ↓          ↓           ↓          ↓
cancelled  cancelled  cancelled  cancelled
```

### Status Meanings
- **pending** - New order, waiting for acceptance
- **confirmed** - Order accepted by admin
- **preparing** - Kitchen is preparing
- **ready** - Order ready for serving
- **served** - Order delivered (completed)
- **cancelled** - Order cancelled

---

## 🔧 Common Tasks

### Create New Restaurant (Super Admin)
1. Login as super admin
2. Go to `/super-admin`
3. Click "Add Restaurant"
4. Fill details + admin credentials
5. New restaurant created with admin user

### Accept Order (Admin)
1. Login as restaurant admin
2. Go to `/admin`
3. Click "Accept Order" on pending order
4. Order status → confirmed

### Deliver Order (Admin)
1. Order must be confirmed/preparing/ready
2. Click "Deliver" button
3. Order status → served (completed)
4. Order moves to completed tab

### View Order History (Customer)
1. Login as customer
2. Go to `/profile`
3. Click "Order History"
4. See all past orders

---

## 📊 Multi-Restaurant Support

### How It Works
- Each restaurant has unique subdomain (arthaus, adarsh)
- Users can have accounts in multiple restaurants
- Same email can exist in different restaurants
- Orders are restaurant-specific
- Admins only see their restaurant data
- Super admin sees all data

### Restaurant Parameter
```
?restaurant=arthaus  → Bhedaghat Cafe
?restaurant=adarsh   → Hotel Adarsh
```

---

## 🐛 Troubleshooting

### Orders Not Showing
```bash
# Check if orders exist
sqlite3 server/data/arthaus.db "SELECT COUNT(*) FROM orders;"

# Check order status
sqlite3 server/data/arthaus.db "SELECT id, status FROM orders;"
```

### Login Issues
```bash
# Check user exists
sqlite3 server/data/arthaus.db "SELECT * FROM users WHERE email = 'admin@arthaus.com';"

# Check password hash
sqlite3 server/data/arthaus.db "SELECT password_hash FROM users WHERE email = 'admin@arthaus.com';"
```

### Database Reset
```bash
# Backup first
cp server/data/arthaus.db server/data/arthaus.db.backup

# Run init script
node server/src/database/init.js
```

---

## 📝 Notes

- All passwords: `Admin@123`
- Database: SQLite
- Frontend: React + Vite
- Backend: Node.js + Express
- State: Redux Toolkit
- UI: Tailwind CSS + Framer Motion

---

*Last Updated: April 2026*
