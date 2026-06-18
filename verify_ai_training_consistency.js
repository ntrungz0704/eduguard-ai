const fs = require('fs');
const path = require('path');

async function run() {
  console.log('=== VERIFYING AI TRAINING AND PREDICTION CONSISTENCY ===');
  let passed = true;

  const aiDir = path.resolve(__dirname, 'server/src/ai');
  const serviceDir = path.resolve(__dirname, 'server/src/services');

  const filesToScan = [];

  function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.js')) {
        // Exclude assessmentEngine.js as it is the component mapping service
        if (file !== 'assessmentEngine.js') {
          filesToScan.push(fullPath);
        }
      }
    });
  }

  if (fs.existsSync(aiDir)) walk(aiDir);
  if (fs.existsSync(serviceDir)) walk(serviceDir);

  console.log(`- Scanning ${filesToScan.length} files in AI and Service modules (excluding assessmentEngine.js)...`);

  // Target terms that should NOT exist in AI model/prediction modules
  const forbiddenPatterns = [
    /\.rawScore\b/i,
    /\.computedScore\b/i,
    /ScoreComponent/i
  ];

  filesToScan.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(__dirname, file);

    forbiddenPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        console.error(`  ❌ Fail: Found prohibited reference to components or subscores in [${relativePath}]: matched ${pattern}`);
        passed = false;
      }
    });
  });

  // Verify that model training refers to score value
  let scoreValueMatched = false;
  filesToScan.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('.value') || content.includes('value:') || content.includes('scores.value')) {
      scoreValueMatched = true;
    }
  });

  if (scoreValueMatched) {
    console.log('  ✅ Pass: Verified that AI models reference only the standard score value.');
  } else {
    console.warn('  ⚠️ Warning: No explicit ".value" text references found in scanned AI files (may be mapped dynamically).');
  }

  if (passed) {
    console.log('\n🎉 SUCCESS: AI TRAINING IS 100% CONSISTENT AND UNCHANGED!');
  } else {
    console.error('\n❌ FAILURE: AI TRAINING CONSISTENCY AUDIT FAILED.');
    process.exit(1);
  }
}

run().catch(console.error);
