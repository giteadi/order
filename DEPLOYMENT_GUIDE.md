# Vishnu Hastkala Kendra - Complete Deployment Guide

## 📋 Overview
Multi-restaurant ordering system deployed at `vishnuhastkalakendra.com`

---

## 🖥️ Server Information

| Item | Value |
|------|-------|
| Domain | `vishnuhastkalakendra.com` |
| IP Address | `195.35.45.17` |
| SSH User | `aditya` |
| SSH Key | `~/.ssh/id_ed25519` |
| SSH Passphrase | `1234` |
| Sudo Password | `RuhiRiya@12345` |
| OS | Ubuntu 24.04 LTS |
| Web Server | Nginx 1.24.0 |
| Process Manager | PM2 (process name: `arthaus`) |
| Backend Port | `4002` |
| Database | SQLite — `/root/vishnuhastkalakendra/server/data/arthaus.db` |
| Node.js | 18.20.8 |
| SSL | Let's Encrypt (expires July 27, 2026) |

---

## 📁 Server Folder Structure

```
/root/vishnuhastkalakendra/
├── server/
│   ├── src/
│   │   ├── app.js                  # Entry point (PORT 4002)
│   │   ├── controllers/            # API controllers
│   │   ├── middleware/             # Auth, tenant, subscription
│   │   ├── models/                 # DB models
│   │   ├── routes/                 # API routes
│   │   └── utils/
│   ├── data/
│   │   └── arthaus.db              # SQLite database
│   ├── logs/
│   ├── scripts/
│   └── .env                        # Server environment variables

/var/www/vishnuhastkalakendra/      # Frontend build (served by Nginx)
```

---

## 🔑 SSH Access

```bash
# Connect to server
ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17
# Passphrase: 1234

# Switch to root (required for file operations)
sudo -i
# Password: RuhiRiya@12345
```

---

## 📤 Uploading Single Files (Most Common)

Use this pattern to upload any single backend file:

```bash
# STEP 1 — Upload from local Mac to server /tmp/
scp -i ~/.ssh/id_ed25519 /Users/adityasharma/Desktop/order/server/src/controllers/FILENAME.js aditya@195.35.45.17:/tmp/FILENAME.js
# Enter passphrase: 1234

# STEP 2 — SSH into server
ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17
# Passphrase: 1234

# STEP 3 — Switch to root
sudo -i
# Password: RuhiRiya@12345

# STEP 4 — Copy from /tmp/ to correct location
cp /tmp/FILENAME.js /root/vishnuhastkalakendra/server/src/controllers/FILENAME.js

# STEP 5 — Restart backend
pm2 restart arthaus

# STEP 6 — Check logs
pm2 logs arthaus --lines 10
```

### Common File Paths (Local → Server)

| File | Local Path | Server Path |
|------|-----------|-------------|
| Any controller | `server/src/controllers/X.js` | `/root/vishnuhastkalakendra/server/src/controllers/X.js` |
| Any model | `server/src/models/X.js` | `/root/vishnuhastkalakendra/server/src/models/X.js` |
| Any middleware | `server/src/middleware/X.js` | `/root/vishnuhastkalakendra/server/src/middleware/X.js` |
| Any route | `server/src/routes/X.js` | `/root/vishnuhastkalakendra/server/src/routes/X.js` |

---

## 🚀 Frontend Build & Deploy

Run all commands from your Mac:

```bash
# STEP 1 — Build frontend
cd /Users/adityasharma/Desktop/order/client
npm run build

# STEP 2 — Create archive
tar -czf /tmp/arthaus-dist.tar.gz -C dist .

# STEP 3 — Upload to server
scp -i ~/.ssh/id_ed25519 /tmp/arthaus-dist.tar.gz aditya@195.35.45.17:/tmp/
# Passphrase: 1234
```

Then on server:

```bash
ssh -i ~/.ssh/id_ed25519 aditya@195.35.45.17
# Passphrase: 1234

sudo -i
# Password: RuhiRiya@12345

rm -rf /var/www/vishnuhastkalakendra/*
tar -xzf /tmp/arthaus-dist.tar.gz -C /var/www/vishnuhastkalakendra/
chown -R www-data:www-data /var/www/vishnuhastkalakendra
```

---

## 🔄 Quick Update Cheatsheet

### Update a single backend file

```bash
# Local Mac — upload file
scp -i ~/.ssh/id_ed25519 /Users/adityasharma/Desktop/order/server/src/controllers/order.controller.js aditya@195.35.45.17:/tmp/order.controller.js

# Server — copy and restart
sudo -i
cp /tmp/order.controller.js /root/vishnuhastkalakendra/server/src/controllers/order.controller.js
pm2 restart arthaus
pm2 logs arthaus --lines 5
```

### Update multiple backend files

```bash
# Local Mac — upload each file separately
scp -i ~/.ssh/id_ed25519 /Users/adityasharma/Desktop/order/server/src/controllers/product.controller.js aditya@195.35.45.17:/tmp/product.controller.js
scp -i ~/.ssh/id_ed25519 /Users/adityasharma/Desktop/order/server/src/models/product.model.js aditya@195.35.45.17:/tmp/product.model.js

# Server — copy all and restart once
sudo -i
cp /tmp/product.controller.js /root/vishnuhastkalakendra/server/src/controllers/product.controller.js
cp /tmp/product.model.js /root/vishnuhastkalakendra/server/src/models/product.model.js
pm2 restart arthaus
pm2 logs arthaus --lines 5
```

