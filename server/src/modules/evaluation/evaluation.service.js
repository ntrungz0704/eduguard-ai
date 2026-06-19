const { prisma } = require('../../infrastructure/database/prisma');

class EvaluationService {
  /**
   * Chạy hệ thống Đánh giá Tự động:
   * Quét bảng PredictionHistory, đối chiếu với điểm thật trong Score.
   * Nếu có điểm thật (PASSED/FAILED), ghi vào PredictionEvaluation và xóa khỏi History.
   */
  async runValidation() {
    try {
      console.log('Bắt đầu quy trình Auto Continuous Validation...');
      
      // 1. Lấy toàn bộ lịch sử dự đoán đang treo (chờ điểm thật)
      const pendingHistories = await prisma.predictionHistory.findMany();
      if (pendingHistories.length === 0) {
        console.log('Không có dự đoán nào đang chờ đối chiếu.');
        return { evaluatedCount: 0 };
      }

      let evaluatedCount = 0;

      // Lấy danh sách điểm số thực tế để đối chiếu (Bulk Query for performance)
      const pendingPairs = pendingHistories.map(h => ({ mssv: h.mssv, courseId: h.courseId }));
      
      // Lọc ra các điểm đã hoàn thành
      const completedScores = await prisma.score.findMany({
        where: {
          OR: pendingPairs,
          status: { in: ['PASSED', 'FAILED'] },
          value: { not: null }
        }
      });

      // Tạo lookup table cho điểm thực tế
      const scoreLookup = {};
      for (const score of completedScores) {
        scoreLookup[`${score.mssv}_${score.courseId}`] = score.value;
      }

      // 2. Chạy đối chiếu và xử lý
      for (const history of pendingHistories) {
        const actualScore = scoreLookup[`${history.mssv}_${history.courseId}`];
        
        if (actualScore !== undefined && actualScore !== null) {
          // Điểm thật đã xuất hiện!
          const absoluteError = Math.abs(history.predictedScore - actualScore);
          const squaredError = Math.pow(absoluteError, 2);

          // Atomic Transaction: Chèn vào Evaluation và Xóa khỏi History
          await prisma.$transaction([
            prisma.predictionEvaluation.create({
              data: {
                mssv: history.mssv,
                courseId: history.courseId,
                predictedScore: history.predictedScore,
                actualScore: actualScore,
                absoluteError,
                squaredError
              }
            }),
            prisma.predictionHistory.delete({
              where: { id: history.id }
            })
          ]);

          evaluatedCount++;
        }
      }

      console.log(`Hoàn tất Auto Validation. Đã đối chiếu thành công: ${evaluatedCount} bản ghi.`);
      return { evaluatedCount };

    } catch (error) {
      console.error('Lỗi nghiêm trọng trong quá trình Auto Validation:', error);
      throw error;
    }
  }

  /**
   * Tính toán thống kê toàn cục cho Dashboard (AI Performance Over Time)
   */
  async getEvaluationMetrics() {
    // 1. Tổng số liệu
    const totalStudents = await prisma.student.count();
    const pendingPredictions = await prisma.predictionHistory.count();
    const validatedPredictions = await prisma.predictionEvaluation.count();

    // 2. Trung bình sai số
    const evaluations = await prisma.predictionEvaluation.findMany();
    
    let sumAE = 0;
    let sumSE = 0;
    let accuracy05 = 0;
    let accuracy10 = 0;

    for (const ev of evaluations) {
      sumAE += ev.absoluteError;
      sumSE += ev.squaredError;
      if (ev.absoluteError <= 0.5) accuracy05++;
      if (ev.absoluteError <= 1.0) accuracy10++;
    }

    const n = evaluations.length;
    let mae = 0, rmse = 0, acc05 = 0, acc10 = 0;

    if (n > 0) {
      mae = sumAE / n;
      rmse = Math.sqrt(sumSE / n);
      acc05 = (accuracy05 / n) * 100;
      acc10 = (accuracy10 / n) * 100;
    }

    // 3. Phân bổ xu hướng theo năm (Group by Year)
    const trends = {};
    for (const ev of evaluations) {
      const year = ev.evaluationDate.getFullYear();
      if (!trends[year]) {
        trends[year] = { count: 0, sumAE: 0, sumSE: 0, acc10: 0 };
      }
      trends[year].count++;
      trends[year].sumAE += ev.absoluteError;
      trends[year].sumSE += ev.squaredError;
      if (ev.absoluteError <= 1.0) trends[year].acc10++;
    }

    const yearlyTrends = Object.keys(trends).map(year => {
      const data = trends[year];
      return {
        year,
        validatedCount: data.count,
        mae: data.count > 0 ? (data.sumAE / data.count).toFixed(2) : 0,
        rmse: data.count > 0 ? Math.sqrt(data.sumSE / data.count).toFixed(2) : 0,
        accuracy10: data.count > 0 ? Math.round((data.acc10 / data.count) * 100) : 0
      };
    }).sort((a, b) => a.year - b.year);

    return {
      overview: {
        totalStudents,
        pendingPredictions,
        validatedPredictions,
        mae: mae.toFixed(2),
        rmse: rmse.toFixed(2),
        accuracy05: Math.round(acc05),
        accuracy10: Math.round(acc10)
      },
      yearlyTrends
    };
  }
}

module.exports = new EvaluationService();
