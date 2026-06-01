const { calculateBaseRisk, getRiskLevel } = require('./riskEngine');

/**
 * Trend-based Risk Forecasting (Forecast Engine)
 * Renamed from Predict Engine to avoid "AI Prediction" claims in academic defense.
 */
function forecastTrend(student, timeframeStr) {
  const currentRisk = calculateBaseRisk(student);
  
  let riskIncrement = 0;
  let gpaDecrement = 0;

  if (timeframeStr.includes('2 tuần')) {
    riskIncrement = 15;
    gpaDecrement = 0.2;
  } else if (timeframeStr.includes('4 tuần') || timeframeStr.includes('tháng')) {
    riskIncrement = 30;
    gpaDecrement = 0.5;
  } else {
    // Học kỳ tới
    riskIncrement = 45;
    gpaDecrement = 1.0;
  }

  if (currentRisk.factors.TREND_DECLINE > 0) {
    riskIncrement += 10;
  }

  const futureScore = Math.min(100, currentRisk.riskScore + riskIncrement);
  const futureGpa = Math.max(0, currentRisk.gpa - gpaDecrement);
  const fLevel = getRiskLevel(futureScore).label;

  return {
    currentScore: currentRisk.riskScore,
    currentLevel: currentRisk.level,
    futureScore: futureScore,
    futureLevel: fLevel,
    futureGpa: futureGpa,
    insight: `Trend Forecast: Theo xu hướng hiện tại, Risk Score dự báo sẽ tăng từ ${currentRisk.riskScore} lên ${futureScore} (${fLevel}) trong ${timeframeStr}.`
  };
}

module.exports = {
  forecastTrend
};
