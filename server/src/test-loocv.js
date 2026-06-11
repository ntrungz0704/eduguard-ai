// Test speed
const fs = require('fs');
const path = require('path');

console.time('LoadData');
const data = JSON.parse(fs.readFileSync('./server/src/datasets/training_data.json', 'utf8'));
const students = data.students;
const subjects = data.subjects;
console.timeEnd('LoadData');

const ACADEMIC_PREREQUISITES = {
  "Lập trình PHP 1": ["Lập trình PHP cơ bản", "Cơ sở dữ liệu", "Xây dựng trang Web"],
  "Lập trình Javascript nâng cao": ["Lập trình cơ sở với JavaScript", "Nhập môn lập trình"],
  "Quản trị website": ["Lập trình PHP 1", "Thiết kế Web với HTML5 & CSS3", "Cơ sở dữ liệu", "Xây dựng trang Web", "Lập trình PHP cơ bản"],
  "Lập trình ECMAScript": ["Lập trình Javascript nâng cao", "Lập trình cơ sở với JavaScript", "Nhập môn lập trình"],
  "NodeJS & Restful Web Service": ["Lập trình Javascript nâng cao", "Cơ sở dữ liệu", "Lập trình ECMAScript"],
  "Lập trình Front-End Framework 1": ["Lập trình Javascript nâng cao", "Lập trình ECMAScript", "Thiết kế Web với HTML5 & CSS3", "Lập trình cơ sở với JavaScript"],
  "Lập trình Front-End Framework 2": ["Lập trình Front-End Framework 1", "Lập trình TypeScript"],
  "Lập trình TypeScript": ["Lập trình Javascript nâng cao", "Lập trình ECMAScript", "Lập trình cơ sở với JavaScript"],
  "Dự án 1": ["Lập trình PHP 1", "Thiết kế UI/UX", "Thiết kế Web với HTML5 & CSS3", "Cơ sở dữ liệu", "Lập trình cơ sở với JavaScript"],
  "Dự án tốt nghiệp": ["NodeJS & Restful Web Service", "Lập trình Front-End Framework 1", "Dự án 1", "Cơ sở dữ liệu", "Lập trình PHP 1"]
};

function filterOutliersByIQR(xs, ys) {
  if (xs.length < 6) return { xs, ys };
  const sorted_xs = [...xs].sort((a, b) => a - b);
  const sorted_ys = [...ys].sort((a, b) => a - b);
  const q1_x = sorted_xs[Math.floor(sorted_xs.length * 0.25)];
  const q3_x = sorted_xs[Math.floor(sorted_xs.length * 0.75)];
  const iqr_x = q3_x - q1_x;
  const q1_y = sorted_ys[Math.floor(sorted_ys.length * 0.25)];
  const q3_y = sorted_ys[Math.floor(sorted_ys.length * 0.75)];
  const iqr_y = q3_y - q1_y;
  const lo_x = q1_x - 1.5 * iqr_x;
  const hi_x = q3_x + 1.5 * iqr_x;
  const lo_y = q1_y - 1.5 * iqr_y;
  const hi_y = q3_y + 1.5 * iqr_y;
  const filtered_xs = [];
  const filtered_ys = [];
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] >= lo_x && xs[i] <= hi_x && ys[i] >= lo_y && ys[i] <= hi_y) {
      filtered_xs.push(xs[i]);
      filtered_ys.push(ys[i]);
    }
  }
  if (filtered_xs.length < 5) return { xs, ys };
  return { xs: filtered_xs, ys: filtered_ys };
}

function pearsonCorrelation(xs, ys) {
  const n = xs.length;
  if (n < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return dx * dy > 0 ? num / Math.sqrt(dx * dy) : 0;
}

function simpleLinearRegression(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const b = den > 0 ? num / den : 0;
  const a = my - b * mx;
  return { a, b };
}

function calibrate(rawPred, trainingScores) {
  if (!trainingScores || trainingScores.length < 5) return rawPred;
  const mean_real = trainingScores.reduce((a, b) => a + b, 0) / trainingScores.length;
  const sd_real = Math.sqrt(trainingScores.reduce((s, v) => s + (v - mean_real) ** 2, 0) / trainingScores.length);
  if (sd_real < 0.1) return rawPred;
  const sd_pred_estimated = sd_real * 0.65;
  const k = Math.min(1.6, sd_real / sd_pred_estimated);
  const calibrated = mean_real + k * (rawPred - mean_real);
  return Math.min(10, Math.max(0, Math.round(calibrated * 10) / 10));
}

function weightedPrediction(features, target, studentsData) {
  const correlations = [];
  const prereqList = ACADEMIC_PREREQUISITES[target] || [];
  features.forEach(feat => {
    const rawPairs = studentsData.filter(s => s.scores[feat] != null && s.scores[target] != null);
    if (rawPairs.length < 5) return;
    const rawXs = rawPairs.map(s => s.scores[feat]);
    const rawYs = rawPairs.map(s => s.scores[target]);
    const { xs, ys } = filterOutliersByIQR(rawXs, rawYs);
    if (xs.length < 5) return;
    const r = pearsonCorrelation(xs, ys);
    const reg = simpleLinearRegression(xs, ys);
    if (reg) {
      const kw = prereqList.includes(feat) ? 1.0 : 0.2;
      const hybridScore = kw * (Math.abs(r) ** 1.5);
      if (hybridScore >= 0.02) correlations.push({ feature: feat, hybridScore, reg });
    }
  });
  if (correlations.length === 0) {
    features.forEach(feat => {
      const rawPairs = studentsData.filter(s => s.scores[feat] != null && s.scores[target] != null);
      if (rawPairs.length < 5) return;
      const rawXs = rawPairs.map(s => s.scores[feat]);
      const rawYs = rawPairs.map(s => s.scores[target]);
      const { xs, ys } = filterOutliersByIQR(rawXs, rawYs);
      if (xs.length < 5) return;
      const r = pearsonCorrelation(xs, ys);
      const reg = simpleLinearRegression(xs, ys);
      if (reg) {
        const kw = prereqList.includes(feat) ? 1.0 : 0.2;
        const hybridScore = kw * (Math.abs(r) ** 1.5);
        if (hybridScore >= 0.001) correlations.push({ feature: feat, hybridScore, reg });
      }
    });
  }
  correlations.sort((a, b) => b.hybridScore - a.hybridScore);
  return { topK: correlations.slice(0, 5) };
}

console.time('StrictLOOCV');
let totalPredictions = 0;
// Test on 50 students first to gauge time
const sampleStudents = students.slice(0, 50);

sampleStudents.forEach((student, index) => {
  const trainSet = students.filter(s => s.id !== student.id);
  const completedSubjects = Object.keys(student.scores).filter(sub => student.scores[sub] !== null);
  
  completedSubjects.forEach(target => {
    const actualScore = student.scores[target];
    const features = completedSubjects.filter(sub => sub !== target);
    const model = weightedPrediction(features, target, trainSet);
    totalPredictions++;
  });
});
console.timeEnd('StrictLOOCV');
console.log('Evaluations:', totalPredictions);
