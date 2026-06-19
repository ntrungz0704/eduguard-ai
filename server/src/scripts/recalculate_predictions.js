require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { prisma } = require('../infrastructure/database/prisma');
const { calibrate, getPrerequisites, ACADEMIC_PREREQUISITES, weightedPrediction } = require('../ai/regression');
const { validateModel } = require('../ai/validation');
const fs = require('fs');
const path = require('path');
const { eventBus, EVENTS } = require('../utils/eventBus');

// -------------------------------------------------------------
// AI PIPELINE EVENT LISTENER
// -------------------------------------------------------------
eventBus.on(EVENTS.DATASET_UPDATED, async () => {
  console.log('[AI Pipeline] Nhận cờ DATASET_UPDATED. Tự động train và recalculate...');
  try {
    await recalculateAllPredictions();
  } catch (error) {
    console.error('[AI Pipeline] Lỗi khi tự động chạy pipeline:', error);
  }
});

const modelCachePath = path.join(__dirname, '..', 'ai', 'models', 'regression', 'trained_model.json');
const datasetPath = path.join(__dirname, '..', 'datasets', 'training_data.json');

const COURSE_CODE_TO_NAME = {
  'COM1071': 'Tin học',
  'VIE103': 'Giáo dục thể chất',
  'PDP102': 'Kỹ năng học tập',
  'COM108': 'Nhập môn lập trình',
  'ITI101': 'Nhập môn Công nghệ thông tin',
  'VIE104': 'Giáo dục quốc phòng',
  'ENT1128': 'Tiếng Anh 1.1',
  'COM2012': 'Cơ sở dữ liệu',
  'WEB1013': 'Xây dựng trang Web',
  'ENT123': 'Tiếng Anh 1.2',
  'WEB1043': 'Lập trình cơ sở với JavaScript',
  'WEB108': 'Lập trình PHP cơ bản',
  'ENT213': 'Tiếng Anh 2.1',
  'VIE108': 'Chính trị',
  'WEB3023': 'Thiết kế Web với HTML5 & CSS3',
  'WEB2014': 'Lập trình PHP 1',
  'VIE1026': 'Pháp luật',
  'PDP103': 'Kỹ năng phát triển bản thân',
  'WEB105': 'Thiết kế UI/UX',
  'WEB2041': 'Dự án mẫu',
  'ENT223': 'Tiếng Anh 2.2',
  'WEB1023': 'Quản trị website',
  'WEB2055': 'Marketing trên Internet',
  'WEB501': 'Lập trình ECMAScript',
  'WEB2063': 'Lập trình Javascript nâng cao',
  'PRO1014': 'Dự án 1',
  'WEB503': 'NodeJS & Restful Web Service',
  'WEB502': 'Lập trình TypeScript',
  'PDP104': 'Kỹ năng làm việc',
  'SYB3013': 'Khởi sự doanh nghiệp',
  'WEB2081': 'Lập trình Front-End Framework 1',
  'WEB2091': 'Lập trình Front-End Framework 2',
  'PRO116': 'Thực tập tốt nghiệp',
  'PRO2201': 'Dự án tốt nghiệp'
};

async function loadTrainingDataFromDB() {
  const dbStudents = await prisma.student.findMany({
    include: {
      scores: {
        include: {
          course: true
        }
      }
    }
  });

  const students = dbStudents.map(st => {
    const scores = {};
    st.scores.forEach(sc => {
      // Bỏ qua các môn điều kiện
      if (sc.course?.isConditional) return;
      
      // Chỉ lấy điểm của các môn đã có trạng thái PASS/FAIL
      if (sc.value !== null && (sc.status === 'PASSED' || sc.status === 'FAILED')) {
        const subjectName = COURSE_CODE_TO_NAME[sc.courseId] || sc.course.name || sc.courseId;
        scores[subjectName] = sc.value;
      }
    });
    return {
      id: st.mssv,
      name: st.name,
      classCode: st.classCode,
      scores
    };
  });

  const subjects = Object.values(COURSE_CODE_TO_NAME);
  const curriculumOrder = [
    "Tin học",
    "Giáo dục thể chất",
    "Kỹ năng học tập",
    "Nhập môn lập trình",
    "Nhập môn Công nghệ thông tin",
    "Giáo dục quốc phòng",
    "Tiếng Anh 1.1",
    "Cơ sở dữ liệu",
    "Xây dựng trang Web",
    "Tiếng Anh 1.2",
    "Lập trình cơ sở với JavaScript",
    "Lập trình PHP cơ bản",
    "Tiếng Anh 2.1",
    "Chính trị",
    "Thiết kế Web với HTML5 & CSS3",
    "Lập trình PHP 1",
    "Pháp luật",
    "Kỹ năng phát triển bản thân",
    "Thiết kế UI/UX",
    "Dự án mẫu",
    "Tiếng Anh 2.2",
    "Quản trị website",
    "Marketing trên Internet",
    "Lập trình ECMAScript",
    "Lập trình Javascript nâng cao",
    "Dự án 1",
    "NodeJS & Restful Web Service",
    "Lập trình TypeScript",
    "Kỹ năng làm việc",
    "Khởi sự doanh nghiệp",
    "Lập trình Front-End Framework 1",
    "Lập trình Front-End Framework 2",
    "Thực tập tốt nghiệp",
    "Dự án tốt nghiệp"
  ];

  return {
    source: "SQLite Database",
    lastUpdated: new Date().toISOString().split('T')[0],
    curriculumOrder,
    subjects,
    students
  };
}

