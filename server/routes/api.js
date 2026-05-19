const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
// Import unified Prisma client
const { prisma } = require('../services/prisma');

// Import modular services
const { validateAndCleanData, calculateFptGPA } = require('../services/dataService');
const { weightedPrediction, getPrerequisites, calibrate } = require('../ai/regression');
const { validateModel } = require('../ai/validation');

// Import RAG and AI Orchestration Services
const { getStudentContext } = require('../services/ragService');
const { buildPrompt } = require('../services/promptService');
const { askGroq, askGemini } = require('../services/aiService');

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
      return prisma.course.upsert({
        where: { id },
        update: {},
        create: {
          id,
          name: id,
          credits: 3,
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
const dataPath = path.join(__dirname, '..', 'data', 'training_data.json');
const modelCachePath = path.join(__dirname, '..', 'data', 'model_cache.json');
let trainingData = { students: [], subjects: [], curriculumOrder: [] };
let modelCache = {};

if (fs.existsSync(dataPath)) {
  trainingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`📚 Pre-trained data loaded in Router: ${trainingData.students.length} SV, ${trainingData.subjects.length} môn`);
}

if (fs.existsSync(modelCachePath)) {
  modelCache = JSON.parse(fs.readFileSync(modelCachePath, 'utf8'));
  console.log(`⚡ Pre-trained models cache loaded in Router: ${Object.keys(modelCache).length} subjects`);
}

// In-memory store for uploaded student data (Mock database fallback for GET requests)
let uploadedStudents = [];

const interventionsPath = path.join(__dirname, '..', 'data', 'interventions.json');

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
  const subjects = trainingData.subjects || [];
  const students = trainingData.students || [];

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
    source: trainingData.source || 'Pre-trained',
    lastUpdated: trainingData.lastUpdated,
    stats,
    curriculumOrder: trainingData.curriculumOrder || []
  });
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
      const cleanResult = validateAndCleanData(parsedRows, headers, fileType, trainingData.subjects);
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

    uploadedStudents = mergedValidStudents;

    // 4. PREPARE PREDICTION SUBJECTS
    const trainSubjects = new Set(trainingData.subjects || []);
    const predictable = [];
    const uniqueSubjectCols = Array.from(allSubjectCols);

    uniqueSubjectCols.forEach(s => {
      if (!trainSubjects.has(s)) return;
      const prereqs = getPrerequisites(s, trainingData);
      const isTrainable = prereqs.length > 0 && trainingData.students.filter(st => st.scores[s] != null).length >= 5;

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
    const trainStudents = trainingData.students || [];
    const currOrder = trainingData.curriculumOrder || [];
    const trainScores = trainStudents.filter(s => s.scores[target] != null).map(s => s.scores[target]);

    // Query database students
    let dbStudents = [];
    try {
      const dbStudentsRaw = await prisma.student.findMany({
        include: { scores: true }
      });
      dbStudents = dbStudentsRaw.map(s => {
        const scoresObj = {};
        s.scores.forEach(sc => {
          scoresObj[sc.courseId] = sc.value;
        });
        return {
          id: s.mssv,
          name: s.name,
          classCode: s.classCode,
          scores: scoresObj
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
        if (s.name) allStudentsMap[s.id].name = s.name;
        if (s.classCode) allStudentsMap[s.id].classCode = s.classCode;
      } else {
        allStudentsMap[s.id] = s;
      }
    });

    // 3. Merge in-memory uploaded students
    uploadedStudents.forEach(s => {
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
    const cachedModel = modelCache[target];
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
          intervened: s.intervened || false
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
        prerequisites: getPrerequisites(target, trainingData),
        formula: {
          name: 'Knowledge-Enhanced Hybrid Regression (HK-Pearson V2.1 - IQR & Calibrated)',
          expression: 'ŷ = Calibrate( Σ(|rᵢ|^1.5 × KWᵢ / Σ(|r_k|^1.5 × KW_k)) × (aᵢ + bᵢ×xᵢ) )',
          source: 'EduGuard AI Hybrid Engine (Causal Knowledge + Pearson)',
          explanation: 'Dự đoán điểm bằng hồi quy tuyến tính kết hợp từ các môn tiên quyết có tương quan cao. Thuật toán sử dụng số mũ |r|^1.5 để phân phối trọng số tối ưu, áp dụng bộ lọc IQR loại bỏ điểm bất thường rớt môn/bỏ học, và dùng Statistical Calibration (SD-stretching) để khôi phục phổ điểm cao bị là phẳng do Attenuation Bias.'
        }
      });
    }

    // 2. SLOW PATH (Fallback to on-the-fly model generation if not cached)
    const prereqs = getPrerequisites(target, trainingData);
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
        intervened: s.intervened || false
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
  const trainStudents = trainingData.students || [];
  const activeInterventions = getInterventions()[target] || [];
  trainStudents.forEach(s => {
    s.intervened = activeInterventions.includes(s.id);
  });
  const result = validateModel(target, trainStudents, trainingData.curriculumOrder);
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
    const trainStudents = trainingData.students || [];
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
  const students = trainingData.students || [];
  if (students.length === 0) return res.json({ empty: true });

  const subjects = trainingData.subjects || [];
  const stats = subjects.map(sub => {
    const scored = students.filter(s => s.scores[sub] != null);
    const avg = scored.length ? scored.map(s => s.scores[sub]).reduce((a, b) => a + b, 0) / scored.length : 0;
    const atRisk = scored.filter(s => s.scores[sub] < 5).length;
    return { subject: sub, total: students.length, scored: scored.length, missing: students.length - scored.length, avg: Math.round(avg * 10) / 10, atRisk };
  }).filter(s => s.scored >= 5);

  res.json({ stats, total: students.length, source: trainingData.source });
});

