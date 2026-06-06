const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', '..', '..', 'data', 'advisor-history.json');

class HistoryRepository {
  async save(logData) {
    try {
      let logs = [];
      if (fs.existsSync(LOG_FILE)) {
        const raw = fs.readFileSync(LOG_FILE, 'utf-8');
        if (raw) logs = JSON.parse(raw);
      }
      logs.push({
        ...logData,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error("Failed to log advisor history", error);
    }
  }
}

module.exports = new HistoryRepository();
