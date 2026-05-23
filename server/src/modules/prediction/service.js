const { weightedPrediction, calibrate, getPrerequisites } = require('../../ai/regression');
const { calculateRiskScore, classifyRiskLevel } = require('../../shared/utils');
const cache = require('../../shared/cache');

class PredictionService {
  /**
   * Predicts scores for a list of students on a target subject
   */
  async predictScores(targetSubject, studentsToPredict, trainingData, cachedModel) {
    const trainStudents = trainingData.students || [];
    const trainScores = trainStudents.filter(s => s.scores[targetSubject] != null).map(s => s.scores[targetSubject]);

    // Fast Path (Cached Model)
    if (cachedModel) {
      return this._predictWithModel(targetSubject, studentsToPredict, cachedModel.topFeatures, trainScores);
    }

    // Slow Path (On-the-fly Model Generation)
    const prereqs = getPrerequisites(targetSubject, trainingData);
    const model = weightedPrediction(prereqs, targetSubject, trainStudents);

    if (model.topFeatures.length === 0) {
      return { status: "warning", message: "Chưa đủ dữ liệu hồi quy", predictions: [] };
    }

    return this._predictWithModel(targetSubject, studentsToPredict, model.topFeatures, trainScores);
  }

  _predictWithModel(targetSubject, students, topFeatures, trainScores) {
    const predictions = [];

    students.forEach(s => {
      const hasActual = s.scores[targetSubject] != null;
      let predicted = null;
      let risk = 'low';

      if (hasActual) {
        predicted = s.scores[targetSubject];
        risk = classifyRiskLevel(predicted);
      } else {
        const activeFeatures = topFeatures.filter(f => s.scores[f.subject || f.feature] != null);
        
        if (activeFeatures.length > 0) {
          const activeTotalScore = activeFeatures.reduce((sum, f) => sum + f.hybridScore, 0) || 1;
          let predSum = 0;
          activeFeatures.forEach(f => {
            const x = s.scores[f.subject || f.feature];
            const a = f.a !== undefined ? f.a : (f.reg ? f.reg.a : 0);
            const b = f.b !== undefined ? f.b : (f.reg ? f.reg.b : 0);
            const val = Math.min(10, Math.max(0, a + b * x)); // fallback logic approximation
            predSum += (f.hybridScore / activeTotalScore) * val;
          });
          const rawPredicted = Math.round(predSum * 10) / 10;
          predicted = calibrate(rawPredicted, trainScores);
        } else {
          // Fallback
          predicted = 5.0; // simplified fallback for service
        }

        risk = classifyRiskLevel(predicted);
      }

      predictions.push({
        id: s.id,
        predicted,
        risk
      });
    });

    return { status: "success", predictions };
  }
}

module.exports = new PredictionService();
