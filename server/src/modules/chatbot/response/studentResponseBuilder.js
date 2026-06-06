const knowledgeCache = require('../../knowledge/cache');

function buildSyllabusResponse(courseId) {
  const coursesDb = knowledgeCache.get('courses') || [];
  const course = coursesDb.find(c => c.courseCode === courseId);
  
  if (!course) {
    return {
      text: `🤖 Xin lỗi, mình không tìm thấy thông tin cho môn học **${courseId}**. Bạn có muốn tìm kiếm môn học khác không?`,
      chartData: null,
      actions: ['Tìm môn học khác']
    };
  }

  return {
    text: `📚 **Thông tin môn học: ${course.courseName} (${course.courseCode})**
    
- **Số tín chỉ**: ${course.credits}
- **Điều kiện tiên quyết**: ${course.prerequisites.length > 0 ? course.prerequisites.join(', ') : 'Không có'}
- **Mô tả**: Đây là học phần quan trọng, tập trung vào: ${course.skills.join(', ')}.
- **Công nghệ sử dụng**: ${course.technologies.join(', ')}

💡 **Mẹo học tập**: Hãy đảm bảo bạn nắm vững ${course.skills[0]} vì nó rất cần thiết cho các môn học sau.`,
    chartData: null,
    actions: ['Xem lộ trình học', 'Môn học tiên quyết']
  };
}

