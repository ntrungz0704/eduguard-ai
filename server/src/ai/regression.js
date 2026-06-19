// ============================================================
// ACADEMIC PREREQUISITES GRAPH (Causal Knowledge Network)
// ============================================================
const fs = require('fs');
const path = require('path');
const depPath = path.join(__dirname, '..', 'data', 'subject_dependencies.json');

let SUBJECT_DEPENDENCIES = [];
if (fs.existsSync(depPath)) {
  try {
    SUBJECT_DEPENDENCIES = JSON.parse(fs.readFileSync(depPath, 'utf8')) || [];
  } catch (e) {
    console.error("Error loading subject dependencies:", e);
  }
}

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

// Override / Merge with JSON configuration
SUBJECT_DEPENDENCIES.forEach(dep => {
  ACADEMIC_PREREQUISITES[dep.target] = dep.prerequisites;
});

// ============================================================
// [FIX A] IQR OUTLIER FILTER
// Loại bỏ các điểm bất thường (rớt môn bỏ thi, chuyển điểm)
// trước khi đưa vào OLS/Pearson để tránh đường hồi quy bị kéo lệch.
// Sử dụng Interquartile Range (IQR) = Q3 - Q1.
// Điểm bị loại nếu nằm ngoài [Q1 - 1.5*IQR, Q3 + 1.5*IQR].
// ============================================================
function filterOutliersByIQR(xs, ys) {
  if (xs.length < 6) return { xs, ys }; // Không đủ mẫu để lọc

  // Tính IQR cho cả xs (môn tiên quyết) và ys (môn mục tiêu)
  const sorted_xs = [...xs].sort((a, b) => a - b);
  const sorted_ys = [...ys].sort((a, b) => a - b);

  const q1_x = sorted_xs[Math.floor(sorted_xs.length * 0.25)];
  const q3_x = sorted_xs[Math.floor(sorted_xs.length * 0.75)];
  const iqr_x = q3_x - q1_x;

  const q1_y = sorted_ys[Math.floor(sorted_ys.length * 0.25)];
  const q3_y = sorted_ys[Math.floor(sorted_ys.length * 0.75)];
  const iqr_y = q3_y - q1_y;

  // Ngưỡng giới hạn (1.5x IQR là tiêu chuẩn Tukey)
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

  // Bảo vệ: Nếu lọc quá mạnh còn < 5 mẫu thì trả về bản gốc
  if (filtered_xs.length < 5) return { xs, ys };

  return { xs: filtered_xs, ys: filtered_ys };
}

// ============================================================
// MATH: Pearson Correlation Coefficient
// ============================================================
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

// ============================================================
// MATH: Simple Linear Regression (OLS)
// Formula: y = a + bx
// ============================================================
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
  return { a, b, predict: (x) => Math.min(10, Math.max(0, a + b * x)) };
}

// ============================================================
// [FIX C] STATISTICAL CALIBRATION
// Vì OLS có xu hướng kéo điểm về trung bình (Attenuation Bias),
// ta dùng SD-stretching để "bung" lại phổ dự đoán cho khớp với thực tế.
// Công thức: ŷ_calibrated = Mean_real + k × (ŷ - Mean_pred)
// Với k = SD_real / SD_pred (Calibration Factor)
// ============================================================
function calibrate(rawPred, trainingScores) {
  if (!trainingScores || trainingScores.length < 5) return rawPred;

  const mean_real = trainingScores.reduce((a, b) => a + b, 0) / trainingScores.length;
  const sd_real = Math.sqrt(trainingScores.reduce((s, v) => s + (v - mean_real) ** 2, 0) / trainingScores.length);

  // SD của dự đoán: ước lượng qua độ lệch từ trung bình thực
  // Dùng chính rawPred - mean_real như "khoảng cách" cần kéo giãn
  if (sd_real < 0.1) return rawPred; // Tập train quá đồng đều, không cần calibrate

  // Ước lượng SD tập dự đoán = SD_real * 0.65 (hệ số bóp điển hình của OLS)
  const sd_pred_estimated = sd_real * 0.65;
  const k = Math.min(1.6, sd_real / sd_pred_estimated); // Giới hạn k <= 1.6 tránh phóng đại

  const calibrated = mean_real + k * (rawPred - mean_real);
  return Math.min(10, Math.max(0, Math.round(calibrated * 10) / 10));
}

// ============================================================
// MATH: Knowledge-Enhanced Hybrid Multi-Feature Prediction (HK-Pearson V2.1)
// [FIX B] Exponent thay đổi từ |r|^2 → |r|^1.5 để tránh một môn
//          "thống trị" toàn bộ trọng số khi |r| lớn.
// Formula: ŷ = Σ(|rᵢ|^1.5 × KWᵢ / Σ(|r_k|^1.5 × KW_k)) × (aᵢ + bᵢ×xᵢ)
// ============================================================
const EXPONENT = 1.5; // [FIX B]: Giảm từ 2 xuống 1.5 để cân bằng đóng góp các môn

