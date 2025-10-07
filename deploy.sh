#!/bin/bash
# One-click deployment script for Warung Manager
# Run this on your server: curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/warung-manager/main/deploy.sh | bash

set -e

echo "🚀 Starting Warung Manager Deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
print_status "Installing required packages..."
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib build-essential

# Install Node.js 20
print_status "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
print_status "Installing PM2..."
sudo npm install -g pm2

# Configure PostgreSQL
print_status "Setting up PostgreSQL 17..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Database setup
print_status "Creating database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS warung_pos;" || true
sudo -u postgres psql -c "CREATE DATABASE warung_pos;"
sudo -u postgres psql -c "DROP USER IF EXISTS warung_user;" || true
sudo -u postgres psql -c "CREATE USER warung_user WITH PASSWORD 'warung_secure_password_2024!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE warung_pos TO warung_user;"
sudo -u postgres psql -c "ALTER USER warung_user CREATEDB;"

# Create deployment directory
print_status "Creating deployment directory..."
mkdir -p ~/warung-manager/{backend,frontend,database,logs}
cd ~/warung-manager

# Clone repository
print_status "Downloading application code..."
git clone https://github.com/YOUR_USERNAME/warung-manager.git temp-repo
cp -r temp-repo/* .
cp -r temp-repo/.github . 2>/dev/null || true
rm -rf temp-repo

# Build frontend
print_status "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Build backend
print_status "Building backend..."
cd backend
npm ci
npm run build
cd ..

# Create environment file
print_status "Setting up environment..."
cat > backend/.production.env << ENVEOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://warung_user:warung_secure_password_2024!@localhost:5432/warung_pos
JWT_SECRET=warung_jwt_super_secret_key_2024_secure_random_string
CORS_ORIGIN=https://webartisan.id
ENVEOF

# Install backend dependencies
cd backend
npm ci --omit=dev

# Run database migrations and seed
print_status "Setting up database schema..."
npm run db:push || npx drizzle-kit push

# Create admin and employee users
print_status "Creating users..."
node -e "
const bcrypt = require('bcrypt');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { users, employees } = require('./src/db/schema.js');

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

async function seedUsers() {
  console.log('🌱 Creating admin and employee users...');

  // Create Owner/Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const [owner] = await db.insert(users).values({
    email: 'admin@warung.com',
    password: hashedPassword,
    role: 'admin',
    businessName: 'Warung Maju Jaya',
    businessAddress: 'Jakarta, Indonesia'
  }).returning();

  console.log('✅ Created admin:', { email: owner.email, businessName: owner.businessName });

  // Create Employee
  const empPassword = await bcrypt.hash('employee123', 10);
  const [employee] = await db.insert(employees).values({
    userId: owner.id,
    email: 'employee@warung.com',
    password: empPassword,
    name: 'Test Employee',
    deviceId: 'emp_device_001',
    deviceName: 'Kasir Device 1',
    isActive: true
  }).returning();

  console.log('✅ Created employee:', { email: employee.email, name: employee.name });
  console.log('');
  console.log('🎉 Users created successfully!');
  console.log('📝 Login Credentials:');
  console.log('👨‍💼 Admin Login: admin@warung.com / admin123');
  console.log('👤 Employee Login: employee@warung.com / employee123');
  await client.end();
}

seedUsers().catch(console.error);
"

cd ..

# Create PM2 ecosystem file
print_status "Setting up PM2 configuration..."
cat > ecosystem.config.js << ECOEOF
module.exports = {
  apps: [{
    name: 'warung-manager-api',
    script: './backend/dist/index.js',
    cwd: '/home/tamatopik/warung-manager',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: './backend/.production.env',
    error_file: './logs/api-error.log',
    out_file: './logs/api-out.log',
    log_file: './logs/api-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    autorestart: true
  }]
};
ECOEOF

# Start application
print_status "Starting application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup nginx
print_status "Configuring nginx..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo cat > /etc/nginx/sites-available/warung-manager << NGINXEOF
server {
    listen 80;
    server_name webartisan.id;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend
    location /products/warung-manager {
        alias /home/tamatopik/warung-manager/frontend/dist;
        try_files \$uri \$uri/ /products/warung-manager/index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location = /products/warung-manager/sw.js {
            expires 0;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        add_header Access-Control-Allow-Origin "https://webartisan.id" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;

        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://webartisan.id";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        expires 1m;
    }

    error_page 404 /products/warung-manager/index.html;
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/warung-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL
print_status "Setting up SSL certificate..."
sudo certbot --nginx -d webartisan.id --non-interactive --agree-tos --email admin@webartisan.id || print_warning "SSL setup failed, you can configure it later"

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create database backup script
print_status "Setting up database backups..."
cat > database/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/tamatopik/warung-manager/database/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -h localhost -U warung_user -d warung_pos > "$BACKUP_DIR/warung_pos_backup_$DATE.sql"
gzip "$BACKUP_DIR/warung_pos_backup_$DATE.sql"
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
echo "Backup completed: $BACKUP_DIR/warung_pos_backup_$DATE.sql.gz"
EOF
chmod +x database/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /home/tamatopik/warung-manager/database/backup.sh") | crontab -

# Test deployment
print_status "Testing deployment..."
sleep 5
curl -s http://localhost:3001/health > /dev/null && echo "✅ Backend is running!" || echo "❌ Backend health check failed"
curl -s http://localhost/products/warung-manager > /dev/null && echo "✅ Frontend is accessible!" || echo "❌ Frontend check failed"

print_status ""
print_status "🎉 Deployment completed successfully!"
print_status ""
print_status "🌐 Application URLs:"
print_status "   Frontend: https://webartisan.id/products/warung-manager"
print_status "   API: https://webartisan.id/api"
print_status "   Health: https://webartisan.id/health"
print_status ""
print_status "👤 Login Credentials:"
print_status "   Admin: admin@warung.com / admin123"
print_status "   Employee: employee@warung.com / employee123"
print_status ""
print_status "🔧 Management Commands:"
print_status "   View logs: pm2 logs warung-manager-api"
print_status "   Restart app: pm2 restart warung-manager-api"
print_status "   Database backup: ~/warung-manager/database/backup.sh"
print_status ""
print_status "📂 Deployment Location: ~/warung-manager"
print_status "📋 Configuration: ~/warung-manager/ecosystem.config.js"
print_status ""
print_warning "Note: Save this output for future reference!"