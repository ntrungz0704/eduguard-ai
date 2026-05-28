const { PrismaClient } = require('./generated/prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { calculateExplainableRisk } = require('./src/ai/dssEngine');
const path = require('path');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Đang cập nhật dữ liệu chuyên cần và rủi ro vào CSDL...');

  // 1. Cập nhật chuyên cần
  const scores = await prisma.score.findMany({ where: { attendance: null } });
  let count = 0;
  for (const score of scores) {
    let newAttendance = 0.8;
    if (score.value !== null && score.value < 5) {
      newAttendance = Math.random() * 0.4 + 0.4; // 40-80%
    } else if (score.value !== null && score.value >= 8) {
      newAttendance = Math.random() * 0.2 + 0.8; // 80-100%
    } else {
      newAttendance = Math.random() * 0.4 + 0.6; // 60-100%
    }
    
    // Làm tròn 2 chữ số thập phân
    newAttendance = Math.round(newAttendance * 100) / 100;

    await prisma.score.update({
      where: { id: score.id },
      data: { attendance: newAttendance }
    });
    count++;
  }
  console.log(`✅ Đã cập nhật chuyên cần cho ${count} bản ghi điểm số.`);

  // 2. Cập nhật Prediction từ DSS
  const students = await prisma.student.findMany({ include: { scores: true } });
  let predCount = 0;
  for (const student of students) {
    const riskData = calculateExplainableRisk(student);
    
    const courseId = student.scores.length > 0 ? student.scores[student.scores.length - 1].courseId : null;
    if (!courseId) continue; // Không có courseId thì bỏ qua

    const existing = await prisma.prediction.findFirst({
        where: { mssv: student.mssv, courseId }
    });

    if (existing) {
        await prisma.prediction.update({
            where: { id: existing.id },
            data: {
                predictedScore: riskData.riskScore,
                risk: riskData.level,
                confidence: 0.85,
                reasons: JSON.stringify(riskData.reasons),
            }
        });
    } else {
        await prisma.prediction.create({
            data: {
                mssv: student.mssv,
                courseId: courseId,
                predictedScore: riskData.riskScore,
                risk: riskData.level,
                confidence: 0.85,
                explanation: "DSS Engine Calculation",
                reasons: JSON.stringify(riskData.reasons)
            }
        });
    }
    predCount++;
  }
  
  console.log(`✅ Đã cập nhật/tạo mới ${predCount} dự báo rủi ro.`);
  console.log("Hoàn tất!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
