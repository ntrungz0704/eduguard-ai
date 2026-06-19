// ============================================================
// EduGuard AI — Server Main Entry
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const env = require('./src/config/env'); // Validate environment immediately

const app = require('./src/app');
const { prisma } = require('./src/infrastructure/database/prisma');
const logger = require('./src/infrastructure/logger');

const PORT = env.PORT;

const startServer = async (port) => {
  // Load AI Model on Boot BEFORE opening the port
  // This prevents Render's health check from timing out due to blocked event loop
  try {
    const { loadModel } = require('./src/ai/inference/riskPredictor');
    await loadModel();
    logger.info('🧠 ML Predictor weights loaded successfully.');
  } catch (e) {
    logger.error(`❌ Lỗi khi khởi động ML Predictor: ${e.message}`, { stack: e.stack });
  }

  const server = app.listen(port, () => {
    logger.info(`✅ EduGuard AI Server running at http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`⚠️ Cổng ${port} đang bận, sẽ tự động thử lại sau 1 giây...`);
      setTimeout(() => {
        server.close();
        startServer(port);
      }, 1000);
    } else {
      logger.error('❌ Server error:', { error: err });
    }
  });

  // Graceful Shutdown
  const shutdown = async (signal) => {
    logger.info(`\n${signal} received. Bắt đầu Graceful Shutdown...`);
    server.close(async () => {
      logger.info('🛑 HTTP server closed.');
      await prisma.$disconnect();
      logger.info('🗄️ Database connections closed.');
      logger.info('👋 Thoát process an toàn (Exit 0).');
      process.exit(0);
    });

    // Force shutdown after 10s if graceful fails
    setTimeout(() => {
      logger.error('⏳ Shutdown timeout! Buộc tắt server.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer(PORT);
