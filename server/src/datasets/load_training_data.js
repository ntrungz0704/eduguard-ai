// ============================================================
// EduGuard AI - Data Loader: parse real FPT Polytechnic data
// Run once: node server/data/load_training_data.js
// ============================================================
const fs = require('fs');
const path = require('path');
const https = require('https');

const CSV_URL = 'https://docs.google.com/spreadsheets/d/14K2vrJpbX-V54q96Xfc-nN3AA9IJ-3FV5EWMwInqdso/gviz/tq?tqx=out:csv&sheet=Tong%20hop';

// Dynamic import of regression engine functions
const { weightedPrediction, getPrerequisites } = require('../ai/regression');
const { validateModel } = require('../ai/validation');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

async function fetchAndParse() {
  console.log('📥 Fetching real student data from Google Sheets...');
  
  return new Promise((resolve, reject) => {
    https.get(CSV_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const lines = data.split('\n').filter(l => l.trim() && (l.includes('"PS') || l.includes('"PC') || l.includes('"PP')));
          const headerLine = data.split('\n').find(l => l.includes('"MSSV"'));
          
          if (!headerLine) {
            return reject(new Error('Không tìm thấy dòng header MSSV'));
          }

          // Parse headers
          const headers = parseCSVLine(headerLine).map(h => h.replace(/\"/g, '').trim());
          const subjectStart = headers.indexOf('Tin học');
          const subjectEnd = headers.indexOf('Dự án tốt nghiệp') + 1;
          const subjectNames = headers.slice(subjectStart, subjectEnd).filter(h => h.trim());
          
          console.log(`📚 Found ${subjectNames.length} subjects in FPT Poly curriculum`);
          
          // Parse students
          const seen = new Set();
          const students = [];
          
          for (const line of lines) {
            const cols = parseCSVLine(line).map(c => c.replace(/\"/g, '').trim());
            const mssv = (cols[0] || '').trim();
            if (!mssv || seen.has(mssv)) continue;
            seen.add(mssv);
            
            const scores = {};
            
            subjectNames.forEach((sub, i) => {
              const raw = (cols[subjectStart + i] || '').trim();
              
              // Ký tự rác (*, -, khoảng trắng thừa, X, F)
              if (raw === '' || raw === '*' || raw === 'X' || raw === '-' || raw === 'F') {
                scores[sub] = null;
              } else {
                const lower = raw.toLowerCase();
                if (lower === 'đạt' || lower === 'passed' || lower === 'miễn') {
                  scores[sub] = 1.0;
                } else {
                  const n = parseFloat(raw);
                  if (isNaN(n)) {
                    scores[sub] = null;
                  } else {
                    scores[sub] = n;
                  }
                }
              }
            });
            
          // Loại bỏ tên sinh viên để tối ưu dung lượng và bảo mật (chỉ giữ mssv)
            students.push({ id: mssv, scores });
          }
          
          // Hardcode patch for PS47261 because the Google Sheet class dataset is missing/incorrect for some scores
          const ps47261 = students.find(s => s.id === 'PS47261');
          if (ps47261) {
            ps47261.scores['Giáo dục quốc phòng'] = 6.0;
            ps47261.scores['Chính trị'] = 10.0;
          }
          
          console.log(`👥 Parsed ${students.length} unique students successfully`);
          
          // Save training data
          const configPath = path.join(__dirname, 'training_data.json');
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          
          config.students = students;
          config.subjects = subjectNames;
          config.totalStudents = students.length;
          config.lastUpdated = new Date().toISOString().split('T')[0];
          
          fs.writeFileSync(
            configPath,
            JSON.stringify(config, null, 2),
            'utf8'
          );
          console.log('✅ Saved cleaned dataset to training_data.json');
          
          // PRE-TRAIN MODELS & CACHE (Batch Processing to avoid event loop blocking)
          console.log('🚀 Pre-training regression models for all curriculum subjects...');
          const modelCache = {};
          
          subjectNames.forEach(target => {
            const prereqs = getPrerequisites(target, config);
            
            // Build pre-computed models
            const model = weightedPrediction(prereqs, target, students);
            
            if (model.topFeatures && model.topFeatures.length > 0) {
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
          
          const cachePath = path.join(__dirname, 'model_cache.json');
          const trainedModelPath = path.join(__dirname, '..', 'ai', 'models', 'regression', 'trained_model.json');
          fs.writeFileSync(cachePath, JSON.stringify(modelCache, null, 2), 'utf8');
          fs.writeFileSync(trainedModelPath, JSON.stringify(modelCache, null, 2), 'utf8');
          console.log(`⚡ Pre-trained cache saved to model_cache.json and trained_model.json (${Object.keys(modelCache).length} models)`);
          
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

fetchAndParse()
  .then(() => {
    console.log('🎉 Done loading and pre-training EduGuard AI dataset!');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error during database training:', e.message);
    process.exit(1);
  });
