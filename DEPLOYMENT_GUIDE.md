# Warung Manager Deployment Guide

This guide provides step-by-step instructions for setting up automatic deployment from GitHub to your production server.

## Prerequisites

- Ubuntu/Debian server with sudo access
- GitHub repository with Warung Manager code
- Domain already configured (webartisan.id)

## Quick Setup (Recommended)

### Option 1: One-Click Server Setup

Run this on your server to set up everything automatically:

```bash
curl -sSL https://raw.githubusercontent.com/devtama101/warung-manager/main/deploy.sh | bash
```

This script will:
- Install PostgreSQL 17, Node.js 20, Nginx, PM2
- Configure database and create users
- Deploy the application
- Set up SSL certificate
- Configure firewall

### Option 2: GitHub Actions CI/CD Setup

#### Step 1: Install GitHub CLI
```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows
winget install GitHub.cli
```

#### Step 2: Login to GitHub
```bash
gh auth login
```

#### Step 3: Set Up Repository Secrets

Run the setup script to generate and configure secrets:
```bash
node scripts/setup-github-secrets.js
```

Follow the commands printed by the script to set up:
- `SSH_PRIVATE_KEY` - Private key for server access
- `SSH_HOST` - Server IP (103.59.94.185)
- `SSH_USER` - Server username (tamatopik)
- `JWT_SECRET` - JWT signing secret

#### Step 4: Manual Server Setup

If you prefer manual setup instead of the one-click script:

1. **Install Dependencies**
```bash
sudo apt update
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib build-essential

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
```

2. **Configure PostgreSQL**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql -c "CREATE DATABASE warung_pos;"
sudo -u postgres psql -c "CREATE USER warung_user WITH PASSWORD 'warung_secure_password_2024!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE warung_pos TO warung_user;"
sudo -u postgres psql -c "ALTER USER warung_user CREATEDB;"
```

3. **Create Deployment Directory**
```bash
mkdir -p ~/warung-manager
cd ~/warung-manager
```

4. **Clone Repository**
```bash
git clone https://github.com/devtama101/warung-manager.git .
```

5. **Build and Deploy**
```bash
# Build frontend
cd frontend
npm ci
npm run build
cd ..

# Build backend
cd backend
npm ci
npm run build
cd ..

# Create environment file
cat > backend/.production.env << ENVEOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://warung_user:warung_secure_password_2024!@localhost:5432/warung_pos
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=https://webartisan.id
ENVEOF

# Install production dependencies
cd backend
npm ci --omit=dev

# Run database migrations
npm run db:push

# Seed users
node seed-users-production.js
cd ..
```

6. **Set Up PM2**
```bash
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

mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

7. **Configure Nginx**
```bash
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
```

8. **Setup SSL Certificate**
```bash
sudo certbot --nginx -d webartisan.id --non-interactive --agree-tos --email admin@webartisan.id
```

9. **Configure Firewall**
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Application Access

After deployment, your application will be available at:

- **Frontend**: https://webartisan.id/products/warung-manager
- **API**: https://webartisan.id/api
- **Health Check**: https://webartisan.id/health

## Default Login Credentials

- **Admin Login**: admin@warung.com / admin123
- **Employee Login**: employee@warung.com / employee123

## Management Commands

```bash
# View application logs
pm2 logs warung-manager-api

# Restart application
pm2 restart warung-manager-api

# Database backup
~/warung-manager/database/backup.sh

# Update application
git pull origin main
cd backend && npm ci && npm run build && cd ../frontend && npm ci && npm run build && cd ..
pm2 restart warung-manager-api
```

## CI/CD Workflow

Once GitHub secrets are configured, the deployment process is automatic:

1. Push to `main` branch
2. GitHub Actions runs tests and builds
3. Application is deployed to production server
4. Health checks verify deployment success

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify connection string in `.production.env`
   - Ensure database and user exist

2. **Nginx Configuration Error**
   - Test configuration: `sudo nginx -t`
   - Check logs: `sudo tail -f /var/log/nginx/error.log`

3. **Application Not Starting**
   - Check PM2 logs: `pm2 logs warung-manager-api`
   - Verify environment variables
   - Ensure all dependencies are installed

4. **SSL Certificate Issues**
   - Check certbot status: `sudo certbot certificates`
   - Renew certificate: `sudo certbot renew`

### Health Check Endpoints

- **Application Health**: https://webartisan.id/health
- **PM2 Status**: `pm2 status`
- **Database Connection**: Test via admin login

## Support

For deployment issues:
1. Check logs: `pm2 logs warung-manager-api`
2. Verify all prerequisites are met
3. Ensure GitHub secrets are correctly configured
4. Test manually using the one-click deployment script

## Security Notes

- Change default passwords after first login
- Regularly update dependencies: `npm audit fix`
- Monitor logs for suspicious activity
- Keep SSL certificates renewed
- Use strong database passwords