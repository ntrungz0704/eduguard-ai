// ============================================================
// EduGuard AI — Chart Builder
// Builds JSON data structures for Frontend rendering
// ============================================================

/**
 * Tạo dữ liệu biểu đồ phân bổ rủi ro (Risk Distribution)
 */
function buildRiskDistributionChartData(distribution) {
  if (!distribution) return null;
  return {
    type: 'risk_distribution',
    data: {
      labels: ['🟢 Tốt', '🟡 Cảnh báo', '🟠 Nguy cơ', '🔴 Báo động'],
      datasets: [{
        label: 'Số lượng sinh viên',
        data: [
          distribution.LOW || 0,
          distribution.MEDIUM || 0,
          distribution.HIGH || 0,
          distribution.CRITICAL || 0
        ],
        backgroundColor: ['#4caf50', '#ffeb3b', '#ff9800', '#f44336']
      }]
    }
  };
}

/**
 * Tạo dữ liệu biểu đồ môn học thắt cổ chai (Bottleneck)
 */
function buildBottleneckChartData(bottlenecks) {
  if (!bottlenecks || bottlenecks.length === 0) return null;
  const topSubjects = bottlenecks.slice(0, 5);
  return {
    type: 'bottleneck',
    data: {
      labels: topSubjects.map(b => b.courseId),
      datasets: [{
        label: 'Số lượng nợ môn',
        data: topSubjects.map(b => b.failCount),
        backgroundColor: '#e91e63'
      }]
    }
  };
}

/**
 * Tạo dữ liệu biểu đồ GPA giả lập (Line Chart)
 */
function buildGpaChartData(currentGpa) {
  const gpa = Number(currentGpa) || 0;
  return {
    type: 'gpa',
    data: {
      labels: ['Kỳ 1', 'Kỳ 2', 'Kỳ 3', 'Kỳ 4', 'Kỳ hiện tại (Dự kiến)'],
      datasets: [{
        label: 'Điểm trung bình (GPA)',
        data: [
          Math.max(0, gpa - 1.2),
          Math.max(0, gpa - 0.5),
          Math.max(0, gpa - 0.2),
          gpa,
          Math.min(10, gpa + 0.3)
        ],
        borderColor: '#2196f3',
        tension: 0.3
      }]
    }
  };
}

module.exports = {
  buildRiskDistributionChartData,
  buildBottleneckChartData,
  buildGpaChartData
};
