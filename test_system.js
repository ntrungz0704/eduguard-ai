const http = require('http');

const request = (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch(e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function testSystem() {
  console.log('--- STARTING SYSTEM TEST ---');

  // 1. Test Health Check
  try {
    const health = await request('GET', '/api/health');
    console.log('[GET /api/health] Status:', health.status);
    console.log('Response:', health.data);
  } catch (e) {
    console.error('Health Check Failed:', e.message);
  }

  // 2. Test Chatbot API
  try {
    const chatPayload = { message: "điểm GPA của tôi là bao nhiêu?", mssv: "SE123456" };
    console.log('\n[POST /api/chat] Payload:', chatPayload);
    const chat = await request('POST', '/api/chat', chatPayload);
    console.log('Status:', chat.status);
    console.log('Response:', chat.data);
  } catch (e) {
    console.error('Chat API Failed:', e.message);
  }

  // 3. Test Student Prediction API (Assuming route exists in api.js)
  try {
    console.log('\n[GET /api/v1/predict/SE123456]');
    const predict = await request('GET', '/api/v1/predict/SE123456');
    console.log('Status:', predict.status);
    console.log('Response:', predict.data);
  } catch (e) {
    console.error('Predict API Failed:', e.message);
  }

  console.log('--- TEST FINISHED ---');
}

testSystem();
