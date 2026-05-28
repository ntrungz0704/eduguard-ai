const { prisma } = require('../infrastructure/database/prisma');
const { calculateFptGPA } = require('../utils/dataService');

async function getStudentContext(mssv, limit = 5) {
  if (!mssv) return { student: null, chunks: [] };
  
  try {
    let cleanMssv = mssv.toUpperCase().trim();
    if (/^\d{5}$/.test(cleanMssv)) {
      cleanMssv = `PS${cleanMssv}`;
    }
    const student = await prisma.student.findUnique({
      where: { mssv: cleanMssv },
      include: {
        scores: { include: { course: true } },
        predictions: { include: { course: true } },
        interventions: true
      }
    });

    if (!student) return { student: null, chunks: [] };

    const chunks = [];

    // Chunk 0: Thông tin tổng quan và GPA tích lũy chuẩn FPT Polytechnic
    const gpa = calculateFptGPA(student.scores);
    chunks.push(`THÔNG TIN TỔNG QUAN của ${student.name} (${student.mssv}): Lớp: ${student.classCode || 'WD18301'}. Điểm trung bình tích lũy (GPA) chuẩn FPT Polytechnic: ${gpa.toFixed(1)}/10.`);

    // Chunk 1: Bảng điểm thực tế
    const scoresArr = student.scores.map(s => {
      const valStr = s.value === null ? "Đang học" : `${s.value}đ`;
      return `${s.course?.name || s.courseId}: ${valStr} (${s.status || 'NORMAL'})`;
    });
    if (scoresArr.length > 0) {
      chunks.push(`BẢNG ĐIỂM THỰC TẾ của ${student.name} (${student.mssv}): ${scoresArr.join('; ')}`);
    }

    // Chunk 2: Dự báo từ mô hình Pearson & Hồi quy tuyến tính học thuật
    const predictionsArr = student.predictions.map(p => {
      return `${p.course?.name || p.courseId}: dự kiến đạt ${p.predictedScore.toFixed(1)}đ, Rủi ro trượt: ${p.risk} (${p.reasons || 'Không rõ lý do'})`;
    });
    if (predictionsArr.length > 0) {
      chunks.push(`CHỈ SỐ DỰ BÁO RỦI RO HỌC THUẬT: ${predictionsArr.join(' | ')}`);
    }

    // Chunk 3: Lịch sử can thiệp sư phạm
    if (student.interventions && student.interventions.length > 0) {
      const list = student.interventions.map(i => `Môn ${i.courseId}: [${i.status}] - ${i.action || 'Cần bổ trợ ngay'}`).join(' | ');
      chunks.push(`LỊCH SỬ CAN THIỆP SƯ PHẠM: ${list}`);
    }

    // Chunk 4: Các môn học bị trượt (điểm < 5.0)
    const failedScores = student.scores.filter(s => s.value !== null && s.value < 5);
    if (failedScores.length > 0) {
      chunks.push(`CẢNH BÁO RỚT MÔN THỰC TẾ: Sinh viên đã rớt các môn sau: ${failedScores.map(s => s.course?.name || s.courseId).join(', ')}`);
    }

    return {
      student: {
        mssv: student.mssv,
        name: student.name,
        classCode: student.classCode || 'WD18301'
      },
      chunks: chunks.slice(0, limit)
    };
  } catch (err) {
    console.error(`[RAG Service] Lỗi truy vấn MSSV ${mssv}:`, err);
    return { student: null, chunks: [] };
  }
}

module.exports = { getStudentContext };
