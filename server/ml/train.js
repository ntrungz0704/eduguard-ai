const fs = require('fs');
const path = require('path');
const { getPrerequisites, weightedPrediction } = require('../ai/regression');
const { validateModel } = require('../ai/validation');

// Configuration
const dataPath = path.join(__dirname, '..', 'data', 'training_data.json');
const outputPath = path.join(__dirname, 'trained_model.json');

console.log("============================================================");
console.log("🚀 EDUGUARD AI - LOCAL MACHINE LEARNING TRAINING MODULE");
console.log("============================================================");

if (!fs.existsSync(dataPath)) {
  console.error("❌ ERROR: Training data not found at", dataPath);
  process.exit(1);
}

console.log("📥 Loading dataset from training_data.json...");
const trainingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const students = trainingData.students || [];
const subjects = trainingData.subjects || [];
const curriculumOrder = trainingData.curriculumOrder || [];

console.log(`📊 Dataset Info:`);
console.log(`   - Students: ${students.length}`);
console.log(`   - Subjects: ${subjects.length}`);
console.log("⚙️  Training Linear Regression & Pearson Models...\n");

const trainedModel = {};

// Train model for each subject
subjects.forEach((targetSubject, index) => {
  const prereqs = getPrerequisites(targetSubject, trainingData);
  
  // Predict using the regression logic (finding weights)
  const model = weightedPrediction(prereqs, targetSubject, students);
  
  // Calculate validation/accuracy
  const validation = validateModel(targetSubject, students, curriculumOrder);

  // Get training samples count
  const trainScores = students.filter(s => s.scores[targetSubject] != null).map(s => s.scores[targetSubject]);
  const samples = trainScores.length;

  if (model.topFeatures.length > 0) {
    // Format the top features exactly like it's needed for fast prediction
    const formattedFeatures = model.topFeatures.map(f => ({
      subject: f.feature,
      r: f.r,
      absR: f.absR,
      hybridScore: f.hybridScore,
      a: f.reg.a, // Weight A (Intercept)
      b: f.reg.b, // Weight B (Slope)
      samples: f.n
    }));

    trainedModel[targetSubject] = {
      target: targetSubject,
      samples: samples,
      topFeatures: formattedFeatures,
      validation: validation,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ [${index + 1}/${subjects.length}] Trained: ${targetSubject} (Accuracy: ${validation ? validation.accuracy + '%' : 'N/A'})`);
  } else {
    console.log(`⚠️ [${index + 1}/${subjects.length}] Skipped: ${targetSubject} (Not enough data)`);
  }
});

console.log("\n💾 Saving trained model weights to disk...");
fs.writeFileSync(outputPath, JSON.stringify(trainedModel, null, 2), 'utf8');

console.log("🎉 TRAINING COMPLETED SUCESSFULLY!");
console.log(`📁 Model saved at: ${outputPath}`);
console.log(`🧠 The EduGuard AI Predictor is now ready to use local weights!`);
console.log("============================================================\n");
