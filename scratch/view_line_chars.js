const fs = require('fs');
const content = fs.readFileSync('client/src/pages/StudentProfile.jsx', 'utf8');
const lines = content.split(/\r?\n/);
for (let i = 1330; i < 1340; i++) {
  console.log(`Line ${i + 1}: [${lines[i]}]`);
  console.log(JSON.stringify(lines[i]));
}
