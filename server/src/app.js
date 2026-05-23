const express = require('express');
const cors = require('cors');
const path = require('path');

const rateLimit = require('express-rate-limit');
const traceIdMiddleware = require('./middlewares/traceId');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Apply Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Quá nhiều request, vui lòng thử lại sau.' }
});

app.use(cors());
app.use(express.json());
app.use(traceIdMiddleware);

// Serve static dashboard assets from public
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// Health Check API
app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'up',
    uptime: process.uptime(),
    memoryUsage: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    },
    timestamp: new Date().toISOString()
  });
});

// We will mount modular routers here shortly
const apiRouter = require('../routes/api');
const commRouter = require('../routes/communication');
app.use('/api', apiLimiter, apiRouter);
app.use('/api/comm', apiLimiter, commRouter);

// Fallback to legacy index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
