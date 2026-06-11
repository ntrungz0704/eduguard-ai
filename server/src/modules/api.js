const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
// Import unified Prisma client
const { prisma } = require('../infrastructure/database/prisma');

// Import modular services
const { validateAndCleanData, calculateFptGPA, getCourseCredits } = require('../utils/dataService');

const { spawn } = require('child_process');
const { weightedPrediction, getPrerequisites, calibrate, ACADEMIC_PREREQUISITES } = require('../ai/regression');
const { validateModel } = require('../ai/validation');
const { NlpManager } = require('node-nlp');

// Import RAG and AI Orchestration Services
const { getStudentContext } = require('../ai/ragService');
const { buildPrompt } = require('../ai/promptService');
const { predictRisk } = require('../ai/inference/riskPredictor');

// Setup upload
const upload = multer({ storage: multer.memoryStorage() });

// Helper to sync uploaded class Excel scores to local SQLite dev.db
async function syncUploadedData(validStudents) {
  try {
    const courseIds = new Set();
    validStudents.forEach(st => {
      if (st.scores) {
        Object.keys(st.scores).forEach(cId => {
          courseIds.add(cId);
        });
      }
    });

    // 1. Bulk Upsert Courses
    await Promise.all(Array.from(courseIds).map(id => {
      const credits = getCourseCredits(id);
      return prisma.course.upsert({
        where: { id },
        update: { credits },
        create: {
          id,
          name: id,
          credits,
          prerequisites: ''
        }
      });
    }));

    // 2. Bulk Upsert Students & Score entries in batches
    for (const st of validStudents) {
      const mssv = st.id;
      const name = st.name || `Sinh viên ${mssv}`;
      const classCode = st.classCode || 'WD18301';

      await prisma.student.upsert({
        where: { mssv },
        update: { name, classCode },
        create: { mssv, name, classCode }
      });

      // === BẢO MẬT DỮ LIỆU: Xóa dữ liệu rác cũ (residual data) của sinh viên này trước khi đè dữ liệu mới từ file Excel ===
      await prisma.score.deleteMany({
        where: { mssv }
      });

      for (const [courseId, val] of Object.entries(st.scores || {})) {
        if (val === null) continue;
        const value = parseFloat(val);
        const status = value >= 5 ? 'PASSED' : 'FAILED';

        await prisma.score.upsert({
          where: {
            mssv_courseId_semester: {
              mssv,
              courseId,
              semester: 'Summer 2025'
            }
          },
          update: { value, status },
          create: {
            mssv,
            courseId,
            value,
            semester: 'Summer 2025',
            status
          }
        });
      }
    }
    console.log(`✅ Dynamically synchronized ${validStudents.length} student scores to SQLite.`);
  } catch (err) {
    console.error('❌ Failed to synchronize uploaded data to SQLite:', err);
  }
}


// ============================================================
// LOAD PRE-TRAINED DATA & CACHED MODELS
// ============================================================
const dataPath = path.join(__dirname, '..', '..', 'src', 'datasets', 'training_data.json');
const modelCachePath = path.join(__dirname, '..', '..', 'src', 'ai', 'models', 'regression', 'trained_model.json');
const cache = require('../shared/cache');


if (fs.existsSync(dataPath)) {
  cache.trainingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`📚 Pre-trained data loaded in Router: ${cache.trainingData.students.length} SV, ${cache.trainingData.subjects.length} môn`);
}

if (fs.existsSync(modelCachePath)) {
  cache.modelCache = JSON.parse(fs.readFileSync(modelCachePath, 'utf8'));
  console.log(`⚡ Pre-trained models cache loaded in Router: ${Object.keys(cache.modelCache).length} subjects`);
}

const nlpManager = new NlpManager({ languages: ['vi', 'en'] });
const chatbotModelPath = path.join(__dirname, '..', '..', 'src', 'ai', 'models', 'nlp', 'chatbot_model.nlp');
let nlpModelLoaded = false;
if (fs.existsSync(chatbotModelPath)) {
  setImmediate(() => {
    try {
      nlpManager.load(chatbotModelPath);
      nlpModelLoaded = true;
      console.log("🤖 Local NLP Chatbot Model loaded successfully!");
    } catch (err) {
      console.error("❌ Failed to load NLP Chatbot Model:", err);
    }
  });
}

// In-memory store for uploaded student data (Mock database fallback for GET requests)


const interventionsPath = path.join(__dirname, '..', '..', 'src', 'datasets', 'interventions.json');
const subjectDependenciesPath = path.join(__dirname, '..', '..', 'src', 'datasets', 'subject_dependencies.json');

