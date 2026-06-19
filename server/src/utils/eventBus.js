const EventEmitter = require('events');

class GlobalEventBus extends EventEmitter {}

// Tạo một instance duy nhất (Singleton) cho toàn hệ thống
const eventBus = new GlobalEventBus();

// Tăng giới hạn listeners để tránh warning memory leak nếu có nhiều modules lắng nghe
eventBus.setMaxListeners(20);

// Các hằng số sự kiện
const EVENTS = {
  DATASET_UPDATED: 'DATASET_UPDATED',
  PREDICTION_COMPLETED: 'PREDICTION_COMPLETED',
};

module.exports = {
  eventBus,
  EVENTS
};
