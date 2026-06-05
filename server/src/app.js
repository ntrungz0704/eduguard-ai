const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const rateLimit = require('express-rate-limit');
const traceIdMiddleware = require('./middlewares/tracing');
const errorHandler = require('./middlewares/errors');
const syllabusLoader = require('./modules/data/syllabusLoader');

const app = express();

// Initialize Syllabus Data
syllabusLoader.init();

// Apply Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased for demo to avoid blocking
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Quá nhiều request, vui lòng thử lại sau.' }
});

// Security Headers (sets 11 HTTP security headers automatically)
app.use(helmet());

// Strict CORS — only allow configured frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-id', 'x-trace-id'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(traceIdMiddleware);

// Serve static dashboard assets from client/dist
app.use(express.static(path.join(__dirname, '..', '..', 'client', 'dist')));

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
const apiRouter = require('./modules/api');
const commRouter = require('./modules/communication');
const predictionRouter = require('./modules/prediction/routes');
const authRouter = require('./modules/auth/routes');
const studentsRouter = require('./modules/students/routes');
const graphRouter = require('./modules/graph/routes');
const dataImportRouter = require('./modules/data/import.routes');

app.use('/api', apiLimiter, apiRouter);
app.use('/api/comm', apiLimiter, commRouter);
app.use('/api/v1/prediction', apiLimiter, predictionRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/students', apiLimiter, studentsRouter);
app.use('/api/v1/graph', apiLimiter, graphRouter);
app.use('/api/v1/data', apiLimiter, dataImportRouter);

// Fallback to React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
