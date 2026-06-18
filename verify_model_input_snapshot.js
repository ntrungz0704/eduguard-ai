const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { prisma } = require('./server/src/infrastructure/database/prisma');
const { loadTrainingDataFromDB } = require('./server/src/scripts/recalculate_predictions');

function canonicalizeDataset(data) {
  // Deep clone data to avoid mutating original
  const clone = JSON.parse(JSON.stringify(data));
  
  // Exclude volatile fields like lastUpdated
  delete clone.lastUpdated;
  delete clone.source;

  // Sort curriculumOrder for determinism
  if (Array.isArray(clone.curriculumOrder)) {
    clone.curriculumOrder.sort();
  }

  // Sort subjects for determinism
  if (Array.isArray(clone.subjects)) {
    clone.subjects.sort();
  }

  // Sort students by id and sort their score keys
  if (Array.isArray(clone.students)) {
    clone.students.sort((a, b) => a.id.localeCompare(b.id));
    clone.students.forEach(student => {
      // Sort scores object keys
      if (student.scores) {
        const sortedScores = {};
        Object.keys(student.scores).sort().forEach(key => {
          sortedScores[key] = student.scores[key];
        });
        student.scores = sortedScores;
      }
    });
  }

  return clone;
}

function calculateSHA256(obj) {
  const serialized = JSON.stringify(obj);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

async function run() {
  console.log('=== VERIFYING AI TRAINING DATASETS SNAPSHOT INTEGRITY (SHA256) ===');
  let passed = true;

  try {
    // 1. Load training data with ENABLE_COMPONENT_SCORE = false
    console.log('- Loading dataset with ENABLE_COMPONENT_SCORE=false...');
    process.env.ENABLE_COMPONENT_SCORE = 'false';
    const datasetBefore = await loadTrainingDataFromDB();
    const canonicalBefore = canonicalizeDataset(datasetBefore);
    const hashBefore = calculateSHA256(canonicalBefore);
    
    console.log(`  * Students count: ${canonicalBefore.students.length}`);
    console.log(`  * Subjects count: ${canonicalBefore.subjects.length}`);
    console.log(`  * SHA256 hash (before): ${hashBefore}`);

    // 2. Load training data with ENABLE_COMPONENT_SCORE = true
    console.log('- Loading dataset with ENABLE_COMPONENT_SCORE=true...');
    process.env.ENABLE_COMPONENT_SCORE = 'true';
    const datasetAfter = await loadTrainingDataFromDB();
    const canonicalAfter = canonicalizeDataset(datasetAfter);
    const hashAfter = calculateSHA256(canonicalAfter);
    
    console.log(`  * Students count: ${canonicalAfter.students.length}`);
    console.log(`  * Subjects count: ${canonicalAfter.subjects.length}`);
    console.log(`  * SHA256 hash (after):  ${hashAfter}`);

    // 3. Assert they are exactly equal
    if (hashBefore === hashAfter) {
      console.log('  ✅ Pass: Training dataset is byte-for-byte identical (hashes match)!');
    } else {
      console.error('  ❌ Fail: Dataset hashes mismatched! AI training inputs changed.');
      passed = false;
    }

    // 4. Compare with the static reference file if it exists
    const staticPath = path.resolve(__dirname, 'server/src/datasets/training_data.json');
    if (fs.existsSync(staticPath)) {
      console.log('- Comparing current DB dataset schema structure with static training_data.json...');
      const staticData = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
      const canonicalStatic = canonicalizeDataset(staticData);
      
      const staticKeys = new Set(canonicalStatic.subjects);
      const dbKeys = new Set(canonicalBefore.subjects);
      
      let subjectMismatch = false;
      for (const sub of dbKeys) {
        if (!staticKeys.has(sub)) {
          console.warn(`  ⚠️ Notice: Database has subject [${sub}] not present in static template.`);
          subjectMismatch = true;
        }
      }
      
      if (!subjectMismatch) {
        console.log('  ✅ Pass: Database curriculum subjects align with training_data.json.');
      }
    }

  } catch (err) {
    console.error('❌ Error during consistency validation:', err);
    passed = false;
  } finally {
    await prisma.$disconnect();
  }

  if (passed) {
    console.log('\n🎉 SUCCESS: DATASET INTEGRITY CONFIRMED! NO CHANGES TO AI TRAINING INPUTS.');
    process.exit(0);
  } else {
    console.error('\n❌ FAILURE: DATASET INTEGRITY CHECK FAILED.');
    process.exit(1);
  }
}

run();
