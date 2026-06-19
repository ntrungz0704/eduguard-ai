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
  
  // Students who have target score, excluding intervened ones
  const eligible = students.filter(s => s.scores[target] != null && !s.intervened);
  if (eligible.length < 10) {
    return { mae: null, rmse: null, accuracy05: null, accuracy10: null, message: 'Không đủ dữ liệu validation (cần ≥10)' };
  }
  
  let sumAE = 0, sumSE = 0, correct05 = 0, correct10 = 0;
  const testResults = [];
  const n = eligible.length;

  // LOOCV (Leave-One-Out Cross-Validation)
  for (let i = 0; i < n; i++) {
    const testStudent = eligible[i];
    // Train on N-1 students
    const trainSet = eligible.filter((_, idx) => idx !== i);
    
    const model = weightedPrediction(prereqs, target, trainSet);
    if (model.topFeatures.length === 0) continue;

    // Evaluate on the 1 left-out student
    const actual = testStudent.scores[target];
    const predicted = model.predict(testStudent.scores);

    if (predicted != null) {
      const error = Math.abs(actual - predicted);
      sumAE += error;
      sumSE += error ** 2;
      if (error <= 0.5) correct05++;
      if (error <= 1.0) correct10++;
      testResults.push({ 
        id: testStudent.id, 
        name: testStudent.name, 
        actual, 
        predicted: Math.round(predicted * 10) / 10, 
        error: Math.round(error * 10) / 10 
      });
    }
  }
  
  const validN = testResults.length;
  
  // Train final model on FULL dataset to get representative topFeatures
  const finalModel = weightedPrediction(prereqs, target, eligible);
  
  return {
    trainSize: n,
    testSize: n,
    folds: n, // Number of folds is exactly the number of students
    mae: validN > 0 ? Math.round((sumAE / validN) * 100) / 100 : null,
    rmse: validN > 0 ? Math.round(Math.sqrt(sumSE / validN) * 100) / 100 : null,
    accuracy05: validN > 0 ? Math.round((correct05 / validN) * 100) : null,
    accuracy10: validN > 0 ? Math.round((correct10 / validN) * 100) : null,
    testResults,
    topFeatures: (finalModel.topFeatures || []).map(f => ({ 
      subject: f.feature, 
      r: Math.round(f.r * 100) / 100, 
      samples: f.n 
    }))
  };
}

module.exports = {
  validateModel
};
