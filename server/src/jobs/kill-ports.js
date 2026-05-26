const { execSync } = require('child_process');

const ports = [3000, 4173, 5173, 5174];

ports.forEach(port => {
  try {
    if (process.platform === 'win32') {
      // Find PID holding the port and kill it forcefully
      const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes(`:${port}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            try {
              execSync(`taskkill /f /pid ${pid}`, { stdio: 'ignore' });
              console.log(`✅ Freed port ${port} (Killed PID: ${pid})`);
            } catch (e) {
              // Ignore if already killed
            }
          }
        }
      }
    } else {
      execSync(`lsof -t -i:${port} | xargs -r kill -9`, { stdio: 'ignore' });
      console.log(`✅ Freed port ${port}`);
    }
  } catch (e) {
    // Port might not be in use, safely ignore
  }
});
