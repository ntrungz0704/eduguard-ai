// ============================================================
// EduGuard AI — Server Main Entry
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static dashboard assets from public (Legacy client served on backend port 3000)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mount API Router under '/api'
const apiRouter = require('./routes/api');
const commRouter = require('./routes/communication');
app.use('/api', apiRouter);
app.use('/api/comm', commRouter);

// Fallback to legacy index.html for any other requests on port 3000
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`✅ EduGuard AI Server running at http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Cổng ${port} đang bận, sẽ tự động thử lại sau 1 giây...`);
      setTimeout(() => {
        server.close();
        startServer(port);
      }, 1000);
    } else {
      console.error('❌ Server error:', err);
    }
  });
};

startServer(PORT);
