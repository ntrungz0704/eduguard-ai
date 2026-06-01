const { calculateBaseRisk } = require('./riskEngine');

/**
 * Priority Matrix Engine
 * Sorts students by Severity (Risk Score) + Urgency + Impact
 */
function getPriorityList(students, topN = 5) {
  const profiles = students.map(s => {
    const risk = calculateBaseRisk(s);
    
    // Priority Matrix logic: Impact & Urgency modifiers
    // E.g., failing a level-100 course is more impactful for future chain
    let priorityScore = risk.riskScore;
    
    // Urgency: If attendance is dropping critically right now
    if (risk.avgAttendance < 60) priorityScore += 10;
    
    // Impact: Foundational subjects failed
    const foundationalFails = risk.failedCourses.filter(c => {
      const match = c.courseId.match(/\d+/);
      return match && parseInt(match[0]) <= 104; // Very early courses
    }).length;
    priorityScore += (foundationalFails * 5);

    return {
      mssv: s.mssv || s.id,
      name: s.name,
      ...risk,
      priorityScore
    };
  });

  profiles.sort((a, b) => b.priorityScore - a.priorityScore);
  
  return profiles.slice(0, topN).map(p => ({
    mssv: p.mssv,
    name: p.name,
    riskScore: p.riskScore,
    priorityScore: p.priorityScore,
    level: p.level,
    failedCount: p.failedCourses.length
  }));
}

module.exports = {
  getPriorityList
};
