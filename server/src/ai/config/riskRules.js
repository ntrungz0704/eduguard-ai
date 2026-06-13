/**
 * Risk Rules Registry
 * Cấu hình trọng số tính toán Rủi ro. 
 * Chỉ sử dụng dữ liệu thực tế tồn tại trong cơ sở dữ liệu.
 */
const RISK_WEIGHTS = {
  LOW_GPA: 0.35,              // GPA 35%
  PREREQUISITE_BREAK: 0.25,   // Hổng môn tiên quyết 25%
  TREND_DECLINE: 0.20,        // Suy thoái GPA 20%
  DELAY_RISK: 0.20            // Chỉ số trễ tiến độ 20%
};

const RISK_LEVELS = {
  LOW: { min: 0, max: 25, label: 'LOW', emoji: '🟢' },
  MEDIUM: { min: 26, max: 50, label: 'MEDIUM', emoji: '🟡' },
  HIGH: { min: 51, max: 75, label: 'HIGH', emoji: '🟠' },
  CRITICAL: { min: 76, max: 100, label: 'CRITICAL', emoji: '🔴' },
};

const RISK_THRESHOLDS = {
  GPA_CRITICAL_DROP: 1.5,
  GPA_WARNING_DROP: 0.5,
  MIN_PASS_SCORE: 5.0
};

module.exports = {
  RISK_WEIGHTS,
  RISK_LEVELS,
  RISK_THRESHOLDS
};