function trainModel(trainingData) {
  const modelCache = {};
  const { students, subjects, curriculumOrder } = trainingData;

  subjects.forEach(target => {
    const targetIdx = curriculumOrder.indexOf(target);
    const prereqs = curriculumOrder.slice(0, targetIdx);

    // Build pre-computed models
    const targetStudents = students.filter(st => st.scores[target] != null);
    if (targetStudents.length < 50) {
      console.log(`Bỏ qua môn ${target} do không đủ dữ liệu huấn luyện (${targetStudents.length} < 50)`);
      return; // Skip model generation for this subject
    }

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
      const validation = validateModel(target, students, curriculumOrder);

      modelCache[target] = {
        target,
        topFeatures: featuresSerialized,
        validation,
        samples: students.filter(st => st.scores[target] != null).length
      };
    }
  });

  return modelCache;
}

async function recalculateAllPredictions() {
    const lockFilePath = path.join(__dirname, 'recalculate.lock');
    let hasLock = false;
    try {
        const fd = fs.openSync(lockFilePath, 'wx');
        fs.writeSync(fd, String(process.pid));
        fs.closeSync(fd);
        hasLock = true;
    } catch (err) {
        console.log('Một tiến trình tính toán lại dự báo khác đang chạy (lockfile đã tồn tại). Hủy bỏ tiến trình hiện tại để tránh race condition.');
        if (shouldExit) {
            process.exit(0);
        }
        return 0;
    }

    let count = 0;
    try {
        console.log('Bắt đầu tính toán lại toàn bộ dự báo...');
        
        // 1. Load latest training data from DB
        const trainingData = await loadTrainingDataFromDB();
        console.log(`📚 Đã load ${trainingData.students.length} sinh viên từ DB làm dữ liệu huấn luyện.`);
        
        // 2. Retrain models on the fly
        const modelCache = trainModel(trainingData);
        console.log(`⚡ Đã huấn luyện thành công ${Object.keys(modelCache).length} mô hình hồi quy.`);
        
        // Save to disk and update cache
        try {
            fs.writeFileSync(modelCachePath, JSON.stringify(modelCache, null, 2), 'utf8');
            fs.writeFileSync(datasetPath, JSON.stringify(trainingData, null, 2), 'utf8');
            console.log('💾 Đã lưu modelCache và trainingData cập nhật xuống đĩa.');
        } catch (e) {
            console.error('Lỗi lưu tệp cache mô hình:', e);
        }
        
        // Update in-memory cache
        const cache = require('../shared/cache');
        cache.modelCache = modelCache;
        cache.trainingData = trainingData;
        
        const trainScoresMap = {};
        Object.keys(modelCache).forEach(target => {
            trainScoresMap[target] = trainingData.students.filter(s => s.scores[target] != null).map(s => s.scores[target]);
        });

        const students = await prisma.student.findMany({ include: { scores: true } });
        console.log(`Tìm thấy ${students.length} sinh viên trong Database.`);
        
        const dbCourses = await prisma.course.findMany();
        
        const getCourseId = (name) => {
            const entry = Object.entries(COURSE_CODE_TO_NAME).find(([code, val]) => val === name);
            if (entry) return entry[0];
            
            const exact = dbCourses.find(c => c.name === name);
            if (exact) return exact.id;
            const lower = dbCourses.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (lower) return lower.id;
            return null;
        };

        const getTrainingName = (id) => {
            if (COURSE_CODE_TO_NAME[id]) return COURSE_CODE_TO_NAME[id];
            
            const c = dbCourses.find(x => x.id === id);
            if (!c) return null;
            return c.name;
        };

        const operations = [];

        for (const student of students) {
            const mssv = student.mssv;
            const scoresMap = {};
            student.scores.forEach(s => {
                scoresMap[s.courseId] = s.value;
                const tName = getTrainingName(s.courseId);
                if (tName) scoresMap[tName] = s.value;
            });

            for (const target of Object.keys(modelCache)) {
                const courseId = getCourseId(target);
                if (!courseId) {
                    console.warn(`Không tìm thấy Course ID cho môn: ${target}`);
                    continue;
                }
                // Predict if they haven't learned it
                if (scoresMap[target] == null && scoresMap[courseId] == null) {
                    const cachedModel = modelCache[target];
                    if (!cachedModel || !cachedModel.topFeatures) continue;
                    
                    const topFeatures = cachedModel.topFeatures;
                    const trainScores = trainScoresMap[target] || [];
                    
                    const activeFeatures = topFeatures.filter(f => scoresMap[f.subject] != null);
                    let predicted = null;
                    let reasons = [];

                    if (activeFeatures.length > 0) {
                        const activeTotalScore = activeFeatures.reduce((sum, f) => sum + f.hybridScore, 0) || 1;
                        let predSum = 0;
                        activeFeatures.forEach(f => {
                            const x = scoresMap[f.subject];
                            const val = Math.min(10, Math.max(0, f.a + f.b * x));
                            predSum += (f.hybridScore / activeTotalScore) * val;
                        });
                        const rawPredicted = Math.round(predSum * 10) / 10;
                        predicted = calibrate(rawPredicted, trainScores);
                        
                        topFeatures.forEach(f => {
                            const score = scoresMap[f.subject];
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

                    if (predicted == null) {
                        const otherScores = Object.values(scoresMap).filter(v => v !== null && typeof v === 'number');
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
                    }

                    // Cascading Risk
                    const prereqs = ACADEMIC_PREREQUISITES[target] || [];
                    if (prereqs.length > 0) {
                        let cascadePenalty = 0;
                        let rootCauses = [];
                        prereqs.forEach(prereq => {
                            if (scoresMap[prereq] !== undefined && scoresMap[prereq] !== null) {
                                if (scoresMap[prereq] < 5.0) {
                                    cascadePenalty += 2.0;
                                    rootCauses.push(`Hổng kiến thức nền tảng do rớt môn tiên quyết "${prereq}" (${scoresMap[prereq]}đ).`);
                                } else if (scoresMap[prereq] < 6.5) {
                                    cascadePenalty += 0.5;
                                    rootCauses.push(`Kiến thức nền tảng chưa vững ở môn tiên quyết "${prereq}" (${scoresMap[prereq]}đ).`);
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

                    predicted = Math.round(predicted * 10) / 10;
                    const risk = predicted < 5 ? 'HIGH' : predicted < 6.5 ? 'MEDIUM' : 'LOW';

                    operations.push(prisma.prediction.upsert({
                        where: { mssv_courseId: { mssv, courseId: courseId } },
                        update: { predictedScore: predicted, risk, confidence: 0.85, explanation: 'Tính toán hàng loạt (kịch bản DB)', reasons: JSON.stringify(reasons) },
                        create: { mssv, courseId: courseId, predictedScore: predicted, risk, confidence: 0.85, explanation: 'Tính toán hàng loạt (kịch bản DB)', reasons: JSON.stringify(reasons) }
                    }));

                    operations.push(prisma.predictionHistory.create({
                        data: {
                            mssv,
                            courseId: courseId,
                            predictedScore: predicted
                        }
                    }));
                    count++;

                    if (operations.length >= 200) {
                        await prisma.$transaction(operations);
                        operations.length = 0;
                    }
                }
            }
        }

        if (operations.length > 0) {
            await prisma.$transaction(operations);
        }

        console.log(`✅ Đã tính toán và lưu ${count} dự báo vào Database.`);

        // --- Bổ sung Continuous Learning & Auto Validation ---
        try {
            const evaluationService = require('../modules/evaluation/evaluation.service');
            const evalResult = await evaluationService.runValidation();
            console.log(`✅ Đã chạy Auto Validation. Có ${evalResult.evaluatedCount} dự báo cũ được kiểm chứng bằng điểm thật.`);
        } catch (evalErr) {
            console.error('❌ Lỗi khi chạy Auto Validation:', evalErr);
        }
        
    } finally {
        if (hasLock) {
            try {
                if (fs.existsSync(lockFilePath)) {
                    fs.unlinkSync(lockFilePath);
                }
            } catch (unlinkErr) {
                console.error('Lỗi khi xóa lockfile:', unlinkErr);
            }
        }
    }

    return count;
}

if (require.main === module) {
    recalculateAllPredictions().then(() => {
        process.exit(0);
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
} else {
    module.exports = {
        COURSE_CODE_TO_NAME,
        loadTrainingDataFromDB,
        trainModel,
        recalculateAllPredictions
    };
}