function weightedPrediction(features, target, students) {
  const correlations = [];
  const prereqList = ACADEMIC_PREREQUISITES[target] || [];

  features.forEach(feat => {
    // [FIX A]: Lọc IQR TRƯỚC khi đưa vào train OLS/Pearson
    const rawPairs = students.filter(s => s.scores[feat] != null && s.scores[target] != null);
    if (rawPairs.length < 5) return;

    const rawXs = rawPairs.map(s => s.scores[feat]);
    const rawYs = rawPairs.map(s => s.scores[target]);

    // Áp dụng IQR filter
    const { xs, ys } = filterOutliersByIQR(rawXs, rawYs);
    
    // [ENFORCE GROUND TRUTH]: Chỉ train nếu số lượng mẫu (intersection) >= 50
    if (xs.length < 50) return;

    const r = pearsonCorrelation(xs, ys);
    const reg = simpleLinearRegression(xs, ys);

    if (reg) {
      const kw = prereqList.includes(feat) ? 1.0 : 0.2;
      // [FIX B]: Dùng exponent 1.5 thay vì 2
      const hybridScore = kw * (Math.abs(r) ** EXPONENT);

      // Ngưỡng threshold được nới rộng vì exponent 1.5 < 2 → giá trị nhỏ hơn
      if (hybridScore >= 0.02) {
        correlations.push({
          feature: feat,
          r,
          absR: Math.abs(r),
          hybridScore,
          reg,
          n: xs.length, // Ghi số mẫu sau khi lọc (minh bạch hơn)
          rawN: rawPairs.length // Tổng mẫu gốc trước lọc
        });
      }
    }
  });

  // Adaptive Fallback: Nếu không có feature nào vượt ngưỡng, nới lỏng
  if (correlations.length === 0) {
    features.forEach(feat => {
      const rawPairs = students.filter(s => s.scores[feat] != null && s.scores[target] != null);
      if (rawPairs.length < 5) return;

      const rawXs = rawPairs.map(s => s.scores[feat]);
      const rawYs = rawPairs.map(s => s.scores[target]);
      const { xs, ys } = filterOutliersByIQR(rawXs, rawYs);
      
      // [ENFORCE GROUND TRUTH]: Chỉ train nếu số lượng mẫu (intersection) >= 50
      if (xs.length < 50) return;

      const r = pearsonCorrelation(xs, ys);
      const reg = simpleLinearRegression(xs, ys);

      if (reg) {
        const kw = prereqList.includes(feat) ? 1.0 : 0.2;
        const hybridScore = kw * (Math.abs(r) ** EXPONENT);

        if (hybridScore >= 0.001) {
          correlations.push({
            feature: feat,
            r,
            absR: Math.abs(r),
            hybridScore,
            reg,
            n: xs.length,
            rawN: rawPairs.length
          });
        }
      }
    });
  }

  correlations.sort((a, b) => b.hybridScore - a.hybridScore);
  const topK = correlations.slice(0, 5);

  // Chuẩn bị mảng điểm thực tế của môn target cho Calibration
  const targetTrainingScores = students
    .filter(s => s.scores[target] != null)
    .map(s => s.scores[target]);

  return {
    topFeatures: topK,
    predict: (studentScores) => {
      if (topK.length === 0) return null;

      const activeFeatures = topK.filter(c => studentScores[c.feature] != null);
      if (activeFeatures.length === 0) {
        const availableCorrelations = correlations.filter(c => studentScores[c.feature] != null);
        if (availableCorrelations.length === 0) return null;

        const fallbackFeatures = availableCorrelations.slice(0, 3);
        const fallbackTotalScore = fallbackFeatures.reduce((s, c) => s + c.hybridScore, 0) || 1;
        let pred = 0;
        fallbackFeatures.forEach(c => {
          pred += (c.hybridScore / fallbackTotalScore) * c.reg.predict(studentScores[c.feature]);
        });
        // [FIX C]: Áp dụng Statistical Calibration
        return calibrate(Math.round(pred * 10) / 10, targetTrainingScores);
      }

      const activeTotalScore = activeFeatures.reduce((s, c) => s + c.hybridScore, 0) || 1;
      let pred = 0;
      activeFeatures.forEach(c => {
        const x = studentScores[c.feature];
        pred += (c.hybridScore / activeTotalScore) * c.reg.predict(x);
      });

      // [FIX C]: Áp dụng Statistical Calibration cho kết quả chính
      let finalPred = calibrate(Math.round(pred * 10) / 10, targetTrainingScores);

      // --- CASCADING RISK PROPAGATION ---
      const deps = SUBJECT_DEPENDENCIES.find(d => d.target === target);
      if (deps && deps.prerequisites.length > 0) {
        let cascadePenalty = 0;
        deps.prerequisites.forEach(prereq => {
          if (studentScores[prereq] !== undefined && studentScores[prereq] !== null) {
            if (studentScores[prereq] < 5.0) cascadePenalty += 2.0;
            else if (studentScores[prereq] < 6.5) cascadePenalty += 0.5;
          }
        });
        if (cascadePenalty > 0) {
          finalPred = Math.max(0, finalPred - cascadePenalty);
        }
      }

      return finalPred;
    }
  };
}

// Helper to get curriculum prerequisites
function getPrerequisites(target, trainingData) {
  const order = trainingData.curriculumOrder || [];
  const idx = order.indexOf(target);
  if (idx <= 0) return trainingData.subjects.filter(s => s !== target);
  return order.slice(0, idx);
}

module.exports = {
  ACADEMIC_PREREQUISITES,
  pearsonCorrelation,
  simpleLinearRegression,
  filterOutliersByIQR,
  calibrate,
  weightedPrediction,
  getPrerequisites
};
