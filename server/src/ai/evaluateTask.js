const fs = require('fs');
const path = require('path');
const { weightedPrediction } = require('./regression');

async function runAIEvaluation(students, curriculumOrder) {
  const outPath = path.join(__dirname, '../datasets/ai_metrics.json');
  
  let totalPredictions = 0;
  let errBucket0_5 = 0;
  let errBucket1_0 = 0;
  let errBucketMore = 0;
  let sumAbsoluteError = 0;
  
  const startTime = Date.now();
  
  // Use for...of to allow yielding to the event loop
  for (let targetIdx = 0; targetIdx < curriculumOrder.length; targetIdx++) {
    const target = curriculumOrder[targetIdx];
    const prereqs = curriculumOrder.slice(0, targetIdx);
    
    // Yield to Event Loop so we don't block other API requests!
    await new Promise(r => setImmediate(r));
    
    const eligibleStudents = students.filter(s => s.scores && s.scores[target] != null);
    if (eligibleStudents.length < 5) continue;

    eligibleStudents.forEach(testStudent => {
      const trainSet = eligibleStudents.filter(s => s.id !== testStudent.id);
      
      const model = weightedPrediction(prereqs, target, trainSet);
      if (!model || (model.topFeatures && model.topFeatures.length === 0)) return;
      
      const actual = testStudent.scores[target];
      const predicted = model.predict(testStudent.scores);
      
      if (predicted != null) {
        const error = Math.abs(actual - predicted);
        sumAbsoluteError += error;
        totalPredictions++;
        
        if (error <= 0.5) errBucket0_5++;
        else if (error <= 1.0) errBucket1_0++;
        else errBucketMore++;
      }
    });
  }
  
  const durationMs = Date.now() - startTime;
  
  const result = {
    lastRunTime: new Date().toISOString(),
    durationMs,
    totalStudents: students.length,
    totalSubjects: curriculumOrder.length,
    totalPredictions,
    mae: totalPredictions > 0 ? (sumAbsoluteError / totalPredictions) : 0,
    buckets: {
      "0.0_to_0.5": errBucket0_5,
      "0.5_to_1.0": errBucket1_0,
      "more_than_1.0": errBucketMore
    }
  };
  
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`[AI Evaluation] Background LOOCV finished in ${durationMs}ms. Results saved.`);
}

module.exports = { runAIEvaluation };