function buildStudentCareerPath(data) {
  const { careerGoal, careerAnalysis } = data;
  if (!careerAnalysis || !careerAnalysis.industryRequirements) {
    return {
      text: `🤖 Mình chưa có lộ trình Industry cho nghề **${careerGoal}**. Bạn có thể thử các nghề như Backend Developer, Frontend Developer, Data Analyst...`,
      chartData: null,
      actions: ['Lộ trình Backend', 'Lộ trình AI Engineer']
    };
  }

  const { mode, description, marketInsights } = careerAnalysis;
  const matchScore = careerAnalysis.matchScore;
  const readiness = careerAnalysis.readinessScore;
  
  // Base formatting for Portfolios
  const portfolios = careerAnalysis.portfolios.map((p, i) => {
    return `${i + 1}. **${p.name}**\n   *Cần học:* ${p.learnToApply.join(', ')}`;
  }).join('\n\n');

  if (mode === 'GUEST') {
    return {
      text: `# 🎯 Tổng quan Nghề nghiệp: ${careerAnalysis.careerGoal}

${description}

---

### 💼 Kỹ năng doanh nghiệp cần (Kỹ năng yêu cầu)
Dưới đây là những công nghệ phổ biến nhất thị trường yêu cầu:

**Core Skills (Cốt lõi):**
${careerAnalysis.industryRequirements.core.map(s => `- ${s}`).join('\n')}

**Advanced Skills (Nâng cao):**
${careerAnalysis.industryRequirements.advanced.map(s => `- ${s}`).join('\n')}

**Công cụ (Tools):** ${careerAnalysis.industryRequirements.tools.join(', ')}
**Kỹ năng mềm (Soft Skills):** ${careerAnalysis.industryRequirements.soft.join(', ')}

---

### 📁 Gợi ý Dự án (Portfolio)
Để gây ấn tượng với nhà tuyển dụng, bạn nên làm các dự án sau:
${portfolios}

---

### 📈 Triển vọng nghề nghiệp
- **Nhu cầu tuyển dụng:** ${marketInsights.marketDemand}
- **Mức lương tham khảo:** ${typeof marketInsights.salaryRange === 'string' ? marketInsights.salaryRange : `${marketInsights.salaryRange.junior} (Fresher/Junior)`}
- **Xu hướng tương lai:** ${marketInsights.futureTrend}

*(Lưu ý: Để phân tích mức độ phù hợp và Skill Gap của riêng bạn, vui lòng đăng nhập vào hệ thống!)*`,
      chartData: null,
      actions: ['Tình hình học tập', 'Lộ trình Data Engineer']
    };
  }

  // Student Mode
  const missingCoursesList = careerAnalysis.missingCourses
    .filter(c => c.weight >= 2)
    .slice(0, 2)
    .map(c => `**${c.courseId} - ${c.courseName}**\n\nNếu hoàn thành:\n+${c.impactScore || 5} Readiness`)
    .join('\n\n━━━━━━━━━━━━━━\n\n') || 'Đã hoàn thành các môn quan trọng.';

  const topSkillsList = careerAnalysis.topMissingSkills.slice(0, 3).map((s, idx) => {
    return `${idx + 1}. ${s.skill} (+${s.gainedReadiness || 5} điểm)`;
  }).join('\n') || 'Đã cover hết các kỹ năng cốt lõi.';

  const portfoliosList = careerAnalysis.portfolios.slice(0, 2).map((p, idx) => {
    const pSkills = p.learnToApply ? p.learnToApply.map(t => `- ${t}`).join('\n') : '';
    return `**${p.name}**\n\nTech:\n${pSkills}`;
  }).join('\n\n━━━━━━━━━━━━━━\n\n') || 'Chưa có gợi ý dự án.';

  let timeEstimate = '3-4 tuần';
  const weeks = careerAnalysis.estimatedWeeks || 0;
  if (weeks > 8) {
    const monthsMin = Math.floor(weeks / 4);
    const monthsMax = monthsMin + 1;
    timeEstimate = `${monthsMin}-${monthsMax} tháng`;
  } else if (weeks > 4) {
    timeEstimate = '1-2 tháng';
  } else if (weeks > 0) {
    timeEstimate = `${weeks}-${weeks + 1} tuần`;
  } else {
    timeEstimate = 'Đã sẵn sàng apply thực tập';
  }

  let breakdownMarkdown = '';
  if (careerAnalysis.mode === 'STUDENT') {
    const projectedReadiness = careerAnalysis.projectedReadiness;
    let targetLabel = 'Sẵn sàng thực tập';
    if (projectedReadiness >= 80) targetLabel = 'Sẵn sàng đi làm (Job Ready)';
    else if (projectedReadiness >= 61) targetLabel = 'Sẵn sàng thực tập (Internship Ready)';
    else if (projectedReadiness >= 41) targetLabel = 'Thực tập sinh cơ bản (Beginner Intern)';
    else if (projectedReadiness >= 21) targetLabel = 'Nền tảng (Foundation)';
    else targetLabel = 'Khám phá (Explorer)';

    let cumulativePoints = careerAnalysis.readinessScore;
    const forecastsMarkdown = careerAnalysis.forecasts.map(f => {
      cumulativePoints += f.points;
      return `Sau khi ${f.action.toLowerCase()}:\n${cumulativePoints}/100\n`;
    }).join('\n');

    breakdownMarkdown = `━━━━━━━━━━━━━━

💡 Điểm của bạn đến từ đâu?

Học tập (Academic):
${Math.round((careerAnalysis.scores.academic / 100) * 30)}/30

Kỹ năng chuyên môn (Industry Skills):
${Math.round((careerAnalysis.scores.industry / 100) * 40)}/40

Dự án (Portfolio):
${Math.round((careerAnalysis.scores.portfolio / 100) * 20)}/20

Thái độ/Hành vi (Behavior):
${Math.round((careerAnalysis.scores.behavior / 100) * 10)}/10

━━━━━━━━━━━━━━

🔥 ${Math.min(3, careerAnalysis.topMissingSkills.length)} kỹ năng quan trọng nhất cần học

${topSkillsList}

━━━━━━━━━━━━━━

📚 ${Math.min(2, careerAnalysis.missingCourses.filter(c => c.weight >= 2).length)} môn học ảnh hưởng lớn nhất

${missingCoursesList}

━━━━━━━━━━━━━━

📁 Project nên làm

${portfoliosList}

━━━━━━━━━━━━━━

🚀 Dự báo

Hiện tại:
${careerAnalysis.readinessScore}/100

${forecastsMarkdown}
Level:
${targetLabel}

━━━━━━━━━━━━━━

⏳ Thời gian ước tính

${careerAnalysis.estimatedMonthsText || timeEstimate}

Nếu học 1-2 giờ/ngày`;
  }

  return {
    text: `🎯 ${careerAnalysis.careerGoal}

Readiness: ${careerAnalysis.readinessScore}/100
Level: ${careerAnalysis.readinessLevel}

${breakdownMarkdown}`,
    chartData: null,
    actions: ['Gợi ý nghề nghiệp phù hợp', 'Lên kế hoạch 90 ngày cho em']
  };
}

