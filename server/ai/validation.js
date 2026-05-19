const { weightedPrediction } = require('./regression');

// ============================================================
// VALIDATION: Train/Test Split + MAE/RMSE
// Source: Hastie et al. "Elements of Statistical Learning" (2009)
// MAE = (1/n) × Σ|yᵢ - ŷᵢ|
// RMSE = √((1/n) × Σ(yᵢ - ŷᵢ)²)
// ============================================================
function validateModel(target, students, curriculumOrder) {
  const targetIdx = curriculumOrder.indexOf(target);
  const prereqs = curriculumOrder.slice(0, targetIdx).filter(s => students.some(st => st.scores[s] != null));
  
  // Students who have target score, excluding intervened ones (Intervention Feedback Loop)
  const eligible = students.filter(s => s.scores[target] != null && !s.intervened);
  if (eligible.length < 10) {
    return { mae: null, rmse: null, accuracy: null, message: 'Không đủ dữ liệu validation (cần ≥10)' };
  }
  
  // Shuffle and split 80/20
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const splitIdx = Math.floor(shuffled.length * 0.8);
  const train = shuffled.slice(0, splitIdx);
  const test = shuffled.slice(splitIdx);
  
  if (test.length < 2) {
    return { mae: null, rmse: null, accuracy: null, message: 'Test set quá nhỏ' };
  }
  
  // Train model on train set
  const model = weightedPrediction(prereqs, target, train);
  if (model.topFeatures.length === 0) {
    return { mae: null, rmse: null, accuracy: null, message: 'Không tìm được feature tương quan' };
  }
  
  // Evaluate on test set
  let sumAE = 0, sumSE = 0, correct = 0;
  const testResults = [];
  
  test.forEach(s => {
    const actual = s.scores[target];
    const predicted = model.predict(s.scores);
    if (predicted != null) {
      const error = Math.abs(actual - predicted);
      sumAE += error;
      sumSE += error ** 2;
      if (error < 1.5) correct++;
      testResults.push({ 
        id: s.id, 
        name: s.name, 
        actual, 
        predicted: Math.round(predicted * 10) / 10, 
        error: Math.round(error * 10) / 10 
      });
    }
  });
  
  const n = testResults.length;
  return {
    trainSize: train.length,
    testSize: n,
    mae: n > 0 ? Math.round((sumAE / n) * 100) / 100 : null,
    rmse: n > 0 ? Math.round(Math.sqrt(sumSE / n) * 100) / 100 : null,
    accuracy: n > 0 ? Math.round((correct / n) * 100) : null,
    testResults,
    topFeatures: model.topFeatures.map(f => ({ 
      subject: f.feature, 
      r: Math.round(f.r * 100) / 100, 
      samples: f.n 
    }))
  };
}

module.exports = {
  validateModel
};
