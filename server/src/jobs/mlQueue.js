const { Queue, Worker } = require('bullmq');
const redisClient = require('../infrastructure/redis/redisClient');
const { spawn } = require('child_process');
const path = require('path');

const mlQueue = new Queue('ml-training', { connection: redisClient });

const mlWorker = new Worker('ml-training', async job => {
  console.log(`[ML Worker] Processing job ${job.id}: ${job.name}`);
  
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../ai/training/trainRiskModel.js');
    const child = spawn('node', [scriptPath]);
    
    child.stdout.on('data', (data) => {
      console.log(`[ML Worker STDOUT]: ${data}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`[ML Worker STDERR]: ${data}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[ML Worker] Job ${job.id} completed successfully`);
        resolve();
      } else {
        console.error(`[ML Worker] Job ${job.id} failed with code ${code}`);
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}, { connection: redisClient });

mlWorker.on('completed', job => {
  console.log(`[ML Worker] Job ${job.id} has completed!`);
});

mlWorker.on('failed', (job, err) => {
  console.error(`[ML Worker] Job ${job.id} has failed with ${err.message}`);
});

module.exports = {
  mlQueue,
  mlWorker
};
