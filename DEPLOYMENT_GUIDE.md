# Vishnu Hastkala Kendra - Complete Deployment Guide

## 📋 Overview
This guide provides complete instructions for deploying the Vishnu Hastkala Kendra Restaurant Management System to production server.

## 🖥️ Server Information
- **Domain:** `vishnuhastkalakendra.com`
- **IP Address:** `195.35.45.17`
- **SSH Access:** `ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17`
- **SSH Key:** `~/.ssh/id_ed25519` (passphrase: `1234`)
- **Sudo Password:** `RuhiRiya@12345`
- **Operating System:** Ubuntu 24.04 LTS
- **Web Server:** Nginx 1.24.0
- **Process Manager:** PM2
- **Database:** SQLite 3.45.1
- **Node.js Version:** 18.20.8
- **SSL Provider:** Let's Encrypt (Valid until July 27, 2026)

## 📁 Folder Structure
```
/root/vishnuhastkalakendra/          # Main project directory
├── server/                          # Node.js backend application
│   ├── src/
│   │   ├── app.js                   # Main application file (PORT 4002)
│   │   ├── config/                  # Configuration files
│   │   ├── controllers/             # API controllers
│   │   ├── database/                # Database connection & initialization
│   │   ├── middleware/              # Auth, tenant, error handling
│   │   ├── models/                  # Database models
│   │   ├── routes/                  # API routes
│   │   └── utils/                   # Helper functions
│   ├── data/                        # SQLite database files
│   │   ├── arthaus.db               # Main database
│   │   ├── arthaus.db-shm           # Shared memory file
│   │   └── arthaus.db-wal           # Write-ahead log
│   ├── logs/                        # Application logs
│   ├── scripts/                     # Database seeding scripts
│   │   ├── createAdmin.js           # Create admin user
│   │   ├── createRestaurant.js      # Create restaurant
│   │   └── seedMenu.js              # Seed menu items
│   ├── package.json                 # Dependencies
│   └── .env                         # Environment variables
├── client/                          # React frontend (source)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── dist/                        # Build output (served by Nginx)
│   ├── .env                         # Frontend environment
│   └── package.json
└── logs/                            # Additional logs

# Nginx Configuration
/etc/nginx/sites-available/vishnuhastkalakendra.com
/etc/nginx/sites-enabled/vishnuhastkalakendra.com

# SSL Certificates
/etc/letsencrypt/live/vishnuhastkalakendra.com/
├── fullchain.pem
├── privkey.pem
├── cert.pem
└── chain.pem

# PM2 Logs
/root/.pm2/logs/
├── arthaus-out.log
└── arthaus-error.log
```

## 🚀 Deployment Steps

### 1. Local Development Setup
```bash
# Navigate to project
cd /Users/adityasharma/Desktop/order

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install

# Configure environment
# server/.env already configured
# client/.env already configured with PORT 4002
```

### 2. Create Deployment Archive
```bash
# Navigate to project root
cd /Users/adityasharma/Desktop/order

# Create zip including .env, excluding unnecessary files
zip -r server-upload-with-env.zip server/ -x "server/node_modules/*" "server/data/*" "server/logs/*" "server/tests/*"
```

### 3. Upload to Server
```bash
# Upload zip to server using SSH key
scp -i ~/.ssh/id_ed25519 server-upload-with-env.zip aditya@195.35.45.17:/tmp/
# Enter passphrase when prompted: 1234
```

### 4. Server Setup
```bash
# SSH into server
ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17
# Enter passphrase: 1234

# Switch to root
sudo -i
# Password: RuhiRiya@12345

# Create project directory
mkdir -p /root/vishnuhastkalakendra

# Move zip to project directory
mv /tmp/server-upload-with-env.zip /root/vishnuhastkalakendra/

# Go into directory
cd /root/vishnuhastkalakendra

# Extract the zip
unzip server-upload-with-env.zip

# Remove zip file
rm server-upload-with-env.zip

# Go into server directory
cd server

# Install dependencies
npm install

# Create necessary directories
mkdir -p data logs

# Set permissions
chmod 755 data logs
```

### 5. Environment Configuration
```bash
# Create .env file
nano /root/vishnuhastkalakendra/server/.env
```

Add the following configuration:
```env
# Server Configuration
NODE_ENV=production
PORT=4002
API_VERSION=v1

# Database
DB_PATH=./data/arthaus.db
DB_BUSY_TIMEOUT=5000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://vishnuhastkalakendra.com,https://www.vishnuhastkalakendra.com

# Google OAuth
GOOGLE_CLIENT_ID=144932328528-pt437uppkbiqdp7blb898gk7en2lsppn.apps.googleusercontent.com

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### 6. Database Initialization
```bash
# Go to server directory
cd /root/vishnuhastkalakendra/server

