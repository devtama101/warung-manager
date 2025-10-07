#!/usr/bin/env node

/**
 * Deployment verification script
 * Run this script to verify your deployment setup
 */

const { execSync } = require('child_process');
const https = require('https');

function checkService(url, name) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      console.log(`✅ ${name}: ${response.statusCode} (${url})`);
      resolve(true);
    });

    request.on('error', () => {
      console.log(`❌ ${name}: Failed to connect (${url})`);
      resolve(false);
    });

    request.setTimeout(10000, () => {
      console.log(`⏰ ${name}: Timeout (${url})`);
      request.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔍 Verifying Warung Manager Deployment\n');

  // Check GitHub repository
  console.log('📋 Checking GitHub Repository:');
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    console.log(`✅ Repository: ${remoteUrl}`);
    console.log(`✅ Current branch: ${currentBranch}`);
  } catch (error) {
    console.log('❌ Git repository check failed');
  }

  // Check deployment files
  console.log('\n📁 Checking Deployment Files:');
  const requiredFiles = [
    '.github/workflows/deploy.yml',
    'deploy.sh',
    'nginx/warung-manager.conf',
    'scripts/setup-github-secrets.js',
    'backend/seed-users-production.js',
    'DEPLOYMENT_GUIDE.md'
  ];

  requiredFiles.forEach(file => {
    try {
      execSync(`test -f ${file}`, { silent: true });
      console.log(`✅ ${file}`);
    } catch (error) {
      console.log(`❌ ${file} - Missing`);
    }
  });

  // Check environment files
  console.log('\n🔧 Checking Environment Files:');
  try {
    execSync('test -f backend/.env.example', { silent: true });
    console.log('✅ backend/.env.example');
  } catch (error) {
    console.log('❌ backend/.env.example - Missing');
  }

  // Check production build readiness
  console.log('\n🏗️ Checking Build Configuration:');
  try {
    const packageJson = JSON.parse(execSync('cat backend/package.json', { encoding: 'utf8' }));
    const frontendPackageJson = JSON.parse(execSync('cat frontend/package.json', { encoding: 'utf8' }));

    console.log(`✅ Backend: ${packageJson.name} v${packageJson.version}`);
    console.log(`✅ Frontend: ${frontendPackageJson.name} v${frontendPackageJson.version}`);

    if (packageJson.scripts.build) {
      console.log('✅ Backend build script exists');
    } else {
      console.log('❌ Backend build script missing');
    }

    if (frontendPackageJson.scripts.build) {
      console.log('✅ Frontend build script exists');
    } else {
      console.log('❌ Frontend build script missing');
    }
  } catch (error) {
    console.log('❌ Package.json check failed');
  }

  // Check database schema
  console.log('\n🗄️ Checking Database Schema:');
  try {
    execSync('test -f backend/src/db/schema.ts', { silent: true });
    console.log('✅ Database schema file exists');
  } catch (error) {
    console.log('❌ Database schema file missing');
  }

  // Production service checks (if deployed)
  console.log('\n🌐 Checking Production Services:');
  await checkService('https://webartisan.id/health', 'Health Check');
  await checkService('https://webartisan.id/api/auth/me', 'API Endpoint');
  await checkService('https://webartisan.id/products/warung-manager', 'Frontend Application');

  console.log('\n📝 Next Steps:');
  console.log('1. If you haven\'t deployed yet, run: ./deploy.sh on your server');
  console.log('2. Or follow the manual setup in DEPLOYMENT_GUIDE.md');
  console.log('3. Set up GitHub secrets: node scripts/setup-github-secrets.js');
  console.log('4. Push to trigger deployment: git push origin main');
  console.log('5. Test login with credentials from deployment guide');

  console.log('\n🎉 Verification complete!');
}

main().catch(console.error);