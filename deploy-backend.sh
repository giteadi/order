#!/bin/bash
# Backend Deployment Script - Copy modified files to deploy folder

echo "🚀 Creating backend deployment package..."

# Create deploy directory
mkdir -p deploy/server/src/controllers
mkdir -p deploy/server/src/routes
mkdir -p deploy/server/src/middleware
mkdir -p deploy/server/src/models
mkdir -p deploy/server/src/database
mkdir -p deploy/server/src/config
mkdir -p deploy/server/src/utils
mkdir -p deploy/server/src/cron
mkdir -p deploy/server/scripts
mkdir -p deploy/server/data
mkdir -p deploy/server/logs

# Copy modified files (with debug logs)
echo "📁 Copying modified files..."

# Controllers
cp server/src/controllers/product.controller.js deploy/server/src/controllers/

# Routes
cp server/src/routes/product.routes.js deploy/server/src/routes/
cp server/src/routes/index.js deploy/server/src/routes/

# Middleware
cp server/src/middleware/tenant.js deploy/server/src/middleware/
cp server/src/middleware/auth.js deploy/server/src/middleware/

# Main app and config
cp server/src/app.js deploy/server/src/
cp server/package.json deploy/server/

# Copy essential unchanged files
cp server/src/controllers/*.js deploy/server/src/controllers/ 2>/dev/null || true
cp server/src/models/*.js deploy/server/src/models/ 2>/dev/null || true
cp server/src/database/*.js deploy/server/src/database/ 2>/dev/null || true
cp server/src/config/*.js deploy/server/src/config/ 2>/dev/null || true
cp server/src/utils/*.js deploy/server/src/utils/ 2>/dev/null || true
cp server/src/cron/*.js deploy/server/src/cron/ 2>/dev/null || true
cp server/scripts/*.js deploy/server/scripts/ 2>/dev/null || true

# Copy .env if exists
if [ -f server/.env ]; then
    cp server/.env deploy/server/
fi

echo "📦 Creating zip archive..."
cd deploy
zip -r ../server-deploy-$(date +%Y%m%d-%H%M).zip server/ -x "server/node_modules/*" "server/data/*" "server/logs/*"
cd ..

echo "✅ Deployment package created: server-deploy-$(date +%Y%m%d-%H%M).zip"
echo ""
echo "📝 Next steps:"
echo "1. Upload to server: scp -i ~/.ssh/id_ed25519 server-deploy-*.zip aditya@195.35.45.17:/tmp/"
echo "2. SSH into server and deploy"