function buildBestCareersSuggestion(bestCareers) {
  if (!bestCareers || bestCareers.length === 0) {
    return {
      text: "🤖 Hiện tại mình không thể gợi ý nghề nghiệp vì chưa đủ dữ liệu học tập của bạn.",
      chartData: null,
      actions: []
    };
  }

  const list = bestCareers.slice(0, 5).map(c => `- **${c.careerName}**: Match ${c.matchScore}% | Readiness ${c.readinessScore}%`).join('\n');

  return {
    text: `# 🎯 Top 5 Nghề nghiệp phù hợp nhất (Career Match)
    
Dựa trên các môn học bạn đã hoàn thành và kỹ năng bạn đã tích lũy, EduGuard AI đề xuất các hướng đi sau:

${list}

Bạn muốn xem chi tiết lộ trình và Skill Gap của ngành nào? (Ví dụ: "Lộ trình Frontend Developer")`,
    chartData: null,
    actions: [`Lộ trình ${bestCareers[0].careerName}`, `Lộ trình ${bestCareers[1].careerName}`]
  };
}

function buildStudentAnalysisResponse(decisionData) {
  const { student, riskData, timeline } = decisionData;
  
  if (!student) {
    return {
      text: `🤖 Xin lỗi, mình cần bạn cung cấp thông tin sinh viên trước để phân tích.`,
      chartData: null,
      actions: null
    };
  }

  const rLevel = riskData ? (riskData.riskLevel || 'LOW') : 'LOW';
  const cFailures = riskData && riskData.criticalFailures ? riskData.criticalFailures : [];
  const reasonsList = riskData && riskData.reasons ? riskData.reasons : ['Không có rủi ro đáng kể.'];
  const fText = timeline && timeline.forecastText ? timeline.forecastText : 'Chưa có dự báo cụ thể.';

  return {
    text: `📊 **Phân tích rủi ro học tập - Sinh viên: ${student.mssv}**
    
- **Mức độ rủi ro**: ${rLevel}
- **Môn học nguy hiểm**: ${cFailures.join(', ') || 'Không có'}
- **Nguyên nhân cốt lõi**:
${reasonsList.map(r => `  - ${r}`).join('\n')}

🔮 **Dự báo Timeline (Academic Timeline)**:
${fText}

💡 **Lời khuyên**: ${cFailures.length > 0 ? `Cần ưu tiên qua môn ${cFailures[0]} để không bị chậm tiến độ.` : 'Tiến độ học tập rất tốt, hãy duy trì phong độ này nhé!'}`,
    chartData: null,
    actions: ['Hỏi nguyên nhân gốc rễ', 'Mô phỏng điểm GPA']
  };
}

function buildGpaSimulationResponse(decisionData) {
  const { mode, value, additionalValue, scenario } = decisionData;
  let scenarioDesc = '';
  if (mode === 'SCORE') scenarioDesc = `đạt điểm ${value} các môn tiếp theo`;
  else if (mode === 'FAIL_SUBJECT') scenarioDesc = `rớt môn ${value}`;
  else if (mode === 'ATTENDANCE') scenarioDesc = `chỉ đi học ${value}%`;
  else if (mode === 'RECOVERY_SCENARIO') scenarioDesc = `đi học ${value}% và đạt điểm ${additionalValue}`;

  return {
    text: `🎲 **Mô phỏng kịch bản (What-If Analysis)**
    
Nếu bạn **${scenarioDesc}**:
- **GPA dự kiến**: ${scenario.projectedGpa}
- **Trạng thái tín chỉ**: ${scenario.creditStatus}
- **Mức độ cảnh báo**: ${scenario.warningLevel}

💡 **Kết luận**: ${scenario.advice}`,
    chartData: null,
    actions: ['Thử kịch bản khác', 'Xem phân tích rủi ro']
  };
}

function buildRiskChainResponse(decisionData) {
  const { courseId, graphData } = decisionData;
  return {
    text: `⛓️ **Phân tích chuỗi rủi ro (Risk Chain)**
    
Nếu bạn trượt môn **${courseId}**, nó sẽ tạo ra hiệu ứng dây chuyền ảnh hưởng đến các môn sau:
${graphData.impacted.map(i => `- ${i}`).join('\n')}

**Tổng số tín chỉ bị chặn**: ${graphData.blockedCredits}

⚠️ Bạn bắt buộc phải qua môn này nếu không muốn bị trễ hạn tốt nghiệp 1 học kỳ!`,
    chartData: {
      type: 'impact_graph',
      nodes: graphData.nodes,
      edges: graphData.edges
    },
    actions: ['Hỏi cách cải thiện', 'Mô phỏng điểm GPA']
  };
}