# Initialize database (will create arthaus.db)
node -e "require('./src/database/init.js')"

# Create super admin
node scripts/createAdmin.js

# Create a restaurant (example)
node scripts/createRestaurant.js

# Seed menu items (optional)
node scripts/seedMenu.js
```

### 7. Backend Deployment with PM2
```bash
# Start with PM2
pm2 start src/app.js --name arthaus --cwd /root/vishnuhastkalakendra/server

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions displayed
```

### 8. Frontend Build & Deployment
```bash
# On local machine
cd /Users/adityasharma/Desktop/order/client

# Build for production
npm run build

# Create tar archive
tar -czf /tmp/arthaus-dist.tar.gz -C dist .

# Upload to server
scp -i ~/.ssh/id_ed25519 /tmp/arthaus-dist.tar.gz aditya@195.35.45.17:/tmp/

# On server
# Create frontend directory
mkdir -p /var/www/vishnuhastkalakendra

# Extract with proper permissions
rm -rf /var/www/vishnuhastkalakendra/*
tar -xzf /tmp/arthaus-dist.tar.gz -C /var/www/vishnuhastkalakendra/
chown -R www-data:www-data /var/www/vishnuhastkalakendra
chmod -R 755 /var/www/vishnuhastkalakendra
```

### 9. Nginx Configuration
Create `/etc/nginx/sites-available/vishnuhastkalakendra`:

```nginx
# Main domain (Super Admin)
server {
    if ($host = vishnuhastkalakendra.com) {
        return 301 https://$host$request_uri;
    }

    if ($host = www.vishnuhastkalakendra.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name vishnuhastkalakendra.com www.vishnuhastkalakendra.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vishnuhastkalakendra.com www.vishnuhastkalakendra.com;
    
    ssl_certificate /etc/letsencrypt/live/vishnuhastkalakendra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vishnuhastkalakendra.com/privkey.pem;

    root /var/www/vishnuhastkalakendra;
    index index.html;

    access_log /var/log/nginx/vishnuhastkalakendra-access.log;
    error_log /var/log/nginx/vishnuhastkalakendra-error.log;

    client_max_body_size 50M;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:4002;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_buffering off;
    }

    # Frontend files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Wildcard subdomain for multi-tenant restaurants
server {
    listen 80;
    server_name *.vishnuhastkalakendra.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name *.vishnuhastkalakendra.com;
    
    ssl_certificate /etc/letsencrypt/live/vishnuhastkalakendra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vishnuhastkalakendra.com/privkey.pem;

    root /var/www/vishnuhastkalakendra;
    index index.html;

    access_log /var/log/nginx/vishnuhastkalakendra-subdomain-access.log;
    error_log /var/log/nginx/vishnuhastkalakendra-subdomain-error.log;

    client_max_body_size 50M;

    # API proxy (subdomain-based tenant routing)
    location /api/ {
        proxy_pass http://127.0.0.1:4002;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_buffering off;
    }

    # Frontend files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
# Create symlink
ln -s /etc/nginx/sites-available/vishnuhastkalakendra /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### 10. SSL Certificate (Let's Encrypt)
```bash
# Install certbot
apt update
apt install certbot python3-certbot-nginx

# Obtain certificate for main domain
certbot --nginx -d vishnuhastkalakendra.com -d www.vishnuhastkalakendra.com

# For wildcard subdomain (requires DNS challenge)
certbot certonly --manual --preferred-challenges dns -d "*.vishnuhastkalakendra.com" -d "vishnuhastkalakendra.com"

# Test renewal
certbot renew --dry-run

# Setup auto-renewal
certbot renew --quiet
```

## 🔧 SSH Commands Reference

### File Operations
```bash
# Upload files from local
scp -i ~/.ssh/id_ed25519 file.txt aditya@195.35.45.17:/tmp/

# Download files from server
scp -i ~/.ssh/id_ed25519 aditya@195.35.45.17:/path/file.txt .

# Upload directory
zip -r archive.zip folder/
scp -i ~/.ssh/id_ed25519 archive.zip aditya@195.35.45.17:/tmp/

# On server: unzip archive.zip -d /destination/
```

### Server Access
```bash
# SSH into server with key
ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17
# Enter passphrase: 1234

# Switch to root
sudo -i
# Password: RuhiRiya@12345
```

### Server Management
```bash
# Check PM2 status
pm2 status
pm2 logs arthaus
pm2 monit

# Restart services
pm2 restart arthaus
systemctl reload nginx

# Check disk space
df -h
du -sh /root/vishnuhastkalakendra
du -sh /var/www/vishnuhastkalakendra
```

### Database Operations (SQLite)
```bash
# Connect to database
sqlite3 /root/vishnuhastkalakendra/server/data/arthaus.db

# Backup database
cp /root/vishnuhastkalakendra/server/data/arthaus.db /root/arthaus-backup-$(date +%Y%m%d).db

# Restore database
cp /root/arthaus-backup.db /root/vishnuhastkalakendra/server/data/arthaus.db
```

## 🛠️ Troubleshooting

### Backend Issues
```bash
# Check if backend is running
curl http://localhost:4002/api/v1/health

# Check PM2 logs
pm2 logs arthaus --lines 50

# Restart backend
pm2 restart arthaus

# Check port
netstat -tlnp | grep 4002
```

### Database Issues
```bash
# Check database file exists
ls -la /root/vishnuhastkalakendra/server/data/

# Check database permissions
chmod 644 /root/vishnuhastkalakendra/server/data/arthaus.db
chmod 755 /root/vishnuhastkalakendra/server/data

# Test database connection
sqlite3 /root/vishnuhastkalakendra/server/data/arthaus.db "SELECT * FROM restaurants;"
```

### Frontend Issues
```bash
# Check nginx configuration
nginx -t

# Check frontend files exist
ls -la /var/www/vishnuhastkalakendra/

# Check permissions
chown -R www-data:www-data /var/www/vishnuhastkalakendra
chmod -R 755 /var/www/vishnuhastkalakendra
```

### Subdomain Issues
```bash
# Check DNS records
dig subdomain.vishnuhastkalakendra.com

# Test subdomain access
curl -H "Host: arthaus.vishnuhastkalakendra.com" http://localhost/api/v1/health
```

## 📊 Monitoring & Logs

### Application Logs
```bash
# PM2 logs
pm2 logs arthaus
pm2 logs arthaus --lines 100

# Nginx logs
tail -f /var/log/nginx/vishnuhastkalakendra-access.log
tail -f /var/log/nginx/vishnuhastkalakendra-error.log

# Application logs
tail -f /root/vishnuhastkalakendra/server/logs/app.log
```

### Performance Monitoring
```bash
# Check resource usage
htop
df -h
free -h

# PM2 monitoring
pm2 monit
pm2 show arthaus
```

### Health Checks
```bash
# API health check
curl -I https://vishnuhastkalakendra.com/api/v1/health

# Frontend health check
curl -I https://vishnuhastkalakendra.com/

# Subdomain health check
curl -H "Host: arthaus.vishnuhastkalakendra.com" -I https://arthaus.vishnuhastkalakendra.com/api/v1/health
```

## 🔄 Update Procedures

### Backend Updates
```bash
# On local machine
cd /Users/adityasharma/Desktop/order
zip -r server-update.zip server/ -x "server/node_modules/*" "server/data/*" "server/logs/*" "server/tests/*" "server/.env"
scp server-update.zip root@195.35.4:/tmp/

# On server
cd /root/vishnuhastkalakendra
rm -rf server/*
unzip /tmp/server-update.zip -d server/
cd server
npm install
pm2 restart arthaus
```

### Frontend Updates
```bash
# On local machine
cd /Users/adityasharma/Desktop/order/client
npm run build
tar -czf /tmp/arthaus-dist.tar.gz -C dist .
scp -i ~/.ssh/id_ed25519 /tmp/arthaus-dist.tar.gz aditya@195.35.45.17:/tmp/

# On server
rm -rf /var/www/vishnuhastkalakendra/*
tar -xzf /tmp/arthaus-dist.tar.gz -C /var/www/vishnuhastkalakendra/
chown -R www-data:www-data /var/www/vishnuhastkalakendra
```

### Database Updates
```bash
# Backup current database
cp /root/vishnuhastkalakendra/server/data/arthaus.db /root/arthaus-backup-$(date +%Y%m%d).db

# Upload new database
scp -i ~/.ssh/id_ed25519 arthaus.db aditya@195.35.45.17:/tmp/
ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17 "sudo -i"
cp /tmp/arthaus.db /root/vishnuhastkalakendra/server/data/arthaus.db
pm2 restart arthaus
```

## 🚀 Quick Deployment Checklist

### Initial Deployment
```bash
# 1. Create and upload server zip
cd /Users/adityasharma/Desktop/order
zip -r server-upload-with-env.zip server/ -x "server/node_modules/*" "server/data/*" "server/logs/*" "server/tests/*"
scp -i ~/.ssh/id_ed25519 server-upload-with-env.zip aditya@195.35.45.17:/tmp/

# 2. Server setup (on server)
ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17
sudo -i
mkdir -p /root/vishnuhastkalakendra
mv /tmp/server-upload-with-env.zip /root/vishnuhastkalakendra/
cd /root/vishnuhastkalakendra
unzip server-upload-with-env.zip
rm server-upload-with-env.zip
cd server
npm install
mkdir -p data logs
node -e "require('./src/database/init.js')"
node scripts/createAdmin.js
pm2 start src/app.js --name arthaus
pm2 save

# 3. Frontend build and deploy
cd /Users/adityasharma/Desktop/order/client
npm run build
tar -czf /tmp/arthaus-dist.tar.gz -C dist .
scp -i ~/.ssh/id_ed25519 /tmp/arthaus-dist.tar.gz aditya@195.35.45.17:/tmp/

# 4. On server
mkdir -p /var/www/vishnuhastkalakendra
rm -rf /var/www/vishnuhastkalakendra/*
tar -xzf /tmp/arthaus-dist.tar.gz -C /var/www/vishnuhastkalakendra/
chown -R www-data:www-data /var/www/vishnuhastkalakendra

# 5. Configure Nginx and SSL
nano /etc/nginx/sites-available/vishnuhastkalakendra
ln -s /etc/nginx/sites-available/vishnuhastkalakendra /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
certbot --nginx -d vishnuhastkalakendra.com -d www.vishnuhastkalakendra.com
```

### Quick Backend Update
```bash
# Local
cd /Users/adityasharma/Desktop/order
zip -r server-update.zip server/ -x "server/node_modules/*" "server/data/*" "server/logs/*" "server/tests/*"
scp -i ~/.ssh/id_ed25519 server-update.zip aditya@195.35.45.17:/tmp/

# Server
ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17
sudo -i
cd /root/vishnuhastkalakendra && rm -rf server/* && unzip /tmp/server-update.zip -d server/
cd server && npm install && pm2 restart arthaus
```

### Quick Frontend Update
```bash
# Local
cd /Users/adityasharma/Desktop/order/client
npm run build
tar -czf /tmp/arthaus-dist.tar.gz -C dist .
scp -i ~/.ssh/id_ed25519 /tmp/arthaus-dist.tar.gz aditya@195.35.45.17:/tmp/

# Server
rm -rf /var/www/vishnuhastkalakendra/* && tar -xzf /tmp/arthaus-dist.tar.gz -C /var/www/vishnuhastkalakendra/ && chown -R www-data:www-data /var/www/vishnuhastkalakendra
```

## 🏢 Multi-Tenant Setup

### Creating a New Restaurant
```bash
# SSH into server
ssh root@195.35.4

# Run restaurant creation script
cd /root/vishnuhastkalakendra/server
node scripts/createRestaurant.js

# Follow prompts to enter:
# - Restaurant name
# - Subdomain (e.g., arthaus)
# - Admin email
# - Admin password
```

### DNS Configuration for Subdomains
For each restaurant, create a CNAME record:
```
arthaus.vishnuhastkalakendra.com → vishnuhastkalakendra.com
```

Or an A record:
```
arthaus.vishnuhastkalakendra.com → 195.35.4
```

## 👥 Current Credentials

### Super Admin
- **Email:** superadmin@arthaus.com
- **Password:** Admin@123
- **URL:** https://vishnuhastkalakendra.com/login
- **Dashboard:** /super-admin

### Restaurant Admins

#### Bhedaghat Cafe (ArtHaus)
- **Email:** admin@arthaus.com
- **Password:** Admin@123
- **URL:** https://vishnuhastkalakendra.com/login?restaurant=arthaus
- **Dashboard:** /admin

#### Hotel Adarsh
- **Email:** admin@adarsh.com
- **Password:** Admin@123
- **URL:** https://vishnuhastkalakendra.com/login?restaurant=adarsh
- **Dashboard:** /admin

**⚠️ IMPORTANT:** Change these passwords after first login!

---

**Last Updated:** April 28, 2026  
**Version:** 1.0  
**Status:** Production Ready  
**SSL Valid Until:** July 27, 2026
