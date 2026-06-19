const fs = require('fs');

const trainingDataPath = './src/datasets/training_data.json';
const csvPath = './src/ai/training/enhanced_student_grades.csv';

const trainingData = JSON.parse(fs.readFileSync(trainingDataPath, 'utf8'));
const csvText = fs.readFileSync(csvPath, 'utf8');

const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
const headers = lines[0].split(',').map(h => h.trim());

const mssvIndex = headers.indexOf('MSSV');
const subjectStart = headers.indexOf('Tin học');
const subjectEnd = headers.indexOf('Dự án tốt nghiệp') + 1;

if (mssvIndex === -1 || subjectStart === -1 || subjectEnd === 0) {
  console.error("Invalid CSV format");
  process.exit(1);
}

const subjectNames = headers.slice(subjectStart, subjectEnd);

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',').map(c => c.trim());
  const mssv = cols[mssvIndex];
  if (!mssv) continue;

  const student = trainingData.students.find(s => s.id === mssv);
  if (student) {
    subjectNames.forEach((sub, j) => {
      const raw = cols[subjectStart + j];
      if (raw && raw !== '' && raw !== '*' && raw !== '-' && raw !== 'X' && raw !== 'F') {
        const lower = raw.toLowerCase();
        if (lower === 'đạt' || lower === 'passed' || lower === 'miễn') {
          student.scores[sub] = 1.0;
        } else {
          const n = parseFloat(raw);
          if (!isNaN(n)) {
            student.scores[sub] = n;
          }
        }
      }
    });
  }
}

fs.writeFileSync(trainingDataPath, JSON.stringify(trainingData, null, 2));
console.log("training_data.json updated successfully with all scores from CSV!");
