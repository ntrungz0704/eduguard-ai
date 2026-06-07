#!/usr/bin/env node
/**
 * EduGuard AI — Cross-platform Setup Script
 * Works on Windows (PowerShell), macOS, and Linux.
 *
 * Usage: node scripts/setup.js
 * Or via: npm run setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

function run(cmd, opts = {}) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║         EduGuard AI — First-Time Setup                ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

// Step 1: Copy .env.example → .env if not exists
const envPath = path.join(ROOT, '.env');
const envExamplePath = path.join(ROOT, '.env.example');
if (!fs.existsSync(envPath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env from .env.example');
  console.log('   ⚠️  Please review .env and update API keys if needed.\n');
} else {
  console.log('ℹ️  .env already exists — skipping copy.\n');
}

// Step 2: Install client dependencies
console.log('📦 Installing client dependencies...');
run('npm install --legacy-peer-deps', { cwd: path.join(ROOT, 'client') });

// Step 3: Initialize database (generate Prisma client + push schema + seed)
console.log('\n🗄️  Initializing database...');
run('npx prisma generate');
run('npx prisma db push');
run('node prisma/seed.js');

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║  ✅ Setup complete!                                    ║');
console.log('║                                                       ║');
console.log('║  Next steps:                                          ║');
console.log('║    npm run boot:full   ← First run (trains AI)       ║');
console.log('║    npm run boot        ← Subsequent runs (fast)      ║');
console.log('║                                                       ║');
console.log('║  Then open: http://localhost:5173                     ║');
console.log('║  Login:     admin / admin123                          ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');
