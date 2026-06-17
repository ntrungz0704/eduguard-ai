const fs = require('fs');
const content = fs.readFileSync('client/src/pages/StudentDashboard.jsx', 'utf8');
const lines = content.split(/\r?\n/);

console.log('=== ROW START ===');
for (let i = 880; i < 900; i++) {
  console.log(`Line ${i + 1}: [${lines[i]}]`);
  console.log(JSON.stringify(lines[i]));
}

console.log('\n=== BADGES ===');
for (let i = 980; i < 1020; i++) {
  console.log(`Line ${i + 1}: [${lines[i]}]`);
  console.log(JSON.stringify(lines[i]));
}