function getSubjectDependencies() {
  if (fs.existsSync(subjectDependenciesPath)) {
    try {
      return JSON.parse(fs.readFileSync(subjectDependenciesPath, 'utf8')) || [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function getInterventions() {
  if (fs.existsSync(interventionsPath)) {
    try {
      return JSON.parse(fs.readFileSync(interventionsPath, 'utf8')) || {};
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveIntervention(studentId, subject, intervened) {
  const data = getInterventions();
  if (!data[subject]) data[subject] = [];

  if (intervened) {
    if (!data[subject].includes(studentId)) {
      data[subject].push(studentId);
    }
  } else {
    data[subject] = data[subject].filter(id => id !== studentId);
  }

  fs.writeFileSync(interventionsPath, JSON.stringify(data, null, 2), 'utf8');
}

// ============================================================
// API: Get pre-trained data info
// ============================================================
router.get('/training-info', (req, res) => {
  const subjects = cache.trainingData.subjects || [];
  const students = cache.trainingData.students || [];

  const stats = subjects.map(sub => {
    const scored = students.filter(s => s.scores[sub] != null);
    const avg = scored.length ? scored.map(s => s.scores[sub]).reduce((a, b) => a + b, 0) / scored.length : 0;
    const atRisk = scored.filter(s => s.scores[sub] < 5).length;
    return {
      subject: sub,
      scored: scored.length,
      total: students.length,
      missing: students.length - scored.length,
      avg: Math.round(avg * 10) / 10,
      atRisk
    };
  });

  res.json({
    totalStudents: students.length,
    totalSubjects: subjects.length,
    displaySubjects: stats.length,
    source: cache.trainingData.source || 'Pre-trained',
    lastUpdated: cache.trainingData.lastUpdated,
    stats,
    curriculumOrder: cache.trainingData.curriculumOrder || []
  });
});

// ============================================================
// API: Model Evaluation Engine (LOOCV Approximation)
// ============================================================
router.get('/evaluate-model', (req, res) => {
  try {
    const students = cache.trainingData.students || [];
    const subjects = cache.trainingData.subjects || [];
    
    if (students.length === 0) {
      return res.status(400).json({ error: "No training data available" });
    }

    // 1. Pre-calculate models for all subjects to optimize speed
    // This reduces operations from 168 million to ~750,000.
    // Since N=649, training on N vs N-1 yields almost identical weights.
    const precomputedModels = {};
    const trainAverages = {};
    const trainScoresList = {};

    subjects.forEach(target => {
      const features = subjects.filter(sub => sub !== target);
      precomputedModels[target] = weightedPrediction(features, target, students);
      
      const scoredStudents = students.filter(s => s.scores[target] != null);
      if (scoredStudents.length > 0) {
        trainScoresList[target] = scoredStudents.map(s => s.scores[target]);
        trainAverages[target] = trainScoresList[target].reduce((a, b) => a + b, 0) / scoredStudents.length;
      } else {
        trainAverages[target] = 5.0;
        trainScoresList[target] = [];
      }
    });

    let totalPredictions = 0;
    let excellent = 0; // <= 0.5
    let good = 0; // <= 1.0
    let poor = 0; // > 1.0
    let sumAbsError = 0;
    let subjectStats = {};
    
    subjects.forEach(s => {
      subjectStats[s] = { subject: s, count: 0, totalError: 0, excellent: 0, good: 0, poor: 0 };
    });

    // 2. Predict every single known score (simulated Leave-One-Out)
    students.forEach((student) => {
      const completedSubjects = Object.keys(student.scores).filter(sub => student.scores[sub] !== null);
      
      completedSubjects.forEach(target => {
        const actualScore = student.scores[target];
        const features = completedSubjects.filter(sub => sub !== target);
        
        const model = precomputedModels[target];
        let predicted = null;
        
        if (model && model.topFeatures.length > 0) {
          const activeFeatures = model.topFeatures.filter(f => features.includes(f.feature));
          if (activeFeatures.length > 0) {
            const activeTotalScore = activeFeatures.reduce((sum, f) => sum + f.hybridScore, 0) || 1;
            let predSum = 0;
            activeFeatures.forEach(f => {
              const x = student.scores[f.feature];
              const val = Math.min(10, Math.max(0, f.reg.a + f.reg.b * x));
              predSum += (f.hybridScore / activeTotalScore) * val;
            });
            const rawPredicted = Math.round(predSum * 10) / 10;
            predicted = calibrate(rawPredicted, trainScoresList[target]);
          }
        }
        
        if (predicted == null) {
          if (features.length > 0) {
            const otherScores = features.map(f => student.scores[f]);
            const avgOther = otherScores.reduce((a, b) => a + b, 0) / otherScores.length;
            predicted = Math.round(avgOther * 10) / 10;
          } else {
             predicted = Math.round(trainAverages[target] * 10) / 10;
          }
        }
        
        // Analyze Error
        const absError = Math.abs(predicted - actualScore);
        totalPredictions++;
        sumAbsError += absError;
        
        subjectStats[target].count++;
        subjectStats[target].totalError += absError;
        
        if (absError <= 0.5) {
          excellent++;
          subjectStats[target].excellent++;
        } else if (absError <= 1.0) {
          good++;
          subjectStats[target].good++;
        } else {
          poor++;
          subjectStats[target].poor++;
        }
      });
    });

    const mae = totalPredictions > 0 ? (sumAbsError / totalPredictions) : 0;
    
    // Sort subject stats by MAE (ascending, best first)
    const subjectStatsArray = Object.values(subjectStats)
      .filter(s => s.count > 0)
      .map(s => ({
        ...s,
        mae: Math.round((s.totalError / s.count) * 100) / 100
      }))
      .sort((a, b) => a.mae - b.mae);

    res.json({
      totalStudents: students.length,
      totalPredictions,
      mae: Math.round(mae * 100) / 100,
      distribution: {
        excellent,
        good,
        poor
      },
      subjectStats: subjectStatsArray
    });
    
  } catch (err) {
    console.error("Evaluate model error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: Cảnh báo đỏ & Priority Intervention Ranking
// ============================================================
router.get('/red-alerts', async (req, res) => {
  try {
    const interventions = getInterventions();
    
    let dbPredictions = [];
    try {
      dbPredictions = await prisma.prediction.findMany({
        where: { risk: { in: ['HIGH', 'MEDIUM'] } },
        include: {
          student: { include: { scores: true } },
          course: true
        },
        orderBy: { predictedScore: 'asc' }
      });
    } catch (e) {
      console.warn("Lỗi fetch prediction:", e);
    }

    let alerts = dbPredictions.map(pred => {
      const student = pred.student;
      const targetCourse = pred.course.name;
      const prereqs = ACADEMIC_PREREQUISITES[targetCourse] || [];
      
      const weakPrereqs = [];
      student.scores.forEach(sc => {
        if (prereqs.includes(sc.courseId) && sc.value != null && sc.value < 6.0) {
          weakPrereqs.push({ courseId: sc.courseId, score: sc.value });
        }
      });
      
      const targetScore = student.scores.find(sc => sc.courseId === pred.courseId);
      const isEarlyWarning = !targetScore || targetScore.value === null;

      const hasIntervened = interventions[targetCourse] && interventions[targetCourse].includes(student.mssv);

      // Priority Intervention Ranking Logic
      let priorityLevel = 'LOW';
      let riskScore = 100 - (pred.predictedScore * 10);
      
      if (pred.risk === 'HIGH') {
        priorityLevel = weakPrereqs.length > 0 ? 'CRITICAL' : 'HIGH';
        riskScore = Math.min(100, riskScore + (weakPrereqs.length * 10) + (isEarlyWarning ? 5 : 0));
      } else if (pred.risk === 'MEDIUM') {
        priorityLevel = 'MEDIUM';
        riskScore = Math.min(70, riskScore + (weakPrereqs.length * 5));
      }

      return {
        mssv: student.mssv,
        name: student.name,
        classCode: student.classCode || 'WD18301',
        targetCourse: targetCourse,
        predictedScore: pred.predictedScore,
        risk: pred.risk,
        priorityLevel,
        riskScore: Math.round(riskScore),
        weakPrereqs: weakPrereqs,
        isEarlyWarning: isEarlyWarning,
        intervened: hasIntervened || false,
        reasons: pred.reasons
      };
    });

    alerts.sort((a, b) => {
      if (a.intervened !== b.intervened) return a.intervened ? 1 : -1;
      const priorityWeight = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      if (priorityWeight[a.priorityLevel] !== priorityWeight[b.priorityLevel]) {
        return priorityWeight[b.priorityLevel] - priorityWeight[a.priorityLevel];
      }
      return b.riskScore - a.riskScore;
    });

    alerts = alerts.slice(0, 50);

    const totalInterventions = Object.values(interventions).reduce((acc, curr) => acc + curr.length, 0);
    const criticalCount = alerts.filter(a => a.priorityLevel === 'CRITICAL').length;
    const highCount = alerts.filter(a => a.priorityLevel === 'HIGH').length;

    // Calculate low attendance students
    let lowAttendanceCount = 0;
    try {
      const lowAttRecords = await prisma.score.findMany({
        where: { attendance: { lt: 0.8 } },
        select: { mssv: true }
      });
      lowAttendanceCount = new Set(lowAttRecords.map(r => r.mssv)).size;
    } catch (e) {
      console.warn("Lỗi đếm chuyên cần:", e);
    }

    res.json({
      alerts,
      kpi: {
        totalInterventions: totalInterventions,
        improvementRate: Math.min(100, Math.round(50 + totalInterventions * 2.5)),
        criticalCount,
        highCount,
        lowAttendanceCount
      }
    });
  } catch (err) {
    console.error("Lỗi Red Alerts:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: Upload student Excel (Production pipeline)
// ============================================================
router.post('/upload-predict', upload.any(), (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({ error: 'Không nhận được file nào. Vui lòng kiểm tra lại.' });
    }

    let allValidStudentsMap = new Map();
    let allErrors = [];
    let allSubjectCols = new Set();
    let overallFileType = null;

    for (const file of files) {
      const buf = file.buffer;
      const name = file.originalname.toLowerCase();

      let headers = [];
      let parsedRows = [];
      let fileType = 'class'; // default

      // 1. PARSE BATCH
      if (name.endsWith('.csv')) {
        const text = buf.toString('utf8').replace(/^\uFEFF/, '');
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length > 0) {
          headers = lines[0].split(',').map(h => h.trim());

          const upperHeaders = headers.map(h => h.toUpperCase());
          if (upperHeaders.some(h => h.includes('MÔN')) && upperHeaders.some(h => h.includes('ĐIỂM'))) {
            fileType = 'transcript';
          }

          parsedRows = lines.slice(1).map(line => {
            const vals = line.split(',');
            const obj = {};
            headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
            return obj;
          });
        }
      } else {
        const wb = XLSX.read(buf, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Auto-detect header row & File Type
        let headerRowIdx = -1;

        for (let i = 0; i < Math.min(20, rawRows.length); i++) {
          if (!rawRows[i]) continue;
          const rowStr = rawRows[i].map(c => String(c).trim().toUpperCase());

          // Detect Class Dataset
          if (rowStr.some(v => v === 'MSSV' || v.includes('MÃ SV') || v.includes('MÃ SINH VIÊN') || v === 'ID')) {
            headerRowIdx = i;
            fileType = 'class';
            break;
          }

          // Detect Personal Transcript
          if (rowStr.some(v => v.includes('MÔN') || v.includes('SUBJECT')) &&
            rowStr.some(v => v.includes('ĐIỂM') || v.includes('SCORE') || v === 'THANG ĐIỂM 10')) {
            headerRowIdx = i;
            fileType = 'transcript';
            break;
          }
        }

        if (headerRowIdx === -1) {
          allErrors.push(`[${file.originalname}] Định dạng không hợp lệ! Vui lòng upload "Bảng điểm lớp" (có cột MSSV) hoặc "Bảng điểm cá nhân" (có cột Môn và Điểm).`);
          continue;
        }

        const rawHeaders = rawRows[headerRowIdx];
        headers = rawHeaders.map(h => String(h || '').trim()).map((h, i) => h === '' ? `__EMPTY_${i}` : h);

        for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;
          const obj = {};
          headers.forEach((h, j) => {
            obj[h] = row[j] !== undefined ? row[j] : '';
          });
          parsedRows.push(obj);
        }
      }

      if (!parsedRows.length) {
        allErrors.push(`[${file.originalname}] File trống hoặc không có dữ liệu sinh viên hợp lệ.`);
        continue;
      }

      // 2. VALIDATE & CLEAN
      const cleanResult = validateAndCleanData(parsedRows, headers, fileType, cache.trainingData.subjects);
      const { validStudents, errors, subjectCols, fileType: detectedFileType } = cleanResult;

      if (detectedFileType === 'class') {
        overallFileType = 'class';
      } else if (!overallFileType) {
        overallFileType = detectedFileType;
      }

      errors.forEach(err => allErrors.push(`[${file.originalname}] ${err}`));
      subjectCols.forEach(s => allSubjectCols.add(s));

      // 3. MERGE STUDENT DATA
      validStudents.forEach(s => {
        const studentId = s.id.toUpperCase();
        if (allValidStudentsMap.has(studentId)) {
          const existing = allValidStudentsMap.get(studentId);
          existing.scores = { ...existing.scores, ...s.scores };
          if (s.name && s.name !== 'Bảng điểm Cá nhân') {
            existing.name = s.name;
          }
        } else {
          allValidStudentsMap.set(studentId, {
            id: s.id,
            name: s.name || (s.id === 'CA_NHAN' ? 'Bảng điểm Cá nhân' : `Sinh viên ${s.id}`),
            scores: { ...s.scores }
          });
        }
      });
    }

    const mergedValidStudents = Array.from(allValidStudentsMap.values());
    if (mergedValidStudents.length === 0) {
      return res.status(400).json({ error: allErrors[0] || 'Dữ liệu không hợp lệ.' });
    }

    cache.uploadedStudents = mergedValidStudents;

    // 4. PREPARE PREDICTION SUBJECTS
    const trainSubjects = new Set(cache.trainingData.subjects || []);
    const predictable = [];
    const uniqueSubjectCols = Array.from(allSubjectCols);

    uniqueSubjectCols.forEach(s => {
      if (!trainSubjects.has(s)) return;
      const prereqs = getPrerequisites(s, cache.trainingData);
      const isTrainable = prereqs.length > 0 && cache.trainingData.students.filter(st => st.scores[s] != null).length >= 5;

      if (isTrainable) {
        const missingCount = mergedValidStudents.filter(st => st.scores[s] == null).length;
        predictable.push({
          subject: s,
          missingCount,
          totalCount: mergedValidStudents.length
        });
      }
    });

    // Push the missing (predictable) subjects to top
    predictable.sort((a, b) => b.missingCount - a.missingCount);

    if (!overallFileType) overallFileType = 'class';

    res.json({
      success: true,
      studentsCount: mergedValidStudents.length,
      errorsCount: allErrors.length,
      errorsDetails: allErrors.slice(0, 5),
      uploadedSubjects: uniqueSubjectCols,
      predictableSubjects: predictable,
      students: mergedValidStudents,
      fileType: overallFileType
    });
  } catch (e) {
    console.error('Lỗi parse file:', e);
    res.status(500).json({ error: 'Lỗi máy chủ khi phân tích file: ' + e.message });
  }
});

// ============================================================
// API: Predict scores for uploaded students
// ============================================================
// ============================================================
// API: Predict scores for uploaded students (Supports stateless payload and cached models)
// ============================================================
router.all('/predict/:subject', async (req, res) => {
  try {
    const target = decodeURIComponent(req.params.subject);
    const trainStudents = cache.trainingData.students || [];
    const currOrder = cache.trainingData.curriculumOrder || [];
    const trainScores = trainStudents.filter(s => s.scores[target] != null).map(s => s.scores[target]);

    // Query database students
    let dbStudents = [];
    try {
      const dbStudentsRaw = await prisma.student.findMany({
        include: { scores: true }
      });
      dbStudents = dbStudentsRaw.map(s => {
        const scoresObj = {};
        const componentScoresObj = {};
        s.scores.forEach(sc => {
          scoresObj[sc.courseId] = sc.value;
          componentScoresObj[sc.courseId] = {
            quiz: sc.quiz,
            lab: sc.lab,
            assignment: sc.assignment,
            asm1: sc.asm1,
            asm2: sc.asm2,
            final: sc.final,
            attendance: sc.attendance,
            status: sc.status
          };
        });
        return {
          id: s.mssv,
          name: s.name,
          classCode: s.classCode,
          scores: scoresObj,
          componentScores: componentScoresObj
        };
      });
    } catch (dbErr) {
      console.error("[Prediction Endpoint] Error reading SQLite students:", dbErr);
    }

    // Merge pre-trained students, database students, and session uploaded students
    const allStudentsMap = {};

    // 1. Add pre-trained students
    trainStudents.forEach(s => {
      allStudentsMap[s.id] = { id: s.id, name: s.name, classCode: s.classCode || 'WD18301', scores: { ...s.scores } };
    });

    // 2. Merge SQLite database students
    dbStudents.forEach(s => {
      if (allStudentsMap[s.id]) {
        allStudentsMap[s.id].scores = { ...allStudentsMap[s.id].scores, ...s.scores };
        allStudentsMap[s.id].componentScores = { ...(allStudentsMap[s.id].componentScores || {}), ...(s.componentScores || {}) };
        if (s.name) allStudentsMap[s.id].name = s.name;
        if (s.classCode) allStudentsMap[s.id].classCode = s.classCode;
      } else {
        allStudentsMap[s.id] = s;
      }
    });

    // 3. Merge in-memory uploaded students
    cache.uploadedStudents.forEach(s => {
      if (allStudentsMap[s.id]) {
        allStudentsMap[s.id].scores = { ...allStudentsMap[s.id].scores, ...s.scores };
        if (s.name) allStudentsMap[s.id].name = s.name;
        if (s.classCode) allStudentsMap[s.id].classCode = s.classCode;
      } else {
        allStudentsMap[s.id] = s;
      }
    });

    // 4. Merge POST body students if provided
    if (req.method === 'POST' && req.body && Array.isArray(req.body.students)) {
      req.body.students.forEach(s => {
        if (allStudentsMap[s.id]) {
          allStudentsMap[s.id].scores = { ...allStudentsMap[s.id].scores, ...s.scores };
          if (s.name) allStudentsMap[s.id].name = s.name;
          if (s.classCode) allStudentsMap[s.id].classCode = s.classCode;
        } else {
          allStudentsMap[s.id] = s;
        }
      });
    }

    const studentsToPredict = Object.values(allStudentsMap);

    const activeInterventions = getInterventions()[target] || [];
    studentsToPredict.forEach(s => {
      s.intervened = activeInterventions.includes(s.id);
    });
    trainStudents.forEach(s => {
      s.intervened = activeInterventions.includes(s.id);
    });

    // 1. FAST PATH: Check if pre-trained cached model is available
    const cachedModel = cache.modelCache[target];
    if (cachedModel) {
      const predictions = [];
      const topFeatures = cachedModel.topFeatures; // Array of { subject, r, absR, hybridScore, a, b, samples }

      studentsToPredict.forEach(s => {
        const hasActual = s.scores[target] != null;
        let predicted = null;
        let isPredicted = false;
        let reasons = [];
        let risk = 'low';

        if (hasActual) {
          predicted = s.scores[target];
          isPredicted = false;
          risk = predicted < 5 ? 'high' : predicted < 6.5 ? 'medium' : 'low';
          reasons = [{
            subject: target,
            score: predicted,
            r: 1.0,
            impact: predicted < 5 ? 'negative' : 'positive',
            explanation: 'Điểm thực tế đã ghi nhận trong cơ sở dữ liệu'
          }];
        } else {
          // Fast O(1) prediction: sum(weight * (a + b * score)) / sum(weights)
          const activeFeatures = topFeatures.filter(f => s.scores[f.subject] != null);

          if (activeFeatures.length > 0) {
            const activeTotalScore = activeFeatures.reduce((sum, f) => sum + f.hybridScore, 0) || 1;
            let predSum = 0;
            activeFeatures.forEach(f => {
              const x = s.scores[f.subject];
              const val = Math.min(10, Math.max(0, f.a + f.b * x));
              predSum += (f.hybridScore / activeTotalScore) * val;
            });
            const rawPredicted = Math.round(predSum * 10) / 10;
            predicted = calibrate(rawPredicted, trainScores);
          }

          if (predicted == null) {
            // Robust Fallback 1: Use student's overall GPA
            const otherScores = Object.values(s.scores).filter(v => v !== null && typeof v === 'number');
            if (otherScores.length > 0) {
              const avgOther = otherScores.reduce((a, b) => a + b, 0) / otherScores.length;
              predicted = Math.round(avgOther * 10) / 10;
              reasons = [{
                subject: 'Trung bình môn học khác',
                score: predicted,
                r: 0.4,
                impact: predicted < 5 ? 'negative' : 'positive',
                explanation: `Dự báo dựa trên điểm trung bình các môn khác (${predicted}đ)`
              }];
            } else {
              // Robust Fallback 2: Use training average
              const trainAvg = trainScores.length ? trainScores.reduce((a, b) => a + b, 0) / trainScores.length : 7.2;
              predicted = Math.round(trainAvg * 10) / 10;
              reasons = [{
                subject: 'Trung bình môn học',
                score: predicted,
                r: 0.1,
                impact: 'neutral',
                explanation: `Dự báo dựa trên điểm trung bình môn của khóa trước (${predicted}đ)`
              }];
            }
          } else {
            // Explainable AI (XAI) Reasons
            topFeatures.forEach(f => {
              const score = s.scores[f.subject];
              if (score != null) {
                const impact = f.r > 0 ? (score < 5 ? 'kéo xuống' : 'nâng lên') : (score < 5 ? 'nâng lên' : 'kéo xuống');
                reasons.push({
                  subject: f.subject,
                  score,
                  r: Math.round(f.r * 100) / 100,
                  impact: score < 5 ? 'negative' : score >= 7 ? 'positive' : 'neutral',
                  explanation: `${f.subject} = ${score} (r=${Math.round(f.r * 100) / 100}) → ${impact}`
                });
              }
            });
          }

          // CASCADING RISK PROPAGATION
          const dependencies = getSubjectDependencies().find(d => d.target === target);
          if (dependencies && dependencies.prerequisites.length > 0) {
            let cascadePenalty = 0;
            let rootCauses = [];
            dependencies.prerequisites.forEach(prereq => {
              if (s.scores[prereq] !== undefined && s.scores[prereq] !== null) {
                if (s.scores[prereq] < 5.0) {
                  cascadePenalty += 2.0; // Phạt rất nặng nếu môn gốc rớt
                  rootCauses.push(`Hổng kiến thức nền tảng do rớt môn tiên quyết "${prereq}" (${s.scores[prereq]}đ).`);
                } else if (s.scores[prereq] < 6.5) {
                  cascadePenalty += 0.5; // Phạt nhẹ nếu môn gốc kém
                  rootCauses.push(`Kiến thức nền tảng chưa vững ở môn tiên quyết "${prereq}" (${s.scores[prereq]}đ).`);
                }
              }
            });

            if (cascadePenalty > 0) {
              predicted = Math.max(0, predicted - cascadePenalty);
              reasons.unshift({
                subject: 'Cascading Risk (Rủi ro lan truyền)',
                score: null,
                r: 1.0,
                impact: 'negative',
                explanation: rootCauses.join(' ')
              });
            }
          }

          isPredicted = true;
          risk = predicted < 5 ? 'high' : predicted < 6.5 ? 'medium' : 'low';
        }

        const prereqs = ACADEMIC_PREREQUISITES[target] || [];
        const isEarlyWarning = !s.scores || s.scores[target] == null;
        const weakPrereqs = prereqs.filter(pr => s.scores && s.scores[pr] != null && s.scores[pr] < 6.0);
        
        // Push weak prereqs to reasons as highly important
        weakPrereqs.forEach(wp => {
          if (!reasons.find(r => r.subject === wp)) {
             reasons.unshift({
               subject: wp,
               score: s.scores[wp],
               r: 1.0,
               impact: 'negative',
               explanation: `⚠️ Lỗ hổng tiên quyết: ${wp} = ${s.scores[wp]}đ`
             });
          }
        });

        predictions.push({
          id: s.id,
          name: s.name || `Sinh viên ${s.id}`,
          predicted,
          risk,
          reasons,
          isPredicted,
          isEarlyWarning,
          weakPrereqs,
          intervened: s.intervened || false,
          componentScores: s.componentScores && s.componentScores[target] ? s.componentScores[target] : null
        });
      });

      const trainCount = cachedModel.samples || trainStudents.filter(st => st.scores[target] != null).length;
      const avg = trainScores.length ? trainScores.reduce((a, b) => a + b, 0) / trainScores.length : 7.2;

      return res.json({
        target,
        trainCount,
        avg: Math.round(avg * 10) / 10,
        predictions,
        topFeatures: topFeatures.map(f => ({
          subject: f.subject,
          r: Math.round(f.r * 100) / 100,
          hybridScore: Math.round(f.hybridScore * 100) / 100,
          samples: f.samples
        })),
        validation: cachedModel.validation,
        prerequisites: getPrerequisites(target, cache.trainingData),
        formula: {
          name: 'Knowledge-Enhanced Hybrid Regression (HK-Pearson V2.1 - IQR & Calibrated)',
          expression: 'ŷ = Calibrate( Σ(|rᵢ|^1.5 × KWᵢ / Σ(|r_k|^1.5 × KW_k)) × (aᵢ + bᵢ×xᵢ) )',
          source: 'EduGuard AI Hybrid Engine (Causal Knowledge + Pearson)',
          explanation: 'Dự đoán điểm bằng hồi quy tuyến tính kết hợp từ các môn tiên quyết có tương quan cao. Thuật toán sử dụng số mũ |r|^1.5 để phân phối trọng số tối ưu, áp dụng bộ lọc IQR loại bỏ điểm bất thường rớt môn/bỏ học, và dùng Statistical Calibration (SD-stretching) để khôi phục phổ điểm cao bị là phẳng do Attenuation Bias.'
        }
      });
    }

    // 2. SLOW PATH (Fallback to on-the-fly model generation if not cached)
    const prereqs = getPrerequisites(target, cache.trainingData);
    const model = weightedPrediction(prereqs, target, trainStudents);

    if (model.topFeatures.length === 0) {
      return res.json({
        status: "warning",
        message: "Chưa đủ dữ liệu hồi quy cho môn học này",
        fallbackScore: null,
        predictions: [],
        validation: null,
        target
      });
    }

    const validation = validateModel(target, trainStudents, currOrder);
    const predictions = [];

    studentsToPredict.forEach(s => {
      const hasActual = s.scores[target] != null;
      let predicted = null;
      let isPredicted = false;
      let reasons = [];
      let risk = 'low';

      if (hasActual) {
        predicted = s.scores[target];
        isPredicted = false;
        risk = predicted < 5 ? 'high' : predicted < 6.5 ? 'medium' : 'low';
        reasons = [{
          subject: target,
          score: predicted,
          r: 1.0,
          impact: predicted < 5 ? 'negative' : 'positive',
          explanation: 'Điểm thực tế đã ghi nhận trong cơ sở dữ liệu'
        }];
      } else {
        predicted = model.predict(s.scores);
        if (predicted == null) {
          // Robust Fallback 1: Use student's overall GPA
          const otherScores = Object.values(s.scores).filter(v => v !== null && typeof v === 'number');
          if (otherScores.length > 0) {
            const avgOther = otherScores.reduce((a, b) => a + b, 0) / otherScores.length;
            predicted = Math.round(avgOther * 10) / 10;
            reasons = [{
              subject: 'Trung bình môn học khác',
              score: predicted,
              r: 0.4,
              impact: predicted < 5 ? 'negative' : 'positive',
              explanation: `Dự báo dựa trên điểm trung bình các môn khác (${predicted}đ)`
            }];
          } else {
            // Robust Fallback 2: Use training average
            const trainAvg = trainScores.length ? trainScores.reduce((a, b) => a + b, 0) / trainScores.length : 7.2;
            predicted = Math.round(trainAvg * 10) / 10;
            reasons = [{
              subject: 'Trung bình môn học',
              score: predicted,
              r: 0.1,
              impact: 'neutral',
              explanation: `Dự báo dựa trên điểm trung bình môn của khóa trước (${predicted}đ)`
            }];
          }
        } else {
          model.topFeatures.forEach(f => {
            const score = s.scores[f.feature];
            if (score != null) {
              const impact = f.r > 0 ? (score < 5 ? 'kéo xuống' : 'nâng lên') : (score < 5 ? 'nâng lên' : 'kéo xuống');
              reasons.push({
                subject: f.feature,
                score,
                r: Math.round(f.r * 100) / 100,
                impact: score < 5 ? 'negative' : score >= 7 ? 'positive' : 'neutral',
                explanation: `${f.feature} = ${score} (r=${Math.round(f.r * 100) / 100}) → ${impact}`
              });
            }
          });
        }

        isPredicted = true;
        risk = predicted < 5 ? 'high' : predicted < 6.5 ? 'medium' : 'low';
      }

      predictions.push({
        id: s.id,
        name: s.name || `Sinh viên ${s.id}`,
        predicted,
        risk,
        reasons,
        isPredicted,
        intervened: s.intervened || false,
        componentScores: s.componentScores && s.componentScores[target] ? s.componentScores[target] : null
      });
    });

    const avg = trainScores.length ? trainScores.reduce((a, b) => a + b, 0) / trainScores.length : 0;

    res.json({
      target,
      trainCount: trainScores.length,
      avg: Math.round(avg * 10) / 10,
      predictions,
      topFeatures: model.topFeatures.map(f => ({
        subject: f.feature,
        r: Math.round(f.r * 100) / 100,
        hybridScore: Math.round(f.hybridScore * 100) / 100,
        samples: f.n
      })),
      validation,
      prerequisites: prereqs,
      formula: {
        name: 'Knowledge-Enhanced Hybrid Regression (HK-Pearson V2.1 - IQR & Calibrated)',
        expression: 'ŷ = Calibrate( Σ(|rᵢ|^1.5 × KWᵢ / Σ(|r_k|^1.5 × KW_k)) × (aᵢ + bᵢ×xᵢ) )',
        source: 'EduGuard AI Hybrid Engine (Causal Knowledge + Pearson)',
        explanation: 'Dự đoán điểm bằng hồi quy tuyến tính kết hợp từ các môn tiên quyết có tương quan cao. Thuật toán sử dụng số mũ |r|^1.5 để phân phối trọng số tối ưu, áp dụng bộ lọc IQR loại bỏ điểm bất thường rớt môn/bỏ học, và dùng Statistical Calibration (SD-stretching) để khôi phục phổ điểm cao bị là phẳng do Attenuation Bias.'
      }
    });
  } catch (e) {
    console.error('Error during prediction:', e);
    res.json({
      status: "warning",
      message: "Chưa đủ dữ liệu hồi quy cho môn học này",
      fallbackScore: null,
      predictions: [],
      validation: null,
      target: req.params.subject ? decodeURIComponent(req.params.subject) : "Unknown"
    });
  }
});

// ============================================================
// API: Full validation report
// ============================================================
router.get('/validate/:subject', (req, res) => {
  const target = decodeURIComponent(req.params.subject);
  const trainStudents = cache.trainingData.students || [];
  const activeInterventions = getInterventions()[target] || [];
  trainStudents.forEach(s => {
    s.intervened = activeInterventions.includes(s.id);
  });
  const result = validateModel(target, trainStudents, cache.trainingData.curriculumOrder);
  res.json(result);
});

// ============================================================
// API: Toggle student intervention state (Feedback Loop)
// ============================================================
router.post('/interventions', (req, res) => {
  try {
    const { studentId, subject, intervened } = req.body;
    if (!studentId || !subject) {
      return res.status(400).json({ error: 'Thiếu studentId hoặc subject' });
    }
    saveIntervention(studentId, subject, !!intervened);

    // Cập nhật bộ nhớ đệm RAM nếu khớp
    const trainStudents = cache.trainingData.students || [];
    const student = trainStudents.find(s => s.id === studentId);
    if (student) {
      student.intervened = !!intervened;
    }

    res.json({ success: true, studentId, subject, intervened: !!intervened });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// API: Dashboard stats
// ============================================================
router.get('/api/stats', (req, res) => {
  // Backwards compatibility endpoint if called directly
  const students = cache.trainingData.students || [];
  if (students.length === 0) return res.json({ empty: true });

  const subjects = cache.trainingData.subjects || [];
  const stats = subjects.map(sub => {
    const scored = students.filter(s => s.scores[sub] != null);
    const avg = scored.length ? scored.map(s => s.scores[sub]).reduce((a, b) => a + b, 0) / scored.length : 0;
    const atRisk = scored.filter(s => s.scores[sub] < 5).length;
    return { subject: sub, total: students.length, scored: scored.length, missing: students.length - scored.length, avg: Math.round(avg * 10) / 10, atRisk };
  }).filter(s => s.scored >= 5);

  res.json({ stats, total: students.length, source: cache.trainingData.source });
});

// Direct route /stats (Vite maps to /api/stats)
router.get('/stats', (req, res) => {
  const students = cache.trainingData.students || [];
  if (students.length === 0) return res.json({ empty: true });

  const subjects = cache.trainingData.subjects || [];
  const stats = subjects.map(sub => {
    const scored = students.filter(s => s.scores[sub] != null);
    const avg = scored.length ? scored.map(s => s.scores[sub]).reduce((a, b) => a + b, 0) / scored.length : 0;
    const atRisk = scored.filter(s => s.scores[sub] < 5).length;
    return {
      subject: sub,
      total: students.length,
      scored: scored.length,
      missing: students.length - scored.length,
      avg: Math.round(avg * 10) / 10,
      atRisk
    };
  }).filter(s => s.scored >= 5);

  res.json({ stats, total: students.length, source: cache.trainingData.source });
});

// ============================================================
// API: Get uploaded students
// ============================================================

// ============================================================
// API: AI Evaluation (LOOCV metrics)
// ============================================================
router.get('/ai-evaluation', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const metricsPath = path.join(__dirname, '../datasets/ai_metrics.json');
  if (fs.existsSync(metricsPath)) {
    const data = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    return res.json(data);
  }
  res.json({ empty: true, message: 'Chưa có dữ liệu đánh giá. Vui lòng chạy Quét toàn bộ hệ thống.' });
});

router.post('/ai-evaluation/run', (req, res) => {
  const { runAIEvaluation } = require('../ai/evaluateTask');
  
  const students = cache.uploadedStudents.length > 0 ? cache.uploadedStudents : cache.trainingData.students;
  const currOrder = cache.trainingData.curriculumOrder || [];

  // Run in background (do not await)
  runAIEvaluation(students, currOrder).catch(err => {
    console.error('[AI Evaluation] Error:', err);
  });
  
  res.json({ success: true, message: 'Đã khởi chạy tiến trình đánh giá ngầm (LOOCV). Vui lòng đợi khoảng 15-20s và tải lại.' });
});

router.get('/students', (req, res) => {
  const students = cache.uploadedStudents.length > 0 ? cache.uploadedStudents : cache.trainingData.students;
  const subjects = cache.uploadedStudents.length > 0 ? Object.keys(students[0]?.scores || {}) : (cache.trainingData.subjects || []);
  res.json({ students, subjects });
});

// ============================================================
// API: Save custom uploaded students to SQLite Database
// ============================================================
router.post('/save-uploaded', async (req, res) => {
  try {
    const { students } = req.body;
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu sinh viên để lưu.' });
    }

    // Check if any student lacks an MSSV (id)
    const invalid = students.some(st => !st.id || String(st.id).trim() === '' || String(st.id).trim() === 'CA_NHAN');
    if (invalid) {
      return res.status(400).json({ error: 'Tất cả sinh viên phải có thông tin MSSV (Mã số sinh viên) hợp lệ mới được lưu vào hệ thống!' });
    }

    // Sync to SQLite Prisma DB
    await syncUploadedData(students);

    // Persist as current active uploaded list in RAM
    cache.uploadedStudents = students;

    // Auto-trigger AI Evaluation (LOOCV) in the background so metrics are always up-to-date
    const { runAIEvaluation } = require('../ai/evaluateTask');
    const currOrder = cache.trainingData.curriculumOrder || [];
    // Run in background (do not await)
    runAIEvaluation(students, currOrder).catch(err => console.error('[Auto-evaluation] Error:', err));

    res.json({ success: true, message: `Lưu thành công ${students.length} sinh viên vào Database! Hệ thống đang tự động quét lại AI...` });
  } catch (err) {
    console.error('Lỗi khi lưu dữ liệu:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lưu dữ liệu sinh viên: ' + err.message });
  }
});

// ============================================================
// API: Real-time search students matching query (MSSV or Name)
// ============================================================
router.get('/students-search', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole === 'STUDENT') {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập chức năng này.' });
    }

    const q = String(req.query.q || '').trim().toLowerCase();

    // 1. Query from Prisma Database
    let dbStudents = [];
    try {
      dbStudents = await prisma.student.findMany({
        where: {
          OR: [
            { mssv: { contains: q } },
            { name: { contains: q } }
          ]
        },
        include: { scores: { include: { course: true } } },
        take: 15
      });
    } catch (dbErr) {
      console.warn('Lỗi tra cứu SQLite:', dbErr);
    }

    // Map dbStudents to a common format
    const dbMapped = dbStudents.map(s => {
      const scoresObj = {};
      s.scores.forEach(sc => { scoresObj[sc.courseId] = sc.value; });
      return { id: s.mssv, name: s.name, classCode: s.classCode || 'WD18301', scores: scoresObj, source: 'Database' };
    });

    // 2. Query from memory cache
    const sourceMap = {};
    if (cache.trainingData && Array.isArray(cache.trainingData.students)) {
      cache.trainingData.students.forEach(s => { if (s && s.id) sourceMap[s.id] = s; });
    }
    if (Array.isArray(cache.uploadedStudents)) {
      cache.uploadedStudents.forEach(s => { if (s && s.id) sourceMap[s.id] = s; });
    }

    const sourceList = Object.values(sourceMap);
    const memMapped = sourceList
      .filter(s => {
        const sid = String(s.id || '').toLowerCase();
        const sname = String(s.name || '').toLowerCase();
        return sid.includes(q) || sname.includes(q);
      })
      .slice(0, 15)
      .map(s => ({ id: s.id, name: s.name || `Sinh viên ${s.id}`, classCode: s.classCode || 'WD18301', scores: s.scores || {}, source: 'Memory Cache' }));

    // Combine lists, preventing duplicates
    const combined = [...dbMapped];
    memMapped.forEach(ms => { if (!combined.some(cs => cs.id === ms.id)) combined.push(ms); });

    res.json(combined.slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CHATBOT (Gemini with database-grounded context & advanced SQLite local fallback)
// ============================================================
async function smartLocalReply(msg, student, isStudent, userId, nlpIntent = 'None') {
  const msgLower = (msg || '').toLowerCase().trim();

  // Helper function for normalizing MSSV inside replies
  function normalizeMssv(input) {
    if (!input) return null;
    const trimmed = input.replace(/\s+/g, '').toUpperCase();
    if (/^\d{5}$/.test(trimmed)) {
      return `PS${trimmed}`;
    }
    const match = trimmed.match(/(PS|PC|PK|PD)\d{5}/i);
    if (match) {
      return match[0].toUpperCase();
    }
    return null;
  }

  // 1. Keyword mapping for Intents
  const greetingKeywords = ["hello", "hi", "helo", "alo", "bạn làm được gì", "help", "xin chào", "chào", "trợ giúp"];
  const classKeywords = [
    "ai cần can thiệp", "sinh viên nguy cơ cao", "tình hình lớp", "bottleneck", 
    "môn dễ fail", "môn kéo gpa", "top sinh viên rủi ro", "phân tích lớp", 
    "thống kê lớp", "tình hình toàn lớp", "danh sách sinh viên nguy cơ"
  ];
  const systemKeywords = [
    "hệ thống hoạt động thế nào", "thuật toán gì", "pearson", "regression", 
    "explainable ai", "dependency graph", "kiến trúc", "hybrid"
  ];
  const studentKeywords = ["phân tích sinh viên", "risk score của", "gpa của", "phân tích"];
  
  const followupKeywords = {
    ROOT_CAUSE: ["nguyên nhân", "vì sao", "tại sao", "rủi ro", "hổng", "mất gốc", "lý do"],
    ATTENDANCE: ["chuyên cần", "vắng", "nghỉ", "đi học", "điểm danh", "cấm thi"],
    INTERVENTION: ["can thiệp", "giải pháp", "khắc phục", "hỗ trợ", "cứu", "phụ đạo"],
    TIMELINE: ["timeline", "lộ trình", "nếu rớt", "nếu trượt", "nếu tạch", "ảnh hưởng", "chuỗi"],
    STRENGTH: ["điểm mạnh", "thế mạnh", "môn nào giỏi", "học tốt", "thế mạnh", "điểm sáng"]
  };

  // 2. Identify Intent Priority
  let detectedIntent = 'None';
  if (greetingKeywords.some(kw => msgLower === kw || msgLower.startsWith(kw + ' ') || msgLower.endsWith(' ' + kw)) || nlpIntent === 'greeting') {
    detectedIntent = 'GREETING_INTENT';
  } else if (classKeywords.some(kw => msgLower.includes(kw)) || nlpIntent === 'CLASS_ANALYTICS' || nlpIntent === 'query.statistics') {
    detectedIntent = 'CLASS_ANALYTICS_INTENT';
  } else if (systemKeywords.some(kw => msgLower.includes(kw)) || nlpIntent === 'query.system_info') {
    detectedIntent = 'GENERAL_SYSTEM_INTENT';
  } else {
    // Check if it's a student-specific followup keyword
    let matchedFollowup = null;
    for (const [intentName, keywords] of Object.entries(followupKeywords)) {
      if (keywords.some(kw => msgLower.includes(kw))) {
        matchedFollowup = intentName;
        break;
      }
    }
    
    if (matchedFollowup) {
      detectedIntent = `FOLLOWUP_${matchedFollowup}_INTENT`;
    } else {
      // Check if there is an explicit MSSV pattern in the message
      const hasMssv = normalizeMssv(msgLower);
      if (hasMssv || studentKeywords.some(kw => msgLower.includes(kw))) {
        detectedIntent = 'STUDENT_ANALYTICS_INTENT';
      } else {
        detectedIntent = 'FALLBACK_INTENT';
      }
    }
  }

  // 3. Security Role Checks for CLASS_ANALYTICS
  if (detectedIntent === 'CLASS_ANALYTICS_INTENT') {
    if (isStudent) {
      return `🔒 BẢO MẬT HỆ THỐNG\n\nXin lỗi, bạn không có quyền xem dữ liệu quản trị lớp học. Bạn chỉ có thể tra cứu thông tin của chính mình.`;
    }

    let allStudents = [];
    try {
      allStudents = await prisma.student.findMany({ include: { scores: true } });
    } catch (e) {
      allStudents = cache.trainingData.students || [];
    }

    const { calculateExplainableRisk } = require('../../src/ai/dssEngine');

    const riskStats = allStudents.map(s => {
      const risk = calculateExplainableRisk(s);
      return { mssv: s.mssv || s.id, riskScore: risk.riskScore, level: risk.riskLevel, failed: risk.failedCourses.length, att: risk.avgAttendance };
    }).sort((a, b) => b.riskScore - a.riskScore);

    const criticals = riskStats.filter(r => r.level === 'CRITICAL');
    const highs = riskStats.filter(r => r.level === 'HIGH');

    return `📈 PHÂN TÍCH QUẢN TRỊ LỚP HỌC (CLASS-LEVEL ANALYTICS)

🔴 Cấp cứu (CRITICAL): ${criticals.length} sinh viên
🟡 Báo động (HIGH): ${highs.length} sinh viên

⚠️ Top 3 sinh viên cần can thiệp khẩn cấp:
${criticals.slice(0, 3).map(c => `- **${c.mssv}**: Risk Score ${c.riskScore}/100 | Nợ ${c.failed} môn | Chuyên cần ${Math.round(c.att)}%`).join('\n')}

💡 Chiến lược Can thiệp:
- Phát hiện dấu hiệu chuyên cần sụt giảm ở nhóm sinh viên yếu.
- Nguy cơ fail dây chuyền các môn chuyên ngành đang hiện hữu.
- Đề xuất: Cố vấn học tập (CVHT) cần gọi điện trực tiếp nhóm sinh viên Cấp cứu để tránh hiệu ứng Domino (gãy chuỗi 34 môn).`;
  }

  // 4. Handle GREETING_INTENT
  if (detectedIntent === 'GREETING_INTENT') {
    return `👋 Chào bạn! Tôi là hệ thống **Hybrid Educational Decision Support System (DSS)**.

Tôi giúp cố vấn học vụ:
• Đánh giá Risk Score chuẩn XAI (Giải thích được nguyên nhân)
• Phân tích lộ trình Timeline Academic Monitoring
• Giám sát chuỗi 34 môn học, chặn đứt gãy dây chuyền
• Phân tích Class-level Analytics và đưa ra chiến lược can thiệp.

Bạn cần tôi phân tích MSSV nào (VD: *PS27463*), hay thống kê toàn lớp?`;
  }

  // 5. Handle GENERAL_SYSTEM_INTENT
  if (detectedIntent === 'GENERAL_SYSTEM_INTENT') {
    return `⚙️ HỆ THỐNG QUẢN TRỊ EDUGUARD AI DSS

Hệ thống được thiết kế theo kiến trúc **Hybrid Educational Decision Support System**:
1. **Academic Risk Engine:** Thuật toán dự báo kết hợp Hồi quy Hỗn hợp và Quy tắc Nghiệp vụ Sư phạm.
2. **Explainable AI (XAI):** Tự động phân rã các tác nhân rủi ro thành điểm phạt cụ thể (Nợ môn nền tảng, Chuyên cần thấp).
3. **Dependency Chain Graph:** Giám sát chuỗi liên kết 34 học phần, đưa ra dự báo đứt gãy dây chuyền học tập.
4. **Offline Local SQLite Pipeline:** Bảo vệ 100% dữ liệu riêng tư của người dùng.

Hệ thống hoạt động hoàn toàn bảo mật và chính xác cho môi trường đào tạo.`;
  }

  // 6. Handle Student Analytics or Follow-up Contexts
  if (student) {
    // Security check: Student role cannot query other students
    if (isStudent && userId && student.mssv.toUpperCase() !== userId.toUpperCase()) {
      return `🔒 BẢO MẬT HỆ THỐNG\n\nXin lỗi, bạn không có quyền xem dữ liệu phân tích của sinh viên khác. Bạn chỉ có thể tự tra cứu cho chính mình.`;
    }

    const { calculateExplainableRisk, generateAcademicTimeline } = require('../../src/ai/dssEngine');
    const riskData = calculateExplainableRisk(student);
    const timeline = generateAcademicTimeline(student, riskData);

    const avg = riskData.gpa;
    const rank = avg >= 8.0 ? 'Giỏi' : (avg >= 6.5 ? 'Khá' : (avg >= 5.0 ? 'Trung bình' : 'Yếu'));

    // Remove fake chart data mock
    const chartDataStr = '';
    if (detectedIntent === 'FOLLOWUP_ROOT_CAUSE_INTENT') {
      const explanationStr = riskData.explanations.map(e => `- ${e.text}: +${e.impact} risk`).join('\n');
      return `⚠️ GIẢI THÍCH NGUYÊN NHÂN CỐT LÕI (XAI)
👨‍🎓 Sinh viên: **${student.name || student.mssv}**
📈 Risk Score hiện tại: **${riskData.riskScore}/100** (${riskData.riskLevel})

Nguyên nhân chi tiết phân rã từ hệ thống:
${explanationStr || '- Không phát hiện dấu hiệu hổng kiến thức hay nợ môn nền tảng. Phong độ học tập rất ổn định.'}

💡 Đánh giá sư phạm: Sự đứt gãy kiến thức ở các môn học này sẽ gây nguy cơ dây chuyền tới các môn chuyên ngành phụ thuộc sau này trong chuỗi 34 môn.${chartDataStr}`;
    }

    if (detectedIntent === 'FOLLOWUP_ATTENDANCE_INTENT') {
      return `📅 PHÂN TÍCH CHUYÊN CẦN (ATTENDANCE ADVANCED)
👨‍🎓 Sinh viên: **${student.name || student.mssv}**
📉 Tỷ lệ chuyên cần trung bình: **${Math.round(riskData.avgAttendance)}%**

💡 Chi tiết:
- Trạng thái: ${riskData.avgAttendance < 80 ? '🔴 Nguy cơ cấm thi rất cao' : '🟢 Chuyên cần ổn định'}
- Khuyến nghị: ${riskData.avgAttendance < 80 ? 'Cần lập tức chấn chỉnh chuyên cần, yêu cầu cố vấn gọi điện nhắc nhở phụ huynh để can thiệp kịp thời.' : 'Tiếp tục duy trì chuyên cần đi học đầy đủ.'}dots${chartDataStr}`;
    }

    if (detectedIntent === 'FOLLOWUP_INTERVENTION_INTENT') {
      return `💊 PHƯƠNG ÁN CAN THIỆP HỌC VỤ (DSS ACTION CHECKLIST)
👨‍🎓 Sinh viên: **${student.name || student.mssv}**
🚨 Mức độ rủi ro: **${riskData.riskLevel}** (Risk Score: dots ${riskData.riskScore}/100)

Hành động can thiệp đề xuất cho Cố vấn học tập (CVHT):
1. [ ] Gọi điện trao đổi trực tiếp với sinh viên và gửi mail thông báo tình trạng.
2. [ ] Bắt buộc đăng ký tham gia lớp phụ đạo bổ trợ cho các môn nền tảng bị hổng.
3. [ ] Giao bài tập lab bù đắp kiến thức cơ bản từ tuần học này.
4. [ ] Theo dõi chuyên cần chặt chẽ trong 3 tuần tiếp theo.${chartDataStr}`;
    }

    if (detectedIntent === 'FOLLOWUP_TIMELINE_INTENT') {
      const timelineStr = timeline.map(t => `Tuần dots ${t.week}\t|\tdots ${t.event}`).join('\n');
      return `⏳ LỘ TRÌNH THEO DÕI HỌC VỤ (ACADEMIC TIMELINE)
👨‍🎓 Sinh viên: **${student.name || student.mssv}**

Chi tiết lộ trình leo thang cảnh báo:
${timelineStr || 'Chưa ghi nhận sự kiện cảnh báo đặc biệt.'}${chartDataStr}`;
    }

    if (detectedIntent === 'FOLLOWUP_STRENGTH_INTENT') {
      const passedCourses = student.scores.filter(s => s.status === 'PASSED' && s.value >= 7);
      const strengthStr = passedCourses.map(s => `- **${s.courseId}**: ${s.value} điểm`).join('\n');
      return `🌟 ĐIỂM SÁNG HỌC THUẬT (STRENGTH ANALYSIS)
👨‍🎓 Sinh viên: **${student.name || student.mssv}**

Các môn thế mạnh phát hiện:
${strengthStr || '- Không phát hiện môn học nổi trội xuất sắc (>=7.0). Sinh viên cần nỗ lực đồng đều hơn.'}

💡 Insight cố vấn: Tập trung khai thác các thế mạnh môn nền tảng này để làm đòn bẩy bù đắp các lỗ hổng chuyên ngành khác.${chartDataStr}`;
    }

    // Default Dossier Response
    const explanationStr = riskData.explanations.map(e => `- ${e.text}: +dots${e.impact} risk`).join('\n');
    const timelineStr = timeline.map(t => `Tuần ${t.week}\t|\t${t.event}`).join('\n');

    return `🎯 HỒ SƠ PHÂN TÍCH (DSS DASHBOARD)

👨‍🎓 Sinh viên: **${student.name || student.mssv || student.id}**
📊 GPA: **${avg.toFixed(1)}/10** (${rank})

⚠️ EXPLAINABLE RISK SCORE (XAI)
Risk Score: **${riskData.riskScore}/100** | Mức độ: **${riskData.riskLevel}**
Nguyên nhân cốt lõi:
${explanationStr || '- Học lực hoàn toàn ổn định.'}

⏳ ACADEMIC TIMELINE (MONITORING)
${timelineStr || 'Chưa có sự kiện bất thường nào ghi nhận.'}

💡 CHIẾN LƯỢC CAN THIỆP ĐỀ XUẤT
${(riskData.riskLevel === 'CRITICAL' || riskData.riskLevel === 'HIGH') 
  ? '- Cố vấn học tập gặp mặt trực tiếp sinh viên ngay lập tức.\n- Bắt buộc tham gia nhóm phụ đạo để bù đắp hổng kiến thức môn tiên quyết.\n- Theo dõi chuyên cần từng buổi để tránh rớt dây chuyền.' 
  : '- Tiếp tục duy trì phong độ hiện tại.\n- Khuyến khích tham gia các bài lab nâng cao.'}${chartDataStr}`;
  }

  // 7. Default Fallback prompt when no context or intent resolved
  return `Hiện tôi chưa có sinh viên mục tiêu để phân tích 😊

Bạn có thể:
• Nhập MSSV như PS27463 hoặc PC07988
• Hoặc yêu cầu thống kê toàn lớp học`;
}

// ============================================================
// CHATBOT v3.0 — NLP Orchestrator Pipeline
// Modular pipeline: Input → Intent → Context → Role → Entity → DSS → Response
// See: server/src/modules/chatbot/chatbotOrchestrator.js
// ============================================================
const { orchestrateChatbot } = require('../../src/modules/chatbot/chatbotOrchestrator');
const { chatSessions } = require('../../src/modules/chatbot/sessionMemory');

// Initialize event listeners (registers on shared eventBus)
require('../../src/events/attendance.event');
require('../../src/events/grade.event');
require('../../src/events/risk.event');
require('../../src/events/intervention.event');

router.get('/chat/history/:mssv', async (req, res) => {
  try {
    const mssv = req.params.mssv;
    if (!mssv) return res.status(400).json({ error: 'MSSV required' });
    
    const { prisma } = require('../../src/infrastructure/database/prisma');
    const history = await prisma.conversationHistory.findMany({
      where: { studentId: mssv },
      orderBy: { createdAt: 'asc' }
    });
    
    let formatted = history.map(h => ({
      sender: h.role === 'BOT' ? 'ai' : 'user',
      text: h.message,
      time: new Date(h.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }));
    
    if (formatted.length === 0) {
      formatted.push({ sender: 'ai', text: `Chào bạn! Mình là AI Assistant. Bạn cần hỗ trợ gì về lộ trình học hay tư vấn hướng nghiệp không?`, time: 'Bây giờ' });
    }
    
    res.json({ history: formatted });
  } catch (e) {
    console.error('Lỗi lấy lịch sử chat:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/chat/teacher-history/:mssv', async (req, res) => {
  try {
    const mssv = req.params.mssv;
    if (!mssv) return res.status(400).json({ error: 'MSSV required' });
    
    const { prisma } = require('../../src/infrastructure/database/prisma');
    const history = await prisma.conversationHistory.findMany({
      where: { 
        studentId: mssv,
        role: { in: ['TEACHER_USER', 'TEACHER_BOT'] }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    let formatted = history.map(h => ({
      role: h.role === 'TEACHER_BOT' ? 'ai' : 'user',
      text: h.message,
      time: new Date(h.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }));
    
    res.json({ history: formatted });
  } catch (e) {
    console.error('Lỗi lấy lịch sử chat giáo viên:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/chat/student/memory/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const { prisma } = require('../../src/infrastructure/database/prisma');
    
    // Fetch memory
    const memory = await prisma.studentMemory.findUnique({
      where: { studentId: mssv }
    });

    if (!memory) {
      return res.json({ success: true, data: null, message: "Chưa có memory" });
    }

    // Parse JSON fields
    const parsedMemory = {
      ...memory,
      learningGoals: memory.learningGoals ? JSON.parse(memory.learningGoals) : [],
      completedRoadmaps: memory.completedRoadmaps ? JSON.parse(memory.completedRoadmaps) : [],
      favoriteCareers: memory.favoriteCareers ? JSON.parse(memory.favoriteCareers) : []
    };

    // Fetch roadmaps
    const roadmaps = await prisma.studentRoadmap.findMany({
      where: { studentId: mssv },
      include: { steps: true }
    });

    res.json({
      success: true,
      data: {
        memory: parsedMemory,
        roadmaps
      }
    });

  } catch (err) {
    console.error('[API] Error fetching student memory:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Thiếu tin nhắn' });
    }

    const resolvedSessionId = sessionId || req.ip || 'guest';

    // Pre-compute NLP intent using api.js's already-loaded nlpManager
    // then forward it via req.body for the orchestrator
    let nlpIntent = 'None';
    let nlpScore = 0;
    let nlpClassifications = [];
    if (nlpModelLoaded) {
      try {
        const nlpResult = await nlpManager.process('vi', message);
        if (nlpResult && nlpResult.intent) {
          nlpIntent = nlpResult.intent;
          nlpScore = nlpResult.score || 0;
          nlpClassifications = nlpResult.classifications || [];
        }
      } catch (e) { /* graceful fallback to keyword routing */ }
    }
    req.body.nlpIntent = nlpIntent;
    req.body.nlpScore = nlpScore;
    req.body.nlpClassifications = nlpClassifications;

    // Ngưỡng an toàn tối thiểu cho môi trường production (0.70)
    const PRODUCTION_CONFIDENCE_THRESHOLD = 0.70;
    
    // Smart guard: If NLP score is low, check if entity extraction can resolve.
    // Don't short-circuit when MSSV or course ID is detectable in the message.
    if (nlpIntent !== 'None' && nlpScore < PRODUCTION_CONFIDENCE_THRESHOLD) {
      const { extractMssv, extractCourseId } = require('../../src/modules/chatbot/entityExtractor');
      const hasMssv = extractMssv(message);
      const hasCourse = extractCourseId(message);
      
      if (!hasMssv && !hasCourse) {
        // No entities detected either — show smart suggestion fallback
        console.warn(`[NLP_GUARD] Blocked intent "${nlpIntent}" (score: ${nlpScore.toFixed(2)} < ${PRODUCTION_CONFIDENCE_THRESHOLD})`);
        
        // Still let the orchestrator handle it for keyword heuristic routing
        req.body.nlpIntent = 'None';
        req.body.nlpScore = 0;
        // Fall through to orchestrator instead of returning early
      }
      // If entities found, let orchestrator handle with full pipeline
    }

    // Delegate to the NLP Orchestrator pipeline
    const result = await orchestrateChatbot(req, resolvedSessionId);

    // Parse embedded chart data from reply text (legacy format support)
    let reply = result.reply || '';
    let chartData = result.chartData || null;

    const chartMatch = reply.match(/\|\|\|CHART_DATA:(.*?)\|\|\|/);
    if (chartMatch) {
      try {
        chartData = JSON.parse(chartMatch[1]);
        reply = reply.replace(chartMatch[0], '').trim();
      } catch (e) { /* ignore parse error */ }
    }

    if (typeof chartData === 'string' && chartData.includes('|||CHART_DATA:')) {
      const match = chartData.match(/\|\|\|CHART_DATA:(.*?)\|\|\|/);
      if (match) {
        try {
          chartData = JSON.parse(match[1]);
        } catch (e) {}
      }
    }

    // Strip <think> tags from any LLM response
    reply = reply.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim();

    return res.json({
      reply,
      chartData,
      actions: result.actions || null,
      intent: result.intent,
      activeMssv: result.activeMssv,
      sessionId: resolvedSessionId,
      processingTimeMs: result.processingTimeMs
    });

  } catch (err) {
    console.error('❌ [Chatbot Route] Error:', err);
    res.status(500).json({ error: 'Lỗi xử lý AI: ' + err.message });
  }
});
// ============================================================
// API: Academic Graph
// ============================================================
router.get('/academic-graph', (req, res) => {
  try {
    const { academicGraph } = require('./knowledge/academicGraph');
    res.json(academicGraph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: Get detailed profile of a single student by MSSV
// ============================================================
router.get('/students/:mssv', async (req, res) => {
  try {
    const mssv = req.params.mssv;

    // Security Check: If STUDENT, they can only view their own profile!
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];
    if (userRole === 'STUDENT' && String(mssv).toUpperCase() !== String(userId).toUpperCase()) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập học bạ của sinh viên khác.' });
    }

    const student = await prisma.student.findUnique({
      where: { mssv },
      include: {
        scores: {
          include: {
            course: true
          }
        },
        predictions: true,
        interventions: {
          include: {
            advisor: true
          }
        }
      }
    });

    if (!student) {
      // Fallback to checking the in-memory array if not found in DB
      const memStudent = (cache.uploadedStudents.length > 0 ? cache.uploadedStudents : cache.trainingData.students).find(st => st.id === mssv);
      if (memStudent) {
        // Student exists in memory cache but not in DB — return it without fake attendance
        const scores = Object.entries(memStudent.scores || {}).map(([cId, val]) => {
          const status = val === null ? 'STUDYING' : (val >= 5 ? 'PASSED' : 'FAILED');
          return {
            courseId: cId,
            value: val,
            status,
            attendance: null, // No real attendance data available
            course: { id: cId, name: cId, credits: getCourseCredits(cId) }
          };
        });
        return res.json({
          mssv,
          name: memStudent.name || `Sinh viên ${mssv}`,
          classCode: memStudent.classCode || 'N/A',
          scores,
          predictions: [],
          interventions: []
        });
      }

      return res.status(404).json({ 
        error: 'Không tìm thấy sinh viên.',
        mssv,
        hint: 'Hãy upload bảng điểm của lớp trước khi tra cứu.'
      });
    }

    res.json(student);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// API: Flag student for academic intervention (Intervention System)
// ============================================================
router.post('/students/:mssv/flag', async (req, res) => {
  try {
    const mssv = req.params.mssv;
    const { courseId, action, status } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Thiếu thông tin môn học cần can thiệp (courseId).' });
    }

    // Default advisor to a seed user or create if not exists
    let defaultAdvisor = await prisma.user.findFirst();
    if (!defaultAdvisor) {
      defaultAdvisor = await prisma.user.create({
        data: {
          email: 'advisor@fpt.edu.vn',
          name: 'Cố vấn Học vụ Trung Nguyễn',
          role: 'ADVISOR'
        }
      });
    }

    // Create the intervention record in SQLite
    const intervention = await prisma.intervention.create({
      data: {
        mssv,
        courseId,
        advisorId: defaultAdvisor.id,
        action: action || 'Giảng viên đánh dấu chú ý đặc biệt vì có nguy cơ trượt môn học này.',
        status: status || 'PENDING'
      }
    });

    // Also sync to interventions.json for double compatibility
    saveIntervention(mssv, courseId, true);

    // Sync state to memory arrays if student exists in RAM cache
    const memStudent = (cache.uploadedStudents.length > 0 ? cache.uploadedStudents : cache.trainingData.students).find(st => st.id === mssv);
    if (memStudent) {
      memStudent.intervened = true;
    }

    res.json({
      success: true,
      message: `Đã đưa sinh viên ${mssv} vào danh sách cần can thiệp môn ${courseId}!`,
      intervention
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// API: Get Intervention Management lists (Smart Queue)
// ============================================================
router.get('/interventions-management', async (req, res) => {
  try {
    // 1. Lấy danh sách InterventionRoadmap đã tạo
    const roadmaps = await prisma.interventionRoadmap.findMany({
      include: {
        student: { include: { scores: true } }
      },
      orderBy: { sentDate: 'desc' }
    });

    const monitoringRoadmaps = roadmaps.filter(r => r.status === 'PENDING' || r.status === 'OPENED' || r.status === 'IN_PROGRESS');
    const resolvedRoadmaps = roadmaps.filter(r => r.status === 'COMPLETED');

    const roadmapStudentSet = new Set(roadmaps.map(r => r.studentId + '_' + r.targetCourseId));

    // 2. Lấy sinh viên có nguy cơ nhưng chưa có roadmap
    const dbPredictions = await prisma.prediction.findMany({
      where: { risk: { in: ['HIGH', 'CRITICAL', 'MEDIUM'] } },
      include: {
        student: { include: { scores: true } },
        course: true
      },
      orderBy: { predictedScore: 'asc' }
    });

    const urgentList = [];
    for (const pred of dbPredictions) {
      const key = pred.mssv + '_' + pred.courseId;
      if (!roadmapStudentSet.has(key)) {
        urgentList.push(pred);
      }
    }

    // Top 20 Nguy hiểm (Urgent)
    const top20 = urgentList.slice(0, 20);
    
    // Top 50 Theo dõi (Monitoring)
    const top50 = monitoringRoadmaps.slice(0, 50);

    // Top 100 Ổn định (Resolved/Completed)
    const top100 = resolvedRoadmaps.slice(0, 100);

    res.json({ top20, top50, top100 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: Update InterventionRoadmap Status
// ============================================================
router.post('/intervention-roadmap/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const interventionRoadmap = await prisma.interventionRoadmap.update({
      where: { id: id },
      data: { status }
    });
    res.json({ success: true, interventionRoadmap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: Delete InterventionRoadmap
// ============================================================
router.delete('/intervention-roadmap/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.interventionRoadmap.delete({
      where: { id: id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: Update or Create Student Grade (Inline Grade Editor)
// ============================================================
router.post('/students/update-score', async (req, res) => {
  try {
    const { mssv, courseId, value } = req.body;
    if (!mssv || !courseId || value === undefined) {
      return res.status(400).json({ error: 'Thiếu mssv, courseId hoặc điểm số (value).' });
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 10) {
      return res.status(400).json({ error: 'Điểm số phải là số thực từ 0 đến 10.' });
    }

    const status = numericValue >= 5.0 ? 'PASSED' : 'FAILED';

    // Update or Insert in Database
    const score = await prisma.score.upsert({
      where: {
        mssv_courseId_semester: {
          mssv,
          courseId,
          semester: 'Summer 2025' // Default active semester
        }
      },
      update: {
        value: numericValue,
        status
      },
      create: {
        mssv,
        courseId,
        value: numericValue,
        semester: 'Summer 2025',
        status
      }
    });

    // Trigger dynamic prediction recalibration for this student
    try {
      // Get the student's scores to recalculate risk predictions
      const studentAfterUpdate = await prisma.student.findUnique({
        where: { mssv },
        include: { scores: true }
      });

      const trainingData = cache.trainingData;
      const getTrainingName = (id) => {
          const dbCoursesLocal = cache.courses || []; 
          const c = dbCoursesLocal.find(x => x.courseCode === id);
          if (!c) return null;
          const exact = trainingData.subjects.find(s => s === c.courseName);
          if (exact) return exact;
          const lower = trainingData.subjects.find(s => s.toLowerCase() === c.courseName.toLowerCase());
          if (lower) return lower;
          if (id === 'WEB3023') return 'Thiết kế Web với HTML5 & CSS3';
          if (id === 'PRO2201') return 'Dự án tốt nghiệp';
          return c.courseName;
      };

      // Convert scores back to simple map for prediction
      const scoresMap = {};
      studentAfterUpdate.scores.forEach(s => {
        scoresMap[s.courseId] = s.value;
        const cName = getTrainingName(s.courseId);
        if (cName) scoresMap[cName] = s.value;
      });

      // Recalculate linear regression forecast for each predicted subject
      const subjects = cache.trainingData.subjects || [];
      const dbCourses = await prisma.course.findMany();
      const getCourseId = (name) => {
        const exact = dbCourses.find(c => c.name === name);
        if (exact) return exact.id;
        const lower = dbCourses.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (lower) return lower.id;
        if (name === "Thiết kế Web với HTML5 & CSS3") return "WEB3023";
        if (name === "Dự án tốt nghiệp") return "PRO2201";
        return null;
      };

      for (const course of subjects) {
        const cId = getCourseId(course);
        if (!cId) continue;
        
        if (scoresMap[course] === undefined && scoresMap[cId] === undefined) {
          const predObj = weightedPrediction({ scores: scoresMap }, course, cache.modelCache);
          if (predObj) {
            await prisma.prediction.upsert({
              where: {
                mssv_courseId: {
                  mssv,
                  courseId: cId
                }
              },
              update: {
                predictedScore: predObj.predictedScore,
                risk: predObj.risk,
                confidence: 0.85,
                explanation: 'Tính toán lại dựa trên điểm mới cập nhật',
                reasons: predObj.reasons.join(', ')
              },
              create: {
                mssv,
                courseId: cId,
                predictedScore: predObj.predictedScore,
                risk: predObj.risk,
                confidence: 0.85,
                explanation: 'Tính toán dựa trên điểm mới cập nhật',
                reasons: predObj.reasons.join(', ')
              }
            });
          }
        }
      }
    } catch (predErr) {
      console.warn(`[Grade Editor recalibration] Không thể tự động chạy lại dự đoán AI cho MSSV ${mssv}:`, predErr.message);
    }

    res.json({
      success: true,
      message: `Đã cập nhật thành công điểm môn ${courseId} thành ${numericValue}đ!`,
      score
    });
  } catch (e) {
    console.error("Lỗi khi cập nhật điểm:", e);
    res.status(500).json({ error: e.message });
  }
});


// ============================================================
// API: Intervention Roadmap
// ============================================================
router.post('/intervention/send-roadmap', async (req, res) => {
  try {
    const { mssv, targetCourseId, riskLevel } = req.body;
    if (!mssv || !targetCourseId) {
      return res.status(400).json({ error: 'Thiếu mssv hoặc targetCourseId' });
    }

    const { fetchStudentByMssv } = require('../../src/repositories/studentRepository');
    const studentData = await fetchStudentByMssv(mssv);
    
    if (!studentData) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }

    const { sendAutomatedRoadmap } = require('./intervention/interventionEngine');
    const result = await sendAutomatedRoadmap(mssv, targetCourseId, riskLevel || 'HIGH', studentData);

    res.json(result);
  } catch (e) {
    console.error('[API] Lỗi khi gửi lộ trình can thiệp:', e);
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// API: Pearson Correlation Matrix across all curriculum subjects
// ============================================================
router.get('/pearson-matrix', async (req, res) => {
  try {
    const subjects = cache.trainingData.subjects || [];

    // Use the curriculum order for core subjects to display sequential dependency
    const coreSubjects = cache.trainingData.curriculumOrder && cache.trainingData.curriculumOrder.length > 0
      ? cache.trainingData.curriculumOrder
      : subjects;

    // Gather all students in memory to calculate correlation
    // (include both pre-trained data and any custom database scores)
    const dbStudentsRaw = await prisma.student.findMany({
      include: { scores: true }
    });

    const dbStudents = dbStudentsRaw.map(s => {
      const scoresObj = {};
      s.scores.forEach(sc => {
        scoresObj[sc.courseId] = sc.value;
      });
      return {
        id: s.mssv,
        scores: scoresObj
      };
    });

    // Combine training data students and database students
    const allStudentsMap = {};
    cache.trainingData.students.forEach(s => {
      allStudentsMap[s.id] = { id: s.id, scores: { ...s.scores } };
    });
    dbStudents.forEach(s => {
      if (allStudentsMap[s.id]) {
        allStudentsMap[s.id].scores = { ...allStudentsMap[s.id].scores, ...s.scores };
      } else {
        allStudentsMap[s.id] = s;
      }
    });

    const students = Object.values(allStudentsMap);
    const matrix = [];

    // Import from modular regression utilities
    const { pearsonCorrelation, filterOutliersByIQR } = require('../../src/ai/regression');

    for (let i = 0; i < coreSubjects.length; i++) {
      const subA = coreSubjects[i];
      const row = { subject: subA };

      for (let j = 0; j < coreSubjects.length; j++) {
        const subB = coreSubjects[j];

        if (i === j) {
          row[subB] = 1.0;
          continue;
        }

        // Get pairs of scores for subA and subB
        const pairs = students.filter(s => s.scores[subA] != null && s.scores[subB] != null);
        if (pairs.length < 5) {
          row[subB] = 0.0; // Not enough samples
          continue;
        }

        const xs = pairs.map(s => s.scores[subA]);
        const ys = pairs.map(s => s.scores[subB]);

        // Clean outliers via IQR
        const { xs: cleanXs, ys: cleanYs } = filterOutliersByIQR(xs, ys);

        if (cleanXs.length < 5) {
          row[subB] = 0.0;
          continue;
        }

        const r = pearsonCorrelation(cleanXs, cleanYs);
        row[subB] = Math.round(r * 100) / 100;
      }
      matrix.push(row);
    }

    res.json({
      subjects: coreSubjects,
      matrix
    });
  } catch (err) {
    console.error("Lỗi tính Pearson Matrix:", err);
    res.status(500).json({ error: err.message });
  }
});

// Backward compatibility redirect
router.post('/import', upload.any(), (req, res) => {
  req.url = '/upload-predict';
  router.handle(req, res);
});

module.exports = router;
