// ============================================================
// EduGuard AI — Server Main Entry
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const env = require('./src/config/env'); // Validate environment immediately

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Auto-build client if missing (Render fallback)
const distPath = path.join(__dirname, '..', 'client', 'dist', 'index.html');
if (!fs.existsSync(distPath)) {
  console.log('⚠️ client/dist/index.html not found! Building client now...');
  try {
    execSync('npm install --include=dev', { cwd: path.join(__dirname, '..', 'client'), stdio: 'inherit' });
    execSync('npm run build', { cwd: path.join(__dirname, '..', 'client'), stdio: 'inherit' });
    console.log('✅ Client built successfully.');
  } catch (err) {
    console.error('❌ Failed to build client:', err.message);
  }
}

const app = require('./src/app');
const { prisma } = require('./src/infrastructure/database/prisma');
const logger = require('./src/infrastructure/logger');

const PORT = env.PORT;

const startServer = async (port) => {
  const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`✅ EduGuard AI Server running at http://0.0.0.0:${port}`);
    
    // Load AI Model on Boot AFTER opening the port
    // This prevents Render's health check from timing out due to blocked event loop
    try {
      const { loadModel } = require('./src/ai/inference/riskPredictor');
      loadModel().then(() => {
        logger.info('🧠 ML Predictor weights loaded successfully.');
      }).catch(e => {
        logger.error(`❌ Lỗi khi khởi động ML Predictor: ${e.message}`);
      });
    } catch (e) {
      logger.error(`❌ Lỗi khi tải ML Predictor: ${e.message}`, { stack: e.stack });
    }
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
