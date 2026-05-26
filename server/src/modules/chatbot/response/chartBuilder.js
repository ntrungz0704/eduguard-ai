// ============================================================
// EduGuard AI — Chart Builder
// Builds JSON data structures for Frontend rendering
// ============================================================

/**
 * Tạo dữ liệu biểu đồ phân bổ rủi ro (Risk Distribution) cho Recharts
 */
function buildRiskDistributionChartData(distribution) {
  if (!distribution) return null;
  return {
    type: 'risk_distribution',
    data: [
      { name: '🔴 Báo động (CRITICAL)', value: distribution.CRITICAL || 0, fill: '#ef4444' },
      { name: '🟠 Nguy cơ (HIGH)', value: distribution.HIGH || 0, fill: '#f97316' },
      { name: '🟡 Cảnh báo (MEDIUM)', value: distribution.MEDIUM || 0, fill: '#eab308' },
      { name: '🟢 Tốt (LOW)', value: distribution.LOW || 0, fill: '#22c55e' }
    ]
  };
}

/**
 * Tạo dữ liệu biểu đồ môn học thắt cổ chai (Bottleneck) cho Recharts
 */
function buildBottleneckChartData(bottlenecks) {
  if (!bottlenecks || bottlenecks.length === 0) return null;
  const topSubjects = bottlenecks.slice(0, 5);
  return {
    type: 'bottleneck',
    data: topSubjects.map(b => ({
      name: b.courseId,
      failCount: b.failCount
    }))
  };
}

/**
 * Tạo dữ liệu biểu đồ GPA giả lập (Line Chart) cho Recharts
 */
function buildGpaChartData(currentGpa) {
  const gpa = Number(currentGpa) || 0;
  return {
    type: 'gpa',
    data: [
      { semester: 'Kỳ 1', gpa: Math.max(0, gpa - 1.2) },
      { semester: 'Kỳ 2', gpa: Math.max(0, gpa - 0.5) },
      { semester: 'Kỳ 3', gpa: Math.max(0, gpa - 0.2) },
      { semester: 'Kỳ 4', gpa: gpa },
      { semester: 'Dự kiến', gpa: Math.min(10, gpa + 0.3) }
    ]
  };
}

module.exports = {
  buildRiskDistributionChartData,
  buildBottleneckChartData,
  buildGpaChartData
};
