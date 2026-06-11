const fs = require('fs');
const lines = fs.readFileSync('test.csv', 'utf8').split('\n');
const headers = lines[0].split('","').map(s => s.replace(/"/g, ''));
const ps = lines.find(l => l.includes('PS47261')).split('","').map(s => s.replace(/"/g, ''));
for(let i=1; i<headers.length; i++) {
  if (ps[i] && ps[i].trim() !== '' && ps[i].trim() !== '""' && ps[i].trim() !== '\r') {
    console.log(headers[i] + ': ' + ps[i].trim());
  }
}
