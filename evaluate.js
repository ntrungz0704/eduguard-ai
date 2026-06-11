const fs = require('fs');
const path = require('path');
const { weightedPrediction } = require('./server/src/ai/regression');

function evaluateAll() {
  const dataPath = path.join(__dirname, 'server/src/datasets/training_data.json');
  const outPath = path.join(__dirname, 'server/src/datasets/ai_metrics.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('Không tìm thấy training_data.json');
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const students = data.students || [];
  const curriculumOrder = data.curriculumOrder || [];
  
  let totalPredictions = 0;
  let errBucket0_5 = 0; // 0.0 - 0.5
  let errBucket1_0 = 0; // 0.5 - 1.0
  let errBucketMore = 0; // > 1.0

  let sumAbsoluteError = 0;
  
  // Track start time
  const startTime = Date.now();
  
  curriculumOrder.forEach((target, targetIdx) => {
    const prereqs = curriculumOrder.slice(0, targetIdx);
    
    const eligibleStudents = students.filter(s => s.scores && s.scores[target] != null);
    if (eligibleStudents.length < 5) return; // Skip if too few students

    eligibleStudents.forEach(testStudent => {
      // Leave one out: train on everyone else who has the target score
      const trainSet = eligibleStudents.filter(s => s.id !== testStudent.id);
      
      const model = weightedPrediction(prereqs, target, trainSet);
      if (model && model.topFeatures && model.topFeatures.length === 0) return;
      if (!model) return;
      
      // Mask the actual score
      const actual = testStudent.scores[target];
      const predicted = model.predict(testStudent.scores);
      
      if (predicted != null) {
        const error = Math.abs(actual - predicted);
        sumAbsoluteError += error;
        totalPredictions++;
        
        if (error <= 0.5) {
          errBucket0_5++;
        } else if (error <= 1.0) {
          errBucket1_0++;
        } else {
          errBucketMore++;
        }
      }
    });
  });
  
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
  console.log('Evaluation finished. Results saved to ai_metrics.json');
}

evaluateAll();
