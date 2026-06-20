const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

if (fs.existsSync(schemaPath)) {
  let content = fs.readFileSync(schemaPath, 'utf8');
  content = content.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, content, 'utf8');
  console.log('✅ Switched database provider to PostgreSQL in schema.prisma');
  
  try {
    console.log('📦 Regenerating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('🚀 Ready for production deployment using PostgreSQL.');
  } catch (err) {
    console.error('❌ Failed to regenerate Prisma client:', err.message);
  }
} else {
  console.error('❌ schema.prisma not found.');
}
