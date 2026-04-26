# Admin Credentials

## Super Admin (All Restaurants Access)
- **Email:** superadmin@arthaus.com
- **Password:** Admin@123
- **Role:** super_admin
- **Access:** Can manage all restaurants, view all data, create new restaurants
- **Dashboard:** `/super-admin`

---

## Restaurant Admins

### 1. Bhedaghat Cafe (ArtHaus)
- **Restaurant Name:** Bhedaghat Cafe
- **Subdomain:** arthaus
- **URL:** `http://localhost:5173/?restaurant=arthaus`
- **Admin Name:** ArtHaus Admin
- **Email:** admin@arthaus.com
- **Password:** Admin@123
- **Role:** admin
- **Restaurant ID:** 1
- **Dashboard:** `/admin`

### 2. Hotel Adarsh
- **Restaurant Name:** Hotel Adarsh
- **Subdomain:** adarsh
- **URL:** `http://localhost:5173/?restaurant=adarsh`
- **Admin Name:** Hotel Adarsh Admin
- **Email:** admin@adarsh.com
- **Password:** Admin@123
- **Role:** admin
- **Restaurant ID:** 2
- **Dashboard:** `/admin`

---

## Login Instructions

### For Super Admin:
1. Go to: `http://localhost:5173/login`
2. Enter email: `superadmin@arthaus.com`
3. Enter password: `Admin@123`
4. Access super admin dashboard at `/super-admin`

### For Restaurant Admin (Bhedaghat Cafe):
1. Go to: `http://localhost:5173/login?restaurant=arthaus`
2. Enter email: `admin@arthaus.com`
3. Enter password: `Admin@123`
4. Access admin dashboard at `/admin`

### For Restaurant Admin (Hotel Adarsh):
1. Go to: `http://localhost:5173/login?restaurant=adarsh`
2. Enter email: `admin@adarsh.com`
3. Enter password: `Admin@123`
4. Access admin dashboard at `/admin`

---

## Admin Capabilities

### Super Admin Can:
- ✅ View all restaurants
- ✅ Create new restaurants with admin credentials
- ✅ View all customers across all restaurants
- ✅ View all staff across all restaurants
- ✅ View all orders across all restaurants
- ✅ View all tables across all restaurants
- ✅ Access cross-restaurant analytics
- ✅ Manage system-wide settings

### Restaurant Admin Can:
- ✅ View dashboard stats (orders, revenue, tables)
- ✅ Manage active orders (accept, deliver, cancel)
- ✅ View order history (today, all, completed, cancelled)
- ✅ Manage menu items (add, edit, delete products)
- ✅ Manage users (view customers, staff)
- ✅ Manage tables (create, update, delete)
- ✅ Manage carousel images
- ✅ Update restaurant settings
- ❌ Cannot access other restaurants' data
- ❌ Cannot create new restaurants

---

## Database Information

**Database Path:** `server/data/arthaus.db`

**Tables:**
- `users` - All users (customers, staff, admins)
- `restaurants` - Restaurant information
- `orders` - All orders
- `order_items` - Order line items
- `products` - Menu items
- `categories` - Menu categories
- `subcategories` - Menu subcategories
- `restaurant_tables` - Table management

---

## Password Policy

All admin passwords are currently set to: **Admin@123**

For production:
- Use strong, unique passwords
- Enable 2FA
- Rotate passwords regularly
- Use environment variables for credentials

---

*Note: These credentials are for development/testing purposes only. Never commit production credentials to version control.*
