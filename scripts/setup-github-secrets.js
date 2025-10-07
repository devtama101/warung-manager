#!/usr/bin/env node

/**
 * Setup script for GitHub repository secrets
 * Run this script to get the commands for setting up GitHub secrets
 */

const crypto = require('crypto');
const { readFileSync } = require('fs');
const { execSync } = require('child_process');

// Generate SSH key pair for GitHub Actions
function generateSSHKeyPair() {
  const keyPair = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey
  };
}

// Generate JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

function main() {
  console.log('🔐 Setting up GitHub Repository Secrets for Warung Manager\n');

  // Get repository information
  let repoInfo = {};
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    const match = remoteUrl.match(/github\.com[\/:]([^\/]+)\/([^\/.]+)(\.git)?$/);
    if (match) {
      repoInfo = {
        owner: match[1],
        repo: match[2]
      };
    }
  } catch (error) {
    console.log('⚠️  Could not determine repository info. Please replace {YOUR_OWNER} and {YOUR_REPO} with actual values.\n');
    repoInfo = { owner: '{YOUR_OWNER}', repo: '{YOUR_REPO}' };
  }

  // Generate secrets
  const sshKeyPair = generateSSHKeyPair();
  const jwtSecret = generateJWTSecret();

  console.log('📝 Copy these commands to set up your GitHub repository secrets:\n');

  console.log('1️⃣  First, install GitHub CLI (gh) if you haven\'t already:');
  console.log('   brew install gh  # macOS');
  console.log('   winget install GitHub.cli  # Windows');
  console.log('   sudo apt install gh  # Ubuntu\n');

  console.log('2️⃣  Login to GitHub:');
  console.log('   gh auth login\n');

  console.log('3️⃣  Run these commands to set up the secrets:\n');

  // SSH Private Key
  console.log('   # SSH Private Key');
  console.log(`   gh secret set SSH_PRIVATE_KEY --repo=${repoInfo.owner}/${repoInfo.repo} --body='${sshKeyPair.privateKey}'`);
  console.log();

  // SSH Host
  console.log('   # SSH Host');
  console.log(`   gh secret set SSH_HOST --repo=${repoInfo.owner}/${repoInfo.repo} --body='103.59.94.185'`);
  console.log();

  // SSH User
  console.log('   # SSH User');
  console.log(`   gh secret set SSH_USER --repo=${repoInfo.owner}/${repoInfo.repo} --body='tamatopik'`);
  console.log();

  // JWT Secret
  console.log('   # JWT Secret');
  console.log(`   gh secret set JWT_SECRET --repo=${repoInfo.owner}/${repoInfo.repo} --body='${jwtSecret}'`);
  console.log();

  console.log('4️⃣  Add the SSH public key to your server:');
  console.log(`   SSH into your server and add this public key to ~/.ssh/authorized_keys:`);
  console.log();
  console.log('   -----BEGIN PUBLIC KEY-----');
  console.log(sshKeyPair.publicKey.trim());
  console.log('   -----END PUBLIC KEY-----');
  console.log();

  console.log('   Or run this command on your server:');
  console.log(`   echo "${sshKeyPair.publicKey.trim()}" >> ~/.ssh/authorized_keys`);
  console.log();

  console.log('5️⃣  Update your server environment file:');
  console.log('   SSH into your server and update ~/warung-manager/backend/.production.env:');
  console.log(`   JWT_SECRET=${jwtSecret}`);
  console.log();

  console.log('6️⃣  Push to trigger the first deployment:');
  console.log('   git add .');
  console.log('   git commit -m "Setup CI/CD pipeline"');
  console.log('   git push origin main');
  console.log();

  console.log('🎉 After completing these steps, your repository will be set up for automatic deployment!');
  console.log('   Each push to main will trigger a new deployment to https://webartisan.id/products/warung-manager');
}

main();