// Direct route /stats (Vite maps to /api/stats)
router.get('/stats', (req, res) => {
  const students = trainingData.students || [];
  if (students.length === 0) return res.json({ empty: true });

  const subjects = trainingData.subjects || [];
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

  res.json({ stats, total: students.length, source: trainingData.source });
});

// ============================================================
// API: Get uploaded students
// ============================================================
router.get('/students', (req, res) => {
  const students = uploadedStudents.length > 0 ? uploadedStudents : trainingData.students;
  const subjects = uploadedStudents.length > 0 ? Object.keys(students[0]?.scores || {}) : (trainingData.subjects || []);
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
    uploadedStudents = students;

    res.json({ success: true, message: `Lưu thành công ${students.length} sinh viên vào Database!` });
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
        include: {
          scores: {
            include: {
              course: true
            }
          }
        },
        take: 15
      });
    } catch (dbErr) {
      console.warn("Lỗi tra cứu SQLite:", dbErr);
    }

    // Map dbStudents to a common format
    const dbMapped = dbStudents.map(s => {
      const scoresObj = {};
      s.scores.forEach(sc => {
        scoresObj[sc.courseId] = sc.value;
      });
      return {
        id: s.mssv,
        name: s.name,
        classCode: s.classCode || 'WD18301',
        scores: scoresObj,
        source: 'Database'
      };
    });

    // 2. Query from memory cache (pre-trained 649 students + custom uploaded RAM cache)
    const sourceMap = {};
    if (trainingData && Array.isArray(trainingData.students)) {
      trainingData.students.forEach(s => {
        if (s && s.id) sourceMap[s.id] = s;
      });
    }
    if (Array.isArray(uploadedStudents)) {
      uploadedStudents.forEach(s => {
        if (s && s.id) sourceMap[s.id] = s;
      });
    }
    const sourceList = Object.values(sourceMap);
    const memMapped = sourceList
      .filter(s => {
        const sid = String(s.id || '').toLowerCase();
        const sname = String(s.name || '').toLowerCase();
        return sid.includes(q) || sname.includes(q);
      })
      .slice(0, 15)
      .map(s => ({
        id: s.id,
        name: s.name || `Sinh viên ${s.id}`,
        classCode: s.classCode || 'WD18301',
        scores: s.scores || {},
        source: 'Memory Cache'
      }));

    // Combine lists, preventing duplicates
    const combined = [...dbMapped];
    memMapped.forEach(ms => {
      if (!combined.some(cs => cs.id === ms.id)) {
        combined.push(ms);
      }
    });

    res.json(combined.slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CHATBOT (Gemini with smart local fallback)
// ============================================================
// ============================================================
// CHATBOT (Gemini with database-grounded context & advanced SQLite local fallback)
// ============================================================
async function smartLocalReply(message, studentContext) {
  const msg = message.toLowerCase();

  try {
    // 1. Check if user mentioned a specific student ID (e.g., PS12345)
    const mssvMatch = message.toUpperCase().match(/PS\d{5}/);
    if (mssvMatch) {
      const targetMssv = mssvMatch[0];
      const student = await prisma.student.findUnique({
        where: { mssv: targetMssv },
        include: {
          scores: { include: { course: true } },
          predictions: { include: { course: true } }
        }
      });

      if (student) {
        const passed = student.scores.filter(s => s.status === 'PASSED').length;
        const failed = student.scores.filter(s => s.status === 'FAILED').length;
        const studying = student.scores.filter(s => s.status === 'STUDYING').length;
        const avg = calculateFptGPA(student.scores);
        const highRisk = student.predictions.filter(p => p.risk === 'HIGH');

        return `🤖 **[AI Cố vấn Học Vụ - Offline Mode]** Tôi đã truy lục dữ liệu thực tế của sinh viên **${student.name}** (${student.mssv}):
• **Lớp chuyên ngành:** ${student.classCode}
• **Tình trạng học phần:** Đã học ${student.scores.length} môn (Đạt: ${passed} môn, Trượt: ${failed} môn, Đang học: ${studying} môn).
• **Điểm trung bình tích lũy:** ${avg.toFixed(1)}/10 (${avg >= 8.0 ? 'Giỏi' : (avg >= 6.5 ? 'Khá' : (avg >= 5.0 ? 'Trung bình' : 'Yếu'))}).
${failed > 0 ? `• **Môn học kỳ trước bị trượt:** ${student.scores.filter(s => s.status === 'FAILED').map(s => `${s.courseId} (${s.value}đ)`).join(', ')}` : '• **Lịch sử trượt môn:** Chưa từng bị trượt môn nào.'}
${highRisk.length > 0 ? `• **Cảnh báo học tập học kỳ này (Nguy cơ cao):**\n${highRisk.map(p => `  - **${p.courseId}**: Dự báo đạt **${p.predictedScore.toFixed(1)}đ** (${p.risk === 'HIGH' ? '🔴 Nguy cơ trượt rất cao' : '🟡 Nguy cơ trung bình'})`).join('\n')}` : '• **Dự báo rủi ro mới:** Hiện tại nằm trong vùng an toàn (Chưa phát hiện rủi ro trượt cao).'}

💡 **Khuyến nghị sư phạm:** Sinh viên ${student.name} ${failed > 0 || highRisk.length > 0 ? 'đang có dấu hiệu yếu ở các học phần nền tảng. Giảng viên cần đưa sinh viên vào nhóm phụ đạo và phân công sinh viên khá giỏi hỗ trợ kèm cặp ngay.' : 'có sức học ổn định, giảng viên nên khuyến khích tham gia câu lạc bộ học thuật để làm mentor giúp đỡ các bạn khác.'}`;
      }
    }

    // 2. Fallback to active student context if loaded on screen
    if (studentContext) {
      const activeMssv = studentContext.mssv || studentContext.id;
      const student = await prisma.student.findUnique({
        where: { mssv: activeMssv },
        include: {
          scores: { include: { course: true } },
          predictions: { include: { course: true } }
        }
      });

      if (student) {
        const passed = student.scores.filter(s => s.status === 'PASSED').length;
        const failed = student.scores.filter(s => s.status === 'FAILED').length;
        const avg = calculateFptGPA(student.scores);

        if (msg.includes('học lực') || msg.includes('điểm') || msg.includes('kết quả') || msg.includes('ntn') || msg.includes('thế nào') || msg.includes('năng lực')) {
          return `🤖 **[AI Cố vấn Học Vụ - Offline Mode]** Đánh giá học lực hiện tại của sinh viên **${student.name}** (${student.mssv}):
• **Điểm trung bình (GPA):** ${avg.toFixed(1)}/10.
• **Xếp loại học lực:** ${avg >= 8.0 ? 'Giỏi (A/A+)' : (avg >= 6.5 ? 'Khá (B)' : (avg >= 5.0 ? 'Trung bình (C)' : 'Yếu kém (F)'))}.
• **Tỷ lệ vượt qua môn học:** Đạt ${passed}/${student.scores.length} học phần.
${failed > 0 ? `• **Môn đã từng trượt (F):** ${student.scores.filter(s => s.status === 'FAILED').map(s => `${s.courseId} (${s.value}đ)`).join(', ')}. Sinh viên cần đặc biệt củng cố lại kiến thức môn này để học tốt các môn kế tiếp.` : '• Sinh viên học đều các môn, không bị nợ môn.'}

💡 Bạn có thể hỏi thêm: *"môn nào có nguy cơ trượt học kỳ mới?"* hoặc *"lộ trình can thiệp học tập"*`;
        }

        if (msg.includes('nguy cơ') || msg.includes('trượt') || msg.includes('tạch') || msg.includes('yếu') || msg.includes('cảnh báo') || msg.includes('rủi ro')) {
          const highRisk = student.predictions.filter(p => p.risk === 'HIGH');
          return `🤖 **[AI Cố vấn Học Vụ - Offline Mode]** Phân tích cảnh báo rủi ro học thuật kỳ mới của **${student.name}** (${student.mssv}):
${highRisk.length > 0
              ? `• **Danh sách học phần rủi ro trượt cao:**\n${highRisk.map(p => `  - **Môn ${p.courseId}**: dự kiến đạt **${p.predictedScore.toFixed(1)}đ** (${p.risk === 'HIGH' ? '🔴 Cảnh báo Đỏ - Rủi ro trượt cao' : '🟡 Cảnh báo Vàng'}).`).join('\n')}\n\n💡 **Phân tích lỗ hổng kiến thức tiên quyết:** Điểm yếu cốt lõi có thể do em ấy từng bị trượt hoặc điểm thấp môn liên quan trước đây. Cần củng cố gốc lý thuyết của môn đó trước khi tiếp cận học phần nâng cao này.`
              : '• **Kết quả dự đoán:** Rất tốt! Sinh viên này hiện đang ở trạng thái an toàn cho tất cả các học phần đăng ký mới. Chưa phát hiện nguy cơ học thuật nào lớn.'}

💡 Giảng viên có thể hướng dẫn em ấy đặt mục tiêu GPA cao hơn bằng tính năng **GPA & What-if** ở sidebar.`;
        }

        if (msg.includes('lộ trình') || msg.includes('can thiệp') || msg.includes('khuyên') || msg.includes('giải pháp') || msg.includes('làm sao') || msg.includes('hỗ trợ')) {
          const failedCourses = student.scores.filter(s => s.status === 'FAILED').map(s => s.courseId);
          return `🤖 **[AI Cố vấn Học Vụ - Offline Mode]** Đề xuất lộ trình can thiệp học thuật chi tiết cho sinh viên **${student.name}** (${student.mssv}):
${failedCourses.length > 0
              ? `1. **Bổ trợ môn nền tảng:** Ưu tiên số 1 là học lại/ôn tập lại học phần **${failedCourses.join(', ')}**. Đây là những kiến thức bản lề để mở khóa tư duy cho các môn chuyên ngành.
2. **Kế hoạch hỗ trợ 1-1:** Đề xuất sinh viên tham gia nhóm học tập có sinh viên khá kèm cặp trực tiếp trong các giờ làm bài Assignment/Lab môn chuyên ngành kỳ này.
3. **Cảnh báo tiến độ:** Nhắc nhở sinh viên hoàn thành thủ tục đăng ký thi lại/học lại sớm để tránh bị tắc nghẽn ở các kỳ sau.`
              : `1. **Đóng vai trò Mentor:** Sinh viên có học lực rất vững vàng (GPA ${avg.toFixed(1)}). Giảng viên nên bổ nhiệm em ấy làm trưởng nhóm học tập để hỗ trợ các bạn yếu hơn, giúp củng cố kỹ năng làm việc nhóm.
2. **Nâng cao chất lượng:** Động viên sinh viên tham gia các dự án nghiên cứu hoặc các cuộc thi chuyên ngành tại FPT Polytechnic để phát triển tối đa năng lực.`}
`;
        }
      }
    }

    // 3. General Statistics & Aggregations from the Live SQLite DB
    const totalStudents = await prisma.student.count();
    const atRiskCount = await prisma.score.findMany({
      where: { status: 'FAILED' },
      distinct: ['mssv']
    });

    if (msg.includes('nguy cơ') || msg.includes('yếu') || msg.includes('kém') || msg.includes('cảnh báo') || msg.includes('danh sách')) {
      return `🤖 **[AI Cố vấn Học Vụ - Offline Mode]** Phân tích dữ liệu học vụ toàn khóa học (Truy vấn live SQLite):
• **Quy mô hệ thống:** Đang quản lý **${totalStudents} sinh viên** chính thức trong database.
• **Tỷ lệ sinh viên có nguy cơ:** Có **${atRiskCount.length} sinh viên** từng trượt ít nhất 1 môn học (${Math.round(atRiskCount.length / (totalStudents || 1) * 100)}%).
• **Danh sách 3 sinh viên cần giảng viên liên hệ gấp:** ${atRiskCount.slice(0, 3).map(s => s.mssv).join(', ')}.

💡 Hãy nhập cụ thể MSSV của sinh viên (Ví dụ: \`PS27463\`) vào hộp chat để xem ngay học bạ chi tiết và nhận tư vấn học vụ cá nhân hóa cho sinh viên đó!`;
    }

    if (msg.includes('môn') || msg.includes('chú ý') || msg.includes('khó') || msg.includes('tạch') || msg.includes('trượt')) {
      const scores = await prisma.score.findMany({
        where: { value: { not: null } }
      });

      const courseMap = {};
      scores.forEach(s => {
        if (!courseMap[s.courseId]) {
          courseMap[s.courseId] = { sum: 0, count: 0, failed: 0 };
        }
        courseMap[s.courseId].sum += s.value;
        courseMap[s.courseId].count += 1;
        if (s.status === 'FAILED') courseMap[s.courseId].failed += 1;
      });

      const worstCourses = Object.entries(courseMap)
        .map(([id, info]) => ({
          id,
          avg: info.sum / info.count,
          failRate: info.failed / info.count * 100,
          count: info.count
        }))
        .sort((a, b) => b.failRate - a.failRate)
        .slice(0, 3);

      return `🤖 **[AI Cố vấn Học Vụ - Offline Mode]** Top 3 học phần khó nhất (Tỷ lệ trượt cao nhất trích xuất từ database):
${worstCourses.map((c, i) => `${i + 1}. **Môn ${c.id}**: Tỷ lệ trượt **${c.failRate.toFixed(1)}%** (Điểm trung bình lớp: ${c.avg.toFixed(1)}đ, dựa trên ${c.count} lượt học)`).join('\n')}

💡 **Khuyến nghị sư phạm:** Giảng viên giảng dạy các học phần này nên tăng cường thời lượng hướng dẫn lý thuyết và cho sinh viên làm thử đề thi/bài thực hành mẫu ngay từ tuần thứ 3 của học kỳ.`;
    }
  } catch (dbErr) {
    console.error("Lỗi truy vấn SQLite trong Local Fallback:", dbErr);
  }

  // Fallback to beautiful default instructions
  return `🤖 **[AI Cố vấn Học Vụ - Offline Mode]** Xin chào! Tôi là Trợ lý Cố vấn Học Vụ được kết nối trực tiếp với SQLite Database của EduGuard.

Bạn có thể hỏi tôi các câu hỏi chuyên sâu như:
• *"sinh viên này học lực ntn"* hoặc *"nguy cơ trượt học kỳ mới"* (khi đang chọn xem hồ sơ cụ thể)
• *"môn nào dễ tạch nhất"* hoặc *"thống kê sinh viên yếu"* (để xem thống kê tổng hợp lớp học)
• Gõ trực tiếp mã sinh viên (ví dụ: \`PS27463\`) để tôi tự động tra cứu học bạ thực tế của em ấy lập tức!`;
}

// ============================================================
// AI CHAT ORCHESTRATION (Express Endpoint)
// ============================================================
router.post('/chat', async (req, res) => {
  const cleanReply = (text) => {
    if (!text) return "";
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>\s*/gi, '');
    if (!cleaned.trim()) {
      cleaned = text.replace(/<\/?think>/gi, '');
    }
    return cleaned;
  };

  try {
    const { message, mssv, studentContext, provider, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Thiếu tin nhắn' });

    // Extract active student identifier (compatible with both mssv and studentContext format)
    let activeMssv = mssv || (studentContext ? (studentContext.mssv || studentContext.id) : null);

    // Dynamic pattern matching: search for MSSV directly mentioned in the message text
    if (!activeMssv) {
      const mssvMatch = message.match(/(?:PS)?\b\d{5}\b/i);
      if (mssvMatch) {
        const matchedStr = mssvMatch[0].toUpperCase();
        activeMssv = matchedStr.startsWith('PS') ? matchedStr : `PS${matchedStr}`;
      }
    }

    // Layered Retrieval: Retrieve student RAG context details
    const { student, chunks } = activeMssv
      ? await getStudentContext(activeMssv)
      : { student: null, chunks: [] };

    // General academic statistics query grounding if relevant
    const isQueryingStats = message.toLowerCase().includes('nguy cơ') ||
      message.toLowerCase().includes('cảnh báo') ||
      message.toLowerCase().includes('tỷ lệ') ||
      message.toLowerCase().includes('học yếu') ||
      message.toLowerCase().includes('tạch') ||
      message.toLowerCase().includes('trượt') ||
      message.toLowerCase().includes('thống kê');
    if (isQueryingStats) {
      try {
        const totalStudents = await prisma.student.count();
        const failedScores = await prisma.score.findMany({
          where: { status: 'FAILED' },
          include: { student: true, course: true },
          take: 5
        });
        const highRiskPredictions = await prisma.prediction.findMany({
          where: { risk: 'HIGH' },
          include: { student: true, course: true },
          take: 5
        });

        chunks.push(`THỐNG KÊ TOÀN CƠ SỞ DỮ LIỆU SQLITE:
- Tổng số sinh viên lưu trữ trong DB: ${totalStudents} sinh viên.
- Một số sinh viên đang bị trượt môn thực tế: ${failedScores.map(s => `${s.student.name} (${s.mssv}) trượt môn ${s.courseId} (${s.value || 0}đ)`).join(', ')}
- Một số sinh viên dự đoán có rủi ro trượt cao học kỳ này: ${highRiskPredictions.map(p => `${p.student.name} (${p.mssv}) môn ${p.courseId} (dự đoán đạt ${p.predictedScore.toFixed(1)}đ)`).join(', ')}`);
      } catch (statsErr) {
        console.error("[General Stats RAG Fallback] Error fetching stats:", statsErr);
      }
    }

    // Build the system-instructed structured prompt package
    const prompt = buildPrompt({
      student,
      chunks,
      question: message
    });

    // Resolve the active target provider
    const targetProvider = provider || process.env.AI_PROVIDER || 'gemini';
    console.log(`[AI Orchestrator] Yêu cầu chat qua Provider: ${targetProvider} (MSSV: ${activeMssv || 'Không có'})`);

    // TẦNG 1: Gemini 2.0 Flash
    if (targetProvider === 'gemini') {
      try {
        console.log("[AI Orchestrator] Đang gọi Tầng 1: Gemini 2.0 Flash...");
        const reply = await askGemini({
          system: prompt.system,
          history: history || [],
          user: prompt.user
        });
        if (reply) {
          console.log("✅ [AI Orchestrator] Phản hồi thành open từ Tầng 1 (Gemini)!");
          return res.json({ reply: cleanReply(reply) });
        }
      } catch (geminiErr) {
        console.warn("⚠️ [AI Orchestrator] Tầng 1 (Gemini) gặp sự cố. Tự động chuyển sang Tầng 2 (Groq Llama 3.3):", geminiErr.message);
      }
    }

    // TẦNG 2: Groq Llama 3.3
    try {
      console.log("[AI Orchestrator] Đang gọi Tầng 2: Groq Llama 3.3...");
      const reply = await askGroq({
        system: prompt.system,
        history: history || [],
        user: prompt.user
      });
      if (reply) {
        console.log("✅ [AI Orchestrator] Phản hồi thành công từ Tầng 2 (Groq)!");
        return res.json({ reply: cleanReply(reply) });
      }
    } catch (groqErr) {
      console.warn("⚠️ [AI Orchestrator] Tầng 2 (Groq) gặp sự cố. Tự động chuyển sang Tầng 3 (Local SQLite Fallback):", groqErr.message);
    }

    // TẦNG 3: Smart Local SQLite Fallback
    console.log("[AI Orchestrator] Đang gọi Tầng 3: Smart Local SQLite Fallback...");
    const reply = await smartLocalReply(message, studentContext);
    return res.json({ reply: cleanReply(reply) });

  } catch (err) {
    console.error("❌ [AI Orchestrator] Lỗi xử lý AI đa tầng:", err);
    res.status(500).json({ error: "Lỗi xử lý AI: " + err.message });
  }
});

// ============================================================
// API: Get detailed profile of a single student by MSSV
// ============================================================
router.get('/students/:mssv', async (req, res) => {
  try {
    const mssv = req.params.mssv;

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
      const memStudent = (uploadedStudents.length > 0 ? uploadedStudents : trainingData.students).find(st => st.id === mssv);
      if (memStudent) {
        // Map scores map to the same format
        const scores = Object.entries(memStudent.scores || {}).map(([cId, val]) => ({
          courseId: cId,
          value: val,
          status: val >= 5 ? 'PASSED' : (val === null ? 'STUDYING' : 'FAILED'),
          course: { id: cId, name: cId, credits: 3 }
        }));
        return res.json({
          mssv,
          name: memStudent.name || `Sinh viên ${mssv}`,
          classCode: 'WD18301',
          scores,
          predictions: [],
          interventions: []
        });
      }
      return res.status(404).json({ error: "Không tìm thấy sinh viên trong hệ thống" });
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
    const memStudent = (uploadedStudents.length > 0 ? uploadedStudents : trainingData.students).find(st => st.id === mssv);
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
      const studentScores = await prisma.score.findMany({
        where: { mssv }
      });

      // Construct clean score maps
      const scoresMap = {};
      studentScores.forEach(s => {
        scoresMap[s.courseId] = s.value;
      });

      // Recalculate linear regression forecast for each predicted subject
      const subjects = trainingData.subjects || [];
      for (const course of subjects) {
        if (scoresMap[course] === undefined) {
          const predObj = weightedPrediction({ scores: scoresMap }, course, modelCache);
          if (predObj) {
            await prisma.prediction.upsert({
              where: {
                mssv_courseId: {
                  mssv,
                  courseId: course
                }
              },
              update: {
                predictedScore: predObj.predictedScore,
                risk: predObj.risk,
                reasons: predObj.reasons.join(', ')
              },
              create: {
                mssv,
                courseId: course,
                predictedScore: predObj.predictedScore,
                risk: predObj.risk,
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
// API: Pearson Correlation Matrix across all curriculum subjects
// ============================================================
router.get('/pearson-matrix', async (req, res) => {
  try {
    const subjects = trainingData.subjects || [];

    // Use the curriculum order for core subjects to display sequential dependency
    const coreSubjects = trainingData.curriculumOrder && trainingData.curriculumOrder.length > 0
      ? trainingData.curriculumOrder
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
    trainingData.students.forEach(s => {
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
    const { pearsonCorrelation, filterOutliersByIQR } = require('../ai/regression');

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
