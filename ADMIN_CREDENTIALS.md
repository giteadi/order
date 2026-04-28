# Admin Credentials - Vishnu Hastkala Kendra

## 🌐 Production URLs
- **Main Website:** https://vishnuhastkalakendra.com
- **Admin Login:** https://vishnuhastkalakendra.com/login
- **API Endpoint:** https://vishnuhastkalakendra.com/api/v1
- **Server Port:** 4002 (Internal)

---

## 🔐 Super Admin (All Restaurants Access)
- **Email:** superadmin@arthaus.com
- **Password:** Admin@123
- **Role:** super_admin
- **Access:** Can manage all restaurants, view all data, create new restaurants
- **Dashboard:** `/super-admin`

---

## 👨‍💼 Restaurant Admins

### 1. Bhedaghat Cafe (ArtHaus)
- **Restaurant Name:** Bhedaghat Cafe
- **Subdomain:** arthaus
- **Production URL:** `https://vishnuhastkalakendra.com/?restaurant=arthaus`
- **Admin Name:** ArtHaus Admin
- **Email:** admin@arthaus.com
- **Password:** Admin@123
- **Role:** admin
- **Restaurant ID:** 1
- **Dashboard:** `/admin`

### 2. Hotel Adarsh
- **Restaurant Name:** Hotel Adarsh
- **Subdomain:** adarsh
- **Production URL:** `https://vishnuhastkalakendra.com/?restaurant=adarsh`
- **Admin Name:** Hotel Adarsh Admin
- **Email:** admin@adarsh.com
- **Password:** Admin@123
- **Role:** admin
- **Restaurant ID:** 2
- **Dashboard:** `/admin`

---

## 📍 Server Information

### Server Details
- **Server IP:** 195.35.45.17
- **SSH Access:** `ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17` (Passphrase: 1234)
- **Sudo Password:** RuhiRiya@12345
- **Server Location:** `/root/vishnuhastkalakendra/`
- **Server Directory:** `/root/vishnuhastkalakendra/server`
- **Client Directory:** `/root/vishnuhastkalakendra/client`
- **Database Path:** `/root/vishnuhastkalakendra/server/data/arthaus.db`
- **Nginx Config:** `/etc/nginx/sites-available/vishnuhastkalakendra.com`
- **SSL Certificate:** `/etc/letsencrypt/live/vishnuhastkalakendra.com/`

### PM2 Process
- **Process Name:** arthaus
- **Process ID:** 8
- **Port:** 4002
- **Status:** Check with `pm2 list`
- **Logs:** `/root/.pm2/logs/arthaus-*.log`

---

## 🚀 Login Instructions

### For Super Admin:
1. Go to: `https://vishnuhastkalakendra.com/login`
2. Enter email: `superadmin@arthaus.com`
3. Enter password: `Admin@123`
4. Access super admin dashboard at `/super-admin`

### For Restaurant Admin (Bhedaghat Cafe):
1. Go to: `https://vishnuhastkalakendra.com/login?restaurant=arthaus`
2. Enter email: `admin@arthaus.com`
3. Enter password: `Admin@123`
4. Access admin dashboard at `/admin`

### For Restaurant Admin (Hotel Adarsh):
1. Go to: `https://vishnuhastkalakendra.com/login?restaurant=adarsh`
2. Enter email: `admin@adarsh.com`
3. Enter password: `Admin@123`
4. Access admin dashboard at `/admin`

---

## 📊 Database Information

**Database Type:** SQLite  
**Database Path:** `/root/vishnuhastkalakendra/server/data/arthaus.db`

### Important Tables:
- `restaurants` - Restaurant information
- `users` - All users (customers, staff, admins)
- `orders` - All orders
- `order_items` - Order line items
- `products` - Menu items
- `categories` - Menu categories
- `subcategories` - Menu subcategories
- `restaurant_tables` - Table management
- `carousel_images` - Homepage carousel images

### Database Commands:
```bash
# SSH into server
ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17
# Passphrase: 1234

# Switch to root
sudo -i
# Password: RuhiRiya@12345

# Access database
cd /root/vishnuhastkalakendra/server
sqlite3 data/arthaus.db

# View restaurants
sqlite3 data/arthaus.db "SELECT * FROM restaurants;"

# View admin users
sqlite3 data/arthaus.db "SELECT id, email, role FROM users WHERE role IN ('admin', 'super_admin');"

# Backup database
cp data/arthaus.db data/arthaus_backup_$(date +%Y%m%d).db
```

---

## 🔧 Common Commands

### Server Management
```bash
# SSH into server
ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17
sudo -i

# Check PM2 status
pm2 list

# View logs
pm2 logs arthaus --lines 100

# Restart server
pm2 restart arthaus

# Stop server
pm2 stop arthaus

# Start server
pm2 start arthaus
```

### Nginx Management
```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View nginx logs
sudo tail -f /var/log/nginx/vishnuhastkalakendra_error.log
```

### SSL Certificate
```bash
# Renew SSL certificate
sudo certbot renew

# Check certificate expiry
sudo certbot certificates

# Force renew
sudo certbot renew --force-renewal
```

---

## 🔑 Admin Capabilities

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

## 📝 Password Policy

**Current Passwords:** Admin@123 (for all accounts)

**For Production:**
- ✅ Use strong, unique passwords
- ✅ Enable 2FA (when available)
- ✅ Rotate passwords regularly (every 90 days)
- ✅ Never share passwords via email/chat
- ✅ Use password manager
- ❌ Never commit credentials to version control

---

## 📝 Notes

- **Environment:** Production
- **Last Updated:** April 28, 2026
- **SSL Valid Until:** July 27, 2026
- **Database Backup:** Recommended weekly
- **Server Monitoring:** PM2 + Nginx logs

**⚠️ IMPORTANT:** Keep this file secure and never commit to public repositories!
