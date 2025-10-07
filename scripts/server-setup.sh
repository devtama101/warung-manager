#!/bin/bash
# Server Setup Script for Warung Manager
# Run this once on your server to prepare it for auto-deployment

set -e

echo "🚀 Setting up Warung Manager Server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Run as your user instead."
    exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib build-essential

# Install Node.js 20
print_status "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2

# Configure PostgreSQL
print_status "Configuring PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
print_status "Creating database and user..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS warung_pos;"
sudo -u postgres psql -c "CREATE DATABASE warung_pos;"
sudo -u postgres psql -c "DROP USER IF EXISTS warung_user;"
sudo -u postgres psql -c "CREATE USER warung_user WITH PASSWORD 'your_secure_db_password_here';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE warung_pos TO warung_user;"
sudo -u postgres psql -c "ALTER USER warung_user CREATEDB;"

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status

# Configure nginx
print_status "Configuring nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Create deployment directory
print_status "Creating deployment directory..."
mkdir -p ~/warung-manager/{backend,frontend,database,logs}
mkdir -p ~/warung-manager/ssl

# Setup SSL with Let's Encrypt (when domain is ready)
print_warning "Note: SSL setup will be done automatically during first deployment"
print_warning "Make sure webartisan.id points to this server IP"

# Add user to www-data group for nginx permissions
sudo usermod -a -G www-data $USER

# Set permissions
sudo chown -R $USER:$USER ~/warung-manager
sudo chmod -R 755 ~/warung-manager

# Create log rotation for PM2
print_status "Setting up log rotation..."
sudo cat > /etc/logrotate.d/warung-manager << EOF
/home/$USER/warung-manager/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload all
    endscript
}
EOF

# Create database backup script
print_status "Creating database backup script..."
cat > ~/warung-manager/database/backup.sh << 'EOF'
#!/bin/bash
# Database backup script

DB_NAME="warung_pos"
DB_USER="warung_user"
BACKUP_DIR="/home/$USER/warung-manager/database/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/warung_pos_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF

chmod +x ~/warung-manager/database/backup.sh

# Setup automatic daily backups
print_status "Setting up automatic daily backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * ~/warung-manager/database/backup.sh") | crontab -

# Create recovery script
print_status "Creating recovery script..."
cat > ~/warung-manager/recovery.sh << 'EOF'
#!/bin/bash
# Recovery script - rollback to previous deployment

BACKUP_DIR="/home/$USER/warung-manager-backup"
DEPLOY_DIR="/home/$USER/warung-manager"

if [ -d "$BACKUP_DIR" ]; then
    echo "Rolling back to previous version..."
    pm2 stop warung-manager-api || true
    rm -rf "$DEPLOY_DIR"
    mv "$BACKUP_DIR" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    pm2 start ecosystem.config.js
    pm2 save
    sudo systemctl reload nginx
    echo "Rollback completed!"
else
    echo "No backup found!"
    exit 1
fi
EOF

chmod +x ~/warung-manager/recovery.sh

print_status "Server setup completed!"
print_status ""
print_status "Next steps:"
print_status "1. Add your SSH key to GitHub repository"
print_status "2. Add the following secrets to your GitHub repository:"
print_status "   - SERVER_HOST: $(curl -s ifconfig.me)"
print_status "   - SERVER_USER: $USER"
print_status "   - SERVER_SSH_KEY: (Your private SSH key)"
print_status "   - DATABASE_URL: postgresql://warung_user:your_secure_db_password_here@localhost:5432/warung_pos"
print_status "   - JWT_SECRET: (Generate a secure random string)"
print_status ""
print_status "3. Make sure webartisan.id points to this server IP: $(curl -s ifconfig.me)"
print_status "4. Push your code to GitHub main branch to trigger deployment"
print_status ""
print_warning "IMPORTANT: Update the database password in DATABASE_URL with your actual password!"