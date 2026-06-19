const fs = require('fs');

const data = fs.readFileSync('sheet.csv', 'utf8').split('\n');
const headers = data[0].split(',');

for (let i = 1; i < data.length; i++) {
  const row = data[i].split(',');
  if (!row[0]) continue;
  
  const mssv = row[0];
  let totalScore = 0;
  let passedCount = 0;
  for (let j = 1; j < row.length; j++) {
    const val = parseFloat(row[j]);
    if (!isNaN(val) && val >= 5.0) {
      totalScore += val;
      passedCount++;
    }
  }
  
  if (passedCount > 0) {
    const gpa = totalScore / passedCount;
    if (Math.abs(gpa - 8.75) < 0.01) {
      console.log(`Found match! MSSV: ${mssv}, GPA: ${gpa.toFixed(2)}, Passed: ${passedCount}`);
    }
  }
}
