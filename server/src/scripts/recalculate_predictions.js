require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { prisma } = require('../infrastructure/database/prisma');
const { calibrate, getPrerequisites, ACADEMIC_PREREQUISITES } = require('../ai/regression');
const fs = require('fs');
const path = require('path');

const modelCachePath = path.join(__dirname, '..', '..', 'src', 'ai', 'models', 'regression', 'trained_model.json');
const datasetPath = path.join(__dirname, '..', '..', 'src', 'datasets', 'training_data.json');

async function recalculateAllPredictions(shouldExit = false) {
    console.log('Bắt đầu tính toán lại toàn bộ dự báo...');
    
    let modelCache = {};
    if (fs.existsSync(modelCachePath)) {
        modelCache = JSON.parse(fs.readFileSync(modelCachePath, 'utf8'));
    } else {
        console.error('Không tìm thấy modelCache!');
        return;
    }

    let trainingData = { students: [] };
    if (fs.existsSync(datasetPath)) {
        trainingData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    }
    
    const trainScoresMap = {};
    Object.keys(modelCache).forEach(target => {
        trainScoresMap[target] = trainingData.students.filter(s => s.scores[target] != null).map(s => s.scores[target]);
    });

    const students = await prisma.student.findMany({ include: { scores: true } });
    console.log(`Tìm thấy ${students.length} sinh viên trong Database.`);
    
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

    const getTrainingName = (id) => {
        const c = dbCourses.find(x => x.id === id);
        if (!c) return null;
        const exact = trainingData.subjects.find(s => s === c.name);
        if (exact) return exact;
        const lower = trainingData.subjects.find(s => s.toLowerCase() === c.name.toLowerCase());
        if (lower) return lower;
        if (id === 'WEB3023') return 'Thiết kế Web với HTML5 & CSS3';
        if (id === 'PRO2201') return 'Dự án tốt nghiệp';
        return c.name;
    };

    let count = 0;

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

                await prisma.prediction.upsert({
                    where: { mssv_courseId: { mssv, courseId: courseId } },
                    update: { predictedScore: predicted, risk, confidence: 0.85, explanation: 'Tính toán hàng loạt (kịch bản DB)', reasons: JSON.stringify(reasons) },
                    create: { mssv, courseId: courseId, predictedScore: predicted, risk, confidence: 0.85, explanation: 'Tính toán hàng loạt (kịch bản DB)', reasons: JSON.stringify(reasons) }
                });
                count++;
            }
        }
    }
    console.log(`✅ Đã tính toán và lưu ${count} dự báo vào Database.`);
    if (shouldExit) {
        process.exit(0);
    }
    return count;
}

if (require.main === module) {
    recalculateAllPredictions(true).catch(e => {
        console.error(e);
        process.exit(1);
    });
} else {
    module.exports = { recalculateAllPredictions };
}
