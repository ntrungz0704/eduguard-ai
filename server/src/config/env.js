const { cleanEnv, str, port } = require('envalid');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const env = cleanEnv(process.env, {
  PORT: port({ default: 3000 }),
  JWT_SECRET: str({ desc: 'Secret string for signing JWT tokens' }),
  DATABASE_URL: str({ desc: 'Connection string for Prisma DB (SQLite file:./dev.db or PostgreSQL URL)' }),
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' })
});

module.exports = env;
