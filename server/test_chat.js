const jwt = require('jsonwebtoken');

async function test() {
  const token = jwt.sign(
    { id: 'ADVISOR01', role: 'ADVISOR' },
    process.env.JWT_SECRET || 'hardcoded_fallback_secret_for_dev_only', // Use default from jwt.js
    { expiresIn: '1h' }
  );

  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        message: 'môn dễ rớt',
        sessionId: 'test-session'
      })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}
test();
