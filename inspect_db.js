const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'eduguard_dev_secret_change_in_production_must_be_32_chars';
const token = jwt.sign({ id: 'advisor-1', role: 'ADVISOR' }, JWT_SECRET);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/students/PS47261',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log("Keys:", Object.keys(json));
      console.log("Scores length:", json.scores?.length);
      console.log("First 3 scores:", json.scores?.slice(0, 3));
    } catch (e) {
      console.error("FAIL TO PARSE JSON. Status:", res.statusCode, "Raw data:", data.slice(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.error("HTTP ERROR:", e.message);
});

req.end();
