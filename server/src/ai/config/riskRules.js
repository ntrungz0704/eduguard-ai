/**
 * Risk Rules Registry
 * Cấu hình trọng số tính toán Rủi ro. 
 * Engine chỉ đọc Config, không chứa Hardcode.
 */
const RISK_WEIGHTS = {
  LOW_GPA: 0.25,              // GPA 25%
  ATTENDANCE_DROP: 0.20,      // CC 20%
  PREREQUISITE_BREAK: 0.15,   // Môn TQ 15%
  TREND_DECLINE: 0.15,        // Trend 15%
  BEHAVIOR_ANOMALY: 0.10,     // Behavior 10%
  LEARNING_STYLE_MISMATCH: 0.15 // Lệch pha phong cách học & Ngành học 15%
};

const RISK_LEVELS = {
  LOW: { min: 0, max: 25, label: 'LOW', emoji: '🟢' },
  MEDIUM: { min: 26, max: 50, label: 'MEDIUM', emoji: '🟡' },
  HIGH: { min: 51, max: 75, label: 'HIGH', emoji: '🟠' },
  CRITICAL: { min: 76, max: 100, label: 'CRITICAL', emoji: '🔴' },
};

const RISK_THRESHOLDS = {
  ATTENDANCE_CRITICAL: 60,
  ATTENDANCE_WARNING: 70,
  ATTENDANCE_NOTICE: 80,
  
  GPA_CRITICAL_DROP: 1.5,
  GPA_WARNING_DROP: 0.5,
  
  MIN_PASS_SCORE: 5.0
};

module.exports = {
  RISK_WEIGHTS,
  RISK_LEVELS,
  RISK_THRESHOLDS
};