### Update frontend only

```bash
# Local Mac
cd /Users/adityasharma/Desktop/order/client
npm run build
tar -czf /tmp/arthaus-dist.tar.gz -C dist .
scp -i ~/.ssh/id_ed25519 /tmp/arthaus-dist.tar.gz aditya@195.35.45.17:/tmp/

# Server
sudo -i
rm -rf /var/www/vishnuhastkalakendra/*
tar -xzf /tmp/arthaus-dist.tar.gz -C /var/www/vishnuhastkalakendra/
chown -R www-data:www-data /var/www/vishnuhastkalakendra
```

### Update both backend + frontend

```bash
# Local Mac — upload backend files
scp -i ~/.ssh/id_ed25519 /Users/adityasharma/Desktop/order/server/src/controllers/FILENAME.js aditya@195.35.45.17:/tmp/FILENAME.js

# Local Mac — build and upload frontend
cd /Users/adityasharma/Desktop/order/client
npm run build
tar -czf /tmp/arthaus-dist.tar.gz -C dist .
scp -i ~/.ssh/id_ed25519 /tmp/arthaus-dist.tar.gz aditya@195.35.45.17:/tmp/

# Server — deploy everything
sudo -i
cp /tmp/FILENAME.js /root/vishnuhastkalakendra/server/src/controllers/FILENAME.js
pm2 restart arthaus
rm -rf /var/www/vishnuhastkalakendra/*
tar -xzf /tmp/arthaus-dist.tar.gz -C /var/www/vishnuhastkalakendra/
chown -R www-data:www-data /var/www/vishnuhastkalakendra
pm2 logs arthaus --lines 5
```

---

## 🗄️ Database Operations

```bash
# Connect to database (on server as root)
sqlite3 /root/vishnuhastkalakendra/server/data/arthaus.db

# Run a single SQL command
sqlite3 /root/vishnuhastkalakendra/server/data/arthaus.db "SELECT * FROM restaurants;"

# Backup database
cp /root/vishnuhastkalakendra/server/data/arthaus.db /root/arthaus-backup-$(date +%Y%m%d).db

# Upload local database to server
scp -i ~/.ssh/id_ed25519 /Users/adityasharma/Desktop/order/server/data/arthaus.db aditya@195.35.45.17:/tmp/arthaus.db
# Then on server:
sudo -i
cp /tmp/arthaus.db /root/vishnuhastkalakendra/server/data/arthaus.db
pm2 restart arthaus
```

---

## 🛠️ Server Management

```bash
# PM2 commands (run as root on server)
pm2 status                    # Check all processes
pm2 restart arthaus           # Restart backend
pm2 logs arthaus --lines 20   # View recent logs
pm2 logs arthaus --lines 5    # Quick log check

# Nginx commands
nginx -t                      # Test config
systemctl reload nginx        # Reload nginx

# Health check
curl http://localhost:4002/api/v1/health
curl -I https://vishnuhastkalakendra.com
```

---

## 🏢 Restaurant Management

### Current Restaurants

| ID | Name | Subdomain | Admin Email |
|----|------|-----------|-------------|
| 1 | Vishnu Hastkala Kendra | vishnuhastkalakendra | superadmin@arthaus.com |
| 2 | Hotel Adarsh | adarsh | admin@adarsh.com |
| 3 | Hotal River View | riverview | — |
| 4 | Hotel Osho | osho | — |

### Restaurant URLs
```
https://vishnuhastkalakendra.com/?restaurant=adarsh
https://vishnuhastkalakendra.com/?restaurant=riverview
https://vishnuhastkalakendra.com/?restaurant=osho
```

### Admin Login URLs
```
https://vishnuhastkalakendra.com/login?restaurant=adarsh
https://vishnuhastkalakendra.com/login?restaurant=riverview
```

---

## 👥 Current Credentials

### Super Admin
- **Email:** `superadmin@arthaus.com`
- **Password:** `Admin@123`
- **URL:** `https://vishnuhastkalakendra.com/login`
- **Dashboard:** `/super-admin`

### Hotel Adarsh Admin
- **Email:** `admin@adarsh.com`
- **Password:** `Admin@123`
- **URL:** `https://vishnuhastkalakendra.com/login?restaurant=adarsh`
- **Dashboard:** `/admin`

---

## 🔧 Nginx Configuration

Config file: `/etc/nginx/sites-available/vishnuhastkalakendra.com`

```nginx
server {
    listen 443 ssl http2;
    server_name vishnuhastkalakendra.com www.vishnuhastkalakendra.com;

    ssl_certificate /etc/letsencrypt/live/vishnuhastkalakendra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vishnuhastkalakendra.com/privkey.pem;

    root /var/www/vishnuhastkalakendra;
    index index.html;

    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:4002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🚨 Troubleshooting

### Backend not responding
```bash
pm2 logs arthaus --lines 20
pm2 restart arthaus
curl http://localhost:4002/api/v1/health
```

### Frontend showing old version
```bash
# Hard refresh browser: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
# Or redeploy frontend
```

### 502 Bad Gateway
```bash
# Backend crashed — check logs
pm2 logs arthaus --lines 30
pm2 restart arthaus
```

### Database issues
```bash
ls -la /root/vishnuhastkalakendra/server/data/
chmod 644 /root/vishnuhastkalakendra/server/data/arthaus.db
pm2 restart arthaus
```

---

**Last Updated:** May 2026
**Version:** 2.0
**Status:** Production Ready
**SSL Valid Until:** July 27, 2026
