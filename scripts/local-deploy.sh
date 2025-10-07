#!/bin/bash
# Local deployment script for testing
# Use this to test deployment locally before pushing to GitHub

set -e

echo "🚀 Local deployment for Warung Manager..."

# Configuration
SERVER_HOST="${SERVER_HOST:-103.59.94.185}"
SERVER_USER="${SERVER_USER:-tamatopik}"
DEPLOY_DIR="/home/$SERVER_USER/warung-manager"

# Build frontend
echo "🏗️ Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Build backend
echo "🏗️ Building backend..."
cd backend
npm ci
npm run build
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deploy-package
cp -r backend/dist deploy-package/
cp -r backend/package.json deploy-package/
cp -r frontend/dist deploy-package/frontend/

# Deploy to server
echo "🚀 Deploying to server..."
rsync -avz --delete deploy-package/ $SERVER_USER@$SERVER_HOST:$DEPLOY_DIR/

# Start application on server
echo "🔄 Starting application..."
ssh $SERVER_USER@$SERVER_HOST << EOF
cd $DEPLOY_DIR
npm install --omit=dev
pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
pm2 save
sudo systemctl reload nginx
EOF

echo "✅ Local deployment completed!"
echo "🌐 App available at: https://webartisan.id/products/warung-manager"

# Clean up
rm -rf deploy-package