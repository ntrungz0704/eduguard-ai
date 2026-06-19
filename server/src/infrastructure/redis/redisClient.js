const Redis = require('ioredis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

redisClient.on('error', (err) => {
  console.error('[Redis] Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected to Redis successfully');
});

module.exports = redisClient;