function buildFallbackResponse() {
  return {
    text: `🤖 Mình là EduGuard AI - Trợ lý Cố vấn Học vụ Thông minh.
    
Mình có thể giúp bạn:
1. **Tìm hiểu thông tin môn học** (Ví dụ: COM108 là gì?)
2. **Phân tích rủi ro học tập cá nhân** (Ví dụ: Tình hình học tập của em sao rồi?)
3. **Mô phỏng điểm số** (Ví dụ: Nếu em rớt WEB101 thì sao?)
4. **Tư vấn Lộ trình nghề nghiệp** (Ví dụ: Em muốn làm Backend Developer)

Bạn muốn mình giúp gì nào?`,
    chartData: null,
    actions: ['Tình hình học tập của em?', 'Em muốn làm Backend Developer']
  };
}

function buildCareerReasonResponse(decisionData) {
  const { careerGoal, bestCareers, careerAnalysis } = decisionData;
  const matchInfo = bestCareers.find(c => c.careerName.toLowerCase() === careerGoal.toLowerCase()) || { matchScore: 0, readinessScore: 0 };
  
  let haveList = '';
  let missingList = '';
  
  if (careerAnalysis && careerAnalysis.skillGap) {
    const { core, advanced } = careerAnalysis.skillGap;
    haveList = [...core.have, ...advanced.have].join(', ');
    missingList = [...core.missing, ...advanced.missing].map(s => `❌ ${s}`).join('\n');
  }

  return {
    text: `# 🧠 Vì sao bạn hợp với ${careerGoal}?

Bạn đạt mức độ phù hợp **${matchInfo.matchScore}%** cho vị trí này.

**✅ Lý do (Những gì bạn đã có):**
Vì bạn đã hoàn thành các môn học liên quan và tích lũy được:
${haveList || 'Các kiến thức nền tảng cơ bản'}

**❌ Tuy nhiên, Match Score chưa đạt 100% vì bạn chưa học:**
${missingList || 'Chưa có thông tin'}

💡 *Để cải thiện Match Score, hãy hoàn thành các môn nợ hoặc chủ động học thêm các kỹ năng trên!*`,
    chartData: null,
    actions: [`Làm sao để đạt thực tập ${careerGoal}?`, `Lên kế hoạch 90 ngày cho em`]
  };
}

function buildInternshipPlanResponse(decisionData) {
  const { careerGoal, careerAnalysis } = decisionData;
  
  let missingSkills = 'Các công nghệ mới';
  if (careerAnalysis && careerAnalysis.skillGap) {
    const missingCore = careerAnalysis.skillGap.core.missing.slice(0, 3).join(', ');
    missingSkills = missingCore || 'Các công nghệ mới';
  }

  const portfolios = careerAnalysis ? careerAnalysis.portfolios.map(p => `- **${p.name}**: Sử dụng ${p.learnToApply.join(', ')}`).join('\n') : '- Xây dựng ứng dụng quản lý thực tế';

  return {
    text: `# 🚀 Bí kíp đạt thực tập ${careerGoal}

Để lọt vào mắt xanh của nhà tuyển dụng cho vị trí **${careerGoal}**, bạn cần tập trung vào 3 bước cốt lõi sau:

### Bước 1: Lấp đầy Skill Gap
Nhà tuyển dụng rất cần những kỹ năng mà trường có thể chưa dạy sâu. Bạn cần tự học gấp:
**${missingSkills}**

### Bước 2: Xây dựng Portfolio thực chiến
Đừng chỉ học lý thuyết! Hãy tạo repository trên GitHub và đẩy code của các dự án sau:
${portfolios}

### Bước 3: Tối ưu CV & Phỏng vấn
- Viết CV nhấn mạnh vào các dự án trên (ghi rõ công nghệ sử dụng).
- Ôn tập kỹ các khái niệm cốt lõi của ${missingSkills}.
- Tham gia các cộng đồng IT để tìm cơ hội Referral.`,
    chartData: null,
    actions: [`Tạo kế hoạch 90 ngày cho em`, `Xem lộ trình ${careerGoal}`]
  };
}

