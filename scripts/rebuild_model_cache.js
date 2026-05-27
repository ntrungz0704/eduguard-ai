const fs = require('fs');
const path = require('path');
const { weightedPrediction, getPrerequisites } = require('../server/src/ai/regression');
const { validateModel } = require('../server/src/ai/validation');

function rebuildModelCache() {
  console.log('🚀 Rebuilding regression model cache from standardized data...');
  
  const configPath = path.join(__dirname, '../server/src/datasets/training_data.json');
  if (!fs.existsSync(configPath)) {
    console.error('Không tìm thấy training_data.json');
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const students = config.students;
  const subjectNames = config.subjects;
  
  const modelCache = {};
  
  subjectNames.forEach(target => {
    const prereqs = getPrerequisites(target, config);
    
    // Build pre-computed models
    const model = weightedPrediction(prereqs, target, students);
    
    if (model && model.topFeatures && model.topFeatures.length > 0) {
      // Convert regression functions to serializeable structure
      const featuresSerialized = model.topFeatures.map(f => ({
        subject: f.feature,
        r: f.r,
        absR: f.absR,
        hybridScore: f.hybridScore,
        a: f.reg.a,
        b: f.reg.b,
        samples: f.n
      }));
      
      // Validate to save accuracy metrics
      const validation = validateModel(target, students, config.curriculumOrder);
      
      modelCache[target] = {
        target,
        topFeatures: featuresSerialized,
        validation,
        samples: students.filter(st => st.scores[target] != null).length
      };
    }
  });
  
  const cachePath = path.join(__dirname, '../server/src/datasets/model_cache.json');
  fs.writeFileSync(cachePath, JSON.stringify(modelCache, null, 2), 'utf8');
  console.log(`⚡ Pre-trained cache saved to model_cache.json (${Object.keys(modelCache).length} models)`);
}

rebuildModelCache();
