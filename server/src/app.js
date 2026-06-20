const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const compression = require('compression');

const rateLimit = require('express-rate-limit');
const traceIdMiddleware = require('./middlewares/tracing');
const errorHandler = require('./middlewares/errors');
const syllabusLoader = require('./modules/data/syllabusLoader');

const app = express();
app.set('trust proxy', 1); // Trust Render's reverse proxy for express-rate-limit

// Initialize Data Caches
syllabusLoader.init();
require('./modules/knowledge/cache').init();
if (process.env.NODE_ENV !== 'test') {
  require('./utils/dataService').initCourseAliases().catch(err => {
    console.error('[Startup] Failed to initialize course aliases:', err);
  });
}

// Apply Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased for demo to avoid blocking
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Quá nhiều request, vui lòng thử lại sau.' }
});

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://*", "http://*"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://*"],
    },
  }
}));
app.use(compression());

// Strict CORS — allow dynamic origin to fix Railway Network Error
app.use(cors({
  origin: true,
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
const knowledgeRouter = require('./modules/knowledge/routes');
const advisorRoutes = require('./modules/advisor/routes');
const learningRouter = require('./modules/learning/routes');
const githubRouter = require('./modules/github/routes');
const retakeRouter = require('./modules/retake/routes');
const careerRouter = require('./modules/career/career.routes');

app.use('/api/comm', apiLimiter, commRouter);
app.use('/api/v1/prediction', apiLimiter, predictionRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/students', apiLimiter, studentsRouter);
app.use('/api/v1/graph', apiLimiter, graphRouter);
app.use('/api/v1/data', apiLimiter, dataImportRouter);
app.use('/api/v1/knowledge', apiLimiter, knowledgeRouter);
app.use('/api/v1/advisor', apiLimiter, advisorRoutes);
app.use('/api/v1/learning', apiLimiter, learningRouter);
app.use('/api/v1/github', apiLimiter, githubRouter);
app.use('/api/v1/retake', apiLimiter, retakeRouter);
app.use('/api/v1/career', apiLimiter, careerRouter);
app.use('/api', apiLimiter, apiRouter);

// Fallback to React Router
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