function build90DayPlanResponse(decisionData) {
  const { careerGoal, careerAnalysis } = decisionData;
  
  let missingAll = [];
  if (careerAnalysis && careerAnalysis.skillGap) {
    missingAll = [...careerAnalysis.skillGap.core.missing, ...careerAnalysis.skillGap.advanced.missing];
  }
  
  if (missingAll.length === 0) {
    return {
      text: `🎉 **Bạn đã sẵn sàng!** Bạn không thiếu kỹ năng cốt lõi nào cho ${careerGoal}. Hãy bắt đầu rải CV thực tập ngay nhé!`,
      chartData: null,
      actions: ['Tạo Portfolio', 'Thử nghề khác']
    };
  }

  // Auto-generate weekly plan based on missing skills
  let planMarkdown = '';
  const skillsToLearn = missingAll.slice(0, 6); // Max 6 focus areas for 12 weeks
  const weeksPerSkill = Math.floor(12 / Math.max(1, skillsToLearn.length));
  
  let currentWeek = 1;
  for (let i = 0; i < skillsToLearn.length; i++) {
    const endWeek = currentWeek + weeksPerSkill - 1;
    const weekLabel = endWeek > currentWeek ? `Tuần ${currentWeek}-${endWeek}` : `Tuần ${currentWeek}`;
    planMarkdown += `**${weekLabel}: Focus vào ${skillsToLearn[i]}**\n- Học lý thuyết cơ bản và làm bài tập thực hành nhỏ.\n\n`;
    currentWeek = endWeek + 1;
  }
  
  if (currentWeek <= 12) {
    planMarkdown += `**Tuần ${currentWeek}-12: Tổng hợp & Xây dựng Portfolio**\n- Kết hợp các công nghệ đã học để làm dự án thực tế.\n- Đẩy code lên GitHub và viết README chi tiết.\n`;
  }

  return {
    text: `# 📅 Kế hoạch 90 ngày: Trở thành ${careerGoal}
    
Dựa trên những kỹ năng bạn còn thiếu, EduGuard AI đề xuất lộ trình tự học 12 tuần (90 ngày) cực kỳ thực chiến:

${planMarkdown}

🔥 **Tip**: Dành ít nhất 2 giờ mỗi ngày để code, duy trì chuỗi commit trên GitHub đều đặn!`,
    chartData: null,
    actions: [`Làm sao để đạt thực tập ${careerGoal}?`, 'Tình hình học tập hiện tại']
  };
}

function buildStudentTimelineResponse(decisionData) {
  const { student, timeline } = decisionData;
  if (!student) {
    return {
      text: `🤖 Xin lỗi, mình cần bạn cung cấp thông tin sinh viên trước để xem timeline học tập.`,
      chartData: null,
      actions: null
    };
  }
  const fText = timeline && timeline.forecastText ? timeline.forecastText : 'Chưa có dự báo cụ thể.';
  return {
    text: `🔮 **Dự báo Timeline Học tập (Academic Timeline) - Sinh viên: ${student.mssv}**
    
Dưới đây là các mốc thời gian cảnh báo và lưu ý quan trọng trong kỳ học của bạn:

${fText}

💡 **Lời khuyên**: Hãy chú ý các mốc thời gian trên để hoàn thành các mục tiêu học tập và tránh bị cảnh báo rủi ro học vụ.`,
    chartData: null,
    actions: ['Xem phân tích rủi ro', 'Mô phỏng điểm GPA']
  };
}

function buildExplainModelResponse() {
  return {
    text: `# 🧠 Mô hình Dự báo Học tập HK-Pearson V2.1

Hệ thống EduGuard sử dụng thuật toán **HK-Pearson V2.1** cải tiến để dự báo rủi ro học tập của sinh viên. Dưới đây là chi tiết nguyên lý hoạt động của mô hình:

### 1. Phân tích Tương quan Pearson
- **Nguyên lý**: Thuật toán đo lường mức độ tương quan tuyến tính giữa điểm số các môn cơ sở/tiền quyết (ví dụ: điểm toán, lập trình cơ bản) với các môn chuyên ngành tiếp theo.
- **Hệ số tương quan (r)**: Dao động từ \`-1\` đến \`1\`. Giá trị gần \`1\` thể hiện sự tương quan thuận mạnh mẽ (ví dụ: học tốt môn Database sẽ có xu hướng học tốt môn Java Web).

### 2. Bộ lọc Outlier IQR (Interquartile Range)
- **Mục đích**: Loại bỏ các điểm số dị biệt (outliers) làm sai lệch mô hình (ví dụ: sinh viên bỏ học đột ngột hoặc các trường hợp đặc biệt khác).
- **Cách hoạt động**: Xác định phân vị \`Q1\` (25%) và \`Q3\` (75%). Tính \`IQR = Q3 - Q1\`. Mọi điểm nằm ngoài khoảng \`[Q1 - 1.5 * IQR, Q3 + 1.5 * IQR]\` sẽ bị loại bỏ để đảm bảo dữ liệu huấn luyện sạch và chính xác.

### 3. Hiệu chuẩn Thống kê (Statistical Calibration)
- **Điều chỉnh**: Điểm số dự báo được hiệu chuẩn dựa trên trọng số chuyên cần (Attendance), điểm Lab/Thực hành, và xu hướng học tập gần đây.
- **Độ tin cậy**: Hệ thống liên tục cập nhật và hiệu chuẩn lại các tham số tương quan mỗi khi có dữ liệu điểm mới từ LMS để tăng độ chính xác dự báo thực tế.

💡 *Bạn có thể mô phỏng điểm số bằng tính năng 'What-If GPA Simulation' để xem dự báo rủi ro thay đổi thế nào dưới các kịch bản học tập khác nhau!*`,
    chartData: null,
    actions: ['Mô phỏng điểm GPA', 'Tình hình học tập của em?']
  };
}

function buildStudentResponse(decisionData) {
  if (!decisionData || !decisionData.type) {
    return buildFallbackResponse();
  }

  switch (decisionData.type) {
    case 'STUDENT_OVERVIEW':
    case 'STUDENT_RISK':
    case 'STUDENT_RECOMMENDATION':
      return buildStudentAnalysisResponse(decisionData);
    case 'STUDENT_TIMELINE':
      return buildStudentTimelineResponse(decisionData);
    case 'EXPLAIN_MODEL':
      return buildExplainModelResponse();
    case 'STUDENT_GPA_SIMULATION':
      return buildGpaSimulationResponse(decisionData);
    case 'STUDENT_RISK_CHAIN':
      return buildRiskChainResponse(decisionData);
    case 'STUDENT_SYLLABUS_INFO':
    case 'STUDENT_SYLLABUS_PREREQ':
      return { text: decisionData.text, chartData: null, actions: null };
    case 'STUDENT_INTERVENTION_REASON':
    case 'STUDENT_ROADMAP':
      return { text: decisionData.text, chartData: null, actions: null };
    case 'STUDENT_CAREER_PATH':
      return buildStudentCareerPath(decisionData);
    case 'STUDENT_BEST_CAREER':
      return buildBestCareersSuggestion(decisionData.bestCareers);
    case 'STUDENT_CAREER_REASON':
      return buildCareerReasonResponse(decisionData);
    case 'STUDENT_INTERNSHIP_PLAN':
      return buildInternshipPlanResponse(decisionData);
    case 'STUDENT_90_DAY_PLAN':
      return build90DayPlanResponse(decisionData);
    case 'STUDENT_GREETING':
      return buildFallbackResponse();
    case 'NEED_LOGIN':
      return {
        text: 'Vui lòng cung cấp Mã số sinh viên (MSSV) của bạn để tra cứu thông tin cá nhân.',
        chartData: null,
        actions: null
      };
    case 'STUDENT_NOT_FOUND':
      return {
        text: `Xin lỗi, không tìm thấy dữ liệu cho sinh viên ${decisionData.mssv}. Vui lòng kiểm tra lại.`,
        chartData: null,
        actions: null
      };
    case 'STUDENT_FALLBACK':
    default:
      return buildFallbackResponse();
  }
}

module.exports = {
  buildStudentResponse,
  buildSyllabusResponse,
  buildStudentAnalysisResponse,
  buildGpaSimulationResponse,
  buildRiskChainResponse,
  buildStudentCareerPath,
  buildBestCareersSuggestion,
  buildFallbackResponse,
  buildCareerReasonResponse,
  buildInternshipPlanResponse,
  build90DayPlanResponse
};
